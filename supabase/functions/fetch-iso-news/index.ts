// ISOGuardian — Automated ISO News Fetching & AI Processing
// Fetches RSS feeds from registered sources, deduplicates, and uses Claude Haiku
// to summarise, categorise, and score relevance for South African businesses.
//
// Triggers:
//   - pg_cron daily at 08:00 SAST (06:00 UTC)
//   - Manual POST from super_admin dashboard ("Fetch Now" button)
//
// Auth: CRON_SECRET header OR service role Bearer OR super_admin JWT

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { parseRSS, generateSlug, truncateText, stripHTML } from "../_shared/news.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const CRON_SECRET = Deno.env.get("CRON_SECRET") || "";

const MAX_ARTICLES_PER_RUN = 50;
const HAIKU_MODEL = "claude-haiku-4-5-20251001";

const CLAUDE_SYSTEM_PROMPT = `You are an ISO standards news analyst for ISOGuardian, a South African compliance management platform.

Given an article title and content, provide a JSON response with:
1. "summary": A concise 150-200 word summary of the key points, written in South African English. Focus on what matters to compliance practitioners.
2. "ai_insight": A 1-2 sentence actionable takeaway specifically for South African businesses managing ISO compliance.
3. "standards": An array of which ISO standards this relates to. Use exactly these values: "ISO 9001", "ISO 14001", "ISO 45001", "ISO 27001", "General". Include all that apply.
4. "categories": Categorise as one or more of: "revision", "guidance", "case-study", "regulatory", "training", "audit", "certification", "industry-news"
5. "relevance_score": Score 0-100 indicating how relevant this is to ISO compliance practitioners (100 = directly about ISO standard changes, 0 = unrelated)

Respond with valid JSON only. No markdown, no explanation.`;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface ProcessedArticle {
  summary: string;
  ai_insight: string;
  standards: string[];
  categories: string[];
  relevance_score: number;
}

Deno.serve(async (req: Request) => {
  const cors = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  // ── Auth check ──
  const authHeader = req.headers.get("Authorization") || "";
  const cronHeader = req.headers.get("x-cron-secret") || "";

  let isAuthorized = false;

  // 1. CRON_SECRET header (pg_cron)
  if (CRON_SECRET && cronHeader === CRON_SECRET) {
    isAuthorized = true;
  }
  // 2. Service role Bearer (pg_cron alternative)
  if (authHeader === `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` || authHeader === `Bearer ${CRON_SECRET}`) {
    isAuthorized = true;
  }
  // 3. Super admin JWT (manual trigger from dashboard)
  if (!isAuthorized && authHeader.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "");
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY") || "", {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user } } = await userClient.auth.getUser(token);
    if (user) {
      const { data: profile } = await supabaseAdmin
        .from("users")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      if (profile?.role === "super_admin") {
        isAuthorized = true;
      }
    }
  }

  if (!isAuthorized) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  // ── Parse request body ──
  let autoPublish = true;
  try {
    const body = await req.json();
    if (typeof body.autoPublish === "boolean") autoPublish = body.autoPublish;
  } catch {
    // Default to autoPublish: true (for pg_cron)
  }

  const startTime = Date.now();
  const results = {
    sources_checked: 0,
    articles_found: 0,
    articles_new: 0,
    articles_skipped: 0,
    articles_failed: 0,
    errors: [] as string[],
  };

  try {
    // ── Fetch active sources ──
    const { data: sources, error: srcErr } = await supabaseAdmin
      .from("news_sources")
      .select("id, name, url, source_type, standards, last_fetched_at, fetch_interval_hours")
      .eq("is_active", true);

    if (srcErr || !sources || sources.length === 0) {
      return new Response(JSON.stringify({ error: "No active news sources", detail: srcErr?.message }), {
        status: 200,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    let totalNewArticles = 0;

    for (const source of sources) {
      // Skip if fetched too recently
      if (source.last_fetched_at) {
        const hoursSinceLastFetch = (Date.now() - new Date(source.last_fetched_at).getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastFetch < (source.fetch_interval_hours || 24)) {
          continue;
        }
      }

      results.sources_checked++;
      const sourceStart = Date.now();
      let articlesFound = 0;
      let articlesNew = 0;
      let articlesSkipped = 0;
      let sourceError: string | null = null;

      try {
        // ── Fetch RSS/HTML ──
        let rawArticles: { title: string; link: string; description: string; pubDate: string | null }[] = [];

        if (source.source_type === "rss") {
          const feedRes = await fetch(source.url, {
            headers: { "User-Agent": "ISOGuardian News Bot/1.0 (+https://isoguardian.co.za)" },
          });
          if (!feedRes.ok) {
            throw new Error(`Feed returned ${feedRes.status}`);
          }
          const xml = await feedRes.text();
          rawArticles = parseRSS(xml);
        } else if (source.source_type === "html_scrape") {
          // Basic HTML scraping — extract links and titles from page
          const pageRes = await fetch(source.url, {
            headers: { "User-Agent": "ISOGuardian News Bot/1.0 (+https://isoguardian.co.za)" },
          });
          if (!pageRes.ok) {
            throw new Error(`Page returned ${pageRes.status}`);
          }
          const html = await pageRes.text();
          // Extract article-like links (heuristic: links with /news/ or /article/ in path)
          const linkRegex = /<a[^>]+href="(https?:\/\/[^"]*(?:\/news\/|\/article\/|\/stories\/)[^"]*)"[^>]*>([^<]+)<\/a>/gi;
          let linkMatch: RegExpExecArray | null;
          const seen = new Set<string>();
          while ((linkMatch = linkRegex.exec(html)) !== null && rawArticles.length < 20) {
            const url = linkMatch[1];
            const title = stripHTML(linkMatch[2]).trim();
            if (title.length > 10 && !seen.has(url)) {
              seen.add(url);
              rawArticles.push({ title, link: url, description: "", pubDate: null });
            }
          }
        }

        articlesFound = rawArticles.length;
        results.articles_found += articlesFound;

        // ── Process each article ──
        for (const article of rawArticles) {
          if (totalNewArticles >= MAX_ARTICLES_PER_RUN) break;

          // Check if already exists
          const { data: existing } = await supabaseAdmin
            .from("iso_news_articles")
            .select("id")
            .eq("source_url", article.link)
            .maybeSingle();

          if (existing) {
            articlesSkipped++;
            results.articles_skipped++;
            continue;
          }

          // ── Call Claude Haiku for AI processing ──
          try {
            const articleContent = `Title: ${article.title}\n\nContent: ${truncateText(article.description, 2000)}`;

            const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
              method: "POST",
              headers: {
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: HAIKU_MODEL,
                max_tokens: 500,
                system: CLAUDE_SYSTEM_PROMPT,
                messages: [{ role: "user", content: articleContent }],
              }),
            });

            if (!claudeRes.ok) {
              const errText = await claudeRes.text();
              throw new Error(`Claude API ${claudeRes.status}: ${errText.slice(0, 200)}`);
            }

            const claudeData = await claudeRes.json();
            const rawText = claudeData.content?.[0]?.text || "";
            const tokensUsed = (claudeData.usage?.input_tokens || 0) + (claudeData.usage?.output_tokens || 0);

            // Parse Claude's JSON response
            let processed: ProcessedArticle;
            try {
              processed = JSON.parse(rawText);
            } catch {
              // Try extracting JSON from markdown code block
              const jsonMatch = rawText.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                processed = JSON.parse(jsonMatch[0]);
              } else {
                throw new Error("Could not parse Claude response as JSON");
              }
            }

            // Determine publish status
            const status = autoPublish && (processed.relevance_score >= 60) ? "published" : "draft";
            const slug = generateSlug(article.title);

            // Insert article
            const { error: insertErr } = await supabaseAdmin
              .from("iso_news_articles")
              .insert({
                source_id: source.id,
                source_name: source.name,
                source_url: article.link,
                title: article.title,
                summary: processed.summary || "No summary available.",
                ai_insight: processed.ai_insight || null,
                standards: processed.standards || source.standards || [],
                categories: processed.categories || [],
                published_at: article.pubDate ? new Date(article.pubDate).toISOString() : new Date().toISOString(),
                status,
                slug,
                relevance_score: Math.max(0, Math.min(100, processed.relevance_score || 50)),
                tokens_used: tokensUsed,
              });

            if (insertErr) {
              // Handle slug conflict by appending random suffix
              if (insertErr.message?.includes("idx_news_articles_source_url") || insertErr.message?.includes("duplicate")) {
                articlesSkipped++;
                results.articles_skipped++;
              } else {
                throw insertErr;
              }
            } else {
              articlesNew++;
              totalNewArticles++;
              results.articles_new++;
            }
          } catch (aiErr) {
            results.articles_failed++;
            results.errors.push(`AI processing failed for "${article.title}": ${String(aiErr).slice(0, 100)}`);
          }
        }

        // Update last_fetched_at
        await supabaseAdmin
          .from("news_sources")
          .update({ last_fetched_at: new Date().toISOString() })
          .eq("id", source.id);

      } catch (fetchErr) {
        sourceError = String(fetchErr).slice(0, 200);
        results.errors.push(`Source "${source.name}": ${sourceError}`);
      }

      // Log this source's fetch
      await supabaseAdmin.from("news_fetch_logs").insert({
        source_id: source.id,
        source_name: source.name,
        status: sourceError ? "error" : articlesNew > 0 ? "success" : "partial",
        articles_found: articlesFound,
        articles_new: articlesNew,
        articles_skipped: articlesSkipped,
        error_message: sourceError,
        duration_ms: Date.now() - sourceStart,
      });
    }

    return new Response(JSON.stringify({
      success: true,
      duration_ms: Date.now() - startTime,
      ...results,
    }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: "Internal error",
      detail: String(error).slice(0, 300),
      duration_ms: Date.now() - startTime,
      ...results,
    }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});

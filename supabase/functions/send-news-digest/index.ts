// ISOGuardian — Weekly ISO News Digest Email
// Sends a branded email to news_subscribers with articles published in the last 7 days.
//
// Schedule: Fridays 08:00 SAST via pg_cron
// Auth: CRON_SECRET header or service role Bearer

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const CRON_SECRET = Deno.env.get("CRON_SECRET") || "";
const FROM_EMAIL = "ISOGuardian <notifications@isoguardian.co.za>";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function buildDigestEmail(
  articles: { title: string; summary: string; ai_insight: string; source_url: string; standards: string[] }[],
  subscriberName: string | null,
  unsubscribeToken: string,
): string {
  const greeting = subscriberName ? `Hi ${subscriberName}` : "Hi there";
  const articleCards = articles
    .map(
      (a) => `
      <tr>
        <td style="padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.05);">
          <div style="margin-bottom:4px;">
            ${a.standards.map((s) => `<span style="display:inline-block;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:600;background:rgba(6,182,212,0.15);color:#22d3ee;margin-right:4px;">${s}</span>`).join("")}
          </div>
          <a href="${a.source_url}" style="color:#ffffff;font-weight:600;font-size:14px;text-decoration:none;">${a.title}</a>
          <p style="color:rgba(255,255,255,0.5);font-size:12px;line-height:1.5;margin:6px 0;">${a.summary.slice(0, 200)}...</p>
          ${a.ai_insight ? `<p style="color:#22d3ee;font-size:11px;margin:4px 0 0;"><strong>Insight:</strong> ${a.ai_insight}</p>` : ""}
        </td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background-color:#1e293b;border-radius:12px;overflow:hidden;margin-top:20px;">
    <!-- Header -->
    <tr>
      <td style="background:linear-gradient(135deg,#06b6d4,#8b5cf6);padding:24px 20px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">ISO Standards Weekly Digest</h1>
        <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:12px;">Your compliance news roundup from ISOGuardian</p>
      </td>
    </tr>
    <!-- Greeting -->
    <tr>
      <td style="padding:20px 20px 8px;">
        <p style="color:rgba(255,255,255,0.7);font-size:14px;margin:0;">${greeting}, here are this week's top ISO compliance updates:</p>
      </td>
    </tr>
    <!-- Articles -->
    ${articleCards}
    <!-- CTA -->
    <tr>
      <td style="padding:24px 20px;text-align:center;">
        <a href="https://isoguardian.co.za/standards" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#06b6d4,#8b5cf6);color:#ffffff;font-weight:700;border-radius:12px;text-decoration:none;font-size:14px;">View All News</a>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="padding:16px 20px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
        <p style="color:rgba(255,255,255,0.3);font-size:10px;margin:0;">
          ISOGuardian (Pty) Ltd | support@isoguardian.co.za<br/>
          <a href="https://isoguardian.co.za/functions/v1/unsubscribe?token=${unsubscribeToken}&type=news" style="color:rgba(255,255,255,0.3);text-decoration:underline;">Unsubscribe</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*" } });
  }

  // Auth check
  const authHeader = req.headers.get("Authorization") || "";
  const cronHeader = req.headers.get("x-cron-secret") || "";
  const isAuthorized =
    (CRON_SECRET && cronHeader === CRON_SECRET) ||
    authHeader === `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` ||
    authHeader === `Bearer ${CRON_SECRET}`;

  if (!isAuthorized) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const results = { subscribers: 0, sent: 0, failed: 0, no_articles: false };

  try {
    // Get articles from last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: articles } = await supabase
      .from("iso_news_articles")
      .select("title, summary, ai_insight, source_url, standards")
      .eq("status", "published")
      .gte("published_at", sevenDaysAgo)
      .order("relevance_score", { ascending: false })
      .limit(10);

    if (!articles || articles.length === 0) {
      results.no_articles = true;
      return new Response(JSON.stringify(results), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get active subscribers
    const { data: subscribers } = await supabase
      .from("news_subscribers")
      .select("id, email, name, standards, unsubscribe_token")
      .eq("is_active", true);

    if (!subscribers || subscribers.length === 0) {
      return new Response(JSON.stringify(results), {
        headers: { "Content-Type": "application/json" },
      });
    }

    results.subscribers = subscribers.length;

    // Dedup check via notification_log (168h = 1 week)
    const weekAgo = new Date(Date.now() - 168 * 60 * 60 * 1000).toISOString();

    for (const sub of subscribers) {
      // Check if already sent this week
      const { data: existing } = await supabase
        .from("notification_log")
        .select("id")
        .eq("recipient_email", sub.email)
        .eq("notification_type", "news_digest")
        .gte("sent_at", weekAgo)
        .maybeSingle();

      if (existing) continue;

      // Filter articles by subscriber's standard preferences
      const relevantArticles = articles.filter(
        (a) => a.standards?.some((s: string) => sub.standards.includes(s))
      );

      if (relevantArticles.length === 0) continue;

      const subject = `ISO Compliance Weekly Digest — ${new Date().toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}`;
      const html = buildDigestEmail(relevantArticles, sub.name, sub.unsubscribe_token);

      const sent = await sendEmail(sub.email, subject, html);

      if (sent) {
        results.sent++;
        // Log for dedup
        await supabase.from("notification_log").insert({
          recipient_email: sub.email,
          notification_type: "news_digest",
          subject,
          sent_at: new Date().toISOString(),
        });
      } else {
        results.failed++;
      }
    }

    return new Response(JSON.stringify(results), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error).slice(0, 300), ...results }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

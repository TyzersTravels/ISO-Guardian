// ISOGuardian AI Copilot Edge Function
// Proxies requests to Claude API with fair usage enforcement
//
// Setup:
// 1. Get Anthropic API key from console.anthropic.com
// 2. Store as secret: supabase secrets set ANTHROPIC_API_KEY=sk-ant-xxxxx
// 3. Deploy: supabase functions deploy ai-copilot
//
// Fair Usage Tiers:
// - Starter: 50 queries/month
// - Growth: 200 queries/month
// - Enterprise: 1000 queries/month
// - super_admin: unlimited

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Daily spending cap (in USD) — hard circuit breaker
const DAILY_SPENDING_CAP_USD = 10;

// Per-tier monthly query limits
const TIER_LIMITS: Record<string, number> = {
  starter: 50,
  growth: 200,
  enterprise: 1000,
  trial: 20,
};

// Max tokens per request to prevent runaway costs
const MAX_OUTPUT_TOKENS = 1500;

// ISO compliance system prompt — the core of the copilot
const SYSTEM_PROMPT = `You are ISOGuardian AI Copilot, an expert ISO compliance assistant for South African businesses.

CAPABILITIES:
- Answer questions about ISO 9001:2015, ISO 14001:2015, ISO 45001:2018 requirements
- Explain specific clauses and what evidence/documentation is needed
- Analyse compliance gaps based on user-provided information
- Suggest corrective actions for non-conformances
- Help draft document templates, procedures, and policies
- Provide guidance on audit preparation
- Explain South African regulatory requirements (POPIA, OHS Act, NEMA) as they relate to ISO

RULES:
- NEVER claim that using ISOGuardian guarantees ISO certification
- NEVER provide legal advice — recommend consulting a legal professional for legal matters
- NEVER fabricate clause numbers or requirements — if unsure, say so
- Always reference specific clause numbers when discussing ISO requirements
- Keep responses concise and actionable
- When analysing documents or gaps, be specific about what's missing and what needs to be done
- Use South African English spelling (e.g., organisation, analyse, colour)
- Respond in a professional but approachable tone
- If asked about pricing, features, or account issues, direct the user to support@isoguardian.co.za

CONTEXT: The user is on the ISOGuardian platform managing their ISO compliance. They have access to documents, NCRs (non-conformance reports), audits, management reviews, and compliance scoring.`;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ─── CORS Headers ────────────────────────────────────────────────────────────
// Imported from _shared/cors.ts (restricted to isoguardian.co.za)

// ─── Fair Usage Check ────────────────────────────────────────────────────────

interface UsageCheckResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  reason?: string;
}

async function checkUsage(userId: string, companyId: string, userRole: string): Promise<UsageCheckResult> {
  // Super admins bypass limits
  if (userRole === "super_admin") {
    return { allowed: true, remaining: 999, limit: 999 };
  }

  // Get company subscription tier
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("tier")
    .eq("company_id", companyId)
    .eq("status", "active")
    .single();

  const tier = sub?.tier?.toLowerCase() || "trial";
  const limit = TIER_LIMITS[tier] || TIER_LIMITS.trial;

  // Count queries this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from("ai_usage")
    .select("*", { count: "exact", head: true })
    .eq("company_id", companyId)
    .gte("created_at", startOfMonth.toISOString());

  const used = count || 0;
  const remaining = Math.max(0, limit - used);

  if (used >= limit) {
    return {
      allowed: false,
      remaining: 0,
      limit,
      reason: `Monthly AI query limit reached (${limit} queries on ${tier} plan). Upgrade your plan for more queries.`,
    };
  }

  // Check daily spending cap across all companies
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data: dailyUsage } = await supabase
    .from("ai_usage")
    .select("tokens_used")
    .gte("created_at", startOfDay.toISOString());

  const totalDailyTokens = (dailyUsage || []).reduce((sum: number, row: any) => sum + (row.tokens_used || 0), 0);
  // Rough cost estimate: $0.003 per 1K input tokens (Haiku)
  const estimatedDailyCost = (totalDailyTokens / 1000) * 0.003;

  if (estimatedDailyCost >= DAILY_SPENDING_CAP_USD) {
    return {
      allowed: false,
      remaining,
      limit,
      reason: "Platform AI daily capacity reached. Please try again tomorrow.",
    };
  }

  return { allowed: true, remaining, limit };
}

// ─── Log Usage ───────────────────────────────────────────────────────────────

async function logUsage(
  userId: string,
  companyId: string,
  queryType: string,
  tokensUsed: number,
  model: string
) {
  await supabase.from("ai_usage").insert({
    user_id: userId,
    company_id: companyId,
    query_type: queryType,
    tokens_used: tokensUsed,
    model,
    created_at: new Date().toISOString(),
  });
}

// ─── Call Claude API ─────────────────────────────────────────────────────────

async function callClaude(
  messages: Array<{ role: string; content: string }>,
  companyContext?: string
): Promise<{ content: string; tokensUsed: number; model: string }> {
  const systemWithContext = companyContext
    ? `${SYSTEM_PROMPT}\n\nCOMPANY CONTEXT:\n${companyContext}`
    : SYSTEM_PROMPT;

  // Use Haiku for simple queries, Sonnet for complex analysis
  const isComplexQuery = messages.some(
    (m) =>
      m.content.length > 500 ||
      m.content.toLowerCase().includes("analyse") ||
      m.content.toLowerCase().includes("analyze") ||
      m.content.toLowerCase().includes("gap analysis") ||
      m.content.toLowerCase().includes("review this document") ||
      m.content.toLowerCase().includes("audit readiness")
  );

  const model = isComplexQuery ? "claude-sonnet-4-6" : "claude-haiku-4-5-20251001";

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: MAX_OUTPUT_TOKENS,
      system: systemWithContext,
      messages,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("Claude API error:", err);
    throw new Error("AI service temporarily unavailable. Please try again.");
  }

  const data = await response.json();
  const content = data.content?.[0]?.text || "I couldn't generate a response. Please try again.";
  const tokensUsed = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);

  return { content, tokensUsed, model };
}

// ─── Get Company Context ─────────────────────────────────────────────────────

async function getCompanyContext(companyId: string): Promise<string> {
  // Fetch relevant company data for context
  const [companyRes, ncrRes, auditRes, complianceRes] = await Promise.all([
    supabase
      .from("companies")
      .select("name, industry, company_code")
      .eq("id", companyId)
      .single(),
    supabase
      .from("ncrs")
      .select("id, status, severity")
      .eq("company_id", companyId)
      .eq("archived", false),
    supabase
      .from("audits")
      .select("id, status, audit_type, scheduled_date")
      .eq("company_id", companyId)
      .eq("archived", false)
      .order("scheduled_date", { ascending: true })
      .limit(5),
    supabase
      .from("compliance_requirements")
      .select("standard, clause, status, score")
      .eq("company_id", companyId),
  ]);

  const company = companyRes.data;
  const ncrs = ncrRes.data || [];
  const audits = auditRes.data || [];
  const compliance = complianceRes.data || [];

  const openNcrs = ncrs.filter((n: any) => n.status === "Open");
  const criticalNcrs = openNcrs.filter((n: any) => n.severity === "Critical");
  const upcomingAudits = audits.filter((a: any) => a.status === "Planned");

  // Calculate average compliance score per standard
  const standardScores: Record<string, number[]> = {};
  for (const c of compliance) {
    if (c.score != null) {
      if (!standardScores[c.standard]) standardScores[c.standard] = [];
      standardScores[c.standard].push(c.score);
    }
  }

  const scoresSummary = Object.entries(standardScores)
    .map(([std, scores]) => {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      return `${std}: ${avg.toFixed(0)}% average compliance`;
    })
    .join(", ");

  return [
    `Company: ${company?.name || "Unknown"} (${company?.industry || "Unknown industry"})`,
    `Open NCRs: ${openNcrs.length} (${criticalNcrs.length} critical)`,
    `Upcoming audits: ${upcomingAudits.length}`,
    scoresSummary ? `Compliance scores: ${scoresSummary}` : "No compliance scores recorded yet",
  ].join("\n");
}

// ─── Main Handler ────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Authenticate user via JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("users")
      .select("company_id, role, full_name")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) {
      return new Response(JSON.stringify({ error: "User not associated with a company" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const body = await req.json();
    const { messages, queryType = "chat" } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate message content (prevent injection of huge payloads)
    const totalLength = messages.reduce((sum: number, m: any) => sum + (m.content?.length || 0), 0);
    if (totalLength > 15000) {
      return new Response(JSON.stringify({ error: "Message content too long. Maximum 15,000 characters." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check fair usage limits
    const usage = await checkUsage(user.id, profile.company_id, profile.role);
    if (!usage.allowed) {
      return new Response(
        JSON.stringify({
          error: usage.reason,
          remaining: usage.remaining,
          limit: usage.limit,
        }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get company context for more relevant answers
    const companyContext = await getCompanyContext(profile.company_id);

    // Call Claude API
    const result = await callClaude(messages, companyContext);

    // Log usage
    await logUsage(user.id, profile.company_id, queryType, result.tokensUsed, result.model);

    return new Response(
      JSON.stringify({
        content: result.content,
        model: result.model,
        remaining: usage.remaining - 1,
        limit: usage.limit,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("AI Copilot error:", err);
    return new Response(
      JSON.stringify({ error: "AI service temporarily unavailable. Please try again." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

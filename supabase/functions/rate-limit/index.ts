// ISOGuardian Server-Side Rate Limiter Edge Function
// Tracks login attempts per IP/email in the database to prevent brute force attacks.
//
// Endpoints:
// POST /check   — Check if login attempt is allowed (call BEFORE auth)
// POST /record  — Record a failed login attempt
// POST /clear   — Clear attempts after successful login
//
// Deploy: supabase functions deploy rate-limit

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 900; // 15 minutes
const WINDOW_SECONDS = 3600; // 1 hour window for counting attempts

let _cors: Record<string, string> = {};
function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ..._cors, "Content-Type": "application/json" },
  });
}

function getClientIp(req: Request): string {
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

async function checkRateLimit(email: string, ip: string) {
  const windowStart = new Date(Date.now() - WINDOW_SECONDS * 1000).toISOString();

  // Count recent failed attempts by email OR IP
  const { count: emailAttempts } = await supabase
    .from("failed_login_attempts")
    .select("*", { count: "exact", head: true })
    .eq("email", email.toLowerCase())
    .gte("attempted_at", windowStart);

  const { count: ipAttempts } = await supabase
    .from("failed_login_attempts")
    .select("*", { count: "exact", head: true })
    .eq("ip_address", ip)
    .gte("attempted_at", windowStart);

  const attempts = Math.max(emailAttempts || 0, ipAttempts || 0);

  if (attempts >= MAX_ATTEMPTS) {
    // Check if lockout has expired
    const { data: latest } = await supabase
      .from("failed_login_attempts")
      .select("attempted_at")
      .or(`email.eq.${email.toLowerCase()},ip_address.eq.${ip}`)
      .order("attempted_at", { ascending: false })
      .limit(1)
      .single();

    if (latest) {
      const lockoutExpiry = new Date(latest.attempted_at).getTime() + LOCKOUT_SECONDS * 1000;
      if (Date.now() < lockoutExpiry) {
        const remainingMs = lockoutExpiry - Date.now();
        return {
          allowed: false,
          attempts,
          remainingMs,
          message: `Too many failed attempts. Try again in ${Math.ceil(remainingMs / 60000)} minutes.`,
        };
      }
    }
  }

  return {
    allowed: true,
    attempts,
    remainingAttempts: MAX_ATTEMPTS - attempts,
  };
}

async function recordFailedAttempt(email: string, ip: string) {
  await supabase.from("failed_login_attempts").insert({
    email: email.toLowerCase(),
    ip_address: ip,
    attempted_at: new Date().toISOString(),
  });
}

async function clearAttempts(email: string) {
  await supabase
    .from("failed_login_attempts")
    .delete()
    .eq("email", email.toLowerCase());
}

Deno.serve(async (req: Request) => {
  _cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: _cors });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.split("/").pop();
    const ip = getClientIp(req);

    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const body = await req.json();
    const email = body.email;

    if (!email) {
      return jsonResponse({ error: "Email is required" }, 400);
    }

    switch (path) {
      case "check": {
        const result = await checkRateLimit(email, ip);
        return jsonResponse(result, result.allowed ? 200 : 429);
      }

      case "record": {
        await recordFailedAttempt(email, ip);
        const result = await checkRateLimit(email, ip);
        return jsonResponse(result, result.allowed ? 200 : 429);
      }

      case "clear": {
        await clearAttempts(email);
        return jsonResponse({ success: true });
      }

      default:
        return jsonResponse({ error: "Unknown endpoint" }, 404);
    }
  } catch (err) {
    console.error("Rate limit error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});

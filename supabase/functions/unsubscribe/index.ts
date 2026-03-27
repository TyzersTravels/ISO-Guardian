// ISOGuardian Drip Campaign Unsubscribe Handler
// GET /unsubscribe?token=xxx — validates token, marks as unsubscribed
// Returns branded HTML confirmation page (POPIA requirement)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { publicCorsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function confirmationPage(success: boolean, message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unsubscribe — ISOGuardian</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #cbd5e1;
    }
    .card {
      max-width: 480px;
      width: 90%;
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 48px 32px;
      text-align: center;
      backdrop-filter: blur(20px);
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      background: linear-gradient(to right, #06b6d4, #a855f7);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 24px;
    }
    .icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    h2 {
      color: #fff;
      font-size: 20px;
      margin-bottom: 12px;
    }
    p {
      color: #94a3b8;
      font-size: 14px;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    a {
      display: inline-block;
      padding: 10px 24px;
      background: linear-gradient(to right, #06b6d4, #a855f7);
      color: #fff;
      text-decoration: none;
      border-radius: 10px;
      font-weight: 600;
      font-size: 14px;
    }
    .footer {
      margin-top: 32px;
      font-size: 11px;
      color: #475569;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">ISOGuardian</div>
    <div class="icon">${success ? "&#x2705;" : "&#x26A0;&#xFE0F;"}</div>
    <h2>${success ? "You've been unsubscribed" : "Something went wrong"}</h2>
    <p>${message}</p>
    <a href="https://isoguardian.co.za">Visit ISOGuardian</a>
    <div class="footer">
      ISOGuardian (Pty) Ltd | Reg: 2026/082362/07<br>
      This action complies with POPIA (Protection of Personal Information Act)
    </div>
  </div>
</body>
</html>`;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: publicCorsHeaders });
  }

  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) {
    const html = confirmationPage(false, "Invalid unsubscribe link. No token provided.");
    return new Response(html, {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8", ...publicCorsHeaders },
    });
  }

  try {
    // Find the unsubscribe record by token
    const { data: record, error } = await supabase
      .from("drip_unsubscribes")
      .select("id, email, is_unsubscribed")
      .eq("token", token)
      .maybeSingle();

    if (error || !record) {
      const html = confirmationPage(false, "This unsubscribe link is invalid or has expired. If you continue to receive emails, please contact support@isoguardian.co.za.");
      return new Response(html, {
        status: 404,
        headers: { "Content-Type": "text/html; charset=utf-8", ...publicCorsHeaders },
      });
    }

    if (record.is_unsubscribed) {
      const html = confirmationPage(true, "You were already unsubscribed. You will not receive any further marketing emails from ISOGuardian.");
      return new Response(html, {
        headers: { "Content-Type": "text/html; charset=utf-8", ...publicCorsHeaders },
      });
    }

    // Mark as unsubscribed
    await supabase
      .from("drip_unsubscribes")
      .update({
        is_unsubscribed: true,
        unsubscribed_at: new Date().toISOString(),
      })
      .eq("id", record.id);

    // Cancel all pending queue entries for this email
    await supabase
      .from("drip_queue")
      .update({
        status: "unsubscribed",
        updated_at: new Date().toISOString(),
      })
      .eq("recipient_email", record.email)
      .eq("status", "pending");

    const html = confirmationPage(
      true,
      "You have been successfully unsubscribed from ISOGuardian marketing emails. You will no longer receive drip campaign emails. Transactional emails (password resets, audit reminders) are not affected."
    );
    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8", ...publicCorsHeaders },
    });
  } catch (err) {
    const html = confirmationPage(false, "An unexpected error occurred. Please try again or contact support@isoguardian.co.za.");
    return new Response(html, {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8", ...publicCorsHeaders },
    });
  }
});

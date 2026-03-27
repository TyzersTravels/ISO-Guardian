// ISOGuardian Drip Campaign Processor
// Runs daily at 07:00 SAST via pg_cron (same schedule as send-notifications)
// Processes pending drip_queue entries and sends via Resend API

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CRON_SECRET = Deno.env.get("CRON_SECRET") || "";
const FROM_EMAIL = "Tyreece from ISOGuardian <tyreece@isoguardian.co.za>";
const APP_URL = "https://isoguardian.co.za";
const UNSUBSCRIBE_URL = `${SUPABASE_URL}/functions/v1/unsubscribe`;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ─── Email Template (personal style — from Tyreece, not "notifications") ────

function dripEmailTemplate(subject: string, body: string, unsubscribeToken: string): string {
  // Convert markdown-style formatting to HTML
  const htmlBody = body
    .replace(/\n\n/g, '</p><p style="margin:0 0 16px 0;">')
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#fff;">$1</strong>')
    .replace(/\| (.+?) \| (.+?) \|/g, '<tr><td style="padding:6px 12px;border:1px solid rgba(255,255,255,0.1);color:#94a3b8;">$1</td><td style="padding:6px 12px;border:1px solid rgba(255,255,255,0.1);color:#fff;">$2</td></tr>')

  const unsubLink = `${UNSUBSCRIBE_URL}?token=${unsubscribeToken}`

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#1e293b;border-radius:16px;overflow:hidden;margin-top:32px;margin-bottom:32px;">
    <!-- Header -->
    <tr>
      <td style="padding:24px 32px;background:linear-gradient(135deg,#0f172a,#581c87);text-align:center;">
        <h1 style="margin:0;font-size:22px;color:#fff;">
          <span style="background:linear-gradient(to right,#06b6d4,#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">ISOGuardian</span>
        </h1>
      </td>
    </tr>
    <!-- Body -->
    <tr>
      <td style="padding:32px;color:#cbd5e1;font-size:14px;line-height:1.7;">
        <p style="margin:0 0 16px 0;">${htmlBody}</p>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.1);text-align:center;">
        <p style="margin:0 0 8px 0;font-size:11px;color:#64748b;">
          ISOGuardian (Pty) Ltd | Reg: 2026/082362/07
        </p>
        <p style="margin:0;font-size:11px;">
          <a href="${unsubLink}" style="color:#64748b;text-decoration:underline;">Unsubscribe from these emails</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Send Email via Resend ──────────────────────────────────────────────────

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

// ─── Replace Personalization Placeholders ───────────────────────────────────

function replacePlaceholders(
  text: string,
  personalization: Record<string, string | number | boolean>,
  recipientName: string
): string {
  let result = text
    .replace(/\{\{name\}\}/g, recipientName || "there")
    .replace(/\{name\}/g, recipientName || "there")

  for (const [key, value] of Object.entries(personalization)) {
    if (key === 'unsubscribe_token') continue
    const regex = new RegExp(`\\{\\{${key}\\}\\}|\\{${key}\\}`, 'g')
    result = result.replace(regex, String(value))
  }

  return result
}

// ─── Process Queue ──────────────────────────────────────────────────────────

async function processQueue(): Promise<{ sent: number; failed: number; skipped: number }> {
  const now = new Date().toISOString();
  let sent = 0, failed = 0, skipped = 0;

  // Get pending queue entries that are due
  const { data: queueItems, error } = await supabase
    .from("drip_queue")
    .select(`
      id, recipient_email, recipient_name, step, personalization, campaign_id,
      drip_campaigns!inner(slug, emails, is_active)
    `)
    .eq("status", "pending")
    .lte("scheduled_at", now)
    .order("scheduled_at", { ascending: true })
    .limit(100); // Process max 100 per run to stay within function timeout

  if (error || !queueItems?.length) {
    return { sent: 0, failed: 0, skipped: 0 };
  }

  for (const item of queueItems) {
    const campaign = (item as any).drip_campaigns;

    // Skip if campaign is inactive
    if (!campaign?.is_active) {
      await supabase
        .from("drip_queue")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", item.id);
      skipped++;
      continue;
    }

    // Check unsubscribe status
    const { data: unsub } = await supabase
      .from("drip_unsubscribes")
      .select("is_unsubscribed")
      .eq("email", item.recipient_email)
      .maybeSingle();

    if (unsub?.is_unsubscribed) {
      await supabase
        .from("drip_queue")
        .update({ status: "unsubscribed", updated_at: new Date().toISOString() })
        .eq("id", item.id);
      skipped++;
      continue;
    }

    // Find the email step in the campaign
    const emails = campaign.emails as Array<{
      step: number;
      delay_days: number;
      subject: string;
      body: string;
    }>;

    const emailStep = emails.find((e) => e.step === item.step);
    if (!emailStep) {
      await supabase
        .from("drip_queue")
        .update({
          status: "failed",
          error_message: `Email step ${item.step} not found in campaign`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id);
      failed++;
      continue;
    }

    // Replace placeholders
    const personalization = (item.personalization || {}) as Record<string, string | number | boolean>;
    const subject = replacePlaceholders(emailStep.subject, personalization, item.recipient_name || "");
    const body = replacePlaceholders(emailStep.body, personalization, item.recipient_name || "");
    const unsubToken = String(personalization.unsubscribe_token || "");

    // Build and send email
    const html = dripEmailTemplate(subject, body, unsubToken);
    const success = await sendEmail(item.recipient_email, subject, html);

    if (success) {
      await supabase
        .from("drip_queue")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id);
      sent++;
    } else {
      await supabase
        .from("drip_queue")
        .update({
          status: "failed",
          error_message: "Resend API delivery failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id);
      failed++;
    }
  }

  return { sent, failed, skipped };
}

// ─── Main Handler ───────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method !== "POST" && req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Auth check: require CRON_SECRET or service role key
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

  try {
    const results = await processQueue();
    return new Response(
      JSON.stringify({ ...results, timestamp: new Date().toISOString() }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

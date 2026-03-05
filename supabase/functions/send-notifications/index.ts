// ISOGuardian Email Notification Edge Function
// Runs daily at 07:00 SAST via Supabase pg_cron or scheduled invocation
// Uses Resend API to send branded notification emails
//
// Setup:
// 1. Create Resend account at https://resend.com
// 2. Verify domain: isoguardian.co.za
// 3. Store API key as Supabase secret:
//    supabase secrets set RESEND_API_KEY=re_xxxxx
// 4. Deploy: supabase functions deploy send-notifications
// 5. Schedule via pg_cron or Supabase dashboard cron

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FROM_EMAIL = "ISOGuardian <notifications@isoguardian.co.za>";
const APP_URL = "https://isoguardian.co.za";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ─── Email Template ─────────────────────────────────────────────────────────

function emailTemplate(subject: string, body: string, ctaUrl?: string, ctaText?: string): string {
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
        <h2 style="color:#fff;font-size:18px;margin:0 0 16px 0;">${subject}</h2>
        ${body}
        ${ctaUrl ? `
        <div style="text-align:center;margin:24px 0;">
          <a href="${ctaUrl}" style="display:inline-block;padding:12px 32px;background:linear-gradient(to right,#06b6d4,#a855f7);color:#fff;text-decoration:none;border-radius:12px;font-weight:bold;font-size:14px;">${ctaText || "View in ISOGuardian"}</a>
        </div>` : ""}
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.1);text-align:center;">
        <p style="margin:0;font-size:11px;color:#64748b;">
          ISOGuardian (Pty) Ltd | support@isoguardian.co.za<br>
          Registered in South Africa | Reg: 2026/082362/07
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

// ─── Dedup Check ────────────────────────────────────────────────────────────

async function alreadySent(
  companyId: string,
  email: string,
  type: string,
  entityType: string,
  entityId: string,
  hoursWindow = 24
): Promise<boolean> {
  const since = new Date(Date.now() - hoursWindow * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("notification_log")
    .select("id")
    .eq("company_id", companyId)
    .eq("user_email", email)
    .eq("notification_type", type)
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .gte("sent_at", since)
    .limit(1);
  return (data?.length ?? 0) > 0;
}

async function logNotification(
  companyId: string,
  email: string,
  type: string,
  entityType: string,
  entityId: string
) {
  await supabase.from("notification_log").insert({
    company_id: companyId,
    user_email: email,
    notification_type: type,
    entity_type: entityType,
    entity_id: entityId,
  });
}

// ─── Get Company Admins ─────────────────────────────────────────────────────

async function getCompanyAdmins(companyId: string): Promise<string[]> {
  const { data } = await supabase
    .from("users")
    .select("email")
    .eq("company_id", companyId)
    .in("role", ["admin", "super_admin"]);
  return data?.map((u: { email: string }) => u.email) ?? [];
}

// ─── 1. Upcoming Audit Reminders ────────────────────────────────────────────

async function sendAuditReminders(): Promise<number> {
  let sent = 0;
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const in1Day = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const { data: audits } = await supabase
    .from("audits")
    .select("id, audit_number, audit_date, audit_type, scope, company_id, lead_auditor")
    .in("status", ["Planned", "In Progress", "Scheduled"])
    .lte("audit_date", in7Days)
    .gte("audit_date", now.toISOString().split("T")[0]);

  if (!audits?.length) return 0;

  for (const audit of audits) {
    const admins = await getCompanyAdmins(audit.company_id);
    const auditDate = new Date(audit.audit_date);
    const daysUntil = Math.ceil((auditDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const urgency = daysUntil <= 1 ? "TOMORROW" : `in ${daysUntil} days`;

    for (const email of admins) {
      if (await alreadySent(audit.company_id, email, "audit_reminder", "audit", audit.id)) continue;

      const subject = `Upcoming Audit: ${audit.audit_number} ${urgency}`;
      const body = `
        <p>You have an audit scheduled <strong>${urgency}</strong>:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:8px 0;color:#94a3b8;">Audit Number</td><td style="padding:8px 0;color:#fff;font-weight:bold;">${audit.audit_number}</td></tr>
          <tr><td style="padding:8px 0;color:#94a3b8;">Date</td><td style="padding:8px 0;color:#fff;">${audit.audit_date}</td></tr>
          <tr><td style="padding:8px 0;color:#94a3b8;">Type</td><td style="padding:8px 0;color:#fff;">${audit.audit_type || "Internal"}</td></tr>
          <tr><td style="padding:8px 0;color:#94a3b8;">Scope</td><td style="padding:8px 0;color:#fff;">${audit.scope || "Not specified"}</td></tr>
        </table>
        <p>Ensure all evidence and documentation is prepared before the audit date.</p>`;

      const html = emailTemplate(subject, body, `${APP_URL}/audits`, "View Audits");
      if (await sendEmail(email, subject, html)) {
        await logNotification(audit.company_id, email, "audit_reminder", "audit", audit.id);
        sent++;
      }
    }
  }
  return sent;
}

// ─── 2. Overdue NCR Notifications ──────────────────────────────────────────

async function sendOverdueNCRs(): Promise<number> {
  let sent = 0;
  const today = new Date().toISOString().split("T")[0];

  const { data: ncrs } = await supabase
    .from("ncrs")
    .select("id, ncr_number, title, target_close_date, severity, assigned_to, company_id")
    .eq("status", "Open")
    .lt("target_close_date", today);

  if (!ncrs?.length) return 0;

  for (const ncr of ncrs) {
    const admins = await getCompanyAdmins(ncr.company_id);
    const daysOverdue = Math.ceil(
      (new Date().getTime() - new Date(ncr.target_close_date).getTime()) / (1000 * 60 * 60 * 24)
    );

    for (const email of admins) {
      if (await alreadySent(ncr.company_id, email, "overdue_ncr", "ncr", ncr.id)) continue;

      const subject = `Overdue NCR: ${ncr.ncr_number} — ${ncr.title || "Untitled"}`;
      const body = `
        <p>The following NCR is <strong style="color:#ef4444;">${daysOverdue} day(s) overdue</strong>:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:8px 0;color:#94a3b8;">NCR Number</td><td style="padding:8px 0;color:#fff;font-weight:bold;">${ncr.ncr_number}</td></tr>
          <tr><td style="padding:8px 0;color:#94a3b8;">Title</td><td style="padding:8px 0;color:#fff;">${ncr.title || "N/A"}</td></tr>
          <tr><td style="padding:8px 0;color:#94a3b8;">Severity</td><td style="padding:8px 0;color:#fff;">${ncr.severity || "Not classified"}</td></tr>
          <tr><td style="padding:8px 0;color:#94a3b8;">Target Close Date</td><td style="padding:8px 0;color:#ef4444;">${ncr.target_close_date}</td></tr>
          <tr><td style="padding:8px 0;color:#94a3b8;">Days Overdue</td><td style="padding:8px 0;color:#ef4444;font-weight:bold;">${daysOverdue}</td></tr>
        </table>
        <p>Please investigate the root cause and close out this NCR as soon as possible.</p>`;

      const html = emailTemplate(subject, body, `${APP_URL}/ncrs`, "View NCRs");
      if (await sendEmail(email, subject, html)) {
        await logNotification(ncr.company_id, email, "overdue_ncr", "ncr", ncr.id);
        sent++;
      }
    }
  }
  return sent;
}

// ─── 3. Document Review Reminders ──────────────────────────────────────────

async function sendDocumentReviewReminders(): Promise<number> {
  let sent = 0;
  const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const { data: docs } = await supabase
    .from("documents")
    .select("id, document_number, title, next_review_date, company_id")
    .neq("status", "archived")
    .lte("next_review_date", in7Days)
    .not("next_review_date", "is", null);

  if (!docs?.length) return 0;

  for (const doc of docs) {
    // documents.company_id is TEXT, need to handle lookup differently
    const { data: companyData } = await supabase
      .from("companies")
      .select("id")
      .eq("company_code", doc.company_id)
      .limit(1);

    const companyUuid = companyData?.[0]?.id;
    if (!companyUuid) continue;

    const admins = await getCompanyAdmins(companyUuid);

    for (const email of admins) {
      if (await alreadySent(companyUuid, email, "document_review", "document", doc.id)) continue;

      const subject = `Document Due for Review: ${doc.title || doc.document_number}`;
      const body = `
        <p>The following document is due for review:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:8px 0;color:#94a3b8;">Document Number</td><td style="padding:8px 0;color:#fff;font-weight:bold;">${doc.document_number || "N/A"}</td></tr>
          <tr><td style="padding:8px 0;color:#94a3b8;">Title</td><td style="padding:8px 0;color:#fff;">${doc.title || "Untitled"}</td></tr>
          <tr><td style="padding:8px 0;color:#94a3b8;">Review Due</td><td style="padding:8px 0;color:#f59e0b;">${doc.next_review_date}</td></tr>
        </table>
        <p>Please review this document and update its status in ISOGuardian.</p>`;

      const html = emailTemplate(subject, body, `${APP_URL}/documents`, "View Documents");
      if (await sendEmail(email, subject, html)) {
        await logNotification(companyUuid, email, "document_review", "document", doc.id);
        sent++;
      }
    }
  }
  return sent;
}

// ─── 4. Weekly Compliance Digest (Monday 08:00 SAST) ────────────────────────

async function sendWeeklyDigest(): Promise<number> {
  // Only run on Mondays
  const now = new Date();
  if (now.getUTCDay() !== 1) return 0; // Monday = 1

  let sent = 0;
  const today = now.toISOString().split("T")[0];
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const { data: companies } = await supabase.from("companies").select("id, name");
  if (!companies?.length) return 0;

  for (const company of companies) {
    const admins = await getCompanyAdmins(company.id);
    if (!admins.length) continue;

    // Count open NCRs
    const { count: openNCRs } = await supabase
      .from("ncrs")
      .select("id", { count: "exact", head: true })
      .eq("company_id", company.id)
      .eq("status", "Open");

    // Count upcoming audits (next 7 days)
    const { count: upcomingAudits } = await supabase
      .from("audits")
      .select("id", { count: "exact", head: true })
      .eq("company_id", company.id)
      .in("status", ["Planned", "In Progress", "Scheduled"])
      .lte("audit_date", in7Days)
      .gte("audit_date", today);

    // Count documents due for review
    const { count: docsForReview } = await supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("company_id", company.id)
      .neq("status", "archived")
      .lte("next_review_date", in7Days)
      .not("next_review_date", "is", null);

    for (const email of admins) {
      if (await alreadySent(company.id, email, "weekly_digest", "company", company.id, 168)) continue;

      const subject = `ISOGuardian Weekly Compliance Digest — ${company.name}`;
      const body = `
        <p>Here's your weekly compliance summary for <strong>${company.name}</strong>:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr style="border-bottom:1px solid rgba(255,255,255,0.1);">
            <td style="padding:12px 0;color:#94a3b8;">Open NCRs</td>
            <td style="padding:12px 0;text-align:right;font-size:20px;font-weight:bold;color:${(openNCRs || 0) > 0 ? '#f59e0b' : '#22c55e'};">${openNCRs || 0}</td>
          </tr>
          <tr style="border-bottom:1px solid rgba(255,255,255,0.1);">
            <td style="padding:12px 0;color:#94a3b8;">Audits This Week</td>
            <td style="padding:12px 0;text-align:right;font-size:20px;font-weight:bold;color:${(upcomingAudits || 0) > 0 ? '#06b6d4' : '#64748b'};">${upcomingAudits || 0}</td>
          </tr>
          <tr>
            <td style="padding:12px 0;color:#94a3b8;">Documents Due for Review</td>
            <td style="padding:12px 0;text-align:right;font-size:20px;font-weight:bold;color:${(docsForReview || 0) > 0 ? '#f59e0b' : '#22c55e'};">${docsForReview || 0}</td>
          </tr>
        </table>
        <p style="color:#94a3b8;font-size:13px;">Stay on top of your compliance obligations. Log in to ISOGuardian for full details.</p>`;

      const html = emailTemplate(subject, body, `${APP_URL}/dashboard`, "Open Dashboard");
      if (await sendEmail(email, subject, html)) {
        await logNotification(company.id, email, "weekly_digest", "company", company.id);
        sent++;
      }
    }
  }
  return sent;
}

// ─── Main Handler ───────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // Allow manual trigger via POST or scheduled invocation
  if (req.method !== "POST" && req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const results = {
      audit_reminders: await sendAuditReminders(),
      overdue_ncrs: await sendOverdueNCRs(),
      document_reviews: await sendDocumentReviewReminders(),
      weekly_digest: await sendWeeklyDigest(),
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(results), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

// ISOGuardian — Cancellation & POPIA Erasure Notification Edge Function
// Four event types:
//   - cancellation         : client submits cancellation → emails support
//   - erasure              : user submits POPIA s24 erasure → emails support
//   - cancellation_decision: super_admin approves/rejects → emails client
//   - erasure_decision     : super_admin transitions erasure → emails user

import { getCorsHeaders } from '../_shared/cors.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const ADMIN_EMAIL = Deno.env.get('ADMIN_NOTIFICATION_EMAIL') || 'support@isoguardian.co.za'
const FROM_EMAIL = 'ISOGuardian <notifications@isoguardian.co.za>'

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function emailTemplate(subject: string, body: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#1e293b;border-radius:16px;overflow:hidden;margin-top:32px;margin-bottom:32px;">
    <tr>
      <td style="padding:24px 32px;background:linear-gradient(135deg,#0f172a,#581c87);text-align:center;">
        <h1 style="margin:0;font-size:22px;color:#fff;">
          <span style="background:linear-gradient(to right,#06b6d4,#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">ISOGuardian</span>
        </h1>
      </td>
    </tr>
    <tr>
      <td style="padding:32px;color:#cbd5e1;font-size:14px;line-height:1.7;">
        <h2 style="color:#fff;font-size:18px;margin:0 0 16px 0;">${subject}</h2>
        ${body}
      </td>
    </tr>
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
</html>`
}

function fmtZAR(n: number | string | null | undefined): string {
  const num = Number(n) || 0
  return `R${num.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch {
    return '—'
  }
}

type Payload = Record<string, unknown> & { type?: string }

function buildCancellationInternal(payload: Payload) {
  const subject = `Cancellation requested: ${escapeHtml(String(payload.company_name || 'Unknown company'))}`
  const ctxBanner = payload.cooling_off_applies
    ? '<p style="padding:12px 16px;background:rgba(16,185,129,0.1);border-left:3px solid #10b981;color:#6ee7b7;margin:16px 0;"><strong>CPA s16 cooling-off applies</strong> — no termination fee.</p>'
    : payload.within_initial_term
      ? `<p style="padding:12px 16px;background:rgba(249,115,22,0.1);border-left:3px solid #f97316;color:#fdba74;margin:16px 0;"><strong>Within 12-month Initial Term.</strong> Termination fee per SLA §4.1: <strong>${fmtZAR(payload.termination_fee_zar as number)}</strong>.</p>`
      : '<p style="padding:12px 16px;background:rgba(6,182,212,0.1);border-left:3px solid #06b6d4;color:#67e8f9;margin:16px 0;"><strong>Initial Term complete.</strong> 60-day notice period applies (no termination fee).</p>'

  const body = `
    <p>A client has submitted a subscription cancellation request.</p>
    ${ctxBanner}
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr><td style="padding:8px;color:#94a3b8;border-bottom:1px solid rgba(255,255,255,0.1);">Company</td><td style="padding:8px;color:#fff;border-bottom:1px solid rgba(255,255,255,0.1);">${escapeHtml(String(payload.company_name || ''))}</td></tr>
      <tr><td style="padding:8px;color:#94a3b8;border-bottom:1px solid rgba(255,255,255,0.1);">Requester</td><td style="padding:8px;color:#fff;border-bottom:1px solid rgba(255,255,255,0.1);">${escapeHtml(String(payload.requester_name || ''))} &lt;<a href="mailto:${escapeHtml(String(payload.requester_email || ''))}" style="color:#06b6d4;">${escapeHtml(String(payload.requester_email || ''))}</a>&gt;</td></tr>
      <tr><td style="padding:8px;color:#94a3b8;border-bottom:1px solid rgba(255,255,255,0.1);">Request ID</td><td style="padding:8px;color:#fff;border-bottom:1px solid rgba(255,255,255,0.1);font-family:monospace;font-size:12px;">${escapeHtml(String(payload.request_id || ''))}</td></tr>
      <tr><td style="padding:8px;color:#94a3b8;border-bottom:1px solid rgba(255,255,255,0.1);">Termination fee</td><td style="padding:8px;color:#fff;border-bottom:1px solid rgba(255,255,255,0.1);font-weight:bold;">${fmtZAR(payload.termination_fee_zar as number)}</td></tr>
      <tr><td style="padding:8px;color:#94a3b8;">Reason</td><td style="padding:8px;color:#fff;">${payload.reason ? escapeHtml(String(payload.reason)) : '<em style="color:#64748b;">Not provided</em>'}</td></tr>
    </table>
    <p style="color:#94a3b8;font-size:13px;">SLA: acknowledge within 2 business days. Process termination via the super_admin cancellation queue.</p>`

  return { to: ADMIN_EMAIL, subject, html: emailTemplate(subject, body) }
}

function buildErasureInternal(payload: Payload) {
  const subject = `POPIA s24 erasure requested: ${escapeHtml(String(payload.user_email || 'Unknown user'))}`
  const body = `
    <p>A user has submitted a POPIA s24 right-to-erasure request.</p>
    <p style="padding:12px 16px;background:rgba(168,85,247,0.1);border-left:3px solid #a855f7;color:#d8b4fe;margin:16px 0;"><strong>SLA: 30 days.</strong> Deadline ${escapeHtml(fmtDate(payload.sla_deadline_at as string))}.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr><td style="padding:8px;color:#94a3b8;border-bottom:1px solid rgba(255,255,255,0.1);">User</td><td style="padding:8px;color:#fff;border-bottom:1px solid rgba(255,255,255,0.1);">${escapeHtml(String(payload.user_full_name || ''))} &lt;<a href="mailto:${escapeHtml(String(payload.user_email || ''))}" style="color:#06b6d4;">${escapeHtml(String(payload.user_email || ''))}</a>&gt;</td></tr>
      <tr><td style="padding:8px;color:#94a3b8;border-bottom:1px solid rgba(255,255,255,0.1);">User ID</td><td style="padding:8px;color:#fff;border-bottom:1px solid rgba(255,255,255,0.1);font-family:monospace;font-size:12px;">${escapeHtml(String(payload.user_id || ''))}</td></tr>
      <tr><td style="padding:8px;color:#94a3b8;border-bottom:1px solid rgba(255,255,255,0.1);">Company ID</td><td style="padding:8px;color:#fff;border-bottom:1px solid rgba(255,255,255,0.1);font-family:monospace;font-size:12px;">${escapeHtml(String(payload.company_id || '—'))}</td></tr>
      <tr><td style="padding:8px;color:#94a3b8;border-bottom:1px solid rgba(255,255,255,0.1);">Request ID</td><td style="padding:8px;color:#fff;border-bottom:1px solid rgba(255,255,255,0.1);font-family:monospace;font-size:12px;">${escapeHtml(String(payload.request_id || ''))}</td></tr>
      <tr><td style="padding:8px;color:#94a3b8;">Reason</td><td style="padding:8px;color:#fff;">${payload.reason ? escapeHtml(String(payload.reason)) : '<em style="color:#64748b;">Not provided</em>'}</td></tr>
    </table>
    <p style="color:#94a3b8;font-size:13px;">Process via the super_admin erasure queue. Retain any data required under POPIA s14, tax legislation, or audit-trail integrity — anonymise rather than delete.</p>`

  return { to: ADMIN_EMAIL, subject, html: emailTemplate(subject, body) }
}

function buildCancellationDecision(payload: Payload) {
  const decision = String(payload.decision || '')
  const recipient = String(payload.to || '')
  const recipientName = String(payload.to_name || '')
  const companyName = String(payload.company_name || '')
  const notes = payload.processor_notes ? `<p style="padding:12px 16px;background:rgba(255,255,255,0.05);border-left:3px solid #64748b;color:#cbd5e1;margin:16px 0;"><strong>Note from our team:</strong><br>${escapeHtml(String(payload.processor_notes))}</p>` : ''

  if (decision === 'approved') {
    const subject = `Cancellation approved — ISOGuardian subscription for ${escapeHtml(companyName)}`
    const feeLine = Number(payload.termination_fee_zar) > 0
      ? `<tr><td style="padding:8px;color:#94a3b8;border-bottom:1px solid rgba(255,255,255,0.1);">Early termination fee</td><td style="padding:8px;color:#fff;border-bottom:1px solid rgba(255,255,255,0.1);font-weight:bold;">${fmtZAR(payload.termination_fee_zar as number)}</td></tr>`
      : `<tr><td style="padding:8px;color:#94a3b8;border-bottom:1px solid rgba(255,255,255,0.1);">Early termination fee</td><td style="padding:8px;color:#6ee7b7;border-bottom:1px solid rgba(255,255,255,0.1);">None</td></tr>`

    const body = `
      <p>Hi ${escapeHtml(recipientName || 'there')},</p>
      <p>Your ISOGuardian subscription cancellation request for <strong>${escapeHtml(companyName)}</strong> has been approved.</p>
      <p style="padding:12px 16px;background:rgba(16,185,129,0.1);border-left:3px solid #10b981;color:#6ee7b7;margin:16px 0;"><strong>Service ends on ${escapeHtml(fmtDate(payload.effective_date as string))}.</strong> You'll retain full platform access until that date.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:8px;color:#94a3b8;border-bottom:1px solid rgba(255,255,255,0.1);">Company</td><td style="padding:8px;color:#fff;border-bottom:1px solid rgba(255,255,255,0.1);">${escapeHtml(companyName)}</td></tr>
        <tr><td style="padding:8px;color:#94a3b8;border-bottom:1px solid rgba(255,255,255,0.1);">Effective date</td><td style="padding:8px;color:#fff;border-bottom:1px solid rgba(255,255,255,0.1);">${escapeHtml(fmtDate(payload.effective_date as string))}</td></tr>
        ${feeLine}
      </table>
      <h3 style="color:#fff;font-size:15px;margin-top:24px;">Before service ends, please:</h3>
      <ul style="padding-left:20px;color:#cbd5e1;">
        <li>Export your data via <a href="https://isoguardian.co.za/data-export" style="color:#06b6d4;">Account Settings → Export Data</a> (POPIA s24 right of access)</li>
        <li>Download any critical compliance documents, audit reports, or NCR records you need</li>
        <li>Notify any external auditors who currently have Audit Connect access</li>
      </ul>
      ${notes}
      <p style="margin-top:24px;">This email serves as the formal written notice of cancellation per Client Subscription &amp; SLA §4.1.</p>
      <p>Thank you for being part of ISOGuardian. If you need anything during the wind-down period — or want to resume service — just reply to this email.</p>
      <p>— The ISOGuardian team</p>`

    return { to: recipient, subject, html: emailTemplate(subject, body) }
  }

  // rejected
  const subject = `Cancellation request — further information needed (${escapeHtml(companyName)})`
  const body = `
    <p>Hi ${escapeHtml(recipientName || 'there')},</p>
    <p>We've reviewed your cancellation request for <strong>${escapeHtml(companyName)}</strong> and need to follow up before it can be processed.</p>
    ${notes || '<p>Our team will be in touch shortly to discuss.</p>'}
    <p style="margin-top:24px;">Your subscription remains active in the meantime. If you'd like to discuss directly, reply to this email or contact <a href="mailto:support@isoguardian.co.za" style="color:#06b6d4;">support@isoguardian.co.za</a>.</p>
    <p>— The ISOGuardian team</p>`

  return { to: recipient, subject, html: emailTemplate(subject, body) }
}

function buildErasureDecision(payload: Payload) {
  const decision = String(payload.decision || '')
  const recipient = String(payload.to || '')
  const recipientName = String(payload.to_name || '')
  const notes = payload.processor_notes ? `<p style="padding:12px 16px;background:rgba(255,255,255,0.05);border-left:3px solid #64748b;color:#cbd5e1;margin:16px 0;"><strong>Note from our team:</strong><br>${escapeHtml(String(payload.processor_notes))}</p>` : ''
  const retentionBlock = payload.retention_exceptions
    ? `<h3 style="color:#fff;font-size:15px;margin-top:24px;">Retention exceptions</h3>
       <p style="padding:12px 16px;background:rgba(249,115,22,0.1);border-left:3px solid #f97316;color:#fdba74;margin:8px 0;">Certain data must be retained under POPIA s14, tax legislation, or audit-trail integrity requirements. Where possible, retained records have been anonymised.</p>
       <p style="background:rgba(255,255,255,0.05);padding:12px 16px;border-radius:8px;color:#cbd5e1;white-space:pre-wrap;">${escapeHtml(String(payload.retention_exceptions))}</p>`
    : ''

  if (decision === 'processing') {
    const subject = `POPIA erasure request received — processing started`
    const body = `
      <p>Hi ${escapeHtml(recipientName || 'there')},</p>
      <p>We've received your POPIA s24 right-to-erasure request and have started processing it.</p>
      <p style="padding:12px 16px;background:rgba(168,85,247,0.1);border-left:3px solid #a855f7;color:#d8b4fe;margin:16px 0;"><strong>Expected completion by ${escapeHtml(fmtDate(payload.sla_deadline_at as string))}</strong> (within the 30-day POPIA SLA).</p>
      <p>We'll email you again once erasure is complete, with a summary of what was erased and any data retained under lawful retention obligations (POPIA s14, tax, regulatory).</p>
      ${notes}
      <p style="margin-top:24px;">Questions? Reply to this email or contact <a href="mailto:support@isoguardian.co.za" style="color:#06b6d4;">support@isoguardian.co.za</a>.</p>
      <p>— The ISOGuardian Information Officer</p>`
    return { to: recipient, subject, html: emailTemplate(subject, body) }
  }

  if (decision === 'completed') {
    const subject = `POPIA erasure completed`
    const body = `
      <p>Hi ${escapeHtml(recipientName || 'there')},</p>
      <p>Your POPIA s24 erasure request has been completed.</p>
      <p style="padding:12px 16px;background:rgba(16,185,129,0.1);border-left:3px solid #10b981;color:#6ee7b7;margin:16px 0;"><strong>Your personal information has been erased from our systems.</strong></p>
      ${retentionBlock}
      ${notes}
      <p style="margin-top:24px;">If you have any concerns about how this was handled, you have the right to complain to the <a href="https://inforegulator.org.za" style="color:#06b6d4;">Information Regulator of South Africa</a>.</p>
      <p>— The ISOGuardian Information Officer</p>`
    return { to: recipient, subject, html: emailTemplate(subject, body) }
  }

  // rejected
  const subject = `POPIA erasure request — further information needed`
  const body = `
    <p>Hi ${escapeHtml(recipientName || 'there')},</p>
    <p>We've reviewed your POPIA s24 right-to-erasure request and need to follow up before it can be processed.</p>
    ${notes || '<p>Our team will be in touch shortly.</p>'}
    <p style="margin-top:24px;">You retain the right to complain to the <a href="https://inforegulator.org.za" style="color:#06b6d4;">Information Regulator of South Africa</a> if you believe your request has been handled unfairly.</p>
    <p>— The ISOGuardian Information Officer</p>`

  return { to: recipient, subject, html: emailTemplate(subject, body) }
}

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  try {
    const payload = (await req.json()) as Payload
    const type = payload?.type

    let email: { to: string; subject: string; html: string } | null = null

    if (type === 'cancellation') {
      email = buildCancellationInternal(payload)
    } else if (type === 'erasure') {
      email = buildErasureInternal(payload)
    } else if (type === 'cancellation_decision') {
      email = buildCancellationDecision(payload)
    } else if (type === 'erasure_decision') {
      email = buildErasureDecision(payload)
    } else {
      return new Response(JSON.stringify({ error: 'Invalid type' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    if (!email.to) {
      return new Response(JSON.stringify({ error: 'Missing recipient' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM_EMAIL, to: [email.to], subject: email.subject, html: email.html }),
    })

    if (!res.ok) {
      const err = await res.text()
      return new Response(JSON.stringify({ error: 'Email send failed', details: err }), {
        status: 500,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  } catch (_err) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})

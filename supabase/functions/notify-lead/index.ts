// ISOGuardian — Instant Lead Notification Edge Function
// Called by landing page forms after a lead submits (assessment or consultation)
// Sends an immediate email to the admin so leads aren't missed

import { corsHeaders } from '../_shared/cors.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const ADMIN_EMAIL = Deno.env.get('ADMIN_NOTIFICATION_EMAIL') || 'support@isoguardian.co.za'
const FROM_EMAIL = 'ISOGuardian <notifications@isoguardian.co.za>'

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // GET = test endpoint to verify Resend config
  if (req.method === 'GET') {
    try {
      const testRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [ADMIN_EMAIL],
          subject: 'ISOGuardian Email Test',
          html: emailTemplate('Email Test', '<p>If you received this, your Resend configuration is working correctly.</p><p>Sent at: ' + new Date().toISOString() + '</p>'),
        }),
      })
      const resBody = await testRes.text()
      return new Response(JSON.stringify({
        success: testRes.ok,
        status: testRes.status,
        from: FROM_EMAIL,
        to: ADMIN_EMAIL,
        resend_response: resBody,
        api_key_set: !!RESEND_API_KEY,
        api_key_prefix: RESEND_API_KEY ? RESEND_API_KEY.slice(0, 8) + '...' : 'NOT SET',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } catch (err) {
      return new Response(JSON.stringify({ error: String(err), api_key_set: !!RESEND_API_KEY }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  }

  try {
    const { type, data } = await req.json()

    if (!type || !data) {
      return new Response(JSON.stringify({ error: 'Missing type or data' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let subject: string
    let body: string

    if (type === 'assessment') {
      subject = `New ISO Assessment Lead: ${escapeHtml(data.company_name || 'Unknown')}`
      body = `
        <p>A new ISO Readiness Assessment has been submitted on the website:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:8px;color:#94a3b8;border-bottom:1px solid rgba(255,255,255,0.1);">Company</td><td style="padding:8px;color:#fff;border-bottom:1px solid rgba(255,255,255,0.1);">${escapeHtml(data.company_name || '')}</td></tr>
          <tr><td style="padding:8px;color:#94a3b8;border-bottom:1px solid rgba(255,255,255,0.1);">Email</td><td style="padding:8px;color:#fff;border-bottom:1px solid rgba(255,255,255,0.1);"><a href="mailto:${escapeHtml(data.email || '')}" style="color:#06b6d4;">${escapeHtml(data.email || '')}</a></td></tr>
          <tr><td style="padding:8px;color:#94a3b8;border-bottom:1px solid rgba(255,255,255,0.1);">Phone</td><td style="padding:8px;color:#fff;border-bottom:1px solid rgba(255,255,255,0.1);">${data.phone ? escapeHtml(data.phone) : 'Not provided'}</td></tr>
          <tr><td style="padding:8px;color:#94a3b8;border-bottom:1px solid rgba(255,255,255,0.1);">Standard</td><td style="padding:8px;color:#fff;border-bottom:1px solid rgba(255,255,255,0.1);">${escapeHtml(data.standard || '')}</td></tr>
          <tr><td style="padding:8px;color:#94a3b8;">Score</td><td style="padding:8px;color:#fff;font-weight:bold;">${data.score ?? 'N/A'}%</td></tr>
        </table>
        <p style="color:#94a3b8;font-size:13px;">This lead came from the ISO Readiness Assessment on the landing page. Follow up promptly.</p>`
    } else if (type === 'consultation') {
      subject = `New Consultation Request: ${escapeHtml(data.company || 'Unknown')}`
      body = `
        <p>A new consultation request has been submitted on the website:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:8px;color:#94a3b8;border-bottom:1px solid rgba(255,255,255,0.1);">Name</td><td style="padding:8px;color:#fff;border-bottom:1px solid rgba(255,255,255,0.1);">${escapeHtml(data.name || '')}</td></tr>
          <tr><td style="padding:8px;color:#94a3b8;border-bottom:1px solid rgba(255,255,255,0.1);">Email</td><td style="padding:8px;color:#fff;border-bottom:1px solid rgba(255,255,255,0.1);"><a href="mailto:${escapeHtml(data.email || '')}" style="color:#06b6d4;">${escapeHtml(data.email || '')}</a></td></tr>
          <tr><td style="padding:8px;color:#94a3b8;border-bottom:1px solid rgba(255,255,255,0.1);">Company</td><td style="padding:8px;color:#fff;border-bottom:1px solid rgba(255,255,255,0.1);">${escapeHtml(data.company || '')}</td></tr>
          <tr><td style="padding:8px;color:#94a3b8;border-bottom:1px solid rgba(255,255,255,0.1);">Standard</td><td style="padding:8px;color:#fff;border-bottom:1px solid rgba(255,255,255,0.1);">${escapeHtml(data.standard || '')}</td></tr>
          <tr><td style="padding:8px;color:#94a3b8;border-bottom:1px solid rgba(255,255,255,0.1);">Preferred Date</td><td style="padding:8px;color:#fff;border-bottom:1px solid rgba(255,255,255,0.1);">${data.preferred_date || 'Flexible'}</td></tr>
          <tr><td style="padding:8px;color:#94a3b8;">Message</td><td style="padding:8px;color:#fff;">${data.message ? escapeHtml(data.message) : 'No message'}</td></tr>
        </table>
        <p style="color:#94a3b8;font-size:13px;">Respond within 24 hours to maximise conversion.</p>`
    } else if (type === 'auditor_invite') {
      // This email goes TO the auditor, not to admin
      subject = `You've been invited to audit via ISOGuardian`
      body = `
        <p>Hi ${escapeHtml(data.auditor_name || '')},</p>
        <p>You have been invited to conduct an audit using ISOGuardian's Audit Connect portal.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:8px;color:#94a3b8;border-bottom:1px solid rgba(255,255,255,0.1);">Audit</td><td style="padding:8px;color:#fff;border-bottom:1px solid rgba(255,255,255,0.1);">${escapeHtml(data.audit_name || '')}</td></tr>
          <tr><td style="padding:8px;color:#94a3b8;border-bottom:1px solid rgba(255,255,255,0.1);">Company</td><td style="padding:8px;color:#fff;border-bottom:1px solid rgba(255,255,255,0.1);">${escapeHtml(data.company_name || '')}</td></tr>
          <tr><td style="padding:8px;color:#94a3b8;border-bottom:1px solid rgba(255,255,255,0.1);">Invited By</td><td style="padding:8px;color:#fff;border-bottom:1px solid rgba(255,255,255,0.1);">${escapeHtml(data.invited_by || '')}</td></tr>
          <tr><td style="padding:8px;color:#94a3b8;">Access Expires</td><td style="padding:8px;color:#fff;">${escapeHtml(data.expires_at || '')}</td></tr>
        </table>
        <p>Click the button below to access the audit workspace. No account is required.</p>
        <div style="text-align:center;margin:24px 0;">
          <a href="${escapeHtml(data.audit_link || '')}" style="display:inline-block;padding:14px 36px;background:linear-gradient(to right,#06b6d4,#a855f7);color:#fff;text-decoration:none;border-radius:12px;font-weight:bold;font-size:14px;">Open Audit Workspace</a>
        </div>
        <p style="color:#94a3b8;font-size:12px;">If the button doesn't work, copy and paste this link into your browser:<br>
        <a href="${escapeHtml(data.audit_link || '')}" style="color:#06b6d4;word-break:break-all;">${escapeHtml(data.audit_link || '')}</a></p>
        <p style="color:#64748b;font-size:11px;margin-top:24px;">This is a secure, time-limited link. Do not share it with anyone else.</p>`

      // Send to auditor, not admin
      const auditorHtml = emailTemplate(subject, body)
      const auditorRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from: FROM_EMAIL, to: [data.auditor_email], subject, html: auditorHtml }),
      })

      if (!auditorRes.ok) {
        const err = await auditorRes.text()
        return new Response(JSON.stringify({ error: 'Email send failed', details: err }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } else if (type === 'template_enquiry') {
      subject = `Template Enquiry: ${escapeHtml(data.template_name || 'Unknown')}`
      body = `
        <p>A new template enquiry has been submitted on the website:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:8px;color:#94a3b8;border-bottom:1px solid rgba(255,255,255,0.1);">Name</td><td style="padding:8px;color:#fff;border-bottom:1px solid rgba(255,255,255,0.1);">${escapeHtml(data.name || '')}</td></tr>
          <tr><td style="padding:8px;color:#94a3b8;border-bottom:1px solid rgba(255,255,255,0.1);">Email</td><td style="padding:8px;color:#fff;border-bottom:1px solid rgba(255,255,255,0.1);"><a href="mailto:${escapeHtml(data.email || '')}" style="color:#06b6d4;">${escapeHtml(data.email || '')}</a></td></tr>
          <tr><td style="padding:8px;color:#94a3b8;border-bottom:1px solid rgba(255,255,255,0.1);">Company</td><td style="padding:8px;color:#fff;border-bottom:1px solid rgba(255,255,255,0.1);">${escapeHtml(data.company || '')}</td></tr>
          <tr><td style="padding:8px;color:#94a3b8;">Template</td><td style="padding:8px;color:#fff;font-weight:bold;">${escapeHtml(data.template_name || '')}</td></tr>
        </table>
        <p style="color:#94a3b8;font-size:13px;">Follow up with pricing and availability.</p>`
    } else {
      return new Response(JSON.stringify({ error: 'Invalid lead type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const html = emailTemplate(subject, body)

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM_EMAIL, to: [ADMIN_EMAIL], subject, html }),
    })

    if (!res.ok) {
      const err = await res.text()
      return new Response(JSON.stringify({ error: 'Email send failed', details: err }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

// ISOGuardian — PayFast Checkout Edge Function
import { publicCorsHeaders } from '../_shared/cors.ts'
import { crypto as stdCrypto } from 'https://deno.land/std@0.224.0/crypto/mod.ts'
import { encodeHex } from 'https://deno.land/std@0.224.0/encoding/hex.ts'

const PAYFAST_MERCHANT_ID = Deno.env.get('PAYFAST_MERCHANT_ID')!
const PAYFAST_MERCHANT_KEY = Deno.env.get('PAYFAST_MERCHANT_KEY')!
const PAYFAST_PASSPHRASE = Deno.env.get('PAYFAST_PASSPHRASE') || ''
const PAYFAST_SANDBOX = Deno.env.get('PAYFAST_SANDBOX') === 'true'

const PAYFAST_URL = PAYFAST_SANDBOX
  ? 'https://sandbox.payfast.co.za/eng/process'
  : 'https://www.payfast.co.za/eng/process'

const SITE_URL = 'https://isoguardian.co.za'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!

const TIERS: Record<string, { name: string; price: number; maxUsers: number; storageGb: number }> = {
  starter: { name: 'Starter', price: 2000, maxUsers: 10, storageGb: 5 },
  growth:  { name: 'Growth',  price: 3700, maxUsers: 20, storageGb: 15 },
}

// Template pricing (one-time purchases for non-subscribers)
const TEMPLATE_PRICES: Record<string, { name: string; price: number }> = {
  // ISO 9001
  'quality-manual': { name: 'Quality Manual', price: 500 },
  'quality-policy': { name: 'Quality Policy', price: 250 },
  'risk-register': { name: 'Risk Register', price: 350 },
  'internal-audit-procedure': { name: 'Internal Audit Procedure', price: 350 },
  'corrective-action-procedure': { name: 'Corrective Action Procedure', price: 350 },
  'document-control-procedure': { name: 'Document Control Procedure', price: 350 },
  'management-review-agenda': { name: 'Management Review Agenda', price: 250 },
  // ISO 14001
  'env-policy': { name: 'Environmental Policy', price: 250 },
  'env-aspects-register': { name: 'Environmental Aspects Register', price: 400 },
  'env-legal-register': { name: 'Environmental Legal Register', price: 400 },
  'waste-management-proc': { name: 'Waste Management Procedure', price: 350 },
  'emergency-preparedness-env': { name: 'Emergency Preparedness Plan (Env)', price: 350 },
  'env-objectives-register': { name: 'Environmental Objectives Register', price: 300 },
  'env-management-proc': { name: 'Environmental Management Procedure', price: 350 },
  // ISO 45001
  'ohs-policy': { name: 'OHS Policy', price: 250 },
  'hazard-identification-proc': { name: 'HIRA Procedure', price: 400 },
  'incident-investigation-proc': { name: 'Incident Investigation Procedure', price: 350 },
  'safety-inspection-checklist': { name: 'Safety Inspection Checklist', price: 300 },
  'emergency-response-ohs': { name: 'Emergency Response Plan (OHS)', price: 350 },
  'ppe-register': { name: 'PPE Register', price: 300 },
  'legal-appointments-register': { name: 'Legal Appointments Register', price: 350 },
  // Starter packs (bundles)
  'iso-9001-starter': { name: 'ISO 9001 Starter Pack', price: 7500 },
  'iso-14001-starter': { name: 'ISO 14001 Starter Pack', price: 7500 },
  'iso-45001-starter': { name: 'ISO 45001 Starter Pack', price: 7500 },
}

// PHP-compatible urlencode: encodeURIComponent + spaces as +
// Also encode chars that PHP encodes but JS doesn't: ! * ' ( ) ~
function phpUrlencode(str: string): string {
  return encodeURIComponent(str.trim())
    .replace(/%20/g, '+')
    .replace(/!/g, '%21')
    .replace(/\*/g, '%2A')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/~/g, '%7E')
}

// PayFast signature: MD5 of param string with PHP-compatible encoding
async function generateSignature(
  params: Array<[string, string]>,
  passphrase: string
): Promise<string> {
  const parts: string[] = []
  for (const [key, val] of params) {
    if (val !== '') {
      parts.push(`${key}=${phpUrlencode(val)}`)
    }
  }
  let paramString = parts.join('&')

  if (passphrase) {
    paramString += `&passphrase=${phpUrlencode(passphrase)}`
  }

  const hash = await stdCrypto.subtle.digest('MD5', new TextEncoder().encode(paramString))
  return encodeHex(new Uint8Array(hash))
}

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 })
    return true
  }
  if (entry.count >= 5) return false
  entry.count++
  return true
}

Deno.serve(async (req) => {
  const url = new URL(req.url)

  // Minimal test: GET /create-checkout?test=true
  // Submits a R10 once-off payment to verify signature works
  if (req.method === 'GET' && url.searchParams.get('test') === 'true') {
    const params: Array<[string, string]> = [
      ['merchant_id', PAYFAST_MERCHANT_ID],
      ['merchant_key', PAYFAST_MERCHANT_KEY],
      ['return_url', `${SITE_URL}/?payment=success`],
      ['cancel_url', `${SITE_URL}/?payment=cancelled`],
      ['amount', '10.00'],
      ['item_name', 'ISOGuardian Test Payment'],
    ]
    const signature = await generateSignature(params, PAYFAST_PASSPHRASE)

    // Build auto-submit form
    const formFields = params
      .map(([k, v]) => `<input type="hidden" name="${k}" value="${v.replace(/"/g, '&quot;')}">`)
      .join('\n      ')

    const html = `<!DOCTYPE html>
<html><head><title>Redirecting to PayFast...</title></head>
<body>
  <p>Redirecting to PayFast...</p>
  <form id="pf" method="POST" action="${PAYFAST_URL}">
      ${formFields}
      <input type="hidden" name="signature" value="${signature}">
      <button type="submit">Pay Now</button>
  </form>
  <script>document.getElementById('pf').submit();</script>
</body></html>`

    return new Response(html, {
      headers: { 'Content-Type': 'text/html' },
    })
  }

  // Debug GET endpoint — shows signature calculation
  if (req.method === 'GET') {
    const testParams: Array<[string, string]> = [
      ['merchant_id', PAYFAST_MERCHANT_ID],
      ['merchant_key', PAYFAST_MERCHANT_KEY],
      ['amount', '2000.00'],
      ['item_name', 'Test Payment'],
    ]
    const signature = await generateSignature(testParams, PAYFAST_PASSPHRASE)

    // Build debug param string manually for display
    const parts = testParams.map(([k, v]) => `${k}=${phpUrlencode(v)}`).join('&')
    const fullString = PAYFAST_PASSPHRASE
      ? `${parts}&passphrase=${phpUrlencode(PAYFAST_PASSPHRASE)}`
      : parts

    return new Response(JSON.stringify({
      note: 'Debug endpoint. Add ?test=true to submit a R10 test payment to PayFast.',
      merchant_id: PAYFAST_MERCHANT_ID,
      passphrase_set: PAYFAST_PASSPHRASE !== '',
      passphrase_length: PAYFAST_PASSPHRASE.length,
      sandbox_mode: PAYFAST_SANDBOX,
      payfast_url: PAYFAST_URL,
      param_string: fullString,
      signature,
    }, null, 2), {
      headers: { ...publicCorsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: publicCorsHeaders })
  }

  try {
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('cf-connecting-ip') || 'unknown'
    if (!checkRateLimit(clientIp)) {
      return new Response(JSON.stringify({ error: 'Too many requests.' }), {
        status: 429, headers: { ...publicCorsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()
    const { type = 'subscription', email, firstName, lastName } = body

    // ─── Template one-time purchase ───
    if (type === 'template') {
      const { templateId } = body
      const templateConfig = TEMPLATE_PRICES[templateId]
      if (!templateConfig) {
        return new Response(JSON.stringify({ error: 'Invalid template.' }), {
          status: 400, headers: { ...publicCorsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const paymentId = crypto.randomUUID()

      const params: Array<[string, string]> = [
        ['merchant_id', PAYFAST_MERCHANT_ID],
        ['merchant_key', PAYFAST_MERCHANT_KEY],
        ['return_url', `${SITE_URL}/?payment=template_success&template=${templateId}`],
        ['cancel_url', `${SITE_URL}/?payment=cancelled`],
        ['notify_url', `${SUPABASE_URL}/functions/v1/payfast-webhook`],
      ]

      if (firstName) params.push(['name_first', firstName])
      if (lastName) params.push(['name_last', lastName])
      if (email) params.push(['email_address', email])

      params.push(
        ['m_payment_id', paymentId],
        ['amount', templateConfig.price.toFixed(2)],
        ['item_name', `ISOGuardian Template: ${templateConfig.name}`],
      )

      // custom_str1 = 'template' (payment type flag)
      // custom_str2 = template ID
      // custom_str3 = buyer email (for lead capture, redundant with email_address but ensures we have it)
      // custom_str5 = internal payment ID
      params.push(['custom_str1', 'template'])
      params.push(['custom_str2', templateId])
      if (email) params.push(['custom_str3', email])
      params.push(['custom_str5', paymentId])

      const signature = await generateSignature(params, PAYFAST_PASSPHRASE)

      const pfData: Record<string, string> = {}
      for (const [key, val] of params) {
        if (val !== '') pfData[key] = val
      }
      pfData.signature = signature

      return new Response(JSON.stringify({
        success: true,
        type: 'template',
        pfUrl: PAYFAST_URL,
        pfData,
        paymentId,
        templateId,
        templateName: templateConfig.name,
        amount: templateConfig.price,
      }), {
        headers: { ...publicCorsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ─── Subscription checkout (existing flow) ───
    const { tier, companyName, referralCode, partnerCode } = body

    const tierConfig = TIERS[tier?.toLowerCase()]
    if (!tierConfig) {
      return new Response(JSON.stringify({ error: 'Invalid tier.' }), {
        status: 400, headers: { ...publicCorsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const paymentId = crypto.randomUUID()
    const billingDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // PayFast params in documented order:
    // merchant > urls > buyer > transaction > custom > subscription
    const params: Array<[string, string]> = [
      ['merchant_id', PAYFAST_MERCHANT_ID],
      ['merchant_key', PAYFAST_MERCHANT_KEY],
      ['return_url', `${SITE_URL}/login?payment=success&tier=${tier}`],
      ['cancel_url', `${SITE_URL}/?payment=cancelled`],
      ['notify_url', `${SUPABASE_URL}/functions/v1/payfast-webhook`],
    ]

    // Optional buyer details
    if (firstName) params.push(['name_first', firstName])
    if (lastName) params.push(['name_last', lastName])
    if (email) params.push(['email_address', email])

    // Transaction — R0 initial for 14-day free trial, recurring starts after trial
    params.push(
      ['m_payment_id', paymentId],
      ['amount', '0.00'],
      ['item_name', `ISOGuardian ${tierConfig.name} Plan`],
    )

    // Custom strings
    params.push(['custom_str1', tier])
    if (referralCode) params.push(['custom_str2', referralCode])
    if (partnerCode) params.push(['custom_str3', partnerCode])
    if (companyName) params.push(['custom_str4', companyName])
    params.push(['custom_str5', paymentId])

    // Subscription/recurring
    params.push(
      ['subscription_type', '1'],
      ['billing_date', billingDate],
      ['recurring_amount', tierConfig.price.toFixed(2)],
      ['frequency', '3'],
      ['cycles', '0'],
    )

    // Generate signature
    const signature = await generateSignature(params, PAYFAST_PASSPHRASE)

    // Build form data in same order as params
    const pfData: Record<string, string> = {}
    for (const [key, val] of params) {
      if (val !== '') pfData[key] = val
    }
    pfData.signature = signature

    return new Response(JSON.stringify({
      success: true,
      type: 'subscription',
      pfUrl: PAYFAST_URL,
      pfData,
      paymentId,
      tier: tierConfig.name,
      amount: tierConfig.price,
      trialDays: 14,
    }), {
      headers: { ...publicCorsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('create-checkout error:', err)
    return new Response(JSON.stringify({ error: 'Failed to create checkout session' }), {
      status: 500, headers: { ...publicCorsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

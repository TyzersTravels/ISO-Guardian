// ISOGuardian — PayFast Checkout Edge Function
// Generates PayFast payment form data for self-service subscription signup
// Frontend submits as POST form to PayFast (standard integration method)

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

// Pricing tiers (ZAR, monthly)
const TIERS: Record<string, { name: string; price: number; maxUsers: number; storageGb: number }> = {
  starter: { name: 'Starter', price: 2000, maxUsers: 10, storageGb: 5 },
  growth:  { name: 'Growth',  price: 3700, maxUsers: 20, storageGb: 15 },
}

// Generate PayFast signature — MD5 of params in DEFINITION order (not sorted)
// Per PayFast docs: "The data string follows the same order as the submit page"
async function generateSignature(
  data: Array<[string, string]>,
  passphrase: string
): Promise<string> {
  // Build param string from non-empty values in definition order
  const paramString = data
    .filter(([, val]) => val !== '')
    .map(([key, val]) => `${key}=${encodeURIComponent(val.trim()).replace(/%20/g, '+')}`)
    .join('&')

  const withPassphrase = passphrase
    ? `${paramString}&passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, '+')}`
    : paramString

  const hash = await stdCrypto.subtle.digest('MD5', new TextEncoder().encode(withPassphrase))
  return encodeHex(new Uint8Array(hash))
}

// In-memory rate limiting (per IP, 5 requests per minute)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 5
const RATE_WINDOW = 60_000

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: publicCorsHeaders })
  }

  try {
    // Rate limit by IP
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('cf-connecting-ip')
      || 'unknown'
    if (!checkRateLimit(clientIp)) {
      return new Response(JSON.stringify({ error: 'Too many requests. Please try again in a minute.' }), {
        status: 429,
        headers: { ...publicCorsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { tier, email, companyName, firstName, lastName, referralCode, partnerCode } = await req.json()

    const tierConfig = TIERS[tier?.toLowerCase()]
    if (!tierConfig) {
      return new Response(JSON.stringify({ error: 'Invalid tier. Choose: starter, growth' }), {
        status: 400,
        headers: { ...publicCorsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const paymentId = crypto.randomUUID()
    const billingDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // Build payment fields in PayFast's expected order
    // Only include fields that have values — empty strings are excluded from signature
    const fields: Array<[string, string]> = [
      // Merchant details (required)
      ['merchant_id', PAYFAST_MERCHANT_ID],
      ['merchant_key', PAYFAST_MERCHANT_KEY],
      // URLs
      ['return_url', `${SITE_URL}/login?payment=success&tier=${tier}`],
      ['cancel_url', `${SITE_URL}/?payment=cancelled`],
      ['notify_url', `${SUPABASE_URL}/functions/v1/payfast-webhook`],
      // Buyer details (optional — PayFast collects if empty)
      ['name_first', firstName || ''],
      ['name_last', lastName || ''],
      ['email_address', email || ''],
      // Transaction details
      ['m_payment_id', paymentId],
      ['amount', tierConfig.price.toFixed(2)],
      ['item_name', `ISOGuardian ${tierConfig.name} Plan - Monthly`],
      // Subscription/recurring fields
      ['subscription_type', '1'],
      ['billing_date', billingDate],
      ['recurring_amount', tierConfig.price.toFixed(2)],
      ['frequency', '3'],
      ['cycles', '0'],
      // Custom fields for webhook processing
      ['custom_str1', tier],
      ['custom_str2', referralCode || ''],
      ['custom_str3', partnerCode || ''],
      ['custom_str4', companyName || ''],
      ['custom_str5', paymentId],
    ]

    // Generate signature from non-empty fields in definition order
    const signature = await generateSignature(fields, PAYFAST_PASSPHRASE)

    // Build the form data object (only non-empty fields + signature)
    const formData: Record<string, string> = {}
    for (const [key, val] of fields) {
      if (val !== '') formData[key] = val
    }
    formData.signature = signature

    return new Response(JSON.stringify({
      success: true,
      pfUrl: PAYFAST_URL,
      pfData: formData,
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
      status: 500,
      headers: { ...publicCorsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

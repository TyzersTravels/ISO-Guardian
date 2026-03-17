// ISOGuardian — PayFast Checkout Edge Function
// Generates a PayFast payment URL for self-service subscription signup
// Passes through referral/partner codes for commission tracking

import { publicCorsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
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
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Pricing tiers (ZAR, monthly)
const TIERS: Record<string, { name: string; price: number; maxUsers: number; storageGb: number }> = {
  starter: { name: 'Starter', price: 2000, maxUsers: 10, storageGb: 5 },
  growth:  { name: 'Growth',  price: 3700, maxUsers: 20, storageGb: 15 },
}

// Generate PayFast signature (MD5 of sorted params)
async function generateSignature(data: Record<string, string>, passphrase: string): Promise<string> {
  const params = Object.keys(data)
    .filter(key => data[key] !== '')
    .sort()
    .map(key => `${key}=${encodeURIComponent(data[key]).replace(/%20/g, '+')}`)
    .join('&')

  const withPassphrase = passphrase ? `${params}&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, '+')}` : params

  // Use Deno std crypto for reliable MD5 hashing
  const hash = await stdCrypto.subtle.digest('MD5', new TextEncoder().encode(withPassphrase))
  return encodeHex(new Uint8Array(hash))
}

// In-memory rate limiting (per IP, 5 requests per minute)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 5
const RATE_WINDOW = 60_000 // 1 minute

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

    // Validate tier
    const tierConfig = TIERS[tier?.toLowerCase()]
    if (!tierConfig) {
      return new Response(JSON.stringify({ error: 'Invalid tier. Choose: starter, growth' }), {
        status: 400,
        headers: { ...publicCorsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Generate a unique payment ID for tracking
    const paymentId = crypto.randomUUID()

    // Custom fields for PayFast — pass referral/partner codes + tier info
    // PayFast supports custom_str1-5 and custom_int1-5
    const customData = {
      custom_str1: tier,                          // subscription tier
      custom_str2: referralCode || '',             // affiliate referral code
      custom_str3: partnerCode || '',              // reseller partner code
      custom_str4: companyName || '',              // company name
      custom_str5: paymentId,                      // internal tracking ID
    }

    // Build PayFast payment data
    // Using subscription (recurring) payment
    const paymentData: Record<string, string> = {
      merchant_id: PAYFAST_MERCHANT_ID,
      merchant_key: PAYFAST_MERCHANT_KEY,
      return_url: `${SITE_URL}/login?payment=success&tier=${tier}`,
      cancel_url: `${SITE_URL}/?payment=cancelled`,
      notify_url: `${SUPABASE_URL}/functions/v1/payfast-webhook`,
      name_first: firstName || '',
      name_last: lastName || '',
      email_address: email || '',  // PayFast will collect if empty
      m_payment_id: paymentId,
      amount: tierConfig.price.toFixed(2),
      item_name: `ISOGuardian ${tierConfig.name} Plan — Monthly Subscription`,
      item_description: `ISO compliance management platform. Up to ${tierConfig.maxUsers} users, ${tierConfig.storageGb}GB storage.`,
      // Recurring billing
      subscription_type: '1',        // 1 = subscription
      billing_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // First billing after 14-day trial
      recurring_amount: tierConfig.price.toFixed(2),
      frequency: '3',                // 3 = monthly
      cycles: '0',                   // 0 = indefinite
      // Custom fields
      ...customData,
    }

    // Generate signature
    paymentData.signature = await generateSignature(paymentData, PAYFAST_PASSPHRASE)

    // Build the redirect URL
    const formParams = Object.entries(paymentData)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join('&')

    const redirectUrl = `${PAYFAST_URL}?${formParams}`

    return new Response(JSON.stringify({
      success: true,
      redirectUrl,
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

// ISOGuardian — Self-Service Signup Edge Function
// Public endpoint: creates auth user + company + user profile + trial subscription
// No auth required — uses service role key internally

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { publicCorsHeaders } from '../_shared/cors.ts'

const TURNSTILE_SECRET = Deno.env.get('TURNSTILE_SECRET_KEY') || ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Rate limiting: 5 signups per IP per hour
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 3600_000 })
    return true
  }
  if (entry.count >= 5) return false
  entry.count++
  return true
}

// Block disposable/temporary email domains
const BLOCKED_EMAIL_DOMAINS = new Set([
  'tempmail.com', 'throwaway.email', 'guerrillamail.com', 'guerrillamail.de',
  'mailinator.com', 'yopmail.com', 'sharklasers.com', 'guerrillamailblock.com',
  'grr.la', 'dispostable.com', 'trashmail.com', 'trashmail.me', 'trashmail.net',
  'temp-mail.org', 'tempail.com', 'fakeinbox.com', 'mailnesia.com', 'maildrop.cc',
  'discard.email', 'mailcatch.com', 'mintemail.com', 'tmpmail.net', 'tmpmail.org',
  'boun.cr', 'mt2015.com', 'tmail.ws', '10minutemail.com', 'getnada.com',
  'mohmal.com', 'emailondeck.com', 'crazymailing.com', 'inboxbear.com',
  'mailsac.com', 'harakirimail.com', 'tempr.email', 'burnermail.io',
])

function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase()
  return BLOCKED_EMAIL_DOMAINS.has(domain)
}

// Password validation (mirrors client-side)
function validatePassword(pw: string): { valid: boolean; message: string } {
  if (pw.length < 12) return { valid: false, message: 'Password must be at least 12 characters' }
  if (!/[A-Z]/.test(pw)) return { valid: false, message: 'Password must include an uppercase letter' }
  if (!/[a-z]/.test(pw)) return { valid: false, message: 'Password must include a lowercase letter' }
  if (!/\d/.test(pw)) return { valid: false, message: 'Password must include a number' }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw)) return { valid: false, message: 'Password must include a special character' }
  return { valid: true, message: '' }
}

// Generate company code from name (first letter of each word, uppercase, max 4)
function generateCompanyCode(name: string): string {
  return name
    .split(/\s+/)
    .filter(w => w.length > 0)
    .map(w => w[0].toUpperCase())
    .join('')
    .slice(0, 4) || 'CO'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: publicCorsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...publicCorsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    // Rate limit by IP
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('cf-connecting-ip') || 'unknown'
    if (!checkRateLimit(clientIp)) {
      return new Response(JSON.stringify({ error: 'Too many signup attempts. Please try again later.' }), {
        status: 429, headers: { ...publicCorsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { firstName, lastName, email, companyName, password, captchaToken, referralCode, referralType } = await req.json()

    // Validate required fields
    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !companyName?.trim() || !password) {
      return new Response(JSON.stringify({ error: 'All fields are required.' }), {
        status: 400, headers: { ...publicCorsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return new Response(JSON.stringify({ error: 'Please enter a valid email address.' }), {
        status: 400, headers: { ...publicCorsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Block disposable email domains
    if (isDisposableEmail(email.trim())) {
      return new Response(JSON.stringify({ error: 'Please use a business or personal email address. Temporary email services are not accepted.' }), {
        status: 400, headers: { ...publicCorsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Validate password
    const pwCheck = validatePassword(password)
    if (!pwCheck.valid) {
      return new Response(JSON.stringify({ error: pwCheck.message }), {
        status: 400, headers: { ...publicCorsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify Turnstile CAPTCHA
    if (TURNSTILE_SECRET) {
      if (!captchaToken) {
        return new Response(JSON.stringify({ error: 'Please complete the CAPTCHA verification.' }), {
          status: 400, headers: { ...publicCorsHeaders, 'Content-Type': 'application/json' },
        })
      }
      const captchaRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${TURNSTILE_SECRET}&response=${captchaToken}&remoteip=${clientIp}`,
      })
      const captchaData = await captchaRes.json()
      if (!captchaData.success) {
        return new Response(JSON.stringify({ error: 'CAPTCHA verification failed. Please try again.' }), {
          status: 400, headers: { ...publicCorsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // Create admin client with service role
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Check for duplicate email
    const { data: emailCheck } = await adminClient
      .from('users')
      .select('id')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle()

    if (emailCheck) {
      return new Response(JSON.stringify({ error: 'An account with this email already exists. Please sign in instead.' }), {
        status: 409, headers: { ...publicCorsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check for duplicate company name (prevent trial abuse by re-registering)
    const { data: companyCheck } = await adminClient
      .from('companies')
      .select('id')
      .ilike('name', companyName.trim())
      .maybeSingle()

    if (companyCheck) {
      return new Response(JSON.stringify({ error: 'A company with this name already exists. Contact support@isoguardian.co.za if you need access.' }), {
        status: 409, headers: { ...publicCorsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Generate unique company code
    let companyCode = generateCompanyCode(companyName.trim())
    const { data: existingCodes } = await adminClient
      .from('companies')
      .select('company_code')
      .like('company_code', `${companyCode}%`)

    if (existingCodes?.some(c => c.company_code === companyCode)) {
      let suffix = 1
      while (existingCodes.some(c => c.company_code === `${companyCode}${suffix}`)) suffix++
      companyCode = `${companyCode}${suffix}`
    }

    // 1. Create company
    const { data: company, error: companyError } = await adminClient
      .from('companies')
      .insert({
        name: companyName.trim(),
        company_code: companyCode,
      })
      .select('id, company_code')
      .single()

    if (companyError) {
      return new Response(JSON.stringify({ error: 'Failed to create company. Please try again.' }), {
        status: 500, headers: { ...publicCorsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Create auth user (email_confirm: false → Supabase sends verification email)
    const fullName = `${firstName.trim()} ${lastName.trim()}`
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: false,
      user_metadata: { full_name: fullName, company_id: company.id },
    })

    if (authError) {
      // Rollback: delete company
      await adminClient.from('companies').delete().eq('id', company.id)
      const msg = authError.message?.includes('already been registered')
        ? 'An account with this email already exists.'
        : 'Failed to create account. Please try again.'
      return new Response(JSON.stringify({ error: msg }), {
        status: 400, headers: { ...publicCorsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Create user profile
    const { error: userError } = await adminClient
      .from('users')
      .insert({
        id: authData.user.id,
        email: email.trim().toLowerCase(),
        full_name: fullName,
        role: 'admin',
        company_id: company.id,
        is_active: true,
        standards_access: ['ISO_9001'],
        referred_by: referralCode || null,
      })

    if (userError) {
      // Rollback: delete auth user + company
      await adminClient.auth.admin.deleteUser(authData.user.id)
      await adminClient.from('companies').delete().eq('id', company.id)
      return new Response(JSON.stringify({ error: 'Failed to create user profile. Please try again.' }), {
        status: 500, headers: { ...publicCorsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 4. Create trial subscription (14 days)
    const now = new Date()
    const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
    const { error: subError } = await adminClient
      .from('subscriptions')
      .insert({
        company_id: company.id,
        plan: 'Starter',
        status: 'trial',
        current_period_start: now.toISOString().split('T')[0],
        current_period_end: trialEnd.toISOString().split('T')[0],
        trial_ends_at: trialEnd.toISOString(),
        trial_end_date: trialEnd.toISOString().split('T')[0],
        price_per_user: 200,
        users_count: 10,
      })

    if (subError) {
      // Rollback: delete user + auth user + company
      await adminClient.from('users').delete().eq('id', authData.user.id)
      await adminClient.auth.admin.deleteUser(authData.user.id)
      await adminClient.from('companies').delete().eq('id', company.id)
      return new Response(JSON.stringify({ error: 'Failed to create subscription. Please try again.' }), {
        status: 500, headers: { ...publicCorsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 5. Track referral if present
    if (referralCode && referralType) {
      await adminClient.from('referrals').insert({
        referral_code: referralCode,
        referral_type: referralType === 'partner' ? 'partner' : 'affiliate',
        referred_email: email.trim().toLowerCase(),
        referred_company_id: company.id,
        status: 'converted',
      }).catch(() => {}) // non-critical, don't fail signup
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Account created! Please check your email to verify your account, then sign in.',
      companyCode: company.company_code,
    }), {
      status: 200, headers: { ...publicCorsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('Signup error:', err)
    return new Response(JSON.stringify({ error: 'An unexpected error occurred. Please try again.' }), {
      status: 500, headers: { ...publicCorsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

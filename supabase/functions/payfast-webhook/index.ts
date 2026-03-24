// ISOGuardian — PayFast ITN (Instant Transaction Notification) Webhook
// Handles payment confirmations, subscription updates, referral credits,
// and reseller commission tracking
//
// PayFast sends POST requests here after every payment event.
// See: https://developers.payfast.co.za/docs#step-4-confirm-payment

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const PAYFAST_MERCHANT_ID = Deno.env.get('PAYFAST_MERCHANT_ID')!
const PAYFAST_PASSPHRASE = Deno.env.get('PAYFAST_PASSPHRASE') || ''
const PAYFAST_SANDBOX = Deno.env.get('PAYFAST_SANDBOX') === 'true'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''
const SITE_URL = 'https://isoguardian.co.za'

const PAYFAST_VALIDATE_URL = PAYFAST_SANDBOX
  ? 'https://sandbox.payfast.co.za/eng/query/validate'
  : 'https://www.payfast.co.za/eng/query/validate'

// Tier config (must match create-checkout)
const TIERS: Record<string, { maxUsers: number; storageGb: number; price: number }> = {
  starter: { maxUsers: 10, storageGb: 5, price: 2000 },
  growth:  { maxUsers: 20, storageGb: 15, price: 3700 },
}

// Reseller commission rate
const RESELLER_COMMISSION_RATE = 0.25 // 25%

// MD5 for PayFast signature verification
function md5(input: string): string {
  const bytes = new TextEncoder().encode(input)
  let a = 0x67452301, b = 0xefcdab89, c = 0x98badcfe, d = 0x10325476
  const k = new Uint32Array(64)
  const s = [7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,5,9,14,20,5,9,14,20,5,9,14,20,5,9,14,20,4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21]
  for (let i = 0; i < 64; i++) k[i] = Math.floor(2**32 * Math.abs(Math.sin(i + 1))) >>> 0

  const padded = new Uint8Array(((bytes.length + 8 >> 6) + 1) << 6)
  padded.set(bytes)
  padded[bytes.length] = 0x80
  const view = new DataView(padded.buffer)
  view.setUint32(padded.length - 8, (bytes.length * 8) & 0xffffffff, true)
  view.setUint32(padded.length - 4, (bytes.length * 8) >>> 32, true)

  for (let offset = 0; offset < padded.length; offset += 64) {
    const m = new Uint32Array(16)
    for (let j = 0; j < 16; j++) m[j] = view.getUint32(offset + j * 4, true)
    let aa = a, bb = b, cc = c, dd = d
    for (let i = 0; i < 64; i++) {
      let f: number, g: number
      if (i < 16) { f = (bb & cc) | (~bb & dd); g = i }
      else if (i < 32) { f = (dd & bb) | (~dd & cc); g = (5 * i + 1) % 16 }
      else if (i < 48) { f = bb ^ cc ^ dd; g = (3 * i + 5) % 16 }
      else { f = cc ^ (bb | ~dd); g = (7 * i) % 16 }
      f = (f + aa + k[i] + m[g]) >>> 0
      aa = dd; dd = cc; cc = bb
      bb = (bb + ((f << s[i]) | (f >>> (32 - s[i])))) >>> 0
    }
    a = (a + aa) >>> 0; b = (b + bb) >>> 0; c = (c + cc) >>> 0; d = (d + dd) >>> 0
  }

  const hex = (n: number) => Array.from(new Uint8Array(new Uint32Array([n]).buffer)).map(b => b.toString(16).padStart(2, '0')).join('')
  return hex(a) + hex(b) + hex(c) + hex(d)
}

// Verify PayFast signature
function verifySignature(data: Record<string, string>, passphrase: string): boolean {
  const receivedSig = data.signature
  if (!receivedSig) return false

  const params = Object.keys(data)
    .filter(key => key !== 'signature' && data[key] !== '')
    .sort()
    .map(key => `${key}=${encodeURIComponent(data[key]).replace(/%20/g, '+')}`)
    .join('&')

  const withPassphrase = passphrase ? `${params}&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, '+')}` : params
  const expectedSig = md5(withPassphrase)

  return receivedSig === expectedSig
}

// Validate ITN with PayFast server
async function validateWithPayFast(data: Record<string, string>): Promise<boolean> {
  const params = Object.keys(data)
    .filter(key => key !== 'signature')
    .map(key => `${key}=${encodeURIComponent(data[key])}`)
    .join('&')

  try {
    const res = await fetch(PAYFAST_VALIDATE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    })
    const text = await res.text()
    return text.trim() === 'VALID'
  } catch {
    console.error('PayFast validation request failed')
    return false
  }
}

// Generate invoice number
async function generateInvoiceNumber(supabase: any): Promise<string> {
  const { data } = await supabase.rpc('generate_invoice_number')
  return data || `IG-INV-${Date.now()}`
}

Deno.serve(async (req) => {
  // PayFast ITN is always POST, no CORS needed (server-to-server)
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    // Parse form-encoded ITN data
    const formData = await req.formData()
    const data: Record<string, string> = {}
    formData.forEach((value, key) => {
      data[key] = value.toString()
    })

    console.log('PayFast ITN received:', JSON.stringify({
      payment_status: data.payment_status,
      m_payment_id: data.m_payment_id,
      pf_payment_id: data.pf_payment_id,
      amount_gross: data.amount_gross,
      custom_str1: data.custom_str1,
    }))

    // Step 1: Verify signature
    if (!verifySignature(data, PAYFAST_PASSPHRASE)) {
      console.error('PayFast ITN: Invalid signature')
      return new Response('Invalid signature', { status: 403 })
    }

    // Step 2: Verify merchant ID
    if (data.merchant_id !== PAYFAST_MERCHANT_ID) {
      console.error('PayFast ITN: Merchant ID mismatch')
      return new Response('Invalid merchant', { status: 403 })
    }

    // Step 3: Validate with PayFast server
    const isValid = await validateWithPayFast(data)
    if (!isValid) {
      console.error('PayFast ITN: Server validation failed')
      return new Response('Validation failed', { status: 403 })
    }

    // Step 4: Process the payment
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    const paymentStatus = data.payment_status // COMPLETE, FAILED, PENDING, CANCELLED
    const paymentType = data.custom_str1 || 'starter' // 'template' for template purchases, tier name for subscriptions
    const payfastPaymentId = data.pf_payment_id
    const amount = parseFloat(data.amount_gross) || 0
    const billingEmail = data.email_address || ''

    // ─── Handle TEMPLATE one-time purchase ───
    if (paymentType === 'template' && paymentStatus === 'COMPLETE') {
      const templateId = data.custom_str2 || ''
      const buyerEmail = data.custom_str3 || billingEmail
      const buyerName = `${data.name_first || ''} ${data.name_last || ''}`.trim()

      // Record the purchase with a download token
      const { data: purchase } = await supabase
        .from('template_purchases')
        .insert({
          email: buyerEmail,
          template_id: templateId,
          amount,
          currency: 'ZAR',
          payfast_payment_id: payfastPaymentId,
          buyer_name: buyerName || null,
        })
        .select('id, download_token')
        .single()

      if (purchase) {
        const downloadUrl = `${SITE_URL}/templates?download=${purchase.download_token}`

        // Send download link via Resend
        if (RESEND_API_KEY && buyerEmail) {
          try {
            await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: 'ISOGuardian <noreply@isoguardian.co.za>',
                to: [buyerEmail],
                subject: `Your ISOGuardian Template: ${templateId.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}`,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0015; color: #fff; border-radius: 12px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #06b6d4, #8b5cf6); padding: 32px; text-align: center;">
                      <h1 style="margin: 0; font-size: 24px;">Your Template is Ready</h1>
                    </div>
                    <div style="padding: 32px;">
                      <p style="color: #cbd5e1;">Hi ${buyerName || 'there'},</p>
                      <p style="color: #cbd5e1;">Thank you for your purchase! Your template is ready to download.</p>
                      <div style="text-align: center; margin: 32px 0;">
                        <a href="${downloadUrl}" style="background: linear-gradient(135deg, #06b6d4, #8b5cf6); color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
                          Download Template
                        </a>
                      </div>
                      <p style="color: #94a3b8; font-size: 13px;">This link expires in 48 hours. If you need it re-sent, contact us at support@isoguardian.co.za.</p>
                      <hr style="border: none; border-top: 1px solid #1e293b; margin: 24px 0;" />
                      <p style="color: #94a3b8; font-size: 13px;">
                        Want all templates included free? <a href="${SITE_URL}/#pricing" style="color: #06b6d4;">Subscribe to ISOGuardian</a> and get access to every template plus live compliance tracking.
                      </p>
                    </div>
                    <div style="background: #1e1e2e; padding: 16px; text-align: center;">
                      <p style="color: #64748b; font-size: 11px; margin: 0;">ISOGuardian (Pty) Ltd | Reg: 2026/082362/07 | support@isoguardian.co.za</p>
                    </div>
                  </div>
                `,
              }),
            })
          } catch (emailErr) {
            console.error('Failed to send template download email:', emailErr)
          }
        }

        // Notify admin of template sale (lead capture)
        if (RESEND_API_KEY) {
          try {
            await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: 'ISOGuardian System <noreply@isoguardian.co.za>',
                to: ['support@isoguardian.co.za'],
                subject: `Template Sale: ${templateId} — R${amount.toFixed(2)}`,
                html: `
                  <h2>New Template Purchase</h2>
                  <p><strong>Template:</strong> ${templateId}</p>
                  <p><strong>Buyer:</strong> ${buyerName || 'Unknown'} (${buyerEmail})</p>
                  <p><strong>Amount:</strong> R${amount.toFixed(2)}</p>
                  <p><strong>PayFast ID:</strong> ${payfastPaymentId}</p>
                  <p><strong>Time:</strong> ${new Date().toISOString()}</p>
                  <hr />
                  <p><em>This is a potential lead for subscription upsell.</em></p>
                `,
              }),
            })
          } catch {
            // Non-critical — don't fail the webhook
          }
        }
      }

      console.log('Template purchase processed:', { templateId, buyerEmail, amount })
      return new Response('OK', { status: 200 })
    }

    // ─── Subscription payment processing ───
    const tier = paymentType.toLowerCase()
    const referralCode = data.custom_str2 || null
    const partnerCode = data.custom_str3 || null
    const companyName = data.custom_str4 || null
    const internalPaymentId = data.custom_str5 || null
    const payfastSubscriptionId = data.token || null // Subscription token for recurring

    const tierConfig = TIERS[tier] || TIERS.starter

    // Check for duplicate ITN (idempotency)
    const { data: existingPayment } = await supabase
      .from('payment_history')
      .select('id')
      .eq('payfast_payment_id', payfastPaymentId)
      .maybeSingle()

    if (existingPayment) {
      console.log('PayFast ITN: Duplicate payment, skipping:', payfastPaymentId)
      return new Response('OK', { status: 200 })
    }

    // Find or identify the company by email or payment ID
    let companyId: string | null = null
    let subscriptionId: string | null = null

    // First check if we have a subscription with this PayFast token
    if (payfastSubscriptionId) {
      const { data: existingSub } = await supabase
        .from('subscriptions')
        .select('id, company_id')
        .eq('payfast_subscription_id', payfastSubscriptionId)
        .maybeSingle()

      if (existingSub) {
        companyId = existingSub.company_id
        subscriptionId = existingSub.id
      }
    }

    // If not found by token, look up by billing email
    if (!companyId && billingEmail) {
      const { data: user } = await supabase
        .from('users')
        .select('company_id')
        .eq('email', billingEmail)
        .maybeSingle()

      if (user) {
        companyId = user.company_id
      }
    }

    // ─── Handle COMPLETE payment ───
    if (paymentStatus === 'COMPLETE') {

      if (companyId) {
        // Update or create subscription
        if (subscriptionId) {
          // Recurring payment — update existing subscription
          await supabase
            .from('subscriptions')
            .update({
              status: 'active',
              plan: tierConfig === TIERS.growth ? 'Growth' : 'Starter',
              price_per_user: amount / tierConfig.maxUsers,
              current_period_start: new Date().toISOString().split('T')[0],
              current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              grace_period_end: null,
              payfast_token: payfastSubscriptionId,
            })
            .eq('id', subscriptionId)
        } else {
          // First payment — create subscription with 14-day trial
          const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
          const { data: newSub } = await supabase
            .from('subscriptions')
            .insert({
              company_id: companyId,
              plan: tierConfig === TIERS.growth ? 'Growth' : 'Starter',
              status: 'trial',
              current_period_start: new Date().toISOString().split('T')[0],
              current_period_end: trialEnd.toISOString().split('T')[0],
              trial_ends_at: trialEnd.toISOString(),
              trial_end_date: trialEnd.toISOString().split('T')[0],
              price_per_user: amount / tierConfig.maxUsers,
              users_count: tierConfig.maxUsers,
              payfast_subscription_id: payfastSubscriptionId,
              payfast_token: payfastSubscriptionId,
              billing_email: billingEmail,
              payment_method: 'payfast',
              currency: 'ZAR',
              billing_cycle: 'monthly',
              referral_code: referralCode,
              partner_code: partnerCode,
              next_billing_date: trialEnd.toISOString().split('T')[0],
            })
            .select('id')
            .single()

          if (newSub) subscriptionId = newSub.id
        }

        // Record payment in history
        const { data: paymentRecord } = await supabase
          .from('payment_history')
          .insert({
            company_id: companyId,
            subscription_id: subscriptionId,
            payfast_payment_id: payfastPaymentId,
            amount,
            currency: 'ZAR',
            status: 'complete',
            payment_method: 'payfast',
            billing_email: billingEmail,
            description: `${tierConfig === TIERS.growth ? 'Growth' : 'Starter'} Plan — Monthly`,
            raw_itn: data,
          })
          .select('id')
          .single()

        // Generate invoice
        if (paymentRecord) {
          const invoiceNumber = await generateInvoiceNumber(supabase)
          const vatRate = 0.15 // SA VAT 15%
          const vatAmount = parseFloat((amount * vatRate / (1 + vatRate)).toFixed(2))
          const netAmount = parseFloat((amount - vatAmount).toFixed(2))

          await supabase
            .from('invoices')
            .insert({
              company_id: companyId,
              subscription_id: subscriptionId,
              payment_id: paymentRecord.id,
              invoice_number: invoiceNumber,
              amount: netAmount,
              vat_amount: vatAmount,
              total_amount: amount,
              currency: 'ZAR',
              status: 'paid',
              billing_email: billingEmail,
              billing_name: `${data.name_first || ''} ${data.name_last || ''}`.trim(),
              line_items: [{
                description: `ISOGuardian ${tierConfig === TIERS.growth ? 'Growth' : 'Starter'} Plan`,
                quantity: 1,
                unit_price: netAmount,
                vat: vatAmount,
                total: amount,
              }],
              issued_at: new Date().toISOString(),
              paid_at: new Date().toISOString(),
            })
        }

        // ─── Handle referral credit (affiliate: 1 month free) ───
        if (referralCode) {
          // Find the referral record
          const { data: referral } = await supabase
            .from('referrals')
            .select('id, referrer_id, referral_type, status')
            .eq('referrer_code', referralCode)
            .eq('status', 'signed_up')
            .maybeSingle()

          if (referral && referral.referral_type === 'affiliate') {
            // Credit the referrer: extend their subscription by 1 month
            const { data: referrerUser } = await supabase
              .from('users')
              .select('company_id')
              .eq('id', referral.referrer_id)
              .maybeSingle()

            if (referrerUser) {
              const { data: referrerSub } = await supabase
                .from('subscriptions')
                .select('id, end_date, next_billing_date')
                .eq('company_id', referrerUser.company_id)
                .in('status', ['active', 'trial'])
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle()

              if (referrerSub) {
                // Extend next billing date by 30 days (1 free month)
                const currentBilling = referrerSub.next_billing_date
                  ? new Date(referrerSub.next_billing_date)
                  : new Date()
                const newBilling = new Date(currentBilling.getTime() + 30 * 24 * 60 * 60 * 1000)

                await supabase
                  .from('subscriptions')
                  .update({ next_billing_date: newBilling.toISOString().split('T')[0] })
                  .eq('id', referrerSub.id)
              }
            }

            // Mark referral as converted + credited
            await supabase
              .from('referrals')
              .update({
                status: 'credited',
                credit_applied: true,
                converted_at: new Date().toISOString(),
              })
              .eq('id', referral.id)
          }
        }

        // ─── Handle reseller commission (partner: 25% recurring) ───
        if (partnerCode) {
          // Find the reseller by their company_code or referral_code
          const { data: resellerUser } = await supabase
            .from('users')
            .select('id, company_id')
            .eq('referral_code', partnerCode)
            .maybeSingle()

          if (resellerUser) {
            // Check if reseller relationship exists
            const { data: resellerRecord } = await supabase
              .from('resellers')
              .select('id, company_id')
              .eq('company_id', resellerUser.company_id)
              .maybeSingle()

            const resellerCompanyId = resellerRecord?.company_id || resellerUser.company_id
            const commissionAmount = parseFloat((amount * RESELLER_COMMISSION_RATE).toFixed(2))

            // Record commission
            await supabase
              .from('commissions')
              .insert({
                subscription_id: subscriptionId,
                payment_id: paymentRecord?.id,
                reseller_company_id: resellerCompanyId,
                client_company_id: companyId,
                amount: commissionAmount,
                percentage: RESELLER_COMMISSION_RATE * 100,
                status: 'pending',
                period_start: new Date().toISOString().split('T')[0],
                period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              })

            // Update referral status if exists
            const { data: partnerReferral } = await supabase
              .from('referrals')
              .select('id')
              .eq('referrer_code', partnerCode)
              .eq('referral_type', 'partner')
              .neq('status', 'credited')
              .maybeSingle()

            if (partnerReferral) {
              await supabase
                .from('referrals')
                .update({ status: 'converted', converted_at: new Date().toISOString() })
                .eq('id', partnerReferral.id)
            }

            // Ensure reseller-client link exists
            await supabase
              .from('reseller_clients')
              .upsert({
                company_id: resellerCompanyId,
                client_company_id: companyId,
              }, { onConflict: 'company_id,client_company_id' })
              .select()
          }
        }

        // Log activity
        await supabase
          .from('audit_log')
          .insert({
            company_id: companyId,
            action: 'payment_received',
            entity_type: 'subscription',
            entity_id: subscriptionId,
            changes: {
              amount,
              payment_id: payfastPaymentId,
              tier: tier,
              referral: referralCode || null,
              partner: partnerCode || null,
            },
          })
      }

    // ─── Handle FAILED payment ───
    } else if (paymentStatus === 'FAILED') {
      if (subscriptionId) {
        // Set grace period (7 days to resolve payment)
        const gracePeriodEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        await supabase
          .from('subscriptions')
          .update({
            status: 'past_due',
            grace_period_end: gracePeriodEnd.toISOString(),
          })
          .eq('id', subscriptionId)
      }

      // Record failed payment
      if (companyId) {
        await supabase
          .from('payment_history')
          .insert({
            company_id: companyId,
            subscription_id: subscriptionId,
            payfast_payment_id: payfastPaymentId,
            amount,
            currency: 'ZAR',
            status: 'failed',
            payment_method: 'payfast',
            billing_email: billingEmail,
            description: 'Payment failed',
            raw_itn: data,
          })
      }

    // ─── Handle CANCELLED subscription ───
    } else if (paymentStatus === 'CANCELLED') {
      if (subscriptionId) {
        await supabase
          .from('subscriptions')
          .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Access until period end
          })
          .eq('id', subscriptionId)
      }
    }

    // PayFast expects 200 OK to confirm receipt
    return new Response('OK', { status: 200 })

  } catch (err) {
    console.error('PayFast webhook error:', err)
    // Still return 200 to prevent PayFast retries on our errors
    // Log the error for debugging
    return new Response('OK', { status: 200 })
  }
})

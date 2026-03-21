// ISOGuardian — Subscription Management Edge Function
// Handles: status checks, grace period enforcement, trial expiry,
//          cancellation, and subscription details for the frontend

import { getCorsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const PAYFAST_SANDBOX = Deno.env.get('PAYFAST_SANDBOX') === 'true'

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify auth
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseAuth = createClient(SUPABASE_URL, authHeader.replace('Bearer ', ''))
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Get user's company
    const { data: userProfile } = await supabase
      .from('users')
      .select('company_id, role')
      .eq('id', user.id)
      .single()

    if (!userProfile?.company_id) {
      return new Response(JSON.stringify({ error: 'No company found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { action } = await req.json()

    // ─── GET STATUS ───
    if (action === 'status') {
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('id, plan, status, current_period_start, current_period_end, trial_ends_at, trial_end_date, grace_period_end, next_billing_date, users_count, cancelled_at, billing_email, payment_method, total_amount, referral_code, partner_code')
        .eq('company_id', userProfile.company_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!subscription) {
        return new Response(JSON.stringify({
          subscription: null,
          access: { allowed: false, reason: 'no_subscription' },
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Evaluate current access status
      const now = new Date()
      let allowed = false
      let reason = ''
      let daysRemaining: number | null = null

      switch (subscription.status) {
        case 'active':
          allowed = true
          reason = 'active'
          break

        case 'trial': {
          const trialEnd = subscription.trial_ends_at || subscription.trial_end_date
          if (trialEnd && new Date(trialEnd) > now) {
            allowed = true
            reason = 'trial'
            daysRemaining = Math.ceil((new Date(trialEnd).getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
          } else {
            // Trial expired — check if they started paying
            allowed = false
            reason = 'trial_expired'
            // Auto-update status
            await supabase
              .from('subscriptions')
              .update({ status: 'expired' })
              .eq('id', subscription.id)
              .eq('status', 'trial')
          }
          break
        }
        case 'past_due':
          if (subscription.grace_period_end && new Date(subscription.grace_period_end) > now) {
            allowed = true
            reason = 'past_due_grace'
            daysRemaining = Math.ceil((new Date(subscription.grace_period_end).getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
          } else {
            allowed = false
            reason = 'past_due_expired'
            // Auto-update status
            await supabase
              .from('subscriptions')
              .update({ status: 'expired' })
              .eq('id', subscription.id)
              .eq('status', 'past_due')
          }
          break

        case 'cancelled':
          // Access until current_period_end (period they already paid for)
          if (subscription.current_period_end && new Date(subscription.current_period_end) > now) {
            allowed = true
            reason = 'cancelled_active_period'
            daysRemaining = Math.ceil((new Date(subscription.current_period_end).getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
          } else {
            allowed = false
            reason = 'cancelled'
          }
          break

        case 'expired':
        default:
          allowed = false
          reason = 'expired'
          break
      }

      return new Response(JSON.stringify({
        subscription: {
          id: subscription.id,
          tier: subscription.plan,
          status: subscription.status,
          startDate: subscription.current_period_start,
          trialEndsAt: subscription.trial_ends_at || subscription.trial_end_date,
          nextBillingDate: subscription.next_billing_date,
          maxUsers: subscription.users_count,
          price: subscription.total_amount,
          billingEmail: subscription.billing_email,
          cancelledAt: subscription.cancelled_at,
        },
        access: { allowed, reason, daysRemaining },
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ─── GET PAYMENT HISTORY ───
    if (action === 'payments') {
      const { data: payments } = await supabase
        .from('payment_history')
        .select('id, amount, currency, status, payment_method, description, created_at')
        .eq('company_id', userProfile.company_id)
        .order('created_at', { ascending: false })
        .limit(50)

      return new Response(JSON.stringify({ payments: payments || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ─── GET INVOICES ───
    if (action === 'invoices') {
      const { data: invoices } = await supabase
        .from('invoices')
        .select('id, invoice_number, amount, vat_amount, total_amount, currency, status, billing_name, billing_email, line_items, issued_at, paid_at')
        .eq('company_id', userProfile.company_id)
        .order('issued_at', { ascending: false })
        .limit(50)

      return new Response(JSON.stringify({ invoices: invoices || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ─── CANCEL SUBSCRIPTION ───
    if (action === 'cancel') {
      // Only admin+ can cancel
      if (!['super_admin', 'admin'].includes(userProfile.role)) {
        return new Response(JSON.stringify({ error: 'Only admins can cancel subscriptions' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('id, status, payfast_token, next_billing_date')
        .eq('company_id', userProfile.company_id)
        .in('status', ['active', 'trial', 'past_due'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!subscription) {
        return new Response(JSON.stringify({ error: 'No active subscription to cancel' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Cancel with PayFast if we have a token
      if (subscription.payfast_token) {
        try {
          const cancelUrl = PAYFAST_SANDBOX
            ? `https://sandbox.payfast.co.za/eng/recurring/update/${subscription.payfast_token}`
            : `https://www.payfast.co.za/eng/recurring/update/${subscription.payfast_token}`

          await fetch(cancelUrl, {
            method: 'PUT',
            headers: {
              'merchant-id': Deno.env.get('PAYFAST_MERCHANT_ID')!,
              'version': 'v1',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: 'CANCELLED' }),
          })
        } catch (err) {
          console.error('PayFast cancel request failed:', err)
          // Continue with local cancellation even if PayFast API fails
        }
      }

      // Access until end of current billing period
      const endDate = subscription.next_billing_date
        ? new Date(subscription.next_billing_date)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

      await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          current_period_end: endDate.toISOString().split('T')[0],
        })
        .eq('id', subscription.id)

      // Log cancellation
      await supabase
        .from('audit_log')
        .insert({
          company_id: userProfile.company_id,
          user_id: user.id,
          action: 'subscription_cancelled',
          entity_type: 'subscription',
          entity_id: subscription.id,
        })

      return new Response(JSON.stringify({
        success: true,
        accessUntil: endDate.toISOString(),
        message: `Subscription cancelled. You have access until ${endDate.toLocaleDateString('en-ZA')}.`,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('manage-subscription error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Template content is embedded in this Edge Function — never exposed to the frontend
// This is the single source of truth for template IP
import { TEMPLATE_CONTENT } from './templateContent.ts'

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Only POST allowed
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Extract auth token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create Supabase client with user's token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    // Verify user
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get request body
    const { templateId, action } = await req.json()

    if (!templateId || !action) {
      return new Response(JSON.stringify({ error: 'Missing templateId or action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Use service role for subscription check and logging
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Get user profile + company
    const { data: userProfile } = await supabaseAdmin
      .from('users')
      .select('id, company_id, full_name, email, role')
      .eq('id', user.id)
      .maybeSingle()

    if (!userProfile?.company_id) {
      return new Response(JSON.stringify({ error: 'No company associated with this account' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check subscription status
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('status, plan, trial_ends_at')
      .eq('company_id', userProfile.company_id)
      .maybeSingle()

    const now = new Date()
    const isActive = subscription && (
      subscription.status === 'active' ||
      (subscription.status === 'trial' && new Date(subscription.trial_ends_at) > now)
    )
    // Super admins always have access
    const isSuperAdmin = userProfile.role === 'super_admin'

    if (!isActive && !isSuperAdmin) {
      return new Response(JSON.stringify({
        error: 'subscription_required',
        message: 'An active subscription is required to download templates.',
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ─── ACTION: Get template content ───
    if (action === 'get_content') {
      const content = TEMPLATE_CONTENT[templateId]
      if (!content) {
        return new Response(JSON.stringify({ error: 'Template not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Log the download
      try {
        await supabaseAdmin.from('template_purchases').insert({
          user_id: user.id,
          company_id: userProfile.company_id,
          template_id: templateId,
          price_paid_zar: 0,
          payment_method: 'subscriber',
        })
      } catch (_e) {
        // Don't block download if logging fails
      }

      return new Response(JSON.stringify({ content }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ─── ACTION: Get bundle content (multiple templates) ───
    if (action === 'get_bundle') {
      const { templateIds } = await req.json().catch(() => ({ templateIds: [] }))
      const bundleIds: string[] = templateIds || []

      const contents: Record<string, any> = {}
      for (const id of bundleIds) {
        if (TEMPLATE_CONTENT[id]) {
          contents[id] = TEMPLATE_CONTENT[id]
        }
      }

      // Log bundle download
      try {
        const inserts = bundleIds
          .filter((id: string) => TEMPLATE_CONTENT[id])
          .map((id: string) => ({
            user_id: user.id,
            company_id: userProfile.company_id,
            template_id: id,
            price_paid_zar: 0,
            payment_method: 'subscriber',
          }))
        if (inserts.length > 0) {
          await supabaseAdmin.from('template_purchases').insert(inserts)
        }
      } catch (_e) { /* don't block */ }

      return new Response(JSON.stringify({ contents }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

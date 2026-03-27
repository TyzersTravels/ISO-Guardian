// Shared drip campaign enrollment utility
// Used by notify-lead (assessment/consultation) and signup flow (trial)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface EnrollOptions {
  campaignSlug: string
  email: string
  name: string
  personalization?: Record<string, string | number | boolean>
}

/**
 * Enroll a contact into a drip campaign.
 * - Checks unsubscribe status (POPIA compliance)
 * - Prevents duplicate enrollment
 * - Creates queue entries for all campaign steps with scheduled_at dates
 */
export async function enrollInDrip(
  supabase: ReturnType<typeof createClient>,
  { campaignSlug, email, name, personalization = {} }: EnrollOptions
): Promise<{ success: boolean; error?: string; queued?: number }> {
  try {
    // 1. Check if email has unsubscribed
    const { data: unsub } = await supabase
      .from('drip_unsubscribes')
      .select('is_unsubscribed')
      .eq('email', email.toLowerCase())
      .maybeSingle()

    if (unsub?.is_unsubscribed) {
      return { success: false, error: 'Email has unsubscribed from drip campaigns' }
    }

    // 2. Get the campaign definition
    const { data: campaign, error: campaignError } = await supabase
      .from('drip_campaigns')
      .select('id, emails, is_active')
      .eq('slug', campaignSlug)
      .maybeSingle()

    if (campaignError || !campaign) {
      return { success: false, error: `Campaign not found: ${campaignSlug}` }
    }

    if (!campaign.is_active) {
      return { success: false, error: `Campaign is inactive: ${campaignSlug}` }
    }

    const emails = campaign.emails as Array<{
      step: number
      delay_days: number
      subject: string
      body: string
    }>

    if (!emails || emails.length === 0) {
      return { success: false, error: 'Campaign has no email steps' }
    }

    // 3. Check for existing enrollment (prevent duplicates)
    const { count: existingCount } = await supabase
      .from('drip_queue')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', campaign.id)
      .eq('recipient_email', email.toLowerCase())

    if (existingCount && existingCount > 0) {
      return { success: false, error: 'Already enrolled in this campaign' }
    }

    // 4. Create or get unsubscribe record (for POPIA link generation)
    const { data: unsubRecord } = await supabase
      .from('drip_unsubscribes')
      .upsert(
        { email: email.toLowerCase(), is_unsubscribed: false },
        { onConflict: 'email' }
      )
      .select('token')
      .single()

    // 5. Create queue entries for each step
    const now = new Date()
    const queueEntries = emails.map((emailStep) => {
      const scheduledAt = new Date(now)
      scheduledAt.setDate(scheduledAt.getDate() + emailStep.delay_days)
      // Schedule for 07:00 SAST (05:00 UTC)
      scheduledAt.setUTCHours(5, 0, 0, 0)
      // If delay_days is 0, send within the hour (don't wait for next morning)
      if (emailStep.delay_days === 0) {
        scheduledAt.setTime(now.getTime() + 5 * 60 * 1000) // 5 minutes from now
      }

      return {
        campaign_id: campaign.id,
        recipient_email: email.toLowerCase(),
        recipient_name: name,
        step: emailStep.step,
        scheduled_at: scheduledAt.toISOString(),
        status: 'pending',
        personalization: {
          ...personalization,
          unsubscribe_token: unsubRecord?.token || '',
        },
      }
    })

    const { error: insertError } = await supabase
      .from('drip_queue')
      .insert(queueEntries)

    if (insertError) {
      // Unique constraint violation = already enrolled (race condition safe)
      if (insertError.code === '23505') {
        return { success: false, error: 'Already enrolled in this campaign' }
      }
      return { success: false, error: insertError.message }
    }

    return { success: true, queued: queueEntries.length }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

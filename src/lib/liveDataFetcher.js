/**
 * ISOGuardian Live Data Fetcher
 *
 * Fetches company-scoped data from Supabase for template auto-population.
 * All queries run in parallel via Promise.all and are scoped to companyId
 * for multi-tenant data isolation (defence-in-depth alongside RLS).
 */

import { supabase } from './supabase'

/**
 * Fetch all live data for template population in a single batch.
 * @param {string} companyId — from getEffectiveCompanyId()
 * @returns {Promise<object>} structured live data or empty defaults on failure
 */
export async function fetchLiveData(companyId) {
  if (!companyId) return null

  try {
    const [
      complianceRes,
      ncrsRes,
      auditsRes,
      documentsRes,
      reviewsRes,
      usersRes,
    ] = await Promise.all([
      // 1. Compliance requirements
      supabase
        .from('compliance_requirements')
        .select('clause_number, clause_name, compliance_status, notes, standard, last_reviewed')
        .eq('company_id', companyId)
        .order('clause_number'),

      // 2. NCRs
      supabase
        .from('ncrs')
        .select('ncr_number, title, description, standard, clause, severity, status, date_opened, due_date, root_cause, corrective_action, date_closed')
        .eq('company_id', companyId)
        .order('date_opened', { ascending: false }),

      // 3. Audits
      supabase
        .from('audits')
        .select('audit_number, audit_type, standard, scope, audit_date, assigned_auditor_name, status, findings, observations, ncrs_raised, conclusion')
        .eq('company_id', companyId)
        .order('audit_date', { ascending: false }),

      // 4. Documents (company_id is TEXT on this table)
      supabase
        .from('documents')
        .select('name, standard, clause, type, version, status, next_review_date, created_at')
        .eq('company_id', String(companyId))
        .eq('archived', false)
        .order('name'),

      // 5. Management reviews
      supabase
        .from('management_reviews')
        .select('review_number, review_date, chairperson, attendees, minutes, decisions_made, action_items, next_review_date')
        .eq('company_id', companyId)
        .order('review_date', { ascending: false })
        .limit(5),

      // 6. Users
      supabase
        .from('users')
        .select('full_name, email, role, is_active')
        .eq('company_id', companyId)
        .eq('is_active', true),
    ])

    // ─── Post-process compliance ───
    const allCompliance = complianceRes.data || []
    const compliance = {}
    const complianceScores = {}

    for (const std of ['ISO_9001', 'ISO_14001', 'ISO_45001']) {
      const items = allCompliance.filter(c => c.standard === std)
      compliance[std] = items

      const total = items.length
      const met = items.filter(c => c.compliance_status === 'Met').length
      const partiallyMet = items.filter(c => c.compliance_status === 'Partially Met').length
      const notMet = items.filter(c => c.compliance_status === 'Not Met').length
      const score = total > 0 ? Math.round(((met + partiallyMet * 0.5) / total) * 100) : 0

      complianceScores[std] = { total, met, partiallyMet, notMet, score }
    }

    // ─── Post-process NCRs ───
    const allNCRs = ncrsRes.data || []
    const today = new Date().toISOString().split('T')[0]
    const openNCRs = allNCRs.filter(n => n.status !== 'Closed')
    const closedNCRs = allNCRs.filter(n => n.status === 'Closed')
    const overdueNCRs = openNCRs.filter(n => n.due_date && n.due_date < today)

    const ncrs = {
      open: openNCRs.slice(0, 20),
      recentClosed: closedNCRs.slice(0, 5),
      totalOpen: openNCRs.length,
      totalClosed: closedNCRs.length,
      overdue: overdueNCRs.length,
    }

    // ─── Post-process audits ───
    const allAudits = auditsRes.data || []
    const completedAudits = allAudits.filter(a => a.status === 'Completed' || a.status === 'Complete')
    const upcomingAudits = allAudits.filter(a => a.audit_date && a.audit_date >= today && a.status !== 'Completed' && a.status !== 'Complete')

    const audits = {
      latest: completedAudits[0] || allAudits[0] || null,
      upcoming: upcomingAudits.slice(0, 5),
      completed: completedAudits.length,
    }

    // ─── Post-process documents ───
    const allDocs = documentsRes.data || []
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const reviewDue = allDocs.filter(d => d.next_review_date && d.next_review_date <= thirtyDaysFromNow && d.next_review_date >= today)

    const documents = {
      controlled: allDocs,
      totalCount: allDocs.length,
      reviewDue,
    }

    // ─── Post-process management reviews ───
    const allReviews = reviewsRes.data || []
    const managementReviews = {
      latest: allReviews[0] || null,
      totalCount: allReviews.length,
    }

    // ─── Post-process users ───
    const allUsers = usersRes.data || []
    const auditorUsers = allUsers.filter(u => u.role === 'lead_auditor' || u.role === 'super_admin')

    const users = {
      active: allUsers,
      auditors: auditorUsers,
      totalActive: allUsers.length,
    }

    return {
      compliance,
      complianceScores,
      ncrs,
      audits,
      documents,
      managementReviews,
      users,
      fetchedAt: new Date().toISOString(),
    }
  } catch (_e) {
    // Graceful degradation — templates still work without live data
    return null
  }
}

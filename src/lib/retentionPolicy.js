// Document retention policy helpers
// Matches supabase/migrations/20260424120000_document_retention_policy.sql
// ISO 9001 §7.5.3, ISO 14001 §7.5.3, ISO 45001 §7.5.3, SA OHS Act s24, POPIA s14

export const RETENTION_POLICIES = {
  standard_3y:        { label: '3 years after supersession',   years: 3,  basis: 'ISO §7.5.3 default' },
  standard_5y:        { label: '5 years after supersession',   years: 5,  basis: 'ISO §7.5.3 extended' },
  standard_7y:        { label: '7 years after supersession',   years: 7,  basis: 'SARS / Companies Act' },
  ohs_incident:       { label: '7 years after supersession',   years: 7,  basis: 'SA OHS Act s24 (extended)' },
  employment_plus_5y: { label: 'Employment + 5 years',         years: null, basis: 'BCEA + ISO 9001 §7.2 (manual date)' },
  medical_40y:        { label: '40 years after supersession',  years: 40, basis: 'SA OHS hazardous exposure regs' },
  indefinite:         { label: 'Indefinite (never auto-expire)', years: null, basis: 'Certificates / contracts / legal' },
  no_retention:       { label: 'No retention required',        years: 0,  basis: 'Blank template form' },
}

// Infer the default retention policy for a new document, matching
// the CASE expression in the DB migration's backfill logic exactly.
export function inferRetentionPolicy({ type, clause, standard }) {
  const std = (standard || '').toLowerCase()
  const cl = typeof clause === 'string' ? parseInt(clause, 10) : clause

  if (type === 'Manual')            return 'standard_5y'
  if (type === 'Policy')            return 'standard_5y'
  if (type === 'Procedure')         return 'standard_3y'
  if (type === 'Work Instruction')  return 'standard_3y'
  if (type === 'Form')              return 'no_retention'
  if (type === 'Certificate')       return 'indefinite'

  if (type === 'Record') {
    if (cl === 7 && std.includes('9001'))  return 'employment_plus_5y'
    if (cl === 9)                          return 'standard_5y'
    if (cl === 10)                         return 'standard_3y'
    if (cl === 6 && std.includes('45001')) return 'ohs_incident'
  }

  if (type === 'Register') {
    if (cl === 6 && std.includes('14001')) return 'standard_5y'
  }

  return 'standard_3y'
}

// User-facing short badge text for a doc card
export function retentionBadge(doc) {
  const policy = RETENTION_POLICIES[doc.retention_policy]
  if (!policy) return null
  if (doc.retention_until) {
    const until = new Date(doc.retention_until).toLocaleDateString('en-ZA')
    return `Retained until ${until}`
  }
  if (doc.retention_policy === 'indefinite') return 'Retained (indefinite)'
  if (doc.retention_policy === 'no_retention') return 'No retention'
  return policy.label
}

// Policies that require a manually-set retention_until date (the trigger
// cannot compute these automatically because the duration depends on
// real-world events, e.g. employment end).
const MANUAL_DATE_POLICIES = new Set(['employment_plus_5y'])

// Is this document currently locked against permanent deletion?
// Returns { blocked: bool, reason: string | null, until: Date | null, requiresManualDate: bool }
export function retentionStatus(doc) {
  if (!doc.retention_policy) return { blocked: false, reason: null, until: null, requiresManualDate: false }
  const policy = RETENTION_POLICIES[doc.retention_policy]
  if (!policy) return { blocked: false, reason: null, until: null, requiresManualDate: false }

  // Indefinite retention always blocks
  if (doc.retention_policy === 'indefinite') {
    return {
      blocked: true,
      reason: `This document is under indefinite retention (${policy.basis}).`,
      until: null,
      requiresManualDate: false,
    }
  }

  // Manual-date policy with no date set → BLOCK until someone records the date.
  // This prevents retention-dodging ("I never set the date, so I can delete freely").
  if (MANUAL_DATE_POLICIES.has(doc.retention_policy) && !doc.retention_until) {
    return {
      blocked: true,
      reason: `Retention-end date not yet recorded for this ${policy.label} policy (${policy.basis}). Set the retention-end date before deletion is permitted.`,
      until: null,
      requiresManualDate: true,
    }
  }

  // Active doc, no_retention, or trigger hasn't fired → allow (archive first)
  if (!doc.retention_until) {
    return { blocked: false, reason: null, until: null, requiresManualDate: false }
  }

  const until = new Date(doc.retention_until)
  const now = new Date()
  if (until > now) {
    return {
      blocked: true,
      reason: `Document is retained until ${until.toLocaleDateString('en-ZA')} (${policy.basis}).`,
      until,
      requiresManualDate: false,
    }
  }

  return { blocked: false, reason: null, until, requiresManualDate: false }
}

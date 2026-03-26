// ISOGuardian Template Marketplace — Template Metadata & Cross-Reference Network
// Each template has structured sections that get rendered into branded PDFs
//
// Placeholders (auto-populated at PDF generation):
//   {{COMPANY}}           — Company name
//   {{CODE}}              — Company code (e.g., SH)
//   {{DATE}}              — Current date
//   {{STANDARD}}          — ISO standard name
//   {{PREPARED_BY}}       — User who downloaded
//   {{MD_NAME}}           — Managing Director name
//   {{MD_TITLE}}          — Managing Director title
//   {{MR_NAME}}           — Management Representative name
//   {{MR_TITLE}}          — Management Representative title
//   {{QM_NAME}}           — Quality Manager name
//   {{QM_TITLE}}          — Quality Manager title
//   {{DC_NAME}}           — Document Controller name
//   {{DC_TITLE}}          — Document Controller title
//   {{IAL_NAME}}          — Internal Audit Lead name
//   {{IAL_TITLE}}         — Internal Audit Lead title
//   {{SO_NAME}}           — Safety Officer name
//   {{SO_TITLE}}          — Safety Officer title
//   {{EO_NAME}}           — Environmental Officer name
//   {{EO_TITLE}}          — Environmental Officer title
//   {{HR_NAME}}           — HR Manager name
//   {{HR_TITLE}}          — HR Manager title
//   {{PRODUCTS_SERVICES}} — Company products/services description
//   {{QMS_SCOPE}}         — QMS scope statement
//   {{QUALITY_POLICY}}    — Quality policy text
//
// Cross-reference placeholders (resolved to actual doc numbers):
//   {{REF:doc-control-proc}}     → IG-SH-SOP-001
//   {{REF:internal-audit-proc}}  → IG-SH-SOP-002
//   etc.

// Trial users can download up to TRIAL_DOWNLOAD_LIMIT templates marked with trialAccess: true
// Only lower-value forms are trial-eligible — procedures, manuals, registers, and bundles require a paid subscription
export const TRIAL_DOWNLOAD_LIMIT = 3

export const TEMPLATE_CATEGORIES = [
  { id: 'manuals', name: 'Quality Manuals', slug: 'manuals', icon: 'book', sort_order: 1, description: 'Complete management system manuals for ISO certification' },
  { id: 'procedures', name: 'Procedures', slug: 'procedures', icon: 'clipboard', sort_order: 2, description: 'Standard operating procedures required by ISO standards' },
  { id: 'forms', name: 'Forms & Records', slug: 'forms', icon: 'document', sort_order: 3, description: 'Pre-built forms, checklists, and record templates' },
  { id: 'registers', name: 'Registers', slug: 'registers', icon: 'table', sort_order: 4, description: 'Risk registers, aspects registers, and tracking logs' },
  { id: 'starter-packs', name: 'Starter Packs', slug: 'starter-packs', icon: 'package', sort_order: 5, description: 'Complete documentation bundles to build your system from scratch' },
]

// ═══════════════════════════════════════════════════════════════
// DOCUMENT NUMBERING MAP
// Each template has a fixed doc number format that cross-references use
// ═══════════════════════════════════════════════════════════════
export const DOC_NUMBER_MAP = {
  'qms-manual':              'IG-{{CODE}}-QMS-001',
  'doc-control-proc':        'IG-{{CODE}}-SOP-001',
  'internal-audit-proc':     'IG-{{CODE}}-SOP-002',
  'corrective-action-proc':  'IG-{{CODE}}-SOP-003',
  'management-review-proc':  'IG-{{CODE}}-SOP-004',
  'env-management-proc':     'IG-{{CODE}}-SOP-005',
  'hazard-identification-proc': 'IG-{{CODE}}-SOP-006',
  'ncr-form':                'IG-{{CODE}}-FRM-001',
  'audit-checklist':         'IG-{{CODE}}-FRM-002',
  'training-record-form':    'IG-{{CODE}}-FRM-003',
  'supplier-eval-form':      'IG-{{CODE}}-FRM-004',
  'risk-register':           'IG-{{CODE}}-REG-001',
  'env-aspects-register':    'IG-{{CODE}}-REG-002',
  'env-policy':              'IG-{{CODE}}-POL-002',
  'env-legal-register':      'IG-{{CODE}}-REG-003',
  'waste-management-proc':   'IG-{{CODE}}-SOP-007',
  'emergency-preparedness-env': 'IG-{{CODE}}-SOP-008',
  'env-objectives-register': 'IG-{{CODE}}-REG-004',
  'ohs-policy':              'IG-{{CODE}}-POL-003',
  'incident-investigation-proc': 'IG-{{CODE}}-SOP-009',
  'safety-inspection-checklist': 'IG-{{CODE}}-FRM-005',
  'emergency-response-ohs':  'IG-{{CODE}}-SOP-010',
  'ppe-register':            'IG-{{CODE}}-REG-005',
  'legal-appointments-register': 'IG-{{CODE}}-REG-006',
}

// ═══════════════════════════════════════════════════════════════
// CROSS-REFERENCE MAP — which templates reference which others
// Used for building the "Related Documents" section in each PDF
// ═══════════════════════════════════════════════════════════════
export const CROSS_REFERENCES = {
  'qms-manual': {
    references: ['doc-control-proc', 'internal-audit-proc', 'corrective-action-proc', 'management-review-proc', 'risk-register', 'ncr-form', 'audit-checklist', 'training-record-form', 'supplier-eval-form'],
    referencedBy: [],
  },
  'doc-control-proc': {
    references: ['ncr-form', 'training-record-form'],
    referencedBy: ['qms-manual', 'internal-audit-proc', 'corrective-action-proc', 'management-review-proc'],
  },
  'internal-audit-proc': {
    references: ['audit-checklist', 'ncr-form', 'corrective-action-proc', 'doc-control-proc'],
    referencedBy: ['qms-manual', 'management-review-proc'],
  },
  'corrective-action-proc': {
    references: ['ncr-form', 'doc-control-proc', 'risk-register'],
    referencedBy: ['qms-manual', 'internal-audit-proc', 'management-review-proc'],
  },
  'management-review-proc': {
    references: ['internal-audit-proc', 'corrective-action-proc', 'risk-register', 'doc-control-proc', 'training-record-form', 'supplier-eval-form'],
    referencedBy: ['qms-manual'],
  },
  'env-management-proc': {
    references: ['env-aspects-register', 'risk-register', 'ncr-form', 'env-legal-register'],
    referencedBy: ['env-policy'],
  },
  'hazard-identification-proc': {
    references: ['risk-register', 'ncr-form', 'training-record-form', 'ppe-register'],
    referencedBy: ['ohs-policy', 'incident-investigation-proc'],
  },
  'ncr-form': {
    references: ['corrective-action-proc'],
    referencedBy: ['qms-manual', 'internal-audit-proc', 'corrective-action-proc', 'env-management-proc', 'hazard-identification-proc'],
  },
  'audit-checklist': {
    references: ['internal-audit-proc', 'ncr-form'],
    referencedBy: ['qms-manual', 'internal-audit-proc'],
  },
  'training-record-form': {
    references: [],
    referencedBy: ['qms-manual', 'doc-control-proc', 'management-review-proc', 'hazard-identification-proc'],
  },
  'supplier-eval-form': {
    references: [],
    referencedBy: ['qms-manual', 'management-review-proc'],
  },
  'risk-register': {
    references: [],
    referencedBy: ['qms-manual', 'corrective-action-proc', 'env-management-proc', 'hazard-identification-proc', 'management-review-proc'],
  },
  'env-aspects-register': {
    references: ['env-management-proc'],
    referencedBy: ['env-management-proc', 'env-policy'],
  },
  'env-policy': {
    references: ['env-management-proc', 'env-aspects-register', 'env-legal-register', 'env-objectives-register'],
    referencedBy: [],
  },
  'env-legal-register': {
    references: ['env-management-proc'],
    referencedBy: ['env-policy', 'env-management-proc'],
  },
  'waste-management-proc': {
    references: ['env-aspects-register', 'env-legal-register', 'ncr-form'],
    referencedBy: ['env-policy'],
  },
  'emergency-preparedness-env': {
    references: ['env-aspects-register', 'risk-register', 'ncr-form'],
    referencedBy: ['env-policy'],
  },
  'env-objectives-register': {
    references: ['env-aspects-register', 'env-management-proc'],
    referencedBy: ['env-policy'],
  },
  'ohs-policy': {
    references: ['hazard-identification-proc', 'incident-investigation-proc', 'ppe-register', 'legal-appointments-register'],
    referencedBy: [],
  },
  'incident-investigation-proc': {
    references: ['ncr-form', 'hazard-identification-proc', 'corrective-action-proc'],
    referencedBy: ['ohs-policy'],
  },
  'safety-inspection-checklist': {
    references: ['hazard-identification-proc', 'ncr-form', 'ppe-register'],
    referencedBy: ['ohs-policy'],
  },
  'emergency-response-ohs': {
    references: ['hazard-identification-proc', 'risk-register', 'training-record-form'],
    referencedBy: ['ohs-policy'],
  },
  'ppe-register': {
    references: ['hazard-identification-proc'],
    referencedBy: ['ohs-policy', 'safety-inspection-checklist'],
  },
  'legal-appointments-register': {
    references: [],
    referencedBy: ['ohs-policy'],
  },
}

// ═══════════════════════════════════════════════════════════════
// PERSONNEL ROLES — key personnel positions for ISO documentation
// Stored in companies.key_personnel JSONB column
// ═══════════════════════════════════════════════════════════════
export const PERSONNEL_ROLES = [
  { key: 'managing_director', label: 'Managing Director / CEO', placeholder: '{{MD_NAME}}', titlePlaceholder: '{{MD_TITLE}}', required: true, description: 'Top management with overall QMS accountability' },
  { key: 'management_rep', label: 'Management Representative', placeholder: '{{MR_NAME}}', titlePlaceholder: '{{MR_TITLE}}', required: true, description: 'Day-to-day QMS oversight, reports to top management' },
  { key: 'quality_manager', label: 'Quality Manager', placeholder: '{{QM_NAME}}', titlePlaceholder: '{{QM_TITLE}}', required: true, description: 'Quality system coordination, NCR management' },
  { key: 'document_controller', label: 'Document Controller', placeholder: '{{DC_NAME}}', titlePlaceholder: '{{DC_TITLE}}', required: false, description: 'Document creation, review, distribution, and control' },
  { key: 'internal_audit_lead', label: 'Internal Audit Lead', placeholder: '{{IAL_NAME}}', titlePlaceholder: '{{IAL_TITLE}}', required: false, description: 'Audit programme planning, auditor assignment' },
  { key: 'safety_officer', label: 'Safety Officer (OH&S)', placeholder: '{{SO_NAME}}', titlePlaceholder: '{{SO_TITLE}}', required: false, description: 'ISO 45001 — workplace safety, hazard identification' },
  { key: 'environmental_officer', label: 'Environmental Officer', placeholder: '{{EO_NAME}}', titlePlaceholder: '{{EO_TITLE}}', required: false, description: 'ISO 14001 — environmental aspects and compliance' },
  { key: 'hr_manager', label: 'HR / Training Manager', placeholder: '{{HR_NAME}}', titlePlaceholder: '{{HR_TITLE}}', required: false, description: 'Competence, training records, awareness programmes' },
]

// Helper: resolve all placeholders including personnel, cross-refs, and live data
export function resolveAllPlaceholders(text, companyData = {}, liveData = null) {
  if (!text) return ''

  const {
    companyName = 'Your Company',
    companyCode = 'XX',
    preparedBy = 'System Generated',
    personnel = {},
    productsServices = '',
    qmsScope = '',
    qualityPolicy = '',
  } = companyData

  const today = new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })

  let result = text
    .replace(/\{\{COMPANY\}\}/g, companyName)
    .replace(/\{\{CODE\}\}/g, companyCode)
    .replace(/\{\{DATE\}\}/g, today)
    .replace(/\{\{PREPARED_BY\}\}/g, preparedBy)
    .replace(/\{\{STANDARD\}\}/g, 'ISO 9001:2015')

  // Personnel placeholders
  const personnelMap = {
    '{{MD_NAME}}': personnel.managing_director?.name,
    '{{MD_TITLE}}': personnel.managing_director?.title || 'Managing Director',
    '{{MR_NAME}}': personnel.management_rep?.name,
    '{{MR_TITLE}}': personnel.management_rep?.title || 'Management Representative',
    '{{QM_NAME}}': personnel.quality_manager?.name,
    '{{QM_TITLE}}': personnel.quality_manager?.title || 'Quality Manager',
    '{{DC_NAME}}': personnel.document_controller?.name,
    '{{DC_TITLE}}': personnel.document_controller?.title || 'Document Controller',
    '{{IAL_NAME}}': personnel.internal_audit_lead?.name,
    '{{IAL_TITLE}}': personnel.internal_audit_lead?.title || 'Internal Audit Lead',
    '{{SO_NAME}}': personnel.safety_officer?.name,
    '{{SO_TITLE}}': personnel.safety_officer?.title || 'Safety Officer',
    '{{EO_NAME}}': personnel.environmental_officer?.name,
    '{{EO_TITLE}}': personnel.environmental_officer?.title || 'Environmental Officer',
    '{{HR_NAME}}': personnel.hr_manager?.name,
    '{{HR_TITLE}}': personnel.hr_manager?.title || 'HR Manager',
  }

  for (const [placeholder, value] of Object.entries(personnelMap)) {
    // If personnel is set, use their name; otherwise show a styled fill-in field
    const displayValue = value || `________________`
    result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), displayValue)
  }

  // Company-specific content
  result = result
    .replace(/\{\{PRODUCTS_SERVICES\}\}/g, productsServices || '[Describe your core products or services]')
    .replace(/\{\{QMS_SCOPE\}\}/g, qmsScope || '[Define the scope of your QMS — what products, services, sites, and processes are covered]')
    .replace(/\{\{QUALITY_POLICY\}\}/g, qualityPolicy || `${companyName} is committed to delivering products and services that consistently meet or exceed customer expectations and regulatory requirements. We achieve this through effective management of our quality system, competent people, continual improvement, and a culture of accountability. Every employee is responsible for quality.`)

  // Cross-reference placeholders: {{REF:template-id}} → IG-XX-SOP-001
  result = result.replace(/\{\{REF:([a-z0-9-]+)\}\}/g, (match, templateId) => {
    const docNum = DOC_NUMBER_MAP[templateId]
    if (docNum) return docNum.replace(/\{\{CODE\}\}/g, companyCode)
    return match
  })

  // ─── LIVE DATA PLACEHOLDERS ───
  // Only resolved when liveData is provided (from fetchLiveData)
  if (liveData) {
    result = result.replace(/\{\{LIVE:([A-Z_]+(?::[A-Za-z0-9_.]+)?)\}\}/g, (match, key) => {
      const resolved = resolveLivePlaceholder(key, liveData)
      return resolved !== null ? resolved : match
    })
  }

  return result
}

// ─── Live data placeholder resolver ───
function resolveLivePlaceholder(key, liveData) {
  if (!liveData) return null

  // Handle parameterised keys like COMPLIANCE_STATUS:4.1
  const [type, param] = key.split(':')

  switch (type) {
    // ── Compliance ──
    case 'COMPLIANCE_STATUS': {
      if (!param) return null
      // Search across all standards for matching clause
      for (const std of ['ISO_9001', 'ISO_14001', 'ISO_45001']) {
        const items = liveData.compliance?.[std] || []
        const clause = items.find(c => String(c.clause_number) === param)
        if (clause) {
          const status = clause.compliance_status
          if (status === 'Met') return '[X] C  [ ] NC  [ ] OFI'
          if (status === 'Not Met') return '[ ] C  [X] NC  [ ] OFI'
          if (status === 'Partially Met') return '[ ] C  [ ] NC  [X] OFI'
          return '[ ] C  [ ] NC  [ ] OFI'
        }
      }
      return null // keep original if no data
    }

    case 'COMPLIANCE_NOTES': {
      if (!param) return null
      for (const std of ['ISO_9001', 'ISO_14001', 'ISO_45001']) {
        const items = liveData.compliance?.[std] || []
        const clause = items.find(c => String(c.clause_number) === param)
        if (clause && clause.notes) return clause.notes
      }
      return ''
    }

    case 'COMPLIANCE_SCORE': {
      const scores = liveData.complianceScores?.[param]
      if (scores && scores.total > 0) return `${scores.score}%`
      return null
    }

    // ── NCRs ──
    case 'NCR_OPEN_COUNT':
      return liveData.ncrs ? String(liveData.ncrs.totalOpen) : null
    case 'NCR_CLOSED_COUNT':
      return liveData.ncrs ? String(liveData.ncrs.totalClosed) : null
    case 'NCR_OVERDUE_COUNT':
      return liveData.ncrs ? String(liveData.ncrs.overdue) : null
    case 'NCR_SUMMARY': {
      if (!liveData.ncrs) return null
      const n = liveData.ncrs
      return `Open: ${n.totalOpen} | Closed: ${n.totalClosed} | Overdue: ${n.overdue}`
    }

    // ── Audits ──
    case 'AUDIT_NUMBER':
      return liveData.audits?.latest?.audit_number || null
    case 'AUDIT_DATE': {
      const d = liveData.audits?.latest?.audit_date
      if (d) return new Date(d).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })
      return null
    }
    case 'AUDITOR_NAME':
      return liveData.audits?.latest?.assigned_auditor_name || null
    case 'AUDIT_SCHEDULE': {
      const upcoming = liveData.audits?.upcoming
      if (!upcoming || upcoming.length === 0) return null
      const rows = ['| Audit No. | Date | Standard | Scope | Auditor |', '|---|---|---|---|---|']
      upcoming.forEach(a => {
        const date = a.audit_date ? new Date(a.audit_date).toLocaleDateString('en-ZA') : '[TBD]'
        rows.push(`| ${a.audit_number || '[TBD]'} | ${date} | ${a.standard || ''} | ${a.scope || ''} | ${a.assigned_auditor_name || '[TBD]'} |`)
      })
      return rows.join('\n')
    }

    // ── Documents ──
    case 'DOCUMENT_COUNT':
      return liveData.documents ? String(liveData.documents.totalCount) : null
    case 'DOCUMENT_REGISTER': {
      const docs = liveData.documents?.controlled
      if (!docs || docs.length === 0) return null
      const rows = ['| Document | Type | Standard | Version | Status | Next Review |', '|---|---|---|---|---|---|']
      docs.slice(0, 25).forEach(d => {
        const review = d.next_review_date ? new Date(d.next_review_date).toLocaleDateString('en-ZA') : 'N/A'
        rows.push(`| ${d.name || ''} | ${d.type || ''} | ${d.standard || ''} | ${d.version || '1.0'} | ${d.status || 'Active'} | ${review} |`)
      })
      if (docs.length > 25) rows.push(`| ... and ${docs.length - 25} more documents | | | | | |`)
      return rows.join('\n')
    }

    // ── Management Reviews ──
    case 'REVIEW_DATE': {
      const rd = liveData.managementReviews?.latest?.review_date
      if (rd) return new Date(rd).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })
      return null
    }
    case 'REVIEW_ATTENDEES':
      return liveData.managementReviews?.latest?.attendees || null
    case 'REVIEW_ACTIONS':
      return liveData.managementReviews?.latest?.action_items || null
    case 'REVIEW_DECISIONS':
      return liveData.managementReviews?.latest?.decisions_made || null

    // ── Users ──
    case 'AUDITOR_LIST': {
      const auditors = liveData.users?.auditors
      if (!auditors || auditors.length === 0) return null
      return auditors.map(a => a.full_name).join(', ')
    }
    case 'USER_LIST': {
      const users = liveData.users?.active
      if (!users || users.length === 0) return null
      const rows = ['| Name | Email | Role |', '|---|---|---|']
      users.forEach(u => {
        const role = (u.role || '').replace('_', ' ')
        rows.push(`| ${u.full_name || ''} | ${u.email || ''} | ${role} |`)
      })
      return rows.join('\n')
    }
    case 'USER_COUNT':
      return liveData.users ? String(liveData.users.totalActive) : null

    // ── Risk Gaps (non-compliant clauses as risk items) ──
    case 'RISK_GAPS': {
      const gaps = []
      for (const std of ['ISO_9001', 'ISO_14001', 'ISO_45001']) {
        const items = liveData.compliance?.[std] || []
        items.filter(c => c.compliance_status === 'Not Met' || c.compliance_status === 'Partially Met').forEach(c => {
          gaps.push({ clause: c.clause_number, name: c.clause_name, status: c.compliance_status, standard: std })
        })
      }
      if (gaps.length === 0) return null
      const rows = ['| Risk ID | Description | Source | Category | Likelihood | Impact | Risk Level | Treatment | Owner | Status |', '|---|---|---|---|---|---|---|---|---|---|']
      gaps.forEach((g, i) => {
        const level = g.status === 'Not Met' ? 'High' : 'Medium'
        const likelihood = g.status === 'Not Met' ? '4' : '3'
        const impact = g.status === 'Not Met' ? '4' : '3'
        rows.push(`| R-${String(i + 1).padStart(3, '0')} | Non-compliance: Clause ${g.clause} — ${g.name} | ${g.standard.replace('_', ' ')} Compliance Gap | Compliance | ${likelihood} | ${impact} | ${level} | Corrective action required | [Assign owner] | Open |`)
      })
      return rows.join('\n')
    }

    default:
      return null
  }
}

// ═══════════════════════════════════════════════════════════════
// PRICING TIERS — Option B: Standalone sales + subscriber perk
// Prices in ZAR cents (100 = R1.00)
// ═══════════════════════════════════════════════════════════════
export const PRICING_TIERS = {
  non_subscriber: { label: 'Non-Subscriber', discount: 0 },
  starter:        { label: 'Starter', freePerMonth: 3, discount: 0.40 },   // 40% off after free allowance
  growth:         { label: 'Growth', freePerMonth: 10, discount: 0.60 },   // 60% off after free allowance
  enterprise:     { label: 'Enterprise', freePerMonth: Infinity, discount: 1.0 }, // All free
}

export function getEffectivePrice(template, subscriptionTier) {
  const tier = PRICING_TIERS[subscriptionTier] || PRICING_TIERS.non_subscriber
  if (tier.discount === 1.0) return 0
  if (tier.discount === 0) return template.pricePublic
  // For subscribers with a discount, apply to public price
  return Math.round(template.pricePublic * (1 - tier.discount))
}

export function formatPrice(cents) {
  if (cents === 0) return 'Free'
  return `R${(cents / 100).toLocaleString('en-ZA', { minimumFractionDigits: 0 })}`
}

// ═══════════════════════════════════════════════════════════════
// TEMPLATE DEFINITIONS
// ═══════════════════════════════════════════════════════════════
export const TEMPLATES = [
  // ─── MANUALS ─────────────────────────────────────────────
  {
    id: 'qms-manual',
    categoryId: 'manuals',
    title: 'Quality Management System Manual',
    slug: 'qms-manual',
    description: 'Complete ISO 9001:2015 quality manual covering all clauses. Auto-populated with your company personnel, cross-referenced to all supporting procedures, forms, and registers.',
    standard: 'ISO_9001',
    clauseRef: '4-10',
    docType: 'manual',
    pricePublic: 350000,
    priceSubscriber: 0,
    isFeatured: true,
    version: '1.0',
    previewSections: 2,
    content: null,
  },

  // ─── PROCEDURES ──────────────────────────────────────────
  {
    id: 'doc-control-proc',
    categoryId: 'procedures',
    title: 'Document Control Procedure',
    slug: 'document-control-procedure',
    description: 'Defines how documents and records are created, reviewed, approved, distributed, and controlled. Cross-references your QMS Manual and all related forms.',
    standard: 'ISO_9001',
    clauseRef: '7.5',
    docType: 'procedure',
    pricePublic: 25000,
    priceSubscriber: 0,
    isFeatured: false,
    version: '1.0',
    previewSections: 2,
    content: null,
  },

  {
    id: 'internal-audit-proc',
    categoryId: 'procedures',
    title: 'Internal Audit Procedure',
    slug: 'internal-audit-procedure',
    description: 'Procedure for planning, conducting, and reporting internal audits per ISO 19011. Links to your audit checklist, NCR form, and corrective action procedure.',
    standard: 'ISO_9001',
    clauseRef: '9.2',
    docType: 'procedure',
    pricePublic: 25000,
    priceSubscriber: 0,
    isFeatured: false,
    version: '1.0',
    previewSections: 2,
    content: null,
  },

  {
    id: 'corrective-action-proc',
    categoryId: 'procedures',
    title: 'Corrective Action & NCR Procedure',
    slug: 'corrective-action-ncr-procedure',
    description: 'Defines how nonconformities are identified, documented, investigated, and resolved. Cross-references your NCR form, risk register, and document control procedure.',
    standard: 'ISO_9001',
    clauseRef: '10.2',
    docType: 'procedure',
    pricePublic: 25000,
    priceSubscriber: 0,
    isFeatured: false,
    version: '1.0',
    previewSections: 2,
    content: null,
  },

  {
    id: 'management-review-proc',
    categoryId: 'procedures',
    title: 'Management Review Procedure',
    slug: 'management-review-procedure',
    description: 'Procedure for conducting management reviews per ISO 9001 Clause 9.3. References audit results, NCR trends, training records, and supplier performance.',
    standard: 'ISO_9001',
    clauseRef: '9.3',
    docType: 'procedure',
    pricePublic: 25000,
    priceSubscriber: 0,
    version: '1.0',
    previewSections: 2,
    content: null,
  },

  {
    id: 'env-management-proc',
    categoryId: 'procedures',
    title: 'Environmental Aspects & Impacts Procedure',
    slug: 'environmental-aspects-procedure',
    description: 'Procedure for identifying, evaluating, and managing environmental aspects per ISO 14001:2015. Links to your environmental aspects register and risk register.',
    standard: 'ISO_14001',
    clauseRef: '6.1.2',
    docType: 'procedure',
    pricePublic: 25000,
    priceSubscriber: 0,
    version: '1.0',
    previewSections: 2,
    content: null,
  },

  {
    id: 'hazard-identification-proc',
    categoryId: 'procedures',
    title: 'Hazard Identification & Risk Assessment (HIRA) Procedure',
    slug: 'hira-procedure',
    description: 'Procedure for identifying workplace hazards and assessing OH&S risks per ISO 45001:2018. Links to risk register, NCR form, and training records.',
    standard: 'ISO_45001',
    clauseRef: '6.1.2',
    docType: 'procedure',
    pricePublic: 25000,
    priceSubscriber: 0,
    version: '1.0',
    previewSections: 2,
    content: null,
  },

  // ─── FORMS ───────────────────────────────────────────────
  {
    id: 'ncr-form',
    categoryId: 'forms',
    title: 'Nonconformity Report (NCR) Form',
    slug: 'ncr-report-form',
    description: 'Structured NCR form with fields for description, classification, root cause analysis, corrective action, and verification. References your corrective action procedure.',
    standard: 'ISO_9001',
    clauseRef: '10.2',
    docType: 'form',
    pricePublic: 15000,
    priceSubscriber: 0,
    trialAccess: true,
    version: '1.0',
    previewSections: 3,
    content: null,
  },

  {
    id: 'audit-checklist',
    categoryId: 'forms',
    title: 'Internal Audit Checklist — ISO 9001',
    slug: 'internal-audit-checklist-9001',
    description: 'Clause-by-clause audit checklist for ISO 9001:2015 with audit questions, evidence requirements, and finding classifications. Links to your audit procedure.',
    standard: 'ISO_9001',
    clauseRef: '9.2',
    docType: 'form',
    pricePublic: 25000,
    priceSubscriber: 0,
    version: '1.0',
    previewSections: 2,
    content: null,
  },

  {
    id: 'training-record-form',
    categoryId: 'forms',
    title: 'Training Record & Competence Matrix',
    slug: 'training-record-form',
    description: 'Employee training record and competence matrix for tracking training needs, completion, and effectiveness evaluation per Clause 7.2.',
    standard: 'ISO_9001',
    clauseRef: '7.2',
    docType: 'form',
    pricePublic: 15000,
    priceSubscriber: 0,
    trialAccess: true,
    version: '1.0',
    previewSections: 2,
    content: null,
  },

  {
    id: 'supplier-eval-form',
    categoryId: 'forms',
    title: 'Supplier Evaluation Form',
    slug: 'supplier-evaluation-form',
    description: 'Structured form for evaluating and approving suppliers based on quality, delivery, price, and compliance criteria per ISO 9001 Clause 8.4.',
    standard: 'ISO_9001',
    clauseRef: '8.4',
    docType: 'form',
    pricePublic: 15000,
    priceSubscriber: 0,
    version: '1.0',
    previewSections: 2,
    content: null,
  },

  // ─── REGISTERS ───────────────────────────────────────────
  {
    id: 'risk-register',
    categoryId: 'registers',
    title: 'Risk & Opportunity Register',
    slug: 'risk-opportunity-register',
    description: 'Comprehensive risk and opportunity register with assessment matrix, treatment plans, and monitoring schedule. Referenced by your QMS Manual, audit, and NCR procedures.',
    standard: 'MULTI',
    clauseRef: '6.1',
    docType: 'register',
    pricePublic: 25000,
    priceSubscriber: 0,
    version: '1.0',
    previewSections: 2,
    content: null,
  },

  {
    id: 'env-aspects-register',
    categoryId: 'registers',
    title: 'Environmental Aspects Register',
    slug: 'environmental-aspects-register',
    description: 'Register for documenting environmental aspects, impacts, significance ratings, and operational controls per ISO 14001:2015. Links to your environmental procedure.',
    standard: 'ISO_14001',
    clauseRef: '6.1.2',
    docType: 'register',
    pricePublic: 25000,
    priceSubscriber: 0,
    version: '1.0',
    previewSections: 2,
    content: null,
  },

  // ─── ISO 14001 TEMPLATES ────────────────────────────────
  {
    id: 'env-policy',
    categoryId: 'manuals',
    title: 'Environmental Policy',
    slug: 'environmental-policy',
    description: 'Environmental policy statement per ISO 14001:2015 Clause 5.2. Includes commitment to protection of the environment, pollution prevention, and compliance with legal obligations.',
    standard: 'ISO_14001',
    clauseRef: '5.2',
    docType: 'manual',
    pricePublic: 15000,
    priceSubscriber: 0,
    version: '1.0',
    previewSections: 2,
    content: null,
  },

  {
    id: 'env-legal-register',
    categoryId: 'registers',
    title: 'Environmental Legal Register',
    slug: 'environmental-legal-register',
    description: 'Register of applicable environmental legislation for South African operations. Pre-populated with NEMA, National Water Act, NEMWA, and other key Acts. Links to your environmental aspects procedure.',
    standard: 'ISO_14001',
    clauseRef: '6.1.3',
    docType: 'register',
    pricePublic: 25000,
    priceSubscriber: 0,
    version: '1.0',
    previewSections: 2,
    content: null,
  },

  {
    id: 'waste-management-proc',
    categoryId: 'procedures',
    title: 'Waste Management Procedure',
    slug: 'waste-management-procedure',
    description: 'Operational control procedure for waste identification, segregation, storage, transport, and disposal per ISO 14001:2015 Clause 8.1. Includes industry-specific waste stream examples.',
    standard: 'ISO_14001',
    clauseRef: '8.1',
    docType: 'procedure',
    pricePublic: 25000,
    priceSubscriber: 0,
    version: '1.0',
    previewSections: 2,
    content: null,
  },

  {
    id: 'emergency-preparedness-env',
    categoryId: 'procedures',
    title: 'Environmental Emergency Preparedness & Response',
    slug: 'environmental-emergency-preparedness',
    description: 'Procedure for identifying potential environmental emergencies and planning response actions per ISO 14001:2015 Clause 8.2. Covers spills, emissions, fire with environmental impact.',
    standard: 'ISO_14001',
    clauseRef: '8.2',
    docType: 'procedure',
    pricePublic: 25000,
    priceSubscriber: 0,
    version: '1.0',
    previewSections: 2,
    content: null,
  },

  {
    id: 'env-objectives-register',
    categoryId: 'registers',
    title: 'Environmental Objectives & Targets Register',
    slug: 'environmental-objectives-register',
    description: 'Register for documenting environmental objectives, targets, action plans, responsibilities, and timelines per ISO 14001:2015 Clause 6.2.',
    standard: 'ISO_14001',
    clauseRef: '6.2',
    docType: 'register',
    pricePublic: 15000,
    priceSubscriber: 0,
    version: '1.0',
    previewSections: 2,
    content: null,
  },

  // ─── ISO 45001 TEMPLATES ────────────────────────────────
  {
    id: 'ohs-policy',
    categoryId: 'manuals',
    title: 'Occupational Health & Safety Policy',
    slug: 'ohs-policy',
    description: 'OH&S policy statement per ISO 45001:2018 Clause 5.2. Includes commitment to safe and healthy working conditions, elimination of hazards, worker consultation and participation.',
    standard: 'ISO_45001',
    clauseRef: '5.2',
    docType: 'manual',
    pricePublic: 15000,
    priceSubscriber: 0,
    version: '1.0',
    previewSections: 2,
    content: null,
  },

  {
    id: 'incident-investigation-proc',
    categoryId: 'procedures',
    title: 'Incident Investigation Procedure',
    slug: 'incident-investigation-procedure',
    description: 'Procedure for investigating workplace incidents, near-misses, and occupational diseases per ISO 45001:2018 Clause 10.2. Links to NCR system for automatic corrective action creation.',
    standard: 'ISO_45001',
    clauseRef: '10.2',
    docType: 'procedure',
    pricePublic: 25000,
    priceSubscriber: 0,
    version: '1.0',
    previewSections: 2,
    content: null,
  },

  {
    id: 'safety-inspection-checklist',
    categoryId: 'forms',
    title: 'Workplace Safety Inspection Checklist',
    slug: 'safety-inspection-checklist',
    description: 'Structured workplace safety inspection form per ISO 45001:2018 Clause 9.1.1. Covers housekeeping, fire safety, electrical, PPE, chemical storage, and emergency equipment.',
    standard: 'ISO_45001',
    clauseRef: '9.1.1',
    docType: 'form',
    pricePublic: 15000,
    priceSubscriber: 0,
    trialAccess: true,
    version: '1.0',
    previewSections: 2,
    content: null,
  },

  {
    id: 'emergency-response-ohs',
    categoryId: 'procedures',
    title: 'OH&S Emergency Response Plan',
    slug: 'ohs-emergency-response-plan',
    description: 'Emergency response procedure for workplace emergencies per ISO 45001:2018 Clause 8.2. Covers fire, medical emergencies, chemical spills, structural collapse, and evacuation.',
    standard: 'ISO_45001',
    clauseRef: '8.2',
    docType: 'procedure',
    pricePublic: 25000,
    priceSubscriber: 0,
    version: '1.0',
    previewSections: 2,
    content: null,
  },

  {
    id: 'ppe-register',
    categoryId: 'registers',
    title: 'PPE Issue & Compliance Register',
    slug: 'ppe-register',
    description: 'Register for tracking PPE requirements, issue dates, condition, and replacement schedules per ISO 45001:2018 Clause 8.1.2. Pre-populated with common PPE categories.',
    standard: 'ISO_45001',
    clauseRef: '8.1.2',
    docType: 'register',
    pricePublic: 15000,
    priceSubscriber: 0,
    version: '1.0',
    previewSections: 2,
    content: null,
  },

  {
    id: 'legal-appointments-register',
    categoryId: 'registers',
    title: 'Legal Appointments Register (OHS Act)',
    slug: 'legal-appointments-register',
    description: 'South Africa-specific register for OHS Act Section 16(2) appointments, safety representative designations, first aiders, fire marshals, and SHE committee members.',
    standard: 'ISO_45001',
    clauseRef: '5.3',
    docType: 'register',
    pricePublic: 15000,
    priceSubscriber: 0,
    version: '1.0',
    previewSections: 2,
    content: null,
  },

  // ─── STARTER PACKS ──────────────────────────────────────
  {
    id: 'iso-9001-starter',
    categoryId: 'starter-packs',
    title: 'ISO 9001 Complete Starter Pack',
    slug: 'iso-9001-starter-pack',
    description: 'Everything you need to build an ISO 9001:2015 QMS from scratch. All documents are cross-referenced and auto-populated with your company personnel. Includes quality manual, 5 procedures, 4 forms, and risk register.',
    standard: 'ISO_9001',
    clauseRef: '4-10',
    docType: 'bundle',
    pricePublic: 750000,
    priceSubscriber: 350000,
    isFeatured: true,
    version: '1.0',
    previewSections: 1,
    bundleTemplateIds: ['qms-manual', 'doc-control-proc', 'internal-audit-proc', 'corrective-action-proc', 'management-review-proc', 'ncr-form', 'audit-checklist', 'training-record-form', 'supplier-eval-form', 'risk-register'],
    content: null,
  },

  {
    id: 'iso-14001-starter',
    categoryId: 'starter-packs',
    title: 'ISO 14001 Complete Starter Pack',
    slug: 'iso-14001-starter-pack',
    description: 'Everything you need to build an ISO 14001:2015 EMS from scratch. Includes environmental policy, 4 procedures, 3 registers, and cross-referenced supporting documents.',
    standard: 'ISO_14001',
    clauseRef: '4-10',
    docType: 'bundle',
    pricePublic: 750000,
    priceSubscriber: 350000,
    isFeatured: true,
    version: '1.0',
    previewSections: 1,
    bundleTemplateIds: ['env-policy', 'env-management-proc', 'waste-management-proc', 'emergency-preparedness-env', 'env-aspects-register', 'env-legal-register', 'env-objectives-register', 'risk-register', 'ncr-form'],
    content: null,
  },

  {
    id: 'iso-45001-starter',
    categoryId: 'starter-packs',
    title: 'ISO 45001 Complete Starter Pack',
    slug: 'iso-45001-starter-pack',
    description: 'Everything you need to build an ISO 45001:2018 OH&S management system from scratch. Includes OH&S policy, 4 procedures, 3 registers, safety checklist, and cross-referenced supporting documents.',
    standard: 'ISO_45001',
    clauseRef: '4-10',
    docType: 'bundle',
    pricePublic: 750000,
    priceSubscriber: 350000,
    isFeatured: true,
    version: '1.0',
    previewSections: 1,
    bundleTemplateIds: ['ohs-policy', 'hazard-identification-proc', 'incident-investigation-proc', 'emergency-response-ohs', 'safety-inspection-checklist', 'ppe-register', 'legal-appointments-register', 'risk-register', 'ncr-form', 'training-record-form'],
    content: null,
  },
]

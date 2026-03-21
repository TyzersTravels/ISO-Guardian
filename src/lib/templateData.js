// ISOGuardian Template Marketplace — Template Content Data
// Each template has structured sections that get rendered into branded PDFs
// Placeholders: {{COMPANY}}, {{CODE}}, {{DATE}}, {{STANDARD}}, {{PREPARED_BY}}

export const TEMPLATE_CATEGORIES = [
  { id: 'manuals', name: 'Quality Manuals', slug: 'manuals', icon: 'book', sort_order: 1, description: 'Complete management system manuals for ISO certification' },
  { id: 'procedures', name: 'Procedures', slug: 'procedures', icon: 'clipboard', sort_order: 2, description: 'Standard operating procedures required by ISO standards' },
  { id: 'forms', name: 'Forms & Records', slug: 'forms', icon: 'document', sort_order: 3, description: 'Pre-built forms, checklists, and record templates' },
  { id: 'registers', name: 'Registers', slug: 'registers', icon: 'table', sort_order: 4, description: 'Risk registers, aspects registers, and tracking logs' },
  { id: 'starter-packs', name: 'Starter Packs', slug: 'starter-packs', icon: 'package', sort_order: 5, description: 'Complete documentation bundles to build your system from scratch' },
]

export const TEMPLATES = [
  // ═══════════════════════════════════════════════════════
  // MANUALS
  // ═══════════════════════════════════════════════════════
  {
    id: 'qms-manual',
    categoryId: 'manuals',
    title: 'Quality Management System Manual',
    slug: 'qms-manual',
    description: 'Complete ISO 9001:2015 quality manual covering all clauses. Includes scope, context of the organisation, leadership commitment, process descriptions, and performance evaluation framework.',
    standard: 'ISO_9001',
    clauseRef: '4-10',
    docType: 'manual',
    pricePublic: 350000, // R3,500
    priceSubscriber: 0, // Free for subscribers
    isFeatured: true,
    version: '1.0',
    previewSections: 2,
    content: null,
  },

  // ═══════════════════════════════════════════════════════
  // PROCEDURES
  // ═══════════════════════════════════════════════════════
  {
    id: 'doc-control-proc',
    categoryId: 'procedures',
    title: 'Document Control Procedure',
    slug: 'document-control-procedure',
    description: 'Defines how documents and records are created, reviewed, approved, distributed, and controlled within the management system. Required by ISO 9001 Clause 7.5.',
    standard: 'ISO_9001',
    clauseRef: '7.5',
    docType: 'procedure',
    pricePublic: 25000, // R250
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
    description: 'Procedure for planning, conducting, and reporting internal audits per ISO 19011 guidelines. Covers auditor competence, audit programme, and follow-up.',
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
    description: 'Defines how nonconformities are identified, documented, investigated, and resolved with effective corrective actions. Covers root cause analysis methods.',
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
    description: 'Procedure for conducting management reviews per ISO 9001 Clause 9.3. Includes agenda template, required inputs/outputs, and minutes format.',
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
    description: 'Procedure for identifying, evaluating, and managing environmental aspects and impacts per ISO 14001:2015 Clause 6.1.2. Includes significance criteria.',
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
    description: 'Procedure for identifying workplace hazards, assessing OH&S risks, and determining controls per ISO 45001:2018 Clause 6.1.2. Includes hierarchy of controls.',
    standard: 'ISO_45001',
    clauseRef: '6.1.2',
    docType: 'procedure',
    pricePublic: 25000,
    priceSubscriber: 0,
    version: '1.0',
    previewSections: 2,
    content: null,
  },

  // ═══════════════════════════════════════════════════════
  // FORMS
  // ═══════════════════════════════════════════════════════
  {
    id: 'ncr-form',
    categoryId: 'forms',
    title: 'Nonconformity Report (NCR) Form',
    slug: 'ncr-report-form',
    description: 'Structured NCR form with fields for description, classification, root cause analysis, corrective action, and verification of effectiveness.',
    standard: 'ISO_9001',
    clauseRef: '10.2',
    docType: 'form',
    pricePublic: 15000,
    priceSubscriber: 0,
    version: '1.0',
    previewSections: 3,
    content: null,
  },

  {
    id: 'audit-checklist',
    categoryId: 'forms',
    title: 'Internal Audit Checklist — ISO 9001',
    slug: 'internal-audit-checklist-9001',
    description: 'Clause-by-clause audit checklist for ISO 9001:2015 with audit questions, evidence requirements, and finding classifications.',
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
    description: 'Employee training record form and competence matrix template for tracking training needs, completion, and effectiveness evaluation per Clause 7.2.',
    standard: 'ISO_9001',
    clauseRef: '7.2',
    docType: 'form',
    pricePublic: 15000,
    priceSubscriber: 0,
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

  // ═══════════════════════════════════════════════════════
  // REGISTERS
  // ═══════════════════════════════════════════════════════
  {
    id: 'risk-register',
    categoryId: 'registers',
    title: 'Risk & Opportunity Register',
    slug: 'risk-opportunity-register',
    description: 'Comprehensive risk and opportunity register template with assessment matrix, treatment plans, and monitoring schedule per Clause 6.1.',
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
    description: 'Register for documenting environmental aspects, impacts, significance ratings, and operational controls per ISO 14001:2015.',
    standard: 'ISO_14001',
    clauseRef: '6.1.2',
    docType: 'register',
    pricePublic: 25000,
    priceSubscriber: 0,
    version: '1.0',
    previewSections: 2,
    content: null,
  },

  // ═══════════════════════════════════════════════════════
  // STARTER PACKS (bundles)
  // ═══════════════════════════════════════════════════════
  {
    id: 'iso-9001-starter',
    categoryId: 'starter-packs',
    title: 'ISO 9001 Complete Starter Pack',
    slug: 'iso-9001-starter-pack',
    description: 'Everything you need to build an ISO 9001:2015 quality management system from scratch. Includes quality manual, 5 core procedures, 4 forms, and risk register.',
    standard: 'ISO_9001',
    clauseRef: '4-10',
    docType: 'bundle',
    pricePublic: 750000, // R7,500
    priceSubscriber: 350000, // R3,500
    isFeatured: true,
    version: '1.0',
    previewSections: 1,
    bundleTemplateIds: ['qms-manual', 'doc-control-proc', 'internal-audit-proc', 'corrective-action-proc', 'management-review-proc', 'ncr-form', 'audit-checklist', 'training-record-form', 'supplier-eval-form', 'risk-register'],
    content: null,
  },
]

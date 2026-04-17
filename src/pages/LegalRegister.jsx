import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { supabase } from '../lib/supabase'
import { logActivity } from '../lib/auditLogger'
import Layout from '../components/Layout'
import ConfirmModal from '../components/ConfirmModal'
import SupportingDocuments from '../components/SupportingDocuments'

const REQUIREMENT_TYPES = [
  { value: 'act', label: 'Act' },
  { value: 'regulation', label: 'Regulation' },
  { value: 'bylaw', label: 'By-law' },
  { value: 'standard', label: 'Standard' },
  { value: 'code_of_practice', label: 'Code of Practice' },
  { value: 'permit', label: 'Permit' },
  { value: 'licence', label: 'Licence' },
  { value: 'contract', label: 'Contract' },
  { value: 'industry_agreement', label: 'Industry Agreement' },
  { value: 'other', label: 'Other' },
]

const CATEGORIES = [
  { value: 'environmental', label: 'Environmental' },
  { value: 'health_safety', label: 'Health & Safety' },
  { value: 'quality', label: 'Quality' },
  { value: 'labour', label: 'Labour' },
  { value: 'fire_safety', label: 'Fire Safety' },
  { value: 'hazardous_substances', label: 'Hazardous Substances' },
  { value: 'waste_management', label: 'Waste Management' },
  { value: 'water', label: 'Water' },
  { value: 'air_quality', label: 'Air Quality' },
  { value: 'noise', label: 'Noise' },
  { value: 'general', label: 'General' },
  { value: 'other', label: 'Other' },
]

const COMPLIANCE_STATUSES = [
  'Compliant',
  'Partially Compliant',
  'Non-Compliant',
  'Not Assessed',
  'Not Applicable',
]

const STANDARDS = [
  { code: 'ISO_9001', label: 'ISO 9001' },
  { code: 'ISO_14001', label: 'ISO 14001' },
  { code: 'ISO_45001', label: 'ISO 45001' },
]

const STATUS_STYLES = {
  'Compliant': 'bg-green-500/20 text-green-400 border-green-500/30',
  'Partially Compliant': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'Non-Compliant': 'bg-red-500/20 text-red-400 border-red-500/30',
  'Not Assessed': 'bg-white/10 text-white/50 border-white/20',
  'Not Applicable': 'bg-white/5 text-white/30 border-white/10',
}

const CATEGORY_LABELS = Object.fromEntries(CATEGORIES.map(c => [c.value, c.label]))
const TYPE_LABELS = Object.fromEntries(REQUIREMENT_TYPES.map(t => [t.value, t.label]))

const PERMIT_TYPES = new Set(['permit', 'licence'])

function daysUntil(dateStr) {
  if (!dateStr) return null
  const diff = new Date(dateStr) - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

const defaultForm = {
  legislation_title: '',
  legislation_number: '',
  section_reference: '',
  issuing_authority: '',
  requirement_type: 'act',
  jurisdiction: 'South Africa',
  applicable_to: '',
  applicability_reason: '',
  standards: [],
  clause_references: ['6.1.3'],
  category: 'general',
  compliance_status: 'Not Assessed',
  compliance_evidence: '',
  last_compliance_evaluation: '',
  next_evaluation_date: '',
  evaluated_by: '',
  permit_number: '',
  issue_date: '',
  expiry_date: '',
  renewal_reminder_days: 60,
  last_amended: '',
  amendment_notes: '',
  responsible_person: '',
  notes: '',
}

const LegalRegister = () => {
  const { userProfile, getEffectiveCompanyId } = useAuth()
  const toast = useToast()
  const [requirements, setRequirements] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [expandedRow, setExpandedRow] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)
  const [form, setForm] = useState(defaultForm)

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  useEffect(() => {
    if (userProfile) fetchRequirements()
  }, [userProfile])

  const fetchRequirements = async () => {
    try {
      setLoading(true)
      const companyId = getEffectiveCompanyId()
      if (!companyId) return
      const { data, error } = await supabase
        .from('legal_requirements')
        .select(
          'id, legislation_title, legislation_number, section_reference, issuing_authority, ' +
          'requirement_type, jurisdiction, applicable_to, applicability_reason, standards, ' +
          'clause_references, category, compliance_status, compliance_evidence, ' +
          'last_compliance_evaluation, next_evaluation_date, evaluated_by, permit_number, ' +
          'issue_date, expiry_date, renewal_reminder_days, last_amended, amendment_notes, ' +
          'responsible_person, notes, created_by, created_at, updated_at'
        )
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
      if (error) throw error
      setRequirements(data || [])
    } catch (err) {
      console.error('Error fetching legal requirements:', err)
      toast.error('Failed to load legal register')
    } finally {
      setLoading(false)
    }
  }

  const toggleStandard = (code) => {
    setForm(prev => ({
      ...prev,
      standards: prev.standards.includes(code)
        ? prev.standards.filter(s => s !== code)
        : [...prev.standards, code],
    }))
  }

  const openAdd = () => {
    setEditing(null)
    setForm(defaultForm)
    setShowForm(true)
  }

  const openEdit = (req) => {
    setEditing(req)
    setForm({
      legislation_title: req.legislation_title || '',
      legislation_number: req.legislation_number || '',
      section_reference: req.section_reference || '',
      issuing_authority: req.issuing_authority || '',
      requirement_type: req.requirement_type || 'act',
      jurisdiction: req.jurisdiction || 'South Africa',
      applicable_to: req.applicable_to || '',
      applicability_reason: req.applicability_reason || '',
      standards: req.standards || [],
      clause_references: req.clause_references || ['6.1.3'],
      category: req.category || 'general',
      compliance_status: req.compliance_status || 'Not Assessed',
      compliance_evidence: req.compliance_evidence || '',
      last_compliance_evaluation: req.last_compliance_evaluation || '',
      next_evaluation_date: req.next_evaluation_date || '',
      evaluated_by: req.evaluated_by || '',
      permit_number: req.permit_number || '',
      issue_date: req.issue_date || '',
      expiry_date: req.expiry_date || '',
      renewal_reminder_days: req.renewal_reminder_days ?? 60,
      last_amended: req.last_amended || '',
      amendment_notes: req.amendment_notes || '',
      responsible_person: req.responsible_person || '',
      notes: req.notes || '',
    })
    setShowForm(true)
    setExpandedRow(null)
  }

  const handleSave = async () => {
    if (!form.legislation_title.trim()) {
      toast.error('Legislation title is required')
      return
    }
    try {
      const companyId = getEffectiveCompanyId()
      const payload = {
        company_id: companyId,
        legislation_title: form.legislation_title.trim(),
        legislation_number: form.legislation_number.trim() || null,
        section_reference: form.section_reference.trim() || null,
        issuing_authority: form.issuing_authority.trim() || null,
        requirement_type: form.requirement_type,
        jurisdiction: form.jurisdiction.trim() || 'South Africa',
        applicable_to: form.applicable_to.trim() || null,
        applicability_reason: form.applicability_reason.trim() || null,
        standards: form.standards,
        clause_references: form.clause_references,
        category: form.category,
        compliance_status: form.compliance_status,
        compliance_evidence: form.compliance_evidence.trim() || null,
        last_compliance_evaluation: form.last_compliance_evaluation || null,
        next_evaluation_date: form.next_evaluation_date || null,
        evaluated_by: form.evaluated_by.trim() || null,
        permit_number: form.permit_number.trim() || null,
        issue_date: form.issue_date || null,
        expiry_date: form.expiry_date || null,
        renewal_reminder_days: parseInt(form.renewal_reminder_days) || 60,
        last_amended: form.last_amended || null,
        amendment_notes: form.amendment_notes.trim() || null,
        responsible_person: form.responsible_person.trim() || null,
        notes: form.notes.trim() || null,
      }

      if (editing) {
        const { error } = await supabase
          .from('legal_requirements')
          .update(payload)
          .eq('id', editing.id)
        if (error) throw error
        await logActivity({
          companyId,
          userId: userProfile.id,
          action: 'updated',
          entityType: 'legal_requirement',
          entityId: editing.id,
          changes: { legislation_title: form.legislation_title, compliance_status: form.compliance_status },
        })
        toast.success('Requirement updated')
      } else {
        payload.created_by = userProfile.id
        const { data, error } = await supabase
          .from('legal_requirements')
          .insert(payload)
          .select('id')
          .single()
        if (error) throw error
        await logActivity({
          companyId,
          userId: userProfile.id,
          action: 'created',
          entityType: 'legal_requirement',
          entityId: data.id,
          changes: { legislation_title: form.legislation_title, category: form.category },
        })
        toast.success('Requirement added')
      }
      setShowForm(false)
      fetchRequirements()
    } catch (err) {
      console.error('Error saving requirement:', err)
      toast.error('Failed to save requirement')
    }
  }

  const handleDelete = async (req) => {
    try {
      const { error } = await supabase
        .from('legal_requirements')
        .delete()
        .eq('id', req.id)
      if (error) throw error
      await logActivity({
        companyId: getEffectiveCompanyId(),
        userId: userProfile.id,
        action: 'deleted',
        entityType: 'legal_requirement',
        entityId: req.id,
        changes: { legislation_title: req.legislation_title },
      })
      toast.success('Requirement deleted')
      setExpandedRow(null)
      fetchRequirements()
    } catch (err) {
      console.error('Error deleting requirement:', err)
      toast.error('Failed to delete requirement')
    }
  }

  // KPIs
  const kpis = useMemo(() => {
    const total = requirements.length
    const compliant = requirements.filter(r => r.compliance_status === 'Compliant').length
    const nonCompliant = requirements.filter(r => r.compliance_status === 'Non-Compliant').length
    const today = new Date()
    const expiringSoon = requirements.filter(r => {
      if (!r.expiry_date) return false
      const days = daysUntil(r.expiry_date)
      return days !== null && days >= 0 && days <= 60
    }).length
    const compliantPct = total > 0 ? Math.round((compliant / total) * 100) : 0
    return { total, compliantPct, nonCompliant, expiringSoon }
  }, [requirements])

  // Filtered list
  const filtered = useMemo(() => {
    return requirements.filter(r => {
      if (categoryFilter !== 'all' && r.category !== categoryFilter) return false
      if (statusFilter !== 'all' && r.compliance_status !== statusFilter) return false
      if (typeFilter !== 'all' && r.requirement_type !== typeFilter) return false
      return true
    })
  }, [requirements, categoryFilter, statusFilter, typeFilter])

  const isPermitType = PERMIT_TYPES.has(form.requirement_type)

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Legal Register</h1>
            <p className="text-white/50 text-sm mt-1">ISO Clause 6.1.3 — Compliance Obligations</p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-medium transition-colors text-sm w-fit"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Requirement
          </button>
        </div>

        {/* ISO Reference Card */}
        <div className="glass-card rounded-xl p-4 border border-cyan-500/20 bg-cyan-500/5">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-cyan-300 font-semibold text-sm">ISO 6.1.3 — Compliance Obligations</p>
              <p className="text-white/60 text-sm mt-1">
                Requires determining compliance obligations related to environmental aspects (ISO 14001) and OH&amp;S hazards (ISO 45001),
                and how they apply to the organisation. Include legal requirements and other requirements the organisation chooses to comply with.
              </p>
            </div>
          </div>
        </div>

        <SupportingDocuments standard="ISO 14001" clause="6.1.3" clauseNum={6} clauseName="Clause 6: Planning" entityType="legal_register" title="Existing Legal Register Documents" />

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card rounded-xl p-4">
            <p className="text-white/50 text-xs uppercase tracking-wider">Total Requirements</p>
            <p className="text-3xl font-bold text-white mt-1">{kpis.total}</p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <p className="text-white/50 text-xs uppercase tracking-wider">Compliant</p>
            <p className="text-3xl font-bold text-green-400 mt-1">{kpis.compliantPct}%</p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <p className="text-white/50 text-xs uppercase tracking-wider">Non-Compliant</p>
            <p className={`text-3xl font-bold mt-1 ${kpis.nonCompliant > 0 ? 'text-red-400' : 'text-white/40'}`}>{kpis.nonCompliant}</p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <p className="text-white/50 text-xs uppercase tracking-wider">Expiring Soon</p>
            <p className={`text-3xl font-bold mt-1 ${kpis.expiringSoon > 0 ? 'text-amber-400' : 'text-white/40'}`}>{kpis.expiringSoon}</p>
            <p className="text-white/30 text-xs mt-0.5">within 60 days</p>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-card rounded-xl p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="glass-input rounded-lg px-3 py-2 text-sm text-white bg-white/5 border border-white/10 flex-1"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="glass-input rounded-lg px-3 py-2 text-sm text-white bg-white/5 border border-white/10 flex-1"
            >
              <option value="all">All Statuses</option>
              {COMPLIANCE_STATUSES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="glass-input rounded-lg px-3 py-2 text-sm text-white bg-white/5 border border-white/10 flex-1"
            >
              <option value="all">All Types</option>
              {REQUIREMENT_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="glass-card rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <svg className="w-12 h-12 text-white/20 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <p className="text-white/40 text-sm">
                {requirements.length === 0 ? 'No legal requirements added yet. Click "Add Requirement" to get started.' : 'No requirements match the selected filters.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left px-4 py-3 text-white/50 text-xs uppercase tracking-wider font-medium">Legislation</th>
                    <th className="text-left px-4 py-3 text-white/50 text-xs uppercase tracking-wider font-medium hidden sm:table-cell">Type</th>
                    <th className="text-left px-4 py-3 text-white/50 text-xs uppercase tracking-wider font-medium hidden md:table-cell">Category</th>
                    <th className="text-left px-4 py-3 text-white/50 text-xs uppercase tracking-wider font-medium hidden lg:table-cell">Standards</th>
                    <th className="text-left px-4 py-3 text-white/50 text-xs uppercase tracking-wider font-medium">Status</th>
                    <th className="text-left px-4 py-3 text-white/50 text-xs uppercase tracking-wider font-medium hidden md:table-cell">Expiry</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.map(req => {
                    const expiryDays = req.expiry_date ? daysUntil(req.expiry_date) : null
                    const isExpired = expiryDays !== null && expiryDays < 0
                    const isExpiringSoon = expiryDays !== null && expiryDays >= 0 && expiryDays <= 60
                    const isExpanded = expandedRow === req.id

                    return (
                      <>
                        <tr
                          key={req.id}
                          className={`hover:bg-white/5 transition-colors cursor-pointer ${isExpanded ? 'bg-white/5' : ''}`}
                          onClick={() => setExpandedRow(isExpanded ? null : req.id)}
                        >
                          <td className="px-4 py-3">
                            <p className="text-white font-medium text-sm">{req.legislation_title}</p>
                            {req.legislation_number && (
                              <p className="text-white/40 text-xs mt-0.5">{req.legislation_number}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <span className="text-white/60 text-sm">{TYPE_LABELS[req.requirement_type] || req.requirement_type}</span>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <span className="text-white/60 text-sm">{CATEGORY_LABELS[req.category] || req.category}</span>
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <div className="flex gap-1 flex-wrap">
                              {(req.standards || []).map(s => {
                                const std = STANDARDS.find(x => x.code === s)
                                return (
                                  <span key={s} className="px-1.5 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/20">
                                    {std ? std.label : s}
                                  </span>
                                )
                              })}
                              {(!req.standards || req.standards.length === 0) && (
                                <span className="text-white/30 text-xs">—</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs border ${STATUS_STYLES[req.compliance_status] || STATUS_STYLES['Not Assessed']}`}>
                              {req.compliance_status}
                            </span>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            {req.expiry_date ? (
                              <span className={`text-xs font-medium ${isExpired ? 'text-red-400' : isExpiringSoon ? 'text-amber-400' : 'text-white/50'}`}>
                                {isExpired
                                  ? `Expired ${Math.abs(expiryDays)}d ago`
                                  : isExpiringSoon
                                  ? `${expiryDays}d left`
                                  : new Date(req.expiry_date).toLocaleDateString('en-ZA')}
                              </span>
                            ) : (
                              <span className="text-white/30 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 justify-end" onClick={e => e.stopPropagation()}>
                              <button
                                onClick={() => openEdit(req)}
                                className="text-white/40 hover:text-white transition-colors"
                                title="Edit"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => setConfirmAction({ type: 'delete', req })}
                                className="text-white/40 hover:text-red-400 transition-colors"
                                title="Delete"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                              <svg
                                className={`w-4 h-4 text-white/30 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                fill="none" viewBox="0 0 24 24" stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </td>
                        </tr>

                        {/* Expanded detail row */}
                        {isExpanded && (
                          <tr key={`${req.id}-expanded`} className="bg-white/5">
                            <td colSpan={7} className="px-4 py-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                                {req.section_reference && (
                                  <div>
                                    <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Section Reference</p>
                                    <p className="text-white/80">{req.section_reference}</p>
                                  </div>
                                )}
                                {req.issuing_authority && (
                                  <div>
                                    <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Issuing Authority</p>
                                    <p className="text-white/80">{req.issuing_authority}</p>
                                  </div>
                                )}
                                {req.jurisdiction && (
                                  <div>
                                    <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Jurisdiction</p>
                                    <p className="text-white/80">{req.jurisdiction}</p>
                                  </div>
                                )}
                                {req.applicable_to && (
                                  <div>
                                    <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Applicable To</p>
                                    <p className="text-white/80">{req.applicable_to}</p>
                                  </div>
                                )}
                                {req.responsible_person && (
                                  <div>
                                    <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Responsible Person</p>
                                    <p className="text-white/80">{req.responsible_person}</p>
                                  </div>
                                )}
                                {req.evaluated_by && (
                                  <div>
                                    <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Evaluated By</p>
                                    <p className="text-white/80">{req.evaluated_by}</p>
                                  </div>
                                )}
                                {req.last_compliance_evaluation && (
                                  <div>
                                    <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Last Evaluation</p>
                                    <p className="text-white/80">{new Date(req.last_compliance_evaluation).toLocaleDateString('en-ZA')}</p>
                                  </div>
                                )}
                                {req.next_evaluation_date && (
                                  <div>
                                    <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Next Evaluation</p>
                                    <p className="text-white/80">{new Date(req.next_evaluation_date).toLocaleDateString('en-ZA')}</p>
                                  </div>
                                )}
                                {req.permit_number && (
                                  <div>
                                    <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Permit / Licence No.</p>
                                    <p className="text-white/80">{req.permit_number}</p>
                                  </div>
                                )}
                                {req.issue_date && (
                                  <div>
                                    <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Issue Date</p>
                                    <p className="text-white/80">{new Date(req.issue_date).toLocaleDateString('en-ZA')}</p>
                                  </div>
                                )}
                                {req.last_amended && (
                                  <div>
                                    <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Last Amended</p>
                                    <p className="text-white/80">{new Date(req.last_amended).toLocaleDateString('en-ZA')}</p>
                                  </div>
                                )}
                                {req.compliance_evidence && (
                                  <div className="sm:col-span-2 lg:col-span-3">
                                    <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Compliance Evidence</p>
                                    <p className="text-white/80">{req.compliance_evidence}</p>
                                  </div>
                                )}
                                {req.applicability_reason && (
                                  <div className="sm:col-span-2 lg:col-span-3">
                                    <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Applicability Reason</p>
                                    <p className="text-white/80">{req.applicability_reason}</p>
                                  </div>
                                )}
                                {req.amendment_notes && (
                                  <div className="sm:col-span-2 lg:col-span-3">
                                    <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Amendment Notes</p>
                                    <p className="text-white/80">{req.amendment_notes}</p>
                                  </div>
                                )}
                                {req.notes && (
                                  <div className="sm:col-span-2 lg:col-span-3">
                                    <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Notes</p>
                                    <p className="text-white/80">{req.notes}</p>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 sm:p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">
                  {editing ? 'Edit Requirement' : 'Add Legal Requirement'}
                </h2>
                <button onClick={() => setShowForm(false)} className="text-white/40 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Legislation Info */}
              <div className="space-y-4">
                <h3 className="text-white/60 text-xs uppercase tracking-wider font-medium border-b border-white/10 pb-2">Legislation Details</h3>
                <div>
                  <label className="block text-white/70 text-sm mb-1">Legislation Title <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={form.legislation_title}
                    onChange={e => setForm(p => ({ ...p, legislation_title: e.target.value }))}
                    placeholder="e.g. Occupational Health and Safety Act"
                    className="glass-input w-full rounded-lg px-3 py-2 text-sm text-white bg-white/5 border border-white/10 focus:border-purple-500/50 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/70 text-sm mb-1">Legislation Number</label>
                    <input
                      type="text"
                      value={form.legislation_number}
                      onChange={e => setForm(p => ({ ...p, legislation_number: e.target.value }))}
                      placeholder="e.g. Act 85 of 1993"
                      className="glass-input w-full rounded-lg px-3 py-2 text-sm text-white bg-white/5 border border-white/10 focus:border-purple-500/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm mb-1">Section Reference</label>
                    <input
                      type="text"
                      value={form.section_reference}
                      onChange={e => setForm(p => ({ ...p, section_reference: e.target.value }))}
                      placeholder="e.g. Section 8, Regulation 7"
                      className="glass-input w-full rounded-lg px-3 py-2 text-sm text-white bg-white/5 border border-white/10 focus:border-purple-500/50 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/70 text-sm mb-1">Requirement Type</label>
                    <select
                      value={form.requirement_type}
                      onChange={e => setForm(p => ({ ...p, requirement_type: e.target.value }))}
                      className="glass-input w-full rounded-lg px-3 py-2 text-sm text-white bg-white/5 border border-white/10 focus:border-purple-500/50 focus:outline-none"
                    >
                      {REQUIREMENT_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm mb-1">Category</label>
                    <select
                      value={form.category}
                      onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                      className="glass-input w-full rounded-lg px-3 py-2 text-sm text-white bg-white/5 border border-white/10 focus:border-purple-500/50 focus:outline-none"
                    >
                      {CATEGORIES.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/70 text-sm mb-1">Issuing Authority</label>
                    <input
                      type="text"
                      value={form.issuing_authority}
                      onChange={e => setForm(p => ({ ...p, issuing_authority: e.target.value }))}
                      placeholder="e.g. Department of Employment and Labour"
                      className="glass-input w-full rounded-lg px-3 py-2 text-sm text-white bg-white/5 border border-white/10 focus:border-purple-500/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm mb-1">Jurisdiction</label>
                    <input
                      type="text"
                      value={form.jurisdiction}
                      onChange={e => setForm(p => ({ ...p, jurisdiction: e.target.value }))}
                      className="glass-input w-full rounded-lg px-3 py-2 text-sm text-white bg-white/5 border border-white/10 focus:border-purple-500/50 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-1">Applicable To</label>
                  <input
                    type="text"
                    value={form.applicable_to}
                    onChange={e => setForm(p => ({ ...p, applicable_to: e.target.value }))}
                    placeholder="e.g. All employees, Production department"
                    className="glass-input w-full rounded-lg px-3 py-2 text-sm text-white bg-white/5 border border-white/10 focus:border-purple-500/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-1">Applicability Reason</label>
                  <textarea
                    value={form.applicability_reason}
                    onChange={e => setForm(p => ({ ...p, applicability_reason: e.target.value }))}
                    rows={2}
                    placeholder="Why does this requirement apply to your organisation?"
                    className="glass-input w-full rounded-lg px-3 py-2 text-sm text-white bg-white/5 border border-white/10 focus:border-purple-500/50 focus:outline-none resize-none"
                  />
                </div>
              </div>

              {/* Standards */}
              <div className="space-y-3">
                <h3 className="text-white/60 text-xs uppercase tracking-wider font-medium border-b border-white/10 pb-2">Applicable Standards</h3>
                <div className="flex gap-2 flex-wrap">
                  {STANDARDS.map(s => (
                    <button
                      key={s.code}
                      type="button"
                      onClick={() => toggleStandard(s.code)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                        form.standards.includes(s.code)
                          ? 'bg-purple-600 border-purple-500 text-white'
                          : 'bg-white/5 border-white/10 text-white/50 hover:border-white/30'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Compliance Status */}
              <div className="space-y-4">
                <h3 className="text-white/60 text-xs uppercase tracking-wider font-medium border-b border-white/10 pb-2">Compliance Evaluation</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/70 text-sm mb-1">Compliance Status</label>
                    <select
                      value={form.compliance_status}
                      onChange={e => setForm(p => ({ ...p, compliance_status: e.target.value }))}
                      className="glass-input w-full rounded-lg px-3 py-2 text-sm text-white bg-white/5 border border-white/10 focus:border-purple-500/50 focus:outline-none"
                    >
                      {COMPLIANCE_STATUSES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm mb-1">Responsible Person</label>
                    <input
                      type="text"
                      value={form.responsible_person}
                      onChange={e => setForm(p => ({ ...p, responsible_person: e.target.value }))}
                      placeholder="Name or role"
                      className="glass-input w-full rounded-lg px-3 py-2 text-sm text-white bg-white/5 border border-white/10 focus:border-purple-500/50 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/70 text-sm mb-1">Evaluated By</label>
                    <input
                      type="text"
                      value={form.evaluated_by}
                      onChange={e => setForm(p => ({ ...p, evaluated_by: e.target.value }))}
                      placeholder="Person who evaluated compliance"
                      className="glass-input w-full rounded-lg px-3 py-2 text-sm text-white bg-white/5 border border-white/10 focus:border-purple-500/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm mb-1">Last Evaluation Date</label>
                    <input
                      type="date"
                      value={form.last_compliance_evaluation}
                      onChange={e => setForm(p => ({ ...p, last_compliance_evaluation: e.target.value }))}
                      className="glass-input w-full rounded-lg px-3 py-2 text-sm text-white bg-white/5 border border-white/10 focus:border-purple-500/50 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-1">Next Evaluation Date</label>
                  <input
                    type="date"
                    value={form.next_evaluation_date}
                    onChange={e => setForm(p => ({ ...p, next_evaluation_date: e.target.value }))}
                    className="glass-input w-full rounded-lg px-3 py-2 text-sm text-white bg-white/5 border border-white/10 focus:border-purple-500/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-1">Compliance Evidence</label>
                  <textarea
                    value={form.compliance_evidence}
                    onChange={e => setForm(p => ({ ...p, compliance_evidence: e.target.value }))}
                    rows={2}
                    placeholder="Description of evidence demonstrating compliance"
                    className="glass-input w-full rounded-lg px-3 py-2 text-sm text-white bg-white/5 border border-white/10 focus:border-purple-500/50 focus:outline-none resize-none"
                  />
                </div>
              </div>

              {/* Permit / Licence Details */}
              {isPermitType && (
                <div className="space-y-4">
                  <h3 className="text-white/60 text-xs uppercase tracking-wider font-medium border-b border-white/10 pb-2">Permit / Licence Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white/70 text-sm mb-1">Permit / Licence Number</label>
                      <input
                        type="text"
                        value={form.permit_number}
                        onChange={e => setForm(p => ({ ...p, permit_number: e.target.value }))}
                        placeholder="Permit reference number"
                        className="glass-input w-full rounded-lg px-3 py-2 text-sm text-white bg-white/5 border border-white/10 focus:border-purple-500/50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-white/70 text-sm mb-1">Renewal Reminder (days before)</label>
                      <input
                        type="number"
                        value={form.renewal_reminder_days}
                        onChange={e => setForm(p => ({ ...p, renewal_reminder_days: e.target.value }))}
                        min={1}
                        max={365}
                        className="glass-input w-full rounded-lg px-3 py-2 text-sm text-white bg-white/5 border border-white/10 focus:border-purple-500/50 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white/70 text-sm mb-1">Issue Date</label>
                      <input
                        type="date"
                        value={form.issue_date}
                        onChange={e => setForm(p => ({ ...p, issue_date: e.target.value }))}
                        className="glass-input w-full rounded-lg px-3 py-2 text-sm text-white bg-white/5 border border-white/10 focus:border-purple-500/50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-white/70 text-sm mb-1">Expiry Date</label>
                      <input
                        type="date"
                        value={form.expiry_date}
                        onChange={e => setForm(p => ({ ...p, expiry_date: e.target.value }))}
                        className="glass-input w-full rounded-lg px-3 py-2 text-sm text-white bg-white/5 border border-white/10 focus:border-purple-500/50 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Amendments */}
              <div className="space-y-4">
                <h3 className="text-white/60 text-xs uppercase tracking-wider font-medium border-b border-white/10 pb-2">Amendments &amp; Notes</h3>
                <div>
                  <label className="block text-white/70 text-sm mb-1">Last Amended Date</label>
                  <input
                    type="date"
                    value={form.last_amended}
                    onChange={e => setForm(p => ({ ...p, last_amended: e.target.value }))}
                    className="glass-input w-full rounded-lg px-3 py-2 text-sm text-white bg-white/5 border border-white/10 focus:border-purple-500/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-1">Amendment Notes</label>
                  <textarea
                    value={form.amendment_notes}
                    onChange={e => setForm(p => ({ ...p, amendment_notes: e.target.value }))}
                    rows={2}
                    placeholder="What changed in the latest amendment?"
                    className="glass-input w-full rounded-lg px-3 py-2 text-sm text-white bg-white/5 border border-white/10 focus:border-purple-500/50 focus:outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-1">Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                    rows={2}
                    placeholder="Additional notes or context"
                    className="glass-input w-full rounded-lg px-3 py-2 text-sm text-white bg-white/5 border border-white/10 focus:border-purple-500/50 focus:outline-none resize-none"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:border-white/30 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium transition-colors text-sm"
                >
                  {editing ? 'Save Changes' : 'Add Requirement'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {confirmAction?.type === 'delete' && (
        <ConfirmModal
          title="Delete Requirement"
          message={`Delete "${confirmAction.req.legislation_title}"? This action cannot be undone.`}
          confirmLabel="Delete"
          confirmClass="bg-red-600 hover:bg-red-500"
          onConfirm={() => {
            handleDelete(confirmAction.req)
            setConfirmAction(null)
          }}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </Layout>
  )
}

export default LegalRegister

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { supabase } from '../lib/supabase'
import { logActivity } from '../lib/auditLogger'
import Layout from '../components/Layout'
import ConfirmModal from '../components/ConfirmModal'
import SupportingDocuments from '../components/SupportingDocuments'

// ─── Constants ───────────────────────────────────────────────────────────────

const CONDITIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'abnormal', label: 'Abnormal' },
  { value: 'emergency', label: 'Emergency' },
]

const TEMPORALS = [
  { value: 'past', label: 'Past' },
  { value: 'current', label: 'Current' },
  { value: 'planned', label: 'Planned' },
]

const ASPECT_TYPES = [
  { value: 'direct', label: 'Direct' },
  { value: 'indirect', label: 'Indirect' },
]

const IMPACT_CATEGORIES = [
  { value: 'air_emissions', label: 'Air Emissions' },
  { value: 'water_discharge', label: 'Water Discharge' },
  { value: 'land_contamination', label: 'Land Contamination' },
  { value: 'waste_generation', label: 'Waste Generation' },
  { value: 'resource_consumption', label: 'Resource Consumption' },
  { value: 'energy_use', label: 'Energy Use' },
  { value: 'noise_vibration', label: 'Noise / Vibration' },
  { value: 'biodiversity', label: 'Biodiversity' },
  { value: 'visual_impact', label: 'Visual Impact' },
  { value: 'other', label: 'Other' },
]

const IMPACT_DIRECTIONS = [
  { value: 'negative', label: 'Negative' },
  { value: 'positive', label: 'Positive' },
]

const STATUSES = ['Active', 'Under Review', 'Eliminated', 'Archived']

const SIGNIFICANCE_THRESHOLD = 15

const CATEGORY_LABELS = Object.fromEntries(IMPACT_CATEGORIES.map(c => [c.value, c.label]))

const CONDITION_STYLES = {
  normal: 'bg-green-500/20 text-green-400 border-green-500/30',
  abnormal: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  emergency: 'bg-red-500/20 text-red-400 border-red-500/30',
}

const STATUS_STYLES = {
  'Active': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  'Under Review': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'Eliminated': 'bg-white/10 text-white/50 border-white/20',
  'Archived': 'bg-white/5 text-white/30 border-white/10',
}

// ─── Score helpers ────────────────────────────────────────────────────────────

function calcScore(severity, probability, legalFactor, stakeholderConcern) {
  return (
    severity * probability +
    (legalFactor ? 5 : 0) +
    (stakeholderConcern ? 3 : 0)
  )
}

function scoreColor(score) {
  if (score >= 20) return 'text-red-400'
  if (score >= 15) return 'text-orange-400'
  if (score >= 10) return 'text-amber-400'
  return 'text-green-400'
}

function scoreBg(score) {
  if (score >= 20) return 'bg-red-500/20 text-red-400 border-red-500/30'
  if (score >= 15) return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
  if (score >= 10) return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
  return 'bg-green-500/20 text-green-400 border-green-500/30'
}

// ─── Default form state ───────────────────────────────────────────────────────

const defaultForm = {
  activity: '',
  aspect: '',
  impact: '',
  condition: 'normal',
  temporal: 'current',
  aspect_type: 'direct',
  impact_category: 'air_emissions',
  impact_direction: 'negative',
  severity: 1,
  probability: 1,
  frequency: 1,
  legal_factor: false,
  stakeholder_concern: false,
  is_significant: false,
  current_controls: '',
  planned_controls: '',
  responsible_person: '',
  target_date: '',
  standards: ['ISO_14001'],
  clause_references: ['6.1.2'],
  status: 'Active',
  last_reviewed: '',
  next_review_date: '',
  notes: '',
}

// ─── Rating button group ──────────────────────────────────────────────────────

const RatingGroup = ({ label, value, onChange }) => (
  <div>
    <label className="block text-white/60 text-xs mb-2">{label}</label>
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`w-9 h-9 rounded-lg text-sm font-semibold border transition-colors ${
            value === n
              ? n <= 2
                ? 'bg-green-500/30 border-green-500 text-green-300'
                : n === 3
                  ? 'bg-amber-500/30 border-amber-500 text-amber-300'
                  : 'bg-red-500/30 border-red-500 text-red-300'
              : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  </div>
)

// ─── Main component ───────────────────────────────────────────────────────────

const EnvironmentalAspects = () => {
  const { userProfile, getEffectiveCompanyId } = useAuth()
  const toast = useToast()

  const [aspects, setAspects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [expandedRow, setExpandedRow] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)
  const [form, setForm] = useState(defaultForm)

  // Filters
  const [conditionFilter, setConditionFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    if (userProfile) fetchAspects()
  }, [userProfile])

  const fetchAspects = async () => {
    try {
      setLoading(true)
      const companyId = getEffectiveCompanyId()
      if (!companyId) return
      const { data, error } = await supabase
        .from('environmental_aspects')
        .select(
          'id, activity, aspect, impact, condition, temporal, aspect_type, ' +
          'impact_category, impact_direction, severity, probability, frequency, ' +
          'legal_factor, stakeholder_concern, significance_score, is_significant, ' +
          'current_controls, planned_controls, responsible_person, target_date, ' +
          'standards, clause_references, status, last_reviewed, next_review_date, ' +
          'notes, created_by, created_at, updated_at'
        )
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
      if (error) throw error
      setAspects(data || [])
    } catch (err) {
      console.error('Error fetching environmental aspects:', err)
      toast.error('Failed to load environmental aspects register')
    } finally {
      setLoading(false)
    }
  }

  const setField = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

  const openAdd = () => {
    setEditing(null)
    setForm(defaultForm)
    setShowForm(true)
  }

  const openEdit = (asp) => {
    setEditing(asp)
    setForm({
      activity: asp.activity || '',
      aspect: asp.aspect || '',
      impact: asp.impact || '',
      condition: asp.condition || 'normal',
      temporal: asp.temporal || 'current',
      aspect_type: asp.aspect_type || 'direct',
      impact_category: asp.impact_category || 'air_emissions',
      impact_direction: asp.impact_direction || 'negative',
      severity: asp.severity ?? 1,
      probability: asp.probability ?? 1,
      frequency: asp.frequency ?? 1,
      legal_factor: asp.legal_factor ?? false,
      stakeholder_concern: asp.stakeholder_concern ?? false,
      is_significant: asp.is_significant ?? false,
      current_controls: asp.current_controls || '',
      planned_controls: asp.planned_controls || '',
      responsible_person: asp.responsible_person || '',
      target_date: asp.target_date || '',
      standards: asp.standards || ['ISO_14001'],
      clause_references: asp.clause_references || ['6.1.2'],
      status: asp.status || 'Active',
      last_reviewed: asp.last_reviewed || '',
      next_review_date: asp.next_review_date || '',
      notes: asp.notes || '',
    })
    setShowForm(true)
    setExpandedRow(null)
  }

  const handleSave = async () => {
    if (!form.activity.trim()) { toast.error('Activity is required'); return }
    if (!form.aspect.trim()) { toast.error('Aspect is required'); return }
    if (!form.impact.trim()) { toast.error('Impact is required'); return }

    try {
      const companyId = getEffectiveCompanyId()
      // NOTE: significance_score is a GENERATED column — omit from payload
      const payload = {
        company_id: companyId,
        activity: form.activity.trim(),
        aspect: form.aspect.trim(),
        impact: form.impact.trim(),
        condition: form.condition,
        temporal: form.temporal,
        aspect_type: form.aspect_type,
        impact_category: form.impact_category,
        impact_direction: form.impact_direction,
        severity: form.severity,
        probability: form.probability,
        frequency: form.frequency,
        legal_factor: form.legal_factor,
        stakeholder_concern: form.stakeholder_concern,
        is_significant: form.is_significant,
        current_controls: form.current_controls.trim() || null,
        planned_controls: form.planned_controls.trim() || null,
        responsible_person: form.responsible_person.trim() || null,
        target_date: form.target_date || null,
        standards: form.standards,
        clause_references: form.clause_references,
        status: form.status,
        last_reviewed: form.last_reviewed || null,
        next_review_date: form.next_review_date || null,
        notes: form.notes.trim() || null,
      }

      if (editing) {
        const { error } = await supabase
          .from('environmental_aspects')
          .update(payload)
          .eq('id', editing.id)
        if (error) throw error
        await logActivity({
          companyId,
          userId: userProfile.id,
          action: 'updated',
          entityType: 'environmental_aspect',
          entityId: editing.id,
          changes: { activity: form.activity, aspect: form.aspect, is_significant: form.is_significant },
        })
        toast.success('Aspect updated')
      } else {
        payload.created_by = userProfile.id
        const { data, error } = await supabase
          .from('environmental_aspects')
          .insert(payload)
          .select('id')
          .single()
        if (error) throw error
        await logActivity({
          companyId,
          userId: userProfile.id,
          action: 'created',
          entityType: 'environmental_aspect',
          entityId: data.id,
          changes: { activity: form.activity, aspect: form.aspect, impact_category: form.impact_category },
        })
        toast.success('Aspect added')
      }
      setShowForm(false)
      fetchAspects()
    } catch (err) {
      console.error('Error saving environmental aspect:', err)
      toast.error('Failed to save aspect')
    }
  }

  const handleDelete = async (asp) => {
    try {
      const { error } = await supabase
        .from('environmental_aspects')
        .delete()
        .eq('id', asp.id)
      if (error) throw error
      await logActivity({
        companyId: getEffectiveCompanyId(),
        userId: userProfile.id,
        action: 'deleted',
        entityType: 'environmental_aspect',
        entityId: asp.id,
        changes: { activity: asp.activity, aspect: asp.aspect },
      })
      toast.success('Aspect deleted')
      setExpandedRow(null)
      fetchAspects()
    } catch (err) {
      console.error('Error deleting environmental aspect:', err)
      toast.error('Failed to delete aspect')
    }
  }

  // ─── KPIs ──────────────────────────────────────────────────────────────────

  const kpis = useMemo(() => {
    const total = aspects.length
    const significant = aspects.filter(a => a.is_significant).length
    const controlled = aspects.filter(a => a.current_controls && a.current_controls.trim()).length
    const uncontrolled = aspects.filter(a => a.is_significant && (!a.current_controls || !a.current_controls.trim())).length
    return { total, significant, controlled, uncontrolled }
  }, [aspects])

  // ─── Filtered list ─────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    return aspects.filter(a => {
      if (conditionFilter !== 'all' && a.condition !== conditionFilter) return false
      if (categoryFilter !== 'all' && a.impact_category !== categoryFilter) return false
      if (statusFilter !== 'all' && a.status !== statusFilter) return false
      return true
    })
  }, [aspects, conditionFilter, categoryFilter, statusFilter])

  // ─── Live score preview ────────────────────────────────────────────────────

  const previewScore = calcScore(form.severity, form.probability, form.legal_factor, form.stakeholder_concern)
  const scoreSuggestion = previewScore >= SIGNIFICANCE_THRESHOLD

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Environmental Aspects Register</h1>
            <p className="text-white/50 text-sm mt-1">ISO 14001 §6.1.2 — Environmental Aspects &amp; Impacts</p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-medium transition-colors text-sm w-fit"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Aspect
          </button>
        </div>

        {/* ISO Reference Card */}
        <div className="glass-card rounded-xl p-4 border border-cyan-500/20 bg-cyan-500/5">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-cyan-300 font-semibold text-sm">ISO 14001 §6.1.2 — Environmental Aspects</p>
              <p className="text-white/60 text-sm mt-1">
                Requires determining environmental aspects within the defined scope, associated environmental impacts, and significant
                environmental aspects using established criteria. Significance score = Severity × Probability + Legal factor (+5) + Stakeholder concern (+3).
                Score ≥{SIGNIFICANCE_THRESHOLD} is flagged as potentially significant.
              </p>
            </div>
          </div>
        </div>

        <SupportingDocuments standard="ISO 14001" clause="6.1.2" clauseNum={6} clauseName="Clause 6: Planning" entityType="environmental_aspects" title="Existing Aspects & Impacts Documents" />

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card rounded-xl p-4">
            <p className="text-white/50 text-xs uppercase tracking-wider">Total Aspects</p>
            <p className="text-3xl font-bold text-white mt-1">{kpis.total}</p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <p className="text-white/50 text-xs uppercase tracking-wider">Significant</p>
            <p className={`text-3xl font-bold mt-1 ${kpis.significant > 0 ? 'text-orange-400' : 'text-white/40'}`}>{kpis.significant}</p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <p className="text-white/50 text-xs uppercase tracking-wider">Controlled</p>
            <p className="text-3xl font-bold text-green-400 mt-1">{kpis.controlled}</p>
            <p className="text-white/30 text-xs mt-0.5">have controls</p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <p className="text-white/50 text-xs uppercase tracking-wider">Uncontrolled</p>
            <p className={`text-3xl font-bold mt-1 ${kpis.uncontrolled > 0 ? 'text-red-400' : 'text-white/40'}`}>{kpis.uncontrolled}</p>
            <p className="text-white/30 text-xs mt-0.5">significant, no controls</p>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-card rounded-xl p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={conditionFilter}
              onChange={e => setConditionFilter(e.target.value)}
              className="glass-input rounded-lg px-3 py-2 text-sm text-white bg-white/5 border border-white/10 flex-1"
            >
              <option value="all">All Conditions</option>
              {CONDITIONS.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="glass-input rounded-lg px-3 py-2 text-sm text-white bg-white/5 border border-white/10 flex-1"
            >
              <option value="all">All Categories</option>
              {IMPACT_CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="glass-input rounded-lg px-3 py-2 text-sm text-white bg-white/5 border border-white/10 flex-1"
            >
              <option value="all">All Statuses</option>
              {STATUSES.map(s => (
                <option key={s} value={s}>{s}</option>
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-white/40 text-sm">
                {aspects.length === 0
                  ? 'No environmental aspects added yet. Click "Add Aspect" to get started.'
                  : 'No aspects match the selected filters.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left px-4 py-3 text-white/50 text-xs uppercase tracking-wider font-medium">Activity / Aspect</th>
                    <th className="text-left px-4 py-3 text-white/50 text-xs uppercase tracking-wider font-medium hidden sm:table-cell">Condition</th>
                    <th className="text-left px-4 py-3 text-white/50 text-xs uppercase tracking-wider font-medium hidden md:table-cell">Category</th>
                    <th className="text-left px-4 py-3 text-white/50 text-xs uppercase tracking-wider font-medium">Score</th>
                    <th className="text-left px-4 py-3 text-white/50 text-xs uppercase tracking-wider font-medium">Significant?</th>
                    <th className="text-left px-4 py-3 text-white/50 text-xs uppercase tracking-wider font-medium hidden lg:table-cell">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.map(asp => {
                    const isExpanded = expandedRow === asp.id
                    const score = asp.significance_score ?? calcScore(asp.severity, asp.probability, asp.legal_factor, asp.stakeholder_concern)

                    return (
                      <>
                        <tr
                          key={asp.id}
                          className="hover:bg-white/[0.02] cursor-pointer transition-colors"
                          onClick={() => setExpandedRow(isExpanded ? null : asp.id)}
                        >
                          <td className="px-4 py-3">
                            <p className="text-white text-sm font-medium truncate max-w-[180px]">{asp.activity}</p>
                            <p className="text-white/40 text-xs truncate max-w-[180px] mt-0.5">{asp.aspect}</p>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${CONDITION_STYLES[asp.condition] || 'bg-white/10 text-white/50 border-white/20'}`}>
                              {CONDITIONS.find(c => c.value === asp.condition)?.label || asp.condition}
                            </span>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <p className="text-white/60 text-sm">{CATEGORY_LABELS[asp.impact_category] || asp.impact_category}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center justify-center w-10 h-7 rounded-lg text-sm font-bold border ${scoreBg(score)}`}>
                              {score}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {asp.is_significant ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border bg-red-500/20 text-red-400 border-red-500/30">
                                Yes
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-white/5 text-white/30 border-white/10">
                                No
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[asp.status] || 'bg-white/10 text-white/50 border-white/20'}`}>
                              {asp.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 justify-end">
                              <button
                                onClick={e => { e.stopPropagation(); openEdit(asp) }}
                                className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors"
                                title="Edit"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={e => { e.stopPropagation(); setConfirmAction({ type: 'delete', item: asp }) }}
                                className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors"
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
                          <tr key={`${asp.id}-expanded`} className="bg-white/[0.015]">
                            <td colSpan={7} className="px-4 py-5">
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                                <div>
                                  <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Impact</p>
                                  <p className="text-white/80">{asp.impact}</p>
                                </div>
                                <div>
                                  <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Direction</p>
                                  <p className={asp.impact_direction === 'positive' ? 'text-green-400' : 'text-red-400'}>
                                    {asp.impact_direction === 'positive' ? 'Positive' : 'Negative'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Type</p>
                                  <p className="text-white/70 capitalize">{asp.aspect_type}</p>
                                </div>
                                <div>
                                  <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Temporal</p>
                                  <p className="text-white/70 capitalize">{asp.temporal}</p>
                                </div>
                                <div>
                                  <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Scoring (S × P)</p>
                                  <p className="text-white/70">
                                    {asp.severity} × {asp.probability} = {asp.severity * asp.probability}
                                    {asp.legal_factor && <span className="text-amber-400 ml-1">+5 Legal</span>}
                                    {asp.stakeholder_concern && <span className="text-cyan-400 ml-1">+3 Stakeholder</span>}
                                    <span className={`ml-2 font-bold ${scoreColor(score)}`}>= {score}</span>
                                  </p>
                                </div>
                                <div>
                                  <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Frequency</p>
                                  <p className="text-white/70">{asp.frequency}/5</p>
                                </div>
                                {asp.current_controls && (
                                  <div className="sm:col-span-2 lg:col-span-3">
                                    <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Current Controls</p>
                                    <p className="text-white/80">{asp.current_controls}</p>
                                  </div>
                                )}
                                {asp.planned_controls && (
                                  <div className="sm:col-span-2 lg:col-span-3">
                                    <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Planned Controls</p>
                                    <p className="text-white/80">{asp.planned_controls}</p>
                                  </div>
                                )}
                                {asp.responsible_person && (
                                  <div>
                                    <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Responsible Person</p>
                                    <p className="text-white/70">{asp.responsible_person}</p>
                                  </div>
                                )}
                                {asp.target_date && (
                                  <div>
                                    <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Target Date</p>
                                    <p className="text-white/70">{asp.target_date}</p>
                                  </div>
                                )}
                                {asp.next_review_date && (
                                  <div>
                                    <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Next Review</p>
                                    <p className="text-white/70">{asp.next_review_date}</p>
                                  </div>
                                )}
                                {asp.notes && (
                                  <div className="sm:col-span-2 lg:col-span-3">
                                    <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Notes</p>
                                    <p className="text-white/60 italic">{asp.notes}</p>
                                  </div>
                                )}
                                <div>
                                  <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Standards</p>
                                  <p className="text-white/60">{(asp.standards || []).join(', ')}</p>
                                </div>
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

      {/* ─── CRUD Modal ───────────────────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative glass-card rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-[#0f0025]/90 backdrop-blur-sm px-6 py-4 border-b border-white/10 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-white">
                {editing ? 'Edit Aspect' : 'Add Environmental Aspect'}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-6">

              {/* Core identification */}
              <div className="space-y-4">
                <h3 className="text-white/70 text-xs font-semibold uppercase tracking-wider">Identification</h3>

                <div>
                  <label className="block text-white/60 text-xs mb-1.5">Activity <span className="text-red-400">*</span></label>
                  <input
                    value={form.activity}
                    onChange={e => setField('activity', e.target.value)}
                    placeholder="e.g. Vehicle maintenance"
                    className="glass-input w-full rounded-lg px-3 py-2 text-sm text-white bg-white/5 border border-white/10 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-white/60 text-xs mb-1.5">Environmental Aspect <span className="text-red-400">*</span></label>
                  <input
                    value={form.aspect}
                    onChange={e => setField('aspect', e.target.value)}
                    placeholder="e.g. Oil / fluid spill"
                    className="glass-input w-full rounded-lg px-3 py-2 text-sm text-white bg-white/5 border border-white/10 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-white/60 text-xs mb-1.5">Environmental Impact <span className="text-red-400">*</span></label>
                  <input
                    value={form.impact}
                    onChange={e => setField('impact', e.target.value)}
                    placeholder="e.g. Soil / groundwater contamination"
                    className="glass-input w-full rounded-lg px-3 py-2 text-sm text-white bg-white/5 border border-white/10 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/60 text-xs mb-1.5">Condition</label>
                    <select
                      value={form.condition}
                      onChange={e => setField('condition', e.target.value)}
                      className="glass-input w-full rounded-lg px-3 py-2 text-sm text-white bg-white/5 border border-white/10 focus:border-purple-500 focus:outline-none"
                    >
                      {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-white/60 text-xs mb-1.5">Temporal</label>
                    <select
                      value={form.temporal}
                      onChange={e => setField('temporal', e.target.value)}
                      className="glass-input w-full rounded-lg px-3 py-2 text-sm text-white bg-white/5 border border-white/10 focus:border-purple-500 focus:outline-none"
                    >
                      {TEMPORALS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/60 text-xs mb-1.5">Impact Category</label>
                    <select
                      value={form.impact_category}
                      onChange={e => setField('impact_category', e.target.value)}
                      className="glass-input w-full rounded-lg px-3 py-2 text-sm text-white bg-white/5 border border-white/10 focus:border-purple-500 focus:outline-none"
                    >
                      {IMPACT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-white/60 text-xs mb-1.5">Aspect Type</label>
                    <select
                      value={form.aspect_type}
                      onChange={e => setField('aspect_type', e.target.value)}
                      className="glass-input w-full rounded-lg px-3 py-2 text-sm text-white bg-white/5 border border-white/10 focus:border-purple-500 focus:outline-none"
                    >
                      {ASPECT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-white/60 text-xs mb-1.5">Impact Direction</label>
                  <div className="flex gap-3">
                    {IMPACT_DIRECTIONS.map(d => (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => setField('impact_direction', d.value)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                          form.impact_direction === d.value
                            ? d.value === 'negative'
                              ? 'bg-red-500/20 border-red-500 text-red-300'
                              : 'bg-green-500/20 border-green-500 text-green-300'
                            : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Significance scoring */}
              <div className="space-y-4">
                <h3 className="text-white/70 text-xs font-semibold uppercase tracking-wider">Significance Scoring</h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <RatingGroup label="Severity (1–5)" value={form.severity} onChange={v => setField('severity', v)} />
                  <RatingGroup label="Probability (1–5)" value={form.probability} onChange={v => setField('probability', v)} />
                  <RatingGroup label="Frequency (1–5)" value={form.frequency} onChange={v => setField('frequency', v)} />
                </div>

                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.legal_factor}
                      onChange={e => setField('legal_factor', e.target.checked)}
                      className="w-4 h-4 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500"
                    />
                    <span className="text-white/70 text-sm">Legal/regulatory factor (+5)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.stakeholder_concern}
                      onChange={e => setField('stakeholder_concern', e.target.checked)}
                      className="w-4 h-4 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500"
                    />
                    <span className="text-white/70 text-sm">Stakeholder concern (+3)</span>
                  </label>
                </div>

                {/* Score preview */}
                <div className={`rounded-xl p-4 border flex items-center justify-between ${scoreBg(previewScore)}`}>
                  <div>
                    <p className="text-xs opacity-70 uppercase tracking-wider font-medium">Calculated Score</p>
                    <p className="text-xs opacity-60 mt-0.5">
                      {form.severity} × {form.probability}
                      {form.legal_factor ? ' + 5' : ''}
                      {form.stakeholder_concern ? ' + 3' : ''}
                    </p>
                  </div>
                  <p className="text-4xl font-bold">{previewScore}</p>
                </div>

                {scoreSuggestion && (
                  <p className="text-amber-400 text-xs">
                    Score ≥{SIGNIFICANCE_THRESHOLD} — this aspect is suggested as significant. Confirm below.
                  </p>
                )}

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_significant}
                    onChange={e => setField('is_significant', e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500"
                  />
                  <span className="text-white/80 text-sm font-medium">Mark as Significant Environmental Aspect</span>
                </label>
              </div>

              {/* Controls */}
              <div className="space-y-4">
                <h3 className="text-white/70 text-xs font-semibold uppercase tracking-wider">Controls &amp; Actions</h3>

                <div>
                  <label className="block text-white/60 text-xs mb-1.5">Current Controls</label>
                  <textarea
                    value={form.current_controls}
                    onChange={e => setField('current_controls', e.target.value)}
                    rows={3}
                    placeholder="Describe existing controls, procedures, or mitigation measures..."
                    className="glass-input w-full rounded-lg px-3 py-2 text-sm text-white bg-white/5 border border-white/10 focus:border-purple-500 focus:outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-white/60 text-xs mb-1.5">Planned Controls</label>
                  <textarea
                    value={form.planned_controls}
                    onChange={e => setField('planned_controls', e.target.value)}
                    rows={2}
                    placeholder="Planned improvements or additional controls..."
                    className="glass-input w-full rounded-lg px-3 py-2 text-sm text-white bg-white/5 border border-white/10 focus:border-purple-500 focus:outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/60 text-xs mb-1.5">Responsible Person</label>
                    <input
                      value={form.responsible_person}
                      onChange={e => setField('responsible_person', e.target.value)}
                      placeholder="e.g. Environmental Manager"
                      className="glass-input w-full rounded-lg px-3 py-2 text-sm text-white bg-white/5 border border-white/10 focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-white/60 text-xs mb-1.5">Target Date</label>
                    <input
                      type="date"
                      value={form.target_date}
                      onChange={e => setField('target_date', e.target.value)}
                      className="glass-input w-full rounded-lg px-3 py-2 text-sm text-white bg-white/5 border border-white/10 focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Review & Status */}
              <div className="space-y-4">
                <h3 className="text-white/70 text-xs font-semibold uppercase tracking-wider">Status &amp; Review</h3>

                <div>
                  <label className="block text-white/60 text-xs mb-1.5">Status</label>
                  <div className="flex flex-wrap gap-2">
                    {STATUSES.map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setField('status', s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          form.status === s
                            ? STATUS_STYLES[s] || 'bg-purple-500/20 border-purple-500 text-purple-300'
                            : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/60 text-xs mb-1.5">Last Reviewed</label>
                    <input
                      type="date"
                      value={form.last_reviewed}
                      onChange={e => setField('last_reviewed', e.target.value)}
                      className="glass-input w-full rounded-lg px-3 py-2 text-sm text-white bg-white/5 border border-white/10 focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-white/60 text-xs mb-1.5">Next Review Date</label>
                    <input
                      type="date"
                      value={form.next_review_date}
                      onChange={e => setField('next_review_date', e.target.value)}
                      className="glass-input w-full rounded-lg px-3 py-2 text-sm text-white bg-white/5 border border-white/10 focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/60 text-xs mb-1.5">Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={e => setField('notes', e.target.value)}
                    rows={2}
                    placeholder="Additional notes..."
                    className="glass-input w-full rounded-lg px-3 py-2 text-sm text-white bg-white/5 border border-white/10 focus:border-purple-500 focus:outline-none resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="sticky bottom-0 bg-[#0f0025]/90 backdrop-blur-sm px-6 py-4 border-t border-white/10 flex gap-3 justify-end">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-xl text-sm text-white/60 hover:text-white/80 hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2 rounded-xl text-sm font-medium bg-purple-600 hover:bg-purple-500 text-white transition-colors"
              >
                {editing ? 'Save Changes' : 'Add Aspect'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete */}
      {confirmAction?.type === 'delete' && (
        <ConfirmModal
          title="Delete Environmental Aspect"
          message={`Are you sure you want to delete the aspect "${confirmAction.item.aspect}" for activity "${confirmAction.item.activity}"? This cannot be undone.`}
          confirmLabel="Delete"
          confirmClass="bg-red-600 hover:bg-red-500"
          onConfirm={() => { handleDelete(confirmAction.item); setConfirmAction(null) }}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </Layout>
  )
}

export default EnvironmentalAspects

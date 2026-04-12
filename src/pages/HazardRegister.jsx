import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { supabase } from '../lib/supabase'
import { logActivity } from '../lib/auditLogger'
import Layout from '../components/Layout'
import ConfirmModal from '../components/ConfirmModal'

// ─── Constants ───────────────────────────────────────────────────────────────

const HAZARD_CATEGORIES = [
  { value: 'physical', label: 'Physical' },
  { value: 'chemical', label: 'Chemical' },
  { value: 'biological', label: 'Biological' },
  { value: 'ergonomic', label: 'Ergonomic' },
  { value: 'psychosocial', label: 'Psychosocial' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'mechanical', label: 'Mechanical' },
  { value: 'fire', label: 'Fire' },
  { value: 'environmental', label: 'Environmental' },
  { value: 'vehicular', label: 'Vehicular' },
  { value: 'working_at_height', label: 'Working at Height' },
  { value: 'confined_space', label: 'Confined Space' },
  { value: 'other', label: 'Other' },
]

const CATEGORY_LABELS = Object.fromEntries(HAZARD_CATEGORIES.map(c => [c.value, c.label]))

const STATUSES = ['Active', 'Under Review', 'Eliminated', 'Archived']

const STATUS_STYLES = {
  'Active': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  'Under Review': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'Eliminated': 'bg-white/10 text-white/50 border-white/20',
  'Archived': 'bg-white/5 text-white/30 border-white/10',
}

const HIERARCHY_CONTROLS = [
  { key: 'control_elimination', label: '1. Elimination', desc: 'Remove the hazard entirely', color: 'text-green-400' },
  { key: 'control_substitution', label: '2. Substitution', desc: 'Replace with something less hazardous', color: 'text-emerald-400' },
  { key: 'control_engineering', label: '3. Engineering Controls', desc: 'Isolate people from the hazard', color: 'text-cyan-400' },
  { key: 'control_administrative', label: '4. Administrative Controls', desc: 'Change how people work', color: 'text-amber-400' },
  { key: 'control_ppe', label: '5. PPE', desc: 'Protect the worker (last resort)', color: 'text-orange-400' },
]

// ─── Risk helpers ─────────────────────────────────────────────────────────────

function riskRating(likelihood, severity) {
  return (likelihood ?? 1) * (severity ?? 1)
}

function riskBand(score) {
  if (score >= 16) return { label: 'Critical', bg: 'bg-red-500/20 text-red-400 border-red-500/30', dot: 'bg-red-400' }
  if (score >= 10) return { label: 'High', bg: 'bg-orange-500/20 text-orange-400 border-orange-500/30', dot: 'bg-orange-400' }
  if (score >= 5) return { label: 'Medium', bg: 'bg-amber-500/20 text-amber-400 border-amber-500/30', dot: 'bg-amber-400' }
  return { label: 'Low', bg: 'bg-green-500/20 text-green-400 border-green-500/30', dot: 'bg-green-400' }
}

function matrixCellColor(score) {
  if (score >= 16) return 'bg-red-500/40 text-red-300'
  if (score >= 10) return 'bg-orange-500/40 text-orange-300'
  if (score >= 5) return 'bg-amber-500/40 text-amber-300'
  return 'bg-green-500/30 text-green-300'
}

// ─── Default form ─────────────────────────────────────────────────────────────

const defaultForm = {
  location_area: '',
  activity: '',
  hazard: '',
  potential_harm: '',
  who_at_risk: '',
  hazard_category: 'physical',
  routine: true,
  pre_likelihood: 1,
  pre_severity: 1,
  control_elimination: '',
  control_substitution: '',
  control_engineering: '',
  control_administrative: '',
  control_ppe: '',
  post_likelihood: 1,
  post_severity: 1,
  responsible_person: '',
  target_date: '',
  standards: ['ISO_45001'],
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

const HazardRegister = () => {
  const { userProfile, getEffectiveCompanyId } = useAuth()
  const toast = useToast()

  const [hazards, setHazards] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [expandedRow, setExpandedRow] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)
  const [form, setForm] = useState(defaultForm)
  const [showMatrix, setShowMatrix] = useState(false)

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [riskFilter, setRiskFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    if (userProfile) fetchHazards()
  }, [userProfile])

  const fetchHazards = async () => {
    try {
      setLoading(true)
      const companyId = getEffectiveCompanyId()
      if (!companyId) return
      const { data, error } = await supabase
        .from('hazards')
        .select(
          'id, location_area, activity, hazard, potential_harm, who_at_risk, ' +
          'hazard_category, routine, pre_likelihood, pre_severity, pre_risk_rating, ' +
          'control_elimination, control_substitution, control_engineering, ' +
          'control_administrative, control_ppe, post_likelihood, post_severity, ' +
          'post_risk_rating, responsible_person, target_date, standards, ' +
          'clause_references, status, last_reviewed, next_review_date, notes, ' +
          'created_by, created_at, updated_at'
        )
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
      if (error) throw error
      setHazards(data || [])
    } catch (err) {
      console.error('Error fetching hazards:', err)
      toast.error('Failed to load hazard register')
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

  const openEdit = (h) => {
    setEditing(h)
    setForm({
      location_area: h.location_area || '',
      activity: h.activity || '',
      hazard: h.hazard || '',
      potential_harm: h.potential_harm || '',
      who_at_risk: h.who_at_risk || '',
      hazard_category: h.hazard_category || 'physical',
      routine: h.routine ?? true,
      pre_likelihood: h.pre_likelihood ?? 1,
      pre_severity: h.pre_severity ?? 1,
      control_elimination: h.control_elimination || '',
      control_substitution: h.control_substitution || '',
      control_engineering: h.control_engineering || '',
      control_administrative: h.control_administrative || '',
      control_ppe: h.control_ppe || '',
      post_likelihood: h.post_likelihood ?? 1,
      post_severity: h.post_severity ?? 1,
      responsible_person: h.responsible_person || '',
      target_date: h.target_date || '',
      standards: h.standards || ['ISO_45001'],
      clause_references: h.clause_references || ['6.1.2'],
      status: h.status || 'Active',
      last_reviewed: h.last_reviewed || '',
      next_review_date: h.next_review_date || '',
      notes: h.notes || '',
    })
    setShowForm(true)
    setExpandedRow(null)
  }

  const handleSave = async () => {
    if (!form.location_area.trim()) { toast.error('Location / area is required'); return }
    if (!form.activity.trim()) { toast.error('Activity is required'); return }
    if (!form.hazard.trim()) { toast.error('Hazard description is required'); return }
    if (!form.potential_harm.trim()) { toast.error('Potential harm is required'); return }

    try {
      const companyId = getEffectiveCompanyId()
      // NOTE: pre_risk_rating and post_risk_rating are GENERATED columns — omit from payload
      const payload = {
        company_id: companyId,
        location_area: form.location_area.trim(),
        activity: form.activity.trim(),
        hazard: form.hazard.trim(),
        potential_harm: form.potential_harm.trim(),
        who_at_risk: form.who_at_risk.trim() || null,
        hazard_category: form.hazard_category,
        routine: form.routine,
        pre_likelihood: form.pre_likelihood,
        pre_severity: form.pre_severity,
        control_elimination: form.control_elimination.trim() || null,
        control_substitution: form.control_substitution.trim() || null,
        control_engineering: form.control_engineering.trim() || null,
        control_administrative: form.control_administrative.trim() || null,
        control_ppe: form.control_ppe.trim() || null,
        post_likelihood: form.post_likelihood,
        post_severity: form.post_severity,
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
          .from('hazards')
          .update(payload)
          .eq('id', editing.id)
        if (error) throw error
        await logActivity({
          companyId,
          userId: userProfile.id,
          action: 'updated',
          entityType: 'hazard',
          entityId: editing.id,
          changes: {
            hazard: form.hazard,
            hazard_category: form.hazard_category,
            status: form.status,
            post_risk: riskRating(form.post_likelihood, form.post_severity),
          },
        })
        toast.success('Hazard updated')
      } else {
        payload.created_by = userProfile.id
        const { data, error } = await supabase
          .from('hazards')
          .insert(payload)
          .select('id')
          .single()
        if (error) throw error
        await logActivity({
          companyId,
          userId: userProfile.id,
          action: 'created',
          entityType: 'hazard',
          entityId: data.id,
          changes: {
            hazard: form.hazard,
            hazard_category: form.hazard_category,
            pre_risk: riskRating(form.pre_likelihood, form.pre_severity),
          },
        })
        toast.success('Hazard added')
      }
      setShowForm(false)
      fetchHazards()
    } catch (err) {
      console.error('Error saving hazard:', err)
      toast.error('Failed to save hazard')
    }
  }

  const handleDelete = async (h) => {
    try {
      const { error } = await supabase
        .from('hazards')
        .delete()
        .eq('id', h.id)
      if (error) throw error
      await logActivity({
        companyId: getEffectiveCompanyId(),
        userId: userProfile.id,
        action: 'deleted',
        entityType: 'hazard',
        entityId: h.id,
        changes: { hazard: h.hazard, hazard_category: h.hazard_category },
      })
      toast.success('Hazard deleted')
      setExpandedRow(null)
      fetchHazards()
    } catch (err) {
      console.error('Error deleting hazard:', err)
      toast.error('Failed to delete hazard')
    }
  }

  // ─── Filtered list ─────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    return hazards.filter(h => {
      const postScore = h.post_risk_rating ?? riskRating(h.post_likelihood, h.post_severity)
      const band = riskBand(postScore).label

      if (categoryFilter !== 'all' && h.hazard_category !== categoryFilter) return false
      if (statusFilter !== 'all' && h.status !== statusFilter) return false
      if (riskFilter !== 'all' && band.toLowerCase() !== riskFilter) return false
      return true
    })
  }, [hazards, categoryFilter, statusFilter, riskFilter])

  // ─── KPI stats ─────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const active = hazards.filter(h => h.status === 'Active')
    const critical = active.filter(h => {
      const s = h.post_risk_rating ?? riskRating(h.post_likelihood, h.post_severity)
      return s >= 16
    })
    const high = active.filter(h => {
      const s = h.post_risk_rating ?? riskRating(h.post_likelihood, h.post_severity)
      return s >= 10 && s < 16
    })
    const controlled = hazards.filter(h => {
      const pre = h.pre_risk_rating ?? riskRating(h.pre_likelihood, h.pre_severity)
      const post = h.post_risk_rating ?? riskRating(h.post_likelihood, h.post_severity)
      return post < pre
    })
    return { total: hazards.length, critical: critical.length, high: high.length, controlled: controlled.length }
  }, [hazards])

  // ─── Risk matrix data (post-risk, 5x5 grid) ───────────────────────────────

  const matrixData = useMemo(() => {
    const grid = {}
    hazards.forEach(h => {
      const l = h.post_likelihood ?? 1
      const s = h.post_severity ?? 1
      const key = `${l}-${s}`
      if (!grid[key]) grid[key] = 0
      grid[key]++
    })
    return grid
  }, [hazards])

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <Layout>
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">HIRA / Hazard Register</h1>
              <p className="text-white/50 text-sm mt-1">ISO 45001 §6.1.2 — Hazard Identification & Risk Assessment</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setShowMatrix(v => !v)}
                className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-white/70 text-sm hover:bg-white/10 transition-colors"
              >
                {showMatrix ? 'Hide Matrix' : 'Risk Matrix'}
              </button>
              <button
                onClick={openAdd}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                + Add Hazard
              </button>
            </div>
          </div>

          {/* ISO Reference Card */}
          <div className="glass glass-border rounded-xl p-4 border-l-4 border-cyan-500/60">
            <p className="text-white/70 text-sm leading-relaxed">
              <span className="text-cyan-400 font-semibold">ISO 45001 §6.1.2</span> requires hazard identification considering routine and non-routine activities.{' '}
              <span className="text-purple-300 font-semibold">§8.1.2</span> requires applying the hierarchy of controls:{' '}
              <span className="text-green-400">Elimination</span> →{' '}
              <span className="text-emerald-400">Substitution</span> →{' '}
              <span className="text-cyan-400">Engineering</span> →{' '}
              <span className="text-amber-400">Administrative</span> →{' '}
              <span className="text-orange-400">PPE</span>
            </p>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Hazards', value: stats.total, color: 'text-white' },
              { label: 'Critical (≥16)', value: stats.critical, color: 'text-red-400' },
              { label: 'High (10–15)', value: stats.high, color: 'text-orange-400' },
              { label: 'Controlled', value: stats.controlled, color: 'text-green-400' },
            ].map(k => (
              <div key={k.label} className="glass glass-border rounded-xl p-4">
                <p className="text-white/50 text-xs mb-1">{k.label}</p>
                <p className={`text-3xl font-bold ${k.color}`}>{k.value}</p>
              </div>
            ))}
          </div>

          {/* Risk Matrix */}
          {showMatrix && (
            <div className="glass glass-border rounded-xl p-5">
              <h2 className="text-white font-semibold mb-4 text-sm">
                Risk Matrix — Post-Control (Likelihood × Severity)
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-center text-xs">
                  <thead>
                    <tr>
                      <th className="w-24 text-white/40 text-right pr-3 pb-2">Likelihood ↓ / Severity →</th>
                      {[1, 2, 3, 4, 5].map(s => (
                        <th key={s} className="w-16 pb-2 text-white/50 font-semibold">{s}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[5, 4, 3, 2, 1].map(l => (
                      <tr key={l}>
                        <td className="text-white/50 text-right pr-3 py-1 font-semibold">{l}</td>
                        {[1, 2, 3, 4, 5].map(s => {
                          const score = l * s
                          const count = matrixData[`${l}-${s}`] || 0
                          return (
                            <td key={s} className="py-1 px-1">
                              <div className={`rounded-lg h-12 flex flex-col items-center justify-center ${matrixCellColor(score)} border border-white/10`}>
                                <span className="font-bold">{score}</span>
                                {count > 0 && (
                                  <span className="text-[10px] font-semibold opacity-80">{count} hazard{count !== 1 ? 's' : ''}</span>
                                )}
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex flex-wrap gap-3 mt-3 text-xs">
                  {[
                    { label: 'Low (1–4)', color: 'bg-green-500/30' },
                    { label: 'Medium (5–9)', color: 'bg-amber-500/30' },
                    { label: 'High (10–15)', color: 'bg-orange-500/30' },
                    { label: 'Critical (16–25)', color: 'bg-red-500/30' },
                  ].map(b => (
                    <span key={b.label} className="flex items-center gap-1.5 text-white/60">
                      <span className={`w-3 h-3 rounded ${b.color}`} />
                      {b.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="glass glass-border rounded-xl p-4 flex flex-wrap gap-3">
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="glass-input rounded-xl px-3 py-2 text-sm text-white bg-transparent border border-white/10 focus:outline-none focus:border-purple-500/50"
            >
              <option value="all">All Categories</option>
              {HAZARD_CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <select
              value={riskFilter}
              onChange={e => setRiskFilter(e.target.value)}
              className="glass-input rounded-xl px-3 py-2 text-sm text-white bg-transparent border border-white/10 focus:outline-none focus:border-purple-500/50"
            >
              <option value="all">All Risk Levels</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="glass-input rounded-xl px-3 py-2 text-sm text-white bg-transparent border border-white/10 focus:outline-none focus:border-purple-500/50"
            >
              <option value="all">All Statuses</option>
              {STATUSES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {(categoryFilter !== 'all' || riskFilter !== 'all' || statusFilter !== 'all') && (
              <button
                onClick={() => { setCategoryFilter('all'); setRiskFilter('all'); setStatusFilter('all') }}
                className="text-white/40 text-sm hover:text-white/70 transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Table */}
          <div className="glass glass-border rounded-xl overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-white/40">
                <p className="text-4xl mb-3">&#9888;</p>
                <p className="font-medium text-white/60">No hazards found</p>
                <p className="text-sm mt-1">
                  {hazards.length === 0 ? 'Add your first hazard to begin the register.' : 'Try adjusting your filters.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-white/40 text-xs uppercase tracking-wider">
                      <th className="text-left px-4 py-3">Location / Activity</th>
                      <th className="text-left px-4 py-3 hidden md:table-cell">Hazard</th>
                      <th className="text-left px-4 py-3 hidden lg:table-cell">Category</th>
                      <th className="text-center px-4 py-3">Pre-Risk</th>
                      <th className="text-left px-4 py-3 hidden xl:table-cell">Controls</th>
                      <th className="text-center px-4 py-3">Post-Risk</th>
                      <th className="text-left px-4 py-3 hidden md:table-cell">Status</th>
                      <th className="text-right px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(h => {
                      const preScore = h.pre_risk_rating ?? riskRating(h.pre_likelihood, h.pre_severity)
                      const postScore = h.post_risk_rating ?? riskRating(h.post_likelihood, h.post_severity)
                      const preBand = riskBand(preScore)
                      const postBand = riskBand(postScore)
                      const isExpanded = expandedRow === h.id
                      const hasControls = [h.control_elimination, h.control_substitution, h.control_engineering, h.control_administrative, h.control_ppe].filter(Boolean).length

                      return (
                        <>
                          <tr
                            key={h.id}
                            className={`border-b border-white/5 hover:bg-white/[0.03] transition-colors cursor-pointer ${isExpanded ? 'bg-white/[0.04]' : ''}`}
                            onClick={() => setExpandedRow(isExpanded ? null : h.id)}
                          >
                            <td className="px-4 py-3">
                              <div className="font-medium text-white">{h.location_area}</div>
                              <div className="text-white/50 text-xs mt-0.5">{h.activity}</div>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${h.routine ? 'border-white/20 text-white/40' : 'border-amber-500/40 text-amber-400'}`}>
                                  {h.routine ? 'Routine' : 'Non-Routine'}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 hidden md:table-cell">
                              <div className="text-white/80 max-w-[200px] truncate">{h.hazard}</div>
                              <div className="text-white/40 text-xs mt-0.5 max-w-[200px] truncate">{h.potential_harm}</div>
                            </td>
                            <td className="px-4 py-3 hidden lg:table-cell">
                              <span className="text-xs px-2 py-1 rounded-lg bg-white/10 text-white/70 border border-white/10">
                                {CATEGORY_LABELS[h.hazard_category] || h.hazard_category}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg border font-semibold ${preBand.bg}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${preBand.dot}`} />
                                {preScore}
                              </span>
                            </td>
                            <td className="px-4 py-3 hidden xl:table-cell">
                              <span className="text-white/50 text-xs">{hasControls} control{hasControls !== 1 ? 's' : ''} defined</span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {postScore < preScore && (
                                  <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                  </svg>
                                )}
                                <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg border font-semibold ${postBand.bg}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${postBand.dot}`} />
                                  {postScore}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 hidden md:table-cell">
                              <span className={`text-xs px-2 py-1 rounded-lg border ${STATUS_STYLES[h.status] || 'bg-white/10 text-white/50 border-white/10'}`}>
                                {h.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                              <div className="flex justify-end gap-1">
                                <button
                                  onClick={() => openEdit(h)}
                                  className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                                  title="Edit"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => setConfirmAction({ type: 'delete', item: h })}
                                  className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-colors"
                                  title="Delete"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded row detail */}
                          {isExpanded && (
                            <tr key={`${h.id}-expanded`} className="bg-white/[0.02]">
                              <td colSpan={8} className="px-4 py-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 text-sm">

                                  {/* Hazard details */}
                                  <div className="space-y-2">
                                    <p className="text-white/40 text-xs uppercase tracking-wider font-semibold">Hazard Details</p>
                                    <DetailRow label="Hazard" value={h.hazard} />
                                    <DetailRow label="Potential Harm" value={h.potential_harm} />
                                    <DetailRow label="Who at Risk" value={h.who_at_risk} />
                                    <DetailRow label="Category" value={CATEGORY_LABELS[h.hazard_category] || h.hazard_category} />
                                    <DetailRow label="Routine" value={h.routine ? 'Yes (Routine)' : 'No (Non-Routine)'} />
                                  </div>

                                  {/* Risk scores */}
                                  <div className="space-y-2">
                                    <p className="text-white/40 text-xs uppercase tracking-wider font-semibold">Risk Assessment</p>
                                    <div className="flex items-center gap-3">
                                      <div className="flex-1">
                                        <p className="text-white/40 text-xs mb-1">Pre-Control</p>
                                        <div className="flex items-center gap-2">
                                          <span className="text-white/60 text-xs">L{h.pre_likelihood} × S{h.pre_severity}</span>
                                          <span className={`text-xs px-2 py-0.5 rounded border font-bold ${riskBand(preScore).bg}`}>
                                            {preScore} — {riskBand(preScore).label}
                                          </span>
                                        </div>
                                      </div>
                                      <svg className="w-5 h-5 text-white/30 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                      </svg>
                                      <div className="flex-1">
                                        <p className="text-white/40 text-xs mb-1">Post-Control</p>
                                        <div className="flex items-center gap-2">
                                          <span className="text-white/60 text-xs">L{h.post_likelihood} × S{h.post_severity}</span>
                                          <span className={`text-xs px-2 py-0.5 rounded border font-bold ${riskBand(postScore).bg}`}>
                                            {postScore} — {riskBand(postScore).label}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    {h.responsible_person && <DetailRow label="Responsible Person" value={h.responsible_person} />}
                                    {h.target_date && <DetailRow label="Target Date" value={h.target_date} />}
                                    {h.next_review_date && <DetailRow label="Next Review" value={h.next_review_date} />}
                                    {h.notes && <DetailRow label="Notes" value={h.notes} />}
                                  </div>

                                  {/* Hierarchy of Controls */}
                                  <div className="space-y-2">
                                    <p className="text-white/40 text-xs uppercase tracking-wider font-semibold">Hierarchy of Controls</p>
                                    {HIERARCHY_CONTROLS.map(ctrl => (
                                      <div key={ctrl.key} className="flex gap-2">
                                        <span className={`text-xs font-semibold shrink-0 w-32 ${ctrl.color}`}>{ctrl.label}</span>
                                        <span className="text-white/60 text-xs">{h[ctrl.key] || <em className="text-white/25">Not specified</em>}</span>
                                      </div>
                                    ))}
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

          {/* Count footer */}
          {!loading && filtered.length > 0 && (
            <p className="text-white/30 text-xs text-right">
              Showing {filtered.length} of {hazards.length} hazard{hazards.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      {/* ─── Add / Edit Modal ──────────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="glass glass-border rounded-2xl w-full max-w-2xl my-8">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white">
                {editing ? 'Edit Hazard' : 'Add Hazard'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-5 space-y-5">

              {/* ── Section: Identification ── */}
              <SectionLabel>Hazard Identification</SectionLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Location / Area *">
                  <input
                    className="glass-input w-full rounded-xl px-3 py-2 text-sm text-white bg-white/5 border border-white/10 focus:outline-none focus:border-purple-500/50"
                    value={form.location_area}
                    onChange={e => setField('location_area', e.target.value)}
                    placeholder="e.g. Workshop, Office, Yard"
                  />
                </FormField>
                <FormField label="Activity *">
                  <input
                    className="glass-input w-full rounded-xl px-3 py-2 text-sm text-white bg-white/5 border border-white/10 focus:outline-none focus:border-purple-500/50"
                    value={form.activity}
                    onChange={e => setField('activity', e.target.value)}
                    placeholder="e.g. Operating machinery"
                  />
                </FormField>
              </div>

              <FormField label="Hazard Description *">
                <input
                  className="glass-input w-full rounded-xl px-3 py-2 text-sm text-white bg-white/5 border border-white/10 focus:outline-none focus:border-purple-500/50"
                  value={form.hazard}
                  onChange={e => setField('hazard', e.target.value)}
                  placeholder="Describe the hazard"
                />
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Potential Harm *">
                  <input
                    className="glass-input w-full rounded-xl px-3 py-2 text-sm text-white bg-white/5 border border-white/10 focus:outline-none focus:border-purple-500/50"
                    value={form.potential_harm}
                    onChange={e => setField('potential_harm', e.target.value)}
                    placeholder="e.g. Crush injury, Burns"
                  />
                </FormField>
                <FormField label="Who is at Risk">
                  <input
                    className="glass-input w-full rounded-xl px-3 py-2 text-sm text-white bg-white/5 border border-white/10 focus:outline-none focus:border-purple-500/50"
                    value={form.who_at_risk}
                    onChange={e => setField('who_at_risk', e.target.value)}
                    placeholder="e.g. All employees, Operators"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Hazard Category">
                  <select
                    className="glass-input w-full rounded-xl px-3 py-2 text-sm text-white bg-white/5 border border-white/10 focus:outline-none focus:border-purple-500/50"
                    value={form.hazard_category}
                    onChange={e => setField('hazard_category', e.target.value)}
                  >
                    {HAZARD_CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Routine / Non-Routine">
                  <div className="flex gap-3 mt-1">
                    {[
                      { value: true, label: 'Routine' },
                      { value: false, label: 'Non-Routine' },
                    ].map(opt => (
                      <button
                        key={String(opt.value)}
                        type="button"
                        onClick={() => setField('routine', opt.value)}
                        className={`flex-1 py-2 rounded-xl text-sm border transition-colors ${
                          form.routine === opt.value
                            ? 'bg-purple-600/30 border-purple-500 text-purple-300'
                            : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </FormField>
              </div>

              {/* ── Section: Pre-Control Risk ── */}
              <SectionLabel>Pre-Control Risk Rating</SectionLabel>
              <div className="glass-border rounded-xl p-4 bg-white/[0.02] space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <RatingGroup label="Likelihood (1=Rare, 5=Almost Certain)" value={form.pre_likelihood} onChange={v => setField('pre_likelihood', v)} />
                  <RatingGroup label="Severity (1=Negligible, 5=Catastrophic)" value={form.pre_severity} onChange={v => setField('pre_severity', v)} />
                </div>
                <PreviewScore label="Pre-Control Score" score={riskRating(form.pre_likelihood, form.pre_severity)} />
              </div>

              {/* ── Section: Hierarchy of Controls ── */}
              <SectionLabel>Hierarchy of Controls (§8.1.2)</SectionLabel>
              <div className="space-y-3">
                {HIERARCHY_CONTROLS.map(ctrl => (
                  <div key={ctrl.key} className="flex gap-3 items-start">
                    <div className="w-36 shrink-0 pt-2">
                      <p className={`text-xs font-semibold ${ctrl.color}`}>{ctrl.label}</p>
                      <p className="text-white/30 text-[10px] leading-snug mt-0.5">{ctrl.desc}</p>
                    </div>
                    <input
                      className="glass-input flex-1 rounded-xl px-3 py-2 text-sm text-white bg-white/5 border border-white/10 focus:outline-none focus:border-purple-500/50"
                      value={form[ctrl.key]}
                      onChange={e => setField(ctrl.key, e.target.value)}
                      placeholder={`Describe ${ctrl.label.split('.')[1].trim().toLowerCase()} measure...`}
                    />
                  </div>
                ))}
              </div>

              {/* ── Section: Post-Control Risk ── */}
              <SectionLabel>Post-Control Risk Rating (Residual Risk)</SectionLabel>
              <div className="glass-border rounded-xl p-4 bg-white/[0.02] space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <RatingGroup label="Likelihood (after controls)" value={form.post_likelihood} onChange={v => setField('post_likelihood', v)} />
                  <RatingGroup label="Severity (after controls)" value={form.post_severity} onChange={v => setField('post_severity', v)} />
                </div>
                <div className="flex items-center gap-4">
                  <PreviewScore label="Pre-Control" score={riskRating(form.pre_likelihood, form.pre_severity)} />
                  <svg className="w-5 h-5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <PreviewScore label="Post-Control" score={riskRating(form.post_likelihood, form.post_severity)} />
                  {riskRating(form.post_likelihood, form.post_severity) < riskRating(form.pre_likelihood, form.pre_severity) && (
                    <span className="text-green-400 text-xs font-semibold">
                      &#8595; Reduced by {riskRating(form.pre_likelihood, form.pre_severity) - riskRating(form.post_likelihood, form.post_severity)}
                    </span>
                  )}
                </div>
              </div>

              {/* ── Section: Review & Management ── */}
              <SectionLabel>Review & Management</SectionLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Responsible Person">
                  <input
                    className="glass-input w-full rounded-xl px-3 py-2 text-sm text-white bg-white/5 border border-white/10 focus:outline-none focus:border-purple-500/50"
                    value={form.responsible_person}
                    onChange={e => setField('responsible_person', e.target.value)}
                    placeholder="Name or role"
                  />
                </FormField>
                <FormField label="Target Date">
                  <input
                    type="date"
                    className="glass-input w-full rounded-xl px-3 py-2 text-sm text-white bg-white/5 border border-white/10 focus:outline-none focus:border-purple-500/50"
                    value={form.target_date}
                    onChange={e => setField('target_date', e.target.value)}
                  />
                </FormField>
                <FormField label="Last Reviewed">
                  <input
                    type="date"
                    className="glass-input w-full rounded-xl px-3 py-2 text-sm text-white bg-white/5 border border-white/10 focus:outline-none focus:border-purple-500/50"
                    value={form.last_reviewed}
                    onChange={e => setField('last_reviewed', e.target.value)}
                  />
                </FormField>
                <FormField label="Next Review Date">
                  <input
                    type="date"
                    className="glass-input w-full rounded-xl px-3 py-2 text-sm text-white bg-white/5 border border-white/10 focus:outline-none focus:border-purple-500/50"
                    value={form.next_review_date}
                    onChange={e => setField('next_review_date', e.target.value)}
                  />
                </FormField>
              </div>

              <FormField label="Status">
                <div className="flex flex-wrap gap-2 mt-1">
                  {STATUSES.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setField('status', s)}
                      className={`px-3 py-1.5 rounded-xl text-xs border transition-colors ${
                        form.status === s
                          ? STATUS_STYLES[s] || 'bg-purple-600/30 border-purple-500 text-purple-300'
                          : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </FormField>

              <FormField label="Notes">
                <textarea
                  rows={3}
                  className="glass-input w-full rounded-xl px-3 py-2 text-sm text-white bg-white/5 border border-white/10 focus:outline-none focus:border-purple-500/50 resize-none"
                  value={form.notes}
                  onChange={e => setField('notes', e.target.value)}
                  placeholder="Additional notes or observations"
                />
              </FormField>
            </div>

            {/* Modal footer */}
            <div className="flex justify-end gap-3 p-5 border-t border-white/10">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-xl border border-white/10 text-white/60 text-sm hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                {editing ? 'Save Changes' : 'Add Hazard'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Confirm Delete Modal ──────────────────────────────────────────── */}
      {confirmAction?.type === 'delete' && (
        <ConfirmModal
          title="Delete Hazard"
          message={`Delete "${confirmAction.item.hazard}"? This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={() => {
            handleDelete(confirmAction.item)
            setConfirmAction(null)
          }}
          onCancel={() => setConfirmAction(null)}
          danger
        />
      )}
    </Layout>
  )
}

// ─── Small helper components ──────────────────────────────────────────────────

const SectionLabel = ({ children }) => (
  <p className="text-white/50 text-xs uppercase tracking-wider font-semibold border-b border-white/10 pb-1">{children}</p>
)

const FormField = ({ label, children }) => (
  <div>
    <label className="block text-white/60 text-xs mb-1.5">{label}</label>
    {children}
  </div>
)

const DetailRow = ({ label, value }) => (
  <div className="flex gap-2">
    <span className="text-white/40 text-xs w-28 shrink-0">{label}:</span>
    <span className="text-white/70 text-xs">{value || <em className="text-white/25">—</em>}</span>
  </div>
)

const PreviewScore = ({ label, score }) => {
  const band = riskBand(score)
  return (
    <div>
      <p className="text-white/40 text-xs mb-1">{label}</p>
      <span className={`inline-flex items-center gap-1 text-sm px-3 py-1 rounded-lg border font-bold ${band.bg}`}>
        <span className={`w-2 h-2 rounded-full ${band.dot}`} />
        {score} — {band.label}
      </span>
    </div>
  )
}

export default HazardRegister

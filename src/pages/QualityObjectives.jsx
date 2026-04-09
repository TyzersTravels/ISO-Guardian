import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { supabase } from '../lib/supabase'
import { logActivity } from '../lib/auditLogger'
import { generateDocNumber } from '../lib/documentNumbering'
import Layout from '../components/Layout'
import ConfirmModal from '../components/ConfirmModal'
import { createBrandedPDF } from '../lib/brandedPDFExport'

const STANDARDS = [
  { code: 'ISO_9001', label: 'ISO 9001', color: 'blue' },
  { code: 'ISO_14001', label: 'ISO 14001', color: 'green' },
  { code: 'ISO_45001', label: 'ISO 45001', color: 'orange' },
]

const STATUS_OPTIONS = [
  { value: 'Not Started', color: 'bg-white/10 text-white/60' },
  { value: 'In Progress', color: 'bg-blue-500/20 text-blue-400' },
  { value: 'On Track', color: 'bg-green-500/20 text-green-400' },
  { value: 'At Risk', color: 'bg-orange-500/20 text-orange-400' },
  { value: 'Achieved', color: 'bg-emerald-500/20 text-emerald-400' },
  { value: 'Not Achieved', color: 'bg-red-500/20 text-red-400' },
  { value: 'Cancelled', color: 'bg-white/5 text-white/30' },
]

const REVIEW_FREQUENCIES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'biannually', label: 'Biannually' },
  { value: 'annually', label: 'Annually' },
]

const QualityObjectives = () => {
  const { userProfile, getEffectiveCompanyId } = useAuth()
  const toast = useToast()
  const [objectives, setObjectives] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingObj, setEditingObj] = useState(null)
  const [selectedObj, setSelectedObj] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)
  const [exporting, setExporting] = useState(false)
  const [users, setUsers] = useState([])
  const [progressLog, setProgressLog] = useState([])
  const [showProgressForm, setShowProgressForm] = useState(null)
  const [progressValue, setProgressValue] = useState('')
  const [progressNotes, setProgressNotes] = useState('')

  // Filters
  const [standardFilter, setStandardFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const defaultForm = {
    title: '', description: '', standards: ['ISO_9001'], clause_reference: '6.2',
    relevant_policy: '', kpi_name: '', kpi_unit: '%',
    baseline_value: '', target_value: '', current_value: '',
    action_plan: '', resources_required: '', responsible_person: '',
    target_date: '', evaluation_method: '',
    status: 'Not Started', progress_percentage: 0,
    review_frequency: 'quarterly',
  }
  const [form, setForm] = useState(defaultForm)

  useEffect(() => {
    if (userProfile) {
      fetchObjectives()
      fetchUsers()
    }
  }, [userProfile])

  const fetchUsers = async () => {
    const companyId = getEffectiveCompanyId()
    const { data } = await supabase.from('users').select('id, full_name, email').eq('company_id', companyId)
    setUsers(data || [])
  }

  const fetchObjectives = async () => {
    try {
      setLoading(true)
      const companyId = getEffectiveCompanyId()
      const { data, error } = await supabase
        .from('quality_objectives')
        .select('id, objective_number, title, description, standards, clause_reference, relevant_policy, kpi_name, kpi_unit, baseline_value, target_value, current_value, action_plan, resources_required, responsible_person, target_date, evaluation_method, status, progress_percentage, last_reviewed, review_frequency, created_by, created_at, updated_at')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setObjectives(data || [])
    } catch (err) {
      console.error('Error fetching objectives:', err)
      toast.error('Failed to load quality objectives')
    } finally {
      setLoading(false)
    }
  }

  const fetchProgressLog = async (objectiveId) => {
    const { data } = await supabase
      .from('objective_progress')
      .select('id, recorded_value, notes, recorded_by, recorded_at')
      .eq('objective_id', objectiveId)
      .order('recorded_at', { ascending: false })
      .limit(10)
    setProgressLog(data || [])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const companyId = getEffectiveCompanyId()
      const payload = {
        company_id: companyId,
        title: form.title,
        description: form.description || null,
        standards: form.standards,
        clause_reference: form.clause_reference || null,
        relevant_policy: form.relevant_policy || null,
        kpi_name: form.kpi_name,
        kpi_unit: form.kpi_unit || null,
        baseline_value: form.baseline_value !== '' ? parseFloat(form.baseline_value) : null,
        target_value: parseFloat(form.target_value),
        current_value: form.current_value !== '' ? parseFloat(form.current_value) : null,
        action_plan: form.action_plan || null,
        resources_required: form.resources_required || null,
        responsible_person: form.responsible_person || null,
        target_date: form.target_date || null,
        evaluation_method: form.evaluation_method || null,
        status: form.status,
        progress_percentage: form.progress_percentage,
        review_frequency: form.review_frequency,
      }

      if (editingObj) {
        payload.last_reviewed = new Date().toISOString().split('T')[0]
        const { error } = await supabase.from('quality_objectives').update(payload).eq('id', editingObj.id)
        if (error) throw error
        await logActivity({ companyId, userId: userProfile.id, action: 'updated', entityType: 'quality_objective', entityId: editingObj.id, changes: { title: form.title } })
        toast.success('Objective updated')
      } else {
        const { docNumber } = await generateDocNumber(companyId, 'objective')
        payload.objective_number = docNumber
        payload.created_by = userProfile.id
        const { data, error } = await supabase.from('quality_objectives').insert(payload).select('id').single()
        if (error) throw error
        await logActivity({ companyId, userId: userProfile.id, action: 'created', entityType: 'quality_objective', entityId: data.id, changes: { title: form.title } })
        toast.success('Objective created')
      }

      setShowForm(false)
      setEditingObj(null)
      setForm(defaultForm)
      fetchObjectives()
    } catch (err) {
      console.error('Error saving objective:', err)
      toast.error('Failed to save objective')
    }
  }

  const openEdit = (obj) => {
    setEditingObj(obj)
    setForm({
      title: obj.title || '',
      description: obj.description || '',
      standards: obj.standards || ['ISO_9001'],
      clause_reference: obj.clause_reference || '6.2',
      relevant_policy: obj.relevant_policy || '',
      kpi_name: obj.kpi_name || '',
      kpi_unit: obj.kpi_unit || '%',
      baseline_value: obj.baseline_value ?? '',
      target_value: obj.target_value ?? '',
      current_value: obj.current_value ?? '',
      action_plan: obj.action_plan || '',
      resources_required: obj.resources_required || '',
      responsible_person: obj.responsible_person || '',
      target_date: obj.target_date || '',
      evaluation_method: obj.evaluation_method || '',
      status: obj.status || 'Not Started',
      progress_percentage: obj.progress_percentage || 0,
      review_frequency: obj.review_frequency || 'quarterly',
    })
    setShowForm(true)
  }

  const deleteObjective = async (id) => {
    try {
      const { error } = await supabase.from('quality_objectives').delete().eq('id', id)
      if (error) throw error
      await logActivity({ companyId: getEffectiveCompanyId(), userId: userProfile.id, action: 'deleted', entityType: 'quality_objective', entityId: id })
      toast.success('Objective deleted')
      fetchObjectives()
      setSelectedObj(null)
    } catch (err) {
      console.error('Error deleting:', err)
      toast.error('Failed to delete objective')
    }
  }

  const recordProgress = async (obj) => {
    if (!progressValue) return
    try {
      const companyId = getEffectiveCompanyId()
      const val = parseFloat(progressValue)
      await supabase.from('objective_progress').insert({
        objective_id: obj.id,
        company_id: companyId,
        recorded_value: val,
        notes: progressNotes || null,
        recorded_by: userProfile.id,
      })

      // Update current_value and recalculate progress %
      const target = obj.target_value || 1
      const baseline = obj.baseline_value || 0
      const pct = Math.min(100, Math.max(0, Math.round(((val - baseline) / (target - baseline)) * 100)))
      const newStatus = pct >= 100 ? 'Achieved' : pct >= 50 ? 'On Track' : obj.status

      await supabase.from('quality_objectives').update({
        current_value: val,
        progress_percentage: pct,
        status: newStatus,
        last_reviewed: new Date().toISOString().split('T')[0],
      }).eq('id', obj.id)

      await logActivity({ companyId, userId: userProfile.id, action: 'progress_recorded', entityType: 'quality_objective', entityId: obj.id, changes: { value: val, progress: pct } })

      toast.success('Progress recorded')
      setShowProgressForm(null)
      setProgressValue('')
      setProgressNotes('')
      fetchObjectives()
    } catch (err) {
      console.error('Error recording progress:', err)
      toast.error('Failed to record progress')
    }
  }

  const toggleStandard = (code) => {
    setForm(prev => ({
      ...prev,
      standards: prev.standards.includes(code)
        ? prev.standards.filter(s => s !== code)
        : [...prev.standards, code]
    }))
  }

  const getUserName = (id) => {
    const u = users.find(u => u.id === id)
    return u ? (u.full_name || u.email) : ''
  }

  // Filtered
  const filtered = objectives.filter(o => {
    if (standardFilter !== 'all' && !(o.standards || []).includes(standardFilter)) return false
    if (statusFilter !== 'all' && o.status !== statusFilter) return false
    return true
  })

  // Stats
  const achieved = objectives.filter(o => o.status === 'Achieved').length
  const onTrack = objectives.filter(o => o.status === 'On Track' || o.status === 'In Progress').length
  const atRisk = objectives.filter(o => o.status === 'At Risk' || o.status === 'Not Achieved').length
  const avgProgress = objectives.length > 0 ? Math.round(objectives.reduce((sum, o) => sum + (o.progress_percentage || 0), 0) / objectives.length) : 0

  const getProgressColor = (pct) => {
    if (pct >= 80) return 'bg-green-500'
    if (pct >= 50) return 'bg-cyan-500'
    if (pct >= 25) return 'bg-orange-500'
    return 'bg-red-500'
  }

  // Export
  const exportObjectives = async () => {
    try {
      setExporting(true)
      const companyName = userProfile?.company?.name || 'Company'
      const companyLogo = userProfile?.company?.logo_url || null
      const userName = userProfile?.full_name || userProfile?.email || ''

      const doc = await createBrandedPDF({
        title: 'Quality Objectives Register',
        docNumber: 'IG-OBJ-REG',
        companyName,
        preparedBy: userName,
        companyLogoUrl: companyLogo,
        type: 'document',
        contentRenderer: (doc, startY) => {
          const margin = 20
          const pageWidth = doc.internal.pageSize.getWidth()
          const contentWidth = pageWidth - margin * 2
          let y = startY

          doc.setFont('helvetica', 'bold')
          doc.setFontSize(11)
          doc.setTextColor(30, 27, 75)
          doc.text('Objectives Summary', margin, y)
          y += 7
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(9)
          doc.setTextColor(60, 60, 70)
          doc.text(`Total: ${objectives.length}  |  Achieved: ${achieved}  |  On Track: ${onTrack}  |  At Risk: ${atRisk}  |  Avg Progress: ${avgProgress}%`, margin, y)
          y += 12

          objectives.forEach((obj, i) => {
            if (y > 250) { doc.addPage(); y = 25 }

            doc.setFillColor(249, 250, 251)
            doc.rect(margin, y - 4, contentWidth, 10, 'F')
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(9)
            doc.setTextColor(30, 27, 75)
            doc.text(`${obj.objective_number}: ${obj.title}`, margin + 2, y + 2)

            const pctColor = (obj.progress_percentage || 0) >= 80 ? [34, 197, 94] : (obj.progress_percentage || 0) >= 50 ? [6, 182, 212] : [239, 68, 68]
            doc.setTextColor(...pctColor)
            doc.text(`${obj.progress_percentage || 0}%`, pageWidth - margin - 2, y + 2, { align: 'right' })
            y += 12

            doc.setFont('helvetica', 'normal')
            doc.setFontSize(8)
            doc.setTextColor(60, 60, 70)

            const details = [
              `KPI: ${obj.kpi_name} (${obj.kpi_unit || ''})`,
              `Baseline: ${obj.baseline_value ?? '-'} → Target: ${obj.target_value} → Current: ${obj.current_value ?? '-'}`,
              `Status: ${obj.status}  |  Review: ${obj.review_frequency}  |  Due: ${obj.target_date || '-'}`,
              `Responsible: ${getUserName(obj.responsible_person) || 'Unassigned'}`,
            ]
            details.forEach(line => {
              doc.text(line, margin + 4, y)
              y += 5
            })

            if (obj.action_plan) {
              const planLines = doc.splitTextToSize(`Action Plan: ${obj.action_plan}`, contentWidth - 8)
              doc.text(planLines, margin + 4, y)
              y += planLines.length * 4
            }
            y += 4
          })

          return y
        }
      })
      doc.save('IG-Quality_Objectives_Register.pdf')
      toast.success('Objectives register exported')
    } catch (err) {
      console.error('Export error:', err)
      toast.error('Failed to export')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return <Layout><div className="text-white text-center py-12">Loading objectives...</div></Layout>
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-1">Quality Objectives</h2>
            <p className="text-white/60 text-sm">ISO 9001 §6.2 · ISO 14001 §6.2 · ISO 45001 §6.2</p>
          </div>
          <div className="flex gap-2 self-start sm:self-auto">
            {objectives.length > 0 && (
              <button onClick={exportObjectives} disabled={exporting}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold rounded-xl transition-all text-sm disabled:opacity-50">
                {exporting ? 'Exporting...' : 'Export PDF'}
              </button>
            )}
            <button onClick={() => { setEditingObj(null); setForm(defaultForm); setShowForm(true) }}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all text-sm">
              + New Objective
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="glass glass-border rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-white">{avgProgress}%</div>
            <div className="text-white/50 text-xs mt-1">Avg Progress</div>
            <div className="w-full h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden">
              <div className={`h-full rounded-full ${getProgressColor(avgProgress)}`} style={{ width: `${avgProgress}%` }} />
            </div>
          </div>
          <div className="glass glass-border rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-emerald-400">{achieved}</div>
            <div className="text-white/50 text-xs mt-1">Achieved</div>
          </div>
          <div className="glass glass-border rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-cyan-400">{onTrack}</div>
            <div className="text-white/50 text-xs mt-1">On Track</div>
          </div>
          <div className="glass glass-border rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-orange-400">{atRisk}</div>
            <div className="text-white/50 text-xs mt-1">At Risk</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <select value={standardFilter} onChange={e => setStandardFilter(e.target.value)} className="glass-input rounded-lg px-3 py-1.5 text-sm text-white">
            <option value="all">All Standards</option>
            {STANDARDS.map(s => <option key={s.code} value={s.code}>{s.label}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="glass-input rounded-lg px-3 py-1.5 text-sm text-white">
            <option value="all">All Statuses</option>
            {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.value}</option>)}
          </select>
        </div>

        {/* Objectives List */}
        <div className="space-y-3">
          {filtered.map(obj => {
            const isExpanded = selectedObj?.id === obj.id
            const statusStyle = STATUS_OPTIONS.find(s => s.value === obj.status)?.color || 'bg-white/10 text-white/60'
            const pct = obj.progress_percentage || 0

            return (
              <div key={obj.id} className={`glass glass-border rounded-xl overflow-hidden ${isExpanded ? 'ring-1 ring-purple-500' : ''}`}>
                <div className="p-4 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => { setSelectedObj(isExpanded ? null : obj); if (!isExpanded) fetchProgressLog(obj.id) }}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white/40 text-xs font-mono">{obj.objective_number}</span>
                        {(obj.standards || []).map(s => (
                          <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">{s.replace('ISO_', 'ISO ')}</span>
                        ))}
                        <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${statusStyle}`}>{obj.status}</span>
                      </div>
                      <h4 className="text-white font-semibold text-sm mt-1">{obj.title}</h4>
                      <p className="text-white/40 text-xs mt-0.5">KPI: {obj.kpi_name} ({obj.kpi_unit})</p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <div className="text-xs text-white/40">
                          {obj.current_value ?? '-'} / {obj.target_value} {obj.kpi_unit}
                        </div>
                        <div className="w-24 h-2 bg-white/10 rounded-full mt-1 overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${getProgressColor(pct)}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <div className={`text-2xl font-bold ${pct >= 80 ? 'text-green-400' : pct >= 50 ? 'text-cyan-400' : pct >= 25 ? 'text-orange-400' : 'text-red-400'}`}>
                        {pct}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="border-t border-white/10 p-4 space-y-4" onClick={e => e.stopPropagation()}>
                    {obj.description && <p className="text-white/70 text-sm">{obj.description}</p>}

                    {/* KPI Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="glass rounded-lg p-3">
                        <span className="text-white/40 text-[10px]">Baseline</span>
                        <p className="text-white font-semibold">{obj.baseline_value ?? '-'} {obj.kpi_unit}</p>
                      </div>
                      <div className="glass rounded-lg p-3">
                        <span className="text-white/40 text-[10px]">Target</span>
                        <p className="text-cyan-400 font-semibold">{obj.target_value} {obj.kpi_unit}</p>
                      </div>
                      <div className="glass rounded-lg p-3">
                        <span className="text-white/40 text-[10px]">Current</span>
                        <p className={`font-semibold ${pct >= 80 ? 'text-green-400' : 'text-white'}`}>{obj.current_value ?? '-'} {obj.kpi_unit}</p>
                      </div>
                      <div className="glass rounded-lg p-3">
                        <span className="text-white/40 text-[10px]">Due</span>
                        <p className="text-white">{obj.target_date || '-'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                      <div><span className="text-white/40 text-xs">Responsible</span><p className="text-white">{getUserName(obj.responsible_person) || 'Unassigned'}</p></div>
                      <div><span className="text-white/40 text-xs">Review Frequency</span><p className="text-white capitalize">{obj.review_frequency}</p></div>
                      <div><span className="text-white/40 text-xs">Evaluation Method</span><p className="text-white">{obj.evaluation_method || '-'}</p></div>
                    </div>

                    {obj.relevant_policy && (
                      <div><span className="text-white/40 text-xs">Relevant Policy</span><p className="text-white/70 text-sm">{obj.relevant_policy}</p></div>
                    )}
                    {obj.action_plan && (
                      <div><span className="text-white/40 text-xs">Action Plan</span><p className="text-white/70 text-sm">{obj.action_plan}</p></div>
                    )}
                    {obj.resources_required && (
                      <div><span className="text-white/40 text-xs">Resources Required</span><p className="text-white/70 text-sm">{obj.resources_required}</p></div>
                    )}

                    {/* Record Progress */}
                    {showProgressForm === obj.id ? (
                      <div className="glass rounded-lg p-4 border border-cyan-500/20">
                        <h5 className="text-cyan-400 text-sm font-semibold mb-3">Record Progress</h5>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-white/60 text-xs mb-1 block">Current Value ({obj.kpi_unit})</label>
                            <input type="number" step="any" value={progressValue} onChange={e => setProgressValue(e.target.value)}
                              className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" placeholder={`e.g. ${obj.target_value}`} />
                          </div>
                          <div>
                            <label className="text-white/60 text-xs mb-1 block">Notes</label>
                            <input type="text" value={progressNotes} onChange={e => setProgressNotes(e.target.value)}
                              className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" placeholder="Optional notes..." />
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => recordProgress(obj)} className="px-4 py-1.5 bg-cyan-500 text-white rounded-lg text-sm hover:bg-cyan-600 transition-colors">Save</button>
                          <button onClick={() => { setShowProgressForm(null); setProgressValue(''); setProgressNotes('') }} className="px-4 py-1.5 bg-white/10 text-white rounded-lg text-sm hover:bg-white/20 transition-colors">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setShowProgressForm(obj.id)} className="px-4 py-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg text-sm hover:bg-cyan-500/30 transition-colors">
                        Record Progress
                      </button>
                    )}

                    {/* Progress History */}
                    {progressLog.length > 0 && isExpanded && (
                      <div>
                        <span className="text-white/40 text-xs">Progress History</span>
                        <div className="mt-2 space-y-1">
                          {progressLog.map(p => (
                            <div key={p.id} className="flex items-center justify-between text-xs bg-white/5 rounded-lg px-3 py-2">
                              <div className="flex items-center gap-2">
                                <span className="text-cyan-400 font-semibold">{p.recorded_value} {obj.kpi_unit}</span>
                                {p.notes && <span className="text-white/40">— {p.notes}</span>}
                              </div>
                              <span className="text-white/30">{new Date(p.recorded_at).toLocaleDateString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <button onClick={() => openEdit(obj)} className="px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg text-sm hover:bg-purple-500/30 transition-colors">Edit</button>
                      <button onClick={() => setConfirmAction({ title: 'Delete Objective', message: `Delete "${obj.title}"? This cannot be undone.`, variant: 'danger', confirmLabel: 'Delete', onConfirm: () => { deleteObjective(obj.id); setConfirmAction(null) } })}
                        className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors">Delete</button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {filtered.length === 0 && !loading && (
          <div className="glass glass-border rounded-xl p-8 text-center">
            <p className="text-white/60 mb-2">No quality objectives found</p>
            <p className="text-white/40 text-sm">Define measurable objectives aligned with your quality, environmental, and OH&S policies</p>
          </div>
        )}

        {/* Create/Edit Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
            <div className="glass glass-border rounded-2xl p-6 w-full max-w-2xl my-8">
              <h3 className="text-xl font-bold text-white mb-4">{editingObj ? 'Edit Objective' : 'Create Quality Objective'}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="text-white/60 text-xs mb-1 block">Objective Title *</label>
                  <input type="text" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Reduce customer complaints by 20%" className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                </div>

                <div>
                  <label className="text-white/60 text-xs mb-1 block">Description</label>
                  <textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="Context and rationale..." className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                </div>

                {/* Standards */}
                <div>
                  <label className="text-white/60 text-xs mb-1 block">Applicable Standards *</label>
                  <div className="flex gap-2">
                    {STANDARDS.map(std => (
                      <button key={std.code} type="button" onClick={() => toggleStandard(std.code)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${form.standards.includes(std.code) ? 'bg-purple-500 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>
                        {std.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Policy alignment */}
                <div>
                  <label className="text-white/60 text-xs mb-1 block">Relevant Policy (ISO 6.2: "consistent with policy")</label>
                  <input type="text" value={form.relevant_policy} onChange={e => setForm({ ...form, relevant_policy: e.target.value })}
                    placeholder="e.g. Quality Policy commitment to customer satisfaction" className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                </div>

                {/* KPI */}
                <div className="glass rounded-lg p-4">
                  <h4 className="text-white text-sm font-semibold mb-3">Measurable KPI (ISO 6.2: "measurable, monitored")</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-white/60 text-xs mb-1 block">KPI Name *</label>
                      <input type="text" required value={form.kpi_name} onChange={e => setForm({ ...form, kpi_name: e.target.value })}
                        placeholder="e.g. Customer complaints" className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                    </div>
                    <div>
                      <label className="text-white/60 text-xs mb-1 block">Unit</label>
                      <input type="text" value={form.kpi_unit} onChange={e => setForm({ ...form, kpi_unit: e.target.value })}
                        placeholder="%, count, days" className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                    </div>
                    <div>
                      <label className="text-white/60 text-xs mb-1 block">Baseline</label>
                      <input type="number" step="any" value={form.baseline_value} onChange={e => setForm({ ...form, baseline_value: e.target.value })}
                        placeholder="Starting value" className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                    </div>
                    <div>
                      <label className="text-white/60 text-xs mb-1 block">Target *</label>
                      <input type="number" step="any" required value={form.target_value} onChange={e => setForm({ ...form, target_value: e.target.value })}
                        placeholder="Goal value" className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                    </div>
                  </div>
                </div>

                {/* Action Plan (ISO 6.2: "what will be done, resources, who, when, how evaluated") */}
                <div>
                  <label className="text-white/60 text-xs mb-1 block">Action Plan (ISO 6.2: "what will be done")</label>
                  <textarea rows={2} value={form.action_plan} onChange={e => setForm({ ...form, action_plan: e.target.value })}
                    placeholder="Steps to achieve this objective..." className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">Resources Required</label>
                    <input type="text" value={form.resources_required} onChange={e => setForm({ ...form, resources_required: e.target.value })}
                      placeholder="Budget, tools, training..." className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                  </div>
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">Evaluation Method</label>
                    <input type="text" value={form.evaluation_method} onChange={e => setForm({ ...form, evaluation_method: e.target.value })}
                      placeholder="How progress is measured..." className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                  </div>
                </div>

                {/* Assignment */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">Responsible Person</label>
                    <select value={form.responsible_person} onChange={e => setForm({ ...form, responsible_person: e.target.value })} className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm">
                      <option value="">Unassigned</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.full_name || u.email}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">Target Date</label>
                    <input type="date" value={form.target_date} onChange={e => setForm({ ...form, target_date: e.target.value })} className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                  </div>
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">Review Frequency</label>
                    <select value={form.review_frequency} onChange={e => setForm({ ...form, review_frequency: e.target.value })} className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm">
                      {REVIEW_FREQUENCIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                  </div>
                </div>

                {/* Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">Status</label>
                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm">
                      {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.value}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">Progress %</label>
                    <input type="range" min="0" max="100" value={form.progress_percentage} onChange={e => setForm({ ...form, progress_percentage: parseInt(e.target.value) })} className="w-full accent-purple-500" />
                    <div className="text-center text-white/60 text-xs">{form.progress_percentage}%</div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="submit" className="flex-1 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all">
                    {editingObj ? 'Update Objective' : 'Create Objective'}
                  </button>
                  <button type="button" onClick={() => { setShowForm(false); setEditingObj(null); setForm(defaultForm) }}
                    className="px-6 py-2.5 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {confirmAction && (
          <ConfirmModal title={confirmAction.title} message={confirmAction.message} variant={confirmAction.variant}
            confirmLabel={confirmAction.confirmLabel} onConfirm={confirmAction.onConfirm} onCancel={() => setConfirmAction(null)} />
        )}
      </div>
    </Layout>
  )
}

export default QualityObjectives

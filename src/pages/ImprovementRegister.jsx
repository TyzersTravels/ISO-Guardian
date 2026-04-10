import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { supabase } from '../lib/supabase'
import { logActivity } from '../lib/auditLogger'
import { generateDocNumber } from '../lib/documentNumbering'
import Layout from '../components/Layout'
import ConfirmModal from '../components/ConfirmModal'

const IMPROVEMENT_TYPES = [
  { value: 'process_improvement', label: 'Process Improvement' },
  { value: 'corrective_action', label: 'Corrective Action' },
  { value: 'preventive_action', label: 'Preventive Action' },
  { value: 'innovation', label: 'Innovation' },
  { value: 'cost_reduction', label: 'Cost Reduction' },
  { value: 'efficiency', label: 'Efficiency Gain' },
  { value: 'safety_improvement', label: 'Safety Improvement' },
  { value: 'environmental_improvement', label: 'Environmental Improvement' },
  { value: 'customer_driven', label: 'Customer-Driven' },
  { value: 'other', label: 'Other' },
]

const STATUSES = [
  { value: 'Identified', color: 'bg-white/10 text-white/50' },
  { value: 'Planned', color: 'bg-blue-500/20 text-blue-400' },
  { value: 'In Progress', color: 'bg-orange-500/20 text-orange-400' },
  { value: 'Implemented', color: 'bg-cyan-500/20 text-cyan-400' },
  { value: 'Verified', color: 'bg-green-500/20 text-green-400' },
  { value: 'Closed', color: 'bg-green-600/20 text-green-500' },
  { value: 'Rejected', color: 'bg-red-500/20 text-red-400' },
]

const PRIORITIES = ['low', 'medium', 'high', 'critical']
const STANDARDS = [
  { code: 'ISO_9001', label: 'ISO 9001' },
  { code: 'ISO_14001', label: 'ISO 14001' },
  { code: 'ISO_45001', label: 'ISO 45001' },
]

const ImprovementRegister = () => {
  const { userProfile, getEffectiveCompanyId } = useAuth()
  const toast = useToast()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)
  const [users, setUsers] = useState([])

  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')

  const defaultForm = {
    title: '', description: '', improvement_type: 'process_improvement',
    source: '', source_reference: '', standards: ['ISO_9001'],
    expected_benefit: '', resources_required: '', responsible_person: '',
    target_date: '', priority: 'medium', actions_taken: '',
    actual_benefit: '', effectiveness_review: '', status: 'Identified',
  }
  const [form, setForm] = useState(defaultForm)

  useEffect(() => {
    if (userProfile) { fetchRecords(); fetchUsers() }
  }, [userProfile])

  const fetchUsers = async () => {
    const { data } = await supabase.from('users').select('id, full_name, email').eq('company_id', getEffectiveCompanyId())
    setUsers(data || [])
  }

  const fetchRecords = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('improvements')
        .select('id, improvement_number, title, description, improvement_type, source, source_reference, standards, expected_benefit, resources_required, responsible_person, target_date, priority, actions_taken, date_implemented, actual_benefit, effectiveness_review, effectiveness_verified, verified_by, verified_date, status, created_at')
        .eq('company_id', getEffectiveCompanyId())
        .order('created_at', { ascending: false })
      if (error) throw error

      const userIds = [...new Set((data || []).map(r => r.responsible_person).filter(Boolean))]
      let userMap = {}
      if (userIds.length > 0) {
        const { data: u } = await supabase.from('users').select('id, full_name, email').in('id', userIds)
        if (u) u.forEach(x => { userMap[x.id] = x.full_name || x.email })
      }
      setRecords((data || []).map(r => ({ ...r, responsible_name: userMap[r.responsible_person] || '' })))
    } catch (err) {
      toast.error('Failed to load improvements')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const companyId = getEffectiveCompanyId()
      const payload = {
        company_id: companyId, title: form.title, description: form.description,
        improvement_type: form.improvement_type, source: form.source || null,
        source_reference: form.source_reference || null, standards: form.standards,
        expected_benefit: form.expected_benefit || null,
        resources_required: form.resources_required || null,
        responsible_person: form.responsible_person || null,
        target_date: form.target_date || null, priority: form.priority,
        actions_taken: form.actions_taken || null,
        actual_benefit: form.actual_benefit || null,
        effectiveness_review: form.effectiveness_review || null,
        status: form.status,
      }

      if (editing) {
        if (form.status === 'Implemented' && !editing.date_implemented) payload.date_implemented = new Date().toISOString().split('T')[0]
        if (form.status === 'Verified') {
          payload.effectiveness_verified = true
          payload.verified_by = userProfile.id
          payload.verified_date = new Date().toISOString().split('T')[0]
        }
        const { error } = await supabase.from('improvements').update(payload).eq('id', editing.id)
        if (error) throw error
        await logActivity({ companyId, userId: userProfile.id, action: 'updated', entityType: 'improvement', entityId: editing.id, changes: { title: form.title, status: form.status } })
        toast.success('Improvement updated')
      } else {
        const { docNumber } = await generateDocNumber(companyId, 'improvement')
        payload.improvement_number = docNumber
        payload.created_by = userProfile.id
        const { data, error } = await supabase.from('improvements').insert(payload).select('id').single()
        if (error) throw error
        await logActivity({ companyId, userId: userProfile.id, action: 'created', entityType: 'improvement', entityId: data.id, changes: { title: form.title, type: form.improvement_type } })
        toast.success('Improvement registered')
      }

      setShowForm(false); setEditing(null); setForm(defaultForm); fetchRecords()
    } catch (err) {
      toast.error('Failed to save improvement')
    }
  }

  const openEdit = (r) => {
    setEditing(r)
    setForm({
      title: r.title || '', description: r.description || '',
      improvement_type: r.improvement_type || 'process_improvement',
      source: r.source || '', source_reference: r.source_reference || '',
      standards: r.standards || ['ISO_9001'], expected_benefit: r.expected_benefit || '',
      resources_required: r.resources_required || '', responsible_person: r.responsible_person || '',
      target_date: r.target_date || '', priority: r.priority || 'medium',
      actions_taken: r.actions_taken || '', actual_benefit: r.actual_benefit || '',
      effectiveness_review: r.effectiveness_review || '', status: r.status || 'Identified',
    })
    setShowForm(true)
  }

  const deleteRecord = async (id) => {
    try {
      const { error } = await supabase.from('improvements').delete().eq('id', id)
      if (error) throw error
      await logActivity({ companyId: getEffectiveCompanyId(), userId: userProfile.id, action: 'deleted', entityType: 'improvement', entityId: id })
      toast.success('Improvement deleted'); fetchRecords(); setSelectedRecord(null)
    } catch (err) { toast.error('Failed to delete') }
  }

  const toggleStandard = (code) => {
    setForm(prev => ({ ...prev, standards: prev.standards.includes(code) ? prev.standards.filter(s => s !== code) : [...prev.standards, code] }))
  }

  const filtered = records.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false
    if (typeFilter !== 'all' && r.improvement_type !== typeFilter) return false
    if (priorityFilter !== 'all' && r.priority !== priorityFilter) return false
    return true
  })

  // Stats
  const total = records.length
  const inProgress = records.filter(r => r.status === 'In Progress' || r.status === 'Planned').length
  const verified = records.filter(r => r.effectiveness_verified).length
  const overdue = records.filter(r => r.target_date && r.target_date < new Date().toISOString().split('T')[0] && !['Verified', 'Closed', 'Rejected'].includes(r.status)).length

  const getStatusStyle = (status) => STATUSES.find(s => s.value === status)?.color || 'bg-white/10 text-white/50'
  const getTypeLabel = (type) => IMPROVEMENT_TYPES.find(t => t.value === type)?.label || type

  if (loading) return <Layout><div className="text-white text-center py-12">Loading improvements...</div></Layout>

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-1">Continual Improvement Register</h2>
            <p className="text-white/60 text-sm">ISO 9001 §10.3 · ISO 14001 §10.3 · ISO 45001 §10.3</p>
          </div>
          <button onClick={() => { setEditing(null); setForm(defaultForm); setShowForm(true) }}
            className="self-start sm:self-auto px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all text-sm">
            + Log Improvement
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total', value: total, color: 'text-white' },
            { label: 'Active', value: inProgress, color: 'text-orange-400' },
            { label: 'Verified', value: verified, color: 'text-green-400' },
            { label: 'Overdue', value: overdue, color: 'text-red-400' },
          ].map(kpi => (
            <div key={kpi.label} className="glass glass-border rounded-xl p-4 text-center">
              <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
              <div className="text-white/50 text-xs mt-1">{kpi.label}</div>
            </div>
          ))}
        </div>

        {/* Pipeline visualization */}
        <div className="glass glass-border rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-white/50 mb-3">Improvement Pipeline</h3>
          <div className="flex gap-1 overflow-x-auto">
            {STATUSES.filter(s => s.value !== 'Rejected').map(s => {
              const count = records.filter(r => r.status === s.value).length
              return (
                <div key={s.value} className="flex-1 min-w-[80px] text-center">
                  <div className={`h-10 rounded-lg flex items-center justify-center ${s.color} text-sm font-bold`}>
                    {count}
                  </div>
                  <div className="text-[10px] text-white/40 mt-1">{s.value}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="glass-input rounded-lg px-3 py-1.5 text-sm text-white">
            <option value="all">All Statuses</option>
            {STATUSES.map(s => <option key={s.value} value={s.value}>{s.value}</option>)}
          </select>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="glass-input rounded-lg px-3 py-1.5 text-sm text-white">
            <option value="all">All Types</option>
            {IMPROVEMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="glass-input rounded-lg px-3 py-1.5 text-sm text-white">
            <option value="all">All Priorities</option>
            {PRIORITIES.map(p => <option key={p} value={p} className="capitalize">{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
          </select>
        </div>

        {/* List */}
        <div className="space-y-2">
          {filtered.map(rec => {
            const isExpanded = selectedRecord?.id === rec.id
            const isOverdue = rec.target_date && rec.target_date < new Date().toISOString().split('T')[0] && !['Verified', 'Closed', 'Rejected'].includes(rec.status)
            return (
              <div key={rec.id} className={`glass glass-border rounded-xl overflow-hidden ${isExpanded ? 'ring-1 ring-purple-500' : ''}`}>
                <div className="p-4 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => setSelectedRecord(isExpanded ? null : rec)}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white/30 text-xs font-mono">{rec.improvement_number}</span>
                        <span className="text-xs text-white/40 capitalize">{getTypeLabel(rec.improvement_type)}</span>
                        {isOverdue && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 animate-pulse">OVERDUE</span>}
                        {rec.effectiveness_verified && <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">VERIFIED</span>}
                        {rec.priority === 'critical' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-semibold">CRITICAL</span>}
                      </div>
                      <h4 className="text-white font-semibold text-sm mt-1">{rec.title}</h4>
                      <p className="text-white/40 text-xs mt-0.5">{rec.responsible_name || 'Unassigned'}{rec.target_date ? ` · Due: ${rec.target_date}` : ''}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-lg font-medium shrink-0 ${getStatusStyle(rec.status)}`}>{rec.status}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-white/10 p-4 space-y-3" onClick={e => e.stopPropagation()}>
                    <p className="text-white/70 text-sm">{rec.description}</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                      <div><span className="text-white/40 text-xs">Source</span><p className="text-white">{rec.source || '-'}</p></div>
                      <div><span className="text-white/40 text-xs">Expected Benefit</span><p className="text-white">{rec.expected_benefit || '-'}</p></div>
                      <div><span className="text-white/40 text-xs">Resources</span><p className="text-white">{rec.resources_required || '-'}</p></div>
                    </div>
                    {rec.actions_taken && <div><span className="text-white/40 text-xs">Actions Taken</span><p className="text-white/70 text-sm">{rec.actions_taken}</p></div>}
                    {rec.actual_benefit && <div><span className="text-white/40 text-xs">Actual Benefit (measured)</span><p className="text-green-400/80 text-sm">{rec.actual_benefit}</p></div>}
                    {rec.effectiveness_review && <div><span className="text-white/40 text-xs">Effectiveness Review</span><p className="text-white/70 text-sm">{rec.effectiveness_review}</p></div>}
                    <div className="flex gap-2 pt-2">
                      <button onClick={() => openEdit(rec)} className="px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg text-sm hover:bg-purple-500/30">Edit</button>
                      <button onClick={() => setConfirmAction({ title: 'Delete Improvement', message: `Delete "${rec.title}"?`, variant: 'danger', confirmLabel: 'Delete', onConfirm: () => { deleteRecord(rec.id); setConfirmAction(null) } })}
                        className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30">Delete</button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {filtered.length === 0 && !loading && (
          <div className="glass glass-border rounded-xl p-8 text-center">
            <p className="text-white/60 mb-2">No improvements logged</p>
            <p className="text-white/40 text-sm">Track improvements from audits, NCRs, management reviews, and suggestions</p>
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
            <div className="glass glass-border rounded-2xl p-6 w-full max-w-2xl my-8">
              <h3 className="text-xl font-bold text-white mb-4">{editing ? 'Edit Improvement' : 'Log Improvement'}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">Type *</label>
                    <select value={form.improvement_type} onChange={e => setForm({ ...form, improvement_type: e.target.value })} className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm">
                      {IMPROVEMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">Priority</label>
                    <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm">
                      {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-white/60 text-xs mb-1 block">Title *</label>
                  <input type="text" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                </div>

                <div>
                  <label className="text-white/60 text-xs mb-1 block">Description *</label>
                  <textarea rows={3} required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">Source</label>
                    <input type="text" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} placeholder="Audit, NCR, management review..." className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                  </div>
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">Source Reference</label>
                    <input type="text" value={form.source_reference} onChange={e => setForm({ ...form, source_reference: e.target.value })} placeholder="NCR-HQ-2026-001" className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                  </div>
                </div>

                <div>
                  <label className="text-white/60 text-xs mb-1 block">Standards</label>
                  <div className="flex gap-2">
                    {STANDARDS.map(std => (
                      <button key={std.code} type="button" onClick={() => toggleStandard(std.code)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${form.standards.includes(std.code) ? 'bg-purple-500 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>
                        {std.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">Expected Benefit</label>
                    <textarea rows={2} value={form.expected_benefit} onChange={e => setForm({ ...form, expected_benefit: e.target.value })} placeholder="What will this improve?" className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                  </div>
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">Resources Required</label>
                    <textarea rows={2} value={form.resources_required} onChange={e => setForm({ ...form, resources_required: e.target.value })} placeholder="Budget, people, equipment..." className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
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
                    <label className="text-white/60 text-xs mb-1 block">Status</label>
                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm">
                      {STATUSES.map(s => <option key={s.value} value={s.value}>{s.value}</option>)}
                    </select>
                  </div>
                </div>

                {(form.status === 'Implemented' || form.status === 'Verified' || form.status === 'Closed') && (
                  <div className="glass rounded-lg p-4">
                    <h4 className="text-white text-sm font-semibold mb-3">Implementation & Effectiveness</h4>
                    <div>
                      <label className="text-white/60 text-xs mb-1 block">Actions Taken</label>
                      <textarea rows={2} value={form.actions_taken} onChange={e => setForm({ ...form, actions_taken: e.target.value })} className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                    </div>
                    <div className="mt-3">
                      <label className="text-white/60 text-xs mb-1 block">Actual Benefit (measured outcome)</label>
                      <textarea rows={2} value={form.actual_benefit} onChange={e => setForm({ ...form, actual_benefit: e.target.value })} className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                    </div>
                    <div className="mt-3">
                      <label className="text-white/60 text-xs mb-1 block">Effectiveness Review</label>
                      <textarea rows={2} value={form.effectiveness_review} onChange={e => setForm({ ...form, effectiveness_review: e.target.value })} placeholder="Was the improvement effective? Evidence..." className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button type="submit" className="flex-1 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all">
                    {editing ? 'Update' : 'Log Improvement'}
                  </button>
                  <button type="button" onClick={() => { setShowForm(false); setEditing(null); setForm(defaultForm) }}
                    className="px-6 py-2.5 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {confirmAction && <ConfirmModal title={confirmAction.title} message={confirmAction.message} variant={confirmAction.variant} confirmLabel={confirmAction.confirmLabel} onConfirm={confirmAction.onConfirm} onCancel={() => setConfirmAction(null)} />}
      </div>
    </Layout>
  )
}

export default ImprovementRegister

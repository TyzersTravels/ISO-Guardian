import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { supabase } from '../lib/supabase'
import { logActivity } from '../lib/auditLogger'
import Layout from '../components/Layout'
import ConfirmModal from '../components/ConfirmModal'

const FEEDBACK_TYPES = [
  { value: 'complaint', label: 'Complaint', color: 'bg-red-500/20 text-red-400' },
  { value: 'compliment', label: 'Compliment', color: 'bg-green-500/20 text-green-400' },
  { value: 'suggestion', label: 'Suggestion', color: 'bg-blue-500/20 text-blue-400' },
  { value: 'survey', label: 'Survey Response', color: 'bg-purple-500/20 text-purple-400' },
  { value: 'return', label: 'Return', color: 'bg-orange-500/20 text-orange-400' },
  { value: 'warranty_claim', label: 'Warranty Claim', color: 'bg-yellow-500/20 text-yellow-400' },
  { value: 'other', label: 'Other', color: 'bg-white/10 text-white/50' },
]

const STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed']
const SEVERITIES = ['low', 'medium', 'high', 'critical']
const STANDARDS = [
  { code: 'ISO_9001', label: 'ISO 9001' },
  { code: 'ISO_14001', label: 'ISO 14001' },
  { code: 'ISO_45001', label: 'ISO 45001' },
]

const CustomerFeedback = () => {
  const { userProfile, getEffectiveCompanyId } = useAuth()
  const toast = useToast()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)
  const [users, setUsers] = useState([])

  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const defaultForm = {
    feedback_type: 'complaint', customer_name: '', customer_contact: '',
    source: '', reference_number: '', subject: '', description: '',
    product_service: '', date_received: new Date().toISOString().split('T')[0],
    severity: 'medium', assigned_to: '', root_cause: '', corrective_action: '',
    resolution_notes: '', satisfaction_score: '', nps_score: '',
    status: 'Open', standards: ['ISO_9001'],
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
        .from('customer_feedback')
        .select('id, feedback_type, customer_name, customer_contact, source, reference_number, subject, description, product_service, date_received, severity, assigned_to, root_cause, corrective_action, date_resolved, resolution_notes, linked_ncr_id, satisfaction_score, nps_score, status, standards, created_at')
        .eq('company_id', getEffectiveCompanyId())
        .order('created_at', { ascending: false })
      if (error) throw error

      const userIds = [...new Set((data || []).map(r => r.assigned_to).filter(Boolean))]
      let userMap = {}
      if (userIds.length > 0) {
        const { data: u } = await supabase.from('users').select('id, full_name, email').in('id', userIds)
        if (u) u.forEach(x => { userMap[x.id] = x.full_name || x.email })
      }
      setRecords((data || []).map(r => ({ ...r, assigned_name: userMap[r.assigned_to] || '' })))
    } catch (err) {
      toast.error('Failed to load feedback')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const companyId = getEffectiveCompanyId()
      const payload = {
        company_id: companyId, feedback_type: form.feedback_type,
        customer_name: form.customer_name, customer_contact: form.customer_contact || null,
        source: form.source || null, reference_number: form.reference_number || null,
        subject: form.subject, description: form.description,
        product_service: form.product_service || null,
        date_received: form.date_received,
        severity: form.feedback_type === 'complaint' ? form.severity : null,
        assigned_to: form.assigned_to || null,
        root_cause: form.root_cause || null, corrective_action: form.corrective_action || null,
        resolution_notes: form.resolution_notes || null,
        satisfaction_score: form.satisfaction_score ? parseInt(form.satisfaction_score) : null,
        nps_score: form.nps_score ? parseInt(form.nps_score) : null,
        status: form.status, standards: form.standards,
      }

      if (editing) {
        if (form.status === 'Resolved' && !editing.date_resolved) payload.date_resolved = new Date().toISOString().split('T')[0]
        const { error } = await supabase.from('customer_feedback').update(payload).eq('id', editing.id)
        if (error) throw error
        await logActivity({ companyId, userId: userProfile.id, action: 'updated', entityType: 'customer_feedback', entityId: editing.id, changes: { subject: form.subject } })
        toast.success('Feedback updated')
      } else {
        payload.created_by = userProfile.id
        const { data, error } = await supabase.from('customer_feedback').insert(payload).select('id').single()
        if (error) throw error
        await logActivity({ companyId, userId: userProfile.id, action: 'created', entityType: 'customer_feedback', entityId: data.id, changes: { type: form.feedback_type, customer: form.customer_name } })
        toast.success('Feedback recorded')
      }

      setShowForm(false); setEditing(null); setForm(defaultForm); fetchRecords()
    } catch (err) {
      toast.error('Failed to save feedback')
    }
  }

  const openEdit = (r) => {
    setEditing(r)
    setForm({
      feedback_type: r.feedback_type || 'complaint', customer_name: r.customer_name || '',
      customer_contact: r.customer_contact || '', source: r.source || '',
      reference_number: r.reference_number || '', subject: r.subject || '',
      description: r.description || '', product_service: r.product_service || '',
      date_received: r.date_received || '', severity: r.severity || 'medium',
      assigned_to: r.assigned_to || '', root_cause: r.root_cause || '',
      corrective_action: r.corrective_action || '', resolution_notes: r.resolution_notes || '',
      satisfaction_score: r.satisfaction_score ?? '', nps_score: r.nps_score ?? '',
      status: r.status || 'Open', standards: r.standards || ['ISO_9001'],
    })
    setShowForm(true)
  }

  const deleteRecord = async (id) => {
    try {
      const { error } = await supabase.from('customer_feedback').delete().eq('id', id)
      if (error) throw error
      await logActivity({ companyId: getEffectiveCompanyId(), userId: userProfile.id, action: 'deleted', entityType: 'customer_feedback', entityId: id })
      toast.success('Feedback deleted')
      fetchRecords(); setSelectedRecord(null)
    } catch (err) { toast.error('Failed to delete') }
  }

  const toggleStandard = (code) => {
    setForm(prev => ({ ...prev, standards: prev.standards.includes(code) ? prev.standards.filter(s => s !== code) : [...prev.standards, code] }))
  }

  const filtered = records.filter(r => {
    if (typeFilter !== 'all' && r.feedback_type !== typeFilter) return false
    if (statusFilter !== 'all' && r.status !== statusFilter) return false
    return true
  })

  // Stats
  const complaints = records.filter(r => r.feedback_type === 'complaint')
  const openComplaints = complaints.filter(r => r.status === 'Open' || r.status === 'In Progress').length
  const avgSatisfaction = records.filter(r => r.satisfaction_score).length > 0
    ? (records.filter(r => r.satisfaction_score).reduce((sum, r) => sum + r.satisfaction_score, 0) / records.filter(r => r.satisfaction_score).length).toFixed(1)
    : '-'
  const npsScores = records.filter(r => r.nps_score != null)
  const nps = npsScores.length > 0
    ? Math.round(((npsScores.filter(r => r.nps_score >= 9).length / npsScores.length) - (npsScores.filter(r => r.nps_score <= 6).length / npsScores.length)) * 100)
    : '-'

  const getTypeStyle = (type) => FEEDBACK_TYPES.find(t => t.value === type)?.color || 'bg-white/10 text-white/50'
  const getTypeLabel = (type) => FEEDBACK_TYPES.find(t => t.value === type)?.label || type

  if (loading) return <Layout><div className="text-white text-center py-12">Loading feedback...</div></Layout>

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-1">Customer Satisfaction</h2>
            <p className="text-white/60 text-sm">ISO 9001 §9.1.2 · Customer feedback & complaint management</p>
          </div>
          <button onClick={() => { setEditing(null); setForm(defaultForm); setShowForm(true) }}
            className="self-start sm:self-auto px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all text-sm">
            + Record Feedback
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Total Feedback', value: records.length, color: 'text-white' },
            { label: 'Open Complaints', value: openComplaints, color: 'text-red-400' },
            { label: 'Avg Satisfaction', value: avgSatisfaction, color: 'text-cyan-400', suffix: '/10' },
            { label: 'NPS Score', value: nps, color: typeof nps === 'number' && nps >= 0 ? 'text-green-400' : 'text-red-400' },
            { label: 'Compliments', value: records.filter(r => r.feedback_type === 'compliment').length, color: 'text-green-400' },
          ].map(kpi => (
            <div key={kpi.label} className="glass glass-border rounded-xl p-4 text-center">
              <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}{kpi.suffix || ''}</div>
              <div className="text-white/50 text-xs mt-1">{kpi.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="glass-input rounded-lg px-3 py-1.5 text-sm text-white">
            <option value="all">All Types</option>
            {FEEDBACK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="glass-input rounded-lg px-3 py-1.5 text-sm text-white">
            <option value="all">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* List */}
        <div className="space-y-2">
          {filtered.map(rec => {
            const isExpanded = selectedRecord?.id === rec.id
            return (
              <div key={rec.id} className={`glass glass-border rounded-xl overflow-hidden ${isExpanded ? 'ring-1 ring-purple-500' : ''}`}>
                <div className="p-4 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => setSelectedRecord(isExpanded ? null : rec)}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${getTypeStyle(rec.feedback_type)}`}>{getTypeLabel(rec.feedback_type)}</span>
                        <span className="text-white/30 text-xs">{rec.date_received}</span>
                        {rec.severity === 'critical' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-semibold">CRITICAL</span>}
                      </div>
                      <h4 className="text-white font-semibold text-sm mt-1">{rec.subject}</h4>
                      <p className="text-white/40 text-xs mt-0.5">{rec.customer_name}{rec.product_service ? ` · ${rec.product_service}` : ''}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {rec.satisfaction_score && (
                        <div className="text-center">
                          <div className={`text-lg font-bold ${rec.satisfaction_score >= 7 ? 'text-green-400' : rec.satisfaction_score >= 4 ? 'text-yellow-400' : 'text-red-400'}`}>{rec.satisfaction_score}</div>
                          <div className="text-[10px] text-white/30">CSAT</div>
                        </div>
                      )}
                      <span className={`text-xs px-2 py-1 rounded-lg font-medium ${
                        rec.status === 'Closed' ? 'bg-green-500/20 text-green-400' :
                        rec.status === 'Resolved' ? 'bg-blue-500/20 text-blue-400' :
                        rec.status === 'In Progress' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-white/10 text-white/60'
                      }`}>{rec.status}</span>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-white/10 p-4 space-y-3" onClick={e => e.stopPropagation()}>
                    <p className="text-white/70 text-sm">{rec.description}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div><span className="text-white/40 text-xs">Source</span><p className="text-white">{rec.source || '-'}</p></div>
                      <div><span className="text-white/40 text-xs">Ref</span><p className="text-white">{rec.reference_number || '-'}</p></div>
                      <div><span className="text-white/40 text-xs">Assigned To</span><p className="text-white">{rec.assigned_name || '-'}</p></div>
                      <div><span className="text-white/40 text-xs">NPS Score</span><p className="text-white">{rec.nps_score ?? '-'}</p></div>
                    </div>
                    {rec.root_cause && <div><span className="text-white/40 text-xs">Root Cause</span><p className="text-white/70 text-sm">{rec.root_cause}</p></div>}
                    {rec.corrective_action && <div><span className="text-white/40 text-xs">Corrective Action</span><p className="text-white/70 text-sm">{rec.corrective_action}</p></div>}
                    {rec.resolution_notes && <div><span className="text-white/40 text-xs">Resolution</span><p className="text-white/70 text-sm">{rec.resolution_notes}</p></div>}
                    <div className="flex gap-2 pt-2">
                      <button onClick={() => openEdit(rec)} className="px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg text-sm hover:bg-purple-500/30">Edit</button>
                      <button onClick={() => setConfirmAction({ title: 'Delete Feedback', message: `Delete "${rec.subject}"?`, variant: 'danger', confirmLabel: 'Delete', onConfirm: () => { deleteRecord(rec.id); setConfirmAction(null) } })}
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
            <p className="text-white/60 mb-2">No feedback recorded yet</p>
            <p className="text-white/40 text-sm">Track customer complaints, compliments, and surveys to meet ISO 9.1.2 requirements</p>
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
            <div className="glass glass-border rounded-2xl p-6 w-full max-w-2xl my-8">
              <h3 className="text-xl font-bold text-white mb-4">{editing ? 'Edit Feedback' : 'Record Customer Feedback'}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">Type *</label>
                    <select value={form.feedback_type} onChange={e => setForm({ ...form, feedback_type: e.target.value })} className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm">
                      {FEEDBACK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">Date Received *</label>
                    <input type="date" required value={form.date_received} onChange={e => setForm({ ...form, date_received: e.target.value })} className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">Customer Name *</label>
                    <input type="text" required value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                  </div>
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">Contact</label>
                    <input type="text" value={form.customer_contact} onChange={e => setForm({ ...form, customer_contact: e.target.value })} placeholder="Email or phone" className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                  </div>
                </div>

                <div>
                  <label className="text-white/60 text-xs mb-1 block">Subject *</label>
                  <input type="text" required value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                </div>

                <div>
                  <label className="text-white/60 text-xs mb-1 block">Description *</label>
                  <textarea rows={3} required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">Source</label>
                    <input type="text" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} placeholder="Email, phone, form..." className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                  </div>
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">Product / Service</label>
                    <input type="text" value={form.product_service} onChange={e => setForm({ ...form, product_service: e.target.value })} className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                  </div>
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">Assigned To</label>
                    <select value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })} className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm">
                      <option value="">Unassigned</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.full_name || u.email}</option>)}
                    </select>
                  </div>
                </div>

                {form.feedback_type === 'complaint' && (
                  <div className="glass rounded-lg p-4">
                    <h4 className="text-white text-sm font-semibold mb-3">Complaint Resolution</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-white/60 text-xs mb-1 block">Severity</label>
                        <select value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })} className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm">
                          {SEVERITIES.map(s => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-white/60 text-xs mb-1 block">Status</label>
                        <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm">
                          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="text-white/60 text-xs mb-1 block">Root Cause</label>
                      <textarea rows={2} value={form.root_cause} onChange={e => setForm({ ...form, root_cause: e.target.value })} className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                    </div>
                    <div className="mt-3">
                      <label className="text-white/60 text-xs mb-1 block">Corrective Action</label>
                      <textarea rows={2} value={form.corrective_action} onChange={e => setForm({ ...form, corrective_action: e.target.value })} className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">Satisfaction Score (1-10)</label>
                    <input type="number" min="1" max="10" value={form.satisfaction_score} onChange={e => setForm({ ...form, satisfaction_score: e.target.value })} className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                  </div>
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">NPS Score (0-10)</label>
                    <input type="number" min="0" max="10" value={form.nps_score} onChange={e => setForm({ ...form, nps_score: e.target.value })} className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
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

                <div className="flex gap-3 pt-2">
                  <button type="submit" className="flex-1 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all">
                    {editing ? 'Update' : 'Record Feedback'}
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

export default CustomerFeedback

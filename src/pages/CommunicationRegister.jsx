import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { supabase } from '../lib/supabase'
import { logActivity } from '../lib/auditLogger'
import Layout from '../components/Layout'
import ConfirmModal from '../components/ConfirmModal'

const COMM_TYPES = [
  { value: 'internal', label: 'Internal' },
  { value: 'external_incoming', label: 'External (Incoming)' },
  { value: 'external_outgoing', label: 'External (Outgoing)' },
]

const FREQUENCIES = [
  { value: 'once', label: 'Once-Off' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually', label: 'Annually' },
  { value: 'as_needed', label: 'As Needed' },
]

const STATUSES = ['Planned', 'Completed', 'Overdue', 'Cancelled']
const STANDARDS = [
  { code: 'ISO_9001', label: 'ISO 9001' },
  { code: 'ISO_14001', label: 'ISO 14001' },
  { code: 'ISO_45001', label: 'ISO 45001' },
]

const CommunicationRegister = () => {
  const { userProfile, getEffectiveCompanyId } = useAuth()
  const toast = useToast()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)

  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const defaultForm = {
    subject: '', communication_type: 'internal', description: '',
    what_communicated: '', when_communicated: '', with_whom: '',
    how_communicated: '', who_communicates: '', standards: ['ISO_9001'],
    frequency: 'once', is_recurring: false, is_legal_communication: false,
    regulatory_body: '', status: 'Planned', notes: '',
  }
  const [form, setForm] = useState(defaultForm)

  useEffect(() => {
    if (userProfile) fetchRecords()
  }, [userProfile])

  const fetchRecords = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('communications')
        .select('id, subject, communication_type, description, what_communicated, when_communicated, with_whom, how_communicated, who_communicates, standards, frequency, is_recurring, is_legal_communication, regulatory_body, status, notes, created_at')
        .eq('company_id', getEffectiveCompanyId())
        .order('created_at', { ascending: false })
      if (error) throw error
      setRecords(data || [])
    } catch (err) {
      toast.error('Failed to load communications')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const companyId = getEffectiveCompanyId()
      const payload = {
        company_id: companyId, subject: form.subject,
        communication_type: form.communication_type,
        description: form.description || null,
        what_communicated: form.what_communicated,
        when_communicated: form.when_communicated || null,
        with_whom: form.with_whom,
        how_communicated: form.how_communicated || null,
        who_communicates: form.who_communicates || null,
        standards: form.standards, frequency: form.frequency,
        is_recurring: form.is_recurring,
        is_legal_communication: form.is_legal_communication,
        regulatory_body: form.is_legal_communication ? form.regulatory_body || null : null,
        status: form.status, notes: form.notes || null,
      }

      if (editing) {
        const { error } = await supabase.from('communications').update(payload).eq('id', editing.id)
        if (error) throw error
        await logActivity({ companyId, userId: userProfile.id, action: 'updated', entityType: 'communication', entityId: editing.id, changes: { subject: form.subject } })
        toast.success('Communication updated')
      } else {
        payload.created_by = userProfile.id
        const { data, error } = await supabase.from('communications').insert(payload).select('id').single()
        if (error) throw error
        await logActivity({ companyId, userId: userProfile.id, action: 'created', entityType: 'communication', entityId: data.id, changes: { subject: form.subject, type: form.communication_type } })
        toast.success('Communication recorded')
      }

      setShowForm(false); setEditing(null); setForm(defaultForm); fetchRecords()
    } catch (err) {
      toast.error('Failed to save communication')
    }
  }

  const openEdit = (r) => {
    setEditing(r)
    setForm({
      subject: r.subject || '', communication_type: r.communication_type || 'internal',
      description: r.description || '', what_communicated: r.what_communicated || '',
      when_communicated: r.when_communicated || '', with_whom: r.with_whom || '',
      how_communicated: r.how_communicated || '', who_communicates: r.who_communicates || '',
      standards: r.standards || ['ISO_9001'], frequency: r.frequency || 'once',
      is_recurring: r.is_recurring || false, is_legal_communication: r.is_legal_communication || false,
      regulatory_body: r.regulatory_body || '', status: r.status || 'Planned', notes: r.notes || '',
    })
    setShowForm(true)
  }

  const deleteRecord = async (id) => {
    try {
      const { error } = await supabase.from('communications').delete().eq('id', id)
      if (error) throw error
      await logActivity({ companyId: getEffectiveCompanyId(), userId: userProfile.id, action: 'deleted', entityType: 'communication', entityId: id })
      toast.success('Communication deleted'); fetchRecords(); setSelectedRecord(null)
    } catch (err) { toast.error('Failed to delete') }
  }

  const toggleStandard = (code) => {
    setForm(prev => ({ ...prev, standards: prev.standards.includes(code) ? prev.standards.filter(s => s !== code) : [...prev.standards, code] }))
  }

  const filtered = records.filter(r => {
    if (typeFilter !== 'all' && r.communication_type !== typeFilter) return false
    if (statusFilter !== 'all' && r.status !== statusFilter) return false
    return true
  })

  const total = records.length
  const planned = records.filter(r => r.status === 'Planned').length
  const completed = records.filter(r => r.status === 'Completed').length
  const legal = records.filter(r => r.is_legal_communication).length

  const getTypeLabel = (t) => COMM_TYPES.find(c => c.value === t)?.label || t

  if (loading) return <Layout><div className="text-white text-center py-12">Loading communications...</div></Layout>

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-1">Communication Register</h2>
            <p className="text-white/60 text-sm">ISO 9001 §7.4 · ISO 14001 §7.4 · ISO 45001 §7.4</p>
          </div>
          <button onClick={() => { setEditing(null); setForm(defaultForm); setShowForm(true) }}
            className="self-start sm:self-auto px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all text-sm">
            + Add Communication
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total', value: total, color: 'text-white' },
            { label: 'Planned', value: planned, color: 'text-blue-400' },
            { label: 'Completed', value: completed, color: 'text-green-400' },
            { label: 'Regulatory', value: legal, color: 'text-orange-400' },
          ].map(kpi => (
            <div key={kpi.label} className="glass glass-border rounded-xl p-4 text-center">
              <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
              <div className="text-white/50 text-xs mt-1">{kpi.label}</div>
            </div>
          ))}
        </div>

        {/* ISO 7.4 reference card */}
        <div className="glass glass-border rounded-2xl p-4">
          <p className="text-white/40 text-xs">ISO 7.4 requires determining: <strong className="text-white/60">What</strong> to communicate, <strong className="text-white/60">When</strong> to communicate, <strong className="text-white/60">With whom</strong> to communicate, <strong className="text-white/60">How</strong> to communicate, and <strong className="text-white/60">Who</strong> communicates.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="glass-input rounded-lg px-3 py-1.5 text-sm text-white">
            <option value="all">All Types</option>
            {COMM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
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
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                          rec.communication_type === 'internal' ? 'bg-blue-500/20 text-blue-400' :
                          rec.communication_type === 'external_outgoing' ? 'bg-purple-500/20 text-purple-400' :
                          'bg-cyan-500/20 text-cyan-400'
                        }`}>{getTypeLabel(rec.communication_type)}</span>
                        {rec.is_recurring && <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/40">Recurring</span>}
                        {rec.is_legal_communication && <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400">REGULATORY</span>}
                        {(rec.standards || []).map(s => (
                          <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">{s.replace('ISO_', 'ISO ')}</span>
                        ))}
                      </div>
                      <h4 className="text-white font-semibold text-sm mt-1">{rec.subject}</h4>
                      <p className="text-white/40 text-xs mt-0.5">{rec.with_whom}{rec.how_communicated ? ` · via ${rec.how_communicated}` : ''}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-lg font-medium shrink-0 ${
                      rec.status === 'Completed' ? 'bg-green-500/20 text-green-400' :
                      rec.status === 'Overdue' ? 'bg-red-500/20 text-red-400' :
                      rec.status === 'Cancelled' ? 'bg-white/10 text-white/30' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>{rec.status}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-white/10 p-4 space-y-3" onClick={e => e.stopPropagation()}>
                    {rec.description && <p className="text-white/70 text-sm">{rec.description}</p>}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                      <div className="glass rounded-lg p-2.5"><span className="text-white/40 text-[10px] block">What</span><p className="text-white text-xs mt-0.5">{rec.what_communicated}</p></div>
                      <div className="glass rounded-lg p-2.5"><span className="text-white/40 text-[10px] block">When</span><p className="text-white text-xs mt-0.5">{rec.when_communicated || '-'}</p></div>
                      <div className="glass rounded-lg p-2.5"><span className="text-white/40 text-[10px] block">With Whom</span><p className="text-white text-xs mt-0.5">{rec.with_whom}</p></div>
                      <div className="glass rounded-lg p-2.5"><span className="text-white/40 text-[10px] block">How</span><p className="text-white text-xs mt-0.5">{rec.how_communicated || '-'}</p></div>
                      <div className="glass rounded-lg p-2.5"><span className="text-white/40 text-[10px] block">Who</span><p className="text-white text-xs mt-0.5">{rec.who_communicates || '-'}</p></div>
                    </div>
                    {rec.frequency !== 'once' && <p className="text-white/40 text-xs">Frequency: <span className="text-white/60 capitalize">{rec.frequency?.replace('_', ' ')}</span></p>}
                    {rec.regulatory_body && <p className="text-white/40 text-xs">Regulatory Body: <span className="text-orange-400">{rec.regulatory_body}</span></p>}
                    {rec.notes && <div><span className="text-white/40 text-xs">Notes</span><p className="text-white/70 text-sm">{rec.notes}</p></div>}
                    <div className="flex gap-2 pt-2">
                      <button onClick={() => openEdit(rec)} className="px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg text-sm hover:bg-purple-500/30">Edit</button>
                      <button onClick={() => setConfirmAction({ title: 'Delete Communication', message: `Delete "${rec.subject}"?`, variant: 'danger', confirmLabel: 'Delete', onConfirm: () => { deleteRecord(rec.id); setConfirmAction(null) } })}
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
            <p className="text-white/60 mb-2">No communications recorded</p>
            <p className="text-white/40 text-sm">Define internal and external communications to meet ISO 7.4 requirements</p>
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
            <div className="glass glass-border rounded-2xl p-6 w-full max-w-2xl my-8">
              <h3 className="text-xl font-bold text-white mb-4">{editing ? 'Edit Communication' : 'Add Communication'}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">Type *</label>
                    <select value={form.communication_type} onChange={e => setForm({ ...form, communication_type: e.target.value })} className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm">
                      {COMM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">Status</label>
                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm">
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-white/60 text-xs mb-1 block">Subject *</label>
                  <input type="text" required value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Monthly safety performance report" className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                </div>

                {/* ISO 7.4 Five W's */}
                <div className="glass rounded-lg p-4 border border-purple-500/20">
                  <h4 className="text-purple-400 text-sm font-semibold mb-3">ISO 7.4 — The Five W's of Communication</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-white/60 text-xs mb-1 block">What to communicate *</label>
                      <textarea rows={2} required value={form.what_communicated} onChange={e => setForm({ ...form, what_communicated: e.target.value })} placeholder="The topic/content being communicated..." className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-white/60 text-xs mb-1 block">When</label>
                        <input type="date" value={form.when_communicated} onChange={e => setForm({ ...form, when_communicated: e.target.value })} className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                      </div>
                      <div>
                        <label className="text-white/60 text-xs mb-1 block">With whom *</label>
                        <input type="text" required value={form.with_whom} onChange={e => setForm({ ...form, with_whom: e.target.value })} placeholder="Audience/recipient" className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-white/60 text-xs mb-1 block">How</label>
                        <input type="text" value={form.how_communicated} onChange={e => setForm({ ...form, how_communicated: e.target.value })} placeholder="Email, meeting, notice board..." className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                      </div>
                      <div>
                        <label className="text-white/60 text-xs mb-1 block">Who communicates</label>
                        <input type="text" value={form.who_communicates} onChange={e => setForm({ ...form, who_communicates: e.target.value })} placeholder="Responsible person/role" className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                      </div>
                    </div>
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
                    <label className="text-white/60 text-xs mb-1 block">Frequency</label>
                    <select value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value, is_recurring: e.target.value !== 'once' })} className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm">
                      {FREQUENCIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.is_legal_communication} onChange={e => setForm({ ...form, is_legal_communication: e.target.checked })} className="accent-orange-500" />
                      <span className="text-white/70 text-sm">Regulatory Communication</span>
                    </label>
                  </div>
                </div>

                {form.is_legal_communication && (
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">Regulatory Body</label>
                    <input type="text" value={form.regulatory_body} onChange={e => setForm({ ...form, regulatory_body: e.target.value })} placeholder="e.g. DFFE, DoEL, Municipality" className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                  </div>
                )}

                <div>
                  <label className="text-white/60 text-xs mb-1 block">Notes</label>
                  <textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="submit" className="flex-1 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all">
                    {editing ? 'Update' : 'Add Communication'}
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

export default CommunicationRegister

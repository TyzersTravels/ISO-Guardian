import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { supabase } from '../lib/supabase'
import { logActivity } from '../lib/auditLogger'
import Layout from '../components/Layout'
import ConfirmModal from '../components/ConfirmModal'

const PROCESS_TYPES = [
  { value: 'core', label: 'Core (Value-Adding)', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
  { value: 'support', label: 'Support (Enabling)', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  { value: 'management', label: 'Management (Governing)', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
]

const FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'biannually', label: 'Bi-annually' },
  { value: 'annually', label: 'Annually' },
]

const STATUSES = ['Active', 'Under Review', 'Obsolete', 'Draft']
const STANDARDS = [
  { code: 'ISO_9001', label: 'ISO 9001' },
  { code: 'ISO_14001', label: 'ISO 14001' },
  { code: 'ISO_45001', label: 'ISO 45001' },
]

const STATUS_COLORS = {
  'Active': 'bg-green-500/10 text-green-400 border-green-500/20',
  'Under Review': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Obsolete': 'bg-red-500/10 text-red-400 border-red-500/20',
  'Draft': 'bg-white/5 text-white/40 border-white/10',
}

const ProcessRegister = () => {
  const { userProfile, getEffectiveCompanyId } = useAuth()
  const toast = useToast()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)
  const [viewMode, setViewMode] = useState('table') // 'table' or 'map'

  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const defaultForm = {
    process_name: '', process_code: '', process_owner_name: '', department: '',
    process_type: 'core', standards: ['ISO_9001'], clause_references: ['4.4'],
    purpose: '', scope: '', inputs: '', outputs: '', activities: '',
    sequence_order: 0, resources: '', competency_requirements: '',
    risks_opportunities: '', kpis: '', performance_target: '',
    monitoring_method: '', monitoring_frequency: 'monthly',
    related_documents: '', related_procedures: '',
    status: 'Active', effective_date: '', last_reviewed: '', next_review_date: '',
    notes: '',
  }
  const [form, setForm] = useState(defaultForm)

  useEffect(() => {
    if (userProfile) fetchRecords()
  }, [userProfile])

  const fetchRecords = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('processes')
        .select('id, process_name, process_code, process_owner_name, department, process_type, standards, clause_references, purpose, scope, inputs, outputs, activities, sequence_order, upstream_processes, downstream_processes, resources, competency_requirements, risks_opportunities, kpis, performance_target, monitoring_method, monitoring_frequency, related_documents, related_procedures, status, effective_date, last_reviewed, next_review_date, notes, created_at')
        .eq('company_id', getEffectiveCompanyId())
        .order('sequence_order', { ascending: true })
      if (error) throw error
      setRecords(data || [])
    } catch (err) {
      toast.error('Failed to load processes')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const companyId = getEffectiveCompanyId()
      const payload = {
        company_id: companyId,
        process_name: form.process_name,
        process_code: form.process_code || null,
        process_owner_name: form.process_owner_name || null,
        department: form.department || null,
        process_type: form.process_type,
        standards: form.standards,
        clause_references: form.clause_references,
        purpose: form.purpose || null,
        scope: form.scope || null,
        inputs: form.inputs || null,
        outputs: form.outputs || null,
        activities: form.activities || null,
        sequence_order: form.sequence_order || 0,
        resources: form.resources || null,
        competency_requirements: form.competency_requirements || null,
        risks_opportunities: form.risks_opportunities || null,
        kpis: form.kpis || null,
        performance_target: form.performance_target || null,
        monitoring_method: form.monitoring_method || null,
        monitoring_frequency: form.monitoring_frequency || null,
        related_documents: form.related_documents || null,
        related_procedures: form.related_procedures || null,
        status: form.status,
        effective_date: form.effective_date || null,
        last_reviewed: form.last_reviewed || null,
        next_review_date: form.next_review_date || null,
        notes: form.notes || null,
      }

      if (editing) {
        const { error } = await supabase.from('processes').update(payload).eq('id', editing.id)
        if (error) throw error
        await logActivity({ companyId, userId: userProfile.id, action: 'updated', entityType: 'process', entityId: editing.id, changes: { process_name: form.process_name } })
        toast.success('Process updated')
      } else {
        payload.created_by = userProfile.id
        const { data, error } = await supabase.from('processes').insert(payload).select('id').single()
        if (error) throw error
        await logActivity({ companyId, userId: userProfile.id, action: 'created', entityType: 'process', entityId: data.id, changes: { process_name: form.process_name, type: form.process_type } })
        toast.success('Process added')
      }

      setShowForm(false); setEditing(null); setForm(defaultForm); fetchRecords()
    } catch (err) {
      toast.error('Failed to save process')
    }
  }

  const openEdit = (r) => {
    setEditing(r)
    setForm({
      process_name: r.process_name || '', process_code: r.process_code || '',
      process_owner_name: r.process_owner_name || '', department: r.department || '',
      process_type: r.process_type || 'core', standards: r.standards || ['ISO_9001'],
      clause_references: r.clause_references || ['4.4'],
      purpose: r.purpose || '', scope: r.scope || '', inputs: r.inputs || '',
      outputs: r.outputs || '', activities: r.activities || '',
      sequence_order: r.sequence_order || 0,
      resources: r.resources || '', competency_requirements: r.competency_requirements || '',
      risks_opportunities: r.risks_opportunities || '',
      kpis: r.kpis || '', performance_target: r.performance_target || '',
      monitoring_method: r.monitoring_method || '', monitoring_frequency: r.monitoring_frequency || 'monthly',
      related_documents: r.related_documents || '', related_procedures: r.related_procedures || '',
      status: r.status || 'Active', effective_date: r.effective_date || '',
      last_reviewed: r.last_reviewed || '', next_review_date: r.next_review_date || '',
      notes: r.notes || '',
    })
    setShowForm(true)
  }

  const deleteRecord = async (id) => {
    try {
      const { error } = await supabase.from('processes').delete().eq('id', id)
      if (error) throw error
      await logActivity({ companyId: getEffectiveCompanyId(), userId: userProfile.id, action: 'deleted', entityType: 'process', entityId: id })
      toast.success('Process deleted'); fetchRecords(); setSelectedRecord(null)
    } catch (err) { toast.error('Failed to delete') }
  }

  const toggleStandard = (code) => {
    setForm(prev => ({ ...prev, standards: prev.standards.includes(code) ? prev.standards.filter(s => s !== code) : [...prev.standards, code] }))
  }

  const filtered = records.filter(r => {
    if (typeFilter !== 'all' && r.process_type !== typeFilter) return false
    if (statusFilter !== 'all' && r.status !== statusFilter) return false
    return true
  })

  const total = records.length
  const core = records.filter(r => r.process_type === 'core').length
  const support = records.filter(r => r.process_type === 'support').length
  const management = records.filter(r => r.process_type === 'management').length

  const getTypeInfo = (t) => PROCESS_TYPES.find(p => p.value === t) || PROCESS_TYPES[0]

  if (loading) return <Layout><div className="text-white text-center py-12">Loading processes...</div></Layout>

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-1">Process Register</h2>
            <p className="text-white/60 text-sm">ISO 9001 §4.4 · ISO 14001 §4.4 · ISO 45001 §4.4</p>
          </div>
          <div className="flex gap-2">
            <div className="flex bg-white/5 rounded-lg p-0.5">
              <button onClick={() => setViewMode('table')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'table' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}>
                Table
              </button>
              <button onClick={() => setViewMode('map')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'map' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}>
                Process Map
              </button>
            </div>
            <button onClick={() => { setEditing(null); setForm(defaultForm); setShowForm(true) }}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all text-sm">
              + Add Process
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Processes', value: total, color: 'text-white' },
            { label: 'Core', value: core, color: 'text-cyan-400' },
            { label: 'Support', value: support, color: 'text-purple-400' },
            { label: 'Management', value: management, color: 'text-amber-400' },
          ].map(kpi => (
            <div key={kpi.label} className="glass glass-border rounded-xl p-4 text-center">
              <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
              <div className="text-white/50 text-xs mt-1">{kpi.label}</div>
            </div>
          ))}
        </div>

        {/* ISO reference card */}
        <div className="glass glass-border rounded-2xl p-4">
          <p className="text-white/40 text-xs">ISO 4.4 requires determining: <strong className="text-white/60">Inputs & Outputs</strong>, <strong className="text-white/60">Sequence & Interaction</strong>, <strong className="text-white/60">Criteria & Methods</strong>, <strong className="text-white/60">Resources</strong>, <strong className="text-white/60">Responsibilities</strong>, <strong className="text-white/60">Risks & Opportunities</strong>, and <strong className="text-white/60">Evaluation & Improvement</strong>.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="glass-input rounded-lg px-3 py-1.5 text-sm text-white">
            <option value="all">All Types</option>
            {PROCESS_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="glass-input rounded-lg px-3 py-1.5 text-sm text-white">
            <option value="all">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* TABLE VIEW */}
        {viewMode === 'table' && (
          <>
            {filtered.length === 0 ? (
              <div className="glass glass-border rounded-2xl p-8 text-center">
                <p className="text-white/40">No processes registered yet. Click &quot;+ Add Process&quot; to define your first process.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-white/40 text-xs border-b border-white/5">
                      <th className="text-left py-3 px-3 font-medium">Code</th>
                      <th className="text-left py-3 px-3 font-medium">Process Name</th>
                      <th className="text-left py-3 px-3 font-medium hidden md:table-cell">Type</th>
                      <th className="text-left py-3 px-3 font-medium hidden lg:table-cell">Owner</th>
                      <th className="text-left py-3 px-3 font-medium hidden lg:table-cell">KPIs</th>
                      <th className="text-left py-3 px-3 font-medium">Status</th>
                      <th className="text-right py-3 px-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(r => {
                      const typeInfo = getTypeInfo(r.process_type)
                      return (
                        <tr key={r.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] cursor-pointer" onClick={() => setSelectedRecord(r)}>
                          <td className="py-3 px-3 text-white/50 font-mono text-xs">{r.process_code || '—'}</td>
                          <td className="py-3 px-3">
                            <div className="text-white/90 font-medium">{r.process_name}</div>
                            {r.purpose && <div className="text-white/30 text-xs mt-0.5 line-clamp-1">{r.purpose}</div>}
                          </td>
                          <td className="py-3 px-3 hidden md:table-cell">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs border ${typeInfo.bg}`}>
                              <span className={typeInfo.color}>{typeInfo.label.split(' ')[0]}</span>
                            </span>
                          </td>
                          <td className="py-3 px-3 text-white/50 hidden lg:table-cell">{r.process_owner_name || '—'}</td>
                          <td className="py-3 px-3 text-white/40 text-xs hidden lg:table-cell line-clamp-1">{r.kpis || '—'}</td>
                          <td className="py-3 px-3">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs border ${STATUS_COLORS[r.status] || STATUS_COLORS['Draft']}`}>
                              {r.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right" onClick={e => e.stopPropagation()}>
                            <button onClick={() => openEdit(r)} className="text-purple-400 hover:text-purple-300 text-xs mr-2">Edit</button>
                            <button onClick={() => setConfirmAction({ type: 'delete', id: r.id, name: r.process_name })} className="text-red-400/60 hover:text-red-400 text-xs">Delete</button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* PROCESS MAP VIEW */}
        {viewMode === 'map' && (
          <div className="space-y-6">
            {['management', 'core', 'support'].map(type => {
              const typeInfo = getTypeInfo(type)
              const typeProcesses = filtered.filter(r => r.process_type === type)
              if (typeProcesses.length === 0) return null
              return (
                <div key={type} className="glass glass-border rounded-2xl p-5">
                  <h3 className={`text-sm font-bold ${typeInfo.color} mb-4 uppercase tracking-wider`}>{typeInfo.label}</h3>
                  <div className="flex flex-wrap gap-3">
                    {typeProcesses.map((r, idx) => (
                      <div key={r.id} className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedRecord(r)}
                          className={`px-4 py-3 rounded-xl border ${typeInfo.bg} hover:bg-white/10 transition-all text-left min-w-[140px]`}
                        >
                          <div className="text-white/80 font-medium text-sm">{r.process_name}</div>
                          <div className="text-white/30 text-xs mt-0.5">{r.process_code || 'No code'}</div>
                          {r.kpis && <div className="text-white/20 text-[10px] mt-1 line-clamp-1">{r.kpis}</div>}
                        </button>
                        {idx < typeProcesses.length - 1 && (
                          <svg className="w-4 h-4 text-white/10 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
            {filtered.length === 0 && (
              <div className="glass glass-border rounded-2xl p-8 text-center">
                <p className="text-white/40">No processes to display. Add processes to see the process map.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {selectedRecord && !showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setSelectedRecord(null)}>
          <div className="glass glass-border rounded-2xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-5">
              <div>
                <h3 className="text-lg font-bold text-white">{selectedRecord.process_name}</h3>
                <p className="text-white/40 text-sm mt-0.5">{selectedRecord.process_code || 'No code'} · {getTypeInfo(selectedRecord.process_type).label}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { openEdit(selectedRecord); setSelectedRecord(null) }} className="text-purple-400 hover:text-purple-300 text-sm">Edit</button>
                <button onClick={() => setSelectedRecord(null)} className="text-white/40 hover:text-white text-sm">Close</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {[
                { label: 'Status', value: selectedRecord.status },
                { label: 'Owner', value: selectedRecord.process_owner_name },
                { label: 'Department', value: selectedRecord.department },
                { label: 'Monitoring', value: selectedRecord.monitoring_frequency },
                { label: 'Effective Date', value: selectedRecord.effective_date },
                { label: 'Next Review', value: selectedRecord.next_review_date },
              ].map(({ label, value }) => (
                <div key={label}>
                  <span className="text-white/40 text-xs">{label}</span>
                  <p className="text-white/80 mt-0.5">{value || '—'}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-3">
              {[
                { label: 'Purpose', value: selectedRecord.purpose },
                { label: 'Scope', value: selectedRecord.scope },
                { label: 'Inputs', value: selectedRecord.inputs },
                { label: 'Outputs', value: selectedRecord.outputs },
                { label: 'Key Activities', value: selectedRecord.activities },
                { label: 'Resources Required', value: selectedRecord.resources },
                { label: 'Competency Requirements', value: selectedRecord.competency_requirements },
                { label: 'Risks & Opportunities', value: selectedRecord.risks_opportunities },
                { label: 'KPIs', value: selectedRecord.kpis },
                { label: 'Performance Target', value: selectedRecord.performance_target },
                { label: 'Monitoring Method', value: selectedRecord.monitoring_method },
                { label: 'Related Documents', value: selectedRecord.related_documents },
                { label: 'Related Procedures', value: selectedRecord.related_procedures },
                { label: 'Notes', value: selectedRecord.notes },
              ].filter(({ value }) => value).map(({ label, value }) => (
                <div key={label}>
                  <span className="text-white/40 text-xs">{label}</span>
                  <p className="text-white/70 text-sm mt-0.5 whitespace-pre-wrap">{value}</p>
                </div>
              ))}
            </div>

            {selectedRecord.standards?.length > 0 && (
              <div className="mt-4 flex gap-1.5 flex-wrap">
                {selectedRecord.standards.map(s => (
                  <span key={s} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-white/50 text-xs">{STANDARDS.find(st => st.code === s)?.label || s}</span>
                ))}
              </div>
            )}

            {selectedRecord.clause_references?.length > 0 && (
              <div className="mt-2 flex gap-1.5 flex-wrap">
                {selectedRecord.clause_references.map(c => (
                  <span key={c} className="px-2 py-0.5 bg-cyan-500/5 border border-cyan-500/10 rounded text-cyan-400/60 text-xs">§{c}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => { setShowForm(false); setEditing(null) }}>
          <div className="glass glass-border rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-5">{editing ? 'Edit Process' : 'Add Process'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Row 1: Name, Code, Type */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-1">
                  <label className="text-white/50 text-xs mb-1 block">Process Name *</label>
                  <input required value={form.process_name} onChange={e => setForm({ ...form, process_name: e.target.value })}
                    className="glass-input rounded-lg px-3 py-2 text-sm text-white w-full" placeholder="e.g. Sales & Quotations" />
                </div>
                <div>
                  <label className="text-white/50 text-xs mb-1 block">Process Code</label>
                  <input value={form.process_code} onChange={e => setForm({ ...form, process_code: e.target.value })}
                    className="glass-input rounded-lg px-3 py-2 text-sm text-white w-full" placeholder="e.g. PR-001" />
                </div>
                <div>
                  <label className="text-white/50 text-xs mb-1 block">Process Type *</label>
                  <select value={form.process_type} onChange={e => setForm({ ...form, process_type: e.target.value })}
                    className="glass-input rounded-lg px-3 py-2 text-sm text-white w-full">
                    {PROCESS_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 2: Owner, Department, Order */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-white/50 text-xs mb-1 block">Process Owner</label>
                  <input value={form.process_owner_name} onChange={e => setForm({ ...form, process_owner_name: e.target.value })}
                    className="glass-input rounded-lg px-3 py-2 text-sm text-white w-full" placeholder="Owner name" />
                </div>
                <div>
                  <label className="text-white/50 text-xs mb-1 block">Department</label>
                  <input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}
                    className="glass-input rounded-lg px-3 py-2 text-sm text-white w-full" placeholder="e.g. Operations" />
                </div>
                <div>
                  <label className="text-white/50 text-xs mb-1 block">Sequence Order</label>
                  <input type="number" value={form.sequence_order} onChange={e => setForm({ ...form, sequence_order: parseInt(e.target.value) || 0 })}
                    className="glass-input rounded-lg px-3 py-2 text-sm text-white w-full" min="0" />
                </div>
              </div>

              {/* Standards */}
              <div>
                <label className="text-white/50 text-xs mb-1.5 block">Applicable Standards</label>
                <div className="flex flex-wrap gap-2">
                  {STANDARDS.map(s => (
                    <button key={s.code} type="button" onClick={() => toggleStandard(s.code)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${form.standards.includes(s.code) ? 'bg-purple-500/20 border-purple-500/40 text-purple-300' : 'bg-white/5 border-white/10 text-white/30 hover:text-white/50'}`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clause References */}
              <div>
                <label className="text-white/50 text-xs mb-1 block">Clause References (comma-separated)</label>
                <input value={form.clause_references.join(', ')} onChange={e => setForm({ ...form, clause_references: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  className="glass-input rounded-lg px-3 py-2 text-sm text-white w-full" placeholder="e.g. 4.4, 8.1, 8.5" />
              </div>

              {/* Purpose & Scope */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-white/50 text-xs mb-1 block">Purpose</label>
                  <textarea rows={2} value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })}
                    className="glass-input rounded-lg px-3 py-2 text-sm text-white w-full" placeholder="What this process achieves" />
                </div>
                <div>
                  <label className="text-white/50 text-xs mb-1 block">Scope</label>
                  <textarea rows={2} value={form.scope} onChange={e => setForm({ ...form, scope: e.target.value })}
                    className="glass-input rounded-lg px-3 py-2 text-sm text-white w-full" placeholder="Boundaries of the process" />
                </div>
              </div>

              {/* Inputs & Outputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-white/50 text-xs mb-1 block">Inputs</label>
                  <textarea rows={2} value={form.inputs} onChange={e => setForm({ ...form, inputs: e.target.value })}
                    className="glass-input rounded-lg px-3 py-2 text-sm text-white w-full" placeholder="Required inputs to this process" />
                </div>
                <div>
                  <label className="text-white/50 text-xs mb-1 block">Outputs</label>
                  <textarea rows={2} value={form.outputs} onChange={e => setForm({ ...form, outputs: e.target.value })}
                    className="glass-input rounded-lg px-3 py-2 text-sm text-white w-full" placeholder="Expected outputs / deliverables" />
                </div>
              </div>

              {/* Activities */}
              <div>
                <label className="text-white/50 text-xs mb-1 block">Key Activities</label>
                <textarea rows={3} value={form.activities} onChange={e => setForm({ ...form, activities: e.target.value })}
                  className="glass-input rounded-lg px-3 py-2 text-sm text-white w-full" placeholder="Key steps or activities in this process" />
              </div>

              {/* Resources & Competency */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-white/50 text-xs mb-1 block">Resources Required</label>
                  <textarea rows={2} value={form.resources} onChange={e => setForm({ ...form, resources: e.target.value })}
                    className="glass-input rounded-lg px-3 py-2 text-sm text-white w-full" placeholder="People, equipment, information" />
                </div>
                <div>
                  <label className="text-white/50 text-xs mb-1 block">Competency Requirements</label>
                  <textarea rows={2} value={form.competency_requirements} onChange={e => setForm({ ...form, competency_requirements: e.target.value })}
                    className="glass-input rounded-lg px-3 py-2 text-sm text-white w-full" placeholder="Skills/training needed" />
                </div>
              </div>

              {/* Risks */}
              <div>
                <label className="text-white/50 text-xs mb-1 block">Risks & Opportunities</label>
                <textarea rows={2} value={form.risks_opportunities} onChange={e => setForm({ ...form, risks_opportunities: e.target.value })}
                  className="glass-input rounded-lg px-3 py-2 text-sm text-white w-full" placeholder="Associated risks and opportunities" />
              </div>

              {/* KPIs & Performance */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-white/50 text-xs mb-1 block">KPIs</label>
                  <input value={form.kpis} onChange={e => setForm({ ...form, kpis: e.target.value })}
                    className="glass-input rounded-lg px-3 py-2 text-sm text-white w-full" placeholder="Key performance indicators" />
                </div>
                <div>
                  <label className="text-white/50 text-xs mb-1 block">Performance Target</label>
                  <input value={form.performance_target} onChange={e => setForm({ ...form, performance_target: e.target.value })}
                    className="glass-input rounded-lg px-3 py-2 text-sm text-white w-full" placeholder="e.g. 95% on-time delivery" />
                </div>
                <div>
                  <label className="text-white/50 text-xs mb-1 block">Monitoring Frequency</label>
                  <select value={form.monitoring_frequency} onChange={e => setForm({ ...form, monitoring_frequency: e.target.value })}
                    className="glass-input rounded-lg px-3 py-2 text-sm text-white w-full">
                    <option value="">Select...</option>
                    {FREQUENCIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Monitoring Method */}
              <div>
                <label className="text-white/50 text-xs mb-1 block">Monitoring Method</label>
                <input value={form.monitoring_method} onChange={e => setForm({ ...form, monitoring_method: e.target.value })}
                  className="glass-input rounded-lg px-3 py-2 text-sm text-white w-full" placeholder="How performance is measured" />
              </div>

              {/* Related documents */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-white/50 text-xs mb-1 block">Related Documents</label>
                  <input value={form.related_documents} onChange={e => setForm({ ...form, related_documents: e.target.value })}
                    className="glass-input rounded-lg px-3 py-2 text-sm text-white w-full" placeholder="Document references" />
                </div>
                <div>
                  <label className="text-white/50 text-xs mb-1 block">Related Procedures / SOPs</label>
                  <input value={form.related_procedures} onChange={e => setForm({ ...form, related_procedures: e.target.value })}
                    className="glass-input rounded-lg px-3 py-2 text-sm text-white w-full" placeholder="SOP references" />
                </div>
              </div>

              {/* Status & Dates */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-white/50 text-xs mb-1 block">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                    className="glass-input rounded-lg px-3 py-2 text-sm text-white w-full">
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-white/50 text-xs mb-1 block">Effective Date</label>
                  <input type="date" value={form.effective_date} onChange={e => setForm({ ...form, effective_date: e.target.value })}
                    className="glass-input rounded-lg px-3 py-2 text-sm text-white w-full" />
                </div>
                <div>
                  <label className="text-white/50 text-xs mb-1 block">Last Reviewed</label>
                  <input type="date" value={form.last_reviewed} onChange={e => setForm({ ...form, last_reviewed: e.target.value })}
                    className="glass-input rounded-lg px-3 py-2 text-sm text-white w-full" />
                </div>
                <div>
                  <label className="text-white/50 text-xs mb-1 block">Next Review</label>
                  <input type="date" value={form.next_review_date} onChange={e => setForm({ ...form, next_review_date: e.target.value })}
                    className="glass-input rounded-lg px-3 py-2 text-sm text-white w-full" />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-white/50 text-xs mb-1 block">Notes</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="glass-input rounded-lg px-3 py-2 text-sm text-white w-full" placeholder="Additional notes" />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} className="px-4 py-2 text-white/40 hover:text-white text-sm">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl text-sm">
                  {editing ? 'Update Process' : 'Add Process'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmAction && (
        <ConfirmModal
          title="Delete Process"
          message={`Are you sure you want to delete "${confirmAction.name}"? This cannot be undone.`}
          onConfirm={() => { deleteRecord(confirmAction.id); setConfirmAction(null) }}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </Layout>
  )
}

export default ProcessRegister

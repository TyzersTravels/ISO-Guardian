import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'

const CLAUSE_NAMES = {
  4: 'Context of the Organization',
  5: 'Leadership',
  6: 'Planning',
  7: 'Support',
  8: 'Operation',
  9: 'Performance Evaluation',
  10: 'Improvement'
}

const NCRs = () => {
  const { userProfile, canCreate, canEdit } = useAuth()
  const toast = useToast()
  const [ncrs, setNcrs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedNCR, setSelectedNCR] = useState(null)
  const [statusFilter, setStatusFilter] = useState('Open')
  const [severityFilter, setSeverityFilter] = useState('all')

  useEffect(() => { fetchNCRs() }, [])

  const fetchNCRs = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('ncrs')
        .select('*')
        .order('date_opened', { ascending: false })

      if (error) throw error
      setNcrs(data || [])
    } catch (err) {
      console.error('Error fetching NCRs:', err)
      toast.error('Failed to load NCRs')
    } finally {
      setLoading(false)
    }
  }

  const closeNCR = async (ncrId) => {
    try {
      const { error } = await supabase
        .from('ncrs')
        .update({ status: 'Closed', closed_date: new Date().toISOString().split('T')[0] })
        .eq('id', ncrId)

      if (error) throw error
      setNcrs(ncrs.map(n => n.id === ncrId ? { ...n, status: 'Closed' } : n))
      setSelectedNCR(null)
      toast.success('NCR closed successfully')
    } catch (err) {
      toast.error('Failed to close NCR: ' + err.message)
    }
  }

  const archiveNCR = async (ncrId) => {
    try {
      const { error } = await supabase
        .from('ncrs')
        .update({ is_archived: true })
        .eq('id', ncrId)

      if (error) throw error
      setNcrs(ncrs.filter(n => n.id !== ncrId))
      setSelectedNCR(null)
      toast.info('NCR archived for audit trail')
    } catch (err) {
      toast.error('Failed to archive NCR: ' + err.message)
    }
  }

  // Filters
  const filteredNCRs = ncrs.filter(ncr => {
    if (ncr.is_archived) return false
    const matchesStatus = statusFilter === 'all' || ncr.status === statusFilter
    const matchesSeverity = severityFilter === 'all' || ncr.severity === severityFilter
    return matchesStatus && matchesSeverity
  })

  const openCount = ncrs.filter(n => n.status === 'Open' && !n.is_archived).length
  const criticalCount = ncrs.filter(n => n.status === 'Open' && n.severity === 'Critical' && !n.is_archived).length
  const closedCount = ncrs.filter(n => n.status === 'Closed' && !n.is_archived).length

  return (
    <Layout>
      <div className="space-y-4 md:ml-16">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Non-Conformance Reports</h2>
            <p className="text-white/40 text-sm">{filteredNCRs.length} NCRs displayed</p>
          </div>
          {canCreate() && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-cyan-500/20 transition-all flex items-center gap-2"
            >
              <span className="text-lg leading-none">+</span> New NCR
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="glass rounded-xl p-4">
            <div className="text-2xl font-bold text-amber-400">{openCount}</div>
            <div className="text-xs text-white/50 mt-0.5">Open</div>
          </div>
          <div className="glass rounded-xl p-4">
            <div className="text-2xl font-bold text-red-400">{criticalCount}</div>
            <div className="text-xs text-white/50 mt-0.5">Critical</div>
          </div>
          <div className="glass rounded-xl p-4">
            <div className="text-2xl font-bold text-emerald-400">{closedCount}</div>
            <div className="text-xs text-white/50 mt-0.5">Closed</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {['all', 'Open', 'Closed'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === s
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10'
              }`}
            >
              {s === 'all' ? 'All Status' : s}
            </button>
          ))}
          <div className="w-px bg-white/10 mx-1"></div>
          {['all', 'Critical', 'Major', 'Minor'].map(s => (
            <button
              key={s}
              onClick={() => setSeverityFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                severityFilter === s
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10'
              }`}
            >
              {s === 'all' ? 'All Severity' : s}
            </button>
          ))}
        </div>

        {/* NCR List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse"></div>)}
          </div>
        ) : filteredNCRs.length === 0 ? (
          <div className="glass rounded-xl p-8 text-center">
            <p className="text-white/40 text-sm">No NCRs match your filters</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredNCRs.map(ncr => (
              <div
                key={ncr.id}
                onClick={() => setSelectedNCR(ncr)}
                className="glass rounded-xl p-4 hover:bg-white/5 cursor-pointer transition-colors group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-xs font-mono text-cyan-400/80">{ncr.ncr_number}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        ncr.severity === 'Critical' ? 'bg-red-500/15 text-red-300' :
                        ncr.severity === 'Major' ? 'bg-amber-500/15 text-amber-300' :
                        'bg-yellow-500/15 text-yellow-300'
                      }`}>{ncr.severity}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        ncr.status === 'Open' ? 'bg-amber-500/15 text-amber-300' : 'bg-emerald-500/15 text-emerald-300'
                      }`}>{ncr.status}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300">
                        {ncr.standard?.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-white/90 truncate">{ncr.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-white/30">
                      <span>Opened: {new Date(ncr.date_opened).toLocaleDateString('en-ZA')}</span>
                      <span>Due: {new Date(ncr.due_date).toLocaleDateString('en-ZA')}</span>
                      {ncr.due_date < new Date().toISOString().split('T')[0] && ncr.status === 'Open' && (
                        <span className="text-red-400 font-medium">OVERDUE</span>
                      )}
                    </div>
                  </div>
                  <span className="text-white/20 group-hover:text-white/40 transition-colors ml-2">→</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* NCR Detail Modal */}
        {selectedNCR && (
          <NCRDetailModal
            ncr={selectedNCR}
            onClose={() => setSelectedNCR(null)}
            onCloseNCR={closeNCR}
            onArchive={archiveNCR}
            canEdit={canEdit()}
          />
        )}

        {/* Create NCR Modal */}
        {showCreateForm && (
          <CreateNCRForm
            userProfile={userProfile}
            onClose={() => setShowCreateForm(false)}
            onCreated={() => { fetchNCRs(); setShowCreateForm(false) }}
          />
        )}
      </div>
    </Layout>
  )
}

const NCRDetailModal = ({ ncr, onClose, onCloseNCR, onArchive, canEdit }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
    <div className="glass rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-cyan-400 text-sm">{ncr.ncr_number}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
              ncr.status === 'Open' ? 'bg-amber-500/15 text-amber-300' : 'bg-emerald-500/15 text-emerald-300'
            }`}>{ncr.status}</span>
          </div>
          <h3 className="text-xl font-bold text-white">{ncr.title}</h3>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors">✕</button>
      </div>

      <div className="space-y-4">
        <DetailRow label="Description" value={ncr.description} block />
        <div className="grid grid-cols-2 gap-4">
          <DetailRow label="Standard" value={ncr.standard?.replace('_', ' ')} />
          <DetailRow label="Clause" value={ncr.clause_name} />
          <DetailRow label="Severity" value={ncr.severity} />
          <DetailRow label="Due Date" value={new Date(ncr.due_date).toLocaleDateString('en-ZA')} />
        </div>
        <DetailRow label="Root Cause" value={ncr.root_cause} block />
        <DetailRow label="Corrective Action" value={ncr.corrective_action} block />

        {canEdit && ncr.status === 'Open' && (
          <div className="flex gap-3 pt-3">
            <button
              onClick={() => onCloseNCR(ncr.id)}
              className="flex-1 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold rounded-xl transition-colors text-sm"
            >
              ✓ Close NCR
            </button>
            <button
              onClick={() => onArchive(ncr.id)}
              className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white/50 rounded-xl transition-colors text-sm"
            >
              Archive
            </button>
          </div>
        )}

        {canEdit && ncr.status === 'Closed' && (
          <button
            onClick={() => onArchive(ncr.id)}
            className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-white/50 rounded-xl transition-colors text-sm"
          >
            Archive (Soft Delete)
          </button>
        )}
      </div>
    </div>
  </div>
)

const DetailRow = ({ label, value, block }) => (
  <div>
    <label className="text-[10px] text-white/40 uppercase tracking-wider">{label}</label>
    {block ? (
      <div className="text-sm text-white/70 mt-1 p-3 bg-white/5 rounded-xl">{value || '—'}</div>
    ) : (
      <div className="text-sm text-white/80 mt-0.5">{value || '—'}</div>
    )}
  </div>
)

const CreateNCRForm = ({ userProfile, onClose, onCreated }) => {
  const toast = useToast()
  const [formData, setFormData] = useState({
    title: '', description: '',
    standard: userProfile.standards_access?.[0] || 'ISO_9001',
    clause: 7, severity: 'Major',
    root_cause: '', corrective_action: '', due_date: ''
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const { error } = await supabase
        .from('ncrs')
        .insert([{
          company_id: userProfile.company_id,
          title: formData.title,
          description: formData.description,
          standard: formData.standard,
          clause: formData.clause,
          clause_name: `Clause ${formData.clause}: ${CLAUSE_NAMES[formData.clause]}`,
          severity: formData.severity,
          status: 'Open',
          assigned_to: userProfile.id,
          date_opened: new Date().toISOString().split('T')[0],
          due_date: formData.due_date,
          root_cause: formData.root_cause,
          corrective_action: formData.corrective_action
        }])

      if (error) throw error
      toast.success('NCR created successfully')
      onCreated()
    } catch (err) {
      toast.error('Failed to create NCR: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const update = (field, value) => setFormData(prev => ({ ...prev, [field]: value }))

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="glass rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-bold text-white">Create New NCR</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-white/40">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Title" required>
            <input type="text" required value={formData.title} onChange={e => update('title', e.target.value)}
              className="form-input" placeholder="Brief description of non-conformance" />
          </FormField>

          <FormField label="Description" required>
            <textarea required rows={3} value={formData.description} onChange={e => update('description', e.target.value)}
              className="form-input" placeholder="Detailed description..." />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Standard" required>
              <select required value={formData.standard} onChange={e => update('standard', e.target.value)} className="form-input">
                {userProfile.standards_access?.map(std => (
                  <option key={std} value={std} className="bg-slate-800">{std.replace('_', ' ')}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Clause" required>
              <select required value={formData.clause} onChange={e => update('clause', parseInt(e.target.value))} className="form-input">
                {Object.entries(CLAUSE_NAMES).map(([n, name]) => (
                  <option key={n} value={n} className="bg-slate-800">Clause {n}: {name}</option>
                ))}
              </select>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Severity" required>
              <select required value={formData.severity} onChange={e => update('severity', e.target.value)} className="form-input">
                <option className="bg-slate-800" value="Critical">Critical</option>
                <option className="bg-slate-800" value="Major">Major</option>
                <option className="bg-slate-800" value="Minor">Minor</option>
              </select>
            </FormField>
            <FormField label="Due Date" required>
              <input type="date" required value={formData.due_date} onChange={e => update('due_date', e.target.value)} className="form-input" />
            </FormField>
          </div>

          <FormField label="Root Cause" required>
            <textarea required rows={2} value={formData.root_cause} onChange={e => update('root_cause', e.target.value)} className="form-input" />
          </FormField>

          <FormField label="Corrective Action" required>
            <textarea required rows={2} value={formData.corrective_action} onChange={e => update('corrective_action', e.target.value)} className="form-input" />
          </FormField>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={submitting}
              className="flex-1 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl text-sm disabled:opacity-50">
              {submitting ? 'Creating...' : 'Create NCR'}
            </button>
            <button type="button" onClick={onClose}
              className="px-5 py-2.5 bg-white/5 text-white/50 rounded-xl hover:bg-white/10 text-sm">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const FormField = ({ label, required, children }) => (
  <div>
    <label className="text-[10px] text-white/50 uppercase tracking-wider block mb-1.5">
      {label} {required && <span className="text-cyan-400">*</span>}
    </label>
    {children}
  </div>
)

export default NCRs

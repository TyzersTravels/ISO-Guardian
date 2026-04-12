import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { supabase } from '../lib/supabase'
import { logActivity } from '../lib/auditLogger'
import Layout from '../components/Layout'
import ConfirmModal from '../components/ConfirmModal'

const ISSUE_TYPES = [
  { value: 'internal_strength', label: 'Strength', quadrant: 'Strengths' },
  { value: 'internal_weakness', label: 'Weakness', quadrant: 'Weaknesses' },
  { value: 'external_opportunity', label: 'Opportunity', quadrant: 'Opportunities' },
  { value: 'external_threat', label: 'Threat', quadrant: 'Threats' },
]

const CATEGORIES = [
  { value: 'political', label: 'Political' },
  { value: 'economic', label: 'Economic' },
  { value: 'social', label: 'Social' },
  { value: 'technological', label: 'Technological' },
  { value: 'legal', label: 'Legal' },
  { value: 'environmental', label: 'Environmental' },
  { value: 'competitive', label: 'Competitive' },
  { value: 'organisational', label: 'Organisational' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'financial', label: 'Financial' },
  { value: 'infrastructure', label: 'Infrastructure' },
  { value: 'human_resources', label: 'Human Resources' },
  { value: 'other', label: 'Other' },
]

const IMPACT_LEVELS = [
  { value: 'low', label: 'Low', color: 'bg-green-500/20 text-green-400' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-500/20 text-yellow-400' },
  { value: 'high', label: 'High', color: 'bg-orange-500/20 text-orange-400' },
  { value: 'critical', label: 'Critical', color: 'bg-red-500/20 text-red-400' },
]

const STATUSES = ['Active', 'Monitoring', 'Resolved', 'Archived']

const STANDARDS = [
  { code: 'ISO_9001', label: 'ISO 9001' },
  { code: 'ISO_14001', label: 'ISO 14001' },
  { code: 'ISO_45001', label: 'ISO 45001' },
]

const QUADRANTS = [
  { type: 'internal_strength', label: 'Strengths', color: 'from-green-500/10 to-green-500/5', border: 'border-green-500/20', badge: 'bg-green-500/20 text-green-400', icon: 'M5 13l4 4L19 7' },
  { type: 'internal_weakness', label: 'Weaknesses', color: 'from-red-500/10 to-red-500/5', border: 'border-red-500/20', badge: 'bg-red-500/20 text-red-400', icon: 'M6 18L18 6M6 6l12 12' },
  { type: 'external_opportunity', label: 'Opportunities', color: 'from-blue-500/10 to-blue-500/5', border: 'border-blue-500/20', badge: 'bg-blue-500/20 text-blue-400', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
  { type: 'external_threat', label: 'Threats', color: 'from-amber-500/10 to-amber-500/5', border: 'border-amber-500/20', badge: 'bg-amber-500/20 text-amber-400', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
]

const ContextAnalysis = () => {
  const { userProfile, getEffectiveCompanyId } = useAuth()
  const toast = useToast()
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)
  const [viewMode, setViewMode] = useState('swot') // 'swot' | 'list'
  const [selectedIssue, setSelectedIssue] = useState(null)

  // Filters
  const [typeFilter, setTypeFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [impactFilter, setImpactFilter] = useState('all')

  const defaultForm = {
    issue_title: '', description: '', issue_type: 'internal_strength',
    category: 'organisational', impact_level: 'medium', affected_processes: '',
    standards: ['ISO_9001'], clause_references: ['4.1'], response_action: '',
    responsible_person: '', target_date: '', linked_risk_id: '',
    status: 'Active', last_reviewed: '', next_review_date: '', notes: '',
  }
  const [form, setForm] = useState(defaultForm)

  useEffect(() => {
    if (userProfile) fetchIssues()
  }, [userProfile])

  const fetchIssues = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('context_issues')
        .select('id, issue_title, description, issue_type, category, impact_level, affected_processes, standards, clause_references, response_action, responsible_person, target_date, linked_risk_id, status, last_reviewed, next_review_date, notes, created_by, created_at, updated_at')
        .eq('company_id', getEffectiveCompanyId())
        .order('created_at', { ascending: false })
      if (error) throw error
      setIssues(data || [])
    } catch (err) {
      toast.error('Failed to load context issues')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.issue_title.trim()) { toast.error('Issue title is required'); return }
    try {
      const companyId = getEffectiveCompanyId()
      const payload = {
        company_id: companyId,
        issue_title: form.issue_title.trim(),
        description: form.description || null,
        issue_type: form.issue_type,
        category: form.category,
        impact_level: form.impact_level,
        affected_processes: form.affected_processes || null,
        standards: form.standards,
        clause_references: form.clause_references,
        response_action: form.response_action || null,
        responsible_person: form.responsible_person || null,
        target_date: form.target_date || null,
        linked_risk_id: form.linked_risk_id || null,
        status: form.status,
        last_reviewed: form.last_reviewed || null,
        next_review_date: form.next_review_date || null,
        notes: form.notes || null,
      }

      if (editing) {
        const { error } = await supabase.from('context_issues').update(payload).eq('id', editing.id)
        if (error) throw error
        await logActivity({ companyId, userId: userProfile.id, action: 'updated', entityType: 'context_issue', entityId: editing.id, changes: { issue_title: form.issue_title } })
        toast.success('Context issue updated')
      } else {
        payload.created_by = userProfile.id
        const { data, error } = await supabase.from('context_issues').insert(payload).select('id').single()
        if (error) throw error
        await logActivity({ companyId, userId: userProfile.id, action: 'created', entityType: 'context_issue', entityId: data.id, changes: { issue_title: form.issue_title, issue_type: form.issue_type } })
        toast.success('Context issue created')
      }

      setShowForm(false); setEditing(null); setForm(defaultForm); fetchIssues()
    } catch (err) {
      toast.error('Failed to save context issue')
    }
  }

  const openEdit = (issue) => {
    setEditing(issue)
    setForm({
      issue_title: issue.issue_title || '',
      description: issue.description || '',
      issue_type: issue.issue_type || 'internal_strength',
      category: issue.category || 'organisational',
      impact_level: issue.impact_level || 'medium',
      affected_processes: issue.affected_processes || '',
      standards: issue.standards || ['ISO_9001'],
      clause_references: issue.clause_references || ['4.1'],
      response_action: issue.response_action || '',
      responsible_person: issue.responsible_person || '',
      target_date: issue.target_date || '',
      linked_risk_id: issue.linked_risk_id || '',
      status: issue.status || 'Active',
      last_reviewed: issue.last_reviewed || '',
      next_review_date: issue.next_review_date || '',
      notes: issue.notes || '',
    })
    setShowForm(true)
    setSelectedIssue(null)
  }

  const deleteIssue = async (id) => {
    try {
      const { error } = await supabase.from('context_issues').delete().eq('id', id)
      if (error) throw error
      await logActivity({ companyId: getEffectiveCompanyId(), userId: userProfile.id, action: 'deleted', entityType: 'context_issue', entityId: id })
      toast.success('Context issue deleted'); fetchIssues(); setSelectedIssue(null)
    } catch (err) { toast.error('Failed to delete issue') }
  }

  const toggleStandard = (code) => {
    setForm(prev => ({ ...prev, standards: prev.standards.includes(code) ? prev.standards.filter(s => s !== code) : [...prev.standards, code] }))
  }

  const getImpactBadge = (level) => IMPACT_LEVELS.find(i => i.value === level) || IMPACT_LEVELS[1]
  const getCategoryLabel = (val) => CATEGORIES.find(c => c.value === val)?.label || val
  const getTypeLabel = (val) => ISSUE_TYPES.find(t => t.value === val)?.label || val

  const filtered = issues.filter(r => {
    if (typeFilter !== 'all' && r.issue_type !== typeFilter) return false
    if (categoryFilter !== 'all' && r.category !== categoryFilter) return false
    if (statusFilter !== 'all' && r.status !== statusFilter) return false
    if (impactFilter !== 'all' && r.impact_level !== impactFilter) return false
    return true
  })

  const strengths = issues.filter(i => i.issue_type === 'internal_strength')
  const weaknesses = issues.filter(i => i.issue_type === 'internal_weakness')
  const opportunities = issues.filter(i => i.issue_type === 'external_opportunity')
  const threats = issues.filter(i => i.issue_type === 'external_threat')

  if (loading) return <Layout><div className="text-white text-center py-12">Loading context analysis...</div></Layout>

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-1">Context Analysis (SWOT)</h2>
            <p className="text-white/60 text-sm">ISO 9001 / 14001 / 45001 &sect;4.1 &middot; Understanding the Organisation and its Context</p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* View toggle */}
            <div className="flex bg-white/5 rounded-lg p-0.5">
              <button onClick={() => setViewMode('swot')} className={`px-3 py-1.5 text-xs rounded-md transition-all ${viewMode === 'swot' ? 'bg-purple-500/30 text-purple-300' : 'text-white/40 hover:text-white/60'}`}>SWOT</button>
              <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 text-xs rounded-md transition-all ${viewMode === 'list' ? 'bg-purple-500/30 text-purple-300' : 'text-white/40 hover:text-white/60'}`}>List</button>
            </div>
            <button onClick={() => { setEditing(null); setForm(defaultForm); setShowForm(true) }}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all text-sm">
              + Add Issue
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Strengths', value: strengths.length, color: 'text-green-400' },
            { label: 'Weaknesses', value: weaknesses.length, color: 'text-red-400' },
            { label: 'Opportunities', value: opportunities.length, color: 'text-blue-400' },
            { label: 'Threats', value: threats.length, color: 'text-amber-400' },
          ].map(kpi => (
            <div key={kpi.label} className="glass glass-border rounded-xl p-4 text-center">
              <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
              <div className="text-white/50 text-xs mt-1">{kpi.label}</div>
            </div>
          ))}
        </div>

        {/* ISO reference card */}
        <div className="glass glass-border rounded-2xl p-4">
          <p className="text-white/40 text-xs">
            <strong className="text-white/60">ISO 4.1</strong> requires determining external and internal issues relevant to the organisation&apos;s purpose and strategic direction that affect its ability to achieve the intended results of its management system.
          </p>
        </div>

        {/* Filters (shown in both views) */}
        <div className="flex flex-wrap gap-2">
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="glass-input rounded-lg px-3 py-1.5 text-sm text-white">
            <option value="all">All Types</option>
            {ISSUE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="glass-input rounded-lg px-3 py-1.5 text-sm text-white">
            <option value="all">All Categories</option>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="glass-input rounded-lg px-3 py-1.5 text-sm text-white">
            <option value="all">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={impactFilter} onChange={e => setImpactFilter(e.target.value)} className="glass-input rounded-lg px-3 py-1.5 text-sm text-white">
            <option value="all">All Impact Levels</option>
            {IMPACT_LEVELS.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
          </select>
        </div>

        {/* SWOT Grid View */}
        {viewMode === 'swot' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {QUADRANTS.map(q => {
              const quadrantIssues = filtered.filter(i => i.issue_type === q.type)
              return (
                <div key={q.type} className={`bg-gradient-to-br ${q.color} border ${q.border} rounded-2xl p-4 min-h-[200px]`}>
                  <div className="flex items-center gap-2 mb-3">
                    <svg className={`w-5 h-5 ${q.badge.split(' ')[1]}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={q.icon} />
                    </svg>
                    <h3 className="text-white font-semibold text-sm">{q.label}</h3>
                    <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${q.badge}`}>{quadrantIssues.length}</span>
                  </div>
                  <div className="space-y-2">
                    {quadrantIssues.length === 0 ? (
                      <p className="text-white/20 text-xs text-center py-6">No {q.label.toLowerCase()} recorded</p>
                    ) : (
                      quadrantIssues.map(issue => {
                        const impact = getImpactBadge(issue.impact_level)
                        return (
                          <div key={issue.id}
                            onClick={() => setSelectedIssue(selectedIssue?.id === issue.id ? null : issue)}
                            className={`glass rounded-xl p-3 cursor-pointer hover:bg-white/5 transition-colors ${selectedIssue?.id === issue.id ? 'ring-1 ring-purple-500' : ''}`}>
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <h4 className="text-white font-medium text-sm truncate">{issue.issue_title}</h4>
                                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                  <span className="text-white/30 text-[10px] capitalize">{getCategoryLabel(issue.category)}</span>
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${impact.color}`}>{impact.label}</span>
                                  {issue.status !== 'Active' && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/40">{issue.status}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            {/* Expanded detail */}
                            {selectedIssue?.id === issue.id && (
                              <div className="mt-3 pt-3 border-t border-white/10 space-y-2" onClick={e => e.stopPropagation()}>
                                {issue.description && <p className="text-white/60 text-xs">{issue.description}</p>}
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  {issue.affected_processes && (
                                    <div><span className="text-white/30 text-[10px]">Affected Processes</span><p className="text-white/70">{issue.affected_processes}</p></div>
                                  )}
                                  {issue.response_action && (
                                    <div><span className="text-white/30 text-[10px]">Response Action</span><p className="text-white/70">{issue.response_action}</p></div>
                                  )}
                                  {issue.responsible_person && (
                                    <div><span className="text-white/30 text-[10px]">Responsible</span><p className="text-white/70">{issue.responsible_person}</p></div>
                                  )}
                                  {issue.target_date && (
                                    <div><span className="text-white/30 text-[10px]">Target Date</span><p className="text-white/70">{issue.target_date}</p></div>
                                  )}
                                </div>
                                {(issue.standards || []).length > 0 && (
                                  <div className="flex gap-1 flex-wrap">
                                    {issue.standards.map(s => (
                                      <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">{s.replace('ISO_', 'ISO ')}</span>
                                    ))}
                                  </div>
                                )}
                                {issue.notes && <p className="text-white/40 text-xs italic">{issue.notes}</p>}
                                <div className="flex gap-2 pt-1">
                                  <button onClick={() => openEdit(issue)} className="px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg text-xs hover:bg-purple-500/30">Edit</button>
                                  <button onClick={() => setConfirmAction({ type: 'delete', id: issue.id, label: issue.issue_title })} className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs hover:bg-red-500/30">Delete</button>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="space-y-2">
            {filtered.length === 0 ? (
              <div className="glass glass-border rounded-xl p-8 text-center">
                <p className="text-white/30 text-sm">No context issues found. Click &ldquo;+ Add Issue&rdquo; to get started.</p>
              </div>
            ) : (
              filtered.map(issue => {
                const impact = getImpactBadge(issue.impact_level)
                const isExpanded = selectedIssue?.id === issue.id
                const quadrant = QUADRANTS.find(q => q.type === issue.issue_type)
                return (
                  <div key={issue.id} className={`glass glass-border rounded-xl overflow-hidden ${isExpanded ? 'ring-1 ring-purple-500' : ''}`}>
                    <div className="p-4 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => setSelectedIssue(isExpanded ? null : issue)}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${quadrant?.badge || 'bg-white/10 text-white/40'}`}>{getTypeLabel(issue.issue_type)}</span>
                            <span className="text-white/30 text-[10px] capitalize">{getCategoryLabel(issue.category)}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${impact.color}`}>{impact.label}</span>
                            {(issue.standards || []).map(s => (
                              <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">{s.replace('ISO_', 'ISO ')}</span>
                            ))}
                          </div>
                          <h4 className="text-white font-semibold text-sm mt-1">{issue.issue_title}</h4>
                          {issue.responsible_person && <p className="text-white/40 text-xs mt-0.5">Responsible: {issue.responsible_person}</p>}
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-lg font-medium shrink-0 ${
                          issue.status === 'Resolved' ? 'bg-green-500/20 text-green-400' :
                          issue.status === 'Archived' ? 'bg-white/10 text-white/30' :
                          issue.status === 'Monitoring' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>{issue.status}</span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-white/10 p-4 space-y-3" onClick={e => e.stopPropagation()}>
                        {issue.description && <p className="text-white/70 text-sm">{issue.description}</p>}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          {issue.affected_processes && (
                            <div className="glass rounded-lg p-2.5"><span className="text-white/40 text-[10px] block">Affected Processes</span><p className="text-white text-xs mt-0.5">{issue.affected_processes}</p></div>
                          )}
                          {issue.response_action && (
                            <div className="glass rounded-lg p-2.5"><span className="text-white/40 text-[10px] block">Response Action</span><p className="text-white text-xs mt-0.5">{issue.response_action}</p></div>
                          )}
                          {issue.responsible_person && (
                            <div className="glass rounded-lg p-2.5"><span className="text-white/40 text-[10px] block">Responsible Person</span><p className="text-white text-xs mt-0.5">{issue.responsible_person}</p></div>
                          )}
                          {issue.target_date && (
                            <div className="glass rounded-lg p-2.5"><span className="text-white/40 text-[10px] block">Target Date</span><p className="text-white text-xs mt-0.5">{issue.target_date}</p></div>
                          )}
                          {issue.last_reviewed && (
                            <div className="glass rounded-lg p-2.5"><span className="text-white/40 text-[10px] block">Last Reviewed</span><p className="text-white text-xs mt-0.5">{issue.last_reviewed}</p></div>
                          )}
                          {issue.next_review_date && (
                            <div className="glass rounded-lg p-2.5"><span className="text-white/40 text-[10px] block">Next Review</span><p className="text-white text-xs mt-0.5">{issue.next_review_date}</p></div>
                          )}
                        </div>
                        {issue.notes && <div><span className="text-white/40 text-xs">Notes</span><p className="text-white/70 text-sm">{issue.notes}</p></div>}
                        <div className="flex gap-2 pt-2">
                          <button onClick={() => openEdit(issue)} className="px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg text-sm hover:bg-purple-500/30">Edit</button>
                          <button onClick={() => setConfirmAction({ type: 'delete', id: issue.id, label: issue.issue_title })} className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30">Delete</button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* CRUD Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[5vh] sm:pt-[10vh] px-4" onClick={() => { setShowForm(false); setEditing(null); setForm(defaultForm) }}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto glass glass-border rounded-2xl p-6" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-white mb-4">{editing ? 'Edit Context Issue' : 'Add Context Issue'}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Issue Title */}
                <div>
                  <label className="text-white/60 text-xs block mb-1">Issue Title *</label>
                  <input type="text" value={form.issue_title} onChange={e => setForm({ ...form, issue_title: e.target.value })}
                    className="glass-input w-full rounded-lg px-3 py-2 text-sm text-white" placeholder="e.g. Strong ISO 9001 documentation culture" required />
                </div>

                {/* Type + Category row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-white/60 text-xs block mb-1">Issue Type *</label>
                    <select value={form.issue_type} onChange={e => setForm({ ...form, issue_type: e.target.value })} className="glass-input w-full rounded-lg px-3 py-2 text-sm text-white">
                      {ISSUE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label} ({t.quadrant})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-white/60 text-xs block mb-1">PESTLE Category *</label>
                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="glass-input w-full rounded-lg px-3 py-2 text-sm text-white">
                      {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                </div>

                {/* Impact + Status row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-white/60 text-xs block mb-1">Impact Level</label>
                    <select value={form.impact_level} onChange={e => setForm({ ...form, impact_level: e.target.value })} className="glass-input w-full rounded-lg px-3 py-2 text-sm text-white">
                      {IMPACT_LEVELS.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-white/60 text-xs block mb-1">Status</label>
                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="glass-input w-full rounded-lg px-3 py-2 text-sm text-white">
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-white/60 text-xs block mb-1">Description</label>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                    className="glass-input w-full rounded-lg px-3 py-2 text-sm text-white" rows={3} placeholder="Describe the issue in detail..." />
                </div>

                {/* Affected Processes + Response Action */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-white/60 text-xs block mb-1">Affected Processes</label>
                    <input type="text" value={form.affected_processes} onChange={e => setForm({ ...form, affected_processes: e.target.value })}
                      className="glass-input w-full rounded-lg px-3 py-2 text-sm text-white" placeholder="e.g. Production, QC" />
                  </div>
                  <div>
                    <label className="text-white/60 text-xs block mb-1">Response Action</label>
                    <input type="text" value={form.response_action} onChange={e => setForm({ ...form, response_action: e.target.value })}
                      className="glass-input w-full rounded-lg px-3 py-2 text-sm text-white" placeholder="e.g. Implement contingency plan" />
                  </div>
                </div>

                {/* Responsible Person + Target Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-white/60 text-xs block mb-1">Responsible Person</label>
                    <input type="text" value={form.responsible_person} onChange={e => setForm({ ...form, responsible_person: e.target.value })}
                      className="glass-input w-full rounded-lg px-3 py-2 text-sm text-white" placeholder="e.g. John Smith" />
                  </div>
                  <div>
                    <label className="text-white/60 text-xs block mb-1">Target Date</label>
                    <input type="date" value={form.target_date} onChange={e => setForm({ ...form, target_date: e.target.value })}
                      className="glass-input w-full rounded-lg px-3 py-2 text-sm text-white" />
                  </div>
                </div>

                {/* Review Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-white/60 text-xs block mb-1">Last Reviewed</label>
                    <input type="date" value={form.last_reviewed} onChange={e => setForm({ ...form, last_reviewed: e.target.value })}
                      className="glass-input w-full rounded-lg px-3 py-2 text-sm text-white" />
                  </div>
                  <div>
                    <label className="text-white/60 text-xs block mb-1">Next Review Date</label>
                    <input type="date" value={form.next_review_date} onChange={e => setForm({ ...form, next_review_date: e.target.value })}
                      className="glass-input w-full rounded-lg px-3 py-2 text-sm text-white" />
                  </div>
                </div>

                {/* Standards */}
                <div>
                  <label className="text-white/60 text-xs block mb-1">Applicable Standards</label>
                  <div className="flex flex-wrap gap-2">
                    {STANDARDS.map(s => (
                      <button key={s.code} type="button" onClick={() => toggleStandard(s.code)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${form.standards.includes(s.code) ? 'bg-purple-500/30 text-purple-300 ring-1 ring-purple-500/50' : 'bg-white/5 text-white/30 hover:bg-white/10'}`}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-white/60 text-xs block mb-1">Notes</label>
                  <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                    className="glass-input w-full rounded-lg px-3 py-2 text-sm text-white" rows={2} placeholder="Additional notes..." />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => { setShowForm(false); setEditing(null); setForm(defaultForm) }}
                    className="px-4 py-2 text-white/40 hover:text-white/60 text-sm">Cancel</button>
                  <button type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl text-sm">
                    {editing ? 'Update Issue' : 'Create Issue'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Confirm Modal */}
        {confirmAction && (
          <ConfirmModal
            title="Delete Context Issue"
            message={`Are you sure you want to delete "${confirmAction.label}"? This action cannot be undone.`}
            onConfirm={() => { deleteIssue(confirmAction.id); setConfirmAction(null) }}
            onCancel={() => setConfirmAction(null)}
          />
        )}
      </div>
    </Layout>
  )
}

export default ContextAnalysis

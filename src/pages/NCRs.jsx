import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Layout from '../components/Layout'

const NCRs = () => {
  const { user } = useAuth()
  const [ncrs, setNcrs] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('active')
  const [isLeadAuditor, setIsLeadAuditor] = useState(false)
  const [selectedNCR, setSelectedNCR] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSeverity, setFilterSeverity] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    checkUserRole()
  }, [])

  useEffect(() => {
    fetchNCRs()
  }, [viewMode])

  const checkUserRole = async () => {
    try {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id)
        .in('role', ['lead_auditor', 'superadmin'])
      if (data && data.length > 0) setIsLeadAuditor(true)
    } catch (err) {
      console.error('Error checking role:', err)
    }
  }

  const fetchNCRs = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('ncrs')
        .select('*')
        .order('created_at', { ascending: false })

      // KEY FIX: Handle null booleans properly
      // Use .neq('permanently_deleted', true) instead of .eq('permanently_deleted', false)
      // This catches both false AND null values
      query = query.neq('permanently_deleted', true)

      if (viewMode === 'active') {
        query = query.neq('archived', true)
      } else if (viewMode === 'archived') {
        query = query.eq('archived', true)
      }

      const { data, error } = await query
      if (error) throw error
      setNcrs(data || [])
    } catch (error) {
      console.error('Error fetching NCRs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleArchiveNCR = async (ncrId) => {
    if (!window.confirm('Archive this NCR? (ISO compliance: archived for record-keeping)')) return

    const reason = window.prompt('Reason for archiving (required for ISO compliance):')
    if (!reason || reason.trim() === '') {
      alert('Archiving reason is required')
      return
    }

    try {
      const { error } = await supabase
        .from('ncrs')
        .update({
          archived: true,
          archived_at: new Date().toISOString(),
          archived_by: user?.id,
          archive_reason: reason.trim(),
        })
        .eq('id', ncrId)

      if (error) throw error
      fetchNCRs()
    } catch (err) {
      console.error('Error archiving NCR:', err)
      alert('Failed to archive: ' + err.message)
    }
  }

  const handleRestoreNCR = async (ncrId) => {
    if (!window.confirm('Restore this NCR to active status?')) return

    try {
      const { error } = await supabase
        .from('ncrs')
        .update({
          archived: false,
          archived_at: null,
          archived_by: null,
          archive_reason: null,
        })
        .eq('id', ncrId)

      if (error) throw error
      fetchNCRs()
    } catch (err) {
      console.error('Error restoring NCR:', err)
      alert('Failed to restore: ' + err.message)
    }
  }

  const handlePermanentDelete = async (ncrId) => {
    if (!isLeadAuditor) {
      alert('Only Lead Auditors can permanently delete NCRs')
      return
    }

    if (!window.confirm('⚠️ PERMANENT DELETE - This cannot be undone! Continue?')) return
    const reason = window.prompt('Reason for permanent deletion (required for audit trail):')
    if (!reason || reason.trim() === '') {
      alert('Deletion reason required')
      return
    }

    try {
      const { error } = await supabase
        .from('ncrs')
        .update({
          permanently_deleted: true,
          permanently_deleted_at: new Date().toISOString(),
          permanently_deleted_by: user?.email,
          deletion_reason: reason.trim(),
        })
        .eq('id', ncrId)

      if (error) throw error
      fetchNCRs()
    } catch (err) {
      console.error('Error deleting NCR:', err)
      alert('Failed to delete: ' + err.message)
    }
  }

  const handleCloseNCR = async (ncrId) => {
    if (!window.confirm('Close this NCR? This marks it as resolved.')) return

    try {
      const { error } = await supabase
        .from('ncrs')
        .update({
          status: 'Closed',
          date_closed: new Date().toISOString(),
        })
        .eq('id', ncrId)

      if (error) throw error
      fetchNCRs()
    } catch (err) {
      console.error('Error closing NCR:', err)
      alert('Failed to close: ' + err.message)
    }
  }

  // Filter NCRs
  const filteredNCRs = ncrs.filter(ncr => {
    const matchesSearch = !searchTerm || 
      ncr.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ncr.ncr_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ncr.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSeverity = filterSeverity === 'all' || ncr.severity === filterSeverity
    const matchesStatus = filterStatus === 'all' || ncr.status === filterStatus
    return matchesSearch && matchesSeverity && matchesStatus
  })

  // Stats
  const activeNCRs = ncrs.filter(n => !n.archived)
  const stats = {
    total: activeNCRs.length,
    open: activeNCRs.filter(n => n.status === 'Open').length,
    inProgress: activeNCRs.filter(n => n.status === 'In Progress').length,
    closed: activeNCRs.filter(n => n.status === 'Closed').length,
    critical: activeNCRs.filter(n => n.severity === 'Critical').length,
    major: activeNCRs.filter(n => n.severity === 'Major').length,
    minor: activeNCRs.filter(n => n.severity === 'Minor').length,
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Critical': return 'bg-red-500/20 text-red-300 border-red-500/30'
      case 'Major': return 'bg-orange-500/20 text-orange-300 border-orange-500/30'
      case 'Minor': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      case 'Observation': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      default: return 'bg-white/10 text-white/60 border-white/20'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return 'bg-orange-500/20 text-orange-300'
      case 'In Progress': return 'bg-blue-500/20 text-blue-300'
      case 'Closed': return 'bg-emerald-500/20 text-emerald-300'
      default: return 'bg-white/10 text-white/60'
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
            <p className="text-white/60">Loading NCRs...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6 pb-24">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Non-Conformance Reports</h1>
            <p className="text-white/50 text-sm mt-1">Track and resolve quality, safety & environmental issues</p>
          </div>
          <button 
            onClick={() => setShowCreateForm(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-semibold hover:scale-105 transition-transform shadow-lg shadow-cyan-500/20 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New NCR
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white/[0.07] backdrop-blur-lg border border-white/10 rounded-2xl p-4">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-xs text-white/50 mt-1">Total Active</div>
          </div>
          <div className="bg-orange-500/10 backdrop-blur-lg border border-orange-500/20 rounded-2xl p-4">
            <div className="text-2xl font-bold text-orange-400">{stats.open}</div>
            <div className="text-xs text-white/50 mt-1">Open</div>
          </div>
          <div className="bg-red-500/10 backdrop-blur-lg border border-red-500/20 rounded-2xl p-4">
            <div className="text-2xl font-bold text-red-400">{stats.critical}</div>
            <div className="text-xs text-white/50 mt-1">Critical</div>
          </div>
          <div className="bg-emerald-500/10 backdrop-blur-lg border border-emerald-500/20 rounded-2xl p-4">
            <div className="text-2xl font-bold text-emerald-400">{stats.closed}</div>
            <div className="text-xs text-white/50 mt-1">Closed</div>
          </div>
        </div>

        {/* View Toggle + Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* View Mode */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('active')}
              className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                viewMode === 'active'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                  : 'bg-white/[0.07] text-white/60 hover:bg-white/[0.12]'
              }`}
            >
              Active ({activeNCRs.length})
            </button>
            <button
              onClick={() => setViewMode('archived')}
              className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                viewMode === 'archived'
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                  : 'bg-white/[0.07] text-white/60 hover:bg-white/[0.12]'
              }`}
            >
              Archived
            </button>
          </div>

          {/* Search */}
          <div className="flex-1 relative">
            <svg className="w-4 h-4 absolute left-3 top-3 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search NCRs..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/[0.07] border border-white/10 rounded-xl text-white placeholder-white/40 text-sm focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          {/* Severity Filter */}
          <select
            value={filterSeverity}
            onChange={e => setFilterSeverity(e.target.value)}
            className="px-3 py-2 bg-white/[0.07] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/50"
            style={{ colorScheme: 'dark' }}
          >
            <option value="all">All Severity</option>
            <option value="Critical">Critical</option>
            <option value="Major">Major</option>
            <option value="Minor">Minor</option>
            <option value="Observation">Observation</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-white/[0.07] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/50"
            style={{ colorScheme: 'dark' }}
          >
            <option value="all">All Status</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        {/* NCR List */}
        <div className="space-y-3">
          {filteredNCRs.length === 0 ? (
            <div className="bg-white/[0.05] backdrop-blur-lg border border-white/10 rounded-2xl p-12 text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-white/50 text-lg font-medium">
                {viewMode === 'active' ? 'No active NCRs found' : 'No archived NCRs'}
              </p>
              <p className="text-white/30 text-sm mt-2">
                {viewMode === 'active' && searchTerm ? 'Try adjusting your search or filters' : 
                 viewMode === 'active' ? 'Create a new NCR to get started' : 'Archived NCRs will appear here'}
              </p>
            </div>
          ) : (
            filteredNCRs.map((ncr) => (
              <div
                key={ncr.id}
                className="bg-white/[0.07] backdrop-blur-lg border border-white/10 rounded-2xl p-5 hover:bg-white/[0.1] transition-all cursor-pointer group"
                onClick={() => setSelectedNCR(ncr)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="font-mono text-cyan-400 text-sm font-medium">{ncr.ncr_number}</span>
                      <span className={`text-xs px-2.5 py-1 rounded-full border ${getSeverityColor(ncr.severity)}`}>
                        {ncr.severity}
                      </span>
                      <span className={`text-xs px-2.5 py-1 rounded-full ${getStatusColor(ncr.status)}`}>
                        {ncr.status}
                      </span>
                      {viewMode === 'archived' && (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-red-500/20 text-red-300">Archived</span>
                      )}
                    </div>
                    <h3 className="font-semibold text-white text-lg truncate">{ncr.title}</h3>
                    {ncr.description && (
                      <p className="text-white/50 text-sm mt-1 line-clamp-2">{ncr.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-white/40 mt-3 flex-wrap">
                      {ncr.standard && <span>📋 {ncr.standard.replace('_', ' ')}</span>}
                      {ncr.clause_number && <span>§ Clause {ncr.clause_number}</span>}
                      {ncr.date_raised && <span>📅 {new Date(ncr.date_raised).toLocaleDateString('en-ZA')}</span>}
                      {ncr.assigned_to_name && <span>👤 {ncr.assigned_to_name}</span>}
                      {ncr.due_date && <span>⏰ Due: {new Date(ncr.due_date).toLocaleDateString('en-ZA')}</span>}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                    {viewMode === 'active' && ncr.status === 'Open' && (
                      <button
                        onClick={() => handleCloseNCR(ncr.id)}
                        className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-colors"
                        title="Close NCR"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    )}
                    {viewMode === 'active' && (
                      <button
                        onClick={() => handleArchiveNCR(ncr.id)}
                        className="p-2 rounded-lg bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 transition-colors"
                        title="Archive NCR"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                      </button>
                    )}
                    {viewMode === 'archived' && (
                      <>
                        <button
                          onClick={() => handleRestoreNCR(ncr.id)}
                          className="p-2 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-colors"
                          title="Restore NCR"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                        {isLeadAuditor && (
                          <button
                            onClick={() => handlePermanentDelete(ncr.id)}
                            className="p-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors"
                            title="Permanently Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* NCR Detail Modal */}
        {selectedNCR && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setSelectedNCR(null)}>
            <div className="bg-slate-900/95 backdrop-blur-xl border border-white/15 rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="font-mono text-cyan-400 text-sm">{selectedNCR.ncr_number}</span>
                  <h2 className="text-2xl font-bold text-white mt-1">{selectedNCR.title}</h2>
                </div>
                <button onClick={() => setSelectedNCR(null)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="flex gap-2 mb-6 flex-wrap">
                <span className={`text-xs px-3 py-1.5 rounded-full border ${getSeverityColor(selectedNCR.severity)}`}>{selectedNCR.severity}</span>
                <span className={`text-xs px-3 py-1.5 rounded-full ${getStatusColor(selectedNCR.status)}`}>{selectedNCR.status}</span>
                {selectedNCR.standard && <span className="text-xs px-3 py-1.5 rounded-full bg-purple-500/20 text-purple-300">{selectedNCR.standard.replace('_', ' ')}</span>}
              </div>

              <div className="space-y-4">
                {selectedNCR.description && (
                  <div>
                    <label className="text-xs text-white/40 uppercase tracking-wider">Description</label>
                    <p className="text-white/80 mt-1 bg-white/[0.05] rounded-xl p-3 text-sm">{selectedNCR.description}</p>
                  </div>
                )}
                {selectedNCR.root_cause && (
                  <div>
                    <label className="text-xs text-white/40 uppercase tracking-wider">Root Cause</label>
                    <p className="text-white/80 mt-1 bg-white/[0.05] rounded-xl p-3 text-sm">{selectedNCR.root_cause}</p>
                  </div>
                )}
                {selectedNCR.corrective_action && (
                  <div>
                    <label className="text-xs text-white/40 uppercase tracking-wider">Corrective Action</label>
                    <p className="text-white/80 mt-1 bg-white/[0.05] rounded-xl p-3 text-sm">{selectedNCR.corrective_action}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-white/40 uppercase tracking-wider">Date Raised</label>
                    <p className="text-white/80 mt-1">{selectedNCR.date_raised ? new Date(selectedNCR.date_raised).toLocaleDateString('en-ZA') : 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-white/40 uppercase tracking-wider">Due Date</label>
                    <p className="text-white/80 mt-1">{selectedNCR.due_date ? new Date(selectedNCR.due_date).toLocaleDateString('en-ZA') : 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-white/40 uppercase tracking-wider">Assigned To</label>
                    <p className="text-white/80 mt-1">{selectedNCR.assigned_to_name || 'Unassigned'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-white/40 uppercase tracking-wider">Clause</label>
                    <p className="text-white/80 mt-1">{selectedNCR.clause_name || `Clause ${selectedNCR.clause_number || 'N/A'}`}</p>
                  </div>
                </div>

                {selectedNCR.archive_reason && (
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3">
                    <label className="text-xs text-orange-400 uppercase tracking-wider">Archive Reason</label>
                    <p className="text-white/70 mt-1 text-sm">{selectedNCR.archive_reason}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-white/10">
                {selectedNCR.status === 'Open' && !selectedNCR.archived && (
                  <button
                    onClick={() => {
                      handleCloseNCR(selectedNCR.id)
                      setSelectedNCR(null)
                    }}
                    className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-xl hover:scale-[1.02] transition-transform"
                  >
                    ✓ Close NCR
                  </button>
                )}
                {!selectedNCR.archived && (
                  <button
                    onClick={() => {
                      handleArchiveNCR(selectedNCR.id)
                      setSelectedNCR(null)
                    }}
                    className="px-6 py-3 bg-orange-500/20 text-orange-300 font-semibold rounded-xl hover:bg-orange-500/30 transition-colors"
                  >
                    Archive
                  </button>
                )}
                <button
                  onClick={() => setSelectedNCR(null)}
                  className="px-6 py-3 bg-white/[0.07] text-white font-medium rounded-xl hover:bg-white/[0.12] transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create NCR Modal */}
        {showCreateForm && (
          <CreateNCRModal 
            user={user} 
            onClose={() => setShowCreateForm(false)} 
            onSuccess={() => {
              setShowCreateForm(false)
              fetchNCRs()
            }} 
          />
        )}
      </div>
    </Layout>
  )
}

const CreateNCRModal = ({ user, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'Major',
    standard: 'ISO_9001',
    clause_number: '',
    root_cause: '',
    corrective_action: '',
    due_date: '',
    assigned_to_name: '',
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      alert('Title is required')
      return
    }

    try {
      setSaving(true)

      // Get user's company_id
      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user?.id)
        .single()

      if (!userData?.company_id) {
        alert('Could not determine your company. Please contact support.')
        return
      }

      // Generate NCR number
      const year = new Date().getFullYear()
      const { count } = await supabase
        .from('ncrs')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', userData.company_id)

      const ncrNumber = `NCR-${year}-${String((count || 0) + 1).padStart(3, '0')}`

      const { error } = await supabase.from('ncrs').insert({
        company_id: userData.company_id,
        ncr_number: ncrNumber,
        title: formData.title.trim(),
        description: formData.description.trim(),
        severity: formData.severity,
        standard: formData.standard,
        clause_number: formData.clause_number ? parseInt(formData.clause_number) : null,
        root_cause: formData.root_cause.trim() || null,
        corrective_action: formData.corrective_action.trim() || null,
        due_date: formData.due_date || null,
        assigned_to_name: formData.assigned_to_name.trim() || null,
        status: 'Open',
        date_raised: new Date().toISOString(),
        created_by: user?.id,
        uploaded_by: user?.id,
        archived: false,
        permanently_deleted: false,
        deleted: false,
      })

      if (error) throw error
      onSuccess()
    } catch (err) {
      console.error('Error creating NCR:', err)
      alert('Failed to create NCR: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-slate-900/95 backdrop-blur-xl border border-white/15 rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Create New NCR</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl">
            <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-white/60 block mb-1.5">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              className="w-full px-4 py-2.5 bg-white/[0.07] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/50"
              placeholder="e.g., Incomplete Training Records"
              required
            />
          </div>

          <div>
            <label className="text-sm text-white/60 block mb-1.5">Description</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              rows={3}
              className="w-full px-4 py-2.5 bg-white/[0.07] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/50 resize-none"
              placeholder="Describe the non-conformance..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-white/60 block mb-1.5">Severity</label>
              <select
                value={formData.severity}
                onChange={e => setFormData({...formData, severity: e.target.value})}
                className="w-full px-4 py-2.5 bg-white/[0.07] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/50"
                style={{ colorScheme: 'dark' }}
              >
                <option value="Critical">Critical</option>
                <option value="Major">Major</option>
                <option value="Minor">Minor</option>
                <option value="Observation">Observation</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-white/60 block mb-1.5">Standard</label>
              <select
                value={formData.standard}
                onChange={e => setFormData({...formData, standard: e.target.value})}
                className="w-full px-4 py-2.5 bg-white/[0.07] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/50"
                style={{ colorScheme: 'dark' }}
              >
                <option value="ISO_9001">ISO 9001:2015</option>
                <option value="ISO_14001">ISO 14001:2015</option>
                <option value="ISO_45001">ISO 45001:2018</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-white/60 block mb-1.5">Clause Number</label>
              <select
                value={formData.clause_number}
                onChange={e => setFormData({...formData, clause_number: e.target.value})}
                className="w-full px-4 py-2.5 bg-white/[0.07] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/50"
                style={{ colorScheme: 'dark' }}
              >
                <option value="">Select Clause</option>
                <option value="4">4 - Context</option>
                <option value="5">5 - Leadership</option>
                <option value="6">6 - Planning</option>
                <option value="7">7 - Support</option>
                <option value="8">8 - Operation</option>
                <option value="9">9 - Performance Evaluation</option>
                <option value="10">10 - Improvement</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-white/60 block mb-1.5">Due Date</label>
              <input
                type="date"
                value={formData.due_date}
                onChange={e => setFormData({...formData, due_date: e.target.value})}
                className="w-full px-4 py-2.5 bg-white/[0.07] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/50"
                style={{ colorScheme: 'dark' }}
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-white/60 block mb-1.5">Assigned To</label>
            <input
              type="text"
              value={formData.assigned_to_name}
              onChange={e => setFormData({...formData, assigned_to_name: e.target.value})}
              className="w-full px-4 py-2.5 bg-white/[0.07] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/50"
              placeholder="e.g., Quality Manager"
            />
          </div>

          <div>
            <label className="text-sm text-white/60 block mb-1.5">Root Cause</label>
            <textarea
              value={formData.root_cause}
              onChange={e => setFormData({...formData, root_cause: e.target.value})}
              rows={2}
              className="w-full px-4 py-2.5 bg-white/[0.07] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/50 resize-none"
              placeholder="Identify the root cause..."
            />
          </div>

          <div>
            <label className="text-sm text-white/60 block mb-1.5">Corrective Action</label>
            <textarea
              value={formData.corrective_action}
              onChange={e => setFormData({...formData, corrective_action: e.target.value})}
              rows={2}
              className="w-full px-4 py-2.5 bg-white/[0.07] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500/50 resize-none"
              placeholder="Describe the corrective action plan..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100"
            >
              {saving ? 'Creating...' : 'Create NCR'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-white/[0.07] text-white font-medium rounded-xl hover:bg-white/[0.12] transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NCRs

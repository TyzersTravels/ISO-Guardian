import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { logActivity } from '../lib/auditLogger'
import Layout from '../components/Layout'

const NCRs = () => {
  const { userProfile } = useAuth()
  const [ncrs, setNcrs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedNCR, setSelectedNCR] = useState(null)
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('Open')
  const [severityFilter, setSeverityFilter] = useState('all')

  useEffect(() => {
    fetchNCRs()
  }, [])

  const fetchNCRs = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('ncrs')
        .select('*, assigned_user:users!ncrs_assigned_to_fkey(full_name, email)')

      if (error) {
        // Fallback if foreign key name is different
        const { data: fallbackData, error: fbErr } = await supabase
          .from('ncrs')
          .select('*')
        if (fbErr) throw fbErr
        
        // Resolve user names manually
        const userIds = [...new Set((fallbackData || []).map(n => n.assigned_to).filter(Boolean))]
        let userMap = {}
        if (userIds.length > 0) {
          const { data: users } = await supabase.from('users').select('id, full_name, email').in('id', userIds)
          if (users) users.forEach(u => { userMap[u.id] = u.full_name || u.email })
        }
        setNcrs((fallbackData || []).map(n => ({ ...n, assigned_name: userMap[n.assigned_to] || 'Unassigned' })))
      } else {
        setNcrs((data || []).map(n => ({ ...n, assigned_name: n.assigned_user?.full_name || n.assigned_user?.email || 'Unassigned' })))
      }
    } catch (err) {
      console.error('Error fetching NCRs:', err)
    } finally {
      setLoading(false)
    }
  }

  const closeNCR = async (ncrId) => {
    try {
      const { error } = await supabase
        .from('ncrs')
        .update({ status: 'Closed' })
        .eq('id', ncrId)

      if (error) throw error
      
      await logActivity({ companyId: userProfile.company_id, userId: userProfile.id, action: 'status_changed', entityType: 'ncr', entityId: ncrId, changes: { status: 'Closed' } })
      setNcrs(ncrs.map(ncr => 
        ncr.id === ncrId ? { ...ncr, status: 'Closed' } : ncr
      ))
      setSelectedNCR(null)
      alert('NCR closed successfully!')
    } catch (err) {
      console.error('Error closing NCR:', err)
      alert('Failed to close NCR')
    }
  }

  const deleteNCR = async (ncrId, permanent = false) => {
    const confirmMsg = permanent 
      ? '⚠️ PERMANENTLY DELETE this NCR? This cannot be undone and will be logged for POPIA compliance.'
      : 'Archive this NCR? It can be restored later.'
    
    if (!confirm(confirmMsg)) return

    try {
      if (permanent) {
        const reason = window.prompt('Deletion reason (required for audit trail):')
        if (!reason?.trim()) { alert('Deletion reason is required'); return; }
        
        await supabase.from('deletion_audit_trail').insert([{
          company_id: userProfile.company_id,
          table_name: 'ncrs',
          record_id: ncrId,
          deleted_by: userProfile.id,
          deleted_at: new Date().toISOString(),
          reason: reason.trim()
        }])
        
        const { error } = await supabase.from('ncrs').delete().eq('id', ncrId)
        if (error) throw error
        await logActivity({ companyId: userProfile.company_id, userId: userProfile.id, action: 'permanently_deleted', entityType: 'ncr', entityId: ncrId, changes: {} })
        alert('NCR permanently deleted.')
      } else {
        const { error } = await supabase.from('ncrs').update({ archived: true }).eq('id', ncrId)
        if (error) throw error
        await logActivity({ companyId: userProfile.company_id, userId: userProfile.id, action: 'archived', entityType: 'ncr', entityId: ncrId, changes: {} })
        alert('NCR archived successfully.')
      }

      fetchNCRs()
      setSelectedNCR(null)
    } catch (err) {
      console.error('Error deleting NCR:', err)
      alert('Failed to delete NCR: ' + err.message)
    }
  }

  const restoreNCR = async (ncrId) => {
    try {
      const { error } = await supabase.from('ncrs').update({ archived: false }).eq('id', ncrId)
      if (error) throw error
      await logActivity({ companyId: userProfile.company_id, userId: userProfile.id, action: 'restored', entityType: 'ncr', entityId: ncrId, changes: {} })
      alert('NCR restored successfully.')
      fetchNCRs()
    } catch (err) {
      console.error('Error restoring NCR:', err)
      alert('Failed to restore NCR: ' + err.message)
    }
  }

  const exportNCR = async (ncr) => {
    try {
      const { default: jsPDF } = await import('jspdf')
      const doc = new jsPDF('p', 'mm', 'a4')
      const pw = doc.internal.pageSize.getWidth()
      const m = 20
      const cw = pw - m * 2

      // Load logo
      let logo = null
      try {
        const resp = await fetch('/isoguardian-logo.png')
        const blob = await resp.blob()
        logo = await new Promise(r => { const rd = new FileReader(); rd.onload = () => r(rd.result); rd.readAsDataURL(blob) })
      } catch (e) {}

      // Header bar
      doc.setFillColor(124, 58, 237)
      doc.rect(0, 0, pw, 32, 'F')
      if (logo) try { doc.addImage(logo, 'PNG', m, 3, 26, 26) } catch(e) {}
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(16)
      doc.setTextColor(255, 255, 255)
      doc.text('ISOGuardian', logo ? m + 30 : m, 14)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(220, 220, 255)
      doc.text('Enterprise ISO Compliance Management', logo ? m + 30 : m, 20)

      // Document control block
      const companyCode = userProfile?.company?.company_code || 'XX'
      const docNum = `IG-${companyCode}-NCR-${String(ncr.ncr_number || '').replace(/\D/g, '').slice(-3).padStart(3, '0')}`
      const revDate = '31 January 2027'
      
      doc.setFillColor(249, 250, 251)
      doc.rect(m, 35, cw, 18, 'F')
      doc.setDrawColor(200, 200, 200)
      doc.rect(m, 35, cw, 18, 'S')
      const colW = cw / 3
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(30, 27, 75)
      doc.text('Document No.', m + 4, 41)
      doc.text('Revision', m + colW + 4, 41)
      doc.text('Date of Review', m + colW * 2 + 4, 41)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(124, 58, 237)
      doc.text(docNum, m + 4, 48)
      doc.text('Rev 01', m + colW + 4, 48)
      doc.text(revDate, m + colW * 2 + 4, 48)
      doc.setDrawColor(200, 200, 200)
      doc.line(m + colW, 35, m + colW, 53)
      doc.line(m + colW * 2, 35, m + colW * 2, 53)

      // Title
      let y = 62
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.setTextColor(30, 27, 75)
      doc.text('NON-CONFORMANCE REPORT', m, y)
      y += 6
      doc.setFontSize(9)
      doc.setTextColor(107, 114, 128)
      doc.setFont('helvetica', 'normal')
      doc.text(`Company: ${userProfile?.company?.name || 'N/A'}`, m, y); y += 4
      doc.text(`Generated: ${new Date().toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' })}`, m, y); y += 6
      doc.setDrawColor(124, 58, 237)
      doc.setLineWidth(0.5)
      doc.line(m, y, pw - m, y); y += 8

      // Helper functions
      const addLabel = (label, value, yPos) => {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        doc.setTextColor(107, 114, 128)
        doc.text(label + ':', m, yPos)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(30, 27, 75)
        const lw = doc.getTextWidth(label + ': ')
        doc.text(String(value || 'N/A'), m + lw + 2, yPos)
        return yPos + 5.5
      }
      const addSection = (title, yPos) => {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(11)
        doc.setTextColor(124, 58, 237)
        doc.text(title, m, yPos)
        return yPos + 7
      }
      const addBody = (text, yPos) => {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(30, 27, 75)
        const lines = doc.splitTextToSize(String(text || ''), cw)
        doc.text(lines, m, yPos)
        return yPos + lines.length * 4.2 + 4
      }

      // NCR Details
      y = addSection('NCR Details', y)
      y = addLabel('NCR Number', ncr.ncr_number, y)
      y = addLabel('Title', ncr.title, y)
      y = addLabel('Status', ncr.status, y)
      y = addLabel('Severity', ncr.severity, y)
      y = addLabel('Standard', ncr.standard?.replace('_', ' '), y)
      y = addLabel('Clause', ncr.clause_name || `Clause ${ncr.clause}`, y)
      y = addLabel('Assigned To', ncr.assigned_name || 'Unassigned', y)
      y = addLabel('Date Opened', ncr.date_opened ? new Date(ncr.date_opened).toLocaleDateString('en-ZA') : 'N/A', y)
      y = addLabel('Due Date', ncr.due_date ? new Date(ncr.due_date).toLocaleDateString('en-ZA') : 'N/A', y)
      if (ncr.date_closed) y = addLabel('Date Closed', new Date(ncr.date_closed).toLocaleDateString('en-ZA'), y)
      y += 4

      if (ncr.description) { y = addSection('Description', y); y = addBody(ncr.description, y) }
      if (ncr.root_cause) { y = addSection('Root Cause Analysis', y); y = addBody(ncr.root_cause, y) }
      if (ncr.corrective_action) { y = addSection('Corrective Action', y); y = addBody(ncr.corrective_action, y) }

      // Footer
      const fy = doc.internal.pageSize.getHeight() - 12
      doc.setDrawColor(107, 114, 128)
      doc.line(m, fy - 4, pw - m, fy - 4)
      doc.setFontSize(7)
      doc.setTextColor(107, 114, 128)
      doc.text('ISOGuardian (Pty) Ltd | Reg: 2026/082362/07 | www.isoguardian.co.za', m, fy)
      doc.text(`Printed: ${new Date().toLocaleDateString('en-ZA')} | CONFIDENTIAL`, pw - m, fy, { align: 'right' })

      doc.save(`${ncr.ncr_number}_Report.pdf`)
    } catch (err) {
      console.error('Export error:', err)
      alert('Export failed: ' + err.message)
    }
  }

  // Filter NCRs
  const filteredNCRs = ncrs.filter(ncr => {
    if (statusFilter === 'Archived') return ncr.archived === true
    if (ncr.archived) return false
    const matchesStatus = statusFilter === 'all' || ncr.status === statusFilter
    const matchesSeverity = severityFilter === 'all' || ncr.severity === severityFilter
    return matchesStatus && matchesSeverity
  })

  // Count stats (exclude archived)
  const activeNcrs = ncrs.filter(n => !n.archived)
  const openCount = activeNcrs.filter(n => n.status === 'Open').length
  const criticalCount = activeNcrs.filter(n => n.status === 'Open' && n.severity === 'Critical').length
  const archivedCount = ncrs.filter(n => n.archived).length

  if (loading) {
    return (
      <Layout>
        <div className="text-white text-center py-12">Loading NCRs...</div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Non-Conformance Reports</h2>
            <p className="text-cyan-200 text-sm">{filteredNCRs.length} NCRs {statusFilter === 'Archived' ? '(archived)' : ''}</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-semibold"
          >
            + New NCR
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="glass glass-border rounded-lg p-4">
            <div className="text-3xl font-bold text-orange-400">{openCount}</div>
            <div className="text-sm text-white/70">Open NCRs</div>
          </div>
          <div className="glass glass-border rounded-lg p-4">
            <div className="text-3xl font-bold text-red-400">{criticalCount}</div>
            <div className="text-sm text-white/70">Critical</div>
          </div>
          <div className="glass glass-border rounded-lg p-4">
            <div className="text-3xl font-bold text-white/40">{archivedCount}</div>
            <div className="text-sm text-white/70">Archived</div>
          </div>
        </div>

        {/* Filters */}
        <div className="glass glass-border rounded-lg p-4">
          <div className="grid grid-cols-2 gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 glass glass-border rounded-lg text-white bg-transparent"
            >
              <option value="all" className="bg-slate-800">All Status</option>
              <option value="Open" className="bg-slate-800">Open</option>
              <option value="Closed" className="bg-slate-800">Closed</option>
              <option value="Archived" className="bg-slate-800">Archived</option>
            </select>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-4 py-2 glass glass-border rounded-lg text-white bg-transparent"
            >
              <option value="all" className="bg-slate-800">All Severity</option>
              <option value="Critical" className="bg-slate-800">Critical</option>
              <option value="Major" className="bg-slate-800">Major</option>
              <option value="Minor" className="bg-slate-800">Minor</option>
            </select>
          </div>
        </div>

        {/* NCRs List */}
        <div className="space-y-3">
          {filteredNCRs.length === 0 ? (
            <div className="glass glass-border rounded-lg p-8 text-center text-white/60">
              No NCRs found
            </div>
          ) : (
            filteredNCRs.map(ncr => (
              <div
                key={ncr.id}
                onClick={() => setSelectedNCR(ncr)}
                className={`glass glass-border rounded-lg p-4 hover:bg-white/5 cursor-pointer ${ncr.archived ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-cyan-400 text-sm">{ncr.ncr_number}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        ncr.severity === 'Critical' ? 'bg-red-500/20 text-red-300' :
                        ncr.severity === 'Major' ? 'bg-orange-500/20 text-orange-300' :
                        'bg-yellow-500/20 text-yellow-300'
                      }`}>
                        {ncr.severity}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        ncr.archived ? 'bg-gray-500/20 text-gray-300' :
                        ncr.status === 'Open' ? 'bg-orange-500/20 text-orange-300' : 'bg-green-500/20 text-green-300'
                      }`}>
                        {ncr.archived ? 'Archived' : ncr.status}
                      </span>
                    </div>
                    <div className="font-semibold text-white mb-1">{ncr.title}</div>
                    <div className="text-sm text-white/60 mb-2">{ncr.clause_name}</div>
                    <div className="flex items-center gap-4 text-xs text-white/50">
                      <span>Opened: {new Date(ncr.date_opened).toLocaleDateString()}</span>
                      <span>Due: {new Date(ncr.due_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button className="text-cyan-400 text-sm hover:underline">View →</button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* NCR Details Modal */}
        {selectedNCR && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="glass glass-border rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">{selectedNCR.ncr_number}</h3>
                <button
                  onClick={() => setSelectedNCR(null)}
                  className="text-white/60 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-white/60">Title</label>
                  <div className="text-white font-semibold">{selectedNCR.title}</div>
                </div>

                <div>
                  <label className="text-sm text-white/60">Description</label>
                  <div className="text-white/80 glass glass-border rounded-lg p-3">
                    {selectedNCR.description}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-white/60">Standard</label>
                    <div className="text-white">{selectedNCR.standard.replace('_', ' ')}</div>
                  </div>
                  <div>
                    <label className="text-sm text-white/60">Severity</label>
                    <div className="text-white">{selectedNCR.severity}</div>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-white/60">Root Cause</label>
                  <div className="text-white/80 glass glass-border rounded-lg p-3">
                    {selectedNCR.root_cause}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-white/60">Corrective Action</label>
                  <div className="text-white/80 glass glass-border rounded-lg p-3">
                    {selectedNCR.corrective_action}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-white/60">Date Opened</label>
                    <div className="text-white">{new Date(selectedNCR.date_opened).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <label className="text-sm text-white/60">Due Date</label>
                    <div className="text-white">{new Date(selectedNCR.due_date).toLocaleDateString()}</div>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-white/60">Assigned To</label>
                  <div className="text-white">{selectedNCR.assigned_name || 'Unassigned'}</div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 flex-wrap pt-2">
                  {selectedNCR.status === 'Open' && !selectedNCR.archived && (
                    <button
                      onClick={() => closeNCR(selectedNCR.id)}
                      className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg"
                    >
                      ✓ Close NCR
                    </button>
                  )}
                  <button
                    onClick={() => exportNCR(selectedNCR)}
                    className="py-3 px-6 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export
                  </button>
                  {selectedNCR.archived ? (
                    <button
                      onClick={() => restoreNCR(selectedNCR.id)}
                      className="py-3 px-6 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg"
                    >
                      ↩ Restore
                    </button>
                  ) : (
                    <button
                      onClick={() => deleteNCR(selectedNCR.id)}
                      className="py-3 px-6 bg-orange-500/80 hover:bg-orange-600 text-white font-semibold rounded-lg"
                    >
                      Archive
                    </button>
                  )}
                  {['superadmin', 'admin', 'lead_auditor'].includes(userProfile.role) && (
                    <button
                      onClick={() => deleteNCR(selectedNCR.id, true)}
                      className="py-3 px-6 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg"
                    >
                      Delete Forever
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create NCR Form */}
        {showCreateForm && (
          <CreateNCRForm
            userProfile={userProfile}
            onClose={() => setShowCreateForm(false)}
            onCreated={() => {
              fetchNCRs()
              setShowCreateForm(false)
            }}
          />
        )}
      </div>

      <style>{`
        .glass {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
        }
        .glass-border {
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </Layout>
  )
}

// Create NCR Form Component
const CreateNCRForm = ({ userProfile, onClose, onCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    standard: userProfile.standards_access[0] || 'ISO_9001',
    clause: 7,
    severity: 'Major',
    root_cause: '',
    corrective_action: '',
    due_date: ''
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const clauseNames = {
        4: 'Clause 4: Context of the Organization',
        5: 'Clause 5: Leadership',
        6: 'Clause 6: Planning',
        7: 'Clause 7: Support',
        8: 'Clause 8: Operation',
        9: 'Clause 9: Performance Evaluation',
        10: 'Clause 10: Improvement'
      }

      const { count } = await supabase
        .from('ncrs')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', userProfile.company_id)

      // Get highest existing number to avoid duplicates (deleted NCRs leave gaps)
      const { data: existingNCRs } = await supabase
        .from('ncrs')
        .select('ncr_number')
        .eq('company_id', userProfile.company_id)
        .order('created_at', { ascending: false })
        .limit(50)

      const year = new Date().getFullYear()
      let maxNum = 0
      if (existingNCRs) {
        existingNCRs.forEach(n => {
          const match = n.ncr_number?.match(/NCR-\d{4}-(\d+)/)
          if (match) {
            const num = parseInt(match[1])
            if (num > maxNum) maxNum = num
          }
        })
      }
      const nextNumber = maxNum + 1
      const ncrNumber = `NCR-${year}-${String(nextNumber).padStart(3, '0')}`

      const { error } = await supabase
        .from('ncrs')
        .insert([{
          company_id: userProfile.company_id,
          ncr_number: ncrNumber,
          title: formData.title,
          description: formData.description,
          standard: formData.standard,
          clause: formData.clause,
          clause_name: clauseNames[formData.clause],
          severity: formData.severity,
          status: 'Open',
          assigned_to: userProfile.id,
          date_opened: new Date().toISOString().split('T')[0],
          due_date: formData.due_date,
          root_cause: formData.root_cause,
          corrective_action: formData.corrective_action
        }])

      if (error) throw error

      alert('NCR created successfully!')
      onCreated()
    } catch (err) {
      console.error('Error creating NCR:', err)
      alert('Failed to create NCR: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="glass glass-border rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold text-white mb-6">Create New NCR</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-white/60 block mb-2">Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 glass glass-border rounded-lg text-white bg-transparent"
              placeholder="Brief description of non-conformance"
            />
          </div>

          <div>
            <label className="text-sm text-white/60 block mb-2">Description *</label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 glass glass-border rounded-lg text-white bg-transparent"
              rows="3"
              placeholder="Detailed description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-white/60 block mb-2">Standard *</label>
              <select
                required
                value={formData.standard}
                onChange={(e) => setFormData({ ...formData, standard: e.target.value })}
                className="w-full px-4 py-2 glass glass-border rounded-lg text-white bg-transparent"
              >
                {userProfile.standards_access.map(std => (
                  <option key={std} value={std} className="bg-slate-800">
                    {std.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-white/60 block mb-2">Clause *</label>
              <select
                required
                value={formData.clause}
                onChange={(e) => setFormData({ ...formData, clause: parseInt(e.target.value) })}
                className="w-full px-4 py-2 glass glass-border rounded-lg text-white bg-transparent"
              >
                {[4, 5, 6, 7, 8, 9, 10].map(n => (
                  <option key={n} value={n} className="bg-slate-800">Clause {n}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-white/60 block mb-2">Severity *</label>
              <select
                required
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                className="w-full px-4 py-2 glass glass-border rounded-lg text-white bg-transparent"
              >
                <option value="Critical" className="bg-slate-800">Critical</option>
                <option value="Major" className="bg-slate-800">Major</option>
                <option value="Minor" className="bg-slate-800">Minor</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-white/60 block mb-2">Due Date *</label>
              <input
                type="date"
                required
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-4 py-2 glass glass-border rounded-lg text-white bg-transparent"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-white/60 block mb-2">Root Cause *</label>
            <textarea
              required
              value={formData.root_cause}
              onChange={(e) => setFormData({ ...formData, root_cause: e.target.value })}
              className="w-full px-4 py-2 glass glass-border rounded-lg text-white bg-transparent"
              rows="2"
            />
          </div>

          <div>
            <label className="text-sm text-white/60 block mb-2">Corrective Action *</label>
            <textarea
              required
              value={formData.corrective_action}
              onChange={(e) => setFormData({ ...formData, corrective_action: e.target.value })}
              className="w-full px-4 py-2 glass glass-border rounded-lg text-white bg-transparent"
              rows="2"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create NCR'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 glass glass-border text-white rounded-lg hover:bg-white/10"
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

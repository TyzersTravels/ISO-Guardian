import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { supabase } from '../lib/supabase'
import { logActivity } from '../lib/auditLogger'
import { fitImage } from '../lib/brandedPDFExport'
import { useFormDraft, DRAFT_NOTICE_CLASS } from '../hooks/useFormDraft'
import Layout from '../components/Layout'
import ConfirmModal from '../components/ConfirmModal'

const NCRs = () => {
  const { userProfile, getEffectiveCompanyId } = useAuth()
  const toast = useToast()
  const [ncrs, setNcrs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedNCR, setSelectedNCR] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [editFormData, setEditFormData] = useState(null)
  const [savingEdit, setSavingEdit] = useState(false)

  const startEditMode = () => {
    if (!selectedNCR) return
    setEditFormData({
      title: selectedNCR.title || '',
      description: selectedNCR.description || '',
      severity: selectedNCR.severity || 'Major',
      root_cause: selectedNCR.root_cause || '',
      corrective_action: selectedNCR.corrective_action || '',
      due_date: selectedNCR.due_date || '',
    })
    setEditMode(true)
  }

  const cancelEditMode = () => {
    setEditMode(false)
    setEditFormData(null)
  }

  const saveEdit = async () => {
    if (!selectedNCR || !editFormData) return
    setSavingEdit(true)
    try {
      const changes = {
        title: editFormData.title.trim(),
        description: editFormData.description.trim(),
        severity: editFormData.severity,
        root_cause: editFormData.root_cause?.trim() || null,
        corrective_action: editFormData.corrective_action?.trim() || null,
        due_date: editFormData.due_date || null,
        updated_at: new Date().toISOString(),
      }

      // Compute a diff for the audit log so we record only what actually changed
      const diff = {}
      Object.keys(changes).forEach((k) => {
        if (k === 'updated_at') return
        if (selectedNCR[k] !== changes[k]) diff[k] = { from: selectedNCR[k] || null, to: changes[k] }
      })

      if (Object.keys(diff).length === 0) {
        toast.info('No changes to save.')
        setEditMode(false)
        setEditFormData(null)
        return
      }

      const { error } = await supabase
        .from('ncrs')
        .update(changes)
        .eq('id', selectedNCR.id)

      if (error) throw error

      await logActivity({
        companyId: getEffectiveCompanyId(),
        userId: userProfile.id,
        action: 'updated',
        entityType: 'ncr',
        entityId: selectedNCR.id,
        changes: diff,
      })

      toast.success(`${selectedNCR.ncr_number} updated.`)
      setSelectedNCR({ ...selectedNCR, ...changes })
      setEditMode(false)
      setEditFormData(null)
      fetchNCRs()
    } catch (err) {
      console.error('Error saving NCR edits:', err)
      toast.error('Failed to save changes. Please try again.')
    } finally {
      setSavingEdit(false)
    }
  }
  const [confirmAction, setConfirmAction] = useState(null)
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('Open')
  const [severityFilter, setSeverityFilter] = useState('all')

  useEffect(() => {
    if (userProfile) fetchNCRs()
  }, [userProfile])

  const fetchNCRs = async () => {
    try {
      setLoading(true)
      const companyId = getEffectiveCompanyId()
      const { data, error } = await supabase
        .from('ncrs')
        .select('id, ncr_number, title, description, standard, clause, clause_name, severity, status, assigned_to, company_id, created_at, updated_at, archived, date_opened, due_date, root_cause, corrective_action, date_closed')
        .eq('company_id', companyId)

      if (error) throw error

      // Resolve assigned user names
      const userIds = [...new Set((data || []).map(n => n.assigned_to).filter(Boolean))]
      let userMap = {}
      if (userIds.length > 0) {
        const { data: users } = await supabase.from('users').select('id, full_name, email').in('id', userIds)
        if (users) users.forEach(u => { userMap[u.id] = u.full_name || u.email })
      }
      setNcrs((data || []).map(n => ({ ...n, assigned_name: userMap[n.assigned_to] || 'Unassigned' })))
    } catch (err) {
      console.error('Error fetching NCRs:', err)
      toast.error('Failed to load NCRs. Please refresh the page.')
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
      
      await logActivity({ companyId: getEffectiveCompanyId(), userId: userProfile.id, action: 'status_changed', entityType: 'ncr', entityId: ncrId, changes: { status: 'Closed' } })
      setNcrs(ncrs.map(ncr => 
        ncr.id === ncrId ? { ...ncr, status: 'Closed' } : ncr
      ))
      setSelectedNCR(null)
      toast.success('NCR closed successfully!')
    } catch (err) {
      console.error('Error closing NCR:', err)
      toast.error('Failed to close NCR')
    }
  }

  const requestDeleteNCR = (ncrId, permanent = false) => {
    if (permanent) {
      setConfirmAction({
        title: 'Permanently Delete NCR',
        message: 'This NCR will be permanently deleted. This cannot be undone and will be logged for POPIA compliance.',
        variant: 'danger',
        confirmLabel: 'Delete Forever',
        requireReason: true,
        reasonLabel: 'Deletion reason (required for audit trail):',
        reasonPlaceholder: 'Why is this NCR being permanently deleted?',
        onConfirm: async (reason) => {
          setConfirmAction(null)
          try {
            await supabase.from('deletion_audit_trail').insert([{
              company_id: getEffectiveCompanyId(),
              table_name: 'ncrs',
              record_id: ncrId,
              deleted_by: userProfile.id,
              deleted_at: new Date().toISOString(),
              reason
            }])
            const { error } = await supabase.from('ncrs').delete().eq('id', ncrId)
            if (error) throw error
            await logActivity({ companyId: getEffectiveCompanyId(), userId: userProfile.id, action: 'permanently_deleted', entityType: 'ncr', entityId: ncrId, changes: {} })
            toast.success('NCR permanently deleted.')
            fetchNCRs()
            setSelectedNCR(null)
          } catch (err) {
            console.error('Error deleting NCR:', err)
            toast.error('Failed to delete NCR. Please try again.')
          }
        }
      })
    } else {
      setConfirmAction({
        title: 'Archive NCR',
        message: 'Archive this NCR? It can be restored later.',
        variant: 'warning',
        confirmLabel: 'Archive',
        onConfirm: async () => {
          setConfirmAction(null)
          try {
            const { error } = await supabase.from('ncrs').update({ archived: true }).eq('id', ncrId)
            if (error) throw error
            await logActivity({ companyId: getEffectiveCompanyId(), userId: userProfile.id, action: 'archived', entityType: 'ncr', entityId: ncrId, changes: {} })
            toast.success('NCR archived successfully.')
            fetchNCRs()
            setSelectedNCR(null)
          } catch (err) {
            console.error('Error archiving NCR:', err)
            toast.error('Failed to archive NCR. Please try again.')
          }
        }
      })
    }
  }

  const restoreNCR = async (ncrId) => {
    try {
      const { error } = await supabase.from('ncrs').update({ archived: false }).eq('id', ncrId)
      if (error) throw error
      await logActivity({ companyId: getEffectiveCompanyId(), userId: userProfile.id, action: 'restored', entityType: 'ncr', entityId: ncrId, changes: {} })
      toast.success('NCR restored successfully.')
      fetchNCRs()
    } catch (err) {
      console.error('Error restoring NCR:', err)
      toast.error('Failed to restore NCR. Please try again.')
    }
  }

  const exportNCR = async (ncr) => {
    try {
      const { default: jsPDF } = await import('jspdf')
      const doc = new jsPDF('p', 'mm', 'a4')
      const pw = doc.internal.pageSize.getWidth()
      const m = 20
      const cw = pw - m * 2

      // Load BOTH logos - company as hero, ISOGuardian as subtle
      let companyLogo = null
      let igLogo = null
      const loadImg = async (url) => { try { const resp = await fetch(url); const bl = await resp.blob(); return await new Promise(r => { const rd = new FileReader(); rd.onload = () => r(rd.result); rd.readAsDataURL(bl); }); } catch(e) { return null; } }
      
      const companyLogoUrl = userProfile?.company?.logo_url
      if (companyLogoUrl) companyLogo = await loadImg(companyLogoUrl)
      igLogo = await loadImg('/isoguardian-logo.png')
      
      const companyCode = userProfile?.company?.company_code || 'XX'
      const companyName = userProfile?.company?.name || 'Company'

      // Header bar
      doc.setFillColor(124, 58, 237)
      doc.rect(0, 0, pw, 32, 'F')
      // Company logo = hero
      if (companyLogo) try { fitImage(doc, companyLogo, m, 3, 26, 26) } catch(e) {}
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.setTextColor(255, 255, 255)
      doc.text(companyName, companyLogo ? m + 30 : m, 14)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(220, 220, 255)
      doc.text('Integrated Management System', companyLogo ? m + 30 : m, 21)
      // ISOGuardian subtle right side
      if (igLogo) try { fitImage(doc, igLogo, pw - m - 10, 5, 8, 8) } catch(e) {}
      doc.setFontSize(5)
      doc.setTextColor(200, 200, 255)
      doc.text('Powered by ISOGuardian', pw - m, 18, { align: 'right' })

      // Document control block
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
      doc.text(`Company: ${companyName}`, m, y); y += 4
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

      // ── Signature Blocks (ISO 9001 §10.2 + §7.5.3 traceability) ──
      const ph = doc.internal.pageSize.getHeight()
      const minSpaceForSigs = 70
      if (y > ph - minSpaceForSigs - 20) {
        doc.addPage()
        y = 20
      } else {
        y += 6
      }

      y = addSection('Signatures', y)

      const sigBlock = (label, name, dateLabel, dateValue, yPos, xCol) => {
        const colW = (cw - 6) / 2
        const xStart = m + (xCol === 0 ? 0 : colW + 6)
        // Label
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8)
        doc.setTextColor(107, 114, 128)
        doc.text(label, xStart, yPos)
        // Name printed below if known
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(30, 27, 75)
        if (name) doc.text(`Name: ${name}`, xStart, yPos + 5)
        // Signature line
        doc.setDrawColor(160, 160, 160)
        doc.setLineWidth(0.3)
        doc.line(xStart, yPos + 18, xStart + colW, yPos + 18)
        doc.setFontSize(7)
        doc.setTextColor(120, 120, 120)
        doc.text('Signature', xStart, yPos + 22)
        // Date line
        doc.line(xStart, yPos + 30, xStart + colW, yPos + 30)
        doc.setFontSize(8)
        doc.setTextColor(30, 27, 75)
        if (dateValue) doc.text(dateValue, xStart, yPos + 28)
        doc.setFontSize(7)
        doc.setTextColor(120, 120, 120)
        doc.text(dateLabel, xStart, yPos + 34)
      }

      const openedDate = ncr.date_opened ? new Date(ncr.date_opened).toLocaleDateString('en-ZA') : ''
      const closedDate = ncr.date_closed ? new Date(ncr.date_closed).toLocaleDateString('en-ZA') : ''

      // Row 1 — Raised by + Approved by
      sigBlock('RAISED BY', ncr.assigned_name || '', 'Date Raised', openedDate, y, 0)
      sigBlock('APPROVED BY (Quality Manager)', '', 'Date', '', y, 1)
      y += 40

      // Row 2 — Verified by + Closed by (only on closed NCRs)
      if (ncr.status === 'Closed') {
        sigBlock('VERIFICATION OF EFFECTIVENESS', '', 'Verification Date', '', y, 0)
        sigBlock('CLOSED BY', '', 'Date Closed', closedDate, y, 1)
        y += 40
      }

      // ── Footer (client-only branding — no ISOGuardian text) ──
      const fy = ph - 12
      doc.setDrawColor(200, 200, 200)
      doc.setLineWidth(0.3)
      doc.line(m, fy - 4, pw - m, fy - 4)
      doc.setFontSize(7)
      doc.setTextColor(107, 114, 128)
      doc.text(`${companyName} — CONFIDENTIAL`, m, fy)
      doc.text(`Printed: ${new Date().toLocaleDateString('en-ZA')}`, pw - m, fy, { align: 'right' })

      doc.save(`${ncr.ncr_number}_Report.pdf`)
    } catch (err) {
      console.error('Export error:', err)
      toast.error('Export failed. Please try again.')
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
            <h2 className="text-xl md:text-2xl font-bold text-white">Non-Conformance Reports</h2>
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
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          <div className="glass glass-border rounded-lg p-4">
            <div className="text-2xl md:text-3xl font-bold text-orange-400">{openCount}</div>
            <div className="text-sm text-white/70">Open NCRs</div>
          </div>
          <div className="glass glass-border rounded-lg p-4">
            <div className="text-2xl md:text-3xl font-bold text-red-400">{criticalCount}</div>
            <div className="text-sm text-white/70">Critical</div>
          </div>
          <div className="glass glass-border rounded-lg p-4">
            <div className="text-2xl md:text-3xl font-bold text-white/40">{archivedCount}</div>
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
            <div className="glass glass-border rounded-2xl p-12 text-center">
              <svg className="w-16 h-16 text-white/20 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <p className="text-white/50 font-medium mb-1">
                {ncrs.length === 0 ? 'No non-conformances raised yet' : 'No NCRs match your filters'}
              </p>
              <p className="text-white/30 text-sm">
                {ncrs.length === 0 ? 'NCRs will appear here once they are raised.' : 'Try adjusting your status or severity filters.'}
              </p>
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
            <div className="glass glass-border rounded-2xl p-4 md:p-6 max-w-sm md:max-w-2xl w-full mx-4 md:mx-auto max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-white">{selectedNCR.ncr_number}</h3>
                  {editMode && <p className="text-amber-300 text-xs mt-1">Editing — changes are logged to the audit trail</p>}
                </div>
                <button
                  onClick={() => { cancelEditMode(); setSelectedNCR(null) }}
                  className="text-white/60 hover:text-white"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="text-sm text-white/60 block mb-1">Title</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={editFormData.title}
                      onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                      className="w-full px-4 py-2 glass glass-border rounded-lg text-white bg-transparent"
                    />
                  ) : (
                    <div className="text-white font-semibold">{selectedNCR.title}</div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="text-sm text-white/60 block mb-1">Description</label>
                  {editMode ? (
                    <textarea
                      value={editFormData.description}
                      onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                      rows="3"
                      className="w-full px-4 py-2 glass glass-border rounded-lg text-white bg-transparent"
                    />
                  ) : (
                    <div className="text-white/80 glass glass-border rounded-lg p-3 whitespace-pre-wrap">
                      {selectedNCR.description}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-white/60 block mb-1">Standard</label>
                    <div className="text-white">{selectedNCR.standard?.replace('_', ' ')}</div>
                  </div>
                  <div>
                    <label className="text-sm text-white/60 block mb-1">Severity</label>
                    {editMode ? (
                      <select
                        value={editFormData.severity}
                        onChange={(e) => setEditFormData({ ...editFormData, severity: e.target.value })}
                        className="w-full px-4 py-2 glass glass-border rounded-lg text-white bg-transparent"
                      >
                        <option value="Critical" className="bg-slate-800">Critical</option>
                        <option value="Major" className="bg-slate-800">Major</option>
                        <option value="Minor" className="bg-slate-800">Minor</option>
                      </select>
                    ) : (
                      <div className="text-white">{selectedNCR.severity}</div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-white/60 block mb-1">
                    Root Cause {editMode && <span className="text-white/40">(ISO §10.2)</span>}
                  </label>
                  {editMode ? (
                    <textarea
                      value={editFormData.root_cause}
                      onChange={(e) => setEditFormData({ ...editFormData, root_cause: e.target.value })}
                      rows="3"
                      placeholder="5-Whys analysis result"
                      className="w-full px-4 py-2 glass glass-border rounded-lg text-white bg-transparent"
                    />
                  ) : (
                    <div className="text-white/80 glass glass-border rounded-lg p-3 whitespace-pre-wrap min-h-[2.5rem]">
                      {selectedNCR.root_cause || <span className="text-white/30 italic">Not yet recorded — click Edit to add.</span>}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm text-white/60 block mb-1">
                    Corrective Action {editMode && <span className="text-white/40">(ISO §10.2)</span>}
                  </label>
                  {editMode ? (
                    <textarea
                      value={editFormData.corrective_action}
                      onChange={(e) => setEditFormData({ ...editFormData, corrective_action: e.target.value })}
                      rows="3"
                      placeholder="Numbered steps with owners + due dates"
                      className="w-full px-4 py-2 glass glass-border rounded-lg text-white bg-transparent"
                    />
                  ) : (
                    <div className="text-white/80 glass glass-border rounded-lg p-3 whitespace-pre-wrap min-h-[2.5rem]">
                      {selectedNCR.corrective_action || <span className="text-white/30 italic">Not yet recorded — click Edit to add.</span>}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-white/60 block mb-1">Date Opened</label>
                    <div className="text-white">{selectedNCR.date_opened ? new Date(selectedNCR.date_opened).toLocaleDateString() : '—'}</div>
                  </div>
                  <div>
                    <label className="text-sm text-white/60 block mb-1">Due Date</label>
                    {editMode ? (
                      <input
                        type="date"
                        value={editFormData.due_date}
                        onChange={(e) => setEditFormData({ ...editFormData, due_date: e.target.value })}
                        className="w-full px-4 py-2 glass glass-border rounded-lg text-white bg-transparent"
                      />
                    ) : (
                      <div className="text-white">{selectedNCR.due_date ? new Date(selectedNCR.due_date).toLocaleDateString() : '—'}</div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-white/60 block mb-1">Assigned To</label>
                  <div className="text-white">{selectedNCR.assigned_name || 'Unassigned'}</div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 flex-wrap pt-2">
                  {editMode ? (
                    <>
                      <button
                        onClick={saveEdit}
                        disabled={savingEdit}
                        className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold rounded-lg shadow-lg shadow-cyan-500/30 disabled:opacity-50"
                      >
                        {savingEdit ? 'Saving…' : 'Save Changes'}
                      </button>
                      <button
                        onClick={cancelEditMode}
                        disabled={savingEdit}
                        className="py-3 px-6 glass glass-border text-white rounded-lg hover:bg-white/10 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      {selectedNCR.status === 'Open' && !selectedNCR.archived && (
                        <button
                          onClick={() => closeNCR(selectedNCR.id)}
                          className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg"
                        >
                          ✓ Close NCR
                        </button>
                      )}
                      {!selectedNCR.archived && ['super_admin', 'admin', 'lead_auditor'].includes(userProfile?.role) && (
                        <button
                          onClick={startEditMode}
                          className="py-3 px-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-lg shadow-lg shadow-amber-500/30"
                        >
                          ✎ Edit
                        </button>
                      )}
                      <button
                        onClick={() => exportNCR(selectedNCR)}
                        className="py-3 px-6 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export PDF
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
                          onClick={() => requestDeleteNCR(selectedNCR.id)}
                          className="py-3 px-6 bg-orange-500/80 hover:bg-orange-600 text-white font-semibold rounded-lg"
                        >
                          Archive
                        </button>
                      )}
                      {['super_admin', 'admin', 'lead_auditor'].includes(userProfile?.role) && (
                        <button
                          onClick={() => requestDeleteNCR(selectedNCR.id, true)}
                          className="py-3 px-6 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg"
                        >
                          Delete Forever
                        </button>
                      )}
                    </>
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


      {confirmAction && (
        <ConfirmModal
          {...confirmAction}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </Layout>
  )
}

// Create NCR Form Component
const CreateNCRForm = ({ userProfile, onClose, onCreated }) => {
  const toast = useToast()
  const { getEffectiveCompanyId } = useAuth()

  const [formData, setFormData, { restored, clearDraft }] = useFormDraft(
    'isoguardian_ncr_draft_v1',
    {
      title: '',
      description: '',
      standard: userProfile?.standards_access?.[0] || 'iso_9001',
      clause: 7,
      severity: 'Major',
      root_cause: '',
      corrective_action: '',
      due_date: '',
    },
    {
      // Don't restore a draft if the user has lost access to that standard
      validate: (d) => !d.standard || (userProfile?.standards_access || []).includes(d.standard),
    },
  )

  const [submitting, setSubmitting] = useState(false)

  const handleCancel = () => {
    clearDraft()
    onClose()
  }

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

      // Atomic NCR number generation via PostgreSQL function
      const { data: ncrNumResult, error: ncrNumError } = await supabase
        .rpc('next_ncr_number', { p_company_id: getEffectiveCompanyId() })

      if (ncrNumError) throw ncrNumError
      const ncrNumber = ncrNumResult

      const { error } = await supabase
        .from('ncrs')
        .insert([{
          company_id: getEffectiveCompanyId(),
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
          due_date: formData.due_date || null,
          root_cause: formData.root_cause?.trim() || null,
          corrective_action: formData.corrective_action?.trim() || null,
        }])

      if (error) throw error

      toast.success(`NCR ${ncrNumber} raised. You can fill in root cause and corrective action later from the View screen.`)
      clearDraft()
      onCreated()
    } catch (err) {
      console.error('Error creating NCR:', err)
      toast.error('Failed to create NCR. Please check all fields and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="glass glass-border rounded-2xl p-4 md:p-6 max-w-sm md:max-w-2xl w-full mx-4 md:mx-auto max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl md:text-2xl font-bold text-white mb-2">Raise New NCR</h3>
        <p className="text-white/50 text-sm mb-4 md:mb-6">
          Capture the nonconformance now. Root cause and corrective action can be added later from the NCR detail view, after investigation.
        </p>

        {restored && (
          <div className={DRAFT_NOTICE_CLASS}>
            <svg className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-amber-200 text-xs">Your previous NCR draft was restored. Edit or click Cancel to discard.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="ncr-title" className="text-sm text-white/60 block mb-2">Title *</label>
            <input
              id="ncr-title"
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 glass glass-border rounded-lg text-white bg-transparent"
              placeholder="Brief description of non-conformance"
            />
          </div>

          <div>
            <label htmlFor="ncr-description" className="text-sm text-white/60 block mb-2">Description *</label>
            <textarea
              id="ncr-description"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 glass glass-border rounded-lg text-white bg-transparent"
              rows="3"
              placeholder="Detailed description..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="ncr-standard" className="text-sm text-white/60 block mb-2">Standard *</label>
              <select
                id="ncr-standard"
                required
                value={formData.standard}
                onChange={(e) => setFormData({ ...formData, standard: e.target.value })}
                className="w-full px-4 py-2 glass glass-border rounded-lg text-white bg-transparent"
              >
                {(userProfile?.standards_access || ['ISO_9001']).map(std => (
                  <option key={std} value={std} className="bg-slate-800">
                    {std.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="ncr-clause" className="text-sm text-white/60 block mb-2">Clause *</label>
              <select
                id="ncr-clause"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="ncr-severity" className="text-sm text-white/60 block mb-2">Severity *</label>
              <select
                id="ncr-severity"
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
              <label htmlFor="ncr-due-date" className="text-sm text-white/60 block mb-2">Due Date *</label>
              <input
                id="ncr-due-date"
                type="date"
                required
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-4 py-2 glass glass-border rounded-lg text-white bg-transparent"
              />
            </div>
          </div>

          <div>
            <label htmlFor="ncr-root-cause" className="text-sm text-white/60 block mb-2">
              Root Cause <span className="text-white/40">(optional — add after investigation, ISO §10.2)</span>
            </label>
            <textarea
              id="ncr-root-cause"
              value={formData.root_cause}
              onChange={(e) => setFormData({ ...formData, root_cause: e.target.value })}
              className="w-full px-4 py-2 glass glass-border rounded-lg text-white bg-transparent"
              rows="2"
              placeholder="e.g. 5-Whys analysis result. Leave blank if not yet investigated."
            />
          </div>

          <div>
            <label htmlFor="ncr-corrective-action" className="text-sm text-white/60 block mb-2">
              Corrective Action <span className="text-white/40">(optional — add when planned, ISO §10.2)</span>
            </label>
            <textarea
              id="ncr-corrective-action"
              value={formData.corrective_action}
              onChange={(e) => setFormData({ ...formData, corrective_action: e.target.value })}
              className="w-full px-4 py-2 glass glass-border rounded-lg text-white bg-transparent"
              rows="2"
              placeholder="e.g. 1. Recalibrate gauge G-12. 2. Implement digital reminder schedule."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg disabled:opacity-50"
            >
              {submitting ? 'Raising...' : 'Raise NCR'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
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

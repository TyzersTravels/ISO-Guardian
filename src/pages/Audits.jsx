import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { logActivity } from '../lib/auditLogger'
import Layout from '../components/Layout'

const Audits = () => {
  const { userProfile } = useAuth()
  const [audits, setAudits] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedAudit, setSelectedAudit] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    fetchAudits()
  }, [])

  const fetchAudits = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('audits')
        .select('*')
        .order('audit_date', { ascending: true })

      if (error) throw error
      setAudits(data || [])
    } catch (err) {
      console.error('Error fetching audits:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateAuditStatus = async (id, newStatus) => {
    try {
      const { error } = await supabase
        .from('audits')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
      await logActivity({ companyId: userProfile.company_id, userId: userProfile.id, action: 'status_changed', entityType: 'audit', entityId: id, changes: { new_status: newStatus } })
      fetchAudits()
    } catch (err) {
      console.error('Error updating audit:', err)
      alert('Failed to update audit')
    }
  }

  const deleteAudit = async (auditId, permanent = false) => {
    const confirmMsg = permanent 
      ? 'âš ï¸ PERMANENTLY DELETE this audit? This cannot be undone.'
      : 'Archive this audit? It can be restored later.'
    
    if (!confirm(confirmMsg)) return

    try {
      if (permanent) {
        const reason = window.prompt('Deletion reason (required for audit trail):')
        if (!reason?.trim()) { alert('Deletion reason is required'); return; }
        
        await supabase.from('deletion_audit_trail').insert([{
          company_id: userProfile.company_id,
          table_name: 'audits',
          record_id: auditId,
          deleted_by: userProfile.id,
          deleted_at: new Date().toISOString(),
          reason: reason.trim()
        }])
        
        const { error } = await supabase.from('audits').delete().eq('id', auditId)
        if (error) throw error
        alert('Audit permanently deleted.')
      } else {
        const { error } = await supabase.from('audits').update({ archived: true }).eq('id', auditId)
        if (error) throw error
        alert('Audit archived successfully.')
      }

      fetchAudits()
      setSelectedAudit(null)
    } catch (err) {
      console.error('Error deleting audit:', err)
      alert('Failed to delete audit: ' + err.message)
    }
  }

  const restoreAudit = async (auditId) => {
    try {
      const { error } = await supabase.from('audits').update({ archived: false }).eq('id', auditId)
      if (error) throw error
      alert('Audit restored.')
      fetchAudits()
    } catch (err) {
      console.error('Error restoring audit:', err)
      alert('Failed to restore audit: ' + err.message)
    }
  }

  const exportAudit = async (audit) => {
    try {
      const { default: jsPDF } = await import('jspdf')
      const doc = new jsPDF('p', 'mm', 'a4')
      const pw = doc.internal.pageSize.getWidth()
      const ph = doc.internal.pageSize.getHeight()
      const m = 20
      const cw = pw - m * 2

      // Load BOTH logos
      let companyLogo = null
      let igLogo = null
      const loadImg = async (url) => { try { const resp = await fetch(url); const bl = await resp.blob(); return await new Promise(r => { const rd = new FileReader(); rd.onload = () => r(rd.result); rd.readAsDataURL(bl); }); } catch(e) { return null; } }
      const companyLogoUrl = userProfile?.company?.logo_url
      if (companyLogoUrl) companyLogo = await loadImg(companyLogoUrl)
      igLogo = await loadImg('/isoguardian-logo.png')
      const companyCode = userProfile?.company?.company_code || 'XX'
      const companyName = userProfile?.company?.name || 'Company'

      const addHF = (pg) => {
        doc.setFillColor(124, 58, 237); doc.rect(0, 0, pw, 30, 'F')
        if (companyLogo) try { doc.addImage(companyLogo, 'PNG', m, 2, 26, 26) } catch(e) {}
        doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(255, 255, 255)
        doc.text(companyName, companyLogo ? m + 30 : m, 13)
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(220, 220, 255)
        doc.text('Integrated Management System', companyLogo ? m + 30 : m, 19)
        if (igLogo) try { doc.addImage(igLogo, 'PNG', pw - m - 10, 5, 8, 8) } catch(e) {}
        doc.setFontSize(5); doc.setTextColor(200, 200, 255)
        doc.text('Powered by ISOGuardian', pw - m, 17, { align: 'right' })
        doc.text(`Page ${pg}`, pw - m, 26, { align: 'right' })
        doc.setDrawColor(124, 58, 237); doc.line(m, ph - 13, pw - m, ph - 13)
        doc.setFontSize(6); doc.setTextColor(107, 114, 128)
        doc.text(`${companyName} | ISOGuardian (Pty) Ltd | Reg: 2026/082362/07`, m, ph - 9)
        doc.text(`Printed: ${new Date().toLocaleDateString('en-ZA')} | CONFIDENTIAL`, pw - m, ph - 9, { align: 'right' })
      }

      addHF(1)

      // Doc control
      const docNum = `IG-${companyCode}-AUD-${String(audit.audit_number || '').replace(/\D/g, '').slice(-3).padStart(3, '0')}`
      doc.setFillColor(249, 250, 251); doc.rect(m, 33, cw, 14, 'F')
      doc.setDrawColor(200, 200, 200); doc.rect(m, 33, cw, 14, 'S')
      const cl = cw / 3
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(30, 27, 75)
      doc.text('Document No.', m + 3, 38); doc.text('Revision', m + cl + 3, 38); doc.text('Date of Review', m + cl * 2 + 3, 38)
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(124, 58, 237)
      doc.text(docNum, m + 3, 44); doc.text('Rev 01', m + cl + 3, 44); doc.text('31 January 2027', m + cl * 2 + 3, 44)
      doc.line(m + cl, 33, m + cl, 47); doc.line(m + cl * 2, 33, m + cl * 2, 47)

      let y = 54
      doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(30, 27, 75)
      doc.text('AUDIT REPORT', m, y); y += 6
      doc.setFontSize(9); doc.setTextColor(107, 114, 128); doc.setFont('helvetica', 'normal')
      doc.text(`Company: ${companyName}`, m, y); y += 4
      doc.text(`Generated: ${new Date().toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' })}`, m, y); y += 6
      doc.setDrawColor(124, 58, 237); doc.setLineWidth(0.5); doc.line(m, y, pw - m, y); y += 6

      const lbl = (l, v, yp) => { doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(107, 114, 128); doc.text(l + ':', m, yp); doc.setFont('helvetica', 'normal'); doc.setTextColor(30, 27, 75); doc.text(String(v || 'N/A'), m + doc.getTextWidth(l + ': ') + 2, yp); return yp + 5; }
      const sc = (t, yp) => { if (yp > ph - 35) { doc.addPage(); addHF(doc.getNumberOfPages()); yp = 40; } doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(124, 58, 237); doc.text(t, m, yp); return yp + 6; }
      const bd = (t, yp) => { doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(30, 27, 75); const ls = doc.splitTextToSize(String(t || ''), cw); if (yp + ls.length * 4 > ph - 30) { doc.addPage(); addHF(doc.getNumberOfPages()); yp = 40; } doc.text(ls, m, yp); return yp + ls.length * 4 + 3; }

      y = sc('Audit Details', y)
      y = lbl('Audit Number', audit.audit_number, y)
      y = lbl('Audit Type', audit.audit_type, y)
      y = lbl('Standard', audit.standard?.replace('_', ' '), y)
      y = lbl('Status', audit.status, y)
      y = lbl('Audit Date', audit.audit_date ? new Date(audit.audit_date).toLocaleDateString('en-ZA') : 'N/A', y)
      y = lbl('Audit Time', audit.audit_time || 'Not specified', y)
      y = lbl('Lead Auditor', audit.assigned_auditor_name || audit.auditor, y)
      y += 3

      if (audit.scope) { y = sc('Audit Scope', y); y = bd(audit.scope, y); }
      if (audit.findings) { y = sc('Audit Findings (ISO 19011:6.5)', y); y = bd(audit.findings, y); }
      if (audit.observations) { y = sc('Observations', y); y = bd(audit.observations, y); }
      if (audit.ncrs_raised) { y = lbl('NCRs Raised', audit.ncrs_raised, y); y += 2; }
      if (audit.evidence_reviewed) { y = sc('Evidence Reviewed', y); y = bd(audit.evidence_reviewed, y); }
      if (audit.corrective_actions) { y = sc('Corrective Actions Required', y); y = bd(audit.corrective_actions, y); }

      // Signatures
      if (y > ph - 55) { doc.addPage(); addHF(doc.getNumberOfPages()); y = 40; }
      y += 4; y = sc('Signatures', y)
      const sw = (cw - 20) / 3
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(30, 27, 75)

      // Lead Auditor
      doc.text('Lead Auditor:', m, y); doc.line(m, y + 10, m + sw, y + 10)
      doc.setFontSize(7); doc.setTextColor(107, 114, 128)
      doc.text('Signature', m, y + 14)
      doc.text('Name: ' + (audit.assigned_auditor_name || audit.auditor || '________'), m, y + 19)
      doc.text('Date: ________', m, y + 24)

      // Auditee Representative
      doc.setFontSize(8); doc.setTextColor(30, 27, 75)
      doc.text('Auditee Rep:', m + sw + 10, y); doc.line(m + sw + 10, y + 10, m + sw * 2 + 10, y + 10)
      doc.setFontSize(7); doc.setTextColor(107, 114, 128)
      doc.text('Signature', m + sw + 10, y + 14)
      doc.text('Name: ________', m + sw + 10, y + 19)
      doc.text('Date: ________', m + sw + 10, y + 24)

      // Management Rep
      doc.setFontSize(8); doc.setTextColor(30, 27, 75)
      doc.text('Management Rep:', m + sw * 2 + 20, y); doc.line(m + sw * 2 + 20, y + 10, pw - m, y + 10)
      doc.setFontSize(7); doc.setTextColor(107, 114, 128)
      doc.text('Signature', m + sw * 2 + 20, y + 14)
      doc.text('Name: ________', m + sw * 2 + 20, y + 19)
      doc.text('Date: ________', m + sw * 2 + 20, y + 24)

      doc.save(`${audit.audit_number || 'AUD'}_Audit_Report.pdf`)
    } catch (err) {
      console.error('Export error:', err)
      alert('Export failed: ' + err.message)
    }
  }

  const filteredAudits = audits.filter(audit => {
    if (filterStatus === 'Archived') return audit.archived === true
    if (audit.archived) return false
    if (filterStatus === 'all') return true
    return audit.status === filterStatus
  })

  const activeAudits = audits.filter(a => !a.archived)
  const upcomingAudits = filteredAudits.filter(a => a.status === 'Planned')
  const inProgressAudits = filteredAudits.filter(a => a.status === 'In Progress')
  const pastAudits = filteredAudits.filter(a => a.status === 'Complete')
  const archivedCount = audits.filter(a => a.archived).length

  if (loading) {
    return (
      <Layout>
        <div className="text-white text-center py-12">Loading audits...</div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Audit Schedule</h2>
            <p className="text-cyan-200 text-sm">{filteredAudits.length} audits {filterStatus === 'Archived' ? '(archived)' : ''}</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-semibold"
          >
            + Schedule Audit
          </button>
        </div>

        {/* Filter */}
        <div className="glass glass-border rounded-lg p-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 glass glass-border rounded-lg text-white bg-transparent"
          >
            <option value="all" className="bg-slate-800">All Audits</option>
            <option value="Planned" className="bg-slate-800">Planned</option>
            <option value="In Progress" className="bg-slate-800">In Progress</option>
            <option value="Complete" className="bg-slate-800">Complete</option>
            <option value="Cancelled" className="bg-slate-800">Cancelled</option>
            <option value="Archived" className="bg-slate-800">Archived</option>
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="glass glass-border rounded-lg p-4">
            <div className="text-3xl font-bold text-cyan-400">{activeAudits.filter(a => a.status === 'Planned').length}</div>
            <div className="text-sm text-white/70">Planned</div>
          </div>
          <div className="glass glass-border rounded-lg p-4">
            <div className="text-3xl font-bold text-green-400">{activeAudits.filter(a => a.status === 'Complete').length}</div>
            <div className="text-sm text-white/70">Completed</div>
          </div>
          <div className="glass glass-border rounded-lg p-4">
            <div className="text-3xl font-bold text-orange-400">{activeAudits.filter(a => a.status === 'In Progress').length}</div>
            <div className="text-sm text-white/70">In Progress</div>
          </div>
          <div className="glass glass-border rounded-lg p-4">
            <div className="text-3xl font-bold text-white/40">{archivedCount}</div>
            <div className="text-sm text-white/70">Archived</div>
          </div>
        </div>

        {/* Planned Audits */}
        {upcomingAudits.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-white mb-3">Planned Audits</h3>
            <div className="space-y-3">
              {upcomingAudits.map(audit => (
                <AuditCard
                  key={audit.id}
                  audit={audit}
                  onClick={() => setSelectedAudit(audit)}
                />
              ))}
            </div>
          </div>
        )}

        {/* In Progress Audits */}
        {inProgressAudits.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-white mb-3">In Progress Audits</h3>
            <div className="space-y-3">
              {inProgressAudits.map(audit => (
                <AuditCard
                  key={audit.id}
                  audit={audit}
                  onClick={() => setSelectedAudit(audit)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Past Audits */}
        {pastAudits.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-white mb-3">Completed Audits</h3>
            <div className="space-y-3">
              {pastAudits.map(audit => (
                <AuditCard
                  key={audit.id}
                  audit={audit}
                  onClick={() => setSelectedAudit(audit)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Archived Audits */}
        {filterStatus === 'Archived' && filteredAudits.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-white/60 mb-3">Archived Audits</h3>
            <div className="space-y-3">
              {filteredAudits.map(audit => (
                <AuditCard
                  key={audit.id}
                  audit={audit}
                  onClick={() => setSelectedAudit(audit)}
                  isArchived
                />
              ))}
            </div>
          </div>
        )}

        {filteredAudits.length === 0 && (
          <div className="glass glass-border rounded-lg p-8 text-center text-white/60">
            No audits found
          </div>
        )}

        {/* Audit Details Modal */}
        {selectedAudit && (
          <AuditDetailsModal
            audit={selectedAudit}
            onClose={() => setSelectedAudit(null)}
            onUpdateStatus={updateAuditStatus}
            onDelete={deleteAudit}
            onRestore={restoreAudit}
            exportAudit={exportAudit}
            userProfile={userProfile}
          />
        )}

        {/* Create Audit Form */}
        {showCreateForm && (
          <CreateAuditForm
            userProfile={userProfile}
            onClose={() => setShowCreateForm(false)}
            onCreated={() => {
              fetchAudits()
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

const AuditCard = ({ audit, onClick, isArchived }) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-ZA', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const statusColors = {
    'Planned': 'bg-blue-500/20 text-blue-300',
    'In Progress': 'bg-orange-500/20 text-orange-300',
    'Complete': 'bg-green-500/20 text-green-300',
    'Cancelled': 'bg-red-500/20 text-red-300'
  }

  const typeColors = {
    'Internal': 'bg-cyan-500/20 text-cyan-300',
    'External': 'bg-purple-500/20 text-purple-300',
    'Surveillance': 'bg-yellow-500/20 text-yellow-300',
    'Certification': 'bg-pink-500/20 text-pink-300'
  }

  return (
    <div
      onClick={onClick}
      className={`glass glass-border rounded-lg p-4 hover:bg-white/5 cursor-pointer ${isArchived ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-cyan-400 text-sm">{audit.audit_number}</span>
            <span className={`text-xs px-2 py-1 rounded ${typeColors[audit.audit_type]}`}>
              {audit.audit_type}
            </span>
            <span className={`text-xs px-2 py-1 rounded ${isArchived ? 'bg-gray-500/20 text-gray-300' : statusColors[audit.status]}`}>
              {isArchived ? 'Archived' : audit.status}
            </span>
          </div>
          <div className="font-semibold text-white mb-1">{audit.standard.replace('_', ' ')}</div>
          <div className="text-sm text-white/60 mb-2">{audit.scope}</div>
          <div className="flex items-center gap-4 text-xs text-white/50">
            <span>ðŸ“… {formatDate(audit.audit_date)}</span>
            {audit.audit_time && <span>ðŸ• {audit.audit_time}</span>}
            <span>ðŸ‘¤ {audit.assigned_auditor_name}</span>
            {audit.reminder_method !== 'none' && (
              <span>ðŸ”” {audit.reminder_method}</span>
            )}
          </div>
        </div>
        <button className="text-cyan-400 text-sm hover:underline">View â†’</button>
      </div>
    </div>
  )
}

const AuditDetailsModal = ({ audit, onClose, onUpdateStatus, onDelete, onRestore, exportAudit, userProfile }) => {
  const [showCompleteForm, setShowCompleteForm] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [closeOut, setCloseOut] = useState({
    findings: audit.findings || '',
    observations: audit.observations || '',
    ncrs_raised: audit.ncrs_raised || '0',
    conclusion: '',
    evidence_reviewed: '',
    corrective_actions: '',
    auditor_recommendation: 'Conforming',
  })

  const handleCompleteAudit = async () => {
    // Validate required fields
    if (!closeOut.findings?.trim()) { alert('Findings are required to close an audit (ISO 19011:2018 Clause 6.5)'); return; }
    if (!closeOut.conclusion?.trim()) { alert('Audit conclusion is required'); return; }
    if (!closeOut.evidence_reviewed?.trim()) { alert('Evidence reviewed must be documented'); return; }

    setCompleting(true)
    try {
      const { error } = await supabase
        .from('audits')
        .update({
          status: 'Complete',
          findings: closeOut.findings.trim(),
          observations: closeOut.observations?.trim() || null,
          ncrs_raised: parseInt(closeOut.ncrs_raised) || 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', audit.id)

      if (error) throw error
      alert('Audit completed with findings recorded.')
      onClose()
      // Trigger parent refresh
      if (onUpdateStatus) onUpdateStatus(audit.id, 'Complete')
    } catch (err) {
      console.error('Error completing audit:', err)
      alert('Failed to complete: ' + err.message)
    } finally {
      setCompleting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900/95 backdrop-blur-xl rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/20 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white">{audit.audit_number}</h3>
          <button onClick={onClose} className="text-white/60 hover:text-white">âœ•</button>
        </div>

        <div className="space-y-4">
          {/* Audit Info */}
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm text-white/60">Type</label><div className="text-white">{audit.audit_type}</div></div>
            <div><label className="text-sm text-white/60">Standard</label><div className="text-white">{audit.standard?.replace('_', ' ')}</div></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm text-white/60">Date</label><div className="text-white">{new Date(audit.audit_date).toLocaleDateString('en-ZA')}</div></div>
            <div><label className="text-sm text-white/60">Time</label><div className="text-white">{audit.audit_time || 'Not set'}</div></div>
          </div>
          <div><label className="text-sm text-white/60">Auditor</label><div className="text-white">{audit.assigned_auditor_name}</div></div>
          <div><label className="text-sm text-white/60">Scope</label><div className="text-white/80 glass glass-border rounded-lg p-3">{audit.scope || 'No scope defined'}</div></div>

          {/* Show existing findings if completed */}
          {audit.status === 'Complete' && audit.findings && (
            <>
              <div className="border-t border-white/10 pt-4">
                <h4 className="text-lg font-semibold text-green-400 mb-3">Audit Close-Out Report</h4>
              </div>
              <div><label className="text-sm text-white/60">Findings (ISO 19011:6.5)</label><div className="text-white/80 glass glass-border rounded-lg p-3 whitespace-pre-wrap">{audit.findings}</div></div>
              {audit.observations && <div><label className="text-sm text-white/60">Observations</label><div className="text-white/80 glass glass-border rounded-lg p-3 whitespace-pre-wrap">{audit.observations}</div></div>}
              <div><label className="text-sm text-white/60">NCRs Raised</label><div className="text-white">{audit.ncrs_raised || 0}</div></div>
            </>
          )}

          {/* Complete Audit Form - ISO 19011 compliant */}
          {showCompleteForm && audit.status === 'In Progress' && (
            <div className="border-t border-white/10 pt-4 space-y-4">
              <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-3">
                <p className="text-xs text-cyan-300 font-semibold">ISO 19011:2018 Clause 6.5 â€” Audit Close-Out Requirements</p>
                <p className="text-xs text-cyan-300/70 mt-1">All findings, evidence, and conclusions must be documented before closing an audit.</p>
              </div>

              <div>
                <label className="text-sm text-white/60 block mb-2">Audit Findings * <span className="text-white/40">(Conformities & non-conformities identified)</span></label>
                <textarea value={closeOut.findings} onChange={e => setCloseOut({...closeOut, findings: e.target.value})}
                  rows={4} placeholder="Document all findings from the audit â€” what was conforming, what was not, specific clause references..."
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-cyan-500" />
              </div>

              <div>
                <label className="text-sm text-white/60 block mb-2">Observations <span className="text-white/40">(Opportunities for improvement, not NCRs)</span></label>
                <textarea value={closeOut.observations} onChange={e => setCloseOut({...closeOut, observations: e.target.value})}
                  rows={3} placeholder="Any observations or recommendations for improvement..."
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-cyan-500" />
              </div>

              <div>
                <label className="text-sm text-white/60 block mb-2">Evidence Reviewed * <span className="text-white/40">(Documents, records, interviews)</span></label>
                <textarea value={closeOut.evidence_reviewed} onChange={e => setCloseOut({...closeOut, evidence_reviewed: e.target.value})}
                  rows={3} placeholder="List documents reviewed, people interviewed, processes observed..."
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-cyan-500" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-white/60 block mb-2">NCRs Raised</label>
                  <input type="number" min="0" value={closeOut.ncrs_raised} onChange={e => setCloseOut({...closeOut, ncrs_raised: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-cyan-500" />
                </div>
                <div>
                  <label className="text-sm text-white/60 block mb-2">Auditor Recommendation</label>
                  <select value={closeOut.auditor_recommendation} onChange={e => setCloseOut({...closeOut, auditor_recommendation: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-cyan-500">
                    <option value="Conforming" className="bg-slate-800">Conforming â€” No major issues</option>
                    <option value="Minor NCR" className="bg-slate-800">Minor NCR â€” Corrective action needed</option>
                    <option value="Major NCR" className="bg-slate-800">Major NCR â€” Significant non-conformance</option>
                    <option value="Critical" className="bg-slate-800">Critical â€” Immediate action required</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm text-white/60 block mb-2">Audit Conclusion * <span className="text-white/40">(Overall assessment)</span></label>
                <textarea value={closeOut.conclusion} onChange={e => setCloseOut({...closeOut, conclusion: e.target.value})}
                  rows={3} placeholder="Overall conclusion of the audit â€” extent to which audit criteria have been fulfilled..."
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-cyan-500" />
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowCompleteForm(false)}
                  className="flex-1 py-3 px-6 glass glass-border text-white rounded-lg hover:bg-white/10">Cancel</button>
                <button onClick={handleCompleteAudit} disabled={completing}
                  className="flex-1 py-3 px-6 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg disabled:opacity-50">
                  {completing ? 'Completing...' : 'Submit & Complete Audit'}
                </button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          {!showCompleteForm && (
            <div className="flex gap-3 flex-wrap pt-4">
              {!audit.archived && audit.status === 'Planned' && (
                <button onClick={() => onUpdateStatus(audit.id, 'In Progress')}
                  className="py-3 px-6 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg">Start Audit</button>
              )}
              {!audit.archived && audit.status === 'In Progress' && (
                <button onClick={() => setShowCompleteForm(true)}
                  className="py-3 px-6 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg">Complete Audit</button>
              )}
              <button onClick={() => exportAudit(audit)}
                className="py-3 px-6 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Export
              </button>
              {audit.archived ? (
                <button onClick={() => onRestore(audit.id)} className="py-3 px-6 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg">Restore</button>
              ) : (
                <button onClick={() => onDelete(audit.id)} className="py-3 px-6 bg-orange-500/80 hover:bg-orange-600 text-white font-semibold rounded-lg">Archive</button>
              )}
              {['superadmin', 'admin', 'lead_auditor'].includes(userProfile?.role) && (
                <button onClick={() => onDelete(audit.id, true)} className="py-3 px-6 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg">Delete Forever</button>
              )}
              <button onClick={onClose} className="py-3 px-6 glass glass-border text-white font-semibold rounded-lg hover:bg-white/10">Close</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const CreateAuditForm = ({ userProfile, onClose, onCreated }) => {
  const [formData, setFormData] = useState({
    audit_type: 'Internal',
    standard: (userProfile?.standards_access || ['ISO_9001'])[0] || 'ISO_9001',
    audit_date: '',
    audit_time: '',
    assigned_auditor_name: '',
    scope: '',
    reminder_method: 'email'
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const { count } = await supabase
        .from('audits')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', userProfile.company_id)

      const nextNumber = (count || 0) + 1
      const year = new Date().getFullYear()
      const auditNumber = `AUD-${year}-${String(nextNumber).padStart(3, '0')}`

      const { error } = await supabase
        .from('audits')
        .insert([{
          company_id: userProfile.company_id,
          audit_number: auditNumber,
          audit_type: formData.audit_type,
          standard: formData.standard,
          audit_date: formData.audit_date,
          audit_time: formData.audit_time || null,
          assigned_auditor_name: formData.assigned_auditor_name,
          scope: formData.scope,
          status: 'Planned',
          reminder_method: formData.reminder_method,
          created_by: userProfile.id
        }])

      if (error) throw error

      alert('Audit scheduled successfully!')
      onCreated()
    } catch (err) {
      console.error('Error creating audit:', err)
      alert('Failed to schedule audit: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="glass glass-border rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold text-white mb-6">Schedule New Audit</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-white/60 block mb-2">Audit Type *</label>
              <select
                required
                value={formData.audit_type}
                onChange={(e) => setFormData({ ...formData, audit_type: e.target.value })}
                className="w-full px-4 py-2 glass glass-border rounded-lg text-white bg-transparent"
              >
                <option value="Internal" className="bg-slate-800">Internal</option>
                <option value="External" className="bg-slate-800">External</option>
                <option value="Surveillance" className="bg-slate-800">Surveillance</option>
                <option value="Certification" className="bg-slate-800">Certification</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-white/60 block mb-2">Standard *</label>
              <select
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-white/60 block mb-2">Audit Date *</label>
              <input
                type="date"
                required
                value={formData.audit_date}
                onChange={(e) => setFormData({ ...formData, audit_date: e.target.value })}
                className="w-full px-4 py-2 glass glass-border rounded-lg text-white bg-transparent"
              />
            </div>

            <div>
              <label className="text-sm text-white/60 block mb-2">Audit Time</label>
              <input
                type="time"
                value={formData.audit_time}
                onChange={(e) => setFormData({ ...formData, audit_time: e.target.value })}
                className="w-full px-4 py-2 glass glass-border rounded-lg text-white bg-transparent"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-white/60 block mb-2">Assigned Auditor *</label>
            <input
              type="text"
              required
              value={formData.assigned_auditor_name}
              onChange={(e) => setFormData({ ...formData, assigned_auditor_name: e.target.value })}
              className="w-full px-4 py-2 glass glass-border rounded-lg text-white bg-transparent"
              placeholder="e.g., John Smith or TUV Auditor"
            />
          </div>

          <div>
            <label className="text-sm text-white/60 block mb-2">Audit Scope *</label>
            <textarea
              required
              value={formData.scope}
              onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
              className="w-full px-4 py-2 glass glass-border rounded-lg text-white bg-transparent"
              rows="3"
              placeholder="Describe what will be audited..."
            />
          </div>

          <div>
            <label className="text-sm text-white/60 block mb-2">Reminder Method *</label>
            <select
              required
              value={formData.reminder_method}
              onChange={(e) => setFormData({ ...formData, reminder_method: e.target.value })}
              className="w-full px-4 py-2 glass glass-border rounded-lg text-white bg-transparent"
            >
              <option value="email" className="bg-slate-800">Email</option>
              <option value="whatsapp" className="bg-slate-800">WhatsApp</option>
              <option value="both" className="bg-slate-800">Both</option>
              <option value="none" className="bg-slate-800">No Reminder</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg disabled:opacity-50"
            >
              {submitting ? 'Scheduling...' : 'Schedule Audit'}
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

export default Audits

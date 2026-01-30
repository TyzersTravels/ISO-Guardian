import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
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
      fetchAudits()
      setSelectedAudit(null)
      alert(`Audit status updated to: ${newStatus}`)
    } catch (err) {
      console.error('Error updating audit:', err)
      alert('Failed to update audit')
    }
  }

  const exportAudit = (audit) => {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Calibri, Arial, sans-serif; margin: 2cm; }
    h1 { color: #0066cc; text-align: center; border-bottom: 3px solid #0066cc; padding-bottom: 10px; }
    h2 { color: #0066cc; margin-top: 25px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
    .header { background: #f0f0f0; padding: 15px; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    td { padding: 8px; border: 1px solid #ddd; }
    .label { font-weight: bold; background: #f8f8f8; width: 40%; }
    .section { margin: 20px 0; }
    .findings { background: #fafafa; padding: 15px; border-left: 4px solid #ff9800; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 2px solid #ddd; font-size: 10pt; color: #666; text-align: center; }
  </style>
</head>
<body>
  <h1>AUDIT REPORT</h1>
  
  <div class="header">
    <table>
      <tr>
        <td class="label">Audit Number:</td>
        <td>${audit.audit_number}</td>
      </tr>
      <tr>
        <td class="label">Audit Type:</td>
        <td>${audit.audit_type}</td>
      </tr>
      <tr>
        <td class="label">Standard:</td>
        <td>${audit.standard.replace('_', ' ')}</td>
      </tr>
      <tr>
        <td class="label">Status:</td>
        <td><strong>${audit.status}</strong></td>
      </tr>
    </table>
  </div>

  <div class="section">
    <h2>Audit Details</h2>
    <table>
      <tr>
        <td class="label">Audit Date:</td>
        <td>${new Date(audit.audit_date).toLocaleDateString()}</td>
      </tr>
      <tr>
        <td class="label">Audit Time:</td>
        <td>${audit.audit_time || 'Not specified'}</td>
      </tr>
      <tr>
        <td class="label">Auditor:</td>
        <td>${audit.auditor}</td>
      </tr>
      <tr>
        <td class="label">Scope:</td>
        <td>${audit.scope}</td>
      </tr>
    </table>
  </div>

  ${audit.findings ? `
  <div class="section">
    <h2>Audit Findings</h2>
    <div class="findings">${audit.findings}</div>
  </div>
  ` : `
  <div class="section">
    <h2>Audit Findings</h2>
    <p><em>No findings recorded yet. This section will be completed after the audit.</em></p>
  </div>
  `}

  ${audit.ncrs_raised ? `
  <div class="section">
    <h2>NCRs Raised</h2>
    <p>${audit.ncrs_raised}</p>
  </div>
  ` : ''}

  <div class="footer">
    <p><strong>Export Information:</strong></p>
    <p>Exported by: ${userProfile.email}</p>
    <p>Export date: ${new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })}</p>
    <p>Company: ${userProfile.company?.name || 'N/A'}</p>
    <p style="margin-top: 10px; font-style: italic;">ISOGuardian - POPIA Compliant Export</p>
  </div>
</body>
</html>
`

    const blob = new Blob([html], { type: 'application/msword' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${audit.audit_number}_Report.doc`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const filteredAudits = audits.filter(audit => {
    if (filterStatus === 'all') return true
    return audit.status === filterStatus
  })

  // Show all Planned audits (don't filter by date - some might be in the past)
  const upcomingAudits = filteredAudits.filter(a => a.status === 'Planned')
  const inProgressAudits = filteredAudits.filter(a => a.status === 'In Progress')
  const pastAudits = filteredAudits.filter(a => a.status === 'Complete')

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
            <p className="text-cyan-200 text-sm">{upcomingAudits.length} planned audits</p>
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
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="glass glass-border rounded-lg p-4">
            <div className="text-3xl font-bold text-cyan-400">{upcomingAudits.length}</div>
            <div className="text-sm text-white/70">Planned</div>
          </div>
          <div className="glass glass-border rounded-lg p-4">
            <div className="text-3xl font-bold text-green-400">{pastAudits.length}</div>
            <div className="text-sm text-white/70">Completed</div>
          </div>
          <div className="glass glass-border rounded-lg p-4">
            <div className="text-3xl font-bold text-orange-400">{inProgressAudits.length}</div>
            <div className="text-sm text-white/70">In Progress</div>
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

const AuditCard = ({ audit, onClick }) => {
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
      className="glass glass-border rounded-lg p-4 hover:bg-white/5 cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-cyan-400 text-sm">{audit.audit_number}</span>
            <span className={`text-xs px-2 py-1 rounded ${typeColors[audit.audit_type]}`}>
              {audit.audit_type}
            </span>
            <span className={`text-xs px-2 py-1 rounded ${statusColors[audit.status]}`}>
              {audit.status}
            </span>
          </div>
          <div className="font-semibold text-white mb-1">{audit.standard.replace('_', ' ')}</div>
          <div className="text-sm text-white/60 mb-2">{audit.scope}</div>
          <div className="flex items-center gap-4 text-xs text-white/50">
            <span>📅 {formatDate(audit.audit_date)}</span>
            {audit.audit_time && <span>🕐 {audit.audit_time}</span>}
            <span>👤 {audit.assigned_auditor_name}</span>
            {audit.reminder_method !== 'none' && (
              <span>🔔 {audit.reminder_method}</span>
            )}
          </div>
        </div>
        <button className="text-cyan-400 text-sm hover:underline">View →</button>
      </div>
    </div>
  )
}

const AuditDetailsModal = ({ audit, onClose, onUpdateStatus, exportAudit, userProfile }) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900/95 backdrop-blur-xl rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/20 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white">{audit.audit_number}</h3>
          <button onClick={onClose} className="text-white/60 hover:text-white">✕</button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-white/60">Type</label>
              <div className="text-white">{audit.audit_type}</div>
            </div>
            <div>
              <label className="text-sm text-white/60">Standard</label>
              <div className="text-white">{audit.standard.replace('_', ' ')}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-white/60">Date</label>
              <div className="text-white">{new Date(audit.audit_date).toLocaleDateString()}</div>
            </div>
            <div>
              <label className="text-sm text-white/60">Time</label>
              <div className="text-white">{audit.audit_time || 'Not set'}</div>
            </div>
          </div>

          <div>
            <label className="text-sm text-white/60">Auditor</label>
            <div className="text-white">{audit.assigned_auditor_name}</div>
          </div>

          <div>
            <label className="text-sm text-white/60">Scope</label>
            <div className="text-white/80 glass glass-border rounded-lg p-3">
              {audit.scope || 'No scope defined'}
            </div>
          </div>

          {audit.findings && (
            <div>
              <label className="text-sm text-white/60">Findings</label>
              <div className="text-white/80 glass glass-border rounded-lg p-3">
                {audit.findings}
              </div>
            </div>
          )}

          <div>
            <label className="text-sm text-white/60">Reminder Method</label>
            <div className="text-white capitalize">{audit.reminder_method}</div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-4">
            {audit.status === 'Planned' && (
              <button
                onClick={() => onUpdateStatus(audit.id, 'In Progress')}
                className="py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg"
              >
                Start Audit
              </button>
            )}
            {audit.status === 'In Progress' && (
              <button
                onClick={() => onUpdateStatus(audit.id, 'Complete')}
                className="py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg"
              >
                Complete Audit
              </button>
            )}
            <button
              onClick={() => exportAudit(audit)}
              className="py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
            </button>
            <button
              onClick={onClose}
              className="py-3 glass glass-border text-white font-semibold rounded-lg hover:bg-white/10"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const CreateAuditForm = ({ userProfile, onClose, onCreated }) => {
  const [formData, setFormData] = useState({
    audit_type: 'Internal',
    standard: (userProfile?.standards_access || ["ISO_9001", "ISO_14001", "ISO_45001"])[0] || 'ISO_9001',
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
      // Get count for audit number
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
                {(userProfile?.standards_access || ["ISO_9001", "ISO_14001", "ISO_45001"]).map(std => (
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

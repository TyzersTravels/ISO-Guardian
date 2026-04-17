import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { supabase } from '../lib/supabase'
import { logActivity } from '../lib/auditLogger'
import Layout from '../components/Layout'
import ConfirmModal from '../components/ConfirmModal'
import { createBrandedPDF } from '../lib/brandedPDFExport'
import SupportingDocuments from '../components/SupportingDocuments'

const TRAINING_TYPES = [
  { value: 'induction', label: 'Induction' },
  { value: 'on_the_job', label: 'On-the-Job' },
  { value: 'formal_course', label: 'Formal Course' },
  { value: 'certification', label: 'Certification' },
  { value: 'awareness', label: 'Awareness' },
  { value: 'drill', label: 'Drill / Exercise' },
  { value: 'refresher', label: 'Refresher' },
  { value: 'external', label: 'External' },
  { value: 'other', label: 'Other' },
]

const COMPETENCY_STATUSES = [
  { value: 'Not Assessed', color: 'bg-white/10 text-white/50' },
  { value: 'Competent', color: 'bg-green-500/20 text-green-400' },
  { value: 'Not Yet Competent', color: 'bg-red-500/20 text-red-400' },
  { value: 'Expired', color: 'bg-orange-500/20 text-orange-400' },
  { value: 'In Progress', color: 'bg-blue-500/20 text-blue-400' },
]

const STANDARDS = [
  { code: 'ISO_9001', label: 'ISO 9001' },
  { code: 'ISO_14001', label: 'ISO 14001' },
  { code: 'ISO_45001', label: 'ISO 45001' },
]

const TrainingMatrix = () => {
  const { userProfile, getEffectiveCompanyId } = useAuth()
  const toast = useToast()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)
  const [exporting, setExporting] = useState(false)
  const [users, setUsers] = useState([])
  const [viewMode, setViewMode] = useState('list') // 'list' | 'matrix'

  // Filters
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [employeeFilter, setEmployeeFilter] = useState('all')

  const defaultForm = {
    user_id: '', employee_name: '', job_title: '', department: '',
    training_title: '', training_type: 'formal_course', provider: '',
    competency_area: '', standards: ['ISO_9001'], clause_reference: '7.2',
    is_safety_critical: false, legal_requirement: false,
    date_completed: '', expiry_date: '', next_refresher_date: '',
    certificate_number: '', competency_status: 'Not Assessed',
    assessment_method: '', assessment_score: '', assessor: '', notes: '',
  }
  const [form, setForm] = useState(defaultForm)

  useEffect(() => {
    if (userProfile) { fetchRecords(); fetchUsers() }
  }, [userProfile])

  const fetchUsers = async () => {
    const companyId = getEffectiveCompanyId()
    const { data } = await supabase.from('users').select('id, full_name, email').eq('company_id', companyId)
    setUsers(data || [])
  }

  const fetchRecords = async () => {
    try {
      setLoading(true)
      const companyId = getEffectiveCompanyId()
      const { data, error } = await supabase
        .from('training_records')
        .select('id, user_id, employee_name, job_title, department, training_title, training_type, provider, competency_area, standards, clause_reference, is_safety_critical, legal_requirement, date_completed, expiry_date, next_refresher_date, certificate_number, competency_status, assessment_method, assessment_score, assessor, notes, created_at, updated_at')
        .eq('company_id', companyId)
        .order('employee_name')

      if (error) throw error
      setRecords(data || [])
    } catch (err) {
      console.error('Error fetching training records:', err)
      toast.error('Failed to load training records')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const companyId = getEffectiveCompanyId()

      // Auto-detect expired status
      let status = form.competency_status
      if (form.expiry_date && new Date(form.expiry_date) < new Date() && status === 'Competent') {
        status = 'Expired'
      }

      const payload = {
        company_id: companyId,
        user_id: form.user_id || null,
        employee_name: form.employee_name,
        job_title: form.job_title || null,
        department: form.department || null,
        training_title: form.training_title,
        training_type: form.training_type,
        provider: form.provider || null,
        competency_area: form.competency_area || null,
        standards: form.standards,
        clause_reference: form.clause_reference || '7.2',
        is_safety_critical: form.is_safety_critical,
        legal_requirement: form.legal_requirement,
        date_completed: form.date_completed || null,
        expiry_date: form.expiry_date || null,
        next_refresher_date: form.next_refresher_date || null,
        certificate_number: form.certificate_number || null,
        competency_status: status,
        assessment_method: form.assessment_method || null,
        assessment_score: form.assessment_score ? parseFloat(form.assessment_score) : null,
        assessor: form.assessor || null,
        notes: form.notes || null,
      }

      if (editing) {
        const { error } = await supabase.from('training_records').update(payload).eq('id', editing.id)
        if (error) throw error
        await logActivity({ companyId, userId: userProfile.id, action: 'updated', entityType: 'training_record', entityId: editing.id, changes: { training_title: form.training_title } })
        toast.success('Training record updated')
      } else {
        payload.created_by = userProfile.id
        const { data, error } = await supabase.from('training_records').insert(payload).select('id').single()
        if (error) throw error
        await logActivity({ companyId, userId: userProfile.id, action: 'created', entityType: 'training_record', entityId: data.id, changes: { employee: form.employee_name, training: form.training_title } })
        toast.success('Training record created')
      }

      setShowForm(false)
      setEditing(null)
      setForm(defaultForm)
      fetchRecords()
    } catch (err) {
      console.error('Error saving training record:', err)
      toast.error('Failed to save training record')
    }
  }

  const openEdit = (rec) => {
    setEditing(rec)
    setForm({
      user_id: rec.user_id || '',
      employee_name: rec.employee_name || '',
      job_title: rec.job_title || '',
      department: rec.department || '',
      training_title: rec.training_title || '',
      training_type: rec.training_type || 'formal_course',
      provider: rec.provider || '',
      competency_area: rec.competency_area || '',
      standards: rec.standards || ['ISO_9001'],
      clause_reference: rec.clause_reference || '7.2',
      is_safety_critical: rec.is_safety_critical || false,
      legal_requirement: rec.legal_requirement || false,
      date_completed: rec.date_completed || '',
      expiry_date: rec.expiry_date || '',
      next_refresher_date: rec.next_refresher_date || '',
      certificate_number: rec.certificate_number || '',
      competency_status: rec.competency_status || 'Not Assessed',
      assessment_method: rec.assessment_method || '',
      assessment_score: rec.assessment_score ?? '',
      assessor: rec.assessor || '',
      notes: rec.notes || '',
    })
    setShowForm(true)
  }

  const deleteRecord = async (id) => {
    try {
      const { error } = await supabase.from('training_records').delete().eq('id', id)
      if (error) throw error
      await logActivity({ companyId: getEffectiveCompanyId(), userId: userProfile.id, action: 'deleted', entityType: 'training_record', entityId: id })
      toast.success('Training record deleted')
      fetchRecords()
      setSelectedRecord(null)
    } catch (err) {
      console.error('Error deleting:', err)
      toast.error('Failed to delete')
    }
  }

  const selectUser = (userId) => {
    const u = users.find(u => u.id === userId)
    if (u) {
      setForm(prev => ({ ...prev, user_id: userId, employee_name: u.full_name || u.email }))
    } else {
      setForm(prev => ({ ...prev, user_id: '' }))
    }
  }

  const toggleStandard = (code) => {
    setForm(prev => ({
      ...prev,
      standards: prev.standards.includes(code) ? prev.standards.filter(s => s !== code) : [...prev.standards, code]
    }))
  }

  // Filtering
  const filtered = records.filter(r => {
    if (statusFilter !== 'all' && r.competency_status !== statusFilter) return false
    if (typeFilter !== 'all' && r.training_type !== typeFilter) return false
    if (employeeFilter !== 'all' && r.employee_name !== employeeFilter) return false
    return true
  })

  // Stats
  const today = new Date().toISOString().split('T')[0]
  const totalRecords = records.length
  const competentCount = records.filter(r => r.competency_status === 'Competent').length
  const expiredCount = records.filter(r => r.competency_status === 'Expired' || (r.expiry_date && r.expiry_date < today && r.competency_status === 'Competent')).length
  const safetyCritical = records.filter(r => r.is_safety_critical).length
  const upcomingExpiry = records.filter(r => r.expiry_date && r.expiry_date >= today && r.expiry_date <= new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]).length

  // Unique employees for filter + matrix view
  const uniqueEmployees = [...new Set(records.map(r => r.employee_name))].sort()
  const uniqueAreas = [...new Set(records.map(r => r.competency_area).filter(Boolean))].sort()

  // Export
  const exportMatrix = async () => {
    try {
      setExporting(true)
      const companyName = userProfile?.company?.name || 'Company'
      const companyLogo = userProfile?.company?.logo_url || null
      const userName = userProfile?.full_name || userProfile?.email || ''

      const doc = await createBrandedPDF({
        title: 'Training & Competency Matrix',
        docNumber: 'IG-TRN-MAT',
        companyName, preparedBy: userName, companyLogoUrl: companyLogo,
        type: 'document',
        contentRenderer: (doc, startY) => {
          const margin = 20
          const pageWidth = doc.internal.pageSize.getWidth()
          const contentWidth = pageWidth - margin * 2
          let y = startY

          // Summary
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(11)
          doc.setTextColor(30, 27, 75)
          doc.text('Summary', margin, y)
          y += 7
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(9)
          doc.setTextColor(60, 60, 70)
          doc.text(`Total Records: ${totalRecords}  |  Competent: ${competentCount}  |  Expired: ${expiredCount}  |  Safety-Critical: ${safetyCritical}`, margin, y)
          y += 12

          // Employee-by-employee
          uniqueEmployees.forEach(emp => {
            if (y > 250) { doc.addPage(); y = 25 }

            const empRecords = records.filter(r => r.employee_name === emp)
            doc.setFillColor(30, 27, 75)
            doc.rect(margin, y - 4, contentWidth, 8, 'F')
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(9)
            doc.setTextColor(255, 255, 255)
            doc.text(`${emp} — ${empRecords[0]?.job_title || ''}`, margin + 2, y + 1)
            y += 10

            empRecords.forEach(rec => {
              if (y > 270) { doc.addPage(); y = 25 }
              const statusColor = rec.competency_status === 'Competent' ? [34, 197, 94]
                : rec.competency_status === 'Expired' ? [239, 68, 68]
                : [107, 114, 128]

              doc.setFillColor(...statusColor)
              doc.circle(margin + 3, y + 1, 1.5, 'F')

              doc.setFont('helvetica', 'normal')
              doc.setFontSize(8)
              doc.setTextColor(60, 60, 70)
              doc.text(rec.training_title, margin + 8, y + 2)

              doc.setFont('helvetica', 'bold')
              doc.setFontSize(7)
              doc.setTextColor(...statusColor)
              doc.text(rec.competency_status, pageWidth - margin - 2, y + 2, { align: 'right' })

              y += 6

              doc.setFont('helvetica', 'normal')
              doc.setFontSize(7)
              doc.setTextColor(120, 120, 130)
              const details = [
                rec.date_completed ? `Completed: ${rec.date_completed}` : null,
                rec.expiry_date ? `Expires: ${rec.expiry_date}` : null,
                rec.provider ? `Provider: ${rec.provider}` : null,
                rec.is_safety_critical ? 'SAFETY-CRITICAL' : null,
              ].filter(Boolean).join('  |  ')
              if (details) { doc.text(details, margin + 8, y + 1); y += 5 }
              y += 2
            })
            y += 4
          })

          return y
        }
      })
      doc.save('IG-Training_Competency_Matrix.pdf')
      toast.success('Training matrix exported')
    } catch (err) {
      console.error('Export error:', err)
      toast.error('Failed to export')
    } finally {
      setExporting(false)
    }
  }

  const getStatusStyle = (status) => COMPETENCY_STATUSES.find(s => s.value === status)?.color || 'bg-white/10 text-white/50'

  if (loading) {
    return <Layout><div className="text-white text-center py-12">Loading training records...</div></Layout>
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-1">Training & Competency Matrix</h2>
            <p className="text-white/60 text-sm">ISO 9001 §7.2 · ISO 14001 §7.2 · ISO 45001 §7.2</p>
          </div>
          <div className="flex gap-2 self-start sm:self-auto">
            {records.length > 0 && (
              <button onClick={exportMatrix} disabled={exporting}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold rounded-xl transition-all text-sm disabled:opacity-50">
                {exporting ? 'Exporting...' : 'Export PDF'}
              </button>
            )}
            <button onClick={() => { setEditing(null); setForm(defaultForm); setShowForm(true) }}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all text-sm">
              + Add Training
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Total Records', value: totalRecords, color: 'text-white' },
            { label: 'Competent', value: competentCount, color: 'text-green-400' },
            { label: 'Expired', value: expiredCount, color: 'text-red-400' },
            { label: 'Safety-Critical', value: safetyCritical, color: 'text-orange-400' },
            { label: 'Expiring (30d)', value: upcomingExpiry, color: 'text-yellow-400' },
          ].map(kpi => (
            <div key={kpi.label} className="glass glass-border rounded-xl p-4 text-center">
              <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
              <div className="text-white/50 text-xs mt-1">{kpi.label}</div>
            </div>
          ))}
        </div>

        <SupportingDocuments standard="ISO 9001" clause="7.2" clauseNum={7} clauseName="Clause 7: Support" entityType="training_matrix" title="Existing Training Records" />

        {/* View Toggle + Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg overflow-hidden border border-white/10">
            <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 text-xs font-medium ${viewMode === 'list' ? 'bg-purple-500 text-white' : 'bg-white/5 text-white/50'}`}>List</button>
            <button onClick={() => setViewMode('matrix')} className={`px-3 py-1.5 text-xs font-medium ${viewMode === 'matrix' ? 'bg-purple-500 text-white' : 'bg-white/5 text-white/50'}`}>Matrix</button>
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="glass-input rounded-lg px-3 py-1.5 text-sm text-white">
            <option value="all">All Statuses</option>
            {COMPETENCY_STATUSES.map(s => <option key={s.value} value={s.value}>{s.value}</option>)}
          </select>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="glass-input rounded-lg px-3 py-1.5 text-sm text-white">
            <option value="all">All Types</option>
            {TRAINING_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select value={employeeFilter} onChange={e => setEmployeeFilter(e.target.value)} className="glass-input rounded-lg px-3 py-1.5 text-sm text-white">
            <option value="all">All Employees</option>
            {uniqueEmployees.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>

        {/* Matrix View */}
        {viewMode === 'matrix' && uniqueAreas.length > 0 && (
          <div className="glass glass-border rounded-2xl p-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left text-white/60 text-xs p-2 sticky left-0 bg-[#0a0015]">Employee</th>
                  {uniqueAreas.map(area => (
                    <th key={area} className="text-center text-white/60 text-xs p-2 whitespace-nowrap">{area}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {uniqueEmployees.map(emp => (
                  <tr key={emp} className="border-t border-white/5">
                    <td className="text-white text-xs p-2 font-medium sticky left-0 bg-[#0a0015] whitespace-nowrap">{emp}</td>
                    {uniqueAreas.map(area => {
                      const rec = records.find(r => r.employee_name === emp && r.competency_area === area)
                      if (!rec) return <td key={area} className="text-center p-2"><span className="text-white/20">—</span></td>
                      const isExpired = rec.expiry_date && rec.expiry_date < today
                      return (
                        <td key={area} className="text-center p-2">
                          <span className={`inline-block w-3 h-3 rounded-full ${
                            isExpired ? 'bg-red-500 animate-pulse' :
                            rec.competency_status === 'Competent' ? 'bg-green-500' :
                            rec.competency_status === 'In Progress' ? 'bg-blue-500' :
                            rec.competency_status === 'Not Yet Competent' ? 'bg-red-400' :
                            'bg-white/20'
                          }`} title={`${rec.competency_status}${isExpired ? ' (EXPIRED)' : ''}`} />
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex gap-4 mt-3 text-[10px] text-white/40">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Competent</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> In Progress</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Expired</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-white/20" /> Not Assessed</span>
            </div>
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="space-y-2">
            {filtered.map(rec => {
              const isExpanded = selectedRecord?.id === rec.id
              const isExpired = rec.expiry_date && rec.expiry_date < today
              const effectiveStatus = isExpired && rec.competency_status === 'Competent' ? 'Expired' : rec.competency_status

              return (
                <div key={rec.id} className={`glass glass-border rounded-xl overflow-hidden ${isExpanded ? 'ring-1 ring-purple-500' : ''}`}>
                  <div className="p-4 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => setSelectedRecord(isExpanded ? null : rec)}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-white font-semibold text-sm">{rec.employee_name}</span>
                          {rec.job_title && <span className="text-white/30 text-xs">· {rec.job_title}</span>}
                          {rec.is_safety_critical && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-semibold">SAFETY</span>}
                          {rec.legal_requirement && <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 font-semibold">LEGAL</span>}
                        </div>
                        <p className="text-white/70 text-sm mt-0.5">{rec.training_title}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {(rec.standards || []).map(s => (
                            <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">{s.replace('ISO_', 'ISO ')}</span>
                          ))}
                          {rec.competency_area && <span className="text-[10px] text-white/30">· {rec.competency_area}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {rec.expiry_date && (
                          <div className="text-right">
                            <div className={`text-xs ${isExpired ? 'text-red-400' : 'text-white/40'}`}>
                              {isExpired ? 'Expired' : 'Expires'}: {rec.expiry_date}
                            </div>
                          </div>
                        )}
                        <span className={`text-xs px-2 py-1 rounded-lg font-medium ${getStatusStyle(effectiveStatus)}`}>
                          {effectiveStatus}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-white/10 p-4 space-y-3" onClick={e => e.stopPropagation()}>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div><span className="text-white/40 text-xs">Type</span><p className="text-white capitalize">{(rec.training_type || '').replace('_', ' ')}</p></div>
                        <div><span className="text-white/40 text-xs">Provider</span><p className="text-white">{rec.provider || '-'}</p></div>
                        <div><span className="text-white/40 text-xs">Completed</span><p className="text-white">{rec.date_completed || '-'}</p></div>
                        <div><span className="text-white/40 text-xs">Certificate</span><p className="text-white">{rec.certificate_number || '-'}</p></div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div><span className="text-white/40 text-xs">Assessment Method</span><p className="text-white">{rec.assessment_method || '-'}</p></div>
                        <div><span className="text-white/40 text-xs">Score</span><p className="text-white">{rec.assessment_score ?? '-'}</p></div>
                        <div><span className="text-white/40 text-xs">Assessor</span><p className="text-white">{rec.assessor || '-'}</p></div>
                        <div><span className="text-white/40 text-xs">Next Refresher</span><p className="text-white">{rec.next_refresher_date || '-'}</p></div>
                      </div>
                      {rec.notes && <div><span className="text-white/40 text-xs">Notes</span><p className="text-white/70 text-sm">{rec.notes}</p></div>}

                      <div className="flex gap-2 pt-2">
                        <button onClick={() => openEdit(rec)} className="px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg text-sm hover:bg-purple-500/30 transition-colors">Edit</button>
                        <button onClick={() => setConfirmAction({ title: 'Delete Training Record', message: `Delete "${rec.training_title}" for ${rec.employee_name}?`, variant: 'danger', confirmLabel: 'Delete', onConfirm: () => { deleteRecord(rec.id); setConfirmAction(null) } })}
                          className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors">Delete</button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {filtered.length === 0 && !loading && (
          <div className="glass glass-border rounded-xl p-8 text-center">
            <p className="text-white/60 mb-2">No training records found</p>
            <p className="text-white/40 text-sm">Track employee competencies, certifications, and training to meet ISO 7.2 requirements</p>
          </div>
        )}

        {/* Create/Edit Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
            <div className="glass glass-border rounded-2xl p-6 w-full max-w-2xl my-8">
              <h3 className="text-xl font-bold text-white mb-4">{editing ? 'Edit Training Record' : 'Add Training Record'}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Employee */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">Link to System User (optional)</label>
                    <select value={form.user_id} onChange={e => selectUser(e.target.value)} className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm">
                      <option value="">— Manual entry —</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.full_name || u.email}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">Employee Name *</label>
                    <input type="text" required value={form.employee_name} onChange={e => setForm({ ...form, employee_name: e.target.value })}
                      placeholder="Full name" className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">Job Title</label>
                    <input type="text" value={form.job_title} onChange={e => setForm({ ...form, job_title: e.target.value })}
                      placeholder="e.g. Safety Officer" className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                  </div>
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">Department</label>
                    <input type="text" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}
                      placeholder="e.g. Operations" className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                  </div>
                </div>

                {/* Training Details */}
                <div>
                  <label className="text-white/60 text-xs mb-1 block">Training Title *</label>
                  <input type="text" required value={form.training_title} onChange={e => setForm({ ...form, training_title: e.target.value })}
                    placeholder="e.g. ISO 9001 Internal Auditor Course" className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">Type</label>
                    <select value={form.training_type} onChange={e => setForm({ ...form, training_type: e.target.value })} className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm">
                      {TRAINING_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">Provider</label>
                    <input type="text" value={form.provider} onChange={e => setForm({ ...form, provider: e.target.value })}
                      placeholder="Training provider" className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                  </div>
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">Competency Area</label>
                    <input type="text" value={form.competency_area} onChange={e => setForm({ ...form, competency_area: e.target.value })}
                      placeholder="e.g. First Aid, Internal Auditing" className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                  </div>
                </div>

                {/* Standards */}
                <div>
                  <label className="text-white/60 text-xs mb-1 block">Applicable Standards</label>
                  <div className="flex gap-2">
                    {STANDARDS.map(std => (
                      <button key={std.code} type="button" onClick={() => toggleStandard(std.code)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${form.standards.includes(std.code) ? 'bg-purple-500 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>
                        {std.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Safety flags */}
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_safety_critical} onChange={e => setForm({ ...form, is_safety_critical: e.target.checked })} className="accent-red-500" />
                    <span className="text-white/70 text-sm">Safety-Critical</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.legal_requirement} onChange={e => setForm({ ...form, legal_requirement: e.target.checked })} className="accent-yellow-500" />
                    <span className="text-white/70 text-sm">Legal Requirement</span>
                  </label>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">Date Completed</label>
                    <input type="date" value={form.date_completed} onChange={e => setForm({ ...form, date_completed: e.target.value })} className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                  </div>
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">Expiry Date</label>
                    <input type="date" value={form.expiry_date} onChange={e => setForm({ ...form, expiry_date: e.target.value })} className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                  </div>
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">Next Refresher</label>
                    <input type="date" value={form.next_refresher_date} onChange={e => setForm({ ...form, next_refresher_date: e.target.value })} className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                  </div>
                </div>

                {/* Assessment */}
                <div className="glass rounded-lg p-4">
                  <h4 className="text-white text-sm font-semibold mb-3">Competency Assessment</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-white/60 text-xs mb-1 block">Status</label>
                      <select value={form.competency_status} onChange={e => setForm({ ...form, competency_status: e.target.value })} className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm">
                        {COMPETENCY_STATUSES.map(s => <option key={s.value} value={s.value}>{s.value}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-white/60 text-xs mb-1 block">Method</label>
                      <input type="text" value={form.assessment_method} onChange={e => setForm({ ...form, assessment_method: e.target.value })}
                        placeholder="Observation, test..." className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                    </div>
                    <div>
                      <label className="text-white/60 text-xs mb-1 block">Score</label>
                      <input type="number" step="any" value={form.assessment_score} onChange={e => setForm({ ...form, assessment_score: e.target.value })}
                        placeholder="e.g. 85" className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                    </div>
                    <div>
                      <label className="text-white/60 text-xs mb-1 block">Assessor</label>
                      <input type="text" value={form.assessor} onChange={e => setForm({ ...form, assessor: e.target.value })}
                        placeholder="Name of assessor" className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-white/60 text-xs mb-1 block">Certificate Number</label>
                  <input type="text" value={form.certificate_number} onChange={e => setForm({ ...form, certificate_number: e.target.value })}
                    placeholder="e.g. IRCA-2026-12345" className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                </div>

                <div>
                  <label className="text-white/60 text-xs mb-1 block">Notes</label>
                  <textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                    placeholder="Additional notes..." className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="submit" className="flex-1 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all">
                    {editing ? 'Update Record' : 'Add Training Record'}
                  </button>
                  <button type="button" onClick={() => { setShowForm(false); setEditing(null); setForm(defaultForm) }}
                    className="px-6 py-2.5 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {confirmAction && (
          <ConfirmModal title={confirmAction.title} message={confirmAction.message} variant={confirmAction.variant}
            confirmLabel={confirmAction.confirmLabel} onConfirm={confirmAction.onConfirm} onCancel={() => setConfirmAction(null)} />
        )}
      </div>
    </Layout>
  )
}

export default TrainingMatrix

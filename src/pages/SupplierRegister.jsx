import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { supabase } from '../lib/supabase'
import { logActivity } from '../lib/auditLogger'
import Layout from '../components/Layout'
import ConfirmModal from '../components/ConfirmModal'
import { createBrandedPDF } from '../lib/brandedPDFExport'
import SupportingDocuments from '../components/SupportingDocuments'

const SUPPLIER_TYPES = [
  { value: 'product', label: 'Product Supplier' },
  { value: 'service', label: 'Service Provider' },
  { value: 'contractor', label: 'Contractor' },
  { value: 'consultant', label: 'Consultant' },
  { value: 'outsourced_process', label: 'Outsourced Process' },
  { value: 'other', label: 'Other' },
]

const APPROVAL_STATUSES = [
  { value: 'Pending', color: 'bg-white/10 text-white/50' },
  { value: 'Approved', color: 'bg-green-500/20 text-green-400' },
  { value: 'Conditional', color: 'bg-yellow-500/20 text-yellow-400' },
  { value: 'Suspended', color: 'bg-orange-500/20 text-orange-400' },
  { value: 'Rejected', color: 'bg-red-500/20 text-red-400' },
]

const EVAL_FREQUENCIES = [
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'biannually', label: 'Bi-Annually' },
  { value: 'annually', label: 'Annually' },
  { value: 'biennial', label: 'Every 2 Years' },
]

const STANDARDS = [
  { code: 'ISO_9001', label: 'ISO 9001' },
  { code: 'ISO_14001', label: 'ISO 14001' },
  { code: 'ISO_45001', label: 'ISO 45001' },
]

const SupplierRegister = () => {
  const { userProfile, getEffectiveCompanyId } = useAuth()
  const toast = useToast()
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [selectedSupplier, setSelectedSupplier] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)
  const [exporting, setExporting] = useState(false)
  const [users, setUsers] = useState([])

  // Filters
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [approvalFilter, setApprovalFilter] = useState('all')

  const defaultForm = {
    supplier_name: '', supplier_code: '', contact_person: '', email: '', phone: '',
    address: '', website: '', supplier_type: 'product', products_services: '',
    is_critical: false, standards: ['ISO_9001'], clause_reference: '8.4',
    environmental_criteria: '', environmental_risk: '',
    ohs_requirements: '', ohs_risk: '',
    approval_status: 'Pending', evaluation_score: '', evaluation_method: '',
    evaluation_criteria: '', evaluation_frequency: 'annually',
    evaluation_notes: '', next_evaluation_date: '',
    bbeee_level: '', iso_certified: false, iso_certificate_details: '',
    status: 'Active',
  }
  const [form, setForm] = useState(defaultForm)

  useEffect(() => {
    if (userProfile) { fetchSuppliers(); fetchUsers() }
  }, [userProfile])

  const fetchUsers = async () => {
    const { data } = await supabase.from('users').select('id, full_name, email').eq('company_id', getEffectiveCompanyId())
    setUsers(data || [])
  }

  const fetchSuppliers = async () => {
    try {
      setLoading(true)
      const companyId = getEffectiveCompanyId()
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, supplier_name, supplier_code, contact_person, email, phone, address, website, supplier_type, products_services, is_critical, standards, clause_reference, environmental_criteria, environmental_risk, ohs_requirements, ohs_risk, approval_status, approval_date, evaluation_score, evaluation_method, evaluation_criteria, evaluation_frequency, evaluation_notes, last_evaluated, next_evaluation_date, bbeee_level, iso_certified, iso_certificate_details, status, blacklist_reason, created_at, updated_at')
        .eq('company_id', companyId)
        .order('supplier_name')

      if (error) throw error
      setSuppliers(data || [])
    } catch (err) {
      console.error('Error fetching suppliers:', err)
      toast.error('Failed to load suppliers')
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
        supplier_name: form.supplier_name,
        supplier_code: form.supplier_code || null,
        contact_person: form.contact_person || null,
        email: form.email || null,
        phone: form.phone || null,
        address: form.address || null,
        website: form.website || null,
        supplier_type: form.supplier_type,
        products_services: form.products_services || null,
        is_critical: form.is_critical,
        standards: form.standards,
        clause_reference: form.clause_reference || '8.4',
        environmental_criteria: form.standards.includes('ISO_14001') ? form.environmental_criteria || null : null,
        environmental_risk: form.standards.includes('ISO_14001') ? form.environmental_risk || null : null,
        ohs_requirements: form.standards.includes('ISO_45001') ? form.ohs_requirements || null : null,
        ohs_risk: form.standards.includes('ISO_45001') ? form.ohs_risk || null : null,
        approval_status: form.approval_status,
        evaluation_score: form.evaluation_score ? parseFloat(form.evaluation_score) : null,
        evaluation_method: form.evaluation_method || null,
        evaluation_criteria: form.evaluation_criteria || null,
        evaluation_frequency: form.evaluation_frequency || null,
        evaluation_notes: form.evaluation_notes || null,
        next_evaluation_date: form.next_evaluation_date || null,
        bbeee_level: form.bbeee_level || null,
        iso_certified: form.iso_certified,
        iso_certificate_details: form.iso_certificate_details || null,
        status: form.status,
      }

      if (editing) {
        payload.last_evaluated = new Date().toISOString().split('T')[0]
        const { error } = await supabase.from('suppliers').update(payload).eq('id', editing.id)
        if (error) throw error
        await logActivity({ companyId, userId: userProfile.id, action: 'updated', entityType: 'supplier', entityId: editing.id, changes: { supplier_name: form.supplier_name } })
        toast.success('Supplier updated')
      } else {
        if (form.approval_status !== 'Pending') payload.approval_date = new Date().toISOString().split('T')[0]
        payload.created_by = userProfile.id
        const { data, error } = await supabase.from('suppliers').insert(payload).select('id').single()
        if (error) throw error
        await logActivity({ companyId, userId: userProfile.id, action: 'created', entityType: 'supplier', entityId: data.id, changes: { supplier_name: form.supplier_name } })
        toast.success('Supplier added')
      }

      setShowForm(false)
      setEditing(null)
      setForm(defaultForm)
      fetchSuppliers()
    } catch (err) {
      console.error('Error saving supplier:', err)
      toast.error('Failed to save supplier')
    }
  }

  const openEdit = (s) => {
    setEditing(s)
    setForm({
      supplier_name: s.supplier_name || '', supplier_code: s.supplier_code || '',
      contact_person: s.contact_person || '', email: s.email || '', phone: s.phone || '',
      address: s.address || '', website: s.website || '', supplier_type: s.supplier_type || 'product',
      products_services: s.products_services || '', is_critical: s.is_critical || false,
      standards: s.standards || ['ISO_9001'], clause_reference: s.clause_reference || '8.4',
      environmental_criteria: s.environmental_criteria || '', environmental_risk: s.environmental_risk || '',
      ohs_requirements: s.ohs_requirements || '', ohs_risk: s.ohs_risk || '',
      approval_status: s.approval_status || 'Pending', evaluation_score: s.evaluation_score ?? '',
      evaluation_method: s.evaluation_method || '', evaluation_criteria: s.evaluation_criteria || '',
      evaluation_frequency: s.evaluation_frequency || 'annually', evaluation_notes: s.evaluation_notes || '',
      next_evaluation_date: s.next_evaluation_date || '', bbeee_level: s.bbeee_level || '',
      iso_certified: s.iso_certified || false, iso_certificate_details: s.iso_certificate_details || '',
      status: s.status || 'Active',
    })
    setShowForm(true)
  }

  const deleteSupplier = async (id) => {
    try {
      const { error } = await supabase.from('suppliers').delete().eq('id', id)
      if (error) throw error
      await logActivity({ companyId: getEffectiveCompanyId(), userId: userProfile.id, action: 'deleted', entityType: 'supplier', entityId: id })
      toast.success('Supplier deleted')
      fetchSuppliers()
      setSelectedSupplier(null)
    } catch (err) {
      toast.error('Failed to delete supplier')
    }
  }

  const toggleStandard = (code) => {
    setForm(prev => ({
      ...prev,
      standards: prev.standards.includes(code) ? prev.standards.filter(s => s !== code) : [...prev.standards, code]
    }))
  }

  // Filters
  const filtered = suppliers.filter(s => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false
    if (typeFilter !== 'all' && s.supplier_type !== typeFilter) return false
    if (approvalFilter !== 'all' && s.approval_status !== approvalFilter) return false
    return true
  })

  // Stats
  const today = new Date().toISOString().split('T')[0]
  const total = suppliers.length
  const approved = suppliers.filter(s => s.approval_status === 'Approved').length
  const critical = suppliers.filter(s => s.is_critical).length
  const dueEval = suppliers.filter(s => s.next_evaluation_date && s.next_evaluation_date <= today).length

  const getApprovalStyle = (status) => APPROVAL_STATUSES.find(a => a.value === status)?.color || 'bg-white/10 text-white/50'

  // Export
  const exportRegister = async () => {
    try {
      setExporting(true)
      const companyName = userProfile?.company?.name || 'Company'
      const companyLogo = userProfile?.company?.logo_url || null
      const userName = userProfile?.full_name || userProfile?.email || ''

      const doc = await createBrandedPDF({
        title: 'Approved Supplier Register', docNumber: 'IG-SUP-REG',
        companyName, preparedBy: userName, companyLogoUrl: companyLogo, type: 'document',
        contentRenderer: (doc, startY) => {
          const margin = 20
          const pageWidth = doc.internal.pageSize.getWidth()
          const contentWidth = pageWidth - margin * 2
          let y = startY

          doc.setFont('helvetica', 'bold')
          doc.setFontSize(11)
          doc.setTextColor(30, 27, 75)
          doc.text('Summary', margin, y)
          y += 7
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(9)
          doc.setTextColor(60, 60, 70)
          doc.text(`Total: ${total}  |  Approved: ${approved}  |  Critical: ${critical}  |  Due for Evaluation: ${dueEval}`, margin, y)
          y += 12

          // Table
          const cols = [margin, margin + 40, margin + 70, margin + 100, margin + 120, margin + 145]
          doc.setFillColor(30, 27, 75)
          doc.rect(margin, y - 4, contentWidth, 8, 'F')
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(7)
          doc.setTextColor(255, 255, 255)
          doc.text('Supplier', cols[0] + 2, y + 1)
          doc.text('Type', cols[1] + 2, y + 1)
          doc.text('Products/Services', cols[2] + 2, y + 1)
          doc.text('Score', cols[3] + 2, y + 1)
          doc.text('Status', cols[4] + 2, y + 1)
          doc.text('Next Eval', cols[5] + 2, y + 1)
          y += 8

          suppliers.filter(s => s.status === 'Active').forEach((sup, i) => {
            if (y > 265) { doc.addPage(); y = 25 }
            const bg = i % 2 === 0 ? [249, 250, 251] : [255, 255, 255]
            doc.setFillColor(...bg)
            doc.rect(margin, y - 3, contentWidth, 7, 'F')

            doc.setFont('helvetica', 'normal')
            doc.setFontSize(7)
            doc.setTextColor(60, 60, 70)
            doc.text((sup.supplier_name || '').substring(0, 25), cols[0] + 2, y + 1)
            doc.text(sup.supplier_type || '', cols[1] + 2, y + 1)
            doc.text((sup.products_services || '').substring(0, 20), cols[2] + 2, y + 1)
            doc.text(sup.evaluation_score ? `${sup.evaluation_score}%` : '-', cols[3] + 2, y + 1)

            const sColor = sup.approval_status === 'Approved' ? [34, 197, 94] : sup.approval_status === 'Rejected' ? [239, 68, 68] : [107, 114, 128]
            doc.setTextColor(...sColor)
            doc.setFont('helvetica', 'bold')
            doc.text(sup.approval_status || '', cols[4] + 2, y + 1)

            doc.setTextColor(60, 60, 70)
            doc.setFont('helvetica', 'normal')
            doc.text(sup.next_evaluation_date || '-', cols[5] + 2, y + 1)
            y += 7
          })

          return y
        }
      })
      doc.save('IG-Approved_Supplier_Register.pdf')
      toast.success('Supplier register exported')
    } catch (err) {
      toast.error('Failed to export')
    } finally {
      setExporting(false)
    }
  }

  if (loading) return <Layout><div className="text-white text-center py-12">Loading suppliers...</div></Layout>

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-1">Approved Supplier Register</h2>
            <p className="text-white/60 text-sm">ISO 9001 §8.4 · ISO 14001 §8.1 · ISO 45001 §8.1.4</p>
          </div>
          <div className="flex gap-2 self-start sm:self-auto">
            {suppliers.length > 0 && (
              <button onClick={exportRegister} disabled={exporting}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold rounded-xl transition-all text-sm disabled:opacity-50">
                {exporting ? 'Exporting...' : 'Export PDF'}
              </button>
            )}
            <button onClick={() => { setEditing(null); setForm(defaultForm); setShowForm(true) }}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all text-sm">
              + Add Supplier
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Suppliers', value: total, color: 'text-white' },
            { label: 'Approved', value: approved, color: 'text-green-400' },
            { label: 'Critical', value: critical, color: 'text-red-400' },
            { label: 'Due for Eval', value: dueEval, color: 'text-orange-400' },
          ].map(kpi => (
            <div key={kpi.label} className="glass glass-border rounded-xl p-4 text-center">
              <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
              <div className="text-white/50 text-xs mt-1">{kpi.label}</div>
            </div>
          ))}
        </div>

        <SupportingDocuments standard="ISO 9001" clause="8.4" clauseNum={8} clauseName="Clause 8: Operation" entityType="supplier_register" title="Existing Supplier Documents" />

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="glass-input rounded-lg px-3 py-1.5 text-sm text-white">
            <option value="all">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Blacklisted">Blacklisted</option>
          </select>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="glass-input rounded-lg px-3 py-1.5 text-sm text-white">
            <option value="all">All Types</option>
            {SUPPLIER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select value={approvalFilter} onChange={e => setApprovalFilter(e.target.value)} className="glass-input rounded-lg px-3 py-1.5 text-sm text-white">
            <option value="all">All Approvals</option>
            {APPROVAL_STATUSES.map(a => <option key={a.value} value={a.value}>{a.value}</option>)}
          </select>
        </div>

        {/* Supplier List */}
        <div className="space-y-2">
          {filtered.map(sup => {
            const isExpanded = selectedSupplier?.id === sup.id
            const isDueEval = sup.next_evaluation_date && sup.next_evaluation_date <= today
            return (
              <div key={sup.id} className={`glass glass-border rounded-xl overflow-hidden ${isExpanded ? 'ring-1 ring-purple-500' : ''}`}>
                <div className="p-4 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => setSelectedSupplier(isExpanded ? null : sup)}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-white font-semibold text-sm">{sup.supplier_name}</h4>
                        {sup.supplier_code && <span className="text-white/30 text-xs font-mono">{sup.supplier_code}</span>}
                        {sup.is_critical && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-semibold">CRITICAL</span>}
                        {sup.iso_certified && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">ISO CERT</span>}
                        {isDueEval && <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 animate-pulse">EVAL DUE</span>}
                      </div>
                      <p className="text-white/50 text-xs mt-0.5">{sup.products_services || SUPPLIER_TYPES.find(t => t.value === sup.supplier_type)?.label}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {sup.evaluation_score && (
                        <div className="text-center">
                          <div className={`text-lg font-bold ${sup.evaluation_score >= 80 ? 'text-green-400' : sup.evaluation_score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {sup.evaluation_score}%
                          </div>
                          <div className="text-[10px] text-white/30">Score</div>
                        </div>
                      )}
                      <span className={`text-xs px-2 py-1 rounded-lg font-medium ${getApprovalStyle(sup.approval_status)}`}>
                        {sup.approval_status}
                      </span>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-white/10 p-4 space-y-3" onClick={e => e.stopPropagation()}>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div><span className="text-white/40 text-xs">Contact</span><p className="text-white">{sup.contact_person || '-'}</p></div>
                      <div><span className="text-white/40 text-xs">Email</span><p className="text-white">{sup.email || '-'}</p></div>
                      <div><span className="text-white/40 text-xs">Phone</span><p className="text-white">{sup.phone || '-'}</p></div>
                      <div><span className="text-white/40 text-xs">B-BBEE Level</span><p className="text-white">{sup.bbeee_level || '-'}</p></div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div><span className="text-white/40 text-xs">Eval Method</span><p className="text-white">{sup.evaluation_method || '-'}</p></div>
                      <div><span className="text-white/40 text-xs">Frequency</span><p className="text-white capitalize">{sup.evaluation_frequency || '-'}</p></div>
                      <div><span className="text-white/40 text-xs">Last Evaluated</span><p className="text-white">{sup.last_evaluated || '-'}</p></div>
                      <div><span className="text-white/40 text-xs">Next Evaluation</span><p className={`${isDueEval ? 'text-orange-400' : 'text-white'}`}>{sup.next_evaluation_date || '-'}</p></div>
                    </div>

                    {(sup.standards || []).includes('ISO_14001') && sup.environmental_criteria && (
                      <div className="glass rounded-lg p-3">
                        <span className="text-green-400 text-xs font-semibold">Environmental Requirements (ISO 14001)</span>
                        <p className="text-white/70 text-sm mt-1">{sup.environmental_criteria}</p>
                      </div>
                    )}
                    {(sup.standards || []).includes('ISO_45001') && sup.ohs_requirements && (
                      <div className="glass rounded-lg p-3">
                        <span className="text-orange-400 text-xs font-semibold">OH&S Requirements (ISO 45001)</span>
                        <p className="text-white/70 text-sm mt-1">{sup.ohs_requirements}</p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <button onClick={() => openEdit(sup)} className="px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg text-sm hover:bg-purple-500/30 transition-colors">Edit</button>
                      <button onClick={() => setConfirmAction({ title: 'Delete Supplier', message: `Delete "${sup.supplier_name}"?`, variant: 'danger', confirmLabel: 'Delete', onConfirm: () => { deleteSupplier(sup.id); setConfirmAction(null) } })}
                        className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors">Delete</button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {filtered.length === 0 && !loading && (
          <div className="glass glass-border rounded-xl p-8 text-center">
            <p className="text-white/60 mb-2">No suppliers found</p>
            <p className="text-white/40 text-sm">Add and evaluate suppliers to meet ISO 8.4 requirements</p>
          </div>
        )}

        {/* Create/Edit Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
            <div className="glass glass-border rounded-2xl p-6 w-full max-w-2xl my-8">
              <h3 className="text-xl font-bold text-white mb-4">{editing ? 'Edit Supplier' : 'Add Supplier'}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name + Code */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="text-white/60 text-xs mb-1 block">Supplier Name *</label>
                    <input type="text" required value={form.supplier_name} onChange={e => setForm({ ...form, supplier_name: e.target.value })}
                      placeholder="Company name" className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                  </div>
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">Code</label>
                    <input type="text" value={form.supplier_code} onChange={e => setForm({ ...form, supplier_code: e.target.value })}
                      placeholder="SUP-001" className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                  </div>
                </div>

                {/* Contact */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">Contact Person</label>
                    <input type="text" value={form.contact_person} onChange={e => setForm({ ...form, contact_person: e.target.value })} className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                  </div>
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">Email</label>
                    <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                  </div>
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">Phone</label>
                    <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                  </div>
                </div>

                {/* Type + Products */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">Supplier Type</label>
                    <select value={form.supplier_type} onChange={e => setForm({ ...form, supplier_type: e.target.value })} className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm">
                      {SUPPLIER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">Products / Services</label>
                    <input type="text" value={form.products_services} onChange={e => setForm({ ...form, products_services: e.target.value })}
                      placeholder="What they supply" className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
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

                {/* Flags */}
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_critical} onChange={e => setForm({ ...form, is_critical: e.target.checked })} className="accent-red-500" />
                    <span className="text-white/70 text-sm">Critical Supplier</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.iso_certified} onChange={e => setForm({ ...form, iso_certified: e.target.checked })} className="accent-blue-500" />
                    <span className="text-white/70 text-sm">ISO Certified</span>
                  </label>
                </div>

                {/* ISO 14001 fields */}
                {form.standards.includes('ISO_14001') && (
                  <div className="glass rounded-lg p-4 border border-green-500/20">
                    <h4 className="text-green-400 text-sm font-semibold mb-3">Environmental (ISO 14001)</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-white/60 text-xs mb-1 block">Environmental Criteria</label>
                        <textarea rows={2} value={form.environmental_criteria} onChange={e => setForm({ ...form, environmental_criteria: e.target.value })}
                          placeholder="Environmental requirements for this supplier..." className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                      </div>
                      <div>
                        <label className="text-white/60 text-xs mb-1 block">Environmental Risk</label>
                        <select value={form.environmental_risk} onChange={e => setForm({ ...form, environmental_risk: e.target.value })} className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm">
                          <option value="">Not assessed</option>
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* ISO 45001 fields */}
                {form.standards.includes('ISO_45001') && (
                  <div className="glass rounded-lg p-4 border border-orange-500/20">
                    <h4 className="text-orange-400 text-sm font-semibold mb-3">OH&S (ISO 45001)</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-white/60 text-xs mb-1 block">OH&S Requirements</label>
                        <textarea rows={2} value={form.ohs_requirements} onChange={e => setForm({ ...form, ohs_requirements: e.target.value })}
                          placeholder="Safety requirements for this supplier/contractor..." className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                      </div>
                      <div>
                        <label className="text-white/60 text-xs mb-1 block">OH&S Risk</label>
                        <select value={form.ohs_risk} onChange={e => setForm({ ...form, ohs_risk: e.target.value })} className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm">
                          <option value="">Not assessed</option>
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Evaluation */}
                <div className="glass rounded-lg p-4">
                  <h4 className="text-white text-sm font-semibold mb-3">Evaluation & Approval</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-white/60 text-xs mb-1 block">Approval Status</label>
                      <select value={form.approval_status} onChange={e => setForm({ ...form, approval_status: e.target.value })} className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm">
                        {APPROVAL_STATUSES.map(a => <option key={a.value} value={a.value}>{a.value}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-white/60 text-xs mb-1 block">Score (0-100)</label>
                      <input type="number" min="0" max="100" value={form.evaluation_score} onChange={e => setForm({ ...form, evaluation_score: e.target.value })}
                        placeholder="85" className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                    </div>
                    <div>
                      <label className="text-white/60 text-xs mb-1 block">Eval Frequency</label>
                      <select value={form.evaluation_frequency} onChange={e => setForm({ ...form, evaluation_frequency: e.target.value })} className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm">
                        {EVAL_FREQUENCIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-white/60 text-xs mb-1 block">Next Evaluation</label>
                      <input type="date" value={form.next_evaluation_date} onChange={e => setForm({ ...form, next_evaluation_date: e.target.value })} className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                    </div>
                  </div>
                </div>

                {/* SA specific */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">B-BBEE Level</label>
                    <select value={form.bbeee_level} onChange={e => setForm({ ...form, bbeee_level: e.target.value })} className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm">
                      <option value="">Not specified</option>
                      {[1,2,3,4,5,6,7,8].map(l => <option key={l} value={`Level ${l}`}>Level {l}</option>)}
                      <option value="Non-compliant">Non-compliant</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">Status</label>
                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm">
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Blacklisted">Blacklisted</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="submit" className="flex-1 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all">
                    {editing ? 'Update Supplier' : 'Add Supplier'}
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

export default SupplierRegister

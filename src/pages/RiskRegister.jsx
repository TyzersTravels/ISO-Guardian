import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { supabase } from '../lib/supabase'
import { logActivity } from '../lib/auditLogger'
import { generateDocNumber } from '../lib/documentNumbering'
import Layout from '../components/Layout'
import ConfirmModal from '../components/ConfirmModal'
import { createBrandedPDF } from '../lib/brandedPDFExport'

const RISK_CATEGORIES = [
  { value: 'strategic', label: 'Strategic' },
  { value: 'operational', label: 'Operational' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'financial', label: 'Financial' },
  { value: 'environmental', label: 'Environmental (ISO 14001)' },
  { value: 'health_safety', label: 'Health & Safety (ISO 45001)' },
  { value: 'quality', label: 'Quality (ISO 9001)' },
  { value: 'reputational', label: 'Reputational' },
  { value: 'other', label: 'Other' },
]

const TREATMENT_TYPES = [
  { value: 'avoid', label: 'Avoid', desc: 'Eliminate the risk entirely' },
  { value: 'mitigate', label: 'Mitigate', desc: 'Reduce likelihood or impact' },
  { value: 'transfer', label: 'Transfer', desc: 'Insurance, outsource, etc.' },
  { value: 'accept', label: 'Accept', desc: 'Acknowledge and monitor' },
  { value: 'exploit', label: 'Exploit', desc: 'Maximise the opportunity' },
  { value: 'enhance', label: 'Enhance', desc: 'Increase likelihood of opportunity' },
  { value: 'share', label: 'Share', desc: 'Partner to capture opportunity' },
]

const STANDARDS = [
  { code: 'ISO_9001', label: 'ISO 9001' },
  { code: 'ISO_14001', label: 'ISO 14001' },
  { code: 'ISO_45001', label: 'ISO 45001' },
]

const STATUSES = ['Open', 'In Treatment', 'Monitoring', 'Closed', 'Accepted']

const LIKELIHOOD_LABELS = ['Rare', 'Unlikely', 'Possible', 'Likely', 'Almost Certain']
const SEVERITY_LABELS = ['Insignificant', 'Minor', 'Moderate', 'Major', 'Catastrophic']

const getRatingColor = (rating) => {
  if (!rating) return 'text-white/40'
  if (rating <= 4) return 'text-green-400'
  if (rating <= 9) return 'text-yellow-400'
  if (rating <= 15) return 'text-orange-400'
  return 'text-red-400'
}

const getRatingBg = (rating) => {
  if (!rating) return 'bg-white/5'
  if (rating <= 4) return 'bg-green-500/10 border-green-500/30'
  if (rating <= 9) return 'bg-yellow-500/10 border-yellow-500/30'
  if (rating <= 15) return 'bg-orange-500/10 border-orange-500/30'
  return 'bg-red-500/10 border-red-500/30'
}

const getRatingLabel = (rating) => {
  if (!rating) return 'Not Assessed'
  if (rating <= 4) return 'Low'
  if (rating <= 9) return 'Medium'
  if (rating <= 15) return 'High'
  return 'Critical'
}

const RiskRegister = () => {
  const { userProfile, getEffectiveCompanyId } = useAuth()
  const toast = useToast()
  const [risks, setRisks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingRisk, setEditingRisk] = useState(null)
  const [selectedRisk, setSelectedRisk] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)
  const [exporting, setExporting] = useState(false)
  const [users, setUsers] = useState([])

  // Filters
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [standardFilter, setStandardFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const defaultForm = {
    title: '', description: '', risk_type: 'risk', category: 'operational',
    source: '', standards: ['ISO_9001'], clause_reference: '6.1',
    environmental_aspect: '', environmental_impact: '', aspect_condition: 'normal',
    hazard_type: '', hazard_source: '', who_affected: '',
    likelihood: 3, severity: 3,
    residual_likelihood: null, residual_severity: null,
    treatment_plan: '', treatment_type: 'mitigate', controls: '',
    responsible_person: '', due_date: '',
    status: 'Open', review_notes: '',
    next_review_date: '',
  }
  const [form, setForm] = useState(defaultForm)

  useEffect(() => {
    if (userProfile) {
      fetchRisks()
      fetchUsers()
    }
  }, [userProfile])

  const fetchUsers = async () => {
    const companyId = getEffectiveCompanyId()
    const { data } = await supabase
      .from('users')
      .select('id, full_name, email')
      .eq('company_id', companyId)
    setUsers(data || [])
  }

  const fetchRisks = async () => {
    try {
      setLoading(true)
      const companyId = getEffectiveCompanyId()
      const { data, error } = await supabase
        .from('risks')
        .select('id, risk_number, title, description, risk_type, category, source, standards, clause_reference, environmental_aspect, environmental_impact, aspect_condition, hazard_type, hazard_source, who_affected, likelihood, severity, risk_rating, residual_likelihood, residual_severity, residual_risk_rating, treatment_plan, treatment_type, controls, responsible_person, due_date, status, last_reviewed, next_review_date, review_notes, created_by, created_at, updated_at')
        .eq('company_id', companyId)
        .order('risk_rating', { ascending: false, nullsFirst: false })

      if (error) throw error
      setRisks(data || [])
    } catch (err) {
      console.error('Error fetching risks:', err)
      toast.error('Failed to load risk register')
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
        title: form.title,
        description: form.description,
        risk_type: form.risk_type,
        category: form.category,
        source: form.source || null,
        standards: form.standards,
        clause_reference: form.clause_reference || null,
        environmental_aspect: form.standards.includes('ISO_14001') ? form.environmental_aspect || null : null,
        environmental_impact: form.standards.includes('ISO_14001') ? form.environmental_impact || null : null,
        aspect_condition: form.standards.includes('ISO_14001') ? form.aspect_condition : null,
        hazard_type: form.standards.includes('ISO_45001') ? form.hazard_type || null : null,
        hazard_source: form.standards.includes('ISO_45001') ? form.hazard_source || null : null,
        who_affected: form.standards.includes('ISO_45001') ? form.who_affected || null : null,
        likelihood: form.likelihood || null,
        severity: form.severity || null,
        residual_likelihood: form.residual_likelihood || null,
        residual_severity: form.residual_severity || null,
        treatment_plan: form.treatment_plan || null,
        treatment_type: form.treatment_type || null,
        controls: form.controls || null,
        responsible_person: form.responsible_person || null,
        due_date: form.due_date || null,
        status: form.status,
        review_notes: form.review_notes || null,
        next_review_date: form.next_review_date || null,
      }

      if (editingRisk) {
        payload.last_reviewed = new Date().toISOString().split('T')[0]
        const { error } = await supabase.from('risks').update(payload).eq('id', editingRisk.id)
        if (error) throw error
        await logActivity({ companyId, userId: userProfile.id, action: 'updated', entityType: 'risk', entityId: editingRisk.id, changes: { title: form.title } })
        toast.success('Risk updated successfully')
      } else {
        const { docNumber } = await generateDocNumber(companyId, 'risk')
        payload.risk_number = docNumber
        payload.created_by = userProfile.id
        const { data, error } = await supabase.from('risks').insert(payload).select('id').single()
        if (error) throw error
        await logActivity({ companyId, userId: userProfile.id, action: 'created', entityType: 'risk', entityId: data.id, changes: { title: form.title, risk_type: form.risk_type } })
        toast.success('Risk registered successfully')
      }

      setShowForm(false)
      setEditingRisk(null)
      setForm(defaultForm)
      fetchRisks()
    } catch (err) {
      console.error('Error saving risk:', err)
      toast.error('Failed to save risk')
    }
  }

  const openEdit = (risk) => {
    setEditingRisk(risk)
    setForm({
      title: risk.title || '',
      description: risk.description || '',
      risk_type: risk.risk_type || 'risk',
      category: risk.category || 'operational',
      source: risk.source || '',
      standards: risk.standards || ['ISO_9001'],
      clause_reference: risk.clause_reference || '6.1',
      environmental_aspect: risk.environmental_aspect || '',
      environmental_impact: risk.environmental_impact || '',
      aspect_condition: risk.aspect_condition || 'normal',
      hazard_type: risk.hazard_type || '',
      hazard_source: risk.hazard_source || '',
      who_affected: risk.who_affected || '',
      likelihood: risk.likelihood || 3,
      severity: risk.severity || 3,
      residual_likelihood: risk.residual_likelihood || null,
      residual_severity: risk.residual_severity || null,
      treatment_plan: risk.treatment_plan || '',
      treatment_type: risk.treatment_type || 'mitigate',
      controls: risk.controls || '',
      responsible_person: risk.responsible_person || '',
      due_date: risk.due_date || '',
      status: risk.status || 'Open',
      review_notes: risk.review_notes || '',
      next_review_date: risk.next_review_date || '',
    })
    setShowForm(true)
  }

  const deleteRisk = async (id) => {
    try {
      const { error } = await supabase.from('risks').delete().eq('id', id)
      if (error) throw error
      await logActivity({ companyId: getEffectiveCompanyId(), userId: userProfile.id, action: 'deleted', entityType: 'risk', entityId: id })
      toast.success('Risk deleted')
      fetchRisks()
      setSelectedRisk(null)
    } catch (err) {
      console.error('Error deleting risk:', err)
      toast.error('Failed to delete risk')
    }
  }

  const toggleStandard = (code) => {
    setForm(prev => ({
      ...prev,
      standards: prev.standards.includes(code)
        ? prev.standards.filter(s => s !== code)
        : [...prev.standards, code]
    }))
  }

  // Filtered risks
  const filtered = risks.filter(r => {
    if (typeFilter !== 'all' && r.risk_type !== typeFilter) return false
    if (statusFilter !== 'all' && r.status !== statusFilter) return false
    if (standardFilter !== 'all' && !(r.standards || []).includes(standardFilter)) return false
    if (categoryFilter !== 'all' && r.category !== categoryFilter) return false
    return true
  })

  // Stats
  const totalRisks = risks.filter(r => r.risk_type === 'risk').length
  const totalOpps = risks.filter(r => r.risk_type === 'opportunity').length
  const criticalCount = risks.filter(r => r.risk_rating >= 16).length
  const highCount = risks.filter(r => r.risk_rating >= 10 && r.risk_rating < 16).length
  const openCount = risks.filter(r => r.status === 'Open' || r.status === 'In Treatment').length

  const getUserName = (id) => {
    const u = users.find(u => u.id === id)
    return u ? (u.full_name || u.email) : ''
  }

  // Export
  const exportRegister = async () => {
    try {
      setExporting(true)
      const companyName = userProfile?.company?.name || 'Company'
      const companyLogo = userProfile?.company?.logo_url || null
      const userName = userProfile?.full_name || userProfile?.email || ''

      const doc = await createBrandedPDF({
        title: 'Risk & Opportunities Register',
        docNumber: 'IG-RISK-REG',
        companyName,
        preparedBy: userName,
        companyLogoUrl: companyLogo,
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
          doc.text(`Total Risks: ${totalRisks}  |  Opportunities: ${totalOpps}  |  Critical: ${criticalCount}  |  High: ${highCount}  |  Open: ${openCount}`, margin, y)
          y += 10

          // Table header
          const cols = [margin, margin + 25, margin + 75, margin + 105, margin + 125, margin + 145]
          doc.setFillColor(30, 27, 75)
          doc.rect(margin, y - 4, contentWidth, 8, 'F')
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(7)
          doc.setTextColor(255, 255, 255)
          doc.text('Ref', cols[0] + 2, y + 1)
          doc.text('Title / Description', cols[1] + 2, y + 1)
          doc.text('Category', cols[2] + 2, y + 1)
          doc.text('Rating', cols[3] + 2, y + 1)
          doc.text('Status', cols[4] + 2, y + 1)
          doc.text('Treatment', cols[5] + 2, y + 1)
          y += 8

          risks.forEach((risk, i) => {
            if (y > 265) { doc.addPage(); y = 25 }
            const bg = i % 2 === 0 ? [249, 250, 251] : [255, 255, 255]
            doc.setFillColor(...bg)
            doc.rect(margin, y - 3, contentWidth, 7, 'F')

            doc.setFont('helvetica', 'normal')
            doc.setFontSize(7)
            doc.setTextColor(60, 60, 70)
            doc.text(risk.risk_number || '', cols[0] + 2, y + 1)
            const titleLines = doc.splitTextToSize(risk.title || '', 48)
            doc.text(titleLines[0] || '', cols[1] + 2, y + 1)
            doc.text(risk.category || '', cols[2] + 2, y + 1)

            const rating = risk.risk_rating
            const rColor = rating >= 16 ? [239, 68, 68] : rating >= 10 ? [249, 115, 22] : rating >= 5 ? [234, 179, 8] : [34, 197, 94]
            doc.setTextColor(...rColor)
            doc.setFont('helvetica', 'bold')
            doc.text(`${rating || '-'} (${getRatingLabel(rating)})`, cols[3] + 2, y + 1)

            doc.setTextColor(60, 60, 70)
            doc.setFont('helvetica', 'normal')
            doc.text(risk.status || '', cols[4] + 2, y + 1)
            doc.text(risk.treatment_type || '', cols[5] + 2, y + 1)
            y += Math.max(titleLines.length * 4, 7)
          })

          return y
        }
      })
      doc.save('IG-Risk_Opportunities_Register.pdf')
      toast.success('Risk register exported')
    } catch (err) {
      console.error('Export error:', err)
      toast.error('Failed to export risk register')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="text-white text-center py-12">Loading risk register...</div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-1">Risk & Opportunities Register</h2>
            <p className="text-white/60 text-sm">ISO 9001 §6.1 · ISO 14001 §6.1 · ISO 45001 §6.1</p>
          </div>
          <div className="flex gap-2 self-start sm:self-auto">
            {risks.length > 0 && (
              <button onClick={exportRegister} disabled={exporting}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold rounded-xl transition-all text-sm disabled:opacity-50">
                {exporting ? 'Exporting...' : 'Export PDF'}
              </button>
            )}
            <button onClick={() => { setEditingRisk(null); setForm(defaultForm); setShowForm(true) }}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all text-sm">
              + New Risk / Opportunity
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Risks', value: totalRisks, color: 'text-red-400' },
            { label: 'Opportunities', value: totalOpps, color: 'text-green-400' },
            { label: 'Critical', value: criticalCount, color: 'text-red-500' },
            { label: 'High', value: highCount, color: 'text-orange-400' },
            { label: 'Open', value: openCount, color: 'text-cyan-400' },
          ].map(kpi => (
            <div key={kpi.label} className="glass glass-border rounded-xl p-4 text-center">
              <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
              <div className="text-white/50 text-xs mt-1">{kpi.label}</div>
            </div>
          ))}
        </div>

        {/* Risk Matrix (5x5) */}
        <div className="glass glass-border rounded-2xl p-4 md:p-6">
          <h3 className="text-lg font-bold text-white mb-4">Risk Heat Map</h3>
          <div className="overflow-x-auto">
            <div className="min-w-[320px]">
              <div className="flex items-end mb-1">
                <div className="w-20 md:w-24" />
                {SEVERITY_LABELS.map((label, i) => (
                  <div key={i} className="flex-1 text-center text-[10px] md:text-xs text-white/50 px-0.5">{label}</div>
                ))}
              </div>
              {[5, 4, 3, 2, 1].map(l => (
                <div key={l} className="flex items-center">
                  <div className="w-20 md:w-24 text-[10px] md:text-xs text-white/50 pr-2 text-right">
                    {LIKELIHOOD_LABELS[l - 1]}
                  </div>
                  {[1, 2, 3, 4, 5].map(s => {
                    const rating = l * s
                    const count = risks.filter(r => r.likelihood === l && r.severity === s).length
                    const bg = rating <= 4 ? 'bg-green-500/30' : rating <= 9 ? 'bg-yellow-500/30' : rating <= 15 ? 'bg-orange-500/40' : 'bg-red-500/50'
                    return (
                      <div key={s} className={`flex-1 aspect-square m-0.5 rounded-lg ${bg} flex items-center justify-center relative`}>
                        <span className="text-[10px] text-white/40">{rating}</span>
                        {count > 0 && (
                          <span className="absolute -top-1 -right-1 bg-white text-[9px] font-bold text-gray-900 rounded-full w-4 h-4 flex items-center justify-center">
                            {count}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
              <div className="flex mt-1">
                <div className="w-20 md:w-24" />
                <div className="flex-1 text-center text-[10px] text-white/40">Severity →</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="glass-input rounded-lg px-3 py-1.5 text-sm text-white">
            <option value="all">All Types</option>
            <option value="risk">Risks Only</option>
            <option value="opportunity">Opportunities Only</option>
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="glass-input rounded-lg px-3 py-1.5 text-sm text-white">
            <option value="all">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={standardFilter} onChange={e => setStandardFilter(e.target.value)} className="glass-input rounded-lg px-3 py-1.5 text-sm text-white">
            <option value="all">All Standards</option>
            {STANDARDS.map(s => <option key={s.code} value={s.code}>{s.label}</option>)}
          </select>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="glass-input rounded-lg px-3 py-1.5 text-sm text-white">
            <option value="all">All Categories</option>
            {RISK_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        {/* Risk List */}
        <div className="space-y-2">
          {filtered.map(risk => (
            <div key={risk.id} className={`glass glass-border rounded-xl overflow-hidden cursor-pointer hover:bg-white/5 transition-colors ${selectedRisk?.id === risk.id ? 'ring-1 ring-purple-500' : ''}`}
              onClick={() => setSelectedRisk(selectedRisk?.id === risk.id ? null : risk)}>
              <div className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-3 h-3 rounded-full shrink-0 ${risk.risk_type === 'opportunity' ? 'bg-green-500' : risk.risk_rating >= 16 ? 'bg-red-500 animate-pulse' : risk.risk_rating >= 10 ? 'bg-orange-500' : risk.risk_rating >= 5 ? 'bg-yellow-500' : 'bg-green-500'}`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white/40 text-xs font-mono">{risk.risk_number}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${risk.risk_type === 'opportunity' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {risk.risk_type === 'opportunity' ? 'Opportunity' : 'Risk'}
                        </span>
                        {(risk.standards || []).map(s => (
                          <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">{s.replace('ISO_', 'ISO ')}</span>
                        ))}
                      </div>
                      <h4 className="text-white font-semibold text-sm mt-1 truncate">{risk.title}</h4>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className={`text-center px-3 py-1 rounded-lg border ${getRatingBg(risk.risk_rating)}`}>
                      <div className={`text-lg font-bold ${getRatingColor(risk.risk_rating)}`}>{risk.risk_rating || '-'}</div>
                      <div className="text-[10px] text-white/40">{getRatingLabel(risk.risk_rating)}</div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-lg font-medium ${
                      risk.status === 'Closed' ? 'bg-green-500/20 text-green-400' :
                      risk.status === 'Accepted' ? 'bg-blue-500/20 text-blue-400' :
                      risk.status === 'Monitoring' ? 'bg-cyan-500/20 text-cyan-400' :
                      risk.status === 'In Treatment' ? 'bg-orange-500/20 text-orange-400' :
                      'bg-white/10 text-white/60'
                    }`}>{risk.status}</span>
                  </div>
                </div>
              </div>

              {/* Expanded Detail */}
              {selectedRisk?.id === risk.id && (
                <div className="border-t border-white/10 p-4 space-y-4" onClick={e => e.stopPropagation()}>
                  {risk.description && <p className="text-white/70 text-sm">{risk.description}</p>}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-white/40 text-xs">Category</span>
                      <p className="text-white capitalize">{(risk.category || '').replace('_', ' ')}</p>
                    </div>
                    <div>
                      <span className="text-white/40 text-xs">Source</span>
                      <p className="text-white">{risk.source || '-'}</p>
                    </div>
                    <div>
                      <span className="text-white/40 text-xs">Treatment</span>
                      <p className="text-white capitalize">{risk.treatment_type || '-'}</p>
                    </div>
                    <div>
                      <span className="text-white/40 text-xs">Responsible</span>
                      <p className="text-white">{getUserName(risk.responsible_person) || '-'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="glass rounded-lg p-3">
                      <span className="text-white/40 text-xs">Inherent Risk</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-white/60 text-xs">L: {risk.likelihood}</span>
                        <span className="text-white/40">×</span>
                        <span className="text-white/60 text-xs">S: {risk.severity}</span>
                        <span className="text-white/40">=</span>
                        <span className={`font-bold ${getRatingColor(risk.risk_rating)}`}>{risk.risk_rating}</span>
                      </div>
                    </div>
                    <div className="glass rounded-lg p-3">
                      <span className="text-white/40 text-xs">Residual Risk</span>
                      <div className="flex items-center gap-2 mt-1">
                        {risk.residual_likelihood ? (
                          <>
                            <span className="text-white/60 text-xs">L: {risk.residual_likelihood}</span>
                            <span className="text-white/40">×</span>
                            <span className="text-white/60 text-xs">S: {risk.residual_severity}</span>
                            <span className="text-white/40">=</span>
                            <span className={`font-bold ${getRatingColor(risk.residual_risk_rating)}`}>{risk.residual_risk_rating}</span>
                          </>
                        ) : <span className="text-white/40 text-xs">Not assessed</span>}
                      </div>
                    </div>
                  </div>

                  {risk.treatment_plan && (
                    <div>
                      <span className="text-white/40 text-xs">Treatment Plan</span>
                      <p className="text-white/70 text-sm mt-1">{risk.treatment_plan}</p>
                    </div>
                  )}
                  {risk.controls && (
                    <div>
                      <span className="text-white/40 text-xs">Existing Controls</span>
                      <p className="text-white/70 text-sm mt-1">{risk.controls}</p>
                    </div>
                  )}

                  {/* ISO 14001 fields */}
                  {(risk.standards || []).includes('ISO_14001') && risk.environmental_aspect && (
                    <div className="glass rounded-lg p-3">
                      <span className="text-green-400 text-xs font-semibold">Environmental Aspect (ISO 14001)</span>
                      <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                        <div><span className="text-white/40 text-xs">Aspect</span><p className="text-white">{risk.environmental_aspect}</p></div>
                        <div><span className="text-white/40 text-xs">Impact</span><p className="text-white">{risk.environmental_impact}</p></div>
                        <div><span className="text-white/40 text-xs">Condition</span><p className="text-white capitalize">{risk.aspect_condition}</p></div>
                      </div>
                    </div>
                  )}

                  {/* ISO 45001 fields */}
                  {(risk.standards || []).includes('ISO_45001') && risk.hazard_type && (
                    <div className="glass rounded-lg p-3">
                      <span className="text-orange-400 text-xs font-semibold">Hazard Identification (ISO 45001)</span>
                      <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                        <div><span className="text-white/40 text-xs">Type</span><p className="text-white">{risk.hazard_type}</p></div>
                        <div><span className="text-white/40 text-xs">Source</span><p className="text-white">{risk.hazard_source}</p></div>
                        <div><span className="text-white/40 text-xs">Who Affected</span><p className="text-white">{risk.who_affected}</p></div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button onClick={() => openEdit(risk)} className="px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg text-sm hover:bg-purple-500/30 transition-colors">
                      Edit
                    </button>
                    <button onClick={() => setConfirmAction({ title: 'Delete Risk', message: `Delete "${risk.title}"? This cannot be undone.`, variant: 'danger', confirmLabel: 'Delete', onConfirm: () => { deleteRisk(risk.id); setConfirmAction(null) } })}
                      className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors">
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {filtered.length === 0 && !loading && (
          <div className="glass glass-border rounded-xl p-8 text-center">
            <p className="text-white/60 mb-2">No risks or opportunities found</p>
            <p className="text-white/40 text-sm">Click "New Risk / Opportunity" to start building your register</p>
          </div>
        )}

        {/* Create/Edit Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
            <div className="glass glass-border rounded-2xl p-6 w-full max-w-2xl my-8">
              <h3 className="text-xl font-bold text-white mb-4">{editingRisk ? 'Edit Risk / Opportunity' : 'Register New Risk / Opportunity'}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Type + Category */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">Type</label>
                    <select value={form.risk_type} onChange={e => setForm({ ...form, risk_type: e.target.value })} className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm">
                      <option value="risk">Risk</option>
                      <option value="opportunity">Opportunity</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">Category</label>
                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm">
                      {RISK_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="text-white/60 text-xs mb-1 block">Title *</label>
                  <input type="text" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Supplier delivery delays affecting production" className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                </div>

                {/* Description */}
                <div>
                  <label className="text-white/60 text-xs mb-1 block">Description</label>
                  <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Detailed description of the risk or opportunity..." className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                </div>

                {/* Standards */}
                <div>
                  <label className="text-white/60 text-xs mb-1 block">Applicable Standards *</label>
                  <div className="flex gap-2">
                    {STANDARDS.map(std => (
                      <button key={std.code} type="button" onClick={() => toggleStandard(std.code)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${form.standards.includes(std.code) ? 'bg-purple-500 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>
                        {std.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Source + Clause */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">Source</label>
                    <input type="text" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} placeholder="e.g. Internal audit, management review" className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                  </div>
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">Clause Reference</label>
                    <input type="text" value={form.clause_reference} onChange={e => setForm({ ...form, clause_reference: e.target.value })} placeholder="e.g. 6.1.1" className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                  </div>
                </div>

                {/* ISO 14001 Environmental Aspect fields */}
                {form.standards.includes('ISO_14001') && (
                  <div className="glass rounded-lg p-4 border border-green-500/20">
                    <h4 className="text-green-400 text-sm font-semibold mb-3">Environmental Aspect (ISO 14001 §6.1.2)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="text-white/60 text-xs mb-1 block">Aspect (Activity)</label>
                        <input type="text" value={form.environmental_aspect} onChange={e => setForm({ ...form, environmental_aspect: e.target.value })} placeholder="e.g. Waste disposal" className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                      </div>
                      <div>
                        <label className="text-white/60 text-xs mb-1 block">Environmental Impact</label>
                        <input type="text" value={form.environmental_impact} onChange={e => setForm({ ...form, environmental_impact: e.target.value })} placeholder="e.g. Soil contamination" className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                      </div>
                      <div>
                        <label className="text-white/60 text-xs mb-1 block">Condition</label>
                        <select value={form.aspect_condition} onChange={e => setForm({ ...form, aspect_condition: e.target.value })} className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm">
                          <option value="normal">Normal</option>
                          <option value="abnormal">Abnormal</option>
                          <option value="emergency">Emergency</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* ISO 45001 Hazard fields */}
                {form.standards.includes('ISO_45001') && (
                  <div className="glass rounded-lg p-4 border border-orange-500/20">
                    <h4 className="text-orange-400 text-sm font-semibold mb-3">Hazard Identification (ISO 45001 §6.1.2)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="text-white/60 text-xs mb-1 block">Hazard Type</label>
                        <input type="text" value={form.hazard_type} onChange={e => setForm({ ...form, hazard_type: e.target.value })} placeholder="e.g. Physical, Chemical, Ergonomic" className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                      </div>
                      <div>
                        <label className="text-white/60 text-xs mb-1 block">Hazard Source</label>
                        <input type="text" value={form.hazard_source} onChange={e => setForm({ ...form, hazard_source: e.target.value })} placeholder="e.g. Heavy machinery" className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                      </div>
                      <div>
                        <label className="text-white/60 text-xs mb-1 block">Who Is Affected</label>
                        <input type="text" value={form.who_affected} onChange={e => setForm({ ...form, who_affected: e.target.value })} placeholder="e.g. Workers, Visitors, Contractors" className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Risk Assessment */}
                <div className="glass rounded-lg p-4">
                  <h4 className="text-white text-sm font-semibold mb-3">Risk Assessment (5×5 Matrix)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-white/60 text-xs mb-1 block">Likelihood ({LIKELIHOOD_LABELS[(form.likelihood || 1) - 1]})</label>
                      <input type="range" min="1" max="5" value={form.likelihood} onChange={e => setForm({ ...form, likelihood: parseInt(e.target.value) })} className="w-full accent-purple-500" />
                      <div className="flex justify-between text-[10px] text-white/30"><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span></div>
                    </div>
                    <div>
                      <label className="text-white/60 text-xs mb-1 block">Severity ({SEVERITY_LABELS[(form.severity || 1) - 1]})</label>
                      <input type="range" min="1" max="5" value={form.severity} onChange={e => setForm({ ...form, severity: parseInt(e.target.value) })} className="w-full accent-purple-500" />
                      <div className="flex justify-between text-[10px] text-white/30"><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span></div>
                    </div>
                  </div>
                  <div className="mt-3 text-center">
                    <span className="text-white/40 text-sm">Inherent Risk Rating: </span>
                    <span className={`text-2xl font-bold ${getRatingColor((form.likelihood || 0) * (form.severity || 0))}`}>
                      {(form.likelihood || 0) * (form.severity || 0)}
                    </span>
                    <span className={`ml-2 text-sm ${getRatingColor((form.likelihood || 0) * (form.severity || 0))}`}>
                      ({getRatingLabel((form.likelihood || 0) * (form.severity || 0))})
                    </span>
                  </div>
                </div>

                {/* Treatment */}
                <div>
                  <label className="text-white/60 text-xs mb-1 block">Treatment Type</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {TREATMENT_TYPES.filter(t => form.risk_type === 'risk' ? ['avoid', 'mitigate', 'transfer', 'accept'].includes(t.value) : ['exploit', 'enhance', 'share', 'accept'].includes(t.value)).map(t => (
                      <button key={t.value} type="button" onClick={() => setForm({ ...form, treatment_type: t.value })}
                        className={`px-3 py-2 rounded-lg text-xs transition-all text-left ${form.treatment_type === t.value ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}>
                        <div className="font-semibold">{t.label}</div>
                        <div className="text-[10px] mt-0.5 opacity-70">{t.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-white/60 text-xs mb-1 block">Treatment Plan</label>
                  <textarea rows={2} value={form.treatment_plan} onChange={e => setForm({ ...form, treatment_plan: e.target.value })} placeholder="Actions to address this risk/opportunity..." className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                </div>

                <div>
                  <label className="text-white/60 text-xs mb-1 block">Existing Controls</label>
                  <textarea rows={2} value={form.controls} onChange={e => setForm({ ...form, controls: e.target.value })} placeholder="What controls are already in place..." className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                </div>

                {/* Residual Risk */}
                <div className="glass rounded-lg p-4">
                  <h4 className="text-white text-sm font-semibold mb-3">Residual Risk (After Treatment)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-white/60 text-xs mb-1 block">Residual Likelihood</label>
                      <input type="range" min="0" max="5" value={form.residual_likelihood || 0} onChange={e => setForm({ ...form, residual_likelihood: parseInt(e.target.value) || null })} className="w-full accent-cyan-500" />
                      <div className="flex justify-between text-[10px] text-white/30"><span>N/A</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span></div>
                    </div>
                    <div>
                      <label className="text-white/60 text-xs mb-1 block">Residual Severity</label>
                      <input type="range" min="0" max="5" value={form.residual_severity || 0} onChange={e => setForm({ ...form, residual_severity: parseInt(e.target.value) || null })} className="w-full accent-cyan-500" />
                      <div className="flex justify-between text-[10px] text-white/30"><span>N/A</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span></div>
                    </div>
                  </div>
                  {form.residual_likelihood && form.residual_severity && (
                    <div className="mt-3 text-center">
                      <span className="text-white/40 text-sm">Residual Risk Rating: </span>
                      <span className={`text-2xl font-bold ${getRatingColor(form.residual_likelihood * form.residual_severity)}`}>
                        {form.residual_likelihood * form.residual_severity}
                      </span>
                    </div>
                  )}
                </div>

                {/* Assignment */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">Responsible Person</label>
                    <select value={form.responsible_person} onChange={e => setForm({ ...form, responsible_person: e.target.value })} className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm">
                      <option value="">Unassigned</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.full_name || u.email}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">Due Date</label>
                    <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                  </div>
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">Status</label>
                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm">
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                {/* Review */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">Next Review Date</label>
                    <input type="date" value={form.next_review_date} onChange={e => setForm({ ...form, next_review_date: e.target.value })} className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                  </div>
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">Review Notes</label>
                    <input type="text" value={form.review_notes} onChange={e => setForm({ ...form, review_notes: e.target.value })} placeholder="Notes from last review..." className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="submit" className="flex-1 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all">
                    {editingRisk ? 'Update Risk' : 'Register Risk / Opportunity'}
                  </button>
                  <button type="button" onClick={() => { setShowForm(false); setEditingRisk(null); setForm(defaultForm) }}
                    className="px-6 py-2.5 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {confirmAction && (
          <ConfirmModal
            title={confirmAction.title}
            message={confirmAction.message}
            variant={confirmAction.variant}
            confirmLabel={confirmAction.confirmLabel}
            onConfirm={confirmAction.onConfirm}
            onCancel={() => setConfirmAction(null)}
          />
        )}
      </div>
    </Layout>
  )
}

export default RiskRegister

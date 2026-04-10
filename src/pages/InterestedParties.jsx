import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { supabase } from '../lib/supabase'
import { logActivity } from '../lib/auditLogger'
import Layout from '../components/Layout'
import ConfirmModal from '../components/ConfirmModal'
import { createBrandedPDF } from '../lib/brandedPDFExport'

const PARTY_TYPES = [
  { value: 'customer', label: 'Customers', icon: '👥' },
  { value: 'supplier', label: 'Suppliers / Providers', icon: '🏭' },
  { value: 'employee', label: 'Employees / Workers', icon: '👷' },
  { value: 'regulator', label: 'Regulators / Government', icon: '⚖️' },
  { value: 'shareholder', label: 'Shareholders / Owners', icon: '📊' },
  { value: 'community', label: 'Community', icon: '🏘️' },
  { value: 'contractor', label: 'Contractors', icon: '🔧' },
  { value: 'union', label: 'Trade Unions', icon: '🤝' },
  { value: 'insurance', label: 'Insurers', icon: '🛡️' },
  { value: 'neighbour', label: 'Neighbours', icon: '📍' },
  { value: 'other', label: 'Other', icon: '📋' },
]

const INFLUENCE_LEVELS = [
  { value: 'low', label: 'Low', color: 'bg-green-500/20 text-green-400' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-500/20 text-yellow-400' },
  { value: 'high', label: 'High', color: 'bg-orange-500/20 text-orange-400' },
  { value: 'critical', label: 'Critical', color: 'bg-red-500/20 text-red-400' },
]

const STANDARDS = [
  { code: 'ISO_9001', label: 'ISO 9001' },
  { code: 'ISO_14001', label: 'ISO 14001' },
  { code: 'ISO_45001', label: 'ISO 45001' },
]

const InterestedParties = () => {
  const { userProfile, getEffectiveCompanyId } = useAuth()
  const toast = useToast()
  const [parties, setParties] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [selectedParty, setSelectedParty] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)
  const [exporting, setExporting] = useState(false)

  // Filters
  const [typeFilter, setTypeFilter] = useState('all')
  const [standardFilter, setStandardFilter] = useState('all')
  const [influenceFilter, setInfluenceFilter] = useState('all')

  const defaultForm = {
    party_name: '', party_type: 'customer', description: '', contact_info: '',
    needs_expectations: '', relevance: '', obligations: '',
    standards: ['ISO_9001', 'ISO_14001', 'ISO_45001'], clause_reference: '4.2',
    influence_level: 'medium', engagement_strategy: '', review_notes: '',
  }
  const [form, setForm] = useState(defaultForm)

  useEffect(() => {
    if (userProfile) fetchParties()
  }, [userProfile])

  const fetchParties = async () => {
    try {
      setLoading(true)
      const companyId = getEffectiveCompanyId()
      const { data, error } = await supabase
        .from('interested_parties')
        .select('id, party_name, party_type, description, contact_info, needs_expectations, relevance, obligations, standards, clause_reference, influence_level, engagement_strategy, last_reviewed, review_notes, created_at, updated_at')
        .eq('company_id', companyId)
        .order('party_type')

      if (error) throw error
      setParties(data || [])
    } catch (err) {
      console.error('Error fetching interested parties:', err)
      toast.error('Failed to load interested parties')
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
        party_name: form.party_name,
        party_type: form.party_type,
        description: form.description || null,
        contact_info: form.contact_info || null,
        needs_expectations: form.needs_expectations,
        relevance: form.relevance || null,
        obligations: form.obligations || null,
        standards: form.standards,
        clause_reference: form.clause_reference || '4.2',
        influence_level: form.influence_level || 'medium',
        engagement_strategy: form.engagement_strategy || null,
        review_notes: form.review_notes || null,
      }

      if (editing) {
        payload.last_reviewed = new Date().toISOString().split('T')[0]
        const { error } = await supabase.from('interested_parties').update(payload).eq('id', editing.id)
        if (error) throw error
        await logActivity({ companyId, userId: userProfile.id, action: 'updated', entityType: 'interested_party', entityId: editing.id, changes: { party_name: form.party_name } })
        toast.success('Interested party updated')
      } else {
        payload.created_by = userProfile.id
        const { data, error } = await supabase.from('interested_parties').insert(payload).select('id').single()
        if (error) throw error
        await logActivity({ companyId, userId: userProfile.id, action: 'created', entityType: 'interested_party', entityId: data.id, changes: { party_name: form.party_name, party_type: form.party_type } })
        toast.success('Interested party added')
      }

      setShowForm(false)
      setEditing(null)
      setForm(defaultForm)
      fetchParties()
    } catch (err) {
      console.error('Error saving:', err)
      toast.error('Failed to save interested party')
    }
  }

  const openEdit = (p) => {
    setEditing(p)
    setForm({
      party_name: p.party_name || '',
      party_type: p.party_type || 'customer',
      description: p.description || '',
      contact_info: p.contact_info || '',
      needs_expectations: p.needs_expectations || '',
      relevance: p.relevance || '',
      obligations: p.obligations || '',
      standards: p.standards || ['ISO_9001'],
      clause_reference: p.clause_reference || '4.2',
      influence_level: p.influence_level || 'medium',
      engagement_strategy: p.engagement_strategy || '',
      review_notes: p.review_notes || '',
    })
    setShowForm(true)
  }

  const deleteParty = async (id) => {
    try {
      const { error } = await supabase.from('interested_parties').delete().eq('id', id)
      if (error) throw error
      await logActivity({ companyId: getEffectiveCompanyId(), userId: userProfile.id, action: 'deleted', entityType: 'interested_party', entityId: id })
      toast.success('Interested party deleted')
      fetchParties()
      setSelectedParty(null)
    } catch (err) {
      console.error('Error deleting:', err)
      toast.error('Failed to delete')
    }
  }

  const toggleStandard = (code) => {
    setForm(prev => ({
      ...prev,
      standards: prev.standards.includes(code) ? prev.standards.filter(s => s !== code) : [...prev.standards, code]
    }))
  }

  // Filtered
  const filtered = parties.filter(p => {
    if (typeFilter !== 'all' && p.party_type !== typeFilter) return false
    if (standardFilter !== 'all' && !(p.standards || []).includes(standardFilter)) return false
    if (influenceFilter !== 'all' && p.influence_level !== influenceFilter) return false
    return true
  })

  // Group by type
  const grouped = {}
  filtered.forEach(p => {
    if (!grouped[p.party_type]) grouped[p.party_type] = []
    grouped[p.party_type].push(p)
  })

  // Stats
  const totalParties = parties.length
  const criticalCount = parties.filter(p => p.influence_level === 'critical').length
  const highCount = parties.filter(p => p.influence_level === 'high').length
  const withObligations = parties.filter(p => p.obligations).length

  const getInfluenceStyle = (level) => INFLUENCE_LEVELS.find(l => l.value === level)?.color || 'bg-white/10 text-white/50'
  const getPartyIcon = (type) => PARTY_TYPES.find(t => t.value === type)?.icon || '📋'
  const getPartyLabel = (type) => PARTY_TYPES.find(t => t.value === type)?.label || type

  // Export
  const exportRegister = async () => {
    try {
      setExporting(true)
      const companyName = userProfile?.company?.name || 'Company'
      const companyLogo = userProfile?.company?.logo_url || null
      const userName = userProfile?.full_name || userProfile?.email || ''

      const doc = await createBrandedPDF({
        title: 'Interested Parties Register',
        docNumber: 'IG-IP-REG',
        companyName, preparedBy: userName, companyLogoUrl: companyLogo,
        type: 'document',
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
          doc.text(`Total: ${totalParties}  |  Critical: ${criticalCount}  |  High: ${highCount}  |  With Obligations: ${withObligations}`, margin, y)
          y += 12

          Object.entries(grouped).forEach(([type, items]) => {
            if (y > 250) { doc.addPage(); y = 25 }

            doc.setFillColor(30, 27, 75)
            doc.rect(margin, y - 4, contentWidth, 8, 'F')
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(9)
            doc.setTextColor(255, 255, 255)
            doc.text(`${getPartyLabel(type)} (${items.length})`, margin + 2, y + 1)
            y += 10

            items.forEach(party => {
              if (y > 265) { doc.addPage(); y = 25 }

              doc.setFont('helvetica', 'bold')
              doc.setFontSize(8)
              doc.setTextColor(30, 27, 75)
              doc.text(party.party_name, margin + 4, y + 2)

              const infColor = party.influence_level === 'critical' ? [239, 68, 68] : party.influence_level === 'high' ? [249, 115, 22] : [107, 114, 128]
              doc.setFont('helvetica', 'bold')
              doc.setFontSize(7)
              doc.setTextColor(...infColor)
              doc.text((party.influence_level || '').toUpperCase(), pageWidth - margin - 2, y + 2, { align: 'right' })
              y += 6

              doc.setFont('helvetica', 'normal')
              doc.setFontSize(7)
              doc.setTextColor(60, 60, 70)

              const needsLines = doc.splitTextToSize(`Needs: ${party.needs_expectations}`, contentWidth - 10)
              doc.text(needsLines, margin + 4, y + 1)
              y += needsLines.length * 3.5

              if (party.obligations) {
                const oblLines = doc.splitTextToSize(`Obligations: ${party.obligations}`, contentWidth - 10)
                doc.text(oblLines, margin + 4, y + 1)
                y += oblLines.length * 3.5
              }
              y += 4
            })
            y += 2
          })

          return y
        }
      })
      doc.save('IG-Interested_Parties_Register.pdf')
      toast.success('Register exported')
    } catch (err) {
      console.error('Export error:', err)
      toast.error('Failed to export')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return <Layout><div className="text-white text-center py-12">Loading interested parties...</div></Layout>
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-1">Interested Parties Register</h2>
            <p className="text-white/60 text-sm">ISO 9001 §4.2 · ISO 14001 §4.2 · ISO 45001 §4.2</p>
          </div>
          <div className="flex gap-2 self-start sm:self-auto">
            {parties.length > 0 && (
              <button onClick={exportRegister} disabled={exporting}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold rounded-xl transition-all text-sm disabled:opacity-50">
                {exporting ? 'Exporting...' : 'Export PDF'}
              </button>
            )}
            <button onClick={() => { setEditing(null); setForm(defaultForm); setShowForm(true) }}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all text-sm">
              + Add Party
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Parties', value: totalParties, color: 'text-white' },
            { label: 'Critical', value: criticalCount, color: 'text-red-400' },
            { label: 'High', value: highCount, color: 'text-orange-400' },
            { label: 'With Obligations', value: withObligations, color: 'text-cyan-400' },
          ].map(kpi => (
            <div key={kpi.label} className="glass glass-border rounded-xl p-4 text-center">
              <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
              <div className="text-white/50 text-xs mt-1">{kpi.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="glass-input rounded-lg px-3 py-1.5 text-sm text-white">
            <option value="all">All Types</option>
            {PARTY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select value={standardFilter} onChange={e => setStandardFilter(e.target.value)} className="glass-input rounded-lg px-3 py-1.5 text-sm text-white">
            <option value="all">All Standards</option>
            {STANDARDS.map(s => <option key={s.code} value={s.code}>{s.label}</option>)}
          </select>
          <select value={influenceFilter} onChange={e => setInfluenceFilter(e.target.value)} className="glass-input rounded-lg px-3 py-1.5 text-sm text-white">
            <option value="all">All Influence</option>
            {INFLUENCE_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
        </div>

        {/* Grouped List */}
        {Object.entries(grouped).map(([type, items]) => (
          <div key={type}>
            <h3 className="text-sm font-semibold text-white/50 mb-2 flex items-center gap-2">
              <span>{getPartyIcon(type)}</span> {getPartyLabel(type)} ({items.length})
            </h3>
            <div className="space-y-2">
              {items.map(party => {
                const isExpanded = selectedParty?.id === party.id
                return (
                  <div key={party.id} className={`glass glass-border rounded-xl overflow-hidden ${isExpanded ? 'ring-1 ring-purple-500' : ''}`}>
                    <div className="p-4 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => setSelectedParty(isExpanded ? null : party)}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-white font-semibold text-sm">{party.party_name}</h4>
                            {(party.standards || []).map(s => (
                              <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">{s.replace('ISO_', 'ISO ')}</span>
                            ))}
                          </div>
                          <p className="text-white/50 text-xs mt-1 line-clamp-1">{party.needs_expectations}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-lg font-medium shrink-0 ${getInfluenceStyle(party.influence_level)}`}>
                          {(party.influence_level || 'medium').charAt(0).toUpperCase() + (party.influence_level || 'medium').slice(1)}
                        </span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-white/10 p-4 space-y-3" onClick={e => e.stopPropagation()}>
                        {party.description && <p className="text-white/70 text-sm">{party.description}</p>}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="glass rounded-lg p-3">
                            <span className="text-cyan-400 text-xs font-semibold">Needs & Expectations</span>
                            <p className="text-white/70 text-sm mt-1">{party.needs_expectations}</p>
                          </div>
                          {party.obligations && (
                            <div className="glass rounded-lg p-3">
                              <span className="text-orange-400 text-xs font-semibold">Compliance Obligations</span>
                              <p className="text-white/70 text-sm mt-1">{party.obligations}</p>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                          {party.relevance && <div><span className="text-white/40 text-xs">Relevance</span><p className="text-white">{party.relevance}</p></div>}
                          {party.engagement_strategy && <div><span className="text-white/40 text-xs">Engagement Strategy</span><p className="text-white">{party.engagement_strategy}</p></div>}
                          {party.contact_info && <div><span className="text-white/40 text-xs">Contact</span><p className="text-white">{party.contact_info}</p></div>}
                        </div>

                        {party.last_reviewed && <p className="text-white/30 text-xs">Last reviewed: {party.last_reviewed}</p>}

                        <div className="flex gap-2 pt-2">
                          <button onClick={() => openEdit(party)} className="px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg text-sm hover:bg-purple-500/30 transition-colors">Edit</button>
                          <button onClick={() => setConfirmAction({ title: 'Delete Interested Party', message: `Delete "${party.party_name}"?`, variant: 'danger', confirmLabel: 'Delete', onConfirm: () => { deleteParty(party.id); setConfirmAction(null) } })}
                            className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors">Delete</button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {filtered.length === 0 && !loading && (
          <div className="glass glass-border rounded-xl p-8 text-center">
            <p className="text-white/60 mb-2">No interested parties found</p>
            <p className="text-white/40 text-sm">Identify stakeholders and their needs to meet ISO 4.2 requirements</p>
          </div>
        )}

        {/* Create/Edit Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
            <div className="glass glass-border rounded-2xl p-6 w-full max-w-2xl my-8">
              <h3 className="text-xl font-bold text-white mb-4">{editing ? 'Edit Interested Party' : 'Add Interested Party'}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">Party Name *</label>
                    <input type="text" required value={form.party_name} onChange={e => setForm({ ...form, party_name: e.target.value })}
                      placeholder="e.g. Department of Employment and Labour" className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                  </div>
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">Type *</label>
                    <select value={form.party_type} onChange={e => setForm({ ...form, party_type: e.target.value })} className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm">
                      {PARTY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-white/60 text-xs mb-1 block">Description</label>
                  <textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="Who they are and their relationship to the organisation..." className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                </div>

                <div>
                  <label className="text-white/60 text-xs mb-1 block">Needs & Expectations * (ISO 4.2: "relevant requirements")</label>
                  <textarea rows={3} required value={form.needs_expectations} onChange={e => setForm({ ...form, needs_expectations: e.target.value })}
                    placeholder="What does this party need/expect from your organisation? e.g. Compliance with OHS Act, safe working environment, timely reporting..." className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                </div>

                <div>
                  <label className="text-white/60 text-xs mb-1 block">Compliance Obligations</label>
                  <textarea rows={2} value={form.obligations} onChange={e => setForm({ ...form, obligations: e.target.value })}
                    placeholder="Legal, regulatory, or contractual obligations arising from this party..." className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                </div>

                <div>
                  <label className="text-white/60 text-xs mb-1 block">Relevance to IMS</label>
                  <input type="text" value={form.relevance} onChange={e => setForm({ ...form, relevance: e.target.value })}
                    placeholder="Why this party is relevant to the management system..." className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">Influence Level</label>
                    <select value={form.influence_level} onChange={e => setForm({ ...form, influence_level: e.target.value })} className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm">
                      {INFLUENCE_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">Contact Info</label>
                    <input type="text" value={form.contact_info} onChange={e => setForm({ ...form, contact_info: e.target.value })}
                      placeholder="Email, phone, or address" className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                  </div>
                </div>

                <div>
                  <label className="text-white/60 text-xs mb-1 block">Engagement Strategy</label>
                  <textarea rows={2} value={form.engagement_strategy} onChange={e => setForm({ ...form, engagement_strategy: e.target.value })}
                    placeholder="How do you engage with this party? e.g. Monthly reports, annual meetings, surveys..." className="glass-input rounded-lg px-3 py-2 text-white w-full text-sm" />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="submit" className="flex-1 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all">
                    {editing ? 'Update' : 'Add Interested Party'}
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

export default InterestedParties

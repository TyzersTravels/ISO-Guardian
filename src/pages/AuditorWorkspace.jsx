import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { generateAuditReport } from '../lib/auditReportPDF'

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auditor-portal`

const AuditorWorkspace = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [session, setSession] = useState(null)
  const [evidence, setEvidence] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [showFindingForm, setShowFindingForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [checklist, setChecklist] = useState({})
  const [findingForm, setFindingForm] = useState({
    clause: '',
    standard: '',
    finding_type: 'minor_nc',
    description: '',
    evidence: '',
    auditor_notes: '',
  })
  const [findings, setFindings] = useState([])
  const [photoFiles, setPhotoFiles] = useState([])
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  useEffect(() => {
    if (token) {
      validateAndLoad()
    } else {
      setError('No access token provided. Please use the link shared with you.')
      setLoading(false)
    }
  }, [token])

  const apiFetch = async (endpoint, options = {}) => {
    const res = await fetch(`${FUNCTION_URL}/${endpoint}`, {
      headers: { 'x-auditor-token': token, 'Content-Type': 'application/json', ...options.headers },
      ...options,
    })
    return res.json()
  }

  const validateAndLoad = async () => {
    try {
      const sessionData = await apiFetch('validate')
      if (sessionData.error) {
        setError(sessionData.error)
        return
      }
      setSession(sessionData)

      const evidenceData = await apiFetch('evidence')
      if (!evidenceData.error) {
        setEvidence(evidenceData)
        if (evidenceData.audit?.standard) {
          setFindingForm(prev => ({ ...prev, standard: evidenceData.audit.standard }))
        }
      }
    } catch {
      setError('Unable to connect to ISOGuardian. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const submitFinding = async (e) => {
    e.preventDefault()
    if (!findingForm.clause || !findingForm.description) return
    setSubmitting(true)
    try {
      const result = await apiFetch('findings', {
        method: 'POST',
        body: JSON.stringify(findingForm),
      })
      if (result.error) throw new Error(result.error)
      const findingId = result.finding?.id

      // Upload photos if any
      if (photoFiles.length > 0 && findingId) {
        setUploadingPhoto(true)
        for (const photo of photoFiles) {
          const fd = new FormData()
          fd.append('photo', photo)
          fd.append('finding_id', findingId)
          await fetch(`${FUNCTION_URL}/upload`, {
            method: 'POST',
            headers: { 'x-auditor-token': token },
            body: fd,
          }).catch(() => {})
        }
        setUploadingPhoto(false)
      }

      setFindings(prev => [...prev, result.finding])
      setShowFindingForm(false)
      setPhotoFiles([])
      setFindingForm(prev => ({ ...prev, clause: '', description: '', evidence: '', auditor_notes: '' }))
    } catch (err) {
      alert(err.message || 'Failed to submit finding')
    } finally {
      setSubmitting(false)
    }
  }

  const updateChecklist = async (clause, standard, clauseTitle, result) => {
    const key = `${standard}-${clause}`
    setChecklist(prev => ({ ...prev, [key]: result }))
    await apiFetch('checklist', {
      method: 'POST',
      body: JSON.stringify({ clause, standard, clause_title: clauseTitle, result }),
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <img src="/isoguardian-logo.png" alt="ISOGuardian" className="w-12 h-12 mx-auto mb-4 rounded-lg" />
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-white/50 text-sm">Loading audit workspace...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
        <div className="glass glass-border rounded-2xl p-8 max-w-md text-center">
          <svg className="w-16 h-16 text-red-400/50 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m0 0v2m0-2h2m-2 0H10m9.364-9.364l-3.536 3.536M5.636 5.636l3.536 3.536m0 5.656l-3.536 3.536m9.192-9.192l3.536 3.536" />
          </svg>
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-white/50 text-sm">{error}</p>
          <p className="text-white/30 text-xs mt-4">Contact the company that shared this link if you believe this is an error.</p>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'documents', label: `Documents (${evidence?.documents?.length || 0})` },
    { id: 'compliance', label: 'Compliance' },
    { id: 'ncrs', label: `NCRs (${evidence?.openNcrs?.length || 0})` },
    { id: 'findings', label: `Findings (${findings.length})` },
    { id: 'checklist', label: 'Checklist' },
  ]

  const findingTypeLabels = {
    major_nc: { label: 'Major NC', color: 'bg-red-500/20 text-red-300' },
    minor_nc: { label: 'Minor NC', color: 'bg-orange-500/20 text-orange-300' },
    observation: { label: 'Observation', color: 'bg-yellow-500/20 text-yellow-300' },
    opportunity: { label: 'Opportunity', color: 'bg-blue-500/20 text-blue-300' },
    conformity: { label: 'Conformity', color: 'bg-green-500/20 text-green-300' },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <header className="glass glass-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/isoguardian-logo.png" alt="ISOGuardian" className="w-8 h-8 rounded-lg" />
            <div>
              <h1 className="text-sm font-bold">
                <span className="text-cyan-400">Audit Connect</span> — {evidence?.company?.name}
              </h1>
              <p className="text-xs text-white/40">{evidence?.audit?.title} | {evidence?.audit?.standard}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/60">{session?.session?.auditorName}</p>
            <p className="text-xs text-white/30">{session?.session?.auditorOrganisation}</p>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto py-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                  : 'text-white/60 hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
          <div className="ml-auto flex gap-2">
            <button
              onClick={async () => {
                let logoDataUrl = null
                if (evidence?.company?.logoUrl) {
                  try {
                    const resp = await fetch(evidence.company.logoUrl)
                    const blob = await resp.blob()
                    logoDataUrl = await new Promise(resolve => {
                      const reader = new FileReader()
                      reader.onloadend = () => resolve(reader.result)
                      reader.readAsDataURL(blob)
                    })
                  } catch { /* fallback to IG monogram */ }
                }
                generateAuditReport({
                  company: evidence?.company,
                  audit: evidence?.audit,
                  auditor: { name: session?.session?.auditorName, email: session?.session?.auditorEmail, organisation: session?.session?.auditorOrganisation },
                  findings,
                  checklist: Object.entries(checklist).map(([key, result]) => {
                    const [standard, ...clauseParts] = key.split('-')
                    const clause = clauseParts.join('-')
                    return { standard, clause, result }
                  }),
                  summary: evidence?.summary,
                  previousAudits: evidence?.previousAudits,
                }, logoDataUrl)
              }}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 whitespace-nowrap"
            >
              Generate Report
            </button>
            <button
              onClick={() => { setShowFindingForm(true); setActiveTab('findings') }}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 whitespace-nowrap"
            >
              + Raise Finding
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && evidence && (
          <div className="space-y-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Documents', value: evidence.summary.totalDocuments, color: 'text-cyan-400' },
                { label: 'Open NCRs', value: evidence.summary.openNcrs, color: evidence.summary.openNcrs > 0 ? 'text-amber-400' : 'text-green-400' },
                { label: 'Critical NCRs', value: evidence.summary.criticalNcrs, color: evidence.summary.criticalNcrs > 0 ? 'text-red-400' : 'text-green-400' },
                { label: 'Compliance Avg', value: `${evidence.summary.complianceAvg}%`, color: evidence.summary.complianceAvg >= 80 ? 'text-green-400' : 'text-amber-400' },
              ].map((stat) => (
                <div key={stat.label} className="glass glass-border rounded-xl p-4 text-center">
                  <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-white/50 text-sm">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="glass glass-border rounded-xl p-5">
                <h3 className="font-semibold text-white mb-3">Audit Details</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between"><dt className="text-white/50">Type</dt><dd>{evidence.audit.type}</dd></div>
                  <div className="flex justify-between"><dt className="text-white/50">Standard</dt><dd>{evidence.audit.standard}</dd></div>
                  <div className="flex justify-between"><dt className="text-white/50">Scope</dt><dd>{evidence.audit.scope || 'Full scope'}</dd></div>
                  <div className="flex justify-between"><dt className="text-white/50">Date</dt><dd>{new Date(evidence.audit.scheduledDate).toLocaleDateString('en-ZA')}</dd></div>
                </dl>
              </div>
              <div className="glass glass-border rounded-xl p-5">
                <h3 className="font-semibold text-white mb-3">Previous Audits</h3>
                {evidence.previousAudits.length === 0 ? (
                  <p className="text-white/40 text-sm">No previous audits on record</p>
                ) : (
                  <div className="space-y-2">
                    {evidence.previousAudits.map(a => (
                      <div key={a.id} className="flex justify-between text-sm">
                        <span className="text-white/70">{a.title}</span>
                        <span className="text-white/40">{new Date(a.scheduled_date).toLocaleDateString('en-ZA')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div className="space-y-3">
            {(evidence?.documents || []).length === 0 ? (
              <div className="glass glass-border rounded-xl p-8 text-center text-white/40">No documents uploaded</div>
            ) : (
              evidence.documents.map(doc => (
                <div key={doc.id} className="glass glass-border rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white text-sm">{doc.name}</p>
                    <p className="text-white/40 text-xs">{doc.standard} — Clause {doc.clause} | {doc.type} | {doc.status}</p>
                  </div>
                  <span className="text-xs text-white/30">{new Date(doc.updated_at || doc.created_at).toLocaleDateString('en-ZA')}</span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Compliance Tab */}
        {activeTab === 'compliance' && (
          <div className="space-y-3">
            {(evidence?.compliance || []).length === 0 ? (
              <div className="glass glass-border rounded-xl p-8 text-center text-white/40">No compliance data recorded</div>
            ) : (
              evidence.compliance.map((c, i) => (
                <div key={i} className="glass glass-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-white text-sm">Clause {c.clause}: {c.clause_title || ''}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      c.score >= 80 ? 'bg-green-500/20 text-green-300' :
                      c.score >= 50 ? 'bg-yellow-500/20 text-yellow-300' :
                      'bg-red-500/20 text-red-300'
                    }`}>
                      {c.score || 0}%
                    </span>
                  </div>
                  <p className="text-white/40 text-xs">{c.standard} | Status: {c.status}</p>
                  {c.evidence_notes && <p className="text-white/50 text-xs mt-1">{c.evidence_notes}</p>}
                </div>
              ))
            )}
          </div>
        )}

        {/* NCRs Tab */}
        {activeTab === 'ncrs' && (
          <div className="space-y-3">
            {(evidence?.openNcrs || []).length === 0 ? (
              <div className="glass glass-border rounded-xl p-8 text-center text-white/40">No open NCRs</div>
            ) : (
              evidence.openNcrs.map(ncr => (
                <div key={ncr.id} className="glass glass-border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-cyan-300">{ncr.ncr_number}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      ncr.severity === 'Critical' ? 'bg-red-500/20 text-red-300' :
                      ncr.severity === 'Major' ? 'bg-orange-500/20 text-orange-300' :
                      'bg-yellow-500/20 text-yellow-300'
                    }`}>
                      {ncr.severity}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${ncr.status === 'Open' ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>
                      {ncr.status}
                    </span>
                  </div>
                  <p className="text-white text-sm">{ncr.title}</p>
                  <p className="text-white/40 text-xs">{ncr.standard} — Clause {ncr.clause}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* Findings Tab */}
        {activeTab === 'findings' && (
          <div className="space-y-4">
            {showFindingForm && (
              <form onSubmit={submitFinding} className="glass glass-border rounded-xl p-5 space-y-3">
                <h3 className="font-semibold text-white">Raise Audit Finding</h3>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-white/50 mb-1 block">Standard</label>
                    <select
                      value={findingForm.standard}
                      onChange={(e) => setFindingForm({ ...findingForm, standard: e.target.value })}
                      className="glass-input w-full px-3 py-2 rounded-lg text-white text-sm"
                    >
                      <option value="ISO 9001:2015">ISO 9001:2015</option>
                      <option value="ISO 14001:2015">ISO 14001:2015</option>
                      <option value="ISO 45001:2018">ISO 45001:2018</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-white/50 mb-1 block">Clause *</label>
                    <input
                      type="text"
                      value={findingForm.clause}
                      onChange={(e) => setFindingForm({ ...findingForm, clause: e.target.value })}
                      className="glass-input w-full px-3 py-2 rounded-lg text-white text-sm"
                      placeholder="e.g. 8.5.1"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/50 mb-1 block">Type *</label>
                    <select
                      value={findingForm.finding_type}
                      onChange={(e) => setFindingForm({ ...findingForm, finding_type: e.target.value })}
                      className="glass-input w-full px-3 py-2 rounded-lg text-white text-sm"
                    >
                      <option value="major_nc">Major Non-Conformity</option>
                      <option value="minor_nc">Minor Non-Conformity</option>
                      <option value="observation">Observation</option>
                      <option value="opportunity">Opportunity for Improvement</option>
                      <option value="conformity">Conformity</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Description *</label>
                  <textarea
                    value={findingForm.description}
                    onChange={(e) => setFindingForm({ ...findingForm, description: e.target.value })}
                    className="glass-input w-full px-3 py-2 rounded-lg text-white text-sm h-24 resize-none"
                    placeholder="Describe the finding..."
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Objective Evidence</label>
                  <textarea
                    value={findingForm.evidence}
                    onChange={(e) => setFindingForm({ ...findingForm, evidence: e.target.value })}
                    className="glass-input w-full px-3 py-2 rounded-lg text-white text-sm h-16 resize-none"
                    placeholder="Reference documents, records, or observations..."
                  />
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Photo Evidence</label>
                  <div className="flex items-center gap-3">
                    <label className="px-4 py-2 glass glass-border rounded-lg text-sm text-cyan-300 hover:bg-cyan-500/20 cursor-pointer transition-colors inline-flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                      Add Photos
                      <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => setPhotoFiles(prev => [...prev, ...Array.from(e.target.files)])} />
                    </label>
                    {photoFiles.length > 0 && <span className="text-xs text-white/40">{photoFiles.length} photo(s) selected</span>}
                  </div>
                  {photoFiles.length > 0 && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {photoFiles.map((f, i) => (
                        <div key={i} className="relative">
                          <img src={URL.createObjectURL(f)} alt="" className="w-16 h-16 rounded-lg object-cover border border-white/10" />
                          <button type="button" onClick={() => setPhotoFiles(prev => prev.filter((_, j) => j !== i))} className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button type="submit" disabled={submitting || uploadingPhoto} className="btn-primary px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-50">
                    {uploadingPhoto ? 'Uploading photos...' : submitting ? 'Submitting...' : 'Submit Finding'}
                  </button>
                  <button type="button" onClick={() => setShowFindingForm(false)} className="px-5 py-2 glass glass-border rounded-lg text-sm text-white/60 hover:bg-white/10">
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {findings.length === 0 && !showFindingForm ? (
              <div className="glass glass-border rounded-xl p-8 text-center">
                <p className="text-white/40 text-sm">No findings raised yet</p>
                <button
                  onClick={() => setShowFindingForm(true)}
                  className="mt-3 text-sm text-cyan-400 hover:text-cyan-300"
                >
                  Raise your first finding
                </button>
              </div>
            ) : (
              findings.map((f, i) => (
                <div key={f.id || i} className="glass glass-border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-white/50">Clause {f.clause}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${findingTypeLabels[f.finding_type]?.color || ''}`}>
                      {findingTypeLabels[f.finding_type]?.label || f.finding_type}
                    </span>
                  </div>
                  <p className="text-white text-sm">{f.description}</p>
                  {f.evidence && <p className="text-white/40 text-xs mt-1">Evidence: {f.evidence}</p>}
                </div>
              ))
            )}
          </div>
        )}

        {/* Checklist Tab */}
        {activeTab === 'checklist' && (
          <div className="space-y-2">
            <p className="text-white/40 text-sm mb-4">Tick off each clause as you audit it. Results are saved automatically.</p>
            {(evidence?.compliance || []).length === 0 ? (
              <div className="glass glass-border rounded-xl p-8 text-center text-white/40">
                No compliance clauses configured for this company yet
              </div>
            ) : (
              evidence.compliance.map((c, i) => {
                const key = `${c.standard}-${c.clause}`
                const result = checklist[key] || null
                return (
                  <div key={i} className="glass glass-border rounded-xl p-3 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium">Clause {c.clause}</p>
                      <p className="text-xs text-white/40">{c.clause_title || c.standard}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {[
                        { val: 'conforming', label: 'C', color: 'bg-green-500/30 text-green-300 border-green-500/40' },
                        { val: 'non_conforming', label: 'NC', color: 'bg-red-500/30 text-red-300 border-red-500/40' },
                        { val: 'not_applicable', label: 'N/A', color: 'bg-white/10 text-white/40 border-white/20' },
                      ].map(opt => (
                        <button
                          key={opt.val}
                          onClick={() => updateChecklist(c.clause, c.standard, c.clause_title || c.clause, opt.val)}
                          className={`px-2 py-1 text-xs rounded-lg border transition-colors ${
                            result === opt.val ? opt.color : 'border-white/10 text-white/30 hover:bg-white/10'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between text-xs text-white/30">
          <span>Powered by ISOGuardian Audit Connect</span>
          <span>Session expires: {session?.session?.expiresAt ? new Date(session.session.expiresAt).toLocaleDateString('en-ZA') : 'N/A'}</span>
        </div>
      </footer>
    </div>
  )
}

export default AuditorWorkspace

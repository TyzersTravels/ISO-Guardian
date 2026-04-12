import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'

const STANDARDS = ['ISO 9001', 'ISO 14001', 'ISO 45001']

const CLAUSE_PAGE_MAP = {
  '4.1': { path: '/context-analysis', label: 'SWOT / Context' },
  '4.2': { path: '/interested-parties', label: 'Stakeholders' },
  '4.4': { path: '/processes', label: 'Process Register' },
  '5.3': { path: '/org-chart', label: 'Org Chart' },
  '6.1': { path: '/risk-register', label: 'Risk Register' },
  '6.1.2': { path: '/environmental-aspects', label: 'Env. Aspects / HIRA' },
  '6.1.3': { path: '/legal-register', label: 'Legal Register' },
  '6.2': { path: '/quality-objectives', label: 'Objectives' },
  '7.2': { path: '/training-matrix', label: 'Training Matrix' },
  '7.4': { path: '/communications', label: 'Communications' },
  '7.5': { path: '/documents', label: 'Documents' },
  '8.4': { path: '/suppliers', label: 'Suppliers' },
  '9.1.2': { path: '/customer-feedback', label: 'Customer Feedback' },
  '9.2': { path: '/audits', label: 'Audits' },
  '9.3': { path: '/management-reviews', label: 'Management Reviews' },
  '10.2': { path: '/ncrs', label: 'NCRs' },
  '10.3': { path: '/improvements', label: 'Improvements' },
}

const ANNEX_SL_CLAUSES = [
  { clause: '4.1', name: 'Understanding the organisation and its context' },
  { clause: '4.2', name: 'Understanding the needs and expectations of interested parties' },
  { clause: '4.3', name: 'Determining the scope of the management system' },
  { clause: '4.4', name: 'Management system and its processes' },
  { clause: '5.1', name: 'Leadership and commitment' },
  { clause: '5.2', name: 'Policy' },
  { clause: '5.3', name: 'Organisational roles, responsibilities and authorities' },
  { clause: '6.1', name: 'Actions to address risks and opportunities' },
  { clause: '6.1.2', name: 'Environmental aspects / Hazard identification' },
  { clause: '6.1.3', name: 'Compliance obligations' },
  { clause: '6.2', name: 'Objectives and planning to achieve them' },
  { clause: '7.1', name: 'Resources' },
  { clause: '7.2', name: 'Competence' },
  { clause: '7.3', name: 'Awareness' },
  { clause: '7.4', name: 'Communication' },
  { clause: '7.5', name: 'Documented information' },
  { clause: '8.1', name: 'Operational planning and control' },
  { clause: '8.4', name: 'Control of externally provided processes, products and services' },
  { clause: '9.1', name: 'Monitoring, measurement, analysis and evaluation' },
  { clause: '9.1.2', name: 'Customer satisfaction / Compliance evaluation' },
  { clause: '9.2', name: 'Internal audit' },
  { clause: '9.3', name: 'Management review' },
  { clause: '10.1', name: 'Improvement – General' },
  { clause: '10.2', name: 'Nonconformity and corrective action' },
  { clause: '10.3', name: 'Continual improvement' },
]

// Determine cell status: 'green' | 'amber' | 'red' | 'empty'
function getCellStatus(docs) {
  if (!docs || docs.length === 0) return 'red'
  const hasApproved = docs.some(d => d.status === 'approved' || d.status === 'active')
  return hasApproved ? 'green' : 'amber'
}

function CellBadge({ status, count, onClick }) {
  if (status === 'red') {
    return (
      <button
        onClick={onClick}
        className="w-full h-9 flex items-center justify-center rounded-md bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-medium hover:bg-red-500/30 transition-colors"
        title="No documented evidence"
      >
        Gap
      </button>
    )
  }
  if (status === 'amber') {
    return (
      <button
        onClick={onClick}
        className="w-full h-9 flex items-center justify-center rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-medium hover:bg-amber-500/30 transition-colors"
        title="Documents present but none approved"
      >
        {count}
      </button>
    )
  }
  return (
    <button
      onClick={onClick}
      className="w-full h-9 flex items-center justify-center rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/30 transition-colors"
      title="Evidence present and approved"
    >
      {count}
    </button>
  )
}

export default function ClauseMatrix() {
  const { userProfile, getEffectiveCompanyId } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeStandard, setActiveStandard] = useState('All')
  const [expandedClause, setExpandedClause] = useState(null)
  const [selectedCell, setSelectedCell] = useState(null) // { clause, standard }

  useEffect(() => {
    if (!userProfile) return
    fetchDocuments()
  }, [userProfile])

  const fetchDocuments = async () => {
    setLoading(true)
    try {
      const companyId = getEffectiveCompanyId()
      if (!companyId) return

      const { data, error } = await supabase
        .from('documents')
        .select('id, name, standard, clause, clause_name, status, created_at')
        .eq('company_id', companyId)

      if (error) throw error
      setDocuments(data || [])
    } catch (err) {
      showToast('Failed to load documents', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Build lookup: { [clause]: { [standard]: doc[] } }
  const matrix = useMemo(() => {
    const m = {}
    for (const clauseObj of ANNEX_SL_CLAUSES) {
      m[clauseObj.clause] = {}
      for (const std of STANDARDS) {
        m[clauseObj.clause][std] = []
      }
    }
    for (const doc of documents) {
      if (!doc.clause) continue
      const clauseKey = doc.clause.trim()
      if (!m[clauseKey]) continue
      // Match document to a standard column
      const matchedStd = STANDARDS.find(s => doc.standard && doc.standard.includes(s.split(' ')[1]))
        || STANDARDS.find(s => doc.standard === s)
      if (matchedStd) {
        m[clauseKey][matchedStd].push(doc)
      } else {
        // If standard not matched, add to all columns that match partially
        for (const std of STANDARDS) {
          if (doc.standard && doc.standard.toLowerCase().includes(std.toLowerCase())) {
            m[clauseKey][std].push(doc)
          }
        }
      }
    }
    return m
  }, [documents])

  // Coverage stats per standard
  const coverageStats = useMemo(() => {
    return STANDARDS.map(std => {
      const total = ANNEX_SL_CLAUSES.length
      const covered = ANNEX_SL_CLAUSES.filter(c => {
        const docs = matrix[c.clause]?.[std] || []
        return docs.length > 0
      }).length
      const approved = ANNEX_SL_CLAUSES.filter(c => {
        const docs = matrix[c.clause]?.[std] || []
        return getCellStatus(docs) === 'green'
      }).length
      return { std, covered, approved, total, pct: Math.round((covered / total) * 100) }
    })
  }, [matrix])

  // Determine which standards to show columns for
  const visibleStandards = activeStandard === 'All' ? STANDARDS : [activeStandard]

  // Documents for selected cell
  const cellDocs = useMemo(() => {
    if (!selectedCell) return []
    return matrix[selectedCell.clause]?.[selectedCell.standard] || []
  }, [selectedCell, matrix])

  // All docs for expanded clause row (across all standards)
  const clauseDocs = useMemo(() => {
    if (!expandedClause) return []
    const seen = new Set()
    const all = []
    for (const std of STANDARDS) {
      for (const doc of (matrix[expandedClause]?.[std] || [])) {
        if (!seen.has(doc.id)) {
          seen.add(doc.id)
          all.push(doc)
        }
      }
    }
    return all
  }, [expandedClause, matrix])

  const handleCellClick = (clause, standard) => {
    if (selectedCell?.clause === clause && selectedCell?.standard === standard) {
      setSelectedCell(null)
    } else {
      setSelectedCell({ clause, standard })
      setExpandedClause(null)
    }
  }

  const handleClauseClick = (clause) => {
    if (expandedClause === clause) {
      setExpandedClause(null)
    } else {
      setExpandedClause(clause)
      setSelectedCell(null)
    }
  }

  const statusColour = (status) => {
    if (!status) return 'text-white/40'
    const s = status.toLowerCase()
    if (s === 'approved' || s === 'active') return 'text-emerald-400'
    if (s === 'draft') return 'text-amber-400'
    if (s === 'archived' || s === 'obsolete') return 'text-red-400'
    return 'text-white/60'
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
            Document–Clause Cross-Reference Matrix
          </h1>
          <p className="text-white/60 text-sm sm:text-base">
            Map your documented evidence against ISO Annex SL clauses. Identify gaps before your next audit.
          </p>
        </div>

        {/* ISO Reference Card */}
        <div className="glass glass-border rounded-xl p-4 mb-6 flex gap-3 items-start">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center mt-0.5">
            <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-sm text-white/70 leading-relaxed">
            <span className="text-white font-medium">How to read this matrix: </span>
            This matrix maps your uploaded documents against each ISO Annex SL clause.{' '}
            <span className="text-emerald-400 font-medium">Green</span> = approved evidence present.{' '}
            <span className="text-amber-400 font-medium">Amber</span> = documents exist but none are approved.{' '}
            <span className="text-red-400 font-medium">Red / Gap</span> = no documents linked to this clause — requires attention before an external audit.
            Click any cell or clause row to inspect the underlying documents.
          </div>
        </div>

        {/* Coverage KPI Bar */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {coverageStats.map(({ std, covered, approved, total, pct }) => (
              <div key={std} className="glass glass-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/80 text-sm font-medium">{std}</span>
                  <span className={`text-lg font-bold ${pct >= 80 ? 'text-emerald-400' : pct >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                    {pct}%
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-white/50 text-xs">
                  {covered} of {total} clauses have evidence
                  {approved < covered && (
                    <span className="text-amber-400 ml-1">({covered - approved} unapproved)</span>
                  )}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mb-4 text-xs text-white/60">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-emerald-500/50 border border-emerald-500/60" />
            <span>Approved evidence</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-amber-500/50 border border-amber-500/60" />
            <span>Documents present (not approved)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-red-500/50 border border-red-500/60" />
            <span>Gap — no documents</span>
          </div>
        </div>

        {/* Standard Filter Tabs */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {['All', ...STANDARDS].map(std => (
            <button
              key={std}
              onClick={() => setActiveStandard(std)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeStandard === std
                  ? 'bg-purple-600 text-white'
                  : 'glass glass-border text-white/70 hover:text-white'
              }`}
            >
              {std}
            </button>
          ))}
        </div>

        {/* Matrix Table */}
        {loading ? (
          <div className="glass glass-border rounded-xl p-12 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-white/50 text-sm">Loading documents...</p>
            </div>
          </div>
        ) : (
          <div className="glass glass-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left px-4 py-3 text-white/60 font-medium text-xs uppercase tracking-wider w-12">
                      §
                    </th>
                    <th className="text-left px-4 py-3 text-white/60 font-medium text-xs uppercase tracking-wider min-w-[220px]">
                      Clause
                    </th>
                    {visibleStandards.map(std => (
                      <th key={std} className="text-center px-2 py-3 text-white/60 font-medium text-xs uppercase tracking-wider min-w-[100px]">
                        {std.replace('ISO ', '')}
                      </th>
                    ))}
                    <th className="text-center px-2 py-3 text-white/60 font-medium text-xs uppercase tracking-wider w-24">
                      Register
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ANNEX_SL_CLAUSES.map((clauseObj, idx) => {
                    const isRowExpanded = expandedClause === clauseObj.clause
                    const pageLink = CLAUSE_PAGE_MAP[clauseObj.clause]
                    const rowDocs = clauseDocs

                    return (
                      <>
                        <tr
                          key={clauseObj.clause}
                          className={`border-b border-white/5 transition-colors ${
                            isRowExpanded ? 'bg-white/5' : idx % 2 === 0 ? 'bg-white/[0.02]' : ''
                          } hover:bg-white/5`}
                        >
                          {/* Clause number */}
                          <td className="px-4 py-2.5 text-white/40 text-xs font-mono">
                            {clauseObj.clause}
                          </td>

                          {/* Clause name — clickable to expand */}
                          <td className="px-4 py-2.5">
                            <button
                              onClick={() => handleClauseClick(clauseObj.clause)}
                              className="text-left text-white/80 hover:text-white text-sm transition-colors flex items-center gap-1.5 group"
                            >
                              <svg
                                className={`w-3.5 h-3.5 text-white/30 group-hover:text-white/60 transition-transform flex-shrink-0 ${isRowExpanded ? 'rotate-90' : ''}`}
                                fill="none" stroke="currentColor" viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                              {clauseObj.name}
                            </button>
                          </td>

                          {/* Standard cells */}
                          {visibleStandards.map(std => {
                            const docs = matrix[clauseObj.clause]?.[std] || []
                            const status = getCellStatus(docs)
                            const isSelected = selectedCell?.clause === clauseObj.clause && selectedCell?.standard === std
                            return (
                              <td key={std} className="px-2 py-2">
                                <div className={`relative ${isSelected ? 'ring-2 ring-purple-400 rounded-md' : ''}`}>
                                  <CellBadge
                                    status={status}
                                    count={docs.length}
                                    onClick={() => handleCellClick(clauseObj.clause, std)}
                                  />
                                </div>
                              </td>
                            )
                          })}

                          {/* Register quick-link */}
                          <td className="px-2 py-2 text-center">
                            {pageLink ? (
                              <button
                                onClick={() => navigate(pageLink.path)}
                                className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                                title={`Go to ${pageLink.label}`}
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                <span className="hidden sm:inline">{pageLink.label}</span>
                              </button>
                            ) : (
                              <span className="text-white/20 text-xs">—</span>
                            )}
                          </td>
                        </tr>

                        {/* Expanded clause row — all docs for this clause */}
                        {isRowExpanded && (
                          <tr key={`${clauseObj.clause}-expanded`} className="border-b border-white/10 bg-white/[0.03]">
                            <td colSpan={3 + visibleStandards.length} className="px-4 pb-4 pt-2">
                              <div className="pl-5">
                                <p className="text-white/50 text-xs mb-2 font-medium uppercase tracking-wide">
                                  All documents linked to clause {clauseObj.clause}
                                </p>
                                {rowDocs.length === 0 ? (
                                  <p className="text-white/30 text-sm italic">
                                    No documents are currently linked to this clause.
                                    {pageLink && (
                                      <>
                                        {' '}
                                        <button
                                          onClick={() => navigate(pageLink.path)}
                                          className="text-cyan-400 hover:underline not-italic"
                                        >
                                          Go to {pageLink.label}
                                        </button>
                                        {' '}to add evidence.
                                      </>
                                    )}
                                  </p>
                                ) : (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {rowDocs.map(doc => (
                                      <div key={doc.id} className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
                                        <svg className="w-4 h-4 text-white/30 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <div className="min-w-0 flex-1">
                                          <p className="text-white/80 text-xs font-medium truncate">{doc.name}</p>
                                          <p className="text-white/40 text-xs truncate">{doc.standard || '—'}</p>
                                        </div>
                                        <span className={`text-xs font-medium flex-shrink-0 ${statusColour(doc.status)}`}>
                                          {doc.status || '—'}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Cell detail panel */}
        {selectedCell && (
          <div className="mt-4 glass glass-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-white font-semibold text-base">
                  {selectedCell.standard} — Clause {selectedCell.clause}
                </h3>
                <p className="text-white/50 text-sm mt-0.5">
                  {ANNEX_SL_CLAUSES.find(c => c.clause === selectedCell.clause)?.name}
                </p>
              </div>
              <button
                onClick={() => setSelectedCell(null)}
                className="text-white/40 hover:text-white/70 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {cellDocs.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p className="text-white/60 font-medium">Evidence Gap</p>
                <p className="text-white/40 text-sm mt-1">
                  No documents are linked to this clause for {selectedCell.standard}.
                </p>
                <button
                  onClick={() => navigate('/documents')}
                  className="mt-3 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Upload a document
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {cellDocs.map(doc => (
                  <div key={doc.id} className="flex items-center gap-3 bg-white/5 rounded-lg px-4 py-3">
                    <svg className="w-5 h-5 text-white/30 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/90 text-sm font-medium truncate">{doc.name}</p>
                      <p className="text-white/40 text-xs truncate">
                        {doc.clause_name || `Clause ${doc.clause}`}
                        {doc.created_at && ` · Added ${new Date(doc.created_at).toLocaleDateString('en-ZA')}`}
                      </p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                      (doc.status === 'approved' || doc.status === 'active')
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : doc.status === 'draft'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-white/10 text-white/40'
                    }`}>
                      {doc.status || 'unknown'}
                    </span>
                  </div>
                ))}
                <button
                  onClick={() => navigate('/documents')}
                  className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Open Document Register
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}

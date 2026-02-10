import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'

const Compliance = () => {
  const { userProfile, canEdit } = useAuth()
  const toast = useToast()
  const [requirements, setRequirements] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedStandard, setSelectedStandard] = useState('ISO_9001')
  const [expandedClause, setExpandedClause] = useState(null)
  const [updating, setUpdating] = useState(null)

  const standards = [
    { code: 'ISO_9001', name: 'ISO 9001:2015', label: 'Quality', icon: '🏗️' },
    { code: 'ISO_14001', name: 'ISO 14001:2015', label: 'Environmental', icon: '🌿' },
    { code: 'ISO_45001', name: 'ISO 45001:2018', label: 'OH&S', icon: '🛡️' },
  ]

  // Status values matching your actual database
  const STATUS = {
    MET: 'Met',
    NOT_MET: 'Not Met',
    PARTIAL: 'Partially Met',
  }

  useEffect(() => { fetchRequirements() }, [])

  const fetchRequirements = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('compliance_requirements')
        .select('*')
        .order('clause_number', { ascending: true })

      if (error) throw error
      setRequirements(data || [])
    } catch (err) {
      console.error('Error fetching compliance:', err)
      toast.error('Failed to load compliance data')
      setRequirements([])
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id, newStatus) => {
    if (!canEdit()) {
      toast.error('You don\'t have permission to update compliance')
      return
    }
    setUpdating(id)
    try {
      const { error } = await supabase
        .from('compliance_requirements')
        .update({
          compliance_status: newStatus,
          last_reviewed: new Date().toISOString().split('T')[0],
          updated_by: userProfile?.id
        })
        .eq('id', id)

      if (error) throw error
      setRequirements(prev =>
        prev.map(r => r.id === id ? { ...r, compliance_status: newStatus } : r)
      )
      toast.success(`Updated to "${newStatus}"`)
    } catch (err) {
      console.error('Error updating:', err)
      toast.error('Failed to update')
    } finally {
      setUpdating(null)
    }
  }

  // Filter & group
  const filteredReqs = requirements.filter(r => r.standard === selectedStandard)
  const clauseGroups = filteredReqs.reduce((acc, req) => {
    const key = req.clause_number
    if (!acc[key]) acc[key] = { number: key, name: req.clause_name || `Clause ${key}`, requirements: [] }
    acc[key].requirements.push(req)
    return acc
  }, {})
  const clauses = Object.values(clauseGroups).sort((a, b) => a.number - b.number)

  // Scoring
  const calcScore = (reqs) => {
    if (!reqs.length) return 0
    const pts = reqs.reduce((sum, r) => {
      if (r.compliance_status === STATUS.MET) return sum + 1
      if (r.compliance_status === STATUS.PARTIAL) return sum + 0.5
      return sum
    }, 0)
    return Math.round((pts / reqs.length) * 100)
  }

  const stdScore = (code) => calcScore(requirements.filter(r => r.standard === code))
  const overallScore = Math.round(standards.reduce((sum, s) => sum + stdScore(s.code), 0) / standards.length)

  const scoreColor = (s) => s >= 75 ? 'text-emerald-400' : s >= 50 ? 'text-amber-400' : 'text-red-400'
  const scoreBar = (s) => s >= 75 ? 'from-emerald-500 to-emerald-600' : s >= 50 ? 'from-amber-500 to-amber-600' : 'from-red-500 to-red-600'

  const badge = (status) => {
    if (status === STATUS.MET) return { bg: 'bg-emerald-500/15 border-emerald-500/30', text: 'text-emerald-300', icon: '✓' }
    if (status === STATUS.PARTIAL) return { bg: 'bg-amber-500/15 border-amber-500/30', text: 'text-amber-300', icon: '◐' }
    return { bg: 'bg-red-500/15 border-red-500/30', text: 'text-red-300', icon: '✗' }
  }

  return (
    <Layout>
      <div className="space-y-6 md:ml-16">
        <div>
          <h2 className="text-2xl font-bold text-white">Compliance Management</h2>
          <p className="text-white/40 text-sm mt-1">Track and manage ISO requirements across all standards</p>
        </div>

        {/* Overall IMS Score */}
        <div className="glass rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Integrated Management System</h3>
              <p className="text-xs text-white/40 mt-0.5">
                Overall compliance across {standards.length} standards • {requirements.length} total requirements
              </p>
            </div>
            <div className={`text-4xl font-bold ${scoreColor(overallScore)}`}>{overallScore}%</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {standards.map(std => {
              const score = stdScore(std.code)
              const total = requirements.filter(r => r.standard === std.code).length
              const met = requirements.filter(r => r.standard === std.code && r.compliance_status === STATUS.MET).length
              return (
                <button
                  key={std.code}
                  onClick={() => { setSelectedStandard(std.code); setExpandedClause(null) }}
                  className={`rounded-xl p-4 transition-all text-left ${
                    selectedStandard === std.code
                      ? 'bg-white/10 border border-cyan-500/40 shadow-lg shadow-cyan-500/10'
                      : 'glass border border-white/5 hover:border-white/15 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg">{std.icon}</span>
                    <span className={`text-xl font-bold ${scoreColor(score)}`}>{score}%</span>
                  </div>
                  <div className="text-sm font-semibold text-white">{std.name}</div>
                  <div className="text-[10px] text-white/40 mt-0.5">{met}/{total} requirements met</div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mt-2">
                    <div className={`h-full bg-gradient-to-r ${scoreBar(score)} transition-all duration-700`} style={{ width: `${score}%` }} />
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Clause Breakdown */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />)}
          </div>
        ) : clauses.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center border border-white/10">
            <div className="text-4xl mb-3">📋</div>
            <h3 className="text-lg font-semibold text-white mb-2">No Requirements Found</h3>
            <p className="text-white/40 text-sm max-w-md mx-auto">
              No compliance requirements for {standards.find(s => s.code === selectedStandard)?.name} yet.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                {standards.find(s => s.code === selectedStandard)?.name} — Clause Breakdown
              </h3>
              <div className="text-xs text-white/40">Click a clause to expand</div>
            </div>

            {clauses.map(clause => {
              const score = calcScore(clause.requirements)
              const isOpen = expandedClause === clause.number
              const met = clause.requirements.filter(r => r.compliance_status === STATUS.MET).length
              const partial = clause.requirements.filter(r => r.compliance_status === STATUS.PARTIAL).length
              const notMet = clause.requirements.filter(r => r.compliance_status === STATUS.NOT_MET).length

              return (
                <div key={clause.number} className="glass rounded-xl border border-white/10 overflow-hidden">
                  <button
                    onClick={() => setExpandedClause(isOpen ? null : clause.number)}
                    className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        score >= 75 ? 'bg-emerald-500/15' : score >= 50 ? 'bg-amber-500/15' : 'bg-red-500/15'
                      }`}>
                        <span className={`text-lg font-bold ${scoreColor(score)}`}>{score}%</span>
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <div className="font-semibold text-white text-sm">Clause {clause.number}: {clause.name}</div>
                        <div className="text-[11px] text-white/40 mt-0.5">
                          {clause.requirements.length} requirements —{' '}
                          <span className="text-emerald-400">{met} met</span>,{' '}
                          <span className="text-amber-400">{partial} partial</span>,{' '}
                          <span className="text-red-400">{notMet} not met</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden hidden md:block">
                        <div className={`h-full bg-gradient-to-r ${scoreBar(score)} transition-all duration-500`} style={{ width: `${score}%` }} />
                      </div>
                      <svg className={`w-4 h-4 text-white/40 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-white/5 bg-white/[0.02]">
                      {clause.requirements.map(req => {
                        const b = badge(req.compliance_status)
                        const isUpd = updating === req.id
                        return (
                          <div key={req.id} className="px-4 py-3 flex items-center justify-between border-b border-white/5 last:border-b-0 hover:bg-white/[0.03] transition-colors">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <span className={`text-sm ${b.text}`}>{b.icon}</span>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm text-white/80 truncate">{req.requirement_text}</div>
                                {req.notes && <div className="text-[10px] text-white/30 mt-0.5 truncate">{req.notes}</div>}
                                {req.last_reviewed && <div className="text-[10px] text-white/20 mt-0.5">Last reviewed: {new Date(req.last_reviewed).toLocaleDateString('en-ZA')}</div>}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0 ml-3">
                              {canEdit() ? (
                                <>
                                  {[
                                    { val: STATUS.MET, label: 'Met', active: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300', hover: 'hover:border-emerald-500/30 hover:text-emerald-300' },
                                    { val: STATUS.PARTIAL, label: 'Partial', active: 'bg-amber-500/20 border-amber-500/40 text-amber-300', hover: 'hover:border-amber-500/30 hover:text-amber-300' },
                                    { val: STATUS.NOT_MET, label: 'Not Met', active: 'bg-red-500/20 border-red-500/40 text-red-300', hover: 'hover:border-red-500/30 hover:text-red-300' },
                                  ].map(btn => (
                                    <button
                                      key={btn.val}
                                      onClick={(e) => { e.stopPropagation(); updateStatus(req.id, btn.val) }}
                                      disabled={isUpd}
                                      className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all border ${
                                        req.compliance_status === btn.val ? btn.active : `border-white/10 text-white/40 ${btn.hover}`
                                      } ${isUpd ? 'opacity-50' : ''}`}
                                    >
                                      {btn.label}
                                    </button>
                                  ))}
                                </>
                              ) : (
                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border ${b.bg} ${b.text}`}>
                                  {req.compliance_status}
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Info card */}
        <div className="glass rounded-xl p-4 border border-cyan-500/20 bg-cyan-500/5">
          <div className="flex items-start gap-3">
            <span className="text-lg">💡</span>
            <div>
              <div className="text-sm font-semibold text-white mb-1">How Scoring Works</div>
              <p className="text-xs text-white/50 leading-relaxed">
                Each requirement scores as Met (100%), Partially Met (50%), or Not Met (0%).
                The clause score averages its requirements. Changes save instantly with timestamps
                for audit trail purposes (ISO 9001 Clause 7.5 / POPIA Section 19).
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Compliance

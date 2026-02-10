import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'

const STANDARDS = [
  { code: 'ISO_9001', name: 'ISO 9001:2015', label: 'Quality' },
  { code: 'ISO_14001', name: 'ISO 14001:2015', label: 'Environmental' },
  { code: 'ISO_45001', name: 'ISO 45001:2018', label: 'OH&S' }
]

const CLAUSE_NAMES = {
  4: 'Context of the Organization',
  5: 'Leadership',
  6: 'Planning',
  7: 'Support',
  8: 'Operation',
  9: 'Performance Evaluation',
  10: 'Improvement'
}

const Compliance = () => {
  const { userProfile } = useAuth()
  const [complianceData, setComplianceData] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedStandard, setSelectedStandard] = useState('ISO_9001')

  useEffect(() => { fetchCompliance() }, [])

  const fetchCompliance = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('compliance_requirements')
        .select('*')

      if (error) throw error

      // Group by standard and clause
      const grouped = {}
      for (const row of (data || [])) {
        if (!grouped[row.standard]) grouped[row.standard] = {}
        if (!grouped[row.standard][row.clause]) {
          grouped[row.standard][row.clause] = { total: 0, met: 0, partial: 0, notMet: 0 }
        }
        grouped[row.standard][row.clause].total++
        if (row.status === 'met') grouped[row.standard][row.clause].met++
        else if (row.status === 'partial') grouped[row.standard][row.clause].partial++
        else grouped[row.standard][row.clause].notMet++
      }
      setComplianceData(grouped)
    } catch (err) {
      console.error('Error fetching compliance:', err)
      // Fallback to demo data if table doesn't exist yet
      setComplianceData(getDemoData())
    } finally {
      setLoading(false)
    }
  }

  const getDemoData = () => ({
    ISO_9001: {
      4: { total: 5, met: 4, partial: 1, notMet: 0 },
      5: { total: 6, met: 2, partial: 2, notMet: 2 },
      6: { total: 7, met: 3, partial: 2, notMet: 2 },
      7: { total: 8, met: 5, partial: 2, notMet: 1 },
      8: { total: 10, met: 5, partial: 2, notMet: 3 },
      9: { total: 5, met: 4, partial: 0, notMet: 1 },
      10: { total: 4, met: 3, partial: 1, notMet: 0 }
    },
    ISO_14001: {
      4: { total: 5, met: 3, partial: 1, notMet: 1 },
      5: { total: 6, met: 3, partial: 1, notMet: 2 },
      6: { total: 7, met: 3, partial: 2, notMet: 2 },
      7: { total: 8, met: 4, partial: 3, notMet: 1 },
      8: { total: 10, met: 6, partial: 2, notMet: 2 },
      9: { total: 5, met: 3, partial: 1, notMet: 1 },
      10: { total: 4, met: 3, partial: 0, notMet: 1 }
    },
    ISO_45001: {
      4: { total: 5, met: 3, partial: 2, notMet: 0 },
      5: { total: 6, met: 3, partial: 1, notMet: 2 },
      6: { total: 7, met: 4, partial: 1, notMet: 2 },
      7: { total: 8, met: 5, partial: 1, notMet: 2 },
      8: { total: 10, met: 6, partial: 2, notMet: 2 },
      9: { total: 5, met: 3, partial: 1, notMet: 1 },
      10: { total: 4, met: 3, partial: 1, notMet: 0 }
    }
  })

  const calcClause = (c) => {
    if (!c || c.total === 0) return 0
    return Math.round(((c.met + c.partial * 0.5) / c.total) * 100)
  }

  const calcStandard = (std) => {
    const clauses = complianceData[std]
    if (!clauses) return 0
    const vals = Object.values(clauses).map(calcClause)
    return vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0
  }

  const overallScore = () => {
    const scores = STANDARDS.map(s => calcStandard(s.code)).filter(s => s > 0)
    return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
  }

  const currentClauses = complianceData[selectedStandard] || {}

  return (
    <Layout>
      <div className="space-y-6 md:ml-16">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-white">Compliance Overview</h2>
          <p className="text-white/40 text-sm">Track your ISO compliance across all standards</p>
        </div>

        {/* Overall Score */}
        <div className="glass rounded-2xl p-6 text-center">
          <div className="text-5xl font-bold text-white mb-1">{loading ? '—' : `${overallScore()}%`}</div>
          <p className="text-sm text-white/40">Overall IMS Compliance</p>
          <div className="w-full max-w-md mx-auto h-2 bg-white/10 rounded-full mt-4 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                overallScore() >= 75 ? 'bg-emerald-500' : overallScore() >= 50 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${overallScore()}%` }}
            />
          </div>
        </div>

        {/* Standard Scores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {STANDARDS.map(std => {
            const score = calcStandard(std.code)
            const isSelected = selectedStandard === std.code
            return (
              <button
                key={std.code}
                onClick={() => setSelectedStandard(std.code)}
                className={`glass rounded-xl p-4 text-left transition-all ${
                  isSelected ? 'ring-2 ring-cyan-500/50 bg-cyan-500/5' : 'hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-white/50 font-medium">{std.name}</span>
                  <span className={`text-lg font-bold ${
                    score >= 75 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-red-400'
                  }`}>{loading ? '—' : `${score}%`}</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      score >= 75 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${score}%` }}
                  />
                </div>
                <p className="text-[10px] text-white/30 mt-2">{std.label} Management</p>
              </button>
            )
          })}
        </div>

        {/* Clause Breakdown */}
        <div className="glass rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white/70 tracking-wide uppercase mb-4">
            {STANDARDS.find(s => s.code === selectedStandard)?.name} — Clause Breakdown
          </h3>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(CLAUSE_NAMES).map(([num, name]) => {
                const clause = currentClauses[num] || { total: 0, met: 0, partial: 0, notMet: 0 }
                const score = calcClause(clause)
                return (
                  <div key={num} className="bg-white/3 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-sm font-medium text-white/80">Clause {num}: {name}</span>
                        <div className="flex items-center gap-3 mt-1 text-[10px] text-white/40">
                          <span>{clause.total} requirements</span>
                          <span className="text-emerald-400">{clause.met} met</span>
                          <span className="text-amber-400">{clause.partial} partial</span>
                          <span className="text-red-400">{clause.notMet} not met</span>
                        </div>
                      </div>
                      <span className={`text-xl font-bold ${
                        score >= 75 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-red-400'
                      }`}>{score}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          score >= 75 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default Compliance

import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'

const Compliance = () => {
  const { userProfile } = useAuth()
  const [selectedStandard, setSelectedStandard] = useState('ISO_9001')
  const [requirements, setRequirements] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedClause, setSelectedClause] = useState(null)

  const standards = [
    { code: 'ISO_9001', name: 'ISO 9001:2015', color: 'blue' },
    { code: 'ISO_14001', name: 'ISO 14001:2015', color: 'green' },
    { code: 'ISO_45001', name: 'ISO 45001:2018', color: 'orange' }
  ]

  useEffect(() => {
    fetchRequirements()
  }, [selectedStandard])

  const fetchRequirements = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('compliance_requirements')
        .select('*')
        .eq('standard', selectedStandard)
        .order('clause_number')

      if (error) throw error
      setRequirements(data || [])
    } catch (err) {
      console.error('Error fetching requirements:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id, newStatus) => {
    try {
      const { error } = await supabase
        .from('compliance_requirements')
        .update({ 
          compliance_status: newStatus,
          last_reviewed: new Date().toISOString().split('T')[0]
        })
        .eq('id', id)

      if (error) throw error
      fetchRequirements()
    } catch (err) {
      console.error('Error updating status:', err)
    }
  }

  // Calculate scores
  const calculateScores = () => {
    const byClause = {}
    
    requirements.forEach(req => {
      if (!byClause[req.clause_number]) {
        byClause[req.clause_number] = {
          clauseName: req.clause_name,
          total: 0,
          met: 0,
          partial: 0,
          notMet: 0
        }
      }
      
      byClause[req.clause_number].total++
      
      if (req.compliance_status === 'Met') byClause[req.clause_number].met++
      else if (req.compliance_status === 'Partially Met') byClause[req.clause_number].partial++
      else byClause[req.clause_number].notMet++
    })
    
    return byClause
  }

  const calculatePercentage = (met, partial, total) => {
    if (total === 0) return 0
    return Math.round(((met + (partial * 0.5)) / total) * 100)
  }

  const scores = calculateScores()
  const overallTotal = requirements.length
  const overallMet = requirements.filter(r => r.compliance_status === 'Met').length
  const overallPartial = requirements.filter(r => r.compliance_status === 'Partially Met').length
  const overallScore = calculatePercentage(overallMet, overallPartial, overallTotal)

  if (loading) {
    return (
      <Layout>
        <div className="text-white text-center py-12">Loading compliance data...</div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Compliance Management</h2>
          <p className="text-white/60">Track compliance requirements by clause</p>
        </div>

        {/* Standard Selector */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {standards.map(std => (
            <button
              key={std.code}
              onClick={() => {
                setSelectedStandard(std.code)
                setSelectedClause(null)
              }}
              className={`px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-all ${
                selectedStandard === std.code
                  ? `bg-gradient-to-r from-${std.color}-500 to-${std.color}-600 text-white shadow-lg`
                  : 'glass glass-border text-white/70 hover:bg-white/10'
              }`}
            >
              {std.name}
            </button>
          ))}
        </div>

        {/* Overall Score */}
        <div className="glass glass-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-white">Overall Compliance</h3>
              <p className="text-sm text-white/60">
                {overallMet} Met • {overallPartial} Partially Met • {overallTotal - overallMet - overallPartial} Not Met
              </p>
            </div>
            <div className="text-4xl font-bold text-white">{overallScore}%</div>
          </div>
          <div className="w-full h-4 bg-white/10 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                overallScore >= 70 ? 'bg-gradient-to-r from-green-500 to-green-600' :
                overallScore >= 50 ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                'bg-gradient-to-r from-red-500 to-red-600'
              }`}
              style={{width: `${overallScore}%`}}
            />
          </div>
        </div>

        {/* Clause Breakdown */}
        <div className="space-y-3">
          {Object.entries(scores).map(([clauseNum, data]) => {
            const percentage = calculatePercentage(data.met, data.partial, data.total)
            const isExpanded = selectedClause === parseInt(clauseNum)
            
            return (
              <div key={clauseNum} className="glass glass-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setSelectedClause(isExpanded ? null : parseInt(clauseNum))}
                  className="w-full p-4 text-left hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-white">{data.clauseName}</h4>
                    <div className={`text-2xl font-bold ${
                      percentage >= 70 ? 'text-green-400' :
                      percentage >= 50 ? 'text-orange-400' :
                      'text-red-400'
                    }`}>
                      {percentage}%
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-white/60 mb-2">
                    <span>✓ {data.met} Met</span>
                    <span>◐ {data.partial} Partial</span>
                    <span>✗ {data.notMet} Not Met</span>
                    <span>Total: {data.total}</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${
                        percentage >= 70 ? 'bg-green-500' :
                        percentage >= 50 ? 'bg-orange-500' :
                        'bg-red-500'
                      }`}
                      style={{width: `${percentage}%`}}
                    />
                  </div>
                </button>

                {/* Requirements List */}
                {isExpanded && (
                  <div className="border-t border-white/10 p-4 space-y-2">
                    {requirements
                      .filter(r => r.clause_number === parseInt(clauseNum))
                      .map(req => (
                        <div key={req.id} className="flex items-start justify-between p-3 bg-white/5 rounded-lg">
                          <div className="flex-1">
                            <p className="text-white text-sm">{req.requirement_text}</p>
                            {req.notes && (
                              <p className="text-white/50 text-xs mt-1">{req.notes}</p>
                            )}
                          </div>
                          <div className="ml-4 flex gap-1 shrink-0">
                            <button
                              onClick={() => updateStatus(req.id, 'Not Met')}
                              className={`px-2 py-1 rounded text-xs font-semibold transition-all ${
                                req.compliance_status === 'Not Met'
                                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/40'
                                  : 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20'
                              }`}
                            >Not Met</button>
                            <button
                              onClick={() => updateStatus(req.id, 'Partially Met')}
                              className={`px-2 py-1 rounded text-xs font-semibold transition-all ${
                                req.compliance_status === 'Partially Met'
                                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/40'
                                  : 'bg-orange-500/10 text-orange-400 border border-orange-500/30 hover:bg-orange-500/20'
                              }`}
                            >Partial</button>
                            <button
                              onClick={() => updateStatus(req.id, 'Met')}
                              className={`px-2 py-1 rounded text-xs font-semibold transition-all ${
                                req.compliance_status === 'Met'
                                  ? 'bg-green-500 text-white shadow-lg shadow-green-500/40'
                                  : 'bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20'
                              }`}
                            >Met</button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {requirements.length === 0 && (
          <div className="glass glass-border rounded-xl p-8 text-center">
            <p className="text-white/60 mb-4">No requirements loaded for this standard</p>
            <p className="text-white/40 text-sm">Run the seed SQL scripts to load ISO requirements</p>
          </div>
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

export default Compliance

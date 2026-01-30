import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'

const Compliance = () => {
  const { userProfile } = useAuth()
  const [selectedStandard, setSelectedStandard] = useState('ISO_9001')
  const [complianceData, setComplianceData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sortOrder, setSortOrder] = useState('clause') // 'clause', 'highest', 'lowest'

  const standards = [
    { code: 'ISO_9001', name: 'ISO 9001:2015' },
    { code: 'ISO_14001', name: 'ISO 14001:2015' },
    { code: 'ISO_45001', name: 'ISO 45001:2018' }
  ]

  useEffect(() => {
    fetchComplianceData()
  }, [])

  const fetchComplianceData = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('compliance_requirements')
        .select('*')

      if (error) throw error

      // Group by standard
      const grouped = {}
      data?.forEach(req => {
        if (!grouped[req.standard]) grouped[req.standard] = []
        grouped[req.standard].push(req)
      })

      setComplianceData(grouped)
    } catch (err) {
      console.error('Error fetching compliance:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateRequirement = async (id, field, value) => {
    try {
      // Find the requirement to validate
      const requirement = currentData.find(req => req.id === id)
      if (!requirement) return

      // Calculate what the new total would be
      let newMet = field === 'met' ? value : requirement.met
      let newPartial = field === 'partially_met' ? value : requirement.partially_met
      let newNotMet = field === 'not_met' ? value : requirement.not_met
      
      const newTotal = newMet + newPartial + newNotMet

      // VALIDATION: Cannot exceed total requirements
      if (newTotal > requirement.total_requirements) {
        alert(`Cannot exceed ${requirement.total_requirements} total requirements for this clause!\n\nCurrent: ${newMet} met + ${newPartial} partial + ${newNotMet} not met = ${newTotal}`)
        return
      }

      const { error } = await supabase
        .from('compliance_requirements')
        .update({ [field]: value })
        .eq('id', id)

      if (error) throw error

      // Refresh data
      fetchComplianceData()
      alert('Updated successfully!')
    } catch (err) {
      console.error('Error updating:', err)
      alert('Failed to update')
    }
  }

  const calculateScore = (requirements) => {
    if (!requirements || requirements.length === 0) return 0
    const total = requirements.reduce((sum, req) => sum + req.total_requirements, 0)
    const met = requirements.reduce((sum, req) => sum + req.met, 0)
    const partial = requirements.reduce((sum, req) => sum + req.partially_met, 0)
    return total > 0 ? Math.round(((met + partial * 0.5) / total) * 100) : 0
  }

  if (loading) {
    return (
      <Layout>
        <div className="text-white text-center py-12">Loading compliance data...</div>
      </Layout>
    )
  }

  const currentData = complianceData?.[selectedStandard] || []
  const overallScore = calculateScore(currentData)

  // Sort data based on sortOrder option
  const sortedData = [...currentData].sort((a, b) => {
    if (sortOrder === 'clause') {
      return a.clause - b.clause // Always sort by clause number (default)
    } else if (sortOrder === 'score-high') {
      const scoreA = a.total_requirements > 0 ? ((a.met + a.partially_met * 0.5) / a.total_requirements) * 100 : 0
      const scoreB = b.total_requirements > 0 ? ((b.met + b.partially_met * 0.5) / b.total_requirements) * 100 : 0
      return scoreB - scoreA // High to low
    } else if (sortOrder === 'score-low') {
      const scoreA = a.total_requirements > 0 ? ((a.met + a.partially_met * 0.5) / a.total_requirements) * 100 : 0
      const scoreB = b.total_requirements > 0 ? ((b.met + b.partially_met * 0.5) / b.total_requirements) * 100 : 0
      return scoreA - scoreB // Low to high
    }
    return 0
  })

  // Filter by user's access
  const accessibleStandards = standards.filter(std => 
    (userProfile?.standards_access || ["ISO_9001", "ISO_14001", "ISO_45001"]).includes(std.code)
  )

  return (
    <Layout>
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-white">Compliance Tracking</h2>
          <p className="text-cyan-200 text-sm">Manage compliance requirements by standard</p>
        </div>

        {/* Standard Selector */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {accessibleStandards.map(std => (
            <button
              key={std.code}
              onClick={() => setSelectedStandard(std.code)}
              className={`px-4 py-2 rounded-xl font-semibold whitespace-nowrap ${
                selectedStandard === std.code
                  ? 'bg-cyan-500 text-white'
                  : 'glass glass-border text-white/70 hover:bg-white/10'
              }`}
            >
              {std.name}
            </button>
          ))}
        </div>

        {/* Sort Filter */}
        <div className="glass glass-border rounded-lg p-3">
          <div className="flex items-center gap-3">
            <label className="text-white text-sm font-semibold">Sort by:</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-4 py-2 glass glass-border rounded-lg text-white bg-transparent"
            >
              <option value="clause" className="bg-slate-800">Clause Number (Default)</option>
              <option value="score-high" className="bg-slate-800">Most Compliant First</option>
              <option value="score-low" className="bg-slate-800">Least Compliant First</option>
            </select>
          </div>
        </div>

        {/* Overall Score */}
        <div className="glass glass-border rounded-2xl p-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-white mb-2">{overallScore}%</div>
            <div className="text-cyan-300 font-semibold">
              {selectedStandard.replace('_', ' ')} Compliance
            </div>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mt-4">
            <div
              className={`h-full transition-all duration-500 ${
                overallScore >= 70 ? 'bg-green-500' :
                overallScore >= 50 ? 'bg-orange-500' :
                'bg-red-500'
              }`}
              style={{ width: `${overallScore}%` }}
            />
          </div>
        </div>

        {/* Clauses */}
        {sortedData.length === 0 ? (
          <div className="glass glass-border rounded-2xl p-8 text-center text-white/60">
            No compliance data for this standard yet
          </div>
        ) : (
          <div className="space-y-3">
            {sortedData.map(req => {
              const score = req.total_requirements > 0
                ? Math.round(((req.met + req.partially_met * 0.5) / req.total_requirements) * 100)
                : 0

              return (
                <div key={req.id} className="glass glass-border rounded-2xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white text-lg">
                        Clause {req.clause}: {req.clause_name}
                      </h3>
                      <p className="text-white/60 text-sm mt-1">
                        {req.total_requirements} requirements
                      </p>
                    </div>
                    <div className="text-3xl font-bold text-white">
                      {score}%
                    </div>
                  </div>

                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-4">
                    <div
                      className={`h-full transition-all ${
                        score >= 70 ? 'bg-green-500' :
                        score >= 50 ? 'bg-orange-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${score}%` }}
                    />
                  </div>

                  {/* Update Controls */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-white/60 block mb-1">Met</label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateRequirement(req.id, 'met', Math.max(0, req.met - 1))}
                          className="px-2 py-1 glass glass-border text-white rounded"
                        >
                          -
                        </button>
                        <span className="text-white font-semibold">{req.met}</span>
                        <button
                          onClick={() => updateRequirement(req.id, 'met', Math.min(req.total_requirements, req.met + 1))}
                          className="px-2 py-1 glass glass-border text-white rounded"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-white/60 block mb-1">Partial</label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateRequirement(req.id, 'partially_met', Math.max(0, req.partially_met - 1))}
                          className="px-2 py-1 glass glass-border text-white rounded"
                        >
                          -
                        </button>
                        <span className="text-white font-semibold">{req.partially_met}</span>
                        <button
                          onClick={() => updateRequirement(req.id, 'partially_met', Math.min(req.total_requirements, req.partially_met + 1))}
                          className="px-2 py-1 glass glass-border text-white rounded"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-white/60 block mb-1">Not Met</label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateRequirement(req.id, 'not_met', Math.max(0, req.not_met - 1))}
                          className="px-2 py-1 glass glass-border text-white rounded"
                        >
                          -
                        </button>
                        <span className="text-white font-semibold">{req.not_met}</span>
                        <button
                          onClick={() => updateRequirement(req.id, 'not_met', Math.min(req.total_requirements, req.not_met + 1))}
                          className="px-2 py-1 glass glass-border text-white rounded"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
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

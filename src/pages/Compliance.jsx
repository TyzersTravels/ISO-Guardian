import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import { createBrandedPDF } from '../lib/brandedPDFExport'

const Compliance = () => {
  const { userProfile, getEffectiveCompanyId } = useAuth()
  const toast = useToast()
  const [selectedStandard, setSelectedStandard] = useState('ISO_9001')
  const [requirements, setRequirements] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedClause, setSelectedClause] = useState(null)

  const standards = [
    { code: 'ISO_9001', name: 'ISO 9001:2015', activeClass: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' },
    { code: 'ISO_14001', name: 'ISO 14001:2015', activeClass: 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg' },
    { code: 'ISO_45001', name: 'ISO 45001:2018', activeClass: 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg' }
  ]

  useEffect(() => {
    if (userProfile) fetchRequirements()
  }, [selectedStandard, userProfile])

  const fetchRequirements = async () => {
    try {
      setLoading(true)
      const companyId = getEffectiveCompanyId()
      const { data, error } = await supabase
        .from('compliance_requirements')
        .select('id, standard, company_id, clause_number, clause_name, requirement_text, compliance_status, notes, last_reviewed')
        .eq('company_id', companyId)
        .eq('standard', selectedStandard)
        .order('clause_number')

      if (error) throw error
      setRequirements(data || [])
    } catch (err) {
      console.error('Error fetching requirements:', err)
      toast.error('Failed to load compliance requirements')
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
      toast.error('Failed to update compliance status')
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

  const [exporting, setExporting] = useState(false)

  const scores = calculateScores()
  const overallTotal = requirements.length
  const overallMet = requirements.filter(r => r.compliance_status === 'Met').length
  const overallPartial = requirements.filter(r => r.compliance_status === 'Partially Met').length
  const overallScore = calculatePercentage(overallMet, overallPartial, overallTotal)

  const exportComplianceReport = async () => {
    try {
      setExporting(true)
      const standardLabel = standards.find(s => s.code === selectedStandard)?.name || selectedStandard
      const companyName = userProfile?.company?.name || 'Company'
      const companyLogo = userProfile?.company?.logo_url || null
      const userName = userProfile?.full_name || userProfile?.email || ''

      const doc = await createBrandedPDF({
        title: `${standardLabel} Compliance Report`,
        docNumber: `IG-COMP-${selectedStandard.replace('ISO_', '')}`,
        companyName,
        preparedBy: userName,
        companyLogoUrl: companyLogo,
        type: 'document',
        contentRenderer: (doc, startY) => {
          const margin = 20
          const pageWidth = doc.internal.pageSize.getWidth()
          const contentWidth = pageWidth - margin * 2
          let y = startY

          // Overall score summary
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(12)
          doc.setTextColor(30, 27, 75)
          doc.text('Overall Compliance Score', margin, y)
          y += 8

          // Score bar background
          doc.setFillColor(230, 230, 235)
          doc.roundedRect(margin, y, contentWidth, 8, 2, 2, 'F')
          // Score bar fill
          const barColor = overallScore >= 70 ? [34, 197, 94] : overallScore >= 50 ? [249, 115, 22] : [239, 68, 68]
          doc.setFillColor(...barColor)
          doc.roundedRect(margin, y, (contentWidth * overallScore) / 100, 8, 2, 2, 'F')
          // Score text
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(10)
          doc.setTextColor(...barColor)
          doc.text(`${overallScore}%`, margin + contentWidth + 2, y + 6)
          y += 14

          doc.setFontSize(9)
          doc.setTextColor(107, 114, 128)
          doc.setFont('helvetica', 'normal')
          doc.text(`${overallMet} Met  |  ${overallPartial} Partially Met  |  ${overallTotal - overallMet - overallPartial} Not Met  |  ${overallTotal} Total`, margin, y)
          y += 12

          // Clause-by-clause breakdown
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(12)
          doc.setTextColor(30, 27, 75)
          doc.text('Clause-by-Clause Breakdown', margin, y)
          y += 8

          Object.entries(scores).forEach(([clauseNum, data]) => {
            const pct = calculatePercentage(data.met, data.partial, data.total)

            // Check for page overflow
            if (y > 255) {
              doc.addPage()
              y = 25
            }

            // Clause header row
            doc.setFillColor(249, 250, 251)
            doc.rect(margin, y - 4, contentWidth, 10, 'F')
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(9)
            doc.setTextColor(30, 27, 75)
            doc.text(`Clause ${clauseNum}: ${data.clauseName}`, margin + 2, y + 2)
            const pctColor = pct >= 70 ? [34, 197, 94] : pct >= 50 ? [249, 115, 22] : [239, 68, 68]
            doc.setTextColor(...pctColor)
            doc.text(`${pct}%`, pageWidth - margin - 2, y + 2, { align: 'right' })
            y += 10

            // Individual requirements under this clause
            const clauseReqs = requirements.filter(r => r.clause_number === parseInt(clauseNum))
            clauseReqs.forEach(req => {
              if (y > 270) {
                doc.addPage()
                y = 25
              }

              const statusColor = req.compliance_status === 'Met' ? [34, 197, 94]
                : req.compliance_status === 'Partially Met' ? [249, 115, 22]
                : [239, 68, 68]

              // Status indicator dot
              doc.setFillColor(...statusColor)
              doc.circle(margin + 3, y + 1, 1.5, 'F')

              // Requirement text (wrapped)
              doc.setFont('helvetica', 'normal')
              doc.setFontSize(8)
              doc.setTextColor(60, 60, 70)
              const lines = doc.splitTextToSize(req.requirement_text || '', contentWidth - 30)
              doc.text(lines, margin + 8, y + 2)

              // Status label
              doc.setFont('helvetica', 'bold')
              doc.setFontSize(7)
              doc.setTextColor(...statusColor)
              doc.text(req.compliance_status, pageWidth - margin - 2, y + 2, { align: 'right' })

              y += Math.max(lines.length * 4, 6) + 2
            })

            y += 4
          })

          return y
        }
      })

      doc.save(`IG-COMP-${selectedStandard.replace('ISO_', '')}_Compliance_Report.pdf`)
      toast.success('Compliance report exported successfully')
    } catch (err) {
      console.error('Error exporting compliance report:', err)
      toast.error('Failed to export compliance report')
    } finally {
      setExporting(false)
    }
  }

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Compliance Management</h2>
            <p className="text-white/60">Track compliance requirements by clause</p>
          </div>
          {requirements.length > 0 && (
            <button
              onClick={exportComplianceReport}
              disabled={exporting}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold rounded-xl transition-all text-sm disabled:opacity-50 whitespace-nowrap self-start sm:self-auto"
            >
              {exporting ? 'Exporting...' : 'Export Report'}
            </button>
          )}
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
                  ? std.activeClass
                  : 'glass glass-border text-white/70 hover:bg-white/10'
              }`}
            >
              {std.name}
            </button>
          ))}
        </div>

        {/* Overall Score */}
        <div className="glass glass-border rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-lg md:text-xl font-bold text-white">Overall Compliance</h3>
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
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h4 className="font-bold text-white text-sm md:text-base">{data.clauseName}</h4>
                    <div className={`text-2xl font-bold ${
                      percentage >= 70 ? 'text-green-400' :
                      percentage >= 50 ? 'text-orange-400' :
                      'text-red-400'
                    }`}>
                      {percentage}%
                    </div>
                  </div>
                  <div className="flex items-center gap-2 md:gap-4 text-xs md:text-sm text-white/60 mb-2 flex-wrap">
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
                        <div key={req.id} className="flex flex-col sm:flex-row sm:items-start justify-between p-3 bg-white/5 rounded-lg gap-2">
                          <div className="flex-1">
                            <p className="text-white text-sm">{req.requirement_text}</p>
                            {req.notes && (
                              <p className="text-white/50 text-xs mt-1">{req.notes}</p>
                            )}
                          </div>
                          <div className="sm:ml-4 flex gap-1 shrink-0">
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

        {requirements.length === 0 && !loading && (
          <div className="glass glass-border rounded-xl p-8 text-center">
            <p className="text-white/60 mb-4">No compliance requirements found for this standard</p>
            <p className="text-white/40 text-sm">Contact your administrator to set up compliance tracking for your organisation</p>
          </div>
        )}
      </div>

    </Layout>
  )
}

export default Compliance

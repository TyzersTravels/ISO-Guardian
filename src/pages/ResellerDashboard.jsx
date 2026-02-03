import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'

const ResellerDashboard = () => {
  const { userProfile } = useAuth()
  const [clients, setClients] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('analytics') // analytics, calendar, reports

  useEffect(() => {
    fetchClientsData()
  }, [])

  const fetchClientsData = async () => {
    try {
      // TODO: When reseller field added to companies, filter by reseller_id
      // For now, fetch own company as placeholder
      const { data: companies } = await supabase
        .from('companies')
        .select('*')
        .eq('id', userProfile.company_id)

      const clientsData = await Promise.all(
        (companies || []).map(async (company) => {
          const [users, docs, ncrs, audits, compliance] = await Promise.all([
            supabase.from('users').select('*').eq('company_id', company.id),
            supabase.from('documents').select('*').eq('company_id', company.id),
            supabase.from('ncrs').select('*').eq('company_id', company.id).eq('status', 'Open'),
            supabase.from('audits').select('*').eq('company_id', company.id),
            supabase.from('compliance_requirements').select('*').eq('company_id', company.id)
          ])

          const criticalNCRs = ncrs.data?.filter(n => n.severity === 'Critical').length || 0
          
          return {
            id: company.id,
            name: company.name,
            users: users.data?.length || 0,
            documents: docs.data?.length || 0,
            openNCRs: ncrs.data?.length || 0,
            criticalNCRs,
            upcomingAudits: audits.data?.filter(a => a.status === 'Scheduled').length || 0,
            complianceScore: 72 // Calculate from compliance_requirements
          }
        })
      )

      setClients(clientsData)
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const downloadClientReport = async (clientId) => {
    try {
      const client = clients.find(c => c.id === clientId)
      const reportData = `
ISOGuardian Monthly Compliance Report
Client: ${client.name}
Generated: ${new Date().toLocaleDateString()}

Summary:
- Compliance Score: ${client.complianceScore}%
- Open NCRs: ${client.openNCRs}
- Critical Issues: ${client.criticalNCRs}
- Documents: ${client.documents}
- Active Users: ${client.users}

Recommendations:
- Address ${client.criticalNCRs} critical NCRs immediately
- Schedule follow-up audit
      `
      
      const blob = new Blob([reportData], { type: 'text/plain' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${client.name}_Report_${new Date().toISOString().split('T')[0]}.txt`
      a.click()
      alert(`Report downloaded for ${client.name}`)
    } catch (err) {
      alert('Failed to generate report')
    }
  }

  const jumpToClient = async (clientId) => {
    if (confirm('Jump into this client\'s dashboard? You will have full admin access.')) {
      // TODO: Implement client impersonation
      alert('Feature coming soon: Intervention mode to help clients close NCRs')
    }
  }

  if (loading) return <Layout><div className="text-white text-center py-12">Loading...</div></Layout>

  const avgCompliance = clients.reduce((sum, c) => sum + c.complianceScore, 0) / clients.length || 0
  const totalCritical = clients.reduce((sum, c) => sum + c.criticalNCRs, 0)
  const totalOpenNCRs = clients.reduce((sum, c) => sum + c.openNCRs, 0)

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="glass glass-border rounded-2xl p-6">
          <h1 className="text-3xl font-bold text-white mb-2">Reseller Analytics</h1>
          <p className="text-cyan-200">Multi-tenant oversight for {clients.length} client{clients.length !== 1 ? 's' : ''}</p>
        </div>

        {/* View Selector */}
        <div className="flex gap-2">
          <button onClick={() => setView('analytics')} className={`px-4 py-2 rounded-xl font-semibold ${view === 'analytics' ? 'bg-cyan-500 text-white' : 'glass glass-border text-white/70'}`}>
            📊 Analytics
          </button>
          <button onClick={() => setView('calendar')} className={`px-4 py-2 rounded-xl font-semibold ${view === 'calendar' ? 'bg-cyan-500 text-white' : 'glass glass-border text-white/70'}`}>
            📅 Audit Calendar
          </button>
          <button onClick={() => setView('reports')} className={`px-4 py-2 rounded-xl font-semibold ${view === 'reports' ? 'bg-cyan-500 text-white' : 'glass glass-border text-white/70'}`}>
            📄 Reports
          </button>
        </div>

        {/* Analytics View */}
        {view === 'analytics' && (
          <>
            {/* Aggregate Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass glass-border rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-cyan-400">{avgCompliance.toFixed(1)}%</div>
                <div className="text-sm text-white/70">Avg Compliance</div>
              </div>
              <div className="glass glass-border rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-red-400">{totalCritical}</div>
                <div className="text-sm text-white/70">Critical Issues</div>
              </div>
              <div className="glass glass-border rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-orange-400">{totalOpenNCRs}</div>
                <div className="text-sm text-white/70">Open NCRs</div>
              </div>
              <div className="glass glass-border rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-white">{clients.length}</div>
                <div className="text-sm text-white/70">Active Clients</div>
              </div>
            </div>

            {/* Priority Clients */}
            <div className="glass glass-border rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Priority Clients (Most Critical Issues)</h2>
              <div className="space-y-3">
                {clients.sort((a, b) => b.criticalNCRs - a.criticalNCRs).map(client => (
                  <div key={client.id} className="glass glass-border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-white">{client.name}</h3>
                        <div className="text-sm text-white/60">
                          {client.criticalNCRs} critical • {client.openNCRs} open NCRs
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => jumpToClient(client.id)} className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 text-sm">
                          🚀 Jump In
                        </button>
                        <button onClick={() => downloadClientReport(client.id)} className="px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-lg hover:bg-cyan-500/30 text-sm">
                          📥 Report
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <div className="text-center">
                        <div className="text-xl font-bold text-cyan-400">{client.complianceScore}%</div>
                        <div className="text-xs text-white/60">Compliance</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-white">{client.documents}</div>
                        <div className="text-xs text-white/60">Docs</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-orange-400">{client.upcomingAudits}</div>
                        <div className="text-xs text-white/60">Audits</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-white">{client.users}</div>
                        <div className="text-xs text-white/60">Users</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Calendar View */}
        {view === 'calendar' && (
          <div className="glass glass-border rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Cross-Client Audit Schedule</h2>
            <div className="text-white/70 text-center py-12">
              <p>📅 Calendar view showing all audits across {clients.length} clients</p>
              <p className="text-sm mt-2">Coming soon: Interactive calendar with filtering</p>
            </div>
          </div>
        )}

        {/* Reports View */}
        {view === 'reports' && (
          <div className="glass glass-border rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Bulk Reporting</h2>
            <div className="space-y-3">
              {clients.map(client => (
                <div key={client.id} className="glass glass-border rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white">{client.name}</h3>
                    <p className="text-sm text-white/60">Compliance: {client.complianceScore}% • {client.openNCRs} open NCRs</p>
                  </div>
                  <button onClick={() => downloadClientReport(client.id)} className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-semibold">
                    📥 Download Report
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .glass { background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(20px); }
        .glass-border { border: 1px solid rgba(255, 255, 255, 0.2); }
      `}</style>
    </Layout>
  )
}

export default ResellerDashboard

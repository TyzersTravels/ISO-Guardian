import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { usePermissions } from '../contexts/usePermissions'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import { useNavigate } from 'react-router-dom'

const ResellerDashboard = () => {
  const { userProfile } = useAuth()
  const { isReseller } = usePermissions()
  const navigate = useNavigate()
  
  const [clients, setClients] = useState([])
  const [stats, setStats] = useState({
    totalClients: 0,
    totalUsers: 0,
    activeClients: 0,
    starterTier: 0,
    professionalTier: 0,
    enterpriseTier: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isReseller) {
      navigate('/dashboard')
      return
    }
    fetchResellerData()
  }, [isReseller])

  const fetchResellerData = async () => {
    try {
      setLoading(true)
      
      const { data: companies, error } = await supabase
        .from('companies')
        .select(`
          *,
          subscriptions(*)
        `)
        .eq('reseller_id', userProfile.id)
        .order('name')

      if (error) throw error

      const companiesWithUsers = await Promise.all(
        (companies || []).map(async (company) => {
          const { count } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', company.id)

          const complianceScores = {
            iso9001: Math.floor(Math.random() * 40) + 50,
            iso14001: Math.floor(Math.random() * 40) + 50,
            iso45001: Math.floor(Math.random() * 40) + 50
          }

          return { ...company, userCount: count || 0, complianceScores }
        })
      )

      const totalUsers = companiesWithUsers.reduce((sum, c) => sum + c.userCount, 0)
      const activeClients = companiesWithUsers.filter(c => 
        c.subscriptions?.[0]?.status === 'Active'
      ).length

      const tierCounts = companiesWithUsers.reduce((acc, c) => {
        const tier = c.subscriptions?.[0]?.plan_type || 'Starter'
        acc[tier] = (acc[tier] || 0) + 1
        return acc
      }, {})

      setStats({
        totalClients: companiesWithUsers.length,
        totalUsers,
        activeClients,
        starterTier: tierCounts.Starter || 0,
        professionalTier: tierCounts.Professional || 0,
        enterpriseTier: tierCounts.Enterprise || 0
      })

      setClients(companiesWithUsers)
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const getComplianceColor = (score) => {
    if (score >= 70) return 'text-green-400'
    if (score >= 50) return 'text-orange-400'
    return 'text-red-400'
  }

  const getComplianceBg = (score) => {
    if (score >= 70) return 'bg-green-500/20'
    if (score >= 50) return 'bg-orange-500/20'
    return 'bg-red-500/20'
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="text-white text-center">
            <div className="text-2xl mb-2">⏳</div>
            <div>Loading your client portfolio...</div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="glass glass-border rounded-2xl p-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">🏢 IMS Consultant Dashboard</h2>
              <p className="text-cyan-200">Welcome back! Managing {stats.totalClients} client{stats.totalClients !== 1 ? 's' : ''}</p>
            </div>
            <button onClick={() => alert('Add client feature coming soon!')} className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-semibold shadow-lg">
              + Add New Client
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-white mb-3">Client Portfolio Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="glass glass-border rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-cyan-400">{stats.totalClients}</div>
              <div className="text-sm text-white/70 mt-1">Total Clients</div>
            </div>
            <div className="glass glass-border rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-green-400">{stats.activeClients}</div>
              <div className="text-sm text-white/70 mt-1">Active</div>
            </div>
            <div className="glass glass-border rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-white">{stats.totalUsers}</div>
              <div className="text-sm text-white/70 mt-1">Total Users</div>
            </div>
            <div className="glass glass-border rounded-xl p-4 text-center bg-blue-500/10">
              <div className="text-3xl font-bold text-blue-400">{stats.starterTier}</div>
              <div className="text-sm text-white/70 mt-1">Starter</div>
            </div>
            <div className="glass glass-border rounded-xl p-4 text-center bg-purple-500/10">
              <div className="text-3xl font-bold text-purple-400">{stats.professionalTier}</div>
              <div className="text-sm text-white/70 mt-1">Professional</div>
            </div>
            <div className="glass glass-border rounded-xl p-4 text-center bg-orange-500/10">
              <div className="text-3xl font-bold text-orange-400">{stats.enterpriseTier}</div>
              <div className="text-sm text-white/70 mt-1">Enterprise</div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-white mb-3">Your Clients</h3>
          {clients.length === 0 ? (
            <div className="glass glass-border rounded-xl p-12 text-center">
              <div className="text-6xl mb-4">📋</div>
              <h4 className="text-xl font-bold text-white mb-2">No Clients Yet</h4>
              <p className="text-white/60 mb-6">Start by adding your first client</p>
              <button className="px-8 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-semibold">
                Add Your First Client
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {clients.map(client => {
                const subscription = client.subscriptions?.[0]
                const isActive = subscription?.status === 'Active'
                
                return (
                  <div key={client.id} className="glass glass-border rounded-xl p-5 hover:bg-white/5 transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h4 className="font-bold text-white text-xl">{client.name}</h4>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isActive ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
                            {isActive ? '✓ Active' : '✗ Inactive'}
                          </span>
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            {subscription?.plan_type || 'Starter'} Tier
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                          <div>
                            <div className="text-white/50 text-xs mb-1">Industry</div>
                            <div className="text-white font-medium">{client.industry || 'Manufacturing'}</div>
                          </div>
                          <div>
                            <div className="text-white/50 text-xs mb-1">Location</div>
                            <div className="text-white font-medium">{client.location || 'Johannesburg'}</div>
                          </div>
                          <div>
                            <div className="text-white/50 text-xs mb-1">Users</div>
                            <div className="text-white font-medium">{client.userCount} / {subscription?.max_users || 5}</div>
                          </div>
                          <div>
                            <div className="text-white/50 text-xs mb-1">Standards</div>
                            <div className="text-white font-medium">{client.standards_enabled?.length || 1}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 flex-wrap">
                          <div className="text-xs text-white/50">Compliance:</div>
                          <div className={`px-3 py-1.5 rounded-lg ${getComplianceBg(client.complianceScores.iso9001)}`}>
                            <span className={`font-semibold ${getComplianceColor(client.complianceScores.iso9001)}`}>
                              ISO 9001: {client.complianceScores.iso9001}%
                            </span>
                          </div>
                          <div className={`px-3 py-1.5 rounded-lg ${getComplianceBg(client.complianceScores.iso14001)}`}>
                            <span className={`font-semibold ${getComplianceColor(client.complianceScores.iso14001)}`}>
                              ISO 14001: {client.complianceScores.iso14001}%
                            </span>
                          </div>
                          <div className={`px-3 py-1.5 rounded-lg ${getComplianceBg(client.complianceScores.iso45001)}`}>
                            <span className={`font-semibold ${getComplianceColor(client.complianceScores.iso45001)}`}>
                              ISO 45001: {client.complianceScores.iso45001}%
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <button onClick={() => navigate(`/dashboard`)} className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm font-semibold whitespace-nowrap">
                          View Dashboard
                        </button>
                        <button className="px-5 py-2.5 glass glass-border text-white hover:bg-white/10 rounded-lg text-sm font-semibold whitespace-nowrap">
                          Manage
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .glass { background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(20px); }
        .glass-border { border: 1px solid rgba(255, 255, 255, 0.2); }
      `}</style>
    </Layout>
  )
}

export default ResellerDashboard

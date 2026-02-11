import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import { useNavigate } from 'react-router-dom'

const Dashboard = () => {
  const { userProfile } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalDocuments: 0,
    openNCRs: 0,
    criticalNCRs: 0,
    recentDocuments: [],
    recentNCRs: []
  })
  const [adminStats, setAdminStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const isSuperAdmin = userProfile?.email === 'krugerreece@gmail.com'

  useEffect(() => {
    if (userProfile) {
      fetchDashboardData()
      if (isSuperAdmin) {
        fetchAdminStats()
      }
    }
  }, [userProfile])

  const fetchAdminStats = async () => {
    try {
      const { data: companies } = await supabase.from('companies').select('id')
      const { data: users } = await supabase.from('users').select('id')
      const { data: subscriptions } = await supabase.from('subscriptions').select('price_per_user, current_users, status')
      
      const activeSubscriptions = subscriptions?.filter(s => s.status === 'Active') || []
      const monthlyRevenue = activeSubscriptions.reduce((sum, sub) => 
        sum + (sub.price_per_user * sub.current_users), 0
      )

      setAdminStats({
        totalClients: companies?.length || 0,
        totalUsers: users?.length || 0,
        monthlyRevenue,
        activeClients: activeSubscriptions.length
      })
    } catch (err) {
      console.error('Error fetching admin stats:', err)
    }
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch documents count
      const { count: docCount } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })

      // Fetch NCRs
      const { data: ncrs } = await supabase
        .from('ncrs')
        .select('*')

      const openNCRs = ncrs?.filter(n => n.status === 'Open') || []
      const criticalNCRs = openNCRs.filter(n => n.severity === 'Critical')

      // Fetch recent documents (last 5)
      const { data: recentDocs } = await supabase
        .from('documents')
        .select('*')
        .limit(5)

      // Fetch recent NCRs (last 5)
      const { data: recentNCRs } = await supabase
        .from('ncrs')
        .select('*')
        .limit(5)

      setStats({
        totalDocuments: docCount || 0,
        openNCRs: openNCRs.length,
        criticalNCRs: criticalNCRs.length,
        recentDocuments: recentDocs || [],
        recentNCRs: recentNCRs || []
      })
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!userProfile) {
    return (
      <Layout>
        <div className="text-white text-center py-12">Loading profile...</div>
      </Layout>
    )
  }

  if (loading) {
    return (
      <Layout>
        <div className="text-white text-center py-12">Loading dashboard...</div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome */}
        <div className="glass glass-border rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-white mb-1">
            Welcome back, {userProfile.full_name}! 👋
          </h2>
          <p className="text-cyan-200 text-sm">
            {userProfile.company?.name} · {userProfile.role.replace('_', ' ')}
          </p>
        </div>

        {/* SuperAdmin Analytics Widget */}
        {isSuperAdmin && adminStats && (
          <div className="glass glass-border rounded-2xl p-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  SuperAdmin Analytics
                </h3>
                <p className="text-purple-200 text-sm">Business Overview</p>
              </div>
              <button
                onClick={() => navigate('/admin')}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                View Full Analytics →
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="text-3xl font-bold text-white mb-1">
                  R{adminStats.monthlyRevenue.toLocaleString()}
                </div>
                <div className="text-purple-200 text-sm">Monthly Revenue</div>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="text-3xl font-bold text-white mb-1">{adminStats.activeClients}</div>
                <div className="text-purple-200 text-sm">Active Clients</div>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="text-3xl font-bold text-white mb-1">{adminStats.totalUsers}</div>
                <div className="text-purple-200 text-sm">Total Users</div>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="text-3xl font-bold text-white mb-1">{adminStats.totalClients}</div>
                <div className="text-purple-200 text-sm">Total Companies</div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/documents')}
            className="glass glass-border rounded-2xl p-6 hover:bg-white/5 cursor-pointer text-left"
          >
            <div className="text-4xl font-bold text-blue-400 mb-2">
              {stats.totalDocuments}
            </div>
            <div className="text-white font-medium">Documents</div>
            <div className="text-white/60 text-sm">Click to view →</div>
          </button>

          <button
            onClick={() => navigate('/ncrs')}
            className="glass glass-border rounded-2xl p-6 hover:bg-white/5 cursor-pointer text-left"
          >
            <div className="text-4xl font-bold text-orange-400 mb-2">
              {stats.openNCRs}
            </div>
            <div className="text-white font-medium">Open NCRs</div>
            <div className="text-white/60 text-sm">Click to manage →</div>
          </button>

          <div className="glass glass-border rounded-2xl p-6 bg-red-500/10">
            <div className="text-4xl font-bold text-red-400 mb-2">
              {stats.criticalNCRs}
            </div>
            <div className="text-white font-medium">Critical Issues</div>
            <div className="text-red-300 text-sm">Requires attention</div>
          </div>
        </div>

        {/* Standards Access */}
        <div className="glass glass-border rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-3">Your Standards Access</h3>
          <div className="flex gap-3 flex-wrap">
            {userProfile.standards_access.map(standard => (
              <div key={standard} className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 rounded-xl text-cyan-300 font-semibold text-sm">
                {standard.replace('_', ' ')}
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent Documents */}
          <div className="glass glass-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Recent Documents</h3>
              <button
                onClick={() => navigate('/documents')}
                className="text-cyan-400 text-sm hover:underline"
              >
                View all →
              </button>
            </div>
            <div className="space-y-2">
              {stats.recentDocuments.length === 0 ? (
                <p className="text-white/60 text-sm">No documents yet</p>
              ) : (
                stats.recentDocuments.map(doc => (
                  <div key={doc.id} className="glass glass-border rounded-lg p-3">
                    <div className="font-semibold text-white text-sm">{doc.name}</div>
                    <div className="text-white/60 text-xs mt-1">
                      {doc.standard.replace('_', ' ')} · {doc.type}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent NCRs */}
          <div className="glass glass-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Recent NCRs</h3>
              <button
                onClick={() => navigate('/ncrs')}
                className="text-cyan-400 text-sm hover:underline"
              >
                View all →
              </button>
            </div>
            <div className="space-y-2">
              {stats.recentNCRs.length === 0 ? (
                <p className="text-white/60 text-sm">No NCRs yet</p>
              ) : (
                stats.recentNCRs.map(ncr => (
                  <div key={ncr.id} className="glass glass-border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-cyan-400 text-xs">{ncr.ncr_number}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        ncr.severity === 'Critical' ? 'bg-red-500/20 text-red-300' :
                        ncr.severity === 'Major' ? 'bg-orange-500/20 text-orange-300' :
                        'bg-yellow-500/20 text-yellow-300'
                      }`}>
                        {ncr.severity}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        ncr.status === 'Open' ? 'bg-orange-500/20 text-orange-300' : 'bg-green-500/20 text-green-300'
                      }`}>
                        {ncr.status}
                      </span>
                    </div>
                    <div className="font-semibold text-white text-sm">{ncr.title}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass glass-border rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={() => navigate('/documents')}
              className="px-4 py-3 glass glass-border rounded-xl text-white hover:bg-white/10 text-left"
            >
              <div className="font-semibold mb-1">View Documents</div>
              <div className="text-xs text-white/60">Browse compliance documents</div>
            </button>
            <button
              onClick={() => navigate('/ncrs')}
              className="px-4 py-3 glass glass-border rounded-xl text-white hover:bg-white/10 text-left"
            >
              <div className="font-semibold mb-1">Create NCR</div>
              <div className="text-xs text-white/60">Report non-conformance</div>
            </button>
            <button
              onClick={() => navigate('/compliance')}
              className="px-4 py-3 glass glass-border rounded-xl text-white hover:bg-white/10 text-left"
            >
              <div className="font-semibold mb-1">Check Compliance</div>
              <div className="text-xs text-white/60">View compliance scores</div>
            </button>
          </div>
        </div>
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

export default Dashboard

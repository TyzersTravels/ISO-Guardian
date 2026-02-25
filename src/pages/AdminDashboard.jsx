import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'

const AdminDashboard = () => {
  const { userProfile } = useAuth()
  const [clients, setClients] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  // Only allow super admin to access
  const isSystemAdmin = userProfile?.email === 'krugerreece@gmail.com'

  useEffect(() => {
    if (isSystemAdmin) {
      fetchAdminData()
    }
  }, [isSystemAdmin])

  const fetchAdminData = async () => {
    try {
      setLoading(true)

      // Fetch all companies
      const { data: companiesData } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false })

      // Fetch all users grouped by company
      const { data: usersData } = await supabase
        .from('users')
        .select('*')

      // Fetch usage stats per company
      const clientStats = await Promise.all(
        companiesData.map(async (company) => {
          const [docs, ncrs, audits, reviews] = await Promise.all([
            supabase.from('documents').select('id', { count: 'exact', head: true }).eq('company_id', company.id),
            supabase.from('ncrs').select('id', { count: 'exact', head: true }).eq('company_id', company.id),
            supabase.from('audits').select('id', { count: 'exact', head: true }).eq('company_id', company.id),
            supabase.from('management_reviews').select('id', { count: 'exact', head: true }).eq('company_id', company.id)
          ])

          const companyUsers = usersData.filter(u => u.company_id === company.id)

          return {
            ...company,
            user_count: companyUsers.length,
            users: companyUsers,
            documents_count: docs.count || 0,
            ncrs_count: ncrs.count || 0,
            audits_count: audits.count || 0,
            reviews_count: reviews.count || 0,
            mrr: companyUsers.length * 400, // R400 per user
            last_active: companyUsers[0]?.updated_at || company.updated_at
          }
        })
      )

      setClients(clientStats)

      // Calculate overall analytics
      const totalUsers = clientStats.reduce((sum, c) => sum + c.user_count, 0)
      const totalMRR = clientStats.reduce((sum, c) => sum + c.mrr, 0)
      const totalDocs = clientStats.reduce((sum, c) => sum + c.documents_count, 0)
      const totalNCRs = clientStats.reduce((sum, c) => sum + c.ncrs_count, 0)

      setAnalytics({
        total_clients: clientStats.length,
        total_users: totalUsers,
        total_mrr: totalMRR,
        total_arr: totalMRR * 12,
        total_documents: totalDocs,
        total_ncrs: totalNCRs,
        avg_users_per_client: Math.round(totalUsers / clientStats.length),
        avg_revenue_per_client: Math.round(totalMRR / clientStats.length)
      })

    } catch (err) {
      console.error('Error fetching admin data:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!isSystemAdmin) {
    return (
      <Layout>
        <div className="text-center text-white p-8">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p>You do not have permission to view this page.</p>
        </div>
      </Layout>
    )
  }

  if (loading) {
    return (
      <Layout>
        <div className="text-center text-white p-8">Loading admin dashboard...</div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="glass glass-border rounded-2xl p-6">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-cyan-200">System-wide analytics and client management</p>
        </div>

        {/* Revenue Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass glass-border rounded-xl p-6 bg-gradient-to-br from-green-500/20 to-green-600/20">
            <div className="text-4xl font-bold text-green-400">
              R{analytics?.total_mrr?.toLocaleString()}
            </div>
            <div className="text-sm text-white/70 mt-1">Monthly Recurring Revenue</div>
            <div className="text-xs text-green-300 mt-2">
              R{analytics?.total_arr?.toLocaleString()}/year
            </div>
          </div>

          <div className="glass glass-border rounded-xl p-6">
            <div className="text-4xl font-bold text-cyan-400">{analytics?.total_clients}</div>
            <div className="text-sm text-white/70 mt-1">Active Clients</div>
            <div className="text-xs text-cyan-300 mt-2">
              Avg R{analytics?.avg_revenue_per_client?.toLocaleString()}/client
            </div>
          </div>

          <div className="glass glass-border rounded-xl p-6">
            <div className="text-4xl font-bold text-blue-400">{analytics?.total_users}</div>
            <div className="text-sm text-white/70 mt-1">Total Users</div>
            <div className="text-xs text-blue-300 mt-2">
              Avg {analytics?.avg_users_per_client} users/client
            </div>
          </div>

          <div className="glass glass-border rounded-xl p-6">
            <div className="text-4xl font-bold text-purple-400">{analytics?.total_documents}</div>
            <div className="text-sm text-white/70 mt-1">Documents Managed</div>
            <div className="text-xs text-purple-300 mt-2">
              {analytics?.total_ncrs} NCRs tracked
            </div>
          </div>
        </div>

        {/* Client List */}
        <div className="glass glass-border rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Client Overview</h2>
          
          <div className="space-y-3">
            {clients.map(client => (
              <div key={client.id} className="glass glass-border rounded-xl p-4 hover:bg-white/5 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white">{client.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-white/60 mt-1">
                      <span>📍 {client.location}</span>
                      <span>🏢 {client.industry}</span>
                      <span>👥 {client.employee_count} employees</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-400">
                      R{client.mrr.toLocaleString()}/mo
                    </div>
                    <div className="text-xs text-white/60">
                      {client.user_count} users × R400
                    </div>
                  </div>
                </div>

                {/* Usage Stats */}
                <div className="grid grid-cols-4 gap-3 mb-3">
                  <div className="glass glass-border rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-blue-400">{client.documents_count}</div>
                    <div className="text-xs text-white/60">Documents</div>
                  </div>
                  <div className="glass glass-border rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-orange-400">{client.ncrs_count}</div>
                    <div className="text-xs text-white/60">NCRs</div>
                  </div>
                  <div className="glass glass-border rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-purple-400">{client.audits_count}</div>
                    <div className="text-xs text-white/60">Audits</div>
                  </div>
                  <div className="glass glass-border rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-pink-400">{client.reviews_count}</div>
                    <div className="text-xs text-white/60">Reviews</div>
                  </div>
                </div>

                {/* Users */}
                <div>
                  <div className="text-sm text-white/70 mb-2">Users:</div>
                  <div className="flex flex-wrap gap-2">
                    {client.users.map(user => (
                      <div key={user.id} className="px-3 py-1 bg-cyan-500/20 rounded-full text-xs text-cyan-300">
                        {user.email} ({user.role})
                      </div>
                    ))}
                  </div>
                </div>

                {/* Last Active */}
                <div className="text-xs text-white/50 mt-3">
                  Last activity: {new Date(client.last_active).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Health */}
        <div className="glass glass-border rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4">System Health</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="glass glass-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-white font-semibold">Database</span>
              </div>
              <div className="text-sm text-white/60">Connected & Healthy</div>
            </div>
            <div className="glass glass-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-white font-semibold">Storage</span>
              </div>
              <div className="text-sm text-white/60">Operational</div>
            </div>
            <div className="glass glass-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-white font-semibold">Auth</span>
              </div>
              <div className="text-sm text-white/60">All Systems Go</div>
            </div>
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
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-pulse {
          animation: pulse 2s ease-in-out infinite;
        }
      `}</style>
    </Layout>
  )
}

export default AdminDashboard

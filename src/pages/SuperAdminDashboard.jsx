import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'

const SuperAdminDashboard = () => {
  const { userProfile } = useAuth()
  const [analytics, setAnalytics] = useState(null)
  const [clients, setClients] = useState([])
  const [invoices, setInvoices] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview') // 'overview', 'clients', 'revenue', 'activity'

  // Check if user is super admin (replace with your actual email)
  const isSuperAdmin = userProfile?.email === 'krugerreece@gmail.com' || 
                       userProfile?.email === 'tyreece@tyzertheadvisor.co.za'

  useEffect(() => {
    if (isSuperAdmin) {
      fetchAdminData()
    }
  }, [isSuperAdmin])

  const fetchAdminData = async () => {
    try {
      setLoading(true)

      // Fetch all companies
      const { data: companiesData } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false })

      // Fetch all users
      const { data: usersData } = await supabase
        .from('users')
        .select('*')

      // Fetch subscriptions
      const { data: subscriptionsData } = await supabase
        .from('subscriptions')
        .select('*')

      // Fetch invoices
      const { data: invoicesData } = await supabase
        .from('invoices')
        .select('*')
        .order('invoice_date', { ascending: false })
        .limit(20)

      // Fetch recent activity
      const { data: activityData } = await supabase
        .from('usage_analytics')
        .select(`
          *,
          users(email, full_name),
          companies(name)
        `)
        .order('timestamp', { ascending: false })
        .limit(50)

      // Calculate per-client stats
      const clientStats = await Promise.all(
        companiesData.map(async (company) => {
          // Get subscription
          const subscription = subscriptionsData?.find(s => s.company_id === company.id)
          
          // Get users for this company
          const companyUsers = usersData?.filter(u => u.company_id === company.id) || []
          
          // Get usage counts
          const [docs, ncrs, audits, reviews] = await Promise.all([
            supabase.from('documents').select('id', { count: 'exact', head: true }).eq('company_id', company.id),
            supabase.from('ncrs').select('id', { count: 'exact', head: true }).eq('company_id', company.id),
            supabase.from('audits').select('id', { count: 'exact', head: true }).eq('company_id', company.id),
            supabase.from('management_reviews').select('id', { count: 'exact', head: true }).eq('company_id', company.id)
          ])

          // Get last login
          const lastLogin = companyUsers.reduce((latest, user) => {
            return user.last_login && (!latest || new Date(user.last_login) > new Date(latest))
              ? user.last_login
              : latest
          }, null)

          // Calculate health score (0-100)
          let healthScore = 50
          if (lastLogin) {
            const daysSinceLogin = (new Date() - new Date(lastLogin)) / (1000 * 60 * 60 * 24)
            if (daysSinceLogin < 7) healthScore += 30
            else if (daysSinceLogin < 30) healthScore += 15
          }
          if ((docs.count + ncrs.count + audits.count) > 10) healthScore += 20

          return {
            ...company,
            subscription: subscription || { status: 'none', plan: 'None', users_count: 0, total_amount: 0 },
            users: companyUsers,
            user_count: companyUsers.length,
            documents_count: docs.count || 0,
            ncrs_count: ncrs.count || 0,
            audits_count: audits.count || 0,
            reviews_count: reviews.count || 0,
            last_login: lastLogin,
            health_score: Math.min(healthScore, 100),
            mrr: subscription?.total_amount || 0
          }
        })
      )

      setClients(clientStats)
      setInvoices(invoicesData || [])
      setRecentActivity(activityData || [])

      // Calculate overall analytics
      const totalMRR = clientStats.reduce((sum, c) => sum + c.mrr, 0)
      const activeClients = clientStats.filter(c => c.subscription.status === 'active').length
      const totalUsers = clientStats.reduce((sum, c) => sum + c.user_count, 0)
      const totalDocs = clientStats.reduce((sum, c) => sum + c.documents_count, 0)
      const totalNCRs = clientStats.reduce((sum, c) => sum + c.ncrs_count, 0)
      const pendingInvoices = invoicesData?.filter(i => i.status === 'pending') || []
      const overdueInvoices = invoicesData?.filter(i => i.status === 'overdue' || 
        (i.status === 'pending' && new Date(i.due_date) < new Date())) || []

      setAnalytics({
        total_clients: clientStats.length,
        active_clients: activeClients,
        trial_clients: clientStats.filter(c => c.subscription.status === 'trial').length,
        total_users: totalUsers,
        total_mrr: totalMRR,
        total_arr: totalMRR * 12,
        total_documents: totalDocs,
        total_ncrs: totalNCRs,
        pending_invoices_count: pendingInvoices.length,
        pending_invoices_total: pendingInvoices.reduce((sum, i) => sum + parseFloat(i.total || 0), 0),
        overdue_invoices_count: overdueInvoices.length,
        overdue_invoices_total: overdueInvoices.reduce((sum, i) => sum + parseFloat(i.total || 0), 0),
        avg_health_score: Math.round(clientStats.reduce((sum, c) => sum + c.health_score, 0) / clientStats.length)
      })

    } catch (err) {
      console.error('Error fetching admin data:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!isSuperAdmin) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="glass glass-border rounded-2xl p-8 text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
            <p className="text-white/70">You do not have permission to view this page.</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-white text-xl">Loading admin dashboard...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6 pb-20">
        {/* Header */}
        <div className="glass glass-border rounded-2xl p-6 bg-gradient-to-r from-purple-500/20 to-pink-500/20">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">🎯 Super Admin Dashboard</h1>
              <p className="text-purple-200">ISOGuardian System Overview</p>
            </div>
            <button 
              onClick={fetchAdminData}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-semibold transition-all"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 overflow-x-auto">
          {[
            { id: 'overview', label: '📊 Overview', icon: '📊' },
            { id: 'clients', label: '🏢 Clients', icon: '🏢' },
            { id: 'revenue', label: '💰 Revenue', icon: '💰' },
            { id: 'activity', label: '📈 Activity', icon: '📈' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                  : 'glass glass-border text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Revenue Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass glass-border rounded-xl p-6 bg-gradient-to-br from-green-500/20 to-green-600/20">
                <div className="text-sm text-white/70 mb-1">Monthly Revenue</div>
                <div className="text-3xl font-bold text-green-400">
                  R{analytics?.total_mrr?.toLocaleString()}
                </div>
                <div className="text-xs text-green-300 mt-2">
                  R{analytics?.total_arr?.toLocaleString()}/year ARR
                </div>
              </div>

              <div className="glass glass-border rounded-xl p-6 bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
                <div className="text-sm text-white/70 mb-1">Active Clients</div>
                <div className="text-3xl font-bold text-cyan-400">{analytics?.active_clients}</div>
                <div className="text-xs text-cyan-300 mt-2">
                  {analytics?.total_clients} total • {analytics?.trial_clients} trials
                </div>
              </div>

              <div className="glass glass-border rounded-xl p-6 bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                <div className="text-sm text-white/70 mb-1">Total Users</div>
                <div className="text-3xl font-bold text-blue-400">{analytics?.total_users}</div>
                <div className="text-xs text-blue-300 mt-2">
                  Avg {Math.round(analytics?.total_users / analytics?.total_clients)} per client
                </div>
              </div>

              <div className="glass glass-border rounded-xl p-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                <div className="text-sm text-white/70 mb-1">System Health</div>
                <div className="text-3xl font-bold text-purple-400">{analytics?.avg_health_score}%</div>
                <div className="text-xs text-purple-300 mt-2">
                  Average client health
                </div>
              </div>
            </div>

            {/* Usage Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="glass glass-border rounded-xl p-4">
                <div className="text-4xl font-bold text-blue-400">{analytics?.total_documents}</div>
                <div className="text-sm text-white/70 mt-1">Documents Managed</div>
              </div>
              <div className="glass glass-border rounded-xl p-4">
                <div className="text-4xl font-bold text-orange-400">{analytics?.total_ncrs}</div>
                <div className="text-sm text-white/70 mt-1">NCRs Tracked</div>
              </div>
              <div className="glass glass-border rounded-xl p-4">
                <div className="text-4xl font-bold text-green-400">{clients.reduce((sum, c) => sum + c.audits_count, 0)}</div>
                <div className="text-sm text-white/70 mt-1">Audits Scheduled</div>
              </div>
            </div>

            {/* Revenue Alerts */}
            {analytics?.overdue_invoices_count > 0 && (
              <div className="glass glass-border rounded-xl p-6 bg-red-500/20 border-red-500/50">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">⚠️</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-red-300 mb-2">Overdue Invoices</h3>
                    <p className="text-white/80">
                      {analytics.overdue_invoices_count} invoices overdue totaling <strong>R{analytics.overdue_invoices_total.toLocaleString()}</strong>
                    </p>
                    <button 
                      onClick={() => setActiveTab('revenue')}
                      className="mt-3 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold"
                    >
                      Review Invoices →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Clients Tab */}
        {activeTab === 'clients' && (
          <div className="space-y-3">
            {clients
              .sort((a, b) => b.health_score - a.health_score)
              .map(client => (
              <div key={client.id} className="glass glass-border rounded-xl p-6 hover:bg-white/5 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-white">{client.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        client.subscription.status === 'active' ? 'bg-green-500/20 text-green-300' :
                        client.subscription.status === 'trial' ? 'bg-blue-500/20 text-blue-300' :
                        client.subscription.status === 'past_due' ? 'bg-red-500/20 text-red-300' :
                        'bg-gray-500/20 text-gray-300'
                      }`}>
                        {client.subscription.status.toUpperCase()}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        client.health_score >= 70 ? 'bg-green-500/20 text-green-300' :
                        client.health_score >= 40 ? 'bg-orange-500/20 text-orange-300' :
                        'bg-red-500/20 text-red-300'
                      }`}>
                        Health: {client.health_score}%
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-white/60">
                      <span>📍 {client.location}</span>
                      <span>🏢 {client.industry}</span>
                      <span>👥 {client.employee_count} employees</span>
                      {client.last_login && (
                        <span>🕐 Last active: {new Date(client.last_login).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-400">
                      R{client.mrr.toLocaleString()}/mo
                    </div>
                    <div className="text-xs text-white/60">
                      {client.user_count} users × R{client.subscription.price_per_user || 400}
                    </div>
                  </div>
                </div>

                {/* Usage Stats */}
                <div className="grid grid-cols-4 gap-3 mb-4">
                  <div className="glass glass-border rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-blue-400">{client.documents_count}</div>
                    <div className="text-xs text-white/60">Documents</div>
                  </div>
                  <div className="glass glass-border rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-orange-400">{client.ncrs_count}</div>
                    <div className="text-xs text-white/60">NCRs</div>
                  </div>
                  <div className="glass glass-border rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-purple-400">{client.audits_count}</div>
                    <div className="text-xs text-white/60">Audits</div>
                  </div>
                  <div className="glass glass-border rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-pink-400">{client.reviews_count}</div>
                    <div className="text-xs text-white/60">Reviews</div>
                  </div>
                </div>

                {/* Users */}
                <div>
                  <div className="text-sm text-white/70 mb-2">Users ({client.user_count}):</div>
                  <div className="flex flex-wrap gap-2">
                    {client.users.map(user => (
                      <div key={user.id} className="px-3 py-1 glass glass-border rounded-full text-xs">
                        <span className="text-cyan-300">{user.email}</span>
                        <span className="text-white/50 ml-2">({user.role})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Revenue Tab */}
        {activeTab === 'revenue' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="glass glass-border rounded-xl p-6 bg-green-500/10">
                <div className="text-sm text-white/70 mb-1">Paid This Month</div>
                <div className="text-3xl font-bold text-green-400">
                  R{invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + parseFloat(i.total || 0), 0).toLocaleString()}
                </div>
              </div>
              <div className="glass glass-border rounded-xl p-6 bg-orange-500/10">
                <div className="text-sm text-white/70 mb-1">Pending</div>
                <div className="text-3xl font-bold text-orange-400">
                  R{analytics?.pending_invoices_total?.toLocaleString()}
                </div>
                <div className="text-xs text-orange-300 mt-1">{analytics?.pending_invoices_count} invoices</div>
              </div>
              <div className="glass glass-border rounded-xl p-6 bg-red-500/10">
                <div className="text-sm text-white/70 mb-1">Overdue</div>
                <div className="text-3xl font-bold text-red-400">
                  R{analytics?.overdue_invoices_total?.toLocaleString()}
                </div>
                <div className="text-xs text-red-300 mt-1">{analytics?.overdue_invoices_count} invoices</div>
              </div>
            </div>

            {/* Invoice List */}
            <div className="glass glass-border rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Recent Invoices</h3>
              <div className="space-y-2">
                {invoices.map(invoice => {
                  const company = clients.find(c => c.id === invoice.company_id)
                  const isOverdue = new Date(invoice.due_date) < new Date() && invoice.status === 'pending'
                  
                  return (
                    <div key={invoice.id} className="glass glass-border rounded-lg p-4 flex items-center justify-between hover:bg-white/5">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-mono text-cyan-400">{invoice.invoice_number}</span>
                          <span className="text-white font-semibold">{company?.name}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            invoice.status === 'paid' ? 'bg-green-500/20 text-green-300' :
                            isOverdue ? 'bg-red-500/20 text-red-300' :
                            'bg-orange-500/20 text-orange-300'
                          }`}>
                            {isOverdue ? 'OVERDUE' : invoice.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-sm text-white/60">
                          Issued: {new Date(invoice.invoice_date).toLocaleDateString()} • 
                          Due: {new Date(invoice.due_date).toLocaleDateString()}
                          {invoice.paid_date && ` • Paid: ${new Date(invoice.paid_date).toLocaleDateString()}`}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">R{parseFloat(invoice.total).toLocaleString()}</div>
                        <div className="text-xs text-white/60">{invoice.payment_method || 'Pending'}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="glass glass-border rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Recent Activity</h3>
            <div className="space-y-2">
              {recentActivity.slice(0, 30).map((activity, index) => (
                <div key={index} className="glass glass-border rounded-lg p-3 text-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <span className="text-cyan-400 font-semibold">
                        {activity.users?.full_name || activity.users?.email || 'System'}
                      </span>
                      <span className="text-white/70 mx-2">•</span>
                      <span className="text-white">{activity.event_type.replace(/_/g, ' ')}</span>
                      {activity.companies && (
                        <>
                          <span className="text-white/70 mx-2">@</span>
                          <span className="text-purple-400">{activity.companies.name}</span>
                        </>
                      )}
                    </div>
                    <span className="text-white/50 text-xs whitespace-nowrap ml-4">
                      {new Date(activity.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
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

export default SuperAdminDashboard

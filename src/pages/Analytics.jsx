import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'

const Analytics = () => {
  const { userProfile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [resellerData, setResellerData] = useState(null)
  const [clients, setClients] = useState([])
  const [platformStats, setPlatformStats] = useState(null)
  const [selectedClient, setSelectedClient] = useState(null)

  const isSuperAdmin = userProfile?.email === 'krugerreece@gmail.com'

  useEffect(() => {
    if (userProfile) {
      fetchData()
    }
  }, [userProfile])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Check if user is a reseller
      const { data: reseller } = await supabase
        .from('resellers')
        .select('*')
        .eq('contact_email', userProfile.email)
        .single()

      if (reseller) {
        setResellerData(reseller)

        // Fetch reseller's clients
        const { data: resellerClients } = await supabase
          .from('reseller_clients')
          .select('*')
          .eq('reseller_id', reseller.id)
          .order('created_at', { ascending: false })

        if (resellerClients?.length > 0) {
          // Enrich each client with compliance data
          const enrichedClients = await Promise.all(
            resellerClients.map(async (client) => {
              const companyId = client.client_company_id
              
              const [docs, ncrs, audits, reviews] = await Promise.all([
                supabase.from('documents').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
                supabase.from('ncrs').select('*').eq('company_id', companyId),
                supabase.from('audits').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
                supabase.from('management_reviews').select('id', { count: 'exact', head: true }).eq('company_id', companyId)
              ])

              const openNCRs = ncrs.data?.filter(n => n.status === 'Open')?.length || 0
              const totalNCRs = ncrs.data?.length || 0

              return {
                ...client,
                stats: {
                  documents: docs.count || 0,
                  totalNCRs,
                  openNCRs,
                  audits: audits.count || 0,
                  reviews: reviews.count || 0,
                }
              }
            })
          )
          setClients(enrichedClients)
        }
      }

      // SuperAdmin: fetch platform-wide stats
      if (isSuperAdmin) {
        const [companies, users, resellers, subscriptions] = await Promise.all([
          supabase.from('companies').select('*'),
          supabase.from('users').select('id, email, role, company_id, last_sign_in'),
          supabase.from('resellers').select('*'),
          supabase.from('subscriptions').select('*')
        ])

        const activeSubs = subscriptions.data?.filter(s => s.status === 'Active') || []
        const totalMRR = activeSubs.reduce((sum, sub) => 
          sum + Number(sub.total_amount || 0), 0
        )

        setPlatformStats({
          totalCompanies: companies.data?.length || 0,
          totalUsers: users.data?.length || 0,
          totalResellers: resellers.data?.length || 0,
          totalMRR: totalMRR,
          activeSubscriptions: activeSubs.length,
          allCompanies: companies.data || [],
          allUsers: users.data || [],
          allResellers: resellers.data || [],
          allSubscriptions: subscriptions.data || []
        })
      }

    } catch (err) {
      console.error('Error fetching analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  // Calculate reseller metrics from the agreement
  const getResellerMetrics = () => {
    if (!clients.length) return { totalMRR: 0, commission: 0, activeClients: 0 }
    
    const activeClients = clients.filter(c => c.status === 'Active')
    const totalMRR = activeClients.reduce((sum, c) => sum + (c.mrr || 0), 0)
    const commissionRate = resellerData?.commission_rate || 0.25
    const commission = totalMRR * commissionRate

    return {
      totalMRR,
      commission,
      activeClients: activeClients.length,
      totalClients: clients.length,
      commissionRate
    }
  }

  // Determine subscription tier from Schedule B + Partner Admin Addendum
  const getTier = (fee) => {
    const amount = Number(fee || 0)
    if (amount >= 5000) return { name: 'Enterprise', color: 'text-orange-400', bg: 'bg-orange-500/20' }
    if (amount >= 3700) return { name: 'Growth', color: 'text-purple-400', bg: 'bg-purple-500/20' }
    if (amount >= 2500) return { name: 'Partner Admin', color: 'text-pink-400', bg: 'bg-pink-500/20' }
    if (amount >= 2000) return { name: 'Starter', color: 'text-cyan-400', bg: 'bg-cyan-500/20' }
    return { name: 'Custom', color: 'text-white/60', bg: 'bg-white/10' }
  }

  // Access check
  const hasAccess = isSuperAdmin || resellerData

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white/60">Loading analytics...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (!hasAccess) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center glass glass-border rounded-2xl p-8 max-w-md">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Access Restricted</h2>
            <p className="text-white/60 mb-4">
              Analytics is available to authorized reseller partners and platform administrators.
            </p>
            <a
              href="mailto:support@isoguardian.co.za"
              className="inline-block px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-semibold hover:scale-105 transition-transform"
            >
              Contact Support
            </a>
          </div>
        </div>
      </Layout>
    )
  }

  const metrics = getResellerMetrics()

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'clients', label: 'Clients' },
    { id: 'revenue', label: 'Revenue' },
    ...(isSuperAdmin ? [{ id: 'platform', label: 'Platform' }] : [])
  ]

  return (
    <Layout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
            <p className="text-white/60 text-sm mt-1">
              {isSuperAdmin && <span className="text-cyan-400 mr-2">SuperAdmin</span>}
              {resellerData?.reseller_name || 'Platform Analytics'}
            </p>
          </div>

          {/* Partnership Status */}
          {resellerData && (
            <div className="flex items-center gap-3 glass glass-border rounded-xl px-4 py-3">
              <div className={`w-3 h-3 rounded-full ${
                resellerData.status === 'Good Standing' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
              }`}></div>
              <div>
                <div className="text-xs text-white/50">Partnership Status</div>
                <div className="text-sm font-semibold text-white">{resellerData.status || 'Active'}</div>
              </div>
              <div className="border-l border-white/20 pl-3 ml-1">
                <div className="text-xs text-white/50">Commission Rate</div>
                <div className="text-sm font-bold text-cyan-400">
                  {((resellerData.commission_rate || 0.25) * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-xl font-semibold whitespace-nowrap transition-all text-sm ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                  : 'glass glass-border text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ==================== OVERVIEW TAB ==================== */}
        {activeTab === 'overview' && (
          <div className="space-y-6">

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Active Clients */}
              <div className="glass glass-border rounded-2xl p-5 bg-gradient-to-br from-cyan-500/10 to-blue-500/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <span className="text-xs text-white/40">Clients</span>
                </div>
                <div className="text-3xl font-bold text-white">{metrics.activeClients}</div>
                <div className="text-sm text-white/50 mt-1">
                  {metrics.totalClients > metrics.activeClients 
                    ? `${metrics.totalClients - metrics.activeClients} inactive` 
                    : 'All active'}
                </div>
              </div>

              {/* Monthly Revenue */}
              <div className="glass glass-border rounded-2xl p-5 bg-gradient-to-br from-green-500/10 to-emerald-500/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-xs text-white/40">MRR</span>
                </div>
                <div className="text-3xl font-bold text-white">R{metrics.totalMRR.toLocaleString()}</div>
                <div className="text-sm text-white/50 mt-1">Monthly recurring revenue</div>
              </div>

              {/* Commission Earned */}
              <div className="glass glass-border rounded-2xl p-5 bg-gradient-to-br from-purple-500/10 to-pink-500/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <span className="text-xs text-white/40">{(metrics.commissionRate * 100).toFixed(0)}% Rate</span>
                </div>
                <div className="text-3xl font-bold text-white">R{metrics.commission.toLocaleString()}</div>
                <div className="text-sm text-white/50 mt-1">Commission this month</div>
              </div>

              {/* Compliance Health */}
              <div className="glass glass-border rounded-2xl p-5 bg-gradient-to-br from-orange-500/10 to-yellow-500/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <span className="text-xs text-white/40">Health</span>
                </div>
                {(() => {
                  const totalOpen = clients.reduce((sum, c) => sum + (c.stats?.openNCRs || 0), 0)
                  return (
                    <>
                      <div className={`text-3xl font-bold ${totalOpen === 0 ? 'text-green-400' : totalOpen <= 3 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {totalOpen === 0 ? 'Healthy' : `${totalOpen} Open`}
                      </div>
                      <div className="text-sm text-white/50 mt-1">
                        {totalOpen === 0 ? 'No open NCRs' : 'NCRs need attention'}
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>

            {/* Quick Client Overview */}
            {clients.length > 0 && (
              <div className="glass glass-border rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Client Portfolio</h3>
                <div className="space-y-3">
                  {clients.map((client) => {
                    const tier = getTier(client.mrr)
                    return (
                      <div 
                        key={client.id} 
                        className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                        onClick={() => { setSelectedClient(client); setActiveTab('clients') }}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 ${tier.bg} rounded-xl flex items-center justify-center`}>
                            <span className={`text-sm font-bold ${tier.color}`}>
                              {client.client_name?.charAt(0) || '?'}
                            </span>
                          </div>
                          <div>
                            <div className="text-white font-medium">{client.client_name}</div>
                            <div className="text-xs text-white/40 flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-full text-xs ${tier.bg} ${tier.color}`}>
                                {tier.name}
                              </span>
                              <span>{client.stats?.documents || 0} docs</span>
                              <span>•</span>
                              <span>{client.stats?.totalNCRs || 0} NCRs</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-semibold">R{(client.mrr || 0).toLocaleString()}/mo</div>
                          <div className={`text-xs ${client.status === 'Active' ? 'text-green-400' : 'text-yellow-400'}`}>
                            {client.status || 'Active'}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Empty state */}
            {clients.length === 0 && resellerData && (
              <div className="glass glass-border rounded-2xl p-8 text-center">
                <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No Clients Yet</h3>
                <p className="text-white/60 mb-4">
                  Start onboarding clients to see their compliance data and your commission earnings here.
                </p>
                <a
                  href="mailto:support@isoguardian.co.za?subject=New Client Onboarding"
                  className="inline-block px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-semibold"
                >
                  Request Client Setup
                </a>
              </div>
            )}
          </div>
        )}

        {/* ==================== CLIENTS TAB ==================== */}
        {activeTab === 'clients' && (
          <div className="space-y-6">
            
            {clients.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {clients.map((client) => {
                  const tier = getTier(client.mrr)
                  return (
                    <div key={client.id} className="glass glass-border rounded-2xl p-6">
                      {/* Client Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 ${tier.bg} rounded-xl flex items-center justify-center`}>
                            <span className={`text-lg font-bold ${tier.color}`}>
                              {client.client_name?.charAt(0) || '?'}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-white">{client.client_name}</h3>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-full text-xs ${tier.bg} ${tier.color}`}>
                                {tier.name} — R{(client.mrr || 0).toLocaleString()}/mo
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-xs ${
                                client.status === 'Active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                              }`}>
                                {client.status || 'Active'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Client Stats Grid */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-white/5 rounded-xl p-3">
                          <div className="text-2xl font-bold text-white">{client.stats?.documents || 0}</div>
                          <div className="text-xs text-white/50">Documents</div>
                        </div>
                        <div className="bg-white/5 rounded-xl p-3">
                          <div className={`text-2xl font-bold ${(client.stats?.openNCRs || 0) > 0 ? 'text-orange-400' : 'text-green-400'}`}>
                            {client.stats?.openNCRs || 0}/{client.stats?.totalNCRs || 0}
                          </div>
                          <div className="text-xs text-white/50">Open/Total NCRs</div>
                        </div>
                        <div className="bg-white/5 rounded-xl p-3">
                          <div className="text-2xl font-bold text-white">{client.stats?.audits || 0}</div>
                          <div className="text-xs text-white/50">Audits</div>
                        </div>
                        <div className="bg-white/5 rounded-xl p-3">
                          <div className="text-2xl font-bold text-white">{client.stats?.reviews || 0}</div>
                          <div className="text-xs text-white/50">Reviews</div>
                        </div>
                      </div>

                      {/* Commission for this client */}
                      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-3 flex items-center justify-between">
                        <span className="text-sm text-white/60">Your Commission</span>
                        <span className="text-lg font-bold text-purple-400">
                          R{((client.mrr || 0) * (resellerData?.commission_rate || 0.25)).toLocaleString()}/mo
                        </span>
                      </div>

                      {/* Onboarded date */}
                      {client.created_at && (
                        <div className="text-xs text-white/30 mt-3">
                          Onboarded: {new Date(client.created_at).toLocaleDateString('en-ZA')}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="glass glass-border rounded-2xl p-8 text-center">
                <p className="text-white/60">No clients onboarded yet.</p>
              </div>
            )}
          </div>
        )}

        {/* ==================== REVENUE TAB ==================== */}
        {activeTab === 'revenue' && (
          <div className="space-y-6">
            
            {/* Revenue Summary */}
            <div className="glass glass-border rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Revenue Breakdown</h3>
              
              {/* Tier breakdown */}
              <div className="space-y-4">
                {['Enterprise', 'Growth', 'Partner Admin', 'Starter', 'Custom'].map(tierName => {
                  const tierClients = clients.filter(c => getTier(c.mrr).name === tierName && c.status === 'Active')
                  const tierMRR = tierClients.reduce((sum, c) => sum + (c.mrr || 0), 0)
                  const tierCommission = tierMRR * (resellerData?.commission_rate || 0.25)
                  
                  if (tierClients.length === 0) return null
                  
                  return (
                    <div key={tierName} className="bg-white/5 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${getTier(tierName === 'Enterprise' ? 5000 : tierName === 'Growth' ? 3700 : tierName === 'Partner Admin' ? 2500 : tierName === 'Starter' ? 2000 : 0).bg} ${getTier(tierName === 'Enterprise' ? 5000 : tierName === 'Growth' ? 3700 : tierName === 'Partner Admin' ? 2500 : tierName === 'Starter' ? 2000 : 0).color}`}>
                            {tierName}
                          </span>
                          <span className="text-sm text-white/60">{tierClients.length} client{tierClients.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-semibold">R{tierMRR.toLocaleString()}/mo</div>
                          <div className="text-xs text-purple-400">Commission: R{tierCommission.toLocaleString()}</div>
                        </div>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="w-full bg-white/10 rounded-full h-2 mt-2">
                        <div 
                          className="bg-gradient-to-r from-cyan-500 to-purple-500 h-2 rounded-full transition-all"
                          style={{ width: `${metrics.totalMRR > 0 ? (tierMRR / metrics.totalMRR * 100) : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Totals Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass glass-border rounded-2xl p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10">
                <div className="text-sm text-white/50 mb-1">Total MRR</div>
                <div className="text-3xl font-bold text-white">R{metrics.totalMRR.toLocaleString()}</div>
                <div className="text-xs text-white/40 mt-1">Across {metrics.activeClients} active clients</div>
              </div>
              <div className="glass glass-border rounded-2xl p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10">
                <div className="text-sm text-white/50 mb-1">Your Commission ({(metrics.commissionRate * 100).toFixed(0)}%)</div>
                <div className="text-3xl font-bold text-purple-400">R{metrics.commission.toLocaleString()}</div>
                <div className="text-xs text-white/40 mt-1">Per Schedule A of Reseller Agreement</div>
              </div>
              <div className="glass glass-border rounded-2xl p-6 bg-gradient-to-br from-cyan-500/10 to-blue-500/10">
                <div className="text-sm text-white/50 mb-1">Projected Annual</div>
                <div className="text-3xl font-bold text-cyan-400">R{(metrics.commission * 12).toLocaleString()}</div>
                <div className="text-xs text-white/40 mt-1">Based on current MRR</div>
              </div>
            </div>

            {/* Agreement Reference */}
            <div className="glass glass-border rounded-2xl p-4 bg-white/5">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-semibold text-white">Commission Terms (Schedule A)</span>
              </div>
              <p className="text-xs text-white/50">
                Recurring commission of {((resellerData?.commission_rate || 0.25) * 100).toFixed(0)}% of MRR for the lifetime 
                of each client's subscription, provided the reseller remains in "Good Standing". Commission excludes 
                one-time Setup Fees and Premium Setup Support (retained 100% by ISOGuardian).
              </p>
            </div>
          </div>
        )}

        {/* ==================== PLATFORM TAB (SuperAdmin Only) ==================== */}
        {activeTab === 'platform' && isSuperAdmin && platformStats && (
          <div className="space-y-6">
            
            {/* Platform Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass glass-border rounded-2xl p-5">
                <div className="text-sm text-white/50 mb-1">Total Companies</div>
                <div className="text-3xl font-bold text-white">{platformStats.totalCompanies}</div>
              </div>
              <div className="glass glass-border rounded-2xl p-5">
                <div className="text-sm text-white/50 mb-1">Total Users</div>
                <div className="text-3xl font-bold text-white">{platformStats.totalUsers}</div>
              </div>
              <div className="glass glass-border rounded-2xl p-5">
                <div className="text-sm text-white/50 mb-1">Active Resellers</div>
                <div className="text-3xl font-bold text-white">{platformStats.totalResellers}</div>
              </div>
              <div className="glass glass-border rounded-2xl p-5">
                <div className="text-sm text-white/50 mb-1">Platform MRR</div>
                <div className="text-3xl font-bold text-green-400">R{platformStats.totalMRR.toLocaleString()}</div>
              </div>
            </div>

            {/* All Companies Table */}
            <div className="glass glass-border rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">All Companies</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-white/50 border-b border-white/10">
                      <th className="pb-3 pr-4">Company</th>
                      <th className="pb-3 pr-4">Users</th>
                      <th className="pb-3 pr-4">Subscription</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {platformStats.allCompanies.map(company => {
                      const sub = platformStats.allSubscriptions?.find(s => s.company_id === company.id)
                      const userCount = platformStats.allUsers?.filter(u => u.company_id === company.id).length
                      return (
                        <tr key={company.id} className="hover:bg-white/5">
                          <td className="py-3 pr-4 text-white font-medium">{company.name}</td>
                          <td className="py-3 pr-4 text-white/70">{userCount}</td>
                          <td className="py-3 pr-4 text-white/70">
                            {sub ? `R${Number(sub.total_amount || 0).toLocaleString()}/mo` : 'None'}
                          </td>
                          <td className="py-3">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              sub?.status === 'Active' ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/40'
                            }`}>
                              {sub?.status || 'No subscription'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* All Resellers */}
            {platformStats.allResellers.length > 0 && (
              <div className="glass glass-border rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Reseller Partners</h3>
                <div className="space-y-3">
                  {platformStats.allResellers.map(reseller => (
                    <div key={reseller.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                      <div>
                        <div className="text-white font-medium">{reseller.reseller_name}</div>
                        <div className="text-xs text-white/40">{reseller.contact_email}</div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm ${reseller.status === 'Good Standing' ? 'text-green-400' : 'text-yellow-400'}`}>
                          {reseller.status}
                        </div>
                        <div className="text-xs text-white/40">
                          {((reseller.commission_rate || 0.25) * 100).toFixed(0)}% commission
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .glass { background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
        .glass-border { border: 1px solid rgba(255, 255, 255, 0.2); }
      `}</style>
    </Layout>
  )
}

export default Analytics

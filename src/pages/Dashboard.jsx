import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import { useNavigate } from 'react-router-dom'
import OnboardingWelcome, { useOnboarding } from '../components/OnboardingWelcome'

const Dashboard = () => {
  const { userProfile, getEffectiveCompanyId } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalDocuments: 0,
    openNCRs: 0,
    criticalNCRs: 0,
    upcomingAudits: 0,
    recentDocuments: [],
    recentNCRs: []
  })
  const [complianceScores, setComplianceScores] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [adminStats, setAdminStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const isSuperAdmin = userProfile?.email === 'krugerreece@gmail.com'
  const { showOnboarding, completeOnboarding } = useOnboarding()

  useEffect(() => {
    if (userProfile) {
      fetchDashboardData()
      fetchComplianceScores()
      fetchRecentActivity()
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

  const fetchComplianceScores = async () => {
    try {
      const companyId = getEffectiveCompanyId()
      if (!companyId) return

      const { data } = await supabase
        .from('compliance_requirements')
        .select('standard, status')
        .eq('company_id', companyId)

      if (!data || data.length === 0) {
        setComplianceScores([])
        return
      }

      // Group by standard and calculate percentage
      const grouped = {}
      data.forEach(row => {
        const std = row.standard || 'Unknown'
        if (!grouped[std]) grouped[std] = { total: 0, compliant: 0 }
        grouped[std].total++
        if (row.status === 'Compliant' || row.status === 'Implemented') {
          grouped[std].compliant++
        }
      })

      const scores = Object.entries(grouped).map(([standard, { total, compliant }]) => ({
        standard,
        score: total > 0 ? Math.round((compliant / total) * 100) : 0,
        compliant,
        total,
      }))

      setComplianceScores(scores)
    } catch (err) {
      console.error('Error fetching compliance scores:', err)
    }
  }

  const fetchRecentActivity = async () => {
    try {
      const companyId = getEffectiveCompanyId()
      if (!companyId) return

      const { data } = await supabase
        .from('audit_log')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(6)

      setRecentActivity(data || [])
    } catch (err) {
      console.error('Error fetching recent activity:', err)
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

      // Fetch upcoming audits
      const { data: audits } = await supabase
        .from('audits')
        .select('*')
        .in('status', ['Scheduled', 'In Progress'])

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
        upcomingAudits: audits?.length || 0,
        recentDocuments: recentDocs || [],
        recentNCRs: recentNCRs || []
      })
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Compliance bar color by standard name
  const getBarStyle = (standard) => {
    const s = (standard || '').toLowerCase()
    if (s.includes('9001')) return { gradient: 'from-cyan-500 to-blue-500', text: 'text-cyan-400', bg: 'bg-cyan-500' }
    if (s.includes('14001')) return { gradient: 'from-green-500 to-emerald-500', text: 'text-green-400', bg: 'bg-green-500' }
    if (s.includes('45001')) return { gradient: 'from-amber-500 to-orange-500', text: 'text-amber-400', bg: 'bg-amber-500' }
    return { gradient: 'from-purple-500 to-pink-500', text: 'text-purple-400', bg: 'bg-purple-500' }
  }

  // Action icon for activity feed
  const getActionIcon = (action) => {
    switch (action) {
      case 'created': return { icon: '+', color: 'text-green-400 bg-green-500/20' }
      case 'updated': return { icon: '\u270E', color: 'text-cyan-400 bg-cyan-500/20' }
      case 'deleted': return { icon: '\u2715', color: 'text-red-400 bg-red-500/20' }
      case 'exported': return { icon: '\u2193', color: 'text-purple-400 bg-purple-500/20' }
      default: return { icon: '\u2022', color: 'text-white/60 bg-white/10' }
    }
  }

  if (!userProfile) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
        </div>
      </Layout>
    )
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      {showOnboarding && (
        <OnboardingWelcome
          userName={userProfile?.full_name}
          onComplete={completeOnboarding}
        />
      )}
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="relative overflow-hidden glass glass-border rounded-2xl p-6">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  Welcome back, {userProfile.full_name}
                </h2>
                <p className="text-white/60 text-sm">
                  {userProfile.company?.name} {'\u00b7'} {(userProfile.role || '').replace('_', ' ')}
                </p>
              </div>
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-full">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-xs text-green-300 font-semibold">RLS Active</span>
              </div>
            </div>
          </div>
          {/* Subtle gradient accent */}
          <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-purple-500/10 to-transparent pointer-events-none" />
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
                  Platform Overview
                </h3>
                <p className="text-purple-200 text-sm">SuperAdmin Analytics</p>
              </div>
              <button
                onClick={() => navigate('/admin')}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Full Analytics
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { value: `R${adminStats.monthlyRevenue.toLocaleString()}`, label: 'Monthly Revenue', color: 'text-green-400' },
                { value: adminStats.activeClients, label: 'Active Clients', color: 'text-cyan-400' },
                { value: adminStats.totalUsers, label: 'Total Users', color: 'text-purple-400' },
                { value: adminStats.totalClients, label: 'Total Companies', color: 'text-white' },
              ].map(({ value, label, color }) => (
                <div key={label} className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                  <div className={`text-2xl font-bold mb-1 ${color}`}>{value}</div>
                  <div className="text-purple-200 text-xs">{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Compliance Scores + Stats Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Compliance Score Bars */}
          <div className="lg:col-span-2 glass glass-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">Compliance Scores</h3>
              <button
                onClick={() => navigate('/compliance')}
                className="text-cyan-400 text-sm hover:underline"
              >
                View Details
              </button>
            </div>
            {complianceScores.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-white/20 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-white/40 text-sm">No compliance data yet</p>
                <button
                  onClick={() => navigate('/compliance')}
                  className="mt-3 px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 rounded-xl text-sm hover:bg-cyan-500/30 transition-colors"
                >
                  Set Up Compliance Scoring
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {complianceScores.map(({ standard, score, compliant, total }) => {
                  const style = getBarStyle(standard)
                  return (
                    <div key={standard}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-white/80 font-medium">{standard}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-white/40">{compliant}/{total} clauses</span>
                          <span className={`text-sm font-bold ${style.text}`}>{score}%</span>
                        </div>
                      </div>
                      <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${style.gradient} rounded-full transition-all duration-1000 ease-out`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Stat Cards Column */}
          <div className="space-y-4">
            {[
              {
                value: stats.totalDocuments,
                label: 'Active Documents',
                color: 'text-cyan-400',
                bgAccent: 'border-cyan-500/20',
                icon: (
                  <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                ),
                onClick: () => navigate('/documents'),
              },
              {
                value: stats.openNCRs,
                label: 'Open NCRs',
                color: stats.openNCRs > 0 ? 'text-amber-400' : 'text-green-400',
                bgAccent: stats.openNCRs > 0 ? 'border-amber-500/20' : 'border-green-500/20',
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                ),
                onClick: () => navigate('/ncrs'),
              },
              {
                value: stats.upcomingAudits,
                label: 'Audits Due',
                color: stats.upcomingAudits > 0 ? 'text-purple-400' : 'text-green-400',
                bgAccent: 'border-purple-500/20',
                icon: (
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                ),
                onClick: () => navigate('/audits'),
              },
              {
                value: stats.criticalNCRs,
                label: 'Critical Issues',
                color: stats.criticalNCRs > 0 ? 'text-red-400' : 'text-green-400',
                bgAccent: stats.criticalNCRs > 0 ? 'border-red-500/30 bg-red-500/5' : 'border-green-500/20',
                icon: (
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                onClick: null,
              },
            ].map(({ value, label, color, bgAccent, icon, onClick }) => (
              <div
                key={label}
                onClick={onClick || undefined}
                className={`glass glass-border rounded-2xl p-4 flex items-center gap-4 ${bgAccent} ${onClick ? 'cursor-pointer hover:bg-white/5 transition-colors' : ''}`}
              >
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-2xl font-bold ${color}`}>{value}</div>
                  <div className="text-white/50 text-xs">{label}</div>
                </div>
                {onClick && (
                  <svg className="w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Standards Access */}
        <div className="glass glass-border rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-3">Your Standards</h3>
          <div className="flex gap-3 flex-wrap">
            {(userProfile?.standards_access || []).length === 0 ? (
              <p className="text-white/40 text-sm">No standards assigned yet</p>
            ) : (
              userProfile.standards_access.map(standard => (
                <div key={standard} className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 rounded-xl text-cyan-300 font-semibold text-sm">
                  {standard.replace('_', ' ')}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity + Recent Documents/NCRs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activity Feed */}
          <div className="glass glass-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Recent Activity</h3>
              <button
                onClick={() => navigate('/activity-trail')}
                className="text-cyan-400 text-sm hover:underline"
              >
                View All
              </button>
            </div>
            {recentActivity.length === 0 ? (
              <p className="text-white/40 text-sm py-4">No activity recorded yet</p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((item, i) => {
                  const { icon, color } = getActionIcon(item.action)
                  const timeAgo = getTimeAgo(item.created_at)
                  return (
                    <div key={item.id || i} className="flex items-start gap-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${color}`}>
                        {icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white/70 text-sm truncate">
                          <span className="capitalize">{item.action}</span> {item.entity_type?.replace('_', ' ')}
                        </p>
                        <p className="text-white/30 text-xs">{timeAgo}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Recent Documents */}
          <div className="glass glass-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Recent Documents</h3>
              <button
                onClick={() => navigate('/documents')}
                className="text-cyan-400 text-sm hover:underline"
              >
                View All
              </button>
            </div>
            <div className="space-y-2">
              {stats.recentDocuments.length === 0 ? (
                <p className="text-white/40 text-sm py-4">No documents yet</p>
              ) : (
                stats.recentDocuments.map(doc => (
                  <div key={doc.id} className="bg-white/5 rounded-xl p-3 border border-white/10">
                    <div className="font-semibold text-white text-sm truncate">{doc.name}</div>
                    <div className="text-white/40 text-xs mt-1">
                      {(doc.standard || '').replace('_', ' ')} {'\u00b7'} {doc.type}
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
                View All
              </button>
            </div>
            <div className="space-y-2">
              {stats.recentNCRs.length === 0 ? (
                <p className="text-white/40 text-sm py-4">No NCRs yet</p>
              ) : (
                stats.recentNCRs.map(ncr => (
                  <div key={ncr.id} className="bg-white/5 rounded-xl p-3 border border-white/10">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-cyan-400 text-xs">{ncr.ncr_number}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        ncr.severity === 'Critical' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                        ncr.severity === 'Major' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' :
                        'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                      }`}>
                        {ncr.severity}
                      </span>
                    </div>
                    <div className="font-semibold text-white text-sm truncate">{ncr.title}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass glass-border rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Documents', desc: 'Browse & upload', path: '/documents', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              )},
              { label: 'NCRs', desc: 'Report issues', path: '/ncrs', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              )},
              { label: 'Compliance', desc: 'Score by clause', path: '/compliance', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              )},
              { label: 'Audits', desc: 'Schedule & manage', path: '/audits', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              )},
            ].map(({ label, desc, path, icon }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="p-4 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-colors text-left group"
              >
                <div className="text-cyan-400 mb-2 group-hover:scale-110 transition-transform inline-block">{icon}</div>
                <div className="font-semibold text-sm">{label}</div>
                <div className="text-xs text-white/40">{desc}</div>
              </button>
            ))}
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

// Simple relative time
function getTimeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-ZA')
}

export default Dashboard

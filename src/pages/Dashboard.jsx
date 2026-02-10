import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'

const Dashboard = () => {
  const { userProfile } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({ openNCRs: 0, criticalNCRs: 0, totalDocs: 0, overdueNCRs: 0 })
  const [recentNCRs, setRecentNCRs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userProfile) fetchDashboardData()
  }, [userProfile])

  const fetchDashboardData = async () => {
    try {
      // Fetch NCR stats
      const { data: ncrs } = await supabase
        .from('ncrs')
        .select('id, status, severity, due_date, ncr_number, title, date_opened')
        .order('date_opened', { ascending: false })

      // Fetch document count
      const { count: docCount } = await supabase
        .from('documents')
        .select('id', { count: 'exact', head: true })

      const today = new Date().toISOString().split('T')[0]
      const openNCRs = ncrs?.filter(n => n.status === 'Open') || []

      setStats({
        openNCRs: openNCRs.length,
        criticalNCRs: openNCRs.filter(n => n.severity === 'Critical').length,
        totalDocs: docCount || 0,
        overdueNCRs: openNCRs.filter(n => n.due_date < today).length
      })

      setRecentNCRs((ncrs || []).slice(0, 5))
    } catch (err) {
      console.error('Dashboard fetch error:', err)
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

  return (
    <Layout>
      <div className="space-y-6 md:ml-16">
        {/* Welcome */}
        <div>
          <h2 className="text-2xl font-bold text-white">
            Welcome back, {userProfile.full_name?.split(' ')[0]} 👋
          </h2>
          <p className="text-white/40 text-sm mt-1">
            {userProfile.company?.name} • {new Date().toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Open NCRs"
            value={loading ? '—' : stats.openNCRs}
            icon={<AlertTriangleIcon />}
            color="amber"
            onClick={() => navigate('/ncrs')}
          />
          <StatCard
            label="Critical"
            value={loading ? '—' : stats.criticalNCRs}
            icon={<AlertCircleIcon />}
            color="red"
            onClick={() => navigate('/ncrs')}
          />
          <StatCard
            label="Overdue"
            value={loading ? '—' : stats.overdueNCRs}
            icon={<ClockIcon />}
            color="orange"
          />
          <StatCard
            label="Documents"
            value={loading ? '—' : stats.totalDocs}
            icon={<FileIcon />}
            color="cyan"
            onClick={() => navigate('/documents')}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent NCRs */}
          <div className="lg:col-span-2 glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white/70 tracking-wide uppercase">Recent NCRs</h3>
              <button
                onClick={() => navigate('/ncrs')}
                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                View All →
              </button>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse"></div>
                ))}
              </div>
            ) : recentNCRs.length === 0 ? (
              <div className="text-center py-8 text-white/30 text-sm">
                No NCRs found. Looking good! 🎉
              </div>
            ) : (
              <div className="space-y-2">
                {recentNCRs.map(ncr => (
                  <div
                    key={ncr.id}
                    onClick={() => navigate('/ncrs')}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group"
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      ncr.severity === 'Critical' ? 'bg-red-400' :
                      ncr.severity === 'Major' ? 'bg-amber-400' : 'bg-yellow-400'
                    }`}></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-cyan-400/70">{ncr.ncr_number}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                          ncr.status === 'Open' ? 'bg-amber-500/15 text-amber-300' : 'bg-emerald-500/15 text-emerald-300'
                        }`}>{ncr.status}</span>
                      </div>
                      <p className="text-sm text-white/80 truncate">{ncr.title}</p>
                    </div>
                    <span className="text-xs text-white/30 group-hover:text-white/50 transition-colors">→</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions + Standards */}
          <div className="space-y-4">
            {/* Quick Actions */}
            <div className="glass rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white/70 tracking-wide uppercase mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <QuickAction label="Create NCR" onClick={() => navigate('/ncrs')} icon="+" color="amber" />
                <QuickAction label="Upload Document" onClick={() => navigate('/documents')} icon="↑" color="cyan" />
                <QuickAction label="View Compliance" onClick={() => navigate('/compliance')} icon="✓" color="emerald" />
              </div>
            </div>

            {/* Standards Access */}
            <div className="glass rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white/70 tracking-wide uppercase mb-4">Your Standards</h3>
              <div className="space-y-2">
                {userProfile.standards_access?.map(std => (
                  <div key={std} className="flex items-center gap-2.5 px-3 py-2 bg-white/5 rounded-xl">
                    <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                    <span className="text-sm text-white/70">{std.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Company Info */}
            <div className="glass rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white/70 tracking-wide uppercase mb-3">Company</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/40">Name</span>
                  <span className="text-white/80">{userProfile.company?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Tier</span>
                  <span className="text-white/80 capitalize">{userProfile.company?.tier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Your Role</span>
                  <span className="text-white/80 capitalize">{userProfile.role?.replace('_', ' ')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

const StatCard = ({ label, value, icon, color, onClick }) => {
  const colors = {
    amber: 'from-amber-500/10 to-amber-600/5 border-amber-500/20 text-amber-400',
    red: 'from-red-500/10 to-red-600/5 border-red-500/20 text-red-400',
    orange: 'from-orange-500/10 to-orange-600/5 border-orange-500/20 text-orange-400',
    cyan: 'from-cyan-500/10 to-cyan-600/5 border-cyan-500/20 text-cyan-400',
    emerald: 'from-emerald-500/10 to-emerald-600/5 border-emerald-500/20 text-emerald-400',
  }

  return (
    <div
      onClick={onClick}
      className={`bg-gradient-to-br ${colors[color]} border rounded-2xl p-4 ${onClick ? 'cursor-pointer hover:scale-[1.02] transition-transform' : ''}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={`w-8 h-8 flex items-center justify-center ${colors[color].split(' ').pop()}`}>
          {icon}
        </div>
        <span className="text-3xl font-bold text-white">{value}</span>
      </div>
      <p className="text-xs text-white/50">{label}</p>
    </div>
  )
}

const QuickAction = ({ label, onClick, icon, color }) => {
  const colors = {
    amber: 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20',
  }

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl ${colors[color]} transition-colors text-left`}
    >
      <span className="text-lg font-bold">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </button>
  )
}

// Mini icon components
const AlertTriangleIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
)
const AlertCircleIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)
const ClockIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)
const FileIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

export default Dashboard

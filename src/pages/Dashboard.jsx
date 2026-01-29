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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userProfile) {
      fetchDashboardData()
    }
  }, [userProfile])

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

import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'

const Audits = () => {
  const { userProfile, canCreate } = useAuth()
  const toast = useToast()
  const [audits, setAudits] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAudits() }, [])

  const fetchAudits = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('audits')
        .select('*')
        .order('audit_date', { ascending: false })

      if (error) throw error
      setAudits(data || [])
    } catch (err) {
      console.error('Error fetching audits:', err)
      // Table may not exist yet — show empty state
      setAudits([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="space-y-4 md:ml-16">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Audit Management</h2>
            <p className="text-white/40 text-sm">Internal and external audit tracking</p>
          </div>
          {canCreate() && (
            <button className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-cyan-500/20 transition-all flex items-center gap-2">
              <span className="text-lg leading-none">+</span> Schedule Audit
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="glass rounded-xl p-4">
            <div className="text-2xl font-bold text-cyan-400">{audits.length}</div>
            <div className="text-xs text-white/50 mt-0.5">Total Audits</div>
          </div>
          <div className="glass rounded-xl p-4">
            <div className="text-2xl font-bold text-amber-400">
              {audits.filter(a => a.status === 'Scheduled').length}
            </div>
            <div className="text-xs text-white/50 mt-0.5">Scheduled</div>
          </div>
          <div className="glass rounded-xl p-4">
            <div className="text-2xl font-bold text-emerald-400">
              {audits.filter(a => a.status === 'Completed').length}
            </div>
            <div className="text-xs text-white/50 mt-0.5">Completed</div>
          </div>
        </div>

        {/* Audit List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />)}
          </div>
        ) : audits.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <div className="text-4xl mb-3">📋</div>
            <h3 className="text-lg font-semibold text-white mb-2">No Audits Yet</h3>
            <p className="text-white/40 text-sm max-w-md mx-auto">
              Schedule your first internal audit to start tracking compliance readiness. 
              Audits are required under ISO 9001 Clause 9.2, ISO 14001 Clause 9.2, and ISO 45001 Clause 9.2.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {audits.map(audit => (
              <div key={audit.id} className="glass rounded-xl p-4 hover:bg-white/5 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white/90">{audit.title}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                        audit.status === 'Completed' ? 'bg-emerald-500/15 text-emerald-300' :
                        audit.status === 'In Progress' ? 'bg-blue-500/15 text-blue-300' :
                        'bg-amber-500/15 text-amber-300'
                      }`}>{audit.status}</span>
                    </div>
                    <div className="text-[10px] text-white/40">
                      {audit.audit_type} • {audit.standard?.replace('_', ' ')} • {new Date(audit.audit_date).toLocaleDateString('en-ZA')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Audits

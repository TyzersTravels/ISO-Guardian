import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'

const ClientAnalytics = () => {
  const { userProfile } = useAuth()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchClientData()
  }, [])

  const fetchClientData = async () => {
    try {
      // For reseller admins: fetch all companies they manage
      // This would need a reseller_id field on companies table
      // For now, just show their own company stats
      
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('company_id', userProfile.company_id)

      if (error) throw error

      // Get document count
      const { count: docCount } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', userProfile.company_id)

      // Get NCR count
      const { count: ncrCount } = await supabase
        .from('ncrs')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', userProfile.company_id)

      // Get compliance data
      const { data: compliance } = await supabase
        .from('compliance_requirements')
        .select('standard, compliance_status')
        .eq('company_id', userProfile.company_id)

      setClients([{
        name: userProfile.company?.name || 'Your Company',
        users: users?.length || 0,
        documents: docCount || 0,
        ncrs: ncrCount || 0,
        standards: [...new Set(compliance?.map(c => c.standard) || [])],
        tier: userProfile.company?.tier || 'professional'
      }])

    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="text-white">Loading analytics...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="glass glass-border rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-white mb-2">Client Analytics</h2>
          <p className="text-cyan-200">Overview of your client portfolio</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass glass-border rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-cyan-400">{clients.length}</div>
            <div className="text-sm text-white/70 mt-1">Total Clients</div>
          </div>
          
          <div className="glass glass-border rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-white">
              {clients.reduce((sum, c) => sum + c.users, 0)}
            </div>
            <div className="text-sm text-white/70 mt-1">Total Users</div>
          </div>
          
          <div className="glass glass-border rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-green-400">
              {clients.reduce((sum, c) => sum + c.documents, 0)}
            </div>
            <div className="text-sm text-white/70 mt-1">Documents</div>
          </div>
          
          <div className="glass glass-border rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-orange-400">
              {clients.reduce((sum, c) => sum + c.ncrs, 0)}
            </div>
            <div className="text-sm text-white/70 mt-1">Open NCRs</div>
          </div>
        </div>

        <div className="space-y-3">
          {clients.map((client, i) => (
            <div key={i} className="glass glass-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{client.name}</h3>
                  <div className="text-sm text-white/60 mt-1">
                    {client.tier} tier • {client.users} users • {client.standards.length} standards
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="glass glass-border rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-white">{client.documents}</div>
                  <div className="text-xs text-white/60">Documents</div>
                </div>
                <div className="glass glass-border rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-orange-400">{client.ncrs}</div>
                  <div className="text-xs text-white/60">NCRs</div>
                </div>
                <div className="glass glass-border rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-cyan-400">{client.users}</div>
                  <div className="text-xs text-white/60">Users</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .glass { background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(20px); }
        .glass-border { border: 1px solid rgba(255, 255, 255, 0.2); }
      `}</style>
    </Layout>
  )
}

export default ClientAnalytics

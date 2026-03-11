import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { useToast } from '../contexts/ToastContext'
import Layout from '../components/Layout'

const AuditorInvite = () => {
  const { user, userProfile, getEffectiveCompanyId } = useAuth()
  const toast = useToast()
  const [audits, setAudits] = useState([])
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [copiedToken, setCopiedToken] = useState(null)
  const [formData, setFormData] = useState({
    audit_id: '',
    auditor_name: '',
    auditor_email: '',
    auditor_organisation: '',
    expires_days: 14,
  })

  const companyId = getEffectiveCompanyId()

  useEffect(() => {
    if (companyId) {
      fetchData()
    }
  }, [companyId])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [auditsRes, sessionsRes] = await Promise.all([
        supabase
          .from('audits')
          .select('id, audit_number, audit_type, standard, audit_date, status')
          .eq('company_id', companyId)
          .in('status', ['Planned', 'In Progress'])
          .order('audit_date', { ascending: true }),
        supabase
          .from('audit_sessions')
          .select('id, audit_id, auditor_name, auditor_email, auditor_organisation, access_token, status, expires_at, created_at')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false }),
      ])

      setAudits(auditsRes.data || [])
      setSessions(sessionsRes.data || [])
    } catch (err) {
      toast.error('Failed to load audit data')
    } finally {
      setLoading(false)
    }
  }

  const generateToken = () => {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('')
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!formData.audit_id || !formData.auditor_name || !formData.auditor_email) {
      toast.warning('Please fill in all required fields')
      return
    }
    setCreating(true)
    try {
      const token = generateToken()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + formData.expires_days)

      const { error } = await supabase.from('audit_sessions').insert({
        audit_id: formData.audit_id,
        company_id: companyId,
        auditor_name: formData.auditor_name,
        auditor_email: formData.auditor_email,
        auditor_organisation: formData.auditor_organisation || null,
        access_token: token,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
        created_by: user.id,
      })

      if (error) throw error

      // Email the auditor their access link
      const auditLink = `${window.location.origin}/auditor?token=${token}`
      const selectedAudit = audits.find(a => a.id === formData.audit_id)
      supabase.functions.invoke('notify-lead', {
        body: {
          type: 'auditor_invite',
          data: {
            auditor_name: formData.auditor_name,
            auditor_email: formData.auditor_email,
            audit_name: selectedAudit ? `${selectedAudit.audit_number || selectedAudit.audit_type} — ${selectedAudit.standard}` : 'Audit',
            company_name: userProfile?.company?.name || 'Your client',
            invited_by: userProfile?.full_name || 'An administrator',
            audit_link: auditLink,
            expires_at: expiresAt.toLocaleDateString('en-ZA'),
          },
        },
      }).catch(() => {})

      toast.success('Auditor session created and invitation email sent.')
      setShowForm(false)
      setFormData({ audit_id: '', auditor_name: '', auditor_email: '', auditor_organisation: '', expires_days: 14 })
      fetchData()
    } catch (err) {
      toast.error('Failed to create auditor session')
    } finally {
      setCreating(false)
    }
  }

  const revokeSession = async (sessionId) => {
    try {
      const { error } = await supabase
        .from('audit_sessions')
        .update({ status: 'revoked' })
        .eq('id', sessionId)

      if (error) throw error
      toast.success('Auditor access revoked')
      fetchData()
    } catch {
      toast.error('Failed to revoke session')
    }
  }

  const copyAuditorLink = (token) => {
    const link = `${window.location.origin}/auditor?token=${token}`
    navigator.clipboard.writeText(link)
    setCopiedToken(token)
    toast.success('Auditor link copied to clipboard')
    setTimeout(() => setCopiedToken(null), 3000)
  }

  const statusColors = {
    pending: 'bg-yellow-500/20 text-yellow-300',
    active: 'bg-green-500/20 text-green-300',
    completed: 'bg-blue-500/20 text-blue-300',
    expired: 'bg-white/10 text-white/40',
    revoked: 'bg-red-500/20 text-red-300',
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Audit Connect</h1>
            <p className="text-white/50 text-sm mt-1">Invite external auditors to a secure audit workspace</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary px-5 py-2.5 rounded-xl font-semibold"
          >
            + Invite Auditor
          </button>
        </div>

        {/* How it works */}
        {sessions.length === 0 && (
          <div className="glass glass-border rounded-2xl p-8">
            <h2 className="text-lg font-bold text-white mb-4">How Audit Connect Works</h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {[
                { step: '1', title: 'Invite Auditor', desc: 'Create a session for a planned audit and share the secure link with your external auditor.' },
                { step: '2', title: 'Auditor Reviews', desc: 'Your auditor accesses the pre-audit evidence package — documents, NCRs, compliance scores — all in one place.' },
                { step: '3', title: 'Live Findings', desc: 'During the audit, the auditor raises findings and ticks off clauses in real-time. NCRs are auto-created.' },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-3 text-white font-bold">
                    {item.step}
                  </div>
                  <h3 className="text-white font-semibold text-sm mb-1">{item.title}</h3>
                  <p className="text-white/40 text-xs">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create Form */}
        {showForm && (
          <form onSubmit={handleCreate} className="glass glass-border rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white mb-2">Invite External Auditor</h2>

            <div>
              <label className="block text-sm text-white/70 mb-1">Audit *</label>
              <select
                value={formData.audit_id}
                onChange={(e) => setFormData({ ...formData, audit_id: e.target.value })}
                className="glass-input w-full px-4 py-2.5 rounded-xl text-white"
                required
              >
                <option value="" className="bg-slate-800">Select an audit...</option>
                {audits.map(a => (
                  <option key={a.id} value={a.id} className="bg-slate-800">
                    {a.audit_number || a.audit_type} — {a.standard} ({new Date(a.audit_date).toLocaleDateString('en-ZA')})
                  </option>
                ))}
              </select>
              {audits.length === 0 && (
                <p className="text-amber-400 text-xs mt-1">No planned or in-progress audits found. Schedule an audit first.</p>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/70 mb-1">Auditor Name *</label>
                <input
                  type="text"
                  value={formData.auditor_name}
                  onChange={(e) => setFormData({ ...formData, auditor_name: e.target.value })}
                  className="glass-input w-full px-4 py-2.5 rounded-xl text-white"
                  placeholder="e.g. John Smith"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">Auditor Email *</label>
                <input
                  type="email"
                  value={formData.auditor_email}
                  onChange={(e) => setFormData({ ...formData, auditor_email: e.target.value })}
                  className="glass-input w-full px-4 py-2.5 rounded-xl text-white"
                  placeholder="auditor@isoqar.co.za"
                  required
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/70 mb-1">Organisation</label>
                <input
                  type="text"
                  value={formData.auditor_organisation}
                  onChange={(e) => setFormData({ ...formData, auditor_organisation: e.target.value })}
                  className="glass-input w-full px-4 py-2.5 rounded-xl text-white"
                  placeholder="e.g. ISOQAR Africa"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">Access Expires In</label>
                <select
                  value={formData.expires_days}
                  onChange={(e) => setFormData({ ...formData, expires_days: parseInt(e.target.value) })}
                  className="glass-input w-full px-4 py-2.5 rounded-xl text-white"
                >
                  <option value={7} className="bg-slate-800">7 days</option>
                  <option value={14} className="bg-slate-800">14 days</option>
                  <option value={30} className="bg-slate-800">30 days</option>
                  <option value={60} className="bg-slate-800">60 days</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={creating}
                className="btn-primary px-6 py-2.5 rounded-xl font-semibold disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create & Generate Link'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2.5 glass glass-border rounded-xl text-white hover:bg-white/10"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Sessions List */}
        {sessions.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-white">Auditor Sessions</h2>
            {sessions.map(session => {
              const audit = audits.find(a => a.id === session.audit_id)
              const isExpired = new Date(session.expires_at) < new Date()
              const effectiveStatus = isExpired && session.status !== 'revoked' ? 'expired' : session.status

              return (
                <div key={session.id} className="glass glass-border rounded-xl p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white">{session.auditor_name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[effectiveStatus] || statusColors.pending}`}>
                          {effectiveStatus}
                        </span>
                      </div>
                      <p className="text-white/50 text-sm">{session.auditor_email}</p>
                      {session.auditor_organisation && (
                        <p className="text-white/40 text-xs">{session.auditor_organisation}</p>
                      )}
                      <p className="text-white/30 text-xs mt-1">
                        {audit ? `${audit.audit_number || audit.audit_type} — ${audit.standard}` : 'Audit'} | Expires: {new Date(session.expires_at).toLocaleDateString('en-ZA')}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {effectiveStatus !== 'revoked' && effectiveStatus !== 'expired' && (
                        <>
                          <button
                            onClick={() => copyAuditorLink(session.access_token)}
                            className="px-3 py-1.5 text-xs glass glass-border rounded-lg text-cyan-300 hover:bg-cyan-500/20 transition-colors"
                          >
                            {copiedToken === session.access_token ? 'Copied!' : 'Copy Link'}
                          </button>
                          <button
                            onClick={() => revokeSession(session.id)}
                            className="px-3 py-1.5 text-xs glass glass-border rounded-lg text-red-300 hover:bg-red-500/20 transition-colors"
                          >
                            Revoke
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}

export default AuditorInvite

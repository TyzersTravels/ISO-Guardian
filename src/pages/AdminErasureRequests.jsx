import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { supabase } from '../lib/supabase'
import { logActivity } from '../lib/auditLogger'
import Layout from '../components/Layout'

const STATUS_STYLES = {
  pending: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  processing: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  completed: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  rejected: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  withdrawn: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
}

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-ZA') : '—')

const daysUntil = (iso) => {
  if (!iso) return null
  const ms = new Date(iso).getTime() - Date.now()
  return Math.ceil(ms / (1000 * 60 * 60 * 24))
}

const AdminErasureRequests = () => {
  const { userProfile, user } = useAuth()
  const toast = useToast()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [selected, setSelected] = useState(null)
  const [processorNotes, setProcessorNotes] = useState('')
  const [retentionExceptions, setRetentionExceptions] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isSuperAdmin = userProfile?.role === 'super_admin'

  useEffect(() => {
    if (isSuperAdmin) fetchRequests()
  }, [isSuperAdmin, statusFilter])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('erasure_requests')
        .select(`
          id, user_id, company_id, user_email, user_full_name, reason,
          acknowledgement_signed, status, processed_by, processed_at,
          processor_notes, retention_exceptions, requested_at, sla_deadline_at,
          updated_at,
          company:companies ( id, name, company_code )
        `)
        .order('sla_deadline_at', { ascending: true })

      if (statusFilter !== 'all') query = query.eq('status', statusFilter)

      const { data, error } = await query
      if (error) throw error
      setRequests(data || [])
    } catch (err) {
      toast.error('Failed to load erasure requests')
    } finally {
      setLoading(false)
    }
  }

  const openRequest = (req) => {
    setSelected(req)
    setProcessorNotes(req.processor_notes || '')
    setRetentionExceptions(req.retention_exceptions || '')
  }

  const closeRequest = () => {
    setSelected(null)
    setProcessorNotes('')
    setRetentionExceptions('')
  }

  const transition = async (newStatus) => {
    if (!selected) return
    try {
      setSubmitting(true)
      const patch = {
        status: newStatus,
        processed_by: user.id,
        processed_at: new Date().toISOString(),
        processor_notes: processorNotes || null,
        retention_exceptions: retentionExceptions || null,
      }

      const { error } = await supabase
        .from('erasure_requests')
        .update(patch)
        .eq('id', selected.id)
      if (error) throw error

      await logActivity({
        companyId: selected.company_id,
        userId: user.id,
        action: `erasure_${newStatus}`,
        entityType: 'erasure_request',
        entityId: selected.id,
        changes: { status: newStatus, retention_exceptions: retentionExceptions, notes: processorNotes },
      })

      if (newStatus === 'processing' || newStatus === 'completed' || newStatus === 'rejected') {
        try {
          const { error: fnError } = await supabase.functions.invoke('notify-cancellation', {
            body: {
              type: 'erasure_decision',
              to: selected.user_email,
              to_name: selected.user_full_name,
              decision: newStatus,
              sla_deadline_at: selected.sla_deadline_at,
              retention_exceptions: retentionExceptions || null,
              processor_notes: processorNotes || null,
            },
          })
          if (fnError && import.meta.env.DEV) console.error('[erasure_decision] returned error:', fnError)
        } catch (invokeErr) {
          if (import.meta.env.DEV) console.error('[erasure_decision] threw:', invokeErr)
        }
      }

      toast.success(`Request ${newStatus}`)
      closeRequest()
      fetchRequests()
    } catch (err) {
      toast.error('Failed to update request')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isSuperAdmin) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="glass glass-border rounded-2xl p-8 text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
            <p className="text-white/70">Super admin access required.</p>
          </div>
        </div>
      </Layout>
    )
  }

  const pendingCount = requests.filter((r) => r.status === 'pending' || r.status === 'processing').length
  const overdueCount = requests.filter(
    (r) => (r.status === 'pending' || r.status === 'processing') && daysUntil(r.sla_deadline_at) < 0,
  ).length

  return (
    <Layout>
      <div className="space-y-6 pb-20">
        <div className="glass glass-border rounded-2xl p-6 bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
                POPIA s24 Erasure Queue
              </h1>
              <p className="text-purple-200 text-sm">
                30-day SLA. Retain data required under POPIA s14, tax, or regulatory obligations —
                anonymise rather than delete.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {overdueCount > 0 && (
                <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-sm font-semibold border border-rose-500/30">
                  {overdueCount} overdue
                </span>
              )}
              {pendingCount > 0 && (
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-sm font-semibold border border-amber-500/30">
                  {pendingCount} open
                </span>
              )}
              <button
                onClick={fetchRequests}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-semibold transition-all"
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto">
          {['pending', 'processing', 'completed', 'rejected', 'withdrawn', 'all'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-xl font-semibold whitespace-nowrap capitalize transition-all ${
                statusFilter === s
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                  : 'glass glass-border text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="glass glass-border rounded-2xl p-8 text-center text-white/70">
            Loading erasure requests...
          </div>
        ) : requests.length === 0 ? (
          <div className="glass glass-border rounded-2xl p-12 text-center">
            <div className="text-5xl mb-3">✅</div>
            <p className="text-white/70">No {statusFilter === 'all' ? '' : statusFilter} erasure requests.</p>
          </div>
        ) : (
          <div className="glass glass-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-white/5 text-white/60 uppercase text-xs tracking-wider">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">User</th>
                    <th className="text-left px-4 py-3 font-semibold">Company</th>
                    <th className="text-left px-4 py-3 font-semibold">Requested</th>
                    <th className="text-left px-4 py-3 font-semibold">SLA</th>
                    <th className="text-left px-4 py-3 font-semibold">Status</th>
                    <th className="text-right px-4 py-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => {
                    const days = daysUntil(r.sla_deadline_at)
                    const isActive = r.status === 'pending' || r.status === 'processing'
                    const slaColor =
                      !isActive
                        ? 'text-white/40'
                        : days < 0
                        ? 'text-rose-300'
                        : days <= 7
                        ? 'text-orange-300'
                        : 'text-emerald-300'
                    return (
                      <tr key={r.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3">
                          <div className="text-white font-medium">{r.user_full_name || '—'}</div>
                          <div className="text-white/50 text-xs">{r.user_email}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-white">{r.company?.name || '—'}</div>
                          <div className="text-white/50 text-xs">{r.company?.company_code || ''}</div>
                        </td>
                        <td className="px-4 py-3 text-white/70 text-xs">{fmtDate(r.requested_at)}</td>
                        <td className="px-4 py-3">
                          <div className={`text-xs font-semibold ${slaColor}`}>
                            {!isActive
                              ? fmtDate(r.sla_deadline_at)
                              : days < 0
                              ? `${Math.abs(days)}d overdue`
                              : `${days}d left`}
                          </div>
                          <div className="text-white/40 text-[10px]">{fmtDate(r.sla_deadline_at)}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded-md text-xs font-semibold border capitalize ${STATUS_STYLES[r.status] || STATUS_STYLES.pending}`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => openRequest(r)}
                            className="px-3 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 rounded-lg text-xs font-semibold transition-all"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass glass-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">{selected.user_full_name || 'Unknown user'}</h2>
                <p className="text-white/60 text-sm">{selected.user_email}</p>
                <p className="text-white/40 text-xs font-mono mt-1">{selected.id}</p>
              </div>
              <button
                onClick={closeRequest}
                className="text-white/50 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="rounded-xl p-4 border bg-purple-500/10 border-purple-500/30 text-purple-200">
              <p className="text-sm">
                <strong>SLA deadline:</strong> {fmtDate(selected.sla_deadline_at)}
                {(selected.status === 'pending' || selected.status === 'processing') && (
                  <span className="ml-2">
                    ({daysUntil(selected.sla_deadline_at)} days{' '}
                    {daysUntil(selected.sla_deadline_at) < 0 ? 'overdue' : 'remaining'})
                  </span>
                )}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="glass-card rounded-lg p-3">
                <div className="text-white/50 text-xs mb-1">Company</div>
                <div className="text-white font-medium">{selected.company?.name || '—'}</div>
              </div>
              <div className="glass-card rounded-lg p-3">
                <div className="text-white/50 text-xs mb-1">Requested</div>
                <div className="text-white font-medium">{fmtDate(selected.requested_at)}</div>
              </div>
              <div className="glass-card rounded-lg p-3 col-span-2">
                <div className="text-white/50 text-xs mb-1">User ID</div>
                <div className="text-white font-mono text-xs break-all">{selected.user_id}</div>
              </div>
            </div>

            <div className="glass-card rounded-lg p-3">
              <div className="text-white/50 text-xs mb-1">Requester's reason</div>
              <div className="text-white text-sm whitespace-pre-wrap">
                {selected.reason || <span className="text-white/40 italic">Not provided</span>}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-white/70 text-sm font-medium">
                Retention exceptions (POPIA s14 / tax / regulatory)
              </label>
              <textarea
                value={retentionExceptions}
                onChange={(e) => setRetentionExceptions(e.target.value)}
                rows={3}
                className="glass-input w-full resize-none"
                placeholder="e.g. Audit trail entries retained for 7 years per SARS requirements; NCR records anonymised but preserved for ISO audit integrity."
                disabled={selected.status === 'completed' || selected.status === 'withdrawn'}
              />
            </div>

            <div className="space-y-2">
              <label className="text-white/70 text-sm font-medium">Processor notes</label>
              <textarea
                value={processorNotes}
                onChange={(e) => setProcessorNotes(e.target.value)}
                rows={2}
                className="glass-input w-full resize-none"
                placeholder="Internal notes on processing this request."
                disabled={selected.status === 'completed' || selected.status === 'withdrawn'}
              />
            </div>

            {selected.status === 'pending' && (
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => transition('processing')}
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl font-semibold transition-all"
                >
                  Start Processing
                </button>
                <button
                  onClick={() => transition('rejected')}
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white rounded-xl font-semibold transition-all"
                >
                  Reject
                </button>
              </div>
            )}

            {selected.status === 'processing' && (
              <button
                onClick={() => transition('completed')}
                disabled={submitting}
                className="w-full px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl font-semibold transition-all"
              >
                Mark Completed (erasure done)
              </button>
            )}

            {selected.processed_at && (
              <div className="text-white/50 text-xs border-t border-white/10 pt-3">
                Last processed {fmtDate(selected.processed_at)}
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  )
}

export default AdminErasureRequests

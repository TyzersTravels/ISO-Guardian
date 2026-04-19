import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { supabase } from '../lib/supabase'
import { logActivity } from '../lib/auditLogger'
import Layout from '../components/Layout'

const STATUS_STYLES = {
  pending: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  approved: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  rejected: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  withdrawn: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  completed: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
}

const fmtZAR = (n) =>
  `R${(Number(n) || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-ZA') : '—')

const AdminCancellations = () => {
  const { userProfile, user } = useAuth()
  const toast = useToast()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [selected, setSelected] = useState(null)
  const [processorNotes, setProcessorNotes] = useState('')
  const [effectiveDate, setEffectiveDate] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isSuperAdmin = userProfile?.role === 'super_admin'

  useEffect(() => {
    if (isSuperAdmin) fetchRequests()
  }, [isSuperAdmin, statusFilter])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('cancellation_requests')
        .select(`
          id, company_id, requested_by, subscription_id, subscription_status, tier,
          account_age_days, cooling_off_applies, within_initial_term, months_remaining,
          termination_fee_zar, reason, acknowledgement_signed, status, processed_by,
          processed_at, processor_notes, effective_date, requested_at, updated_at,
          company:companies ( id, name, company_code ),
          requester:users!cancellation_requests_requested_by_fkey ( id, full_name, email )
        `)
        .order('requested_at', { ascending: false })

      if (statusFilter !== 'all') query = query.eq('status', statusFilter)

      const { data, error } = await query
      if (error) throw error
      setRequests(data || [])
    } catch (err) {
      toast.error('Failed to load cancellation requests')
    } finally {
      setLoading(false)
    }
  }

  const openRequest = (req) => {
    setSelected(req)
    setProcessorNotes(req.processor_notes || '')
    setEffectiveDate(req.effective_date || '')
  }

  const closeRequest = () => {
    setSelected(null)
    setProcessorNotes('')
    setEffectiveDate('')
  }

  const transition = async (newStatus) => {
    if (!selected) return
    if (newStatus === 'approved' && !effectiveDate) {
      toast.warning('Set an effective date before approving')
      return
    }
    try {
      setSubmitting(true)
      const patch = {
        status: newStatus,
        processed_by: user.id,
        processed_at: new Date().toISOString(),
        processor_notes: processorNotes || null,
      }
      if (newStatus === 'approved' || newStatus === 'completed') {
        patch.effective_date = effectiveDate || null
      }

      const { error } = await supabase
        .from('cancellation_requests')
        .update(patch)
        .eq('id', selected.id)
      if (error) throw error

      await logActivity({
        companyId: selected.company_id,
        userId: user.id,
        action: `cancellation_${newStatus}`,
        entityType: 'cancellation_request',
        entityId: selected.id,
        changes: { status: newStatus, effective_date: patch.effective_date, notes: processorNotes },
      })

      if (newStatus === 'approved' || newStatus === 'rejected') {
        try {
          const { error: fnError } = await supabase.functions.invoke('notify-cancellation', {
            body: {
              type: 'cancellation_decision',
              to: selected.requester?.email,
              to_name: selected.requester?.full_name,
              company_name: selected.company?.name,
              decision: newStatus,
              effective_date: patch.effective_date || null,
              termination_fee_zar: selected.termination_fee_zar,
              within_initial_term: selected.within_initial_term,
              cooling_off_applies: selected.cooling_off_applies,
              processor_notes: processorNotes || null,
            },
          })
          if (fnError && import.meta.env.DEV) console.error('[cancellation_decision] returned error:', fnError)
        } catch (invokeErr) {
          if (import.meta.env.DEV) console.error('[cancellation_decision] threw:', invokeErr)
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

  const pendingCount = requests.filter((r) => r.status === 'pending').length

  return (
    <Layout>
      <div className="space-y-6 pb-20">
        <div className="glass glass-border rounded-2xl p-6 bg-gradient-to-r from-orange-500/20 to-rose-500/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Cancellation Queue</h1>
              <p className="text-orange-200 text-sm">
                SLA: acknowledge within 2 business days. Client Subscription &amp; SLA §4.1 applies.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {statusFilter === 'pending' && pendingCount > 0 && (
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-sm font-semibold border border-amber-500/30">
                  {pendingCount} awaiting action
                </span>
              )}
              <button
                onClick={fetchRequests}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold transition-all"
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto">
          {['pending', 'approved', 'completed', 'rejected', 'withdrawn', 'all'].map((s) => (
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
            Loading cancellation requests...
          </div>
        ) : requests.length === 0 ? (
          <div className="glass glass-border rounded-2xl p-12 text-center">
            <div className="text-5xl mb-3">✅</div>
            <p className="text-white/70">No {statusFilter === 'all' ? '' : statusFilter} cancellation requests.</p>
          </div>
        ) : (
          <div className="glass glass-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-white/5 text-white/60 uppercase text-xs tracking-wider">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">Company</th>
                    <th className="text-left px-4 py-3 font-semibold">Requester</th>
                    <th className="text-left px-4 py-3 font-semibold">Context</th>
                    <th className="text-left px-4 py-3 font-semibold">Termination Fee</th>
                    <th className="text-left px-4 py-3 font-semibold">Requested</th>
                    <th className="text-left px-4 py-3 font-semibold">Status</th>
                    <th className="text-right px-4 py-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        <div className="text-white font-medium">{r.company?.name || '—'}</div>
                        <div className="text-white/50 text-xs">{r.company?.company_code || ''}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-white">{r.requester?.full_name || '—'}</div>
                        <div className="text-white/50 text-xs">{r.requester?.email || ''}</div>
                      </td>
                      <td className="px-4 py-3">
                        {r.cooling_off_applies ? (
                          <span className="text-emerald-300 text-xs">CPA cooling-off</span>
                        ) : r.within_initial_term ? (
                          <span className="text-orange-300 text-xs">
                            Initial Term • {r.months_remaining}m left
                          </span>
                        ) : (
                          <span className="text-cyan-300 text-xs">Post Initial Term</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-white font-semibold">
                        {fmtZAR(r.termination_fee_zar)}
                      </td>
                      <td className="px-4 py-3 text-white/70 text-xs">{fmtDate(r.requested_at)}</td>
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
                  ))}
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
                <h2 className="text-xl font-bold text-white">{selected.company?.name || 'Unknown company'}</h2>
                <p className="text-white/50 text-xs font-mono mt-1">{selected.id}</p>
              </div>
              <button
                onClick={closeRequest}
                className="text-white/50 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div
              className={`rounded-xl p-4 border ${
                selected.cooling_off_applies
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                  : selected.within_initial_term
                  ? 'bg-orange-500/10 border-orange-500/30 text-orange-200'
                  : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-200'
              }`}
            >
              {selected.cooling_off_applies ? (
                <p className="text-sm">
                  <strong>CPA s16 cooling-off applies.</strong> No termination fee.
                </p>
              ) : selected.within_initial_term ? (
                <p className="text-sm">
                  <strong>Within 12-month Initial Term.</strong> Termination fee per SLA §4.1:{' '}
                  <strong>{fmtZAR(selected.termination_fee_zar)}</strong> ({selected.months_remaining} months remaining).
                </p>
              ) : (
                <p className="text-sm">
                  <strong>Initial Term complete.</strong> 60-day notice applies, no termination fee.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="glass-card rounded-lg p-3">
                <div className="text-white/50 text-xs mb-1">Tier</div>
                <div className="text-white font-medium capitalize">{selected.tier || '—'}</div>
              </div>
              <div className="glass-card rounded-lg p-3">
                <div className="text-white/50 text-xs mb-1">Subscription status</div>
                <div className="text-white font-medium capitalize">{selected.subscription_status || '—'}</div>
              </div>
              <div className="glass-card rounded-lg p-3">
                <div className="text-white/50 text-xs mb-1">Account age</div>
                <div className="text-white font-medium">{selected.account_age_days ?? '—'} days</div>
              </div>
              <div className="glass-card rounded-lg p-3">
                <div className="text-white/50 text-xs mb-1">Requested</div>
                <div className="text-white font-medium">{fmtDate(selected.requested_at)}</div>
              </div>
            </div>

            <div className="glass-card rounded-lg p-3">
              <div className="text-white/50 text-xs mb-1">Requester's reason</div>
              <div className="text-white text-sm whitespace-pre-wrap">
                {selected.reason || <span className="text-white/40 italic">Not provided</span>}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-white/70 text-sm font-medium">Effective date (access ends)</label>
              <input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="glass-input w-full"
                disabled={selected.status !== 'pending' && selected.status !== 'approved'}
              />
            </div>

            <div className="space-y-2">
              <label className="text-white/70 text-sm font-medium">Processor notes</label>
              <textarea
                value={processorNotes}
                onChange={(e) => setProcessorNotes(e.target.value)}
                rows={3}
                className="glass-input w-full resize-none"
                placeholder="Internal notes, invoice reference, commercial decision, etc."
                disabled={selected.status === 'completed' || selected.status === 'withdrawn'}
              />
            </div>

            {selected.status === 'pending' && (
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => transition('approved')}
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl font-semibold transition-all"
                >
                  Approve
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

            {selected.status === 'approved' && (
              <button
                onClick={() => transition('completed')}
                disabled={submitting}
                className="w-full px-4 py-2.5 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white rounded-xl font-semibold transition-all"
              >
                Mark Completed
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

export default AdminCancellations

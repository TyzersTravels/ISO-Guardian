import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { logActivity } from '../lib/auditLogger'

const STATUS_BADGES = {
  draft: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  in_review: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  approved: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  active: 'bg-green-500/20 text-green-300 border-green-500/30',
  Approved: 'bg-green-500/20 text-green-300 border-green-500/30',
  under_revision: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  obsolete: 'bg-red-500/20 text-red-300 border-red-500/30',
}

// Status lifecycle: what transitions are allowed and who can do them
const TRANSITIONS = {
  draft:           [{ to: 'in_review', label: 'Submit for Review',   roles: ['super_admin', 'admin', 'lead_auditor', 'user'] }],
  in_review:       [
    { to: 'active',  label: 'Approve',              roles: ['super_admin', 'admin'] },
    { to: 'draft',   label: 'Return for Revision',  roles: ['super_admin', 'admin'] },
  ],
  approved:        [{ to: 'active', label: 'Mark Active', roles: ['super_admin', 'admin'] }],
  Approved:        [
    { to: 'active',  label: 'Mark Active',           roles: ['super_admin', 'admin'] },
    { to: 'in_review', label: 'Submit for Review',   roles: ['super_admin', 'admin'] },
  ],
  active:          [
    { to: 'under_revision', label: 'Revise Document', roles: ['super_admin', 'admin', 'lead_auditor'] },
    { to: 'obsolete',       label: 'Mark Obsolete',   roles: ['super_admin', 'admin'] },
  ],
  under_revision:  [{ to: 'in_review', label: 'Re-submit for Review', roles: ['super_admin', 'admin', 'lead_auditor', 'user'] }],
  obsolete:        [],
}

export default function DocumentControlPanel({
  doc,
  userProfile,
  companyId,
  users = [],
  onClose,
  onUpdate,
  onDownload,
  onVersionUpload,
  toast,
}) {
  const [tab, setTab] = useState('details')
  const [versions, setVersions] = useState([])
  const [acknowledgements, setAcknowledgements] = useState([])
  const [loadingVersions, setLoadingVersions] = useState(false)
  const [loadingAcks, setLoadingAcks] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [editOwner, setEditOwner] = useState(doc.owner_id || '')
  const [editFrequency, setEditFrequency] = useState(doc.review_frequency_months || 12)
  const [editRequiresAck, setEditRequiresAck] = useState(doc.requires_acknowledgement || false)

  const role = userProfile?.role
  const isAdminRole = ['super_admin', 'admin'].includes(role)

  useEffect(() => {
    if (tab === 'versions') fetchVersions()
    if (tab === 'acknowledgements') fetchAcknowledgements()
  }, [tab])

  const fetchVersions = async () => {
    setLoadingVersions(true)
    const { data } = await supabase
      .from('document_versions')
      .select('id, version_number, file_path, file_size, change_summary, created_by, created_at')
      .eq('document_id', doc.id)
      .order('created_at', { ascending: false })
    setVersions(data || [])
    setLoadingVersions(false)
  }

  const fetchAcknowledgements = async () => {
    setLoadingAcks(true)
    const { data } = await supabase
      .from('document_acknowledgements')
      .select('id, user_id, version_acknowledged, acknowledged_at')
      .eq('document_id', doc.id)
    setAcknowledgements(data || [])
    setLoadingAcks(false)
  }

  const userMap = {}
  users.forEach(u => { userMap[u.id] = u.full_name || u.email || 'Unknown' })

  const handleStatusChange = async (newStatus) => {
    setUpdating(true)
    const updates = { status: newStatus, updated_at: new Date().toISOString() }

    if (newStatus === 'active' && !doc.next_review_date) {
      const nextReview = new Date()
      nextReview.setMonth(nextReview.getMonth() + (doc.review_frequency_months || 12))
      updates.next_review_date = nextReview.toISOString().split('T')[0]
    }
    if (newStatus === 'active') {
      updates.last_reviewed_at = new Date().toISOString()
      updates.last_reviewed_by = userProfile.id
    }

    const { error } = await supabase
      .from('documents')
      .update(updates)
      .eq('id', doc.id)

    if (error) {
      toast.error('Failed to update status.')
      setUpdating(false)
      return
    }

    await logActivity({
      companyId,
      userId: userProfile.id,
      action: 'status_changed',
      entityType: 'document',
      entityId: doc.id,
      changes: { from: doc.status, to: newStatus },
    })

    toast.success(`Document status changed to ${newStatus.replace('_', ' ')}.`)
    setUpdating(false)
    onUpdate?.()
  }

  const handleSaveSettings = async () => {
    setUpdating(true)
    const updates = {
      owner_id: editOwner || null,
      review_frequency_months: editFrequency,
      requires_acknowledgement: editRequiresAck,
    }

    // Auto-calculate next review date if owner is being set and no date exists
    if (editOwner && !doc.next_review_date) {
      const nextReview = new Date()
      nextReview.setMonth(nextReview.getMonth() + editFrequency)
      updates.next_review_date = nextReview.toISOString().split('T')[0]
    }

    const { error } = await supabase
      .from('documents')
      .update(updates)
      .eq('id', doc.id)

    if (error) {
      toast.error('Failed to update settings.')
      setUpdating(false)
      return
    }

    await logActivity({
      companyId,
      userId: userProfile.id,
      action: 'updated',
      entityType: 'document',
      entityId: doc.id,
      changes: { owner: editOwner, review_frequency: editFrequency, requires_ack: editRequiresAck },
    })

    toast.success('Document settings updated.')
    setUpdating(false)
    onUpdate?.()
  }

  const handleCompleteReview = async () => {
    setUpdating(true)
    const nextReview = new Date()
    nextReview.setMonth(nextReview.getMonth() + (doc.review_frequency_months || 12))

    const { error } = await supabase
      .from('documents')
      .update({
        last_reviewed_at: new Date().toISOString(),
        last_reviewed_by: userProfile.id,
        next_review_date: nextReview.toISOString().split('T')[0],
      })
      .eq('id', doc.id)

    if (error) {
      toast.error('Failed to mark review complete.')
      setUpdating(false)
      return
    }

    await logActivity({
      companyId,
      userId: userProfile.id,
      action: 'reviewed',
      entityType: 'document',
      entityId: doc.id,
      changes: { next_review_date: nextReview.toISOString().split('T')[0] },
    })

    toast.success('Review completed. Next review date updated.')
    setUpdating(false)
    onUpdate?.()
  }

  const availableTransitions = (TRANSITIONS[doc.status] || []).filter(t => t.roles.includes(role))
  const isOverdue = doc.next_review_date && new Date(doc.next_review_date) < new Date()

  const tabs = [
    { key: 'details', label: 'Details' },
    { key: 'versions', label: `Versions (${versions.length || '...'})` },
    { key: 'acknowledgements', label: 'Acknowledgements' },
    { key: 'settings', label: 'Settings' },
  ]

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className="glass glass-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-white/[0.08]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-white truncate">{doc.name}</h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {doc.document_number && <span className="text-xs text-white/40 font-mono">{doc.document_number}</span>}
                <span className="text-xs text-white/40">v{doc.version || '1.0'}</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_BADGES[doc.status] || STATUS_BADGES.draft}`}>
                  {(doc.status || 'draft').replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg flex-shrink-0">
              <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Status transitions */}
          {availableTransitions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {availableTransitions.map(t => (
                <button
                  key={t.to}
                  onClick={() => handleStatusChange(t.to)}
                  disabled={updating}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all disabled:opacity-40 ${
                    t.to === 'active' ? 'bg-green-500/20 border-green-500/30 text-green-300 hover:bg-green-500/30'
                    : t.to === 'obsolete' ? 'bg-red-500/20 border-red-500/30 text-red-300 hover:bg-red-500/30'
                    : t.to === 'draft' ? 'bg-slate-500/20 border-slate-500/30 text-slate-300 hover:bg-slate-500/30'
                    : 'bg-amber-500/20 border-amber-500/30 text-amber-300 hover:bg-amber-500/30'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/[0.08] overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                tab === t.key
                  ? 'text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* ─── Details tab ─── */}
          {tab === 'details' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <InfoRow label="Standard" value={doc.standard?.replace('_', ' ') || '—'} />
                <InfoRow label="Type" value={doc.type || '—'} />
                <InfoRow label="Clause" value={doc.clause ? `Clause ${doc.clause}` : '—'} />
                <InfoRow label="Version" value={`v${doc.version || '1.0'}`} />
                <InfoRow label="Owner" value={doc.owner_id ? userMap[doc.owner_id] || '—' : 'Not assigned'} />
                <InfoRow label="Review Frequency" value={`${doc.review_frequency_months || 12} months`} />
                <InfoRow
                  label="Next Review"
                  value={doc.next_review_date ? new Date(doc.next_review_date).toLocaleDateString('en-ZA') : 'Not set'}
                  highlight={isOverdue ? 'red' : undefined}
                />
                <InfoRow
                  label="Last Reviewed"
                  value={doc.last_reviewed_at ? new Date(doc.last_reviewed_at).toLocaleDateString('en-ZA') : 'Never'}
                />
                <InfoRow label="Created" value={new Date(doc.created_at).toLocaleDateString('en-ZA')} />
                <InfoRow label="Updated" value={doc.updated_at ? new Date(doc.updated_at).toLocaleDateString('en-ZA') : '—'} />
              </div>

              {/* Review action */}
              {isOverdue && isAdminRole && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <p className="text-sm text-red-300 font-medium mb-2">Review overdue</p>
                  <p className="text-xs text-red-300/60 mb-3">
                    This document was due for review on {new Date(doc.next_review_date).toLocaleDateString('en-ZA')}.
                  </p>
                  <button
                    onClick={handleCompleteReview}
                    disabled={updating}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 disabled:opacity-40"
                  >
                    Complete Review & Reset Cycle
                  </button>
                </div>
              )}

              {/* Quick actions */}
              <div className="flex flex-wrap gap-2">
                {doc.file_path && (
                  <button
                    onClick={() => onDownload?.(doc)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-white/20 text-white/60 hover:text-white hover:bg-white/10 transition-all"
                  >
                    Download File
                  </button>
                )}
                <button
                  onClick={() => onVersionUpload?.(doc)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-purple-500/30 text-purple-300 hover:bg-purple-500/10 transition-all"
                >
                  Upload New Version
                </button>
              </div>
            </>
          )}

          {/* ─── Versions tab ─── */}
          {tab === 'versions' && (
            <>
              {loadingVersions ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Current version */}
                  <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-cyan-300 font-semibold text-sm">v{doc.version || '1.0'}</span>
                        <span className="text-cyan-400/60 text-xs ml-2">(current)</span>
                      </div>
                      <span className="text-white/40 text-xs">{doc.updated_at ? new Date(doc.updated_at).toLocaleDateString('en-ZA') : ''}</span>
                    </div>
                    {doc.change_summary && (
                      <p className="text-xs text-white/50 mt-1">{doc.change_summary}</p>
                    )}
                  </div>

                  {/* Previous versions from document_versions table */}
                  {versions.map(v => (
                    <div key={v.id} className="p-3 bg-white/[0.03] border border-white/[0.08] rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-white/70 font-semibold text-sm">v{v.version_number}</span>
                        <span className="text-white/40 text-xs">{new Date(v.created_at).toLocaleDateString('en-ZA')}</span>
                      </div>
                      {v.change_summary && (
                        <p className="text-xs text-white/40 mt-1">{v.change_summary}</p>
                      )}
                      <p className="text-[10px] text-white/25 mt-1">By: {userMap[v.created_by] || 'Unknown'}</p>
                    </div>
                  ))}

                  {/* Fallback: JSONB version_history */}
                  {versions.length === 0 && doc.version_history?.length > 0 && (
                    [...doc.version_history].reverse().map((entry, i) => (
                      <div key={i} className="p-3 bg-white/[0.03] border border-white/[0.08] rounded-xl">
                        <div className="flex items-center justify-between">
                          <span className="text-white/70 font-semibold text-sm">v{entry.version}</span>
                          <span className="text-white/40 text-xs">
                            {entry.uploaded_at ? new Date(entry.uploaded_at).toLocaleDateString('en-ZA') : ''}
                          </span>
                        </div>
                      </div>
                    ))
                  )}

                  {versions.length === 0 && (!doc.version_history || doc.version_history.length === 0) && (
                    <p className="text-center text-white/30 text-sm py-6">No previous versions</p>
                  )}
                </div>
              )}
            </>
          )}

          {/* ─── Acknowledgements tab ─── */}
          {tab === 'acknowledgements' && (
            <>
              {!doc.requires_acknowledgement ? (
                <div className="text-center py-8">
                  <p className="text-white/40 text-sm mb-2">Acknowledgement tracking is not enabled for this document.</p>
                  {isAdminRole && (
                    <p className="text-white/25 text-xs">Enable it in the Settings tab.</p>
                  )}
                </div>
              ) : loadingAcks ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="space-y-2">
                  {users.map(u => {
                    const ack = acknowledgements.find(a => a.user_id === u.id && a.version_acknowledged === (doc.version || '1.0'))
                    return (
                      <div key={u.id} className="flex items-center justify-between p-3 bg-white/[0.03] border border-white/[0.08] rounded-xl">
                        <div className="flex items-center gap-2">
                          {ack ? (
                            <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <span className="w-4 h-4 rounded-full border border-white/20 flex-shrink-0" />
                          )}
                          <span className={`text-sm ${ack ? 'text-white/70' : 'text-white/40'}`}>
                            {u.full_name || u.email}
                          </span>
                        </div>
                        <span className="text-[10px] text-white/30">
                          {ack ? new Date(ack.acknowledged_at).toLocaleDateString('en-ZA') : 'Pending'}
                        </span>
                      </div>
                    )
                  })}
                  {users.length === 0 && (
                    <p className="text-center text-white/30 text-sm py-6">No company users found</p>
                  )}
                </div>
              )}
            </>
          )}

          {/* ─── Settings tab ─── */}
          {tab === 'settings' && (
            <>
              {!isAdminRole ? (
                <p className="text-center text-white/40 text-sm py-8">Only admins can modify document control settings.</p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-white/50 block mb-1">Document Owner</label>
                    <select
                      value={editOwner}
                      onChange={e => setEditOwner(e.target.value)}
                      className="w-full px-3 py-2 glass glass-border rounded-lg text-white bg-transparent text-sm"
                    >
                      <option value="" className="bg-slate-800">Not assigned</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id} className="bg-slate-800">{u.full_name || u.email}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-white/50 block mb-1">Review Frequency</label>
                    <select
                      value={editFrequency}
                      onChange={e => setEditFrequency(parseInt(e.target.value))}
                      className="w-full px-3 py-2 glass glass-border rounded-lg text-white bg-transparent text-sm"
                    >
                      <option value={3} className="bg-slate-800">Every 3 months</option>
                      <option value={6} className="bg-slate-800">Every 6 months</option>
                      <option value={12} className="bg-slate-800">Annually (12 months)</option>
                      <option value={24} className="bg-slate-800">Every 2 years</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editRequiresAck}
                        onChange={e => setEditRequiresAck(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white/60 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600"></div>
                    </label>
                    <span className="text-sm text-white/70">Require acknowledgement from all users</span>
                  </div>

                  <button
                    onClick={handleSaveSettings}
                    disabled={updating}
                    className="w-full py-2.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 text-cyan-300 hover:from-cyan-500/30 hover:to-purple-500/30 transition-all disabled:opacity-40"
                  >
                    {updating ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value, highlight }) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg px-3 py-2">
      <p className="text-[10px] text-white/30 uppercase tracking-wider mb-0.5">{label}</p>
      <p className={`text-sm font-medium ${highlight === 'red' ? 'text-red-400' : 'text-white/80'}`}>{value}</p>
    </div>
  )
}

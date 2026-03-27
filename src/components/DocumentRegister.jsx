import { useState, useMemo } from 'react'

const STATUS_BADGES = {
  draft: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  in_review: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  approved: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  active: 'bg-green-500/20 text-green-300 border-green-500/30',
  Approved: 'bg-green-500/20 text-green-300 border-green-500/30',
  under_revision: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  obsolete: 'bg-red-500/20 text-red-300 border-red-500/30',
}

const sortFns = {
  name: (a, b) => a.name.localeCompare(b.name),
  version: (a, b) => parseFloat(a.version || 0) - parseFloat(b.version || 0),
  status: (a, b) => (a.status || '').localeCompare(b.status || ''),
  next_review_date: (a, b) => {
    if (!a.next_review_date) return 1
    if (!b.next_review_date) return -1
    return new Date(a.next_review_date) - new Date(b.next_review_date)
  },
  updated_at: (a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0),
}

export default function DocumentRegister({
  documents,
  users = [],
  acknowledgementCounts = {},
  onDocumentClick,
  onAcknowledge,
  currentUserId,
  userAcknowledgements = {},
}) {
  const [sortBy, setSortBy] = useState('name')
  const [sortDir, setSortDir] = useState('asc')

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortDir('asc') }
  }

  const sorted = useMemo(() => {
    const fn = sortFns[sortBy] || sortFns.name
    const list = [...documents].sort(fn)
    return sortDir === 'desc' ? list.reverse() : list
  }, [documents, sortBy, sortDir])

  const userMap = useMemo(() => {
    const m = {}
    users.forEach(u => { m[u.id] = u.full_name || u.email || 'Unknown' })
    return m
  }, [users])

  const isOverdue = (date) => date && new Date(date) < new Date()
  const isUpcoming = (date) => {
    if (!date) return false
    const d = new Date(date)
    const now = new Date()
    const diff = (d - now) / (1000 * 60 * 60 * 24)
    return diff >= 0 && diff <= 30
  }

  const SortHeader = ({ col, children, className = '' }) => (
    <th
      onClick={() => toggleSort(col)}
      className={`px-3 py-3 text-left text-[11px] font-semibold text-white/50 uppercase tracking-wider cursor-pointer hover:text-white/80 transition-colors select-none ${className}`}
    >
      <span className="flex items-center gap-1">
        {children}
        {sortBy === col && (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeWidth={2} d={sortDir === 'asc' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
          </svg>
        )}
      </span>
    </th>
  )

  if (sorted.length === 0) {
    return (
      <div className="glass glass-border rounded-2xl p-12 text-center">
        <svg className="w-16 h-16 text-white/20 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-white/50 font-medium">No documents in register</p>
        <p className="text-white/30 text-sm mt-1">Upload documents to populate the register.</p>
      </div>
    )
  }

  return (
    <div className="glass glass-border rounded-2xl overflow-hidden">
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-white/[0.08]">
            <tr>
              <SortHeader col="name">Document</SortHeader>
              <th className="px-3 py-3 text-left text-[11px] font-semibold text-white/50 uppercase tracking-wider">Standard</th>
              <SortHeader col="version">Ver</SortHeader>
              <SortHeader col="status">Status</SortHeader>
              <th className="px-3 py-3 text-left text-[11px] font-semibold text-white/50 uppercase tracking-wider">Owner</th>
              <SortHeader col="next_review_date">Next Review</SortHeader>
              <th className="px-3 py-3 text-left text-[11px] font-semibold text-white/50 uppercase tracking-wider">Ack</th>
              <th className="px-3 py-3 text-[11px] font-semibold text-white/50 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {sorted.map(doc => {
              const ackData = acknowledgementCounts[doc.id] || { done: 0, total: 0 }
              const userAcked = userAcknowledgements[doc.id]
              const overdue = isOverdue(doc.next_review_date)
              const upcoming = isUpcoming(doc.next_review_date)

              return (
                <tr
                  key={doc.id}
                  onClick={() => onDocumentClick?.(doc)}
                  className="hover:bg-white/[0.03] cursor-pointer transition-colors"
                >
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-500/15 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate max-w-[200px]">{doc.name}</p>
                        <p className="text-[10px] text-white/30 font-mono">{doc.document_number || doc.type || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-xs text-white/60">{doc.standard?.replace('_', ' ') || '—'}</td>
                  <td className="px-3 py-3 text-xs text-white/70 font-mono">v{doc.version || '1.0'}</td>
                  <td className="px-3 py-3">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_BADGES[doc.status] || STATUS_BADGES.draft}`}>
                      {(doc.status || 'draft').replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs text-white/60 truncate max-w-[120px]">
                    {doc.owner_id ? (userMap[doc.owner_id] || '—') : '—'}
                  </td>
                  <td className="px-3 py-3">
                    {doc.next_review_date ? (
                      <span className={`text-xs font-medium ${
                        overdue ? 'text-red-400' : upcoming ? 'text-amber-400' : 'text-white/50'
                      }`}>
                        {new Date(doc.next_review_date).toLocaleDateString('en-ZA')}
                        {overdue && <span className="ml-1 text-[10px]">OVERDUE</span>}
                      </span>
                    ) : (
                      <span className="text-xs text-white/25">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {doc.requires_acknowledgement ? (
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-medium ${ackData.done === ackData.total && ackData.total > 0 ? 'text-green-400' : 'text-white/50'}`}>
                          {ackData.done}/{ackData.total}
                        </span>
                        {!userAcked && onAcknowledge && (
                          <button
                            onClick={(e) => { e.stopPropagation(); onAcknowledge(doc) }}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30"
                          >
                            Ack
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-white/25">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <svg className="w-4 h-4 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-white/[0.06]">
        {sorted.map(doc => {
          const ackData = acknowledgementCounts[doc.id] || { done: 0, total: 0 }
          const userAcked = userAcknowledgements[doc.id]
          const overdue = isOverdue(doc.next_review_date)

          return (
            <div
              key={doc.id}
              onClick={() => onDocumentClick?.(doc)}
              className="px-4 py-3 hover:bg-white/[0.03] cursor-pointer transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-500/15 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-white truncate">{doc.name}</p>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border flex-shrink-0 ${STATUS_BADGES[doc.status] || STATUS_BADGES.draft}`}>
                      {(doc.status || 'draft').replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-white/40">
                    <span>v{doc.version || '1.0'}</span>
                    <span>{doc.standard?.replace('_', ' ')}</span>
                    {doc.next_review_date && (
                      <span className={overdue ? 'text-red-400 font-medium' : ''}>
                        Review: {new Date(doc.next_review_date).toLocaleDateString('en-ZA')}
                        {overdue && ' (OVERDUE)'}
                      </span>
                    )}
                    {doc.requires_acknowledgement && (
                      <span>Ack: {ackData.done}/{ackData.total}</span>
                    )}
                  </div>
                  {doc.requires_acknowledgement && !userAcked && onAcknowledge && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onAcknowledge(doc) }}
                      className="mt-2 text-xs px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
                <svg className="w-4 h-4 text-white/20 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

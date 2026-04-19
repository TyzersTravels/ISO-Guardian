const ncrs = [
  {
    number: 'IG-DEMO-NCR-014',
    title: 'Supplier inspection records missing batch 2026-03',
    standard: 'ISO 9001',
    clause: '8.4',
    severity: 'Major',
    status: 'Open',
    assignee: 'T. Ngcobo',
    due: 'In 4 days',
    interactive: true,
  },
  {
    number: 'IG-DEMO-NCR-013',
    title: 'PPE issuance log not signed by 3 operators',
    standard: 'ISO 45001',
    clause: '8.1.3',
    severity: 'Major',
    status: 'Open',
    assignee: 'S. Dlamini',
    due: 'Overdue 2 days',
  },
  {
    number: 'IG-DEMO-NCR-012',
    title: 'Waste manifest filing out of sequence',
    standard: 'ISO 14001',
    clause: '8.1',
    severity: 'Observation',
    status: 'Open',
    assignee: 'P. Naidoo',
    due: 'In 12 days',
  },
  {
    number: 'IG-DEMO-NCR-011',
    title: 'Calibration certificates expired on gauge #G-04',
    standard: 'ISO 9001',
    clause: '7.1.5',
    severity: 'Minor',
    status: 'Closed',
    assignee: 'T. Mokoena',
    due: 'Closed 2026-03-28',
  },
]

const severityStyles = {
  'Major': 'bg-rose-500/10 text-rose-300 border-rose-500/20',
  'Minor': 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  'Observation': 'bg-sky-500/10 text-sky-300 border-sky-500/20',
}

const statusStyles = {
  'Open': 'bg-white/10 text-white border-white/20',
  'Closed': 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
}

const receiptLines = [
  { delay: 100, icon: '\u2713', text: 'Evidence attached', tone: 'text-emerald-300' },
  { delay: 500, icon: '\u2713', text: 'Clause 8.4: Partial \u2192 Met', tone: 'text-emerald-300' },
  { delay: 950, icon: '\u2191', text: 'ISO 9001: 84% \u2192 86%', tone: 'text-cyan-300' },
  { delay: 1400, icon: '\u2193', text: 'Open NCRs: 7 \u2192 6', tone: 'text-cyan-300' },
]

const CloseReceipt = () => {
  return (
    <div className="min-w-[180px] space-y-1">
      {receiptLines.map((line, i) => (
        <div
          key={i}
          className={`flex items-center gap-1.5 text-[11px] font-semibold ${line.tone}`}
          style={{
            opacity: 0,
            animation: `receipt-in 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards`,
            animationDelay: `${line.delay}ms`,
          }}
        >
          <span className="font-mono text-[13px] leading-none">{line.icon}</span>
          <span className="tabular-nums">{line.text}</span>
        </div>
      ))}
      <style>{`
        @keyframes receipt-in {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

const MockNCRs = ({ closedNcrs = new Set(), onClose }) => {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-white">Non-Conformances</h2>
        <p className="text-sm text-white/50 mt-1">Raise, assign, evidence, close out. Signature blocks on every close-out PDF.</p>
      </div>

      <div data-tour-step="5" className="glass-card glass-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/5 border-b border-white/10">
              <tr className="text-left text-[11px] uppercase tracking-wider text-white/50">
                <th className="py-3 px-4 font-semibold">NCR #</th>
                <th className="py-3 px-4 font-semibold">Title</th>
                <th className="py-3 px-4 font-semibold hidden md:table-cell">Severity</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold hidden lg:table-cell">Assigned</th>
                <th className="py-3 px-4 font-semibold">Due</th>
                <th className="py-3 px-4 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {ncrs.map((n) => {
                const isClosed = closedNcrs.has(n.number) || n.status === 'Closed'
                const effectiveStatus = isClosed ? 'Closed' : 'Open'
                const effectiveDue = closedNcrs.has(n.number)
                  ? 'Closed just now'
                  : n.due
                return (
                  <tr
                    key={n.number}
                    className={`border-b border-white/5 last:border-0 transition-colors ${
                      closedNcrs.has(n.number)
                        ? 'bg-emerald-500/[0.04]'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <td className="py-3 px-4 font-mono text-[11px] text-cyan-300 align-top">{n.number}</td>
                    <td className="py-3 px-4 align-top">
                      <div className="text-white font-medium">{n.title}</div>
                      <div className="text-[11px] text-white/40 mt-0.5">{n.standard} {'\u00b7'} Cl. {n.clause}</div>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell align-top">
                      <span className={`inline-flex items-center px-2.5 py-1 text-[11px] font-semibold rounded-full border ${severityStyles[n.severity]}`}>
                        {n.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4 align-top">
                      <span className={`inline-flex items-center px-2.5 py-1 text-[11px] font-semibold rounded-full border ${statusStyles[effectiveStatus]}`}>
                        {effectiveStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white/70 hidden lg:table-cell align-top">{n.assignee}</td>
                    <td
                      className={`py-3 px-4 text-xs align-top ${
                        closedNcrs.has(n.number)
                          ? 'text-emerald-300 font-semibold'
                          : effectiveDue.startsWith('Overdue')
                          ? 'text-rose-300 font-semibold'
                          : 'text-white/60'
                      }`}
                    >
                      {effectiveDue}
                    </td>
                    <td className="py-3 px-4 align-top">
                      {n.interactive && !closedNcrs.has(n.number) ? (
                        <button
                          type="button"
                          onClick={() => onClose && onClose(n.number)}
                          className="relative px-3 py-1.5 text-[11px] font-bold bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-white rounded-lg shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all hover:scale-[1.04] whitespace-nowrap"
                        >
                          <span className="absolute inset-0 rounded-lg bg-emerald-400/40 animate-ping" />
                          <span className="relative">Close NCR {'\u2192'}</span>
                        </button>
                      ) : closedNcrs.has(n.number) ? (
                        <CloseReceipt />
                      ) : (
                        <span className="text-[11px] text-white/25">{'\u2014'}</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {onClose && (
        <p className="text-[11px] text-white/40 italic">
          Tip: click {'"'}Close NCR{'"'} on NCR-014 to watch compliance scores recalculate in real time.
        </p>
      )}
    </section>
  )
}

export default MockNCRs

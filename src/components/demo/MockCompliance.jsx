import { useState } from 'react'

const buildClauses = ({ iso9001Score, clause84Met }) => ({
  'ISO 9001': {
    overall: iso9001Score,
    rows: [
      { clause: '4.1', name: 'Understanding the organization', status: 'Met', notes: 'Context matrix v2.1 signed off Q1 2026' },
      { clause: '6.1', name: 'Risk-based thinking', status: 'Met', notes: 'Risk register reviewed 2026-03-12' },
      { clause: '7.1.5', name: 'Monitoring & measuring resources', status: 'Partial', notes: 'Gauge #G-04 calibration overdue (NCR-011)' },
      {
        clause: '8.4',
        name: 'Externally provided processes',
        status: clause84Met ? 'Met' : 'Partial',
        notes: clause84Met
          ? 'NCR-014 closed \u00b7 supplier inspection evidence received'
          : 'Supplier inspection evidence gap (NCR-014)',
        flash: clause84Met,
      },
      { clause: '9.2', name: 'Internal audit', status: 'Met', notes: 'Schedule approved, next audit in 7 days' },
      { clause: '10.2', name: 'Non-conformity & corrective action', status: 'Met', notes: '11 closed, 3 open within SLA' },
    ],
  },
  'ISO 14001': {
    overall: 62,
    rows: [
      { clause: '4.2', name: 'Needs of interested parties', status: 'Met', notes: 'Stakeholder matrix current' },
      { clause: '6.1.2', name: 'Environmental aspects', status: 'Partial', notes: 'Waste-stream review due' },
      { clause: '8.1', name: 'Operational planning & control', status: 'Partial', notes: 'Manifest filing issue (NCR-012)' },
      { clause: '9.3', name: 'Management review', status: 'Not Met', notes: 'Q2 2026 review not yet scheduled' },
    ],
  },
  'ISO 45001': {
    overall: 71,
    rows: [
      { clause: '6.1.2', name: 'Hazard ID & risk assessment', status: 'Met', notes: 'HIRA-Housekeeping v1.1 in force' },
      { clause: '7.2', name: 'Competence', status: 'Partial', notes: 'Training matrix 89% current' },
      { clause: '8.1.3', name: 'Management of change', status: 'Partial', notes: 'PPE log gap (NCR-013)' },
      { clause: '10.1', name: 'Incident investigation', status: 'Met', notes: '100% closed within 14 days' },
    ],
  },
})

const statusStyles = {
  'Met': 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  'Partial': 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  'Not Met': 'bg-rose-500/10 text-rose-300 border-rose-500/20',
}

const MockCompliance = ({ iso9001Score = 84, clause84Met = false }) => {
  const clausesByStandard = buildClauses({ iso9001Score, clause84Met })
  const standardsList = Object.keys(clausesByStandard)
  const [active, setActive] = useState(standardsList[0])
  const current = clausesByStandard[active]

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-white">Compliance Scoring</h2>
        <p className="text-sm text-white/50 mt-1">Clause-by-clause, per standard, recalculated in real time.</p>
      </div>

      {/* Standard tabs */}
      <div data-tour-step="6" className="flex flex-wrap gap-2">
        {standardsList.map((s) => {
          const isActive = s === active
          return (
            <button
              key={s}
              type="button"
              onClick={() => setActive(s)}
              className={
                isActive
                  ? 'px-4 py-2.5 text-sm font-bold rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg shadow-purple-500/20'
                  : 'px-4 py-2.5 text-sm font-semibold rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all'
              }
            >
              {s}
              <span className={`ml-2 text-xs tabular-nums transition-all duration-700 ${isActive ? 'text-white/80' : 'text-white/40'}`}>
                {clausesByStandard[s].overall}%
              </span>
            </button>
          )
        })}
      </div>

      {/* Score band */}
      <div className="glass-card glass-border rounded-2xl p-5 flex items-center gap-5">
        <div className="shrink-0">
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-semibold">Overall</div>
          <div className="text-4xl font-extrabold bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent tabular-nums transition-all duration-700">
            {current.overall}%
          </div>
        </div>
        <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 via-sky-400 to-purple-400 rounded-full transition-all duration-[1200ms] ease-out"
            style={{ width: `${current.overall}%` }}
          />
        </div>
      </div>

      {/* Clause rows */}
      <div className="glass-card glass-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/5 border-b border-white/10">
              <tr className="text-left text-[11px] uppercase tracking-wider text-white/50">
                <th className="py-3 px-4 font-semibold">Clause</th>
                <th className="py-3 px-4 font-semibold">Requirement</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold hidden md:table-cell">Evidence / Notes</th>
              </tr>
            </thead>
            <tbody>
              {current.rows.map((r) => (
                <tr
                  key={r.clause}
                  className={`border-b border-white/5 last:border-0 transition-colors ${
                    r.flash ? 'bg-emerald-500/[0.06]' : 'hover:bg-white/5'
                  }`}
                >
                  <td className="py-3 px-4 font-mono text-xs text-cyan-300">{r.clause}</td>
                  <td className="py-3 px-4 text-white font-medium">{r.name}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-1 text-[11px] font-semibold rounded-full border transition-all ${statusStyles[r.status]}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-white/50 text-xs hidden md:table-cell">{r.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

export default MockCompliance

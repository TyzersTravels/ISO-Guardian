import { useRef } from 'react'
import { useCountUp, useInView } from './useCountUp'

const standardsBase = [
  { code: 'ISO 9001:2015', name: 'Quality Management', score: 84, colour: 'bg-cyan-400' },
  { code: 'ISO 14001:2015', name: 'Environmental Management', score: 62, colour: 'bg-emerald-400' },
  { code: 'ISO 45001:2018', name: 'OH&S Management', score: 71, colour: 'bg-amber-400' },
]

const upcomingAudits = [
  { number: 'IG-DEMO-AUD-007', standard: 'ISO 9001', type: 'Internal Audit', date: 'In 7 days', auditor: 'L. Mahlulo' },
  { number: 'IG-DEMO-AUD-008', standard: 'ISO 45001', type: 'Surveillance', date: 'In 21 days', auditor: 'External' },
]

const KpiCard = ({ label, value, suffix = '', trend, accent, enabled, decimals = 0 }) => {
  const animated = useCountUp(value, { enabled, duration: 1400 })
  const display = decimals > 0 ? animated.toFixed(decimals) : Math.round(animated)
  return (
    <div className="glass-card glass-border rounded-2xl p-5">
      <div className={`inline-block text-[11px] font-semibold uppercase tracking-wider bg-gradient-to-r ${accent} bg-clip-text text-transparent`}>
        {label}
      </div>
      <div className="mt-3 text-3xl font-extrabold text-white tabular-nums">
        {display}{suffix}
      </div>
      <div className="mt-1 text-xs text-white/40">{trend}</div>
    </div>
  )
}

const MockDashboard = ({ openNcrs = 7, iso9001Score = 84 }) => {
  const gridRef = useRef(null)
  const inView = useInView(gridRef, { threshold: 0.3 })

  const standards = standardsBase.map((s) =>
    s.code.startsWith('ISO 9001') ? { ...s, score: iso9001Score } : s,
  )
  const overallCompliance = Math.round((standards[0].score + standards[1].score + standards[2].score) / 3)

  return (
    <section className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">Dashboard</h2>
          <p className="text-sm text-white/50 mt-1">Acme Manufacturing (Pty) Ltd {'\u00b7'} Springs, Gauteng</p>
        </div>
        <div className="text-xs text-white/40">Last sync: just now</div>
      </div>

      {/* KPI grid */}
      <div ref={gridRef} data-tour-step="1" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Open NCRs"
          value={openNcrs}
          trend={openNcrs < 7 ? '-1 just closed' : '+2 this week'}
          accent="from-rose-400 to-red-500"
          enabled={inView}
        />
        <KpiCard
          label="Upcoming Audits"
          value={2}
          trend="Next in 7 days"
          accent="from-amber-400 to-orange-500"
          enabled={inView}
        />
        <KpiCard
          label="Compliance"
          value={overallCompliance}
          suffix="%"
          trend={iso9001Score > 84 ? '+6% MoM' : '+4% MoM'}
          accent="from-cyan-400 to-blue-500"
          enabled={inView}
        />
        <KpiCard
          label="Documents"
          value={42}
          trend="6 due for review"
          accent="from-violet-400 to-purple-500"
          enabled={inView}
        />
      </div>

      {/* Compliance scores + upcoming audits */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass-card glass-border rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white mb-4">Compliance by Standard</h3>
          <div className="space-y-4">
            {standards.map((s) => (
              <div key={s.code}>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-white/80">
                    <span className="font-semibold">{s.code}</span>
                    <span className="text-white/40 ml-2">{s.name}</span>
                  </span>
                  <span className="text-white font-bold tabular-nums">{s.score}%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${s.colour} rounded-full transition-all duration-[1400ms] ease-out`}
                    style={{ width: inView ? `${s.score}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div data-tour-step="2" className="glass-card glass-border rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white mb-4">Upcoming Audits</h3>
          <div className="space-y-3">
            {upcomingAudits.map((a) => (
              <div key={a.number} className="p-3 bg-white/5 rounded-xl border border-white/5">
                <div className="text-[11px] text-cyan-300 font-mono">{a.number}</div>
                <div className="text-sm text-white font-semibold mt-0.5">{a.type}</div>
                <div className="flex justify-between text-xs text-white/50 mt-1">
                  <span>{a.standard}</span>
                  <span>{a.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default MockDashboard

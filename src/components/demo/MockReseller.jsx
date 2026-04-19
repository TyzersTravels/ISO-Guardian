import { useState } from 'react'

const clients = [
  { code: 'ALPHA', name: 'Alpha Steel (Pty) Ltd', sector: 'Steel fabrication', score: 82 },
  { code: 'BETA', name: 'Beta Logistics CC', sector: 'Warehousing', score: 68 },
  { code: 'GAMMA', name: 'Gamma Mining Services', sector: 'Mining support', score: 74 },
]

const MockReseller = () => {
  const [activeIdx, setActiveIdx] = useState(0)
  const active = clients[activeIdx]

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">Reseller Client Switcher</h2>
          <p className="text-sm text-white/50 mt-1">One login. Every client. Data-isolated by RLS {'\u2014'} never leaks.</p>
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-purple-300">
          25% lifetime commission
        </span>
      </div>

      {/* Horizontal pill bar */}
      <div data-tour-step="7" className="glass-card glass-border rounded-2xl p-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {clients.map((c, i) => {
            const isActive = i === activeIdx
            return (
              <button
                key={c.code}
                type="button"
                onClick={() => setActiveIdx(i)}
                className={
                  isActive
                    ? 'shrink-0 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-400/40 text-left transition-all'
                    : 'shrink-0 px-5 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-left hover:bg-white/10 transition-all'
                }
              >
                <div className="flex items-center gap-2.5">
                  <span className={
                    isActive
                      ? 'w-2 h-2 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50'
                      : 'w-2 h-2 rounded-full bg-white/20'
                  } />
                  <div>
                    <div className={`text-sm font-bold ${isActive ? 'text-white' : 'text-white/70'}`}>{c.name}</div>
                    <div className="text-[11px] text-white/40 mt-0.5">{c.sector}</div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Active client snapshot */}
      <div className="glass-card glass-border rounded-2xl p-6 grid sm:grid-cols-3 gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-semibold">Viewing</div>
          <div className="text-lg font-bold text-white mt-1">{active.name}</div>
          <div className="text-xs text-white/50 mt-0.5 font-mono">IG-{active.code}-*</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-semibold">Compliance</div>
          <div className="text-3xl font-extrabold bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent mt-1">
            {active.score}%
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-semibold">Isolation</div>
          <div className="mt-1.5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-300">RLS {'\u00b7'} Verified</span>
          </div>
        </div>
      </div>
    </section>
  )
}

export default MockReseller

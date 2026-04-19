import { useEffect, useState } from 'react'

const RealtimeActivity = () => {
  const [visible, setVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const showT = setTimeout(() => setVisible(true), 4500)
    const leaveT = setTimeout(() => setLeaving(true), 11000)
    const hideT = setTimeout(() => setVisible(false), 12000)
    return () => {
      clearTimeout(showT)
      clearTimeout(leaveT)
      clearTimeout(hideT)
    }
  }, [])

  if (!visible) return null

  return (
    <div
      className="fixed bottom-24 right-6 z-40 max-w-sm"
      style={{
        animation: leaving
          ? 'toast-out 0.5s ease-in forwards'
          : 'toast-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
    >
      <div className="glass-card glass-border rounded-2xl p-4 pr-5 shadow-2xl shadow-emerald-500/10 backdrop-blur-xl bg-slate-900/85">
        <div className="flex items-start gap-3">
          <div className="relative shrink-0 mt-0.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-emerald-500/30">
              SD
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-900 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">
                Live
              </span>
              <span className="text-[10px] text-white/40">just now</span>
            </div>
            <div className="mt-1 text-sm text-white leading-snug">
              <span className="font-semibold">S. Dlamini</span>
              <span className="text-white/60"> closed </span>
              <span className="font-mono text-xs text-cyan-300">IG-DEMO-NCR-013</span>
            </div>
            <div className="mt-1 text-[11px] text-white/40">
              PPE issuance log {'\u00b7'} ISO 45001 Cl. 8.1.3
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(16px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes toast-out {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to { opacity: 0; transform: translateY(-8px) scale(0.98); }
        }
      `}</style>
    </div>
  )
}

export default RealtimeActivity

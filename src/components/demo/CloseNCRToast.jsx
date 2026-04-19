import { useEffect, useState } from 'react'

const CloseNCRToast = ({ visible, onJump, onDismiss }) => {
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (!visible) {
      setLeaving(false)
      return
    }
    const leaveT = setTimeout(() => setLeaving(true), 9000)
    const hideT = setTimeout(() => onDismiss && onDismiss(), 9600)
    return () => {
      clearTimeout(leaveT)
      clearTimeout(hideT)
    }
  }, [visible, onDismiss])

  if (!visible) return null

  return (
    <div
      className="fixed top-24 right-6 z-[60] max-w-sm"
      style={{
        animation: leaving
          ? 'ncr-toast-out 0.5s ease-in forwards'
          : 'ncr-toast-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
    >
      <div className="glass-card glass-border rounded-2xl p-4 shadow-2xl shadow-cyan-500/20 backdrop-blur-xl bg-slate-900/90 border border-cyan-400/20">
        <div className="flex items-center gap-2 mb-3">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.22em] bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent">
            Watch this
          </span>
        </div>

        <div className="text-sm text-white leading-snug font-semibold">
          2 sections just recalculated
        </div>
        <div className="mt-1 text-[12px] text-white/55 leading-relaxed">
          Closing one NCR rippled through your dashboard and clause-level scoring. Jump back to see it land.
        </div>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => onJump('dashboard')}
            className="flex-1 px-3 py-2 text-[11px] font-bold rounded-lg bg-gradient-to-r from-cyan-500/90 to-sky-500/90 hover:from-cyan-400 hover:to-sky-400 text-white transition-all hover:scale-[1.03] flex items-center justify-center gap-1.5"
          >
            <span>{'\u2191'}</span> Dashboard
          </button>
          <button
            type="button"
            onClick={() => onJump('compliance')}
            className="flex-1 px-3 py-2 text-[11px] font-bold rounded-lg bg-gradient-to-r from-purple-500/90 to-fuchsia-500/90 hover:from-purple-400 hover:to-fuchsia-400 text-white transition-all hover:scale-[1.03] flex items-center justify-center gap-1.5"
          >
            Compliance <span>{'\u2193'}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => onDismiss && onDismiss()}
          className="mt-2 w-full text-[10px] text-white/30 hover:text-white/60 transition-colors"
        >
          dismiss
        </button>
      </div>

      <style>{`
        @keyframes ncr-toast-in {
          from { opacity: 0; transform: translateX(40px) scale(0.92); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes ncr-toast-out {
          from { opacity: 1; transform: translateX(0) scale(1); }
          to { opacity: 0; transform: translateX(20px) scale(0.96); }
        }
      `}</style>
    </div>
  )
}

export default CloseNCRToast

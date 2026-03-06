import { useState } from 'react'

const ConfirmModal = ({
  title = 'Confirm Action',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger', // 'danger' | 'warning' | 'info'
  requireReason = false,
  reasonLabel = 'Reason (required):',
  reasonPlaceholder = 'Enter reason...',
  onConfirm,
  onCancel
}) => {
  const [reason, setReason] = useState('')

  const variantStyles = {
    danger: {
      icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
      iconBg: 'bg-red-500/20',
      iconColor: 'text-red-400',
      btnClass: 'bg-red-600 hover:bg-red-700'
    },
    warning: {
      icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z',
      iconBg: 'bg-orange-500/20',
      iconColor: 'text-orange-400',
      btnClass: 'bg-orange-600 hover:bg-orange-700'
    },
    info: {
      icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      iconBg: 'bg-cyan-500/20',
      iconColor: 'text-cyan-400',
      btnClass: 'bg-cyan-600 hover:bg-cyan-700'
    }
  }

  const style = variantStyles[variant] || variantStyles.danger

  const handleConfirm = () => {
    if (requireReason && !reason.trim()) return
    onConfirm(requireReason ? reason.trim() : undefined)
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
      <div className="bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-start gap-4 mb-4">
          <div className={`w-12 h-12 ${style.iconBg} rounded-full flex items-center justify-center shrink-0`}>
            <svg className={`w-6 h-6 ${style.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={style.icon} />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <p className="text-sm text-white/60 mt-1">{message}</p>
          </div>
        </div>

        {requireReason && (
          <div className="mb-4">
            <label className="block text-sm text-white/70 mb-2">{reasonLabel}</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={reasonPlaceholder}
              rows={3}
              autoFocus
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-cyan-500 text-sm"
            />
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-4 bg-white/10 border border-white/20 text-white rounded-xl font-semibold hover:bg-white/20 transition-colors text-sm"
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            disabled={requireReason && !reason.trim()}
            className={`flex-1 py-3 px-4 ${style.btnClass} text-white rounded-xl font-semibold transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal

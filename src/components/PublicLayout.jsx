import { useNavigate } from 'react-router-dom'

const PublicLayout = ({ children }) => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
      {/* Simple public header */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <img
              src="/isoguardian-logo.png"
              alt="ISOGuardian"
              className="w-10 h-10 object-contain rounded-lg"
            />
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              ISOGuardian
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 text-sm text-white/70 hover:text-white border border-white/20 hover:border-white/40 rounded-xl transition-all"
            >
              Back to Home
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 text-sm font-bold bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 rounded-xl transition-all"
            >
              Login
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        {children}
      </main>

      {/* Simple footer */}
      <footer className="border-t border-white/10 py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/30">
          <p>{'\u00a9'} {new Date().getFullYear()} ISOGuardian (Pty) Ltd. All rights reserved.</p>
          <div className="flex gap-4 flex-wrap justify-center">
            <a href="/terms" className="hover:text-white/60 transition-colors">Terms</a>
            <a href="/popia" className="hover:text-white/60 transition-colors">POPIA</a>
            <a href="/docs/ISOGuardian_Client_Subscription_SLA_v1.0.pdf" target="_blank" rel="noopener noreferrer" className="hover:text-white/60 transition-colors">SLA</a>
            <a href="/docs/ISOGuardian_Company_Profile_2026.pdf" target="_blank" rel="noopener noreferrer" className="hover:text-white/60 transition-colors">Company Profile</a>
          </div>
          <p>Registered in South Africa {'\u00b7'} Reg: 2026/082362/07</p>
        </div>
      </footer>

      <style>{`
        .glass {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
        }
        .glass-border {
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  )
}

export default PublicLayout

import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Layout = ({ children }) => {
  const { userProfile, signOut, isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: HomeIcon },
    { path: '/ncrs', label: 'NCRs', icon: AlertIcon },
    { path: '/documents', label: 'Documents', icon: FileIcon },
    { path: '/compliance', label: 'Compliance', icon: ShieldCheckIcon },
    { path: '/audits', label: 'Audits', icon: ClipboardIcon },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      {/* Header */}
      <header className="glass border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-shadow">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">ISOGuardian</h1>
                <p className="text-[10px] text-cyan-300/70 font-medium tracking-wider uppercase">
                  {userProfile?.company?.name || 'Enterprise Platform'}
                </p>
              </div>
            </div>

            {/* Security badge - desktop only */}
            <div className="hidden lg:flex items-center gap-1.5 ml-4 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="text-[10px] text-emerald-300 font-medium tracking-wide">ENCRYPTED</span>
            </div>
          </div>

          {/* User info + sign out */}
          <div className="flex items-center gap-3">
            <div className="hidden md:block text-right">
              <p className="text-sm text-white font-medium">{userProfile?.full_name}</p>
              <p className="text-[10px] text-white/50 capitalize">{userProfile?.role?.replace('_', ' ')}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
              {userProfile?.full_name?.charAt(0) || '?'}
            </div>
            <button
              onClick={handleSignOut}
              className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all"
              title="Sign Out"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 pb-24">
        <div className="animate-in">{children}</div>
      </main>

      {/* Legal Footer */}
      <footer className="border-t border-white/5 py-6 px-4 mt-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/30">© {new Date().getFullYear()} ISOGuardian (Pty) Ltd</span>
              <span className="text-white/20">•</span>
              <span className="text-xs text-white/30">Reg: 2026/082362/07</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="/privacy-policy" className="text-xs text-white/40 hover:text-cyan-400 transition-colors">Privacy Policy</a>
              <a href="/terms" className="text-xs text-white/40 hover:text-cyan-400 transition-colors">Terms of Service</a>
              <a href="/paia-manual" className="text-xs text-white/40 hover:text-cyan-400 transition-colors">PAIA Manual</a>
              <a href="mailto:krugerreece@gmail.com" className="text-xs text-white/40 hover:text-cyan-400 transition-colors">Contact</a>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                <span className="text-[10px] text-white/30">POPIA Compliant</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                <span className="text-[10px] text-white/30">Data: EU (Encrypted)</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Bottom Navigation - Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 glass border-t border-white/10 z-40 md:hidden">
        <div className="grid grid-cols-5 gap-0.5 px-2 py-1.5">
          {navItems.map(item => {
            const IconComp = item.icon
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-0.5 py-1.5 rounded-lg transition-all ${
                  isActive(item.path)
                    ? 'text-cyan-400 bg-cyan-500/10'
                    : 'text-white/40 hover:text-white/60'
                }`}
              >
                <IconComp className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* Side Navigation - Desktop */}
      <nav className="hidden md:block fixed left-0 top-[60px] bottom-0 w-16 glass border-r border-white/10 z-30">
        <div className="flex flex-col items-center gap-1 pt-4">
          {navItems.map(item => {
            const IconComp = item.icon
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                title={item.label}
                className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all group relative ${
                  isActive(item.path)
                    ? 'text-cyan-400 bg-cyan-500/15'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                }`}
              >
                <IconComp className="w-5 h-5" />
                {/* Tooltip */}
                <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-800 rounded-lg text-xs text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  {item.label}
                </div>
                {/* Active indicator */}
                {isActive(item.path) && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-cyan-400 rounded-r-full"></div>
                )}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

// Icon Components
const HomeIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
)

const AlertIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
)

const FileIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

const ShieldCheckIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
)

const ClipboardIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
)

export default Layout

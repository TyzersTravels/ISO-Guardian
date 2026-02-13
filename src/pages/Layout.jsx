import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Layout = ({ children }) => {
  const { userProfile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'home' },
    { path: '/documents', label: 'Documents', icon: 'file' },
    { path: '/ncrs', label: 'NCRs', icon: 'alert' },
    { path: '/compliance', label: 'Compliance', icon: 'check' },
    { path: '/audits', label: 'Audits', icon: 'calendar' },
    { path: '/management-reviews', label: 'Reviews', icon: 'users' },
    { path: '/data-export', label: 'Export Data', icon: 'download' },
    { path: '/analytics', label: 'Analytics', icon: 'chart' },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
      {/* Header */}
      <header className="glass glass-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/isoguardian-logo.png" 
              alt="ISOGuardian" 
              className="w-10 h-10 object-contain rounded-lg"
            />
            <div>
              <h1 className="text-xl font-bold text-white">ISOGuardian</h1>
              <p className="text-xs text-cyan-200">{userProfile?.company?.name}</p>
            </div>
            <div className="hidden md:flex items-center gap-2 ml-4">
              <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 rounded-lg">
                <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="text-xs text-green-300">Encrypted</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 glass glass-border rounded-xl text-white hover:bg-white/20 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Navigation */}
      <nav className="glass glass-border">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-2 py-3 overflow-x-auto">
            {navItems.map(item => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`px-6 py-2 rounded-xl font-semibold whitespace-nowrap transition-all ${
                  isActive(item.path)
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                    : 'text-white/70 hover:bg-white/10'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full">
        <div className="animate-in">
          {children}
        </div>
      </main>

      {/* Legal Footer */}
      <footer className="border-t border-white/10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-6">
          
          {/* Legal Document Links */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-white/50 mb-4">
            <a 
              href="/Privacy_policy_.pdf" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-cyan-400 transition-colors"
            >
              Privacy Policy
            </a>
            <span className="text-white/20">•</span>
            <a 
              href="/Terms_of_Service_.pdf" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-cyan-400 transition-colors"
            >
              Terms of Service
            </a>
            <span className="text-white/20">•</span>
            <a 
              href="/_PAIA_AND_POPIA_MANUAL_.pdf" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-cyan-400 transition-colors"
            >
              PAIA Manual
            </a>
            <span className="text-white/20">•</span>
            <a 
              href="/Upload_confirmation_and_disclaimer_.pdf" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-cyan-400 transition-colors"
            >
              Upload Disclaimer
            </a>
            <span className="text-white/20">•</span>
            <a 
              href="/Supabase_User_DPA_August_5_2025.pdf" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-cyan-400 transition-colors"
            >
              Data Processing Agreement
            </a>
          </div>

          {/* ECTA Notice */}
          <p className="text-center text-xs text-white/40 mb-4 max-w-3xl mx-auto">
            By using ISOGuardian, you acknowledge that you have read, understood, and agree to be bound by our 
            Terms of Service and Privacy Policy. Electronic records and signatures are legally binding under the 
            Electronic Communications and Transactions Act, 2002.
          </p>

          {/* Compliance Badges & Copyright */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-4 text-xs text-white/50">
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                POPIA Compliant
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                ISO 27001 Aligned
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                256-bit Encryption
              </span>
            </div>
            <div className="text-xs text-white/40">
              © {new Date().getFullYear()} ISOGuardian (Pty) Ltd. All rights reserved. • Registered in South Africa
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        .glass {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        .glass-border {
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-in {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}

export default Layout

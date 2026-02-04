import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const handleLogout = async () => {
    // Add your logout logic here
    navigate('/login');
  };

  const navItems = [
    { path: '/', icon: '🏠', label: 'Dashboard' },
    { path: '/documents', icon: '📄', label: 'Documents' },
    { path: '/ncrs', icon: '⚠️', label: 'NCRs' },
    { path: '/compliance', icon: '✓', label: 'Compliance' },
    { path: '/team', icon: '👥', label: 'Team' },
    { path: '/reports', icon: '📊', label: 'Reports' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Top Header */}
      <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">🛡️</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">ISOGuardian</h1>
              <p className="text-xs text-cyan-200">Quality Management System</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-green-500/20 rounded-lg">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-xs text-green-300">POPIA Compliant</span>
            </div>
            
            <div className="text-right hidden sm:block">
              <p className="text-sm text-white font-medium">{user?.email || 'User'}</p>
              <p className="text-xs text-white/60">Admin</p>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 hover:bg-white/10 rounded-xl text-white transition-colors"
              title="Logout"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 pb-24">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/10 backdrop-blur-lg border-t border-white/20 z-40">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-6 gap-1 p-2">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-1 py-2 rounded-xl transition-all ${
                  location.pathname === item.path
                    ? 'bg-cyan-500/20 text-cyan-300'
                    : 'text-white/60 hover:text-white/80 hover:bg-white/5'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Support Contact (Bottom Right) */}
      <div className="fixed bottom-24 right-6 z-30">
        <a
          href="mailto:krugerreece@gmail.com"
          className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-full shadow-lg hover:scale-105 transition-transform"
          title="Contact Support"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span className="hidden sm:inline text-sm font-semibold">Support</span>
        </a>
      </div>
    </div>
  );
};

export default Layout;

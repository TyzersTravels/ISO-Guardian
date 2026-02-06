import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const CompanySwitcher = () => {
  const { user } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [currentCompany, setCurrentCompany] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    checkSuperAdminStatus();
  }, []);

  const checkSuperAdminStatus = async () => {
    try {
      const { data } = await supabase
        .from('user_roles')
        .select('role, company_id')
        .eq('user_id', user?.id)
        .eq('role', 'superadmin')
        .single();

      if (data) {
        setIsSuperAdmin(true);
        setCurrentCompany(localStorage.getItem('superadmin_active_company') || data.company_id);
        fetchAllCompanies();
      }
    } catch (err) {
      // Not a superadmin
    }
  };

  const fetchAllCompanies = async () => {
    try {
      const { data } = await supabase
        .from('user_roles')
        .select('company_id')
        .order('company_id');

      const uniqueCompanies = [...new Set(data.map(r => r.company_id))];
      setCompanies(uniqueCompanies);
    } catch (err) {
      console.error('Error fetching companies:', err);
    }
  };

  const switchCompany = (companyId) => {
    localStorage.setItem('superadmin_active_company', companyId || 'all');
    setCurrentCompany(companyId);
    setShowDropdown(false);
    window.location.reload();
  };

  if (!isSuperAdmin) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-xl text-white hover:bg-purple-500/30 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <span className="text-sm font-medium">
          {currentCompany || 'All Companies'}
        </span>
        <svg className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showDropdown && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 border border-white/20 rounded-xl shadow-2xl z-50">
          <div className="p-2">
            <button
              onClick={() => switchCompany(null)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                !currentCompany ? 'bg-purple-500/30 text-white' : 'text-white/70 hover:bg-white/10'
              }`}
            >
              All Companies (God Mode)
            </button>
            <div className="h-px bg-white/10 my-2"></div>
            {companies.map((companyId) => (
              <button
                key={companyId}
                onClick={() => switchCompany(companyId)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  currentCompany === companyId ? 'bg-cyan-500/30 text-white' : 'text-white/70 hover:bg-white/10'
                }`}
              >
                {companyId}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const Layout = ({ children }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
      <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">ISOGuardian</h1>
              <p className="text-xs text-cyan-200">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CompanySwitcher />
            <button 
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white hover:bg-white/20 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {children}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/10 backdrop-blur-lg border-t border-white/20 z-50">
        <div className="max-w-7xl mx-auto px-2">
          <div className="grid grid-cols-7 gap-1 py-2">
            <Link to="/dashboard" className="flex flex-col items-center gap-1 py-2 rounded-xl text-white/60 hover:text-white/80 hover:bg-white/10 transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="text-xs font-medium">Dashboard</span>
            </Link>
            <Link to="/ncrs" className="flex flex-col items-center gap-1 py-2 rounded-xl text-white/60 hover:text-white/80 hover:bg-white/10 transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-xs font-medium">NCRs</span>
            </Link>
            <Link to="/documents" className="flex flex-col items-center gap-1 py-2 rounded-xl text-white/60 hover:text-white/80 hover:bg-white/10 transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-xs font-medium">Docs</span>
            </Link>
            <Link to="/compliance" className="flex flex-col items-center gap-1 py-2 rounded-xl text-white/60 hover:text-white/80 hover:bg-white/10 transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-medium">Compliance</span>
            </Link>
            <Link to="/team" className="flex flex-col items-center gap-1 py-2 rounded-xl text-white/60 hover:text-white/80 hover:bg-white/10 transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span className="text-xs font-medium">Team</span>
            </Link>
            <Link to="/reports" className="flex flex-col items-center gap-1 py-2 rounded-xl text-white/60 hover:text-white/80 hover:bg-white/10 transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="text-xs font-medium">Reports</span>
            </Link>
            <Link to="/analytics" className="flex flex-col items-center gap-1 py-2 rounded-xl text-cyan-400 hover:bg-white/10 transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span className="text-xs font-medium">Analytics</span>
            </Link>
          </div>
        </div>
      </nav>

      <footer className="bg-gradient-to-br from-slate-900/95 via-purple-900/95 to-slate-900/95 backdrop-blur-lg border-t border-white/10 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/50">
            <div className="flex items-center gap-2">
              <span>© 2026 ISOGuardian (Pty) Ltd</span>
              <span>•</span>
              <span>Reg: 2026/082362/07</span>
              <span>•</span>
              <span>VAT: 4570284239</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap justify-center">
              <a href="/Privacy_policy_.pdf" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">Privacy Policy</a>
              <span>•</span>
              <a href="/Terms_of_Service_.pdf" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">Terms of Service</a>
              <span>•</span>
              <a href="/PAIA_AND_POPIA_MANUAL_.pdf" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">PAIA Manual</a>
              <span>•</span>
              <a href="/Upload_confirmation_and_disclaimer_.pdf" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">Upload Disclaimer</a>
              <span>•</span>
              <a href="/Supabase_User_DPA_August_5_2025.pdf" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">DPA</a>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>POPIA Compliant</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;

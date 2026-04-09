import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import ClientSelector from './ClientSelector'
import HelpButton from './HelpButton'
import CommandPalette from './CommandPalette'

const icons = {
  dashboard: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" /></svg>,
  documents: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  ncrs: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
  compliance: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  audits: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
  reviews: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  ai: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47 2.47a2.25 2.25 0 01-1.59.659H9.06a2.25 2.25 0 01-1.59-.659L5 14.5m14 0V17a2 2 0 01-2 2H7a2 2 0 01-2-2v-2.5" /></svg>,
  templates: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
  auditConnect: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>,
  activity: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  notifications: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
  export: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  analytics: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  settings: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  users: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  company: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  finance: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  profile: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  signout: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
  menu: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>,
  close: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
}

const Layout = ({ children }) => {
  const { userProfile, signOut, viewingClient } = useAuth()
  const isSuperAdmin = userProfile?.role === 'super_admin'
  const isAdmin = isSuperAdmin || userProfile?.role === 'admin'
  const isLeadAuditor = userProfile?.role === 'lead_auditor'
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const [bellItems, setBellItems] = useState([])

  useEffect(() => {
    if (userProfile) fetchBellItems()
  }, [userProfile])

  const fetchBellItems = async () => {
    try {
      const companyId = userProfile?.company_id
      if (!companyId) return
      const today = new Date().toISOString().split('T')[0]
      const items = []

      const [overdueNcrs, upcomingAudits, overdueDocs] = await Promise.all([
        supabase.from('ncrs').select('id, ncr_number, severity, due_date').eq('company_id', companyId).eq('status', 'Open').lt('due_date', today).limit(5),
        supabase.from('audits').select('id, audit_number, audit_date').eq('company_id', companyId).in('status', ['Planned', 'Scheduled']).gte('audit_date', today).lte('audit_date', new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]).limit(3),
        supabase.from('documents').select('id, name, next_review_date').eq('company_id', companyId).lt('next_review_date', today).limit(3),
      ])

      ;(overdueNcrs.data || []).forEach(n => items.push({
        type: 'danger', title: `Overdue: ${n.ncr_number}`, detail: `${n.severity} NCR past due`, path: '/ncrs',
      }))
      ;(upcomingAudits.data || []).forEach(a => {
        const days = Math.ceil((new Date(a.audit_date) - new Date()) / 86400000)
        items.push({ type: 'warning', title: `Audit ${a.audit_number}`, detail: days === 0 ? 'Today' : `In ${days} day${days !== 1 ? 's' : ''}`, path: '/audits' })
      })
      ;(overdueDocs.data || []).forEach(d => items.push({
        type: 'info', title: `Review: ${d.name}`, detail: 'Overdue for review', path: '/documents',
      }))

      setBellItems(items)
    } catch { /* silent */ }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const navGroups = [
    {
      label: 'Core',
      items: [
        { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
        { path: '/documents', label: 'Documents', icon: 'documents' },
        { path: '/ncrs', label: 'NCRs', icon: 'ncrs' },
        { path: '/compliance', label: 'Compliance', icon: 'compliance' },
        { path: '/risk-register', label: 'Risk Register', icon: 'ncrs' },
        { path: '/quality-objectives', label: 'Objectives', icon: 'analytics' },
        { path: '/audits', label: 'Audits', icon: 'audits' },
        { path: '/management-reviews', label: 'Reviews', icon: 'reviews' },
      ],
    },
    {
      label: 'Intelligence',
      items: [
        { path: '/templates', label: 'Templates', icon: 'templates' },
        { path: '/audit-simulator', label: 'Audit Simulator', icon: 'audits' },
        // AI Copilot hidden until launch — code preserved in src/pages/AICopilot.jsx
        ...(isAdmin || isLeadAuditor ? [{ path: '/audit-connect', label: 'Audit Connect', icon: 'auditConnect' }] : []),
      ],
    },
    {
      label: 'Activity',
      items: [
        { path: '/activity-trail', label: 'Activity Trail', icon: 'activity' },
        { path: '/notifications', label: 'Notifications', icon: 'notifications' },
        { path: '/data-export', label: 'Export Data', icon: 'export' },
      ],
    },
    ...(isAdmin ? [{
      label: 'Administration',
      items: [
        { path: '/analytics', label: 'Analytics', icon: 'analytics' },
        { path: '/settings', label: 'Settings', icon: 'settings' },
        { path: '/users', label: 'Users', icon: 'users' },
        ...(isSuperAdmin ? [{ path: '/create-company', label: 'New Company', icon: 'company' }] : []),
        ...(isSuperAdmin ? [{ path: '/finance', label: 'Finance', icon: 'finance' }] : []),
      ],
    }] : []),
  ]

  const isActive = (path) => location.pathname === path

  const handleNav = (path) => {
    navigate(path)
    setMobileOpen(false)
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <img src="/isoguardian-logo.png" alt="ISOGuardian" className="w-9 h-9 object-contain rounded-lg" />
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-white truncate">ISOGuardian</h1>
            <p className="text-[11px] text-cyan-300/70 truncate">
              {viewingClient ? viewingClient.client_name : userProfile?.company?.name}
              {viewingClient && <span className="text-purple-300 ml-1">(client)</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Nav Groups */}
      <div className="flex-1 overflow-y-auto py-3 px-3 space-y-5">
        {navGroups.filter(group => group.items.length > 0).map(group => (
          <div key={group.label}>
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider px-3 mb-1.5">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map(item => (
                <button
                  key={item.path}
                  data-tour={item.path.replace('/', '')}
                  onClick={() => handleNav(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive(item.path)
                      ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/30'
                      : item.highlight
                      ? 'text-cyan-300/80 hover:bg-cyan-500/10'
                      : 'text-white/60 hover:bg-white/5 hover:text-white/90'
                  }`}
                >
                  <span className={isActive(item.path) ? 'text-cyan-400' : item.highlight ? 'text-cyan-400/70' : 'text-white/40'}>
                    {icons[item.icon]}
                  </span>
                  {item.highlight && !isActive(item.path) && <span className="text-cyan-400 text-xs">✦</span>}
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* User Section */}
      <div className="border-t border-white/10 p-3 space-y-1">
        <button
          onClick={() => handleNav('/profile')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            isActive('/profile')
              ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-white/60 hover:bg-white/5 hover:text-white/90'
          }`}
        >
          <span className="text-white/40">{icons.profile}</span>
          <span className="truncate">{userProfile?.full_name || 'Profile'}</span>
        </button>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-400/70 hover:bg-red-500/10 hover:text-red-300 transition-all"
        >
          <span>{icons.signout}</span>
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-50 glass glass-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <img src="/isoguardian-logo.png" alt="ISOGuardian" className="w-8 h-8 object-contain rounded-lg" />
            <span className="text-lg font-bold text-white">ISOGuardian</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setBellOpen(!bellOpen)} className="text-white/70 hover:text-white p-1 relative">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              {bellItems.length > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">{bellItems.length}</span>}
            </button>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="text-white/70 hover:text-white p-1">
              {mobileOpen ? icons.close : icons.menu}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-[280px] bg-slate-900/95 backdrop-blur-xl border-r border-white/10 animate-slide-in">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-[250px] lg:fixed lg:inset-y-0 bg-slate-900/50 backdrop-blur-xl border-r border-white/10 z-30">
        <SidebarContent />
      </aside>

      {/* Notification Bell Dropdown */}
      {bellOpen && (
        <div className="fixed inset-0 z-50" onClick={() => setBellOpen(false)}>
          <div className="absolute top-14 right-4 lg:right-auto lg:left-[260px] lg:top-4 w-80 max-h-[400px] overflow-y-auto glass glass-border rounded-xl shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-3 border-b border-white/10 flex items-center justify-between">
              <h4 className="text-sm font-bold text-white">Notifications</h4>
              <span className="text-[10px] text-white/40">{bellItems.length} pending</span>
            </div>
            {bellItems.length === 0 ? (
              <div className="p-6 text-center">
                <svg className="w-8 h-8 text-green-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                <p className="text-sm text-white/50">All clear — no action needed</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {bellItems.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => { navigate(item.path); setBellOpen(false) }}
                    className="w-full p-3 text-left hover:bg-white/5 transition-colors flex items-start gap-3"
                  >
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${item.type === 'danger' ? 'bg-red-500' : item.type === 'warning' ? 'bg-amber-500' : 'bg-cyan-500'}`} />
                    <div className="min-w-0">
                      <p className="text-sm text-white font-medium truncate">{item.title}</p>
                      <p className="text-xs text-white/40">{item.detail}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="lg:ml-[250px] flex flex-col min-h-screen overflow-x-hidden">
        {/* Desktop top bar with search + notification bell */}
        <div className="hidden lg:flex items-center justify-end gap-3 px-6 py-2 border-b border-white/5">
          <button
            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 text-white/30 hover:text-white/50 transition-all text-xs mr-auto"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            Search...
            <kbd className="ml-2 px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px]">Ctrl+K</kbd>
          </button>
          <button onClick={() => setBellOpen(!bellOpen)} className="text-white/50 hover:text-white p-1.5 relative transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            {bellItems.length > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center animate-pulse">{bellItems.length}</span>}
          </button>
        </div>

        {/* Reseller Client Selector */}
        <ClientSelector />

        <main className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full overflow-x-hidden">
          <div className="animate-slide-in">
            {children}
          </div>
        </main>

        {/* Legal Footer */}
        <footer className="border-t border-white/10 mt-auto">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-white/50 mb-4">
              <a href="/docs/ISOGuardian_POPIA_Privacy_Policy_v1.1.pdf" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">Privacy Policy</a>
              <span className="text-white/20">{'\u2022'}</span>
              <a href="/docs/ISOGuardian_Terms_of_Service_v1.1.pdf" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">Terms of Service</a>
              <span className="text-white/20">{'\u2022'}</span>
              <a href="/docs/ISOGuardian_PAIA_Manual_v1.1.pdf" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">PAIA Manual</a>
              <span className="text-white/20">{'\u2022'}</span>
              <a href="/docs/ISOGuardian_Upload_Disclaimer_v1.0.pdf" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">Upload Disclaimer</a>
              <span className="text-white/20">{'\u2022'}</span>
              <a href="/Supabase_User_DPA_August_5_2025.pdf" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">Data Processing Agreement</a>
            </div>
            <p className="text-center text-xs text-white/40 mb-4 max-w-3xl mx-auto">
              By using ISOGuardian, you acknowledge that you have read, understood, and agree to be bound by our
              Terms of Service and Privacy Policy. Electronic records and signatures are legally binding under the
              Electronic Communications and Transactions Act, 2002.
            </p>
            <div className="flex flex-col items-center gap-3">
              <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 text-xs text-white/50">
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  POPIA Compliant
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  ISO 27001 Aligned
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                  256-bit Encryption
                </span>
              </div>
              <div className="text-xs text-white/40">
                {'\u00A9'} {new Date().getFullYear()} ISOGuardian (Pty) Ltd. All rights reserved. {'\u2022'} Registered in South Africa
              </div>
            </div>
          </div>
        </footer>

        <HelpButton />
      </div>

      <CommandPalette />
    </div>
  )
}

export default Layout

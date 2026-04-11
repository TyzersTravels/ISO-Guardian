import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const CommandPalette = () => {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const navigate = useNavigate()
  const { userProfile, signOut } = useAuth()

  const isSuperAdmin = userProfile?.role === 'super_admin'
  const isAdmin = isSuperAdmin || userProfile?.role === 'admin'
  const isLeadAuditor = userProfile?.role === 'lead_auditor'

  // All searchable commands
  const commands = useMemo(() => {
    const items = [
      // Navigation — Core
      { id: 'dashboard', label: 'Dashboard', keywords: 'home overview main', section: 'Navigation', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1', action: () => navigate('/dashboard') },
      { id: 'documents', label: 'Documents', keywords: 'files upload policy procedure', section: 'Navigation', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', action: () => navigate('/documents') },
      { id: 'ncrs', label: 'Non-Conformances', keywords: 'ncr ncrs findings issues corrective action', section: 'Navigation', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', action: () => navigate('/ncrs') },
      { id: 'compliance', label: 'Compliance', keywords: 'clauses requirements scoring iso gap analysis', section: 'Navigation', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', action: () => navigate('/compliance') },
      { id: 'audits', label: 'Audits', keywords: 'audit schedule plan internal external iso 19011', section: 'Navigation', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', action: () => navigate('/audits') },
      { id: 'reviews', label: 'Management Reviews', keywords: 'review meeting minutes management 9.3', section: 'Navigation', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', action: () => navigate('/management-reviews') },
      { id: 'templates', label: 'Templates', keywords: 'template policy procedure form download sop', section: 'Navigation', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', action: () => navigate('/templates') },
      { id: 'audit-simulator', label: 'Audit Simulator', keywords: 'mock audit simulate test readiness ai', section: 'Navigation', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', action: () => navigate('/audit-simulator') },
      { id: 'risk-register', label: 'Risk Register', keywords: 'risk opportunity hazard environmental aspect threat 6.1 planning', section: 'Navigation', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', action: () => navigate('/risk-register') },
      { id: 'quality-objectives', label: 'Quality Objectives', keywords: 'objectives kpi targets goals measurable 6.2 planning', section: 'Navigation', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', action: () => navigate('/quality-objectives') },
      { id: 'training-matrix', label: 'Training Matrix', keywords: 'training competency skills certification employee 7.2 support', section: 'Navigation', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', action: () => navigate('/training-matrix') },
      { id: 'interested-parties', label: 'Interested Parties', keywords: 'stakeholders interested parties context 4.2 customers regulators suppliers', section: 'Navigation', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', action: () => navigate('/interested-parties') },
      { id: 'suppliers', label: 'Supplier Register', keywords: 'suppliers vendors approved procurement evaluation 8.4 operation', section: 'Navigation', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', action: () => navigate('/suppliers') },
      { id: 'customer-feedback', label: 'Customer Feedback', keywords: 'customer satisfaction complaints feedback NPS survey 9.1.2', section: 'Navigation', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z', action: () => navigate('/customer-feedback') },
      { id: 'improvements', label: 'Continual Improvement', keywords: 'improvement corrective preventive innovation 10.3 PDCA', section: 'Navigation', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6', action: () => navigate('/improvements') },
      { id: 'communications', label: 'Communication Register', keywords: 'communication internal external 7.4 stakeholder awareness', section: 'Navigation', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z', action: () => navigate('/communications') },
      { id: 'processes', label: 'Process Register', keywords: 'process map 4.4 inputs outputs sequence interaction core support management', section: 'Navigation', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 8a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zm12 0a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z', action: () => navigate('/processes') },
      { id: 'activity', label: 'Activity Trail', keywords: 'audit log history changes trail', section: 'Navigation', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', action: () => navigate('/activity-trail') },
      { id: 'notifications', label: 'Notification Preferences', keywords: 'notifications email alerts settings', section: 'Navigation', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9', action: () => navigate('/notifications') },
      { id: 'export', label: 'Data Export', keywords: 'export download popia data access', section: 'Navigation', icon: 'M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', action: () => navigate('/data-export') },
      { id: 'profile', label: 'My Profile', keywords: 'profile account password name email', section: 'Navigation', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', action: () => navigate('/profile') },

      // Admin pages
      ...(isAdmin || isLeadAuditor ? [
        { id: 'audit-connect', label: 'Audit Connect', keywords: 'auditor invite external portal link', section: 'Navigation', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1', action: () => navigate('/audit-connect') },
      ] : []),
      ...(isAdmin ? [
        { id: 'analytics', label: 'Analytics', keywords: 'analytics stats reports metrics', section: 'Administration', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', action: () => navigate('/analytics') },
        { id: 'settings', label: 'Company Settings', keywords: 'settings company logo profile personnel qms', section: 'Administration', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', action: () => navigate('/settings') },
        { id: 'users', label: 'User Management', keywords: 'users team members invite roles permissions', section: 'Administration', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', action: () => navigate('/users') },
      ] : []),
      ...(isSuperAdmin ? [
        { id: 'create-company', label: 'Create Company', keywords: 'new company onboard client create', section: 'Administration', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', action: () => navigate('/create-company') },
        { id: 'finance', label: 'Financial Dashboard', keywords: 'finance revenue payments invoices commissions money', section: 'Administration', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', action: () => navigate('/finance') },
      ] : []),

      // Quick actions
      { id: 'signout', label: 'Sign Out', keywords: 'sign out logout exit', section: 'Actions', icon: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1', action: async () => { await signOut(); navigate('/login') } },
    ]
    return items
  }, [navigate, signOut, isSuperAdmin, isAdmin, isLeadAuditor])

  // Fuzzy search
  const filtered = useMemo(() => {
    if (!query.trim()) return commands
    const q = query.toLowerCase()
    return commands.filter(cmd =>
      cmd.label.toLowerCase().includes(q) ||
      cmd.keywords.toLowerCase().includes(q) ||
      cmd.section.toLowerCase().includes(q)
    ).sort((a, b) => {
      // Exact label match first
      const aLabel = a.label.toLowerCase().startsWith(q) ? 0 : 1
      const bLabel = b.label.toLowerCase().startsWith(q) ? 0 : 1
      return aLabel - bLabel
    })
  }, [query, commands])

  // Keyboard shortcut to open
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(prev => !prev)
      }
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Reset selection when filtered results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [filtered.length])

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return
    const item = listRef.current.children[selectedIndex]
    if (item) item.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault()
      filtered[selectedIndex].action()
      setOpen(false)
    }
  }

  const runCommand = (cmd) => {
    cmd.action()
    setOpen(false)
  }

  if (!open) return null

  // Group filtered results by section
  const sections = {}
  filtered.forEach(cmd => {
    if (!sections[cmd.section]) sections[cmd.section] = []
    sections[cmd.section].push(cmd)
  })

  let flatIndex = -1

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]" onClick={() => setOpen(false)}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Palette */}
      <div
        className="relative w-full max-w-lg mx-4 bg-slate-900/95 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl shadow-purple-500/10 overflow-hidden animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <svg className="w-5 h-5 text-white/30 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, actions..."
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder-white/30"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-white/40 font-mono">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[50vh] overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-white/30 text-sm">No results for "{query}"</p>
            </div>
          ) : (
            Object.entries(sections).map(([section, items]) => (
              <div key={section}>
                <p className="px-4 pt-2 pb-1 text-[10px] font-semibold text-white/25 uppercase tracking-wider">{section}</p>
                {items.map(cmd => {
                  flatIndex++
                  const idx = flatIndex
                  return (
                    <button
                      key={cmd.id}
                      onClick={() => runCommand(cmd)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        selectedIndex === idx
                          ? 'bg-gradient-to-r from-cyan-500/15 to-purple-500/15 text-white'
                          : 'text-white/60 hover:text-white/80'
                      }`}
                    >
                      <svg className={`w-4 h-4 flex-shrink-0 ${selectedIndex === idx ? 'text-cyan-400' : 'text-white/25'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={cmd.icon} />
                      </svg>
                      <span className="text-sm font-medium">{cmd.label}</span>
                      {selectedIndex === idx && (
                        <kbd className="ml-auto text-[10px] text-white/25 font-mono">Enter</kbd>
                      )}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-white/5 flex items-center gap-4 text-[10px] text-white/20">
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded bg-white/5 font-mono">{'\u2191\u2193'}</kbd> Navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded bg-white/5 font-mono">{'\u23CE'}</kbd> Select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded bg-white/5 font-mono">Esc</kbd> Close
          </span>
        </div>
      </div>
    </div>
  )
}

export default CommandPalette

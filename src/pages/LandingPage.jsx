import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

// Scroll-triggered fade-in hook using IntersectionObserver
function useFadeIn() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = '1'
          el.style.transform = 'translateY(0)'
          observer.disconnect()
        }
      },
      { threshold: 0.12 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return ref
}

// Animated counter for hero mockup
function AnimatedCounter({ target, suffix = '%', duration = 1800 }) {
  const [value, setValue] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true
        const start = Date.now()
        const tick = () => {
          const elapsed = Date.now() - start
          const progress = Math.min(elapsed / duration, 1)
          const eased = 1 - Math.pow(1 - progress, 3)
          setValue(Math.round(eased * target))
          if (progress < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }
    }, { threshold: 0.5 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [target, duration])
  return <span ref={ref}>{value}{suffix}</span>
}

const SUPPORT_EMAIL = 'support@isoguardian.co.za'
const WHATSAPP_URL = 'https://wa.me/27716060250'

export default function LandingPage() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (id) => {
    setMobileMenuOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  // Section refs for fade-in
  const trustRef = useFadeIn()
  const problemRef = useFadeIn()
  const featuresRef = useFadeIn()
  const standardsRef = useFadeIn()
  const howRef = useFadeIn()
  const pricingRef = useFadeIn()
  const securityRef = useFadeIn()
  const resellerRef = useFadeIn()
  const ctaRef = useFadeIn()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white overflow-x-hidden">

      {/* ─── A. STICKY NAV ─────────────────────────────────────────────── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-slate-900/80 backdrop-blur-xl border-b border-white/10 shadow-lg' : ''}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img src="/isoguardian-logo.png" alt="ISOGuardian" className="w-10 h-10 object-contain" />
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">ISOGuardian</span>
          </div>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/70">
            <button onClick={() => scrollTo('features')} className="hover:text-white transition-colors">Features</button>
            <button onClick={() => scrollTo('standards')} className="hover:text-white transition-colors">Standards</button>
            <button onClick={() => scrollTo('pricing')} className="hover:text-white transition-colors">Pricing</button>
            <button onClick={() => scrollTo('contact')} className="hover:text-white transition-colors">Contact</button>
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 text-sm font-semibold text-white/80 border border-white/20 rounded-xl hover:border-white/40 hover:text-white transition-all"
            >
              Login
            </button>
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=Demo%20Request%20%E2%80%94%20ISOGuardian`}
              className="px-5 py-2 text-sm font-bold bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 rounded-xl transition-all shadow-lg shadow-purple-900/40"
            >
              Book a Demo
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-white/70 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900/95 backdrop-blur-xl border-t border-white/10 px-6 py-4 space-y-3">
            {['features', 'standards', 'pricing', 'contact'].map(id => (
              <button key={id} onClick={() => scrollTo(id)} className="block w-full text-left text-white/70 hover:text-white py-2 capitalize">
                {id}
              </button>
            ))}
            <button onClick={() => { setMobileMenuOpen(false); navigate('/login') }} className="block w-full text-left text-white/70 hover:text-white py-2">Login</button>
            <a href={`mailto:${SUPPORT_EMAIL}?subject=Demo%20Request`} className="block text-center py-2 mt-2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-bold text-sm">Book a Demo</a>
          </div>
        )}
      </nav>

      {/* ─── B. HERO ───────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden">
        {/* Background orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-purple-400/10 rounded-full blur-2xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />

        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center relative z-10">
          {/* Left — copy */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-full text-xs font-semibold text-purple-300 mb-6">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
              Enterprise ISO Compliance {'\u2014'} South Africa
            </div>

            <h1 className="text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              Your Shield Against{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Non-Compliance.
              </span>
            </h1>

            <p className="text-xl text-white/70 mb-8 leading-relaxed">
              ISOGuardian brings document control, NCR tracking, audit management,
              and compliance scoring into one powerful platform {'\u2014'} purpose-built for
              South African businesses pursuing ISO 9001, 14001, and 45001.
            </p>

            <div className="flex flex-wrap gap-4">
              <a
                href={`mailto:${SUPPORT_EMAIL}?subject=Free%20Demo%20Request`}
                className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 font-bold rounded-2xl transition-all shadow-xl shadow-purple-900/50 text-lg"
              >
                Book a Free Demo
              </a>
              <button
                onClick={() => scrollTo('pricing')}
                className="px-8 py-4 border border-white/20 hover:border-white/40 font-bold rounded-2xl transition-all text-lg text-white/80 hover:text-white"
              >
                View Pricing
              </button>
            </div>

            {/* Mini trust indicators */}
            <div className="flex flex-wrap gap-4 mt-8 text-xs text-white/50">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                POPIA Compliant
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                AES-256 Encrypted
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                ISO 9001 {'\u00b7'} 14001 {'\u00b7'} 45001
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                30-day money-back
              </span>
            </div>
          </div>

          {/* Right — Dashboard mockup */}
          <div className="relative hidden lg:block">
            <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
              {/* Mockup header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-xs text-white/50">Compliance Dashboard</p>
                  <p className="font-bold text-white">Simathemba Holdings</p>
                </div>
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
              </div>

              {/* Score bars */}
              <div className="space-y-4 mb-6">
                {[
                  { label: 'ISO 9001:2015', score: 87, color: 'from-cyan-500 to-cyan-400' },
                  { label: 'ISO 14001:2015', score: 74, color: 'from-purple-500 to-purple-400' },
                  { label: 'ISO 45001:2018', score: 91, color: 'from-green-500 to-green-400' },
                ].map(({ label, score, color }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/70">{label}</span>
                      <span className="text-white font-bold"><AnimatedCounter target={score} /></span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full bg-gradient-to-r ${color} rounded-full`} style={{ width: `${score}%`, transition: 'width 1.5s ease-out' }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Stat cards row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Open NCRs', value: '3', color: 'text-yellow-400' },
                  { label: 'Audits Due', value: '1', color: 'text-red-400' },
                  { label: 'Docs Active', value: '47', color: 'text-cyan-400' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
                    <p className={`text-2xl font-bold ${color}`}>{value}</p>
                    <p className="text-xs text-white/50 mt-1">{label}</p>
                  </div>
                ))}
              </div>

              {/* Recent activity */}
              <div className="mt-4 space-y-2">
                {[
                  { icon: '\u2713', text: 'NCR-SH-2026-004 closed out', time: '2h ago', color: 'text-green-400' },
                  { icon: '\u25cf', text: 'Audit AUD-2026-003 scheduled', time: '1d ago', color: 'text-cyan-400' },
                  { icon: '\u25cf', text: 'Document IG-SH-DOC-031 uploaded', time: '2d ago', color: 'text-purple-400' },
                ].map(({ icon, text, time, color }, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs bg-white/5 rounded-lg px-3 py-2">
                    <span className={color}>{icon}</span>
                    <span className="text-white/70 flex-1 truncate">{text}</span>
                    <span className="text-white/30 flex-shrink-0">{time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -top-4 -right-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl px-4 py-2 shadow-xl text-sm font-bold">
              {'\u2713'} Real-time scoring
            </div>
            <div className="absolute -bottom-4 -left-4 bg-gradient-to-r from-purple-600 to-purple-500 rounded-2xl px-4 py-2 shadow-xl text-sm font-bold">
              POPIA Ready
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/30 text-xs">
          <span>Scroll to explore</span>
          <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* Section divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mx-8" />

      {/* ─── C. TRUST BAR ──────────────────────────────────────────────── */}
      <section ref={trustRef} className="py-12 transition-all duration-700" style={{ opacity: 0, transform: 'translateY(30px)' }}>
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-center text-xs text-white/40 uppercase tracking-widest mb-6">
            Trusted by South African businesses
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { label: 'POPIA Compliant', color: 'border-purple-500/40 text-purple-300' },
              { label: 'ISO 9001:2015', color: 'border-cyan-500/40 text-cyan-300' },
              { label: 'ISO 14001:2015', color: 'border-cyan-500/40 text-cyan-300' },
              { label: 'ISO 45001:2018', color: 'border-cyan-500/40 text-cyan-300' },
              { label: 'AES-256 Encrypted', color: 'border-green-500/40 text-green-300' },
              { label: 'Supabase Powered', color: 'border-white/20 text-white/60' },
            ].map(({ label, color }) => (
              <div key={label} className={`px-5 py-2 rounded-full border text-sm font-semibold ${color} bg-white/5`}>
                {label}
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-white/30 mt-5">
            ISOGuardian (Pty) Ltd is currently working towards ISO 27001:2022 certification {'\u2014'} because we hold ourselves to the same standard we help you achieve.
          </p>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mx-8" />

      {/* ─── D. PROBLEM SECTION ────────────────────────────────────────── */}
      <section id="features" ref={problemRef} className="py-20 transition-all duration-700" style={{ opacity: 0, transform: 'translateY(30px)' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-extrabold mb-4">
              Manual compliance is costing you{' '}
              <span className="text-red-400">time, money, and certification.</span>
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Every day your team spends wrestling spreadsheets and chasing evidence
              is a day your competitors get ahead.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                ),
                title: 'Spreadsheet Chaos',
                desc: 'Version control nightmares. Documents emailed around with no audit trail. No one knows which version is current.',
                accent: 'border-red-500/30 bg-red-500/5',
                iconColor: 'text-red-400',
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: 'Missed Audits & NCRs',
                desc: 'Non-conformances raised on paper, never closed out. Auditors arrive and find open issues from six months ago.',
                accent: 'border-amber-500/30 bg-amber-500/5',
                iconColor: 'text-amber-400',
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: 'Audit Prep Panic',
                desc: 'Weeks scrambling to compile evidence. Management reviews undocumented. Certification body arrives to find gaps.',
                accent: 'border-red-500/30 bg-red-500/5',
                iconColor: 'text-red-400',
              },
            ].map(({ icon, title, desc, accent, iconColor }) => (
              <div key={title} className={`rounded-2xl border p-6 ${accent}`}>
                <div className={`${iconColor} mb-4`}>{icon}</div>
                <h3 className="font-bold text-white mb-2">{title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <p className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              ISOGuardian changes all of that.
            </p>
          </div>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mx-8" />

      {/* ─── E. FEATURES GRID ──────────────────────────────────────────── */}
      <section ref={featuresRef} className="py-20 transition-all duration-700" style={{ opacity: 0, transform: 'translateY(30px)' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-extrabold mb-4">Everything you need. Nothing you don{'\u2019'}t.</h2>
            <p className="text-white/60">Six powerful modules. One unified platform.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                ),
                title: 'Document Management',
                desc: 'Version-controlled documents with automated numbering (IG-XX-DOC-001) and full upload history.',
                gradient: 'from-cyan-500/20 to-cyan-400/5',
                border: 'border-cyan-500/20',
                iconBg: 'bg-cyan-500/20 text-cyan-400',
              },
              {
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                ),
                title: 'NCR Tracking',
                desc: 'Full non-conformance lifecycle \u2014 from raise to root cause to verified close-out \u2014 with branded PDF exports.',
                gradient: 'from-red-500/20 to-red-400/5',
                border: 'border-red-500/20',
                iconBg: 'bg-red-500/20 text-red-400',
              },
              {
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                ),
                title: 'Audit Scheduling',
                desc: 'ISO 19011:2018 compliant internal and external audit management with close-out reports and signature blocks.',
                gradient: 'from-purple-500/20 to-purple-400/5',
                border: 'border-purple-500/20',
                iconBg: 'bg-purple-500/20 text-purple-400',
              },
              {
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ),
                title: 'Management Reviews',
                desc: 'ISO 9.3 management review minutes with agenda items, decisions, action items, and PDF export.',
                gradient: 'from-amber-500/20 to-amber-400/5',
                border: 'border-amber-500/20',
                iconBg: 'bg-amber-500/20 text-amber-400',
              },
              {
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                ),
                title: 'Compliance Scoring',
                desc: 'Clause-by-clause scoring across ISO 9001, 14001, and 45001 \u2014 see exactly where you stand at a glance.',
                gradient: 'from-green-500/20 to-green-400/5',
                border: 'border-green-500/20',
                iconBg: 'bg-green-500/20 text-green-400',
              },
              {
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                ),
                title: 'Immutable Activity Trail',
                desc: 'Every action logged, tamper-proof. POPIA-ready audit log for ISO 7.5.3 traceability and data subject requests.',
                gradient: 'from-cyan-500/20 to-purple-400/5',
                border: 'border-cyan-500/20',
                iconBg: 'bg-gradient-to-br from-cyan-500/20 to-purple-500/20 text-cyan-400',
              },
            ].map(({ icon, title, desc, gradient, border, iconBg }) => (
              <div key={title} className={`relative rounded-2xl border ${border} bg-gradient-to-br ${gradient} p-6 hover:scale-[1.02] transition-transform duration-200 group`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${iconBg}`}>
                  {icon}
                </div>
                <h3 className="font-bold text-white mb-2 text-lg">{title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mx-8" />

      {/* ─── F. STANDARDS SECTION ──────────────────────────────────────── */}
      <section id="standards" ref={standardsRef} className="py-20 transition-all duration-700" style={{ opacity: 0, transform: 'translateY(30px)' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-extrabold mb-4">Built for the standards that matter.</h2>
            <p className="text-white/60">Full clause coverage from day one {'\u2014'} no add-ons, no hidden upgrades.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {[
              {
                code: 'ISO 9001',
                year: ':2015',
                name: 'Quality Management Systems',
                clauses: ['4. Context of the Organization', '6. Planning & Risk', '7. Support & Resources', '8. Operation & Control', '9. Performance Evaluation', '10. Improvement & NCRs'],
                color: 'from-cyan-500 to-blue-500',
                border: 'border-cyan-500/30',
              },
              {
                code: 'ISO 14001',
                year: ':2015',
                name: 'Environmental Management Systems',
                clauses: ['4. Context of the Organization', '6. Environmental Aspects', '7. Support & Training', '8. Operational Control', '9. Monitoring & Measurement', '10. Continual Improvement'],
                color: 'from-green-500 to-emerald-500',
                border: 'border-green-500/30',
              },
              {
                code: 'ISO 45001',
                year: ':2018',
                name: 'Occupational Health & Safety',
                clauses: ['4. Context of the Organization', '6. Hazard Identification', '7. Competence & Awareness', '8. Operational Planning', '9. Incident Investigation', '10. Corrective Actions'],
                color: 'from-amber-500 to-orange-500',
                border: 'border-amber-500/30',
              },
            ].map(({ code, year, name, clauses, color, border }) => (
              <div key={code} className={`rounded-2xl border ${border} bg-white/5 p-6`}>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`text-2xl font-extrabold bg-gradient-to-r ${color} bg-clip-text text-transparent`}>{code}<span className="text-lg">{year}</span></h3>
                    <span className="text-xs font-bold px-2 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full">Included</span>
                  </div>
                  <p className="text-sm text-white/60">{name}</p>
                </div>
                <ul className="space-y-2">
                  {clauses.map(c => (
                    <li key={c} className="flex items-start gap-2 text-xs text-white/70">
                      <svg className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-white/40 max-w-2xl mx-auto">
            ISOGuardian (Pty) Ltd is currently working towards ISO 27001:2022 certification {'\u2014'} because we hold ourselves to the same standard we help you achieve.
            ISO 27001 support for clients is on our product roadmap.
          </p>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mx-8" />

      {/* ─── G. HOW IT WORKS ───────────────────────────────────────────── */}
      <section ref={howRef} className="py-20 transition-all duration-700" style={{ opacity: 0, transform: 'translateY(30px)' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold mb-4">Up and running in minutes.</h2>
            <p className="text-white/60">Three steps from sign-up to full compliance management.</p>
          </div>

          <div className="relative flex flex-col md:flex-row items-start gap-8">
            {[
              {
                num: '01',
                title: 'Onboard',
                desc: 'Add your company, upload your logo, invite your team. Set your ISO standards and company code. Takes minutes.',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                ),
              },
              {
                num: '02',
                title: 'Manage',
                desc: 'Documents, NCRs, audits, and management reviews \u2014 all in one place. Your team always works from the current version.',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                ),
              },
              {
                num: '03',
                title: 'Export',
                desc: 'Generate branded PDFs with your company logo as the hero image. Signature blocks, document numbers, and audit metadata included.',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                ),
              },
            ].map(({ num, title, desc, icon }, i) => (
              <div key={num} className="flex-1 relative">
                {/* Step card */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-cyan-400 mb-4">
                    {icon}
                  </div>
                  <div className="text-4xl font-black text-white/10 absolute top-4 right-4">{num}</div>
                  <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                  <p className="text-white/60 text-sm leading-relaxed">{desc}</p>
                </div>

                {/* Connector line + dot (between steps, not after last) */}
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 z-10 w-8">
                    <div className="h-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 relative overflow-hidden">
                      <div className="absolute inset-0 w-3 h-full bg-white/60 rounded-full animate-connector" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mx-8" />

      {/* ─── H. PRICING ────────────────────────────────────────────────── */}
      <section id="pricing" ref={pricingRef} className="py-20 transition-all duration-700" style={{ opacity: 0, transform: 'translateY(30px)' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-4">
            <h2 className="text-4xl font-extrabold mb-3">
              Starting from{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                R2,000&nbsp;/&nbsp;month
              </span>
            </h2>
            <p className="text-white/60 mb-8">Flexible plans for teams of all sizes. Contact us for a tailored quote.</p>
          </div>

          {/* Bracket connector across 3 cards */}
          <div className="hidden md:flex items-center justify-center mb-0">
            <div className="flex-1 max-w-sm h-4 border-t border-l border-r border-white/10 rounded-t-xl mx-6" />
            <div className="flex-1 max-w-xs h-4 border-t-2 border-l-2 border-r-2 border-cyan-500/40 rounded-t-xl mx-0" />
            <div className="flex-1 max-w-sm h-4 border-t border-l border-r border-white/10 rounded-t-xl mx-6" />
          </div>

          <div className="grid md:grid-cols-3 gap-0 md:gap-0 items-stretch relative">
            {[
              {
                tier: 'Starter',
                highlight: false,
                features: ['Up to 10 users', 'ISO 9001, 14001 & 45001', 'Document management', 'NCR tracking', 'Audit scheduling', 'Management reviews', 'Compliance scoring', 'Branded PDF exports', 'Activity trail', 'Email support (business hours)'],
              },
              {
                tier: 'Growth',
                highlight: true,
                features: ['Up to 20 users', 'ISO 9001, 14001 & 45001', 'Document management', 'NCR tracking', 'Audit scheduling', 'Management reviews', 'Compliance scoring', 'Branded PDF exports', 'Activity trail', 'Priority email support'],
              },
              {
                tier: 'Enterprise',
                highlight: false,
                features: ['21+ users', 'ISO 9001, 14001 & 45001', 'All Growth features', 'Custom onboarding', 'Dedicated account manager', 'SLA agreement'],
              },
            ].map(({ tier, highlight, features }) => (
              <div
                key={tier}
                className={`relative rounded-2xl p-6 flex flex-col ${
                  highlight
                    ? 'bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border-2 border-cyan-500/50 z-10 md:-mt-2 md:-mb-2'
                    : 'bg-white/5 border border-white/10 md:first:rounded-r-none md:last:rounded-l-none'
                }`}
              >
                {highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full text-xs font-bold">
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-bold text-white mb-1">{tier}</h3>
                <p className="text-white/40 text-sm mb-5">Contact us for pricing</p>
                <ul className="space-y-2 flex-1 mb-6">
                  {features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-white/70">
                      <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href={`mailto:${SUPPORT_EMAIL}?subject=Pricing%20Query%20%E2%80%94%20${encodeURIComponent(tier)}%20Plan`}
                  className={`w-full text-center py-3 rounded-xl font-bold text-sm transition-all ${
                    highlight
                      ? 'bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400'
                      : 'border border-white/20 hover:border-white/40 text-white/70 hover:text-white'
                  }`}
                >
                  Get Custom Quote
                </a>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-white/40 mt-6">
            All plans include full ISO 9001, 14001 &amp; 45001 support {'\u00b7'} 12-month term {'\u00b7'} 5-day CPA cooling-off period {'\u00b7'} All amounts in ZAR excl. VAT
          </p>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mx-8" />

      {/* ─── I. SECURITY & POPIA ───────────────────────────────────────── */}
      <section ref={securityRef} className="py-20 transition-all duration-700" style={{ opacity: 0, transform: 'translateY(30px)' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-extrabold mb-4">Enterprise security. South African compliance.</h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Security isn{'\u2019'}t a feature we bolt on {'\u2014'} it{'\u2019'}s the foundation we build on.
              Every architectural decision is made with your data{'\u2019'}s protection in mind.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-10">
            {[
              {
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                ),
                title: 'AES-256 Encryption',
                desc: 'Data encrypted at rest using AES-256 and in transit via TLS 1.2+. Your documents never travel unprotected.',
                color: 'text-green-400',
                bg: 'bg-green-500/10 border-green-500/20',
              },
              {
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ),
                title: 'POPIA Compliant',
                desc: 'Information Officer appointed. Breach notification within 72 hours. Full data export rights under POPIA Section 23. Data hosted in the EU (London) under POPIA Section 72.',
                color: 'text-purple-400',
                bg: 'bg-purple-500/10 border-purple-500/20',
              },
              {
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                ),
                title: 'Row-Level Security',
                desc: 'Database-enforced multi-tenancy. No company can ever access another\u2019s data \u2014 not through the UI, not through the API. It is physically impossible at the database layer.',
                color: 'text-cyan-400',
                bg: 'bg-cyan-500/10 border-cyan-500/20',
              },
              {
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                ),
                title: 'Immutable Audit Trail',
                desc: 'Every action on every record is logged with timestamp, user, and IP. Tamper-proof, POPIA-ready access records for data subject requests and ISO 7.5.3 traceability.',
                color: 'text-amber-400',
                bg: 'bg-amber-500/10 border-amber-500/20',
              },
            ].map(({ icon, title, desc, color, bg }) => (
              <div key={title} className={`rounded-2xl border p-6 ${bg}`}>
                <div className={`${color} mb-4`}>{icon}</div>
                <h3 className="font-bold text-white mb-2 text-lg">{title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* Legal links + contact */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-white mb-2">Legal &amp; Compliance Documents</p>
              <div className="flex flex-wrap gap-3 text-xs">
                {[
                  { label: 'Privacy Policy', href: '/privacy' },
                  { label: 'Terms of Service', href: '/terms' },
                  { label: 'POPIA Policy', href: '/popia' },
                ].map(({ label, href }) => (
                  <a key={label} href={href} className="text-cyan-400 hover:text-cyan-300 underline transition-colors">{label}</a>
                ))}
              </div>
            </div>
            <div className="text-sm text-white/60">
              <p className="font-semibold text-white mb-1">POPIA Queries</p>
              <p>Information Officer: Tyreece Kruger</p>
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-cyan-400 hover:text-cyan-300 underline">{SUPPORT_EMAIL}</a>
            </div>
          </div>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mx-8" />

      {/* ─── BECOME A RESELLER ─────────────────────────────────────────── */}
      <section id="reseller" ref={resellerRef} className="py-20 transition-all duration-700" style={{ opacity: 0, transform: 'translateY(30px)' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left — copy */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 rounded-full text-xs font-semibold text-cyan-300 mb-6">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                Partner Programme
              </div>

              <h2 className="text-4xl font-extrabold mb-4">
                Independent ISO consultant?{' '}
                <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  Grow with us.
                </span>
              </h2>

              <p className="text-white/70 mb-6 leading-relaxed">
                If you help South African businesses achieve ISO certification, ISOGuardian gives you a
                branded platform to manage all your clients from one place {'\u2014'} while earning recurring
                revenue for every client you bring on board.
              </p>

              <ul className="space-y-4 mb-8">
                {[
                  {
                    title: 'Customer lifetime commission*',
                    desc: 'Earn recurring commission on every client you refer \u2014 for as long as that client remains active. Not a one-off.',
                  },
                  {
                    title: 'Multi-client dashboard',
                    desc: 'Switch between clients instantly. View compliance scores, open NCRs, and audit schedules across your entire portfolio.',
                  },
                  {
                    title: 'Your brand, our platform',
                    desc: 'Clients see their own branded PDF exports with their logo. You look professional without building your own software.',
                  },
                  {
                    title: 'No upfront cost',
                    desc: 'No licence fees for resellers. You earn from day one. We only succeed when your clients succeed.',
                  },
                ].map(({ title, desc }) => (
                  <li key={title} className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-cyan-400 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    <div>
                      <p className="font-bold text-white">{title}</p>
                      <p className="text-white/60 text-sm">{desc}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <a
                href={`mailto:${SUPPORT_EMAIL}?subject=Reseller%20Partnership%20Enquiry`}
                className="inline-block px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 font-bold rounded-2xl transition-all shadow-xl shadow-purple-900/50 text-lg"
              >
                Apply to Become a Reseller
              </a>
            </div>

            {/* Right — visual card */}
            <div className="relative">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">Reseller at a Glance</h3>
                  <p className="text-sm text-white/50">What a typical month looks like</p>
                </div>

                <div className="space-y-4">
                  {[
                    { label: 'Manage all your clients', value: 'One dashboard', color: 'text-cyan-400' },
                    { label: 'Commission type', value: 'Recurring', color: 'text-purple-400' },
                    { label: 'Commission duration', value: 'Customer lifetime*', color: 'text-green-400' },
                    { label: 'Upfront cost to you', value: 'R0', color: 'text-green-400' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex items-center justify-between py-3 border-b border-white/10 last:border-0">
                      <span className="text-sm text-white/60">{label}</span>
                      <span className={`font-bold text-lg ${color}`}>{value}</span>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-white/30 text-center mt-4">
                  *Commission earned for as long as referred client remains an active subscriber. Full terms provided on application.
                </p>
              </div>

              {/* Floating badge */}
              <div className="absolute -top-3 -right-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl px-4 py-2 shadow-xl text-sm font-bold">
                Recurring income
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mx-8" />

      {/* ─── J. CTA SECTION ────────────────────────────────────────────── */}
      <section id="contact" ref={ctaRef} className="py-20 transition-all duration-700" style={{ opacity: 0, transform: 'translateY(30px)' }}>
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-gradient-to-br from-purple-900/60 to-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-12 text-center shadow-2xl">
            <h2 className="text-4xl lg:text-5xl font-extrabold mb-4">
              Ready to get{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                compliant?
              </span>
            </h2>
            <p className="text-xl text-white/70 mb-8 max-w-xl mx-auto">
              Book a free 30-minute demo. No commitment. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={`mailto:${SUPPORT_EMAIL}?subject=Free%20Demo%20Request%20%E2%80%94%20ISOGuardian`}
                className="px-10 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 font-bold rounded-2xl transition-all shadow-xl shadow-purple-900/50 text-lg"
              >
                Book Your Free Demo
              </a>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-10 py-4 bg-green-600/20 hover:bg-green-600/30 border border-green-500/40 font-bold rounded-2xl transition-all text-green-300 text-lg"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                WhatsApp Us
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── K. FOOTER ─────────────────────────────────────────────────── */}
      <footer className="border-t border-white/10 py-16 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            {/* Brand col */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <img src="/isoguardian-logo.png" alt="ISOGuardian" className="w-8 h-8 object-contain" />
                <span className="font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">ISOGuardian{'\u2122'}</span>
              </div>
              <p className="text-xs text-white/40 leading-relaxed">
                Your Shield Against Non-Compliance.{'\n'}
                Enterprise ISO management for South African businesses.
              </p>
            </div>

            {/* Product */}
            <div>
              <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">Product</p>
              <ul className="space-y-2 text-sm text-white/50">
                <li><button onClick={() => scrollTo('features')} className="hover:text-white transition-colors">Features</button></li>
                <li><button onClick={() => scrollTo('pricing')} className="hover:text-white transition-colors">Pricing</button></li>
                <li><button onClick={() => navigate('/login')} className="hover:text-white transition-colors">Login</button></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">Legal</p>
              <ul className="space-y-2 text-sm text-white/50">
                <li><a href="/terms" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="/popia" className="hover:text-white transition-colors">Privacy &amp; POPIA</a></li>
                <li><a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">Company</p>
              <ul className="space-y-2 text-sm text-white/50">
                <li><button onClick={() => scrollTo('contact')} className="hover:text-white transition-colors">Contact Us</button></li>
                <li><a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-white transition-colors">Email Support</a></li>
                <li>
                  <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">WhatsApp</a>
                </li>
              </ul>
            </div>

            {/* Standards */}
            <div>
              <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">Standards</p>
              <ul className="space-y-2 text-sm text-white/50">
                <li><button onClick={() => scrollTo('standards')} className="hover:text-white transition-colors">ISO 9001:2015</button></li>
                <li><button onClick={() => scrollTo('standards')} className="hover:text-white transition-colors">ISO 14001:2015</button></li>
                <li><button onClick={() => scrollTo('standards')} className="hover:text-white transition-colors">ISO 45001:2018</button></li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/30">
            <p>
              {'\u00a9'} {new Date().getFullYear()} ISOGuardian (Pty) Ltd. All rights reserved.
            </p>
            <p>{SUPPORT_EMAIL}</p>
            <p>Registered in South Africa {'\u00b7'} Reg: 2026/082362/07</p>
          </div>
        </div>
      </footer>

      {/* Inline styles for landing-page-specific animations */}
      <style>{`
        @keyframes connector {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        .animate-connector {
          animation: connector 2s linear infinite;
        }
      `}</style>
    </div>
  )
}

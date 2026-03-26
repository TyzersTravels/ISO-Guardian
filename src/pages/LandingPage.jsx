import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useFadeIn, useStaggerFadeIn, useHeroParallax } from '../hooks/useAnimations'
import { useReferralTracking } from '../hooks/useReferralTracking'
import ReadinessAssessment from '../components/landing/ReadinessAssessment'
import TemplateMarketplace from '../components/landing/TemplateMarketplace'
import { trackConversion } from '../lib/analytics'

/* ─── Animated counter ──────────────────────────────────────────────── */
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

/* ─── Scroll progress bar ───────────────────────────────────────────── */
function ScrollProgress() {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const update = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      setProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0)
    }
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])
  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-[2px]">
      <div
        className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-[width] duration-100"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}

const SUPPORT_EMAIL = 'support@isoguardian.co.za'
const WHATSAPP_URL = 'https://wa.me/27716060250'

export default function LandingPage() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState(null)

  useReferralTracking()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (id) => {
    setMobileMenuOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  // Section animation refs
  const problemRef = useFadeIn()
  const featuresRef = useFadeIn()
  const standardsRef = useFadeIn()
  const pricingRef = useFadeIn()
  const faqRef = useFadeIn()
  const ctaRef = useFadeIn()
  const featuresStaggerRef = useStaggerFadeIn(100)
  const pricingStaggerRef = useStaggerFadeIn(100)
  const heroParallaxRef = useHeroParallax()

  const startTrial = () => {
    trackConversion('trial_start')
    navigate('/signup')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white overflow-x-hidden">
      {/* SEO */}
      <Helmet>
        <title>ISOGuardian — ISO Compliance Management Platform for South Africa</title>
        <meta name="description" content="ISOGuardian is South Africa's cloud-based ISO compliance management platform. Document control, NCR tracking, audit scheduling, and compliance scoring for ISO 9001, 14001, and 45001." />
        <link rel="canonical" href="https://isoguardian.co.za" />
        <meta property="og:title" content="ISOGuardian — Your Shield Against Non-Compliance" />
        <meta property="og:description" content="Cloud-based ISO compliance management for South African businesses. ISO 9001, 14001, 45001." />
        <meta property="og:url" content="https://isoguardian.co.za" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="ISOGuardian" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="ISOGuardian — ISO Compliance Management" />
        <meta name="twitter:description" content="Document control, NCR tracking, audit scheduling for ISO 9001, 14001, 45001." />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "ISOGuardian",
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "Web",
          "description": "Cloud-based ISO compliance management platform for South African businesses",
          "url": "https://isoguardian.co.za",
          "offers": { "@type": "Offer", "priceCurrency": "ZAR", "price": "2000", "priceValidUntil": "2027-12-31" },
          "provider": {
            "@type": "Organization",
            "name": "ISOGuardian (Pty) Ltd",
            "url": "https://isoguardian.co.za",
            "address": { "@type": "PostalAddress", "addressCountry": "ZA" }
          }
        })}</script>
      </Helmet>

      <ScrollProgress />

      {/* ─── NAV ─────────────────────────────────────────────────────────── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-slate-900/80 backdrop-blur-xl border-b border-white/10 shadow-2xl shadow-black/20' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img src="/isoguardian-logo.png" alt="ISOGuardian" className="w-10 h-10 object-contain" />
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">ISOGuardian</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
            {[
              ['features', 'Features'],
              ['standards', 'Standards'],
              ['assessment', 'Assessment'],
              ['pricing', 'Pricing'],
              ['templates', 'Templates'],
              ['faq', 'FAQ'],
            ].map(([id, label]) => (
              <button key={id} onClick={() => scrollTo(id)} className="hover:text-white transition-colors relative group">
                {label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 group-hover:w-full transition-all duration-300" />
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button onClick={() => navigate('/login')} className="px-4 py-2 text-sm font-semibold text-white/80 border border-white/20 rounded-xl hover:border-white/40 hover:text-white transition-all">
              Login
            </button>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-5 py-2 text-sm font-bold bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 rounded-xl transition-all shadow-lg shadow-green-900/40">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
              WhatsApp Us
            </a>
          </div>

          <button className="md:hidden p-2 text-white/70 hover:text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900/95 backdrop-blur-xl border-t border-white/10 px-6 py-4 space-y-3">
            {['features', 'standards', 'assessment', 'pricing', 'templates', 'faq'].map(id => (
              <button key={id} onClick={() => scrollTo(id)} className="block w-full text-left text-white/70 hover:text-white py-2 capitalize">{id}</button>
            ))}
            <button onClick={() => { setMobileMenuOpen(false); navigate('/login') }} className="block w-full text-left text-white/70 hover:text-white py-2">Login</button>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="block text-center py-2 mt-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl font-bold text-sm">WhatsApp Us</a>
          </div>
        )}
      </nav>

      {/* ═══════════════════════════════════════════════════════════════════
          1. HERO — Full viewport, one message, parallax
      ═══════════════════════════════════════════════════════════════════ */}
      <section ref={heroParallaxRef} className="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden" style={{ transform: 'translateY(var(--parallax-y, 0px))', opacity: 'var(--parallax-opacity, 1)' }}>
        {/* Ambient orbs */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px]" />

        {/* SVG grid pattern */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hero-grid" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-grid)" />
        </svg>

        {/* Floating geometric shapes */}
        <svg className="absolute top-20 right-[10%] w-24 h-24 text-cyan-400/10 animate-float-slow" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <polygon points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5" stroke="currentColor" strokeWidth="1.5" />
          <polygon points="50,20 80,35 80,65 50,80 20,65 20,35" stroke="currentColor" strokeWidth="0.8" />
        </svg>
        <svg className="absolute bottom-32 left-[8%] w-16 h-16 text-purple-400/10 animate-float-slow" style={{ animationDelay: '2s' }} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="15" y="15" width="70" height="70" rx="8" stroke="currentColor" strokeWidth="1.5" transform="rotate(45 50 50)" />
        </svg>
        <svg className="absolute top-1/3 left-[5%] w-10 h-10 text-cyan-300/8 animate-float-slow" style={{ animationDelay: '4s' }} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="50" cy="50" r="20" stroke="currentColor" strokeWidth="0.8" />
        </svg>

        {/* Dot constellation — top right */}
        <svg className="absolute top-16 right-16 w-48 h-48 text-white/[0.04] hidden lg:block" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <circle cx="20" cy="20" r="2" fill="currentColor" /><circle cx="60" cy="30" r="1.5" fill="currentColor" /><circle cx="100" cy="15" r="2" fill="currentColor" /><circle cx="140" cy="40" r="1.5" fill="currentColor" /><circle cx="180" cy="20" r="2" fill="currentColor" />
          <circle cx="40" cy="70" r="1.5" fill="currentColor" /><circle cx="80" cy="80" r="2" fill="currentColor" /><circle cx="120" cy="60" r="1.5" fill="currentColor" /><circle cx="160" cy="90" r="2" fill="currentColor" />
          <circle cx="30" cy="130" r="2" fill="currentColor" /><circle cx="70" cy="120" r="1.5" fill="currentColor" /><circle cx="110" cy="140" r="2" fill="currentColor" /><circle cx="150" cy="130" r="1.5" fill="currentColor" /><circle cx="190" cy="150" r="2" fill="currentColor" />
          <line x1="20" y1="20" x2="60" y2="30" stroke="currentColor" strokeWidth="0.3" /><line x1="60" y1="30" x2="100" y2="15" stroke="currentColor" strokeWidth="0.3" /><line x1="80" y1="80" x2="120" y2="60" stroke="currentColor" strokeWidth="0.3" /><line x1="120" y1="60" x2="160" y2="90" stroke="currentColor" strokeWidth="0.3" />
          <line x1="30" y1="130" x2="70" y2="120" stroke="currentColor" strokeWidth="0.3" /><line x1="110" y1="140" x2="150" y2="130" stroke="currentColor" strokeWidth="0.3" />
        </svg>

        <div className="max-w-7xl mx-auto px-4 md:px-6 grid lg:grid-cols-2 gap-8 md:gap-16 items-center relative z-10">
          {/* Left — copy */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-full text-xs font-semibold text-purple-300 mb-6 backdrop-blur-sm">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
              Enterprise ISO Compliance {'\u2014'} South Africa
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold leading-[1.1] mb-6 tracking-tight">
              Your Shield Against{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite]">
                Non-Compliance.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-white/60 mb-8 leading-relaxed max-w-lg">
              Document control, NCR tracking, audit management, and compliance scoring
              in one platform {'\u2014'} purpose-built for ISO 9001, 14001, and 45001.
            </p>

            <div className="flex flex-wrap gap-4">
              <button onClick={startTrial} className="group px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 font-bold rounded-2xl transition-all shadow-xl shadow-purple-900/50 text-lg">
                Start Free Trial
                <span className="inline-block ml-2 transition-transform group-hover:translate-x-1">{'\u2192'}</span>
              </button>
              <button onClick={() => scrollTo('pricing')} className="px-8 py-4 border border-white/20 hover:border-white/40 hover:bg-white/5 font-bold rounded-2xl transition-all text-lg text-white/70 hover:text-white">
                View Pricing
              </button>
            </div>

            {/* Compact trust line */}
            <div className="flex flex-wrap gap-x-5 gap-y-2 mt-8 text-xs text-white/40">
              {['POPIA Compliant', 'AES-256 Encrypted', 'ISO 9001 \u00b7 14001 \u00b7 45001', '14-Day Free Trial'].map(t => (
                <span key={t} className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-green-400/70" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Right — Dashboard mockup */}
          <div className="relative hidden lg:block">
            <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl shadow-black/30">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider">Compliance Dashboard</p>
                  <p className="font-bold text-white text-sm">Simathemba Holdings</p>
                </div>
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
                </div>
              </div>

              <div className="space-y-3 mb-5">
                {[
                  { label: 'ISO 9001:2015', score: 87, color: 'from-cyan-500 to-cyan-400' },
                  { label: 'ISO 14001:2015', score: 74, color: 'from-purple-500 to-purple-400' },
                  { label: 'ISO 45001:2018', score: 91, color: 'from-green-500 to-green-400' },
                ].map(({ label, score, color }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/60">{label}</span>
                      <span className="text-white font-bold"><AnimatedCounter target={score} /></span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full bg-gradient-to-r ${color} rounded-full`} style={{ width: `${score}%`, transition: 'width 1.5s ease-out' }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Open NCRs', value: '3', color: 'text-yellow-400' },
                  { label: 'Audits Due', value: '1', color: 'text-red-400' },
                  { label: 'Docs Active', value: '47', color: 'text-cyan-400' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-white/[0.03] rounded-xl p-2.5 text-center border border-white/5">
                    <p className={`text-xl font-bold ${color}`}>{value}</p>
                    <p className="text-[10px] text-white/40 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -top-3 -right-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl px-3 py-1.5 shadow-xl text-xs font-bold">
              {'\u2713'} Real-time scoring
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/20 text-xs">
          <span>Scroll</span>
          <svg className="w-4 h-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* Wave divider */}
      <div className="relative h-16 md:h-24 -mt-1">
        <svg className="absolute bottom-0 w-full h-full text-purple-900/20" viewBox="0 0 1440 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,40 C360,100 1080,0 1440,60 L1440,100 L0,100 Z" fill="currentColor" />
        </svg>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          2. PROBLEM — Before & After
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="features" ref={problemRef} className="py-24 transition-all duration-700" style={{ opacity: 0, transform: 'translateY(30px)' }}>
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <h2 className="text-2xl md:text-4xl font-extrabold text-center mb-16 leading-tight">
            Manual compliance is costing you{' '}
            <span className="text-red-400">time, money, and certification.</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              { title: 'Spreadsheet Chaos', desc: 'Version nightmares. No audit trail. Nobody knows which document is current.', icon: '\u26A0', accent: 'border-red-500/20 bg-red-500/[0.04]', color: 'text-red-400' },
              { title: 'Missed Audits & NCRs', desc: 'Non-conformances raised on paper, never closed. Auditors find open issues from months ago.', icon: '\u23F0', accent: 'border-amber-500/20 bg-amber-500/[0.04]', color: 'text-amber-400' },
              { title: 'Audit Prep Panic', desc: 'Weeks scrambling to compile evidence. Management reviews undocumented. Gaps everywhere.', icon: '\u{1F6A8}', accent: 'border-red-500/20 bg-red-500/[0.04]', color: 'text-red-400' },
            ].map(({ title, desc, icon, accent, color }) => (
              <div key={title} className={`rounded-2xl border p-6 ${accent} transition-transform hover:scale-[1.02]`}>
                <span className={`text-2xl ${color} block mb-3`}>{icon}</span>
                <h3 className="font-bold text-white mb-2">{title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <p className="text-center mt-12 text-xl font-bold">
            <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">ISOGuardian changes all of that.</span>
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          3. FEATURES — Bento Grid
      ═══════════════════════════════════════════════════════════════════ */}
      <section ref={featuresRef} className="relative py-24 transition-all duration-700" style={{ opacity: 0, transform: 'translateY(30px)' }}>
        {/* SVG circuit lines */}
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-[0.025]" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <defs>
            <linearGradient id="circuit-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
          <path d="M0,100 Q200,50 400,120 T800,80 T1200,150 T1600,60" fill="none" stroke="url(#circuit-grad)" strokeWidth="1" />
          <path d="M0,250 Q300,200 600,280 T1200,220 T1600,300" fill="none" stroke="url(#circuit-grad)" strokeWidth="0.8" />
          <circle cx="400" cy="120" r="3" fill="#06b6d4" opacity="0.3" />
          <circle cx="800" cy="80" r="3" fill="#8b5cf6" opacity="0.3" />
          <circle cx="1200" cy="150" r="3" fill="#06b6d4" opacity="0.3" />
        </svg>

        <div className="max-w-6xl mx-auto px-4 md:px-6 relative z-10">
          <h2 className="text-2xl md:text-4xl font-extrabold text-center mb-4">Everything you need. Nothing you don{'\u2019'}t.</h2>
          <p className="text-center text-white/50 mb-14">Six modules. One platform. Zero spreadsheets.</p>

          {/* Bento grid — asymmetric for visual interest */}
          <div ref={featuresStaggerRef} className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {[
              { title: 'Document Control', desc: 'Upload, organise, version, and retrieve. Automated numbering. Full audit trail.', icon: '\uD83D\uDCC4', span: 'md:col-span-2', accent: 'from-cyan-500/10 to-transparent' },
              { title: 'NCR Tracking', desc: 'Full lifecycle from creation through corrective action to closure.', icon: '\u26A0\uFE0F', span: '', accent: 'from-purple-500/10 to-transparent' },
              { title: 'Audit Management', desc: 'Schedule, execute, and close-out per ISO 19011. Auditor portal included.', icon: '\uD83D\uDD0D', span: '', accent: 'from-green-500/10 to-transparent' },
              { title: 'Compliance Scoring', desc: 'Clause-by-clause scoring across all three standards. See exactly where you stand.', icon: '\uD83D\uDCCA', span: 'md:col-span-2', accent: 'from-amber-500/10 to-transparent' },
              { title: 'Management Reviews', desc: 'ISO 9.3 compliant. Meeting minutes, decisions, action items — all tracked.', icon: '\uD83D\uDCCB', span: '', accent: 'from-purple-500/10 to-transparent' },
              { title: 'Branded PDF Exports', desc: 'Your logo, your numbering, your brand. Professional documents in one click.', icon: '\uD83C\uDFA8', span: '', accent: 'from-cyan-500/10 to-transparent' },
              { title: 'Activity Trail', desc: 'Every action logged. ISO 7.5.3 traceability built in.', icon: '\uD83D\uDCDD', span: '', accent: 'from-green-500/10 to-transparent' },
            ].map(({ title, desc, icon, span, accent }) => (
              <div
                data-stagger
                key={title}
                className={`${span} group bg-gradient-to-br ${accent} border border-white/[0.06] rounded-2xl p-5 md:p-6 transition-all hover:border-white/15 hover:bg-white/[0.03]`}
              >
                <span className="text-2xl block mb-3">{icon}</span>
                <h3 className="font-bold text-white mb-1.5 text-sm md:text-base">{title}</h3>
                <p className="text-white/45 text-xs md:text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          4. STANDARDS — ISO 9001, 14001, 45001
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="standards" ref={standardsRef} className="relative py-24 transition-all duration-700" style={{ opacity: 0, transform: 'translateY(30px)' }}>
        {/* Shield SVG watermark */}
        <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] text-white/[0.015] pointer-events-none" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M100 15 L170 50 V110 C170 150 140 180 100 195 C60 180 30 150 30 110 V50 Z" stroke="currentColor" strokeWidth="1" />
          <path d="M100 40 L150 62 V108 C150 138 128 160 100 172 C72 160 50 138 50 108 V62 Z" stroke="currentColor" strokeWidth="0.5" />
          <path d="M80 100 L95 115 L125 85" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        <div className="max-w-5xl mx-auto px-4 md:px-6 text-center relative z-10">
          <h2 className="text-2xl md:text-4xl font-extrabold mb-4">
            Three standards.{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">One platform.</span>
          </h2>
          <p className="text-white/50 mb-14 max-w-xl mx-auto">Manage integrated management systems without switching tools.</p>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              { standard: 'ISO 9001:2015', subtitle: 'Quality Management', desc: 'Document control, process management, customer satisfaction, continual improvement.', color: 'border-cyan-500/30', badge: 'bg-cyan-500/20 text-cyan-300', glow: 'shadow-cyan-500/5' },
              { standard: 'ISO 14001:2015', subtitle: 'Environmental Management', desc: 'Environmental aspects, legal compliance, waste management, pollution prevention.', color: 'border-green-500/30', badge: 'bg-green-500/20 text-green-300', glow: 'shadow-green-500/5' },
              { standard: 'ISO 45001:2018', subtitle: 'OH&S Management', desc: 'Hazard identification, risk assessment, incident investigation, worker participation.', color: 'border-amber-500/30', badge: 'bg-amber-500/20 text-amber-300', glow: 'shadow-amber-500/5' },
            ].map(({ standard, subtitle, desc, color, badge, glow }) => (
              <div key={standard} className={`border ${color} rounded-2xl p-6 bg-white/[0.02] hover:bg-white/[0.04] transition-all shadow-xl ${glow}`}>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${badge} mb-4`}>{standard}</span>
                <h3 className="font-bold text-white text-lg mb-2">{subtitle}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          5. HOW IT WORKS — Compact 4-step
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative py-16 overflow-hidden">
        {/* Connecting line SVG */}
        <svg className="absolute top-1/2 left-0 w-full h-1 pointer-events-none opacity-[0.06] hidden md:block" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <defs>
            <linearGradient id="step-line" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="transparent" /><stop offset="20%" stopColor="#06b6d4" /><stop offset="80%" stopColor="#8b5cf6" /><stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <line x1="0" y1="0" x2="100%" y2="0" stroke="url(#step-line)" strokeWidth="1" />
        </svg>

        <div className="max-w-4xl mx-auto px-4 md:px-6 relative z-10">
          <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-10">
            Up and running in{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">four steps.</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { step: '01', title: 'Sign Up', desc: '14-day free trial. No card.' },
              { step: '02', title: 'Upload', desc: 'Import existing docs or start fresh.' },
              { step: '03', title: 'Track', desc: 'NCRs, audits, reviews — all in one place.' },
              { step: '04', title: 'Get Certified', desc: 'Walk into your audit with confidence.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center p-4">
                <span className="text-3xl font-black bg-gradient-to-b from-white/20 to-white/5 bg-clip-text text-transparent block mb-2">{step}</span>
                <h3 className="font-bold text-white text-sm mb-1">{title}</h3>
                <p className="text-white/40 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          6. ISO READINESS ASSESSMENT — Lead capture
      ═══════════════════════════════════════════════════════════════════ */}
      <ReadinessAssessment />

      {/* ═══════════════════════════════════════════════════════════════════
          7. PRICING
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="pricing" ref={pricingRef} className="relative py-24 transition-all duration-700" style={{ opacity: 0, transform: 'translateY(30px)' }}>
        {/* Radial dot pattern */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.02]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="price-dots" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
              <circle cx="15" cy="15" r="1" fill="white" />
            </pattern>
            <radialGradient id="price-mask" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="white" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
            <mask id="price-fade"><rect width="100%" height="100%" fill="url(#price-mask)" /></mask>
          </defs>
          <rect width="100%" height="100%" fill="url(#price-dots)" mask="url(#price-fade)" />
        </svg>

        <div className="max-w-5xl mx-auto px-4 md:px-6 relative z-10">
          <h2 className="text-2xl md:text-4xl font-extrabold text-center mb-3">
            Starting from{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">R2,000&nbsp;/&nbsp;month</span>
          </h2>
          <p className="text-center text-white/50 mb-12">80% cheaper than enterprise competitors. Same power.</p>

          <div ref={pricingStaggerRef} className="grid md:grid-cols-3 gap-4 items-stretch">
            {[
              {
                tier: 'Starter', subtitle: '1\u201310 users', highlight: false, cta: 'trial',
                features: ['Up to 10 users', '5GB storage', 'ISO 9001, 14001 & 45001', 'Document management', 'NCR tracking', 'Audit scheduling', 'Compliance scoring', 'Branded PDF exports', 'Email support'],
              },
              {
                tier: 'Growth', subtitle: '11\u201320 users', highlight: true, cta: 'trial',
                features: ['Up to 20 users', '15GB storage', 'ISO 9001, 14001 & 45001', 'Everything in Starter', 'Management reviews', 'Activity trail', 'Priority support', 'All templates free'],
              },
              {
                tier: 'Enterprise', subtitle: '21+ users', highlight: false, cta: 'contact',
                features: ['Unlimited users', 'Unlimited storage', 'Everything in Growth', 'Custom onboarding', 'Dedicated account manager', 'SLA agreement', 'API access'],
              },
            ].map(({ tier, subtitle, highlight, cta, features }) => (
              <div
                data-stagger
                key={tier}
                className={`relative rounded-2xl p-5 md:p-6 flex flex-col transition-all ${
                  highlight
                    ? 'bg-gradient-to-br from-cyan-500/15 to-purple-500/15 border-2 border-cyan-500/40 md:-my-2 shadow-xl shadow-cyan-900/20'
                    : 'bg-white/[0.03] border border-white/[0.08]'
                }`}
              >
                {highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full text-xs font-bold whitespace-nowrap">
                    Most Popular
                  </div>
                )}
                <h3 className="text-lg font-bold text-white mb-0.5">{tier}</h3>
                <span className="text-white/40 text-sm mb-5">{subtitle}</span>
                <ul className="space-y-2 flex-1 mb-6">
                  {features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-white/60">
                      <svg className="w-4 h-4 text-green-400/70 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                {cta === 'trial' ? (
                  <button onClick={startTrial} className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${highlight ? 'bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 shadow-lg' : 'border border-white/20 hover:border-white/40 text-white/70 hover:text-white'}`}>
                    Start 14-Day Free Trial
                  </button>
                ) : (
                  <a href={`mailto:${SUPPORT_EMAIL}?subject=Enterprise%20Pricing%20Enquiry`} className="w-full text-center py-3 rounded-xl font-bold text-sm transition-all border border-white/20 hover:border-white/40 text-white/70 hover:text-white block">
                    Contact Sales
                  </a>
                )}
              </div>
            ))}
          </div>

          <p className="text-center text-[11px] text-white/30 mt-6">
            All plans include ISO 9001, 14001 & 45001 {'\u00b7'} 12-month term {'\u00b7'} 5-day CPA cooling-off {'\u00b7'} ZAR excl. VAT
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          8. SOCIAL PROOF — Stats + Value Props (moved up, after pricing)
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative py-20 overflow-hidden">
        {/* Subtle diagonal stripes */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.012]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="diag" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="40" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#diag)" />
        </svg>
        <div className="max-w-5xl mx-auto px-4 md:px-6 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-14">
            {[
              { value: '3', label: 'ISO Standards', desc: '9001, 14001 & 45001', color: 'text-cyan-400' },
              { value: '100%', label: 'POPIA Compliant', desc: 'Data isolation by design', color: 'text-purple-400' },
              { value: '<10min', label: 'Setup Time', desc: 'Sign up to first upload', color: 'text-green-400' },
              { value: 'R67/day', label: 'From Just', desc: 'Less than a coffee meeting', color: 'text-amber-400' },
            ].map(({ value, label, desc, color }) => (
              <div key={label} className="text-center bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 md:p-5 transition-transform hover:scale-[1.03]">
                <p className={`text-2xl md:text-3xl font-extrabold ${color} mb-0.5`}>{value}</p>
                <p className="text-white font-bold text-xs md:text-sm">{label}</p>
                <p className="text-white/35 text-[10px] md:text-xs mt-0.5">{desc}</p>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              { title: 'South African First', desc: 'ZAR pricing, SAST support, POPIA-compliant, designed for SA regulatory requirements.', color: 'text-cyan-400', icon: '\uD83C\uDDFF\uD83C\uDDE6' },
              { title: '80% Cheaper', desc: 'Enterprise tools charge R12,000+/mo. ISOGuardian starts at R2,000/mo with no setup fees.', color: 'text-purple-400', icon: '\uD83D\uDCB0' },
              { title: 'Audit-Ready Every Day', desc: 'No more 3-week audit prep scrambles. Your compliance stays current so audits become a non-event.', color: 'text-green-400', icon: '\uD83D\uDEE1\uFE0F' },
            ].map(({ title, desc, color, icon }) => (
              <div key={title} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 transition-all hover:border-white/10">
                <span className="text-2xl block mb-3">{icon}</span>
                <h3 className={`font-bold mb-1.5 ${color}`}>{title}</h3>
                <p className="text-white/45 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          9. TEMPLATE MARKETPLACE
      ═══════════════════════════════════════════════════════════════════ */}
      <TemplateMarketplace />

      {/* ═══════════════════════════════════════════════════════════════════
          10. SECURITY — One compact line
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-white/40">
            {[
              { icon: '\uD83D\uDD12', text: 'AES-256 Encryption' },
              { icon: '\uD83D\uDEE1\uFE0F', text: 'Row-Level Security' },
              { icon: '\uD83C\uDFE2', text: 'SOC 2 Type II Hosting' },
              { icon: '\uD83C\uDDFF\uD83C\uDDE6', text: 'POPIA Compliant' },
            ].map(({ icon, text }) => (
              <span key={text} className="flex items-center gap-1.5">
                <span>{icon}</span> {text}
              </span>
            ))}
            <a href="/popia" className="text-cyan-400/60 hover:text-cyan-400 underline underline-offset-2 transition-colors text-xs">Full security details {'\u2192'}</a>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          11. FAQ
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="faq" ref={faqRef} className="py-24 transition-all duration-700" style={{ opacity: 0, transform: 'translateY(30px)' }}>
        <div className="max-w-2xl mx-auto px-4 md:px-6">
          <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-10">
            Frequently Asked <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Questions</span>
          </h2>
          <div className="space-y-2">
            {[
              { q: 'Will ISOGuardian certify my company?', a: 'No. ISOGuardian is a compliance management tool that helps you prepare for and maintain ISO certification. You still need an accredited certification body for your official audit. We make the journey significantly easier.' },
              { q: 'Which ISO standards are supported?', a: 'ISO 9001:2015 (Quality), ISO 14001:2015 (Environmental), and ISO 45001:2018 (Occupational Health & Safety). ISO 27001:2022 is on our roadmap.' },
              { q: 'Is my data safe?', a: 'Yes. AES-256 encryption at rest, TLS 1.2+ in transit, strict row-level data isolation between companies, POPIA-compliant. You can export or delete your data at any time.' },
              { q: 'Can I manage multiple standards at once?', a: 'Absolutely. Documents, NCRs, and audits can all be tagged to specific standards across all three simultaneously.' },
              { q: 'What happens after my 14-day free trial?', a: 'Choose a plan. No credit card required to start. If you decide not to continue, export your data before deactivation.' },
              { q: 'Do you support consultants and resellers?', a: 'Yes. Our Reseller Programme lets consultants manage multiple clients from one dashboard with recurring commissions. See our Reseller Programme page for details.' },
              { q: 'Can I buy individual templates without subscribing?', a: 'Yes. Templates are available for one-time purchase starting at R250. Subscribers get all templates free.' },
            ].map((faq, i) => (
              <div key={i} className="border border-white/[0.06] rounded-xl overflow-hidden bg-white/[0.02]">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-5 py-4 text-left">
                  <span className="font-semibold text-white text-sm pr-4">{faq.q}</span>
                  <svg className={`w-4 h-4 text-cyan-400/60 shrink-0 transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="px-5 pb-4 text-white/50 text-sm leading-relaxed">{faq.a}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          12. FINAL CTA
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="contact" ref={ctaRef} className="py-24 transition-all duration-700" style={{ opacity: 0, transform: 'translateY(30px)' }}>
        <div className="max-w-3xl mx-auto px-4 md:px-6">
          <div className="relative bg-gradient-to-br from-purple-900/40 to-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-10 md:p-14 text-center shadow-2xl overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 blur-[80px] rounded-full" />

            {/* Decorative rings */}
            <svg className="absolute -top-20 -right-20 w-64 h-64 text-cyan-400/[0.04] pointer-events-none animate-[spin_60s_linear_infinite]" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="0.5" /><circle cx="100" cy="100" r="60" stroke="currentColor" strokeWidth="0.5" strokeDasharray="8 8" /><circle cx="100" cy="100" r="40" stroke="currentColor" strokeWidth="0.5" />
            </svg>
            <svg className="absolute -bottom-16 -left-16 w-48 h-48 text-purple-400/[0.04] pointer-events-none animate-[spin_45s_linear_infinite_reverse]" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="100" cy="100" r="70" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 12" /><circle cx="100" cy="100" r="50" stroke="currentColor" strokeWidth="0.5" /><circle cx="100" cy="100" r="30" stroke="currentColor" strokeWidth="0.5" strokeDasharray="6 6" />
            </svg>

            <h2 className="text-3xl md:text-5xl font-extrabold mb-4 relative">
              Ready to get{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">compliant?</span>
            </h2>
            <p className="text-lg text-white/50 mb-8 max-w-md mx-auto relative">
              14-day free trial. No credit card. No commitment.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center relative">
              <button onClick={startTrial} className="px-10 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 font-bold rounded-2xl transition-all shadow-xl shadow-purple-900/50 text-lg">
                Start Your Free Trial
              </button>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 px-10 py-4 bg-green-600/20 hover:bg-green-600/30 border border-green-500/40 font-bold rounded-2xl transition-all text-green-300 text-lg">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                WhatsApp Us
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── STICKY MOBILE CTA BAR ─────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-slate-900/95 backdrop-blur-xl border-t border-white/10 px-4 py-3 flex gap-3">
        <button onClick={startTrial} className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 font-bold rounded-xl transition-all text-sm shadow-lg">
          Start Free Trial
        </button>
        <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600/20 border border-green-500/40 font-bold rounded-xl text-green-300 text-sm">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
          </a>
      </div>

      {/* ─── FOOTER ────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] py-14 pb-24 md:pb-14 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <img src="/isoguardian-logo.png" alt="ISOGuardian" className="w-8 h-8 object-contain" />
                <span className="font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">ISOGuardian{'\u2122'}</span>
              </div>
              <p className="text-[11px] text-white/30 leading-relaxed">
                Your Shield Against Non-Compliance.{'\n'}Built in South Africa, for South Africa.
              </p>
            </div>

            <div>
              <p className="text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-3">Product</p>
              <ul className="space-y-2 text-sm text-white/40">
                <li><button onClick={() => scrollTo('features')} className="hover:text-white transition-colors">Features</button></li>
                <li><button onClick={() => scrollTo('pricing')} className="hover:text-white transition-colors">Pricing</button></li>
                <li><button onClick={() => scrollTo('assessment')} className="hover:text-white transition-colors">ISO Assessment</button></li>
                <li><button onClick={() => scrollTo('templates')} className="hover:text-white transition-colors">Templates</button></li>
                <li><button onClick={() => navigate('/login')} className="hover:text-white transition-colors">Login</button></li>
              </ul>
            </div>

            <div>
              <p className="text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-3">Legal</p>
              <ul className="space-y-2 text-sm text-white/40">
                <li><a href="/terms" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="/popia" className="hover:text-white transition-colors">Privacy & POPIA</a></li>
              </ul>
            </div>

            <div>
              <p className="text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-3">Company</p>
              <ul className="space-y-2 text-sm text-white/40">
                <li><a href="/docs/ISOGuardian_Company_Profile_2026.pdf" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Company Profile</a></li>
                <li><a href="/consultation" className="hover:text-white transition-colors">Book Consultation</a></li>
                <li><a href="/reseller-programme" className="hover:text-white transition-colors">Reseller Programme</a></li>
                <li><a href="/affiliate" className="hover:text-white transition-colors">Affiliate Programme</a></li>
                <li><a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-white transition-colors">Email Support</a></li>
                <li><a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">WhatsApp</a></li>
              </ul>
            </div>

            <div>
              <p className="text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-3">Standards</p>
              <ul className="space-y-2 text-sm text-white/40">
                <li><button onClick={() => scrollTo('standards')} className="hover:text-white transition-colors">ISO 9001:2015</button></li>
                <li><button onClick={() => scrollTo('standards')} className="hover:text-white transition-colors">ISO 14001:2015</button></li>
                <li><button onClick={() => scrollTo('standards')} className="hover:text-white transition-colors">ISO 45001:2018</button></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/[0.06] pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-[11px] text-white/25">
            <p>{'\u00a9'} {new Date().getFullYear()} ISOGuardian (Pty) Ltd. All rights reserved.</p>
            <p>{SUPPORT_EMAIL}</p>
            <p>Registered in South Africa {'\u00b7'} Reg: 2026/082362/07</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useFadeIn, useStaggerFadeIn, useHeroParallax } from '../hooks/useAnimations'
import { useReferralTracking } from '../hooks/useReferralTracking'
import ReadinessAssessment from '../components/landing/ReadinessAssessment'

import { trackConversion } from '../lib/analytics'

/* ─── Animated counter (scroll-triggered) ─── */
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

/* ─── Scroll progress bar ─── */
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
      <div className="h-full bg-cyan-500 transition-[width] duration-100" style={{ width: `${progress}%` }} />
    </div>
  )
}

/* ─── Typewriter cycling text ─── */
function TypewriterText({ phrases, interval = 2500 }) {
  const [index, setIndex] = useState(0)
  const [text, setText] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const phrase = phrases[index]
    const speed = deleting ? 25 : 45

    if (!deleting && text === phrase) {
      const t = setTimeout(() => setDeleting(true), interval)
      return () => clearTimeout(t)
    }
    if (deleting && text === '') {
      setDeleting(false)
      setIndex(i => (i + 1) % phrases.length)
      return
    }
    const t = setTimeout(() => {
      setText(deleting ? text.slice(0, -1) : phrase.slice(0, text.length + 1))
    }, speed)
    return () => clearTimeout(t)
  }, [text, deleting, index, phrases, interval])

  return (
    <span className="text-cyan-400">
      {text}
      <span className="inline-block w-[2px] h-[1.1em] bg-cyan-400 ml-0.5 align-text-bottom animate-cursor-blink" />
    </span>
  )
}

/* ─── WhatsApp SVG (reused in nav, CTA, footer) ─── */
const WhatsAppIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
)

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

  const problemRef = useFadeIn()
  const featuresRef = useFadeIn()
  const standardsRef = useFadeIn()
  const pricingRef = useFadeIn()
  const testimonialsRef = useFadeIn()
  const faqRef = useFadeIn()
  const ctaRef = useFadeIn()
  const featuresStaggerRef = useStaggerFadeIn(100)
  const pricingStaggerRef = useStaggerFadeIn(100)
  const heroParallaxRef = useHeroParallax()

  const bookDemo = () => {
    trackConversion('demo_request')
    setMobileMenuOpen(false)
    document.getElementById('assessment')?.scrollIntoView({ behavior: 'smooth' })
  }

  const tryInteractiveDemo = () => {
    trackConversion('demo_interactive')
    navigate('/demo')
  }

  return (
    <div className="min-h-screen bg-[#050a14] text-white overflow-x-hidden font-outfit">
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

      {/* ═══ NAV ═══════════════════════════════════════════════════════════ */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-[#050a14]/80 backdrop-blur-2xl border-b border-white/[0.06]' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img src="/isoguardian-logo.png" alt="ISOGuardian" className="w-10 h-10 object-contain" />
            <span className="text-xl font-bold text-white tracking-tight">ISOGuardian</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/35">
            {[
              ['features', 'Features'],
              ['standards', 'Standards'],
              ['assessment', 'Assessment'],
              ['pricing', 'Pricing'],
              ['faq', 'FAQ'],
            ].map(([id, label]) => (
              <button key={id} onClick={() => scrollTo(id)} className="hover:text-white transition-colors duration-300">
                {label}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="p-2.5 text-green-400/40 hover:text-green-400 transition-colors" title="WhatsApp Us">
              <WhatsAppIcon className="w-[18px] h-[18px]" />
            </a>
            <button onClick={() => navigate('/login')} className="px-5 py-2.5 text-sm font-medium text-white/50 hover:text-white transition-colors">
              Sign in
            </button>
            <button onClick={tryInteractiveDemo} className="px-5 py-2.5 text-sm font-medium text-white/50 hover:text-white transition-colors">
              See Demo
            </button>
            <button onClick={bookDemo} className="px-5 py-2.5 text-sm font-semibold bg-white text-[#050a14] rounded-xl hover:bg-white/90 transition-all">
              Book a Demo
            </button>
          </div>

          <button className="md:hidden p-2 text-white/40 hover:text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-[#050a14]/95 backdrop-blur-2xl border-t border-white/[0.06] px-6 py-4 space-y-3">
            {['features', 'standards', 'assessment', 'pricing', 'faq'].map(id => (
              <button key={id} onClick={() => scrollTo(id)} className="block w-full text-left text-white/40 hover:text-white py-2 capitalize">{id}</button>
            ))}
            <button onClick={() => { setMobileMenuOpen(false); navigate('/login') }} className="block w-full text-left text-white/40 hover:text-white py-2">Sign in</button>
            <button onClick={() => { setMobileMenuOpen(false); tryInteractiveDemo() }} className="block w-full text-left text-white/40 hover:text-white py-2">See Demo</button>
            <button onClick={() => { setMobileMenuOpen(false); bookDemo() }} className="block w-full text-center py-3 mt-2 bg-white text-[#050a14] rounded-xl font-semibold text-sm">Book a Demo</button>
          </div>
        )}
      </nav>

      {/* ═══ HERO ══════════════════════════════════════════════════════════ */}
      <section ref={heroParallaxRef} className="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden" style={{ transform: 'translateY(var(--parallax-y, 0px))', opacity: 'var(--parallax-opacity, 1)' }}>
        {/* Breathing mesh gradient — GPU-accelerated transforms */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-[700px] h-[700px] -top-52 left-[5%] bg-cyan-500/[0.07] rounded-full blur-[140px] animate-mesh-1" />
          <div className="absolute w-[500px] h-[500px] bottom-[-15%] right-[0%] bg-cyan-400/[0.04] rounded-full blur-[120px] animate-mesh-2" />
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center relative z-10">
          <div>
            <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-white/[0.04] border border-white/[0.06] rounded-full text-xs font-medium text-white/40 mb-10 animate-reveal-up" style={{ animationDelay: '0s' }}>
              <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
              ISO Compliance Platform {'\u2014'} South Africa
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[3.75rem] font-extrabold leading-[1.08] mb-8 tracking-tight">
              {['Your', 'Shield', 'Against'].map((word, i) => (
                <span key={word} className="inline-block animate-reveal-up" style={{ animationDelay: `${0.1 + i * 0.08}s` }}>
                  {word}{' '}
                </span>
              ))}
              <br className="hidden sm:block" />
              <span className="inline-block animate-reveal-up bg-gradient-to-r from-cyan-400 to-cyan-200 bg-clip-text text-transparent" style={{ animationDelay: '0.35s' }}>
                Non-Compliance.
              </span>
            </h1>

            <div className="text-lg md:text-xl text-white/35 mb-10 leading-relaxed max-w-lg animate-reveal-up min-h-[2em]" style={{ animationDelay: '0.5s' }}>
              <TypewriterText phrases={[
                'Automate document control.',
                'Close NCRs faster.',
                'Stay audit-ready, always.',
                'Score compliance in real-time.',
              ]} />
            </div>

            <div className="flex flex-wrap gap-4 animate-reveal-up" style={{ animationDelay: '0.6s' }}>
              <button onClick={bookDemo} className="group px-8 py-4 bg-white text-[#050a14] font-bold rounded-2xl transition-all text-lg hover:bg-white/90 hover:shadow-xl hover:shadow-white/5">
                Book a Demo
                <span className="inline-block ml-2 transition-transform group-hover:translate-x-1">{'\u2192'}</span>
              </button>
              <button onClick={tryInteractiveDemo} className="px-8 py-4 border border-white/[0.08] hover:border-white/20 font-semibold rounded-2xl transition-all text-lg text-white/40 hover:text-white/70">
                Try the Interactive Demo
              </button>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-12 text-xs text-white/25 animate-reveal-up" style={{ animationDelay: '0.75s' }}>
              {['POPIA Compliant', 'AES-256 Encrypted', 'ISO 9001 \u00b7 14001 \u00b7 45001', 'SA-Built Platform'].map(t => (
                <span key={t} className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-cyan-500/50" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Dashboard mockup — clean, no decorative elements */}
          <div className="relative hidden lg:block animate-reveal-up" style={{ animationDelay: '0.4s' }}>
            <div className="relative bg-white/[0.025] border border-white/[0.06] rounded-2xl p-6 shadow-2xl shadow-black/40">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-[10px] text-white/25 uppercase tracking-[0.15em] font-medium">Compliance Dashboard</p>
                  <p className="font-semibold text-white/80 text-sm mt-1">Simathemba Holdings</p>
                </div>
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-white/[0.08]" />
                  <div className="w-2 h-2 rounded-full bg-white/[0.08]" />
                  <div className="w-2 h-2 rounded-full bg-white/[0.08]" />
                </div>
              </div>

              <div className="space-y-4 mb-5">
                {[
                  { label: 'ISO 9001:2015', score: 87 },
                  { label: 'ISO 14001:2015', score: 74 },
                  { label: 'ISO 45001:2018', score: 91 },
                ].map(({ label, score }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-white/30">{label}</span>
                      <span className="text-white/70 font-semibold tabular-nums"><AnimatedCounter target={score} /></span>
                    </div>
                    <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${score}%`, transition: 'width 1.8s cubic-bezier(0.16, 1, 0.3, 1)' }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Open NCRs', value: '3', color: 'text-amber-400/80' },
                  { label: 'Audits Due', value: '1', color: 'text-red-400/80' },
                  { label: 'Docs Active', value: '47', color: 'text-cyan-400/80' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-white/[0.02] rounded-xl p-3 text-center border border-white/[0.04]">
                    <p className={`text-lg font-bold tabular-nums ${color}`}>{value}</p>
                    <p className="text-[10px] text-white/25 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/10 animate-bounce">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
          </svg>
        </div>
      </section>

      {/* ═══ PROBLEM ═══════════════════════════════════════════════════════ */}
      <section id="features" ref={problemRef} className="py-32">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <h2 className="text-2xl md:text-4xl font-extrabold text-center mb-16 leading-tight">
            Manual compliance is costing you<br className="hidden md:block" />
            <span className="text-red-400/80">time, money, and certification.</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              { title: 'Spreadsheet Chaos', desc: 'Version nightmares. No audit trail. Nobody knows which document is current.', icon: 'M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 0 0-1.883 2.542l.857 6a2.25 2.25 0 0 0 2.227 1.932H19.05a2.25 2.25 0 0 0 2.227-1.932l.857-6a2.25 2.25 0 0 0-1.883-2.542m-16.5 0V6A2.25 2.25 0 0 1 6 3.75h3.879a1.5 1.5 0 0 1 1.06.44l2.122 2.12a1.5 1.5 0 0 0 1.06.44H18A2.25 2.25 0 0 1 20.25 9v.776', color: 'text-red-400/60' },
              { title: 'Missed Audits & NCRs', desc: 'Non-conformances raised on paper, never closed. Auditors find open issues from months ago.', icon: 'M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z', color: 'text-amber-400/60' },
              { title: 'Audit Prep Panic', desc: 'Weeks scrambling to compile evidence. Management reviews undocumented. Gaps everywhere.', icon: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z', color: 'text-red-400/60' },
            ].map(({ title, desc, icon, color }) => (
              <div key={title} className="rounded-2xl border border-white/[0.06] p-6 bg-white/[0.015] transition-all hover:border-white/[0.1]">
                <svg className={`w-6 h-6 ${color} mb-4`} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                </svg>
                <h3 className="font-bold text-white/85 mb-2">{title}</h3>
                <p className="text-white/35 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <p className="text-center mt-16 text-lg font-semibold text-cyan-400">
            ISOGuardian changes all of that.
          </p>
        </div>
      </section>

      {/* ═══ FEATURES — Clean Bento Grid ═══════════════════════════════════ */}
      <section ref={featuresRef} className="py-32">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <h2 className="text-2xl md:text-4xl font-extrabold text-center mb-4">Everything you need. Nothing you don{'\u2019'}t.</h2>
          <p className="text-center text-white/30 mb-16">Six modules. One platform. Zero spreadsheets.</p>

          <div ref={featuresStaggerRef} className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {[
              { title: 'Document Control', desc: 'Upload, organise, version, and retrieve. Automated numbering. Full audit trail.', icon: 'M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z', span: 'md:col-span-2' },
              { title: 'NCR Tracking', desc: 'Full lifecycle from creation through corrective action to verified closure.', icon: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z', span: '' },
              { title: 'Audit Management', desc: 'Schedule, execute, and close-out per ISO 19011. Auditor portal included.', icon: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9l2 2 4-4', span: '' },
              { title: 'Compliance Scoring', desc: 'Clause-by-clause scoring across all three standards. See exactly where you stand.', icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z', span: 'md:col-span-2' },
              { title: 'Management Reviews', desc: 'ISO 9.3 compliant. Meeting minutes, decisions, action items — all tracked.', icon: 'M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z', span: '' },
              { title: 'Branded PDF Exports', desc: 'Your logo, your numbering, your brand. Professional documents in one click.', icon: 'M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3', span: '' },
              { title: 'Activity Trail', desc: 'Every action logged. ISO 7.5.3 traceability built in.', icon: 'M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z', span: '' },
            ].map(({ title, desc, icon, span }) => (
              <div
                data-stagger
                key={title}
                className={`${span} group border border-white/[0.05] rounded-2xl p-5 md:p-6 bg-white/[0.015] transition-all duration-300 hover:border-cyan-500/15 hover:bg-white/[0.03]`}
              >
                <svg className="w-5 h-5 text-cyan-500/60 mb-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                </svg>
                <h3 className="font-semibold text-white/85 mb-1.5 text-sm md:text-base">{title}</h3>
                <p className="text-white/30 text-xs md:text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ STANDARDS ═════════════════════════════════════════════════════ */}
      <section id="standards" ref={standardsRef} className="py-32">
        <div className="max-w-5xl mx-auto px-4 md:px-6 text-center">
          <h2 className="text-2xl md:text-4xl font-extrabold mb-4">Three standards. One platform.</h2>
          <p className="text-white/30 mb-16 max-w-xl mx-auto">Manage integrated management systems without switching tools.</p>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              { standard: 'ISO 9001:2015', subtitle: 'Quality Management', desc: 'Document control, process management, customer satisfaction, continual improvement.', accent: 'border-t-cyan-500' },
              { standard: 'ISO 14001:2015', subtitle: 'Environmental Management', desc: 'Environmental aspects, legal compliance, waste management, pollution prevention.', accent: 'border-t-emerald-500' },
              { standard: 'ISO 45001:2018', subtitle: 'OH&S Management', desc: 'Hazard identification, risk assessment, incident investigation, worker participation.', accent: 'border-t-amber-500' },
            ].map(({ standard, subtitle, desc, accent }) => (
              <div key={standard} className={`border border-white/[0.05] ${accent} border-t-2 rounded-2xl p-6 bg-white/[0.015] hover:bg-white/[0.03] transition-all text-left`}>
                <span className="text-[11px] font-semibold text-white/30 tracking-[0.12em] uppercase">{standard}</span>
                <h3 className="font-bold text-white/90 text-lg mb-2 mt-2">{subtitle}</h3>
                <p className="text-white/35 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS — Connected Stepper ═════════════════════════════ */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-16">
            Up and running in <span className="text-cyan-400">four steps.</span>
          </h2>

          <div className="relative">
            <div className="hidden md:block absolute top-6 left-[12.5%] right-[12.5%] h-[1px] bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { step: '01', title: 'Sign Up', desc: 'Create your account in under 2 minutes.' },
                { step: '02', title: 'Upload', desc: 'Import existing docs or start fresh.' },
                { step: '03', title: 'Track', desc: 'NCRs, audits, reviews — all in one place.' },
                { step: '04', title: 'Get Certified', desc: 'Walk into your audit with confidence.' },
              ].map(({ step, title, desc }) => (
                <div key={step} className="text-center relative">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full border border-white/[0.08] bg-white/[0.03] flex items-center justify-center">
                    <span className="text-sm font-bold text-cyan-400/70 tabular-nums">{step}</span>
                  </div>
                  <h3 className="font-bold text-white/85 text-sm mb-1">{title}</h3>
                  <p className="text-white/25 text-xs leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ ISO READINESS ASSESSMENT ═════════════════════════════════════ */}
      <ReadinessAssessment />

      {/* ═══ PRICING ═══════════════════════════════════════════════════════ */}
      <section id="pricing" ref={pricingRef} className="py-32">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <h2 className="text-2xl md:text-4xl font-extrabold text-center mb-3">
            Starting from <span className="text-cyan-400">R2,000&nbsp;/&nbsp;month</span>
          </h2>
          <p className="text-center text-white/30 mb-14">80% cheaper than enterprise competitors. Same power.</p>

          <div ref={pricingStaggerRef} className="grid md:grid-cols-3 gap-4 items-stretch">
            {[
              {
                tier: 'Starter', subtitle: '1\u201310 users', highlight: false, cta: 'demo',
                features: ['Up to 10 users', '5GB storage', 'ISO 9001, 14001 & 45001', 'Document management', 'NCR tracking', 'Audit scheduling', 'Compliance scoring', 'Branded PDF exports', 'Email support'],
              },
              {
                tier: 'Growth', subtitle: '11\u201320 users', highlight: true, cta: 'demo',
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
                    ? 'bg-white/[0.04] border-2 border-cyan-500/25 md:-my-3 shadow-xl shadow-cyan-900/10'
                    : 'bg-white/[0.015] border border-white/[0.06]'
                }`}
              >
                {highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-cyan-500 text-[#050a14] rounded-full text-xs font-bold whitespace-nowrap">
                    Most Popular
                  </div>
                )}
                <h3 className="text-lg font-bold text-white mb-0.5">{tier}</h3>
                <span className="text-white/25 text-sm mb-5">{subtitle}</span>
                <ul className="space-y-2.5 flex-1 mb-6">
                  {features.map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-white/45">
                      <svg className="w-4 h-4 text-cyan-500/40 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                {cta === 'demo' ? (
                  <button onClick={bookDemo} className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${highlight ? 'bg-white text-[#050a14] hover:bg-white/90 shadow-lg shadow-white/5' : 'border border-white/[0.08] hover:border-white/20 text-white/50 hover:text-white'}`}>
                    Book a Demo
                  </button>
                ) : (
                  <a href={`mailto:${SUPPORT_EMAIL}?subject=Enterprise%20Pricing%20Enquiry`} className="w-full text-center py-3 rounded-xl font-semibold text-sm transition-all border border-white/[0.08] hover:border-white/20 text-white/50 hover:text-white block">
                    Contact Sales
                  </a>
                )}
              </div>
            ))}
          </div>

          <p className="text-center text-[11px] text-white/15 mt-8">
            All plans include ISO 9001, 14001 & 45001 {'\u00b7'} 12-month term {'\u00b7'} 5-day CPA cooling-off {'\u00b7'} ZAR excl. VAT
          </p>
        </div>
      </section>

      {/* ═══ COMPARISON TABLE ═════════════════════════════════════════════ */}
      <section className="py-32">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-3xl font-extrabold mb-4">
              Why businesses switch to ISOGuardian
            </h2>
            <p className="text-white/30 max-w-xl mx-auto text-sm">
              See how ISOGuardian compares to spreadsheets, manual systems, and expensive enterprise tools.
            </p>
          </div>

          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="text-left py-3 px-4 text-white/25 font-medium text-xs uppercase tracking-wider w-[35%]">Feature</th>
                  <th className="text-center py-3 px-4 text-white/25 font-medium text-xs uppercase tracking-wider">Spreadsheets</th>
                  <th className="text-center py-3 px-4 text-white/25 font-medium text-xs uppercase tracking-wider">Enterprise</th>
                  <th className="text-center py-3 px-4 text-cyan-400/80 font-bold text-xs uppercase tracking-wider">ISOGuardian</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'ISO 9001, 14001 & 45001', spreadsheet: false, enterprise: true, iso: true },
                  { feature: 'Document control & versioning', spreadsheet: false, enterprise: true, iso: true },
                  { feature: 'NCR tracking & close-out', spreadsheet: false, enterprise: true, iso: true },
                  { feature: 'Audit scheduling & reports', spreadsheet: false, enterprise: true, iso: true },
                  { feature: 'External auditor portal', spreadsheet: false, enterprise: false, iso: true },
                  { feature: 'POPIA compliant (SA law)', spreadsheet: false, enterprise: false, iso: true },
                  { feature: 'ZAR pricing, no forex risk', spreadsheet: true, enterprise: false, iso: true },
                  { feature: 'Setup in under 10 minutes', spreadsheet: true, enterprise: false, iso: true },
                  { feature: 'Real-time compliance scoring', spreadsheet: false, enterprise: true, iso: true },
                  { feature: 'Automated email reminders', spreadsheet: false, enterprise: true, iso: true },
                  { feature: 'Multi-company (reseller) support', spreadsheet: false, enterprise: false, iso: true },
                  { feature: 'From R67/day', spreadsheet: true, enterprise: false, iso: true },
                ].map(({ feature, spreadsheet, enterprise }, i) => (
                  <tr key={feature} className={i % 2 === 0 ? 'bg-white/[0.01]' : ''}>
                    <td className="py-3 px-4 text-white/45 font-medium text-xs md:text-sm">{feature}</td>
                    <td className="py-3 px-4 text-center">
                      {spreadsheet
                        ? <span className="text-amber-400/50 text-xs">~</span>
                        : <span className="text-white/10">{'\u2014'}</span>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {enterprise
                        ? <span className="text-amber-400/50 text-xs">~</span>
                        : <span className="text-white/10">{'\u2014'}</span>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <svg className="w-4 h-4 text-cyan-500/60 mx-auto" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ═══ SOCIAL PROOF / STATS ═════════════════════════════════════════ */}
      <section className="py-28">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-20">
            {[
              { value: '3', label: 'ISO Standards', desc: '9001, 14001 & 45001' },
              { value: '100%', label: 'POPIA Compliant', desc: 'Data isolation by design' },
              { value: '<10min', label: 'Setup Time', desc: 'Sign up to first upload' },
              { value: 'R67/day', label: 'From Just', desc: 'Less than a coffee meeting' },
            ].map(({ value, label, desc }) => (
              <div key={label} className="text-center bg-white/[0.015] border border-white/[0.05] rounded-2xl p-5 md:p-6 transition-transform hover:scale-[1.02]">
                <p className="text-2xl md:text-3xl font-extrabold text-cyan-400 mb-1 tabular-nums">{value}</p>
                <p className="text-white/70 font-semibold text-xs md:text-sm">{label}</p>
                <p className="text-white/20 text-[10px] md:text-xs mt-1">{desc}</p>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              { title: 'South African First', desc: 'ZAR pricing, SAST support, POPIA-compliant, designed for SA regulatory requirements.', icon: 'M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418' },
              { title: '80% Cheaper', desc: 'Enterprise tools charge R12,000+/mo. ISOGuardian starts at R2,000/mo with no setup fees.', icon: 'M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z' },
              { title: 'Audit-Ready Every Day', desc: 'No more 3-week audit prep scrambles. Your compliance stays current so audits become a non-event.', icon: 'M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z' },
            ].map(({ title, desc, icon }) => (
              <div key={title} className="bg-white/[0.015] border border-white/[0.05] rounded-2xl p-6 transition-all hover:border-white/[0.1]">
                <svg className="w-6 h-6 text-cyan-500/50 mb-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                </svg>
                <h3 className="font-bold text-white/85 mb-1.5">{title}</h3>
                <p className="text-white/30 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SECURITY ═════════════════════════════════════════════════════ */}
      <section className="py-14">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-white/25">
            {[
              { icon: 'M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z', text: 'AES-256 Encryption' },
              { icon: 'M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z', text: 'Row-Level Security' },
              { icon: 'M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21', text: 'SOC 2 Type II Hosting' },
              { icon: 'M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3', text: 'POPIA Compliant' },
            ].map(({ icon, text }) => (
              <span key={text} className="flex items-center gap-2">
                <svg className="w-4 h-4 text-white/15" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                </svg>
                {text}
              </span>
            ))}
            <a href="/popia" className="text-cyan-500/40 hover:text-cyan-400 transition-colors text-xs">Full security details {'\u2192'}</a>
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═════════════════════════════════════════════════ */}
      <section ref={testimonialsRef} className="py-32">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-14">What our clients say</h2>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Lulu Mahlulo',
                role: 'Director, Simathemba Holdings',
                quote: 'ISOGuardian transformed how we manage compliance for our clients. The document control and NCR tracking alone saved us hours every week. It is exactly what SA businesses need.',
              },
              {
                name: 'Thabo M.',
                role: 'Quality Manager, Manufacturing',
                quote: 'We used to spend 3 weeks preparing for audits. With ISOGuardian, our compliance data is always current. Our last surveillance audit was the smoothest we have ever had.',
              },
              {
                name: 'Priya N.',
                role: 'SHEQ Coordinator, Construction',
                quote: 'The pricing is fair for SA companies, not like overseas tools that charge in dollars. And the support team actually understands our local compliance requirements.',
              },
            ].map((t, i) => (
              <div key={i} className="bg-white/[0.015] border border-white/[0.05] rounded-2xl p-6 hover:border-white/[0.1] transition-all relative">
                <svg className="absolute top-5 right-5 w-8 h-8 text-white/[0.03]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <svg key={j} className="w-3.5 h-3.5 text-amber-400/60" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-white/40 text-sm leading-relaxed mb-5">{'\u201C'}{t.quote}{'\u201D'}</p>
                <div>
                  <p className="font-semibold text-white/75 text-sm">{t.name}</p>
                  <p className="text-white/25 text-xs">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FAQ ══════════════════════════════════════════════════════════ */}
      <section id="faq" ref={faqRef} className="py-32">
        <div className="max-w-2xl mx-auto px-4 md:px-6">
          <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-14">Frequently Asked Questions</h2>
          <div className="space-y-2">
            {[
              { q: 'Will ISOGuardian certify my company?', a: 'No. ISOGuardian is a compliance management tool that helps you prepare for and maintain ISO certification. You still need an accredited certification body for your official audit. We make the journey significantly easier.' },
              { q: 'Which ISO standards are supported?', a: 'ISO 9001:2015 (Quality), ISO 14001:2015 (Environmental), and ISO 45001:2018 (Occupational Health & Safety). ISO 27001:2022 is on our roadmap.' },
              { q: 'Is my data safe?', a: 'Yes. AES-256 encryption at rest, TLS 1.2+ in transit, strict row-level data isolation between companies, POPIA-compliant. You can export or delete your data at any time.' },
              { q: 'Can I manage multiple standards at once?', a: 'Absolutely. Documents, NCRs, and audits can all be tagged to specific standards across all three simultaneously.' },
              { q: 'How do I get started?', a: 'Book a demo with our team. We\u2019ll walk you through ISOGuardian, confirm the right tier for your team size, countersign a subscription agreement, and then provision your account so you can start uploading documents on day one.' },
              { q: 'Do you support consultants and resellers?', a: 'Yes. Our Reseller Programme lets consultants manage multiple clients from one dashboard with recurring commissions. See our Reseller Programme page for details.' },
              { q: 'Can I buy individual templates without subscribing?', a: 'Yes. Templates are available for one-time purchase starting at R250. Subscribers get all templates free.' },
            ].map((faq, i) => (
              <div key={i} className="border border-white/[0.05] rounded-xl overflow-hidden bg-white/[0.01]">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-5 py-4 text-left">
                  <span className="font-semibold text-white/80 text-sm pr-4">{faq.q}</span>
                  <svg className={`w-4 h-4 text-white/20 shrink-0 transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="px-5 pb-4 text-white/35 text-sm leading-relaxed">{faq.a}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══════════════════════════════════════════════════ */}
      <section id="contact" ref={ctaRef} className="py-32">
        <div className="max-w-3xl mx-auto px-4 md:px-6">
          <div className="relative bg-white/[0.025] border border-white/[0.06] rounded-3xl p-10 md:p-16 text-center overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-24 bg-cyan-500/[0.08] blur-[80px] rounded-full" />

            <h2 className="text-3xl md:text-5xl font-extrabold mb-5 relative">
              Ready to get{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-cyan-200 bg-clip-text text-transparent">compliant?</span>
            </h2>
            <p className="text-lg text-white/35 mb-10 max-w-md mx-auto relative">
              Join South African companies already managing compliance smarter.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center relative">
              <button onClick={bookDemo} className="px-10 py-4 bg-white text-[#050a14] font-bold rounded-2xl transition-all hover:bg-white/90 hover:shadow-xl hover:shadow-white/5 text-lg">
                Book a Demo
              </button>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2.5 px-10 py-4 border border-green-500/20 hover:border-green-500/40 font-bold rounded-2xl transition-all text-green-400/70 hover:text-green-400 text-lg">
                <WhatsAppIcon />
                WhatsApp Us
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── STICKY MOBILE CTA BAR ─── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#050a14]/95 backdrop-blur-2xl border-t border-white/[0.06] px-4 py-2.5">
        <div className="flex gap-3">
          <button onClick={bookDemo} className="flex-1 py-3 bg-white text-[#050a14] font-bold rounded-xl transition-all text-sm">
            Book a Demo
          </button>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 px-4 py-3 border border-green-500/20 font-bold rounded-xl text-green-400/70 text-sm">
            <WhatsAppIcon className="w-5 h-5" />
          </a>
        </div>
        <p className="text-center text-[10px] text-white/15 mt-1">ISO 9001 · 14001 · 45001</p>
      </div>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-white/[0.04] py-14 pb-24 md:pb-14">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <img src="/isoguardian-logo.png" alt="ISOGuardian" className="w-8 h-8 object-contain" />
                <span className="font-bold text-white/80 tracking-tight">ISOGuardian</span>
              </div>
              <p className="text-[11px] text-white/20 leading-relaxed">
                Your Shield Against Non-Compliance.{'\n'}Built in South Africa, for South Africa.
              </p>
            </div>

            <div>
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-[0.15em] mb-3">Product</p>
              <ul className="space-y-2 text-sm text-white/30">
                <li><button onClick={() => scrollTo('features')} className="hover:text-white/70 transition-colors">Features</button></li>
                <li><button onClick={() => scrollTo('pricing')} className="hover:text-white/70 transition-colors">Pricing</button></li>
                <li><button onClick={() => scrollTo('assessment')} className="hover:text-white/70 transition-colors">ISO Assessment</button></li>
                <li><button onClick={() => navigate('/login')} className="hover:text-white/70 transition-colors">Login</button></li>
              </ul>
            </div>

            <div>
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-[0.15em] mb-3">Legal</p>
              <ul className="space-y-2 text-sm text-white/30">
                <li><a href="/terms" className="hover:text-white/70 transition-colors">Terms of Service</a></li>
                <li><a href="/popia" className="hover:text-white/70 transition-colors">Privacy & POPIA</a></li>
              </ul>
            </div>

            <div>
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-[0.15em] mb-3">Company</p>
              <ul className="space-y-2 text-sm text-white/30">
                <li><a href="/docs/ISOGuardian_Company_Profile_2026.pdf" target="_blank" rel="noopener noreferrer" className="hover:text-white/70 transition-colors">Company Profile</a></li>
                <li><a href="/consultation" className="hover:text-white/70 transition-colors">Book Consultation</a></li>
                <li><a href="/reseller-programme" className="hover:text-white/70 transition-colors">Reseller Programme</a></li>
                <li><a href="/affiliate" className="hover:text-white/70 transition-colors">Affiliate Programme</a></li>
                <li><a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-white/70 transition-colors">Email Support</a></li>
                <li><a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="hover:text-white/70 transition-colors">WhatsApp</a></li>
              </ul>
            </div>

            <div>
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-[0.15em] mb-3">Standards</p>
              <ul className="space-y-2 text-sm text-white/30">
                <li><button onClick={() => scrollTo('standards')} className="hover:text-white/70 transition-colors">ISO 9001:2015</button></li>
                <li><button onClick={() => scrollTo('standards')} className="hover:text-white/70 transition-colors">ISO 14001:2015</button></li>
                <li><button onClick={() => scrollTo('standards')} className="hover:text-white/70 transition-colors">ISO 45001:2018</button></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/[0.04] pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-[11px] text-white/15">
            <p>{'\u00a9'} {new Date().getFullYear()} ISOGuardian (Pty) Ltd. All rights reserved.</p>
            <p>{SUPPORT_EMAIL}</p>
            <p>Registered in South Africa {'\u00b7'} Reg: 2026/082362/07</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

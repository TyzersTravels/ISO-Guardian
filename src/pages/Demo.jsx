import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import PublicLayout from '../components/PublicLayout'
import MockDashboard from '../components/demo/MockDashboard'
import MockDocuments from '../components/demo/MockDocuments'
import MockNCRs from '../components/demo/MockNCRs'
import MockCompliance from '../components/demo/MockCompliance'
import MockReseller from '../components/demo/MockReseller'
import DemoTour from '../components/demo/DemoTour'
import RealtimeActivity from '../components/demo/RealtimeActivity'
import CloseNCRToast from '../components/demo/CloseNCRToast'

const SectionLabel = ({ number, label }) => (
  <div className="flex items-center gap-3 mb-4">
    <span className="font-mono text-[11px] font-bold text-cyan-300/70 tracking-[0.2em]">
      {number}
    </span>
    <span className="h-px flex-1 bg-gradient-to-r from-cyan-400/30 via-white/10 to-transparent" />
    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">
      {label}
    </span>
  </div>
)

const Demo = () => {
  const navigate = useNavigate()
  const [closedNcrs, setClosedNcrs] = useState(() => new Set())
  const [toastVisible, setToastVisible] = useState(false)
  const [flashTarget, setFlashTarget] = useState(null)

  const dashboardRef = useRef(null)
  const complianceRef = useRef(null)

  const ncr014Closed = closedNcrs.has('IG-DEMO-NCR-014')
  const iso9001Score = 84 + (ncr014Closed ? 2 : 0)
  const openNcrCount = 7 - closedNcrs.size

  const closeNcr = (number) => {
    setClosedNcrs((prev) => {
      if (prev.has(number)) return prev
      const next = new Set(prev)
      next.add(number)
      return next
    })
    setTimeout(() => setToastVisible(true), 1800)
  }

  const jumpTo = (target) => {
    const el = target === 'dashboard' ? dashboardRef.current : complianceRef.current
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setFlashTarget(target)
    setTimeout(() => setFlashTarget(null), 2200)
  }

  const bookDemo = () => {
    navigate('/')
    setTimeout(() => {
      const el = document.getElementById('consultation')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 250)
  }

  return (
    <>
      <Helmet>
        <title>Interactive Demo {'\u2014'} ISOGuardian</title>
        <meta
          name="description"
          content="See ISOGuardian in action with an interactive guided tour. Explore dashboards, documents, NCRs, compliance scoring and reseller tools — no signup required."
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://isoguardian.co.za/demo" />
        <meta property="og:title" content="ISOGuardian Interactive Demo" />
        <meta property="og:description" content="A guided walkthrough of ISO 9001, 14001, and 45001 compliance management — no signup required." />
        <meta property="og:url" content="https://isoguardian.co.za/demo" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="ISOGuardian Interactive Demo" />
        <meta name="twitter:description" content="A guided walkthrough of ISO 9001, 14001, and 45001 compliance management." />
      </Helmet>

      <PublicLayout>
        <div className="relative">
          {/* Ambient mesh gradient backdrop, matching landing hero */}
          <div className="absolute inset-x-0 -top-20 h-[520px] overflow-hidden pointer-events-none -z-0">
            <div className="absolute w-[700px] h-[700px] -top-40 left-[10%] bg-cyan-500/[0.06] rounded-full blur-[160px]" />
            <div className="absolute w-[500px] h-[500px] top-10 right-[5%] bg-purple-500/[0.08] rounded-full blur-[130px]" />
          </div>

          <div className="relative z-10 space-y-14">
            {/* Hero */}
            <header className="pt-6 sm:pt-10">
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60">
                  Live Demo Environment
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-extrabold leading-[1.05] text-white max-w-4xl">
                A 60-second tour of{' '}
                <span className="bg-gradient-to-r from-cyan-300 via-sky-300 to-purple-300 bg-clip-text text-transparent">
                  ISO compliance that runs itself.
                </span>
              </h1>
              <p className="mt-5 text-base sm:text-lg text-white/55 max-w-2xl leading-relaxed">
                Seeded with fictional data from <span className="text-white/80 font-semibold">Acme Manufacturing (Pty) Ltd</span>. Nothing you see writes to a database. When you are ready,{' '}
                <button
                  type="button"
                  onClick={bookDemo}
                  className="text-cyan-300 underline decoration-cyan-300/30 underline-offset-4 hover:decoration-cyan-300 transition-all"
                >
                  book a real demo
                </button>{' '}
                tailored to your company.
              </p>
            </header>

            {/* Section 01 — Dashboard */}
            <section
              ref={dashboardRef}
              className={`rounded-3xl transition-all duration-700 -m-3 p-3 ${
                flashTarget === 'dashboard'
                  ? 'ring-2 ring-cyan-400/60 shadow-[0_0_80px_-10px_rgba(34,211,238,0.5)]'
                  : 'ring-0 ring-transparent'
              }`}
            >
              <SectionLabel number="01" label="Dashboard Overview" />
              <MockDashboard openNcrs={openNcrCount} iso9001Score={iso9001Score} />
            </section>

            {/* Section 02 — Documents */}
            <section>
              <SectionLabel number="02" label="Document Control" />
              <MockDocuments />
            </section>

            {/* Section 03 — NCRs */}
            <section>
              <SectionLabel number="03" label="Non-Conformance Tracking" />
              <MockNCRs closedNcrs={closedNcrs} onClose={closeNcr} />
            </section>

            {/* Section 04 — Compliance */}
            <section
              ref={complianceRef}
              className={`rounded-3xl transition-all duration-700 -m-3 p-3 ${
                flashTarget === 'compliance'
                  ? 'ring-2 ring-purple-400/60 shadow-[0_0_80px_-10px_rgba(192,132,252,0.5)]'
                  : 'ring-0 ring-transparent'
              }`}
            >
              <SectionLabel number="04" label="Clause-by-Clause Scoring" />
              <MockCompliance iso9001Score={iso9001Score} clause84Met={ncr014Closed} />
            </section>

            {/* Section 05 — Reseller */}
            <section>
              <SectionLabel number="05" label="Reseller Partner View" />
              <MockReseller />
            </section>

            {/* Section 06 — Final CTA */}
            <section className="pb-10">
              <SectionLabel number="06" label="Next Step" />
              <div className="relative glass-card glass-border rounded-3xl p-8 sm:p-10 overflow-hidden">
                {/* Decorative gradient orb */}
                <div className="absolute -top-32 -right-20 w-80 h-80 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-full blur-3xl pointer-events-none" />

                <div className="relative grid lg:grid-cols-[1fr_auto] gap-8 items-center">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-cyan-300 mb-3">
                      Ready when you are
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-[1.1] max-w-xl">
                      See this with{' '}
                      <span className="bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent">
                        your own data.
                      </span>
                    </h2>
                    <p className="mt-4 text-base text-white/55 max-w-xl leading-relaxed">
                      Thirty minutes. We bring your standards, your clauses, your open findings. You leave with a clear picture of what the first 90 days on ISOGuardian looks like.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
                    <button
                      data-tour-step="8"
                      type="button"
                      onClick={bookDemo}
                      className="px-8 py-4 text-sm font-bold bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white rounded-2xl shadow-xl shadow-purple-500/30 transition-all hover:scale-[1.02]"
                    >
                      Book a Demo {'\u2192'}
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/')}
                      className="px-8 py-4 text-sm font-semibold bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 rounded-2xl transition-all"
                    >
                      Back to home
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        <DemoTour />
        <RealtimeActivity />
        <CloseNCRToast
          visible={toastVisible}
          onJump={jumpTo}
          onDismiss={() => setToastVisible(false)}
        />
      </PublicLayout>
    </>
  )
}

export default Demo

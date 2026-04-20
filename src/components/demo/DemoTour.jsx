import { useEffect, useState } from 'react'
import { Joyride, STATUS } from 'react-joyride'

const STORAGE_KEY = 'demoTourSeen'

const stepBody = (eyebrow, title, body) => (
  <div style={{ textAlign: 'left', color: '#e2e8f0' }}>
    <div
      style={{
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        background: 'linear-gradient(90deg, #22d3ee, #a78bfa)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}
    >
      {eyebrow}
    </div>
    <div
      style={{
        marginTop: 8,
        fontSize: 16,
        fontWeight: 800,
        color: '#ffffff',
        lineHeight: 1.25,
      }}
    >
      {title}
    </div>
    <div
      style={{
        marginTop: 8,
        fontSize: 13.5,
        color: 'rgba(226, 232, 240, 0.78)',
        lineHeight: 1.55,
      }}
    >
      {body}
    </div>
  </div>
)

const steps = [
  {
    target: '[data-tour-step="1"]',
    content: stepBody('Step 01 / 08', 'Your compliance status at a glance', 'Open NCRs, upcoming audits, live compliance scores, document activity — all four numbers you check every Monday.'),
    placement: 'bottom',
  },
  {
    target: '[data-tour-step="2"]',
    content: stepBody('Step 02 / 08', 'Audits, scheduled', 'ISO 19011-aligned internal audits. Plan, execute, close out with signed PDFs your certification body accepts.'),
    placement: 'left',
  },
  {
    target: '[data-tour-step="3"]',
    content: stepBody('Step 03 / 08', 'Documents that number themselves', 'Upload once — get IG-YOURCODE-DOC-001 automatically. Review cycles, version control, and clause mapping are built in.'),
    placement: 'top',
  },
  {
    target: '[data-tour-step="4"]',
    content: stepBody('Step 04 / 08', 'Branded PDFs, hand-to-auditor ready', 'Every export carries your logo as hero, ISOGuardian as a subtle footer. Signature blocks on every close-out.'),
    placement: 'bottom',
  },
  {
    target: '[data-tour-step="5"]',
    content: stepBody('Step 05 / 08', 'Track every non-conformance', 'Raise, assign, evidence, close. Photo uploads, root-cause fields, assignee reminders — nothing gets lost.'),
    placement: 'top',
  },
  {
    target: '[data-tour-step="6"]',
    content: stepBody('Step 06 / 08', 'Clause-by-clause scoring', 'Live percentages for ISO 9001, 14001, and 45001. Recalculates the instant an NCR closes or evidence lands.'),
    placement: 'bottom',
  },
  {
    target: '[data-tour-step="7"]',
    content: stepBody('Step 07 / 08', 'One login. Every client.', 'Reseller partners manage multiple clients from a single account — data-isolated by RLS, never leaks. 25% lifetime commission.'),
    placement: 'top',
  },
  {
    target: '[data-tour-step="8"]',
    content: stepBody('Step 08 / 08', 'Ready to see this with your data?', 'Book a 30-minute walkthrough. We will tailor this exact view to your company, your standards, your clauses.'),
    placement: 'top',
  },
]

const joyrideStyles = {
  options: {
    arrowColor: 'rgba(15, 23, 42, 0.97)',
    backgroundColor: 'rgba(15, 23, 42, 0.97)',
    overlayColor: 'rgba(2, 6, 23, 0.78)',
    primaryColor: '#06b6d4',
    textColor: '#e2e8f0',
    zIndex: 10000,
    width: 360,
  },
  tooltip: {
    borderRadius: 20,
    padding: 22,
    border: '1px solid rgba(255, 255, 255, 0.12)',
    boxShadow: '0 30px 80px -20px rgba(6, 182, 212, 0.35), 0 20px 50px -20px rgba(139, 92, 246, 0.35)',
    backdropFilter: 'blur(20px)',
    backgroundColor: 'rgba(15, 23, 42, 0.97)',
    color: '#e2e8f0',
  },
  tooltipContainer: {
    textAlign: 'left',
  },
  tooltipContent: {
    padding: 0,
    color: '#e2e8f0',
  },
  tooltipTitle: {
    color: '#ffffff',
  },
  tooltipFooter: {
    marginTop: 16,
  },
  buttonPrimary: {
    background: 'linear-gradient(to right, #06b6d4, #8b5cf6)',
    borderRadius: 12,
    padding: '10px 18px',
    fontSize: 13,
    fontWeight: 700,
    color: '#ffffff',
    border: 'none',
    boxShadow: '0 8px 24px -8px rgba(139, 92, 246, 0.6)',
  },
  buttonBack: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    fontWeight: 600,
    marginRight: 8,
    background: 'transparent',
  },
  buttonSkip: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontWeight: 600,
    background: 'transparent',
  },
  buttonClose: {
    display: 'none',
  },
  spotlight: {
    borderRadius: 14,
    boxShadow: '0 0 0 9999px rgba(2, 6, 23, 0.78), 0 0 0 4px rgba(34, 211, 238, 0.65), 0 0 40px 6px rgba(34, 211, 238, 0.35)',
  },
  overlay: {
    backgroundColor: 'rgba(2, 6, 23, 0.78)',
    mixBlendMode: 'normal',
  },
}

const DemoTour = () => {
  const [run, setRun] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const seen = window.localStorage.getItem(STORAGE_KEY) === 'true'
    if (!seen) {
      const t = setTimeout(() => setRun(true), 900)
      return () => clearTimeout(t)
    }
  }, [])

  const handleCallback = (data) => {
    const { status } = data
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false)
      try {
        window.localStorage.setItem(STORAGE_KEY, 'true')
      } catch {
        /* storage may be blocked; tour still works for this session */
      }
    }
  }

  const restart = () => {
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* non-fatal */
    }
    setRun(false)
    setTimeout(() => setRun(true), 50)
  }

  return (
    <>
      <Joyride
        steps={steps}
        run={run}
        callback={handleCallback}
        continuous
        scrollToFirstStep
        showProgress
        showSkipButton
        spotlightPadding={8}
        disableOverlayClose
        disableScrolling={false}
        locale={{
          back: 'Back',
          close: 'Close',
          last: 'Book a Demo',
          next: 'Next',
          skip: 'Skip tour',
        }}
        styles={joyrideStyles}
      />

      <button
        type="button"
        onClick={restart}
        className="fixed bottom-6 right-6 z-40 px-4 py-2.5 text-xs font-semibold rounded-full bg-slate-900/80 backdrop-blur-xl border border-white/15 text-white/80 hover:text-white hover:bg-slate-900 hover:border-cyan-400/50 transition-all shadow-lg shadow-black/40"
      >
        {run ? 'Tour running...' : 'Restart tour'}
      </button>
    </>
  )
}

export default DemoTour

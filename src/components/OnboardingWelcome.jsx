import { useState, useEffect, useCallback, useRef } from 'react'

const ONBOARDING_KEY = 'isoguardian_onboarding_complete'

const TOUR_STEPS = [
  {
    target: null, // Welcome modal — no spotlight
    title: 'Welcome to ISOGuardian',
    subtitle: 'Your ISO Compliance Management Platform',
    body: 'Let us show you around. This quick tour highlights the key features you\'ll use to manage your Integrated Management System.',
    tip: 'You can revisit this tour anytime from your Profile page.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    target: '[data-tour="dashboard"]',
    title: 'Dashboard',
    body: 'Your command centre. See open NCRs, upcoming audits, document review dates, and compliance scores at a glance.',
    position: 'right',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    target: '[data-tour="documents"]',
    title: 'Document Control',
    subtitle: 'ISO 9001:7.5',
    body: 'Upload policies, procedures, manuals, and records. Documents are organised by ISO clause with version control and review tracking.',
    tip: 'Use Bulk Upload to import entire folders at once.',
    position: 'right',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    target: '[data-tour="ncrs"]',
    title: 'NCR Management',
    subtitle: 'ISO 9001:10.2',
    body: 'Raise Non-Conformance Reports, assign corrective actions, track root cause analysis, and close out with evidence.',
    tip: 'NCRs link to ISO clauses — your compliance score updates when you close them.',
    position: 'right',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    ),
  },
  {
    target: '[data-tour="compliance"]',
    title: 'Compliance Scoring',
    subtitle: 'Clauses 4-10',
    body: 'Track your compliance status for every ISO clause across all three standards. Your overall score shows audit readiness at a glance.',
    position: 'right',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    target: '[data-tour="audits"]',
    title: 'Audit Management',
    subtitle: 'ISO 19011',
    body: 'Schedule internal and external audits. Document findings, observations, evidence, and corrective actions — everything for a proper close-out.',
    tip: 'Use Audit Connect to invite external auditors with a secure link.',
    position: 'right',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    target: '[data-tour="management-reviews"]',
    title: 'Management Reviews',
    subtitle: 'ISO 9001:9.3',
    body: 'Record attendees, agenda, minutes, decisions, and action items. Export professional PDF reports for your records.',
    position: 'right',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    target: '[data-tour="templates"]',
    title: 'Template Marketplace',
    body: 'Pre-built ISO document templates with your company details auto-filled. Edit in-app and export as branded PDFs.',
    position: 'right',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    target: null, // Final step — checklist modal
    title: 'You\'re All Set!',
    subtitle: 'Here\'s your quick-start checklist',
    body: 'Complete these steps to get your compliance system up and running:',
    checklist: [
      'Upload your company logo (Settings)',
      'Upload your Quality Policy',
      'Upload your Quality Manual',
      'Log any open NCRs',
      'Review your compliance scoring',
      'Schedule your next internal audit',
    ],
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
]

function SpotlightOverlay({ targetRect, onClick }) {
  if (!targetRect) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-[998]" onClick={onClick} />
    )
  }

  const pad = 6
  const r = 10
  const x = targetRect.left - pad
  const y = targetRect.top - pad
  const w = targetRect.width + pad * 2
  const h = targetRect.height + pad * 2

  return (
    <svg className="fixed inset-0 w-full h-full z-[998]" onClick={onClick}>
      <defs>
        <mask id="spotlight-mask">
          <rect width="100%" height="100%" fill="white" />
          <rect x={x} y={y} width={w} height={h} rx={r} fill="black" />
        </mask>
      </defs>
      <rect width="100%" height="100%" fill="rgba(0,0,0,0.65)" mask="url(#spotlight-mask)" style={{ backdropFilter: 'blur(2px)' }} />
      <rect x={x} y={y} width={w} height={h} rx={r} fill="none" stroke="rgba(6,182,212,0.5)" strokeWidth="2">
        <animate attributeName="stroke-opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite" />
      </rect>
    </svg>
  )
}

function Tooltip({ step, targetRect, currentStep, totalSteps, onNext, onBack, onSkip }) {
  const tooltipRef = useRef(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (!tooltipRef.current) return
    const tt = tooltipRef.current.getBoundingClientRect()

    if (!targetRect) {
      // Centred modal
      setPos({
        top: Math.max(20, (window.innerHeight - tt.height) / 2),
        left: Math.max(16, (window.innerWidth - tt.width) / 2),
      })
      return
    }

    const gap = 12
    let top, left

    // Try positioning to the right
    if (step.position === 'right' || !step.position) {
      left = targetRect.right + gap
      top = targetRect.top + (targetRect.height / 2) - (tt.height / 2)

      // If it overflows right, position below
      if (left + tt.width > window.innerWidth - 16) {
        left = Math.max(16, targetRect.left)
        top = targetRect.bottom + gap
      }
    }

    // Clamp to viewport
    top = Math.max(16, Math.min(top, window.innerHeight - tt.height - 16))
    left = Math.max(16, Math.min(left, window.innerWidth - tt.width - 16))

    setPos({ top, left })
  }, [targetRect, step])

  const isFirst = currentStep === 0
  const isLast = currentStep === totalSteps - 1

  return (
    <div
      ref={tooltipRef}
      className="fixed z-[999] w-[340px] max-w-[calc(100vw-32px)] animate-fade-in"
      style={{ top: pos.top, left: pos.left }}
    >
      <div className="bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>

        <div className="p-5">
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-cyan-400 flex-shrink-0">
              {step.icon}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-white leading-tight">{step.title}</h3>
              {step.subtitle && <p className="text-xs text-cyan-300/70 mt-0.5">{step.subtitle}</p>}
            </div>
            <span className="text-[10px] text-white/30 ml-auto flex-shrink-0">{currentStep + 1}/{totalSteps}</span>
          </div>

          {/* Body */}
          <p className="text-sm text-white/70 leading-relaxed mb-3">{step.body}</p>

          {/* Tip */}
          {step.tip && (
            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg px-3 py-2 mb-3">
              <p className="text-xs text-cyan-300">
                <span className="font-semibold">Tip:</span> {step.tip}
              </p>
            </div>
          )}

          {/* Checklist */}
          {step.checklist && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 mb-3 space-y-2">
              {step.checklist.map((item, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded border border-white/30 flex-shrink-0" />
                  <span className="text-xs text-white/60">{item}</span>
                </div>
              ))}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center gap-2 mt-4">
            {isFirst ? (
              <button
                onClick={onSkip}
                className="px-3 py-2 text-xs text-white/40 hover:text-white/70 transition-colors"
              >
                Skip tour
              </button>
            ) : (
              <button
                onClick={onBack}
                className="px-3 py-2 text-xs bg-white/10 border border-white/15 text-white/70 rounded-lg hover:bg-white/15 transition-all"
              >
                Back
              </button>
            )}
            <button
              onClick={onNext}
              className="flex-1 px-4 py-2 text-sm font-semibold bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-lg hover:from-cyan-400 hover:to-purple-400 transition-all"
            >
              {isLast ? 'Get Started' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const OnboardingTour = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [targetRect, setTargetRect] = useState(null)
  const step = TOUR_STEPS[currentStep]

  const updateTargetRect = useCallback(() => {
    if (!step.target) {
      setTargetRect(null)
      return
    }
    const el = document.querySelector(step.target)
    if (el) {
      const rect = el.getBoundingClientRect()
      setTargetRect(rect)
      // Scroll into view if needed
      if (rect.top < 0 || rect.bottom > window.innerHeight) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        // Re-read after scroll
        setTimeout(() => setTargetRect(el.getBoundingClientRect()), 400)
      }
    } else {
      setTargetRect(null)
    }
  }, [step])

  useEffect(() => {
    updateTargetRect()
    window.addEventListener('resize', updateTargetRect)
    window.addEventListener('scroll', updateTargetRect, true)
    return () => {
      window.removeEventListener('resize', updateTargetRect)
      window.removeEventListener('scroll', updateTargetRect, true)
    }
  }, [updateTargetRect])

  // Lock body scroll during tour
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const handleNext = () => {
    if (currentStep === TOUR_STEPS.length - 1) {
      onComplete()
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1)
  }

  return (
    <>
      <SpotlightOverlay targetRect={targetRect} onClick={() => {}} />
      <Tooltip
        step={step}
        targetRect={targetRect}
        currentStep={currentStep}
        totalSteps={TOUR_STEPS.length}
        onNext={handleNext}
        onBack={handleBack}
        onSkip={onComplete}
      />
    </>
  )
}

// Hook to manage onboarding state
export const useOnboarding = () => {
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY)
    if (!completed) {
      const timer = setTimeout(() => setShowOnboarding(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const completeOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true')
    setShowOnboarding(false)
  }

  const resetOnboarding = () => {
    localStorage.removeItem(ONBOARDING_KEY)
    setShowOnboarding(true)
  }

  return { showOnboarding, completeOnboarding, resetOnboarding }
}

export default OnboardingTour

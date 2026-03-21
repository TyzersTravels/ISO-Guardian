import { useState, useEffect } from 'react';

const ONBOARDING_KEY = 'isoguardian_onboarding_complete';

const OnboardingWelcome = ({ userName, onComplete }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: userName ? `Welcome, ${userName}!` : 'Welcome to ISOGuardian',
      subtitle: 'Your ISO Compliance Management Platform',
      iconSvg: (
        <svg className="w-12 h-12 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      content: 'ISOGuardian helps you manage your Integrated Management System (IMS) with document control, NCR tracking, audit management, and compliance scoring — all in one place.',
      tip: 'Everything you do is logged, secured, and POPIA compliant. Your data is isolated to your company only.',
    },
    {
      title: 'Documents',
      subtitle: 'ISO 9001:7.5 — Documented Information',
      iconSvg: (
        <svg className="w-12 h-12 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      content: 'Upload and manage all your QMS documents — policies, procedures, forms, manuals, and records. Use Bulk Upload to import entire folders at once. Version control keeps a full history of changes.',
      tip: 'Documents are organised by ISO standard and clause for easy retrieval during audits.',
      navHighlight: '/documents',
    },
    {
      title: 'NCRs',
      subtitle: 'ISO 9001:10.2 — Nonconformity & Corrective Action',
      iconSvg: (
        <svg className="w-12 h-12 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      ),
      content: 'Raise Non-Conformance Reports, assign corrective actions, and track them to closure. Each NCR follows the full lifecycle: Open → In Progress → Closed, with evidence and root cause analysis.',
      tip: 'NCRs are linked to specific ISO clauses so your compliance score updates automatically.',
      navHighlight: '/ncrs',
    },
    {
      title: 'Compliance Scoring',
      subtitle: 'ISO 9001:4-10 — Clause-by-Clause Tracking',
      iconSvg: (
        <svg className="w-12 h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      content: 'Track your compliance status for every ISO clause. Rate each requirement as Compliant, Partially Compliant, or Non-Compliant. Your overall score updates in real-time on the dashboard.',
      tip: 'Focus on clauses marked "Non-Compliant" first — these are your biggest audit risks.',
      navHighlight: '/compliance',
    },
    {
      title: 'Audits',
      subtitle: 'ISO 19011 — Audit Management',
      iconSvg: (
        <svg className="w-12 h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      content: 'Schedule internal and external audits. When completing an audit, document findings, observations, evidence reviewed, and NCRs raised — exactly what ISO 19011 requires for a proper close-out.',
      tip: 'Use Audit Connect to invite external auditors — they get a secure workspace without needing an account.',
      navHighlight: '/audits',
    },
    {
      title: 'Management Reviews',
      subtitle: 'ISO 9001:9.3 — Management Review',
      iconSvg: (
        <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      content: 'Record management reviews with attendees, agenda, minutes, decisions, action items, and improvement opportunities. Export professional PDF reports for your records.',
      tip: 'Set your next review date to keep your review cycle on track.',
      navHighlight: '/management-reviews',
    },
    {
      title: 'Company Settings',
      subtitle: 'Branding & Configuration',
      iconSvg: (
        <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      content: 'Upload your company logo — it appears on all exported PDFs and reports. Update your company profile, manage team members, and configure notification preferences.',
      tip: 'Upload your logo first so all PDF exports are professionally branded from day one.',
      navHighlight: '/settings',
    },
    {
      title: 'You\'re Ready!',
      subtitle: 'Start building your compliance system',
      iconSvg: (
        <svg className="w-12 h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      content: 'Begin by uploading your core documents and setting up your company profile. Your compliance score will start building automatically as you populate each ISO clause.',
      tip: 'Need help? Use the help button in the bottom-right corner for WhatsApp and email support.',
      checklist: [
        'Upload your company logo (Settings)',
        'Upload your Quality Manual',
        'Upload your Quality Policy',
        'Upload your Organogram',
        'Log any open NCRs',
        'Rate your compliance per clause',
        'Schedule your next internal audit',
        'Schedule your next management review',
      ],
    },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;
  const isFirst = step === 0;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-gradient-to-br from-slate-900 via-purple-900/80 to-slate-900 border border-white/20 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Progress bar */}
        <div className="h-1 bg-white/10">
          <div className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500 ease-out"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
        </div>

        <div className="p-6 sm:p-8">
          {/* Step counter */}
          <div className="text-right mb-2">
            <span className="text-xs text-white/30">{step + 1} of {steps.length}</span>
          </div>

          {/* Icon and title */}
          <div className="text-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
              {current.iconSvg}
            </div>
            <h2 className="text-2xl font-bold text-white">{current.title}</h2>
            <p className="text-sm text-cyan-300 mt-1">{current.subtitle}</p>
          </div>

          {/* Content */}
          <p className="text-white/80 text-sm leading-relaxed text-center mb-4">{current.content}</p>

          {/* Tip */}
          {current.tip && (
            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl px-4 py-3 mb-4">
              <p className="text-xs text-cyan-300">
                <svg className="w-3.5 h-3.5 inline-block mr-1 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold">Pro tip:</span> {current.tip}
              </p>
            </div>
          )}

          {/* Checklist for last step */}
          {current.checklist && (
            <div className="bg-white/5 rounded-xl p-4 mb-4 space-y-2">
              <p className="text-xs text-white/50 font-semibold mb-2">Quick-Start Checklist:</p>
              {current.checklist.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border border-white/30 flex-shrink-0" />
                  <span className="text-sm text-white/70">{item}</span>
                </div>
              ))}
            </div>
          )}

          {/* Step indicators */}
          <div className="flex justify-center gap-1.5 mb-6">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? 'bg-cyan-400 w-6' : i < step ? 'bg-purple-400 w-1.5' : 'bg-white/20 w-1.5'
                }`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            {!isFirst && (
              <button onClick={() => setStep(step - 1)}
                className="px-5 py-3 bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/20 transition-colors text-sm">
                Back
              </button>
            )}
            {isFirst && (
              <button onClick={onComplete}
                className="px-5 py-3 bg-white/10 border border-white/20 text-white/50 rounded-xl hover:bg-white/20 transition-colors text-sm">
                Skip Tour
              </button>
            )}
            <button onClick={() => {
              if (isLast) {
                onComplete();
              } else {
                setStep(step + 1);
              }
            }}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl font-semibold hover:from-cyan-400 hover:to-purple-400 transition-all text-sm">
              {isLast ? 'Get Started' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Hook to manage onboarding state
export const useOnboarding = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (!completed) {
      // Small delay so dashboard loads first
      const timer = setTimeout(() => setShowOnboarding(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setShowOnboarding(false);
  };

  const resetOnboarding = () => {
    localStorage.removeItem(ONBOARDING_KEY);
    setShowOnboarding(true);
  };

  return { showOnboarding, completeOnboarding, resetOnboarding };
};

export default OnboardingWelcome;

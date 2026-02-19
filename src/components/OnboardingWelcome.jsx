import { useState, useEffect } from 'react';

const ONBOARDING_KEY = 'isoguardian_onboarding_complete';

const OnboardingWelcome = ({ userName, onComplete }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: 'Welcome to ISOGuardian',
      subtitle: 'Your ISO Compliance Management Platform',
      icon: '🛡️',
      content: 'ISOGuardian helps you manage your Integrated Management System (IMS) with document control, NCR tracking, audit management, and compliance scoring — all in one place.',
      tip: 'Everything you do here is logged, secured, and POPIA compliant.',
    },
    {
      title: 'Documents',
      subtitle: 'ISO 9001:7.5 — Documented Information',
      icon: '📄',
      content: 'Upload and manage all your QMS documents — policies, procedures, forms, manuals, and records. Use Bulk Upload to import entire folders at once. Every upload, edit, and deletion is tracked in your Activity Trail.',
      tip: 'Documents are organised by ISO standard and clause for easy retrieval during audits.',
      navHighlight: '/documents',
    },
    {
      title: 'NCRs',
      subtitle: 'ISO 9001:10.2 — Nonconformity & Corrective Action',
      icon: '⚠️',
      content: 'Raise Non-Conformance Reports, assign corrective actions, and track them to closure. Each NCR follows the full lifecycle: Open → In Progress → Closed, with evidence and root cause analysis.',
      tip: 'NCRs are linked to specific ISO clauses so your compliance score updates automatically.',
      navHighlight: '/ncrs',
    },
    {
      title: 'Audits',
      subtitle: 'ISO 19011 — Audit Management',
      icon: '🔍',
      content: 'Schedule internal and external audits. When completing an audit, you\'ll document findings, observations, evidence reviewed, and NCRs raised — exactly what ISO 19011 requires for a proper audit close-out.',
      tip: 'Your auditor will see a professional close-out report with all required fields.',
      navHighlight: '/audits',
    },
    {
      title: 'Management Reviews',
      subtitle: 'ISO 9001:9.3 — Management Review',
      icon: '👥',
      content: 'Schedule and record management reviews with attendees, agenda, minutes, decisions, action items, and improvement opportunities. This satisfies clause 9.3 requirements directly.',
      tip: 'Set your next review date to keep your review cycle on track.',
      navHighlight: '/management-reviews',
    },
    {
      title: 'Activity Trail',
      subtitle: 'ISO 7.5.3 — Traceability',
      icon: '📋',
      content: 'Every action across all modules is logged — uploads, edits, archives, deletions, status changes. Filter by type or action. This is your proof of document control for auditors.',
      tip: 'Your Activity Trail is company-scoped. No other organisation can see your data.',
      navHighlight: '/activity-trail',
    },
    {
      title: 'You\'re Ready!',
      subtitle: 'Start building your compliance system',
      icon: '🚀',
      content: 'Begin by uploading your core documents: Quality Manual, Quality Policy, Organogram, and key procedures. Your compliance score will start building automatically as you populate each ISO clause.',
      tip: 'Need help? Contact us anytime via WhatsApp or email.',
      checklist: [
        'Upload your Quality Manual',
        'Upload your Quality Policy',
        'Upload your Organogram',
        'Log any open NCRs',
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
      <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 border border-white/20 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Progress bar */}
        <div className="h-1 bg-white/10">
          <div className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-300"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
        </div>

        <div className="p-8">
          {/* Icon and title */}
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">{current.icon}</div>
            <h2 className="text-2xl font-bold text-white">{current.title}</h2>
            <p className="text-sm text-cyan-300 mt-1">{current.subtitle}</p>
          </div>

          {/* Content */}
          <p className="text-white/80 text-sm leading-relaxed text-center mb-4">{current.content}</p>

          {/* Tip */}
          {current.tip && (
            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl px-4 py-3 mb-4">
              <p className="text-xs text-cyan-300"><span className="font-semibold">Pro tip:</span> {current.tip}</p>
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
          <div className="flex justify-center gap-2 mb-6">
            {steps.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === step ? 'bg-cyan-400 w-6' : i < step ? 'bg-purple-400' : 'bg-white/20'}`} />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            {!isFirst && (
              <button onClick={() => setStep(step - 1)}
                className="flex-1 px-6 py-3 bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/20 transition-colors">
                Back
              </button>
            )}
            {isFirst && (
              <button onClick={onComplete}
                className="flex-1 px-6 py-3 bg-white/10 border border-white/20 text-white/50 rounded-xl hover:bg-white/20 transition-colors text-sm">
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
              className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl font-semibold hover:scale-105 transition-transform">
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

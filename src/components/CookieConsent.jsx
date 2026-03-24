import { useState, useEffect } from 'react'
import { initGA } from '../lib/analytics'

const COOKIE_CONSENT_KEY = 'isoguardian_cookie_consent'

const CATEGORIES = [
  {
    id: 'essential',
    label: 'Essential',
    description: 'Authentication, security, and core functionality. Always active.',
    required: true,
  },
  {
    id: 'functional',
    label: 'Functional',
    description: 'Preferences such as notification settings and onboarding state.',
    required: false,
  },
  {
    id: 'analytics',
    label: 'Analytics',
    description: 'Anonymous usage data to help us improve the platform.',
    required: false,
  },
]

export function getCookieConsent() {
  try {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)
  const [preferences, setPreferences] = useState({
    essential: true,
    functional: false,
    analytics: false,
  })

  useEffect(() => {
    const consent = getCookieConsent()
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  const saveConsent = (prefs) => {
    const consent = {
      ...prefs,
      essential: true,
      timestamp: new Date().toISOString(),
      version: '1.0',
    }
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent))
    if (prefs.analytics) initGA()
    setVisible(false)
  }

  const acceptAll = () => saveConsent({ essential: true, functional: true, analytics: true })
  const rejectNonEssential = () => saveConsent({ essential: true, functional: false, analytics: false })
  const saveCustom = () => saveConsent(preferences)

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up">
      <div className="max-w-4xl mx-auto glass glass-border rounded-2xl p-6 shadow-2xl">
        {!showPreferences ? (
          /* ── Compact View ── */
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-5 h-5 text-cyan-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <h3 className="text-white font-semibold text-sm">Cookie & Storage Consent</h3>
              </div>
              <p className="text-white/50 text-xs leading-relaxed">
                We use essential cookies and local storage for authentication and security.
                Optional cookies improve your experience.{' '}
                <a href="/popia" className="text-cyan-400 hover:text-cyan-300 underline">
                  Read our POPIA Policy
                </a>
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button
                onClick={acceptAll}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white text-sm font-semibold rounded-xl transition-all whitespace-nowrap"
              >
                Accept All
              </button>
              <button
                onClick={() => setShowPreferences(true)}
                className="px-4 py-2 bg-white/10 border border-white/20 text-white text-sm font-medium rounded-xl hover:bg-white/20 transition-all whitespace-nowrap"
              >
                Manage
              </button>
              <button
                onClick={rejectNonEssential}
                className="px-4 py-2 text-white/50 text-sm hover:text-white/70 transition-all whitespace-nowrap"
              >
                Reject Optional
              </button>
            </div>
          </div>
        ) : (
          /* ── Preferences View ── */
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-sm">Cookie Preferences</h3>
              <button
                onClick={() => setShowPreferences(false)}
                className="text-white/40 hover:text-white/60 text-sm"
              >
                Back
              </button>
            </div>

            <div className="space-y-3 mb-4">
              {CATEGORIES.map(({ id, label, description, required }) => (
                <div
                  key={id}
                  className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl"
                >
                  <div className="flex-1 mr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-medium">{label}</span>
                      {required && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-cyan-500/20 text-cyan-300 rounded-full">
                          Required
                        </span>
                      )}
                    </div>
                    <p className="text-white/40 text-xs mt-0.5">{description}</p>
                  </div>
                  <button
                    onClick={() => {
                      if (!required) {
                        setPreferences(prev => ({ ...prev, [id]: !prev[id] }))
                      }
                    }}
                    disabled={required}
                    className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                      required || preferences[id] ? 'bg-cyan-500' : 'bg-white/20'
                    } ${required ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${
                        required || preferences[id] ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={saveCustom}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white text-sm font-semibold rounded-xl transition-all"
              >
                Save Preferences
              </button>
              <button
                onClick={acceptAll}
                className="flex-1 px-4 py-2 bg-white/10 border border-white/20 text-white text-sm font-medium rounded-xl hover:bg-white/20 transition-all"
              >
                Accept All
              </button>
            </div>

            <p className="text-white/30 text-[10px] mt-3 text-center">
              POPIA (Protection of Personal Information Act) &bull; Your consent is stored locally and can be changed at any time.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

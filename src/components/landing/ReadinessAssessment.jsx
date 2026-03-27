import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { throttle } from '../../lib/rateLimiter'
import { trackConversion } from '../../lib/analytics'

const SUPPORT_EMAIL = 'support@isoguardian.co.za'

const QUESTIONS = {
  'ISO 9001': [
    'Does your organisation have a documented Quality Policy approved by top management?',
    'Have you identified the internal and external issues relevant to your QMS (Clause 4.1)?',
    'Are the needs and expectations of interested parties determined and monitored (Clause 4.2)?',
    'Is there a documented scope for your Quality Management System?',
    'Are quality objectives set at relevant functions and levels with measurable targets (Clause 6.2)?',
    'Do you have a process for identifying and addressing risks and opportunities (Clause 6.1)?',
    'Are documented procedures in place for document and record control (Clause 7.5)?',
    'Is there a formal process for handling non-conforming outputs (Clause 8.7)?',
    'Do you conduct internal audits at planned intervals (Clause 9.2)?',
    'Does top management conduct management reviews covering all required inputs (Clause 9.3)?',
  ],
  'ISO 14001': [
    'Does your organisation have a documented Environmental Policy?',
    'Have you identified significant environmental aspects and their impacts (Clause 6.1.2)?',
    'Are compliance obligations (legal and other) identified and accessible (Clause 6.1.3)?',
    'Are environmental objectives established with plans to achieve them (Clause 6.2)?',
    'Is there an emergency preparedness and response procedure (Clause 8.2)?',
    'Do you monitor and measure key characteristics of operations with environmental impact (Clause 9.1)?',
    'Is there a process for evaluating compliance with legal requirements (Clause 9.1.2)?',
    'Are roles and responsibilities for the EMS defined and communicated (Clause 5.3)?',
    'Do you conduct internal audits of the EMS at planned intervals (Clause 9.2)?',
    'Is there a process for identifying and acting on opportunities for continual improvement (Clause 10)?',
  ],
  'ISO 45001': [
    'Does your organisation have a documented OH&S Policy with worker consultation (Clause 5.2)?',
    'Have you identified hazards and assessed OH&S risks and opportunities (Clause 6.1.2)?',
    'Are legal and other OH&S requirements identified and accessible (Clause 6.1.3)?',
    'Are OH&S objectives established with plans to achieve them (Clause 6.2)?',
    'Is there a process for worker participation and consultation (Clause 5.4)?',
    'Are emergency preparedness and response procedures in place and tested (Clause 8.2)?',
    'Is there a process for incident investigation and reporting (Clause 10.2)?',
    'Do you monitor and measure OH&S performance at planned intervals (Clause 9.1)?',
    'Are competence requirements identified with appropriate training provided (Clause 7.2)?',
    'Does management review cover OH&S performance trends, incidents, and worker feedback (Clause 9.3)?',
  ],
}

const READINESS_LEVELS = [
  { min: 0, max: 30, label: 'Early Stage', color: 'text-red-400', bg: 'bg-red-500/20 border-red-500/30', desc: 'Significant gaps exist. A structured gap analysis would help you build a roadmap to certification.' },
  { min: 31, max: 60, label: 'In Progress', color: 'text-amber-400', bg: 'bg-amber-500/20 border-amber-500/30', desc: 'Good foundation, but key areas need attention. A consultation could fast-track your readiness.' },
  { min: 61, max: 80, label: 'Near Ready', color: 'text-cyan-400', bg: 'bg-cyan-500/20 border-cyan-500/30', desc: 'You are well on your way. Fine-tuning and a pre-audit review could get you certification-ready.' },
  { min: 81, max: 100, label: 'Audit Ready', color: 'text-green-400', bg: 'bg-green-500/20 border-green-500/30', desc: 'Excellent! You appear ready for certification. Consider ISOGuardian to maintain and automate ongoing compliance.' },
]

export default function ReadinessAssessment() {
  const [step, setStep] = useState(0) // 0 = contact info, 1-10 = questions, 11 = results
  const [contactInfo, setContactInfo] = useState({ company_name: '', email: '', phone: '', standard: 'ISO 9001' })
  const [answers, setAnswers] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [score, setScore] = useState(null)
  const [error, setError] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [consent, setConsent] = useState(false)

  const questions = QUESTIONS[contactInfo.standard] || QUESTIONS['ISO 9001']
  const totalSteps = questions.length + 1 // contact + questions

  const handleContactSubmit = (e) => {
    e.preventDefault()
    if (!contactInfo.company_name || !contactInfo.email) {
      setError('Please fill in company name and email.')
      return
    }
    if (!consent) {
      setError('Please agree to the privacy notice to continue.')
      return
    }
    setError('')

    setStep(1)
  }

  const handleAnswer = (questionIndex, value) => {
    setAnswers(prev => ({ ...prev, [questionIndex]: value }))
  }

  const handleNext = () => {
    if (answers[step - 1] === undefined) {
      setError('Please select an answer before continuing.')
      return
    }
    setError('')
    if (step < questions.length) {
      setStep(step + 1)
    } else {
      handleSubmit()
    }
  }

  const handleSubmit = async () => {
    // Bot detection: honeypot field
    if (honeypot) {
      setScore(50)
      setStep(totalSteps + 1)
      return
    }

    // Rate limiting
    if (!throttle('assessment-submit', 3, 60000)) {
      setError('Too many submissions. Please wait a moment before trying again.')
      return
    }

    setSubmitting(true)
    setError('')

    const totalScore = Object.values(answers).reduce((sum, v) => sum + v, 0)
    const percentage = Math.round((totalScore / (questions.length * 10)) * 100)
    setScore(percentage)

    try {
      const { error: insertError } = await supabase.from('iso_readiness_assessments').insert({
        company_name: contactInfo.company_name,
        email: contactInfo.email,
        phone: contactInfo.phone || null,
        standard: contactInfo.standard,
        answers,
        score: percentage,
      })
      if (insertError) {
        console.error('Assessment save failed:', insertError)
        setError('Your score is shown below, but we could not save your submission. Please email us at info@isoguardian.co.za.')
      } else {
        trackConversion('assessment_complete')
        // Send instant lead notification email
        supabase.functions.invoke('notify-lead', {
          body: {
            type: 'assessment',
            data: {
              company_name: contactInfo.company_name,
              email: contactInfo.email,
              phone: contactInfo.phone,
              standard: contactInfo.standard,
              score: percentage,
            },
          },
        }).then(res => { if (res?.error) console.warn('notify-lead score error:', res.error) })
          .catch(err => console.warn('notify-lead score failed:', err))
      }
    } catch {
      setError('Your score is shown below, but we could not save your submission. Please email us at info@isoguardian.co.za.')
    }

    setSubmitting(false)
    setStep(totalSteps + 1) // results step
  }

  const readinessLevel = score !== null ? READINESS_LEVELS.find(l => score >= l.min && score <= l.max) : null
  const progress = step === 0 ? 0 : Math.round((step / totalSteps) * 100)

  return (
    <section id="assessment" className="py-20">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 rounded-full text-xs font-semibold text-cyan-300 mb-6">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
            Free Assessment
          </div>
          <h2 className="text-4xl font-extrabold mb-4">
            How ready are you for{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              ISO certification?
            </span>
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            Answer 10 quick questions and get your readiness score instantly. No commitment required.
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          {/* Progress bar */}
          {step > 0 && step <= totalSteps && (
            <div className="mb-8">
              <div className="flex justify-between text-xs text-white/50 mb-2">
                <span>Question {Math.min(step, questions.length)} of {questions.length}</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Step 0: Contact Info */}
          {step === 0 && (
            <form onSubmit={handleContactSubmit} className="space-y-5">
              <h3 className="text-xl font-bold text-white mb-2">Let's start with your details</h3>
              <p className="text-white/50 text-sm mb-4">We'll send your results to your email.</p>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/70 mb-1">Company Name *</label>
                  <input
                    type="text"
                    value={contactInfo.company_name}
                    onChange={e => setContactInfo(prev => ({ ...prev, company_name: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-cyan-500/50 focus:outline-none transition-colors"
                    placeholder="Your company name"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-1">Email Address *</label>
                  <input
                    type="email"
                    value={contactInfo.email}
                    onChange={e => setContactInfo(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-cyan-500/50 focus:outline-none transition-colors"
                    placeholder="you@company.co.za"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-1">Phone (optional)</label>
                  <input
                    type="tel"
                    value={contactInfo.phone}
                    onChange={e => setContactInfo(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-cyan-500/50 focus:outline-none transition-colors"
                    placeholder="+27..."
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-1">ISO Standard</label>
                  <select
                    value={contactInfo.standard}
                    onChange={e => { setContactInfo(prev => ({ ...prev, standard: e.target.value })); setAnswers({}) }}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:border-cyan-500/50 focus:outline-none transition-colors"
                  >
                    <option value="ISO 9001" className="bg-slate-900">ISO 9001:2015 — Quality</option>
                    <option value="ISO 14001" className="bg-slate-900">ISO 14001:2015 — Environmental</option>
                    <option value="ISO 45001" className="bg-slate-900">ISO 45001:2018 — OH&S</option>
                  </select>
                </div>
              </div>

              {/* Honeypot — hidden from humans */}
              <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }} aria-hidden="true">
                <input type="text" name="website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={e => setHoneypot(e.target.value)} />
              </div>

              {/* POPIA Consent */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={e => setConsent(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-white/30 bg-white/10 text-cyan-500 focus:ring-cyan-500/50 flex-shrink-0"
                />
                <span className="text-xs text-white/50 leading-relaxed">
                  By clicking agree, I consent to receiving my assessment results, ISO compliance tips, and occasional marketing communications from ISOGuardian. My personal information will be processed in accordance with{' '}
                  <a href="/popia" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline">POPIA</a>{' '}
                  and our{' '}
                  <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline">Privacy Policy</a>.
                  You can unsubscribe at any time by emailing support@isoguardian.co.za.
                </span>
              </label>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={!consent}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Start Assessment
              </button>
            </form>
          )}

          {/* Steps 1-10: Questions */}
          {step >= 1 && step <= questions.length && (
            <div>
              <h3 className="text-lg font-bold text-white mb-6">{questions[step - 1]}</h3>
              <div className="space-y-3 mb-6">
                {[
                  { label: 'Yes', value: 10, color: 'border-green-500/40 bg-green-500/10 hover:bg-green-500/20' },
                  { label: 'Partially', value: 5, color: 'border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20' },
                  { label: 'No', value: 0, color: 'border-red-500/40 bg-red-500/10 hover:bg-red-500/20' },
                ].map(({ label, value, color }) => (
                  <button
                    key={label}
                    onClick={() => handleAnswer(step - 1, value)}
                    className={`w-full text-left px-5 py-4 rounded-xl border transition-all ${
                      answers[step - 1] === value
                        ? 'border-cyan-400 bg-cyan-500/20 ring-1 ring-cyan-400/50'
                        : color
                    }`}
                  >
                    <span className="font-semibold text-white">{label}</span>
                  </button>
                ))}
              </div>

              {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

              <div className="flex gap-3">
                <button
                  onClick={() => { setStep(step - 1); setError('') }}
                  className="px-6 py-3 border border-white/20 hover:border-white/40 rounded-xl text-white/70 hover:text-white transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={submitting}
                  className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 font-bold rounded-xl transition-all disabled:opacity-50"
                >
                  {submitting ? 'Calculating...' : step === questions.length ? 'See My Score' : 'Next'}
                </button>
              </div>
            </div>
          )}

          {/* Results */}
          {step > totalSteps && score !== null && readinessLevel && (
            <div className="text-center">
              <div className="mb-8">
                <div className="w-32 h-32 mx-auto rounded-full border-4 border-white/10 flex items-center justify-center mb-4 relative">
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `conic-gradient(${score >= 81 ? '#22c55e' : score >= 61 ? '#06b6d4' : score >= 31 ? '#f59e0b' : '#ef4444'} ${score * 3.6}deg, rgba(255,255,255,0.05) 0deg)`,
                    }}
                  />
                  <div className="relative bg-slate-900 rounded-full w-24 h-24 flex items-center justify-center">
                    <span className="text-3xl font-black text-white">{score}%</span>
                  </div>
                </div>
                <div className={`inline-block px-4 py-2 rounded-full border text-sm font-bold ${readinessLevel.bg} ${readinessLevel.color}`}>
                  {readinessLevel.label}
                </div>
              </div>

              <h3 className="text-2xl font-bold text-white mb-3">
                Your {contactInfo.standard} Readiness Score
              </h3>
              <p className="text-white/60 mb-8 max-w-md mx-auto">{readinessLevel.desc}</p>

              {/* Next steps based on score */}
              <div className="space-y-4 mb-6">
                {/* Primary CTA — Start trial */}
                <div className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-2xl p-6">
                  <h4 className="font-bold text-white mb-2">Start managing your compliance today</h4>
                  <p className="text-white/50 text-sm mb-4">
                    {score <= 60
                      ? 'ISOGuardian helps you close gaps fast with document templates, NCR tracking, and audit management — all in one platform.'
                      : 'Keep your compliance current with automated tracking, audit scheduling, and real-time dashboards.'}
                  </p>
                  <a
                    href="/signup"
                    className="inline-block px-8 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 font-bold rounded-xl transition-all"
                  >
                    Start 14-Day Free Trial
                  </a>
                  <p className="text-white/30 text-xs mt-2">No credit card required</p>
                </div>

                {/* Secondary — Templates + Consultation */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                    <h5 className="font-semibold text-white text-sm mb-1">Need templates?</h5>
                    <p className="text-white/40 text-xs mb-3">
                      Get {contactInfo.standard} document templates to kickstart your system.
                    </p>
                    <button
                      onClick={() => document.getElementById('templates')?.scrollIntoView({ behavior: 'smooth' })}
                      className="text-cyan-400 text-sm font-semibold hover:text-cyan-300 transition-colors"
                    >
                      View Templates &rarr;
                    </button>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                    <h5 className="font-semibold text-white text-sm mb-1">Want expert help?</h5>
                    <p className="text-white/40 text-xs mb-3">
                      Book a consultation for a full gap analysis and certification roadmap.
                    </p>
                    <a
                      href={`mailto:${SUPPORT_EMAIL}?subject=Gap%20Analysis%20Request%20%E2%80%94%20${encodeURIComponent(contactInfo.company_name)}%20(${contactInfo.standard})&body=Hi%2C%0A%0AWe%20scored%20${score}%25%20on%20the%20${encodeURIComponent(contactInfo.standard)}%20readiness%20assessment.%0A%0ACompany%3A%20${encodeURIComponent(contactInfo.company_name)}%0AEmail%3A%20${encodeURIComponent(contactInfo.email)}%0A%0AThank%20you.`}
                      className="text-purple-400 text-sm font-semibold hover:text-purple-300 transition-colors"
                    >
                      Get in Touch &rarr;
                    </a>
                  </div>
                </div>
              </div>

              <button
                onClick={() => { setStep(0); setAnswers({}); setScore(null); setError('') }}
                className="text-sm text-white/40 hover:text-white/60 transition-colors"
              >
                Retake assessment
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

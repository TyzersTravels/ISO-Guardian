import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { throttle } from '../../lib/rateLimiter'

const TEMPLATES = [
  {
    title: 'Quality Manual Bundle',
    desc: 'Complete ISO 9001 quality manual template with policies, scope, and process descriptions. Ready to customise for your business.',
    pricePublic: 'R3,500',
    priceSubscriber: 'Free',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    gradient: 'from-cyan-500/20 to-cyan-400/5',
    border: 'border-cyan-500/20',
    iconBg: 'bg-cyan-500/20 text-cyan-400',
    standards: ['ISO 9001'],
  },
  {
    title: 'Procedures Pack',
    desc: 'Standard operating procedures for document control, internal audit, corrective action, management review, and more.',
    pricePublic: 'From R250 each',
    priceSubscriber: 'Free',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    gradient: 'from-purple-500/20 to-purple-400/5',
    border: 'border-purple-500/20',
    iconBg: 'bg-purple-500/20 text-purple-400',
    standards: ['ISO 9001', 'ISO 14001', 'ISO 45001'],
  },
  {
    title: 'Forms & Records Kit',
    desc: 'Pre-built forms for NCR reports, audit checklists, training records, calibration logs, and supplier evaluations.',
    pricePublic: 'From R150 each',
    priceSubscriber: 'Free',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    gradient: 'from-amber-500/20 to-amber-400/5',
    border: 'border-amber-500/20',
    iconBg: 'bg-amber-500/20 text-amber-400',
    standards: ['ISO 9001', 'ISO 14001', 'ISO 45001'],
  },
  {
    title: 'Complete ISO 9001 Starter Pack',
    desc: 'Everything you need to build your management system from scratch. Manuals, procedures, forms, and registers — 10+ documents.',
    pricePublic: 'R7,500',
    priceSubscriber: 'R3,500',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    gradient: 'from-green-500/20 to-green-400/5',
    border: 'border-green-500/20',
    iconBg: 'bg-green-500/20 text-green-400',
    standards: ['ISO 9001', 'ISO 14001', 'ISO 45001'],
    featured: true,
  },
]

export default function TemplateMarketplace() {
  const navigate = useNavigate()
  const [enquiryTemplate, setEnquiryTemplate] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', company: '' })
  const [consent, setConsent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [honeypot, setHoneypot] = useState('')

  const handleEnquiry = async (e) => {
    e.preventDefault()
    if (honeypot) { setSubmitted(true); return }
    if (!form.name || !form.email || !form.company) {
      setError('Please fill in all fields.')
      return
    }
    if (!consent) {
      setError('Please agree to the privacy notice to continue.')
      return
    }
    if (!throttle('template-enquiry', 3, 60000)) {
      setError('Too many submissions. Please wait a moment.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await supabase.functions.invoke('notify-lead', {
        body: {
          type: 'template_enquiry',
          data: {
            name: form.name,
            email: form.email,
            company: form.company,
            template_name: enquiryTemplate,
          },
        },
      })
      if (res?.error) console.warn('notify-lead error:', res.error)
    } catch (err) {
      console.warn('notify-lead failed:', err)
    }

    setSubmitting(false)
    setSubmitted(true)
  }

  const closeModal = () => {
    setEnquiryTemplate(null)
    setForm({ name: '', email: '', company: '' })
    setConsent(false)
    setSubmitted(false)
    setError('')
  }

  return (
    <section id="templates" className="py-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-500/30 rounded-full text-xs font-semibold text-amber-300 mb-6">
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
            Template Marketplace
          </div>
          <h2 className="text-4xl font-extrabold mb-4">
            Skip the blank page.{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Start with a template.
            </span>
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            Professional ISO documentation templates automatically branded with your company name, logo, and document numbering.
            Subscribers get most templates free.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {TEMPLATES.map(({ title, desc, icon, gradient, border, iconBg, standards, pricePublic, priceSubscriber, featured }) => (
            <div key={title} className={`relative rounded-2xl border ${border} bg-gradient-to-br ${gradient} p-6 group ${featured ? 'ring-1 ring-green-500/30' : ''}`}>
              {/* Subscriber price badge */}
              <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
                <div className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-xs font-semibold text-green-300">
                  Subscribers: {priceSubscriber}
                </div>
                <span className="text-xs text-white/40">{pricePublic}</span>
              </div>

              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${iconBg}`}>
                {icon}
              </div>

              <h3 className="font-bold text-white text-lg mb-2">{title}</h3>
              <p className="text-white/60 text-sm leading-relaxed mb-4">{desc}</p>

              <div className="flex flex-wrap gap-2 mb-4">
                {standards.map(s => (
                  <span key={s} className="text-xs px-2 py-1 bg-white/5 border border-white/10 rounded-full text-white/50">
                    {s}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/signup')}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Get Started
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
                <button
                  onClick={() => setEnquiryTemplate(title)}
                  className="text-sm text-white/40 hover:text-white/60 transition-colors"
                >
                  Enquire
                </button>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-white/30 mt-8">
          All templates are auto-branded with your company logo and details. Available as professional PDF downloads.
        </p>
      </div>

      {/* Enquiry Modal */}
      {enquiryTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={closeModal}>
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            {submitted ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Enquiry Submitted</h3>
                <p className="text-white/60 text-sm mb-4">We&apos;ll be in touch within 1 business day with pricing and availability for the {enquiryTemplate}.</p>
                <button onClick={closeModal} className="px-6 py-2 border border-white/20 hover:border-white/40 rounded-xl text-white/70 hover:text-white transition-all text-sm">
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleEnquiry} className="space-y-4">
                <h3 className="text-xl font-bold text-white">Enquire: {enquiryTemplate}</h3>
                <p className="text-white/50 text-sm">Leave your details and we&apos;ll send you more information.</p>

                <div>
                  <label className="block text-sm text-white/70 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-cyan-500/50 focus:outline-none transition-colors"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-1">Email *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-cyan-500/50 focus:outline-none transition-colors"
                    placeholder="you@company.co.za"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-1">Company *</label>
                  <input
                    type="text"
                    value={form.company}
                    onChange={e => setForm(prev => ({ ...prev, company: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-cyan-500/50 focus:outline-none transition-colors"
                    placeholder="Company name"
                  />
                </div>

                {/* Honeypot */}
                <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }} aria-hidden="true">
                  <input type="text" name="website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={e => setHoneypot(e.target.value)} />
                </div>

                {/* POPIA Consent */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={e => setConsent(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-white/30 bg-white/10 text-cyan-500 focus:ring-cyan-500/50 flex-shrink-0"
                  />
                  <span className="text-xs text-white/50 leading-relaxed">
                    I consent to ISOGuardian collecting my personal information to respond to this enquiry and contact me about ISO template products. Processed under{' '}
                    <a href="/popia" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline">POPIA</a>.
                    Withdraw consent anytime: support@isoguardian.co.za.
                  </span>
                </label>

                {error && <p className="text-red-400 text-sm">{error}</p>}

                <div className="flex gap-3">
                  <button type="button" onClick={closeModal} className="px-6 py-3 border border-white/20 hover:border-white/40 rounded-xl text-white/70 hover:text-white transition-all">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !consent}
                    className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Sending...' : 'Submit Enquiry'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

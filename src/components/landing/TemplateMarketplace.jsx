import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { throttle } from '../../lib/rateLimiter'
import { trackConversion } from '../../lib/analytics'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

const TEMPLATE_CARDS = [
  {
    id: 'iso-9001-starter',
    title: 'ISO 9001 Starter Pack',
    desc: 'Everything to build a QMS from scratch — quality manual, 5 procedures, 4 forms, and risk register. All cross-referenced.',
    pricePublic: 'R7,500',
    priceSubscriber: 'Free',
    priceValue: 750000,
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    gradient: 'from-cyan-500/20 to-cyan-400/5',
    border: 'border-cyan-500/20',
    iconBg: 'bg-cyan-500/20 text-cyan-400',
    standards: ['ISO 9001'],
    featured: true,
  },
  {
    id: 'iso-14001-starter',
    title: 'ISO 14001 Starter Pack',
    desc: 'Complete environmental management system — policy, aspects register, legal register, waste management, emergency preparedness.',
    pricePublic: 'R7,500',
    priceSubscriber: 'Free',
    priceValue: 750000,
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    gradient: 'from-green-500/20 to-green-400/5',
    border: 'border-green-500/20',
    iconBg: 'bg-green-500/20 text-green-400',
    standards: ['ISO 14001'],
    featured: true,
  },
  {
    id: 'iso-45001-starter',
    title: 'ISO 45001 Starter Pack',
    desc: 'Full OH&S management system — OHS policy, HIRA, incident investigation, safety checklists, PPE register, legal appointments.',
    pricePublic: 'R7,500',
    priceSubscriber: 'Free',
    priceValue: 750000,
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    gradient: 'from-amber-500/20 to-amber-400/5',
    border: 'border-amber-500/20',
    iconBg: 'bg-amber-500/20 text-amber-400',
    standards: ['ISO 45001'],
    featured: true,
  },
  {
    id: 'doc-control-proc',
    title: 'Document Control Procedure',
    desc: 'ISO 9001 Clause 7.5 — document creation, review, approval, distribution, and revision control.',
    pricePublic: 'R500',
    priceSubscriber: 'Free',
    priceValue: 50000,
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    gradient: 'from-purple-500/20 to-purple-400/5',
    border: 'border-purple-500/20',
    iconBg: 'bg-purple-500/20 text-purple-400',
    standards: ['ISO 9001', 'ISO 14001', 'ISO 45001'],
  },
]

export default function TemplateMarketplace() {
  const navigate = useNavigate()
  const formRef = useRef(null)
  const [buying, setBuying] = useState(null) // template id being purchased
  const [buyerForm, setBuyerForm] = useState({ firstName: '', lastName: '', email: '' })
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState(false)
  // Enquiry modal state
  const [enquiryTemplate, setEnquiryTemplate] = useState(null)
  const [enquiryForm, setEnquiryForm] = useState({ name: '', email: '', company: '' })
  const [enquiryConsent, setEnquiryConsent] = useState(false)
  const [enquirySubmitted, setEnquirySubmitted] = useState(false)
  const [enquiryError, setEnquiryError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [honeypot, setHoneypot] = useState('')

  const handleBuyNow = async (e) => {
    e.preventDefault()
    if (!buyerForm.email || !buyerForm.firstName) {
      setError('Please enter your name and email.')
      return
    }
    if (!consent) {
      setError('Please agree to the privacy notice.')
      return
    }
    if (!throttle('template-purchase', 3, 60000)) {
      setError('Too many attempts. Please wait.')
      return
    }

    setProcessing(true)
    setError('')

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'template',
          templateId: buying,
          email: buyerForm.email,
          firstName: buyerForm.firstName,
          lastName: buyerForm.lastName,
        }),
      })

      const data = await res.json()
      if (!data.success) {
        setError(data.error || 'Something went wrong.')
        setProcessing(false)
        return
      }

      trackConversion('template_purchase')

      // Submit to PayFast via hidden form
      const form = formRef.current
      form.action = data.pfUrl
      // Clear existing hidden fields
      while (form.firstChild) form.removeChild(form.firstChild)
      // Add PayFast fields
      for (const [key, val] of Object.entries(data.pfData)) {
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = key
        input.value = val
        form.appendChild(input)
      }
      form.submit()
    } catch {
      setError('Connection failed. Please try again.')
      setProcessing(false)
    }
  }

  const handleEnquiry = async (e) => {
    e.preventDefault()
    if (honeypot) { setEnquirySubmitted(true); return }
    if (!enquiryForm.name || !enquiryForm.email || !enquiryForm.company) {
      setEnquiryError('Please fill in all fields.')
      return
    }
    if (!enquiryConsent) {
      setEnquiryError('Please agree to the privacy notice.')
      return
    }
    if (!throttle('template-enquiry', 3, 60000)) {
      setEnquiryError('Too many submissions. Please wait.')
      return
    }

    setSubmitting(true)
    setEnquiryError('')

    try {
      await supabase.functions.invoke('notify-lead', {
        body: {
          type: 'template_enquiry',
          data: {
            name: enquiryForm.name,
            email: enquiryForm.email,
            company: enquiryForm.company,
            template_name: enquiryTemplate,
          },
        },
      })
    } catch {}

    setSubmitting(false)
    setEnquirySubmitted(true)
  }

  const closeModal = () => {
    setBuying(null)
    setBuyerForm({ firstName: '', lastName: '', email: '' })
    setConsent(false)
    setError('')
    setProcessing(false)
    setEnquiryTemplate(null)
    setEnquiryForm({ name: '', email: '', company: '' })
    setEnquiryConsent(false)
    setEnquirySubmitted(false)
    setEnquiryError('')
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
            Professional ISO documentation templates automatically branded with your company details.
            Subscribers get all templates free. Or buy individually — no subscription required.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {TEMPLATE_CARDS.map((card) => (
            <div key={card.id} className={`relative rounded-2xl border ${card.border} bg-gradient-to-br ${card.gradient} p-6 group ${card.featured ? 'ring-1 ring-green-500/30' : ''}`}>
              {/* Price badges */}
              <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
                <div className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-xs font-semibold text-green-300">
                  Subscribers: {card.priceSubscriber}
                </div>
                <span className="text-xs text-white/40">{card.pricePublic}</span>
              </div>

              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${card.iconBg}`}>
                {card.icon}
              </div>

              <h3 className="font-bold text-white text-lg mb-2">{card.title}</h3>
              <p className="text-white/60 text-sm leading-relaxed mb-4">{card.desc}</p>

              <div className="flex flex-wrap gap-2 mb-4">
                {card.standards.map(s => (
                  <span key={s} className="text-xs px-2 py-1 bg-white/5 border border-white/10 rounded-full text-white/50">
                    {s}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setBuying(card.id)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white text-sm font-semibold rounded-xl transition-all"
                >
                  Buy Now — {card.pricePublic}
                </button>
                <button
                  onClick={() => navigate('/signup')}
                  className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
                >
                  Or subscribe free
                </button>
                <button
                  onClick={() => setEnquiryTemplate(card.title)}
                  className="text-sm text-white/40 hover:text-white/60 transition-colors ml-auto"
                >
                  Enquire
                </button>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-white/30 mt-8">
          All templates are auto-branded with your company details. Delivered as professional PDF downloads within minutes of purchase.
        </p>

        {/* Hidden PayFast form */}
        <form ref={formRef} method="POST" style={{ display: 'none' }} />
      </div>

      {/* ─── Buy Now Modal ─── */}
      {buying && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={closeModal}>
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <form onSubmit={handleBuyNow} className="space-y-4">
              <h3 className="text-xl font-bold text-white">
                Purchase: {TEMPLATE_CARDS.find(t => t.id === buying)?.title}
              </h3>
              <p className="text-white/50 text-sm">
                {TEMPLATE_CARDS.find(t => t.id === buying)?.pricePublic} — one-time payment via PayFast. Download link sent to your email.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-white/70 mb-1">First Name *</label>
                  <input
                    type="text"
                    value={buyerForm.firstName}
                    onChange={e => setBuyerForm(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-cyan-500/50 focus:outline-none transition-colors"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={buyerForm.lastName}
                    onChange={e => setBuyerForm(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-cyan-500/50 focus:outline-none transition-colors"
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-1">Email *</label>
                <input
                  type="email"
                  value={buyerForm.email}
                  onChange={e => setBuyerForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-cyan-500/50 focus:outline-none transition-colors"
                  placeholder="you@company.co.za"
                />
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={e => setConsent(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-white/30 bg-white/10 text-cyan-500 focus:ring-cyan-500/50 flex-shrink-0"
                />
                <span className="text-xs text-white/50 leading-relaxed">
                  I consent to ISOGuardian processing my personal information to complete this purchase and deliver the template.
                  Processed under{' '}
                  <a href="/popia" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline">POPIA</a>.
                </span>
              </label>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <div className="flex gap-3">
                <button type="button" onClick={closeModal} className="px-6 py-3 border border-white/20 hover:border-white/40 rounded-xl text-white/70 hover:text-white transition-all">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing || !consent}
                  className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {processing ? 'Connecting to PayFast...' : 'Pay Now'}
                </button>
              </div>

              <div className="flex items-center gap-2 justify-center pt-2">
                <svg className="w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="text-xs text-white/30">Secure payment via PayFast</span>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Enquiry Modal ─── */}
      {enquiryTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={closeModal}>
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            {enquirySubmitted ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Enquiry Submitted</h3>
                <p className="text-white/60 text-sm mb-4">We&apos;ll be in touch within 1 business day.</p>
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
                  <input type="text" value={enquiryForm.name} onChange={e => setEnquiryForm(prev => ({ ...prev, name: e.target.value }))} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-cyan-500/50 focus:outline-none" placeholder="Your full name" />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-1">Email *</label>
                  <input type="email" value={enquiryForm.email} onChange={e => setEnquiryForm(prev => ({ ...prev, email: e.target.value }))} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-cyan-500/50 focus:outline-none" placeholder="you@company.co.za" />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-1">Company *</label>
                  <input type="text" value={enquiryForm.company} onChange={e => setEnquiryForm(prev => ({ ...prev, company: e.target.value }))} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-cyan-500/50 focus:outline-none" placeholder="Company name" />
                </div>

                {/* Honeypot */}
                <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }} aria-hidden="true">
                  <input type="text" name="website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={e => setHoneypot(e.target.value)} />
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={enquiryConsent} onChange={e => setEnquiryConsent(e.target.checked)} className="mt-1 w-4 h-4 rounded border-white/30 bg-white/10 text-cyan-500 focus:ring-cyan-500/50 flex-shrink-0" />
                  <span className="text-xs text-white/50 leading-relaxed">
                    I consent to ISOGuardian collecting my personal information to respond to this enquiry.
                    Processed under <a href="/popia" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline">POPIA</a>.
                  </span>
                </label>

                {enquiryError && <p className="text-red-400 text-sm">{enquiryError}</p>}

                <div className="flex gap-3">
                  <button type="button" onClick={closeModal} className="px-6 py-3 border border-white/20 hover:border-white/40 rounded-xl text-white/70 hover:text-white transition-all">Cancel</button>
                  <button type="submit" disabled={submitting || !enquiryConsent} className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed">
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

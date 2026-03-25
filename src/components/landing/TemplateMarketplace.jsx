import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { throttle } from '../../lib/rateLimiter'
import { trackConversion } from '../../lib/analytics'
import { TEMPLATES, CROSS_REFERENCES } from '../../lib/templateData'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

// Get template title by ID
const getTitle = (id) => TEMPLATES.find(t => t.id === id)?.title || id

// Format price from cents
const fmtPrice = (cents) => `R${(cents / 100).toLocaleString('en-ZA')}`

// Card configs for the 4 marketplace cards
const CARDS = [
  {
    templateId: 'iso-9001-starter',
    color: 'cyan',
    gradient: 'from-cyan-500/20 to-cyan-400/5',
    border: 'border-cyan-500/20',
    iconBg: 'bg-cyan-500/20 text-cyan-400',
    ring: 'ring-cyan-500/30',
    badge: 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300',
    features: [
      'Complete QMS Manual (Clauses 4–10)',
      '5 core procedures (document control, audit, corrective action, management review, env management)',
      '4 ready-to-use forms (NCR, audit checklist, training record, supplier evaluation)',
      'Risk register with scoring matrix',
      'All documents auto-numbered (IG-XX-DOC-001 format)',
      'Personnel auto-populated from your team',
      'Every document cross-references related procedures and forms',
    ],
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    templateId: 'iso-14001-starter',
    color: 'green',
    gradient: 'from-green-500/20 to-green-400/5',
    border: 'border-green-500/20',
    iconBg: 'bg-green-500/20 text-green-400',
    ring: 'ring-green-500/30',
    badge: 'bg-green-500/20 border-green-500/30 text-green-300',
    features: [
      'Environmental Policy (Clause 5.2)',
      'Aspects & impacts register with significance scoring',
      'SA environmental legal register (NEMA, NWA, NEM:WA, NEM:AQA)',
      'Waste management procedure with waste streams',
      'Emergency preparedness plan',
      'Environmental objectives register with targets',
      'Cross-references to shared risk register and NCR form',
    ],
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    templateId: 'iso-45001-starter',
    color: 'amber',
    gradient: 'from-amber-500/20 to-amber-400/5',
    border: 'border-amber-500/20',
    iconBg: 'bg-amber-500/20 text-amber-400',
    ring: 'ring-amber-500/30',
    badge: 'bg-amber-500/20 border-amber-500/30 text-amber-300',
    features: [
      'OH&S Policy (Clause 5.2)',
      'HIRA procedure with industry examples (construction, mining, manufacturing)',
      'Incident investigation procedure (10.2)',
      'Safety inspection checklist (7 workplace areas)',
      'PPE register with personnel assignment',
      'Legal appointments register (OHS Act Section 16(2))',
      'Emergency response plan with site-specific procedures',
    ],
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    ),
  },
  {
    templateId: 'doc-control-proc',
    color: 'purple',
    gradient: 'from-purple-500/20 to-purple-400/5',
    border: 'border-purple-500/20',
    iconBg: 'bg-purple-500/20 text-purple-400',
    ring: 'ring-purple-500/30',
    badge: 'bg-purple-500/20 border-purple-500/30 text-purple-300',
    features: [
      'Document creation, review, and approval workflow',
      'Version control and revision history tracking',
      'Distribution and access control matrix',
      'Retention and disposal requirements',
      'Cross-references to QMS Manual and NCR form',
    ],
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
]

export default function TemplateMarketplace() {
  const navigate = useNavigate()
  const formRef = useRef(null)
  const [expanded, setExpanded] = useState(null) // which card is showing full preview
  const [buying, setBuying] = useState(null)
  const [buyerForm, setBuyerForm] = useState({ firstName: '', lastName: '', email: '' })
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState(false)
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

      const form = formRef.current
      form.action = data.pfUrl
      while (form.firstChild) form.removeChild(form.firstChild)
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
        body: { type: 'template_enquiry', data: { name: enquiryForm.name, email: enquiryForm.email, company: enquiryForm.company, template_name: enquiryTemplate } },
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
        {/* Header */}
        <div className="text-center mb-6">
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
            Professional ISO documentation templates that <strong className="text-white/80">cross-reference each other</strong> like a neural network.
            Every procedure links to its related forms, registers, and policies — building a complete, interconnected management system.
          </p>
        </div>

        {/* Cross-reference explainer */}
        <div className="max-w-3xl mx-auto mb-12 p-4 bg-white/5 border border-white/10 rounded-2xl">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-1">Documents that talk to each other</h4>
              <p className="text-white/50 text-xs leading-relaxed">
                Unlike static templates, our documents are <strong className="text-white/70">cross-referenced</strong>.
                Your Quality Manual references your Document Control Procedure (IG-XX-SOP-001), which references your NCR Form (IG-XX-FRM-001),
                which links back to your Corrective Action Procedure. Auditors see a <strong className="text-white/70">connected management system</strong>, not a pile of loose documents.
              </p>
            </div>
          </div>
        </div>

        {/* Template Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {CARDS.map((card) => {
            const template = TEMPLATES.find(t => t.id === card.templateId)
            if (!template) return null
            const isBundle = template.docType === 'bundle'
            const bundledDocs = isBundle ? template.bundleTemplateIds : null
            const crossRefs = CROSS_REFERENCES[card.templateId]
            const isExpanded = expanded === card.templateId

            return (
              <div key={card.templateId} className={`relative rounded-2xl border ${card.border} bg-gradient-to-br ${card.gradient} p-6 transition-all duration-300 ${isBundle ? `ring-1 ${card.ring}` : ''}`}>
                {/* Price badges */}
                <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
                  <div className={`px-3 py-1 border rounded-full text-xs font-semibold ${card.badge}`}>
                    Subscribers: Free
                  </div>
                  <span className="text-xs text-white/40">{fmtPrice(template.pricePublic)}</span>
                </div>

                {/* Icon + Title */}
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${card.iconBg}`}>
                  {card.icon}
                </div>
                <h3 className="font-bold text-white text-lg mb-1">{template.title}</h3>
                <p className="text-white/40 text-xs mb-3">
                  {template.standard.replace('_', ' ')} | Clause {template.clauseRef} | {template.docType === 'bundle' ? `${bundledDocs.length} documents` : template.docType}
                </p>
                <p className="text-white/60 text-sm leading-relaxed mb-4">{template.description}</p>

                {/* Bundled documents list (for starter packs) */}
                {isBundle && (
                  <div className="mb-4">
                    <h4 className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-2">Included Documents ({bundledDocs.length})</h4>
                    <div className="grid grid-cols-2 gap-1">
                      {bundledDocs.map(docId => (
                        <div key={docId} className="flex items-center gap-1.5 text-xs text-white/50">
                          <svg className="w-3 h-3 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="truncate">{getTitle(docId)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Features list */}
                <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <h4 className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-2 mt-2">What&apos;s Inside</h4>
                  <ul className="space-y-1.5 mb-4">
                    {card.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-white/60">
                        <svg className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* Cross-reference map */}
                  {crossRefs && (crossRefs.references.length > 0 || crossRefs.referencedBy.length > 0) && (
                    <div className="p-3 bg-black/20 rounded-xl mb-4">
                      <h4 className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        Cross-References
                      </h4>
                      {crossRefs.references.length > 0 && (
                        <div className="mb-2">
                          <span className="text-[10px] text-white/40 uppercase">References:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {crossRefs.references.map(ref => (
                              <span key={ref} className="text-[10px] px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-white/50">
                                {getTitle(ref)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {crossRefs.referencedBy.length > 0 && (
                        <div>
                          <span className="text-[10px] text-white/40 uppercase">Referenced by:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {crossRefs.referencedBy.map(ref => (
                              <span key={ref} className="text-[10px] px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-300/60">
                                {getTitle(ref)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setExpanded(isExpanded ? null : card.templateId)}
                    className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white/80 transition-colors"
                  >
                    <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    {isExpanded ? 'Less' : 'Preview contents'}
                  </button>
                  <div className="flex-1" />
                  <button
                    onClick={() => setBuying(card.templateId)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white text-sm font-semibold rounded-xl transition-all"
                  >
                    Buy — {fmtPrice(template.pricePublic)}
                  </button>
                  <button
                    onClick={() => setEnquiryTemplate(template.title)}
                    className="text-xs text-white/40 hover:text-white/60 transition-colors"
                  >
                    Enquire
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Upsell banner */}
        <div className="mt-8 p-6 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-white/10 rounded-2xl text-center">
          <h3 className="text-white font-bold text-lg mb-2">Want all templates free?</h3>
          <p className="text-white/50 text-sm mb-4">
            Subscribe to ISOGuardian and get every template included — plus live compliance tracking,
            audit management, NCR tracking, and document control.
          </p>
          <button
            onClick={() => navigate('/signup')}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-semibold rounded-xl transition-all"
          >
            Start 14-Day Free Trial
          </button>
        </div>

        <p className="text-center text-xs text-white/30 mt-6">
          All templates are auto-branded with your company details. Delivered as professional PDF downloads within minutes of purchase.
        </p>

        {/* Hidden PayFast form */}
        <form ref={formRef} method="POST" style={{ display: 'none' }} />
      </div>

      {/* ─── Buy Now Modal ─── */}
      {buying && (() => {
        const template = TEMPLATES.find(t => t.id === buying)
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={closeModal}>
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
              <form onSubmit={handleBuyNow} className="space-y-4">
                <h3 className="text-xl font-bold text-white">Purchase: {template?.title}</h3>
                <p className="text-white/50 text-sm">
                  {fmtPrice(template?.pricePublic || 0)} — one-time payment via PayFast. Download link sent to your email within minutes.
                </p>

                {template?.docType === 'bundle' && (
                  <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                    <p className="text-white/60 text-xs font-semibold mb-1">This pack includes {template.bundleTemplateIds.length} documents:</p>
                    <p className="text-white/40 text-xs">{template.bundleTemplateIds.map(getTitle).join(' + ')}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-white/70 mb-1">First Name *</label>
                    <input type="text" value={buyerForm.firstName} onChange={e => setBuyerForm(prev => ({ ...prev, firstName: e.target.value }))} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-cyan-500/50 focus:outline-none transition-colors" placeholder="First name" />
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-1">Last Name</label>
                    <input type="text" value={buyerForm.lastName} onChange={e => setBuyerForm(prev => ({ ...prev, lastName: e.target.value }))} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-cyan-500/50 focus:outline-none transition-colors" placeholder="Last name" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-white/70 mb-1">Email *</label>
                  <input type="email" value={buyerForm.email} onChange={e => setBuyerForm(prev => ({ ...prev, email: e.target.value }))} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-cyan-500/50 focus:outline-none transition-colors" placeholder="you@company.co.za" />
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-1 w-4 h-4 rounded border-white/30 bg-white/10 text-cyan-500 focus:ring-cyan-500/50 flex-shrink-0" />
                  <span className="text-xs text-white/50 leading-relaxed">
                    I consent to ISOGuardian processing my personal information to complete this purchase and deliver the template.
                    Processed under <a href="/popia" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline">POPIA</a>.
                  </span>
                </label>

                {error && <p className="text-red-400 text-sm">{error}</p>}

                <div className="flex gap-3">
                  <button type="button" onClick={closeModal} className="px-6 py-3 border border-white/20 hover:border-white/40 rounded-xl text-white/70 hover:text-white transition-all">Cancel</button>
                  <button type="submit" disabled={processing || !consent} className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                    {processing ? 'Connecting to PayFast...' : 'Pay Now'}
                  </button>
                </div>

                <div className="flex items-center gap-2 justify-center pt-1">
                  <svg className="w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className="text-xs text-white/30">Secure payment via PayFast</span>
                </div>
              </form>
            </div>
          </div>
        )
      })()}

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
                <button onClick={closeModal} className="px-6 py-2 border border-white/20 hover:border-white/40 rounded-xl text-white/70 hover:text-white transition-all text-sm">Close</button>
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

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { throttle } from '../../lib/rateLimiter'

const SUPPORT_EMAIL = 'support@isoguardian.co.za'
const WHATSAPP_URL = 'https://wa.me/27716060250'

export default function ConsultationUpsell() {
  const [form, setForm] = useState({ name: '', email: '', company: '', standard: 'ISO 9001', preferred_date: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [honeypot, setHoneypot] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Bot detection
    if (honeypot) {
      setSubmitted(true)
      return
    }

    if (!form.name || !form.email || !form.company) {
      setError('Please fill in name, email, and company.')
      return
    }

    // Rate limiting
    if (!throttle('consultation-submit', 3, 60000)) {
      setError('Too many submissions. Please wait a moment before trying again.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const { error: dbError } = await supabase.from('consultation_requests').insert({
        name: form.name,
        email: form.email,
        company: form.company,
        standard: form.standard,
        preferred_date: form.preferred_date || null,
        message: form.message || null,
      })
      if (dbError) throw dbError
      setSubmitted(true)
    } catch {
      setError('Something went wrong. Please try emailing us directly.')
    }

    setSubmitting(false)
  }

  return (
    <section id="consultation" className="py-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left — copy */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-full text-xs font-semibold text-purple-300 mb-6">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
              Expert Guidance
            </div>

            <h2 className="text-4xl font-extrabold mb-4">
              Need help getting{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                certification-ready?
              </span>
            </h2>

            <p className="text-white/70 mb-6 leading-relaxed">
              Our network of experienced ISO consultants can guide you through the entire
              certification journey {'\u2014'} from initial gap analysis to successful audit.
              Every engagement is tailored to your business.
            </p>

            <ul className="space-y-4 mb-8">
              {[
                { title: 'Gap Analysis & Roadmap', desc: 'Comprehensive review of your current systems against ISO requirements with a clear action plan.' },
                { title: 'Documentation Support', desc: 'Help developing policies, procedures, and records that meet standard requirements.' },
                { title: 'Internal Audit Preparation', desc: 'Mock audits and readiness checks before your certification body arrives.' },
                { title: 'Ongoing Advisory', desc: 'Continued support for surveillance audits and continual improvement.' },
              ].map(({ title, desc }) => (
                <li key={title} className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  <div>
                    <p className="font-bold text-white">{title}</p>
                    <p className="text-white/60 text-sm">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>

            <p className="text-xs text-white/40 mb-4">
              Pricing discussed per engagement. Every business is different {'\u2014'} we tailor our approach to your needs and budget.
            </p>

            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600/20 hover:bg-green-600/30 border border-green-500/40 font-bold rounded-xl transition-all text-green-300"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              Prefer WhatsApp? Chat with us
            </a>
          </div>

          {/* Right — form */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
            {submitted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Request Submitted</h3>
                <p className="text-white/60 mb-4">We'll be in touch within 1 business day to discuss your needs.</p>
                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-cyan-400 hover:text-cyan-300 text-sm underline">
                  {SUPPORT_EMAIL}
                </a>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-xl font-bold text-white mb-1">Request a Consultation</h3>
                <p className="text-white/50 text-sm mb-4">Tell us about your needs and we'll connect you with the right consultant.</p>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/70 mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-purple-500/50 focus:outline-none transition-colors"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-1">Email *</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-purple-500/50 focus:outline-none transition-colors"
                      placeholder="you@company.co.za"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/70 mb-1">Company *</label>
                    <input
                      type="text"
                      value={form.company}
                      onChange={e => setForm(prev => ({ ...prev, company: e.target.value }))}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-purple-500/50 focus:outline-none transition-colors"
                      placeholder="Company name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-1">ISO Standard</label>
                    <select
                      value={form.standard}
                      onChange={e => setForm(prev => ({ ...prev, standard: e.target.value }))}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:border-purple-500/50 focus:outline-none transition-colors"
                    >
                      <option value="ISO 9001" className="bg-slate-900">ISO 9001:2015</option>
                      <option value="ISO 14001" className="bg-slate-900">ISO 14001:2015</option>
                      <option value="ISO 45001" className="bg-slate-900">ISO 45001:2018</option>
                      <option value="Multiple" className="bg-slate-900">Multiple Standards</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-white/70 mb-1">Preferred Date (optional)</label>
                  <input
                    type="date"
                    value={form.preferred_date}
                    onChange={e => setForm(prev => ({ ...prev, preferred_date: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:border-purple-500/50 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm text-white/70 mb-1">Message (optional)</label>
                  <textarea
                    value={form.message}
                    onChange={e => setForm(prev => ({ ...prev, message: e.target.value }))}
                    rows={3}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-purple-500/50 focus:outline-none transition-colors resize-none"
                    placeholder="Tell us about your current situation..."
                  />
                </div>

                {/* Honeypot — hidden from humans */}
                <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }} aria-hidden="true">
                  <input type="text" name="website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={e => setHoneypot(e.target.value)} />
                </div>

                {error && <p className="text-red-400 text-sm">{error}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 font-bold rounded-xl transition-all disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Request Consultation'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

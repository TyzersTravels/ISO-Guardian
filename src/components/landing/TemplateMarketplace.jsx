const SUPPORT_EMAIL = 'support@isoguardian.co.za'

const TEMPLATES = [
  {
    title: 'Quality Manual Bundle',
    desc: 'Complete ISO 9001 quality manual template with policies, scope, and process descriptions. Ready to customise for your business.',
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
    desc: 'Pre-built forms for NCR reports, audit checklists, training records, calibration logs, and HIRA worksheets.',
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
    title: 'Complete ISO Starter Pack',
    desc: 'Everything you need to build your management system from scratch. Manuals, procedures, forms, and records across all three standards.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    gradient: 'from-green-500/20 to-green-400/5',
    border: 'border-green-500/20',
    iconBg: 'bg-green-500/20 text-green-400',
    standards: ['ISO 9001', 'ISO 14001', 'ISO 45001'],
  },
]

export default function TemplateMarketplace() {
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
            Professional ISO documentation templates developed by experienced consultants.
            Customise them for your business and fast-track your certification journey.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {TEMPLATES.map(({ title, desc, icon, gradient, border, iconBg, standards }) => (
            <div key={title} className={`relative rounded-2xl border ${border} bg-gradient-to-br ${gradient} p-6 group`}>
              {/* Coming Soon badge */}
              <div className="absolute top-4 right-4 px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-xs font-semibold text-purple-300">
                Coming Soon
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

              <a
                href={`mailto:${SUPPORT_EMAIL}?subject=Template%20Enquiry%20%E2%80%94%20${encodeURIComponent(title)}`}
                className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Enquire
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-white/30 mt-8">
          All templates are provided in editable formats. Pricing available on enquiry.
        </p>
      </div>
    </section>
  )
}

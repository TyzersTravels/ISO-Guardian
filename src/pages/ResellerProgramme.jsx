import PublicLayout from '../components/PublicLayout'
import { Helmet } from 'react-helmet-async'

const benefits = [
  {
    title: 'Dedicated Dashboard',
    desc: 'Access a purpose-built reseller dashboard to monitor all your clients, track onboarding progress, and manage your entire portfolio in one place.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/20',
  },
  {
    title: 'Client Management',
    desc: 'Onboard new clients directly through the platform. Manage their subscriptions, view compliance progress, and provide hands-on support from a single interface.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
    color: 'text-purple-400',
    bg: 'bg-purple-500/20',
  },
  {
    title: 'Branded Onboarding',
    desc: 'Deliver a professional experience with branded client onboarding flows and PDF exports. Your clients see your branding — ISOGuardian powers the platform behind the scenes.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
    color: 'text-green-400',
    bg: 'bg-green-500/20',
  },
  {
    title: 'Commission Tracking',
    desc: 'Real-time visibility into your earnings. Track commissions per client, view payment history, and forecast your recurring revenue — all from your reseller dashboard.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'text-amber-400',
    bg: 'bg-amber-500/20',
  },
]

const steps = [
  {
    number: '01',
    title: 'Apply',
    description: 'Submit your application with details about your consulting practice and client base. Our team reviews and approves qualified partners within 48 hours.',
  },
  {
    number: '02',
    title: 'Onboard Clients',
    description: 'Use your dedicated partner link and reseller dashboard to onboard clients directly onto the ISOGuardian platform. We handle the tech — you own the relationship.',
  },
  {
    number: '03',
    title: 'Earn',
    description: 'Earn 25% recurring commission on every client\'s monthly subscription for life. No caps, no limits. As your portfolio grows, so does your revenue.',
  },
]

const requirements = [
  'Active SHEQ consulting practice or related professional services',
  'Existing client base in need of ISO compliance management',
  'Understanding of ISO 9001, 14001, or 45001 management systems',
  'Commitment to supporting client onboarding and adoption',
  'South African registered business (Pty Ltd, CC, or sole proprietor)',
]

export default function ResellerProgramme() {
  return (
    <PublicLayout>
      <Helmet>
        <title>Reseller Programme - ISOGuardian</title>
        <meta name="description" content="Partner with ISOGuardian as a reseller. Earn 25% recurring commission on client MRR for life. Dedicated dashboard, client management, branded onboarding, and commission tracking." />
        <meta property="og:title" content="Reseller Programme - ISOGuardian" />
        <meta property="og:description" content="Earn 25% recurring commission by reselling ISOGuardian to your consulting clients. Dedicated dashboard and support." />
        <meta property="og:url" content="https://isoguardian.co.za/reseller-programme" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://isoguardian.co.za/reseller-programme" />
      </Helmet>

      <div className="max-w-5xl mx-auto pb-20 space-y-16">
        {/* Hero */}
        <div className="text-center pt-8 pb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 rounded-full text-xs font-semibold text-cyan-300 mb-6">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
            Reseller Programme
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Grow With Us
            </span>
          </h1>
          <p className="text-white/60 max-w-2xl mx-auto text-lg mb-4">
            Partner with ISOGuardian and unlock a powerful recurring revenue stream.
            Earn <span className="text-cyan-400 font-semibold">25% commission</span> on every client's monthly subscription — for life.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-white/60">
            <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
            Lifetime recurring commission — no caps, no limits
          </div>
        </div>

        {/* Benefits */}
        <section>
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-10">
            Why Partner With Us
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {benefits.map(({ title, desc, icon, color, bg }) => (
              <div key={title} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 hover:bg-white/10 transition-all">
                <div className={`w-14 h-14 rounded-2xl ${bg} flex items-center justify-center ${color} mb-4`}>
                  {icon}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section>
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-10">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center">
                  <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                    {step.number}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{step.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Commission Highlight */}
        <section className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-white/10 rounded-2xl p-8 sm:p-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            25% Recurring Commission
          </h2>
          <p className="text-white/70 max-w-2xl mx-auto mb-8">
            Every client you bring to ISOGuardian earns you 25% of their monthly recurring revenue
            for the lifetime of their subscription. No caps. No clawbacks. As your portfolio grows, so does your income.
          </p>
          <div className="grid sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-2xl font-bold text-cyan-400">R500</p>
              <p className="text-xs text-white/50 mt-1">per Starter client/mo</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-2xl font-bold text-purple-400">R925</p>
              <p className="text-xs text-white/50 mt-1">per Growth client/mo</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-2xl font-bold text-pink-400">Custom</p>
              <p className="text-xs text-white/50 mt-1">per Enterprise client/mo</p>
            </div>
          </div>
        </section>

        {/* Programme at a Glance */}
        <section className="relative">
          <div className="absolute -top-4 right-4 sm:right-8 z-10">
            <div className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full text-xs font-bold text-white shadow-lg shadow-purple-900/40">
              Recurring income
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
            <h3 className="text-xl font-bold text-white text-center mb-8">
              Programme at a Glance
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Manage all clients', value: 'One dashboard', color: 'text-cyan-400' },
                { label: 'Commission type', value: 'Recurring', color: 'text-purple-400' },
                { label: 'Commission duration', value: 'Customer lifetime*', color: 'text-green-400' },
                { label: 'Upfront cost', value: 'R0', color: 'text-amber-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="text-center">
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-2">{label}</p>
                  <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Requirements */}
        <section>
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-10">
            Requirements
          </h2>
          <div className="max-w-2xl mx-auto bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 sm:p-8">
            <ul className="space-y-4">
              {requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                  <span className="text-white/70 text-sm">{req}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Ready to Partner?
          </h2>
          <p className="text-white/60 mb-8 max-w-lg mx-auto">
            Get in touch with our partnerships team to discuss how ISOGuardian can complement your consulting practice.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="mailto:support@isoguardian.co.za?subject=Reseller%20Programme%20Application"
              className="px-10 py-4 font-bold bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 rounded-2xl transition-all shadow-xl shadow-purple-900/40 text-white text-lg inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              Apply to Become a Reseller
            </a>
            <a
              href="https://wa.me/27716060250"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 font-bold border border-white/20 hover:border-white/40 hover:bg-white/5 rounded-2xl transition-all text-white text-lg inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp Us
            </a>
          </div>
          <p className="text-xs text-white/30 mt-6">
            *Commission earned for as long as referred client remains an active subscriber.
          </p>
        </section>
      </div>
    </PublicLayout>
  )
}

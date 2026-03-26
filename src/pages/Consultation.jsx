import PublicLayout from '../components/PublicLayout'
import { Helmet } from 'react-helmet-async'
import ConsultationUpsell from '../components/landing/ConsultationUpsell'

export default function Consultation() {
  return (
    <PublicLayout>
      <Helmet>
        <title>Expert ISO Consultation - ISOGuardian</title>
        <meta name="description" content="Book a one-on-one consultation with our ISO compliance experts. Get tailored guidance on ISO 9001, 14001, and 45001 implementation for your South African business." />
        <meta property="og:title" content="Expert ISO Consultation - ISOGuardian" />
        <meta property="og:description" content="Book a consultation with our ISO compliance experts. Tailored guidance for ISO 9001, 14001, and 45001." />
        <meta property="og:url" content="https://isoguardian.co.za/consultation" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://isoguardian.co.za/consultation" />
      </Helmet>

      <div className="max-w-4xl mx-auto pb-20">
        {/* Hero */}
        <div className="text-center pt-8 pb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 rounded-full text-xs font-semibold text-cyan-300 mb-6">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
            Expert Guidance
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Expert Consultation
            </span>
          </h1>
          <p className="text-white/60 max-w-2xl mx-auto text-lg">
            Get tailored guidance from our ISO compliance specialists. Whether you are starting your compliance
            journey or preparing for certification, we are here to help.
          </p>
        </div>

        {/* Consultation Form */}
        <ConsultationUpsell />
      </div>
    </PublicLayout>
  )
}

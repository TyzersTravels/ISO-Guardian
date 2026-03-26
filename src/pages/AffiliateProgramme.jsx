import PublicLayout from '../components/PublicLayout'
import { Helmet } from 'react-helmet-async'
import { useNavigate } from 'react-router-dom'

const steps = [
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
      </svg>
    ),
    title: 'Share Your Link',
    description: 'Sign up for an ISOGuardian account and get your unique referral link. Share it with colleagues, clients, or anyone who could benefit from ISO compliance management.',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
      </svg>
    ),
    title: 'Friend Signs Up',
    description: 'When someone uses your referral link to sign up for a paid ISOGuardian subscription, the referral is tracked automatically. No manual forms needed.',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    ),
    title: 'Both Get Rewarded',
    description: 'You receive 1 month free on your subscription for every successful referral. Your friend starts with the confidence of a trusted recommendation.',
  },
]

const comparisonRows = [
  { feature: 'Who is it for?', affiliate: 'Any ISOGuardian user', reseller: 'SHEQ consultants & partners' },
  { feature: 'Reward type', affiliate: '1 month free per referral', reseller: '25% recurring commission for life' },
  { feature: 'Dashboard', affiliate: 'Referral tracking in profile', reseller: 'Dedicated reseller dashboard' },
  { feature: 'Client management', affiliate: 'No', reseller: 'Yes — full client portfolio view' },
  { feature: 'Requirements', affiliate: 'Active ISOGuardian account', reseller: 'SHEQ consulting experience + client base' },
  { feature: 'Onboarding support', affiliate: 'Self-service', reseller: 'Dedicated partner onboarding' },
  { feature: 'Branded experience', affiliate: 'No', reseller: 'Yes — branded client onboarding' },
  { feature: 'Revenue model', affiliate: 'Credits (1 month free)', reseller: 'Cash commission (25% MRR)' },
]

export default function AffiliateProgramme() {
  const navigate = useNavigate()

  return (
    <PublicLayout>
      <Helmet>
        <title>Affiliate Programme - ISOGuardian</title>
        <meta name="description" content="Refer friends and colleagues to ISOGuardian and earn 1 month free for every successful referral. Share your unique link and both get rewarded." />
        <meta property="og:title" content="Affiliate Programme - ISOGuardian" />
        <meta property="og:description" content="Earn 1 month free for every successful referral to ISOGuardian. Share your link and get rewarded." />
        <meta property="og:url" content="https://isoguardian.co.za/affiliate" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://isoguardian.co.za/affiliate" />
      </Helmet>

      <div className="max-w-5xl mx-auto pb-20 space-y-16">
        {/* Hero */}
        <div className="text-center pt-8 pb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-full text-xs font-semibold text-purple-300 mb-6">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
            Affiliate Programme
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Share & Save
            </span>
          </h1>
          <p className="text-white/60 max-w-2xl mx-auto text-lg mb-4">
            Love ISOGuardian? Share it with your network and get rewarded.
            Earn <span className="text-cyan-400 font-semibold">1 month free</span> for every successful referral.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-white/60">
            <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
            No limits on referrals — the more you share, the more you save
          </div>
        </div>

        {/* How It Works */}
        <section>
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-10">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center text-cyan-400">
                  {step.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{step.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Reward Highlight */}
        <section className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-white/10 rounded-2xl p-8 sm:p-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            1 Month Free Per Referral
          </h2>
          <p className="text-white/70 max-w-2xl mx-auto mb-8">
            For every person you refer who converts to a paid ISOGuardian subscription,
            you receive a full month free on your own subscription. There is no cap on referrals —
            the more you share, the more you save.
          </p>
          <div className="grid sm:grid-cols-3 gap-6 max-w-xl mx-auto">
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-3xl font-bold text-cyan-400">1</p>
              <p className="text-xs text-white/50 mt-1">referral = 1 month free</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-3xl font-bold text-purple-400">5</p>
              <p className="text-xs text-white/50 mt-1">referrals = 5 months free</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-3xl font-bold text-pink-400">No Cap</p>
              <p className="text-xs text-white/50 mt-1">unlimited referrals</p>
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section>
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-4">
            Affiliate vs Reseller
          </h2>
          <p className="text-white/60 text-center mb-10 max-w-2xl mx-auto">
            Not sure which programme is right for you? Here is a quick comparison.
            The affiliate programme is for anyone, while the reseller programme is designed for established SHEQ consultants.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full max-w-3xl mx-auto">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-white/50 text-xs uppercase tracking-wider py-3 px-4">Feature</th>
                  <th className="text-left text-cyan-400 text-xs uppercase tracking-wider py-3 px-4">Affiliate</th>
                  <th className="text-left text-purple-400 text-xs uppercase tracking-wider py-3 px-4">Reseller</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 text-sm text-white/70 font-medium">{row.feature}</td>
                    <td className="py-3 px-4 text-sm text-white/60">{row.affiliate}</td>
                    <td className="py-3 px-4 text-sm text-white/60">{row.reseller}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-center mt-6">
            <a
              href="/reseller-programme"
              className="text-sm text-purple-400 hover:text-purple-300 underline underline-offset-4 transition-colors"
            >
              Learn more about the Reseller Programme
            </a>
          </p>
        </section>

        {/* CTA */}
        <section className="text-center py-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Start Referring Today
          </h2>
          <p className="text-white/60 mb-8 max-w-lg mx-auto">
            Sign up for an ISOGuardian account to get your unique referral link.
            Already have an account? Find your referral code in your profile settings.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/signup')}
              className="px-10 py-4 font-bold bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 rounded-2xl transition-all shadow-xl shadow-purple-900/40 text-white text-lg"
            >
              Sign Up & Get Your Link
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-4 font-bold border border-white/20 hover:border-white/40 hover:bg-white/5 rounded-2xl transition-all text-white text-lg"
            >
              Log In to Your Account
            </button>
          </div>
        </section>
      </div>
    </PublicLayout>
  )
}

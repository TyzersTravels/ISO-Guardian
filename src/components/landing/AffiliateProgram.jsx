import { useNavigate } from 'react-router-dom'

export default function AffiliateProgram() {
  const navigate = useNavigate()

  return (
    <section id="affiliate" className="py-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-full text-xs font-semibold text-green-300 mb-6">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Referral Programme
          </div>
          <h2 className="text-4xl font-extrabold mb-4">
            Know someone who needs{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              ISO compliance?
            </span>
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            Refer a business to ISOGuardian and earn a free month of service when they subscribe.
            No minimum commitment. No catch.
          </p>
        </div>

        {/* 3-step visual */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            {
              num: '01',
              title: 'Share Your Link',
              desc: 'Sign up and get a unique referral link. Share it with anyone who could benefit from ISO compliance management.',
              icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              ),
              color: 'text-cyan-400',
              bg: 'bg-cyan-500/20',
            },
            {
              num: '02',
              title: 'They Book a Demo',
              desc: 'When someone uses your link to book a demo and onboard as a paying client, we track the referral automatically.',
              icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              ),
              color: 'text-purple-400',
              bg: 'bg-purple-500/20',
            },
            {
              num: '03',
              title: 'You Earn Credit',
              desc: 'When they convert to a paid subscription, you get 1 month free added to your account. Refer as many as you like.',
              icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
              color: 'text-green-400',
              bg: 'bg-green-500/20',
            },
          ].map(({ num, title, desc, icon, color, bg }) => (
            <div key={num} className="bg-white/5 border border-white/10 rounded-2xl p-6 relative">
              <div className={`w-14 h-14 rounded-2xl ${bg} flex items-center justify-center ${color} mb-4`}>
                {icon}
              </div>
              <div className="text-4xl font-black text-white/10 absolute top-4 right-4">{num}</div>
              <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
              <p className="text-white/60 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* Comparison: Resellers vs Affiliates */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl mb-8">
          <h3 className="text-xl font-bold text-white text-center mb-6">
            Reseller Programme vs Affiliate Programme
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Reseller */}
            <div className="border border-cyan-500/20 rounded-2xl p-6 bg-cyan-500/5">
              <h4 className="text-lg font-bold text-cyan-400 mb-4">Reseller Partner</h4>
              <ul className="space-y-3">
                {[
                  'For ISO consultants & agencies',
                  '25% recurring commission',
                  'Commission for customer lifetime',
                  'Multi-client management dashboard',
                  'Onboard clients directly',
                  'Application required',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2 text-sm text-white/70">
                    <svg className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Affiliate */}
            <div className="border border-green-500/20 rounded-2xl p-6 bg-green-500/5">
              <h4 className="text-lg font-bold text-green-400 mb-4">Affiliate Referrer</h4>
              <ul className="space-y-3">
                {[
                  'For anyone who knows a business',
                  '1 month free per conversion',
                  'No minimum commitment',
                  'Simple referral link',
                  'No onboarding required',
                  'Open to all ISOGuardian users',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2 text-sm text-white/70">
                    <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={() => navigate('/login')}
            className="px-10 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 font-bold rounded-2xl transition-all shadow-xl shadow-green-900/40 text-lg"
          >
            Sign Up to Get Your Referral Link
          </button>
          <p className="text-xs text-white/30 mt-4">
            Referral links are generated automatically when you create an account.
          </p>
        </div>
      </div>
    </section>
  )
}

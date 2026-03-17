import { Navigate, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useAuth } from '../contexts/AuthContext'

const ProtectedRoute = ({ children }) => {
  const { user, loading, subscriptionStatus, isSuperAdmin } = useAuth()
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          Loading...
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Super admin always has access
  if (!isSuperAdmin && subscriptionStatus && !subscriptionStatus.allowed) {
    return (
      <>
        <Helmet>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <SubscriptionBlockedScreen reason={subscriptionStatus.reason} navigate={navigate} />
      </>
    )
  }

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      {/* Subscription warning banners */}
      {subscriptionStatus?.reason === 'trial' && subscriptionStatus.daysRemaining <= 3 && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/30 px-4 py-2 text-center text-yellow-300 text-sm">
          Your trial ends in {subscriptionStatus.daysRemaining} day{subscriptionStatus.daysRemaining !== 1 ? 's' : ''}.
          <button onClick={() => navigate('/settings')} className="underline ml-1 font-semibold hover:text-yellow-200">Upgrade now</button>
        </div>
      )}
      {subscriptionStatus?.reason === 'past_due_grace' && (
        <div className="bg-red-500/10 border-b border-red-500/30 px-4 py-2 text-center text-red-300 text-sm">
          Payment failed. You have {subscriptionStatus.daysRemaining} day{subscriptionStatus.daysRemaining !== 1 ? 's' : ''} to resolve this before access is suspended.
          <button onClick={() => navigate('/settings')} className="underline ml-1 font-semibold hover:text-red-200">Update payment</button>
        </div>
      )}
      {subscriptionStatus?.reason === 'cancelled_active_period' && (
        <div className="bg-orange-500/10 border-b border-orange-500/30 px-4 py-2 text-center text-orange-300 text-sm">
          Your subscription has been cancelled. Access ends in {subscriptionStatus.daysRemaining} day{subscriptionStatus.daysRemaining !== 1 ? 's' : ''}.
          <button onClick={() => navigate('/settings')} className="underline ml-1 font-semibold hover:text-orange-200">Reactivate</button>
        </div>
      )}
      {children}
    </>
  )
}

// Blocked screen when subscription is expired/cancelled/missing
const SubscriptionBlockedScreen = ({ reason, navigate }) => {
  const messages = {
    no_subscription: {
      title: 'No Active Subscription',
      desc: 'You need an active subscription to access ISOGuardian. Start your 14-day free trial or contact your administrator.',
      cta: 'View Plans',
      ctaAction: () => window.location.href = '/#pricing',
    },
    trial_expired: {
      title: 'Free Trial Expired',
      desc: 'Your 14-day free trial has ended. Subscribe now to continue managing your ISO compliance.',
      cta: 'Subscribe Now',
      ctaAction: () => window.location.href = '/#pricing',
    },
    past_due_expired: {
      title: 'Account Suspended',
      desc: 'Your payment is overdue and the grace period has ended. Please update your payment method to restore access.',
      cta: 'Update Payment',
      ctaAction: () => navigate('/settings'),
    },
    cancelled: {
      title: 'Subscription Cancelled',
      desc: 'Your subscription has been cancelled and the access period has ended. Resubscribe to continue.',
      cta: 'Resubscribe',
      ctaAction: () => window.location.href = '/#pricing',
    },
    expired: {
      title: 'Subscription Expired',
      desc: 'Your subscription has expired. Renew to continue accessing your ISO compliance data.',
      cta: 'Renew Subscription',
      ctaAction: () => window.location.href = '/#pricing',
    },
  }

  const msg = messages[reason] || messages.expired

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-white mb-3">{msg.title}</h2>
        <p className="text-white/60 mb-8 leading-relaxed">{msg.desc}</p>

        <button
          onClick={msg.ctaAction}
          className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all"
        >
          {msg.cta}
        </button>

        <p className="text-white/40 text-sm mt-4">
          Need help? Contact <a href="mailto:support@isoguardian.co.za" className="text-cyan-400 hover:underline">support@isoguardian.co.za</a>
        </p>
      </div>
    </div>
  )
}

export default ProtectedRoute

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState(null)
  const [viewingClient, setViewingClient] = useState(null) // { company_id, name } of client being viewed
  const [isReseller, setIsReseller] = useState(false)
  const [resellerClients, setResellerClients] = useState([])
  const [subscriptionStatus, setSubscriptionStatus] = useState(null) // { allowed, reason, daysRemaining, tier, status }

  useEffect(() => {
    const publicPaths = ['/', '/login', '/popia', '/terms', '/privacy', '/password-recovery', '/reset-password', '/auditor', '/standards', '/reseller-programme', '/affiliate', '/consultation', '/demo']
    const isPublicPath = publicPaths.includes(window.location.pathname) || window.location.pathname.startsWith('/standards/')

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        // Only stamp session on protected pages — public pages must NOT overwrite the token
        if (!isPublicPath) stampSession(session.user.id)
        fetchUserProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
        setUserProfile(null)
        setUser(null)
        setViewingClient(null)
        setIsReseller(false)
        setResellerClients([])
        setLoading(false)
        const onPublic = publicPaths.includes(window.location.pathname) || window.location.pathname.startsWith('/standards/')
        if (!onPublic) {
          window.location.href = '/login'
        }
      } else if (session?.user) {
        fetchUserProfile(session.user.id)
      } else {
        setUserProfile(null)
        setLoading(false)
      }
    })

    const sessionCheck = setInterval(async () => {
      const onPublic = publicPaths.includes(window.location.pathname) || window.location.pathname.startsWith('/standards/')
      if (onPublic) return
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error || !session) {
        setUser(null)
        setUserProfile(null)
        window.location.href = '/login'
        return
      }
      // Concurrent session check: only one device per account
      const { data: currentUser } = await supabase
        .from('users')
        .select('active_session_token')
        .eq('id', session.user.id)
        .single()
      if (currentUser?.active_session_token && currentUser.active_session_token !== sessionToken) {
        await supabase.auth.signOut()
        setUser(null)
        setUserProfile(null)
        window.location.href = '/login?reason=session_replaced'
      }
    }, 30000)

    // Idle session timeout — 30 minutes of no activity
    const IDLE_TIMEOUT = 30 * 60 * 1000
    let idleTimer = null
    const resetIdleTimer = () => {
      if (idleTimer) clearTimeout(idleTimer)
      idleTimer = setTimeout(async () => {
        if (publicPaths.includes(window.location.pathname) || window.location.pathname.startsWith('/standards/')) return
        const { data: { session: s } } = await supabase.auth.getSession()
        if (s) {
          await supabase.auth.signOut()
          setUser(null)
          setUserProfile(null)
          window.location.href = '/login?reason=idle_timeout'
        }
      }, IDLE_TIMEOUT)
    }
    const idleEvents = ['mousedown', 'keydown', 'scroll', 'touchstart']
    idleEvents.forEach(e => window.addEventListener(e, resetIdleTimer))
    resetIdleTimer()

    return () => {
      subscription.unsubscribe()
      clearInterval(sessionCheck)
      if (idleTimer) clearTimeout(idleTimer)
      idleEvents.forEach(e => window.removeEventListener(e, resetIdleTimer))
    }
  }, [])

  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id, email, full_name, role, company_id, referral_code, referred_by, created_at, standards_access, must_change_password,
          company:companies!users_company_id_fkey(id, name, company_code, logo_url, industry)
        `)
        .eq('id', userId)
        .single()

      if (error) throw error
      setUserProfile(data)

      // Check if this user is a reseller (try company_id as text, fallback to email)
      let reseller = null
      const { data: resellerByCompany, error: rcErr } = await supabase
        .from('resellers')
        .select('id, company_id, contact_email, commission_rate')
        .eq('company_id', String(data.company_id))
        .maybeSingle()

      if (resellerByCompany) {
        reseller = resellerByCompany
      } else {
        const { data: resellerByEmail } = await supabase
          .from('resellers')
          .select('id, company_id, contact_email, commission_rate')
          .eq('contact_email', data.email)
          .maybeSingle()
        reseller = resellerByEmail
      }

      if (reseller) {
        setIsReseller(true)
        // Fetch their clients
        const { data: clients } = await supabase
          .from('reseller_clients')
          .select('id, reseller_id, client_company_id, client_name, status')
          .eq('reseller_id', reseller.id)
          .order('client_name')
        setResellerClients(clients || [])
      }

      // Fetch subscription status (super_admin always has access)
      if (data.role !== 'super_admin') {
        await fetchSubscriptionStatus(data.company_id)
      } else {
        setSubscriptionStatus({ allowed: true, reason: 'super_admin', tier: 'Enterprise', status: 'active' })
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSubscriptionStatus = async (companyId) => {
    try {
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('id, plan, status, trial_ends_at, trial_end_date, grace_period_end, next_billing_date, users_count, total_amount')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!sub) {
        setSubscriptionStatus({ allowed: false, reason: 'no_subscription', tier: null, status: 'none' })
        return
      }

      const now = new Date()
      let allowed = false
      let reason = ''
      let daysRemaining = null
      // Use trial_ends_at (PayFast flow) or trial_end_date (original column)
      const trialEnd = sub.trial_ends_at || sub.trial_end_date

      if (sub.status === 'active' || sub.status === 'Active') {
        allowed = true
        reason = 'active'
      } else if (sub.status === 'trial') {
        if (trialEnd && new Date(trialEnd) > now) {
          allowed = true
          reason = 'trial'
          daysRemaining = Math.ceil((new Date(trialEnd).getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
        } else {
          allowed = false
          reason = 'trial_expired'
        }
      } else if (sub.status === 'past_due') {
        if (sub.grace_period_end && new Date(sub.grace_period_end) > now) {
          allowed = true
          reason = 'past_due_grace'
          daysRemaining = Math.ceil((new Date(sub.grace_period_end).getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
        } else {
          allowed = false
          reason = 'past_due_expired'
        }
      } else if (sub.status === 'pending') {
        // Manually onboarded but not yet paid — allow access (admin created)
        allowed = true
        reason = 'pending_manual'
      } else {
        allowed = false
        reason = sub.status || 'unknown'
      }

      setSubscriptionStatus({
        allowed,
        reason,
        daysRemaining,
        tier: sub.plan,
        status: sub.status,
        price: sub.total_amount,
        maxUsers: sub.users_count,
      })
    } catch (err) {
      console.error('Error fetching subscription:', err)
      // On error, allow access to prevent locking out users
      setSubscriptionStatus({ allowed: true, reason: 'error_fallback', tier: null, status: 'unknown' })
    }
  }

  // Generate a unique session token for concurrent session detection
  const generateSessionToken = () => {
    const array = new Uint8Array(16)
    crypto.getRandomValues(array)
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('')
  }

  const [sessionToken] = useState(() => generateSessionToken())

  // Stamp single session token — only one device at a time per account
  const stampSession = async (userId) => {
    await supabase
      .from('users')
      .update({ active_session_token: sessionToken })
      .eq('id', userId)
  }

  const signIn = async (email, password, captchaToken) => {
    const options = { email, password }
    if (captchaToken) options.options = { captchaToken }
    const { data, error } = await supabase.auth.signInWithPassword(options)
    if (data?.user) {
      await stampSession(data.user.id)
    }
    return { data, error }
  }

  const signOut = async () => {
    // Clear session token on sign out
    if (user?.id) {
      await supabase
        .from('users')
        .update({ active_session_token: null })
        .eq('id', user.id)
    }
    const { error } = await supabase.auth.signOut()
    setUser(null)
    setUserProfile(null)
    setViewingClient(null)
    window.location.href = '/login'
    return { error }
  }

  // Switch to viewing a specific client's data
  const switchClient = (client) => {
    setViewingClient(client) // { client_company_id, client_name } or null for own data
  }

  // Get the effective company_id for queries
  // If reseller is viewing a client, use that client's company_id
  // Otherwise use the user's own company_id
  const getEffectiveCompanyId = () => {
    if (viewingClient) return viewingClient.client_company_id
    return userProfile?.company_id
  }

  const isSuperAdmin = userProfile?.role === 'super_admin'
  const isAdmin = isSuperAdmin || userProfile?.role === 'admin'
  const isLeadAuditor = isSuperAdmin || userProfile?.role === 'lead_auditor'

  const value = {
    user,
    userProfile,
    loading,
    signIn,
    signOut,
    isReseller,
    resellerClients,
    viewingClient,
    switchClient,
    getEffectiveCompanyId,
    isSuperAdmin,
    isAdmin,
    isLeadAuditor,
    subscriptionStatus
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

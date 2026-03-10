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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        // Re-stamp session token on page load/refresh so existing session survives
        stampSession(session.user.id)
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
        window.location.href = '/login'
      } else if (session?.user) {
        fetchUserProfile(session.user.id)
      } else {
        setUserProfile(null)
        setLoading(false)
      }
    })

    const publicPaths = ['/', '/login', '/popia', '/terms', '/privacy', '/password-recovery', '/reset-password', '/auditor']
    const sessionCheck = setInterval(async () => {
      if (publicPaths.includes(window.location.pathname)) return
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
        if (publicPaths.includes(window.location.pathname)) return
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
          id, email, full_name, role, company_id, referral_code, referred_by, created_at,
          company:companies!users_company_id_fkey(id, name, company_code, logo_url, industry)
        `)
        .eq('id', userId)
        .single()

      if (error) throw error
      setUserProfile(data)

      // Check if this user is a reseller
      const { data: reseller } = await supabase
        .from('resellers')
        .select('id, company_id, contact_email, commission_rate')
        .eq('contact_email', data.email)
        .single()

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
    } catch (error) {
      console.error('Error fetching user profile:', error)
    } finally {
      setLoading(false)
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
    isLeadAuditor
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

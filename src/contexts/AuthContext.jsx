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

    const publicPaths = ['/', '/login', '/popia', '/terms', '/privacy']
    const sessionCheck = setInterval(async () => {
      if (publicPaths.includes(window.location.pathname)) return
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error || !session) {
        setUser(null)
        setUserProfile(null)
        window.location.href = '/login'
      }
    }, 60000)

    return () => {
      subscription.unsubscribe()
      clearInterval(sessionCheck)
    }
  }, [])

  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          company:companies!users_company_id_fkey(*)
        `)
        .eq('id', userId)
        .single()

      if (error) throw error
      setUserProfile(data)

      // Check if this user is a reseller
      const { data: reseller } = await supabase
        .from('resellers')
        .select('*')
        .eq('contact_email', data.email)
        .single()

      if (reseller) {
        setIsReseller(true)
        // Fetch their clients
        const { data: clients } = await supabase
          .from('reseller_clients')
          .select('*')
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

  const signIn = async (email, password, captchaToken) => {
    const options = { email, password }
    if (captchaToken) options.options = { captchaToken }
    const { data, error } = await supabase.auth.signInWithPassword(options)
    return { data, error }
  }

  const signOut = async () => {
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
    getEffectiveCompanyId
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
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

  const fetchUserProfile = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          company:companies(*)
        `)
        .eq('id', userId)
        .single()

      if (error) throw error
      setUserProfile(data)
    } catch (error) {
      console.error('Error fetching user profile:', error)
      setUserProfile(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserProfile(session.user.id)
      } else {
        setUserProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchUserProfile])

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    setUser(null)
    setUserProfile(null)
    return { error }
  }

  // Role-based permission helpers
  const hasRole = (roles) => {
    if (!userProfile) return false
    const roleList = Array.isArray(roles) ? roles : [roles]
    return roleList.includes(userProfile.role)
  }

  const canCreate = () => hasRole(['super_admin', 'admin', 'sheq_manager', 'quality_manager'])
  const canEdit = () => hasRole(['super_admin', 'admin', 'sheq_manager', 'quality_manager'])
  const canDelete = () => hasRole(['super_admin', 'admin'])
  const canViewAll = () => hasRole(['super_admin'])
  const isAdmin = () => hasRole(['super_admin', 'admin'])

  const value = {
    user,
    userProfile,
    loading,
    signIn,
    signOut,
    hasRole,
    canCreate,
    canEdit,
    canDelete,
    canViewAll,
    isAdmin,
    refreshProfile: () => user && fetchUserProfile(user.id)
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

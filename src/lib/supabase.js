import { createClient } from '@supabase/supabase-js'

// ✅ SECURE: Using environment variables (no hardcoded secrets)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate environment variables are present
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'isoguardian-auth-token'
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-application-name': 'ISOGuardian'
    }
  }
})

// Security: Clear sensitive data on signout
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    localStorage.removeItem('isoguardian-auth-token')
  }
})

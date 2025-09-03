import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Security: Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  // Don't expose actual values in console
  console.error('❌ Supabase environment variables are missing or invalid')
  console.error('Please check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set')
  
  // In production, this should fail fast
  if (import.meta.env.PROD) {
    throw new Error('Supabase configuration is missing. Please check environment variables.')
  }
}

// Security: Validate URL format
if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
  console.error('❌ Supabase URL must use HTTPS')
  if (import.meta.env.PROD) {
    throw new Error('Supabase URL must use HTTPS in production')
  }
}

// Security: Validate key format (basic check)
if (supabaseAnonKey && supabaseAnonKey.length < 50) {
  console.error('❌ Supabase anon key appears to be invalid')
  if (import.meta.env.PROD) {
    throw new Error('Invalid Supabase configuration')
  }
}

// Create a mock client for development if env vars are missing
let supabase
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Creating mock Supabase client for development. Authentication will not work.')
  
  // Mock Supabase client for development
  supabase = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: async () => ({ error: { message: 'Supabase not configured' } }),
      signUp: async () => ({ error: { message: 'Supabase not configured' } }),
      signInWithOAuth: async () => ({ error: { message: 'Supabase not configured' } }),
      signOut: async () => ({ error: null })
    }
  }
} else {
  // Real Supabase client
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      // Security: Set secure cookie options
      cookieOptions: {
        secure: import.meta.env.PROD, // HTTPS only in production
        sameSite: 'lax',
        httpOnly: false // Required for client-side access
      }
    },
    // Security: Global request options
    global: {
      headers: {
        'X-Client-Info': 'swipy-web-app'
      }
    }
  })

  // Security: Add error interceptor for debugging
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
      // Clear any sensitive client-side data on sign out
      try {
        // Clear only app-specific data, not all localStorage
        const keysToRemove = ['profile_data', 'swipes_data', 'filters_data']
        keysToRemove.forEach(key => {
          if (localStorage.getItem(key)) {
            localStorage.removeItem(key)
          }
        })
      } catch (error) {
        console.error('Error clearing data on sign out:', error)
      }
    }
  })
}

export { supabase }



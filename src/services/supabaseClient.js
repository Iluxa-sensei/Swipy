import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY

// Log environment variables status
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are missing. Using placeholder values.')
  console.warn('Please check your .env file and ensure VITE_PUBLIC_SUPABASE_URL and VITE_PUBLIC_SUPABASE_ANON_KEY are set')
}

// Create Supabase client
const supabaseClient = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder-key', {
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
  // Realtime configuration for live chat updates
  realtime: {
    params: {
      eventsPerSecond: 10
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
supabaseClient.auth.onAuthStateChange((event, session) => {
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

export { supabaseClient as supabase }



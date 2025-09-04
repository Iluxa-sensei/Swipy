import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { authService } from '../services/authService.js'

const AuthContext = createContext({ session: null, user: null, loading: true })

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true
    let authSubscription = null

    const initializeAuth = async () => {
      try {
        console.log('AuthProvider: Initializing authentication...')

        // Security: Get initial session
        const currentSession = await authService.getCurrentSession()
        console.log('AuthProvider: Current session:', currentSession)

        if (!isMounted) return

        if (currentSession) {
          // Basic session validation
          if (!currentSession.user?.id || !currentSession.access_token) {
            console.warn('AuthProvider: Invalid session data, clearing session')
            setSession(null)
          } else {
            console.log('AuthProvider: Setting valid session:', currentSession)
            setSession(currentSession)
          }
        } else {
          console.log('AuthProvider: No session found')
          setSession(null)
        }

        setLoading(false)
      } catch (error) {
        if (!isMounted) return
        console.error('AuthProvider: Auth initialization error:', error)
        setError('Failed to initialize authentication')
        setLoading(false)
      }
    }

    // Security: Set up auth state change listener
    const setupAuthListener = () => {
      try {
        const { data: { subscription } } = authService.onAuthStateChange(
          async (event, newSession) => {
            if (!isMounted) return

            // Security: Handle different auth events
            switch (event) {
              case 'SIGNED_IN':
                if (newSession?.user?.id && newSession?.access_token) {
                  setSession(newSession)
                  setError(null)
                }
                break
              case 'SIGNED_OUT':
                setSession(null)
                setError(null)
                break
              case 'TOKEN_REFRESHED':
                if (newSession?.user?.id && newSession?.access_token) {
                  setSession(newSession)
                  setError(null)
                }
                break
              case 'USER_UPDATED':
                if (newSession?.user?.id) {
                  setSession(newSession)
                }
                break
              default:
                // For other events, only update if session is valid
                if (newSession?.user?.id && newSession?.access_token) {
                  setSession(newSession)
                } else if (newSession === null) {
                  setSession(null)
                }
            }
          }
        )

        authSubscription = subscription
      } catch (error) {
        console.error('Auth listener setup error:', error)
        setError('Failed to setup authentication listener')
      }
    }

    initializeAuth()
    setupAuthListener()

    // Security: Cleanup function
    return () => {
      isMounted = false
      if (authSubscription) {
        try {
          authSubscription.unsubscribe()
        } catch (error) {
          console.error('Error unsubscribing from auth:', error)
        }
      }
    }
  }, [])

  // Security: Memoized context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    session,
    user: session?.user ?? null,
    loading,
    error,
    // Security: Helper functions
    isAuthenticated: !!session?.user?.id,
    hasValidSession: !!(session?.user?.id && session?.access_token)
  }), [session, loading, error])

  // Security: Show error state if auth fails
  if (error && !loading) {
    return (
      <div className="screen active">
        <div className="p-6 text-center">
          <div className="text-red-500 mb-4">
            <i className="fas fa-exclamation-triangle text-2xl"></i>
          </div>
          <h2 className="text-xl font-semibold mb-2">Authentication Error</h2>
          <p className="text-text-secondary mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}



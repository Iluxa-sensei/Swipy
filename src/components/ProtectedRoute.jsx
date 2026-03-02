import React, { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider.jsx'
import { profileService } from '../services/profileService.js'
import Loader from './Loader.jsx'

// In-memory cache for onboarding status to avoid refetch on every protected route visit (TTL 2 min)
const ONBOARDING_CACHE_TTL_MS = 2 * 60 * 1000
const onboardingCache = new Map()

function getCachedOnboardingCompleted (userId) {
  const entry = onboardingCache.get(userId)
  if (!entry || Date.now() - entry.ts > ONBOARDING_CACHE_TTL_MS) return null
  return entry.onboardingCompleted
}

export function setCachedOnboardingCompleted (userId, onboardingCompleted) {
  onboardingCache.set(userId, { onboardingCompleted, ts: Date.now() })
}

export const ProtectedRoute = () => {
  const { session, loading, hasValidSession, error } = useAuth()
  const location = useLocation()
  const [onboardingChecked, setOnboardingChecked] = useState(false)
  const [requiresOnboarding, setRequiresOnboarding] = useState(false)
  const isOnboardingRoute = location.pathname === '/onboarding'

  // Check for cached session to avoid loading screen
  const rememberMeFlag = localStorage.getItem('swipy_remember_me')
  const rememberMe = rememberMeFlag === null ? true : rememberMeFlag === '1'
  const cachedSession = rememberMe
    ? localStorage.getItem('swipy_session')
    : sessionStorage.getItem('swipy_session')
  const hasCachedSession = cachedSession && JSON.parse(cachedSession)?.user?.id

  // Check onboarding status for authenticated users
  useEffect(() => {
    // Skip onboarding check for onboarding route itself
    if (isOnboardingRoute) {
      setOnboardingChecked(true)
      setRequiresOnboarding(false)
      return
    }

    // Only run when we have an authenticated user
    if (!session?.user?.id) {
      setOnboardingChecked(true)
      setRequiresOnboarding(false)
      return
    }

    const userId = session.user.id
    const cached = getCachedOnboardingCompleted(userId)
    if (cached !== null) {
      setRequiresOnboarding(!cached)
      setOnboardingChecked(true)
      return
    }

    let cancelled = false

    const checkOnboarding = async () => {
      try {
        setOnboardingChecked(false)
        const profile = await profileService.getProfile(userId)

        if (cancelled) return

        const completed = !!(profile?.onboarding_completed)
        setCachedOnboardingCompleted(userId, completed)
        setRequiresOnboarding(!completed)
      } catch (e) {
        if (cancelled) return
        console.warn('ProtectedRoute: Failed to check onboarding status, redirecting to onboarding', e)
        setRequiresOnboarding(true)
      } finally {
        if (!cancelled) {
          setOnboardingChecked(true)
        }
      }
    }

    checkOnboarding()

    return () => {
      cancelled = true
    }
  }, [session?.user?.id, isOnboardingRoute])

  // Security: Show loading state while checking authentication (only if no cached session)
  if (loading && !hasCachedSession) {
    return (
      <div className="screen active auth-loading-screen">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Loader />
            <p className="text-text-secondary mt-4">Verifying authentication...</p>
          </div>
        </div>
      </div>
    )
  }

  // Security: Handle authentication errors (only in production)
  if (error && !loading && import.meta.env.PROD && !hasCachedSession) {
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

  // In development mode, allow access if Supabase is not configured
  if (import.meta.env.DEV && !hasValidSession && !session && !hasCachedSession) {
    console.warn('ProtectedRoute: Development mode - allowing access without authentication')
    return <Outlet />
  }

  // Security: Check for valid session with proper validation
  if (!hasValidSession && !hasCachedSession) {
    // Security: Store attempted location for redirect after login
    const redirectPath = location.pathname !== '/' ? location.pathname : '/home'
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: {
            pathname: redirectPath,
            search: location.search,
            hash: location.hash
          }
        }}
      />
    )
  }

  // Security: Additional session validation
  if ((!session?.user?.id || !session?.access_token) && !hasCachedSession) {
    console.warn('ProtectedRoute: Invalid session detected, redirecting to login')
    return <Navigate to="/login" replace />
  }

  // Security: Check if user is confirmed (for email signup)
  if (session?.user && !session.user.email_confirmed_at && session.user.app_metadata?.provider === 'email' && !hasCachedSession) {
    return (
      <div className="screen active">
        <div className="p-6 text-center">
          <div className="text-yellow-500 mb-4">
            <i className="fas fa-envelope text-2xl"></i>
          </div>
          <h2 className="text-xl font-semibold mb-2">Email Verification Required</h2>
          <p className="text-text-secondary mb-4">
            Please check your email and click the verification link to continue.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Check Again
          </button>
        </div>
      </div>
    )
  }

  // Enforce mandatory onboarding for all protected routes except the onboarding page itself
  if (!isOnboardingRoute) {
    // While we are checking onboarding status, show a small loading state
    if (session?.user?.id && !onboardingChecked) {
      return (
        <div className="screen active auth-loading-screen">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader />
              <p className="text-text-secondary mt-4">Loading your profile...</p>
            </div>
          </div>
        </div>
      )
    }

    if (session?.user?.id && onboardingChecked && requiresOnboarding) {
      return <Navigate to="/onboarding" replace />
    }
  }

  // Security: All checks passed, render protected content
  return <Outlet />
}



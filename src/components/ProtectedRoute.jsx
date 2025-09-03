import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider.jsx'

export const ProtectedRoute = () => {
  const { session, loading, hasValidSession, error } = useAuth()
  const location = useLocation()

  // Security: Show loading state while checking authentication
  if (loading) {
    return (
      <div className="screen active">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-text-secondary">Verifying authentication...</p>
          </div>
        </div>
      </div>
    )
  }

  // Security: Handle authentication errors (only in production)
  if (error && !loading && import.meta.env.PROD) {
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
  if (import.meta.env.DEV && !hasValidSession && !session) {
    console.warn('ProtectedRoute: Development mode - allowing access without authentication')
    return <Outlet />
  }

  // Security: Check for valid session with proper validation
  if (!hasValidSession) {
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
  if (!session?.user?.id || !session?.access_token) {
    console.warn('ProtectedRoute: Invalid session detected, redirecting to login')
    return <Navigate to="/login" replace />
  }

  // Security: Check if user is confirmed (for email signup)
  if (session.user && !session.user.email_confirmed_at && session.user.app_metadata?.provider === 'email') {
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

  // Security: All checks passed, render protected content
  return <Outlet />
}



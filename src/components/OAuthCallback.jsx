import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient.js'
import { profileService } from '../services/profileService.js'
import { cleanAuthTokensFromUrl } from '../utils/authTokenCleaner.js'
import Loader from './Loader.jsx'

const OAuthCallback = () => {
    const navigate = useNavigate()
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const handleOAuthCallback = async () => {
            try {
                const hashParams = new URLSearchParams(window.location.hash.substring(1))
                const queryParams = new URLSearchParams(window.location.search)
                const idToken = hashParams.get('id_token') || queryParams.get('id_token')
                const accessToken = hashParams.get('access_token') || queryParams.get('access_token')

                // If we received an ID token from the backend OAuth flow, exchange it with Supabase
                if (idToken) {
                    const { error: idTokenError } = await supabase.auth.signInWithIdToken({
                        provider: 'google',
                        token: idToken,
                        access_token: accessToken || undefined
                    })

                    if (idTokenError) {
                        console.error('OAuth ID token error:', idTokenError)
                        setError(idTokenError.message)
                        setLoading(false)
                        setTimeout(() => {
                            navigate('/login', { replace: true })
                        }, 3000)
                        return
                    }
                }

                // Security: Let Supabase process tokens from URL first, then clean after a brief delay
                // Supabase needs to read tokens from URL hash to establish session
                // The delay ensures Supabase has fully processed and stored the session
                const { data, error } = await supabase.auth.getSession()
                
                // Clean URL after Supabase has processed the tokens
                // Small delay ensures Supabase has fully stored the session before we clean the URL
                setTimeout(() => {
                    cleanAuthTokensFromUrl()
                }, 50)
                
                if (error) {
                    console.error('OAuth callback error:', error)
                    setError(error.message)
                    setLoading(false)
                    // Navigate away from callback URL even on error
                    setTimeout(() => {
                        navigate('/login', { replace: true })
                    }, 3000)
                    return
                }

                if (data.session) {
                    const userId = data.session.user.id
                    
                    // Check if user has completed onboarding
                    try {
                        const profile = await profileService.getProfile(userId)
                        
                        // If no profile or onboarding not completed, redirect to onboarding
                        if (!profile || !profile.onboarding_completed) {
                            console.log('User has not completed onboarding, redirecting to onboarding page')
                            navigate('/onboarding', { replace: true })
                        } else {
                            // User has completed onboarding, redirect to home
                            navigate('/home', { replace: true })
                        }
                    } catch (profileError) {
                        console.error('Error checking profile:', profileError)
                        // If profile check fails, assume new user and redirect to onboarding
                        navigate('/onboarding', { replace: true })
                    }
                } else {
                    // No session found, redirect to login
                    navigate('/login', { replace: true })
                }
            } catch (err) {
                console.error('Unexpected error during OAuth callback:', err)
                setError('An unexpected error occurred during authentication')
                setLoading(false)
                
                // Clean URL even on unexpected error
                cleanAuthTokensFromUrl()
                
                // Navigate away from callback URL after error
                setTimeout(() => {
                    navigate('/login', { replace: true })
                }, 3000)
            }
        }

        handleOAuthCallback()
    }, [navigate])

    if (loading) {
        return (
            <div className="screen active">
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <Loader />
                        <h2 className="text-xl font-semibold text-text-primary mt-4 mb-2">
                            Completing Authentication...
                        </h2>
                        <p className="text-text-secondary">
                            Please wait while we complete your sign-in
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="screen active">
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center max-w-md mx-auto p-6">
                        <div className="text-red-500 text-6xl mb-4">
                            <i className="fas fa-exclamation-triangle"></i>
                        </div>
                        <h2 className="text-xl font-semibold text-text-primary mb-2">
                            Authentication Failed
                        </h2>
                        <p className="text-text-secondary mb-6">
                            {error}
                        </p>
                        <button
                            onClick={() => navigate('/login')}
                            className="btn-icon-style font-semibold rounded-2xl px-6 py-3"
                        >
                            Back to Login
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return null
}

export default OAuthCallback

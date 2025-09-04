import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../services/supabaseClient.js'

const OAuthCallback = () => {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const handleOAuthCallback = async () => {
            try {
                // Get the session from the URL hash
                const { data, error } = await supabase.auth.getSession()

                if (error) {
                    console.error('OAuth callback error:', error)
                    setError(error.message)
                    setLoading(false)
                    return
                }

                if (data.session) {
                    // Successfully authenticated, redirect to home
                    navigate('/home', { replace: true })
                } else {
                    // No session found, redirect to login
                    navigate('/login', { replace: true })
                }
            } catch (err) {
                console.error('Unexpected error during OAuth callback:', err)
                setError('An unexpected error occurred during authentication')
                setLoading(false)
            }
        }

        handleOAuthCallback()
    }, [navigate])

    if (loading) {
        return (
            <div className="screen active">
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <h2 className="text-xl font-semibold text-text-primary mb-2">
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
                            className="bg-gradient-to-r from-blue-300 to-blue-700 hover:from-blue-400 hover:to-blue-800 text-white font-semibold rounded-2xl px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-200"
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

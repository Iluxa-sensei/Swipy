import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { authService } from '../services/authService.js'

const ResetPasswordPage = () => {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [isResetMode, setIsResetMode] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [email, setEmail] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    // Check if we're in password reset mode (user clicked email link)
    const token = searchParams.get('token')
    const type = searchParams.get('type')

    React.useEffect(() => {
        // Security: Clear sensitive tokens from URL after processing
        // Supabase password reset tokens are typically in the hash, but we also check query params
        if (window.location.hash) {
            // Process hash first (Supabase handles this), then clear it
            const hash = window.location.hash
            // Clear hash immediately after component mounts
            window.history.replaceState(null, '', window.location.pathname + (window.location.search || ''))
        }
        
        // Clear token from query params if present (after extracting it)
        if (token && type === 'recovery') {
            setIsResetMode(true)
            // Remove token from URL for security (keep type if needed)
            if (window.location.search.includes('token=')) {
                const newSearch = new URLSearchParams(window.location.search)
                newSearch.delete('token')
                const cleanSearch = newSearch.toString()
                window.history.replaceState(
                    null,
                    '',
                    window.location.pathname + (cleanSearch ? `?${cleanSearch}` : '')
                )
            }
        }
    }, [token, type])

    const handleSendResetEmail = async (e) => {
        e.preventDefault()
        if (!email.trim()) {
            setError('Please enter your email address')
            return
        }

        setIsSubmitting(true)
        setError('')
        setMessage('')

        try {
            await authService.resetPassword(email)
            setMessage('Password reset email sent! Check your inbox and click the link to reset your password.')
        } catch (error) {
            setError(error.message || 'Failed to send reset email. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleResetPassword = async (e) => {
        e.preventDefault()

        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters long')
            return
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        setIsSubmitting(true)
        setError('')
        setMessage('')

        try {
            await authService.updatePassword(newPassword)
            setMessage('Password updated successfully! You can now sign in with your new password.')

            // Redirect to login after 2 seconds
            setTimeout(() => {
                navigate('/login')
            }, 2000)
        } catch (error) {
            setError(error.message || 'Failed to update password. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const validatePassword = (password) => {
        return password.length >= 8 && password.length <= 128
    }

    if (isResetMode) {
        return (
            <div className="screen active">
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <button
                            onClick={() => navigate('/login')}
                            className="absolute top-6 left-6 text-text-secondary hover:text-text-primary transition-colors duration-200"
                        >
                            <i className="fas fa-arrow-left text-xl"></i>
                        </button>

                        <h1 className="text-4xl font-bold text-text-primary mb-4">
                            Reset Your Password
                        </h1>
                        <p className="text-text-secondary text-lg">
                            Enter your new password below
                        </p>
                    </div>

                    {/* Reset Password Form */}
                    <form onSubmit={handleResetPassword} className="space-y-6 max-w-md mx-auto">
                        <div>
                            <label className="block text-text-primary font-medium mb-2">New Password</label>
                            <input
                                type="password"
                                placeholder="Enter new password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full p-4 bg-glass-bg border border-glass-border rounded-2xl text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-primary transition-colors duration-200"
                                required
                                minLength={8}
                                maxLength={128}
                            />
                            <p className="text-sm text-text-secondary mt-1">
                                Must be at least 8 characters long
                            </p>
                        </div>

                        <div>
                            <label className="block text-text-primary font-medium mb-2">Confirm New Password</label>
                            <input
                                type="password"
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full p-4 bg-glass-bg border border-glass-border rounded-2xl text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-primary transition-colors duration-200"
                                required
                                minLength={8}
                                maxLength={128}
                            />
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-center">
                                {error}
                            </div>
                        )}

                        {/* Success Message */}
                        {message && (
                            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-500 text-center">
                                {message}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting || !validatePassword(newPassword) || newPassword !== confirmPassword}
                            className="w-full bg-gradient-to-r from-blue-300 to-blue-700 hover:from-blue-400 hover:to-blue-800 text-white font-semibold rounded-2xl py-4 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <i className="fas fa-key mr-2"></i>
                            {isSubmitting ? 'Updating Password...' : 'Update Password'}
                        </button>
                    </form>

                    {/* Back to Login */}
                    <div className="text-center mt-8">
                        <button
                            onClick={() => navigate('/login')}
                            className="text-blue-400 hover:text-blue-300 transition-colors duration-200"
                        >
                            <i className="fas fa-arrow-left mr-2"></i>
                            Back to Login
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="screen active">
            <div className="flex-1 overflow-y-auto p-6">
                {/* Header */}
                <div className="text-center mb-12">
                    <button
                        onClick={() => navigate('/login')}
                        className="absolute top-6 left-6 text-text-secondary hover:text-text-primary transition-colors duration-200"
                    >
                        <i className="fas fa-arrow-left text-xl"></i>
                    </button>

                    <h1 className="text-4xl font-bold text-text-primary mb-4">
                        Forgot Password?
                    </h1>
                    <p className="text-text-secondary text-lg">
                        No worries! Enter your email and we'll send you a reset link
                    </p>
                </div>

                {/* Reset Email Form */}
                <form onSubmit={handleSendResetEmail} className="space-y-6 max-w-md mx-auto">
                    <div>
                        <label className="block text-text-primary font-medium mb-2">Email Address</label>
                        <input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value.toLowerCase().trim())}
                            className="w-full p-4 bg-glass-bg border border-glass-border rounded-2xl text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-primary transition-colors duration-200"
                            required
                            maxLength={254}
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-center">
                            {error}
                        </div>
                    )}

                    {/* Success Message */}
                    {message && (
                        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-500 text-center">
                            {message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting || !email.trim()}
                        className="w-full bg-gradient-to-r from-blue-300 to-blue-700 hover:from-blue-400 hover:to-blue-800 text-white font-semibold rounded-2xl py-4 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <i className="fas fa-paper-plane mr-2"></i>
                        {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </form>

                {/* Additional Info */}
                <div className="text-center mt-8 max-w-md mx-auto">
                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-500">
                        <i className="fas fa-info-circle mr-2"></i>
                        <span className="text-sm">
                            Check your email and click the reset link to continue. The link will expire in 1 hour.
                        </span>
                    </div>
                </div>

                {/* Back to Login */}
                <div className="text-center mt-8">
                    <button
                        onClick={() => navigate('/login')}
                        className="text-blue-400 hover:text-blue-300 transition-colors duration-200"
                    >
                        <i className="fas fa-arrow-left mr-2"></i>
                        Back to Login
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ResetPasswordPage

import { supabase } from './supabaseClient.js'
import { isEmbeddedBrowser, openInExternalBrowser } from '../utils/browserDetection.js'

export const authService = {
    // Get current session
    async getCurrentSession() {
        try {
            const { data: { session }, error } = await supabase.auth.getSession()

            if (error) {
                console.error('authService.getCurrentSession: Supabase error:', error)
                throw error
            }

            return session
        } catch (error) {
            console.error('authService.getCurrentSession: Error:', error)
            return null
        }
    },

    // Get current user
    async getCurrentUser() {
        try {
            const { data: { user }, error } = await supabase.auth.getUser()
            if (error) throw error
            return user
        } catch (error) {
            console.error('Error getting user:', error)
            return null
        }
    },

    // Sign up with email and password
    async signUp(email, password, profileData = {}) {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: profileData
                }
            })

            if (error) throw error

            // Profile will be created automatically by the database trigger

            return { success: true, data, error: null }
        } catch (error) {
            console.error('Error signing up:', error)
            return { success: false, data: null, error }
        }
    },

    // Sign in with email and password
    async signIn(email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            })

            if (error) {
                console.error('authService.signIn: Supabase error:', error)
                throw error
            }

            return data
        } catch (error) {
            console.error('authService.signIn: Error:', error)
            console.error('authService.signIn: Error details:', {
                message: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint
            })
            throw error
        }
    },

    // Sign in with OAuth (Google, GitHub, etc.)
    async signInWithOAuth(provider, options = {}) {
        try {
            // Check if we're in an embedded browser that may have OAuth restrictions
            const isEmbedded = isEmbeddedBrowser()
            const redirectTo = options.redirectTo || `${window.location.origin}/auth/callback`

            // For Google in embedded browsers, use backend proxy to avoid disallowed_useragent
            if (isEmbedded && provider === 'google') {
                const response = await fetch('/api/auth/google/init', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ redirectTo })
                })

                if (!response.ok) {
                    const errorText = await response.text()
                    throw new Error(`Failed to initialize Google OAuth: ${errorText}`)
                }

                const { authUrl } = await response.json()
                if (!authUrl) {
                    throw new Error('Google OAuth URL not provided by server')
                }

                const opened = openInExternalBrowser(authUrl)
                return {
                    url: authUrl,
                    requiresExternalBrowser: true,
                    externalBrowserOpened: opened,
                    message: opened
                        ? 'Please complete sign-in in your browser'
                        : 'Please copy the URL and open it in your default browser'
                }
            }

            // If in embedded browser for other providers, skip auto-redirect
            if (isEmbedded) {
                console.log('Embedded browser detected, using skipBrowserRedirect')
                
                const { data, error } = await supabase.auth.signInWithOAuth({
                    provider,
                    options: {
                        redirectTo,
                        queryParams: {
                            access_type: 'offline',
                            prompt: 'consent',
                        },
                        skipBrowserRedirect: true, // Don't auto-redirect, we'll handle it
                        ...options
                    }
                })

                if (error) throw error

                // Now open the URL in an external browser
                if (data?.url) {
                    console.log('Opening OAuth URL in external browser:', data.url)
                    const opened = openInExternalBrowser(data.url)
                    
                    return {
                        ...data,
                        requiresExternalBrowser: true,
                        externalBrowserOpened: opened,
                        message: opened 
                            ? 'Please complete sign-in in your browser' 
                            : 'Please copy the URL and open it in your default browser'
                    }
                }
                
                return data
            }

            // Normal flow for regular browsers - let Supabase handle the redirect
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                    ...options
                }
            })

            if (error) throw error
            return data
        } catch (error) {
            console.error('Error signing in with OAuth:', error)
            throw error
        }
    },

    // Sign out
    async signOut() {
        try {
            const { error } = await supabase.auth.signOut()
            if (error) throw error
            return true
        } catch (error) {
            console.error('Error signing out:', error)
            throw error
        }
    },

    // Reset password
    async resetPassword(email) {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password?type=recovery`
            })

            if (error) throw error
            return true
        } catch (error) {
            console.error('Error resetting password:', error)
            throw error
        }
    },

    // Update password
    async updatePassword(newPassword) {
        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            })

            if (error) throw error
            return true
        } catch (error) {
            console.error('Error updating password:', error)
            throw error
        }
    },

    // Update email
    async updateEmail(newEmail) {
        try {
            const { error } = await supabase.auth.updateUser({
                email: newEmail
            })

            if (error) throw error
            return true
        } catch (error) {
            console.error('Error updating email:', error)
            throw error
        }
    },

    // Subscribe to authentication changes
    onAuthStateChange(callback) {
        return supabase.auth.onAuthStateChange(callback)
    },

    // Check if user is authenticated
    async isAuthenticated() {
        const session = await this.getCurrentSession()
        return !!session
    }
}

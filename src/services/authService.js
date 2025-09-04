import { supabase } from './supabaseClient.js'
import { profileService } from './profileService.js'

export const authService = {
    // Get current session
    async getCurrentSession() {
        try {
            const { data: { session }, error } = await supabase.auth.getSession()
            if (error) throw error
            return session
        } catch (error) {
            console.error('Error getting session:', error)
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

            // If registration is successful, create profile
            if (data.user) {
                try {
                    await profileService.upsertProfile({
                        id: data.user.id,
                        full_name: profileData.full_name || '',
                        avatar_url: null
                    })
                } catch (profileError) {
                    console.warn('Profile creation failed, but user was created:', profileError)
                    // Don't throw error here, user registration was successful
                }
            }

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

            if (error) throw error
            return data
        } catch (error) {
            console.error('Error signing in:', error)
            throw error
        }
    },

    // Sign in with OAuth (Google, GitHub, etc.)
    async signInWithOAuth(provider, options = {}) {
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: options.redirectTo || `${window.location.origin}/auth/callback`,
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

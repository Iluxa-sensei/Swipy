import { supabase } from './supabaseClient.js'

export const profileService = {
    // Get user profile
    async getProfile(userId) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()

            if (error) throw error
            return data
        } catch (error) {
            console.error('Error fetching profile:', error)
            return null
        }
    },

    // Get profile by username (nickname)
    async getProfileByUsername(username) {
        try {
            // Remove @ if present
            const cleanUsername = username.startsWith('@') ? username.substring(1) : username
            
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('username', cleanUsername)
                .single()

            if (error) throw error
            return data
        } catch (error) {
            console.error('Error fetching profile by username:', error)
            return null
        }
    },

    // Check if username is available
    async isUsernameAvailable(username, excludeUserId = null) {
        try {
            // Remove @ if present
            const cleanUsername = username.startsWith('@') ? username.substring(1) : username
            
            let query = supabase
                .from('profiles')
                .select('id')
                .eq('username', cleanUsername)
            
            if (excludeUserId) {
                query = query.neq('id', excludeUserId)
            }
            
            const { data, error } = await query
            
            if (error) throw error
            return (data || []).length === 0
        } catch (error) {
            console.error('Error checking username availability:', error)
            return false
        }
    },

    // Create or update profile
    async upsertProfile(profileData) {
        try {
            console.log('profileService.upsertProfile called with:', profileData)

            // Clean up profile data - remove empty strings and set defaults
            const cleanProfileData = {
                ...profileData,
                full_name: profileData.full_name || 'New User',
                bio: profileData.bio || null,
                location: profileData.location || null,
                website: profileData.website || null,
                username: profileData.username || null,
                role: profileData.role || null,
                interests: profileData.interests || null
            }

            console.log('profileService.upsertProfile: Cleaned profile data:', cleanProfileData)

            const { data, error } = await supabase
                .from('profiles')
                .upsert([cleanProfileData], {
                    onConflict: 'id'
                })
                .select()
                .single()

            console.log('Supabase upsert response:', { data, error })

            if (error) {
                console.error('Supabase upsert error:', error)
                throw error
            }

            console.log('Profile upserted successfully:', data)
            return data
        } catch (error) {
            console.error('Error upserting profile:', error)
            console.error('Error details:', {
                message: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint
            })
            throw error
        }
    },

    // Update profile
    async updateProfile(userId, updates) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', userId)
                .select()
                .single()

            if (error) throw error
            return data
        } catch (error) {
            console.error('Error updating profile:', error)
            throw error
        }
    },

    // Upload avatar
    async uploadAvatar(userId, file) {
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${userId}-${Date.now()}.${fileExt}`
            const filePath = `avatars/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)

            // Update profile with new avatar URL
            await this.updateProfile(userId, { avatar_url: publicUrl })

            return publicUrl
        } catch (error) {
            console.error('Error uploading avatar:', error)
            throw error
        }
    },

    // Delete avatar
    async deleteAvatar(userId) {
        try {
            const profile = await this.getProfile(userId)
            if (profile?.avatar_url) {
                // Extract file path from URL
                const urlParts = profile.avatar_url.split('/')
                const filePath = urlParts.slice(-2).join('/') // avatars/filename.ext

                // Remove file from storage
                await supabase.storage
                    .from('avatars')
                    .remove([filePath])

                // Update profile
                await this.updateProfile(userId, { avatar_url: null })
            }

            return true
        } catch (error) {
            console.error('Error deleting avatar:', error)
            throw error
        }
    },

    // Search profiles by name
    async searchProfiles(searchTerm) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .ilike('full_name', `%${searchTerm}%`)
                .limit(10)

            if (error) throw error
            return data || []
        } catch (error) {
            console.error('Error searching profiles:', error)
            return []
        }
    }
}

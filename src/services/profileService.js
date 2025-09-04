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

    // Create or update profile
    async upsertProfile(profileData) {
        try {
            console.log('profileService.upsertProfile called with:', profileData)

            const { data, error } = await supabase
                .from('profiles')
                .upsert([profileData], {
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

import { supabase } from './supabaseClient'

export const profileServiceEnhanced = {
    // Get complete profile with all related data
    async getCompleteProfile(userId) {
        try {
            // Get basic profile
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()

            if (profileError) throw profileError

            // Get all related data in parallel
            const [
                { data: workExperience },
                { data: education },
                { data: portfolioProjects },
                { data: achievements },
                { data: startups }
            ] = await Promise.all([
                supabase.from('work_experience').select('*').eq('user_id', userId).order('start_date', { ascending: false }),
                supabase.from('education').select('*').eq('user_id', userId).order('end_date', { ascending: false }),
                supabase.from('portfolio_projects').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
                supabase.from('achievements').select('*').eq('user_id', userId).order('date_earned', { ascending: false }),
                supabase.from('startups').select('*').eq('owner_id', userId).order('created_at', { ascending: false })
            ])

            return {
                profile,
                workExperience: workExperience || [],
                education: education || [],
                portfolioProjects: portfolioProjects || [],
                achievements: achievements || [],
                startups: startups || []
            }
        } catch (error) {
            console.error('Error getting complete profile:', error)
            throw error
        }
    },

    // Update profile completion percentage
    async updateProfileCompletion(userId) {
        try {
            const { data, error } = await supabase.rpc('calculate_profile_completion', {
                p_user_id: userId
            })

            if (error) throw error

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ profile_completion_percentage: data })
                .eq('id', userId)

            if (updateError) throw updateError

            return data
        } catch (error) {
            console.error('Error updating profile completion:', error)
            throw error
        }
    },

    // Work Experience CRUD
    async addWorkExperience(userId, experienceData) {
        try {
            const { data, error } = await supabase
                .from('work_experience')
                .insert([{ user_id: userId, ...experienceData }])
                .select()
                .single()

            if (error) throw error
            return data
        } catch (error) {
            console.error('Error adding work experience:', error)
            throw error
        }
    },

    async updateWorkExperience(experienceId, experienceData) {
        try {
            const { data, error } = await supabase
                .from('work_experience')
                .update(experienceData)
                .eq('id', experienceId)
                .select()
                .single()

            if (error) throw error
            return data
        } catch (error) {
            console.error('Error updating work experience:', error)
            throw error
        }
    },

    async deleteWorkExperience(experienceId) {
        try {
            const { error } = await supabase
                .from('work_experience')
                .delete()
                .eq('id', experienceId)

            if (error) throw error
        } catch (error) {
            console.error('Error deleting work experience:', error)
            throw error
        }
    },

    // Education CRUD
    async addEducation(userId, educationData) {
        try {
            const { data, error } = await supabase
                .from('education')
                .insert([{ user_id: userId, ...educationData }])
                .select()
                .single()

            if (error) throw error
            return data
        } catch (error) {
            console.error('Error adding education:', error)
            throw error
        }
    },

    async updateEducation(educationId, educationData) {
        try {
            const { data, error } = await supabase
                .from('education')
                .update(educationData)
                .eq('id', educationId)
                .select()
                .single()

            if (error) throw error
            return data
        } catch (error) {
            console.error('Error updating education:', error)
            throw error
        }
    },

    async deleteEducation(educationId) {
        try {
            const { error } = await supabase
                .from('education')
                .delete()
                .eq('id', educationId)

            if (error) throw error
        } catch (error) {
            console.error('Error deleting education:', error)
            throw error
        }
    },

    // Portfolio Projects CRUD
    async addPortfolioProject(userId, projectData) {
        try {
            const { data, error } = await supabase
                .from('portfolio_projects')
                .insert([{ user_id: userId, ...projectData }])
                .select()
                .single()

            if (error) throw error
            return data
        } catch (error) {
            console.error('Error adding portfolio project:', error)
            throw error
        }
    },

    async updatePortfolioProject(projectId, projectData) {
        try {
            const { data, error } = await supabase
                .from('portfolio_projects')
                .update(projectData)
                .eq('id', projectId)
                .select()
                .single()

            if (error) throw error
            return data
        } catch (error) {
            console.error('Error updating portfolio project:', error)
            throw error
        }
    },

    async deletePortfolioProject(projectId) {
        try {
            const { error } = await supabase
                .from('portfolio_projects')
                .delete()
                .eq('id', projectId)

            if (error) throw error
        } catch (error) {
            console.error('Error deleting portfolio project:', error)
            throw error
        }
    },

    // Achievements CRUD
    async addAchievement(userId, achievementData) {
        try {
            const { data, error } = await supabase
                .from('achievements')
                .insert([{ user_id: userId, ...achievementData }])
                .select()
                .single()

            if (error) throw error
            return data
        } catch (error) {
            console.error('Error adding achievement:', error)
            throw error
        }
    },

    async updateAchievement(achievementId, achievementData) {
        try {
            const { data, error } = await supabase
                .from('achievements')
                .update(achievementData)
                .eq('id', achievementId)
                .select()
                .single()

            if (error) throw error
            return data
        } catch (error) {
            console.error('Error updating achievement:', error)
            throw error
        }
    },

    async deleteAchievement(achievementId) {
        try {
            const { error } = await supabase
                .from('achievements')
                .delete()
                .eq('id', achievementId)

            if (error) throw error
        } catch (error) {
            console.error('Error deleting achievement:', error)
            throw error
        }
    },

    // Get user's startups for portfolio display
    async getUserStartups(userId) {
        try {
            const { data, error } = await supabase
                .from('startups')
                .select('*')
                .eq('owner_id', userId)
                .order('created_at', { ascending: false })

            if (error) throw error
            return data || []
        } catch (error) {
            console.error('Error getting user startups:', error)
            throw error
        }
    },

    // Update profile with new data
    async updateProfile(userId, profileData) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .update({
                    ...profileData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId)
                .select()
                .single()

            if (error) throw error
            return data
        } catch (error) {
            console.error('Error updating profile:', error)
            throw error
        }
    }
}

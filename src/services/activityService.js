import { supabase } from './supabaseClient.js'

/**
 * Activity dashboard data from real Supabase tables:
 * - Profile views: likes on startups owned by the user
 * - Matches: notifications with type 'match'
 * - Applications: user's likes (startups they've liked / "applied" to)
 * - Days active: distinct days with likes or passes
 * - Recent activity: from notifications (like, match, message, system)
 */
export const activityService = {
    /**
     * Get activity stats for the current user.
     * @param {string} userId
     * @returns {Promise<{ profileViews: number, matches: number, applications: number, daysActive: number }>}
     */
    async getActivityStats(userId) {
        if (!userId) {
            return { profileViews: 0, matches: 0, applications: 0, daysActive: 0 }
        }
        try {
            const [
                { count: matches },
                { count: applications },
                { data: likesDates },
                { data: passesDates }
            ] = await Promise.all([
                supabase
                    .from('notifications')
                    .select('id', { count: 'exact', head: true })
                    .eq('user_id', userId)
                    .eq('type', 'match'),
                supabase
                    .from('likes')
                    .select('id', { count: 'exact', head: true })
                    .eq('user_id', userId),
                supabase
                    .from('likes')
                    .select('created_at')
                    .eq('user_id', userId),
                supabase
                    .from('passes')
                    .select('created_at')
                    .eq('user_id', userId)
            ])

            const { data: myStartups } = await supabase
                .from('startups')
                .select('id')
                .eq('owner_id', userId)
            const myStartupIds = (myStartups || []).map(s => s.id)
            let profileViewsCount = 0
            if (myStartupIds.length > 0) {
                const { count } = await supabase
                    .from('likes')
                    .select('id', { count: 'exact', head: true })
                    .in('startup_id', myStartupIds)
                profileViewsCount = count ?? 0
            }

            const likeDates = (likesDates || []).map(l => l.created_at?.split('T')[0]).filter(Boolean)
            const passDates = (passesDates || []).map(p => p.created_at?.split('T')[0]).filter(Boolean)
            const distinctDays = new Set([...likeDates, ...passDates])
            const daysActive = distinctDays.size

            return {
                profileViews: profileViewsCount,
                matches: matches ?? 0,
                applications: applications ?? 0,
                daysActive
            }
        } catch (error) {
            console.error('activityService.getActivityStats:', error)
            return { profileViews: 0, matches: 0, applications: 0, daysActive: 0 }
        }
    },

    /**
     * Get recent activity from notifications, formatted for the dashboard.
     * @param {string} userId
     * @param {number} limit
     * @returns {Promise<Array<{ id: string, type: string, message: string, time: string, icon: string }>>}
     */
    async getRecentActivity(userId, limit = 20) {
        if (!userId) return []
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('id, type, title, message, created_at')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(limit)

            if (error) throw error

            const now = new Date()
            return (data || []).map(n => {
                const createdAt = new Date(n.created_at)
                const timeAgo = formatTimeAgo(now - createdAt)
                const icon = getIconForType(n.type)
                return {
                    id: n.id,
                    type: n.type,
                    message: n.message || n.title,
                    time: timeAgo,
                    icon
                }
            })
        } catch (error) {
            console.error('activityService.getRecentActivity:', error)
            return []
        }
    }
}

function formatTimeAgo(ms) {
    if (ms < 60000) return 'Just now'
    if (ms < 3600000) return `${Math.floor(ms / 60000)} min ago`
    if (ms < 86400000) return `${Math.floor(ms / 3600000)} hours ago`
    if (ms < 604800000) return `${Math.floor(ms / 86400000)} days ago`
    if (ms < 2592000000) return `${Math.floor(ms / 604800000)} weeks ago`
    return `${Math.floor(ms / 2592000000)} months ago`
}

function getIconForType(type) {
    switch (type) {
        case 'like': return 'fas fa-heart'
        case 'match': return 'fas fa-heart'
        case 'message': return 'fas fa-comment'
        case 'system': return 'fas fa-info-circle'
        default: return 'fas fa-bell'
    }
}

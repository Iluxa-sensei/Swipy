import React, { useMemo } from 'react'
import { useAuth, useProfile, useActivityDashboard } from '../hooks'

// Compute profile completion from profile fields (when DB column is missing)
function getProfileCompletionPercentage(profile) {
    if (!profile) return 0
    if (typeof profile.profile_completion_percentage === 'number') {
        return Math.min(100, Math.max(0, profile.profile_completion_percentage))
    }
    const fields = [
        profile.full_name,
        profile.username,
        profile.avatar_url,
        profile.bio,
        profile.location,
        profile.website,
        profile.role,
        Array.isArray(profile.interests) ? profile.interests.length > 0 : profile.interests,
        profile.onboarding_completed
    ]
    const filled = fields.filter(Boolean).length
    return Math.round((filled / fields.length) * 100)
}

const ActivityDashboardPage = () => {
    const { user } = useAuth()
    const { profile } = useProfile(user?.id)
    const { stats, recentActivity, loading: activityLoading, error: activityError } = useActivityDashboard(user?.id)

    const profileCompletion = useMemo(() => getProfileCompletionPercentage(profile), [profile])

    const statsCards = useMemo(() => [
        {
            label: "Profile Views",
            value: String(stats.profileViews),
            icon: "fas fa-eye",
            color: "from-blue-500 to-blue-600"
        },
        {
            label: "Matches",
            value: String(stats.matches),
            icon: "fas fa-heart",
            color: "from-pink-500 to-pink-600"
        },
        {
            label: "Applications",
            value: String(stats.applications),
            icon: "fas fa-paper-plane",
            color: "from-green-500 to-green-600"
        },
        {
            label: "Days Active",
            value: String(stats.daysActive),
            icon: "fas fa-calendar",
            color: "from-purple-500 to-purple-600"
        }
    ], [stats])

    return (
        <div className="desktop-page">
            {activityError && (
                <div className="desktop-card mb-4" style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                    <p style={{ color: 'rgba(255, 255, 255, 0.9)' }}>{activityError}</p>
                </div>
            )}
            {/* Stats Grid */}
            <div className="desktop-grid desktop-grid-4" style={{ marginBottom: '32px' }}>
                {statsCards.map((stat, index) => (
                    <div key={index} className="desktop-card">
                        <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-2xl flex items-center justify-center mb-4`}>
                            <i className={`${stat.icon} text-white text-xl`}></i>
                        </div>
                        <div className="text-3xl font-bold mb-2">
                            {activityLoading ? '—' : stat.value}
                        </div>
                        <div className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>{stat.label}</div>
                    </div>
                ))}
            </div>

            <div className="desktop-grid desktop-grid-2">
                {/* Recent Activity */}
                <div className="desktop-page-section">
                    <div className="desktop-page-section-header">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl flex items-center justify-center">
                                <i className="fas fa-history text-white text-xl"></i>
                            </div>
                            <h2>Recent Activity</h2>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {activityLoading ? (
                            <div className="desktop-card">
                                <p style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Loading activity…</p>
                            </div>
                        ) : recentActivity.length === 0 ? (
                            <div className="desktop-card">
                                <p style={{ color: 'rgba(255, 255, 255, 0.5)' }}>No recent activity yet. Like startups and get matches to see updates here.</p>
                            </div>
                        ) : (
                            recentActivity.map((activity) => (
                                <div key={activity.id} className="desktop-card">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10" style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <i className={`${activity.icon} text-lg`} style={{ color: 'rgba(255, 255, 255, 0.7)' }}></i>
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium">{activity.message}</p>
                                            <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>{activity.time}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Profile Completion */}
                <div className="desktop-page-section">
                    <div className="desktop-page-section-header">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                                <i className="fas fa-chart-pie text-white text-xl"></i>
                            </div>
                            <h2>Profile Completion</h2>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Profile Strength</span>
                            <span className="font-bold">{profileCompletion}%</span>
                        </div>
                        <div className="w-full" style={{ background: 'rgba(255, 255, 255, 0.1)', borderRadius: '999px', height: '12px' }}>
                            <div
                                className="bg-gradient-to-r from-green-500 to-emerald-600 h-full rounded-full transition-all duration-500"
                                style={{ width: `${profileCompletion}%` }}
                            ></div>
                        </div>
                        <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                            Complete your profile to increase visibility and get more matches
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ActivityDashboardPage

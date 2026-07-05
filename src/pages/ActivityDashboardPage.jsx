import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, useProfile, useActivityDashboard, useDeviceType } from '../hooks'

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
    const navigate = useNavigate()
    const { isDesktop } = useDeviceType()
    const { user } = useAuth()
    const { profile } = useProfile(user?.id)
    const { stats, recentActivity, loading: activityLoading, error: activityError } = useActivityDashboard(user?.id)

    const profileCompletion = useMemo(() => getProfileCompletionPercentage(profile), [profile])

    const statsCards = useMemo(() => [
        {
            label: 'Profile Views',
            value: String(stats.profileViews),
            icon: 'fas fa-eye',
            color: 'from-blue-500 to-blue-600'
        },
        {
            label: 'Matches',
            value: String(stats.matches),
            icon: 'fas fa-heart',
            color: 'from-pink-500 to-pink-600'
        },
        {
            label: 'Applications',
            value: String(stats.applications),
            icon: 'fas fa-paper-plane',
            color: 'from-green-500 to-green-600'
        },
        {
            label: 'Days Active',
            value: String(stats.daysActive),
            icon: 'fas fa-calendar',
            color: 'from-purple-500 to-purple-600'
        }
    ], [stats])

    const statCardClass = isDesktop ? 'desktop-card' : 'bg-glass-bg border border-glass-border rounded-2xl p-4'
    const sectionClass = isDesktop ? 'desktop-page-section' : 'bg-glass-bg border border-glass-border rounded-2xl p-4'
    const activityItemClass = isDesktop ? 'desktop-card' : 'bg-bg-secondary/40 border border-glass-border rounded-xl p-4'

    const content = (
        <>
            {activityError && (
                <div
                    className={`${isDesktop ? 'desktop-card mb-4' : 'mb-4 rounded-2xl border border-red-500/30 bg-red-500/15 p-4'}`}
                >
                    <p className="text-text-primary">{activityError}</p>
                </div>
            )}

            <div className={isDesktop ? 'desktop-grid desktop-grid-4 mb-8' : 'grid grid-cols-2 gap-3 mb-6'}>
                {statsCards.map((stat, index) => (
                    <div key={index} className={statCardClass}>
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r ${stat.color} rounded-2xl flex items-center justify-center mb-3`}>
                            <i className={`${stat.icon} text-white text-lg`}></i>
                        </div>
                        <div className="text-2xl sm:text-3xl font-bold text-text-primary mb-1">
                            {activityLoading ? '—' : stat.value}
                        </div>
                        <div className="text-xs sm:text-sm text-text-secondary">{stat.label}</div>
                    </div>
                ))}
            </div>

            <div className={isDesktop ? 'desktop-grid desktop-grid-2' : 'space-y-4'}>
                <div className={sectionClass}>
                    <div className={isDesktop ? 'desktop-page-section-header' : 'mb-4'}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl flex items-center justify-center">
                                <i className="fas fa-history text-white"></i>
                            </div>
                            <h2 className="text-lg font-bold text-text-primary">Recent Activity</h2>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {activityLoading ? (
                            <div className={activityItemClass}>
                                <p className="text-text-secondary">Loading activity…</p>
                            </div>
                        ) : recentActivity.length === 0 ? (
                            <div className={activityItemClass}>
                                <p className="text-text-secondary text-sm">
                                    No recent activity yet. Like startups and get matches to see updates here.
                                </p>
                            </div>
                        ) : (
                            recentActivity.map((activity) => (
                                <div key={activity.id} className={activityItemClass}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-bg-secondary/60 rounded-xl flex items-center justify-center shrink-0">
                                            <i className={`${activity.icon} text-text-secondary`}></i>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-text-primary text-sm">{activity.message}</p>
                                            <p className="text-xs text-text-secondary mt-0.5">{activity.time}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className={sectionClass}>
                    <div className={isDesktop ? 'desktop-page-section-header' : 'mb-4'}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                                <i className="fas fa-chart-pie text-white"></i>
                            </div>
                            <h2 className="text-lg font-bold text-text-primary">Profile Completion</h2>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-text-secondary text-sm">Profile Strength</span>
                            <span className="font-bold text-text-primary">{profileCompletion}%</span>
                        </div>
                        <div className="w-full bg-bg-secondary/60 rounded-full h-3">
                            <div
                                className="bg-gradient-to-r from-green-500 to-emerald-600 h-full rounded-full transition-all duration-500"
                                style={{ width: `${profileCompletion}%` }}
                            ></div>
                        </div>
                        <p className="text-sm text-text-secondary">
                            Complete your profile to increase visibility and get more matches
                        </p>
                    </div>
                </div>
            </div>
        </>
    )

    if (isDesktop) {
        return <div className="desktop-page">{content}</div>
    }

    return (
        <div className="screen active">
            <div className="header">
                <button type="button" className="header-btn" onClick={() => navigate(-1)}>
                    <i className="fas fa-arrow-left"></i>
                </button>
                <h1>Activity Dashboard</h1>
                <div className="w-10"></div>
            </div>

            <div className="p-4 pb-24 space-y-6">
                {content}
            </div>
        </div>
    )
}

export default ActivityDashboardPage

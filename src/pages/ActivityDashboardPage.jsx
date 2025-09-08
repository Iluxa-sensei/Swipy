import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, useProfile } from '../hooks'

const ActivityDashboardPage = () => {
    const navigate = useNavigate()
    const { user } = useAuth()
    const { profile } = useProfile(user?.id)

    const stats = [
        {
            label: "Profile Views",
            value: profile?.profile_views || "0",
            icon: "fas fa-eye",
            color: "from-blue-500 to-blue-600"
        },
        {
            label: "Matches",
            value: profile?.matches || "0",
            icon: "fas fa-heart",
            color: "from-pink-500 to-pink-600"
        },
        {
            label: "Applications",
            value: profile?.applications || "0",
            icon: "fas fa-paper-plane",
            color: "from-green-500 to-green-600"
        },
        {
            label: "Days Active",
            value: profile?.days_active || "0",
            icon: "fas fa-calendar",
            color: "from-purple-500 to-purple-600"
        }
    ]

    const recentActivities = [
        { type: 'profile_view', message: 'Someone viewed your profile', time: '2 hours ago', icon: 'fas fa-eye' },
        { type: 'match', message: 'New match with TechStartup Inc.', time: '1 day ago', icon: 'fas fa-heart' },
        { type: 'application', message: 'Application sent to InnovateCorp', time: '2 days ago', icon: 'fas fa-paper-plane' },
        { type: 'profile_update', message: 'Profile updated successfully', time: '3 days ago', icon: 'fas fa-edit' }
    ]

    return (
        <div className="screen active bg-black/90 backdrop-blur-xl">
            {/* Header */}
            <div className="header bg-black/50 backdrop-blur-xl border-b border-white/10">
                <button
                    className="header-btn text-white/80 hover:text-white hover:bg-white/10 transition-all duration-300"
                    onClick={() => navigate('/settings')}
                >
                    <i className="fas fa-arrow-left text-xl"></i>
                </button>
                <h1 className="header-title text-white font-bold text-xl">Activity Dashboard</h1>
                <div className="w-10"></div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    {stats.map((stat, index) => (
                        <div key={index} className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300">
                            <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-2xl flex items-center justify-center mb-4`}>
                                <i className={`${stat.icon} text-white text-xl`}></i>
                            </div>
                            <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
                            <div className="text-sm text-white/70 font-medium">{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Recent Activity */}
                <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl flex items-center justify-center">
                            <i className="fas fa-history text-white text-xl"></i>
                        </div>
                        <h3 className="text-2xl font-bold text-white">Recent Activity</h3>
                    </div>

                    <div className="space-y-4">
                        {recentActivities.map((activity, index) => (
                            <div key={index} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all duration-300">
                                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                                    <i className={`${activity.icon} text-white/70 text-sm`}></i>
                                </div>
                                <div className="flex-1">
                                    <p className="text-white font-medium">{activity.message}</p>
                                    <p className="text-white/50 text-sm">{activity.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Profile Completion */}
                <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 mt-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                            <i className="fas fa-chart-pie text-white text-xl"></i>
                        </div>
                        <h3 className="text-2xl font-bold text-white">Profile Completion</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-white/70">Profile Strength</span>
                            <span className="text-white font-bold">{profile?.profile_completion_percentage || 0}%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-3">
                            <div
                                className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-500"
                                style={{ width: `${profile?.profile_completion_percentage || 0}%` }}
                            ></div>
                        </div>
                        <p className="text-white/50 text-sm">
                            Complete your profile to increase visibility and get more matches
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ActivityDashboardPage

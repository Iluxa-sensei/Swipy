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
        <div className="desktop-page">
            {/* Stats Grid */}
            <div className="desktop-grid desktop-grid-4" style={{ marginBottom: '32px' }}>
                {stats.map((stat, index) => (
                    <div key={index} className="desktop-card">
                        <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-2xl flex items-center justify-center mb-4`}>
                            <i className={`${stat.icon} text-white text-xl`}></i>
                        </div>
                        <div className="text-3xl font-bold mb-2">{stat.value}</div>
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
                        {recentActivities.map((activity, index) => (
                            <div key={index} className="desktop-card">
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
                        ))}
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
                            <span className="font-bold">{profile?.profile_completion_percentage || 0}%</span>
                        </div>
                        <div className="w-full" style={{ background: 'rgba(255, 255, 255, 0.1)', borderRadius: '999px', height: '12px' }}>
                            <div
                                className="bg-gradient-to-r from-green-500 to-emerald-600 h-full rounded-full transition-all duration-500"
                                style={{ width: `${profile?.profile_completion_percentage || 0}%` }}
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

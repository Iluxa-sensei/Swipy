import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks'
import { profileService } from '../services'

const ProfileEditPage = () => {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [activeTab, setActiveTab] = useState('basic')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState('')

    const [form, setForm] = useState({
        full_name: '',
        bio: '',
        location: '',
        website: '',
        avatar_url: '',
        hourly_rate: '',
        response_time: '',
        profile_views: 0,
        matches: 0,
        applications: 0,
        days_active: 0
    })

    // Load profile data from Supabase
    useEffect(() => {
        const loadProfile = async () => {
            if (!user?.id) {
                navigate('/login')
                return
            }

            try {
                setLoading(true)
                setError(null)

                const profile = await profileService.getProfile(user.id)
                if (profile) {
                    setForm({
                        full_name: profile.full_name || '',
                        bio: profile.bio || '',
                        location: profile.location || '',
                        website: profile.website || '',
                        avatar_url: profile.avatar_url || '',
                        hourly_rate: profile.hourly_rate || '',
                        response_time: profile.response_time || '',
                        profile_views: profile.profile_views || 0,
                        matches: profile.matches || 0,
                        applications: profile.applications || 0,
                        days_active: profile.days_active || 0
                    })
                }
            } catch (err) {
                console.error('Error loading profile:', err)
                setError('Failed to load profile. Please try again.')
            } finally {
                setLoading(false)
            }
        }

        loadProfile()
    }, [user?.id, navigate])

    // Handle form input changes
    const handleInputChange = (field, value) => {
        setForm(prev => ({
            ...prev,
            [field]: value
        }))
    }

    // Handle social media input changes
    const handleSocialChange = (platform, value) => {
        setForm(prev => ({
            ...prev,
            socials: {
                ...prev.socials,
                [platform]: value
            }
        }))
    }

    // Handle avatar upload
    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0]
        if (!file || !user?.id) return

        try {
            setSaving(true)
            setError(null)

            // Upload avatar to Supabase Storage
            const avatarUrl = await profileService.uploadAvatar(user.id, file)

            // Update form with new avatar URL
            setForm(prev => ({
                ...prev,
                avatar_url: avatarUrl
            }))

            setSuccess('Avatar uploaded successfully!')
            setTimeout(() => setSuccess(''), 3000)

        } catch (err) {
            console.error('Error uploading avatar:', err)
            setError('Failed to upload avatar. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!user?.id) return

        try {
            setSaving(true)
            setError(null)

            // Prepare profile data for Supabase
            const profileData = {
                full_name: form.full_name,
                bio: form.bio,
                location: form.location,
                website: form.website,
                avatar_url: form.avatar_url,
                hourly_rate: form.hourly_rate,
                response_time: form.response_time
            }

            // Update profile in Supabase
            await profileService.updateProfile(user.id, profileData)

            setSuccess('Profile updated successfully!')
            setTimeout(() => {
                setSuccess('')
                navigate('/profile')
            }, 2000)

        } catch (err) {
            console.error('Error updating profile:', err)
            setError('Failed to update profile. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    // Delete avatar
    const handleDeleteAvatar = async () => {
        if (!user?.id || !form.avatar_url) return

        try {
            setSaving(true)
            setError(null)

            await profileService.deleteAvatar(user.id)

            setForm(prev => ({
                ...prev,
                avatar_url: ''
            }))

            setSuccess('Avatar removed successfully!')
            setTimeout(() => setSuccess(''), 3000)

        } catch (err) {
            console.error('Error deleting avatar:', err)
            setError('Failed to delete avatar. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    // Show loading state
    if (loading) {
        return (
            <div className="screen active">
                <div className="header">
                    <button className="header-btn" onClick={() => navigate('/profile')}>
                        <i className="fas fa-arrow-left"></i>
                    </button>
                    <h1>Loading...</h1>
                    <div className="w-10"></div>
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-24 h-24 bg-gradient-to-br from-blue-300 to-blue-700 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-pulse">
                            <i className="fas fa-spinner fa-spin text-3xl text-white"></i>
                        </div>
                        <h2 className="text-2xl font-bold text-text-primary mb-4">Loading Profile</h2>
                        <p className="text-text-secondary">Please wait...</p>
                    </div>
                </div>
            </div>
        )
    }

    // Show error state
    if (error && !form.full_name) {
        return (
            <div className="screen active">
                <div className="header">
                    <button className="header-btn" onClick={() => navigate('/profile')}>
                        <i className="fas fa-arrow-left"></i>
                    </button>
                    <h1>Error</h1>
                    <div className="w-10"></div>
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-24 h-24 bg-gradient-to-br from-red-300 to-red-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <i className="fas fa-exclamation-triangle text-3xl text-white"></i>
                        </div>
                        <h2 className="text-2xl font-bold text-text-primary mb-4">Error Loading Profile</h2>
                        <p className="text-text-secondary mb-6">{error}</p>
                        <button
                            className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-8 py-3 rounded-2xl font-semibold hover:from-blue-600 hover:to-blue-800 transition-all duration-200"
                            onClick={() => window.location.reload()}
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="screen active">
            {/* Header */}
            <div className="header">
                <button className="header-btn" onClick={() => navigate('/profile')}>
                    <i className="fas fa-arrow-left"></i>
                </button>
                <h1>Edit Profile</h1>
                <button
                    className="header-btn"
                    onClick={handleSubmit}
                    disabled={saving}
                >
                    <i className={`fas ${saving ? 'fa-spinner fa-spin' : 'fa-save'}`}></i>
                </button>
            </div>

            {/* Success Message */}
            {success && (
                <div className="mx-4 mt-4 p-4 bg-green-500/20 border border-green-500/30 rounded-2xl">
                    <div className="flex items-center gap-3 text-green-600">
                        <i className="fas fa-check-circle"></i>
                        <span className="font-medium">{success}</span>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="mx-4 mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-2xl">
                    <div className="flex items-center gap-3 text-red-600">
                        <i className="fas fa-exclamation-circle"></i>
                        <span className="font-medium">{error}</span>
                    </div>
                </div>
            )}

            {/* Form */}
            <div className="flex-1 overflow-y-auto pb-6">
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-text-primary">Basic Information</h2>

                        {/* Avatar Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-300 to-blue-700 flex items-center justify-center">
                                        {form.avatar_url ? (
                                            <img
                                                src={form.avatar_url}
                                                alt="Profile"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-white text-2xl font-bold">
                                                {form.full_name ? form.full_name.charAt(0).toUpperCase() : 'U'}
                                            </span>
                                        )}
                                    </div>

                                    {/* Upload Button */}
                                    <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-accent-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-accent-primary/90 transition-all duration-200 shadow-lg">
                                        <i className="fas fa-camera text-white text-sm"></i>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleAvatarUpload}
                                            className="hidden"
                                            disabled={saving}
                                        />
                                    </label>
                                </div>

                                <div className="flex-1 space-y-2">
                                    <div className="text-sm text-text-secondary">
                                        Upload a profile picture to make your profile stand out
                                    </div>
                                    {form.avatar_url && (
                                        <button
                                            type="button"
                                            onClick={handleDeleteAvatar}
                                            disabled={saving}
                                            className="text-sm text-red-500 hover:text-red-600 transition-colors duration-200"
                                        >
                                            Remove avatar
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-2">
                                Full Name *
                            </label>
                            <input
                                type="text"
                                value={form.full_name}
                                onChange={(e) => handleInputChange('full_name', e.target.value)}
                                className="w-full p-4 bg-glass-bg border border-glass-border rounded-2xl text-text-primary placeholder-text-secondary focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all duration-200"
                                placeholder="Enter your full name"
                                required
                                disabled={saving}
                            />
                        </div>

                        {/* Bio */}
                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-2">
                                Bio
                            </label>
                            <textarea
                                value={form.bio}
                                onChange={(e) => handleInputChange('bio', e.target.value)}
                                rows={4}
                                className="w-full p-4 bg-glass-bg border border-glass-border rounded-2xl text-text-primary placeholder-text-secondary focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all duration-200 resize-none"
                                placeholder="Tell us about yourself..."
                                disabled={saving}
                            />
                        </div>

                        {/* Location */}
                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-2">
                                Location
                            </label>
                            <input
                                type="text"
                                value={form.location}
                                onChange={(e) => handleInputChange('location', e.target.value)}
                                className="w-full p-4 bg-glass-bg border border-glass-border rounded-2xl text-text-primary placeholder-text-secondary focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all duration-200"
                                placeholder="City, Country"
                                disabled={saving}
                            />
                        </div>

                        {/* Website */}
                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-2">
                                Website
                            </label>
                            <input
                                type="url"
                                value={form.website}
                                onChange={(e) => handleInputChange('website', e.target.value)}
                                className="w-full p-4 bg-glass-bg border border-glass-border rounded-2xl text-text-primary placeholder-text-secondary focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all duration-200"
                                placeholder="https://yourwebsite.com"
                                disabled={saving}
                            />
                        </div>
                    </div>

                    {/* Professional Information */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-text-primary">Professional Information</h2>

                        {/* Hourly Rate */}
                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-2">
                                Hourly Rate ($)
                            </label>
                            <input
                                type="number"
                                value={form.hourly_rate}
                                onChange={(e) => handleInputChange('hourly_rate', e.target.value)}
                                className="w-full p-4 bg-glass-bg border border-glass-border rounded-2xl text-text-primary placeholder-text-secondary focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all duration-200"
                                placeholder="50"
                                min="0"
                                disabled={saving}
                            />
                        </div>

                        {/* Response Time */}
                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-2">
                                Response Time
                            </label>
                            <select
                                value={form.response_time}
                                onChange={(e) => handleInputChange('response_time', e.target.value)}
                                className="w-full p-4 bg-glass-bg border border-glass-border rounded-2xl text-text-primary focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all duration-200"
                                disabled={saving}
                            >
                                <option value="">Select response time</option>
                                <option value="1 hour">Within 1 hour</option>
                                <option value="4 hours">Within 4 hours</option>
                                <option value="24 hours">Within 24 hours</option>
                                <option value="48 hours">Within 48 hours</option>
                            </select>
                        </div>
                    </div>

                    {/* Stats Display (Read-only) */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-text-primary">Profile Statistics</h2>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-glass-bg border border-glass-border rounded-2xl p-4">
                                <div className="text-text-secondary text-sm">Profile Views</div>
                                <div className="text-text-primary font-semibold text-lg">{form.profile_views}</div>
                            </div>
                            <div className="bg-glass-bg border border-glass-border rounded-2xl p-4">
                                <div className="text-text-secondary text-sm">Matches</div>
                                <div className="text-text-primary font-semibold text-lg">{form.matches}</div>
                            </div>
                            <div className="bg-glass-bg border border-glass-border rounded-2xl p-4">
                                <div className="text-text-secondary text-sm">Applications</div>
                                <div className="text-text-primary font-semibold text-lg">{form.applications}</div>
                            </div>
                            <div className="bg-glass-bg border border-glass-border rounded-2xl p-4">
                                <div className="text-text-secondary text-sm">Days Active</div>
                                <div className="text-text-primary font-semibold text-lg">{form.days_active}</div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>

            {/* Bottom Action Bar */}
            <div className="p-6 border-t border-glass-border bg-bg-secondary/80">
                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/profile')}
                        className="btn-secondary hover:scale-105 transition-transform duration-200"
                        disabled={saving}
                    >
                        <i className="fas fa-times mr-2"></i>
                        Cancel
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={saving}
                        className="bg-gradient-to-r from-blue-300 to-blue-700 hover:from-blue-400 hover:to-blue-800 text-white hover:scale-105 transition-transform duration-200 font-semibold rounded-2xl py-4 shadow-lg hover:shadow-xl"
                    >
                        <i className={`fas ${saving ? 'fa-spinner fa-spin' : 'fa-save'} mr-2`}></i>
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ProfileEditPage



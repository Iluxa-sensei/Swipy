import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import { useProfile } from '../hooks'
import { profileService } from '../services/profileService'
import { supabase } from '../services/supabaseClient'
import Loader from '../components/Loader.jsx'

const DesktopProfileEditPage = () => {
    const navigate = useNavigate()
    const { user } = useAuth()
    const { profile: existingProfile, loading: profileLoading, refetch: refetchProfile } = useProfile(user?.id)
    const [activeTab, setActiveTab] = useState('profile')
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [showSuccessModal, setShowSuccessModal] = useState(false)
    const [avatarFile, setAvatarFile] = useState(null)
    const [avatarPreview, setAvatarPreview] = useState(null)

    // Profile data with existing values
    const [profile, setProfile] = useState({
        full_name: '',
        username: '',
        bio: '',
        location: '',
        website: '',
        linkedin_url: '',
        github_url: '',
        instagram_url: '',
        company: '',
        job_title: '',
        experience_years: 0,
        skills: [],
        availability: 'Available',
        hourly_rate: '',
        timezone: '',
        role: '',
        interests: [],
        industry: ''
    })

    // Portfolio data (renamed from startups)
    const [userStartups, setUserStartups] = useState([])
    const [achievements, setAchievements] = useState([])

    // Location data
    const [selectedContinent, setSelectedContinent] = useState('')
    const [selectedCountry, setSelectedCountry] = useState('')
    const [selectedCity, setSelectedCity] = useState('')

    const continents = [
        'Remote', 'North America', 'South America', 'Europe', 'Asia', 'Africa', 'Oceania'
    ]

    const interestCategories = [
        "AI/ML", "FinTech", "HealthTech", "EdTech", "Sustainability",
        "E-commerce", "Gaming", "Enterprise", "Mobile", "Web3"
    ]

    const countries = {
        'North America': ['United States', 'Canada', 'Mexico'],
        'South America': ['Brazil', 'Argentina', 'Chile', 'Colombia'],
        'Europe': ['United Kingdom', 'Germany', 'France', 'Spain', 'Italy', 'Netherlands', 'Sweden', 'Norway'],
        'Asia': ['China', 'Japan', 'South Korea', 'India', 'Singapore', 'Thailand'],
        'Africa': ['South Africa', 'Nigeria', 'Kenya', 'Egypt'],
        'Oceania': ['Australia', 'New Zealand']
    }

    const cities = {
        'United States': ['New York', 'Los Angeles', 'San Francisco', 'Chicago', 'Boston', 'Seattle'],
        'Canada': ['Toronto', 'Vancouver', 'Montreal', 'Calgary'],
        'United Kingdom': ['London', 'Manchester', 'Birmingham', 'Edinburgh'],
        'Germany': ['Berlin', 'Munich', 'Hamburg', 'Frankfurt'],
        'France': ['Paris', 'Lyon', 'Marseille', 'Toulouse'],
        'Spain': ['Madrid', 'Barcelona', 'Valencia', 'Seville'],
        'Italy': ['Rome', 'Milan', 'Naples', 'Turin'],
        'Netherlands': ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht'],
        'Sweden': ['Stockholm', 'Gothenburg', 'Malmo', 'Uppsala'],
        'Norway': ['Oslo', 'Bergen', 'Trondheim', 'Stavanger'],
        'China': ['Beijing', 'Shanghai', 'Shenzhen', 'Guangzhou'],
        'Japan': ['Tokyo', 'Osaka', 'Kyoto', 'Yokohama'],
        'South Korea': ['Seoul', 'Busan', 'Incheon', 'Daegu'],
        'India': ['Mumbai', 'Delhi', 'Bangalore', 'Chennai'],
        'Singapore': ['Singapore'],
        'Thailand': ['Bangkok', 'Chiang Mai', 'Phuket', 'Pattaya'],
        'Australia': ['Sydney', 'Melbourne', 'Brisbane', 'Perth'],
        'New Zealand': ['Auckland', 'Wellington', 'Christchurch', 'Hamilton']
    }

    useEffect(() => {
        if (existingProfile && !profileLoading) {
            loadProfileData()
        }
    }, [existingProfile, profileLoading])

    const loadProfileData = async () => {
        setLoading(true)
        try {
            if (existingProfile) {
                setProfile({
                    full_name: existingProfile.full_name || '',
                    username: existingProfile.username || '',
                    bio: existingProfile.bio || '',
                    location: existingProfile.location || '',
                    website: existingProfile.website || '',
                    linkedin_url: existingProfile.linkedin_url || '',
                    github_url: existingProfile.github_url || '',
                    instagram_url: existingProfile.instagram_url || '',
                    company: existingProfile.company || '',
                    job_title: existingProfile.job_title || '',
                    experience_years: existingProfile.experience_years || 0,
                    skills: existingProfile.skills || [],
                    availability: existingProfile.availability || 'Available',
                    hourly_rate: existingProfile.hourly_rate || '',
                    timezone: existingProfile.timezone || '',
                    role: existingProfile.role || '',
                    interests: Array.isArray(existingProfile.interests) ? existingProfile.interests : [],
                    industry: existingProfile.industry || ''
                })

                // Parse location for dropdowns
                if (existingProfile.location) {
                    if (existingProfile.location === 'Remote') {
                        setSelectedContinent('Remote')
                        setSelectedCountry('')
                        setSelectedCity('')
                    } else {
                        const locationParts = existingProfile.location.split(', ')
                        if (locationParts.length >= 3) {
                            setSelectedCity(locationParts[0])
                            setSelectedCountry(locationParts[1])
                            setSelectedContinent(locationParts[2])
                        }
                    }
                }
            }

            // Load achievements
            const { data: achievementsData } = await supabase
                .from('achievements')
                .select('*')
                .eq('user_id', user.id)
                .order('date_earned', { ascending: false })

            setAchievements(achievementsData || [])

            // Load user startups (portfolio)
            const { data: startups } = await supabase
                .from('startups')
                .select('*')
                .eq('owner_id', user.id)
                .order('created_at', { ascending: false })

            setUserStartups(startups || [])

        } catch (error) {
            console.error('Error loading profile data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAvatarUpload = (event) => {
        const file = event.target.files[0]
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file')
                return
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('File size must be less than 5MB')
                return
            }

            setAvatarFile(file)

            // Create preview
            const reader = new FileReader()
            reader.onload = (e) => {
                setAvatarPreview(e.target.result)
            }
            reader.readAsDataURL(file)
        }
    }

    const uploadAvatar = async () => {
        if (!avatarFile || !user?.id) {
            console.error('No avatar file or user ID')
            return null
        }

        try {
            const fileExt = avatarFile.name.split('.').pop()
            const fileName = `${user.id}-${Date.now()}.${fileExt}`
            const filePath = `avatars/${fileName}`

            console.log('Uploading avatar:', { fileName, filePath, fileSize: avatarFile.size, userId: user.id })

            // Delete old avatar if exists
            if (existingProfile?.avatar_url) {
                try {
                    // Extract path from full URL
                    const url = new URL(existingProfile.avatar_url)
                    const pathParts = url.pathname.split('/')
                    const bucketIndex = pathParts.findIndex(part => part === 'storage')
                    if (bucketIndex !== -1 && pathParts[bucketIndex + 1] === 'v1') {
                        // Supabase storage URL format: /storage/v1/object/public/bucket/path
                        const oldPath = pathParts.slice(bucketIndex + 4).join('/')
                        console.log('Deleting old avatar:', oldPath)
                        const { error: deleteError } = await supabase.storage.from('avatars').remove([oldPath])
                        if (deleteError) {
                            console.warn('Could not delete old avatar:', deleteError)
                        } else {
                            console.log('Old avatar deleted successfully')
                        }
                    }
                } catch (e) {
                    console.warn('Could not delete old avatar:', e)
                }
            }

            // Upload new avatar
            console.log('Starting upload to:', filePath)
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, avatarFile, {
                    cacheControl: '3600',
                    upsert: false
                })

            if (uploadError) {
                console.error('Upload error details:', {
                    message: uploadError.message,
                    statusCode: uploadError.statusCode,
                    error: uploadError
                })

                // Check if bucket exists or if it's a permissions issue
                if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('not found')) {
                    alert('Storage bucket "avatars" not found. Please create it in Supabase Storage settings.')
                } else if (uploadError.message?.includes('permission') || uploadError.message?.includes('policy')) {
                    alert('Permission denied. Please check Storage policies in Supabase.')
                } else {
                    alert(`Error uploading avatar: ${uploadError.message || 'Unknown error'}`)
                }
                throw uploadError
            }

            console.log('Upload successful:', uploadData)

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)

            console.log('Public URL generated:', publicUrl)

            // Verify URL is valid
            if (!publicUrl || !publicUrl.startsWith('http')) {
                throw new Error('Invalid public URL generated')
            }

            return publicUrl
        } catch (error) {
            console.error('Error uploading avatar:', error)
            if (!error.message?.includes('permission') && !error.message?.includes('Bucket')) {
                alert(`Error uploading avatar: ${error.message || 'Unknown error'}. Please check browser console for details.`)
            }
            return null
        }
    }

    const saveProfile = async () => {
        setSaving(true)
        try {
            // Check username uniqueness if it was changed
            if (profile.username !== existingProfile?.username) {
                if (profile.username.trim().length < 3) {
                    alert('Username must be at least 3 characters long')
                    setSaving(false)
                    return
                }

                const isAvailable = await profileService.isUsernameAvailable(profile.username, user?.id)
                if (!isAvailable) {
                    alert('This username is already taken or invalid. Please choose another one.')
                    setSaving(false)
                    return
                }
            }

            // Upload avatar if selected
            let avatarUrl = existingProfile?.avatar_url || null
            if (avatarFile) {
                const uploadedUrl = await uploadAvatar()
                if (uploadedUrl) {
                    avatarUrl = uploadedUrl
                }
            }

            // Build location string from dropdowns
            const locationString = selectedContinent === 'Remote'
                ? 'Remote'
                : selectedCity && selectedCountry && selectedContinent
                    ? `${selectedCity}, ${selectedCountry}, ${selectedContinent}`
                    : profile.location

            const profileData = {
                id: user.id,
                ...profile,
                location: locationString,
                avatar_url: avatarUrl,
                updated_at: new Date().toISOString()
            }

            console.log('Saving profile data:', profileData)

            const { data: savedData, error } = await supabase
                .from('profiles')
                .upsert(profileData)
                .select()
                .single()

            if (error) {
                console.error('Error saving profile:', error)
                throw error
            }

            console.log('Profile saved successfully:', savedData)

            // Update cache by refetching profile
            if (refetchProfile) {
                await refetchProfile()
            }

            // Show success modal
            setShowSuccessModal(true)

            // Navigate to profile after 2 seconds
            setTimeout(() => {
                navigate('/profile')
            }, 2000)

        } catch (error) {
            console.error('Error saving profile:', error)
            alert('Error saving profile')
        } finally {
            setSaving(false)
        }
    }

    const tabs = [
        { id: 'profile', label: 'Profile', icon: 'fas fa-user' },
        { id: 'portfolio', label: 'Portfolio', icon: 'fas fa-briefcase' },
        { id: 'achievements', label: 'Achievements', icon: 'fas fa-trophy' }
    ]

    if (profileLoading || loading) {
        return (
            <div className="desktop-page">
                <div className="desktop-page-section">
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <Loader />
                            <p className="text-text-secondary text-lg font-medium mt-4">Loading profile...</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="desktop-page">
            {/* Header */}
            <div className="desktop-page-section !pb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            className="btn-secondary py-2.5 px-6 rounded-xl text-sm"
                            onClick={() => navigate('/profile')}
                        >
                            <i className="fas fa-arrow-left mr-2"></i>
                            Back
                        </button>
                        <h1 className="text-3xl font-bold text-text-primary">Edit Profile</h1>
                    </div>
                    <button
                        className="btn-primary py-2.5 px-6 rounded-xl text-sm"
                        onClick={saveProfile}
                        disabled={saving}
                    >
                        {saving ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-check mr-2"></i>}
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="desktop-page-section !py-0 !px-0 border-b border-glass-border bg-bg-primary/50 backdrop-blur-sm sticky top-0 z-20">
                <div className="flex max-w-3xl mx-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 py-4 px-6 text-center transition-all duration-200 relative ${activeTab === tab.id
                                ? 'text-accent-primary'
                                : 'text-text-secondary hover:text-text-primary'
                                }`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <i className={`${tab.icon} text-base`}></i>
                                <span className="font-semibold">{tab.label}</span>
                            </div>
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-primary"></div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="max-w-7xl mx-auto px-6 py-6">
                {activeTab === 'profile' && (
                    <ProfileTab
                        profile={profile}
                        setProfile={setProfile}
                        selectedContinent={selectedContinent}
                        setSelectedContinent={setSelectedContinent}
                        selectedCountry={selectedCountry}
                        setSelectedCountry={setSelectedCountry}
                        selectedCity={selectedCity}
                        setSelectedCity={setSelectedCity}
                        continents={continents}
                        countries={countries}
                        cities={cities}
                        interestCategories={interestCategories}
                        avatarPreview={avatarPreview}
                        avatarFile={avatarFile}
                        handleAvatarUpload={handleAvatarUpload}
                        setAvatarFile={setAvatarFile}
                        setAvatarPreview={setAvatarPreview}
                        existingProfile={existingProfile}
                    />
                )}
                {activeTab === 'portfolio' && (
                    <PortfolioTab
                        startups={userStartups}
                        setStartups={setUserStartups}
                        userId={user.id}
                        navigate={navigate}
                    />
                )}
                {activeTab === 'achievements' && (
                    <AchievementsTab
                        achievements={achievements}
                        setAchievements={setAchievements}
                        userId={user.id}
                    />
                )}
            </div>

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="desktop-card max-w-md mx-4">
                        <div className="text-center">
                            <div className="state-icon state-icon-green">
                                <i className="fas fa-check"></i>
                            </div>
                            <h3 className="text-2xl font-bold text-text-primary mb-4">Profile Updated!</h3>
                            <p className="text-text-secondary mb-6">Your profile has been successfully updated.</p>
                            <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-2 border-transparent border-t-accent-primary mr-3"></div>
                                <span className="text-text-secondary">Redirecting to profile...</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// Profile Tab Component
const ProfileTab = ({
    profile,
    setProfile,
    selectedContinent,
    setSelectedContinent,
    selectedCountry,
    setSelectedCountry,
    selectedCity,
    setSelectedCity,
    continents,
    countries,
    cities,
    interestCategories,
    avatarPreview,
    avatarFile,
    handleAvatarUpload,
    setAvatarFile,
    setAvatarPreview,
    existingProfile
}) => {
    const handleInputChange = (field, value) => {
        setProfile(prev => ({ ...prev, [field]: value }))
    }

    const handleSkillsChange = (skillsString) => {
        const skillsArray = skillsString.split(',').map(skill => skill.trim()).filter(skill => skill)
        setProfile(prev => ({ ...prev, skills: skillsArray }))
    }

    return (
        <div className="space-y-6">
            {/* Avatar Section */}
            <div className="desktop-card">
                <h3 className="text-xl font-bold text-text-primary mb-4">Profile Picture</h3>

                <div className="flex items-center gap-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-accent-primary/20 shadow-lg">
                        {avatarPreview ? (
                            <img
                                src={avatarPreview}
                                alt="Avatar preview"
                                className="w-full h-full object-cover"
                            />
                        ) : existingProfile?.avatar_url ? (
                            <img
                                src={existingProfile.avatar_url}
                                alt="Current avatar"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    console.error('Error loading avatar image:', e)
                                    e.target.style.display = 'none'
                                }}
                            />
                        ) : (
                            <span className="text-white text-2xl font-bold">
                                {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
                            </span>
                        )}
                    </div>
                    <div>
                        <p className="text-text-secondary mb-2">
                            {avatarFile ? 'New photo selected' : 'Upload a profile picture'}
                        </p>
                        <label className="btn-secondary py-2.5 px-6 rounded-xl text-sm cursor-pointer inline-block">
                            <i className="fas fa-upload mr-2"></i>Upload Photo
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarUpload}
                                className="hidden"
                            />
                        </label>
                        {avatarFile && (
                            <button
                                onClick={() => {
                                    setAvatarFile(null)
                                    setAvatarPreview(null)
                                }}
                                className="ml-3 text-red-400 hover:text-red-300 text-sm"
                            >
                                <i className="fas fa-times mr-1"></i>Remove
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Basic Information */}
            <div className="desktop-card">
                <h3 className="text-xl font-bold text-text-primary mb-4">Basic Information</h3>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-text-primary mb-2">Full Name</label>
                        <input
                            type="text"
                            value={profile.full_name}
                            onChange={(e) => handleInputChange('full_name', e.target.value)}
                            className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-2xl text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-all duration-300"
                            placeholder="Enter your full name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-text-primary mb-2">Username</label>
                        <input
                            type="text"
                            value={profile.username}
                            onChange={(e) => handleInputChange('username', e.target.value)}
                            className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-2xl text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-all duration-300"
                            placeholder="@username"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-text-primary mb-2">Role</label>
                        <select
                            value={profile.role}
                            onChange={(e) => handleInputChange('role', e.target.value)}
                            className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-2xl text-text-primary focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-all duration-300"
                        >
                            <option value="">Select Role</option>
                            <option value="founder">Founder</option>
                            <option value="investor">Investor</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-text-primary mb-2">Industry</label>
                        <input
                            type="text"
                            value={profile.industry}
                            onChange={(e) => handleInputChange('industry', e.target.value)}
                            className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-2xl text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-all duration-300"
                            placeholder="e.g., AI/ML, FinTech, HealthTech"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-text-primary mb-2">Interests</label>
                        <div className="grid grid-cols-2 gap-3">
                            {interestCategories.map((interest) => (
                                <button
                                    key={interest}
                                    type="button"
                                    onClick={() => {
                                        const currentInterests = Array.isArray(profile.interests) ? profile.interests : []
                                        const newInterests = currentInterests.includes(interest)
                                            ? currentInterests.filter(i => i !== interest)
                                            : [...currentInterests, interest]
                                        setProfile(prev => ({ ...prev, interests: newInterests }))
                                    }}
                                    className={`p-3 rounded-xl border transition-all duration-200 ${Array.isArray(profile.interests) && profile.interests.includes(interest)
                                        ? 'bg-accent-primary/20 border-accent-primary text-accent-primary'
                                        : 'bg-glass-bg border-glass-border text-text-primary hover:border-accent-primary/50'
                                        }`}
                                >
                                    {interest}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-semibold text-text-primary">Bio</label>
                            <span className={`text-xs ${(profile.bio?.length || 0) > 270 ? 'text-red-400' : 'text-text-secondary'}`}>
                                {profile.bio?.length || 0}/300
                            </span>
                        </div>
                        <textarea
                            value={profile.bio}
                            onChange={(e) => handleInputChange('bio', e.target.value.slice(0, 300))}
                            maxLength={300}
                            rows={4}
                            className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-2xl text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-all duration-300 resize-none"
                            placeholder="Tell us about yourself..."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-text-primary mb-2">Experience (years)</label>
                            <input
                                type="number"
                                min="0"
                                value={profile.experience_years}
                                onChange={(e) => {
                                    const value = parseInt(e.target.value) || 0
                                    handleInputChange('experience_years', Math.max(0, value))
                                }}
                                className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-2xl text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-all duration-300"
                                placeholder="0"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-text-primary mb-2">Availability</label>
                            <select
                                value={profile.availability}
                                onChange={(e) => handleInputChange('availability', e.target.value)}
                                className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-2xl text-text-primary focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-all duration-300"
                            >
                                <option value="Available">Available</option>
                                <option value="Busy">Busy</option>
                                <option value="Away">Away</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Location */}
            <div className="desktop-card">
                <h3 className="text-xl font-bold text-text-primary mb-4">Location</h3>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-text-primary mb-3">Location</label>
                        <select
                            value={selectedContinent}
                            onChange={(e) => {
                                const value = e.target.value
                                setSelectedContinent(value)
                                if (value === 'Remote') {
                                    setSelectedCountry('')
                                    setSelectedCity('')
                                } else {
                                    setSelectedCountry('')
                                    setSelectedCity('')
                                }
                            }}
                            className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-2xl text-text-primary focus:ring-2 focus:ring-accent-primary focus:border-accent-primary focus:border-transparent transition-all duration-300"
                        >
                            <option value="" className="bg-gray-800">Select Location</option>
                            <option value="Remote" className="bg-gray-800">Remote</option>
                            {continents.filter(c => c !== 'Remote').map(continent => (
                                <option key={continent} value={continent} className="bg-gray-800">{continent}</option>
                            ))}
                        </select>
                    </div>

                    {selectedContinent && selectedContinent !== 'Remote' && (
                        <>
                            <div>
                                <label className="block text-sm font-semibold text-text-primary mb-3">Country</label>
                                <input
                                    type="text"
                                    value={selectedCountry}
                                    onChange={(e) => setSelectedCountry(e.target.value)}
                                    className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-2xl text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-accent-primary focus:border-accent-primary focus:border-transparent transition-all duration-300"
                                    placeholder="Enter your country"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-text-primary mb-3">City</label>
                                <input
                                    type="text"
                                    value={selectedCity}
                                    onChange={(e) => setSelectedCity(e.target.value)}
                                    className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-2xl text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-accent-primary focus:border-accent-primary focus:border-transparent transition-all duration-300"
                                    placeholder="Enter your city"
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Professional Information */}
            <div className="desktop-card">
                <h3 className="text-xl font-bold text-text-primary mb-4">Professional Information</h3>

                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-text-primary mb-3">Company</label>
                            <input
                                type="text"
                                value={profile.company}
                                onChange={(e) => handleInputChange('company', e.target.value)}
                                className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-2xl text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-accent-primary focus:border-accent-primary focus:border-transparent transition-all duration-300"
                                placeholder="Your company"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-text-primary mb-3">Job Title</label>
                            <input
                                type="text"
                                value={profile.job_title}
                                onChange={(e) => handleInputChange('job_title', e.target.value)}
                                className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-2xl text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-accent-primary focus:border-accent-primary focus:border-transparent transition-all duration-300"
                                placeholder="Your position"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-text-primary mb-3">Skills</label>
                        <input
                            type="text"
                            value={profile.skills.join(', ')}
                            onChange={(e) => handleSkillsChange(e.target.value)}
                            className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-2xl text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-accent-primary focus:border-accent-primary focus:border-transparent transition-all duration-300"
                            placeholder="React, Node.js, Python, etc."
                        />
                        <p className="text-xs text-text-secondary mt-2">Separate skills with commas</p>
                    </div>
                </div>
            </div>

            {/* Links & Contact */}
            <div className="desktop-card">
                <h3 className="text-xl font-bold text-text-primary mb-4">Links & Contact</h3>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-text-primary mb-3">Website</label>
                        <input
                            type="url"
                            value={profile.website}
                            onChange={(e) => handleInputChange('website', e.target.value)}
                            className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-2xl text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-accent-primary focus:border-accent-primary focus:border-transparent transition-all duration-300"
                            placeholder="https://yourwebsite.com"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-text-primary mb-3">LinkedIn</label>
                            <input
                                type="url"
                                value={profile.linkedin_url}
                                onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                                className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-2xl text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-accent-primary focus:border-accent-primary focus:border-transparent transition-all duration-300"
                                placeholder="https://linkedin.com/in/username"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-text-primary mb-3">GitHub</label>
                            <input
                                type="url"
                                value={profile.github_url}
                                onChange={(e) => handleInputChange('github_url', e.target.value)}
                                className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-2xl text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-accent-primary focus:border-accent-primary focus:border-transparent transition-all duration-300"
                                placeholder="https://github.com/username"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-text-primary mb-3">Instagram</label>
                            <input
                                type="url"
                                value={profile.instagram_url}
                                onChange={(e) => handleInputChange('instagram_url', e.target.value)}
                                className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-2xl text-text-primary placeholder-text-secondary focus:ring-2 focus:ring-accent-primary focus:border-accent-primary focus:border-transparent transition-all duration-300"
                                placeholder="https://instagram.com/username"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Portfolio Tab Component (renamed from StartupsTab)
const PortfolioTab = ({ startups, setStartups, userId, navigate }) => {
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [startupToDelete, setStartupToDelete] = useState(null)

    const deleteStartup = async (startupId) => {
        try {
            console.log('Deleting startup with ID:', startupId)

            // First, check if the startup exists and belongs to the user
            const { data: existingStartup, error: fetchError } = await supabase
                .from('startups')
                .select('id, name, owner_id')
                .eq('id', startupId)
                .eq('owner_id', userId)
                .single()

            if (fetchError) {
                console.error('Error fetching startup:', fetchError)
                throw new Error('Startup not found or access denied')
            }

            if (!existingStartup) {
                throw new Error('Startup not found')
            }

            console.log('Found startup to delete:', existingStartup)

            // Delete the startup
            const { error: deleteError } = await supabase
                .from('startups')
                .delete()
                .eq('id', startupId)
                .eq('owner_id', userId) // Extra security check

            if (deleteError) {
                console.error('Error deleting startup:', deleteError)
                throw deleteError
            }

            console.log('Startup deleted successfully')

            // Update local state
            setStartups(prev => prev.filter(startup => startup.id !== startupId))
            setShowDeleteModal(false)
            setStartupToDelete(null)

            // Show success message
            alert('Startup deleted successfully!')

        } catch (error) {
            console.error('Error deleting startup:', error)
            alert(`Error deleting startup: ${error.message || 'Unknown error'}`)
        }
    }

    const handleDeleteClick = (startup) => {
        setStartupToDelete(startup)
        setShowDeleteModal(true)
    }

    return (
        <div className="space-y-8">
            <div className="desktop-card">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                        <i className="fas fa-briefcase text-white text-xl"></i>
                    </div>
                    <h3 className="text-xl font-bold text-text-primary">Portfolio</h3>
                </div>

                {startups.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="state-icon state-icon-green" style={{marginBottom: '32px'}}>
                            <i className="fas fa-rocket"></i>
                        </div>
                        <h4 className="text-xl font-bold text-text-primary mb-4">No Startups Yet</h4>
                        <p className="text-text-secondary mb-8 text-lg">Create your first startup to showcase your entrepreneurial journey</p>
                        <button
                            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:shadow-lg hover:shadow-green-500/25 transition-all duration-300"
                            onClick={() => navigate('/add')}
                        >
                            <i className="fas fa-plus mr-2"></i>Create Your First Startup
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {startups.map((startup) => (
                            <div key={startup.id} className="desktop-card">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <h4 className="text-xl font-bold text-text-primary mb-2">{startup.name}</h4>
                                        <p className="text-text-secondary mb-4">{startup.description}</p>
                                        <div className="flex flex-wrap gap-2">
                                            {startup.category && (
                                                <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium">
                                                    {startup.category}
                                                </span>
                                            )}
                                            {startup.stage && (
                                                <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm font-medium">
                                                    {startup.stage}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex space-x-3 ml-6">
                                        <button
                                            className="text-blue-400 hover:text-blue-300 p-2 hover:bg-blue-500/20 rounded-xl transition-all duration-300"
                                            onClick={() => {
                                                if (profile.username && startup.slug) {
                                                    navigate(`/${profile.username}/startup/${startup.slug}`)
                                                } else {
                                                    navigate(`/startup/${startup.id}`)
                                                }
                                            }}
                                        >
                                            <i className="fas fa-eye text-lg"></i>
                                        </button>
                                        <button
                                            className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/20 rounded-xl transition-all duration-300"
                                            onClick={() => handleDeleteClick(startup)}
                                        >
                                            <i className="fas fa-trash text-lg"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && startupToDelete && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 max-w-md mx-4">
                        <div className="text-center">
                            <div className="state-icon state-icon-red">
                                <i className="fas fa-exclamation-triangle"></i>
                            </div>
                            <h3 className="text-xl font-bold text-text-primary mb-4">Delete Startup</h3>
                            <p className="text-text-secondary mb-6">
                                Are you sure you want to delete <span className="font-semibold text-white">{startupToDelete.name}</span>?
                                This action cannot be undone.
                            </p>
                            <div className="flex space-x-4">
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false)
                                        setStartupToDelete(null)
                                    }}
                                    className="flex-1 bg-white/10 border border-white/20 text-white px-6 py-3 rounded-2xl font-semibold hover:bg-white/20 transition-all duration-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => deleteStartup(startupToDelete.id)}
                                    className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-2xl font-semibold hover:shadow-lg hover:shadow-red-500/25 transition-all duration-300"
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// Achievements Tab Component
const AchievementsTab = ({ achievements, setAchievements, userId }) => {
    const deleteAchievement = async (achievementId) => {
        try {
            const { error } = await supabase
                .from('achievements')
                .delete()
                .eq('id', achievementId)

            if (error) throw error

            // Update local state
            setAchievements(prev => prev.filter(ach => ach.id !== achievementId))
        } catch (error) {
            console.error('Error deleting achievement:', error)
            alert('Error deleting achievement')
        }
    }

    return (
        <div className="space-y-8">
            <div className="desktop-card">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center">
                        <i className="fas fa-trophy text-white text-xl"></i>
                    </div>
                    <h3 className="text-xl font-bold text-text-primary">Achievements</h3>
                </div>

                {achievements.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="state-icon state-icon-yellow" style={{marginBottom: '32px'}}>
                            <i className="fas fa-trophy"></i>
                        </div>
                        <h4 className="text-xl font-bold text-text-primary mb-4">No Achievements Yet</h4>
                        <p className="text-text-secondary mb-8 text-lg">Start building your profile to unlock achievements and badges</p>
                        <button className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:shadow-lg hover:shadow-yellow-500/25 transition-all duration-300">
                            <i className="fas fa-plus mr-2"></i>Add Your First Achievement
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {achievements.map((achievement, index) => (
                            <div key={index} className="desktop-card">
                                <div className="flex items-center gap-4">
                                    <div className="state-icon state-icon-sm state-icon-yellow" style={{marginBottom: 0}}>
                                        <i className="fas fa-trophy"></i>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-xl font-bold text-text-primary mb-2">{achievement.title}</h4>
                                        <p className="text-text-secondary mb-3">{achievement.description}</p>
                                        <div className="flex items-center gap-4 text-sm">
                                            <span className="text-yellow-400 font-semibold">
                                                <i className="fas fa-calendar mr-1"></i>
                                                {new Date(achievement.date_earned).toLocaleDateString()}
                                            </span>
                                            {achievement.issuer && (
                                                <span className="text-text-secondary">
                                                    <i className="fas fa-building mr-1"></i>
                                                    {achievement.issuer}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/20 rounded-xl transition-all duration-300"
                                            onClick={() => deleteAchievement(achievement.id)}
                                        >
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default DesktopProfileEditPage

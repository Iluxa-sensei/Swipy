import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, useProfile } from '../hooks'
import { supabase } from '../services/supabaseClient'

const ProfileEditPageModern = () => {
    const navigate = useNavigate()
    const { user } = useAuth()
    const { profile: existingProfile } = useProfile(user?.id)
    const [activeTab, setActiveTab] = useState('profile')
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [showSuccessModal, setShowSuccessModal] = useState(false)

    // Profile data with existing values
    const [profile, setProfile] = useState({
        full_name: '',
        bio: '',
        location: '',
        website: '',
        linkedin_url: '',
        github_url: '',
        company: '',
        job_title: '',
        experience_years: 0,
        skills: [],
        availability: 'Available',
        hourly_rate: '',
        timezone: ''
    })

    // Portfolio data (renamed from startups)
    const [userStartups, setUserStartups] = useState([])
    const [achievements, setAchievements] = useState([])

    // Location data
    const [selectedContinent, setSelectedContinent] = useState('')
    const [selectedCountry, setSelectedCountry] = useState('')
    const [selectedCity, setSelectedCity] = useState('')

    const continents = [
        'North America', 'South America', 'Europe', 'Asia', 'Africa', 'Oceania'
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
        if (user && existingProfile) {
            loadProfileData()
        }
    }, [user, existingProfile])

    const loadProfileData = async () => {
        setLoading(true)
        try {
            // Use existing profile data first
            if (existingProfile) {
                setProfile({
                    full_name: existingProfile.full_name || '',
                    bio: existingProfile.bio || '',
                    location: existingProfile.location || '',
                    website: existingProfile.website || '',
                    linkedin_url: existingProfile.linkedin_url || '',
                    github_url: existingProfile.github_url || '',
                    company: existingProfile.company || '',
                    job_title: existingProfile.job_title || '',
                    experience_years: existingProfile.experience_years || 0,
                    skills: existingProfile.skills || [],
                    availability: existingProfile.availability || 'Available',
                    hourly_rate: existingProfile.hourly_rate || '',
                    timezone: existingProfile.timezone || ''
                })

                // Parse location for dropdowns
                if (existingProfile.location) {
                    const locationParts = existingProfile.location.split(', ')
                    if (locationParts.length >= 3) {
                        setSelectedCity(locationParts[0])
                        setSelectedCountry(locationParts[1])
                        setSelectedContinent(locationParts[2])
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

    const saveProfile = async () => {
        setSaving(true)
        try {
            // Build location string from dropdowns
            const locationString = selectedCity && selectedCountry && selectedContinent
                ? `${selectedCity}, ${selectedCountry}, ${selectedContinent}`
                : profile.location

            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    ...profile,
                    location: locationString,
                    updated_at: new Date().toISOString()
                })

            if (error) throw error

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

    if (loading) {
        return (
            <div className="screen active bg-black/90 backdrop-blur-xl">
                <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-2 border-transparent border-t-blue-500 border-r-blue-500 mx-auto mb-6"></div>
                        <p className="text-white/70 text-lg font-medium">Loading profile...</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="screen active bg-black/90 backdrop-blur-xl">
            {/* Header */}
            <div className="header bg-black/50 backdrop-blur-xl border-b border-white/10">
                <button
                    className="header-btn text-white/80 hover:text-white hover:bg-white/10 transition-all duration-300"
                    onClick={() => navigate('/profile')}
                >
                    <i className="fas fa-arrow-left text-xl"></i>
                </button>
                <h1 className="header-title text-white font-bold text-xl">Edit Profile</h1>
                <button
                    className="header-btn text-green-400 hover:text-green-300 hover:bg-green-500/20 transition-all duration-300"
                    onClick={saveProfile}
                    disabled={saving}
                >
                    {saving ? <i className="fas fa-spinner fa-spin text-xl"></i> : <i className="fas fa-check text-xl"></i>}
                </button>
            </div>

            {/* Tab Navigation */}
            <div className="px-6 py-4">
                <div className="flex space-x-2 bg-white/5 backdrop-blur-xl rounded-2xl p-2 border border-white/10">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${activeTab === tab.id
                                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                                : 'text-white/60 hover:text-white hover:bg-white/10'
                                }`}
                        >
                            <i className={`${tab.icon} mr-2`}></i>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-20">
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
                    <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 max-w-md mx-4">
                        <div className="text-center">
                            <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <i className="fas fa-check text-white text-3xl"></i>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-4">Profile Updated!</h3>
                            <p className="text-white/70 mb-6">Your profile has been successfully updated.</p>
                            <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-2 border-transparent border-t-white mr-3"></div>
                                <span className="text-white/70">Redirecting to profile...</span>
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
    cities
}) => {
    const handleInputChange = (field, value) => {
        setProfile(prev => ({ ...prev, [field]: value }))
    }

    const handleSkillsChange = (skillsString) => {
        const skillsArray = skillsString.split(',').map(skill => skill.trim()).filter(skill => skill)
        setProfile(prev => ({ ...prev, skills: skillsArray }))
    }

    return (
        <div className="space-y-8">
            {/* Avatar Section */}
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                        <i className="fas fa-camera text-white text-xl"></i>
                    </div>
                    <h3 className="text-2xl font-bold text-white">Profile Picture</h3>
                </div>

                <div className="flex items-center gap-6">
                    <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-2xl font-bold">
                            {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
                        </span>
                    </div>
                    <div>
                        <p className="text-white/70 mb-2">Avatar functionality coming soon</p>
                        <button className="bg-white/10 border border-white/20 text-white px-4 py-2 rounded-xl hover:bg-white/20 transition-all duration-300">
                            <i className="fas fa-upload mr-2"></i>Upload Photo
                        </button>
                    </div>
                </div>
            </div>

            {/* Basic Information */}
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                        <i className="fas fa-user text-white text-xl"></i>
                    </div>
                    <h3 className="text-2xl font-bold text-white">Basic Information</h3>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-white/80 mb-3">Full Name</label>
                        <input
                            type="text"
                            value={profile.full_name}
                            onChange={(e) => handleInputChange('full_name', e.target.value)}
                            className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                            placeholder="Enter your full name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-white/80 mb-3">Bio</label>
                        <textarea
                            value={profile.bio}
                            onChange={(e) => handleInputChange('bio', e.target.value)}
                            rows={4}
                            className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 resize-none"
                            placeholder="Tell us about yourself..."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-white/80 mb-3">Experience (years)</label>
                            <input
                                type="number"
                                value={profile.experience_years}
                                onChange={(e) => handleInputChange('experience_years', parseInt(e.target.value) || 0)}
                                className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                                placeholder="0"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-white/80 mb-3">Availability</label>
                            <select
                                value={profile.availability}
                                onChange={(e) => handleInputChange('availability', e.target.value)}
                                className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                            >
                                <option value="Available" className="bg-gray-800">Available</option>
                                <option value="Busy" className="bg-gray-800">Busy</option>
                                <option value="Away" className="bg-gray-800">Away</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Location */}
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-600 rounded-2xl flex items-center justify-center">
                        <i className="fas fa-map-marker-alt text-white text-xl"></i>
                    </div>
                    <h3 className="text-2xl font-bold text-white">Location</h3>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-white/80 mb-3">Continent</label>
                        <select
                            value={selectedContinent}
                            onChange={(e) => {
                                setSelectedContinent(e.target.value)
                                setSelectedCountry('')
                                setSelectedCity('')
                            }}
                            className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                        >
                            <option value="" className="bg-gray-800">Select Continent</option>
                            {continents.map(continent => (
                                <option key={continent} value={continent} className="bg-gray-800">{continent}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-white/80 mb-3">Country</label>
                        <input
                            type="text"
                            value={selectedCountry}
                            onChange={(e) => setSelectedCountry(e.target.value)}
                            className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                            placeholder="Enter your country"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-white/80 mb-3">City</label>
                        <input
                            type="text"
                            value={selectedCity}
                            onChange={(e) => setSelectedCity(e.target.value)}
                            className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                            placeholder="Enter your city"
                        />
                    </div>
                </div>
            </div>

            {/* Professional Information */}
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center">
                        <i className="fas fa-briefcase text-white text-xl"></i>
                    </div>
                    <h3 className="text-2xl font-bold text-white">Professional Information</h3>
                </div>

                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-white/80 mb-3">Company</label>
                            <input
                                type="text"
                                value={profile.company}
                                onChange={(e) => handleInputChange('company', e.target.value)}
                                className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                                placeholder="Your company"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-white/80 mb-3">Job Title</label>
                            <input
                                type="text"
                                value={profile.job_title}
                                onChange={(e) => handleInputChange('job_title', e.target.value)}
                                className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                                placeholder="Your position"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-white/80 mb-3">Skills</label>
                        <input
                            type="text"
                            value={profile.skills.join(', ')}
                            onChange={(e) => handleSkillsChange(e.target.value)}
                            className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                            placeholder="React, Node.js, Python, etc."
                        />
                        <p className="text-xs text-white/50 mt-2">Separate skills with commas</p>
                    </div>
                </div>
            </div>

            {/* Links & Contact */}
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl flex items-center justify-center">
                        <i className="fas fa-link text-white text-xl"></i>
                    </div>
                    <h3 className="text-2xl font-bold text-white">Links & Contact</h3>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-white/80 mb-3">Website</label>
                        <input
                            type="url"
                            value={profile.website}
                            onChange={(e) => handleInputChange('website', e.target.value)}
                            className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                            placeholder="https://yourwebsite.com"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-white/80 mb-3">LinkedIn</label>
                            <input
                                type="url"
                                value={profile.linkedin_url}
                                onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                                className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                                placeholder="https://linkedin.com/in/username"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-white/80 mb-3">GitHub</label>
                            <input
                                type="url"
                                value={profile.github_url}
                                onChange={(e) => handleInputChange('github_url', e.target.value)}
                                className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                                placeholder="https://github.com/username"
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
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                        <i className="fas fa-briefcase text-white text-xl"></i>
                    </div>
                    <h3 className="text-2xl font-bold text-white">Portfolio</h3>
                </div>

                {startups.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-8">
                            <i className="fas fa-rocket text-white text-3xl"></i>
                        </div>
                        <h4 className="text-2xl font-bold text-white mb-4">No Startups Yet</h4>
                        <p className="text-white/60 mb-8 text-lg">Create your first startup to showcase your entrepreneurial journey</p>
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
                            <div key={startup.id} className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <h4 className="text-xl font-bold text-white mb-2">{startup.name}</h4>
                                        <p className="text-white/70 mb-4">{startup.description}</p>
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
                                            onClick={() => navigate(`/startup/${startup.id}`)}
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
                            <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <i className="fas fa-exclamation-triangle text-white text-3xl"></i>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-4">Delete Startup</h3>
                            <p className="text-white/70 mb-6">
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
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center">
                        <i className="fas fa-trophy text-white text-xl"></i>
                    </div>
                    <h3 className="text-2xl font-bold text-white">Achievements</h3>
                </div>

                {achievements.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-24 h-24 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-8">
                            <i className="fas fa-trophy text-white text-3xl"></i>
                        </div>
                        <h4 className="text-2xl font-bold text-white mb-4">No Achievements Yet</h4>
                        <p className="text-white/60 mb-8 text-lg">Start building your profile to unlock achievements and badges</p>
                        <button className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:shadow-lg hover:shadow-yellow-500/25 transition-all duration-300">
                            <i className="fas fa-plus mr-2"></i>Add Your First Achievement
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {achievements.map((achievement, index) => (
                            <div key={index} className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center">
                                        <i className="fas fa-trophy text-white text-2xl"></i>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-xl font-bold text-white mb-2">{achievement.title}</h4>
                                        <p className="text-white/70 mb-3">{achievement.description}</p>
                                        <div className="flex items-center gap-4 text-sm">
                                            <span className="text-yellow-400 font-semibold">
                                                <i className="fas fa-calendar mr-1"></i>
                                                {new Date(achievement.date_earned).toLocaleDateString()}
                                            </span>
                                            {achievement.issuer && (
                                                <span className="text-white/60">
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

export default ProfileEditPageModern

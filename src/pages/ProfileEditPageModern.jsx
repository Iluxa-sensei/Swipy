import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks'
import { supabase } from '../services/supabaseClient'

const ProfileEditPageModern = () => {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [activeTab, setActiveTab] = useState('profile')
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)

    // Profile data
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

    // Portfolio data
    const [portfolioProjects, setPortfolioProjects] = useState([])
    const [workExperience, setWorkExperience] = useState([])
    const [education, setEducation] = useState([])
    const [achievements, setAchievements] = useState([])
    const [userStartups, setUserStartups] = useState([])

    useEffect(() => {
        if (user) {
            loadProfileData()
        }
    }, [user])

    const loadProfileData = async () => {
        setLoading(true)
        try {
            // Load profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            if (profileData) {
                setProfile({
                    full_name: profileData.full_name || '',
                    bio: profileData.bio || '',
                    location: profileData.location || '',
                    website: profileData.website || '',
                    linkedin_url: profileData.linkedin_url || '',
                    github_url: profileData.github_url || '',
                    company: profileData.company || '',
                    job_title: profileData.job_title || '',
                    experience_years: profileData.experience_years || 0,
                    skills: profileData.skills || [],
                    availability: profileData.availability || 'Available',
                    hourly_rate: profileData.hourly_rate || '',
                    timezone: profileData.timezone || ''
                })
            }

            // Load portfolio projects
            const { data: projects } = await supabase
                .from('portfolio_projects')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            setPortfolioProjects(projects || [])

            // Load work experience
            const { data: experience } = await supabase
                .from('work_experience')
                .select('*')
                .eq('user_id', user.id)
                .order('start_date', { ascending: false })

            setWorkExperience(experience || [])

            // Load education
            const { data: educationData } = await supabase
                .from('education')
                .select('*')
                .eq('user_id', user.id)
                .order('end_date', { ascending: false })

            setEducation(educationData || [])

            // Load achievements
            const { data: achievementsData } = await supabase
                .from('achievements')
                .select('*')
                .eq('user_id', user.id)
                .order('date_earned', { ascending: false })

            setAchievements(achievementsData || [])

            // Load user startups
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
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    ...profile,
                    updated_at: new Date().toISOString()
                })

            if (error) throw error
            alert('Profile saved successfully!')
        } catch (error) {
            console.error('Error saving profile:', error)
            alert('Error saving profile')
        } finally {
            setSaving(false)
        }
    }

    const tabs = [
        { id: 'profile', label: 'Profile', icon: '👤' },
        { id: 'portfolio', label: 'Portfolio', icon: '💼' },
        { id: 'experience', label: 'Experience', icon: '💼' },
        { id: 'education', label: 'Education', icon: '🎓' },
        { id: 'achievements', label: 'Achievements', icon: '🏆' },
        { id: 'startups', label: 'My Startups', icon: '🚀' }
    ]

    if (loading) {
        return (
            <div className="screen active">
                <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-text-secondary">Loading profile...</p>
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
                <h1 className="header-title">Edit Profile</h1>
                <button
                    className="header-btn text-green-500"
                    onClick={saveProfile}
                    disabled={saving}
                >
                    {saving ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-check"></i>}
                </button>
            </div>

            {/* Tab Navigation */}
            <div className="px-4 py-2">
                <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${activeTab === tab.id
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <span className="mr-1">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto px-4 pb-20">
                {activeTab === 'profile' && <ProfileTab profile={profile} setProfile={setProfile} />}
                {activeTab === 'portfolio' && <PortfolioTab projects={portfolioProjects} setProjects={setPortfolioProjects} userId={user.id} />}
                {activeTab === 'experience' && <ExperienceTab experience={workExperience} setExperience={setWorkExperience} userId={user.id} />}
                {activeTab === 'education' && <EducationTab education={education} setEducation={setEducation} userId={user.id} />}
                {activeTab === 'achievements' && <AchievementsTab achievements={achievements} setAchievements={setAchievements} userId={user.id} />}
                {activeTab === 'startups' && <StartupsTab startups={userStartups} setStartups={setUserStartups} userId={user.id} />}
            </div>
        </div>
    )
}

// Profile Tab Component
const ProfileTab = ({ profile, setProfile }) => {
    const handleInputChange = (field, value) => {
        setProfile(prev => ({ ...prev, [field]: value }))
    }

    const handleSkillsChange = (skillsString) => {
        const skillsArray = skillsString.split(',').map(skill => skill.trim()).filter(skill => skill)
        setProfile(prev => ({ ...prev, skills: skillsArray }))
    }

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Basic Information</h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                        <input
                            type="text"
                            value={profile.full_name}
                            onChange={(e) => handleInputChange('full_name', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter your full name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                        <textarea
                            value={profile.bio}
                            onChange={(e) => handleInputChange('bio', e.target.value)}
                            rows={4}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Tell us about yourself..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                            <input
                                type="text"
                                value={profile.location}
                                onChange={(e) => handleInputChange('location', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="City, Country"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Experience (years)</label>
                            <input
                                type="number"
                                value={profile.experience_years}
                                onChange={(e) => handleInputChange('experience_years', parseInt(e.target.value) || 0)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="0"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Professional Information</h3>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                            <input
                                type="text"
                                value={profile.company}
                                onChange={(e) => handleInputChange('company', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Your company"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                            <input
                                type="text"
                                value={profile.job_title}
                                onChange={(e) => handleInputChange('job_title', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Your position"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
                        <input
                            type="text"
                            value={profile.skills.join(', ')}
                            onChange={(e) => handleSkillsChange(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="React, Node.js, Python, etc."
                        />
                        <p className="text-xs text-gray-500 mt-1">Separate skills with commas</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Links & Contact</h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                        <input
                            type="url"
                            value={profile.website}
                            onChange={(e) => handleInputChange('website', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="https://yourwebsite.com"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn</label>
                            <input
                                type="url"
                                value={profile.linkedin_url}
                                onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="https://linkedin.com/in/username"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">GitHub</label>
                            <input
                                type="url"
                                value={profile.github_url}
                                onChange={(e) => handleInputChange('github_url', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="https://github.com/username"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Placeholder components for other tabs
const PortfolioTab = ({ projects, setProjects, userId }) => (
    <div className="space-y-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Portfolio Projects</h3>
                <button className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm">
                    <i className="fas fa-plus mr-2"></i>Add Project
                </button>
            </div>
            <p className="text-gray-500">Portfolio management coming soon...</p>
        </div>
    </div>
)

const ExperienceTab = ({ experience, setExperience, userId }) => (
    <div className="space-y-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Work Experience</h3>
                <button className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm">
                    <i className="fas fa-plus mr-2"></i>Add Experience
                </button>
            </div>
            <p className="text-gray-500">Work experience management coming soon...</p>
        </div>
    </div>
)

const EducationTab = ({ education, setEducation, userId }) => (
    <div className="space-y-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Education</h3>
                <button className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm">
                    <i className="fas fa-plus mr-2"></i>Add Education
                </button>
            </div>
            <p className="text-gray-500">Education management coming soon...</p>
        </div>
    </div>
)

const AchievementsTab = ({ achievements, setAchievements, userId }) => (
    <div className="space-y-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Achievements</h3>
                <button className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm">
                    <i className="fas fa-plus mr-2"></i>Add Achievement
                </button>
            </div>
            <p className="text-gray-500">Achievements management coming soon...</p>
        </div>
    </div>
)

const StartupsTab = ({ startups, setStartups, userId }) => (
    <div className="space-y-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">My Startups</h3>
                <button className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm">
                    <i className="fas fa-plus mr-2"></i>Create Startup
                </button>
            </div>

            {startups.length === 0 ? (
                <div className="text-center py-8">
                    <div className="text-4xl mb-4">🚀</div>
                    <p className="text-gray-500 mb-4">No startups created yet</p>
                    <button className="bg-green-500 text-white px-6 py-3 rounded-lg">
                        Create Your First Startup
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {startups.map((startup) => (
                        <div key={startup.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-semibold">{startup.name}</h4>
                                    <p className="text-sm text-gray-500">{startup.description}</p>
                                </div>
                                <div className="flex space-x-2">
                                    <button className="text-blue-500 text-sm">Edit</button>
                                    <button className="text-red-500 text-sm">Delete</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
)

export default ProfileEditPageModern

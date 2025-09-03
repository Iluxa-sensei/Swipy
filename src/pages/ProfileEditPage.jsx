import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const STORAGE_KEY = 'profile_data'

const loadProfile = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        return raw ? JSON.parse(raw) : null
    } catch {
        return null
    }
}

const saveProfile = (data) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch { }
}

const isValidUrl = (value) => {
    if (!value) return true
    try {
        const url = new URL(value.startsWith('http') ? value : `https://${value}`)
        return Boolean(url.hostname)
    } catch {
        return false
    }
}

const ProfileEditPage = () => {
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState('basic')
    const [form, setForm] = useState({
        name: '',
        username: '',
        title: '',
        location: '',
        experience: '',
        bio: '',
        avatar: '',
        skills: [''],
        socials: {
            github: '',
            linkedin: '',
            instagram: '',
            website: ''
        },
        portfolio: [],
        certifications: [],
        privacy: {
            showEmail: false,
            showPhone: false,
            showLocation: true,
            profileVisibility: 'public'
        },
        preferences: {
            jobTypes: ['full-time', 'contract'],
            remoteWork: true,
            salaryRange: {
                min: 50000,
                max: 150000
            },
            availableHours: 40
        }
    })

    useEffect(() => {
        const existing = loadProfile()
        if (existing) {
            const defaultForm = {
                name: '',
                username: '',
                title: '',
                location: '',
                experience: '',
                bio: '',
                avatar: '',
                skills: [''],
                socials: {
                    github: '',
                    linkedin: '',
                    instagram: '',
                    website: ''
                },
                portfolio: [],
                certifications: [],
                privacy: {
                    showEmail: false,
                    showPhone: false,
                    showLocation: true,
                    profileVisibility: 'public'
                },
                preferences: {
                    jobTypes: ['full-time', 'contract'],
                    remoteWork: true,
                    salaryRange: {
                        min: 50000,
                        max: 150000
                    },
                    availableHours: 40
                }
            }

            const mergedForm = {
                ...defaultForm,
                ...existing,
                socials: { ...defaultForm.socials, ...(existing.socials || {}) },
                skills: Array.isArray(existing.skills) && existing.skills.length > 0 ? existing.skills : defaultForm.skills,
                portfolio: existing.portfolio || defaultForm.portfolio,
                certifications: existing.certifications || defaultForm.certifications,
                privacy: { ...defaultForm.privacy, ...(existing.privacy || {}) },
                preferences: {
                    ...defaultForm.preferences,
                    ...(existing.preferences || {}),
                    salaryRange: {
                        ...defaultForm.preferences.salaryRange,
                        ...(existing.preferences?.salaryRange || {})
                    }
                }
            }
            setForm(mergedForm)
        } else {
            // No existing profile data found
        }
    }, [])

    const handleChange = (e) => {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: value }))
    }

    const handleSocialChange = (name, value) => {
        setForm(prev => ({ ...prev, socials: { ...prev.socials, [name]: value } }))
    }

    const handleSkillChange = (index, value) => {
        setForm(prev => {
            const next = [...prev.skills]
            next[index] = value
            return { ...prev, skills: next }
        })
    }

    const addSkill = () => setForm(prev => ({ ...prev, skills: [...prev.skills, ''] }))
    const removeSkill = (index) => setForm(prev => ({ ...prev, skills: prev.skills.filter((_, i) => i !== index) }))

    // Portfolio functions
    const addPortfolioItem = () => {
        setForm(prev => ({
            ...prev,
            portfolio: [...prev.portfolio, {
                id: Date.now(),
                name: '',
                category: '',
                description: '',
                stage: '',
                investmentRequired: '',
                teamSize: '',
                location: '',
                gradient: 'bg-gradient-primary',
                image: '',
                createdAt: new Date().toISOString()
            }]
        }))
    }

    const updatePortfolioItem = (index, field, value) => {
        setForm(prev => {
            const updated = [...prev.portfolio]
            updated[index] = { ...updated[index], [field]: value }
            return { ...prev, portfolio: updated }
        })
    }

    const addPortfolioTech = (portfolioIndex) => {
        setForm(prev => {
            const updated = [...prev.portfolio]
            updated[portfolioIndex].tech.push('')
            return { ...prev, portfolio: updated }
        })
    }

    const updatePortfolioTech = (portfolioIndex, techIndex, value) => {
        setForm(prev => {
            const updated = [...prev.portfolio]
            updated[portfolioIndex].tech[techIndex] = value
            return { ...prev, portfolio: updated }
        })
    }

    const removePortfolioTech = (portfolioIndex, techIndex) => {
        setForm(prev => {
            const updated = [...prev.portfolio]
            updated[portfolioIndex].tech = updated[portfolioIndex].tech.filter((_, i) => i !== techIndex)
            return { ...prev, portfolio: updated }
        })
    }

    const removePortfolioItem = (index) => {
        setForm(prev => ({
            ...prev,
            portfolio: prev.portfolio.filter((_, i) => i !== index)
        }))
    }

    // Certification functions
    const addCertification = () => {
        setForm(prev => ({
            ...prev,
            certifications: [...prev.certifications, {
                id: Date.now(),
                name: '',
                issuer: '',
                year: new Date().getFullYear(),
                verified: false
            }]
        }))
    }

    const updateCertification = (index, field, value) => {
        setForm(prev => {
            const updated = [...prev.certifications]
            updated[index] = { ...updated[index], [field]: value }
            return { ...prev, certifications: updated }
        })
    }

    const removeCertification = (index) => {
        setForm(prev => ({
            ...prev,
            certifications: prev.certifications.filter((_, i) => i !== index)
        }))
    }

    // Privacy & Preferences functions
    const updatePrivacy = (field, value) => {
        setForm(prev => ({
            ...prev,
            privacy: { ...prev.privacy, [field]: value }
        }))
    }

    const updatePreferences = (field, value) => {
        setForm(prev => ({
            ...prev,
            preferences: { ...prev.preferences, [field]: value }
        }))
    }

    const updateSalaryRange = (field, value) => {
        setForm(prev => ({
            ...prev,
            preferences: {
                ...prev.preferences,
                salaryRange: { ...prev.preferences.salaryRange, [field]: parseInt(value) }
            }
        }))
    }

    const handleAvatar = (e) => {
        const file = e.target.files && e.target.files[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = () => {
            setForm(prev => ({ ...prev, avatar: String(reader.result) }))
        }
        reader.readAsDataURL(file)
    }

    const handleSave = (e) => {
        e.preventDefault()
        saveProfile(form)
        navigate('/profile')
    }

    const urlInvalid = Object.entries(form.socials).some(([, v]) => !isValidUrl(v))

    return (
        <div className="screen active">
            <div className="header relative">
                <button className="header-btn" onClick={() => navigate('/profile')}>
                    <i className="fas fa-arrow-left"></i>
                </button>
                <h1 className="absolute left-1/2 transform -translate-x-1/2 font-bold text-lg">Edit Profile</h1>
                <button
                    className="btn-primary text-sm px-4 py-2"
                    onClick={handleSave}
                    disabled={urlInvalid || !form.name.trim() || !form.username.trim()}
                >
                    <i className="fas fa-save"></i>
                    Save
                </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex justify-center bg-glass-bg border-b border-glass-border">
                <div className="flex gap-2 px-4">
                    {[
                        { id: 'basic', icon: 'fas fa-user', label: 'Basic' },
                        { id: 'portfolio', icon: 'fas fa-briefcase', label: 'Portfolio' },
                        { id: 'certs', icon: 'fas fa-certificate', label: 'Certs' },
                        { id: 'privacy', icon: 'fas fa-shield-alt', label: 'Privacy' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            className={`flex-shrink-0 px-4 py-4 text-center transition-all duration-200 rounded-t-xl ${activeTab === tab.id
                                ? 'text-accent-primary border-b-2 border-accent-primary bg-accent-primary/10'
                                : 'text-text-secondary hover:text-text-primary hover:bg-glass-border'
                                }`}
                            onClick={() => setActiveTab(tab.id)}
                            title={tab.label}
                        >
                            <i className={`${tab.icon} text-lg`}></i>
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-20">
                {/* Basic Info Tab */}
                {activeTab === 'basic' && (
                    <div className="p-6 space-y-6 animate-fade-in">
                        {/* Avatar Upload */}
                        <div className="text-center">
                            <div className="relative inline-block">
                                <div className="w-28 h-28 rounded-3xl overflow-hidden bg-glass-bg border-4 border-glass-border flex items-center justify-center mx-auto mb-4">
                                    {form.avatar ? (
                                        <img src={form.avatar} alt="avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <i className="fas fa-user text-4xl text-text-secondary"></i>
                                    )}
                                </div>
                                <label className="absolute bottom-0 right-0 w-10 h-10 bg-accent-primary rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform duration-200 shadow-lg">
                                    <i className="fas fa-camera text-white"></i>
                                    <input type="file" accept="image/*" onChange={handleAvatar} className="hidden" />
                                </label>
                            </div>
                            <p className="text-text-secondary text-sm">Click camera icon to upload photo</p>
                        </div>

                        {/* Personal Information */}
                        <div className="bg-glass-bg border border-glass-border rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                                <i className="fas fa-id-card text-accent-primary"></i>
                                Personal Information
                            </h3>

                            <div className="space-y-4">
                                <div className="form-group">
                                    <label className="block text-sm font-medium text-text-secondary mb-2">Full Name *</label>
                                    <input
                                        name="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        className="w-full bg-bg-primary border border-glass-border rounded-xl p-4 text-text-primary focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all duration-200"
                                        placeholder="Enter your full name"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="block text-sm font-medium text-text-secondary mb-2">Username *</label>
                                    <input
                                        name="username"
                                        value={form.username}
                                        onChange={handleChange}
                                        className="w-full bg-bg-primary border border-glass-border rounded-xl p-4 text-text-primary focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all duration-200"
                                        placeholder="Enter your username (without @)"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="block text-sm font-medium text-text-secondary mb-2">Professional Title</label>
                                    <input
                                        name="title"
                                        value={form.title}
                                        onChange={handleChange}
                                        className="w-full bg-bg-primary border border-glass-border rounded-xl p-4 text-text-primary focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all duration-200"
                                        placeholder="e.g. Full Stack Developer"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="form-group">
                                        <label className="block text-sm font-medium text-text-secondary mb-2">Location</label>
                                        <input
                                            name="location"
                                            value={form.location}
                                            onChange={handleChange}
                                            className="w-full bg-bg-primary border border-glass-border rounded-xl p-4 text-text-primary focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all duration-200"
                                            placeholder="City, Country"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="block text-sm font-medium text-text-secondary mb-2">Role</label>
                                        <select
                                            name="role"
                                            value={form.role || ''}
                                            onChange={handleChange}
                                            className="w-full bg-bg-primary border border-glass-border rounded-xl p-4 text-text-primary focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all duration-200"
                                        >
                                            <option value="">Select your role</option>
                                            <option value="founder">Founder</option>
                                            <option value="investor">Investor</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="form-group">
                                        <label className="block text-sm font-medium text-text-secondary mb-2">Years of Experience</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.5"
                                            name="experience"
                                            value={form.experience}
                                            onChange={handleChange}
                                            className="w-full bg-bg-primary border border-glass-border rounded-xl p-4 text-text-primary focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all duration-200"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="block text-sm font-medium text-text-secondary mb-2">Bio</label>
                                    <textarea
                                        name="bio"
                                        value={form.bio}
                                        onChange={handleChange}
                                        rows="5"
                                        className="w-full bg-bg-primary border border-glass-border rounded-xl p-4 text-text-primary focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all duration-200 resize-none"
                                        placeholder="Tell us about yourself, your experience, and what you're passionate about..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Skills */}
                        <div className="bg-glass-bg border border-glass-border rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                                <i className="fas fa-code text-accent-primary"></i>
                                Technical Skills
                            </h3>

                            <div className="space-y-3">
                                {form.skills.map((skill, i) => (
                                    <div key={i} className="flex gap-3">
                                        <input
                                            value={skill}
                                            onChange={(e) => handleSkillChange(i, e.target.value)}
                                            className="flex-1 bg-bg-primary border border-glass-border rounded-xl p-3 text-text-primary focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all duration-200"
                                            placeholder={`Skill ${i + 1}`}
                                        />
                                        <button
                                            type="button"
                                            className="w-12 h-12 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-all duration-200"
                                            onClick={() => removeSkill(i)}
                                        >
                                            <i className="fas fa-times"></i>
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    className="w-full py-3 border-2 border-dashed border-glass-border rounded-xl text-text-secondary hover:border-accent-primary hover:text-accent-primary transition-all duration-200 flex items-center justify-center gap-2"
                                    onClick={addSkill}
                                >
                                    <i className="fas fa-plus"></i>
                                    Add New Skill
                                </button>
                            </div>
                        </div>

                        {/* Social Links */}
                        <div className="bg-glass-bg border border-glass-border rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                                <i className="fas fa-share-alt text-accent-primary"></i>
                                Social Links
                            </h3>

                            <div className="space-y-4">
                                {[
                                    { key: 'github', icon: 'fab fa-github', label: 'GitHub', placeholder: 'https://github.com/username', color: 'text-gray-400' },
                                    { key: 'linkedin', icon: 'fab fa-linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/username', color: 'text-blue-400' },
                                    { key: 'website', icon: 'fas fa-globe', label: 'Website', placeholder: 'https://yourwebsite.com', color: 'text-accent-primary' },
                                    { key: 'instagram', icon: 'fab fa-instagram', label: 'Instagram', placeholder: 'https://instagram.com/username', color: 'text-pink-400' }
                                ].map((social) => (
                                    <div key={social.key} className="form-group">
                                        <label className="block text-sm font-medium text-text-secondary mb-2">{social.label}</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <i className={`${social.icon} ${social.color}`}></i>
                                            </div>
                                            <input
                                                type="url"
                                                value={form.socials[social.key]}
                                                onChange={(e) => handleSocialChange(social.key, e.target.value)}
                                                placeholder={social.placeholder}
                                                className={`w-full p-4 pl-12 bg-bg-primary border rounded-xl text-text-primary focus:ring-2 focus:ring-accent-primary/20 transition-all duration-200 ${isValidUrl(form.socials[social.key]) ? 'border-glass-border focus:border-accent-primary' : 'border-red-500 focus:border-red-500'
                                                    }`}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Portfolio Tab */}
                {activeTab === 'portfolio' && (
                    <div className="p-6 space-y-6 animate-fade-in">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-text-primary mb-2">My Startups</h2>
                            <p className="text-text-secondary">Manage your created startups</p>
                        </div>

                        {form.portfolio.map((startup, index) => (
                            <div key={startup.id} className="bg-glass-bg border border-glass-border rounded-2xl p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-lg font-semibold text-text-primary">{startup.name || `Startup #${index + 1}`}</h3>
                                    <button
                                        type="button"
                                        className="w-10 h-10 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-all duration-200"
                                        onClick={() => removePortfolioItem(index)}
                                    >
                                        <i className="fas fa-trash"></i>
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-text-secondary mb-2">Startup Name</label>
                                            <input
                                                value={startup.name || ''}
                                                onChange={(e) => updatePortfolioItem(index, 'name', e.target.value)}
                                                className="w-full bg-bg-primary border border-glass-border rounded-xl p-3 text-text-primary focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all duration-200"
                                                placeholder="Startup Name"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-text-secondary mb-2">Category</label>
                                            <input
                                                value={startup.category || ''}
                                                onChange={(e) => updatePortfolioItem(index, 'category', e.target.value)}
                                                className="w-full bg-bg-primary border border-glass-border rounded-xl p-3 text-text-primary focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all duration-200"
                                                placeholder="e.g. FinTech, EdTech"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-text-secondary mb-2">Stage</label>
                                            <input
                                                value={startup.stage || ''}
                                                onChange={(e) => updatePortfolioItem(index, 'stage', e.target.value)}
                                                className="w-full bg-bg-primary border border-glass-border rounded-xl p-3 text-text-primary focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all duration-200"
                                                placeholder="e.g. MVP, Seed"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-text-secondary mb-2">Investment Required</label>
                                            <input
                                                value={startup.investmentRequired || ''}
                                                onChange={(e) => updatePortfolioItem(index, 'investmentRequired', e.target.value)}
                                                className="w-full bg-bg-primary border border-glass-border rounded-xl p-3 text-text-primary focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all duration-200"
                                                placeholder="e.g. $500K"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-text-secondary mb-2">Team Size</label>
                                            <input
                                                value={startup.teamSize || ''}
                                                onChange={(e) => updatePortfolioItem(index, 'teamSize', e.target.value)}
                                                className="w-full bg-bg-primary border border-glass-border rounded-xl p-3 text-text-primary focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all duration-200"
                                                placeholder="e.g. 5-10"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-2">Description</label>
                                        <textarea
                                            value={startup.description || ''}
                                            onChange={(e) => updatePortfolioItem(index, 'description', e.target.value)}
                                            rows="3"
                                            className="w-full bg-bg-primary border border-glass-border rounded-xl p-3 text-text-primary focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all duration-200 resize-none"
                                            placeholder="Describe your startup, what problem it solves..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-2">Location</label>
                                        <input
                                            value={startup.location || ''}
                                            onChange={(e) => updatePortfolioItem(index, 'location', e.target.value)}
                                            className="w-full bg-bg-primary border border-glass-border rounded-xl p-3 text-text-primary focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all duration-200"
                                            placeholder="e.g. San Francisco, CA"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}

                        <button
                            type="button"
                            className="w-full py-4 border-2 border-dashed border-accent-primary/50 rounded-2xl text-accent-primary hover:bg-accent-primary/10 transition-all duration-200 flex items-center justify-center gap-3"
                            onClick={addPortfolioItem}
                        >
                            <i className="fas fa-plus text-xl"></i>
                            <span className="font-semibold">Add New Startup</span>
                        </button>
                    </div>
                )}

                {/* Certifications Tab */}
                {activeTab === 'certs' && (
                    <div className="p-6 space-y-6 animate-fade-in">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-text-primary mb-2">Certifications</h2>
                            <p className="text-text-secondary">Add your professional certifications and achievements</p>
                        </div>

                        {form.certifications.map((cert, index) => (
                            <div key={cert.id} className="bg-glass-bg border border-glass-border rounded-2xl p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-lg font-semibold text-text-primary">Certification #{index + 1}</h3>
                                    <button
                                        type="button"
                                        className="w-10 h-10 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-all duration-200"
                                        onClick={() => removeCertification(index)}
                                    >
                                        <i className="fas fa-trash"></i>
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-2">Certification Name</label>
                                        <input
                                            value={cert.name}
                                            onChange={(e) => updateCertification(index, 'name', e.target.value)}
                                            className="w-full bg-bg-primary border border-glass-border rounded-xl p-3 text-text-primary focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all duration-200"
                                            placeholder="AWS Solutions Architect"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-2">Issuing Organization</label>
                                        <input
                                            value={cert.issuer}
                                            onChange={(e) => updateCertification(index, 'issuer', e.target.value)}
                                            className="w-full bg-bg-primary border border-glass-border rounded-xl p-3 text-text-primary focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all duration-200"
                                            placeholder="Amazon Web Services"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-2">Year Obtained</label>
                                        <input
                                            type="number"
                                            min="1990"
                                            max={new Date().getFullYear() + 1}
                                            value={cert.year}
                                            onChange={(e) => updateCertification(index, 'year', parseInt(e.target.value))}
                                            className="w-full bg-bg-primary border border-glass-border rounded-xl p-3 text-text-primary focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all duration-200"
                                        />
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={cert.verified}
                                            onChange={(e) => updateCertification(index, 'verified', e.target.checked)}
                                            className="w-5 h-5 rounded border-2 border-glass-border bg-bg-primary checked:bg-accent-primary checked:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all duration-200"
                                        />
                                        <span className="text-text-primary font-medium">Verified Certification</span>
                                        <i className="fas fa-info-circle text-text-secondary" title="Mark as verified if you can provide proof of this certification"></i>
                                    </label>
                                </div>
                            </div>
                        ))}

                        <button
                            type="button"
                            className="w-full py-4 border-2 border-dashed border-accent-primary/50 rounded-2xl text-accent-primary hover:bg-accent-primary/10 transition-all duration-200 flex items-center justify-center gap-3"
                            onClick={addCertification}
                        >
                            <i className="fas fa-certificate text-xl"></i>
                            <span className="font-semibold">Add New Certification</span>
                        </button>
                    </div>
                )}

                {/* Privacy Tab */}
                {activeTab === 'privacy' && (
                    <div className="p-6 space-y-6 animate-fade-in">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-text-primary mb-2">Privacy & Preferences</h2>
                            <p className="text-text-secondary">Control your profile visibility and job preferences</p>
                        </div>

                        {/* Privacy Settings */}
                        <div className="bg-glass-bg border border-glass-border rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                                <i className="fas fa-shield-alt text-accent-primary"></i>
                                Privacy Settings
                            </h3>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-bg-primary border border-glass-border rounded-xl">
                                    <div>
                                        <h4 className="text-text-primary font-semibold">Profile Visibility</h4>
                                        <p className="text-text-secondary text-sm">Who can see your profile</p>
                                    </div>
                                    <select
                                        value={form.privacy.profileVisibility}
                                        onChange={(e) => updatePrivacy('profileVisibility', e.target.value)}
                                        className="bg-glass-bg border border-glass-border rounded-xl p-2 text-text-primary focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all duration-200"
                                    >
                                        <option value="public">Public</option>
                                        <option value="startups-only">Startups Only</option>
                                        <option value="private">Private</option>
                                    </select>
                                </div>

                                {['showLocation', 'showEmail', 'showPhone'].map((setting) => (
                                    <div key={setting} className="flex items-center justify-between p-4 bg-bg-primary border border-glass-border rounded-xl">
                                        <div>
                                            <h4 className="text-text-primary font-semibold">
                                                {setting === 'showLocation' ? 'Show Location' :
                                                    setting === 'showEmail' ? 'Show Email' : 'Show Phone'}
                                            </h4>
                                            <p className="text-text-secondary text-sm">
                                                {setting === 'showLocation' ? 'Display your location on profile' :
                                                    setting === 'showEmail' ? 'Allow startups to see your email' : 'Allow startups to see your phone number'}
                                            </p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={form.privacy[setting]}
                                                onChange={(e) => updatePrivacy(setting, e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-primary"></div>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Job Preferences */}
                        <div className="bg-glass-bg border border-glass-border rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                                <i className="fas fa-briefcase text-accent-primary"></i>
                                Job Preferences
                            </h3>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-3">Preferred Job Types</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { value: 'full-time', label: 'Full-time' },
                                            { value: 'part-time', label: 'Part-time' },
                                            { value: 'contract', label: 'Contract' },
                                            { value: 'freelance', label: 'Freelance' }
                                        ].map((type) => (
                                            <label key={type.value} className="flex items-center gap-3 p-3 bg-bg-primary border border-glass-border rounded-xl cursor-pointer hover:bg-glass-border transition-all duration-200">
                                                <input
                                                    type="checkbox"
                                                    checked={form.preferences.jobTypes.includes(type.value)}
                                                    onChange={(e) => {
                                                        const newJobTypes = e.target.checked
                                                            ? [...form.preferences.jobTypes, type.value]
                                                            : form.preferences.jobTypes.filter(t => t !== type.value)
                                                        updatePreferences('jobTypes', newJobTypes)
                                                    }}
                                                    className="w-4 h-4 rounded border-2 border-glass-border bg-bg-primary checked:bg-accent-primary checked:border-accent-primary"
                                                />
                                                <span className="text-text-primary">{type.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-bg-primary border border-glass-border rounded-xl">
                                    <div>
                                        <h4 className="text-text-primary font-semibold">Remote Work</h4>
                                        <p className="text-text-secondary text-sm">Open to remote opportunities</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={form.preferences.remoteWork}
                                            onChange={(e) => updatePreferences('remoteWork', e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-primary"></div>
                                    </label>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-3">Salary Range (USD)</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs text-text-secondary mb-1">Minimum</label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="1000"
                                                value={form.preferences.salaryRange.min}
                                                onChange={(e) => updateSalaryRange('min', e.target.value)}
                                                className="w-full bg-bg-primary border border-glass-border rounded-xl p-3 text-text-primary focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all duration-200"
                                                placeholder="50000"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-text-secondary mb-1">Maximum</label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="1000"
                                                value={form.preferences.salaryRange.max}
                                                onChange={(e) => updateSalaryRange('max', e.target.value)}
                                                className="w-full bg-bg-primary border border-glass-border rounded-xl p-3 text-text-primary focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all duration-200"
                                                placeholder="150000"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-3">Available Hours per Week</label>
                                    <input
                                        type="range"
                                        min="10"
                                        max="60"
                                        step="5"
                                        value={form.preferences.availableHours}
                                        onChange={(e) => updatePreferences('availableHours', parseInt(e.target.value))}
                                        className="w-full h-2 bg-glass-border rounded-lg appearance-none cursor-pointer slider"
                                    />
                                    <div className="flex justify-between text-sm text-text-secondary mt-2">
                                        <span>10h</span>
                                        <span className="font-semibold text-accent-primary">{form.preferences.availableHours}h/week</span>
                                        <span>60h</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ProfileEditPage



import React, { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSwipes, useAuth } from '../hooks'
import Loader from '../components/Loader.jsx'

const SavedPage = () => {
    const navigate = useNavigate()
    const { user } = useAuth()
    const { likes, passes, removeSwipe, loading, error, refetch } = useSwipes(user?.id)
    const [activeTab, setActiveTab] = useState('liked')

    const liked = useMemo(() => {
        if (!likes || !Array.isArray(likes)) return []
        return likes.map(like => like?.startups).filter(Boolean)
    }, [likes])

    const passed = useMemo(() => {
        if (!passes || !Array.isArray(passes)) return []
        return passes.map(pass => pass?.startups).filter(Boolean)
    }, [passes])

    // Refetch data when component mounts to ensure latest data
    useEffect(() => {
        if (user?.id) {
            refetch()
        }
    }, [user?.id, refetch])

    // Show message if no user
    if (!user?.id) {
        return (
            <div className="screen active">
                <div className="header">
                    <button className="header-btn" onClick={() => navigate('/home')}>
                        <i className="fas fa-arrow-left"></i>
                    </button>
                    <h1>Saved</h1>
                </div>
                <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                        <div className="state-icon state-icon-gray">
                            <i className="fas fa-user-slash"></i>
                        </div>
                        <h2 className="text-2xl font-bold text-text-primary mb-4">Please Login</h2>
                        <p className="text-text-secondary mb-8">You need to be logged in to view saved startups.</p>
                        <button
                            className="btn-icon-style px-8 py-3 rounded-2xl font-semibold"
                            onClick={() => navigate('/login')}
                        >
                            Go to Login
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // Debug logging to check data structure
    console.log('SavedPage Debug:', {
        user: user?.id,
        likesCount: likes?.length || 0,
        passesCount: passes?.length || 0,
        likedCount: liked?.length || 0,
        passedCount: passed?.length || 0,
        loading,
        error,
        likes: likes?.slice(0, 2), // Show first 2 for debugging
        passes: passes?.slice(0, 2) // Show first 2 for debugging
    })

    const list = activeTab === 'liked' ? liked : passed

    const handleClearSwipes = async () => {
        try {
            // Clear all swipes
            const allSwipes = [...likes, ...passes]
            await Promise.all(allSwipes.map(swipe => removeSwipe(swipe.startup_id)))
            navigate(0)
        } catch (error) {
            console.error('Error clearing swipes:', error)
        }
    }

    // Show loading state
    if (loading) {
        return (
            <div className="screen active">
                <div className="header">
                    <button className="header-btn" onClick={() => navigate('/home')}>
                        <i className="fas fa-arrow-left"></i>
                    </button>
                    <h1>Saved</h1>
                    <button className="header-btn">
                        <i className="fas fa-trash"></i>
                    </button>
                </div>

                <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                        <Loader />
                        <h2 className="text-2xl font-bold text-text-primary mt-4 mb-4">Loading Saved Startups</h2>
                        <p className="text-text-secondary">Please wait...</p>
                    </div>
                </div>
            </div>
        )
    }

    // Show error state
    if (error) {
        return (
            <div className="screen active">
                <div className="header">
                    <button className="header-btn" onClick={() => navigate('/home')}>
                        <i className="fas fa-arrow-left"></i>
                    </button>
                    <h1>Saved</h1>
                    <button className="header-btn">
                        <i className="fas fa-trash"></i>
                    </button>
                </div>

                <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                        <div className="state-icon state-icon-red">
                            <i className="fas fa-exclamation-triangle"></i>
                        </div>
                        <h2 className="text-2xl font-bold text-text-primary mb-4">Error Loading Saved Startups</h2>
                        <p className="text-text-secondary mb-6">{error}</p>
                        <button
                            className="btn-icon-style px-8 py-3 rounded-2xl font-semibold"
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
            <div className="header">
                <button className="header-btn" onClick={() => navigate('/profile')}>
                    <i className="fas fa-arrow-left"></i>
                </button>
                <h1>Saved</h1>
                <button className="header-btn" onClick={handleClearSwipes}>
                    <i className="fas fa-trash"></i>
                </button>
            </div>

            <div className="p-4 pb-20">
                <div className="flex gap-2 mb-4">
                    <button
                        className={`px-4 py-2 rounded-full border ${activeTab === 'liked' ? 'bg-accent-primary text-white border-accent-primary' : 'bg-glass-bg text-text-primary border-glass-border'}`}
                        onClick={() => setActiveTab('liked')}
                    >
                        Liked ({liked.length})
                    </button>
                    <button
                        className={`px-4 py-2 rounded-full border ${activeTab === 'passed' ? 'bg-accent-primary text-white border-accent-primary' : 'bg-glass-bg text-text-primary border-glass-border'}`}
                        onClick={() => setActiveTab('passed')}
                    >
                        Passed ({passed.length})
                    </button>
                </div>

                {list.length === 0 ? (
                    <div className="text-center mt-10">
                        <div className="state-icon state-icon-blue">
                            <i className="fas fa-heart"></i>
                        </div>
                        <h2 className="text-2xl font-bold text-text-primary mb-4">No Saved Startups</h2>
                        <p className="text-text-secondary mb-8">Startups you like or pass will appear here.</p>
                        <div className="flex justify-center">
                            <button
                                className="btn-icon-style px-8 py-3 rounded-full font-semibold"
                                onClick={() => navigate('/home')}
                            >
                                Browse Startups
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {list.map((s, index) => (
                            <div key={s.id} className="p-4 bg-glass-bg border border-glass-border rounded-2xl flex items-center justify-between hover:scale-[1.01] transition-transform animate-slide-in" style={{ animationDelay: `${index * 0.1}s` }}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 bg-gradient-primary rounded-2xl flex items-center justify-center text-white font-bold`}>
                                        {s.name ? s.name.substring(0, 2).toUpperCase() : 'ST'}
                                    </div>
                                    <div>
                                        <div className="text-text-primary font-semibold">{s.name}</div>
                                        <div className="text-text-secondary text-sm">{s.industry || 'Startup'} • {s.stage || 'Early Stage'}</div>
                                    </div>
                                </div>
                                <button className="btn-secondary" onClick={() => {
                                    if (s.profiles?.username && s.slug) {
                                        navigate(`/${s.profiles.username}/startup/${s.slug}`)
                                    } else {
                                        navigate(`/startup/${s.id}`)
                                    }
                                }}>
                                    <i className="fas fa-info-circle"></i>
                                    Details
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default SavedPage







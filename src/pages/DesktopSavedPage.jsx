import React, { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSwipes, useAuth } from '../hooks'

const DesktopSavedPage = () => {
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

    useEffect(() => {
        if (user?.id) {
            refetch()
        }
    }, [user?.id, refetch])

    const list = activeTab === 'liked' ? liked : passed

    if (loading) {
        return (
            <div className="desktop-page">
                <div className="desktop-page-section">
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-300 to-blue-700 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                <i className="fas fa-bookmark text-2xl text-white"></i>
                            </div>
                            <div className="text-text-secondary">Loading saved startups...</div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="desktop-page">
                <div className="desktop-page-section">
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="w-24 h-24 bg-gradient-to-br from-red-300 to-red-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <i className="fas fa-exclamation-triangle text-3xl text-white"></i>
                            </div>
                            <h2 className="text-2xl font-bold text-text-primary mb-4">Error Loading Saved Startups</h2>
                            <p className="text-text-secondary mb-6">{error}</p>
                            <button className="btn-primary" onClick={() => window.location.reload()}>
                                Retry
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="desktop-page">
            <div className="desktop-page-section">
                {/* Tabs */}
                <div className="flex gap-3 mb-6">
                    <button
                        className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${activeTab === 'liked'
                            ? 'bg-gradient-to-r from-blue-300 to-blue-700 text-white shadow-lg'
                            : 'bg-bg-secondary/80 text-text-secondary hover:bg-bg-secondary border border-glass-border'
                            }`}
                        onClick={() => setActiveTab('liked')}
                    >
                        <i className="fas fa-heart mr-2"></i>
                        Liked ({liked.length})
                    </button>
                    <button
                        className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${activeTab === 'passed'
                            ? 'bg-gradient-to-r from-blue-300 to-blue-700 text-white shadow-lg'
                            : 'bg-bg-secondary/80 text-text-secondary hover:bg-bg-secondary border border-glass-border'
                            }`}
                        onClick={() => setActiveTab('passed')}
                    >
                        <i className="fas fa-times mr-2"></i>
                        Passed ({passed.length})
                    </button>
                </div>

                {list.length === 0 ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="w-24 h-24 bg-gradient-to-br from-blue-300 to-blue-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <i className={`fas ${activeTab === 'liked' ? 'fa-heart' : 'fa-times'} text-3xl text-white`}></i>
                            </div>
                            <h2 className="text-2xl font-bold text-text-primary mb-4">
                                No {activeTab === 'liked' ? 'Liked' : 'Passed'} Startups
                            </h2>
                            <p className="text-text-secondary mb-8">
                                Startups you {activeTab === 'liked' ? 'like' : 'pass'} will appear here.
                            </p>
                            <div className="flex justify-center">
                                <button
                                    className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-8 py-3 rounded-full font-semibold hover:from-blue-600 hover:to-blue-800 transition-all duration-200"
                                    onClick={() => navigate('/home')}
                                >
                                    Browse Startups
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="desktop-grid desktop-grid-3">
                        {list.map((s) => (
                            <div key={s.id} className="desktop-card cursor-pointer group" onClick={() => {
                                if (s.profiles?.username && s.slug) {
                                    navigate(`/${s.profiles.username}/startup/${s.slug}`)
                                } else {
                                    navigate(`/startup/${s.id}`)
                                }
                            }}>
                                <div className="flex flex-col gap-4">
                                    <div className={`w-full h-32 ${s.gradient || 'bg-gradient-to-br from-blue-300 to-blue-700'} rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg`}>
                                        {s.logo || s.name?.substring(0, 2).toUpperCase() || 'ST'}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-text-primary mb-2">{s.name}</h3>
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {s.industry && (
                                                <span className="px-3 py-1 bg-bg-secondary/80 border border-glass-border rounded-lg text-xs text-text-secondary">
                                                    {s.industry}
                                                </span>
                                            )}
                                            {s.stage && (
                                                <span className="px-3 py-1 bg-bg-secondary/80 border border-glass-border rounded-lg text-xs text-text-secondary">
                                                    {s.stage}
                                                </span>
                                            )}
                                        </div>
                                        {s.description && (
                                            <p className="text-sm text-text-secondary line-clamp-2">{s.description}</p>
                                        )}
                                    </div>
                                    <button
                                        className="btn-secondary w-full mt-auto"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            if (s.profiles?.username && s.slug) {
                                                navigate(`/${s.profiles.username}/startup/${s.slug}`)
                                            } else {
                                                navigate(`/startup/${s.id}`)
                                            }
                                        }}
                                    >
                                        View Details
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default DesktopSavedPage


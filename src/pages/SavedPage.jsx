import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSwipes, useAuth } from '../hooks'

const SavedPage = () => {
    const navigate = useNavigate()
    const { user } = useAuth()
    const { likes, passes, removeSwipe, loading, error } = useSwipes(user?.id)
    const [activeTab, setActiveTab] = useState('liked')

    const liked = useMemo(() => {
        return likes.map(like => like.startups).filter(Boolean)
    }, [likes])

    const passed = useMemo(() => {
        return passes.map(pass => pass.startups).filter(Boolean)
    }, [passes])

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
                    <button className="header-btn" onClick={() => navigate('/profile')}>
                        <i className="fas fa-arrow-left"></i>
                    </button>
                    <h1>Saved</h1>
                    <button className="header-btn">
                        <i className="fas fa-trash"></i>
                    </button>
                </div>

                <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                        <div className="w-24 h-24 bg-gradient-to-br from-blue-300 to-blue-700 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-pulse">
                            <i className="fas fa-spinner fa-spin text-3xl text-white"></i>
                        </div>
                        <h2 className="text-2xl font-bold text-text-primary mb-4">Loading Saved Startups</h2>
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
                    <button className="header-btn" onClick={() => navigate('/profile')}>
                        <i className="fas fa-arrow-left"></i>
                    </button>
                    <h1>Saved</h1>
                    <button className="header-btn">
                        <i className="fas fa-trash"></i>
                    </button>
                </div>

                <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                        <div className="w-24 h-24 bg-gradient-to-br from-red-300 to-red-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <i className="fas fa-exclamation-triangle text-3xl text-white"></i>
                        </div>
                        <h2 className="text-2xl font-bold text-text-primary mb-4">Error Loading Saved Startups</h2>
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
                        <div className="w-24 h-24 bg-gradient-to-br from-blue-300 to-blue-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <i className="fas fa-heart text-3xl text-white"></i>
                        </div>
                        <h2 className="text-2xl font-bold text-text-primary mb-4">No Saved Startups</h2>
                        <p className="text-text-secondary mb-8">Startups you like or pass will appear here.</p>
                        <button
                            className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-8 py-3 rounded-2xl font-semibold hover:from-blue-600 hover:to-blue-800 transition-all duration-200"
                            onClick={() => navigate('/home')}
                        >
                            Browse Startups
                        </button>
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
                                <button className="btn-secondary" onClick={() => navigate(`/startup/${s.id}`)}>
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







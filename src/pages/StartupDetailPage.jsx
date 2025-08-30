import React, { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { startups } from '../data/startups'
import { getOrCreateChatForStartup } from '../data/chats'
import { saveSwipe } from '../data/swipes'

const StartupDetailPage = () => {
    const navigate = useNavigate()
    const { id } = useParams()

    const startup = useMemo(() => {
        const numericId = parseInt(id)
        return startups.find(s => s.id === numericId) || null
    }, [id])

    if (!startup) {
        return (
            <div className="screen active">
                <div className="header">
                    <button className="header-btn" onClick={() => navigate(-1)}>
                        <i className="fas fa-arrow-left"></i>
                    </button>
                    <h1>Not found</h1>
                    <div className="w-10"></div>
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center text-text-secondary">
                        Startup not found
                    </div>
                </div>
            </div>
        )
    }

    const openChat = () => {
        const chat = getOrCreateChatForStartup(startup)
        navigate(`/chat-detail/${chat.id}`)
    }

    // Like/Pass buttons removed per request

    return (
        <div className="screen active">
            <div className="header">
                <button className="header-btn" onClick={() => navigate(-1)}>
                    <i className="fas fa-arrow-left"></i>
                </button>
                <h1>{startup.name}</h1>
                <button className="header-btn" onClick={() => navigate('/saved')}>
                    <i className="fas fa-bookmark"></i>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto pb-6">
                <div className="card-image">
                    <div className={`${startup.gradient} w-full h-56`}>
                        <div className="gradient-overlay"></div>
                        <div className="company-logo">
                            <span className="text-white font-bold text-xl">{startup.logo}</span>
                        </div>
                        <div className="card-badges">
                            <span className="badge funding">{startup.funding}</span>
                            <span className="badge stage">{startup.stage}</span>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-xl font-semibold text-text-primary">Overview</h2>
                            <span className="text-text-secondary">{startup.category}</span>
                        </div>
                        <p className="text-text-secondary leading-relaxed">
                            {startup.description}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-glass-bg border border-glass-border rounded-2xl p-4">
                            <div className="text-text-secondary text-sm">Funding</div>
                            <div className="text-text-primary font-semibold">{startup.funding}</div>
                        </div>
                        <div className="bg-glass-bg border border-glass-border rounded-2xl p-4">
                            <div className="text-text-secondary text-sm">Team Size</div>
                            <div className="text-text-primary font-semibold">{startup.teamSize}</div>
                        </div>
                        <div className="bg-glass-bg border border-glass-border rounded-2xl p-4">
                            <div className="text-text-secondary text-sm">Location</div>
                            <div className="text-text-primary font-semibold">{startup.location}</div>
                        </div>
                        <div className="bg-glass-bg border border-glass-border rounded-2xl p-4">
                            <div className="text-text-secondary text-sm">Stage</div>
                            <div className="text-text-primary font-semibold">{startup.stage}</div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-text-primary mb-3">Open Roles</h3>
                        <div className="flex flex-wrap gap-2">
                            {startup.roles.map((role, index) => (
                                <span key={index} className="px-4 py-2 bg-glass-bg border border-glass-border rounded-full text-sm text-text-primary">
                                    {role}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
                <button
                    className="bg-accent-primary hover:bg-accent-primary/90 text-white px-6 py-3 rounded-full font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                    onClick={openChat}
                >
                    <i className="fas fa-comments text-sm"></i>
                    Chat
                </button>
            </div>
        </div>
    )
}

export default StartupDetailPage



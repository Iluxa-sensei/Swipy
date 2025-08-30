import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { startups } from '../data/startups'
import { getLikedIds, getPassedIds, clearSwipes } from '../data/swipes'

const SavedPage = () => {
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState('liked')

    const liked = useMemo(() => {
        const ids = new Set(getLikedIds())
        return startups.filter(s => ids.has(s.id))
    }, [])

    const passed = useMemo(() => {
        const ids = new Set(getPassedIds())
        return startups.filter(s => ids.has(s.id))
    }, [])

    const list = activeTab === 'liked' ? liked : passed

    return (
        <div className="screen active">
            <div className="header">
                <button className="header-btn" onClick={() => navigate('/profile')}>
                    <i className="fas fa-arrow-left"></i>
                </button>
                <h1>Saved</h1>
                <button className="header-btn" onClick={() => { clearSwipes(); navigate(0) }}>
                    <i className="fas fa-trash"></i>
                </button>
            </div>

            <div className="p-4 pb-20">
                <div className="flex gap-2 mb-4">
                    <button
                        className={`px-4 py-2 rounded-full border ${activeTab === 'liked' ? 'bg-accent-primary text-white border-accent-primary' : 'bg-glass-bg text-text-primary border-glass-border'}`}
                        onClick={() => setActiveTab('liked')}
                    >
                        Liked
                    </button>
                    <button
                        className={`px-4 py-2 rounded-full border ${activeTab === 'passed' ? 'bg-accent-primary text-white border-accent-primary' : 'bg-glass-bg text-text-primary border-glass-border'}`}
                        onClick={() => setActiveTab('passed')}
                    >
                        Passed
                    </button>
                </div>

                {list.length === 0 ? (
                    <div className="text-center text-text-secondary mt-10">
                        No startups here yet
                    </div>
                ) : (
                    <div className="space-y-3">
                        {list.map((s, index) => (
                            <div key={s.id} className="p-4 bg-glass-bg border border-glass-border rounded-2xl flex items-center justify-between hover:scale-[1.01] transition-transform animate-slide-in" style={{ animationDelay: `${index * 0.1}s` }}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 ${s.gradient} rounded-2xl flex items-center justify-center text-white font-bold`}>{s.logo}</div>
                                    <div>
                                        <div className="text-text-primary font-semibold">{s.name}</div>
                                        <div className="text-text-secondary text-sm">{s.category} • {s.stage}</div>
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







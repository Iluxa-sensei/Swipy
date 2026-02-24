import React from 'react'

const JobCard = ({ title, company, location, shortDescription, salary, type, gradient, onClick }) => {
    return (
        <div
            className="desktop-card cursor-pointer group transition-all duration-300 hover:border-accent-primary/30 hover:shadow-lg"
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onClick?.()
                }
            }}
        >
            <div className="flex flex-col gap-3">
                <div className={`w-full h-28 ${gradient || 'bg-gradient-to-br from-blue-300 to-blue-700'} rounded-xl flex items-center justify-center`}>
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                        <i className="fas fa-briefcase text-xl text-white"></i>
                    </div>
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-text-primary mb-1 group-hover:text-accent-primary transition-colors">
                        {title}
                    </h3>
                    <p className="text-sm text-text-secondary mb-2">{company}</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                        <span className="px-3 py-1 bg-bg-secondary/80 border border-glass-border rounded-lg text-xs text-text-secondary flex items-center gap-1">
                            <i className="fas fa-location-dot text-[10px]"></i>
                            {location}
                        </span>
                        {type && (
                            <span className="px-3 py-1 bg-bg-secondary/80 border border-glass-border rounded-lg text-xs text-text-secondary">
                                {type}
                            </span>
                        )}
                    </div>
                    {shortDescription && (
                        <p className="text-sm text-text-secondary line-clamp-2 mb-3">{shortDescription}</p>
                    )}
                    {salary && (
                        <p className="text-sm font-semibold text-accent-primary">{salary}</p>
                    )}
                </div>
            </div>
        </div>
    )
}

export default JobCard

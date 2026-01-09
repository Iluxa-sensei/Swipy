import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

const CustomDropdown = ({
    label,
    options,
    value,
    onChange,
    placeholder = "Select an option",
    type = "default" // "default", "category", "stage", "funding", "location"
}) => {
    const [isOpen, setIsOpen] = useState(false)
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 })
    const dropdownRef = useRef(null)
    const buttonRef = useRef(null)

    const updateCoords = () => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect()
            // Используем координаты относительно viewport
            setCoords({
                top: rect.bottom,
                left: rect.left,
                width: rect.width
            })
        }
    }

    useEffect(() => {
        if (isOpen) {
            updateCoords()
            // Обновляем при скролле и ресайзе
            window.addEventListener('scroll', updateCoords, true)
            window.addEventListener('resize', updateCoords)
        }
        return () => {
            window.removeEventListener('scroll', updateCoords, true)
            window.removeEventListener('resize', updateCoords)
        }
    }, [isOpen])

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isOpen && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                // Проверяем, не кликнули ли мы по самому порталу (он вне dropdownRef)
                const portal = document.getElementById('dropdown-portal-root')
                if (portal && portal.contains(event.target)) return
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isOpen])

    const getOptionDescription = (option) => {
        const descriptions = {
            'FinTech': 'Financial Technology',
            'EdTech': 'Education Technology',
            'HealthTech': 'Healthcare Technology',
            'AI/ML': 'Artificial Intelligence',
            'PropTech': 'Property Technology',
            'FoodTech': 'Food Technology',
            'CleanTech': 'Clean Technology',
            'Other (Custom)': 'Custom Category',
            'Idea Stage': 'Just an idea, no product yet',
            'MVP': 'Minimum Viable Product',
            'Early Stage': 'Product launched, early users',
            'Growth Stage': 'Growing user base and revenue',
            'Scale Stage': 'Scaling operations and team',
            'Pre-seed': 'Early development',
            'Seed': 'First funding round',
            'Series A': 'Growth funding',
            'Series B': 'Expansion funding',
            'Series C+': 'Large scale funding',
            'Bootstrapped': 'Self-funded'
        }
        return descriptions[option] || ''
    }

    const getOptionIcon = (option) => {
        const icons = {
            'FinTech': 'fas fa-coins',
            'EdTech': 'fas fa-graduation-cap',
            'HealthTech': 'fas fa-heartbeat',
            'AI/ML': 'fas fa-brain',
            'PropTech': 'fas fa-building',
            'FoodTech': 'fas fa-utensils',
            'CleanTech': 'fas fa-leaf',
            'Other (Custom)': 'fas fa-plus',
            'Idea Stage': 'fas fa-chart-line',
            'MVP': 'fas fa-rocket',
            'Early Stage': 'fas fa-seedling',
            'Growth Stage': 'fas fa-chart-bar',
            'Scale Stage': 'fas fa-chart-area',
            'Pre-seed': 'fas fa-seedling',
            'Seed': 'fas fa-potted-plant',
            'Series A': 'fas fa-tree',
            'location': 'fas fa-map-marker-alt'
        }
        if (type === 'location') return icons.location
        return icons[option] || 'fas fa-tag'
    }

    const selectedOption = options.find(opt => opt === value)

    const portalContent = isOpen && (
        <div 
            id="dropdown-portal-root"
            className="fixed bg-[#1a1b23] border border-glass-border rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.7)] overflow-hidden z-[999999]"
            style={{ 
                top: `${coords.top + 8}px`,
                left: `${coords.left}px`,
                width: `${coords.width}px`,
                maxHeight: '300px',
                animation: 'dropdownAppear 0.2s ease-out forwards'
            }}
        >
            <style>{`
                @keyframes dropdownAppear {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
            <div className="py-2 overflow-y-auto max-h-[290px] custom-scrollbar">
                {options.map((option) => (
                    <button
                        key={option}
                        type="button"
                        className={`w-full px-4 py-3 text-left transition-all duration-200 hover:bg-white/10 flex items-center gap-3 ${value === option ? 'bg-accent-primary/20 text-accent-primary' : 'text-text-primary'}`}
                        onClick={() => {
                            onChange(option);
                            setIsOpen(false);
                        }}
                    >
                        <i className={`${getOptionIcon(option)} text-sm ${value === option ? 'text-accent-primary' : 'text-text-secondary'} w-5 text-center`}></i>
                        <div className="flex-1">
                            <div className="font-medium text-sm">{option}</div>
                            {getOptionDescription(option) && (
                                <div className="text-[10px] text-text-secondary mt-0.5">{getOptionDescription(option)}</div>
                            )}
                        </div>
                        {value === option && <i className="fas fa-check text-xs text-accent-primary"></i>}
                    </button>
                ))}
            </div>
        </div>
    )

    return (
        <div className="form-group w-full" ref={dropdownRef}>
            {label && <label className="block text-text-primary font-medium mb-2">{label}</label>}
            <div className="relative">
                <button
                    ref={buttonRef}
                    type="button"
                    className={`w-full p-4 bg-glass-bg border rounded-2xl text-left transition-all duration-300 hover:border-accent-primary/70 focus:outline-none ${isOpen ? 'border-accent-primary shadow-lg shadow-accent-primary/10' : 'border-glass-border'} ${value ? 'text-text-primary' : 'text-text-secondary'}`}
                    onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setIsOpen(!isOpen)
                    }}
                >
                    <div className="flex items-center justify-between pointer-events-none">
                        <div className="flex items-center gap-3">
                            <i className={`${getOptionIcon(value || 'default')} ${value ? 'text-accent-primary' : 'text-text-secondary'} w-5 text-center`}></i>
                            <span className="font-medium">{selectedOption || placeholder}</span>
                        </div>
                        <i className={`fas fa-chevron-down transition-transform duration-300 ${isOpen ? 'rotate-180 text-accent-primary' : 'text-text-secondary'}`}></i>
                    </div>
                </button>
                {isOpen && createPortal(portalContent, document.body)}
            </div>
        </div>
    )
}

export default CustomDropdown

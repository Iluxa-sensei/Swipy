import React, { useState, useRef, useEffect } from 'react'

const CustomDropdown = ({
    label,
    options,
    value,
    onChange,
    placeholder = "Select an option",
    type = "default" // "default", "category", "stage", "funding", "location"
}) => {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef(null)

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    const getOptionDescription = (option) => {
        if (type === 'category') {
            const descriptions = {
                'FinTech': 'Financial Technology',
                'EdTech': 'Education Technology',
                'HealthTech': 'Healthcare Technology',
                'AI/ML': 'Artificial Intelligence',
                'PropTech': 'Property Technology',
                'FoodTech': 'Food Technology',
                'CleanTech': 'Clean Technology',
                'Other (Custom)': 'Custom Category'
            }
            return descriptions[option] || ''
        }

        if (type === 'stage') {
            const descriptions = {
                'Idea Stage': 'Just an idea, no product yet',
                'MVP': 'Minimum Viable Product',
                'Early Stage': 'Product launched, early users',
                'Growth Stage': 'Growing user base and revenue',
                'Scale Stage': 'Scaling operations and team'
            }
            return descriptions[option] || ''
        }

        if (type === 'funding') {
            const descriptions = {
                'Pre-seed': 'Early development',
                'Seed': 'First funding round',
                'Series A': 'Growth funding',
                'Series B': 'Expansion funding',
                'Series C+': 'Large scale funding',
                'Bootstrapped': 'Self-funded'
            }
            return descriptions[option] || ''
        }

        return ''
    }

    const getOptionIcon = (option) => {
        if (type === 'category') {
            const icons = {
                'FinTech': 'fas fa-coins',
                'EdTech': 'fas fa-graduation-cap',
                'HealthTech': 'fas fa-heartbeat',
                'AI/ML': 'fas fa-brain',
                'PropTech': 'fas fa-building',
                'FoodTech': 'fas fa-utensils',
                'CleanTech': 'fas fa-leaf',
                'Other (Custom)': 'fas fa-plus'
            }
            return icons[option] || 'fas fa-tag'
        }

        if (type === 'stage') {
            return 'fas fa-chart-line'
        }

        if (type === 'funding') {
            return 'fas fa-dollar-sign'
        }

        if (type === 'location') {
            return 'fas fa-map-marker-alt'
        }

        return 'fas fa-chevron-down'
    }

    const selectedOption = options.find(opt => opt === value)

    return (
        <div className="form-group" ref={dropdownRef}>
            <label className="block text-text-primary font-medium mb-2">{label}</label>
            <div className="relative">
                <button
                    type="button"
                    className={`w-full p-4 bg-glass-bg border rounded-2xl text-left transition-all duration-300 hover:border-accent-primary/70 focus:outline-none focus:border-accent-primary ${isOpen ? 'border-accent-primary' : 'border-glass-border'
                        } ${value ? 'text-text-primary' : 'text-text-secondary'}`}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {value && (
                                <i
                                    className={`${getOptionIcon(value)} text-accent-primary`}
                                    style={{ width: '16px' }}
                                ></i>
                            )}
                            <span>{selectedOption || placeholder}</span>
                        </div>
                        <i className={`fas fa-chevron-down transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}></i>
                    </div>
                </button>

                {isOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-bg-secondary border border-glass-border rounded-2xl shadow-heavy z-50 max-h-64 overflow-y-auto">
                        {options.map((option) => (
                            <button
                                key={option}
                                type="button"
                                className={`w-full p-4 text-left transition-all duration-200 hover:bg-glass-bg first:rounded-t-2xl last:rounded-b-2xl ${value === option ? 'bg-accent-primary/20 text-accent-primary' : 'text-text-primary hover:text-text-primary'
                                    }`}
                                onClick={() => {
                                    onChange(option)
                                    setIsOpen(false)
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <i
                                        className={`${getOptionIcon(option)} ${value === option ? 'text-accent-primary' : 'text-text-secondary'}`}
                                        style={{ width: '16px' }}
                                    ></i>
                                    <div className="flex-1">
                                        <div className="font-medium">{option}</div>
                                        {getOptionDescription(option) && (
                                            <div className="text-xs text-text-secondary mt-1">{getOptionDescription(option)}</div>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default CustomDropdown

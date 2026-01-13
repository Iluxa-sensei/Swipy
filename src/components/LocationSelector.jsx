import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

const LocationSelector = ({
    value,
    onChange,
    onContinentChange,
    onCountryChange,
    onCityChange,
    continentValue,
    countryValue,
    cityValue
}) => {
    const [isOpen, setIsOpen] = useState(false)
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 })
    const dropdownRef = useRef(null)
    const buttonRef = useRef(null)

    const continents = [
        'Remote', 'Asia', 'Europe', 'North America', 'South America', 'Africa', 'Australia'
    ]

    const continentDescriptions = {
        'Remote': 'Work from anywhere in the world',
        'Asia': 'Asia Pacific region',
        'Europe': 'European Union and beyond',
        'North America': 'United States, Canada, Mexico',
        'South America': 'Latin American countries',
        'Africa': 'African continent',
        'Australia': 'Australia and Oceania'
    }

    const updateCoords = () => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect()
            setCoords({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX,
                width: rect.width
            })
        }
    }

    useEffect(() => {
        if (isOpen) {
            updateCoords()
            window.addEventListener('resize', updateCoords)
            window.addEventListener('scroll', updateCoords, true)
        }
        return () => {
            window.removeEventListener('resize', updateCoords)
            window.removeEventListener('scroll', updateCoords, true)
        }
    }, [isOpen])

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isOpen && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                // Check if click was inside portal
                const portal = document.getElementById('location-portal-root')
                if (portal && portal.contains(event.target)) return
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen])

    const handleContinentSelect = (continent) => {
        onContinentChange(continent)
        if (continent === 'Remote') {
            onChange('Remote')
            onCountryChange('')
            onCityChange('')
        } else {
            onChange('')
        }
        setIsOpen(false)
    }

    const selectedContinent = continents.find(cont => cont === continentValue)

    const portalContent = isOpen && (
        <div 
            id="location-portal-root"
            className="fixed bg-bg-secondary border border-glass-border rounded-2xl shadow-heavy z-[9999] max-h-64 overflow-y-auto overscroll-contain"
            style={{ 
                top: `${coords.top - window.scrollY + 8}px`,
                left: `${coords.left}px`,
                width: `${coords.width}px`
            }}
        >
            {continents.map((continent) => (
                <button
                    key={continent}
                    type="button"
                    className={`w-full p-4 text-left first:rounded-t-2xl last:rounded-b-2xl ${continentValue === continent ? 'bg-accent-primary/20 text-accent-primary' : 'text-text-primary'
                        }`}
                    onClick={() => handleContinentSelect(continent)}
                >
                    <div className="flex-1">
                        <div className="font-medium text-sm">{continent}</div>
                        <div className="text-[10px] text-text-secondary mt-1">{continentDescriptions[continent]}</div>
                    </div>
                </button>
            ))}
        </div>
    )

    return (
        <div className="space-y-4" ref={dropdownRef}>
            {/* Continent Selection */}
            <div>
                <label className="block text-text-primary font-medium mb-3 text-sm">Select Continent or Remote</label>
                <div className="relative">
                    <button
                        ref={buttonRef}
                        type="button"
                        className={`w-full p-4 bg-glass-bg border rounded-2xl text-left focus:outline-none focus:border-accent-primary ${isOpen ? 'border-accent-primary' : 'border-glass-border'
                            } ${continentValue ? 'text-text-primary' : 'text-text-secondary'}`}
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        <div className="flex items-center justify-between pointer-events-none">
                            <span className="font-medium text-sm">{selectedContinent || 'Choose your location'}</span>
                            <i className={`fas fa-chevron-down text-xs transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}></i>
                        </div>
                    </button>

                    {isOpen && createPortal(portalContent, document.body)}
                </div>
            </div>

            {/* Country and City Fields - Only show if continent is selected and not Remote */}
            {continentValue && continentValue !== 'Remote' && (
                <div className="space-y-4 animate-fadeIn">
                    {/* Country Field */}
                    <div>
                        <label className="block text-text-primary font-medium mb-3 text-sm">Country</label>
                        <input
                            type="text"
                            className="w-full p-4 bg-glass-bg border border-glass-border rounded-2xl text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-primary transition-all duration-300 text-sm"
                            placeholder="Enter country name"
                            value={countryValue}
                            onChange={(e) => onCountryChange(e.target.value)}
                        />
                    </div>

                    {/* City Field */}
                    <div>
                        <label className="block text-text-primary font-medium mb-3 text-sm">City</label>
                        <input
                            type="text"
                            className="w-full p-4 bg-glass-bg border border-glass-border rounded-2xl text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-primary transition-all duration-300 text-sm"
                            placeholder="Enter city name"
                            value={cityValue}
                            onChange={(e) => onCityChange(e.target.value)}
                        />
                    </div>
                </div>
            )}

            {/* Remote/Selected Location Preview */}
            {continentValue && (
                <div className={`border rounded-2xl p-4 animate-fadeIn ${
                    continentValue === 'Remote' 
                    ? 'bg-green-500/10 border-green-500/20' 
                    : 'bg-accent-primary/10 border-accent-primary/20'
                }`}>
                    <div className="text-[10px] text-text-secondary uppercase tracking-wider mb-1">Selected Location</div>
                    <div className="font-semibold text-text-primary text-sm">
                        {continentValue === 'Remote' 
                            ? 'Remote - Work from anywhere' 
                            : `${cityValue || 'City'}, ${countryValue || 'Country'}`}
                    </div>
                </div>
            )}
        </div>
    )
}

export default LocationSelector

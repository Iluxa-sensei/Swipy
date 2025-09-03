import React, { useState, useRef, useEffect } from 'react'

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
    const dropdownRef = useRef(null)

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

    return (
        <div className="space-y-4" ref={dropdownRef}>
            {/* Continent Selection */}
            <div>
                <label className="block text-text-primary font-medium mb-3">Select Continent or Remote</label>
                <div className="relative">
                    <button
                        type="button"
                        className={`w-full p-4 bg-glass-bg border rounded-2xl text-left transition-all duration-300 hover:border-accent-primary/70 focus:outline-none focus:border-accent-primary ${isOpen ? 'border-accent-primary' : 'border-glass-border'
                            } ${continentValue ? 'text-text-primary' : 'text-text-secondary'}`}
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        <div className="flex items-center justify-between">
                            <span className="font-medium">{selectedContinent || 'Choose your location'}</span>
                            <i className={`fas fa-chevron-down transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}></i>
                        </div>
                    </button>

                    {isOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-bg-secondary border border-glass-border rounded-2xl shadow-heavy z-50 max-h-64 overflow-y-auto">
                            {continents.map((continent) => (
                                <button
                                    key={continent}
                                    type="button"
                                    className={`w-full p-4 text-left transition-all duration-200 hover:bg-glass-bg first:rounded-t-2xl last:rounded-b-2xl ${continentValue === continent ? 'bg-accent-primary/20 text-accent-primary' : 'text-text-primary hover:text-text-primary'
                                        }`}
                                    onClick={() => handleContinentSelect(continent)}
                                >
                                    <div className="flex-1">
                                        <div className="font-medium">{continent}</div>
                                        <div className="text-xs text-text-secondary mt-1">{continentDescriptions[continent]}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Country and City Fields - Only show if continent is selected and not Remote */}
            {continentValue && continentValue !== 'Remote' && (
                <div className="space-y-4 animate-fadeIn">
                    {/* Country Field */}
                    <div>
                        <label className="block text-text-primary font-medium mb-3">Country</label>
                        <input
                            type="text"
                            className="w-full p-4 bg-glass-bg border border-glass-border rounded-2xl text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-primary transition-all duration-300 hover:border-accent-primary/70"
                            placeholder="Enter country name"
                            value={countryValue}
                            onChange={(e) => onCountryChange(e.target.value)}
                        />
                    </div>

                    {/* City Field */}
                    <div>
                        <label className="block text-text-primary font-medium mb-3">City</label>
                        <input
                            type="text"
                            className="w-full p-4 bg-glass-bg border border-glass-border rounded-2xl text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-primary transition-all duration-300 hover:border-accent-primary/70"
                            placeholder="Enter city name"
                            value={cityValue}
                            onChange={(e) => onCityChange(e.target.value)}
                        />
                    </div>

                    {/* Location Preview */}
                    {countryValue && cityValue && (
                        <div className="bg-gradient-to-r from-accent-primary/10 to-accent-secondary/10 border border-accent-primary/20 rounded-2xl p-4 animate-fadeIn">
                            <div>
                                <div className="text-sm text-text-secondary">Selected Location</div>
                                <div className="font-semibold text-text-primary">{countryValue}, {cityValue}</div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Remote Location Preview */}
            {continentValue === 'Remote' && (
                <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl p-4 animate-fadeIn">
                    <div>
                        <div className="text-sm text-text-secondary">Selected Location</div>
                        <div className="font-semibold text-text-primary">Remote - Work from anywhere</div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default LocationSelector

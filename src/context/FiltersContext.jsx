import React, { createContext, useContext, useState, useEffect } from 'react'

const FiltersContext = createContext()

export const useFilters = () => {
    const context = useContext(FiltersContext)
    if (!context) {
        throw new Error('useFilters must be used within a FiltersProvider')
    }
    return context
}

export const FiltersProvider = ({ children }) => {
    const [filters, setFilters] = useState({
        categories: [],
        stages: [],
        locations: [],
        teamSize: '',
        funding: '',
        investmentRequired: ''
    })

            // Load filters from localStorage on initialization
    useEffect(() => {
        const savedFilters = localStorage.getItem('nextventures-filters')
        if (savedFilters) {
            try {
                const parsedFilters = JSON.parse(savedFilters)
                setFilters(parsedFilters)
            } catch (error) {
                console.error('Error loading filters:', error)
            }
        }
    }, [])

            // Save filters to localStorage on change
    useEffect(() => {
        localStorage.setItem('nextventures-filters', JSON.stringify(filters))
    }, [filters])

    const updateFilters = (newFilters) => {
        setFilters(newFilters)
    }

    const clearFilters = () => {
        setFilters({
            categories: [],
            stages: [],
            locations: [],
            teamSize: '',
            funding: '',
            investmentRequired: ''
        })
    }

    const toggleArrayItem = (array, item) => {
        if (array.includes(item)) {
            return array.filter(i => i !== item)
        } else {
            return [...array, item]
        }
    }

    const toggleCategory = (category) => {
        setFilters(prev => ({
            ...prev,
            categories: toggleArrayItem(prev.categories, category)
        }))
    }

    const toggleStage = (stage) => {
        setFilters(prev => ({
            ...prev,
            stages: toggleArrayItem(prev.stages, stage)
        }))
    }

    const toggleLocation = (location) => {
        setFilters(prev => ({
            ...prev,
            locations: toggleArrayItem(prev.locations, location)
        }))
    }

    const setTeamSize = (size) => {
        setFilters(prev => ({
            ...prev,
            teamSize: prev.teamSize === size ? '' : size
        }))
    }

    const setFunding = (funding) => {
        setFilters(prev => ({
            ...prev,
            funding: prev.funding === funding ? '' : funding
        }))
    }

    const setInvestmentRequired = (amount) => {
        setFilters(prev => ({
            ...prev,
            investmentRequired: prev.investmentRequired === amount ? '' : amount
        }))
    }

    const getActiveFiltersCount = () => {
        return filters.categories.length + filters.stages.length +
            filters.locations.length + (filters.teamSize ? 1 : 0) +
            (filters.funding ? 1 : 0) + (filters.investmentRequired ? 1 : 0)
    }

    const value = {
        filters,
        updateFilters,
        clearFilters,
        toggleCategory,
        toggleStage,
        toggleLocation,
        setTeamSize,
        setFunding,
        setInvestmentRequired,
        getActiveFiltersCount
    }

    return (
        <FiltersContext.Provider value={value}>
            {children}
        </FiltersContext.Provider>
    )
}












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
        industries: [], // Changed from categories to industries
        stages: [],
        locations: [],
        teamSize: '',
        funding: '',
        investmentRequired: ''
    })

    // Load filters from localStorage on initialization
    useEffect(() => {
        const savedFilters = localStorage.getItem('swipy-filters')
        if (savedFilters) {
            try {
                const parsedFilters = JSON.parse(savedFilters)
                // Migrate old filters to new structure
                if (parsedFilters.categories) {
                    parsedFilters.industries = parsedFilters.categories
                    delete parsedFilters.categories
                }
                setFilters(parsedFilters)
            } catch (error) {
                console.error('Error loading filters:', error)
            }
        }
    }, [])

    // Save filters to localStorage on change
    useEffect(() => {
        localStorage.setItem('swipy-filters', JSON.stringify(filters))
    }, [filters])

    const updateFilters = (newFilters) => {
        setFilters(newFilters)
    }

    const clearFilters = () => {
        setFilters({
            industries: [],
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

    const toggleIndustry = (industry) => {
        setFilters(prev => ({
            ...prev,
            industries: toggleArrayItem(prev.industries, industry)
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
        let count = 0
        if (filters.industries.length > 0) count += filters.industries.length
        if (filters.stages.length > 0) count += filters.stages.length
        if (filters.locations.length > 0) count += filters.locations.length
        if (filters.teamSize) count += 1
        if (filters.funding) count += 1
        if (filters.investmentRequired) count += 1
        return count
    }

    const applyFiltersToQuery = (query) => {
        let filteredQuery = query

        // Apply industry filters
        if (filters.industries.length > 0) {
            filteredQuery = filteredQuery.in('industry', filters.industries)
        }

        // Apply stage filters
        if (filters.stages.length > 0) {
            filteredQuery = filteredQuery.in('stage', filters.stages)
        }

        // Apply location filters
        if (filters.locations.length > 0) {
            filteredQuery = filteredQuery.in('location', filters.locations)
        }

        // Apply team size filter
        if (filters.teamSize) {
            filteredQuery = filteredQuery.eq('team_size', filters.teamSize)
        }

        // Apply funding filter
        if (filters.funding) {
            filteredQuery = filteredQuery.eq('funding_round', filters.funding)
        }

        return filteredQuery
    }

    return (
        <FiltersContext.Provider value={{
            filters,
            updateFilters,
            clearFilters,
            toggleIndustry,
            toggleStage,
            toggleLocation,
            setTeamSize,
            setFunding,
            setInvestmentRequired,
            getActiveFiltersCount,
            applyFiltersToQuery
        }}>
            {children}
        </FiltersContext.Provider>
    )
}












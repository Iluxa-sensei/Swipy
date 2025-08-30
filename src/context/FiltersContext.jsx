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
        roles: []
    })

    // Загружаем фильтры из localStorage при инициализации
    useEffect(() => {
        const savedFilters = localStorage.getItem('nextventures-filters')
        if (savedFilters) {
            try {
                setFilters(JSON.parse(savedFilters))
            } catch (error) {
                console.error('Error loading filters:', error)
            }
        }
    }, [])

    // Сохраняем фильтры в localStorage при изменении
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
            roles: []
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

    const toggleRole = (role) => {
        setFilters(prev => ({
            ...prev,
            roles: toggleArrayItem(prev.roles, role)
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

    const getActiveFiltersCount = () => {
        return filters.categories.length + filters.stages.length +
            filters.locations.length + (filters.teamSize ? 1 : 0) +
            (filters.funding ? 1 : 0) + filters.roles.length
    }

    const value = {
        filters,
        updateFilters,
        clearFilters,
        toggleCategory,
        toggleStage,
        toggleLocation,
        toggleRole,
        setTeamSize,
        setFunding,
        getActiveFiltersCount
    }

    return (
        <FiltersContext.Provider value={value}>
            {children}
        </FiltersContext.Provider>
    )
}












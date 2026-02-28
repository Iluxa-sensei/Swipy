import React, { createContext, useContext, useState, useMemo } from 'react'

const JobSearchFiltersContext = createContext(null)

export const JobSearchFiltersProvider = ({ children }) => {
    const [jobFilters, setJobFilters] = useState([])

    const value = useMemo(
        () => ({
            jobFilters,
            setJobFilters,
        }),
        [jobFilters]
    )

    return (
        <JobSearchFiltersContext.Provider value={value}>
            {children}
        </JobSearchFiltersContext.Provider>
    )
}

export const useJobSearchFilters = () => {
    const ctx = useContext(JobSearchFiltersContext)
    if (!ctx) {
        return {
            jobFilters: [],
            // no-op setter so components don't crash if provider is missing
            setJobFilters: () => {},
        }
    }
    return ctx
}



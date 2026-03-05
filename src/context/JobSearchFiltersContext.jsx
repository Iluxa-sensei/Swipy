import React, { createContext, useContext, useState, useMemo } from 'react'

const JobSearchFiltersContext = createContext(null)

export const JobSearchFiltersProvider = ({ children }) => {
    const [jobFilters, setJobFilters] = useState([])
    const [jobSearchQuery, setJobSearchQuery] = useState('')
    const [jobSearchResults, setJobSearchResults] = useState([])
    const [jobSearchHasSearched, setJobSearchHasSearched] = useState(false)
    const [jobSearchCurrentPage, setJobSearchCurrentPage] = useState(1)

    const value = useMemo(
        () => ({
            jobFilters,
            setJobFilters,
            jobSearchQuery,
            setJobSearchQuery,
            jobSearchResults,
            setJobSearchResults,
            jobSearchHasSearched,
            setJobSearchHasSearched,
            jobSearchCurrentPage,
            setJobSearchCurrentPage,
        }),
        [jobFilters, jobSearchQuery, jobSearchResults, jobSearchHasSearched, jobSearchCurrentPage]
    )

    return (
        <JobSearchFiltersContext.Provider value={value}>
            {children}
        </JobSearchFiltersContext.Provider>
    )
}

const noop = () => { }

export const useJobSearchFilters = () => {
    const ctx = useContext(JobSearchFiltersContext)
    if (!ctx) {
        return {
            jobFilters: [],
            setJobFilters: noop,
            jobSearchQuery: '',
            setJobSearchQuery: noop,
            jobSearchResults: [],
            setJobSearchResults: noop,
            jobSearchHasSearched: false,
            setJobSearchHasSearched: noop,
            jobSearchCurrentPage: 1,
            setJobSearchCurrentPage: noop,
        }
    }
    return ctx
}



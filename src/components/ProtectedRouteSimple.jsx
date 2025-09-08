import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

export const ProtectedRouteSimple = () => {
    const location = useLocation()

    // In development mode, always allow access
    if (import.meta.env.DEV) {
        console.log('ProtectedRouteSimple: Development mode - allowing access')
        return <Outlet />
    }

    // For production, you can add authentication checks here
    // For now, allow access to test the app
    return <Outlet />
}

import { useEffect, useMemo, useState } from 'react'

const DESKTOP_BREAKPOINT = 1024
const TABLET_BREAKPOINT = 768
const POINTER_FINE_QUERY = '(pointer: fine)'
const DESKTOP_QUERY = `(min-width: ${DESKTOP_BREAKPOINT}px)`

const getDeviceSnapshot = () => {
    if (typeof window === 'undefined') {
        return {
            isDesktop: false,
            isTablet: false,
            isMobile: true,
            device: 'mobile'
        }
    }

    const width = window.innerWidth || 0
    const pointerFine = window.matchMedia?.(POINTER_FINE_QUERY)?.matches ?? false
    const desktopMatch = window.matchMedia?.(DESKTOP_QUERY)?.matches ?? false
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent || '' : ''

    const isTabletUA = /ipad|android(?!.*mobile)|tablet/i.test(userAgent)
    const isDesktop = desktopMatch && pointerFine && !isTabletUA
    const isTablet = !isDesktop && (isTabletUA || (width >= TABLET_BREAKPOINT && width < DESKTOP_BREAKPOINT))
    const isMobile = !isDesktop && !isTablet

    const device = isDesktop ? 'desktop' : isTablet ? 'tablet' : 'mobile'

    return {
        isDesktop,
        isTablet,
        isMobile,
        device
    }
}

export const useDeviceType = () => {
    const [deviceState, setDeviceState] = useState(() => getDeviceSnapshot())

    useEffect(() => {
        if (typeof window === 'undefined') return

        const handleChange = () => {
            setDeviceState(getDeviceSnapshot())
        }

        window.addEventListener('resize', handleChange)

        const matchers = [
            window.matchMedia?.(DESKTOP_QUERY),
            window.matchMedia?.(POINTER_FINE_QUERY)
        ].filter(Boolean)

        matchers.forEach(matcher => {
            if (matcher.addEventListener) {
                matcher.addEventListener('change', handleChange)
            } else if (matcher.addListener) {
                matcher.addListener(handleChange)
            }
        })

        return () => {
            window.removeEventListener('resize', handleChange)
            matchers.forEach(matcher => {
                if (matcher.removeEventListener) {
                    matcher.removeEventListener('change', handleChange)
                } else if (matcher.removeListener) {
                    matcher.removeListener(handleChange)
                }
            })
        }
    }, [])

    return useMemo(() => deviceState, [deviceState])
}


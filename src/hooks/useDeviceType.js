import { useEffect, useMemo, useState } from 'react'

const POINTER_FINE_QUERY = '(pointer: fine)'
const HOVER_QUERY = '(hover: hover)'
const ANY_POINTER_FINE_QUERY = '(any-pointer: fine)'

/**
 * Парсит User-Agent для определения типа устройства
 */
const parseUserAgent = (userAgent) => {
    // Desktop операционные системы
    const desktopOS = /win|mac|linux|cros|freebsd|openbsd/i.test(userAgent)
    
    // Мобильные устройства
    const mobileDevice = /mobile|android|iphone|ipod|blackberry|opera mini|iemobile|wpdesktop/i.test(userAgent)
    
    // Планшеты
    const tabletDevice = /ipad|android(?!.*mobile)|tablet|playbook|silk/i.test(userAgent)
    
    // Специфичные устройства
    // iPad может определяться как MacIntel в новых версиях iOS
    const isIPad = /ipad/i.test(userAgent) || 
        (typeof navigator !== 'undefined' && 
         navigator.platform === 'MacIntel' && 
         navigator.maxTouchPoints > 1)
    const isAndroidTablet = /android/i.test(userAgent) && !/mobile/i.test(userAgent)
    
    return {
        desktopOS,
        mobileDevice,
        tabletDevice,
        isIPad,
        isAndroidTablet
    }
}

/**
 * Определяет возможности устройства на основе браузерных API
 */
const getDeviceCapabilities = () => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
        return {
            hasTouch: false,
            maxTouchPoints: 0,
            pointerFine: false,
            anyPointerFine: false,
            hasHover: false,
            platform: ''
        }
    }

    const pointerFine = window.matchMedia?.(POINTER_FINE_QUERY)?.matches ?? false
    const anyPointerFine = window.matchMedia?.(ANY_POINTER_FINE_QUERY)?.matches ?? false
    const hasHover = window.matchMedia?.(HOVER_QUERY)?.matches ?? false
    const maxTouchPoints = navigator.maxTouchPoints || 0
    const hasTouch = maxTouchPoints > 0 || 'ontouchstart' in window || navigator.msMaxTouchPoints > 0
    const platform = navigator.platform || ''

    return {
        hasTouch,
        maxTouchPoints,
        pointerFine,
        anyPointerFine,
        hasHover,
        platform
    }
}

/**
 * Определяет тип устройства на основе комбинации признаков
 * Без использования размера экрана
 */
const getDeviceSnapshot = () => {
    if (typeof window === 'undefined') {
        return {
            isDesktop: false,
            isTablet: false,
            isMobile: true,
            device: 'mobile'
        }
    }

    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent || '' : ''
    const uaInfo = parseUserAgent(userAgent)
    const capabilities = getDeviceCapabilities()

    // Определение Desktop
    // Desktop должен иметь:
    // 1. Desktop OS в User-Agent ИЛИ
    // 2. Fine pointer (мышь) И отсутствие touch ИЛИ минимальный touch (touchscreen ноутбуки)
    // 3. НЕ должен быть планшетом или мобильным устройством
    const isDesktopByOS = uaInfo.desktopOS && !uaInfo.mobileDevice && !uaInfo.tabletDevice
    const isDesktopByCapabilities = capabilities.pointerFine && 
        (!capabilities.hasTouch || (capabilities.maxTouchPoints <= 1 && capabilities.hasHover)) &&
        !uaInfo.tabletDevice &&
        !uaInfo.mobileDevice
    
    // Специальная обработка для iPad в режиме Desktop (iPadOS 13+)
    const isIPadDesktop = uaInfo.isIPad && capabilities.pointerFine && capabilities.hasHover
    
    const isDesktop = (isDesktopByOS || isDesktopByCapabilities) && !isIPadDesktop

    // Определение Tablet
    // Планшет должен иметь:
    // 1. Планшетный User-Agent ИЛИ
    // 2. Touch capability с fine pointer (iPad с Apple Pencil) ИЛИ
    // 3. Большое количество touch points (>1) без desktop OS
    const isTabletByUA = uaInfo.tabletDevice || uaInfo.isIPad || uaInfo.isAndroidTablet
    const isTabletByCapabilities = capabilities.hasTouch && 
        capabilities.maxTouchPoints > 1 && 
        (capabilities.anyPointerFine || capabilities.pointerFine) &&
        !isDesktop
    
    const isTablet = (isTabletByUA || isTabletByCapabilities) && !isDesktop

    // Mobile - все остальное
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

        // Слушаем изменения media queries, связанных с возможностями устройства
        // НЕ слушаем изменения размера экрана (resize)
        const matchers = [
            window.matchMedia?.(POINTER_FINE_QUERY),
            window.matchMedia?.(ANY_POINTER_FINE_QUERY),
            window.matchMedia?.(HOVER_QUERY)
        ].filter(Boolean)

        matchers.forEach(matcher => {
            if (matcher.addEventListener) {
                matcher.addEventListener('change', handleChange)
            } else if (matcher.addListener) {
                matcher.addListener(handleChange)
            }
        })

        // Также слушаем изменения touch capability (может измениться при подключении/отключении устройств)
        // Но это редко меняется, поэтому проверяем только при монтировании
        // и при изменении media queries

        return () => {
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


const STORAGE_KEY = 'next_swipes'

const loadSwipes = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        return raw ? JSON.parse(raw) : {}
    } catch (e) {
        return {}
    }
}

const saveAllSwipes = (swipes) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(swipes))
    } catch (e) {
        // ignore storage errors
    }
}

export const saveSwipe = (startupId, action) => {
    const swipes = loadSwipes()
    swipes[startupId] = { action, timestamp: Date.now() }
    saveAllSwipes(swipes)
}

export const getSwipes = () => loadSwipes()

export const getLikedIds = () => {
    const swipes = loadSwipes()
    return Object.entries(swipes)
        .filter(([, v]) => v.action === 'like')
        .map(([k]) => parseInt(k))
}

export const getPassedIds = () => {
    const swipes = loadSwipes()
    return Object.entries(swipes)
        .filter(([, v]) => v.action === 'pass')
        .map(([k]) => parseInt(k))
}

export const clearSwipes = () => saveAllSwipes({})












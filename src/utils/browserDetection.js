/**
 * Browser detection utilities for handling embedded browsers
 * and OAuth compatibility
 */

/**
 * Detect if the current browser is an embedded/in-app browser
 * that may have OAuth restrictions (e.g., LinkedIn, Facebook, Instagram in-app browsers)
 * @returns {boolean} - True if embedded browser is detected
 */
export const isEmbeddedBrowser = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false
  }

  const ua = navigator.userAgent || navigator.vendor || window.opera || ''
  const uaLower = ua.toLowerCase()

  // Check for common embedded browser indicators
  // These patterns detect in-app browsers that Google OAuth blocks
  const embeddedBrowserPatterns = [
    /FBAN|FBAV|FB_IAB/i,    // Facebook App (multiple variants)
    /LinkedInApp|LinkedIn/i, // LinkedIn App
    /Line\//i,               // Line App
    /Twitter|X-Twitter/i,    // Twitter/X App
    /Instagram/i,            // Instagram App
    /Snapchat/i,             // Snapchat App
    /WhatsApp/i,             // WhatsApp App
    /Messenger/i,            // Facebook Messenger
    /MicroMessenger/i,       // WeChat
    /; wv\)/i,               // Android WebView (specific pattern)
    /\bwv\b/i,               // WebView indicator
  ]

  // Check if any pattern matches
  const isEmbedded = embeddedBrowserPatterns.some(pattern => pattern.test(ua))

  // LinkedIn-specific detection (multiple methods)
  const isLinkedIn = 
    uaLower.includes('linkedin') ||
    uaLower.includes('lclcandroid') || // LinkedIn Android
    uaLower.includes('lclcios') ||     // LinkedIn iOS
    (document.referrer && document.referrer.includes('linkedin.com'))

  // Check for Android WebView specifically
  // Android WebView user agent contains "wv" in version string like "Chrome/xxx.x.x.x Mobile Safari/xxx.xx"
  const isAndroidWebView = 
    (uaLower.includes('android') && uaLower.includes('; wv)')) ||
    (uaLower.includes('android') && !uaLower.includes('chrome') && uaLower.includes('version/'))

  // iOS WebView detection
  // iOS in-app browsers don't have "Safari" in the user agent if they're WebViews
  const isIOSWebView = 
    (uaLower.includes('iphone') || uaLower.includes('ipad') || uaLower.includes('ipod')) &&
    !uaLower.includes('safari') &&
    uaLower.includes('applewebkit')

  // Debug logging
  console.log('Browser detection:', {
    userAgent: ua,
    isEmbedded,
    isLinkedIn,
    isAndroidWebView,
    isIOSWebView
  })

  return isEmbedded || isLinkedIn || isAndroidWebView || isIOSWebView
}

/**
 * Detect if the browser is likely to have Google OAuth restrictions
 * Specifically checks for browsers that Google blocks
 * @returns {boolean} - True if browser may be blocked by Google OAuth
 */
export const isOAuthRestrictedBrowser = () => {
  return isEmbeddedBrowser()
}

/**
 * Get a user-friendly browser name for display
 * @returns {string} - Browser name or 'Unknown'
 */
export const getBrowserName = () => {
  if (typeof navigator === 'undefined') return 'Unknown'

  const ua = navigator.userAgent || ''
  
  if (ua.includes('LinkedInApp')) return 'LinkedIn'
  if (ua.includes('FBAN') || ua.includes('FBAV')) return 'Facebook'
  if (ua.includes('Instagram')) return 'Instagram'
  if (ua.includes('Twitter')) return 'Twitter'
  if (ua.includes('Chrome')) return 'Chrome'
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari'
  if (ua.includes('Firefox')) return 'Firefox'
  if (ua.includes('Edge')) return 'Edge'
  
  return 'Browser'
}

/**
 * Check if we can open URLs in external browser
 * @returns {boolean} - True if external browser opening is possible
 */
export const canOpenExternalBrowser = () => {
  // On mobile devices, we can try to open in external browser
  // On desktop, window.open should work
  return typeof window !== 'undefined' && typeof window.open === 'function'
}

/**
 * Attempt to open URL in external browser
 * Uses multiple methods to try to escape the in-app browser
 * @param {string} url - URL to open
 * @returns {boolean} - True if attempt was made
 */
export const openInExternalBrowser = (url) => {
  if (!canOpenExternalBrowser() || !url) {
    return false
  }

  try {
    const ua = navigator.userAgent.toLowerCase()
    const isAndroid = ua.includes('android')
    const isIOS = /iphone|ipad|ipod/.test(ua)

    // Method 1: Try Android Intent URL to force external browser
    if (isAndroid) {
      try {
        // Convert to Android intent URL that opens in default browser
        const intentUrl = `intent://${url.replace(/^https?:\/\//, '')}#Intent;scheme=https;action=android.intent.action.VIEW;end`
        window.location.href = intentUrl
        return true
      } catch (e) {
        console.log('Android intent failed, trying fallback')
      }
    }

    // Method 2: Try iOS Safari-specific approach
    if (isIOS) {
      // On iOS, setting location directly sometimes opens Safari
      // when called from a user gesture context
      try {
        window.location.href = url
        return true
      } catch (e) {
        console.log('iOS location change failed, trying fallback')
      }
    }

    // Method 3: window.open with _system target (works in some WebViews)
    try {
      const newWindow = window.open(url, '_system')
      if (newWindow) {
        return true
      }
    } catch (e) {
      console.log('_system target failed')
    }

    // Method 4: Standard window.open with _blank
    try {
      const newWindow = window.open(url, '_blank', 'noopener,noreferrer')
      if (newWindow && !newWindow.closed) {
        return true
      }
    } catch (e) {
      console.log('_blank target failed')
    }

    // Method 5: Create and click a link element
    const link = document.createElement('a')
    link.href = url
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    return true
  } catch (error) {
    console.error('Error opening external browser:', error)
    return false
  }
}

/**
 * Get the current page URL that can be copied to clipboard
 * @returns {string} - Current page URL
 */
export const getCurrentPageUrl = () => {
  return window.location.href
}

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
  // Based on common in-app browser user agent strings
  const embeddedBrowserPatterns = [
    /linkedinapp/i,          // LinkedIn App (case-insensitive)
    /FBAN|FBAV|FB_IAB/i,    // Facebook App (multiple variants)
    /fb_iab/i,              // Facebook in-app browser
    /Line/i,                 // Line App
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

  const isMobileDevice = /iphone|ipad|ipod|android/i.test(uaLower)

  // LinkedIn-specific detection (multiple methods)
  // Only treat LinkedIn referrer as embedded on mobile devices.
  const isLinkedIn = 
    uaLower.includes('linkedin') ||
    uaLower.includes('lclcandroid') || // LinkedIn Android
    uaLower.includes('lclcios') ||     // LinkedIn iOS
    (isMobileDevice && document.referrer && document.referrer.includes('linkedin.com'))

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
 * Uses platform-specific schemes (x-safari- for iOS, Intent URLs for Android)
 * to force opening in the system's default browser, bypassing in-app browsers
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

    // Method 1: iOS Safari URL scheme (x-safari-https://...)
    // This is the most reliable way to force Safari on iOS from in-app browsers
    if (isIOS) {
      try {
        // Use x-safari- prefix to force Safari on iOS
        // This works from LinkedIn, Facebook, and other in-app browsers
        const safariUrl = 'x-safari-' + url
        console.log('Attempting to open in Safari via x-safari- scheme:', safariUrl)
        window.location.href = safariUrl
        return true
      } catch (e) {
        console.log('iOS Safari scheme failed, trying fallback:', e)
      }
    }

    // Method 2: Android Chrome Intent URL
    // This forces Chrome to open the URL, bypassing in-app browsers
    if (isAndroid) {
      try {
        // Remove protocol and create intent URL targeting Chrome
        const urlWithoutProtocol = url.replace(/^https?:\/\//, '')
        const intentUrl = `intent://${urlWithoutProtocol}#Intent;scheme=https;package=com.android.chrome;end`
        console.log('Attempting to open in Chrome via Intent URL:', intentUrl)
        window.location.href = intentUrl
        return true
      } catch (e) {
        console.log('Android Chrome Intent failed, trying fallback:', e)
        // Fallback: Try without specifying Chrome package (uses default browser)
        try {
          const urlWithoutProtocol = url.replace(/^https?:\/\//, '')
          const fallbackIntentUrl = `intent://${urlWithoutProtocol}#Intent;scheme=https;action=android.intent.action.VIEW;end`
          window.location.href = fallbackIntentUrl
          return true
        } catch (e2) {
          console.log('Android Intent fallback also failed:', e2)
        }
      }
    }

    // Method 3: window.open with _system target (works in some WebViews)
    try {
      const newWindow = window.open(url, '_system')
      if (newWindow) {
        console.log('Opened via _system target')
        return true
      }
    } catch (e) {
      console.log('_system target failed:', e)
    }

    // Method 4: Standard window.open with _blank
    try {
      const newWindow = window.open(url, '_blank', 'noopener,noreferrer')
      if (newWindow && !newWindow.closed) {
        console.log('Opened via window.open')
        return true
      }
    } catch (e) {
      console.log('_blank target failed:', e)
    }

    // Method 5: Create and click a link element (last resort)
    try {
      const link = document.createElement('a')
      link.href = url
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      console.log('Opened via link click')
      return true
    } catch (e) {
      console.error('Link click method failed:', e)
    }
    
    return false
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

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
  const embeddedBrowserPatterns = [
    /FBAN|FBAV/i,           // Facebook App
    /LinkedInApp/i,         // LinkedIn App
    /Line/i,                // Line App
    /Twitter/i,             // Twitter App
    /Instagram/i,           // Instagram App
    /Snapchat/i,            // Snapchat App
    /WhatsApp/i,            // WhatsApp App
    /wv/i,                  // WebView (Android)
    /WebView/i,             // WebView (iOS)
  ]

  // Check if any pattern matches
  const isEmbedded = embeddedBrowserPatterns.some(pattern => pattern.test(ua))

  // Additional checks for iOS standalone mode
  const isIOSStandalone = 
    window.navigator.standalone === false ||
    (window.matchMedia && 
     !window.matchMedia('(display-mode: standalone)').matches && 
     !window.matchMedia('(display-mode: minimal-ui)').matches)

  // Additional checks for Android WebView
  const isAndroidWebView = 
    uaLower.includes('wv') || 
    (uaLower.includes('android') && !uaLower.includes('chrome'))

  // Check if iOS device
  const isIOSDevice = /iphone|ipad|ipod/i.test(uaLower)

  return isEmbedded || (isIOSStandalone && isIOSDevice) || isAndroidWebView
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
 * @param {string} url - URL to open
 * @returns {boolean} - True if attempt was made
 */
export const openInExternalBrowser = (url) => {
  if (!canOpenExternalBrowser() || !url) {
    return false
  }

  try {
    // Try to open in new window/tab
    // On mobile, this may prompt user to open in external browser
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer')
    
    // Check if popup was blocked
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      // Popup blocked, try alternative method
      // Create a temporary link and click it
      const link = document.createElement('a')
      link.href = url
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
    
    return true
  } catch (error) {
    console.error('Error opening external browser:', error)
    return false
  }
}

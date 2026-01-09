/**
 * Security utility to extract and clean authentication tokens from URL
 * Prevents tokens from being exposed in browser history or URL bar
 */

/**
 * Extract authentication tokens from URL hash or query parameters
 * @returns {Object|null} Object with access_token, refresh_token, etc. or null
 */
export function getAuthTokensFromUrl() {
  const { hash, search } = window.location
  
  const tokens = {}
  
  // Check hash fragments (Supabase OAuth typically uses hash)
  if (hash && hash.length > 1) {
    const hashParams = new URLSearchParams(hash.substring(1))
    const accessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')
    const type = hashParams.get('type')
    
    if (accessToken) tokens.access_token = accessToken
    if (refreshToken) tokens.refresh_token = refreshToken
    if (type) tokens.type = type
  }
  
  // Check query parameters (some OAuth providers use query params)
  if (search && search.length > 1) {
    const searchParams = new URLSearchParams(search.substring(1))
    const accessToken = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')
    const token = searchParams.get('token')
    const type = searchParams.get('type')
    
    if (accessToken) tokens.access_token = accessToken
    if (refreshToken) tokens.refresh_token = refreshToken
    if (token) tokens.token = token
    if (type) tokens.type = type
  }
  
  return Object.keys(tokens).length > 0 ? tokens : null
}

/**
 * Clean authentication tokens from URL hash and query parameters
 * Removes sensitive data from URL without adding to browser history
 */
export function cleanAuthTokensFromUrl() {
  const { hash, search, pathname } = window.location
  
  let hasTokens = false
  let cleanHash = ''
  let cleanSearch = ''
  
  // Clean hash fragments
  if (hash && hash.length > 1) {
    const hashParams = new URLSearchParams(hash.substring(1))
    // Comprehensive list of sensitive OAuth parameters to remove
    const sensitiveParams = [
      'access_token',
      'refresh_token',
      'token',
      'provider_token',           // OAuth provider tokens (Google, GitHub, etc.)
      'provider_refresh_token',  // OAuth provider refresh tokens
      'expires_at',              // Token expiration (can reveal token validity)
      'expires_in',              // Token expiration duration
      'token_type',              // Token type (usually 'bearer')
      'error',                   // OAuth errors
      'error_description',      // OAuth error descriptions
      'error_uri'                // OAuth error URIs
    ]
    
    sensitiveParams.forEach(param => {
      if (hashParams.has(param)) {
        hasTokens = true
        hashParams.delete(param)
      }
    })
    
    // Rebuild hash if there are remaining params (should be none after cleaning)
    const remainingParams = Array.from(hashParams.entries())
    if (remainingParams.length > 0) {
      cleanHash = '#' + new URLSearchParams(remainingParams).toString()
    }
  }
  
  // Clean query parameters
  if (search && search.length > 1) {
    const searchParams = new URLSearchParams(search.substring(1))
    // Comprehensive list of sensitive OAuth parameters to remove
    const sensitiveParams = [
      'access_token',
      'refresh_token',
      'token',
      'provider_token',
      'provider_refresh_token',
      'expires_at',
      'expires_in',
      'token_type',
      'error',
      'error_description',
      'error_uri'
    ]
    
    sensitiveParams.forEach(param => {
      if (searchParams.has(param)) {
        hasTokens = true
        searchParams.delete(param)
      }
    })
    
    // Rebuild search if there are remaining params
    const remainingParams = Array.from(searchParams.entries())
    if (remainingParams.length > 0) {
      cleanSearch = '?' + searchParams.toString()
    }
  }
  
  // Replace URL if tokens were found and removed
  if (hasTokens && window.history && window.history.replaceState) {
    const cleanURL = pathname + cleanSearch + cleanHash
    window.history.replaceState({}, '', cleanURL)
    console.log('Security: Authentication tokens removed from URL')
    return true
  }
  
  return false
}

/**
 * Extract tokens and immediately clean URL
 * This is the main function to use - it does both operations
 * @returns {Object|null} Extracted tokens or null
 */
export function extractAndCleanAuthTokens() {
  const tokens = getAuthTokensFromUrl()
  if (tokens) {
    cleanAuthTokensFromUrl()
  }
  return tokens
}


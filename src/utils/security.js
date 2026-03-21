// Security utility functions for Swipy app

/**
 * Sanitize HTML input to prevent XSS
 * @param {string} input - Raw input string
 * @returns {string} - Sanitized string
 */
export const sanitizeHtml = (input) => {
  if (typeof input !== 'string') return ''
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Sanitize user input for safe storage
 * @param {string} input - Raw input string
 * @param {string} type - Input type (name, description, etc.)
 * @returns {string} - Sanitized string
 */
export const sanitizeInput = (input, type = 'text') => {
  if (typeof input !== 'string') return ''
  
  let sanitized = input.trim()
  
  switch (type) {
    case 'name':
      // Remove HTML tags and limit length
      sanitized = sanitized.replace(/<[^>]*>/g, '').substring(0, 100)
      break
    case 'email':
      // Basic email sanitization
      sanitized = sanitized.toLowerCase().trim()
      break
    case 'description':
      // Allow some formatting but remove dangerous HTML
      sanitized = sanitized
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
        .replace(/<object[^>]*>.*?<\/object>/gi, '')
        .replace(/<embed[^>]*>.*?<\/embed>/gi, '')
        .substring(0, 1000)
      break
    default:
      // Default sanitization
      sanitized = sanitized.replace(/[<>]/g, '').substring(0, 500)
  }
  
  return sanitized
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - Is valid email
 */
export const validateEmail = (email) => {
  if (typeof email !== 'string') return false
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim()) && email.length <= 254
}

/**
 * Use in <a href> when the value may omit scheme (e.g. "example.com" → "https://example.com").
 * Without this, the browser treats the URL as relative (e.g. localhost:3000/example.com).
 */
export const normalizeExternalUrl = (raw) => {
  if (typeof raw !== 'string') return null
  const s = raw.trim()
  if (!s) return null
  if (/^mailto:/i.test(s) || /^tel:/i.test(s)) return s
  if (/^https?:\/\//i.test(s)) return s
  if (s.startsWith('//')) return `https:${s}`
  return `https://${s.replace(/^\/+/, '')}`
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} - Validation result with details
 */
export const validatePassword = (password) => {
  if (typeof password !== 'string') {
    return { isValid: false, errors: ['Password must be a string'] }
  }
  
  const errors = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  
  if (password.length > 128) {
    errors.push('Password must be less than 128 characters')
  }
  
  // Optional: Add more password strength requirements
  // if (!/[A-Z]/.test(password)) {
  //   errors.push('Password must contain at least one uppercase letter')
  // }
  
  // if (!/[a-z]/.test(password)) {
  //   errors.push('Password must contain at least one lowercase letter')
  // }
  
  // if (!/\d/.test(password)) {
  //   errors.push('Password must contain at least one number')
  // }
  
  return {
    isValid: errors.length === 0,
    errors,
    strength: errors.length === 0 ? 'valid' : 'invalid'
  }
}

/**
 * Rate limiting helper for client-side protection
 */
export class RateLimiter {
  constructor(maxAttempts = 5, windowMs = 60000) {
    this.maxAttempts = maxAttempts
    this.windowMs = windowMs
    this.attempts = new Map()
  }
  
  isAllowed(key) {
    const now = Date.now()
    const userAttempts = this.attempts.get(key) || []
    
    // Remove old attempts outside the window
    const recentAttempts = userAttempts.filter(timestamp => now - timestamp < this.windowMs)
    
    if (recentAttempts.length >= this.maxAttempts) {
      return false
    }
    
    // Add current attempt
    recentAttempts.push(now)
    this.attempts.set(key, recentAttempts)
    
    return true
  }
  
  reset(key) {
    this.attempts.delete(key)
  }
}

/**
 * Generate secure random string
 * @param {number} length - Length of string to generate
 * @returns {string} - Random string
 */
export const generateSecureRandom = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    // Use crypto API if available
    const array = new Uint8Array(length)
    crypto.getRandomValues(array)
    
    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length]
    }
  } else {
    // Fallback to Math.random (less secure)
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
  }
  
  return result
}

/**
 * Safe JSON parsing with error handling
 * @param {string} jsonString - JSON string to parse
 * @param {any} defaultValue - Default value if parsing fails
 * @returns {any} - Parsed object or default value
 */
export const safeJsonParse = (jsonString, defaultValue = null) => {
  try {
    if (typeof jsonString !== 'string') return defaultValue
    return JSON.parse(jsonString)
  } catch (error) {
    console.warn('JSON parse error:', error)
    return defaultValue
  }
}

/**
 * Safe localStorage operations with error handling
 */
export const safeStorage = {
  getItem: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key)
      return item !== null ? safeJsonParse(item, defaultValue) : defaultValue
    } catch (error) {
      console.error('Error reading from localStorage:', error)
      return defaultValue
    }
  },
  
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.error('Error writing to localStorage:', error)
      return false
    }
  },
  
  removeItem: (key) => {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error('Error removing from localStorage:', error)
      return false
    }
  },
  
  clear: (keysToRemove = []) => {
    try {
      if (keysToRemove.length === 0) {
        localStorage.clear()
      } else {
        keysToRemove.forEach(key => {
          if (localStorage.getItem(key)) {
            localStorage.removeItem(key)
          }
        })
      }
      return true
    } catch (error) {
      console.error('Error clearing localStorage:', error)
      return false
    }
  }
}

/**
 * Check if current environment is secure
 * @returns {boolean} - Is secure environment
 */
export const isSecureEnvironment = () => {
  // Check if running on HTTPS
  if (typeof window !== 'undefined') {
    return window.location.protocol === 'https:' || 
           window.location.hostname === 'localhost' ||
           window.location.hostname === '127.0.0.1'
  }
  return false
}

/**
 * Security headers for fetch requests
 * @returns {object} - Security headers
 */
export const getSecurityHeaders = () => ({
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
})

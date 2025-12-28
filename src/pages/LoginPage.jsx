import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { authService } from '../services/authService.js'
import { profileService } from '../services/profileService.js'
import { useAuth } from '../providers/AuthProvider.jsx'
import { useDeviceType } from '../hooks'
import AuthInput from '../components/AuthInput.jsx'
import AuthButton from '../components/AuthButton.jsx'

const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { session } = useAuth()
  const { isDesktop } = useDeviceType()
  const [isLogin, setIsLogin] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    agreeToTerms: false
  })

  // Input validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email.trim())
  }

  const validatePassword = (password) => {
    return password.length >= 8 && password.length <= 128
  }

  const validateName = (name) => {
    const sanitizedName = name.trim().replace(/[<>]/g, '')
    return sanitizedName.length >= 2 && sanitizedName.length <= 100
  }

  const handleInputChange = (field, value) => {
    // Sanitize input based on field type
    let sanitizedValue = value
    if (field === 'name') {
      sanitizedValue = value.replace(/[<>]/g, '')
    } else if (field === 'email') {
      sanitizedValue = value.toLowerCase().trim()
    }

    setFormData(prev => ({
      ...prev,
      [field]: sanitizedValue
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      // Input validation
      if (!validateEmail(formData.email)) {
        alert('Please enter a valid email address')
        return
      }

      if (!validatePassword(formData.password)) {
        alert('Password must be between 8 and 128 characters')
        return
      }

      if (!isLogin) {
        if (!validateName(formData.name)) {
          alert('Name must be between 2 and 100 characters')
          return
        }

        if (formData.password !== formData.confirmPassword) {
          alert('Passwords do not match!')
          return
        }

        if (!formData.agreeToTerms) {
          alert('Please agree to the terms and conditions')
          return
        }
      }

      if (isLogin) {
        try {
          const data = await authService.signIn(formData.email, formData.password)

          // Check if user has completed onboarding
          if (data?.user?.id) {
            try {
              const profile = await profileService.getProfile(data.user.id)

              // If onboarding not completed, redirect to onboarding
              if (!profile || !profile.onboarding_completed) {
                navigate('/onboarding', { replace: true })
                return
              }
            } catch (profileError) {
              console.error('Error checking profile:', profileError)
              // If profile check fails, assume onboarding needed
              navigate('/onboarding', { replace: true })
              return
            }
          }

          // User has completed onboarding, redirect to intended destination or home
          const redirectTo = location.state?.from?.pathname || '/home'
          navigate(redirectTo)
        } catch (signInError) {
          alert(signInError.message || 'Sign in failed. Please check your credentials and try again.')
          return
        }
      } else {
        const result = await authService.signUp(formData.email, formData.password, { full_name: formData.name })
        if (!result.success) {
          alert(result.error?.message || 'Registration failed. Please try again.')
          return
        }
        // Show email confirmation modal
        setShowEmailModal(true)
      }
    } catch (error) {
      console.error('Authentication error:', error)
      if (isLogin) {
        alert('Sign in failed. Please check your credentials and try again.')
      } else {
        alert('Registration failed. Please try again or contact support if the problem persists.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const signInWithProvider = async (provider) => {
    if (isSubmitting) return

    try {
      const { error } = await authService.signInWithOAuth(provider, {
        redirectTo: `${window.location.origin}/auth/callback`
      })
      if (error) alert(error.message)
    } catch (error) {
      console.error('OAuth error:', error)
      alert('OAuth authentication failed. Please try again.')
    }
  }

  const handleTermsClick = (e) => {
    e.preventDefault()
    // TODO: Navigate to actual terms page
    alert('Terms of Service - Coming Soon')
  }

  const handlePrivacyClick = (e) => {
    e.preventDefault()
    // TODO: Navigate to actual privacy policy page
    alert('Privacy Policy - Coming Soon')
  }

  const handleForgotPassword = (e) => {
    e.preventDefault()
    navigate('/reset-password')
  }

  const toggleMode = () => {
    setIsLogin(!isLogin)
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
      agreeToTerms: false
    })
  }

  const handleEmailModalOK = () => {
    setShowEmailModal(false)
    navigate('/onboarding')
  }

  // Desktop-optimized content
  const desktopContent = (
    <>
      <div className="w-full max-w-md mx-auto">
        {/* Logo and Welcome */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black mb-5 text-white" style={{ paddingBottom: '8px', lineHeight: '1.2' }}>
            Swipy
          </h1>
          <p className="text-text-secondary text-lg">
            {isLogin
              ? 'Welcome back! Sign in to continue your startup journey.'
              : 'Join the community of innovators and entrepreneurs.'
            }
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <AuthInput
              label="Full Name"
              type="text"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required={!isLogin}
              maxLength={100}
              pattern="[^<>]*"
              title="Name cannot contain < or > characters"
            />
          )}

          <AuthInput
            label="Email Address"
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            required
            maxLength={254}
          />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-text-primary font-medium text-base">
                Password
              </label>
              {isLogin && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-blue-400 text-sm hover:underline focus:outline-none transition-colors"
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <input
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className="w-full h-14 px-4 py-3 bg-glass-bg border border-glass-border rounded-lg text-text-primary text-base placeholder-text-secondary focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all duration-200 hover:border-white/20"
              required
              minLength={8}
              maxLength={128}
            />
          </div>

          {!isLogin && (
            <AuthInput
              label="Confirm Password"
              type="password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              required={!isLogin}
              minLength={8}
              maxLength={128}
            />
          )}

          {!isLogin && (
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
                className="mt-1 w-5 h-5 text-blue-400 bg-glass-bg border border-glass-border rounded focus:ring-blue-400 focus:ring-2 transition-all"
                required={!isLogin}
              />
              <label htmlFor="agreeToTerms" className="text-sm text-text-secondary">
                I agree to the{' '}
                <button
                  type="button"
                  onClick={handleTermsClick}
                  className="text-blue-400 hover:underline focus:outline-none transition-colors"
                >
                  Terms of Service
                </button>
                {' '}and{' '}
                <button
                  type="button"
                  onClick={handlePrivacyClick}
                  className="text-blue-400 hover:underline focus:outline-none transition-colors"
                >
                  Privacy Policy
                </button>
              </label>
            </div>
          )}

          <AuthButton
            type="submit"
            disabled={isSubmitting}
            icon={`fas ${isLogin ? 'fa-sign-in-alt' : 'fa-user-plus'}`}
          >
            {isSubmitting ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </AuthButton>
        </form>

        {/* Divider */}
        <div className="my-5">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 text-text-secondary">Or continue with</span>
            </div>
          </div>
        </div>

        {/* Social Login */}
        <div className="space-y-3">
          <AuthButton
            type="button"
            variant="secondary"
            disabled={isSubmitting}
            onClick={() => signInWithProvider('google')}
            icon="fab fa-google"
          >
            Continue with Google
          </AuthButton>
          <AuthButton
            type="button"
            variant="secondary"
            disabled
            icon="fab fa-linkedin"
          >
            Continue with LinkedIn (coming soon)
          </AuthButton>
        </div>

        {/* Toggle Mode */}
        <div className="text-center mt-5">
          <p className="text-text-secondary text-sm">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={toggleMode}
              className="text-blue-400 hover:underline font-medium focus:outline-none transition-colors"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>

      {/* Email Confirmation Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-bg-secondary rounded-3xl max-w-sm w-full shadow-2xl border border-glass-border overflow-hidden animate-slide-up">
            <div className="p-8 text-center">
              {/* Success Icon */}
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-3xl">
                <i className="fas fa-envelope"></i>
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-text-primary mb-3">
                Check Your Email
              </h3>

              {/* Description */}
              <p className="text-text-secondary leading-relaxed mb-6">
                We've sent you a confirmation email. Please check your inbox and click the verification link to complete your account setup.
              </p>

              {/* OK Button */}
              <button
                onClick={handleEmailModalOK}
                className="w-full py-3 px-6 bg-gradient-to-r from-blue-300 to-blue-700 hover:from-blue-400 hover:to-blue-800 text-white rounded-2xl font-semibold hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )

  // Mobile content (original design)
  const mobileContent = (
    <>
      <div className="flex-1 overflow-y-auto p-6 md:p-10 lg:p-12">
        {/* Logo and Welcome */}
        <div className="text-center mb-10 md:mb-12">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-6 text-white">
            Swipy
          </h1>
          <p className="text-text-secondary text-base md:text-lg">
            {isLogin
              ? 'Welcome back! Sign in to continue your startup journey.'
              : 'Join the community of innovators and entrepreneurs.'
            }
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div>
              <label className="block text-text-primary font-medium mb-2">Full Name</label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full p-4 bg-glass-bg border border-glass-border rounded-2xl text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-primary transition-colors duration-200"
                required={!isLogin}
                maxLength={100}
                pattern="[^<>]*"
                title="Name cannot contain < or > characters"
              />
            </div>
          )}

          <div>
            <label className="block text-text-primary font-medium mb-2">Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full p-4 bg-glass-bg border border-glass-border rounded-2xl text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-primary transition-colors duration-200"
              required
              maxLength={254}
            />
          </div>

          <div>
            <label className="block text-text-primary font-medium mb-2">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className="w-full p-4 bg-glass-bg border border-glass-border rounded-2xl text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-primary transition-colors duration-200"
              required
              minLength={8}
              maxLength={128}
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-text-primary font-medium mb-2">Confirm Password</label>
              <input
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className="w-full p-4 bg-glass-bg border border-glass-border rounded-2xl text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-primary transition-colors duration-200"
                required={!isLogin}
                minLength={8}
                maxLength={128}
              />
            </div>
          )}

          {!isLogin && (
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
                className="mt-1 w-5 h-5 text-blue-400 bg-glass-bg border-glass-border rounded focus:ring-blue-400 focus:ring-2"
                required={!isLogin}
              />
              <label htmlFor="agreeToTerms" className="text-sm text-text-secondary">
                I agree to the{' '}
                <button
                  type="button"
                  onClick={handleTermsClick}
                  className="text-blue-400 hover:underline focus:outline-none"
                >
                  Terms of Service
                </button>
                {' '}and{' '}
                <button
                  type="button"
                  onClick={handlePrivacyClick}
                  className="text-blue-400 hover:underline focus:outline-none"
                >
                  Privacy Policy
                </button>
              </label>
            </div>
          )}

          {isLogin && (
            <div className="text-right">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-blue-400 text-sm hover:underline focus:outline-none"
              >
                Forgot Password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-gradient-to-r from-blue-300 to-blue-700 hover:from-blue-400 hover:to-blue-800 text-white w-full font-semibold rounded-2xl py-4 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
          >
            <i className={`fas ${isLogin ? 'fa-sign-in-alt' : 'fa-user-plus'} mr-2 text-lg`}></i>
            {isSubmitting ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        {/* Divider */}
        <div className="my-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-glass-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-bg-primary text-text-secondary">Or continue with</span>
            </div>
          </div>
        </div>

        {/* Social Login */}
        <div className="space-y-4">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => signInWithProvider('google')}
            className="w-full p-4 bg-glass-bg border border-glass-border rounded-2xl text-text-primary hover:bg-glass-border transition-colors duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="fab fa-google text-xl"></i>
            Continue with Google
          </button>
          <button type="button" disabled className="w-full p-4 bg-glass-bg border border-glass-border rounded-2xl text-text-secondary cursor-not-allowed flex items-center justify-center gap-3">
            <i className="fab fa-linkedin text-xl"></i>
            Continue with LinkedIn (coming soon)
          </button>
        </div>

        {/* Toggle Mode */}
        <div className="text-center mt-8">
          <p className="text-text-secondary">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={toggleMode}
              className="text-blue-400 hover:underline font-medium focus:outline-none"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>

        {/* Bottom spacing for laptops */}
        <div className="h-20"></div>
      </div>
    </>
  )

  // Email Confirmation Modal (shared)
  const emailModal = (
    showEmailModal && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-bg-secondary rounded-3xl max-w-sm w-full shadow-2xl border border-glass-border overflow-hidden animate-slide-up">
          <div className="p-8 text-center">
            {/* Success Icon */}
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-3xl">
              <i className="fas fa-envelope"></i>
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-text-primary mb-3">
              Check Your Email
            </h3>

            {/* Description */}
            <p className="text-text-secondary leading-relaxed mb-6">
              We've sent you a confirmation email. Please check your inbox and click the verification link to complete your account setup.
            </p>

            {/* OK Button */}
            <button
              onClick={handleEmailModalOK}
              className="w-full py-3 px-6 bg-gradient-to-r from-blue-300 to-blue-700 hover:from-blue-400 hover:to-blue-800 text-white rounded-2xl font-semibold hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    )
  )

  // Телефон — оставляем исходный полноэкранный мобильный экран
  if (!isDesktop) {
    return (
      <div className="screen active">
        {mobileContent}
        {emailModal}
      </div>
    )
  }

  // ПК / ноутбук — улучшенная desktop-версия с центральной карточкой
  return (
    <div className="desktop-auth-wrapper">
      <div className="desktop-auth-card">
        {desktopContent}
        {emailModal}
      </div>
    </div>
  )
}

export default LoginPage

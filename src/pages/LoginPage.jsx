import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const LoginPage = () => {
  const navigate = useNavigate()
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    agreeToTerms: false
  })

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (isLogin) {
      // Логика входа
      navigate('/home')
    } else {
      // Логика регистрации
      if (formData.password !== formData.confirmPassword) {
        alert('Passwords do not match!')
        return
      }
      if (!formData.agreeToTerms) {
        alert('Please agree to the terms and conditions')
        return
      }
      navigate('/onboarding')
    }
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

  return (
    <div className="screen active">
      <div className="flex-1 overflow-y-auto p-6">
        {/* Logo and Welcome */}
        <div className="text-center mb-12">
          <h1 className="text-7xl font-black mb-6 animate-super-gradient bg-gradient-to-r from-white via-blue-200 via-blue-400 to-blue-600 bg-clip-text text-transparent">
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
              />
              <label htmlFor="agreeToTerms" className="text-sm text-text-secondary">
                I agree to the{' '}
                <a href="#" className="text-blue-400 hover:underline">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-blue-400 hover:underline">Privacy Policy</a>
              </label>
            </div>
          )}

          {isLogin && (
            <div className="text-right">
              <a href="#" className="text-blue-400 text-sm hover:underline">
                Forgot Password?
              </a>
            </div>
          )}

          <button
            type="submit"
            className="bg-gradient-to-r from-blue-300 to-blue-700 hover:from-blue-400 hover:to-blue-800 text-white w-full font-semibold rounded-2xl py-4 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <i className={`fas ${isLogin ? 'fa-sign-in-alt' : 'fa-user-plus'} mr-2`}></i>
            {isLogin ? 'Sign In' : 'Create Account'}
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
          <button className="w-full p-4 bg-glass-bg border border-glass-border rounded-2xl text-text-primary hover:bg-glass-border transition-colors duration-200 flex items-center justify-center gap-3">
            <i className="fab fa-google text-xl"></i>
            Continue with Google
          </button>
          <button className="w-full p-4 bg-glass-bg border border-glass-border rounded-2xl text-text-primary hover:bg-glass-border transition-colors duration-200 flex items-center justify-center gap-3">
            <i className="fab fa-linkedin text-xl"></i>
            Continue with LinkedIn
          </button>
        </div>

        {/* Toggle Mode */}
        <div className="text-center mt-8">
          <p className="text-text-secondary">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={toggleMode}
              className="text-blue-400 hover:underline font-medium"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>

        {/* Guest Access */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/home')}
            className="text-text-secondary hover:text-text-primary transition-colors duration-200"
          >
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  )
}

export default LoginPage

import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStartups, useSwipes, useAuth } from '../hooks'
import { chatService } from '../services'
import OnboardingTutorial from '../components/OnboardingTutorial'

const HomePage = () => {
  const { user } = useAuth()
  const { startups, loading: startupsLoading, error: startupsError } = useStartups()
  const { likeStartup, passStartup, loading: swipesLoading } = useSwipes(user?.id)
  
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [debugMode, setDebugMode] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 })
  const [showTutorial, setShowTutorial] = useState(false)

  const cardRef = useRef(null)
  const lastTapRef = useRef(0)
  const navigate = useNavigate()



  // Function to extract main color from gradient
  const getGradientColor = (gradientClass) => {
    const gradientMap = {
      'bg-gradient-primary': '#1565c0',
      'bg-gradient-secondary': '#f093fb',
      'bg-gradient-tertiary': '#4facfe',
      'bg-gradient-quaternary': '#43e97b',
      'bg-gradient-quinary': '#fa709a',
      'bg-gradient-senary': '#a8edea',
      'bg-gradient-septenary': '#ff9a9e',
      'bg-gradient-octonary': '#ffecd2',
      'bg-gradient-nonary': '#ff9a9e',
      'bg-gradient-denary': '#a18cd1'
    }
    return gradientMap[gradientClass] || '#2196f3'
  }

  // Simple test render for debugging
  console.log('HomePage component rendering...')

  // Show loading state
  if (startupsLoading) {
    return (
      <div className="screen active">
        <div className="header">
          <button className="header-btn" onClick={() => navigate('/filters')}>
            <i className="fas fa-filter"></i>
          </button>
          <h1 className="header-title text-3xl font-bold animate-super-gradient">
            Swipy
          </h1>
          <button className="header-btn" onClick={() => navigate('/saved')}>
            <i className="fas fa-bookmark"></i>
          </button>
        </div>

        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-300 to-blue-700 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-pulse">
              <i className="fas fa-spinner fa-spin text-3xl text-white"></i>
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-4">Loading Startups</h2>
            <p className="text-text-secondary">Please wait while we fetch the latest opportunities...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show error state
  if (startupsError) {
    return (
      <div className="screen active">
        <div className="header">
          <button className="header-btn" onClick={() => navigate('/filters')}>
            <i className="fas fa-filter"></i>
          </button>
          <h1 className="header-title text-3xl font-bold animate-super-gradient">
            Swipy
          </h1>
          <button className="header-btn" onClick={() => navigate('/saved')}>
            <i className="fas fa-bookmark"></i>
          </button>
        </div>

        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-red-300 to-red-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-exclamation-triangle text-3xl text-white"></i>
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-4">Error Loading Startups</h2>
            <p className="text-text-secondary mb-6">{startupsError}</p>
            <button
              className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-8 py-3 rounded-2xl font-semibold hover:from-blue-600 hover:to-blue-800 transition-all duration-200"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }



  // Check if tutorial should be shown
  useEffect(() => {
    const tutorialCompleted = localStorage.getItem('tutorial-completed')
    if (!tutorialCompleted) {
      // Small delay for smoothness
      const timer = setTimeout(() => setShowTutorial(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  // Function to show startup details
  const handleShowDetails = (startup) => {
    if (cardRef.current) {
      cardRef.current.style.transition = 'transform 0.4s ease, opacity 0.4s ease'
      cardRef.current.style.transform = 'translateY(100vh) scale(0.8)'
      cardRef.current.style.opacity = '0'
    }
    setTimeout(() => {
      navigate(`/startup/${startup.id}`)
    }, 300)
  }

  // Function to complete tutorial
  const handleTutorialComplete = () => {
    setShowTutorial(false)
  }

  // Function to handle double tap
  const handleCardClick = (e) => {
    e.stopPropagation()
    e.preventDefault()

    // If card is in swipe process, ignore click
    if (isDragging) return

    const currentTime = Date.now()
    const timeSinceLastTap = currentTime - lastTapRef.current

    if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
      // Double tap - flip card
      setIsFlipped(prev => !prev)
      lastTapRef.current = 0
    } else {
      // First tap
      lastTapRef.current = currentTime
    }
  }

  // Function to reset card styles
  const resetCardStyles = () => {
    if (cardRef.current) {
      cardRef.current.style.transition = ''
      cardRef.current.style.transform = 'translateY(0px)'
      cardRef.current.style.opacity = ''
      cardRef.current.style.boxShadow = ''
    }
  }

  // Function for swipe right (like)
  const handleLike = async () => {
    if (!cardRef.current || isAnimating) return
    setIsAnimating(true)

    cardRef.current.style.transition = 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    cardRef.current.style.transform = 'translateX(1000px) rotate(30deg) scale(0.8)'
    cardRef.current.style.opacity = '0'
    cardRef.current.style.boxShadow = ''

    setTimeout(async () => {
      try {
        await likeStartup(currentStartup.id)
        console.log('Startup liked successfully')
      } catch (error) {
        console.error('Error liking startup:', error)
        // You can show a toast notification here
      }

      setCurrentCardIndex(prev => prev + 1)
      setIsAnimating(false)
      resetCardStyles()
    }, 400)
  }

  // Function for swipe left (pass)
  const handlePass = async () => {
    if (!cardRef.current || isAnimating) return
    setIsAnimating(true)

    cardRef.current.style.transition = 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    cardRef.current.style.transform = 'translateX(-1000px) rotate(-30deg) scale(0.8)'
    cardRef.current.style.opacity = '0'
    cardRef.current.style.boxShadow = ''

    setTimeout(async () => {
      try {
        await passStartup(currentStartup.id)
        console.log('Startup passed successfully')
      } catch (error) {
        console.error('Error passing startup:', error)
        // You can show a toast notification here
      }

      setCurrentCardIndex(prev => prev + 1)
      setIsAnimating(false)
      resetCardStyles()
    }, 400)
  }

  // Function to flip card back when swiping on reverse side
  const handleSwipeWithFlip = (direction) => {
    if (!cardRef.current || isAnimating) return
    setIsAnimating(true)

    // If card is flipped, first flip it back
    if (isFlipped) {
      setIsFlipped(false)
      setTimeout(() => {
        // After flip, perform swipe
        if (direction === 'like') {
          handleLike()
        } else {
          handlePass()
        }
      }, 250) // Half of flip animation time
    } else {
      // If card is not flipped, perform swipe immediately
      if (direction === 'like') {
        handleLike()
      } else {
        handlePass()
      }
    }
  }

  // Reset card index when reaching the end
  useEffect(() => {
    if (currentCardIndex >= startups.length) {
      setCurrentCardIndex(0)
    }
  }, [currentCardIndex])

  // Reset flip state when changing card
  useEffect(() => {
    setIsFlipped(false)
    resetCardStyles()
  }, [currentCardIndex])

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      lastTapRef.current = 0
    }
  }, [])



  // If reached end of startups list
  if (currentCardIndex >= startups.length) {
    return (
      <div className="screen active">
        <div className="header">
          <button className="header-btn" onClick={() => navigate('/filters')}>
            <i className="fas fa-filter"></i>
          </button>
          <h1 className="header-title bg-gradient-to-r from-white to-blue-400 bg-clip-text text-transparent text-3xl font-bold">Swipy</h1>
          <button className="header-btn" onClick={() => navigate('/saved')}>
            <i className="fas fa-bookmark"></i>
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-300 to-blue-700 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-float animate-glow">
              <i className="fas fa-heart text-3xl text-white"></i>
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-4">No More Startups</h2>
            <p className="text-text-secondary mb-6">You've seen all available startups. Check back later for new opportunities!</p>
            <button
              className="btn-primary hover:scale-105 transition-transform duration-200"
              onClick={() => setCurrentCardIndex(0)}
            >
              <i className="fas fa-refresh"></i>
              Refresh
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Get current startup
  const currentStartup = startups[currentCardIndex]

  // Show empty state if no startups
  if (startups.length === 0) {
    return (
      <div className="screen active">
        <div className="header">
          <button className="header-btn" onClick={() => navigate('/filters')}>
            <i className="fas fa-filter"></i>
          </button>
          <h1 className="header-title text-3xl font-bold animate-super-gradient">
            Swipy
          </h1>
          <button className="header-btn" onClick={() => navigate('/saved')}>
            <i className="fas fa-bookmark"></i>
          </button>
        </div>

        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-300 to-blue-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-rocket text-3xl text-white"></i>
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-4">No Startups Available</h2>
            <p className="text-text-secondary mb-8">Startups will appear here once they are created by founders.</p>
            <button
              className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-8 py-3 rounded-2xl font-semibold hover:from-blue-600 hover:to-blue-800 transition-all duration-200"
              onClick={() => navigate('/add')}
            >
              Create First Startup
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="screen active">
      <div className="header">
        <button className="header-btn" onClick={() => navigate('/filters')}>
          <i className="fas fa-filter"></i>
        </button>
        <h1 className="header-title text-3xl font-bold animate-super-gradient">
          Swipy
        </h1>
        <button className="header-btn" onClick={() => navigate('/saved')}>
          <i className="fas fa-bookmark"></i>
        </button>
      </div>

      <div className="swipe-container">
        <div className="card-stack">
          {/* Back card (next) */}
          {currentCardIndex + 1 < startups.length && (
            <div
              className="startup-card-container"
              style={{
                opacity: 0.15,
                scale: '0.92',
                zIndex: 1,
                transition: 'all 0.4s ease-out'
              }}
            >
              <div className="startup-card">
                <div className="card-image">
                  <div className={`${startups[currentCardIndex + 1].gradient} w-full h-full relative overflow-hidden`}>
                    {startups[currentCardIndex + 1].image ? (
                      <img
                        src={startups[currentCardIndex + 1].image}
                        alt={startups[currentCardIndex + 1].name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="company-logo">
                        <span className="text-white font-bold text-xl">{startups[currentCardIndex + 1].logo}</span>
                      </div>
                    )}
                    <div className="gradient-overlay opacity-70"></div>
                  </div>
                </div>
                <div className="card-content">
                  <div className="card-header">
                    <h3 className="card-title">{startups[currentCardIndex + 1].name}</h3>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main card */}
          <div
            ref={cardRef}
            className={`startup-card-container ${isDragging ? 'isDragging' : ''}`}
            style={{
              cursor: isDragging ? 'grabbing' : 'grab',
              transition: isDragging ? 'none' : 'all 0.3s ease',
              zIndex: 10,
              perspective: '1000px',
              position: 'relative'
            }}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId)
              setStartPos({ x: e.clientX, y: e.clientY })
              setCurrentPos({ x: e.clientX, y: e.clientY })
              setIsDragging(false)
              if (cardRef.current) {
                cardRef.current.style.transition = 'none'
              }
            }}
            onPointerMove={(e) => {
              const deltaX = e.clientX - startPos.x
              const deltaY = e.clientY - startPos.y
              const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

              // Set isDragging only if movement is greater than 10px
              if (!isDragging && distance > 10) {
                setIsDragging(true)
              }

              if (isDragging && cardRef.current) {
                // Smooth card movement with rotation
                const rotation = deltaX * 0.15
                const scale = Math.max(0.8, 1 - Math.abs(deltaX) / 1000)

                // Apply styles to card container
                const cardContainer = cardRef.current
                cardContainer.style.transform = `translateX(${deltaX}px) translateY(${deltaY}px) rotate(${rotation}deg) scale(${scale})`

                // Color effects
                if (deltaX > 50) {
                  cardContainer.style.boxShadow = `0 0 30px rgba(34, 197, 94, ${Math.min(0.6, Math.abs(deltaX) / 200)})`
                  cardContainer.style.borderRadius = '24px'
                } else if (deltaX < -50) {
                  cardContainer.style.boxShadow = `0 0 30px rgba(239, 68, 68, ${Math.min(0.6, Math.abs(deltaX) / 200)})`
                  cardContainer.style.borderRadius = '24px'
                } else if (deltaY > 50) {
                  cardContainer.style.boxShadow = `0 0 30px rgba(59, 130, 246, ${Math.min(0.6, Math.abs(deltaY) / 200)})`
                  cardContainer.style.borderRadius = '24px'
                } else {
                  cardContainer.style.boxShadow = ''
                  cardContainer.style.borderRadius = '24px'
                }

                setCurrentPos({ x: e.clientX, y: e.clientY })
              }
            }}
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()

              // If card is in swipe process, ignore click
              if (isDragging) return

              const currentTime = Date.now()
              const timeSinceLastTap = currentTime - lastTapRef.current

              if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
                // Double tap - flip card
                setIsFlipped(prev => !prev)
                lastTapRef.current = 0
              } else {
                // First tap
                lastTapRef.current = currentTime
              }
            }}
            onPointerUp={(e) => {
              const deltaX = currentPos.x - startPos.x
              const deltaY = currentPos.y - startPos.y

              if (isDragging && cardRef.current) {
                setIsDragging(false)
                const cardContainer = cardRef.current

                if (Math.abs(deltaX) > 80) {
                  // Horizontal swipe - like/pass with animation
                  if (deltaX > 0) {
                    // Swipe right - like
                    handleSwipeWithFlip('like')
                  } else {
                    // Swipe left - pass
                    handleSwipeWithFlip('pass')
                  }
                } else if (Math.abs(deltaY) > 100) {
                  // Vertical swipe down - go to details with animation
                  if (deltaY > 0) {
                    // Swipe down - go to details
                    cardContainer.style.transition = 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
                    cardContainer.style.transform = 'translateY(100vh) rotate(10deg) scale(0.8)'
                    cardContainer.style.opacity = '0'
                    cardContainer.style.boxShadow = '0 0 30px rgba(59, 130, 246, 0.5)'
                    cardContainer.style.borderRadius = '24px'
                    setTimeout(() => {
                      navigate(`/startup/${currentStartup.id}`)
                    }, 400)
                  } else {
                    // Swipe up - return to place
                    cardContainer.style.transition = 'all 0.3s ease'
                    cardContainer.style.transform = 'translateY(0px) rotate(0deg)'
                    cardContainer.style.boxShadow = 'none'
                    cardContainer.style.borderRadius = '24px'
                  }
                } else {
                  // Return card to place
                  cardContainer.style.transition = 'all 0.3s ease'
                  cardContainer.style.transform = 'translateY(0px) rotate(0deg)'
                  cardContainer.style.boxShadow = 'none'
                  cardContainer.style.borderRadius = '24px'
                }
              }
            }}
          >

            {/* Invisible Double-tap Button */}
            <button
              className="absolute inset-0 w-full h-full bg-transparent border-none cursor-pointer z-10"
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()

                // If card is in swipe process, ignore click
                if (isDragging) return

                const currentTime = Date.now()
                const timeSinceLastTap = currentTime - lastTapRef.current

                if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
                  // Double tap - flip card
                  setIsFlipped(prev => !prev)
                  lastTapRef.current = 0
                } else {
                  // First tap
                  lastTapRef.current = currentTime
                }
              }}
              style={{ pointerEvents: 'auto' }}
            />

            {/* Flip Container */}
            <div
              className={`flip-container ${isFlipped ? 'flipped' : ''}`}
            >
              {/* Front Side */}
              <div
                className="flip-front startup-card"
              >
                <div className="card-image">
                  <div className={`${currentStartup.gradient} w-full h-full relative overflow-hidden`}>
                    {currentStartup.image ? (
                      <img
                        src={currentStartup.image}
                        alt={currentStartup.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="company-logo">
                        <span className="text-white font-bold text-xl">{currentStartup.logo}</span>
                      </div>
                    )}
                    <div className="gradient-overlay"></div>
                    <div className="card-badges">
                      <span
                        className="badge funding"
                        style={{
                          backgroundColor: getGradientColor(currentStartup.gradient),
                          color: 'white'
                        }}
                      >
                        {currentStartup.funding}
                      </span>
                      <span
                        className="badge stage"
                        style={{
                          backgroundColor: getGradientColor(currentStartup.gradient),
                          color: 'white'
                        }}
                      >
                        {currentStartup.stage}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="card-content">
                  <div className="card-header">
                    <h3 className="card-title">{currentStartup.name}</h3>
                    <div className="card-meta">
                      <span className="card-category">{currentStartup.category}</span>
                      <span className="card-location">{currentStartup.location || 'Remote'}</span>
                      <span className="card-team-size flex items-center gap-1">
                        <i className="fas fa-users text-xs"></i>
                        {currentStartup.teamSize || '5-10'}
                      </span>
                    </div>
                  </div>

                  <p className="card-description">{currentStartup.description}</p>
                </div>

                {/* Swipe Hints */}
                <div className="absolute top-4 left-4 opacity-40 hover:opacity-80 transition-opacity duration-300">
                  <div className="bg-black/50 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <i className="fas fa-arrow-left text-xs text-red-400"></i>
                    Pass
                  </div>
                </div>

                <div className="absolute top-4 right-4 opacity-40 hover:opacity-80 transition-opacity duration-300">
                  <div className="bg-black/50 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <i className="fas fa-arrow-right text-xs text-green-400"></i>
                    Like
                  </div>
                </div>

                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 opacity-60 hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-black/50 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
                    <i className="fas fa-sync-alt text-xs"></i>
                    Double tap for details
                  </div>
                </div>


              </div>

              {/* Back Side */}
              <div
                className="flip-back startup-card bg-bg-primary border border-glass-border"
              >
                {/* Header */}
                <div className="p-4 border-b border-glass-border">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{
                        backgroundColor: `${getGradientColor(currentStartup.gradient)}20`,
                      }}
                    >
                      <span
                        className="font-bold text-lg"
                        style={{ color: getGradientColor(currentStartup.gradient) }}
                      >
                        {currentStartup.logo}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-text-primary mb-1">{currentStartup.name}</h3>
                      <div className="flex items-center gap-3 text-sm text-text-secondary">
                        <span className="flex items-center gap-1">
                          <i
                            className="fas fa-tag"
                            style={{ color: getGradientColor(currentStartup.gradient) }}
                          ></i>
                          {currentStartup.category}
                        </span>
                        <span className="flex items-center gap-1">
                          <i
                            className="fas fa-chart-line"
                            style={{ color: getGradientColor(currentStartup.gradient) }}
                          ></i>
                          {currentStartup.stage}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                  {/* About */}
                  <div className="bg-black/30 border border-white/20 rounded-xl p-4">
                    <h4 className="text-text-primary font-semibold mb-3 flex items-center gap-2">
                      <i
                        className="fas fa-info-circle"
                        style={{ color: getGradientColor(currentStartup.gradient) }}
                      ></i>
                      About
                    </h4>
                    <p className="text-text-secondary text-sm leading-relaxed">{currentStartup.description}</p>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-black/30 border border-white/20 rounded-xl p-4 text-center">
                      <div
                        className="font-bold text-lg"
                        style={{ color: getGradientColor(currentStartup.gradient) }}
                      >
                        {currentStartup.funding}
                      </div>
                      <div className="text-text-secondary text-xs mt-1">Funding</div>
                    </div>
                    <div className="bg-black/30 border border-white/20 rounded-xl p-4 text-center">
                      <div
                        className="font-bold text-lg flex items-center justify-center gap-2"
                        style={{ color: getGradientColor(currentStartup.gradient) }}
                      >
                        <i className="fas fa-users text-sm"></i>
                        {currentStartup.teamSize || '5-10'}
                      </div>
                      <div className="text-text-secondary text-xs mt-1">Team Size</div>
                    </div>
                  </div>

                  {/* Investment Required */}
                  <div className="bg-black/30 border border-white/20 rounded-xl p-4">
                    <h4 className="text-text-primary font-semibold mb-3 flex items-center gap-2">
                      <i
                        className="fas fa-dollar-sign"
                        style={{ color: getGradientColor(currentStartup.gradient) }}
                      ></i>
                      Investment Required
                    </h4>
                    <div className="flex items-center justify-center">
                      <span
                        className="px-4 py-2 rounded-lg text-lg font-bold"
                        style={{
                          backgroundColor: `${getGradientColor(currentStartup.gradient)}20`,
                          color: getGradientColor(currentStartup.gradient),
                          border: `1px solid ${getGradientColor(currentStartup.gradient)}30`
                        }}
                      >
                        ${currentStartup.investmentRequired || 'TBD'}
                      </span>
                    </div>
                  </div>

                  {/* Location & Contact */}
                  {(currentStartup.location || currentStartup.website) && (
                    <div className="bg-black/30 border border-white/20 rounded-xl p-4">
                      <h4 className="text-text-primary font-semibold mb-3 flex items-center gap-2">
                        <i
                          className="fas fa-map-marker-alt"
                          style={{ color: getGradientColor(currentStartup.gradient) }}
                        ></i>
                        Details
                      </h4>
                      <div className="space-y-2">
                        {currentStartup.location && (
                          <div className="flex items-center gap-3 text-sm text-text-secondary">
                            <i
                              className="fas fa-map-marker-alt w-4"
                              style={{ color: getGradientColor(currentStartup.gradient) }}
                            ></i>
                            <span>{currentStartup.location}</span>
                          </div>
                        )}
                        {currentStartup.website && (
                          <div className="flex items-center gap-3 text-sm text-text-secondary">
                            <i
                              className="fas fa-globe w-4"
                              style={{ color: getGradientColor(currentStartup.gradient) }}
                            ></i>
                            <span className="truncate">{currentStartup.website}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-glass-border">
                  <button
                    className="w-full text-text-secondary hover:text-blue-700 transition-colors duration-200 text-sm flex items-center justify-center gap-2"
                    onClick={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                      setIsFlipped(false)
                    }}
                  >
                    <i className="fas fa-undo"></i>
                    Tap to flip back
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Debug info */}
          {debugMode && (
            <div className="absolute bottom-20 left-0 right-0 bg-black/70 text-white p-4 z-50 text-xs">
              <div>Card Index: {currentCardIndex}</div>
              <div>Animating: {isAnimating ? 'true' : 'false'}</div>
              <div>Flipped: {isFlipped ? 'true' : 'false'}</div>
              <div>Is Dragging: {isDragging ? 'true' : 'false'}</div>
              <div className="mt-2">
                <button
                  className="bg-green-500 text-white px-2 py-1 rounded mr-2"
                  onClick={() => handleSwipeWithFlip('like')}
                  disabled={isAnimating}
                >
                  Test Like
                </button>
                <button
                  className="bg-red-500 text-white px-2 py-1 rounded mr-2"
                  onClick={() => handleSwipeWithFlip('pass')}
                  disabled={isAnimating}
                >
                  Test Pass
                </button>
                <button
                  className="bg-blue-500 text-white px-2 py-1 rounded"
                  onClick={() => setIsFlipped(prev => !prev)}
                >
                  Test Flip
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tutorial Modal */}
      {showTutorial && (
        <OnboardingTutorial onComplete={handleTutorialComplete} />
      )}
    </div>
  )
}

export default HomePage
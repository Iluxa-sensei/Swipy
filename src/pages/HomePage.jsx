import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { startups as defaultStartups } from '../data/startups'
import { saveSwipe } from '../data/swipes'
import { getOrCreateChatForStartup } from '../data/chats'

const HomePage = () => {
  const [startups, setStartups] = useState(defaultStartups)
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [debugMode, setDebugMode] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 })

  const cardRef = useRef(null)
  const lastTapRef = useRef(0)
  const navigate = useNavigate()

  // Простой тестовый рендер для отладки
  console.log('HomePage component rendering...')

  // Загружаем созданные стартапы из профиля
  useEffect(() => {
    const loadCreatedStartups = () => {
      try {
        const profileData = localStorage.getItem('profile_data')
        if (profileData) {
          const profile = JSON.parse(profileData)
          if (profile.portfolio && profile.portfolio.length > 0) {
            // Преобразуем стартапы из профиля в формат для главной страницы
            const createdStartups = profile.portfolio.map(startup => ({
              id: startup.id,
              name: startup.name,
              logo: startup.name ? startup.name.substring(0, 2).toUpperCase() : 'ST',
              category: startup.category,
              stage: startup.stage,
              description: startup.description,
              roles: startup.positions || ['Team Member'],
              gradient: startup.gradient || 'bg-gradient-primary',
              funding: startup.funding,
              teamSize: startup.teamSize,
              location: startup.location,
              image: startup.image || null
            }))

            // Объединяем созданные стартапы с дефолтными
            setStartups([...createdStartups, ...defaultStartups])
          }
        }
      } catch (error) {
        console.error('Error loading created startups:', error)
      }
    }

    loadCreatedStartups()
  }, [])

  // Функция для показа деталей стартапа
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

  // Функция для обработки двойного тапа
  const handleCardClick = (e) => {
    e.stopPropagation()
    e.preventDefault()

    // Если карта в процессе свайпа, игнорируем клик
    if (isDragging) return

    const currentTime = Date.now()
    const timeSinceLastTap = currentTime - lastTapRef.current

    if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
      // Двойной тап - переворачиваем карту
      setIsFlipped(prev => !prev)
      lastTapRef.current = 0
    } else {
      // Первый тап
      lastTapRef.current = currentTime
    }
  }

  // Функция для сброса стилей карты
  const resetCardStyles = () => {
    if (cardRef.current) {
      cardRef.current.style.transition = ''
      cardRef.current.style.transform = 'translateY(0px)'
      cardRef.current.style.opacity = ''
      cardRef.current.style.boxShadow = ''
    }
  }

  // Функция для свайпа вправо (лайк)
  const handleLike = () => {
    if (!cardRef.current || isAnimating) return
    setIsAnimating(true)

    cardRef.current.style.transition = 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    cardRef.current.style.transform = 'translateX(1000px) rotate(30deg) scale(0.8)'
    cardRef.current.style.opacity = '0'
    cardRef.current.style.boxShadow = ''

    setTimeout(() => {
      try {
        saveSwipe(currentStartup.id, 'like')
      } catch (e) { }

      setCurrentCardIndex(prev => prev + 1)
      setIsAnimating(false)
      resetCardStyles()
    }, 400)
  }

  // Функция для свайпа влево (пропуск)
  const handlePass = () => {
    if (!cardRef.current || isAnimating) return
    setIsAnimating(true)

    cardRef.current.style.transition = 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    cardRef.current.style.transform = 'translateX(-1000px) rotate(-30deg) scale(0.8)'
    cardRef.current.style.opacity = '0'
    cardRef.current.style.boxShadow = ''

    setTimeout(() => {
      try {
        saveSwipe(currentStartup.id, 'pass')
      } catch (e) { }

      setCurrentCardIndex(prev => prev + 1)
      setIsAnimating(false)
      resetCardStyles()
    }, 400)
  }

  // Функция для переворота карты обратно при свайпе на обратной стороне
  const handleSwipeWithFlip = (direction) => {
    if (!cardRef.current || isAnimating) return
    setIsAnimating(true)

    // Если карта перевернута, сначала переворачиваем обратно
    if (isFlipped) {
      setIsFlipped(false)
      setTimeout(() => {
        // После переворота выполняем свайп
        if (direction === 'like') {
          handleLike()
        } else {
          handlePass()
        }
      }, 250) // Половина времени анимации переворота
    } else {
      // Если карта не перевернута, сразу выполняем свайп
      if (direction === 'like') {
        handleLike()
      } else {
        handlePass()
      }
    }
  }

  // Сброс индекса карточки при достижении конца
  useEffect(() => {
    if (currentCardIndex >= startups.length) {
      setCurrentCardIndex(0)
    }
  }, [currentCardIndex])

  // Сброс flip состояния при смене карточки
  useEffect(() => {
    setIsFlipped(false)
    resetCardStyles()
  }, [currentCardIndex])

  // Очистка таймера при размонтировании
  useEffect(() => {
    return () => {
      lastTapRef.current = 0
    }
  }, [])



  // Если достигнут конец списка стартапов
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
            <div className="w-24 h-24 bg-gradient-primary rounded-3xl flex items-center justify-center mx-auto mb-6 animate-float animate-glow">
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

  // Получаем текущий стартап
  const currentStartup = startups[currentCardIndex]

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
          {/* Задняя карточка (следующая) */}
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

          {/* Основная карточка */}
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

              // Устанавливаем isDragging только если движение больше 10px
              if (!isDragging && distance > 10) {
                setIsDragging(true)
              }

              if (isDragging && cardRef.current) {
                // Плавное движение карты с поворотом
                const rotation = deltaX * 0.15
                const scale = Math.max(0.8, 1 - Math.abs(deltaX) / 1000)

                // Применяем стили к контейнеру карточки
                const cardContainer = cardRef.current
                cardContainer.style.transform = `translateX(${deltaX}px) translateY(${deltaY}px) rotate(${rotation}deg) scale(${scale})`

                // Цветовые эффекты
                if (deltaX > 50) {
                  cardContainer.style.boxShadow = `0 0 30px rgba(34, 197, 94, ${Math.min(0.6, Math.abs(deltaX) / 200)})`
                } else if (deltaX < -50) {
                  cardContainer.style.boxShadow = `0 0 30px rgba(239, 68, 68, ${Math.min(0.6, Math.abs(deltaX) / 200)})`
                } else if (deltaY > 50) {
                  cardContainer.style.boxShadow = `0 0 30px rgba(59, 130, 246, ${Math.min(0.6, Math.abs(deltaY) / 200)})`
                } else {
                  cardContainer.style.boxShadow = ''
                }

                setCurrentPos({ x: e.clientX, y: e.clientY })
              }
            }}
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()

              // Если карта в процессе свайпа, игнорируем клик
              if (isDragging) return

              const currentTime = Date.now()
              const timeSinceLastTap = currentTime - lastTapRef.current

              if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
                // Двойной тап - переворачиваем карту
                setIsFlipped(prev => !prev)
                lastTapRef.current = 0
              } else {
                // Первый тап
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
                  // Горизонтальный свайп - лайк/пропуск с анимацией
                  if (deltaX > 0) {
                    // Свайп вправо - лайк
                    handleSwipeWithFlip('like')
                  } else {
                    // Свайп влево - пропуск
                    handleSwipeWithFlip('pass')
                  }
                } else if (Math.abs(deltaY) > 100) {
                  // Вертикальный свайп вниз - переход к деталям с анимацией
                  if (deltaY > 0) {
                    // Свайп вниз - переход к деталям
                    cardContainer.style.transition = 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
                    cardContainer.style.transform = 'translateY(100vh) rotate(10deg) scale(0.8)'
                    cardContainer.style.opacity = '0'
                    cardContainer.style.boxShadow = '0 0 30px rgba(59, 130, 246, 0.5)'
                    setTimeout(() => {
                      navigate(`/startup/${currentStartup.id}`)
                    }, 400)
                  } else {
                    // Свайп вверх - возврат на место
                    cardContainer.style.transition = 'all 0.3s ease'
                    cardContainer.style.transform = 'translateY(0px) rotate(0deg)'
                    cardContainer.style.boxShadow = 'none'
                  }
                } else {
                  // Возвращаем карточку на место
                  cardContainer.style.transition = 'all 0.3s ease'
                  cardContainer.style.transform = 'translateY(0px) rotate(0deg)'
                  cardContainer.style.boxShadow = 'none'
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

                // Если карта в процессе свайпа, игнорируем клик
                if (isDragging) return

                const currentTime = Date.now()
                const timeSinceLastTap = currentTime - lastTapRef.current

                if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
                  // Двойной тап - переворачиваем карту
                  setIsFlipped(prev => !prev)
                  lastTapRef.current = 0
                } else {
                  // Первый тап
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
                      <span className="badge funding">{currentStartup.funding}</span>
                      <span className="badge stage">{currentStartup.stage}</span>
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
                    <div className="w-12 h-12 bg-accent-primary/20 rounded-xl flex items-center justify-center">
                      <span className="text-accent-primary font-bold text-lg">{currentStartup.logo}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-text-primary mb-1">{currentStartup.name}</h3>
                      <div className="flex items-center gap-3 text-sm text-text-secondary">
                        <span className="flex items-center gap-1">
                          <i className="fas fa-tag text-accent-primary"></i>
                          {currentStartup.category}
                        </span>
                        <span className="flex items-center gap-1">
                          <i className="fas fa-chart-line text-accent-primary"></i>
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
                      <i className="fas fa-info-circle text-accent-primary"></i>
                      About
                    </h4>
                    <p className="text-text-secondary text-sm leading-relaxed">{currentStartup.description}</p>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-black/30 border border-white/20 rounded-xl p-4 text-center">
                      <div className="text-accent-primary font-bold text-lg">{currentStartup.funding}</div>
                      <div className="text-text-secondary text-xs mt-1">Funding</div>
                    </div>
                    <div className="bg-black/30 border border-white/20 rounded-xl p-4 text-center">
                      <div className="text-accent-primary font-bold text-lg flex items-center justify-center gap-2">
                        <i className="fas fa-users text-sm"></i>
                        {currentStartup.teamSize || '5-10'}
                      </div>
                      <div className="text-text-secondary text-xs mt-1">Team Size</div>
                    </div>
                  </div>

                  {/* Open Positions */}
                  <div className="bg-black/30 border border-white/20 rounded-xl p-4">
                    <h4 className="text-text-primary font-semibold mb-3 flex items-center gap-2">
                      <i className="fas fa-users text-accent-primary"></i>
                      Open Positions
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {currentStartup.roles.map((role, index) => (
                        <span
                          key={index}
                          className="px-3 py-1.5 bg-accent-primary/20 text-accent-primary rounded-lg text-xs font-medium border border-accent-primary/30"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Location & Contact */}
                  {(currentStartup.location || currentStartup.website) && (
                    <div className="bg-black/30 border border-white/20 rounded-xl p-4">
                      <h4 className="text-text-primary font-semibold mb-3 flex items-center gap-2">
                        <i className="fas fa-map-marker-alt text-accent-primary"></i>
                        Details
                      </h4>
                      <div className="space-y-2">
                        {currentStartup.location && (
                          <div className="flex items-center gap-3 text-sm text-text-secondary">
                            <i className="fas fa-map-marker-alt text-accent-primary w-4"></i>
                            <span>{currentStartup.location}</span>
                          </div>
                        )}
                        {currentStartup.website && (
                          <div className="flex items-center gap-3 text-sm text-text-secondary">
                            <i className="fas fa-globe text-accent-primary w-4"></i>
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
                    className="w-full text-text-secondary hover:text-accent-primary transition-colors duration-200 text-sm flex items-center justify-center gap-2"
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
    </div>
  )
}

export default HomePage
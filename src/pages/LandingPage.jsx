import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const LandingPage = () => {
    const navigate = useNavigate()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [openFaqIndex, setOpenFaqIndex] = useState(null)
    const [footerVisible, setFooterVisible] = useState(false)
    const [faqTransform, setFaqTransform] = useState(0)
    const [isAnimating, setIsAnimating] = useState(false)
    const [displayWord, setDisplayWord] = useState(0)
    const words = ['Startups', 'Investors', 'Founders']

    // Calculate next word dynamically
    const nextWord = (displayWord + 1) % words.length
    const logoRef = useRef(null)
    const heroRef = useRef(null)
    const faqRef = useRef(null)
    const footerRef = useRef(null)
    const ctaRef = useRef(null)
    const scrollHandlerRef = useRef(null)
    const isLogoAnimating = useRef(false)

    // Animated word rotation
    useEffect(() => {
        const interval = setInterval(() => {
            const next = (displayWord + 1) % words.length

            // Start animation
            setIsAnimating(true)

            // After animation completes, update displayWord
            setTimeout(() => {
                setDisplayWord(next)
                // End animation
                setIsAnimating(false)
            }, 700) // Wait for animation to complete
        }, 700) // 0.7 seconds

        return () => clearInterval(interval)
    }, [displayWord, words.length])

    // Enable scrolling for landing page
    useEffect(() => {
        // Add class to body to enable scrolling via CSS
        document.body.classList.add('landing-page-active')

        // Enable scrolling on body
        document.body.style.overflow = 'auto'
        document.body.style.position = 'relative'
        document.body.style.height = 'auto'
        document.body.style.minHeight = '100vh'

        // Enable scrolling on root
        const rootElement = document.getElementById('root')
        if (rootElement) {
            rootElement.style.overflow = 'auto'
            rootElement.style.position = 'relative'
            rootElement.style.height = 'auto'
            rootElement.style.minHeight = '100vh'
        }

        document.documentElement.style.scrollBehavior = 'smooth'
        document.documentElement.style.overflow = 'auto'
        document.documentElement.style.height = 'auto'

        // Add scroll animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1'
                    entry.target.style.transform = 'translateY(0)'
                }
            })
        }, observerOptions)

        const elements = document.querySelectorAll('.fade-in-up')
        elements.forEach(el => observer.observe(el))

        // FAQ slides up effect - FAQ section is sticky above footer, slides up to reveal footer (like playntest.com)
        let rafId = null
        scrollHandlerRef.current = () => {
            if (rafId) return
            rafId = requestAnimationFrame(() => {
                rafId = null
                if (faqRef.current && ctaRef.current) {
                    const ctaRect = ctaRef.current.getBoundingClientRect()
                    const windowHeight = window.innerHeight
                    const faqHeight = faqRef.current.getBoundingClientRect().height

                    // Start sliding only when CTA section is significantly in viewport
                    // Wait until CTA top is closer to middle of viewport before starting
                    const ctaTop = ctaRect.top
                    const triggerPoint = windowHeight * 0.6 // Start when CTA is 60% down viewport

                    let progress = 0
                    // Start sliding only when CTA top passes the trigger point
                    if (ctaTop < triggerPoint) {
                        // Calculate progress based on how far CTA has scrolled past trigger
                        const scrollPast = triggerPoint - ctaTop
                        const slideDistance = faqHeight + windowHeight * 0.6
                        progress = Math.min(1, Math.max(0, scrollPast / slideDistance))
                    }

                    // Apply transform: FAQ slides up (negative Y) to reveal footer below
                    const maxSlide = -(faqHeight + 100)
                    setFaqTransform(progress * maxSlide)

                    // Show footer when FAQ starts sliding
                    setFooterVisible(progress > 0.15)
                }
            })
        }

        window.addEventListener('scroll', scrollHandlerRef.current)
        // Check on mount in case sections are already scrolled
        scrollHandlerRef.current()

        return () => {
            // Remove class and restore styles
            document.body.classList.remove('landing-page-active')
            document.body.style.overflow = ''
            document.body.style.position = ''
            document.body.style.height = ''
            document.documentElement.style.overflow = ''
            document.documentElement.style.position = ''
            document.documentElement.style.height = ''
            document.documentElement.style.scrollBehavior = ''
            if (rootElement) {
                rootElement.style.overflow = ''
                rootElement.style.position = ''
                rootElement.style.height = ''
            }
            observer.disconnect()
            if (scrollHandlerRef.current) {
                window.removeEventListener('scroll', scrollHandlerRef.current)
            }
        }
    }, [])

    const handleAnchorClick = (e, hash) => {
        e.preventDefault()
        const element = document.querySelector(hash)
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
    }

    const handleLogoClick = () => {
        // Предотвращаем повторные клики во время анимации
        if (isLogoAnimating.current || !logoRef.current) {
            return
        }

        isLogoAnimating.current = true

        // Сбрасываем предыдущие стили
        logoRef.current.style.transition = 'transform 0.6s ease-in-out'
        logoRef.current.style.transform = 'rotate(0deg)'

        // Запускаем анимацию поворота
        requestAnimationFrame(() => {
            if (logoRef.current) {
                logoRef.current.style.transform = 'rotate(360deg)'
            }
        })

        // После завершения анимации сбрасываем состояние
        setTimeout(() => {
            if (logoRef.current) {
                logoRef.current.style.transform = 'rotate(0deg)'
                logoRef.current.style.transition = ''
            }
            isLogoAnimating.current = false
        }, 600)

        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
                
                /* Override global styles for landing page to enable scrolling */
                body.landing-page-active,
                body.landing-page-active #root {
                    overflow: auto !important;
                    position: relative !important;
                    height: auto !important;
                    min-height: 100vh !important;
                    width: 100% !important;
                }
                
                * {
                    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                }

                .landing-logo {
                    image-rendering: -webkit-optimize-contrast;
                    image-rendering: crisp-edges;
                }

                .fade-in-up {
                    opacity: 0;
                    transform: translateY(30px);
                    transition: opacity 0.6s ease-out, transform 0.6s ease-out;
                }

                .device-mockup {
                    position: relative;
                    filter: drop-shadow(0 20px 60px rgba(0, 0, 0, 0.3));
                    transition: transform 0.3s ease;
                }

                .device-mockup:hover {
                    transform: translateY(-10px);
                }

                .laptop-mockup-features,
                .phone-mockup-features {
                    transition: transform 0.3s ease, filter 0.3s ease;
                }

                .laptop-mockup-features:hover {
                    transform: translateY(-5px);
                    filter: drop-shadow(0 30px 80px rgba(72, 128, 255, 0.25));
                }

                .phone-mockup-features {
                    overflow: visible !important;
                }

                .phone-mockup-image {
                    transition: filter 0.3s ease;
                    filter: drop-shadow(0 20px 40px rgba(72, 128, 255, 0.2));
                }

                .phone-mockup-features:hover {
                    transform: translateY(-5px);
                }

                .phone-mockup-features:hover .phone-mockup-image {
                    filter: drop-shadow(0 25px 50px rgba(72, 128, 255, 0.3)) !important;
                }

                .laptop-mockup {
                    width: 100%;
                    max-width: 900px;
                    margin: 0 auto;
                }

                .phone-mockup {
                    width: 100%;
                    max-width: 400px;
                    margin: 0 auto;
                }

                .gradient-text {
                    background: #4880ff;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .glass-effect {
                    background: rgba(255, 255, 255, 0.05);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-20px); }
                }

                .float-animation {
                    animation: float 6s ease-in-out infinite;
                }

                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }

                .pulse-animation {
                    animation: pulse 3s ease-in-out infinite;
                }

                /* Tablet styles */
                @media (max-width: 1024px) and (min-width: 769px) {
                    .features-mockup-container {
                        grid-template-columns: 1fr !important;
                        gap: 50px !important;
                    }

                    .laptop-mockup-features {
                        max-width: 700px !important;
                    }

                    .phone-mockup-features {
                        max-width: 350px !important;
                        padding-bottom: 40px !important;
                    }
                }

                @media (max-width: 768px) {
                    /* Navbar mobile optimization */
                    .landing-navbar {
                        padding: 8px 16px !important;
                        gap: 12px !important;
                        top: 10px !important;
                    }

                    .landing-navbar .landing-logo {
                        height: 36px !important;
                        width: 36px !important;
                    }

                    .landing-navbar > div {
                        gap: 8px !important;
                    }

                    .landing-navbar > div > button {
                        padding: 6px 16px !important;
                        font-size: 0.85rem !important;
                        white-space: nowrap !important;
                    }

                    .desktop-hero.modern {
                        margin-top: 64px !important;
                    }
                    
                    .device-mockup-container {
                        flex-direction: column !important;
                        gap: 40px !important;
                    }
                    
                    .laptop-mockup {
                        max-width: 100% !important;
                        flex: 1 1 100% !important;
                    }
                    
                    .phone-mockup {
                        max-width: 350px !important;
                        flex: 0 1 350px !important;
                    }

                    /* Features section mobile layout - сохраняем двухколоночную структуру */
                    .features-mockup-container {
                        grid-template-columns: 1fr 1fr !important;
                        gap: 16px !important;
                        align-items: start !important;
                    }

                    /* Мокапы слева - уменьшенные размеры для мобильных */
                    .features-mockup-container > div:first-child {
                        order: 1;
                        gap: 20px !important;
                    }

                    .laptop-mockup-features {
                        max-width: 100% !important;
                        width: 100% !important;
                    }

                    .laptop-mockup-features img {
                        width: 100% !important;
                        height: auto !important;
                    }

                    .phone-mockup-features {
                        max-width: 220px !important;
                        width: 100% !important;
                        margin: 0 auto !important;
                        padding-bottom: 50px !important;
                        margin-top: 10px !important;
                    }

                    .phone-mockup-features img {
                        width: 100% !important;
                        height: auto !important;
                        max-width: 220px !important;
                    }

                    /* Карточки функций справа - уменьшенные размеры */
                    .features-mockup-container > div:last-child {
                        order: 2;
                        gap: 10px !important;
                    }

                    /* Feature cards mobile styling */
                    .features-mockup-container > div:last-child > div {
                        padding: 12px 14px !important;
                        gap: 10px !important;
                        border-radius: 12px !important;
                    }

                    .features-mockup-container > div:last-child > div > div:first-child {
                        width: 32px !important;
                        height: 32px !important;
                        min-width: 32px !important;
                        font-size: 14px !important;
                        border-radius: 8px !important;
                    }

                    .features-mockup-container > div:last-child > div h3 {
                        font-size: 0.8125rem !important;
                        margin-bottom: 4px !important;
                        line-height: 1.3 !important;
                    }

                    .features-mockup-container > div:last-child > div p {
                        font-size: 0.6875rem !important;
                        line-height: 1.4 !important;
                    }

                    /* Features section padding on mobile */
                    #features {
                        padding: 50px 16px !important;
                    }

                    #features > div:first-child {
                        margin-bottom: 30px !important;
                    }
                }

                /* Очень маленькие экраны - возвращаемся к одной колонке */
                @media (max-width: 480px) {
                    /* Navbar для очень маленьких экранов */
                    .landing-navbar {
                        padding: 6px 12px !important;
                        gap: 8px !important;
                        max-width: 95% !important;
                    }

                    .landing-navbar .landing-logo {
                        height: 32px !important;
                        width: 32px !important;
                    }

                    .landing-navbar > div {
                        gap: 6px !important;
                    }

                    /* Features section для очень маленьких экранов - сохраняем две колонки */
                    .features-mockup-container {
                        grid-template-columns: 1fr 1fr !important;
                        gap: 12px !important;
                    }

                    .features-mockup-container > div:first-child {
                        order: 1;
                        gap: 15px !important;
                    }

                    .laptop-mockup-features {
                        max-width: 100% !important;
                    }

                    .laptop-mockup-features img {
                        width: 100% !important;
                        height: auto !important;
                    }

                    .phone-mockup-features {
                        max-width: 180px !important;
                        width: 100% !important;
                        margin: 0 auto !important;
                        padding-bottom: 40px !important;
                        margin-top: 5px !important;
                    }

                    .phone-mockup-features img {
                        width: 100% !important;
                        height: auto !important;
                        max-width: 180px !important;
                    }

                    .features-mockup-container > div:last-child {
                        order: 2;
                        gap: 8px !important;
                    }

                    .features-mockup-container > div:last-child > div {
                        padding: 10px 12px !important;
                        gap: 8px !important;
                        border-radius: 10px !important;
                    }

                    .features-mockup-container > div:last-child > div > div:first-child {
                        width: 28px !important;
                        height: 28px !important;
                        min-width: 28px !important;
                        font-size: 12px !important;
                        border-radius: 6px !important;
                    }

                    .features-mockup-container > div:last-child > div h3 {
                        font-size: 0.75rem !important;
                        margin-bottom: 3px !important;
                        line-height: 1.2 !important;
                    }

                    .features-mockup-container > div:last-child > div p {
                        font-size: 0.625rem !important;
                        line-height: 1.3 !important;
                    }

                    .landing-navbar > div > button {
                        padding: 6px 14px !important;
                        font-size: 0.8rem !important;
                    }
                }
            `}</style>
            <div className="min-h-screen" style={{ background: '#0a0a0a', color: '#FFFFFF', overflowY: 'auto', position: 'relative', width: '100%', height: 'auto' }}>
                {/* Blue crescent moon gradient at top */}
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '60vh',
                        zIndex: 0,
                        background: 'radial-gradient(ellipse 120% 80% at 50% 0%, rgba(72, 128, 255, 0.2) 0%, rgba(72, 128, 255, 0.12) 20%, rgba(72, 128, 255, 0.08) 35%, rgba(72, 128, 255, 0.04) 50%, rgba(72, 128, 255, 0.02) 65%, transparent 80%)',
                        pointerEvents: 'none'
                    }}
                />
                {/* Minimal Navbar - Centered with rounded corners like playntest.com */}
                <div className="landing-navbar" style={{
                    position: 'fixed',
                    top: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 50,
                    width: 'fit-content',
                    maxWidth: '90%',
                    background: 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '10px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '24px',
                    overflow: 'visible'
                }}>
                    {/* Logo */}
                    <button
                        onClick={handleLogoClick}
                        className="flex items-center cursor-pointer"
                        style={{ background: 'transparent', border: 'none', padding: 0 }}
                    >
                        <img
                            ref={logoRef}
                            src="/Vector.png"
                            alt="Swipy"
                            className="landing-logo"
                            style={{
                                height: '48px',
                                width: '48px',
                                borderRadius: '12px',
                                objectFit: 'contain',
                                transition: 'transform 0.6s ease-in-out',
                                display: 'block',
                            }}
                        />
                    </button>

                    {/* Auth Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button
                            onClick={() => navigate('/login')}
                            style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                color: 'rgba(255, 255, 255, 0.9)',
                                padding: '8px 20px',
                                borderRadius: '20px',
                                fontSize: '0.9rem',
                                fontWeight: '500',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                            }}
                        >
                            Log In
                        </button>
                        <button
                            onClick={() => navigate('/login')}
                            style={{
                                background: '#4880ff',
                                color: '#ffffff',
                                padding: '8px 20px',
                                borderRadius: '20px',
                                fontSize: '0.9rem',
                                fontWeight: '600',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'filter 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.filter = 'brightness(1.15)'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.filter = 'brightness(1)'
                            }}
                        >
                            Sign Up
                        </button>
                    </div>
                </div>

                {/* Hero Section with Device Mockups */}
                <section
                    ref={heroRef}
                    style={{
                        minHeight: '100vh',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: '100px 24px 5px',
                        maxWidth: '1000x',
                        margin: '0 auto',
                        textAlign: 'center',
                        position: 'relative'
                    }}
                >
                    <div style={{ marginBottom: '60px', maxWidth: '900px' }}>
                        <h1 style={{
                            fontSize: 'clamp(2.5rem, 6vw, 5rem)',
                            fontWeight: '700',
                            letterSpacing: '-0.03em',
                            lineHeight: '1.1',
                            marginBottom: '24px',
                            color: '#ffffff'
                        }}>
                            Tinder for{' '}
                            <span
                                style={{
                                    color: '#4880ff',
                                    display: 'inline-block',
                                    width: 'clamp(200px, 30vw, 350px)',
                                    textAlign: 'left',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    verticalAlign: 'top',
                                    height: '1.1em'
                                }}
                            >
                                <span
                                    className="animated-word-current"
                                    style={{
                                        display: 'block',
                                        transition: 'transform 0.7s cubic-bezier(0.19, 1, 0.22, 1)',
                                        transform: isAnimating ? 'translateY(-100%)' : 'translateY(0)'
                                    }}
                                >
                                    {words[displayWord]}
                                </span>
                                <span
                                    className="animated-word-next"
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        display: 'block',
                                        width: '100%',
                                        transition: 'transform 0.7s cubic-bezier(0.19, 1, 0.22, 1)',
                                        transform: isAnimating ? 'translateY(0)' : 'translateY(100%)'
                                    }}
                                >
                                    {words[nextWord]}
                                </span>
                            </span>
                        </h1>
                        <p style={{
                            fontSize: 'clamp(1.125rem, 2vw, 1.5rem)',
                            color: 'rgba(255, 255, 255, 0.7)',
                            maxWidth: '700px',
                            margin: '0 auto 48px',
                            lineHeight: '1.6',
                            fontWeight: '400'
                        }}>
                            Discover, connect, and invest in the next generation of innovative startups. Swipe your way to the perfect match.
                        </p>
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
                            <button
                                onClick={() => navigate('/login')}
                                style={{
                                    background: '#4880ff',
                                    color: '#ffffff',
                                    padding: '16px 40px',
                                    borderRadius: '12px',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    border: 'none',
                                    cursor: 'pointer',
                                    transition: 'filter 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.filter = 'brightness(1.15)'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.filter = 'brightness(1)'
                                }}
                            >
                                Get Started Free
                            </button>
                            <button
                                onClick={() => handleAnchorClick({ preventDefault: () => { } }, '#how-it-works')}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    color: '#ffffff',
                                    padding: '16px 40px',
                                    borderRadius: '12px',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                                }}
                            >
                                Learn More
                            </button>
                        </div>
                    </div>
                </section>

                {/* Powerful Features Section with Mockups */}
                <section id="features" className="fade-in-up" style={{
                    padding: '5px 24px 60px',
                    maxWidth: '1400px',
                    margin: '0 auto',
                    position: 'relative'
                }}>
                    <div style={{ textAlign: 'center', marginBottom: '50px' }}>
                        <h2 style={{
                            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                            fontWeight: '700',
                            letterSpacing: '-0.02em',
                            marginBottom: '16px',
                            color: '#ffffff'
                        }}>
                            Powerful Features
                        </h2>
                        <p style={{
                            fontSize: 'clamp(1rem, 2vw, 1.25rem)',
                            color: 'rgba(255, 255, 255, 0.7)',
                            maxWidth: '600px',
                            margin: '0 auto',
                            lineHeight: '1.6',
                            fontWeight: '400'
                        }}>
                            Everything you need to discover and invest in innovative startups
                        </p>
                    </div>

                    {/* Desktop Layout: Laptop on left, Features cards on right, Phone below laptop */}
                    <div className="features-mockup-container" style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '60px',
                        alignItems: 'start',
                        marginBottom: '40px',
                        overflow: 'visible'
                    }}>
                        {/* Left Column: Laptop and Phone Mockups */}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '40px',
                            alignItems: 'center',
                            overflow: 'visible'
                        }}>
                            {/* Laptop Mockup */}
                            <div className="device-mockup laptop-mockup-features" style={{
                                width: '100%',
                                maxWidth: '900px',
                                position: 'relative'
                            }}>
                                <img
                                    src="/laptop-mockup.png"
                                    alt="Desktop Screenshot"
                                    style={{
                                        width: '100%',
                                        height: 'auto',
                                        display: 'block',
                                        filter: 'drop-shadow(0 20px 60px rgba(0, 0, 0, 0.3))'
                                    }}
                                    onError={(e) => {
                                        e.target.style.display = 'none'
                                        if (e.target.nextSibling) {
                                            e.target.nextSibling.style.display = 'block'
                                        }
                                    }}
                                />
                                <div style={{ display: 'none', textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)', padding: '40px' }}>
                                    <i className="fas fa-laptop" style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.3 }}></i>
                                    <div>Place laptop-mockup.png in public folder</div>
                                </div>
                            </div>

                            {/* Phone Mockup - Below Laptop */}
                            <div className="device-mockup phone-mockup-features" style={{
                                width: '100%',
                                maxWidth: '550px',
                                position: 'relative',
                                marginTop: '20px',
                                paddingBottom: '40px',
                                overflow: 'visible'
                            }}>
                                <img
                                    src="/phone-mockup.png"
                                    alt="Mobile Screenshot"
                                    className="phone-mockup-image"
                                    style={{
                                        width: '100%',
                                        height: 'auto',
                                        display: 'block'
                                    }}
                                    onError={(e) => {
                                        e.target.style.display = 'none'
                                        if (e.target.nextSibling) {
                                            e.target.nextSibling.style.display = 'block'
                                        }
                                    }}
                                />
                                <div style={{ display: 'none', textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)', padding: '20px' }}>
                                    <i className="fas fa-mobile-alt" style={{ fontSize: '2rem', marginBottom: '12px', opacity: 0.3 }}></i>
                                    <div>Place phone-mockup.png in public folder</div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Feature Cards */}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '24px',
                            justifyContent: 'center'
                        }}>
                            {[
                                {
                                    icon: 'fa-rocket',
                                    title: 'Curated Startups',
                                    description: 'Access a carefully selected database of innovative startups across various industries and stages.',
                                },
                                {
                                    icon: 'fa-brain',
                                    title: 'Smart Matching',
                                    description: 'Our algorithm learns your preferences and suggests startups that align with your investment goals.',
                                },
                                {
                                    icon: 'fa-comments',
                                    title: 'Direct Communication',
                                    description: 'Connect directly with founders through our built-in messaging system. No middlemen, no delays.',
                                },
                                {
                                    icon: 'fa-bell',
                                    title: 'Real-time Updates',
                                    description: 'Stay informed about new startups, funding rounds, and opportunities as they happen.',
                                },
                                {
                                    icon: 'fa-shield-alt',
                                    title: 'Secure Platform',
                                    description: 'Your data and investments are protected with enterprise-grade security and privacy measures.',
                                },
                                {
                                    icon: 'fa-globe',
                                    title: 'Global Reach',
                                    description: 'Discover startups from around the world. Expand your investment portfolio beyond borders.',
                                },
                            ].map((feature, index) => (
                                <div key={index} style={{
                                    padding: '24px 28px',
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    borderRadius: '16px',
                                    border: '1px solid rgba(255, 255, 255, 0.05)',
                                    transition: 'all 0.3s ease',
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '20px'
                                }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                                        e.currentTarget.style.borderColor = 'rgba(72, 128, 255, 0.3)'
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)'
                                    }}
                                >
                                    {/* Minimalist Icon */}
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        minWidth: '48px',
                                        background: 'rgba(72, 128, 255, 0.1)',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '20px',
                                        color: '#4880ff',
                                        border: '1px solid rgba(72, 128, 255, 0.2)'
                                    }}>
                                        <i className={`fas ${feature.icon}`}></i>
                                    </div>
                                    {/* Text Content */}
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{
                                            fontSize: 'clamp(1.125rem, 2vw, 1.25rem)',
                                            fontWeight: '600',
                                            marginBottom: '8px',
                                            color: '#ffffff',
                                            letterSpacing: '-0.01em'
                                        }}>
                                            {feature.title}
                                        </h3>
                                        <p style={{
                                            color: 'rgba(255, 255, 255, 0.6)',
                                            fontSize: 'clamp(0.875rem, 1.5vw, 0.95rem)',
                                            lineHeight: '1.6',
                                            fontWeight: '400',
                                            margin: 0
                                        }}>
                                            {feature.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* How It Works Section */}
                <section id="how-it-works" className="fade-in-up" style={{
                    padding: '80px 24px 60px',
                    maxWidth: '1200px',
                    margin: '0 auto',
                    overflow: 'visible'
                }}>
                    <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                        <h2 style={{
                            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                            fontWeight: '700',
                            letterSpacing: '-0.02em',
                            marginBottom: '16px',
                            color: '#ffffff'
                        }}>
                            How It Works
                        </h2>
                        <p style={{
                            fontSize: 'clamp(1rem, 2vw, 1.25rem)',
                            color: 'rgba(255, 255, 255, 0.7)',
                            maxWidth: '600px',
                            margin: '0 auto',
                            lineHeight: '1.6',
                            fontWeight: '400'
                        }}>
                            Simple, fast, and effective way to connect with startups
                        </p>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))',
                        gap: 'clamp(40px, 6vw, 60px)',
                        marginTop: '40px',
                        position: 'relative',
                        paddingTop: '20px',
                        overflow: 'visible'
                    }}>
                        {[
                            {
                                number: '01',
                                icon: 'fa-user-plus',
                                title: 'Create Profile',
                                description: 'Sign up and build your profile. Tell us about your interests, investment goals, and what you\'re looking for in a startup.',
                            },
                            {
                                number: '02',
                                icon: 'fa-hand-pointer',
                                title: 'Swipe & Discover',
                                description: 'Browse through curated startup profiles. Swipe right to like, left to pass. Find startups that match your criteria.',
                            },
                            {
                                number: '03',
                                icon: 'fa-handshake',
                                title: 'Connect & Invest',
                                description: 'When there\'s a mutual match, start chatting directly with founders. Build relationships and make investment decisions.',
                            },
                        ].map((step, index) => (
                            <div
                                key={index}
                                style={{
                                    position: 'relative',
                                    padding: '50px 40px',
                                    borderRadius: '20px',
                                    background: 'linear-gradient(135deg, rgba(72, 128, 255, 0.05) 0%, rgba(72, 128, 255, 0.02) 100%)',
                                    border: '1px solid rgba(72, 128, 255, 0.1)',
                                    transition: 'all 0.3s ease',
                                    cursor: 'pointer',
                                    overflow: 'visible'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-8px)'
                                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(72, 128, 255, 0.1) 0%, rgba(72, 128, 255, 0.05) 100%)'
                                    e.currentTarget.style.borderColor = 'rgba(72, 128, 255, 0.2)'
                                    e.currentTarget.style.boxShadow = '0 20px 40px rgba(72, 128, 255, 0.15)'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)'
                                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(72, 128, 255, 0.05) 0%, rgba(72, 128, 255, 0.02) 100%)'
                                    e.currentTarget.style.borderColor = 'rgba(72, 128, 255, 0.1)'
                                    e.currentTarget.style.boxShadow = 'none'
                                }}
                            >
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '20px',
                                    marginBottom: '24px'
                                }}>
                                    <div style={{
                                        width: '64px',
                                        height: '64px',
                                        borderRadius: '16px',
                                        background: 'linear-gradient(135deg, #4880ff 0%, #3d6bff 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '24px',
                                        color: '#ffffff',
                                        flexShrink: 0
                                    }}>
                                        <i className={`fas ${step.icon}`}></i>
                                    </div>
                                    <div style={{
                                        fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                                        fontWeight: '700',
                                        background: 'linear-gradient(135deg, #4880ff 0%, #3d6bff 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text',
                                        lineHeight: '1',
                                        letterSpacing: '-0.05em'
                                    }}>
                                        {step.number}
                                    </div>
                                </div>
                                <h3 style={{
                                    fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                                    fontWeight: '600',
                                    marginBottom: '16px',
                                    color: '#ffffff',
                                    letterSpacing: '-0.01em'
                                }}>
                                    {step.title}
                                </h3>
                                <p style={{
                                    color: 'rgba(255, 255, 255, 0.7)',
                                    fontSize: 'clamp(0.95rem, 1.8vw, 1.125rem)',
                                    lineHeight: '1.7',
                                    fontWeight: '400'
                                }}>
                                    {step.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* FAQ Section - Sticky, slides up to reveal footer */}
                <section
                    ref={faqRef}
                    id="faq"
                    className="fade-in-up"
                    style={{
                        padding: '60px 24px 30px',
                        width: '100%',
                        margin: '5px auto 0',
                        position: 'sticky',
                        top: 0,
                        zIndex: 2,
                        transform: `translateY(${faqTransform}px)`,
                        willChange: 'transform',
                        background: '#0a0a0a',
                        borderBottomLeftRadius: '100px',
                        borderBottomRightRadius: '100px'
                    }}
                >
                    <div style={{
                        textAlign: 'center',
                        marginBottom: '40px',
                        maxWidth: '1000px',
                        marginLeft: 'auto',
                        marginRight: 'auto',
                        paddingLeft: '24px',
                        paddingRight: '24px'
                    }}>
                        <h2 style={{
                            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                            fontWeight: '700',
                            letterSpacing: '-0.02em',
                            marginBottom: '16px',
                            color: '#ffffff'
                        }}>
                            Frequently Asked Questions
                        </h2>
                    </div>

                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                        maxWidth: '1000px',
                        marginLeft: 'auto',
                        marginRight: 'auto',
                        paddingLeft: '24px',
                        paddingRight: '24px'
                    }}>
                        {[
                            {
                                question: 'How does Swipy work?',
                                answer: 'Swipy is a platform that connects investors with startups. Create your profile, swipe through curated startup profiles, and when there\'s a mutual match, start chatting directly with founders to explore investment opportunities.'
                            },
                            {
                                question: 'Is Swipy free to use?',
                                answer: 'Yes, Swipy offers a free tier that allows you to discover startups and connect with founders. We also offer premium features for investors looking for advanced matching and analytics.'
                            },
                            {
                                question: 'What types of startups are on Swipy?',
                                answer: 'We feature innovative startups across various industries and stages, from early-stage to growth-stage companies. All startups are carefully curated to ensure quality and relevance for our investor community.'
                            },
                            {
                                question: 'How do I get matched with startups?',
                                answer: 'Our smart matching algorithm learns your preferences based on your profile, investment goals, and swipe behavior. It then suggests startups that align with your interests and investment criteria.'
                            },
                            {
                                question: 'Is my data secure?',
                                answer: 'Absolutely. We use enterprise-grade security measures to protect your data and investments. Your information is encrypted and we follow strict privacy protocols to ensure your data remains confidential.'
                            },
                            {
                                question: 'Can I contact startups directly?',
                                answer: 'Yes! Once you match with a startup, you can communicate directly with founders through our built-in messaging system. No middlemen, no delays - just direct communication.'
                            }
                        ].map((faq, index) => (
                            <div
                                key={index}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    borderRadius: '16px',
                                    border: '1px solid rgba(255, 255, 255, 0.05)',
                                    overflow: 'hidden',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)'
                                }}
                            >
                                <button
                                    onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                                    style={{
                                        width: '100%',
                                        padding: '28px 32px',
                                        background: 'transparent',
                                        border: 'none',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        color: '#ffffff'
                                    }}
                                >
                                    <h3 style={{
                                        fontSize: 'clamp(1rem, 2vw, 1.125rem)',
                                        fontWeight: '600',
                                        margin: 0,
                                        color: '#ffffff',
                                        flex: 1,
                                        paddingRight: '20px'
                                    }}>
                                        {faq.question}
                                    </h3>
                                    <i
                                        className={`fas ${openFaqIndex === index ? 'fa-minus' : 'fa-plus'}`}
                                        style={{
                                            fontSize: '1rem',
                                            color: '#ffffff',
                                            transition: 'transform 0.3s ease',
                                            flexShrink: 0,
                                            width: '24px',
                                            height: '24px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    ></i>
                                </button>
                                <div
                                    style={{
                                        maxHeight: openFaqIndex === index ? '500px' : '0',
                                        overflow: 'hidden',
                                        transition: 'max-height 0.3s ease, padding 0.3s ease',
                                        padding: openFaqIndex === index ? '0 32px 28px 32px' : '0 32px',
                                    }}
                                >
                                    <p style={{
                                        color: 'rgba(255, 255, 255, 0.7)',
                                        fontSize: 'clamp(0.9rem, 1.8vw, 1rem)',
                                        lineHeight: '1.7',
                                        margin: 0,
                                        fontWeight: '400'
                                    }}>
                                        {faq.answer}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* CTA Section - Behind FAQ */}
                <section
                    ref={ctaRef}
                    style={{
                        padding: '40px 24px',
                        width: '100%',
                        textAlign: 'center',
                        background: 'linear-gradient(180deg, #0f172a 0%, #0a0a0a 100%)',
                        position: 'relative',
                        zIndex: 0,
                        marginTop: '-400px',
                        paddingTop: '130px'
                    }}
                >
                    <h2 style={{
                        fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                        fontWeight: '700',
                        letterSpacing: '-0.02em',
                        marginBottom: '40px',
                        marginTop: '40px',
                        color: '#ffffff'
                    }}>
                        Ready to Find Your Next Startup?
                    </h2>
                    <button
                        onClick={() => navigate('/login')}
                        style={{
                            background: '#4880ff',
                            color: '#ffffff',
                            padding: '16px 40px',
                            borderRadius: '12px',
                            fontSize: '1rem',
                            fontWeight: '600',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'filter 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.filter = 'brightness(1.15)'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.filter = 'brightness(1)'
                        }}
                    >
                        Get Started Free
                    </button>
                </section>

                {/* Footer */}
                <footer
                    ref={footerRef}
                    style={{
                        padding: '40px 24px 40px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                        maxWidth: '1200px',
                        margin: '0 auto',
                        opacity: footerVisible ? 1 : 0,
                        transform: footerVisible ? 'translateY(0)' : 'translateY(30px)',
                        transition: 'opacity 0.6s ease-out, transform 0.6s ease-out'
                    }}
                >
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '48px',
                        marginBottom: '48px',
                        paddingTop: '1px'
                    }}>
                        <div>
                            <div style={{ marginBottom: '24px' }}>
                                <img
                                    src="/Vector.png"
                                    alt="Swipy"
                                    style={{
                                        height: '32px',
                                        width: '32px',
                                        borderRadius: '8px',
                                        objectFit: 'contain'
                                    }}
                                />
                            </div>
                            <p style={{
                                color: 'rgba(255, 255, 255, 0.6)',
                                fontSize: '0.875rem',
                                lineHeight: '1.6',
                                fontWeight: '400'
                            }}>
                                Tinder for Startups. Discover, connect, and invest in innovative startups.
                            </p>
                        </div>
                        <div>
                            <h4 style={{
                                fontWeight: '600',
                                marginBottom: '16px',
                                color: '#ffffff',
                                fontSize: '0.95rem',
                                letterSpacing: '0.05em',
                                textTransform: 'uppercase'
                            }}>
                                Product
                            </h4>
                            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <li><a href="#features" onClick={(e) => handleAnchorClick(e, '#features')} style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem', textDecoration: 'none', fontWeight: '400' }} className="hover:text-white transition-colors">Features</a></li>
                                <li><a href="#how-it-works" onClick={(e) => handleAnchorClick(e, '#how-it-works')} style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem', textDecoration: 'none', fontWeight: '400' }} className="hover:text-white transition-colors">How It Works</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 style={{
                                fontWeight: '600',
                                marginBottom: '16px',
                                color: '#ffffff',
                                fontSize: '0.95rem',
                                letterSpacing: '0.05em',
                                textTransform: 'uppercase'
                            }}>
                                Company
                            </h4>
                            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <li><a href="#" style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem', textDecoration: 'none', fontWeight: '400' }} className="hover:text-white transition-colors">About</a></li>
                                <li><a href="#" style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem', textDecoration: 'none', fontWeight: '400' }} className="hover:text-white transition-colors">Blog</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 style={{
                                fontWeight: '600',
                                marginBottom: '16px',
                                color: '#ffffff',
                                fontSize: '0.95rem',
                                letterSpacing: '0.05em',
                                textTransform: 'uppercase'
                            }}>
                                Legal
                            </h4>
                            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <li><a href="#" style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem', textDecoration: 'none', fontWeight: '400' }} className="hover:text-white transition-colors">Privacy</a></li>
                                <li><a href="#" style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem', textDecoration: 'none', fontWeight: '400' }} className="hover:text-white transition-colors">Terms</a></li>
                            </ul>
                        </div>
                    </div>
                    <div style={{
                        paddingTop: '32px',
                        textAlign: 'center',
                        color: 'rgba(255, 255, 255, 0.6)',
                        fontSize: '0.875rem',
                        fontWeight: '400'
                    }}>
                        <p>&copy; {new Date().getFullYear()} Swipy. All rights reserved.</p>
                    </div>
                </footer>
            </div>
        </>
    )
}

export default LandingPage

import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const LandingPage = () => {
    const navigate = useNavigate()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [openFaqIndex, setOpenFaqIndex] = useState(null)
    const [footerVisible, setFooterVisible] = useState(false)
    const [faqTransform, setFaqTransform] = useState(0)
    const logoRef = useRef(null)
    const heroRef = useRef(null)
    const faqRef = useRef(null)
    const footerRef = useRef(null)
    const ctaRef = useRef(null)
    const scrollHandlerRef = useRef(null)

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
        scrollHandlerRef.current = () => {
            if (faqRef.current && ctaRef.current) {
                const faqRect = faqRef.current.getBoundingClientRect()
                const ctaRect = ctaRef.current.getBoundingClientRect()
                const windowHeight = window.innerHeight
                const scrollY = window.scrollY || window.pageYOffset

                // Get the container to calculate original position
                const faqContainer = faqRef.current.offsetParent || document.body
                const faqOffsetTop = faqRef.current.offsetTop
                const faqHeight = faqRect.height

                // FAQ becomes sticky when it reaches top of viewport
                // FAQ should start sliding up when user scrolls past the point where
                // the bottom of FAQ would naturally be at the top of viewport
                const stickyStart = faqOffsetTop
                const stickyEnd = faqOffsetTop + faqHeight - windowHeight

                let progress = 0
                // When user scrolls past sticky end, FAQ starts sliding up
                if (scrollY > stickyEnd) {
                    const scrollPast = scrollY - stickyEnd
                    // Distance to scroll to fully hide FAQ
                    const slideDistance = faqHeight + windowHeight * 0.4
                    progress = Math.min(1, scrollPast / slideDistance)
                }

                // Apply transform: FAQ slides up (negative Y) to reveal footer below
                const maxSlide = -(faqHeight + windowHeight * 0.2)
                setFaqTransform(progress * maxSlide)

                // Show footer when FAQ starts sliding
                setFooterVisible(progress > 0.15)
            }
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
        if (logoRef.current) {
            logoRef.current.style.transform = 'rotate(360deg)'
            logoRef.current.style.transition = 'transform 0.6s ease-in-out'
            setTimeout(() => {
                logoRef.current.style.transform = 'rotate(0deg)'
            }, 600)
        }
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

                @media (max-width: 768px) {
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
                }
            `}</style>
            <div className="min-h-screen" style={{ background: '#0a0a0a', color: '#FFFFFF', overflowY: 'auto', position: 'relative', width: '100%', height: 'auto' }}>
                {/* Minimal Navbar - Centered with rounded corners like playntest.com */}
                <nav style={{
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
                    padding: '18px 24px',
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
                            src="/logo.png"
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
                                transition: 'all 0.3s ease',
                                boxShadow: '0 4px 15px rgba(72, 128, 255, 0.4)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)'
                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(72, 128, 255, 0.5)'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)'
                                e.currentTarget.style.boxShadow = '0 4px 15px rgba(72, 128, 255, 0.4)'
                            }}
                        >
                            Sign Up
                        </button>
                    </div>
                </nav>

                {/* Hero Section with Device Mockups */}
                <section
                    ref={heroRef}
                    style={{
                        minHeight: '100vh',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: '100px 24px 60px',
                        maxWidth: '1400px',
                        margin: '0 auto',
                        textAlign: 'center',
                        position: 'relative'
                    }}
                >
                    <div className="fade-in-up" style={{ marginBottom: '60px', maxWidth: '900px' }}>
                        <h1 style={{
                            fontSize: 'clamp(2.5rem, 6vw, 5rem)',
                            fontWeight: '700',
                            letterSpacing: '-0.03em',
                            lineHeight: '1.1',
                            marginBottom: '24px',
                            color: '#ffffff'
                        }}>
                            Tinder for{' '}
                            <span style={{ color: '#4880ff' }}>Startups</span>
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
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 4px 20px rgba(72, 128, 255, 0.4)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)'
                                    e.currentTarget.style.boxShadow = '0 6px 25px rgba(72, 128, 255, 0.5)'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)'
                                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(72, 128, 255, 0.4)'
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

                    {/* Device Mockups - Side by Side */}
                    <div className="fade-in-up device-mockup-container" style={{
                        width: '100%',
                        marginTop: '60px',
                        display: 'flex',
                        flexDirection: 'row',
                        gap: '60px',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexWrap: 'wrap',
                        overflow: 'visible'
                    }}>
                        {/* Laptop Mockup */}
                        <div className="device-mockup laptop-mockup" style={{
                            maxWidth: '600px',
                            flex: '1 1 500px',
                            minWidth: '300px'
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
                                    // Fallback if image doesn't exist
                                    e.target.style.display = 'none'
                                    e.target.nextSibling.style.display = 'block'
                                }}
                            />
                            <div style={{ display: 'none', textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)', padding: '40px' }}>
                                <i className="fas fa-laptop" style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.3 }}></i>
                                <div>Place laptop-mockup.png in public folder</div>
                            </div>
                        </div>

                        {/* Phone Mockup */}
                        <div className="device-mockup phone-mockup" style={{
                            maxWidth: '400px',
                            flex: '0 1 400px',
                            minWidth: '250px',
                            paddingTop: '20px',
                            overflow: 'visible'
                        }}>
                            <img
                                src="/phone-mockup.png"
                                alt="Mobile Screenshot"
                                style={{
                                    width: '100%',
                                    height: 'auto',
                                    display: 'block',
                                    filter: 'drop-shadow(0 20px 60px rgba(0, 0, 0, 0.3))'
                                }}
                                onError={(e) => {
                                    // Fallback if image doesn't exist
                                    e.target.style.display = 'none'
                                    e.target.nextSibling.style.display = 'block'
                                }}
                            />
                            <div style={{ display: 'none', textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)', padding: '20px' }}>
                                <i className="fas fa-mobile-alt" style={{ fontSize: '2rem', marginBottom: '12px', opacity: 0.3 }}></i>
                                <div>Place phone-mockup.png in public folder</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="fade-in-up" style={{
                    padding: '80px 24px',
                    maxWidth: '1200px',
                    margin: '0 auto'
                }}>
                    <div style={{ textAlign: 'center', marginBottom: '60px' }}>
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

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))',
                        gap: 'clamp(32px, 5vw, 48px)'
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
                                padding: '40px',
                                background: 'rgba(255, 255, 255, 0.03)',
                                borderRadius: '16px',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                transition: 'all 0.3s ease'
                            }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                                    e.currentTarget.style.transform = 'translateY(-4px)'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)'
                                    e.currentTarget.style.transform = 'translateY(0)'
                                }}
                            >
                                <div style={{
                                    width: '56px',
                                    height: '56px',
                                    background: '#4880ff',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '24px',
                                    fontSize: '24px',
                                    color: '#ffffff'
                                }}>
                                    <i className={`fas ${feature.icon}`}></i>
                                </div>
                                <h3 style={{
                                    fontSize: 'clamp(1.25rem, 2.5vw, 1.5rem)',
                                    fontWeight: '600',
                                    marginBottom: '12px',
                                    color: '#ffffff',
                                    letterSpacing: '-0.01em'
                                }}>
                                    {feature.title}
                                </h3>
                                <p style={{
                                    color: 'rgba(255, 255, 255, 0.7)',
                                    fontSize: 'clamp(0.95rem, 1.8vw, 1rem)',
                                    lineHeight: '1.7',
                                    fontWeight: '400'
                                }}>
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* How It Works Section */}
                <section id="how-it-works" className="fade-in-up" style={{
                    padding: '80px 24px',
                    maxWidth: '1200px',
                    margin: '0 auto'
                }}>
                    <div style={{ textAlign: 'center', marginBottom: '60px' }}>
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
                        marginTop: '60px',
                        position: 'relative'
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
                                    padding: '40px',
                                    borderRadius: '20px',
                                    background: 'linear-gradient(135deg, rgba(72, 128, 255, 0.05) 0%, rgba(72, 128, 255, 0.02) 100%)',
                                    border: '1px solid rgba(72, 128, 255, 0.1)',
                                    transition: 'all 0.3s ease',
                                    cursor: 'pointer'
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
                                        flexShrink: 0,
                                        boxShadow: '0 8px 20px rgba(72, 128, 255, 0.3)'
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
                        padding: '80px 24px 40px',
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
                        marginBottom: '60px',
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
                        paddingTop: '100px'
                    }}
                >
                    <h2 style={{
                        fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                        fontWeight: '700',
                        letterSpacing: '-0.02em',
                        marginBottom: '48px',
                        marginTop: '60px',
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
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 20px rgba(72, 128, 255, 0.4)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)'
                            e.currentTarget.style.boxShadow = '0 6px 25px rgba(72, 128, 255, 0.5)'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.boxShadow = '0 4px 20px rgba(72, 128, 255, 0.4)'
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
                                    src="/logo.png"
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

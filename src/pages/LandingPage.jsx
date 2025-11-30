import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const LandingPage = () => {
    const navigate = useNavigate()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const logoRef = useRef(null)
    const heroRef = useRef(null)

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
                    max-width: 300px;
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
                        max-width: 250px !important;
                        flex: 0 1 250px !important;
                    }
                }
            `}</style>
            <div className="min-h-screen" style={{ background: '#0a0a0a', color: '#FFFFFF', overflowY: 'auto', position: 'relative', width: '100%', height: 'auto' }}>
                {/* Minimal Navbar */}
                <nav className="fixed top-0 left-0 right-0 z-50 glass-effect">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16 md:h-20">
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
                                        height: '40px',
                                        width: '40px',
                                        borderRadius: '12px',
                                        objectFit: 'contain',
                                        transition: 'transform 0.6s ease-in-out',
                                        display: 'block',
                                    }}
                                />
                            </button>

                            {/* Desktop Navigation */}
                            <div className="hidden md:flex items-center gap-8">
                                <a
                                    href="#features"
                                    onClick={(e) => handleAnchorClick(e, '#features')}
                                    style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.95rem', fontWeight: '500' }}
                                    className="hover:text-white transition-colors"
                                >
                                    Features
                                </a>
                                <a
                                    href="#how-it-works"
                                    onClick={(e) => handleAnchorClick(e, '#how-it-works')}
                                    style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.95rem', fontWeight: '500' }}
                                    className="hover:text-white transition-colors"
                                >
                                    How It Works
                                </a>
                            </div>

                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="md:hidden w-10 h-10 flex items-center justify-center"
                                style={{ color: 'rgba(255, 255, 255, 0.7)' }}
                            >
                                <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'} text-xl`}></i>
                            </button>

                            {/* Auth Buttons */}
                            <div className="hidden md:flex items-center gap-4">
                                <button
                                    onClick={() => navigate('/login')}
                                    style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.95rem', fontWeight: '500' }}
                                    className="hover:text-white transition-colors"
                                >
                                    Log In
                                </button>
                                <button
                                    onClick={() => navigate('/login')}
                                    style={{
                                        background: '#4880ff',
                                        color: '#ffffff',
                                        padding: '10px 24px',
                                        borderRadius: '8px',
                                        fontSize: '0.95rem',
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
                        </div>

                        {/* Mobile Menu */}
                        {mobileMenuOpen && (
                            <div className="md:hidden glass-effect" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                <div className="px-4 py-4 space-y-4">
                                    <a
                                        href="#features"
                                        onClick={(e) => {
                                            handleAnchorClick(e, '#features')
                                            setMobileMenuOpen(false)
                                        }}
                                        style={{ color: 'rgba(255, 255, 255, 0.7)' }}
                                        className="block hover:text-white transition-colors py-2"
                                    >
                                        Features
                                    </a>
                                    <a
                                        href="#how-it-works"
                                        onClick={(e) => {
                                            handleAnchorClick(e, '#how-it-works')
                                            setMobileMenuOpen(false)
                                        }}
                                        style={{ color: 'rgba(255, 255, 255, 0.7)' }}
                                        className="block hover:text-white transition-colors py-2"
                                    >
                                        How It Works
                                    </a>
                                    <div className="pt-4" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                        <div className="flex flex-col gap-3">
                                            <button
                                                onClick={() => {
                                                    navigate('/login')
                                                    setMobileMenuOpen(false)
                                                }}
                                                style={{ color: 'rgba(255, 255, 255, 0.7)' }}
                                                className="w-full px-4 py-2 hover:text-white transition-colors text-left"
                                            >
                                                Log In
                                            </button>
                                            <button
                                                onClick={() => {
                                                    navigate('/login')
                                                    setMobileMenuOpen(false)
                                                }}
                                                style={{
                                                    background: '#4880ff',
                                                    color: '#ffffff',
                                                    padding: '12px 24px',
                                                    borderRadius: '8px',
                                                    fontSize: '0.95rem',
                                                    fontWeight: '600',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    width: '100%'
                                                }}
                                            >
                                                Sign Up
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
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
                        padding: '120px 24px 80px',
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
                        marginTop: '80px',
                        display: 'flex',
                        flexDirection: 'row',
                        gap: '60px',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexWrap: 'wrap',
                        overflow: 'visible'
                    }}>
                        {/* Laptop Mockup */}
                        <div className="device-mockup laptop-mockup float-animation" style={{ 
                            animationDelay: '0s',
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
                        <div className="device-mockup phone-mockup float-animation" style={{ 
                            animationDelay: '1s',
                            maxWidth: '280px',
                            flex: '0 1 280px',
                            minWidth: '200px',
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
                    padding: '120px 24px',
                    maxWidth: '1200px',
                    margin: '0 auto'
                }}>
                    <div style={{ textAlign: 'center', marginBottom: '80px' }}>
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
                    padding: '120px 24px',
                    maxWidth: '1200px',
                    margin: '0 auto',
                    background: 'rgba(255, 255, 255, 0.02)'
                }}>
                    <div style={{ textAlign: 'center', marginBottom: '80px' }}>
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
                        marginTop: '80px'
                    }}>
                        {[
                            {
                                number: '01',
                                title: 'Create Profile',
                                description: 'Sign up and build your profile. Tell us about your interests, investment goals, and what you\'re looking for in a startup.',
                            },
                            {
                                number: '02',
                                title: 'Swipe & Discover',
                                description: 'Browse through curated startup profiles. Swipe right to like, left to pass. Find startups that match your criteria.',
                            },
                            {
                                number: '03',
                                title: 'Connect & Invest',
                                description: 'When there\'s a mutual match, start chatting directly with founders. Build relationships and make investment decisions.',
                            },
                        ].map((step, index) => (
                            <div key={index}>
                                <div style={{
                                    fontSize: 'clamp(3rem, 6vw, 5rem)',
                                    fontWeight: '700',
                                    color: '#4880ff',
                                    lineHeight: '1',
                                    marginBottom: '24px',
                                    letterSpacing: '-0.05em'
                                }}>
                                    {step.number}
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

                {/* CTA Section */}
                <section className="fade-in-up" style={{
                    padding: '120px 24px',
                    maxWidth: '1200px',
                    margin: '0 auto',
                    textAlign: 'center'
                }}>
                    <h2 style={{
                        fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                        fontWeight: '700',
                        letterSpacing: '-0.02em',
                        marginBottom: '24px',
                        color: '#ffffff'
                    }}>
                        Ready to Find Your Next Startup?
                    </h2>
                    <p style={{
                        fontSize: 'clamp(1rem, 2vw, 1.25rem)',
                        color: 'rgba(255, 255, 255, 0.7)',
                        maxWidth: '600px',
                        margin: '0 auto 48px',
                        lineHeight: '1.6',
                        fontWeight: '400'
                    }}>
                        Join thousands of investors and entrepreneurs discovering the next big thing
                    </p>
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
                <footer className="fade-in-up" style={{
                    padding: '80px 24px 40px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                    maxWidth: '1200px',
                    margin: '0 auto'
                }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '48px',
                        marginBottom: '48px'
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
                        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
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

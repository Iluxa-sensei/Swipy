import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const LandingPage = () => {
    const navigate = useNavigate()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const logoRef = useRef(null)

    // Enable scrolling for landing page
    useEffect(() => {
        document.body.style.overflow = 'auto'
        document.body.style.position = 'relative'
        document.documentElement.style.scrollBehavior = 'smooth'

        return () => {
            document.body.style.overflow = ''
            document.body.style.position = ''
            document.documentElement.style.scrollBehavior = ''
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
                @media (max-width: 768px) {
                    .desktop-hero.modern {
                        margin-top: 64px !important;
                    }
                }
                .landing-logo {
                    image-rendering: -webkit-optimize-contrast;
                    image-rendering: crisp-edges;
                    -ms-interpolation-mode: nearest-neighbor;
                }
            `}</style>
            <div className="min-h-screen" style={{ background: '#000000', color: '#FFFFFF', overflowY: 'auto' }}>
                {/* Minimal Navbar */}
                <nav className="fixed top-0 left-0 right-0 z-50" style={{ background: 'rgba(0, 0, 0, 0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
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
                                    href="#how-it-works"
                                    onClick={(e) => handleAnchorClick(e, '#how-it-works')}
                                    style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.9rem', fontWeight: '400' }}
                                    className="hover:text-white transition-colors"
                                >
                                    How It Works
                                </a>
                                <a
                                    href="#features"
                                    onClick={(e) => handleAnchorClick(e, '#features')}
                                    style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.9rem', fontWeight: '400' }}
                                    className="hover:text-white transition-colors"
                                >
                                    Features
                                </a>
                            </div>

                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="md:hidden w-10 h-10 flex items-center justify-center"
                                style={{ color: 'rgba(255, 255, 255, 0.6)' }}
                            >
                                <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'} text-xl`}></i>
                            </button>

                            {/* Auth Buttons */}
                            <div className="hidden md:flex items-center gap-4">
                                <button
                                    onClick={() => navigate('/login')}
                                    style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.9rem', fontWeight: '400' }}
                                    className="hover:text-white transition-colors"
                                >
                                    Log In
                                </button>
                                <button
                                    onClick={() => navigate('/login')}
                                    style={{
                                        background: '#ffffff',
                                        color: '#000000',
                                        padding: '10px 24px',
                                        borderRadius: '6px',
                                        fontSize: '0.9rem',
                                        fontWeight: '500',
                                        border: 'none',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                                >
                                    Sign Up
                                </button>
                            </div>
                        </div>

                        {/* Mobile Menu */}
                        {mobileMenuOpen && (
                            <div className="md:hidden" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', background: 'rgba(0, 0, 0, 0.95)', backdropFilter: 'blur(12px)' }}>
                                <div className="px-4 py-4 space-y-4">
                                    <a
                                        href="#how-it-works"
                                        onClick={(e) => {
                                            handleAnchorClick(e, '#how-it-works')
                                            setMobileMenuOpen(false)
                                        }}
                                        style={{ color: 'rgba(255, 255, 255, 0.6)' }}
                                        className="block hover:text-white transition-colors py-2"
                                    >
                                        How It Works
                                    </a>
                                    <a
                                        href="#features"
                                        onClick={(e) => {
                                            handleAnchorClick(e, '#features')
                                            setMobileMenuOpen(false)
                                        }}
                                        style={{ color: 'rgba(255, 255, 255, 0.6)' }}
                                        className="block hover:text-white transition-colors py-2"
                                    >
                                        Features
                                    </a>
                                    <div className="pt-4" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                        <div className="flex flex-col gap-3">
                                            <button
                                                onClick={() => {
                                                    navigate('/login')
                                                    setMobileMenuOpen(false)
                                                }}
                                                style={{ color: 'rgba(255, 255, 255, 0.6)' }}
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
                                                    background: '#ffffff',
                                                    color: '#000000',
                                                    padding: '12px 24px',
                                                    borderRadius: '6px',
                                                    fontSize: '0.9rem',
                                                    fontWeight: '500',
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

                {/* Hero Section - Minimalist */}
                <section style={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '120px 24px 80px',
                    maxWidth: '1200px',
                    margin: '0 auto',
                    textAlign: 'center'
                }}>
                    <h1 style={{
                        fontSize: 'clamp(3rem, 8vw, 6rem)',
                        fontWeight: '300',
                        letterSpacing: '-0.02em',
                        lineHeight: '1.1',
                        marginBottom: '32px',
                        color: '#ffffff'
                    }}>
                        Tinder for Startups
                    </h1>
                    <p style={{
                        fontSize: 'clamp(1.125rem, 2.5vw, 1.5rem)',
                        color: 'rgba(255, 255, 255, 0.6)',
                        maxWidth: '700px',
                        marginBottom: '48px',
                        lineHeight: '1.6',
                        fontWeight: '300'
                    }}>
                        Discover, connect, and invest in the next generation of innovative startups. Swipe your way to the perfect match.
                    </p>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <button
                            onClick={() => navigate('/login')}
                            style={{
                                background: '#ffffff',
                                color: '#000000',
                                padding: '16px 32px',
                                borderRadius: '6px',
                                fontSize: '1rem',
                                fontWeight: '500',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                        >
                            Get Started
                        </button>
                        <button
                            onClick={() => handleAnchorClick({ preventDefault: () => { } }, '#how-it-works')}
                            style={{
                                background: 'transparent',
                                color: '#ffffff',
                                padding: '16px 32px',
                                borderRadius: '6px',
                                fontSize: '1rem',
                                fontWeight: '500',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)'
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                                e.currentTarget.style.background = 'transparent'
                            }}
                        >
                            Learn More
                        </button>
                    </div>
                </section>

                {/* How It Works Section */}
                <section id="how-it-works" style={{
                    padding: '120px 24px',
                    maxWidth: '1200px',
                    margin: '0 auto'
                }}>
                    <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                        <h2 style={{
                            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                            fontWeight: '300',
                            letterSpacing: '-0.02em',
                            marginBottom: '16px',
                            color: '#ffffff'
                        }}>
                            How It Works
                        </h2>
                        <p style={{
                            fontSize: 'clamp(1rem, 2vw, 1.25rem)',
                            color: 'rgba(255, 255, 255, 0.6)',
                            maxWidth: '600px',
                            margin: '0 auto',
                            lineHeight: '1.6'
                        }}>
                            Simple, fast, and effective way to connect with startups
                        </p>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
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
                                    fontWeight: '300',
                                    color: 'rgba(255, 255, 255, 0.1)',
                                    lineHeight: '1',
                                    marginBottom: '24px',
                                    letterSpacing: '-0.05em'
                                }}>
                                    {step.number}
                                </div>
                                <h3 style={{
                                    fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                                    fontWeight: '400',
                                    marginBottom: '16px',
                                    color: '#ffffff',
                                    letterSpacing: '-0.01em'
                                }}>
                                    {step.title}
                                </h3>
                                <p style={{
                                    color: 'rgba(255, 255, 255, 0.6)',
                                    fontSize: 'clamp(0.95rem, 1.8vw, 1.125rem)',
                                    lineHeight: '1.7',
                                    fontWeight: '300'
                                }}>
                                    {step.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" style={{
                    padding: '120px 24px',
                    maxWidth: '1200px',
                    margin: '0 auto',
                    background: '#000000'
                }}>
                    <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                        <h2 style={{
                            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                            fontWeight: '300',
                            letterSpacing: '-0.02em',
                            marginBottom: '16px',
                            color: '#ffffff'
                        }}>
                            Why Swipy
                        </h2>
                        <p style={{
                            fontSize: 'clamp(1rem, 2vw, 1.25rem)',
                            color: 'rgba(255, 255, 255, 0.6)',
                            maxWidth: '600px',
                            margin: '0 auto',
                            lineHeight: '1.6'
                        }}>
                            Everything you need to discover and invest in innovative startups
                        </p>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))',
                        gap: 'clamp(32px, 5vw, 48px)'
                    }}>
                        {[
                            {
                                title: 'Curated Startups',
                                description: 'Access a carefully selected database of innovative startups across various industries and stages.',
                            },
                            {
                                title: 'Smart Matching',
                                description: 'Our algorithm learns your preferences and suggests startups that align with your investment goals.',
                            },
                            {
                                title: 'Direct Communication',
                                description: 'Connect directly with founders through our built-in messaging system. No middlemen, no delays.',
                            },
                            {
                                title: 'Real-time Updates',
                                description: 'Stay informed about new startups, funding rounds, and opportunities as they happen.',
                            },
                            {
                                title: 'Secure Platform',
                                description: 'Your data and investments are protected with enterprise-grade security and privacy measures.',
                            },
                            {
                                title: 'Global Reach',
                                description: 'Discover startups from around the world. Expand your investment portfolio beyond borders.',
                            },
                        ].map((feature, index) => (
                            <div key={index} style={{
                                padding: '32px 0',
                                borderTop: '1px solid rgba(255, 255, 255, 0.05)'
                            }}>
                                <h3 style={{
                                    fontSize: 'clamp(1.25rem, 2.5vw, 1.5rem)',
                                    fontWeight: '400',
                                    marginBottom: '12px',
                                    color: '#ffffff',
                                    letterSpacing: '-0.01em'
                                }}>
                                    {feature.title}
                                </h3>
                                <p style={{
                                    color: 'rgba(255, 255, 255, 0.6)',
                                    fontSize: 'clamp(0.95rem, 1.8vw, 1rem)',
                                    lineHeight: '1.7',
                                    fontWeight: '300'
                                }}>
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* CTA Section */}
                <section style={{
                    padding: '120px 24px',
                    maxWidth: '1200px',
                    margin: '0 auto',
                    textAlign: 'center'
                }}>
                    <h2 style={{
                        fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                        fontWeight: '300',
                        letterSpacing: '-0.02em',
                        marginBottom: '24px',
                        color: '#ffffff'
                    }}>
                        Ready to Find Your Next Startup?
                    </h2>
                    <p style={{
                        fontSize: 'clamp(1rem, 2vw, 1.25rem)',
                        color: 'rgba(255, 255, 255, 0.6)',
                        maxWidth: '600px',
                        margin: '0 auto 48px',
                        lineHeight: '1.6',
                        fontWeight: '300'
                    }}>
                        Join thousands of investors and entrepreneurs discovering the next big thing
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        style={{
                            background: '#ffffff',
                            color: '#000000',
                            padding: '16px 40px',
                            borderRadius: '6px',
                            fontSize: '1rem',
                            fontWeight: '500',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                    >
                        Get Started Free
                    </button>
                </section>

                {/* Footer */}
                <footer style={{
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
                                color: 'rgba(255, 255, 255, 0.5)',
                                fontSize: '0.875rem',
                                lineHeight: '1.6',
                                fontWeight: '300'
                            }}>
                                Tinder for Startups. Discover, connect, and invest in innovative startups.
                            </p>
                        </div>
                        <div>
                            <h4 style={{
                                fontWeight: '400',
                                marginBottom: '16px',
                                color: '#ffffff',
                                fontSize: '0.95rem',
                                letterSpacing: '0.05em',
                                textTransform: 'uppercase'
                            }}>
                                Product
                            </h4>
                            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <li><a href="#features" onClick={(e) => handleAnchorClick(e, '#features')} style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem', textDecoration: 'none', fontWeight: '300' }} className="hover:text-white transition-colors">Features</a></li>
                                <li><a href="#how-it-works" onClick={(e) => handleAnchorClick(e, '#how-it-works')} style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem', textDecoration: 'none', fontWeight: '300' }} className="hover:text-white transition-colors">How It Works</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 style={{
                                fontWeight: '400',
                                marginBottom: '16px',
                                color: '#ffffff',
                                fontSize: '0.95rem',
                                letterSpacing: '0.05em',
                                textTransform: 'uppercase'
                            }}>
                                Company
                            </h4>
                            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <li><a href="#" style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem', textDecoration: 'none', fontWeight: '300' }} className="hover:text-white transition-colors">About</a></li>
                                <li><a href="#" style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem', textDecoration: 'none', fontWeight: '300' }} className="hover:text-white transition-colors">Blog</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 style={{
                                fontWeight: '400',
                                marginBottom: '16px',
                                color: '#ffffff',
                                fontSize: '0.95rem',
                                letterSpacing: '0.05em',
                                textTransform: 'uppercase'
                            }}>
                                Legal
                            </h4>
                            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <li><a href="#" style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem', textDecoration: 'none', fontWeight: '300' }} className="hover:text-white transition-colors">Privacy</a></li>
                                <li><a href="#" style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem', textDecoration: 'none', fontWeight: '300' }} className="hover:text-white transition-colors">Terms</a></li>
                            </ul>
                        </div>
                    </div>
                    <div style={{
                        paddingTop: '32px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                        textAlign: 'center',
                        color: 'rgba(255, 255, 255, 0.5)',
                        fontSize: '0.875rem',
                        fontWeight: '300'
                    }}>
                        <p>&copy; {new Date().getFullYear()} Swipy. All rights reserved.</p>
                    </div>
                </footer>
            </div>
        </>
    )
}

export default LandingPage

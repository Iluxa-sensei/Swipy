import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const DesktopSupportPage = () => {
    const navigate = useNavigate()
    const [copied, setCopied] = useState(false)
    const supportEmail = 'support@swipy.space'

    const handleCopyEmail = async () => {
        try {
            await navigator.clipboard.writeText(supportEmail)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (error) {
            console.error('Failed to copy email:', error)
            // Fallback for older browsers
            const textArea = document.createElement('textarea')
            textArea.value = supportEmail
            document.body.appendChild(textArea)
            textArea.select()
            try {
                document.execCommand('copy')
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
            } catch (err) {
                console.error('Fallback copy failed:', err)
            }
            document.body.removeChild(textArea)
        }
    }

    return (
        <div className="desktop-page">
            <div className="max-w-4xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="desktop-page-section !pb-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-text-primary mb-2 flex items-center gap-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center">
                                    <i className="fas fa-headset text-white text-xl"></i>
                                </div>
                                Support Center
                            </h1>
                            <p className="text-text-secondary">We're here to help! Contact us via email and we'll get back to you as soon as possible.</p>
                        </div>
                        <button
                            className="btn-secondary py-2.5 px-6 rounded-xl text-sm"
                            onClick={() => navigate(-1)}
                        >
                            <i className="fas fa-arrow-left mr-2"></i>
                            Back
                        </button>
                    </div>
                </div>

                {/* Contact Email Section */}
                <div className="desktop-card">
                    <div className="text-center py-8">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <i className="fas fa-envelope text-white text-3xl"></i>
                        </div>
                        <h2 className="text-2xl font-bold text-text-primary mb-4">Contact Us</h2>
                        <p className="text-text-secondary mb-6">Send us an email and we'll respond as soon as possible.</p>
                        
                        <div className="flex items-center justify-center gap-4 mb-6">
                            <div className="px-6 py-4 bg-bg-secondary/40 border border-glass-border rounded-xl">
                                <span className="text-lg font-semibold text-accent-primary">{supportEmail}</span>
                            </div>
                            <button
                                onClick={handleCopyEmail}
                                className={`px-6 py-4 rounded-xl font-semibold transition-all duration-200 ${
                                    copied 
                                        ? 'bg-green-500/20 border border-green-500/30 text-green-400' 
                                        : 'btn-primary hover:bg-accent-primary/90'
                                }`}
                            >
                                {copied ? (
                                    <>
                                        <i className="fas fa-check mr-2"></i>
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-copy mr-2"></i>
                                        Copy Email
                                    </>
                                )}
                            </button>
                        </div>

                        <a
                            href={`mailto:${supportEmail}`}
                            className="inline-flex items-center gap-2 text-accent-primary hover:text-accent-primary/80 transition-colors"
                        >
                            <i className="fas fa-external-link-alt"></i>
                            <span>Open in email client</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DesktopSupportPage


import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const SupportPage = () => {
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
        <div className="screen active">
            <div className="header">
                <button className="header-btn" onClick={() => navigate(-1)}>
                    <i className="fas fa-arrow-left"></i>
                </button>
                <h1>Support</h1>
                <div className="w-10"></div>
            </div>

            <div className="flex-1 overflow-y-auto pb-6">
                <div className="p-6">
                    {/* Header Section */}
                    <div className="text-center mb-8">
                        <div className="state-icon state-icon-sm state-icon-blue">
                            <i className="fas fa-headset"></i>
                        </div>
                        <h2 className="text-2xl font-bold text-text-primary mb-2">Support Center</h2>
                        <p className="text-text-secondary text-sm">
                            We're here to help! Contact us via email and we'll get back to you as soon as possible.
                        </p>
                    </div>

                    {/* Contact Email Section */}
                    <div className="bg-glass-bg border border-glass-border rounded-2xl p-6 mb-6">
                        <div className="text-center">
                            <div className="state-icon state-icon-sm state-icon-blue">
                                <i className="fas fa-envelope"></i>
                            </div>
                            <h3 className="text-xl font-bold text-text-primary mb-3">Contact Us</h3>
                            <p className="text-text-secondary text-sm mb-6">Send us an email and we'll respond as soon as possible.</p>
                            
                            <div className="space-y-4">
                                <div className="px-4 py-3 bg-bg-secondary/40 border border-glass-border rounded-xl">
                                    <span className="text-base font-semibold text-accent-primary">{supportEmail}</span>
                                </div>
                                <button
                                    onClick={handleCopyEmail}
                                    className={`w-full py-3.5 rounded-xl font-semibold transition-all duration-200 ${
                                        copied 
                                            ? 'bg-green-500/20 border border-green-500/30 text-green-400' 
                                            : 'btn-icon-style'
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
                                <a
                                    href={`mailto:${supportEmail}`}
                                    className="inline-flex items-center justify-center gap-2 text-accent-primary hover:text-accent-primary/80 transition-colors text-sm"
                                >
                                    <i className="fas fa-external-link-alt"></i>
                                    <span>Open in email client</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SupportPage


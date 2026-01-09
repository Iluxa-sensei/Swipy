import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, useProfile } from '../hooks'

const DesktopSupportPage = () => {
    const navigate = useNavigate()
    const { user } = useAuth()
    const { profile } = useProfile(user?.id)
    
    const [formData, setFormData] = useState({
        subject: '',
        message: ''
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)


    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            // Create email content
            const emailBody = `
User Information:
- Email: ${user?.email || 'Not provided'}
- User ID: ${user?.id || 'Not provided'}
- Name: ${profile?.full_name || 'Not provided'}
- Username: ${profile?.username || 'Not provided'}

Subject: ${formData.subject}

Message:
${formData.message}

---
This message was sent from Swipy Support Form
Timestamp: ${new Date().toISOString()}
            `.trim()

            // Create mailto link
            const mailtoLink = `mailto:support@swipy.space?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(emailBody)}`
            
            // Simulate sending delay for better UX
            await new Promise(resolve => setTimeout(resolve, 800))
            
            // Open email client
            window.location.href = mailtoLink
            
            // Show success animation
            setShowSuccess(true)
            
            // Reset form after showing success
            setFormData({
                subject: '',
                message: ''
            })
            
            // Hide success after 5 seconds
            setTimeout(() => {
                setShowSuccess(false)
            }, 5000)
        } catch (error) {
            console.error('Error submitting support request:', error)
            alert('Failed to open email client. Please send an email manually to support@swipy.space')
        } finally {
            setIsSubmitting(false)
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
                            <p className="text-text-secondary">We're here to help! Fill out the form below and we'll get back to you as soon as possible.</p>
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

                {/* Success Animation Overlay */}
                {showSuccess && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
                        <div className="bg-bg-secondary rounded-3xl max-w-md w-full mx-4 shadow-2xl border border-glass-border overflow-hidden animate-scale-in">
                            <div className="p-12 text-center">
                                {/* Success Icon with Animation */}
                                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-4xl animate-bounce">
                                    <i className="fas fa-check"></i>
                                </div>
                                
                                {/* Success Message */}
                                <h3 className="text-2xl font-bold text-text-primary mb-3">
                                    Thank You!
                                </h3>
                                <p className="text-text-secondary text-lg leading-relaxed">
                                    We'll contact you soon
                                </p>
                                
                                {/* Email Info */}
                                <p className="text-sm text-text-secondary mt-4 opacity-75">
                                    Your email client should open automatically. If it doesn't, please send an email to <span className="text-accent-primary">support@swipy.space</span>
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Support Form */}
                <div className="desktop-card">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Subject */}
                        <div>
                            <label htmlFor="subject" className="block text-sm font-semibold text-text-primary mb-2">
                                <i className="fas fa-heading text-accent-primary mr-2"></i>
                                Subject
                            </label>
                            <input
                                type="text"
                                id="subject"
                                name="subject"
                                value={formData.subject}
                                onChange={handleChange}
                                required
                                placeholder="Brief description of your issue"
                                className="w-full px-4 py-3 bg-bg-secondary/40 border border-glass-border rounded-xl text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-primary transition-colors"
                            />
                        </div>

                        {/* Message */}
                        <div>
                            <label htmlFor="message" className="block text-sm font-semibold text-text-primary mb-2">
                                <i className="fas fa-comment-alt text-accent-primary mr-2"></i>
                                Message
                            </label>
                            <textarea
                                id="message"
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                required
                                rows={8}
                                placeholder="Please provide as much detail as possible about your issue or question..."
                                className="w-full px-4 py-3 bg-bg-secondary/40 border border-glass-border rounded-xl text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-primary transition-colors resize-none"
                            />
                            <p className="mt-2 text-xs text-text-secondary">
                                <i className="fas fa-info-circle mr-1"></i>
                                Include any relevant details, steps to reproduce, or screenshots if applicable.
                            </p>
                        </div>

                        {/* Submit Button */}
                        <div className="flex items-center justify-between pt-4 border-t border-glass-border">
                            <div className="text-sm text-text-secondary">
                                <i className="fas fa-envelope mr-2"></i>
                                Your message will be sent to <span className="text-accent-primary font-semibold">support@swipy.space</span>
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting || showSuccess}
                                className="btn-primary py-3 px-8 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <>
                                        <i className="fas fa-spinner fa-spin mr-2"></i>
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-paper-plane mr-2"></i>
                                        Send Message
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Additional Help Section */}
                <div className="mt-6 grid grid-cols-2 gap-6">
                    <div className="desktop-card">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                                <i className="fas fa-book text-blue-400 text-lg"></i>
                            </div>
                            <h3 className="text-lg font-bold text-text-primary">Help Center</h3>
                        </div>
                        <p className="text-text-secondary text-sm mb-4">
                            Check out our documentation and FAQ section for quick answers to common questions.
                        </p>
                        <button
                            className="btn-secondary py-2 px-4 rounded-xl text-sm"
                            onClick={() => navigate('/legal')}
                        >
                            <i className="fas fa-external-link-alt mr-2"></i>
                            View Documentation
                        </button>
                    </div>

                    <div className="desktop-card">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                                <i className="fas fa-clock text-purple-400 text-lg"></i>
                            </div>
                            <h3 className="text-lg font-bold text-text-primary">Response Time</h3>
                        </div>
                        <p className="text-text-secondary text-sm mb-4">
                            We typically respond within 24-48 hours. For urgent issues, please mark your request as "Urgent".
                        </p>
                        <div className="flex items-center gap-2 text-xs text-text-secondary">
                            <i className="fas fa-info-circle"></i>
                            <span>Average response time: 24-48 hours</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DesktopSupportPage


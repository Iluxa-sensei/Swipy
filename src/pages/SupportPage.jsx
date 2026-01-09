import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, useProfile } from '../hooks'

const SupportPage = () => {
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
        <div className="screen active">
            <div className="header">
                <button className="header-btn" onClick={() => navigate(-1)}>
                    <i className="fas fa-arrow-left"></i>
                </button>
                <h1>Support</h1>
                <div className="w-10"></div>
            </div>

            <div className="flex-1 overflow-y-auto pb-6">
                {/* Success Animation Overlay */}
                {showSuccess && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
                        <div className="bg-bg-secondary rounded-3xl max-w-sm w-full shadow-2xl border border-glass-border overflow-hidden animate-scale-in">
                            <div className="p-10 text-center">
                                {/* Success Icon with Animation */}
                                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-3xl animate-bounce">
                                    <i className="fas fa-check"></i>
                                </div>
                                
                                {/* Success Message */}
                                <h3 className="text-xl font-bold text-text-primary mb-3">
                                    Thank You!
                                </h3>
                                <p className="text-text-secondary text-base leading-relaxed mb-4">
                                    We'll contact you soon
                                </p>
                                
                                {/* Email Info */}
                                <p className="text-xs text-text-secondary opacity-75">
                                    Your email client should open automatically. If it doesn't, please send an email to <span className="text-accent-primary">support@swipy.space</span>
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="p-6 space-y-6">
                    {/* Header Section */}
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <i className="fas fa-headset text-white text-2xl"></i>
                        </div>
                        <h2 className="text-2xl font-bold text-text-primary mb-2">Support Center</h2>
                        <p className="text-text-secondary text-sm">
                            We're here to help! Fill out the form below and we'll get back to you as soon as possible.
                        </p>
                    </div>

                    {/* Support Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Subject */}
                        <div>
                            <label htmlFor="subject" className="block text-text-primary font-medium mb-2">
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
                                className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-2xl text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-primary transition-colors"
                            />
                        </div>

                        {/* Message */}
                        <div>
                            <label htmlFor="message" className="block text-text-primary font-medium mb-2">
                                Description
                            </label>
                            <textarea
                                id="message"
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                required
                                rows={8}
                                placeholder="Please provide as much detail as possible about your issue or question..."
                                className="w-full px-4 py-3 bg-glass-bg border border-glass-border rounded-2xl text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-primary transition-colors resize-none"
                            />
                            <p className="mt-2 text-xs text-text-secondary">
                                <i className="fas fa-info-circle mr-1"></i>
                                Include any relevant details, steps to reproduce, or screenshots if applicable.
                            </p>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={isSubmitting || showSuccess}
                                className="w-full bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                            >
                                {isSubmitting ? (
                                    <>
                                        <i className="fas fa-spinner fa-spin"></i>
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-paper-plane"></i>
                                        Send Message
                                    </>
                                )}
                            </button>
                            <p className="text-center text-xs text-text-secondary mt-3">
                                <i className="fas fa-envelope mr-1"></i>
                                Your message will be sent to <span className="text-accent-primary font-semibold">support@swipy.space</span>
                            </p>
                        </div>
                    </form>

                    {/* Help Section */}
                    <div className="mt-8 space-y-4">
                        <div className="bg-glass-bg border border-glass-border rounded-2xl p-4">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                                    <i className="fas fa-clock text-blue-400"></i>
                                </div>
                                <h3 className="text-sm font-bold text-text-primary">Response Time</h3>
                            </div>
                            <p className="text-xs text-text-secondary leading-relaxed">
                                We typically respond within 24-48 hours. For urgent issues, please mark your request clearly in the subject.
                            </p>
                        </div>

                        <div className="bg-glass-bg border border-glass-border rounded-2xl p-4">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                                    <i className="fas fa-book text-purple-400"></i>
                                </div>
                                <h3 className="text-sm font-bold text-text-primary">Help Center</h3>
                            </div>
                            <p className="text-xs text-text-secondary leading-relaxed mb-3">
                                Check out our documentation and FAQ section for quick answers to common questions.
                            </p>
                            <button
                                className="btn-secondary w-full py-2.5 rounded-xl text-sm"
                                onClick={() => navigate('/legal')}
                            >
                                <i className="fas fa-external-link-alt mr-2"></i>
                                View Documentation
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SupportPage


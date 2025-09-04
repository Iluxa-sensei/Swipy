import React, { useState, useEffect } from 'react'

const OnboardingTutorial = ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0)
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        // Show tutorial with a small delay for smoothness
        const timer = setTimeout(() => setIsVisible(true), 500)
        return () => clearTimeout(timer)
    }, [])

    const steps = [
        {
            title: "Welcome to Swipy!",
            description: "Let's learn how to use the app to connect investors and startup founders",
            icon: "fas fa-rocket",
            animation: "bounce-in"
        },
        {
            title: "Swipe Right",
            description: "Swipe right if a startup interests you. You can start a chat with the team",
            icon: "fas fa-heart",
            animation: "slide-right",
            gesture: "right"
        },
        {
            title: "Swipe Left",
            description: "Swipe left if a startup doesn't fit. Move to the next one",
            icon: "fas fa-times",
            animation: "slide-left",
            gesture: "left"
        },
        {
            title: "Swipe Down",
            description: "Swipe down to save a startup to favorites and return to it later",
            icon: "fas fa-bookmark",
            animation: "slide-down",
            gesture: "down"
        },
        {
            title: "Filters and Search",
            description: "Use filters to find startups by category, stage, location, and investment requirements",
            icon: "fas fa-filter",
            animation: "zoom-in"
        },
        {
            title: "Ready!",
            description: "Now you know all the basic gestures. Start exploring startups!",
            icon: "fas fa-check-circle",
            animation: "bounce-in"
        }
    ]

    const nextStep = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1)
        } else {
            completeTutorial()
        }
    }

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1)
        }
    }

    const completeTutorial = () => {
        setIsVisible(false)
        // Save to localStorage that tutorial is completed
        localStorage.setItem('tutorial-completed', 'true')
        onComplete()
    }

    const skipTutorial = () => {
        completeTutorial()
    }

    const currentStepData = steps[currentStep]
    const progress = ((currentStep + 1) / steps.length) * 100

    if (!isVisible) return null

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-bg-secondary rounded-3xl max-w-sm w-full shadow-2xl border border-glass-border overflow-hidden animate-slide-up">
                {/* Progress Bar */}
                <div className="h-1 bg-glass-border">
                    <div
                        className="h-full bg-gradient-to-r from-accent-primary to-blue-500 transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>

                {/* Content */}
                <div className="p-6 text-center">
                    {/* Icon */}
                    <div className={`w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-accent-primary to-blue-500 flex items-center justify-center text-white text-3xl animate-${currentStepData.animation}`}>
                        <i className={currentStepData.icon}></i>
                    </div>

                    {/* Gesture Animation */}
                    {currentStepData.gesture && (
                        <div className="mb-4">
                            <div className={`w-16 h-16 mx-auto rounded-full bg-glass-bg border-2 border-accent-primary flex items-center justify-center text-accent-primary text-2xl animate-${currentStepData.animation}`}>
                                {currentStepData.gesture === 'right' && <i className="fas fa-arrow-right"></i>}
                                {currentStepData.gesture === 'left' && <i className="fas fa-arrow-left"></i>}
                                {currentStepData.gesture === 'down' && <i className="fas fa-arrow-down"></i>}
                            </div>
                        </div>
                    )}

                    {/* Title */}
                    <h3 className="text-xl font-bold text-text-primary mb-3">
                        {currentStepData.title}
                    </h3>

                    {/* Description */}
                    <p className="text-text-secondary leading-relaxed mb-6">
                        {currentStepData.description}
                    </p>

                    {/* Step Indicator */}
                    <div className="flex justify-center gap-2 mb-6">
                        {steps.map((_, index) => (
                            <div
                                key={index}
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentStep
                                        ? 'bg-accent-primary w-6'
                                        : 'bg-glass-border'
                                    }`}
                            ></div>
                        ))}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex gap-3">
                        {currentStep > 0 && (
                            <button
                                onClick={prevStep}
                                className="flex-1 py-3 px-4 bg-glass-bg border border-glass-border rounded-2xl text-text-primary font-medium hover:bg-glass-border transition-all duration-200"
                            >
                                Back
                            </button>
                        )}

                        <button
                            onClick={nextStep}
                            className="flex-1 py-3 px-4 bg-gradient-to-r from-accent-primary to-blue-500 text-white rounded-2xl font-medium hover:from-accent-primary/90 hover:to-blue-500/90 transition-all duration-200 hover:scale-105"
                        >
                            {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default OnboardingTutorial

import BottomNavigation from '../components/BottomNavigation.jsx'

const MobileLayout = ({ children, currentScreen, onScreenChange, showBottomNav = true }) => {
    // Allow scrolling for onboarding page
    const isOnboarding = currentScreen === 'onboarding'
    
    return (
        <div className="mobile-container">
            <div className={`flex-1 relative ${isOnboarding ? 'overflow-y-auto' : 'overflow-hidden'}`}>
                {children}
            </div>

            {showBottomNav && (
                <BottomNavigation
                    currentScreen={currentScreen}
                    onScreenChange={onScreenChange}
                />
            )}
        </div>
    )
}

export default MobileLayout


import BottomNavigation from '../components/BottomNavigation.jsx'

const MobileLayout = ({ children, currentScreen, onScreenChange, showBottomNav = true }) => {
    return (
        <div className="mobile-container">
            <div className="flex-1 overflow-hidden relative">
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


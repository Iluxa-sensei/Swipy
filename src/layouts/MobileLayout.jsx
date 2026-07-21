import { useNavigate } from 'react-router-dom'
import BottomNavigation from '../components/BottomNavigation.jsx'
import StatusBadge from '../components/ai-resumer/StatusBadge.jsx'
import { useAiResumerStatus } from '../context/AiResumerStatusContext.jsx'

const MobileLayout = ({ children, currentScreen, onScreenChange, showBottomNav = true }) => {
    const navigate = useNavigate()
    // Allow scrolling for onboarding page
    const isOnboarding = currentScreen === 'onboarding'
    const { activeJob } = useAiResumerStatus()
    
    return (
        <div className="mobile-container">
            <div className={`flex-1 relative ${isOnboarding ? 'overflow-y-auto' : 'overflow-hidden'}`}>
                {children}
            </div>

            {showBottomNav && activeJob && (
                <div className="absolute left-1/2 -translate-x-1/2 bottom-[68px] z-[130]">
                    <StatusBadge
                        status={activeJob.status}
                        message={activeJob.stage_message || 'Matching in progress...'}
                        onClick={() => navigate('/ai-resumer/results')}
                    />
                </div>
            )}

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


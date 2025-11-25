import React, { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { FiltersProvider } from './context/FiltersContext'
import { ProtectedRoute } from './components/ProtectedRoute.jsx'

import { useDeviceType } from './hooks'
import DesktopLayout from './layouts/DesktopLayout.jsx'
import MobileLayout from './layouts/MobileLayout.jsx'
import HomePage from './pages/HomePage'
import DesktopHomePage from './pages/DesktopHomePage.jsx'
import NotificationsPage from './pages/NotificationsPage'
import ChatPage from './pages/ChatPage'
import ProfilePage from './pages/ProfilePage'
import AddPage from './pages/AddPage'
import FiltersPage from './pages/FiltersPage'
import OnboardingPage from './pages/OnboardingPage'
import LoginPage from './pages/LoginPage'
import ChatDetailPage from './pages/ChatDetailPage'
import StartupDetailPage from './pages/StartupDetailPage'
import SavedPage from './pages/SavedPage'
import ProfileEditPage from './pages/ProfileEditPage'
import SettingsPage from './pages/SettingsPage'
import ActivityDashboardPage from './pages/ActivityDashboardPage'
import OAuthCallback from './components/OAuthCallback'
import ResetPasswordPage from './pages/ResetPasswordPage'


function App() {
  const [currentScreen, setCurrentScreen] = useState('login')
  const navigate = useNavigate()
  const location = useLocation()
  const { isDesktop } = useDeviceType()

  // Synchronize currentScreen with current route
  useEffect(() => {
    const path = location.pathname.substring(1) || 'login'
    setCurrentScreen(path)
  }, [location.pathname])

  const handleScreenChange = (screen) => {
    setCurrentScreen(screen)
    navigate(`/${screen}`)
  }

  // Determine whether to show bottom navigation
  const showBottomNav = !['onboarding', 'login', 'reset-password'].includes(currentScreen) && !currentScreen.startsWith('chat-detail')
  const desktopMinimal = ['login', 'reset-password', 'auth/callback'].some(screen => currentScreen.startsWith(screen))

  const routes = (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<OAuthCallback />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/home" element={isDesktop ? <DesktopHomePage /> : <HomePage />} />
        <Route path="/startup/:id" element={<StartupDetailPage />} />
        <Route path="/saved" element={<SavedPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/edit" element={<ProfileEditPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/activity-dashboard" element={<ActivityDashboardPage />} />
        <Route path="/add" element={<AddPage />} />
        <Route path="/filters" element={<FiltersPage />} />
        <Route path="/chat-detail/:chatId" element={<ChatDetailPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
      </Route>
    </Routes>
  )

  return (
    <FiltersProvider>
      {isDesktop ? (
        <DesktopLayout
          currentScreen={currentScreen}
          onScreenChange={handleScreenChange}
          minimal={desktopMinimal}
        >
          {routes}
        </DesktopLayout>
      ) : (
        <MobileLayout
          currentScreen={currentScreen}
          onScreenChange={handleScreenChange}
          showBottomNav={showBottomNav}
        >
          {routes}
        </MobileLayout>
      )}
    </FiltersProvider>
  )
}

export default App

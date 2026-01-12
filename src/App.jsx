import React, { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { FiltersProvider } from './context/FiltersContext'
import { ProtectedRoute } from './components/ProtectedRoute.jsx'
import { extractAndCleanAuthTokens } from './utils/authTokenCleaner.js'

import { useDeviceType } from './hooks'
import DesktopLayout from './layouts/DesktopLayout.jsx'
import MobileLayout from './layouts/MobileLayout.jsx'
import HomePage from './pages/HomePage'
import DesktopHomePage from './pages/DesktopHomePage.jsx'
import NotificationsPage from './pages/NotificationsPage'
import DesktopNotificationsPage from './pages/DesktopNotificationsPage.jsx'
import ChatPage from './pages/ChatPage'
import DesktopChatPage from './pages/DesktopChatPage.jsx'
import ProfilePage from './pages/ProfilePage'
import DesktopProfilePage from './pages/DesktopProfilePage.jsx'
import PublicProfilePage from './pages/PublicProfilePage'
import AddPage from './pages/AddPage'
import DesktopAddPage from './pages/DesktopAddPage.jsx'
import FiltersPage from './pages/FiltersPage'
import OnboardingPage from './pages/OnboardingPage'
import LoginPage from './pages/LoginPage'
import ChatDetailPage from './pages/ChatDetailPage'
import DesktopChatDetailPage from './pages/DesktopChatDetailPage.jsx'
import StartupDetailPage from './pages/StartupDetailPage'
import DesktopStartupDetailPage from './pages/DesktopStartupDetailPage.jsx'
import SavedPage from './pages/SavedPage'
import DesktopSavedPage from './pages/DesktopSavedPage.jsx'
import ProfileEditPage from './pages/ProfileEditPage'
import DesktopProfileEditPage from './pages/DesktopProfileEditPage.jsx'
import SettingsPage from './pages/SettingsPage'
import DesktopSettingsPage from './pages/DesktopSettingsPage.jsx'
import DesktopSupportPage from './pages/DesktopSupportPage.jsx'
import SupportPage from './pages/SupportPage.jsx'
import ActivityDashboardPage from './pages/ActivityDashboardPage'
import OAuthCallback from './components/OAuthCallback'
import ResetPasswordPage from './pages/ResetPasswordPage'
import LandingPage from './pages/LandingPage'
import LegalPage from './pages/LegalPage.tsx'


function App() {
  const [currentScreen, setCurrentScreen] = useState('login')
  const navigate = useNavigate()
  const location = useLocation()
  const { isDesktop } = useDeviceType()

  // Security: Extract and clean authentication tokens from URL, but skip OAuth callback route
  // The OAuthCallback component handles cleaning after Supabase processes tokens
  useEffect(() => {
    // Don't clean on OAuth callback route - let OAuthCallback component handle it
    if (location.pathname === '/auth/callback') {
      return
    }
    
    const tokens = extractAndCleanAuthTokens()
    if (tokens) {
      console.log('Security: Authentication tokens detected and cleaned from URL')
    }
  }, [location.pathname, location.search, location.hash])

  // Synchronize currentScreen with current route
  useEffect(() => {
    if (location.pathname === '/') {
      return // Don't set currentScreen for landing page
    }
    // Extract base path (without params)
    const path = location.pathname.substring(1).split('/')[0] || 'login'
    setCurrentScreen(path)
  }, [location.pathname])

  const handleScreenChange = (screen) => {
    setCurrentScreen(screen)
    navigate(`/${screen}`)
  }

  // Determine whether to show bottom navigation
  const showBottomNav = !['onboarding', 'login', 'reset-password', ''].includes(currentScreen) && !currentScreen.startsWith('chat-detail')
  // Only use minimal layout for login, reset-password, and auth callback pages
  const desktopMinimal = ['login', 'reset-password'].includes(currentScreen) || currentScreen.startsWith('auth/callback')

  // Don't wrap landing or legal pages in app layouts
  if (location.pathname === '/') {
    return <LandingPage />
  }

  if (location.pathname.startsWith('/legal')) {
    return <LegalPage />
  }

  const routes = (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<OAuthCallback />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/legal" element={<LegalPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/home" element={isDesktop ? <DesktopHomePage /> : <HomePage />} />
        <Route path="/:nickname/startup/:startup_name" element={isDesktop ? <DesktopStartupDetailPage /> : <StartupDetailPage />} />
        <Route path="/startup/:id" element={isDesktop ? <DesktopStartupDetailPage /> : <StartupDetailPage />} />
        <Route path="/saved" element={isDesktop ? <DesktopSavedPage /> : <SavedPage />} />
        <Route path="/notifications" element={isDesktop ? <DesktopNotificationsPage /> : <NotificationsPage />} />
        <Route path="/chat" element={isDesktop ? <DesktopChatPage /> : <ChatPage />} />
        <Route path="/profile/edit" element={isDesktop ? <DesktopProfileEditPage /> : <ProfileEditPage />} />
        <Route path="/profile/:nickname" element={<PublicProfilePage />} />
        <Route path="/profile/:id" element={<PublicProfilePage />} />
        <Route path="/profile" element={isDesktop ? <DesktopProfilePage /> : <ProfilePage />} />
        <Route path="/settings" element={isDesktop ? <DesktopSettingsPage /> : <SettingsPage />} />
        <Route path="/support" element={isDesktop ? <DesktopSupportPage /> : <SupportPage />} />
        <Route path="/activity-dashboard" element={<ActivityDashboardPage />} />
        <Route path="/add" element={isDesktop ? <DesktopAddPage /> : <AddPage />} />
        <Route path="/filters" element={<FiltersPage />} />
        <Route path="/chat-detail/:chatId" element={isDesktop ? <DesktopChatDetailPage /> : <ChatDetailPage />} />
        <Route path="/chat-detail/:nickname" element={isDesktop ? <DesktopChatDetailPage /> : <ChatDetailPage />} />
        <Route path="/chat-detail/:nickname/:startup_name" element={isDesktop ? <DesktopChatDetailPage /> : <ChatDetailPage />} />
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
      <Analytics />
    </FiltersProvider>
  )
}

export default App

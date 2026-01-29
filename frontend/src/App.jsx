import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { NotificationsProvider } from './contexts/NotificationsContext'
import Layout from './components/Layout'
import PlatformLayout from './components/PlatformLayout'
import AdminLayout from './components/admin/AdminLayout'
import PrivateRoute from './components/PrivateRoute'
import LessonPage from './pages/LessonPage'
import CoachingPage from './pages/CoachingPage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import AdminLoginPage from './pages/admin/AdminLoginPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminCommentsPage from './pages/admin/AdminCommentsPage'
import AdminCoursesPage from './pages/admin/AdminCoursesPage'
import AdminCoachingReservationsPage from './pages/admin/AdminCoachingReservationsPage'
import AdminCoachingApplicationsPage from './pages/admin/AdminCoachingApplicationsPage'
import AdminRessourcesPdfPage from './pages/admin/AdminRessourcesPdfPage'
import AdminPartenairesPage from './pages/admin/AdminPartenairesPage'
import AdminSettingsPage from './pages/admin/AdminSettingsPage'
import CoachingApplicationForm from './pages/CoachingApplicationForm'
import CommentsPage from './pages/CommentsPage'
import LandingPage from './pages/LandingPage'
import ProductsPage from './pages/ProductsPage'
import ValentineWinnersPage from './pages/ValentineWinnersPage'
import GenerateurPubPage from './pages/GenerateurPubPage'
import CommunautePage from './pages/CommunautePage'
import PaymentSuccessPage from './pages/PaymentSuccessPage'
import PaymentFailedPage from './pages/PaymentFailedPage'
import CheckoutPage from './pages/CheckoutPage'
import HomePage from './pages/HomePage'
import MobileHomePage from './pages/MobileHomePage'
import CoursesPage from './pages/CoursesPage'
import RessourcesPdfPage from './pages/RessourcesPdfPage'
import PartenairesPage from './pages/PartenairesPage'
import PartenairesCategoryPage from './pages/PartenairesCategoryPage'
import PartenaireProfilePage from './pages/PartenaireProfilePage'
import RecrutementPage from './pages/RecrutementPage'
import FileManagerPage from './pages/FileManagerPage'
import AndromedaAdsAnalyzerPage from './pages/AndromedaAdsAnalyzerPage'
import AIAdsAnalyzerPage from './pages/AIAdsAnalyzerPage'
import ConnectFacebook from './pages/ConnectFacebook'
import CourseRouter from './pages/CourseRouter'
import ChatbotPage from './pages/ChatbotPage'
import VideoShowcasePage from './pages/VideoShowcasePage'
import TestNotificationsPage from './pages/TestNotificationsPage'
import LiveReplaysPage from './pages/LiveReplaysPage'
import { lessons } from './data/lessons'
import { useEffect, useState } from 'react'
import MobileBottomNav from './components/mobile/MobileBottomNav'

// Composant pour nettoyer l'URL des anciens paramètres token/user
function CleanUrlRedirect() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const hasTokenParam = location.search.includes('token=')
    const hasUserParam = location.search.includes('user=')

    // Si l'URL contient des paramètres token ou user, les supprimer
    if (hasTokenParam || hasUserParam) {
      const cleanPath = location.pathname
      console.log('🧹 Nettoyage de l\'URL - suppression des paramètres token/user')
      navigate(cleanPath, { replace: true })
    }
  }, [location, navigate])

  return null
}

function ReferralCapture() {
  const location = useLocation()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const ref = params.get('ref')
    if (!ref) return
    const normalized = ref.trim().toLowerCase()
    if (!/^[a-f0-9]{8,20}$/.test(normalized)) return
    localStorage.setItem('referral_code', normalized)
  }, [location.search])

  return null
}

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    return window.matchMedia(`(max-width: ${breakpoint - 1}px)`).matches
  })

  useEffect(() => {
    if (!window.matchMedia) return undefined
    const media = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    const handler = (event) => setIsMobile(event.matches)
    setIsMobile(media.matches)

    if (media.addEventListener) {
      media.addEventListener('change', handler)
    } else {
      media.addListener(handler)
    }

    return () => {
      if (media.removeEventListener) {
        media.removeEventListener('change', handler)
      } else {
        media.removeListener(handler)
      }
    }
  }, [breakpoint])

  return isMobile
}

function HomeSwitcher() {
  const { isAuthenticated } = useAuth()
  const isMobile = useIsMobile()

  if (isMobile && isAuthenticated) {
    return (
      <PlatformLayout showFooter={false} showChatbot={false}>
        <MobileHomePage />
      </PlatformLayout>
    )
  }

  return (
    <PlatformLayout>
      <HomePage />
    </PlatformLayout>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationsProvider>
          <Router
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true
            }}
          >
            <CleanUrlRedirect />
            <ReferralCapture />
            <Routes>
          <Route path="/chat" element={<ChatbotPage />} />
          {/* Routes publiques avec PlatformLayout (Header + Footer) */}
          <Route path="/login" element={<PlatformLayout><LoginPage /></PlatformLayout>} />
          <Route path="/landing" element={<PlatformLayout><LandingPage /></PlatformLayout>} />
          <Route path="/payment-success" element={<PlatformLayout><PaymentSuccessPage /></PlatformLayout>} />
          <Route path="/payment-failed" element={<PlatformLayout><PaymentFailedPage /></PlatformLayout>} />
          <Route path="/safitech.shop/checkout/:checkoutId" element={<PlatformLayout><CheckoutPage /></PlatformLayout>} />
          <Route path="/checkout/:checkoutId" element={<PlatformLayout><CheckoutPage /></PlatformLayout>} />
          
          {/* Routes avec PlatformLayout (Header + Footer) */}
          <Route path="/" element={<HomeSwitcher />} />
          <Route path="/home" element={<HomeSwitcher />} />
          <Route path="/cours" element={<PlatformLayout><CoursesPage /></PlatformLayout>} />
          <Route path="/ressources-pdf" element={<PlatformLayout><RessourcesPdfPage /></PlatformLayout>} />
          <Route path="/produits-gagnants" element={<PlatformLayout><ProductsPage /></PlatformLayout>} />
          <Route path="/winners-st-valentin" element={<PlatformLayout><ValentineWinnersPage /></PlatformLayout>} />
          <Route path="/generateur-pub" element={<PlatformLayout><GenerateurPubPage /></PlatformLayout>} />
          <Route path="/partenaires" element={<PlatformLayout><PartenairesPage /></PlatformLayout>} />
          <Route path="/partenaires/categorie/:domaine" element={<PlatformLayout><PartenairesCategoryPage /></PlatformLayout>} />
          <Route path="/coaching-application" element={<PlatformLayout><CoachingApplicationForm /></PlatformLayout>} />
          <Route
            path="/partenaires/:id"
            element={
              <PlatformLayout showHeader={false} showFooter={false} showChatbot={false}>
                <PartenaireProfilePage />
              </PlatformLayout>
            }
          />
          <Route path="/recrutement" element={<PlatformLayout><RecrutementPage /></PlatformLayout>} />
          <Route path="/analyseur-ads" element={<PlatformLayout><AndromedaAdsAnalyzerPage /></PlatformLayout>} />
          <Route path="/analyseur-ia" element={<PlatformLayout><AIAdsAnalyzerPage /></PlatformLayout>} />
          <Route
            path="/replays-lives"
            element={
              <PlatformLayout>
                <LiveReplaysPage />
              </PlatformLayout>
            }
          />
          <Route path="/communaute" element={<PlatformLayout><CommunautePage /></PlatformLayout>} />
          <Route path="/profil" element={<PlatformLayout><PrivateRoute><ProfilePage /></PrivateRoute></PlatformLayout>} />
          <Route path="/mes-fichiers" element={<PlatformLayout><PrivateRoute><FileManagerPage /></PrivateRoute></PlatformLayout>} />
          <Route path="/commentaires" element={<PlatformLayout><PrivateRoute><CommentsPage /></PrivateRoute></PlatformLayout>} />
          <Route path="/connect-facebook" element={<PlatformLayout><PrivateRoute><ConnectFacebook /></PrivateRoute></PlatformLayout>} />
          <Route path="/test-notifications" element={<PlatformLayout><PrivateRoute><TestNotificationsPage /></PrivateRoute></PlatformLayout>} />
          <Route path="/videos-guides" element={<VideoShowcasePage />} />
          
          {/* Routes cours avec PlatformLayout (Header + Footer) et Layout (sidebar) */}
          <Route
            path="/course/:slug/*"
            element={
              <PlatformLayout>
                <Layout>
                  <CourseRouter />
                </Layout>
              </PlatformLayout>
            }
          />
          
          {/* Routes legacy pour compatibilité */}
          <Route path="/dashboard" element={<Navigate to="/course/facebook-ads/dashboard" replace />} />
          <Route path="/jour-2" element={<Navigate to="/course/facebook-ads/jour-2" replace />} />
          <Route path="/jour-3" element={<Navigate to="/course/facebook-ads/jour-3" replace />} />
          <Route path="/jour-4" element={<Navigate to="/course/facebook-ads/jour-4" replace />} />
          <Route path="/jour-5" element={<Navigate to="/course/facebook-ads/jour-5" replace />} />
          <Route path="/jour-6" element={<Navigate to="/course/facebook-ads/jour-6" replace />} />
          <Route path="/jour-7" element={<Navigate to="/course/facebook-ads/jour-7" replace />} />
          <Route path="/jour-8" element={<Navigate to="/course/facebook-ads/jour-8" replace />} />

          {/* Routes admin */}
          <Route path="/admin/login" element={<PlatformLayout><AdminLoginPage /></PlatformLayout>} />
          <Route path="/admin/*" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="courses" element={<AdminCoursesPage />} />
            <Route path="coaching-reservations" element={<AdminCoachingReservationsPage />} />
            <Route path="coaching-applications" element={<AdminCoachingApplicationsPage />} />
            <Route path="ressources-pdf" element={<AdminRessourcesPdfPage />} />
            <Route path="partenaires" element={<AdminPartenairesPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="comments" element={<AdminCommentsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>
        </Routes>
        <MobileBottomNav />
      </Router>
        </NotificationsProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App


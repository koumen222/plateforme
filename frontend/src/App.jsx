import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
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
import AdminRessourcesPdfPage from './pages/admin/AdminRessourcesPdfPage'
import CommentsPage from './pages/CommentsPage'
import LandingPage from './pages/LandingPage'
import ProductsPage from './pages/ProductsPage'
import GenerateurPubPage from './pages/GenerateurPubPage'
import CommunautePage from './pages/CommunautePage'
import PaymentSuccessPage from './pages/PaymentSuccessPage'
import PaymentFailedPage from './pages/PaymentFailedPage'
import CheckoutPage from './pages/CheckoutPage'
import HomePage from './pages/HomePage'
import CoursesPage from './pages/CoursesPage'
import RessourcesPdfPage from './pages/RessourcesPdfPage'
import CourseRouter from './pages/CourseRouter'
import { lessons } from './data/lessons'
import { useEffect } from 'react'

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

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <CleanUrlRedirect />
        <Routes>
          {/* Routes publiques avec PlatformLayout (Header + Footer) */}
          <Route path="/login" element={<PlatformLayout><LoginPage /></PlatformLayout>} />
          <Route path="/landing" element={<PlatformLayout><LandingPage /></PlatformLayout>} />
          <Route path="/payment-success" element={<PlatformLayout><PaymentSuccessPage /></PlatformLayout>} />
          <Route path="/payment-failed" element={<PlatformLayout><PaymentFailedPage /></PlatformLayout>} />
          <Route path="/safitech.shop/checkout/:checkoutId" element={<PlatformLayout><CheckoutPage /></PlatformLayout>} />
          <Route path="/checkout/:checkoutId" element={<PlatformLayout><CheckoutPage /></PlatformLayout>} />
          
          {/* Routes avec PlatformLayout (Header + Footer) */}
          <Route path="/" element={<PlatformLayout><HomePage /></PlatformLayout>} />
          <Route path="/home" element={<PlatformLayout><HomePage /></PlatformLayout>} />
          <Route path="/cours" element={<PlatformLayout><CoursesPage /></PlatformLayout>} />
          <Route path="/ressources-pdf" element={<PlatformLayout><RessourcesPdfPage /></PlatformLayout>} />
          <Route path="/produits-gagnants" element={<PlatformLayout><ProductsPage /></PlatformLayout>} />
          <Route path="/generateur-pub" element={<PlatformLayout><GenerateurPubPage /></PlatformLayout>} />
          <Route path="/communaute" element={<PlatformLayout><CommunautePage /></PlatformLayout>} />
          <Route path="/profil" element={<PlatformLayout><PrivateRoute><ProfilePage /></PrivateRoute></PlatformLayout>} />
          <Route path="/commentaires" element={<PlatformLayout><PrivateRoute><CommentsPage /></PrivateRoute></PlatformLayout>} />
          
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
            <Route path="ressources-pdf" element={<AdminRessourcesPdfPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="comments" element={<AdminCommentsPage />} />
            <Route path="settings" element={<div className="admin-page-header"><h1>Paramètres</h1><p>Page de paramètres à venir</p></div>} />
          </Route>
        </Routes>
      </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App


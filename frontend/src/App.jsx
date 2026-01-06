import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import Layout from './components/Layout'
import AdminLayout from './components/admin/AdminLayout'
import PrivateRoute from './components/PrivateRoute'
import LessonPage from './pages/LessonPage'
import CoachingPage from './pages/CoachingPage'
import LoginPage from './pages/LoginPage'
import AuthCallbackPage from './pages/AuthCallbackPage'
import ProfilePage from './pages/ProfilePage'
import AdminLoginPage from './pages/admin/AdminLoginPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminCommentsPage from './pages/admin/AdminCommentsPage'
import CommentsPage from './pages/CommentsPage'
import LandingPage from './pages/LandingPage'
import ProductsPage from './pages/ProductsPage'
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
          {/* Routes étudiant/formation */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute>
                <Layout>
                  <LessonPage lesson={lessons[0]} />
                </Layout>
              </PrivateRoute>
            } 
          />
          <Route
            path="/*"
            element={
              <Layout>
                <Routes>
                  <Route path="/" element={<LessonPage lesson={lessons[0]} />} />
                  <Route path="/produits-gagnants" element={<ProductsPage />} />
                  <Route path="/jour-2" element={<LessonPage lesson={lessons[1]} />} />
                  <Route path="/jour-3" element={<LessonPage lesson={lessons[2]} />} />
                  <Route path="/jour-4" element={<LessonPage lesson={lessons[3]} />} />
                  <Route path="/jour-5" element={<LessonPage lesson={lessons[4]} />} />
                  <Route path="/jour-6" element={<LessonPage lesson={lessons[5]} />} />
                  <Route path="/jour-7" element={<LessonPage lesson={lessons[6]} />} />
                  <Route path="/jour-8" element={<CoachingPage lesson={lessons[7]} />} />
                        <Route path="/profil" element={<ProfilePage />} />
                        <Route path="/commentaires" element={<CommentsPage />} />
                       </Routes>
                     </Layout>
                   }
                 />

          {/* Routes admin */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
                 <Route path="/admin/*" element={<AdminLayout />}>
                   <Route index element={<AdminDashboardPage />} />
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


import { useEffect } from 'react'
import { useNavigate, useLocation, Link, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import ThemeToggle from '../ThemeToggle'
import Chatbot from '../Chatbot'
import Footer from '../Footer'
import { FiBarChart2, FiBook, FiUsers, FiMessageSquare, FiSettings, FiShield, FiFileText, FiCalendar } from 'react-icons/fi'

export default function AdminLayout() {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Vérifier que l'utilisateur est connecté et est admin
    if (!isAuthenticated || !user) {
      navigate('/admin/login', { replace: true })
      return
    }

    if (user.role !== 'superadmin') {
      navigate('/admin/login', { replace: true })
    }
  }, [isAuthenticated, user, navigate])

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  if (!isAuthenticated || !user || user.role !== 'superadmin') {
    return null
  }

  const navItems = [
    { path: '/admin', label: 'Tableau de bord', icon: FiBarChart2 },
    { path: '/admin/courses', label: 'Cours', icon: FiBook },
    { path: '/admin/coaching-reservations', label: 'Coaching', icon: FiCalendar },
    { path: '/admin/ressources-pdf', label: 'Ressources PDF', icon: FiFileText },
    { path: '/admin/users', label: 'Utilisateurs', icon: FiUsers },
    { path: '/admin/comments', label: 'Commentaires', icon: FiMessageSquare },
    { path: '/admin/settings', label: 'Paramètres', icon: FiSettings }
  ]

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header moderne avec gradient */}
      <header className="bg-accent text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 lg:h-20">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <FiShield className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-lg lg:text-xl font-bold flex items-center gap-2">
                    Administration
                  </h1>
                  <span className="text-xs text-white/80">Panel de contrôle</span>
                </div>
              </div>
              <span className="hidden md:flex px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold items-center gap-2">
                <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                Super Admin
              </span>
            </div>
            <div className="flex items-center gap-3 lg:gap-4">
              <ThemeToggle />
              <div className="hidden lg:block text-right border-r border-white/20 pr-4">
                <div className="text-sm font-semibold">
                  {user.name?.trim() || user.email || 'Admin'}
                </div>
                <div className="text-xs text-white/80">{user.email}</div>
              </div>
              <button 
                onClick={handleLogout} 
                className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2"
              >
                <span className="hidden sm:inline">Déconnexion</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation moderne */}
      <nav className="bg-card border-b border-theme shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ul className="flex gap-1 overflow-x-auto scrollbar-hide">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || 
                (item.path === '/admin' && location.pathname === '/admin') ||
                (item.path !== '/admin' && location.pathname.startsWith(item.path))
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-all duration-200 border-b-2 relative ${
                      isActive
                        ? 'text-accent border-accent bg-accent/5'
                        : 'text-secondary border-transparent hover:text-primary hover:bg-secondary'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 ${isActive ? 'text-accent' : ''}`} />
                    <span className="whitespace-nowrap">{item.label}</span>
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"></div>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </nav>

      {/* Main content avec padding amélioré */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <Outlet />
      </main>
      <Footer />
      <Chatbot />
    </div>
  )
}


import { useEffect } from 'react'
import { useNavigate, useLocation, Link, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import ThemeToggle from '../ThemeToggle'
import Chatbot from '../Chatbot'
import Footer from '../Footer'
import { FiBarChart2, FiBook, FiUsers, FiMessageSquare, FiSettings, FiShield } from 'react-icons/fi'

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
    { path: '/admin/users', label: 'Utilisateurs', icon: FiUsers },
    { path: '/admin/comments', label: 'Commentaires', icon: FiMessageSquare },
    { path: '/admin/settings', label: 'Paramètres', icon: FiSettings }
  ]

  return (
    <div className="min-h-screen bg-primary">
      <header className="bg-card border-b border-theme shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-primary flex items-center gap-2">
                <FiShield className="text-accent" />
                Administration
              </h1>
              <span className="px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-semibold">
                Super Administrateur
              </span>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <div className="text-right hidden md:block">
                <div className="text-sm font-semibold text-primary">
                  {user.name?.trim() || user.email || 'Admin'}
                </div>
                <div className="text-xs text-secondary">{user.email}</div>
                {user.phoneNumber && (
                  <div className="text-xs text-secondary">{user.phoneNumber}</div>
                )}
              </div>
              <button 
                onClick={handleLogout} 
                className="admin-btn admin-btn-md"
              >
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-card border-b border-theme">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ul className="flex gap-1 overflow-x-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path === '/admin' && location.pathname === '/admin')
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors border-b-2 ${
                      isActive
                        ? 'text-accent border-accent'
                        : 'text-secondary border-transparent hover:text-primary hover:border-theme'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      <Footer />
      <Chatbot />
    </div>
  )
}


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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-black dark:text-black flex items-center gap-2">
                <FiShield className="text-brand" />
                Administration
              </h1>
              <span className="px-3 py-1 bg-brand-100 dark:bg-brand-900/30 text-black dark:text-black rounded-full text-xs font-semibold">
              Super Administrateur
            </span>
          </div>
            <div className="flex items-center gap-4">
            <ThemeToggle />
              <div className="text-right hidden md:block">
                <div className="text-sm font-semibold text-black dark:text-black">
                  {user.name?.trim() || user.email || 'Admin'}
                </div>
                <div className="text-xs text-black dark:text-black">{user.email}</div>
              {user.phoneNumber && (
                  <div className="text-xs text-black dark:text-black">{user.phoneNumber}</div>
              )}
            </div>
              <button 
                onClick={handleLogout} 
                className="px-4 py-2 bg-brand text-white rounded-lg font-semibold hover:bg-brand-600 transition-colors text-sm"
              >
              Se déconnecter
            </button>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
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
                        ? 'text-brand dark:text-brand-400 border-brand dark:border-brand-400'
                        : 'text-black dark:text-black border-transparent hover:text-black dark:hover:text-black hover:border-gray-300 dark:hover:border-gray-600'
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


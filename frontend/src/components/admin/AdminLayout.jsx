import { useEffect } from 'react'
import { useNavigate, useLocation, Link, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import ThemeToggle from '../ThemeToggle'
import Chatbot from '../Chatbot'
import Footer from '../Footer'
import '../../styles/admin.css'

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
    { path: '/admin', label: 'Tableau de bord', icon: '📊' },
    { path: '/admin/courses', label: 'Cours', icon: '📚' },
    { path: '/admin/users', label: 'Utilisateurs', icon: '👥' },
    { path: '/admin/comments', label: 'Commentaires', icon: '💬' },
    { path: '/admin/settings', label: 'Paramètres', icon: '⚙️' }
  ]

  return (
    <div className="admin-layout">
      <header className="admin-header">
        <div className="admin-header-content">
          <div className="admin-header-left">
            <h1>🔐 Administration</h1>
            <span className="admin-role">
              Super Administrateur
            </span>
          </div>
          <div className="admin-header-right">
            <ThemeToggle />
            <div className="admin-user-info-header">
              <div className="admin-user-name-header">{user.name?.trim() || user.email || 'Admin'}</div>
              <div className="admin-user-email-header">{user.email}</div>
              {user.phoneNumber && (
                <div className="admin-user-phone-header">{user.phoneNumber}</div>
              )}
            </div>
            <button onClick={handleLogout} className="admin-logout-btn">
              Se déconnecter
            </button>
          </div>
        </div>
      </header>

      <nav className="admin-nav">
        <ul className="admin-nav-list">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`admin-nav-link ${location.pathname === item.path || (item.path === '/admin' && location.pathname === '/admin') ? 'active' : ''}`}
              >
                <span className="admin-nav-icon">{item.icon}</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <main className="admin-main">
        <Outlet />
      </main>
      <Footer />
      <Chatbot />
    </div>
  )
}


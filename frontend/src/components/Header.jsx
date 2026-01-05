import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import '../styles/header.css'

export default function Header() {
  const { isAuthenticated, user } = useAuth()
  const location = useLocation()

  return (
    <header className="app-header">
      <div className="header-container">
        <Link to="/" className="header-logo">
          <div className="logo-icon">🚀</div>
          <div className="logo-text">
            <span className="logo-brand">Ecom Starter</span>
            <span className="logo-tagline">Formation FB Ads</span>
          </div>
        </Link>

        <nav className="header-nav">
          {isAuthenticated && user ? (
            <Link 
              to="/profil" 
              className={`header-profile-link ${location.pathname === '/profil' ? 'active' : ''}`}
              title={user.name || user.email || 'Mon profil'}
            >
              <div className="profile-icon-wrapper">
                <div className="profile-icon">
                  {user.name ? user.name.charAt(0).toUpperCase() : user.email ? user.email.charAt(0).toUpperCase() : '👤'}
                </div>
                {user.status === 'active' && (
                  <span className="profile-status-badge" title="Compte actif">✓</span>
                )}
              </div>
              <span className="profile-name">{user.name || user.email || 'Profil'}</span>
            </Link>
          ) : (
            <Link 
              to="/login" 
              className="header-login-link"
            >
              <span className="login-icon">🔐</span>
              <span>Se connecter</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}


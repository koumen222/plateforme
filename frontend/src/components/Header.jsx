import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import ThemeToggle from './ThemeToggle'
import '../styles/header.css'

export default function Header() {
  const { isAuthenticated, user, logout } = useAuth()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const profileMenuRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    setShowProfileMenu(false)
    navigate('/login')
  }

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname === '/home'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <header className="platform-header">
      <div className="header-container">
        <Link to="/" className="header-logo">
          <span className="logo-icon">🎓</span>
          <span className="logo-text">Safitech Academy</span>
        </Link>

        <nav className="header-nav">
          <Link to="/" className={`nav-link ${isActive('/') && !isActive('/course') ? 'active' : ''}`}>
            Cours
          </Link>
          <Link to="/produits-gagnants" className={`nav-link ${isActive('/produits-gagnants') ? 'active' : ''}`}>
            Produits Gagnants
          </Link>
          <Link to="/generateur-pub" className={`nav-link ${isActive('/generateur-pub') ? 'active' : ''}`}>
            Générateur de Pub
          </Link>
          <Link to="/communaute" className={`nav-link ${isActive('/communaute') ? 'active' : ''}`}>
            Communauté
          </Link>
        </nav>

        <div className="header-actions">
          <ThemeToggle />
          
          {isAuthenticated ? (
            <div className="profile-menu-container" ref={profileMenuRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="profile-button"
              >
                <div className="profile-avatar">
                  {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="profile-name">{user?.name || user?.email?.split('@')[0]}</span>
                <svg 
                  className={`profile-arrow ${showProfileMenu ? 'open' : ''}`}
                  width="12" 
                  height="12" 
                  viewBox="0 0 12 12" 
                  fill="none"
                >
                  <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>

              {showProfileMenu && (
                <div className="profile-dropdown">
                  <div className="profile-dropdown-header">
                    <div className="profile-dropdown-name">{user?.name || 'Utilisateur'}</div>
                    <div className="profile-dropdown-email">{user?.email}</div>
                    <div className={`profile-dropdown-status ${user?.status === 'active' ? 'active' : 'pending'}`}>
                      {user?.status === 'active' ? 'Actif' : 'En attente'}
                    </div>
                  </div>
                  <div className="profile-dropdown-divider" />
                  <Link to="/profil" className="profile-dropdown-item" onClick={() => setShowProfileMenu(false)}>
                    <span>Mon profil</span>
                  </Link>
                  <Link to="/commentaires" className="profile-dropdown-item" onClick={() => setShowProfileMenu(false)}>
                    <span>Mes commentaires</span>
                  </Link>
                  <div className="profile-dropdown-divider" />
                  <button onClick={handleLogout} className="profile-dropdown-item logout">
                    <span>Déconnexion</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="header-login-btn">
              Se connecter
            </Link>
          )}

          <button
            className="mobile-menu-toggle"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>

      {showMobileMenu && (
        <div className="mobile-menu">
          <Link to="/" className="mobile-menu-item" onClick={() => setShowMobileMenu(false)}>
            Cours
          </Link>
          <Link to="/produits-gagnants" className="mobile-menu-item" onClick={() => setShowMobileMenu(false)}>
            Produits Gagnants
          </Link>
          <Link to="/generateur-pub" className="mobile-menu-item" onClick={() => setShowMobileMenu(false)}>
            Générateur de Pub
          </Link>
          <Link to="/communaute" className="mobile-menu-item" onClick={() => setShowMobileMenu(false)}>
            Communauté
          </Link>
          {isAuthenticated && (
            <>
              <div className="mobile-menu-divider" />
              <Link to="/profil" className="mobile-menu-item" onClick={() => setShowMobileMenu(false)}>
                Mon profil
              </Link>
              <Link to="/commentaires" className="mobile-menu-item" onClick={() => setShowMobileMenu(false)}>
                Mes commentaires
              </Link>
              <button 
                onClick={() => {
                  handleLogout()
                  setShowMobileMenu(false)
                }}
                className="mobile-menu-item logout"
              >
                Déconnexion
              </button>
            </>
          )}
        </div>
      )}
    </header>
  )
}

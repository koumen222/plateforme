import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import ThemeToggle from './ThemeToggle'
import MobileMenu from './MobileMenu'
import { FiMenu, FiUser } from 'react-icons/fi'

export default function Header() {
  const { isAuthenticated, user, logout } = useAuth()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
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
    setIsMobileMenuOpen(false)
    navigate('/login')
  }

  const toggleMobileMenu = () => {
    const newState = !isMobileMenuOpen
    setIsMobileMenuOpen(newState)
    if (newState) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
    document.body.style.overflow = ''
  }

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname === '/home'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <>
      {/* Bannière d'alerte */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-4 text-center text-sm font-medium">
        <p>
          Le couteau suisse de l'e-commerce en Afrique
        </p>
      </div>
      <header className="sticky top-0 z-[100] bg-primary border-b border-theme backdrop-blur-lg bg-opacity-95">
        <div className="container-startup">
          {/* Desktop Header */}
          <div className="hidden md:flex items-center h-16 lg:h-20">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0">
              <img src="/img/logo.svg" alt="Ecom Starter" className="h-8 lg:h-10 w-auto" />
            </Link>

            <nav className="flex items-center gap-0.5 xl:gap-1 overflow-x-auto scrollbar-none flex-1 justify-center mx-2 xl:mx-4 min-w-0">
              <Link 
                to="/" 
                className={`px-3 py-2 rounded-lg text-xs xl:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                  isActive('/') && !isActive('/course') 
                    ? 'bg-accent text-white' 
                    : 'text-primary hover:bg-secondary'
                }`}
              >
                Accueil
              </Link>
              <Link 
                to="/cours" 
                className={`px-3 py-2 rounded-lg text-xs xl:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                  isActive('/cours') 
                    ? 'bg-accent text-white' 
                    : 'text-primary hover:bg-secondary'
                }`}
              >
                Cours
              </Link>
              <Link 
                to="/ressources-pdf" 
                className={`px-3 py-2 rounded-lg text-xs xl:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                  isActive('/ressources-pdf') 
                    ? 'bg-accent text-white' 
                    : 'text-primary hover:bg-secondary'
                }`}
              >
                Ressources PDF
              </Link>
              <Link 
                to="/produits-gagnants" 
                className={`px-3 py-2 rounded-lg text-xs xl:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                  isActive('/produits-gagnants') 
                    ? 'bg-accent text-white' 
                    : 'text-primary hover:bg-secondary'
                }`}
              >
                Produits Gagnants
              </Link>
              <Link 
                to="/generateur-pub" 
                className={`px-3 py-2 rounded-lg text-xs xl:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                  isActive('/generateur-pub') 
                    ? 'bg-accent text-white' 
                    : 'text-primary hover:bg-secondary'
                }`}
              >
                Générateur de Pub
              </Link>
              <Link 
                to="/analyseur-ads" 
                className={`px-3 py-2 rounded-lg text-xs xl:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                  isActive('/analyseur-ads') 
                    ? 'bg-accent text-white' 
                    : 'text-primary hover:bg-secondary'
                }`}
              >
                Analyseur Ads
              </Link>
              <Link 
                to="/communaute" 
                className={`px-3 py-2 rounded-lg text-xs xl:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                  isActive('/communaute') 
                    ? 'bg-accent text-white' 
                    : 'text-primary hover:bg-secondary'
                }`}
              >
                Communauté
              </Link>
            </nav>

            <div className="flex items-center gap-3 lg:gap-4 flex-shrink-0">
              <ThemeToggle />
              
              {isAuthenticated ? (
                <div className="relative" ref={profileMenuRef}>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary transition-colors">
                    <Link 
                      to="/profil"
                      className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-semibold text-sm hover:opacity-80 transition-opacity"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                    </Link>
                    <Link
                      to="/profil"
                      className="hidden lg:inline text-sm font-medium text-primary hover:opacity-80 transition-opacity"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      {user?.name || user?.email?.split('@')[0]}
                    </Link>
                    <button
                      onClick={() => setShowProfileMenu(!showProfileMenu)}
                      className="hidden lg:flex items-center ml-1"
                      aria-label="Menu profil"
                      aria-expanded={showProfileMenu}
                      aria-haspopup="true"
                    >
                      <svg 
                        className={`w-4 h-4 text-primary transition-transform ${showProfileMenu ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  {showProfileMenu && (
                    <div 
                      className="absolute right-0 mt-2 w-64 bg-card rounded-xl shadow-xl border border-theme overflow-hidden z-50"
                      role="menu"
                      aria-label="Menu utilisateur"
                    >
                      <div className="p-4 border-b border-theme">
                        <div className="font-semibold text-primary">{user?.name || 'Utilisateur'}</div>
                        <div className="text-sm text-primary mt-1">{user?.email}</div>
                        <div className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-medium ${
                          user?.status === 'active' 
                            ? 'status-active' 
                            : 'status-pending'
                        }`}>
                          {user?.status === 'active' ? 'Actif' : 'En attente'}
                        </div>
                      </div>
                      <div className="py-1">
                        <Link 
                          to="/profil" 
                          className="block px-4 py-2 text-sm text-primary hover:bg-secondary transition-colors"
                          onClick={() => setShowProfileMenu(false)}
                        >
                          Mon profil
                        </Link>
                        <Link 
                          to="/commentaires" 
                          className="block px-4 py-2 text-sm text-primary hover:bg-secondary transition-colors"
                          onClick={() => setShowProfileMenu(false)}
                        >
                          Mes commentaires
                        </Link>
                      </div>
                      <div className="border-t border-theme">
                        <button 
                          onClick={handleLogout} 
                          className="btn-primary w-full text-left px-4 py-2 text-sm font-medium"
                        >
                          Déconnexion
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link 
                  to="/login" 
                  className="btn-primary inline-flex items-center px-4 py-2 text-sm shadow-sm"
                >
                  Se connecter
                </Link>
              )}
            </div>
          </div>

          {/* Mobile Header */}
          <div className="md:hidden flex items-center justify-between h-14 relative">
            {/* Hamburger à gauche */}
            <button
              onClick={toggleMobileMenu}
              className="flex items-center justify-center p-2 rounded-lg hover:bg-secondary transition-colors z-10"
              aria-label="Menu mobile"
            >
              <FiMenu className="w-6 h-6 text-primary" />
            </button>

            {/* Logo centré absolu */}
            <Link 
              to="/" 
              className="absolute left-1/2 transform -translate-x-1/2 flex items-center hover:opacity-80 transition-opacity"
            >
              <img src="/img/logo.svg" alt="Ecom Starter" className="h-7 w-auto" />
            </Link>

            {/* Icône compte à droite */}
            {isAuthenticated ? (
              <Link
                to="/profil"
                className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center font-semibold text-sm hover:opacity-80 transition-opacity"
                aria-label="Mon profil"
              >
                {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
              </Link>
            ) : (
              <Link
                to="/login"
                className="flex items-center justify-center p-2 rounded-lg hover:bg-secondary transition-colors"
                aria-label="Se connecter"
              >
                <FiUser className="w-6 h-6 text-primary" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Menu mobile drawer */}
      <MobileMenu isOpen={isMobileMenuOpen} onClose={closeMobileMenu} />
    </>
  )
}
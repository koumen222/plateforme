import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import ThemeToggle from './ThemeToggle'
import MobileMenu from './MobileMenu'
import { FiShoppingBag, FiMenu, FiUser } from 'react-icons/fi'

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
      <header className="sticky top-0 z-[100] bg-primary border-b border-theme backdrop-blur-lg bg-opacity-95">
        <div className="container-startup">
          {/* Desktop Header */}
          <div className="hidden md:flex items-center justify-between h-16 lg:h-20">
            <Link to="/" className="flex items-center gap-2 text-primary font-semibold text-lg lg:text-xl hover:opacity-80 transition-opacity">
              <FiShoppingBag className="w-6 h-6 lg:w-7 lg:h-7" />
              <span>Ecom Starter</span>
            </Link>

            <nav className="flex items-center gap-1 xl:gap-2">
              <Link 
                to="/" 
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive('/') && !isActive('/course') 
                    ? 'bg-accent text-white' 
                    : 'text-primary hover:bg-secondary'
                }`}
              >
                Accueil
              </Link>
              <Link 
                to="/cours" 
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive('/cours') 
                    ? 'bg-accent text-white' 
                    : 'text-primary hover:bg-secondary'
                }`}
              >
                Cours
              </Link>
              <Link 
                to="/produits-gagnants" 
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive('/produits-gagnants') 
                    ? 'bg-accent text-white' 
                    : 'text-primary hover:bg-secondary'
                }`}
              >
                Produits Gagnants
              </Link>
              <Link 
                to="/generateur-pub" 
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive('/generateur-pub') 
                    ? 'bg-accent text-white' 
                    : 'text-primary hover:bg-secondary'
                }`}
              >
                Générateur de Pub
              </Link>
              <Link 
                to="/communaute" 
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive('/communaute') 
                    ? 'bg-accent text-white' 
                    : 'text-primary hover:bg-secondary'
                }`}
              >
                Communauté
              </Link>
            </nav>

            <div className="flex items-center gap-3 lg:gap-4">
              <ThemeToggle />
              
              {isAuthenticated ? (
                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-semibold text-sm">
                      {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="hidden lg:inline text-sm font-medium text-primary">
                      {user?.name || user?.email?.split('@')[0]}
                    </span>
                    <svg 
                      className={`hidden lg:block w-4 h-4 text-primary transition-transform ${showProfileMenu ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-card rounded-xl shadow-xl border border-theme overflow-hidden z-50">
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
              className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2 text-primary font-semibold text-base hover:opacity-80 transition-opacity"
            >
              <FiShoppingBag className="w-5 h-5" />
              <span>Ecom Starter</span>
            </Link>

            {/* Icône compte à droite */}
            {isAuthenticated ? (
              <div className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center font-semibold text-sm">
                {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
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
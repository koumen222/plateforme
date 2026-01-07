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
      <header className="sticky top-0 z-[100] bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 backdrop-blur-lg bg-opacity-95">
        <div className="container-startup">
          {/* Desktop Header */}
          <div className="hidden md:flex items-center justify-between h-16 lg:h-20">
            <Link to="/" className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold text-lg lg:text-xl hover:opacity-80 transition-opacity">
              <FiShoppingBag className="w-6 h-6 lg:w-7 lg:h-7" />
              <span>Ecom Starter</span>
            </Link>

            <nav className="flex items-center gap-1 xl:gap-2">
              <Link 
                to="/" 
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive('/') && !isActive('/course') 
                    ? 'bg-brand text-white' 
                    : 'text-black dark:text-black hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                Accueil
              </Link>
              <Link 
                to="/cours" 
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive('/cours') 
                    ? 'bg-brand text-white' 
                    : 'text-black dark:text-black hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                Cours
              </Link>
              <Link 
                to="/produits-gagnants" 
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive('/produits-gagnants') 
                    ? 'bg-brand text-white' 
                    : 'text-black dark:text-black hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                Produits Gagnants
              </Link>
              <Link 
                to="/generateur-pub" 
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive('/generateur-pub') 
                    ? 'bg-brand text-white' 
                    : 'text-black dark:text-black hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                Générateur de Pub
              </Link>
              <Link 
                to="/communaute" 
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive('/communaute') 
                    ? 'bg-brand text-white' 
                    : 'text-black dark:text-black hover:bg-gray-100 dark:hover:bg-gray-800'
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
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center font-semibold text-sm">
                      {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="hidden lg:inline text-sm font-medium text-black dark:text-black">
                      {user?.name || user?.email?.split('@')[0]}
                    </span>
                    <svg 
                      className={`hidden lg:block w-4 h-4 text-black transition-transform ${showProfileMenu ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="font-semibold text-black dark:text-black">{user?.name || 'Utilisateur'}</div>
                        <div className="text-sm text-black dark:text-black mt-1">{user?.email}</div>
                        <div className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-medium ${
                          user?.status === 'active' 
                            ? 'bg-gray-100 dark:bg-gray-700 text-black dark:text-black' 
                            : 'bg-gray-100 dark:bg-gray-700 text-black dark:text-black'
                        }`}>
                          {user?.status === 'active' ? 'Actif' : 'En attente'}
                        </div>
                      </div>
                      <div className="py-1">
                        <Link 
                          to="/profil" 
                          className="block px-4 py-2 text-sm text-black dark:text-black hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          onClick={() => setShowProfileMenu(false)}
                        >
                          Mon profil
                        </Link>
                        <Link 
                          to="/commentaires" 
                          className="block px-4 py-2 text-sm text-black dark:text-black hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          onClick={() => setShowProfileMenu(false)}
                        >
                          Mes commentaires
                        </Link>
                      </div>
                      <div className="border-t border-gray-200 dark:border-gray-700">
                        <button 
                          onClick={handleLogout} 
                          className="w-full text-left px-4 py-2 text-sm bg-brand text-white rounded-lg hover:bg-brand-600 transition-colors font-medium"
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
                  className="inline-flex items-center px-4 py-2 bg-brand text-white font-semibold rounded-xl hover:bg-brand-600 transition-colors text-sm shadow-sm"
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
              className="flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors z-10"
              aria-label="Menu mobile"
            >
              <FiMenu className="w-6 h-6 text-gray-900 dark:text-white" />
            </button>

            {/* Logo centré absolu */}
            <Link 
              to="/" 
              className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2 text-gray-900 dark:text-white font-semibold text-base hover:opacity-80 transition-opacity"
            >
              <FiShoppingBag className="w-5 h-5" />
              <span>Ecom Starter</span>
            </Link>

            {/* Icône compte à droite */}
            {isAuthenticated ? (
              <div className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center font-semibold text-sm">
                {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Se connecter"
              >
                <FiUser className="w-6 h-6 text-gray-900 dark:text-white" />
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

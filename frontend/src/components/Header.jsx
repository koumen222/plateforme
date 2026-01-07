import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import ThemeToggle from './ThemeToggle'
import { FiShoppingBag } from 'react-icons/fi'
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
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 backdrop-blur-lg bg-opacity-95">
      <div className="container-startup">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <Link to="/" className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold text-lg lg:text-xl hover:opacity-80 transition-opacity">
            <FiShoppingBag className="w-6 h-6 lg:w-7 lg:h-7" />
            <span className="hidden sm:inline">Ecom Starter</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            <Link 
              to="/" 
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive('/') && !isActive('/course') 
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              Accueil
            </Link>
            <Link 
              to="/cours" 
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive('/cours') 
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              Cours
            </Link>
            <Link 
              to="/produits-gagnants" 
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive('/produits-gagnants') 
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              Produits Gagnants
            </Link>
            <Link 
              to="/generateur-pub" 
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive('/generateur-pub') 
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              Générateur de Pub
            </Link>
            <Link 
              to="/communaute" 
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive('/communaute') 
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
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
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm">
                    {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="hidden lg:inline text-sm font-medium text-gray-700 dark:text-gray-300">
                    {user?.name || user?.email?.split('@')[0]}
                  </span>
                  <svg 
                    className={`w-4 h-4 text-gray-500 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`}
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
                      <div className="font-semibold text-gray-900 dark:text-white">{user?.name || 'Utilisateur'}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{user?.email}</div>
                      <div className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-medium ${
                        user?.status === 'active' 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                          : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                      }`}>
                        {user?.status === 'active' ? 'Actif' : 'En attente'}
                      </div>
                    </div>
                    <div className="py-1">
                      <Link 
                        to="/profil" 
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        Mon profil
                      </Link>
                      <Link 
                        to="/commentaires" 
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        Mes commentaires
                      </Link>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-700">
                      <button 
                        onClick={handleLogout} 
                        className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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
                className="hidden sm:inline-flex items-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Se connecter
              </Link>
            )}

            <button
              className="lg:hidden flex flex-col gap-1.5 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              onClick={() => {
                setShowMobileMenu(!showMobileMenu)
                if (!showMobileMenu) {
                  document.body.style.overflow = 'hidden'
                } else {
                  document.body.style.overflow = ''
                }
              }}
              aria-label="Menu mobile"
            >
              <span className="w-5 h-0.5 bg-gray-900 dark:bg-white transition-all"></span>
              <span className="w-5 h-0.5 bg-gray-900 dark:bg-white transition-all"></span>
              <span className="w-5 h-0.5 bg-gray-900 dark:bg-white transition-all"></span>
            </button>
          </div>
        </div>
      </div>

      {showMobileMenu && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => {
              setShowMobileMenu(false)
              document.body.style.overflow = ''
            }}
          />
          <div className="fixed top-16 left-0 right-0 bottom-0 bg-white dark:bg-gray-900 z-50 overflow-y-auto lg:hidden border-t border-gray-200 dark:border-gray-800">
            <div className="container-startup py-4">
              <Link 
                to="/" 
                className="block px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium"
                onClick={() => {
                  setShowMobileMenu(false)
                  document.body.style.overflow = ''
                }}
              >
                Accueil
              </Link>
              <Link 
                to="/cours" 
                className="block px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium"
                onClick={() => {
                  setShowMobileMenu(false)
                  document.body.style.overflow = ''
                }}
              >
                Cours
              </Link>
              <Link 
                to="/produits-gagnants" 
                className="block px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium"
                onClick={() => {
                  setShowMobileMenu(false)
                  document.body.style.overflow = ''
                }}
              >
                Produits Gagnants
              </Link>
              <Link 
                to="/generateur-pub" 
                className="block px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium"
                onClick={() => {
                  setShowMobileMenu(false)
                  document.body.style.overflow = ''
                }}
              >
                Générateur de Pub
              </Link>
              <Link 
                to="/communaute" 
                className="block px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium"
                onClick={() => {
                  setShowMobileMenu(false)
                  document.body.style.overflow = ''
                }}
              >
                Communauté
              </Link>
              {isAuthenticated && (
                <>
                  <div className="h-px bg-gray-200 dark:bg-gray-700 my-2" />
                  <Link 
                    to="/profil" 
                    className="block px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium"
                    onClick={() => {
                      setShowMobileMenu(false)
                      document.body.style.overflow = ''
                    }}
                  >
                    Mon profil
                  </Link>
                  <Link 
                    to="/commentaires" 
                    className="block px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium"
                    onClick={() => {
                      setShowMobileMenu(false)
                      document.body.style.overflow = ''
                    }}
                  >
                    Mes commentaires
                  </Link>
                  <button 
                    onClick={() => {
                      setShowMobileMenu(false)
                      document.body.style.overflow = ''
                      handleLogout()
                    }}
                    className="w-full text-left px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium"
                  >
                    Déconnexion
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  )
}

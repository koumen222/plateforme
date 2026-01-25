import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { CONFIG } from '../config/config'
import ThemeToggle from './ThemeToggle'
import MobileMenu from './MobileMenu'
import { FiBell, FiMenu, FiMessageCircle, FiUser } from 'react-icons/fi'

export default function Header() {
  const { isAuthenticated, user, token, logout } = useAuth()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const [notificationsError, setNotificationsError] = useState('')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const notificationCount = notifications.length
  const messageCount = 1
  const profileMenuRef = useRef(null)
  const notificationRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false)
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!isAuthenticated || user?.status !== 'active' || !token) {
      setNotifications([])
      return
    }

    const fetchNotifications = async () => {
      setNotificationsLoading(true)
      setNotificationsError('')
      try {
        const response = await fetch(`${CONFIG.BACKEND_URL}/api/comments`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        if (!response.ok) {
          setNotificationsError('Impossible de charger les notifications.')
          setNotifications([])
          return
        }
        const data = await response.json()
        setNotifications(Array.isArray(data.comments) ? data.comments : [])
      } catch (error) {
        setNotificationsError('Impossible de charger les notifications.')
        setNotifications([])
      } finally {
        setNotificationsLoading(false)
      }
    }

    fetchNotifications()
  }, [isAuthenticated, user, token])

  const handleLogout = () => {
    logout()
    setShowProfileMenu(false)
    setShowNotifications(false)
    setIsMobileMenuOpen(false)
    navigate('/login')
  }

  const toggleNotifications = () => {
    setShowNotifications((prev) => !prev)
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


  const getMobileTitle = (pathname) => {
    if (pathname === '/' || pathname === '/home') return 'Accueil'
    if (pathname.startsWith('/cours') || pathname.startsWith('/course')) return 'Cours'
    if (pathname.startsWith('/ressources-pdf')) return 'Ressources PDF'
    if (pathname.startsWith('/produits-gagnants')) return 'Produits Gagnants'
    if (pathname.startsWith('/generateur-pub')) return 'Générateur de Pub'
    if (pathname.startsWith('/analyseur-ia')) return 'Analyseur IA'
    if (pathname.startsWith('/communaute')) return 'Communauté'
    if (pathname.startsWith('/profil')) return 'Profil'
    if (pathname.startsWith('/commentaires')) return 'Commentaires'
    if (pathname.startsWith('/chat')) return 'Messages'
    return 'Ecom Starter'
  }

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-[100] md:static">
        {/* Bannière d'alerte */}
        <div className="hidden md:block bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-4 text-center text-sm font-medium">
          <p>
            Le couteau suisse de l'e-commerce en Afrique
          </p>
        </div>
        <header className="bg-primary border-b border-theme backdrop-blur-lg bg-opacity-95 md:sticky md:top-0">
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
                to="/analyseur-ia" 
                className={`px-3 py-2 rounded-lg text-xs xl:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                  isActive('/analyseur-ia') 
                    ? 'bg-accent text-white' 
                    : 'text-primary hover:bg-secondary'
                }`}
              >
                Analyseur IA
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
          <div className="md:hidden">
            {isAuthenticated ? (
              <>
                <div className="flex items-center justify-between px-4 pt-3">
                  <button
                    onClick={toggleMobileMenu}
                    className="flex items-center justify-center rounded-xl bg-secondary p-2 text-primary transition-colors"
                    aria-label="Menu mobile"
                  >
                    <FiMenu className="h-5 w-5" />
                  </button>

                  <div className="text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-secondary">Ecom</p>
                    <h1 className="text-base font-semibold text-primary">{getMobileTitle(location.pathname)}</h1>
                  </div>

                  <div className="flex items-center gap-2">
                    <div ref={notificationRef} className="relative">
                      <button
                        type="button"
                        onClick={toggleNotifications}
                        className="relative flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-primary"
                        aria-label="Notifications"
                        aria-expanded={showNotifications}
                      >
                        <FiBell className="h-4 w-4" />
                        {notificationCount > 0 && (
                          <span className="absolute -right-1 -top-1 rounded-full border-2 border-white bg-red-500 px-1 py-0 text-[7px] font-semibold text-white">
                            {notificationCount > 99 ? '99+' : notificationCount}
                          </span>
                        )}
                      </button>
                      {showNotifications && (
                        <div className="absolute right-0 mt-2 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                            <p className="text-sm font-semibold text-slate-900">Notifications</p>
                            <Link
                              to="/commentaires"
                              className="text-xs font-semibold text-accent"
                              onClick={() => setShowNotifications(false)}
                            >
                              Voir tout
                            </Link>
                          </div>
                          <div className="max-h-72 overflow-auto">
                            {user?.status !== 'active' ? (
                              <div className="px-4 py-4 text-xs text-slate-500">
                                Compte en attente : les notifications seront disponibles une fois activé.
                              </div>
                            ) : notificationsLoading ? (
                              <div className="px-4 py-4 text-xs text-slate-500">Chargement...</div>
                            ) : notificationsError ? (
                              <div className="px-4 py-4 text-xs text-rose-600">{notificationsError}</div>
                            ) : notifications.length === 0 ? (
                              <div className="px-4 py-4 text-xs text-slate-500">Aucune notification pour le moment.</div>
                            ) : (
                              notifications.slice(0, 5).map((comment) => (
                                <Link
                                  key={comment._id}
                                  to="/commentaires"
                                  onClick={() => setShowNotifications(false)}
                                  className="block border-b border-slate-100 px-4 py-3 last:border-b-0 hover:bg-slate-50"
                                >
                                  <p className="text-xs font-semibold text-slate-900 line-clamp-1">
                                    {comment.lessonTitle ? `Commentaire • ${comment.lessonTitle}` : 'Nouveau commentaire'}
                                  </p>
                                  <p className="mt-1 text-[11px] text-slate-500 line-clamp-2">{comment.content}</p>
                                </Link>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <Link
                      to="/chat"
                      className="relative flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-primary"
                      aria-label="Messages"
                    >
                      <FiMessageCircle className="h-4 w-4" />
                      {messageCount > 0 && (
                        <span className="absolute -right-1 -top-1 rounded-full border-2 border-white bg-red-500 px-1 py-0 text-[7px] font-semibold text-white">
                          {messageCount > 99 ? '99+' : messageCount}
                        </span>
                      )}
                    </Link>
                    <Link
                      to="/profil"
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white"
                      aria-label="Mon profil"
                    >
                      {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                    </Link>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between px-4 py-3">
                <button
                  onClick={toggleMobileMenu}
                  className="flex items-center justify-center rounded-lg p-2 hover:bg-secondary transition-colors"
                  aria-label="Menu mobile"
                >
                  <FiMenu className="h-6 w-6 text-primary" />
                </button>

                <Link
                  to="/"
                  className="flex items-center hover:opacity-80 transition-opacity"
                >
                  <img src="/img/logo.svg" alt="Ecom Starter" className="h-7 w-auto" />
                </Link>

                <Link
                  to="/login"
                  className="flex items-center justify-center rounded-lg p-2 hover:bg-secondary transition-colors"
                  aria-label="Se connecter"
                >
                  <FiUser className="h-6 w-6 text-primary" />
                </Link>
              </div>
            )}
          </div>
          </div>
        </header>
      </div>
      <div className="h-[100px] md:hidden" aria-hidden="true" />

      {/* Menu mobile drawer */}
      <MobileMenu isOpen={isMobileMenuOpen} onClose={closeMobileMenu} />
    </>
  )
}
import { Link, useLocation, useParams } from 'react-router-dom'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { CONFIG } from '../config/config'
import ThemeToggle from './ThemeToggle'
import { FiMenu, FiX, FiMessageSquare } from 'react-icons/fi'
import axios from 'axios'

export default function Sidebar() {
  const location = useLocation()
  const { slug } = useParams()
  const slugFromPath = useMemo(() => {
    if (location.pathname.startsWith('/course/')) {
      return location.pathname.split('/')[2] || null
    }
    return null
  }, [location.pathname])

  const courseSlug = slug || slugFromPath || 'facebook-ads'
  const [isOpen, setIsOpen] = useState(false)
  const { isAuthenticated, user, token, logout, refreshUser } = useAuth()
  const [progress, setProgress] = useState(null)
  const [progressLoading, setProgressLoading] = useState(false)
  const [course, setCourse] = useState(null)
  const [lessons, setLessons] = useState([])
  const [loadingCourse, setLoadingCourse] = useState(true)
  const lastLoadedSlug = useRef(null)

  const toggleMenu = () => {
    const newState = !isOpen
    setIsOpen(newState)
    if (newState) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }

  // Fermer le menu au clic en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && window.innerWidth <= 768) {
        const sidebar = document.querySelector('.sidebar')
        const toggleBtn = document.querySelector('.mobile-menu-toggle')
        if (sidebar && !sidebar.contains(event.target) && toggleBtn && !toggleBtn.contains(event.target)) {
          setIsOpen(false)
          document.body.style.overflow = ''
        }
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const fetchProgress = useCallback(async () => {
    if (!token || user?.status !== 'active') {
      setProgress(null)
      return
    }
    
    setProgressLoading(true)
    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/progress`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setProgress(data.progress)
      } else {
        console.error('Erreur API progression:', response.status)
        setProgress(null)
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la progression:', error)
      setProgress(null)
    } finally {
      setProgressLoading(false)
    }
  }, [token, user?.status])

  // Charger le cours et ses leçons depuis la DB (uniquement si le slug change réellement)
  useEffect(() => {
    // Ne recharger que si le slug a vraiment changé
    if (lastLoadedSlug.current === courseSlug) {
      return
    }

    const loadCourse = async () => {
      try {
        setLoadingCourse(true)
        const response = await axios.get(`${CONFIG.BACKEND_URL}/api/courses/slug/${courseSlug}`)
        
        if (response.data.success) {
          setCourse(response.data.course)
          
          // Extraire toutes les leçons de tous les modules
          const allLessons = []
          if (response.data.course.modules) {
            response.data.course.modules.forEach((module) => {
              if (module.lessons) {
                module.lessons.forEach((lesson) => {
                  allLessons.push({
                    ...lesson,
                    moduleTitle: module.title
                  })
                })
              }
            })
          }
          setLessons(allLessons)
          lastLoadedSlug.current = courseSlug
        }
      } catch (error) {
        console.error('Erreur chargement cours:', error)
      } finally {
        setLoadingCourse(false)
      }
    }

    loadCourse()
  }, [courseSlug])

  useEffect(() => {
    if (isAuthenticated && user?.status === 'active' && token) {
      fetchProgress()
    } else {
      setProgress(null)
    }

    // Écouter les événements de mise à jour de progression
    const handleProgressUpdate = () => {
      if (isAuthenticated && user?.status === 'active' && token) {
        fetchProgress()
      }
    }

    // Écouter les changements de statut utilisateur
    const handleStatusChange = async () => {
      if (token && refreshUser) {
        try {
          const result = await refreshUser()
          if (result.success && result.statusChanged) {
            // Si le statut devient actif, charger la progression
            if (result.user.status === 'active' && token) {
              fetchProgress()
            } else {
              // Si le statut n'est plus actif, vider la progression
              setProgress(null)
            }
          }
          // Si refreshUser échoue mais qu'on a toujours un utilisateur, ne rien faire
          // (l'utilisateur reste connecté avec les données en cache)
        } catch (error) {
          console.error('Erreur lors du refresh utilisateur:', error)
          // Ne pas déconnecter l'utilisateur en cas d'erreur
        }
      }
    }

    window.addEventListener('progressUpdated', handleProgressUpdate)
    window.addEventListener('userStatusChanged', handleStatusChange)

    return () => {
      window.removeEventListener('progressUpdated', handleProgressUpdate)
      window.removeEventListener('userStatusChanged', handleStatusChange)
    }
  }, [isAuthenticated, user, token, fetchProgress, refreshUser])

  // Trouver la leçon active
  const activeLessonIndex = useMemo(() => {
    if (!lessons.length) return -1
    const activeLesson = lessons.find((lesson) => 
      location.pathname.includes(`/lesson/${lesson._id}`)
    )
    return activeLesson ? lessons.indexOf(activeLesson) : -1
  }, [lessons, location.pathname])

  return (
    <>
      {/* Menu compact mobile - affiché sous le header */}
      {location.pathname.startsWith('/course/') && (
        <div className="lg:hidden sticky top-16 z-30 bg-bg-secondary border-b border-border">
          <div className="container-startup py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-text-primary truncate mb-1">
                  {course?.title || (loadingCourse ? 'Chargement...' : 'Formation')}
                </h3>
                {isAuthenticated && user?.status === 'active' && progress && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-secondary">
                        {progress.progressPercentage || 0}% complété
                      </span>
                    </div>
                    <div className="h-1.5 bg-bg-hover rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-accent to-primary-400 rounded-full transition-all duration-300"
                        style={{ width: `${progress.progressPercentage || 0}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                {activeLessonIndex >= 0 && lessons.length > 0 && (
                  <div className="text-xs text-text-secondary mt-1">
                    Leçon {activeLessonIndex + 1} / {lessons.length}
                  </div>
                )}
              </div>
              <button 
                className="px-4 py-2 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent-hover transition-colors whitespace-nowrap"
                onClick={toggleMenu}
                aria-label="Voir les leçons"
              >
                Voir les leçons
              </button>
            </div>
          </div>
        </div>
      )}

      <button 
        className="lg:hidden fixed top-16 left-4 z-50 p-2 bg-bg-secondary rounded-lg border border-border text-text-primary hover:bg-bg-hover transition-colors"
        aria-label="Menu"
        onClick={toggleMenu}
      >
        <FiMenu className="w-6 h-6" />
      </button>
      <aside className={`fixed lg:static top-16 left-0 w-72 h-[calc(100vh-4rem)] bg-bg-secondary border-r border-border overflow-y-auto z-40 transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="p-6 border-b border-border">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <h1 className="text-lg font-bold text-text-primary mb-2">{course?.title || 'Formation'}</h1>
              <p className="text-sm text-text-secondary">{course?.description || 'Chargement...'}</p>
            </div>
            <button 
              className="lg:hidden p-2 text-text-primary hover:bg-bg-hover rounded-lg transition-colors"
              onClick={() => {
                setIsOpen(false)
                document.body.style.overflow = ''
              }}
              aria-label="Fermer le menu"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>
        <nav className="p-4">
          {loadingCourse ? (
            <div className="p-4 text-center text-text-secondary">Chargement...</div>
          ) : (
            <ul className="space-y-1">
              {lessons.map((lesson, index) => {
                const courseSlug = course?.slug || 'facebook-ads'
                const lessonPath = `/course/${courseSlug}/lesson/${lesson._id}`
                const isActive = location.pathname.includes(`/lesson/${lesson._id}`)
                
                return (
                  <li key={lesson._id}>
                    <Link
                      to={lessonPath}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                        isActive 
                          ? 'bg-accent text-white font-semibold' 
                          : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                      }`}
                      onClick={() => {
                        setIsOpen(false)
                        document.body.style.overflow = ''
                      }}
                    >
                      <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </span>
                      <span className="flex-1 truncate">{lesson.title}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </nav>

        {isAuthenticated && user?.status === 'active' && (
          <>
            <div className="px-4 py-2">
              <Link
                to="/commentaires"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  location.pathname === '/commentaires' 
                    ? 'bg-accent text-white font-semibold' 
                    : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                }`}
                onClick={() => setIsOpen(false)}
              >
                <FiMessageSquare /> Commentaires
              </Link>
            </div>
            <div className="px-4 py-2">
              <Link
                to="/produits-gagnants"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  location.pathname === '/produits-gagnants' 
                    ? 'bg-accent text-white font-semibold' 
                    : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                }`}
                onClick={() => setIsOpen(false)}
              >
                Produits Gagnants
              </Link>
            </div>
            <div className="px-4 py-2">
              <a
                href="/meta-sandbox/index.html"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Simulateur Ads
              </a>
            </div>
          </>
        )}
        
        {isAuthenticated && user?.status === 'active' && (
          <div className="p-4 border-t border-border">
            {progressLoading ? (
              <div className="text-center text-text-secondary text-sm py-2">Chargement...</div>
            ) : progress ? (
              <>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-text-primary">Ma Progression</span>
                  <span className="text-sm font-semibold text-accent">{progress.progressPercentage || 0}%</span>
                </div>
                <div className="h-2 bg-bg-hover rounded-full overflow-hidden mb-2">
                  <div 
                    className="h-full bg-gradient-to-r from-accent to-primary-400 rounded-full transition-all duration-300 shadow-sm"
                    style={{ width: `${progress.progressPercentage || 0}%` }}
                  ></div>
                </div>
                <div className="text-xs text-text-secondary text-center">
                  {progress.completedLessons || progress.completedCourses || 0} / {progress.totalLessons || 8} leçons complétées
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-text-primary">Ma Progression</span>
                  <span className="text-sm font-semibold text-accent">0%</span>
                </div>
                <div className="h-2 bg-bg-hover rounded-full overflow-hidden mb-2">
                  <div 
                    className="h-full bg-gradient-to-r from-accent to-primary-400 rounded-full transition-all duration-300"
                    style={{ width: '0%' }}
                  ></div>
                </div>
                <div className="text-xs text-text-secondary text-center">
                  0 / 8 leçons complétées
                </div>
              </>
            )}
          </div>
        )}

        <div className="p-4 border-t border-border">
          <ThemeToggle />
        </div>

        <div className="p-4 border-t border-border space-y-2">
          {isAuthenticated ? (
            <>
              <Link
                to="/profil"
                className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                  location.pathname === '/profil' 
                    ? 'bg-accent text-white font-semibold' 
                    : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                }`}
                onClick={() => setIsOpen(false)}
              >
                {user?.name?.trim() || user?.email || 'Mon Profil'}
              </Link>
              {user?.role === 'superadmin' && (
                <Link
                  to="/admin"
                  className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                    location.pathname.startsWith('/admin') 
                      ? 'bg-accent text-white font-semibold' 
                      : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  Administration
                </Link>
              )}
              <button
                onClick={() => {
                  logout()
                  setIsOpen(false)
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                Se déconnecter
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                  location.pathname === '/login' 
                    ? 'bg-accent text-white font-semibold' 
                    : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                }`}
                onClick={() => setIsOpen(false)}
              >
                Se connecter
              </Link>
              <Link
                to="/admin/login"
                className="block px-3 py-2 rounded-lg text-sm text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Espace Admin
              </Link>
            </>
          )}
        </div>
      </aside>
    </>
  )
}


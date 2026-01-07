import { Link, useLocation, useParams } from 'react-router-dom'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { CONFIG } from '../config/config'
import ThemeToggle from './ThemeToggle'
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

  const toggleMenu = () => setIsOpen(!isOpen)

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
        <div className="mobile-course-menu">
          <div className="mobile-course-menu-content">
            <div className="mobile-course-info">
              <h3 className="mobile-course-title">
                📚 {course?.title || (loadingCourse ? 'Chargement...' : 'Formation')}
              </h3>
              {isAuthenticated && user?.status === 'active' && progress && (
                <div className="mobile-course-progress">
                  <span className="mobile-progress-text">
                    {progress.progressPercentage || 0}% complété
                  </span>
                  <div className="mobile-progress-bar">
                    <div 
                      className="mobile-progress-bar-fill" 
                      style={{ width: `${progress.progressPercentage || 0}%` }}
                    ></div>
                  </div>
                </div>
              )}
              {activeLessonIndex >= 0 && lessons.length > 0 && (
                <div className="mobile-current-lesson">
                  Leçon {activeLessonIndex + 1} / {lessons.length}
                </div>
              )}
            </div>
            <button 
              className="mobile-view-lessons-btn"
              onClick={toggleMenu}
              aria-label="Voir les leçons"
            >
              <span>📖</span>
              <span>Voir les leçons</span>
            </button>
          </div>
        </div>
      )}

      <button 
        className="mobile-menu-toggle" 
        aria-label="Menu"
        onClick={toggleMenu}
      >
        ☰
      </button>
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div>
              <h1>📚 {course?.title || 'Formation'}</h1>
              <p>{course?.description || 'Chargement...'}</p>
            </div>
            <button 
              className="sidebar-close-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Fermer le menu"
            >
              ✕
            </button>
          </div>
        </div>
        <nav>
          {loadingCourse ? (
            <div style={{ padding: '1rem', textAlign: 'center' }}>Chargement...</div>
          ) : (
            <ul className="sidebar-nav">
              {lessons.map((lesson, index) => {
                const courseSlug = course?.slug || 'facebook-ads'
                const lessonPath = `/course/${courseSlug}/lesson/${lesson._id}`
                const isActive = location.pathname.includes(`/lesson/${lesson._id}`)
                
                return (
                  <li key={lesson._id}>
                    <Link
                      to={lessonPath}
                      className={isActive ? 'active' : ''}
                      onClick={() => setIsOpen(false)}
                    >
                      <span className="lesson-number">{index + 1}</span>
                      {lesson.title}
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </nav>

                 {isAuthenticated && user?.status === 'active' && (
                   <>
                     <div className="sidebar-comments-link">
                       <Link
                         to="/commentaires"
                         className={`sidebar-auth-link ${location.pathname === '/commentaires' ? 'active' : ''}`}
                         onClick={() => setIsOpen(false)}
                       >
                         💬 Commentaires
                       </Link>
                     </div>
                     <div className="sidebar-comments-link">
                       <Link
                         to="/produits-gagnants"
                         className={`sidebar-auth-link ${location.pathname === '/produits-gagnants' ? 'active' : ''}`}
                         onClick={() => setIsOpen(false)}
                       >
                         🏆 Produits Gagnants
                       </Link>
                     </div>
                     <div className="sidebar-comments-link">
                       <a
                         href="/meta-sandbox/index.html"
                         target="_blank"
                         rel="noopener noreferrer"
                         className="sidebar-auth-link"
                         onClick={() => setIsOpen(false)}
                       >
                         📊 Simulateur Ads
                       </a>
                     </div>
                   </>
                 )}
        
        {isAuthenticated && user?.status === 'active' && (
          <div className="sidebar-progress">
            {progressLoading ? (
              <div className="sidebar-progress-loading">Chargement...</div>
            ) : progress ? (
              <>
                <div className="sidebar-progress-header">
                  <span className="sidebar-progress-label">📊 Ma Progression</span>
                  <span className="sidebar-progress-percentage">{progress.progressPercentage || 0}%</span>
                </div>
                <div className="sidebar-progress-bar-container">
                  <div 
                    className="sidebar-progress-bar-fill" 
                    style={{ width: `${progress.progressPercentage || 0}%` }}
                  ></div>
                </div>
                <div className="sidebar-progress-info">
                  {progress.completedLessons || progress.completedCourses || 0} / {progress.totalLessons || 8} leçons complétées
                </div>
              </>
            ) : (
              <>
                <div className="sidebar-progress-header">
                  <span className="sidebar-progress-label">📊 Ma Progression</span>
                  <span className="sidebar-progress-percentage">0%</span>
                </div>
                <div className="sidebar-progress-bar-container">
                  <div 
                    className="sidebar-progress-bar-fill" 
                    style={{ width: '0%' }}
                  ></div>
                </div>
                <div className="sidebar-progress-info">
                  0 / 8 leçons complétées
                </div>
              </>
            )}
          </div>
        )}

        <ThemeToggle />

        <div className="sidebar-auth">
          {isAuthenticated ? (
            <>
                     <Link
                       to="/profil"
                       className={`sidebar-auth-link ${location.pathname === '/profil' ? 'active' : ''}`}
                       onClick={() => setIsOpen(false)}
                     >
                       👤 {user?.name?.trim() || user?.email || 'Mon Profil'}
                     </Link>
              {user?.role === 'superadmin' && (
                <Link
                  to="/admin"
                  className={`sidebar-auth-link ${location.pathname.startsWith('/admin') ? 'active' : ''}`}
                  onClick={() => setIsOpen(false)}
                >
                  🔐 Administration
                </Link>
              )}
              <button
                onClick={() => {
                  logout()
                  setIsOpen(false)
                }}
                className="sidebar-logout-btn"
              >
                Se déconnecter
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className={`sidebar-auth-link ${location.pathname === '/login' ? 'active' : ''}`}
                onClick={() => setIsOpen(false)}
              >
                🔐 Se connecter
              </Link>
              <Link
                to="/admin/login"
                className="sidebar-auth-link sidebar-admin-link"
                onClick={() => setIsOpen(false)}
              >
                🔐 Espace Admin
              </Link>
            </>
          )}
        </div>
      </aside>
    </>
  )
}


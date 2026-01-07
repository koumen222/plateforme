import { Link, useLocation, useParams } from 'react-router-dom'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { CONFIG } from '../config/config'
import ThemeToggle from './ThemeToggle'
import { FiMessageSquare } from 'react-icons/fi'
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
  const { isAuthenticated, user, token, logout, refreshUser } = useAuth()
  const [progress, setProgress] = useState(null)
  const [progressLoading, setProgressLoading] = useState(false)
  const [course, setCourse] = useState(null)
  const [lessons, setLessons] = useState([])
  const [loadingCourse, setLoadingCourse] = useState(true)
  const lastLoadedSlug = useRef(null)

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

  // Charger le cours et ses leçons depuis la DB
  useEffect(() => {
    if (lastLoadedSlug.current === courseSlug) {
      return
    }

    const loadCourse = async () => {
      try {
        setLoadingCourse(true)
        const response = await axios.get(`${CONFIG.BACKEND_URL}/api/courses/slug/${courseSlug}`)
        
        if (response.data.success) {
          setCourse(response.data.course)
          
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

    const handleProgressUpdate = () => {
      if (isAuthenticated && user?.status === 'active' && token) {
        fetchProgress()
      }
    }

    const handleStatusChange = async () => {
      if (token && refreshUser) {
        try {
          const result = await refreshUser()
          if (result.success && result.statusChanged) {
            if (result.user.status === 'active' && token) {
              fetchProgress()
            } else {
              setProgress(null)
            }
          }
        } catch (error) {
          console.error('Erreur lors du refresh utilisateur:', error)
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

  const activeLessonIndex = useMemo(() => {
    if (!lessons.length) return -1
    const activeLesson = lessons.find((lesson) => 
      location.pathname.includes(`/lesson/${lesson._id}`)
    )
    return activeLesson ? lessons.indexOf(activeLesson) : -1
  }, [lessons, location.pathname])

  // Sidebar masquée complètement sur mobile, visible uniquement sur desktop
  if (!location.pathname.startsWith('/course/')) {
    return null
  }

  return (
    <aside className="hidden md:block w-64 flex-shrink-0 h-[calc(100vh-4rem)] bg-bg-secondary border-r border-border overflow-y-auto">
      {/* Header du cours */}
      <div className="p-4 sm:p-6 border-b border-border">
        <div className="flex-1">
          <h1 className="text-base sm:text-lg font-bold text-text-primary mb-2">{course?.title || 'Formation'}</h1>
          <p className="text-xs sm:text-sm text-text-secondary line-clamp-2">{course?.description || 'Chargement...'}</p>
        </div>
            </div>

      {/* Liste des leçons */}
      <nav className="p-3 sm:p-4">
          {loadingCourse ? (
          <div className="p-4 text-center text-text-secondary text-sm">Chargement...</div>
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
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
                        isActive 
                          ? 'bg-brand text-white font-semibold' 
                          : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                      }`}
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

      {/* Section commentaires et produits gagnants */}
        {isAuthenticated && user?.status === 'active' && (
        <div className="p-3 sm:p-4 border-t border-border">
          <div className="px-3 py-2 mb-2">
              <Link
                to="/commentaires"
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors ${
                  location.pathname === '/commentaires' 
                    ? 'bg-brand text-white font-semibold' 
                    : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                }`}
              >
              <FiMessageSquare className="w-4 h-4" /> Commentaires
              </Link>
            </div>
          <div className="px-3 py-2 mb-2">
              <Link
                to="/produits-gagnants"
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors ${
                  location.pathname === '/produits-gagnants' 
                    ? 'bg-brand text-white font-semibold' 
                    : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                }`}
              >
                Produits Gagnants
              </Link>
            </div>
            </div>
        )}
        
      {/* Progression */}
        {isAuthenticated && user?.status === 'active' && (
        <div className="p-3 sm:p-4 border-t border-border">
            {progressLoading ? (
              <div className="text-center text-text-secondary text-sm py-2">Chargement...</div>
            ) : progress ? (
              <>
                <div className="flex justify-between items-center mb-2">
                <span className="text-xs sm:text-sm font-semibold text-text-primary">Ma Progression</span>
                <span className="text-xs sm:text-sm font-semibold text-brand">{progress.progressPercentage || 0}%</span>
                </div>
                <div className="h-2 bg-bg-hover rounded-full overflow-hidden mb-2">
                  <div 
                    className="h-full bg-brand rounded-full transition-all duration-300 shadow-sm"
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
                <span className="text-xs sm:text-sm font-semibold text-text-primary">Ma Progression</span>
                <span className="text-xs sm:text-sm font-semibold text-brand">0%</span>
                </div>
                <div className="h-2 bg-bg-hover rounded-full overflow-hidden mb-2">
                  <div 
                    className="h-full bg-brand rounded-full transition-all duration-300"
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

      {/* Theme toggle */}
      <div className="p-3 sm:p-4 border-t border-border">
          <ThemeToggle />
        </div>

      {/* Profil et déconnexion */}
      <div className="p-3 sm:p-4 border-t border-border space-y-2">
          {isAuthenticated ? (
            <>
              <Link
                to="/profil"
                className={`block px-3 py-2 rounded-xl text-sm transition-colors ${
                  location.pathname === '/profil' 
                    ? 'bg-brand text-white font-semibold' 
                    : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                }`}
              >
                {user?.name?.trim() || user?.email || 'Mon Profil'}
              </Link>
              {user?.role === 'superadmin' && (
                <Link
                  to="/admin"
                  className={`block px-3 py-2 rounded-xl text-sm transition-colors ${
                    location.pathname.startsWith('/admin') 
                      ? 'bg-brand text-white font-semibold' 
                      : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                  }`}
                >
                  Administration
                </Link>
              )}
              <button
              onClick={logout}
                className="w-full text-left px-3 py-2 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Se déconnecter
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className={`block px-3 py-2 rounded-xl text-sm transition-colors ${
                  location.pathname === '/login' 
                    ? 'bg-brand text-white font-semibold' 
                    : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                }`}
              >
                Se connecter
              </Link>
              <Link
                to="/admin/login"
                className="block px-3 py-2 rounded-xl text-sm text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
              >
                Espace Admin
              </Link>
            </>
          )}
        </div>
      </aside>
  )
}

import { Link, useLocation, useParams } from 'react-router-dom'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { CONFIG } from '../config/config'
import ThemeToggle from './ThemeToggle'
import { FiBook, FiCheckCircle, FiUser, FiSettings, FiLogOut, FiLogIn, FiTrendingUp } from 'react-icons/fi'
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
  const [modules, setModules] = useState([])
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
          const modulesData = []
          if (response.data.course.modules) {
            response.data.course.modules.forEach((module) => {
              if (module.lessons && module.lessons.length > 0) {
                modulesData.push({
                  ...module,
                  lessons: module.lessons
                })
                module.lessons.forEach((lesson) => {
                  allLessons.push({
                    ...lesson,
                    moduleTitle: module.title,
                    moduleId: module._id
                  })
                })
              }
            })
          }
          setLessons(allLessons)
          setModules(modulesData)
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

  // Vérifier si une leçon est complétée
  const isLessonCompleted = useCallback((lessonId) => {
    if (!progress || !progress.courses) return false
    const courseProgress = progress.courses.find(c => {
      const cId = c._id || c.id
      const courseId = course?._id
      return cId && courseId && cId.toString() === courseId.toString()
    })
    if (courseProgress && courseProgress.completedLessons) {
      return courseProgress.completedLessons.some(l => {
        const lId = l._id || l.id || l
        return lId && lessonId && lId.toString() === lessonId.toString()
      })
    }
    return false
  }, [progress, course])

  // Sidebar masquée complètement sur mobile, visible uniquement sur desktop
  if (!location.pathname.startsWith('/course/')) {
    return null
  }

  return (
    <aside className="hidden md:flex flex-col w-[420px] flex-shrink-0 h-[calc(100vh-4rem)] bg-secondary border-r border-theme overflow-hidden shadow-lg">
      {/* Header du cours avec gradient */}
      <div className="p-5 border-b border-theme bg-gradient-to-br from-card via-card to-secondary flex-shrink-0 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center flex-shrink-0 shadow-sm">
            <FiBook className="w-6 h-6 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-primary mb-2 leading-tight break-words">{course?.title || 'Formation'}</h1>
            <p className="text-xs text-secondary line-clamp-2 leading-relaxed">{course?.description || 'Chargement...'}</p>
          </div>
        </div>
      </div>

      {/* Liste des leçons avec scroll personnalisé - Prend tout l'espace disponible */}
      <nav className="flex-1 overflow-y-auto scrollbar-custom p-4 min-h-0">
        {loadingCourse ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-xs text-secondary">Chargement...</p>
          </div>
        ) : modules.length > 0 ? (
          <div className="space-y-4">
            {modules.map((module, moduleIndex) => (
              <div key={module._id || moduleIndex} className="space-y-2">
                {modules.length > 1 && (
                  <div className="px-3 py-2 mb-2 bg-accent/5 rounded-lg border-l-2 border-accent">
                    <h3 className="text-xs font-bold text-accent uppercase tracking-wider">
                      {module.title || `Module ${moduleIndex + 1}`}
                    </h3>
                  </div>
                )}
                <ul className="space-y-1">
                  {module.lessons.map((lesson, lessonIndex) => {
                    const courseSlug = course?.slug || 'facebook-ads'
                    const lessonPath = `/course/${courseSlug}/lesson/${lesson._id}`
                    const isActive = location.pathname.includes(`/lesson/${lesson._id}`)
                    const isCompleted = isLessonCompleted(lesson._id)
                    const globalIndex = lessons.findIndex(l => l._id === lesson._id)
                    
                    return (
                      <li key={lesson._id}>
                        <Link
                          to={lessonPath}
                          className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 relative ${
                            isActive 
                              ? 'bg-accent text-white font-semibold shadow-lg shadow-accent/40' 
                              : 'text-primary hover:bg-hover hover:text-accent'
                          }`}
                        >
                          {/* Indicateur de progression */}
                          <div className={`flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                            isActive 
                              ? 'bg-white/30 text-white shadow-sm' 
                              : isCompleted
                              ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                              : 'bg-hover text-primary group-hover:bg-accent/10 group-hover:text-accent'
                          }`}>
                            {isCompleted && !isActive ? (
                              <FiCheckCircle className="w-4 h-4" />
                            ) : (
                              <span className={isActive ? 'text-white font-bold' : ''}>{globalIndex + 1}</span>
                            )}
                          </div>
                          <span className={`flex-1 truncate leading-tight ${isActive ? 'text-white font-semibold' : 'text-primary'}`}>
                            {lesson.title}
                          </span>
                          {isActive && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full shadow-sm"></div>
                          )}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <ul className="space-y-1">
            {lessons.map((lesson, index) => {
              const courseSlug = course?.slug || 'facebook-ads'
              const lessonPath = `/course/${courseSlug}/lesson/${lesson._id}`
              const isActive = location.pathname.includes(`/lesson/${lesson._id}`)
              const isCompleted = isLessonCompleted(lesson._id)
              
              return (
                <li key={lesson._id}>
                  <Link
                    to={lessonPath}
                    className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 relative ${
                      isActive 
                        ? 'bg-accent text-white font-semibold shadow-lg shadow-accent/40' 
                        : 'text-primary hover:bg-hover hover:text-accent'
                    }`}
                  >
                    <div className={`flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                      isActive 
                        ? 'bg-white/30 text-white shadow-sm' 
                        : isCompleted
                        ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                        : 'bg-hover text-primary group-hover:bg-accent/10 group-hover:text-accent'
                    }`}>
                      {isCompleted && !isActive ? (
                        <FiCheckCircle className="w-4 h-4" />
                      ) : (
                        <span className={isActive ? 'text-white font-bold' : ''}>{index + 1}</span>
                      )}
                    </div>
                    <span className={`flex-1 truncate leading-tight ${isActive ? 'text-white font-semibold' : 'text-primary'}`}>
                      {lesson.title}
                    </span>
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full shadow-sm"></div>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </nav>

      {/* Section inférieure fixe avec progression, thème et profil */}
      <div className="flex-shrink-0 border-t border-theme bg-card/50">
        {/* Progression compacte */}
        {isAuthenticated && user?.status === 'active' && (
          <div className="p-3 border-b border-theme bg-gradient-to-br from-accent/5 to-transparent">
            {progressLoading ? (
              <div className="flex items-center justify-center py-2">
                <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-accent/10 flex items-center justify-center">
                      <FiTrendingUp className="w-3.5 h-3.5 text-accent" />
                    </div>
                    <span className="text-xs font-bold text-primary">Progression</span>
                  </div>
                  <span className="text-xs font-bold text-accent">{progress?.progressPercentage || 0}%</span>
                </div>
                <div className="relative h-2.5 bg-hover rounded-full overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-accent to-accent-hover rounded-full transition-all duration-500 shadow-sm"
                    style={{ width: `${progress?.progressPercentage || 0}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-secondary">{progress?.completedLessons || progress?.completedCourses || 0} complétées</span>
                  <span className="text-secondary">{progress?.totalLessons || lessons.length || 0} total</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Theme toggle compact */}
        <div className="p-3 border-b border-theme">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-primary">Thème</span>
            <ThemeToggle />
          </div>
        </div>

        {/* Profil et déconnexion compact */}
        <div className="p-3 space-y-2">
          {isAuthenticated ? (
            <>
              <Link
                to="/profil"
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  location.pathname === '/profil' 
                    ? 'bg-accent text-white shadow-md font-semibold' 
                    : 'text-primary hover:bg-hover hover:text-accent bg-hover/50'
                }`}
              >
                <FiUser className={`w-4 h-4 flex-shrink-0 ${
                  location.pathname === '/profil' 
                    ? 'text-white' 
                    : 'text-primary'
                }`} />
                <span className={`truncate text-xs ${
                  location.pathname === '/profil' 
                    ? 'text-white font-semibold' 
                    : 'text-primary'
                }`}>{user?.name?.trim() || user?.email || 'Profil'}</span>
              </Link>
              {user?.role === 'superadmin' && (
                <Link
                  to="/admin"
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    location.pathname.startsWith('/admin') 
                      ? 'bg-accent text-white shadow-md font-semibold' 
                      : 'text-primary hover:bg-hover hover:text-accent bg-hover/50'
                  }`}
                >
                  <FiSettings className={`w-4 h-4 flex-shrink-0 ${
                    location.pathname.startsWith('/admin') 
                      ? 'text-white' 
                      : 'text-primary'
                  }`} />
                  <span className={location.pathname.startsWith('/admin') ? 'text-white font-semibold' : 'text-primary'}>Administration</span>
                </Link>
              )}
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold text-white transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
                style={{
                  background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)'
                }}
              >
                <FiLogOut className="w-4 h-4" />
                <span>Se déconnecter</span>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className={`flex items-center justify-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  location.pathname === '/login' 
                    ? 'bg-accent text-white shadow-md font-semibold' 
                    : 'text-primary hover:bg-hover hover:text-accent bg-hover/50'
                }`}
              >
                <FiLogIn className={`w-4 h-4 flex-shrink-0 ${
                  location.pathname === '/login' 
                    ? 'text-white' 
                    : 'text-primary'
                }`} />
                <span className={location.pathname === '/login' ? 'text-white font-semibold' : 'text-primary'}>Se connecter</span>
              </Link>
              <Link
                to="/admin/login"
                className="flex items-center justify-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium text-primary hover:bg-hover hover:text-accent transition-all duration-200 bg-hover/50"
              >
                <FiSettings className="w-4 h-4 flex-shrink-0 text-primary" />
                <span className="text-primary">Espace Admin</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </aside>
  )
}
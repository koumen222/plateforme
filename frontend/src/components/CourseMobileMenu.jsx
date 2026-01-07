import { Link, useLocation, useParams } from 'react-router-dom'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { CONFIG } from '../config/config'
import { FiX, FiMessageSquare, FiList, FiFileText, FiChevronRight } from 'react-icons/fi'
import axios from 'axios'

export default function CourseMobileMenu({ isOpen, onClose, lesson, nextLesson, prevLesson, onNextLesson }) {
  const location = useLocation()
  const { slug } = useParams()
  const slugFromPath = useMemo(() => {
    if (location.pathname.startsWith('/course/')) {
      return location.pathname.split('/')[2] || null
    }
    return null
  }, [location.pathname])

  const courseSlug = slug || slugFromPath || 'facebook-ads'
  const { isAuthenticated, user } = useAuth()
  const [course, setCourse] = useState(null)
  const [lessons, setLessons] = useState([])
  const [loadingCourse, setLoadingCourse] = useState(true)
  const lastLoadedSlug = useRef(null)

  // Charger le cours et ses leçons
  useEffect(() => {
    if (lastLoadedSlug.current === courseSlug) {
      setLoadingCourse(false)
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
                module.lessons.forEach((l) => {
                  allLessons.push({
                    ...l,
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

  const handleLessonClick = () => {
    onClose()
  }

  const handleNextClick = () => {
    if (onNextLesson) {
      onNextLesson()
    }
    onClose()
  }

  if (!location.pathname.startsWith('/course/')) {
    return null
  }

  return (
    <>
      {/* Overlay backdrop */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer menu */}
      <div
        className={`md:hidden fixed inset-y-0 right-0 w-80 bg-white dark:bg-gray-900 shadow-xl z-[70] transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Cours</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Fermer"
            >
              <FiX className="w-5 h-5 text-gray-900 dark:text-white" />
            </button>
          </div>

          {/* Contenu scrollable */}
          <div className="flex-1 overflow-y-auto">
            {/* Liste des leçons */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2 mb-3">
                <FiList className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Leçons</h3>
              </div>
              {loadingCourse ? (
                <div className="text-sm text-gray-500 dark:text-gray-400">Chargement...</div>
              ) : (
                <ul className="space-y-1">
                  {lessons.map((l, index) => {
                    const lessonPath = `/course/${courseSlug}/lesson/${l._id}`
                    const isActive = location.pathname.includes(`/lesson/${l._id}`)
                    
                    return (
                      <li key={l._id}>
                        <Link
                          to={lessonPath}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                            isActive 
                              ? 'bg-brand text-white font-semibold' 
                              : 'text-black dark:text-black hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                          onClick={handleLessonClick}
                        >
                          <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-xs font-medium">
                            {index + 1}
                          </span>
                          <span className="flex-1 truncate">{l.title}</span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            {/* Ressources */}
            {lesson?.resources && lesson.resources.length > 0 && (
              <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2 mb-3">
                  <FiFileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">Ressources</h3>
                </div>
                <div className="space-y-2">
                  {lesson.resources.map((resource, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {resource.title}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {resource.type}
                        </div>
                      </div>
                      {resource.download ? (
                        <a
                          href={resource.link}
                          download
                          className="ml-2 px-3 py-1.5 text-xs font-medium bg-brand text-white rounded-lg hover:bg-brand-600 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Télécharger
                        </a>
                      ) : (
                        <a
                          href={resource.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 px-3 py-1.5 text-xs font-medium bg-brand text-white rounded-lg hover:bg-brand-600 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Accéder
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Commentaires */}
            {isAuthenticated && user?.status === 'active' && (
              <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2 mb-3">
                  <FiMessageSquare className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">Commentaires</h3>
                </div>
                <Link
                  to="/commentaires"
                  className="block px-3 py-2 rounded-lg text-sm text-black dark:text-black hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  onClick={onClose}
                >
                  Voir les commentaires
                </Link>
              </div>
            )}

            {/* Navigation */}
            {(nextLesson || prevLesson) && (
              <div className="p-4">
                <div className="flex flex-col gap-2">
                  {prevLesson && (
                    <Link
                      to={prevLesson.path || (prevLesson._id ? `/course/${courseSlug}/lesson/${prevLesson._id}` : '#')}
                      className="flex items-center justify-between px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-black dark:text-black hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      onClick={handleLessonClick}
                    >
                      <span className="text-sm font-medium">Leçon précédente</span>
                      <FiChevronRight className="w-4 h-4 rotate-180" />
                    </Link>
                  )}
                  {nextLesson && (
                    <button
                      onClick={handleNextClick}
                      className="flex items-center justify-between px-4 py-3 rounded-lg bg-brand text-white hover:bg-brand-600 transition-colors"
                    >
                      <span className="text-sm font-medium">Leçon suivante</span>
                      <FiChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}


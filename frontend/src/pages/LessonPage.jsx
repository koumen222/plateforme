import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { lessons } from '../data/lessons'
import ProtectedVideo from '../components/ProtectedVideo'
import { useAuth } from '../contexts/AuthContext'
import { CONFIG } from '../config/config'
import axios from 'axios'
import CourseMobileMenu from '../components/CourseMobileMenu'
import { FiBook } from 'react-icons/fi'

export default function LessonPage({ lesson }) {
  const { user, token, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isCompleted, setIsCompleted] = useState(false)
  const [isMarking, setIsMarking] = useState(false)
  const [progress, setProgress] = useState(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loadingComments, setLoadingComments] = useState(false)
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [submittingReply, setSubmittingReply] = useState(false)
  const [isCourseMenuOpen, setIsCourseMenuOpen] = useState(false)
  const [course, setCourse] = useState(null)

  const [courseLessons, setCourseLessons] = useState([])

  // Écouter l'événement pour ouvrir le menu cours
  useEffect(() => {
    const handleOpenCourseMenu = () => {
      setIsCourseMenuOpen(true)
      document.body.style.overflow = 'hidden'
    }

    window.addEventListener('openCourseMenu', handleOpenCourseMenu)
    return () => {
      window.removeEventListener('openCourseMenu', handleOpenCourseMenu)
    }
  }, [])

  const closeCourseMenu = () => {
    setIsCourseMenuOpen(false)
    document.body.style.overflow = ''
  }

  if (!lesson) return null

  // Charger les leçons du cours depuis la DB si la leçon vient de la DB
  useEffect(() => {
    if (lesson._id) {
      const loadCourse = async () => {
        try {
          const pathParts = window.location.pathname.split('/')
          const courseSlug = pathParts[2] || 'facebook-ads'
          const response = await axios.get(`${CONFIG.BACKEND_URL}/api/courses/slug/${courseSlug}`)
          if (response.data.success && response.data.course) {
            setCourse(response.data.course)
            
            if (response.data.course.modules) {
              const allLessons = []
              response.data.course.modules.forEach((module) => {
                if (module.lessons) {
                  module.lessons.forEach((l) => {
                    const isYouTube = l.videoId && (l.videoId.length === 11 || l.videoId.includes('youtube'))
                    const videoType = isYouTube ? 'youtube' : 'vimeo'
                    let videoUrl = ''
                    const videoId = l.videoId.toString().trim()
                    
                    if (videoType === 'youtube') {
                      let youtubeId = videoId
                      if (videoId.includes('youtube.com/watch?v=')) {
                        youtubeId = videoId.split('v=')[1]?.split('&')[0] || videoId
                      } else if (videoId.includes('youtu.be/')) {
                        youtubeId = videoId.split('youtu.be/')[1]?.split('?')[0] || videoId
                      } else if (videoId.includes('youtube.com/embed/')) {
                        youtubeId = videoId.split('embed/')[1]?.split('?')[0] || videoId
                      }
                      videoUrl = `https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1&playsinline=1&autoplay=0`
                    } else {
                      let vimeoId = videoId
                      if (videoId.includes('vimeo.com/')) {
                        vimeoId = videoId.split('vimeo.com/')[1]?.split('?')[0] || videoId
                      }
                      videoUrl = `https://player.vimeo.com/video/${vimeoId}?title=0&byline=0&portrait=0&autoplay=0`
                    }
                    const badgeMatch = l.title.match(/JOUR \d+/)
                    const badge = badgeMatch ? badgeMatch[0] : `JOUR ${allLessons.length + 1}`
                    const meta = l.title.split(' - ')[1] || 'Formation'
                    allLessons.push({
                      id: allLessons.length + 1,
                      _id: l._id,
                      path: `/course/${courseSlug}/lesson/${l._id}`,
                      title: l.title,
                      badge: badge,
                      meta: meta,
                      video: { type: videoType, url: videoUrl },
                      summary: l.summary || { text: '', points: [] },
                      resources: l.resources || [],
                      isCoaching: l.isCoaching || false
                    })
                  })
                }
              })
              setCourseLessons(allLessons)
            }
          }
        } catch (error) {
          console.error('Erreur chargement cours:', error)
        }
      }
      loadCourse()
    }
  }, [lesson._id])
  

  // Navigation : utiliser courseLessons si disponible, sinon lessons legacy
  const allLessons = courseLessons.length > 0 ? courseLessons : lessons
  const currentIndex = lesson._id 
    ? allLessons.findIndex(l => l._id === lesson._id)
    : lessons.findIndex(l => l.id === lesson.id)
  const nextLesson = currentIndex >= 0 && currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null

  useEffect(() => {
    if (isAuthenticated && user?.status === 'active' && token && lesson) {
      fetchProgress()
      fetchComments()
    }
  }, [isAuthenticated, user, token, lesson?.id])

  const fetchProgress = async () => {
    if (!token || user?.status !== 'active' || !lesson) return
    
    const lessonIndex = lessons.findIndex(l => l.id === lesson.id)
    if (lessonIndex === -1) return
    
    try {
      const coursesResponse = await fetch(`${CONFIG.BACKEND_URL}/api/courses`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!coursesResponse.ok) {
        console.error('Erreur récupération cours')
        return
      }
      
      const coursesData = await coursesResponse.json()
      const courses = coursesData.courses || []
      
      const progressResponse = await fetch(`${CONFIG.BACKEND_URL}/api/progress`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (progressResponse.ok) {
        const progressData = await progressResponse.json()
        setProgress(progressData.progress)
        
        if (courses[lessonIndex]) {
          const courseId = courses[lessonIndex]._id || courses[lessonIndex].id
          
          const courseProgress = progressData.progress.courses?.find(c => {
            const cId = c._id || c.id
            return cId && courseId && cId.toString() === courseId.toString()
          })
          
          if (courseProgress) {
            const completed = courseProgress.completed === true
            setIsCompleted(completed)
          } else {
            setIsCompleted(false)
          }
        } else {
          const lessonNumber = lessonIndex + 1
          const completedLessons = progressData.progress.completedLessons || progressData.progress.completedCourses || 0
          const isCompletedByNumber = lessonNumber <= completedLessons
          setIsCompleted(isCompletedByNumber)
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la progression:', error)
    }
  }

  const markAsCompleted = async () => {
    if (!token || !isAuthenticated || user?.status !== 'active') {
      navigate('/login', { state: { from: location } })
      return
    }

    setIsMarking(true)
    try {
      const coursesResponse = await fetch(`${CONFIG.BACKEND_URL}/api/courses`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (coursesResponse.ok) {
        const coursesData = await coursesResponse.json()
        const courses = coursesData.courses || []
        
        if (courses[currentIndex]) {
          const courseId = courses[currentIndex]._id || courses[currentIndex].id
          
          const response = await fetch(`${CONFIG.BACKEND_URL}/api/courses/progress/${courseId}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ completed: true })
          })

          if (response.ok) {
            setTimeout(() => {
              fetchProgress()
            }, 300)
            setIsCompleted(true)
            window.dispatchEvent(new CustomEvent('progressUpdated'))
          }
        } else {
          setIsCompleted(true)
        }
      }
    } catch (error) {
      console.error('Erreur lors du marquage comme complété:', error)
    } finally {
      setIsMarking(false)
    }
  }

  const handleNextLesson = () => {
    if (!isCompleted && isAuthenticated && user?.status === 'active') {
      markAsCompleted().then(() => {
        if (nextLesson) {
          const pathParts = window.location.pathname.split('/')
          const courseSlug = pathParts[2] || 'facebook-ads'
          const nextPath = nextLesson.path || (nextLesson._id ? `/course/${courseSlug}/lesson/${nextLesson._id}` : '')
          if (nextPath) navigate(nextPath)
        }
      })
    } else if (nextLesson) {
      const pathParts = window.location.pathname.split('/')
      const courseSlug = pathParts[2] || 'facebook-ads'
      const nextPath = nextLesson.path || (nextLesson._id ? `/course/${courseSlug}/lesson/${nextLesson._id}` : '')
      if (nextPath) navigate(nextPath)
    }
  }

  const fetchComments = async () => {
    if (!token || user?.status !== 'active') {
      return
    }

    setLoadingComments(true)
    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/comments/lesson/${lesson.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setComments(data.comments || [])
      }
    } catch (error) {
      console.error('Erreur lors du chargement des commentaires:', error)
    } finally {
      setLoadingComments(false)
    }
  }

  const handleSubmitComment = async (e) => {
    e.preventDefault()

    if (!newComment.trim()) {
      return
    }

    if (newComment.length > 2000) {
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: newComment.trim(),
          lessonId: lesson.id,
          lessonTitle: lesson.title
        })
      })

      const data = await response.json()

      if (response.ok) {
        setNewComment('')
        setTimeout(() => {
          fetchComments()
        }, 500)
      } else {
        alert(`Erreur: ${data.error || 'Impossible d\'envoyer le commentaire'}`)
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du commentaire:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitReply = async (commentId) => {
    if (!replyText.trim()) {
      return
    }

    if (replyText.length > 2000) {
      alert('La réponse ne peut pas dépasser 2000 caractères')
      return
    }

    setSubmittingReply(true)

    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/comments/${commentId}/response`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          response: replyText.trim()
        })
      })

      const data = await response.json()

      if (response.ok) {
        setReplyText('')
        setReplyingTo(null)
        setTimeout(() => {
          fetchComments()
        }, 500)
      } else {
        alert(`Erreur: ${data.error || 'Impossible d\'envoyer la réponse'}`)
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la réponse:', error)
      alert('Erreur lors de l\'envoi de la réponse')
    } finally {
      setSubmittingReply(false)
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: { label: 'En attente', class: 'status-pending' },
      approved: { label: 'Approuvé', class: 'status-active' },
      rejected: { label: 'Rejeté', class: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400' }
    }
    return badges[status] || badges.pending
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      {/* Header avec gradient accent */}
      <header className="page-header-lesson mb-6 sm:mb-8">
        <div className="lesson-header-top">
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-3 mb-3">
              <span className="lesson-badge flex-shrink-0">{lesson.badge}</span>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary leading-tight break-words">
                {lesson.title}
              </h2>
            </div>
            {lesson.meta && (
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm text-secondary">{lesson.meta}</span>
              </div>
            )}
          </div>
          {isAuthenticated && user?.status === 'active' && (
            <div className="flex-shrink-0 mt-4 sm:mt-0 ml-4">
              {isCompleted ? (
                <span className="lesson-completed-badge inline-flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Complété
                </span>
              ) : (
                <button
                  onClick={markAsCompleted}
                  disabled={isMarking}
                  className="mark-completed-btn px-4 py-2.5 text-sm sm:text-base"
                >
                  {isMarking ? (
                    <>
                      <svg className="w-4 h-4 animate-spin inline-block mr-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Chargement...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Marquer comme complété
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Bouton "Voir les cours" mobile */}
      <div className="md:hidden mb-6">
        <button
          onClick={() => {
            setIsCourseMenuOpen(true)
            document.body.style.overflow = 'hidden'
          }}
          className="btn-primary w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl"
          aria-label="Voir les cours"
        >
          <FiBook className="w-5 h-5" />
          <span>Voir les chapitres</span>
        </button>
      </div>

      {/* Description du cours mobile */}
      {course && (
        <div className="md:hidden mb-6 card-startup">
          <h3 className="text-lg font-bold text-primary mb-2">
            {course.title || 'Formation'}
          </h3>
          <p className="text-sm text-secondary leading-relaxed">
            {course.description || 'Formation complète avec vidéos, ressources et accompagnement.'}
          </p>
        </div>
      )}

      {/* Videos - Conteneur optimisé */}
      <div className="w-full mb-6 sm:mb-8">
        {lesson.video && (
          <ProtectedVideo video={lesson.video} isFirstVideo={currentIndex === 0} isFreeCourse={!!course?.isFree} />
        )}
        {lesson.videos && lesson.videos.map((video, idx) => (
          <ProtectedVideo key={idx} video={video} title={video.title} isFirstVideo={currentIndex === 0 && idx === 0} isFreeCourse={!!course?.isFree} />
        ))}
      </div>

      {/* Summary - Design amélioré */}
      {lesson.summary && (
        <div className="summary-card-lesson mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-primary">
              Résumé de la leçon
            </h3>
          </div>
          {lesson.summary.text && (
            <p className="text-base sm:text-lg text-primary mb-4 sm:mb-6 leading-relaxed">
              {lesson.summary.text}
            </p>
          )}
          {lesson.summary.points && lesson.summary.points.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-secondary uppercase tracking-wide mb-2">Points clés :</h4>
              <ul className="space-y-2.5">
                {lesson.summary.points.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-base sm:text-lg text-primary">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center text-xs font-bold mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="flex-1 leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Resources - Design amélioré */}
      {lesson.resources && lesson.resources.length > 0 && (
        <div className="downloads-section-lesson mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-primary">
              Ressources à télécharger
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {lesson.resources.map((resource, idx) => (
              <div key={idx} className="download-item-lesson">
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <div className="download-icon-lesson w-12 h-12 sm:w-14 sm:h-14 text-lg sm:text-xl flex-shrink-0">
                    {resource.icon || '📄'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base sm:text-lg font-bold text-primary mb-1 break-words">
                      {resource.title}
                    </h4>
                    <p className="text-sm sm:text-base text-secondary">
                      {resource.type}
                    </p>
                  </div>
                </div>
                {resource.download ? (
                  <a 
                    href={resource.link} 
                    className="download-btn-lesson px-4 sm:px-5 py-2 sm:py-2.5 text-sm sm:text-base flex-shrink-0" 
                    download
                  >
                    <svg className="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Télécharger
                  </a>
                ) : (
                  <a 
                    href={resource.link} 
                    className="download-btn-lesson px-4 sm:px-5 py-2 sm:py-2.5 text-sm sm:text-base flex-shrink-0" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <svg className="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Accéder
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation - Design amélioré */}
      <div className="lesson-navigation-lesson mb-6 sm:mb-8">
        {prevLesson && (() => {
          const pathParts = window.location.pathname.split('/')
          const courseSlug = pathParts[2] || 'facebook-ads'
          return (
            <Link 
              to={prevLesson.path || (prevLesson._id ? `/course/${courseSlug}/lesson/${prevLesson._id}` : '#')} 
              className="lesson-nav-btn lesson-nav-prev px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Leçon précédente
            </Link>
          )
        })()}
        {nextLesson && (
          <button
            onClick={handleNextLesson}
            className="lesson-nav-btn lesson-nav-next px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base flex items-center gap-2 ml-auto"
          >
            Leçon suivante
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Section Commentaires - Design amélioré */}
      {isAuthenticated && user?.status === 'active' && (
        <div className="mt-8 sm:mt-12 card-startup">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-primary">
              Commentaires sur cette leçon
            </h2>
          </div>
        
          <form onSubmit={handleSubmitComment} className="mb-8">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Laissez un commentaire, une question ou un retour sur cette leçon..."
              className="input-startup mb-4 resize-none"
              rows={5}
              maxLength={2000}
              required
            />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="text-sm text-secondary">
                {newComment.length} / 2000 caractères
              </div>
              <button
                type="submit"
                disabled={submitting || !newComment.trim()}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 w-full sm:w-auto flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Envoi...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Envoyer le commentaire
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="space-y-4 sm:space-y-6">
            {loadingComments ? (
              <div className="text-center py-12 text-secondary">
                <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-sm sm:text-base">Chargement des commentaires...</p>
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-accent/10 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-base sm:text-lg text-secondary">
                  Aucun commentaire pour cette leçon. Soyez le premier à commenter !
                </p>
              </div>
            ) : (
              comments.map(comment => {
                const statusBadge = getStatusBadge(comment.status)
                return (
                  <div key={comment._id} className="card-startup border-l-4 border-l-accent hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4 mb-4">
                      <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-accent text-white flex items-center justify-center font-bold text-base sm:text-lg flex-shrink-0">
                          {comment.userEmail ? comment.userEmail.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-primary mb-1 break-words">
                            {comment.userEmail || 'Utilisateur'}
                          </div>
                          <div className="text-xs sm:text-sm text-secondary">
                            {new Date(comment.createdAt).toLocaleDateString('fr-FR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                      <span className={`px-2 sm:px-3 py-1 rounded-md text-xs font-semibold border flex-shrink-0 ${statusBadge.class}`}>
                        {statusBadge.label}
                      </span>
                    </div>
                    <div className="text-base sm:text-lg text-primary mb-4 whitespace-pre-wrap break-words leading-relaxed">
                      {comment.content}
                    </div>
                    {comment.adminResponse && (
                      <div className="mt-4 pt-4 border-t border-theme">
                        <div className="flex items-center gap-2 mb-3">
                          <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          <div className="font-semibold text-primary">
                            Réponse de l'administrateur :
                          </div>
                        </div>
                        <div className="text-base sm:text-lg rounded-xl p-4 mb-4 bg-accent/10 text-primary border border-accent/20 leading-relaxed">
                          {comment.adminResponse}
                        </div>
                        {comment.userId === user?._id && !comment.userResponse && (
                          <div className="mt-4">
                            {replyingTo === comment._id ? (
                              <div>
                                <textarea
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  placeholder="Répondre à l'administrateur..."
                                  className="input-startup mb-4 resize-none"
                                  rows={3}
                                  maxLength={2000}
                                />
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                  <div className="text-sm text-secondary">
                                    {replyText.length} / 2000 caractères
                                  </div>
                                  <div className="flex gap-2 w-full sm:w-auto">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setReplyingTo(null)
                                        setReplyText('')
                                      }}
                                      className="btn-secondary px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base flex-1 sm:flex-none"
                                    >
                                      Annuler
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleSubmitReply(comment._id)}
                                      disabled={submittingReply || !replyText.trim()}
                                      className="btn-primary disabled:opacity-50 px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base flex-1 sm:flex-none"
                                    >
                                      {submittingReply ? 'Envoi...' : 'Envoyer'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setReplyingTo(comment._id)}
                                className="text-sm hover:underline font-semibold text-accent flex items-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                </svg>
                                Répondre
                              </button>
                            )}
                          </div>
                        )}
                        {comment.userResponse && (
                          <div className="mt-4 pt-4 border-t border-theme">
                            <div className="flex items-center gap-2 mb-3">
                              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <div className="font-semibold text-primary">
                                Votre réponse :
                              </div>
                            </div>
                            <div className="text-base sm:text-lg rounded-xl p-4 bg-green-100 dark:bg-green-900/20 text-primary border border-green-200 dark:border-green-800 leading-relaxed">
                              {comment.userResponse}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* Menu mobile cours */}
      <CourseMobileMenu
        isOpen={isCourseMenuOpen}
        onClose={closeCourseMenu}
        lesson={lesson}
        nextLesson={nextLesson}
        prevLesson={prevLesson}
        onNextLesson={handleNextLesson}
      />
    </div>
  )
}
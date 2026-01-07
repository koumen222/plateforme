import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { lessons } from '../data/lessons'
import ProtectedVideo from '../components/ProtectedVideo'
import { useAuth } from '../contexts/AuthContext'
import { CONFIG } from '../config/config'
import axios from 'axios'
import SubscriptionButton from '../components/SubscriptionButton'
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
          // Déterminer le slug du cours depuis le pathname ou utiliser facebook-ads par défaut
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
                  // Amélioration de la détection et construction de l'URL vidéo
                  let videoUrl = ''
                  const videoId = l.videoId.toString().trim()
                  
                  if (videoType === 'youtube') {
                    // Si c'est une URL complète, extraire l'ID
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
                    // Vimeo - extraire l'ID si c'est une URL
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

  // Ne pas charger l'utilisateur ici - il est déjà géré par AuthContext
  // L'utilisateur est déjà disponible via le hook useAuth()

  useEffect(() => {
    if (isAuthenticated && user?.status === 'active' && token && lesson) {
      console.log('🔄 useEffect LessonPage - Chargement progression et commentaires')
      fetchProgress()
      fetchComments()
    } else {
      console.log('⚠️ useEffect LessonPage - Conditions non remplies:', {
        isAuthenticated,
        userStatus: user?.status,
        hasToken: !!token,
        hasLesson: !!lesson
      })
    }
  }, [isAuthenticated, user, token, lesson?.id])

  const fetchProgress = async () => {
    if (!token || user?.status !== 'active' || !lesson) return
    
    // Calculer l'index de la leçon actuelle
    const lessonIndex = lessons.findIndex(l => l.id === lesson.id)
    if (lessonIndex === -1) return
    
    try {
      // Récupérer les cours depuis la DB pour faire le mapping correct
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
      
      // Récupérer la progression depuis la DB
      const progressResponse = await fetch(`${CONFIG.BACKEND_URL}/api/progress`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (progressResponse.ok) {
        const progressData = await progressResponse.json()
        setProgress(progressData.progress)
        
        // Trouver le cours correspondant à cette leçon
        if (courses[lessonIndex]) {
          const courseId = courses[lessonIndex]._id || courses[lessonIndex].id
          
          // Vérifier si ce cours est complété dans la progression
          const courseProgress = progressData.progress.courses?.find(c => {
            const cId = c._id || c.id
            return cId && courseId && cId.toString() === courseId.toString()
          })
          
          if (courseProgress) {
            const completed = courseProgress.completed === true
            setIsCompleted(completed)
            console.log(`Leçon ${lessonIndex + 1} (${lesson.title}): ${completed ? 'Complétée' : 'Non complétée'}`)
          } else {
            // Si pas trouvé, le cours n'est pas complété
            setIsCompleted(false)
            console.log(`Leçon ${lessonIndex + 1} (${lesson.title}): Non complétée (pas de progression trouvée)`)
          }
        } else {
          // Fallback: vérifier par numéro de leçon si pas de cours correspondant
          const lessonNumber = lessonIndex + 1
          const completedLessons = progressData.progress.completedLessons || progressData.progress.completedCourses || 0
          const isCompletedByNumber = lessonNumber <= completedLessons
          setIsCompleted(isCompletedByNumber)
          console.log(`Leçon ${lessonNumber}: ${isCompletedByNumber ? 'Complétée' : 'Non complétée'} (fallback)`)
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
      // Pour l'instant, on utilise un système basé sur les leçons
      // On pourrait créer un mapping entre lessons et courses dans la DB
      // Pour simplifier, on marque la progression basée sur l'index de la leçon
      
      // Récupérer tous les cours de la DB
      const coursesResponse = await fetch(`${CONFIG.BACKEND_URL}/api/courses`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (coursesResponse.ok) {
        const coursesData = await coursesResponse.json()
        const courses = coursesData.courses || []
        
        // Marquer le cours correspondant à cette leçon comme complété
        // On utilise l'index de la leçon pour trouver le cours correspondant
        if (courses[currentIndex]) {
          const courseId = courses[currentIndex]._id || courses[currentIndex].id
          
          // Utiliser l'endpoint correct pour marquer la progression
          const response = await fetch(`${CONFIG.BACKEND_URL}/api/courses/progress/${courseId}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ completed: true })
          })

          if (response.ok) {
            const result = await response.json()
            console.log('Progression sauvegardée:', result)
            
            // Attendre un peu pour que la DB soit à jour, puis rafraîchir
            setTimeout(() => {
              fetchProgress() // Rafraîchir la progression depuis la DB
            }, 300)
            
            // Mettre à jour l'état local immédiatement
            setIsCompleted(true)
            
            // Déclencher un événement pour notifier les autres composants
            window.dispatchEvent(new CustomEvent('progressUpdated'))
          } else {
            const errorData = await response.json().catch(() => ({}))
            console.error('Erreur sauvegarde progression:', errorData)
          }
        } else {
          // Si pas de cours correspondant, on peut juste mettre à jour la progression locale
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
      // Marquer comme complété avant de passer à la suivante
      markAsCompleted().then(() => {
        if (nextLesson) {
          // Déterminer le slug du cours depuis le pathname
          const pathParts = window.location.pathname.split('/')
          const courseSlug = pathParts[2] || 'facebook-ads'
          const nextPath = nextLesson.path || (nextLesson._id ? `/course/${courseSlug}/lesson/${nextLesson._id}` : '')
          if (nextPath) navigate(nextPath)
        }
      })
    } else if (nextLesson) {
      // Déterminer le slug du cours depuis le pathname
      const pathParts = window.location.pathname.split('/')
      const courseSlug = pathParts[2] || 'facebook-ads'
      const nextPath = nextLesson.path || (nextLesson._id ? `/course/${courseSlug}/lesson/${nextLesson._id}` : '')
      if (nextPath) navigate(nextPath)
    }
  }

  const fetchComments = async () => {
    if (!token || user?.status !== 'active') {
      console.log('⚠️ fetchComments: Token ou user manquant')
      return
    }

    setLoadingComments(true)
    try {
      console.log(`Récupération commentaires pour la leçon ${lesson.id}`)
      
      // Récupérer tous les commentaires approuvés pour cette leçon
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/comments/lesson/${lesson.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      console.log(`📡 Réponse API commentaires: ${response.status} ${response.statusText}`)

      if (response.ok) {
        const data = await response.json()
        console.log(`${data.comments?.length || 0} commentaires récupérés`)
        setComments(data.comments || [])
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Erreur API commentaires:', response.status, errorData)
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
        console.log('Commentaire créé avec succès:', data.comment)
        setNewComment('')
        // Rafraîchir les commentaires après un court délai pour laisser la DB se mettre à jour
        setTimeout(() => {
          fetchComments()
        }, 500)
      } else {
        console.error('Erreur lors de l\'envoi du commentaire:', data.error)
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
        console.log('Réponse envoyée avec succès:', data.comment)
        setReplyText('')
        setReplyingTo(null)
        setTimeout(() => {
          fetchComments()
        }, 500)
      } else {
        console.error('Erreur lors de l\'envoi de la réponse:', data.error)
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
      pending: { label: 'En attente', class: 'comment-status-pending' },
      approved: { label: 'Approuvé', class: 'comment-status-approved' },
      rejected: { label: 'Rejeté', class: 'comment-status-rejected' }
    }
    return badges[status] || badges.pending
  }

  return (
    <div className="w-full">
        {/* Header - Design Africain Premium */}
        <header className="page-header-lesson mb-4 sm:mb-6">
          <div className="lesson-header-top flex-col sm:flex-row">
            <div className="flex-1 w-full sm:w-auto">
              <h2 className="text-lg sm:text-display-xs-bold lg:text-display-sm-bold mb-3 sm:mb-4" style={{ color: 'var(--text-primary)' }}>
                {lesson.title}
              </h2>
              <div className="lesson-meta flex-wrap gap-2 sm:gap-4">
                <span className="lesson-badge text-xs">{lesson.badge}</span>
                <span className="text-xs sm:text-md ml-0 sm:ml-4" style={{ color: 'var(--text-secondary)' }}>{lesson.meta}</span>
            </div>
          </div>
          {isAuthenticated && user?.status === 'active' && (
              <div className="flex-shrink-0 mt-4 sm:mt-0 w-full sm:w-auto">
              {isCompleted ? (
                <span className="lesson-completed-badge text-xs sm:text-sm block sm:inline-block text-center sm:text-left">✅ Complété</span>
              ) : (
                <button
                  onClick={markAsCompleted}
                  disabled={isMarking}
                  className="mark-completed-btn text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2 w-full sm:w-auto"
                >
                  {isMarking ? '⏳ Chargement...' : '✓ Marquer comme complété'}
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Bouton "Voir les cours" mobile - en haut de la vidéo */}
      <div className="md:hidden mb-4">
        <button
          onClick={() => {
            setIsCourseMenuOpen(true)
            document.body.style.overflow = 'hidden'
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand text-white text-sm font-semibold rounded-xl hover:bg-brand-600 transition-colors shadow-sm"
          aria-label="Voir les cours"
        >
          <FiBook className="w-5 h-5" />
          <span>Voir les chapitres</span>
        </button>
      </div>

      {/* Description du cours - Visible sur mobile */}
      {course && (
        <div className="md:hidden mb-4 p-4 rounded-lg border" style={{ 
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border)'
        }}>
          <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            {course.title || 'Formation'}
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {course.description || 'Formation complète avec vidéos, ressources et accompagnement.'}
          </p>
        </div>
      )}

        {/* Videos - Protégées par authentification - Juste en dessous du header */}
      {/* La première vidéo est toujours accessible */}
      {lesson.video && (
        <ProtectedVideo video={lesson.video} isFirstVideo={currentIndex === 0} />
      )}
      {lesson.videos && lesson.videos.map((video, idx) => (
        <ProtectedVideo key={idx} video={video} title={video.title} isFirstVideo={currentIndex === 0 && idx === 0} />
      ))}

        {/* Summary - Visible sur mobile */}
      {lesson.summary && (
          <div className="summary-card-lesson mb-4 sm:mb-8">
            <h3 className="text-base sm:text-display-xxs-bold mb-3 sm:mb-4" style={{ color: 'var(--text-primary)' }}>
              Résumé de la leçon
            </h3>
            <p className="text-sm sm:text-lg mb-3 sm:mb-4 leading-relaxed" style={{ color: 'var(--text-primary)' }}>
              {lesson.summary.text}
            </p>
          {lesson.summary.points && (
              <ul className="space-y-2 list-disc list-inside text-sm sm:text-lg pl-4" style={{ color: 'var(--text-primary)' }}>
              {lesson.summary.points.map((point, idx) => (
                  <li key={idx} className="ml-4">{point}</li>
              ))}
            </ul>
          )}
        </div>
      )}

        {/* Resources - Visible sur mobile */}
      {lesson.resources && lesson.resources.length > 0 && (
          <div className="downloads-section-lesson mb-4 sm:mb-8">
            <h3 className="text-base sm:text-display-xxs-bold mb-4 sm:mb-6" style={{ color: 'var(--text-primary)' }}>
              Ressources à télécharger
            </h3>
            <div className="space-y-3 sm:space-y-4">
            {lesson.resources.map((resource, idx) => (
                <div key={idx} className="download-item-lesson flex-col sm:flex-row">
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 w-full sm:w-auto mb-3 sm:mb-0">
                    <div className="download-icon-lesson w-8 h-8 sm:w-10 sm:h-10 text-sm sm:text-lg">
                      {resource.icon || 'F'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm sm:text-lg-bold mb-1 truncate" style={{ color: 'var(--text-primary)' }}>
                        {resource.title}
                      </h4>
                      <p className="text-xs sm:text-md truncate" style={{ color: 'var(--text-secondary)' }}>
                        {resource.type}
                      </p>
                  </div>
                </div>
                {resource.download ? (
                    <a href={resource.link} className="download-btn-lesson text-xs sm:text-sm px-3 sm:px-5 py-2 sm:py-2.5 w-full sm:w-auto text-center" download>
                    Télécharger
                  </a>
                ) : (
                    <a href={resource.link} className="download-btn-lesson text-xs sm:text-sm px-3 sm:px-5 py-2 sm:py-2.5 w-full sm:w-auto text-center" target="_blank" rel="noopener noreferrer">
                    Accéder
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

        {/* Navigation - Visible sur mobile */}
        <div className="lesson-navigation-lesson flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-0">
        {prevLesson && (() => {
          const pathParts = window.location.pathname.split('/')
          const courseSlug = pathParts[2] || 'facebook-ads'
          return (
            <Link 
              to={prevLesson.path || (prevLesson._id ? `/course/${courseSlug}/lesson/${prevLesson._id}` : '#')} 
                className="lesson-nav-btn lesson-nav-prev text-xs sm:text-sm px-4 sm:px-6 py-2.5 sm:py-3 w-full sm:w-auto text-center sm:text-left"
            >
                Leçon précédente
            </Link>
          )
        })()}
        {nextLesson && (
          <button
            onClick={handleNextLesson}
              className="lesson-nav-btn lesson-nav-next text-xs sm:text-sm px-4 sm:px-6 py-2.5 sm:py-3 w-full sm:w-auto"
          >
              Leçon suivante
          </button>
        )}
      </div>

        {/* Section Commentaires - Visible sur mobile */}
      {isAuthenticated && user?.status === 'active' && (
          <div className="mt-6 sm:mt-12 rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-md border" style={{ 
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border)'
          }}>
            <h2 className="text-lg sm:text-display-xxs-bold mb-4 sm:mb-6" style={{ color: 'var(--text-primary)' }}>
              Commentaires sur cette leçon
            </h2>
          
          {/* Formulaire de commentaire */}
            <form onSubmit={handleSubmitComment} className="mb-6 sm:mb-8">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Laissez un commentaire, une question ou un retour sur cette leçon..."
                className="input-startup mb-3 sm:mb-4 text-sm sm:text-base"
              rows={4}
              maxLength={2000}
              required
            />
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
                <div className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                {newComment.length} / 2000 caractères
              </div>
              <button
                type="submit"
                disabled={submitting || !newComment.trim()}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3 w-full sm:w-auto"
              >
                {submitting ? 'Envoi...' : 'Envoyer le commentaire'}
              </button>
            </div>
          </form>

          {/* Liste des commentaires */}
            <div className="space-y-4">
            {loadingComments ? (
                <div className="text-center py-12" style={{ color: 'var(--text-secondary)' }}>
                  <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  Chargement des commentaires...
                </div>
            ) : comments.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
                    Aucun commentaire pour cette leçon. Soyez le premier à commenter !
                  </p>
              </div>
            ) : (
              comments.map(comment => {
                const statusBadge = getStatusBadge(comment.status)
                  const getStatusStyles = (status) => {
                    const styles = {
                      pending: { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)', text: '#f59e0b' },
                      approved: { bg: 'rgba(34, 197, 94, 0.1)', border: 'rgba(34, 197, 94, 0.3)', text: '#22c55e' },
                      rejected: { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.3)', text: '#ef4444' }
                    }
                    return styles[status] || styles.pending
                  }
                  const statusStyle = getStatusStyles(comment.status)
                return (
                    <div key={comment._id} className="rounded-2xl p-6 border" style={{
                      backgroundColor: 'var(--bg-hover)',
                      borderColor: statusStyle.border
                    }}>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-12 h-12 rounded-full bg-brand text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
                          {comment.userEmail ? comment.userEmail.charAt(0).toUpperCase() : 'U'}
                        </div>
                          <div className="flex-1">
                            <div className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                            {comment.userEmail || 'Utilisateur'}
                          </div>
                            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
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
                        <span className="px-2 sm:px-3 py-1 rounded-md text-xs font-semibold border self-start" style={{
                          backgroundColor: statusStyle.bg,
                          borderColor: statusStyle.border,
                          color: statusStyle.text
                        }}>
                        {statusBadge.label}
                      </span>
                    </div>
                      <div className="text-sm sm:text-lg mb-3 sm:mb-4 whitespace-pre-wrap break-words" style={{ color: 'var(--text-primary)' }}>
                      {comment.content}
                    </div>
                    {comment.adminResponse && (
                        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                          <div className="font-semibold mb-2 text-sm sm:text-base" style={{ color: 'var(--text-primary)' }}>
                            Réponse de l'administrateur :
                        </div>
                          <div className="text-sm sm:text-lg rounded-lg sm:rounded-xl p-3 sm:p-4 mb-3 sm:mb-4" style={{ 
                            color: 'var(--text-primary)',
                            backgroundColor: 'rgba(139, 94, 60, 0.1)'
                          }}>
                          {comment.adminResponse}
                        </div>
                        {comment.userId === user?._id && !comment.userResponse && (
                            <div className="mt-3 sm:mt-4">
                            {replyingTo === comment._id ? (
                                <div>
                                <textarea
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  placeholder="Répondre à l'administrateur..."
                                    className="input-startup mb-3 sm:mb-4 text-sm sm:text-base"
                                  rows={3}
                                  maxLength={2000}
                                />
                                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
                                    <div className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                                    {replyText.length} / 2000 caractères
                                  </div>
                                    <div className="flex gap-2 w-full sm:w-auto">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setReplyingTo(null)
                                        setReplyText('')
                                      }}
                                        className="btn-secondary text-sm sm:text-base px-3 sm:px-6 py-2 sm:py-3 flex-1 sm:flex-none"
                                    >
                                      Annuler
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleSubmitReply(comment._id)}
                                      disabled={submittingReply || !replyText.trim()}
                                        className="btn-primary disabled:opacity-50 text-sm sm:text-base px-3 sm:px-6 py-2 sm:py-3 flex-1 sm:flex-none"
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
                                  className="text-xs sm:text-sm hover:underline font-semibold"
                                  style={{ color: '#f97316' }}
                              >
                                Répondre
                              </button>
                            )}
                          </div>
                        )}
                        {comment.userResponse && (
                            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                              <div className="font-semibold mb-2 text-sm sm:text-base" style={{ color: 'var(--text-primary)' }}>
                                Votre réponse :
                            </div>
                              <div className="text-sm sm:text-lg rounded-lg sm:rounded-xl p-3 sm:p-4" style={{ 
                                color: 'var(--text-primary)',
                                backgroundColor: 'rgba(34, 197, 94, 0.1)'
                              }}>
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


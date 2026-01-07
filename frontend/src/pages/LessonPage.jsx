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
    <div className="w-full">
      {/* Header */}
      <header className="page-header-lesson mb-6">
        <div className="lesson-header-top">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-primary mb-4">
              {lesson.title}
            </h2>
            <div className="lesson-meta">
              <span className="lesson-badge text-sm">{lesson.badge}</span>
              <span className="text-sm text-secondary ml-4">{lesson.meta}</span>
            </div>
          </div>
          {isAuthenticated && user?.status === 'active' && (
            <div className="flex-shrink-0 mt-4 sm:mt-0">
              {isCompleted ? (
                <span className="lesson-completed-badge text-sm">
                  ✅ Complété
                </span>
              ) : (
                <button
                  onClick={markAsCompleted}
                  disabled={isMarking}
                  className="mark-completed-btn px-4 py-2"
                >
                  {isMarking ? '⏳ Chargement...' : '✓ Marquer comme complété'}
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Bouton "Voir les cours" mobile */}
      <div className="md:hidden mb-4">
        <button
          onClick={() => {
            setIsCourseMenuOpen(true)
            document.body.style.overflow = 'hidden'
          }}
          className="btn-primary w-full flex items-center justify-center gap-2 px-4 py-3"
          aria-label="Voir les cours"
        >
          <FiBook className="w-5 h-5" />
          <span>Voir les chapitres</span>
        </button>
      </div>

      {/* Description du cours mobile */}
      {course && (
        <div className="md:hidden mb-4 card-startup">
          <h3 className="text-base font-semibold text-primary mb-2">
            {course.title || 'Formation'}
          </h3>
          <p className="text-sm text-secondary leading-relaxed">
            {course.description || 'Formation complète avec vidéos, ressources et accompagnement.'}
          </p>
        </div>
      )}

      {/* Videos */}
      {lesson.video && (
        <ProtectedVideo video={lesson.video} isFirstVideo={currentIndex === 0} />
      )}
      {lesson.videos && lesson.videos.map((video, idx) => (
        <ProtectedVideo key={idx} video={video} title={video.title} isFirstVideo={currentIndex === 0 && idx === 0} />
      ))}

      {/* Summary */}
      {lesson.summary && (
        <div className="summary-card-lesson mb-8">
          <h3 className="text-xl font-bold text-primary mb-4">
            Résumé de la leçon
          </h3>
          <p className="text-lg text-primary mb-4 leading-relaxed">
            {lesson.summary.text}
          </p>
          {lesson.summary.points && (
            <ul className="space-y-2 list-disc list-inside text-lg pl-4 text-primary">
              {lesson.summary.points.map((point, idx) => (
                <li key={idx} className="ml-4">{point}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Resources */}
      {lesson.resources && lesson.resources.length > 0 && (
        <div className="downloads-section-lesson mb-8">
          <h3 className="text-xl font-bold text-primary mb-6">
            Ressources à télécharger
          </h3>
          <div className="space-y-4">
            {lesson.resources.map((resource, idx) => (
              <div key={idx} className="download-item-lesson">
                <div className="flex items-center gap-4 flex-1">
                  <div className="download-icon-lesson w-10 h-10 text-lg">
                    {resource.icon || 'F'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-bold text-primary mb-1 truncate">
                      {resource.title}
                    </h4>
                    <p className="text-md text-secondary truncate">
                      {resource.type}
                    </p>
                  </div>
                </div>
                {resource.download ? (
                  <a href={resource.link} className="download-btn-lesson px-5 py-2.5" download>
                    Télécharger
                  </a>
                ) : (
                  <a href={resource.link} className="download-btn-lesson px-5 py-2.5" target="_blank" rel="noopener noreferrer">
                    Accéder
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="lesson-navigation-lesson mb-4">
        {prevLesson && (() => {
          const pathParts = window.location.pathname.split('/')
          const courseSlug = pathParts[2] || 'facebook-ads'
          return (
            <Link 
              to={prevLesson.path || (prevLesson._id ? `/course/${courseSlug}/lesson/${prevLesson._id}` : '#')} 
              className="lesson-nav-btn lesson-nav-prev px-6 py-3"
            >
              Leçon précédente
            </Link>
          )
        })()}
        {nextLesson && (
          <button
            onClick={handleNextLesson}
            className="lesson-nav-btn lesson-nav-next px-6 py-3"
          >
            Leçon suivante
          </button>
        )}
      </div>

      {/* Section Commentaires */}
      {isAuthenticated && user?.status === 'active' && (
        <div className="mt-12 card-startup">
          <h2 className="text-xl font-bold text-primary mb-6">
            Commentaires sur cette leçon
          </h2>
        
          <form onSubmit={handleSubmitComment} className="mb-8">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Laissez un commentaire, une question ou un retour sur cette leçon..."
              className="input-startup mb-4"
              rows={4}
              maxLength={2000}
              required
            />
            <div className="flex justify-between items-center">
              <div className="text-sm text-secondary">
                {newComment.length} / 2000 caractères
              </div>
              <button
                type="submit"
                disabled={submitting || !newComment.trim()}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3"
              >
                {submitting ? 'Envoi...' : 'Envoyer le commentaire'}
              </button>
            </div>
          </form>

          <div className="space-y-4">
            {loadingComments ? (
              <div className="text-center py-12 text-secondary">
                <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                Chargement des commentaires...
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-lg text-secondary">
                  Aucun commentaire pour cette leçon. Soyez le premier à commenter !
                </p>
              </div>
            ) : (
              comments.map(comment => {
                const statusBadge = getStatusBadge(comment.status)
                return (
                  <div key={comment._id} className="card-startup border-l-4 border-l-accent">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
                          {comment.userEmail ? comment.userEmail.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-primary mb-1">
                            {comment.userEmail || 'Utilisateur'}
                          </div>
                          <div className="text-sm text-secondary">
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
                      <span className={`px-3 py-1 rounded-md text-xs font-semibold border ${statusBadge.class}`}>
                        {statusBadge.label}
                      </span>
                    </div>
                    <div className="text-lg text-primary mb-4 whitespace-pre-wrap break-words">
                      {comment.content}
                    </div>
                    {comment.adminResponse && (
                      <div className="mt-4 pt-4 border-t border-theme">
                        <div className="font-semibold text-primary mb-2">
                          Réponse de l'administrateur :
                        </div>
                        <div className="text-lg rounded-xl p-4 mb-4 bg-accent/10 text-primary">
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
                                  className="input-startup mb-4"
                                  rows={3}
                                  maxLength={2000}
                                />
                                <div className="flex justify-between items-center">
                                  <div className="text-sm text-secondary">
                                    {replyText.length} / 2000 caractères
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setReplyingTo(null)
                                        setReplyText('')
                                      }}
                                      className="btn-secondary px-6 py-3"
                                    >
                                      Annuler
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleSubmitReply(comment._id)}
                                      disabled={submittingReply || !replyText.trim()}
                                      className="btn-primary disabled:opacity-50 px-6 py-3"
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
                                className="text-sm hover:underline font-semibold text-accent"
                              >
                                Répondre
                              </button>
                            )}
                          </div>
                        )}
                        {comment.userResponse && (
                          <div className="mt-4 pt-4 border-t border-theme">
                            <div className="font-semibold text-primary mb-2">
                              Votre réponse :
                            </div>
                            <div className="text-lg rounded-xl p-4 bg-green-100 dark:bg-green-900/20 text-primary">
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
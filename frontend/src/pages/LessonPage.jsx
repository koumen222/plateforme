import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { lessons } from '../data/lessons'
import ProtectedVideo from '../components/ProtectedVideo'
import { useAuth } from '../contexts/AuthContext'
import { CONFIG } from '../config/config'
import axios from 'axios'
import SubscriptionButton from '../components/SubscriptionButton'
import '../styles/comments.css'
import '../styles/profile.css'

export default function LessonPage({ lesson }) {
  const { user, token, isAuthenticated } = useAuth()
  const navigate = useNavigate()
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

  const [courseLessons, setCourseLessons] = useState([])

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
          if (response.data.success && response.data.course.modules) {
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
            console.log(`📚 Leçon ${lessonIndex + 1} (${lesson.title}): ${completed ? '✅ Complétée' : '❌ Non complétée'}`)
          } else {
            // Si pas trouvé, le cours n'est pas complété
            setIsCompleted(false)
            console.log(`📚 Leçon ${lessonIndex + 1} (${lesson.title}): ❌ Non complétée (pas de progression trouvée)`)
          }
        } else {
          // Fallback: vérifier par numéro de leçon si pas de cours correspondant
          const lessonNumber = lessonIndex + 1
          const completedLessons = progressData.progress.completedLessons || progressData.progress.completedCourses || 0
          const isCompletedByNumber = lessonNumber <= completedLessons
          setIsCompleted(isCompletedByNumber)
          console.log(`📚 Leçon ${lessonNumber}: ${isCompletedByNumber ? '✅ Complétée' : '❌ Non complétée'} (fallback)`)
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la progression:', error)
    }
  }

  const markAsCompleted = async () => {
    if (!token || !isAuthenticated || user?.status !== 'active') {
      navigate('/login')
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
            console.log('✅ Progression sauvegardée:', result)
            
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
            console.error('❌ Erreur sauvegarde progression:', errorData)
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
      console.log(`📚 Récupération commentaires pour la leçon ${lesson.id}`)
      
      // Récupérer tous les commentaires approuvés pour cette leçon
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/comments/lesson/${lesson.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      console.log(`📡 Réponse API commentaires: ${response.status} ${response.statusText}`)

      if (response.ok) {
        const data = await response.json()
        console.log(`✅ ${data.comments?.length || 0} commentaires récupérés`)
        setComments(data.comments || [])
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ Erreur API commentaires:', response.status, errorData)
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des commentaires:', error)
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
        console.log('✅ Commentaire créé avec succès:', data.comment)
        setNewComment('')
        // Rafraîchir les commentaires après un court délai pour laisser la DB se mettre à jour
        setTimeout(() => {
          fetchComments()
        }, 500)
      } else {
        console.error('❌ Erreur lors de l\'envoi du commentaire:', data.error)
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
        console.log('✅ Réponse envoyée avec succès:', data.comment)
        setReplyText('')
        setReplyingTo(null)
        setTimeout(() => {
          fetchComments()
        }, 500)
      } else {
        console.error('❌ Erreur lors de l\'envoi de la réponse:', data.error)
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
    <>
      <header className="page-header">
        <div className="lesson-header-top">
          <div>
            <h2>{lesson.title}</h2>
            <div className="lesson-meta">
              <span className="lesson-badge">{lesson.badge}</span>
              <span>{lesson.meta}</span>
            </div>
          </div>
          {isAuthenticated && user?.status === 'active' && (
            <div className="lesson-progress-indicator">
              {isCompleted ? (
                <span className="lesson-completed-badge">✅ Complété</span>
              ) : (
                <button
                  onClick={markAsCompleted}
                  disabled={isMarking}
                  className="mark-completed-btn"
                >
                  {isMarking ? '⏳' : '✓'} Marquer comme complété
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Message d'alerte pour les utilisateurs pending */}
      {isAuthenticated && user?.status === 'pending' && (
        <div className="profile-notice profile-notice-pending" style={{ 
          marginBottom: '2rem', 
          marginTop: '1rem',
          padding: '2rem',
          textAlign: 'center',
          maxWidth: '800px',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
          <div className="profile-notice-icon" style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
          <div className="profile-notice-content">
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Compte en attente de validation</h3>
            <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>
              Pour activer votre compte et accéder à toutes les vidéos de formation, 
              effectuez le paiement de la formation.
            </p>
            <div style={{ 
              marginTop: '1.5rem', 
              display: 'flex', 
              flexDirection: 'column',
              gap: '1rem',
              alignItems: 'center',
              width: '100%',
              maxWidth: '400px',
              marginLeft: 'auto',
              marginRight: 'auto'
            }}>
              <SubscriptionButton
                onSuccess={() => {
                  console.log('Paiement abonnement initié avec succès')
                }}
                onError={(error) => {
                  console.error('Erreur paiement abonnement:', error)
                }}
              />
              <div style={{ 
                fontSize: '0.9rem', 
                color: '#856404',
                margin: '0.5rem 0'
              }}>
                ou
              </div>
              <a
                href={`https://wa.me/${CONFIG.MORGAN_PHONE}?text=${encodeURIComponent(CONFIG.WHATSAPP_MESSAGE)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '0.75rem 1.5rem',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  color: '#fff',
                  backgroundColor: '#25D366',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'background-color 0.2s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  width: '100%',
                  justifyContent: 'center'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#20BA5A'
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = '#25D366'
                }}
              >
                <span>💬</span>
                <span>Contacter sur WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Videos - Protégées par authentification */}
      {lesson.video && (
        <ProtectedVideo video={lesson.video} />
      )}
      {lesson.videos && lesson.videos.map((video, idx) => (
        <ProtectedVideo key={idx} video={video} title={video.title} />
      ))}

      {/* Summary */}
      {lesson.summary && (
        <div className="summary-card">
          <h3>Résumé de la leçon</h3>
          <p>{lesson.summary.text}</p>
          {lesson.summary.points && (
            <ul>
              {lesson.summary.points.map((point, idx) => (
                <li key={idx}>{point}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Resources */}
      {lesson.resources && lesson.resources.length > 0 && (
        <div className="downloads-section">
          <h3>Ressources à télécharger</h3>
          <div className="download-list">
            {lesson.resources.map((resource, idx) => (
              <div key={idx} className="download-item">
                <div className="download-item-info">
                  <div className="download-icon">{resource.icon}</div>
                  <div className="download-item-details">
                    <h4>{resource.title}</h4>
                    <p>{resource.type}</p>
                  </div>
                </div>
                {resource.download ? (
                  <a href={resource.link} className="download-btn" download>
                    Télécharger
                  </a>
                ) : (
                  <a href={resource.link} className="download-btn" target="_blank" rel="noopener noreferrer">
                    Accéder
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="lesson-navigation">
        {prevLesson && (() => {
          // Déterminer le slug du cours depuis le pathname
          const pathParts = window.location.pathname.split('/')
          const courseSlug = pathParts[2] || 'facebook-ads'
          return (
            <Link 
              to={prevLesson.path || (prevLesson._id ? `/course/${courseSlug}/lesson/${prevLesson._id}` : '#')} 
              className="lesson-nav-btn lesson-nav-prev"
            >
              ← Leçon précédente
            </Link>
          )
        })()}
        {nextLesson && (
          <button
            onClick={handleNextLesson}
            className="lesson-nav-btn lesson-nav-next"
          >
            Leçon suivante →
          </button>
        )}
      </div>

      {/* Section Commentaires */}
      {isAuthenticated && user?.status === 'active' && (
        <div className="lesson-comments-section">
          <h2 className="lesson-comments-title">💬 Commentaires sur cette leçon</h2>
          
          {/* Formulaire de commentaire */}
          <form onSubmit={handleSubmitComment} className="lesson-comment-form">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Laissez un commentaire, une question ou un retour sur cette leçon..."
              className="lesson-comment-textarea"
              rows={4}
              maxLength={2000}
              required
            />
            <div className="lesson-comment-form-footer">
              <div className="lesson-comment-char-count">
                {newComment.length} / 2000 caractères
              </div>
              <button
                type="submit"
                disabled={submitting || !newComment.trim()}
                className="lesson-comment-submit-btn"
              >
                {submitting ? 'Envoi...' : 'Envoyer le commentaire'}
              </button>
            </div>
          </form>

          {/* Liste des commentaires */}
          <div className="lesson-comments-list">
            {loadingComments ? (
              <div className="lesson-comments-loading">Chargement des commentaires...</div>
            ) : comments.length === 0 ? (
              <div className="lesson-comments-empty">
                <p>Aucun commentaire pour cette leçon. Soyez le premier à commenter !</p>
              </div>
            ) : (
              comments.map(comment => {
                const statusBadge = getStatusBadge(comment.status)
                return (
                  <div key={comment._id} className={`lesson-comment-card lesson-comment-${comment.status}`}>
                    <div className="lesson-comment-header">
                      <div className="lesson-comment-user-info">
                        <div className="lesson-comment-avatar">
                          {comment.userEmail ? comment.userEmail.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="lesson-comment-user">
                            {comment.userEmail || 'Utilisateur'}
                          </div>
                          <span className="lesson-comment-date">
                            {new Date(comment.createdAt).toLocaleDateString('fr-FR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                      <span className={`lesson-comment-status ${statusBadge.class}`}>
                        {statusBadge.label}
                      </span>
                    </div>
                    <div className="lesson-comment-content">
                      {comment.content}
                    </div>
                    {comment.adminResponse && (
                      <div className="lesson-comment-response">
                        <div className="lesson-comment-response-header">
                          <strong>Réponse de l'administrateur :</strong>
                        </div>
                        <div className="lesson-comment-response-content">
                          {comment.adminResponse}
                        </div>
                        {comment.userId === user?._id && !comment.userResponse && (
                          <div className="lesson-comment-reply-section">
                            {replyingTo === comment._id ? (
                              <div className="lesson-comment-reply-form">
                                <textarea
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  placeholder="Répondre à l'administrateur..."
                                  className="lesson-comment-textarea"
                                  rows={3}
                                  maxLength={2000}
                                />
                                <div className="lesson-comment-form-footer">
                                  <div className="lesson-comment-char-count">
                                    {replyText.length} / 2000 caractères
                                  </div>
                                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setReplyingTo(null)
                                        setReplyText('')
                                      }}
                                      className="lesson-comment-submit-btn"
                                      style={{ background: 'var(--bg-tertiary)' }}
                                    >
                                      Annuler
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleSubmitReply(comment._id)}
                                      disabled={submittingReply || !replyText.trim()}
                                      className="lesson-comment-submit-btn"
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
                                className="lesson-comment-reply-btn"
                              >
                                💬 Répondre
                              </button>
                            )}
                          </div>
                        )}
                        {comment.userResponse && (
                          <div className="lesson-comment-user-response">
                            <div className="lesson-comment-response-header">
                              <strong>Votre réponse :</strong>
                            </div>
                            <div className="lesson-comment-response-content">
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
    </>
  )
}


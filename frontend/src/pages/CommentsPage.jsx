import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { CONFIG } from '../config/config'
import { lessons } from '../data/lessons'
import '../styles/comments.css'

export default function CommentsPage() {
  const { user, token, isAuthenticated } = useAuth()
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [selectedLesson, setSelectedLesson] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    if (isAuthenticated && user?.status === 'active' && token) {
      console.log('🔄 useEffect CommentsPage - Chargement commentaires')
      fetchComments()
    } else {
      console.log('⚠️ useEffect CommentsPage - Conditions non remplies:', {
        isAuthenticated,
        userStatus: user?.status,
        hasToken: !!token
      })
    }
  }, [isAuthenticated, user, token])

  const fetchComments = async () => {
    if (!token || user?.status !== 'active') {
      console.log('⚠️ fetchComments: Token ou user manquant')
      return
    }

    setLoading(true)
    try {
      console.log(`📋 Récupération commentaires pour ${user.email}`)
      
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/comments`, {
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
        setMessage({ type: 'error', text: errorData.error || 'Erreur lors du chargement des commentaires' })
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des commentaires:', error)
      setMessage({ type: 'error', text: 'Erreur lors du chargement des commentaires' })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!newComment.trim()) {
      setMessage({ type: 'error', text: 'Veuillez saisir un commentaire' })
      return
    }

    if (newComment.length > 2000) {
      setMessage({ type: 'error', text: 'Le commentaire ne peut pas dépasser 2000 caractères' })
      return
    }

    setSubmitting(true)
    setMessage({ type: '', text: '' })

    try {
      const lesson = selectedLesson ? lessons.find(l => l.id === parseInt(selectedLesson)) : null

      const response = await fetch(`${CONFIG.BACKEND_URL}/api/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: newComment.trim(),
          lessonId: lesson ? lesson.id : null,
          lessonTitle: lesson ? lesson.title : null
        })
      })

      const data = await response.json()

      if (response.ok) {
        console.log('✅ Commentaire créé avec succès:', data.comment)
        setMessage({ type: 'success', text: 'Commentaire envoyé avec succès !' })
        setNewComment('')
        setSelectedLesson('')
        // Rafraîchir les commentaires après un court délai pour laisser la DB se mettre à jour
        setTimeout(() => {
          fetchComments()
        }, 500)
      } else {
        console.error('❌ Erreur lors de l\'envoi du commentaire:', data.error)
        setMessage({ type: 'error', text: data.error || 'Erreur lors de l\'envoi du commentaire' })
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du commentaire:', error)
      setMessage({ type: 'error', text: 'Erreur lors de l\'envoi du commentaire' })
    } finally {
      setSubmitting(false)
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

  if (!isAuthenticated || user?.status !== 'active') {
    return (
      <div className="comments-container">
        <div className="comments-message">
          <p>Vous devez être connecté et avoir un compte actif pour laisser un commentaire.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="comments-container">
      <div className="comments-header">
        <h1>💬 Espace Commentaires</h1>
        <p>Partagez vos questions, retours ou suggestions</p>
      </div>

      {message.text && (
        <div className={`comments-message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="comments-form-section">
        <h2>Laisser un commentaire</h2>
        <form onSubmit={handleSubmit} className="comments-form">
          <div className="comments-form-group">
            <label htmlFor="lesson">Leçon concernée (optionnel)</label>
            <select
              id="lesson"
              value={selectedLesson}
              onChange={(e) => setSelectedLesson(e.target.value)}
              className="comments-select"
            >
              <option value="">Aucune leçon spécifique</option>
              {lessons.filter(l => !l.isCoaching).map(lesson => (
                <option key={lesson.id} value={lesson.id}>
                  {lesson.badge} - {lesson.title}
                </option>
              ))}
            </select>
          </div>

          <div className="comments-form-group">
            <label htmlFor="comment">Votre commentaire *</label>
            <textarea
              id="comment"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Écrivez votre commentaire ici..."
              className="comments-textarea"
              rows={6}
              maxLength={2000}
              required
            />
            <div className="comments-char-count">
              {newComment.length} / 2000 caractères
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="comments-submit-btn"
          >
            {submitting ? 'Envoi...' : 'Envoyer le commentaire'}
          </button>
        </form>
      </div>

      <div className="comments-list-section">
        <h2>Mes commentaires</h2>
        {loading ? (
          <div className="comments-loading">Chargement...</div>
        ) : comments.length === 0 ? (
          <div className="comments-empty">
            <p>Vous n'avez pas encore laissé de commentaire.</p>
          </div>
        ) : (
          <div className="comments-list">
            {comments.map(comment => {
              const statusBadge = getStatusBadge(comment.status)
              return (
                <div key={comment._id} className={`comment-card comment-${comment.status}`}>
                  <div className="comment-header">
                    <div className="comment-meta">
                      <div className="comment-user-info">
                        <div className="comment-avatar">
                          {comment.userEmail ? comment.userEmail.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="comment-user-details">
                          <div className="comment-user-name">{comment.userEmail || 'Utilisateur'}</div>
                          <span className="comment-date">
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
                      {comment.lessonTitle && (
                        <span className="comment-lesson">
                          📚 {comment.lessonTitle}
                        </span>
                      )}
                    </div>
                    <span className={`comment-status ${statusBadge.class}`}>
                      {statusBadge.label}
                    </span>
                  </div>
                  <div className="comment-content">
                    {comment.content}
                  </div>
                  {comment.adminResponse && (
                    <div className="comment-response">
                      <div className="comment-response-header">
                        <strong>Réponse de l'administrateur :</strong>
                      </div>
                      <div className="comment-response-content">
                        {comment.adminResponse}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}


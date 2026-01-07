import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { CONFIG } from '../config/config'
import { lessons } from '../data/lessons'

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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6 text-center">
            <p className="text-yellow-800 dark:text-yellow-300">
              Vous devez être connecté et avoir un compte actif pour laisser un commentaire.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            💬 Espace Commentaires
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Partagez vos questions, retours ou suggestions
          </p>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`rounded-xl p-4 ${
            message.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
          }`}>
            {message.text}
          </div>
        )}

        {/* Form Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Laisser un commentaire</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="lesson" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Leçon concernée (optionnel)
              </label>
              <select
                id="lesson"
                value={selectedLesson}
                onChange={(e) => setSelectedLesson(e.target.value)}
                className="input-startup"
              >
                <option value="">Aucune leçon spécifique</option>
                {lessons.filter(l => !l.isCoaching).map(lesson => (
                  <option key={lesson.id} value={lesson.id}>
                    {lesson.badge} - {lesson.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="comment" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Votre commentaire *
              </label>
              <textarea
                id="comment"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Écrivez votre commentaire ici..."
                className="input-startup resize-none"
                rows={6}
                maxLength={2000}
                required
              />
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-right">
                {newComment.length} / 2000 caractères
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Envoi...' : 'Envoyer le commentaire'}
            </button>
          </form>
        </div>

        {/* Comments List */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Mes commentaires</h2>
          {loading ? (
            <div className="text-center py-12 text-gray-600 dark:text-gray-400">Chargement...</div>
          ) : comments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">Vous n'avez pas encore laissé de commentaire.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map(comment => {
                const statusBadge = getStatusBadge(comment.status)
                const statusColors = {
                  pending: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300',
                  approved: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300',
                  rejected: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
                }
                return (
                  <div key={comment._id} className={`bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 border ${
                    comment.status === 'approved' ? 'border-green-200 dark:border-green-800' :
                    comment.status === 'rejected' ? 'border-red-200 dark:border-red-800' :
                    'border-gray-200 dark:border-gray-600'
                  }`}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 rounded-full bg-brand text-white flex items-center justify-center font-bold text-lg">
                          {comment.userEmail ? comment.userEmail.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 dark:text-white mb-1">
                            {comment.userEmail || 'Utilisateur'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                            {new Date(comment.createdAt).toLocaleDateString('fr-FR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          {comment.lessonTitle && (
                            <span className="inline-block px-3 py-1 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 rounded-lg text-sm font-medium">
                              📚 {comment.lessonTitle}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${statusColors[comment.status] || statusColors.pending}`}>
                        {statusBadge.label}
                      </span>
                    </div>
                    <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {comment.content}
                    </div>
                    {comment.adminResponse && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                        <div className="font-semibold text-gray-900 dark:text-white mb-2">
                          Réponse de l'administrateur :
                        </div>
                        <div className="text-gray-700 dark:text-gray-300 bg-brand-50 dark:bg-brand-900/20 rounded-lg p-4">
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
    </div>
  )
}


import { useState, useEffect } from 'react'
import { CONFIG } from '../../config/config'
import { useAuth } from '../../contexts/AuthContext'
import '../../styles/admin.css'
import '../../styles/admin-comments.css'

export default function AdminCommentsPage() {
  const { token } = useAuth()
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedComment, setSelectedComment] = useState(null)
  const [adminResponse, setAdminResponse] = useState('')
  const [notification, setNotification] = useState(null)

  useEffect(() => {
    if (token) {
      console.log('🔄 useEffect AdminCommentsPage - Chargement commentaires')
      fetchComments()
    } else {
      console.log('⚠️ useEffect AdminCommentsPage - Token manquant')
    }
  }, [token, statusFilter])

  const fetchComments = async () => {
    if (!token) {
      console.log('⚠️ fetchComments admin: Token manquant')
      return
    }

    setLoading(true)
    try {
      const url = statusFilter !== 'all' 
        ? `${CONFIG.BACKEND_URL}/api/admin/comments?status=${statusFilter}`
        : `${CONFIG.BACKEND_URL}/api/admin/comments`

      console.log(`📋 Récupération commentaires admin - URL: ${url}`)

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      console.log(`📡 Réponse API commentaires admin: ${response.status} ${response.statusText}`)

      if (response.ok) {
        const data = await response.json()
        console.log(`✅ ${data.comments?.length || 0} commentaires récupérés depuis la DB`)
        setComments(data.comments || [])
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ Erreur API commentaires admin:', response.status, errorData)
        showNotification(errorData.error || 'Erreur lors du chargement des commentaires', 'error')
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des commentaires:', error)
      showNotification('Erreur lors du chargement des commentaires', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const handleStatusChange = async (commentId, newStatus) => {
    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/admin/comments/${commentId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus,
          adminResponse: adminResponse || undefined
        })
      })

      const data = await response.json()

      if (response.ok) {
        showNotification(data.message || 'Statut mis à jour avec succès')
        setSelectedComment(null)
        setAdminResponse('')
        fetchComments()
      } else {
        showNotification(data.error || 'Erreur lors de la mise à jour', 'error')
      }
    } catch (error) {
      showNotification('Erreur lors de la mise à jour', 'error')
    }
  }

  const handleDelete = async (commentId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce commentaire ?')) {
      return
    }

    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/admin/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        showNotification('Commentaire supprimé avec succès')
        fetchComments()
      } else {
        const data = await response.json()
        showNotification(data.error || 'Erreur lors de la suppression', 'error')
      }
    } catch (error) {
      showNotification('Erreur lors de la suppression', 'error')
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: { label: 'En attente', class: 'admin-badge-pending' },
      approved: { label: 'Approuvé', class: 'admin-badge-active' },
      rejected: { label: 'Rejeté', class: 'admin-badge-inactive' }
    }
    return badges[status] || badges.pending
  }

  const filteredComments = comments

  if (loading) {
    return (
      <div className="admin-comments-page">
        <div className="admin-loading">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="admin-comments-page">
      {notification && (
        <div className={`admin-notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      <div className="admin-page-header">
        <div>
          <h1>💬 Gestion des Commentaires</h1>
          <p>Gérez les commentaires des utilisateurs</p>
        </div>
        <div className="admin-comments-stats">
          <div className="admin-stat-mini">
            <span className="admin-stat-mini-label">Total</span>
            <span className="admin-stat-mini-value">{comments.length}</span>
          </div>
          <div className="admin-stat-mini">
            <span className="admin-stat-mini-label">En attente</span>
            <span className="admin-stat-mini-value">{comments.filter(c => c.status === 'pending').length}</span>
          </div>
        </div>
      </div>

      <div className="admin-filters">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="admin-filter-select"
        >
          <option value="all">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="approved">Approuvés</option>
          <option value="rejected">Rejetés</option>
        </select>
      </div>

      <div className="admin-comments-list">
        {filteredComments.length === 0 ? (
          <div className="admin-empty">Aucun commentaire trouvé</div>
        ) : (
          filteredComments.map(comment => {
            const statusBadge = getStatusBadge(comment.status)
            return (
              <div key={comment._id} className={`admin-comment-card admin-comment-${comment.status}`}>
                <div className="admin-comment-header">
                  <div className="admin-comment-user">
                    <div className="admin-comment-user-info">
                      <div className="admin-comment-avatar">
                        {comment.userEmail ? comment.userEmail.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <strong>{comment.userEmail || 'Utilisateur'}</strong>
                        <span className="admin-comment-date">
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
                      <span className="admin-comment-lesson">
                        📚 {comment.lessonTitle}
                      </span>
                    )}
                  </div>
                  <span className={`admin-badge ${statusBadge.class}`}>
                    {statusBadge.label}
                  </span>
                </div>
                <div className="admin-comment-content">
                  {comment.content}
                </div>
                {comment.adminResponse && (
                  <div className="admin-comment-response">
                    <div className="admin-comment-response-header">
                      <strong>Votre réponse :</strong>
                    </div>
                    <div className="admin-comment-response-content">
                      {comment.adminResponse}
                    </div>
                  </div>
                )}
                <div className="admin-comment-actions">
                  {comment.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleStatusChange(comment._id, 'approved')}
                        className="admin-btn admin-btn-validate"
                        title="Approuver"
                      >
                        ✅ Approuver
                      </button>
                      <button
                        onClick={() => setSelectedComment(comment)}
                        className="admin-btn admin-btn-edit"
                        title="Répondre"
                      >
                        💬 Répondre
                      </button>
                      <button
                        onClick={() => handleStatusChange(comment._id, 'rejected')}
                        className="admin-btn admin-btn-delete"
                        title="Rejeter"
                      >
                        ❌ Rejeter
                      </button>
                    </>
                  )}
                  {comment.status === 'approved' && (
                    <button
                      onClick={() => setSelectedComment(comment)}
                      className="admin-btn admin-btn-edit"
                      title="Répondre"
                    >
                      💬 Répondre
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(comment._id)}
                    className="admin-btn admin-btn-delete"
                    title="Supprimer"
                  >
                    🗑️ Supprimer
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {selectedComment && (
        <div className="admin-modal-overlay" onClick={() => setSelectedComment(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>Répondre au commentaire</h2>
              <button
                onClick={() => setSelectedComment(null)}
                className="admin-modal-close"
              >
                ×
              </button>
            </div>
            <div className="admin-modal-content">
              <div className="admin-comment-preview">
                <strong>{selectedComment.userEmail}</strong>
                <p>{selectedComment.content}</p>
              </div>
              <div className="admin-form-group">
                <label htmlFor="adminResponse">Votre réponse</label>
                <textarea
                  id="adminResponse"
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  placeholder="Écrivez votre réponse ici..."
                  rows={4}
                  className="admin-textarea"
                />
              </div>
            </div>
            <div className="admin-modal-footer">
              <button
                onClick={() => {
                  handleStatusChange(selectedComment._id, selectedComment.status === 'pending' ? 'approved' : selectedComment.status)
                }}
                className="admin-btn admin-btn-primary"
              >
                Enregistrer la réponse
              </button>
              <button
                onClick={() => {
                  setSelectedComment(null)
                  setAdminResponse('')
                }}
                className="admin-btn admin-btn-secondary"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


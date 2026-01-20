import { useState, useEffect } from 'react'
import { CONFIG } from '../../config/config'
import { useAuth } from '../../contexts/AuthContext'

export default function AdminCoachingReservationsPage() {
  const { token } = useAuth()
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [notification, setNotification] = useState(null)

  useEffect(() => {
    if (token) {
      fetchReservations()
    }
  }, [token, statusFilter])

  const fetchReservations = async () => {
    if (!token) return
    setLoading(true)
    try {
      const url = statusFilter !== 'all'
        ? `${CONFIG.BACKEND_URL}/api/admin/coaching-reservations?status=${statusFilter}`
        : `${CONFIG.BACKEND_URL}/api/admin/coaching-reservations`

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setReservations(data.reservations || [])
      } else {
        const errorData = await response.json().catch(() => ({}))
        showNotification(errorData.error || 'Erreur chargement réservations', 'error')
      }
    } catch (error) {
      showNotification('Erreur chargement réservations', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const handleStatusChange = async (reservationId, newStatus) => {
    try {
      const response = await fetch(
        `${CONFIG.BACKEND_URL}/api/admin/coaching-reservations/${reservationId}/status`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: newStatus })
        }
      )

      const data = await response.json()
      if (response.ok) {
        showNotification('Statut mis à jour')
        fetchReservations()
      } else {
        showNotification(data.error || 'Erreur mise à jour', 'error')
      }
    } catch (error) {
      showNotification('Erreur mise à jour', 'error')
    }
  }

  const handleDelete = async (reservationId) => {
    if (!window.confirm('Supprimer cette réservation ?')) return
    try {
      const response = await fetch(
        `${CONFIG.BACKEND_URL}/api/admin/coaching-reservations/${reservationId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      if (response.ok) {
        showNotification('Réservation supprimée')
        fetchReservations()
      } else {
        const data = await response.json()
        showNotification(data.error || 'Erreur suppression', 'error')
      }
    } catch (error) {
      showNotification('Erreur suppression', 'error')
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: { label: 'En attente', class: 'admin-badge-pending' },
      confirmed: { label: 'Confirmée', class: 'admin-badge-active' },
      cancelled: { label: 'Annulée', class: 'admin-badge-inactive' }
    }
    return badges[status] || badges.pending
  }

  const formatDateLabel = (dateStr) => {
    if (!dateStr) return '—'
    const dateObj = new Date(dateStr)
    if (Number.isNaN(dateObj.getTime())) return dateStr
    return dateObj.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—'
    const dateObj = new Date(dateStr)
    if (Number.isNaN(dateObj.getTime())) return dateStr
    return dateObj.toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })
  }

  const formatCourseName = (slug) => {
    if (!slug) return '—'
    return slug
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
  }

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
          <h1>📅 Réservations Coaching</h1>
          <p>Suivi des demandes de coaching</p>
        </div>
        <div className="admin-comments-stats">
          <div className="admin-stat-mini">
            <span className="admin-stat-mini-label">Total</span>
            <span className="admin-stat-mini-value">{reservations.length}</span>
          </div>
          <div className="admin-stat-mini">
            <span className="admin-stat-mini-label">En attente</span>
            <span className="admin-stat-mini-value">
              {reservations.filter(r => r.status === 'pending').length}
            </span>
          </div>
        </div>
      </div>

      <div className="admin-filter-bar">
        <button
          onClick={() => setStatusFilter('all')}
          className={`admin-filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
        >
          Tous
        </button>
        <button
          onClick={() => setStatusFilter('pending')}
          className={`admin-filter-btn ${statusFilter === 'pending' ? 'active' : ''}`}
        >
          En attente
        </button>
        <button
          onClick={() => setStatusFilter('confirmed')}
          className={`admin-filter-btn ${statusFilter === 'confirmed' ? 'active' : ''}`}
        >
          Confirmées
        </button>
        <button
          onClick={() => setStatusFilter('cancelled')}
          className={`admin-filter-btn ${statusFilter === 'cancelled' ? 'active' : ''}`}
        >
          Annulées
        </button>
      </div>

      {reservations.length === 0 ? (
        <div className="admin-empty">
          <div className="admin-empty-icon">📭</div>
          <h3>Aucune réservation</h3>
          <p>Aucune demande pour le moment.</p>
        </div>
      ) : (
        <div className="admin-comments-list">
          {reservations.map((reservation) => {
            const badge = getStatusBadge(reservation.status)
            return (
              <div key={reservation._id} className="admin-comment-card">
                <div className="admin-comment-header">
                  <div className="admin-comment-user flex flex-col gap-1">
                    <span className="admin-comment-name">{reservation.fullName}</span>
                    <span className="admin-comment-email">{reservation.email}</span>
                  </div>
                  <div className={`admin-badge ${badge.class}`}>{badge.label}</div>
                </div>

                <div className="admin-comment-content">
                  <div className="flex flex-wrap gap-2 text-xs sm:text-sm text-secondary">
                    <span className="px-2 py-1 rounded-lg bg-secondary">
                      📅 {formatDateLabel(reservation.date)} à {reservation.time || '—'}
                    </span>
                    <span className="px-2 py-1 rounded-lg bg-secondary">
                      ⏱️ {reservation.durationMinutes || 0} min
                    </span>
                    <span className="px-2 py-1 rounded-lg bg-secondary">
                      🕒 Créée le {formatDateTime(reservation.createdAt)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm">
                    <div className="space-y-1">
                      <p className="text-secondary">📚 Formation</p>
                      <p className="text-primary font-semibold">
                        {formatCourseName(reservation.courseSlug)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-secondary">📱 Téléphone</p>
                      <p className="text-primary font-semibold">
                        {reservation.phone || '—'}
                      </p>
                    </div>
                  </div>

                  {reservation.message && (
                    <div className="mt-3 p-3 rounded-lg bg-secondary/60 border border-theme text-sm text-primary">
                      <span className="text-secondary">💬 Message</span>
                      <p className="mt-1">{reservation.message}</p>
                    </div>
                  )}
                </div>

                <div className="admin-comment-actions flex flex-wrap gap-2">
                  <button
                    onClick={() => handleStatusChange(reservation._id, 'confirmed')}
                    className="admin-btn admin-btn-sm admin-btn-success"
                  >
                    ✅ Confirmer
                  </button>
                  <button
                    onClick={() => handleStatusChange(reservation._id, 'cancelled')}
                    className="admin-btn admin-btn-sm admin-btn-warning"
                  >
                    ❌ Annuler
                  </button>
                  <button
                    onClick={() => handleDelete(reservation._id)}
                    className="admin-btn admin-btn-sm admin-btn-danger"
                  >
                    🗑️ Supprimer
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

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
                  <div className="admin-comment-user">
                    <span className="admin-comment-name">{reservation.fullName}</span>
                    <span className="admin-comment-email">{reservation.email}</span>
                  </div>
                  <div className={`admin-badge ${badge.class}`}>{badge.label}</div>
                </div>

                <div className="admin-comment-content">
                  <p>
                    📅 {reservation.date} à {reservation.time} • ⏱️ {reservation.durationMinutes} min
                  </p>
                  {reservation.phone && (
                    <p>📱 {reservation.phone}</p>
                  )}
                  {reservation.courseSlug && (
                    <p>📚 Cours: {reservation.courseSlug}</p>
                  )}
                  {reservation.message && (
                    <p>💬 {reservation.message}</p>
                  )}
                </div>

                <div className="admin-comment-actions">
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

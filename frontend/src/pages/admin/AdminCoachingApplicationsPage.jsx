import { useState, useEffect } from 'react'
import { CONFIG } from '../../config/config'
import { useAuth } from '../../contexts/AuthContext'

export default function AdminCoachingApplicationsPage() {
  const { token } = useAuth()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [notification, setNotification] = useState(null)

  useEffect(() => {
    if (token) {
      fetchApplications()
    }
  }, [token, statusFilter])

  const fetchApplications = async () => {
    if (!token) return
    setLoading(true)
    try {
      const url = statusFilter !== 'all'
        ? `${CONFIG.BACKEND_URL}/api/coaching-applications/admin?status=${statusFilter}`
        : `${CONFIG.BACKEND_URL}/api/coaching-applications/admin`

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setApplications(data.applications || [])
      } else {
        const errorData = await response.json().catch(() => ({}))
        showNotification(errorData.error || 'Erreur chargement candidatures', 'error')
      }
    } catch (error) {
      showNotification('Erreur chargement candidatures', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const handleAccept = async (id) => {
    try {
      const response = await fetch(
        `${CONFIG.BACKEND_URL}/api/coaching-applications/${id}/accept`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.ok) {
        showNotification('Candidature acceptée')
        fetchApplications()
      } else {
        const data = await response.json()
        showNotification(data.error || 'Erreur acceptation', 'error')
      }
    } catch (error) {
      showNotification('Erreur acceptation', 'error')
    }
  }

  const handleReject = async (id) => {
    try {
      const response = await fetch(
        `${CONFIG.BACKEND_URL}/api/coaching-applications/${id}/reject`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.ok) {
        showNotification('Candidature refusée')
        fetchApplications()
      } else {
        const data = await response.json()
        showNotification(data.error || 'Erreur refus', 'error')
      }
    } catch (error) {
      showNotification('Erreur refus', 'error')
    }
  }

  const copyWhatsApp = (whatsapp) => {
    navigator.clipboard.writeText(whatsapp)
    showNotification('Numéro WhatsApp copié')
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    const date = new Date(dateStr)
    if (Number.isNaN(date.getTime())) return dateStr
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const getStatusBadge = (status) => {
    const badges = {
      'En attente': { label: 'En attente', class: 'admin-badge-pending' },
      'Accepté': { label: 'Accepté', class: 'admin-badge-active' },
      'Refusé': { label: 'Refusé', class: 'admin-badge-inactive' }
    }
    return badges[status] || badges['En attente']
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
          <h1>📋 Candidatures Coaching 7 Jours</h1>
          <p>Gestion des candidatures</p>
        </div>
        <div className="admin-comments-stats">
          <div className="admin-stat-mini">
            <span className="admin-stat-mini-label">Total</span>
            <span className="admin-stat-mini-value">{applications.length}</span>
          </div>
          <div className="admin-stat-mini">
            <span className="admin-stat-mini-label">En attente</span>
            <span className="admin-stat-mini-value">
              {applications.filter(a => a.status === 'En attente').length}
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
          onClick={() => setStatusFilter('En attente')}
          className={`admin-filter-btn ${statusFilter === 'En attente' ? 'active' : ''}`}
        >
          En attente
        </button>
        <button
          onClick={() => setStatusFilter('Accepté')}
          className={`admin-filter-btn ${statusFilter === 'Accepté' ? 'active' : ''}`}
        >
          Acceptés
        </button>
        <button
          onClick={() => setStatusFilter('Refusé')}
          className={`admin-filter-btn ${statusFilter === 'Refusé' ? 'active' : ''}`}
        >
          Refusés
        </button>
      </div>

      {applications.length === 0 ? (
        <div className="admin-empty">
          <div className="admin-empty-icon">📭</div>
          <h3>Aucune candidature</h3>
          <p>Aucune candidature pour le moment.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-300">
                <th className="px-4 py-3 text-left text-sm font-semibold">Nom</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">WhatsApp</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Produit</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Shopify</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Stock</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Budget</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Expérience</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Statut</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => {
                const badge = getStatusBadge(app.status)
                return (
                  <tr key={app._id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{app.fullName}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span>{app.whatsapp}</span>
                        <button
                          onClick={() => copyWhatsApp(app.whatsapp)}
                          className="text-blue-600 hover:text-blue-800 text-xs"
                          title="Copier"
                        >
                          📋
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{app.hasProduct}</td>
                    <td className="px-4 py-3 text-sm">{app.hasShopify}</td>
                    <td className="px-4 py-3 text-sm">{app.hasStock}</td>
                    <td className="px-4 py-3 text-sm">{app.budget}</td>
                    <td className="px-4 py-3 text-sm">{app.adExperience}</td>
                    <td className="px-4 py-3">
                      <span className={`admin-badge ${badge.class}`}>{badge.label}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(app.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {app.status === 'En attente' && (
                          <>
                            <button
                              onClick={() => handleAccept(app._id)}
                              className="admin-btn admin-btn-sm admin-btn-success"
                            >
                              ✅ Accepter
                            </button>
                            <button
                              onClick={() => handleReject(app._id)}
                              className="admin-btn admin-btn-sm admin-btn-danger"
                            >
                              ❌ Refuser
                            </button>
                          </>
                        )}
                        {app.status === 'Accepté' && (
                          <button
                            onClick={() => copyWhatsApp(app.whatsapp)}
                            className="admin-btn admin-btn-sm admin-btn-success"
                          >
                            📋 Copier WhatsApp
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

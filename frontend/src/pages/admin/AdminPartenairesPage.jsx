import { useEffect, useState } from 'react'
import { CONFIG } from '../../config/config'
import { useAuth } from '../../contexts/AuthContext'

const statutOptions = [
  { value: 'all', label: 'Tous' },
  { value: 'en_attente', label: 'En attente' },
  { value: 'approuve', label: 'Approuvés' },
  { value: 'suspendu', label: 'Suspendus' }
]

const typeOptions = [
  { value: 'all', label: 'Tous les types' },
  { value: 'agence_livraison', label: 'Agence de livraison' },
  { value: 'closeur', label: 'Closeur' },
  { value: 'transitaire', label: 'Transitaire' },
  { value: 'autre', label: 'Autre' }
]

const domaineOptions = [
  { value: 'all', label: 'Tous les domaines' },
  { value: 'livreur', label: 'Livreur' },
  { value: 'agence_livraison', label: 'Agence de livraison' },
  { value: 'transitaire', label: 'Transitaire' },
  { value: 'closeur', label: 'Closeur' },
  { value: 'fournisseur', label: 'Fournisseur' },
  { value: 'autre', label: 'Autre' }
]

const domaineLabel = (value) => {
  const match = domaineOptions.find((item) => item.value === value)
  return match ? match.label : value || '—'
}

const typeLabel = (value) => {
  const match = typeOptions.find((item) => item.value === value)
  return match ? match.label : value || '—'
}

const statutLabel = (value) => {
  const match = statutOptions.find((item) => item.value === value)
  return match ? match.label : value || '—'
}

export default function AdminPartenairesPage() {
  const { token } = useAuth()
  const [partenaires, setPartenaires] = useState([])
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState(null)
  const [filters, setFilters] = useState({
    statut: 'all',
    pays: '',
    domaine: 'all',
    type: 'all'
  })
  const [queryFilters, setQueryFilters] = useState({
    statut: 'all',
    pays: '',
    domaine: 'all',
    type: 'all'
  })

  useEffect(() => {
    if (token) {
      fetchPartenaires()
    }
  }, [token, queryFilters])

  const buildQuery = () => {
    const params = new URLSearchParams()
    if (queryFilters.statut && queryFilters.statut !== 'all') {
      params.append('statut', queryFilters.statut)
    }
    if (queryFilters.domaine && queryFilters.domaine !== 'all') {
      params.append('domaine', queryFilters.domaine)
    }
    if (queryFilters.type && queryFilters.type !== 'all') {
      params.append('type', queryFilters.type)
    }
    if (queryFilters.pays.trim()) {
      params.append('pays', queryFilters.pays.trim())
    }
    const query = params.toString()
    return query ? `?${query}` : ''
  }

  const fetchPartenaires = async () => {
    if (!token) return
    setLoading(true)
    try {
      const response = await fetch(
        `${CONFIG.BACKEND_URL}/api/admin/partenaires${buildQuery()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (response.ok) {
        const data = await response.json()
        setPartenaires(data.partenaires || [])
      } else {
        const errorData = await response.json().catch(() => ({}))
        showNotification(errorData.error || 'Erreur chargement', 'error')
      }
    } catch (error) {
      showNotification('Erreur chargement', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const updateStatus = async (id, action) => {
    try {
      const response = await fetch(
        `${CONFIG.BACKEND_URL}/api/admin/partenaires/${id}/${action}`,
        { method: 'PUT', headers: { Authorization: `Bearer ${token}` } }
      )
      if (response.ok) {
        showNotification('Statut mis à jour')
        fetchPartenaires()
      } else {
        const data = await response.json()
        showNotification(data.error || 'Erreur mise à jour', 'error')
      }
    } catch (error) {
      showNotification('Erreur mise à jour', 'error')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce partenaire ?')) return
    try {
      const response = await fetch(
        `${CONFIG.BACKEND_URL}/api/admin/partenaires/${id}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
      )
      if (response.ok) {
        showNotification('Partenaire supprimé')
        fetchPartenaires()
      } else {
        const data = await response.json()
        showNotification(data.error || 'Erreur suppression', 'error')
      }
    } catch (error) {
      showNotification('Erreur suppression', 'error')
    }
  }

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—'
    const dateObj = new Date(dateStr)
    if (Number.isNaN(dateObj.getTime())) return dateStr
    return dateObj.toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })
  }

  const applyFilters = () => {
    setQueryFilters(filters)
  }

  const resetFilters = () => {
    const reset = { statut: 'all', pays: '', domaine: 'all', type: 'all' }
    setFilters(reset)
    setQueryFilters(reset)
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
          <h1>🤝 Partenaires</h1>
          <p>Validation et suivi des partenaires fiables</p>
        </div>
        <div className="admin-comments-stats">
          <div className="admin-stat-mini">
            <span className="admin-stat-mini-label">Total</span>
            <span className="admin-stat-mini-value">{partenaires.length}</span>
          </div>
        </div>
      </div>

      <div className="admin-filter-bar flex flex-wrap gap-3">
        <select
          className="admin-select"
          value={filters.statut}
          onChange={(e) => setFilters((prev) => ({ ...prev, statut: e.target.value }))}
        >
          {statutOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          className="admin-select"
          value={filters.type}
          onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}
        >
          {typeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          className="admin-select"
          value={filters.domaine}
          onChange={(e) => setFilters((prev) => ({ ...prev, domaine: e.target.value }))}
        >
          {domaineOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          className="admin-input"
          placeholder="Pays"
          value={filters.pays}
          onChange={(e) => setFilters((prev) => ({ ...prev, pays: e.target.value }))}
        />
        <button className="admin-btn admin-btn-sm admin-btn-primary" onClick={applyFilters}>
          Filtrer
        </button>
        <button className="admin-btn admin-btn-sm admin-btn-secondary" onClick={resetFilters}>
          Réinitialiser
        </button>
      </div>

      {partenaires.length === 0 ? (
        <div className="admin-empty">
          <div className="admin-empty-icon">📭</div>
          <h3>Aucun partenaire</h3>
          <p>Aucune inscription pour le moment.</p>
        </div>
      ) : (
        <div className="admin-comments-list">
          {partenaires.map((partenaire) => (
            <div key={partenaire._id} className="admin-comment-card">
              <div className="admin-comment-header">
                <div className="admin-comment-user flex flex-col gap-1">
                  <span className="admin-comment-name">{partenaire.nom}</span>
                  <span className="admin-comment-email">{typeLabel(partenaire.type_partenaire)}</span>
                </div>
                <div className="text-xs text-secondary">
                  {statutLabel(partenaire.statut)}
                </div>
              </div>

              <div className="admin-comment-content">
                <div className="flex flex-wrap gap-2 text-xs sm:text-sm text-secondary">
                  <span className="px-2 py-1 rounded-lg bg-secondary">
                    🌍 {partenaire.pays || '—'}
                  </span>
                  <span className="px-2 py-1 rounded-lg bg-secondary">
                    📍 {partenaire.ville || '—'}
                  </span>
                  <span className="px-2 py-1 rounded-lg bg-secondary">
                    📱 {partenaire.whatsapp || '—'}
                  </span>
                  <span className="px-2 py-1 rounded-lg bg-secondary">
                    🕒 {formatDateTime(partenaire.created_at)}
                  </span>
                  <span className="px-2 py-1 rounded-lg bg-secondary">
                    🧩 {(partenaire.domaines_activite || [partenaire.domaine])
                      .filter(Boolean)
                      .map(domaineLabel)
                      .join(', ') || '—'}
                  </span>
                </div>
                {partenaire.description_courte && (
                  <div className="mt-3 text-sm text-secondary">
                    📝 {partenaire.description_courte}
                  </div>
                )}
                {partenaire.lien_contact && (
                  <div className="mt-3 text-sm text-secondary">
                    🔗 <a href={partenaire.lien_contact} target="_blank" rel="noreferrer" className="text-accent">
                      {partenaire.lien_contact}
                    </a>
                  </div>
                )}
                <div className="mt-3 text-sm text-secondary">
                  Autorisation affichage : {partenaire.autorisation_affichage ? 'Oui' : 'Non'}
                </div>
                <div className="mt-2 text-sm text-secondary">
                  ⭐ {partenaire.stats?.rating_avg || 0} ({partenaire.stats?.rating_count || 0} avis)
                  {' · '}📈 {partenaire.stats?.contact_count || 0} contacts
                </div>
              </div>

              <div className="admin-comment-actions flex flex-wrap gap-2">
                <button
                  onClick={() => updateStatus(partenaire._id, 'approve')}
                  className="admin-btn admin-btn-sm admin-btn-success"
                >
                  ✅ Approuver
                </button>
                <button
                  onClick={() => updateStatus(partenaire._id, 'suspend')}
                  className="admin-btn admin-btn-sm admin-btn-warning"
                >
                  ⛔ Suspendre
                </button>
                <button
                  onClick={() => handleDelete(partenaire._id)}
                  className="admin-btn admin-btn-sm admin-btn-danger"
                >
                  🗑️ Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

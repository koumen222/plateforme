import { useEffect, useState } from 'react'
import { CONFIG } from '../../config/config'
import { useAuth } from '../../contexts/AuthContext'

const typeOptions = [
  { value: 'all', label: 'Tous' },
  { value: 'livreur', label: 'Livreur' },
  { value: 'societe_livraison', label: 'Société de livraison' },
  { value: 'transitaire', label: 'Transitaire' },
  { value: 'closeur', label: 'Closeur' },
  { value: 'fournisseur', label: 'Fournisseur' },
  { value: 'autre', label: 'Autre' }
]

const typeLabel = (value) => {
  const match = typeOptions.find((item) => item.value === value)
  return match ? match.label : value || '—'
}

export default function AdminRecrutementPage() {
  const { token } = useAuth()
  const [recrutements, setRecrutements] = useState([])
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState(null)
  const [filters, setFilters] = useState({ type: 'all', pays: '', ville: '' })
  const [queryFilters, setQueryFilters] = useState({ type: 'all', pays: '', ville: '' })
  const [selected, setSelected] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    if (token) {
      fetchRecrutements()
    }
  }, [token, queryFilters])

  const buildQuery = () => {
    const params = new URLSearchParams()
    if (queryFilters.type && queryFilters.type !== 'all') {
      params.append('type', queryFilters.type)
    }
    if (queryFilters.pays.trim()) {
      params.append('pays', queryFilters.pays.trim())
    }
    if (queryFilters.ville.trim()) {
      params.append('ville', queryFilters.ville.trim())
    }
    const query = params.toString()
    return query ? `?${query}` : ''
  }

  const fetchRecrutements = async () => {
    if (!token) return
    setLoading(true)
    try {
      const response = await fetch(
        `${CONFIG.BACKEND_URL}/api/admin/recrutement${buildQuery()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (response.ok) {
        const data = await response.json()
        setRecrutements(data.recrutements || [])
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

  const fetchDetail = async (id) => {
    if (!token) return
    setDetailLoading(true)
    try {
      const response = await fetch(
        `${CONFIG.BACKEND_URL}/api/admin/recrutement/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (response.ok) {
        const data = await response.json()
        setSelected(data.recrutement || null)
      } else {
        const errorData = await response.json().catch(() => ({}))
        showNotification(errorData.error || 'Erreur détails', 'error')
      }
    } catch (error) {
      showNotification('Erreur détails', 'error')
    } finally {
      setDetailLoading(false)
    }
  }

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette entrée ?')) return
    try {
      const response = await fetch(
        `${CONFIG.BACKEND_URL}/api/admin/recrutement/${id}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
      )
      if (response.ok) {
        showNotification('Entrée supprimée')
        if (selected?._id === id) {
          setSelected(null)
        }
        fetchRecrutements()
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
    const reset = { type: 'all', pays: '', ville: '' }
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
          <h1>📇 Recrutement partenaires</h1>
          <p>Annuaire interne des partenaires</p>
        </div>
        <div className="admin-comments-stats">
          <div className="admin-stat-mini">
            <span className="admin-stat-mini-label">Total</span>
            <span className="admin-stat-mini-value">{recrutements.length}</span>
          </div>
        </div>
      </div>

      <div className="admin-filter-bar flex flex-wrap gap-3">
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
        <input
          type="text"
          className="admin-input"
          placeholder="Pays"
          value={filters.pays}
          onChange={(e) => setFilters((prev) => ({ ...prev, pays: e.target.value }))}
        />
        <input
          type="text"
          className="admin-input"
          placeholder="Ville"
          value={filters.ville}
          onChange={(e) => setFilters((prev) => ({ ...prev, ville: e.target.value }))}
        />
        <button className="admin-btn admin-btn-sm admin-btn-primary" onClick={applyFilters}>
          Filtrer
        </button>
        <button className="admin-btn admin-btn-sm admin-btn-secondary" onClick={resetFilters}>
          Réinitialiser
        </button>
      </div>

      {recrutements.length === 0 ? (
        <div className="admin-empty">
          <div className="admin-empty-icon">📭</div>
          <h3>Aucune entrée</h3>
          <p>Aucune information collectée pour le moment.</p>
        </div>
      ) : (
        <div className="admin-comments-list">
          {recrutements.map((entry) => (
            <div key={entry._id} className="admin-comment-card">
              <div className="admin-comment-header">
                <div className="admin-comment-user flex flex-col gap-1">
                  <span className="admin-comment-name">{entry.nom}</span>
                  <span className="admin-comment-email">{typeLabel(entry.type)}</span>
                </div>
                <div className="text-xs text-secondary">
                  {formatDateTime(entry.created_at)}
                </div>
              </div>

              <div className="admin-comment-content">
                <div className="flex flex-wrap gap-2 text-xs sm:text-sm text-secondary">
                  <span className="px-2 py-1 rounded-lg bg-secondary">
                    🌍 {entry.pays || '—'}
                  </span>
                  <span className="px-2 py-1 rounded-lg bg-secondary">
                    📍 {entry.ville || '—'}
                  </span>
                  <span className="px-2 py-1 rounded-lg bg-secondary">
                    📱 {entry.whatsapp || '—'}
                  </span>
                </div>
                {entry.lien_contact && (
                  <div className="mt-3 text-sm text-secondary">
                    🔗 <a href={entry.lien_contact} target="_blank" rel="noreferrer" className="text-accent">
                      {entry.lien_contact}
                    </a>
                  </div>
                )}
                <div className="mt-3 text-sm text-secondary">
                  Autorisation affichage : {entry.autorisation_affichage ? 'Oui' : 'Non'}
                </div>
              </div>

              <div className="admin-comment-actions flex flex-wrap gap-2">
                <button
                  onClick={() => fetchDetail(entry._id)}
                  className="admin-btn admin-btn-sm admin-btn-secondary"
                >
                  👁️ Voir détails
                </button>
                <button
                  onClick={() => handleDelete(entry._id)}
                  className="admin-btn admin-btn-sm admin-btn-danger"
                >
                  🗑️ Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="summary-card-lesson mt-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-bold">Détails partenaire</h2>
            <button className="admin-btn admin-btn-sm admin-btn-secondary" onClick={() => setSelected(null)}>
              Fermer
            </button>
          </div>
          {detailLoading ? (
            <div className="admin-loading mt-4">Chargement...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm">
              <div className="space-y-2">
                <p><strong>Nom :</strong> {selected.nom || '—'}</p>
                <p><strong>Type :</strong> {typeLabel(selected.type)}</p>
                <p><strong>WhatsApp :</strong> {selected.whatsapp || '—'}</p>
                <p><strong>Lien :</strong> {selected.lien_contact || '—'}</p>
              </div>
              <div className="space-y-2">
                <p><strong>Pays :</strong> {selected.pays || '—'}</p>
                <p><strong>Ville :</strong> {selected.ville || '—'}</p>
                <p><strong>Autorisation :</strong> {selected.autorisation_affichage ? 'Oui' : 'Non'}</p>
                <p><strong>Créé le :</strong> {formatDateTime(selected.created_at)}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

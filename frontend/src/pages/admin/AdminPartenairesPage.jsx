import { useEffect, useMemo, useState } from 'react'
import { CONFIG } from '../../config/config'
import { getImageUrl } from '../../utils/imageUtils'
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
  { value: 'livreur_personnel', label: 'Livreur personnel' },
  { value: 'agence_livraison', label: 'Agence de livraison' },
  { value: 'transitaire', label: 'Transitaire' },
  { value: 'closeur', label: 'Closeur' },
  { value: 'fournisseur', label: 'Fournisseur' },
  { value: 'autre', label: 'Autre' }
]

const disponibiliteOptions = [
  { value: 'disponible', label: 'Disponible' },
  { value: 'limite', label: 'Disponibilité limitée' },
  { value: 'indisponible', label: 'Indisponible' }
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
  const [saving, setSaving] = useState(false)
  const [notification, setNotification] = useState(null)
  const [galleryFiles, setGalleryFiles] = useState([])
  const [galleryPreview, setGalleryPreview] = useState([])
  const [logoFile, setLogoFile] = useState(null)
  const [galleryLink, setGalleryLink] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
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
  const getEmptyForm = () => ({
    nom: '',
    type_partenaire: 'autre',
    domaine: '',
    description_courte: '',
    pays: '',
    ville: '',
    telephone: '',
    whatsapp: '',
    email: '',
    lien_contact: '',
    disponibilite: 'disponible',
    autorisation_affichage: false,
    statut: 'en_attente',
    annees_experience: '',
    zones_couvertes: '',
    delais_moyens: '',
    methodes_paiement: '',
    langues_parlees: '',
    logo_url: ''
  })
  const [formData, setFormData] = useState(getEmptyForm)
  const [editingId, setEditingId] = useState(null)
  const isEditing = Boolean(editingId)

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

  const updateFormValue = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const resetForm = () => {
    setFormData(getEmptyForm())
    setEditingId(null)
    setGalleryFiles([])
    setGalleryPreview([])
    setLogoFile(null)
    setGalleryLink('')
    setShowForm(false)
  }

  const startEdit = (partenaire) => {
    const domaineSelection =
      partenaire.domaine || (partenaire.domaines_activite || []).find(Boolean) || 'autre'
    setEditingId(partenaire._id)
    setShowForm(true)
    setGalleryPreview(partenaire.galerie_photos || [])
    setFormData({
      nom: partenaire.nom || '',
      type_partenaire: partenaire.type_partenaire || 'autre',
      domaine: domaineSelection,
      description_courte: partenaire.description_courte || '',
      pays: partenaire.pays || '',
      ville: partenaire.ville || '',
      telephone: partenaire.telephone || '',
      whatsapp: partenaire.whatsapp || '',
      email: partenaire.email || '',
      lien_contact: partenaire.lien_contact || '',
      disponibilite: partenaire.disponibilite || 'disponible',
      autorisation_affichage: Boolean(partenaire.autorisation_affichage),
      statut: partenaire.statut || 'en_attente',
      annees_experience: partenaire.annees_experience ?? '',
      zones_couvertes: (partenaire.zones_couvertes || []).join(', '),
      delais_moyens: partenaire.delais_moyens || '',
      methodes_paiement: (partenaire.methodes_paiement || []).join(', '),
      langues_parlees: (partenaire.langues_parlees || []).join(', '),
      logo_url: partenaire.logo_url || ''
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const savePartenaire = async (event) => {
    event.preventDefault()
    if (!token || saving) return
    setSaving(true)
    try {
      const endpoint = isEditing
        ? `${CONFIG.BACKEND_URL}/api/admin/partenaires/${editingId}`
        : `${CONFIG.BACKEND_URL}/api/admin/partenaires`
      const response = await fetch(endpoint, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      if (response.ok) {
        showNotification(isEditing ? 'Partenaire mis à jour' : 'Partenaire ajouté')
        resetForm()
        fetchPartenaires()
      } else {
        const data = await response.json().catch(() => ({}))
        showNotification(data.error || 'Erreur enregistrement', 'error')
      }
    } catch (error) {
      showNotification('Erreur enregistrement', 'error')
    } finally {
      setSaving(false)
    }
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

  const handleGalleryChange = (event) => {
    const files = Array.from(event.target.files || [])
    setGalleryFiles(files)
  }

  const handleLogoChange = (event) => {
    const file = event.target.files?.[0] || null
    setLogoFile(file)
  }

  const uploadGallery = async () => {
    if (!token || !isEditing) return
    if (!galleryFiles.length) {
      showNotification('Sélectionnez des photos avant l\'upload', 'error')
      return
    }
    try {
      const payload = new FormData()
      galleryFiles.forEach((file) => payload.append('photos', file))

      const response = await fetch(
        `${CONFIG.BACKEND_URL}/api/admin/partenaires/${editingId}/gallery`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: payload
        }
      )

      if (response.ok) {
        const data = await response.json()
        setGalleryPreview(data.galerie_photos || [])
        setGalleryFiles([])
        showNotification('Photos ajoutées à la galerie')
        fetchPartenaires()
      } else {
        const data = await response.json().catch(() => ({}))
        showNotification(data.error || 'Erreur upload', 'error')
      }
    } catch (error) {
      showNotification('Erreur upload', 'error')
    }
  }

  const uploadLogo = async () => {
    if (!token || !isEditing) return
    if (!logoFile) {
      showNotification('Sélectionnez un logo avant l\'upload', 'error')
      return
    }
    try {
      const payload = new FormData()
      payload.append('logo', logoFile)

      const response = await fetch(
        `${CONFIG.BACKEND_URL}/api/admin/partenaires/${editingId}/logo`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: payload
        }
      )

      if (response.ok) {
        const data = await response.json()
        setFormData((prev) => ({ ...prev, logo_url: data.logo_url || prev.logo_url }))
        setLogoFile(null)
        showNotification('Logo mis à jour')
        fetchPartenaires()
      } else {
        const data = await response.json().catch(() => ({}))
        showNotification(data.error || 'Erreur upload', 'error')
      }
    } catch (error) {
      showNotification('Erreur upload', 'error')
    }
  }

  const addGalleryLink = async () => {
    if (!token || !isEditing) return
    const link = galleryLink.trim()
    if (!link) {
      showNotification('Ajoutez un lien valide', 'error')
      return
    }
    try {
      const response = await fetch(
        `${CONFIG.BACKEND_URL}/api/admin/partenaires/${editingId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            galerie_photos: [...(galleryPreview || []), link]
          })
        }
      )
      if (response.ok) {
        const data = await response.json()
        setGalleryPreview(data.partenaire?.galerie_photos || [...galleryPreview, link])
        setGalleryLink('')
        showNotification('Lien ajouté à la galerie')
        fetchPartenaires()
      } else {
        const data = await response.json().catch(() => ({}))
        showNotification(data.error || 'Erreur ajout lien', 'error')
      }
    } catch (error) {
      showNotification('Erreur ajout lien', 'error')
    }
  }

  const removeGalleryPhoto = async (photo) => {
    if (!token || !isEditing) return
    if (!window.confirm('Supprimer cette photo de la galerie ?')) return
    try {
      const response = await fetch(
        `${CONFIG.BACKEND_URL}/api/admin/partenaires/${editingId}/gallery`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ photo })
        }
      )
      if (response.ok) {
        const data = await response.json()
        setGalleryPreview(data.galerie_photos || [])
        showNotification('Photo supprimée')
        fetchPartenaires()
      } else {
        const data = await response.json().catch(() => ({}))
        showNotification(data.error || 'Erreur suppression', 'error')
      }
    } catch (error) {
      showNotification('Erreur suppression', 'error')
    }
  }

  const isVerified = (partenaire) =>
    partenaire.statut === 'approuve' && partenaire.autorisation_affichage

  const toggleVerification = async (partenaire) => {
    if (!token) return
    const verified = isVerified(partenaire)
    try {
      const response = await fetch(
        `${CONFIG.BACKEND_URL}/api/admin/partenaires/${partenaire._id}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            autorisation_affichage: !verified,
            ...(verified ? {} : { statut: 'approuve' })
          })
        }
      )
      if (response.ok) {
        showNotification(verified ? 'Vérification retirée' : 'Partenaire vérifié')
        fetchPartenaires()
      } else {
        const data = await response.json().catch(() => ({}))
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

  const filteredPartenaires = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase()
    const filtered = needle
      ? partenaires.filter((partenaire) => {
          const haystack = [
            partenaire.nom,
            partenaire.pays,
            partenaire.ville,
            partenaire.telephone,
            partenaire.whatsapp,
            partenaire.email
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
          return haystack.includes(needle)
        })
      : partenaires

    return [...filtered].sort((a, b) => {
      const verifiedA = isVerified(a) ? 1 : 0
      const verifiedB = isVerified(b) ? 1 : 0
      if (verifiedA !== verifiedB) return verifiedB - verifiedA
      return new Date(b.created_at || 0) - new Date(a.created_at || 0)
    })
  }, [partenaires, searchTerm])

  const domaineSelection = formData.domaine || ''
  const showLivreurFields = ['livreur', 'livreur_personnel', 'agence_livraison'].includes(domaineSelection)
  const showTransitaireFields = domaineSelection === 'transitaire'
  const showCloseurFields = domaineSelection === 'closeur'

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

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="admin-btn admin-btn-primary"
          onClick={() => {
            setShowForm(true)
            setEditingId(null)
            setFormData(getEmptyForm())
          }}
        >
          ➕ Ajouter un partenaire
        </button>
      </div>

      {showForm && (
      <form className="summary-card-lesson mb-6" onSubmit={savePartenaire}>
        <div className="text-base font-semibold mb-4">
          {isEditing ? '✏️ Modifier un partenaire' : '➕ Ajouter un partenaire'}
        </div>
        {!formData.domaine ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 text-sm font-semibold text-primary">
              Choisissez le type de partenaire à ajouter
            </div>
            <select
              className="admin-select"
              value={formData.domaine}
              onChange={(e) => updateFormValue('domaine', e.target.value)}
            >
              <option value="">Sélectionner un type</option>
              {domaineOptions.filter((option) => option.value !== 'all').map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="md:col-span-2 text-xs text-secondary">
              Le formulaire s'adapte automatiquement au type choisi.
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 text-sm font-semibold text-primary">Identité</div>
            <input
              type="text"
              className="admin-input"
              placeholder="Nom du partenaire"
              value={formData.nom}
              onChange={(e) => updateFormValue('nom', e.target.value)}
              required
            />
            <select
              className="admin-select"
              value={formData.domaine}
              onChange={(e) => updateFormValue('domaine', e.target.value)}
            >
              {domaineOptions.filter((option) => option.value !== 'all').map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          <div className="md:col-span-2 text-sm font-semibold text-primary mt-2">Localisation</div>
          <select
            className="admin-select"
            value={formData.statut}
            onChange={(e) => updateFormValue('statut', e.target.value)}
          >
            {statutOptions.filter((option) => option.value !== 'all').map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            className="admin-input"
            placeholder="Pays"
            value={formData.pays}
            onChange={(e) => updateFormValue('pays', e.target.value)}
          />
          <input
            type="text"
            className="admin-input"
            placeholder="Ville"
            value={formData.ville}
            onChange={(e) => updateFormValue('ville', e.target.value)}
          />
          <div className="md:col-span-2 text-sm font-semibold text-primary mt-2">Contact</div>
          <input
            type="text"
            className="admin-input"
            placeholder="Téléphone"
            value={formData.telephone}
            onChange={(e) => updateFormValue('telephone', e.target.value)}
          />
          <input
            type="text"
            className="admin-input"
            placeholder="WhatsApp"
            value={formData.whatsapp}
            onChange={(e) => updateFormValue('whatsapp', e.target.value)}
          />
          <input
            type="email"
            className="admin-input"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => updateFormValue('email', e.target.value)}
          />
          <input
            type="text"
            className="admin-input"
            placeholder="Lien de contact"
            value={formData.lien_contact}
            onChange={(e) => updateFormValue('lien_contact', e.target.value)}
          />
            <div className="md:col-span-2 text-sm font-semibold text-primary mt-2">Logo</div>
            <input
              type="url"
              className="admin-input"
              placeholder="Lien du logo (https://...)"
              value={formData.logo_url}
              onChange={(e) => updateFormValue('logo_url', e.target.value)}
            />
          <div className="md:col-span-2 text-sm font-semibold text-primary mt-2">Opérations</div>
          <select
            className="admin-select"
            value={formData.disponibilite}
            onChange={(e) => updateFormValue('disponibilite', e.target.value)}
          >
            {disponibiliteOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <input
            type="number"
            className="admin-input"
            placeholder="Années d'expérience"
            min="0"
            value={formData.annees_experience}
            onChange={(e) => updateFormValue('annees_experience', e.target.value)}
          />
          {showLivreurFields && (
            <>
              <div className="md:col-span-2 text-sm font-semibold text-primary mt-2">
                Livraison
              </div>
              <input
                type="text"
                className="admin-input"
                placeholder="Zones couvertes (séparées par des virgules)"
                value={formData.zones_couvertes}
                onChange={(e) => updateFormValue('zones_couvertes', e.target.value)}
              />
              <input
                type="text"
                className="admin-input"
                placeholder="Délais moyens"
                value={formData.delais_moyens}
                onChange={(e) => updateFormValue('delais_moyens', e.target.value)}
              />
            </>
          )}
          {(showLivreurFields || showTransitaireFields || showCloseurFields) && (
            <>
              <div className="md:col-span-2 text-sm font-semibold text-primary mt-2">
                Services & Paiements
              </div>
              <input
                type="text"
                className="admin-input"
                placeholder="Méthodes de paiement"
                value={formData.methodes_paiement}
                onChange={(e) => updateFormValue('methodes_paiement', e.target.value)}
              />
              <input
                type="text"
                className="admin-input"
                placeholder="Langues parlées"
                value={formData.langues_parlees}
                onChange={(e) => updateFormValue('langues_parlees', e.target.value)}
              />
            </>
          )}
          <label className="flex items-center gap-2 text-sm text-secondary">
            <input
              type="checkbox"
              checked={formData.autorisation_affichage}
              onChange={(e) => updateFormValue('autorisation_affichage', e.target.checked)}
            />
            Autoriser l'affichage public
          </label>
        </div>
        )}
        <div className="mt-4">
          <div className="text-sm font-semibold text-primary">Logo (upload)</div>
          <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-center">
            <input
              type="file"
              accept="image/*"
              className="admin-input"
              onChange={handleLogoChange}
              disabled={!isEditing}
            />
            <button
              type="button"
              className="admin-btn admin-btn-sm admin-btn-primary"
              onClick={uploadLogo}
              disabled={!isEditing}
            >
              Uploader le logo
            </button>
          </div>
        </div>
        <textarea
          className="admin-textarea mt-4"
          rows="3"
          placeholder="Description courte"
          value={formData.description_courte}
          onChange={(e) => updateFormValue('description_courte', e.target.value)}
        />
        {formData.logo_url && (
          <div className="mt-4 flex items-center gap-3 text-sm text-secondary">
            <img
              src={getImageUrl(formData.logo_url)}
              alt="Logo partenaire"
              className="h-12 w-12 rounded-xl object-cover border border-theme"
              onError={(event) => {
                event.currentTarget.style.display = 'none'
              }}
            />
            Aperçu du logo
          </div>
        )}
        <div className="mt-4">
          <div className="text-sm font-semibold text-primary">Galerie photos</div>
          <p className="text-xs text-secondary mt-1">
            {isEditing
              ? 'Ajoutez des images réelles (équipe, moto, colis, livraisons).'
              : 'Enregistrez le partenaire avant d\'ajouter des photos.'}
          </p>
          <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center">
            <input
              type="file"
              accept="image/*"
              multiple
              className="admin-input"
              onChange={handleGalleryChange}
              disabled={!isEditing}
            />
            <button
              type="button"
              className="admin-btn admin-btn-sm admin-btn-primary"
              onClick={uploadGallery}
              disabled={!isEditing}
            >
              Uploader {galleryFiles.length ? `(${galleryFiles.length})` : ''}
            </button>
          </div>
          <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center">
            <input
              type="url"
              className="admin-input"
              placeholder="Lien direct de l'image (https://...)"
              value={galleryLink}
              onChange={(e) => setGalleryLink(e.target.value)}
              disabled={!isEditing}
            />
            <button
              type="button"
              className="admin-btn admin-btn-sm admin-btn-secondary"
              onClick={addGalleryLink}
              disabled={!isEditing}
            >
              Ajouter le lien
            </button>
          </div>
          {galleryPreview.length > 0 && (
            <div className="mt-3 space-y-3">
              {galleryPreview.map((photo, idx) => (
                <div key={`${photo}-${idx}`} className="relative">
                  <img
                    src={getImageUrl(photo)}
                    alt={`Galerie ${idx + 1}`}
                    className="h-40 w-full rounded-2xl object-cover border border-theme"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs text-secondary shadow"
                    onClick={() => removeGalleryPhoto(photo)}
                  >
                    Supprimer
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="admin-btn admin-btn-primary" type="submit" disabled={saving}>
            {saving ? 'Enregistrement...' : isEditing ? 'Mettre à jour' : 'Ajouter'}
          </button>
          {isEditing && (
            <button className="admin-btn admin-btn-secondary" type="button" onClick={resetForm}>
              Annuler
            </button>
          )}
          {!isEditing && (
            <button className="admin-btn admin-btn-secondary" type="button" onClick={resetForm}>
              Fermer
            </button>
          )}
        </div>
      </form>
      )}

      <div className="admin-filter-bar flex flex-wrap gap-3 items-center">
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
        <input
          type="text"
          className="admin-input"
          placeholder="Rechercher (nom, ville, téléphone...)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="admin-btn admin-btn-sm admin-btn-primary" onClick={applyFilters}>
          Filtrer
        </button>
        <button className="admin-btn admin-btn-sm admin-btn-secondary" onClick={resetFilters}>
          Réinitialiser
        </button>
        <div className="text-xs text-secondary">
          {filteredPartenaires.length} résultat{filteredPartenaires.length > 1 ? 's' : ''}
        </div>
      </div>

      {filteredPartenaires.length === 0 ? (
        <div className="admin-empty">
          <div className="admin-empty-icon">📭</div>
          <h3>Aucun partenaire</h3>
          <p>Aucun résultat pour vos filtres.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-theme bg-card">
          <table className="min-w-[980px] w-full text-sm">
            <thead className="bg-secondary/60 text-secondary">
              <tr>
                <th className="p-4 text-left font-semibold">Partenaire</th>
                <th className="p-4 text-left font-semibold">Contact</th>
                <th className="p-4 text-left font-semibold">Localisation</th>
                <th className="p-4 text-left font-semibold">Statut</th>
                <th className="p-4 text-left font-semibold">Notes</th>
                <th className="p-4 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme text-primary">
              {filteredPartenaires.map((partenaire) => {
                const domaines = (partenaire.domaines_activite || [partenaire.domaine])
                  .filter(Boolean)
                  .map(domaineLabel)
                  .join(', ')
                return (
                  <tr key={partenaire._id} className="hover:bg-secondary/40 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {partenaire.logo_url ? (
                          <img
                            src={getImageUrl(partenaire.logo_url)}
                            alt={partenaire.nom}
                            className="h-10 w-10 rounded-xl object-cover border border-theme"
                            onError={(event) => {
                              event.currentTarget.style.display = 'none'
                            }}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-xl bg-secondary text-primary flex items-center justify-center font-semibold">
                            {(partenaire.nom || '?').slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-semibold text-primary truncate">{partenaire.nom}</div>
                          <div className="text-xs text-secondary">{typeLabel(partenaire.type_partenaire)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-xs text-secondary space-y-1">
                      <div>Email : {partenaire.email || '—'}</div>
                      <div>Téléphone : {partenaire.telephone || '—'}</div>
                      <div>WhatsApp : {partenaire.whatsapp || '—'}</div>
                    </td>
                    <td className="p-4 text-xs text-secondary space-y-1">
                      <div>{partenaire.pays || '—'} · {partenaire.ville || '—'}</div>
                      <div className="truncate max-w-[200px]">{domaines || '—'}</div>
                      <div>{formatDateTime(partenaire.created_at)}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="inline-flex items-center rounded-full border border-theme bg-secondary px-2 py-0.5 text-secondary">
                          {statutLabel(partenaire.statut)}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 ${
                            isVerified(partenaire)
                              ? 'border-accent text-accent bg-secondary'
                              : 'border-theme text-secondary bg-secondary'
                          }`}
                        >
                          {isVerified(partenaire) ? 'Vérifié' : 'Non vérifié'}
                        </span>
                      </div>
                      <div className="text-xs text-secondary mt-2">
                        Affichage : {partenaire.autorisation_affichage ? 'Oui' : 'Non'}
                      </div>
                    </td>
                    <td className="p-4 text-xs text-secondary space-y-1">
                      <div>Note : {partenaire.stats?.rating_avg || 0}</div>
                      <div>Avis : {partenaire.stats?.rating_count || 0}</div>
                      <div>Contacts : {partenaire.stats?.contact_count || 0}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => startEdit(partenaire)}
                          className="admin-btn admin-btn-sm admin-btn-secondary"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => toggleVerification(partenaire)}
                          className="admin-btn admin-btn-sm admin-btn-accent"
                        >
                          {isVerified(partenaire) ? 'Retirer vérif' : 'Vérifier'}
                        </button>
                        <button
                          onClick={() => updateStatus(partenaire._id, 'approve')}
                          className="admin-btn admin-btn-sm admin-btn-success"
                        >
                          Approuver
                        </button>
                        <button
                          onClick={() => updateStatus(partenaire._id, 'suspend')}
                          className="admin-btn admin-btn-sm admin-btn-warning"
                        >
                          Suspendre
                        </button>
                        <button
                          onClick={() => handleDelete(partenaire._id)}
                          className="admin-btn admin-btn-sm admin-btn-danger"
                        >
                          Supprimer
                        </button>
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

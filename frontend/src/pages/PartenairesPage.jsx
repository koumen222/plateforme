import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CONFIG } from '../config/config'

const domaineOptions = [
  { value: 'all', label: 'Tous les domaines' },
  { value: 'livreur', label: 'Livreur' },
  { value: 'agence_livraison', label: 'Agence de livraison' },
  { value: 'transitaire', label: 'Transitaire' },
  { value: 'closeur', label: 'Closeur' },
  { value: 'fournisseur', label: 'Fournisseur' },
  { value: 'autre', label: 'Autre' }
]

const typeOptions = [
  { value: 'all', label: 'Tous les types' },
  { value: 'agence_livraison', label: 'Agence de livraison' },
  { value: 'closeur', label: 'Closeur' },
  { value: 'transitaire', label: 'Transitaire' },
  { value: 'autre', label: 'Autre' }
]

const disponibiliteOptions = [
  { value: 'all', label: 'Toutes disponibilités' },
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

export default function PartenairesPage() {
  const [partenaires, setPartenaires] = useState([])
  const [partenairesCounts, setPartenairesCounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showResults, setShowResults] = useState(false)
  const [searchCategory, setSearchCategory] = useState('')
  const [filters, setFilters] = useState({
    pays: '',
    ville: '',
    domaine: 'all',
    type: 'all',
    disponibilite: 'all',
    note_min: '',
    verifie_only: true
  })
  const [queryFilters, setQueryFilters] = useState({
    pays: '',
    ville: '',
    domaine: 'all',
    type: 'all',
    disponibilite: 'all',
    note_min: '',
    verifie_only: true
  })

  useEffect(() => {
    fetchPartenaires()
  }, [queryFilters])

  useEffect(() => {
    fetchCounts()
  }, [])

  const buildQuery = () => {
    const params = new URLSearchParams()
    if (queryFilters.domaine && queryFilters.domaine !== 'all') {
      params.append('domaine', queryFilters.domaine)
    }
    if (queryFilters.type && queryFilters.type !== 'all') {
      params.append('type', queryFilters.type)
    }
    if (queryFilters.disponibilite && queryFilters.disponibilite !== 'all') {
      params.append('disponibilite', queryFilters.disponibilite)
    }
    if (queryFilters.note_min) {
      params.append('note_min', queryFilters.note_min)
    }
    if (queryFilters.pays.trim()) {
      params.append('pays', queryFilters.pays.trim())
    }
    if (queryFilters.ville.trim()) {
      params.append('ville', queryFilters.ville.trim())
    }
    params.append('verifie_only', queryFilters.verifie_only ? 'true' : 'false')
    const query = params.toString()
    return query ? `?${query}` : ''
  }

  const fetchPartenaires = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/partenaires${buildQuery()}`)
      const data = await response.json()
      if (response.ok) {
        setPartenaires(data.partenaires || [])
      } else {
        setPartenaires([])
      }
    } catch (error) {
      setPartenaires([])
    } finally {
      setLoading(false)
    }
  }

  const fetchCounts = async () => {
    try {
      const params = new URLSearchParams()
      params.append('verifie_only', 'true')
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/partenaires?${params.toString()}`)
      const data = await response.json()
      if (response.ok) {
        setPartenairesCounts(data.partenaires || [])
      } else {
        setPartenairesCounts([])
      }
    } catch (error) {
      setPartenairesCounts([])
    }
  }

  const applyFilters = () => {
    setQueryFilters(filters)
    setShowResults(true)
  }

  const resetFilters = () => {
    const reset = {
      pays: '',
      ville: '',
      domaine: 'all',
      type: 'all',
      disponibilite: 'all',
      note_min: '',
      verifie_only: true
    }
    setFilters(reset)
    setQueryFilters(reset)
    setShowResults(false)
  }

  const getContactLink = (partenaire) => {
    if (partenaire.lien_contact) return partenaire.lien_contact
    if (!partenaire.whatsapp) return ''
    const digits = partenaire.whatsapp.replace(/[^\d+]/g, '')
    return `https://wa.me/${digits.replace('+', '')}`
  }

  const getPhoneLink = (partenaire) => {
    const phone = partenaire.telephone || partenaire.whatsapp
    if (!phone) return ''
    const digits = phone.replace(/[^\d+]/g, '')
    return `tel:${digits}`
  }

  const trackContact = async (partenaireId, type, message) => {
    try {
      await fetch(`${CONFIG.BACKEND_URL}/api/partenaires/${partenaireId}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, message })
      })
    } catch (error) {
      // Silencieux : ne pas bloquer l'utilisateur
    }
  }

  const handlePlatformContact = async (partenaire) => {
    const message = window.prompt(`Message pour ${partenaire.nom} :`)
    if (!message || !message.trim()) return
    await trackContact(partenaire._id, 'plateforme', message.trim())
    alert('✅ Message envoyé. Le partenaire vous recontactera.')
  }

  const countByDomaine = (value) => {
    if (value === 'all') return partenairesCounts.length
    return partenairesCounts.filter((partenaire) => {
      const domaines = (partenaire.domaines_activite || [partenaire.domaine]).filter(Boolean)
      return domaines.includes(value)
    }).length
  }

  const handleCategoryClick = (value) => {
    const nextFilters = {
      ...filters,
      domaine: value,
      type: 'all',
      disponibilite: 'all',
      note_min: '',
      verifie_only: true
    }
    setFilters(nextFilters)
    setQueryFilters(nextFilters)
    setShowResults(true)
  }

  const handleBackToCategories = () => {
    setShowResults(false)
  }

  const filteredCategories = domaineOptions.filter((option) => {
    if (!searchCategory.trim()) return true
    return option.label.toLowerCase().includes(searchCategory.trim().toLowerCase())
  })

  const activeCategoryLabel =
    domaineOptions.find((option) => option.value === filters.domaine)?.label || 'Tous les domaines'

  const getPaysOptions = () => {
    const paysSet = new Set(
      partenairesCounts.map((partenaire) => (partenaire.pays || '').trim()).filter(Boolean)
    )
    return Array.from(paysSet).sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }))
  }

  const getVilleOptions = () => {
    const paysFilter = filters.pays.trim()
    const villeSet = new Set(
      partenairesCounts
        .filter((partenaire) => !paysFilter || partenaire.pays?.trim() === paysFilter)
        .map((partenaire) => (partenaire.ville || '').trim())
        .filter(Boolean)
    )
    return Array.from(villeSet).sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }))
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="summary-card-lesson">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Partenaires fiables</h1>
            <p className="text-secondary mt-2">
              Accédez à des prestataires vérifiés, notés et suivis.
            </p>
          </div>
          <div className="text-sm text-secondary">
            {partenairesCounts.length} partenaires vérifiés
          </div>
        </div>
      </div>

      <div className="summary-card-lesson mt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
          <h2 className="text-base font-semibold">Catégories</h2>
          <input
            type="text"
            className="admin-input sm:max-w-xs"
            placeholder="Rechercher une catégorie"
            value={searchCategory}
            onChange={(e) => setSearchCategory(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredCategories.map((option) => (
            <button
              key={option.value}
              className="flex items-center justify-between rounded-xl border border-theme bg-card px-4 py-3 text-left hover:border-accent"
              onClick={() => handleCategoryClick(option.value)}
            >
              <span className="font-medium text-primary">{option.label}</span>
              <span className="text-xs text-secondary">{countByDomaine(option.value)}</span>
            </button>
          ))}
          <button
            className="flex items-center justify-between rounded-xl border border-accent bg-card px-4 py-3 text-left"
            onClick={() => handleCategoryClick('all')}
          >
            <span className="font-semibold text-accent">Voir tout</span>
            <span className="text-xs text-secondary">{countByDomaine('all')}</span>
          </button>
        </div>
      </div>

      {showResults && (
        <>
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
            <aside className="bg-card border border-theme rounded-2xl p-4 space-y-4">
              <div className="text-sm font-semibold text-primary">Filtres</div>
              <button
                className="admin-btn admin-btn-secondary w-full"
                onClick={handleBackToCategories}
              >
                ← Retour aux catégories
              </button>
              <select
                className="admin-select w-full"
                value={filters.domaine}
                onChange={(e) => setFilters((prev) => ({ ...prev, domaine: e.target.value }))}
              >
                {domaineOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                className="admin-select w-full"
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
                className="admin-select w-full"
                value={filters.disponibilite}
                onChange={(e) => setFilters((prev) => ({ ...prev, disponibilite: e.target.value }))}
              >
                {disponibiliteOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                className="admin-select w-full"
                value={filters.pays}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    pays: e.target.value,
                    ville: ''
                  }))
                }
              >
                <option value="">Tous les pays</option>
                {getPaysOptions().map((pays) => (
                  <option key={pays} value={pays}>
                    {pays}
                  </option>
                ))}
              </select>
              <select
                className="admin-select w-full"
                value={filters.ville}
                onChange={(e) => setFilters((prev) => ({ ...prev, ville: e.target.value }))}
              >
                <option value="">Toutes les villes</option>
                {getVilleOptions().map((ville) => (
                  <option key={ville} value={ville}>
                    {ville}
                  </option>
                ))}
              </select>
              <input
                type="number"
                className="admin-input w-full"
                placeholder="Note min (ex: 4)"
                min="1"
                max="5"
                value={filters.note_min}
                onChange={(e) => setFilters((prev) => ({ ...prev, note_min: e.target.value }))}
              />
              <label className="flex items-center gap-2 text-sm text-secondary">
                <input
                  type="checkbox"
                  checked={filters.verifie_only}
                  onChange={(e) => setFilters((prev) => ({ ...prev, verifie_only: e.target.checked }))}
                />
                Vérifiés uniquement
              </label>
              <div className="flex gap-2">
                <button className="admin-btn admin-btn-primary w-full" onClick={applyFilters}>
                  Filtrer
                </button>
                <button className="admin-btn admin-btn-secondary w-full" onClick={resetFilters}>
                  Réinitialiser
                </button>
              </div>
            </aside>

            <div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm text-secondary">
                <div className="text-primary font-semibold">{activeCategoryLabel}</div>
                <span>
                  {loading ? 'Chargement des résultats…' : `${partenaires.length} partenaire(s) trouvé(s)`}
                </span>
              </div>

              {loading ? (
                <div className="admin-loading mt-6">Chargement...</div>
              ) : partenaires.length === 0 ? (
                <div className="admin-empty mt-6">
                  <div className="admin-empty-icon">📭</div>
                  <h3>Aucun partenaire</h3>
                  <p>Essayez de modifier vos filtres.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4">
                  {partenaires.map((partenaire) => {
                    const contactLink = getContactLink(partenaire)
                    const phoneLink = getPhoneLink(partenaire)
                    const domaines = (partenaire.domaines_activite || [partenaire.domaine])
                      .filter(Boolean)
                      .map(domaineLabel)
                      .join(', ')
                    const badges = partenaire.badges || []
                    return (
                      <div key={partenaire._id} className="bg-card border border-theme rounded-2xl p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <Link
                              to={`/partenaires/${partenaire._id}`}
                              className="text-lg font-semibold text-primary hover:underline"
                            >
                              {partenaire.nom}
                            </Link>
                            <p className="text-sm text-secondary">{typeLabel(partenaire.type_partenaire)}</p>
                            <p className="text-xs text-secondary mt-1">{domaines || '—'}</p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Link
                              to={`/partenaires/${partenaire._id}`}
                              className="admin-btn admin-btn-sm admin-btn-secondary"
                            >
                              Voir profil
                            </Link>
                            {contactLink && (
                              <a
                                href={contactLink}
                                target="_blank"
                                rel="noreferrer"
                                className="admin-btn admin-btn-sm admin-btn-primary"
                                onClick={() => trackContact(partenaire._id, 'whatsapp')}
                              >
                                WhatsApp
                              </a>
                            )}
                            {phoneLink && (
                              <a
                                href={phoneLink}
                                className="admin-btn admin-btn-sm admin-btn-secondary"
                                onClick={() => trackContact(partenaire._id, 'appel')}
                              >
                                Appeler
                              </a>
                            )}
                            <button
                              className="admin-btn admin-btn-sm admin-btn-secondary"
                              onClick={() => handlePlatformContact(partenaire)}
                            >
                              Contacter
                            </button>
                          </div>
                        </div>
                        {partenaire.description_courte && (
                          <p className="text-sm text-secondary mt-3">{partenaire.description_courte}</p>
                        )}
                        <div className="mt-3 flex flex-wrap gap-2 text-xs sm:text-sm text-secondary">
                          <span className="px-2 py-1 rounded-lg bg-secondary">🌍 {partenaire.pays || '—'}</span>
                          <span className="px-2 py-1 rounded-lg bg-secondary">📍 {partenaire.ville || '—'}</span>
                          <span className="px-2 py-1 rounded-lg bg-secondary">
                            ⭐ {partenaire.stats?.rating_avg || 0} ({partenaire.stats?.rating_count || 0})
                          </span>
                        </div>
                        {badges.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2 text-xs text-secondary">
                            {badges.includes('verifie') && (
                              <span className="px-2 py-1 rounded-lg bg-secondary">✅ Vérifié</span>
                            )}
                            {badges.includes('top') && (
                              <span className="px-2 py-1 rounded-lg bg-secondary">⭐ Top</span>
                            )}
                            {badges.includes('actif_mois') && (
                              <span className="px-2 py-1 rounded-lg bg-secondary">🕒 Actif</span>
                            )}
                            {badges.includes('reactif') && (
                              <span className="px-2 py-1 rounded-lg bg-secondary">🚀 Réactif</span>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

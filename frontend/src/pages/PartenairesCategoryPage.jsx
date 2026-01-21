import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FiCheckCircle } from 'react-icons/fi'
import { CONFIG } from '../config/config'
import { getImageUrl } from '../utils/imageUtils'

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

const typeOptions = [
  { value: 'all', label: 'Tous les types' },
  { value: 'livreur', label: 'Livreur' },
  { value: 'agence_livraison', label: 'Agence de livraison' },
  { value: 'transitaire', label: 'Transitaire' },
  { value: 'closeur', label: 'Closeur' },
  { value: 'autre', label: 'Autre' }
]

const sortOptions = [
  { value: 'popularite', label: 'Popularité' },
  { value: 'note', label: 'Note' },
  { value: 'reactivite', label: 'Réactivité' }
]

const domaineLabel = (value) => {
  const match = domaineOptions.find((item) => item.value === value)
  return match ? match.label : value || '—'
}

const typeLabel = (value) => {
  const match = typeOptions.find((item) => item.value === value)
  return match ? match.label : value || '—'
}

const getStatusBadge = (value) => {
  if (value === 'disponible') {
    return { label: 'Disponible', className: 'bg-secondary text-accent border-accent' }
  }
  return { label: 'Occupé', className: 'bg-secondary text-secondary border-theme' }
}

const getTypeDisplay = (partenaire) => {
  const domaines = (partenaire.domaines_activite || [partenaire.domaine]).filter(Boolean)
  if (domaines.includes('livreur') || partenaire.type_partenaire === 'livreur') return 'Livreur'
  if (domaines.includes('livreur_personnel')) return 'Livreur personnel'
  if (partenaire.type_partenaire === 'agence_livraison') return 'Agence'
  return typeLabel(partenaire.type_partenaire)
}

const getExcerpt = (partenaire) => {
  const fallback = partenaire.description_courte || ''
  const candidate = partenaire.stats?.last_review?.commentaire || fallback
  if (!candidate) return 'Avis client à venir.'
  return candidate.split('\n')[0]
}

export default function PartenairesCategoryPage() {
  const { domaine } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [basePartenaires, setBasePartenaires] = useState([])
  const [partenaires, setPartenaires] = useState([])
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    pays: '',
    ville: '',
    type: 'all',
    note_min: '',
    disponible_now: false,
    verifie_only: false
  })
  const [sortBy, setSortBy] = useState('popularite')
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  useEffect(() => {
    fetchBase()
  }, [domaine])

  useEffect(() => {
    fetchPartenaires()
  }, [domaine, filters])

  const buildQuery = () => {
    const params = new URLSearchParams()
    if (domaine && domaine !== 'all') {
      params.append('domaine', domaine)
    }
    if (filters.type && filters.type !== 'all') {
      params.append('type', filters.type)
    }
    if (filters.note_min) {
      params.append('note_min', filters.note_min)
    }
    if (filters.pays) {
      params.append('pays', filters.pays)
    }
    if (filters.ville) {
      params.append('ville', filters.ville)
    }
    if (filters.disponible_now) {
      params.append('disponibilite', 'disponible')
    }
    if (filters.verifie_only) {
      params.append('verifie_only', 'true')
    }
    return params.toString()
  }

  const fetchBase = async () => {
    try {
      const params = new URLSearchParams()
      if (domaine && domaine !== 'all') {
        params.append('domaine', domaine)
      }
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/partenaires?${params.toString()}`)
      const data = await response.json()
      if (response.ok) {
        setBasePartenaires(data.partenaires || [])
      } else {
        setBasePartenaires([])
      }
    } catch (error) {
      setBasePartenaires([])
    }
  }

  const fetchPartenaires = async () => {
    setLoading(true)
    try {
      const query = buildQuery()
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/partenaires?${query}`)
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

  const getPaysOptions = () => {
    const paysSet = new Set(
      basePartenaires.map((partenaire) => (partenaire.pays || '').trim()).filter(Boolean)
    )
    return Array.from(paysSet).sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }))
  }

  const getVilleOptions = () => {
    const paysFilter = filters.pays.trim()
    const villeSet = new Set(
      basePartenaires
        .filter((partenaire) => !paysFilter || partenaire.pays?.trim() === paysFilter)
        .map((partenaire) => (partenaire.ville || '').trim())
        .filter(Boolean)
    )
    return Array.from(villeSet).sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }))
  }

  const trackContact = async (partenaireId, type, message) => {
    try {
      await fetch(`${CONFIG.BACKEND_URL}/api/partenaires/${partenaireId}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, message })
      })
    } catch (error) {
      // silencieux
    }
  }

  const handlePlatformContact = async (partenaire) => {
    const message = window.prompt(`Message pour ${partenaire.nom} :`)
    if (!message || !message.trim()) return
    await trackContact(partenaire._id, 'plateforme', message.trim())
    alert('✅ Message envoyé. Le partenaire vous recontactera.')
  }

  const resetFilters = () => {
    setFilters({
      pays: '',
      ville: '',
      type: 'all',
      note_min: '',
      disponible_now: false,
      verifie_only: true
    })
  }

  const sortedPartenaires = useMemo(() => {
    const items = [...partenaires]
    return items.sort((a, b) => {
      const verifiedA = (a.badges || []).includes('verifie') ? 1 : 0
      const verifiedB = (b.badges || []).includes('verifie') ? 1 : 0
      const ratingA = a.stats?.rating_avg || 0
      const ratingB = b.stats?.rating_avg || 0
      const countA = a.stats?.rating_count || 0
      const countB = b.stats?.rating_count || 0
      const reactA = (a.badges || []).includes('reactif') ? 1 : 0
      const reactB = (b.badges || []).includes('reactif') ? 1 : 0

      if (verifiedA !== verifiedB) return verifiedB - verifiedA
      if (sortBy === 'note') return ratingB - ratingA
      if (sortBy === 'reactivite') return reactB - reactA || ratingB - ratingA
      return countB - countA || ratingB - ratingA
    })
  }, [partenaires, sortBy])

  const visiblePartenaires = useMemo(() => {
    if (!search.trim()) return sortedPartenaires
    const needle = search.trim().toLowerCase()
    return sortedPartenaires.filter((item) => (item.nom || '').toLowerCase().includes(needle))
  }, [search, sortedPartenaires])

  const activeCategoryLabel =
    domaineOptions.find((option) => option.value === domaine)?.label || 'Tous les domaines'

  const FiltersPanel = (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-semibold text-secondary">Pays</label>
        <select
          className="mt-2 w-full rounded-xl border border-theme bg-card px-3 py-2 text-sm text-primary"
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
      </div>

      <div>
        <label className="text-xs font-semibold text-secondary">Ville</label>
        <select
          className="mt-2 w-full rounded-xl border border-theme bg-card px-3 py-2 text-sm text-primary"
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
      </div>

      <div>
        <label className="text-xs font-semibold text-secondary">Type</label>
        <select
          className="mt-2 w-full rounded-xl border border-theme bg-card px-3 py-2 text-sm text-primary"
          value={filters.type}
          onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}
        >
          {typeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs font-semibold text-secondary">Note minimale</label>
        <input
          type="number"
          className="mt-2 w-full rounded-xl border border-theme bg-card px-3 py-2 text-sm text-primary placeholder:text-secondary/70"
          placeholder="Ex: 4"
          min="1"
          max="5"
          value={filters.note_min}
          onChange={(e) => setFilters((prev) => ({ ...prev, note_min: e.target.value }))}
        />
      </div>

      <div className="flex items-center justify-between rounded-xl border border-theme bg-card px-3 py-2">
        <span className="text-sm text-primary">Disponible maintenant</span>
        <input
          type="checkbox"
          checked={filters.disponible_now}
          onChange={(e) => setFilters((prev) => ({ ...prev, disponible_now: e.target.checked }))}
        />
      </div>

      <div className="flex items-center justify-between rounded-xl border border-theme bg-card px-3 py-2">
        <span className="text-sm text-primary">Vérifiés uniquement</span>
        <input
          type="checkbox"
          checked={filters.verifie_only}
          onChange={(e) => setFilters((prev) => ({ ...prev, verifie_only: e.target.checked }))}
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-secondary">Trier par</label>
        <select
          className="mt-2 w-full rounded-xl border border-theme bg-card px-3 py-2 text-sm text-primary"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )

  return (
    <div className="bg-secondary min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="rounded-3xl border border-theme bg-card p-6 shadow-sm">
          <Link to="/partenaires" className="text-sm text-secondary hover:text-primary">
            ← Retour aux catégories
          </Link>
          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-primary">{activeCategoryLabel}</h1>
              <p className="text-sm text-secondary mt-1">
                Sélection vérifiée pour vos expéditions e-commerce.
              </p>
            </div>
            <div className="text-sm text-secondary">
              {loading ? 'Chargement…' : `${visiblePartenaires.length} partenaires`}
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
            <select
              className="rounded-full border border-theme bg-card px-3 py-2 text-sm text-primary w-full md:w-auto"
              value={domaine || 'all'}
              onChange={(e) => navigate(`/partenaires/categorie/${e.target.value}`)}
            >
              {domaineOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="relative flex-1">
              <input
                type="text"
                className="w-full rounded-full border border-theme bg-card px-4 py-2 text-sm text-primary placeholder:text-secondary/70"
                placeholder="Rechercher un livreur ou une agence"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="btn-secondary px-4 py-2 text-sm md:hidden"
              onClick={() => setIsFiltersOpen(true)}
            >
              Filtres
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          <aside className="hidden lg:block rounded-3xl border border-theme bg-card p-5 shadow-sm h-fit">
            <div className="text-sm font-semibold text-primary mb-4">Filtres</div>
            {FiltersPanel}
            <button
              type="button"
              className="btn-secondary mt-4 w-full text-sm px-4 py-2"
              onClick={resetFilters}
            >
              Réinitialiser
            </button>
          </aside>

          <div>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-theme bg-card p-5 shadow-sm animate-pulse"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-secondary" />
                      <div className="flex-1">
                        <div className="h-4 w-1/2 bg-secondary rounded" />
                        <div className="h-3 w-1/3 bg-secondary rounded mt-2" />
                      </div>
                    </div>
                    <div className="h-3 w-2/3 bg-secondary rounded mt-4" />
                    <div className="h-3 w-full bg-secondary rounded mt-2" />
                    <div className="mt-4 flex gap-2">
                      <div className="h-9 w-24 bg-secondary rounded-full" />
                      <div className="h-9 w-24 bg-secondary rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : visiblePartenaires.length === 0 ? (
              <div className="rounded-3xl border border-theme bg-card p-10 text-center">
                <div className="text-3xl mb-2">📭</div>
                <h3 className="text-lg font-semibold text-primary">Aucun partenaire trouvé</h3>
                <p className="text-sm text-secondary mt-2">
                  Ajustez vos filtres pour voir d'autres profils.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {visiblePartenaires.map((partenaire) => {
                  const domaines = (partenaire.domaines_activite || [partenaire.domaine])
                    .filter(Boolean)
                    .map(domaineLabel)
                    .join(', ')
                  const badges = partenaire.badges || []
                  const status = getStatusBadge(partenaire.disponibilite)
                  const rating = partenaire.stats?.rating_avg || 0
                  const ratingCount = partenaire.stats?.rating_count || 0
                  return (
                    <div
                      key={partenaire._id}
                      className="rounded-2xl border border-theme bg-card p-5 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-3">
                        {partenaire.logo_url ? (
                          <img
                            src={getImageUrl(partenaire.logo_url)}
                            alt={partenaire.nom}
                            className="h-12 w-12 rounded-full object-cover border border-theme"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center text-sm font-semibold text-primary">
                            {(partenaire.nom || '?').slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-primary">{partenaire.nom || '—'}</h3>
                            {badges.includes('verifie') && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-accent bg-secondary px-2 py-0.5 text-[11px] text-accent">
                                <FiCheckCircle className="h-3 w-3" />
                                Vérifié
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-secondary">{getTypeDisplay(partenaire)}</p>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2 text-sm text-secondary">
                        <div className="flex items-center justify-between">
                          <span>⭐ {rating.toFixed(1)}</span>
                          <span className="text-xs text-secondary">({ratingCount} avis)</span>
                        </div>
                        <div className="text-xs text-secondary">📍 {partenaire.ville || '—'}</div>
                        <div className="text-xs text-secondary truncate">{domaines || '—'}</div>
                      </div>

                      <p className="mt-3 text-xs text-secondary truncate">
                        “{getExcerpt(partenaire)}”
                      </p>

                      <div className="mt-4 flex items-center gap-2">
                        <Link
                          to={`/partenaires/${partenaire._id}`}
                          className="btn-primary flex-1 text-center text-xs px-4 py-2"
                        >
                          Voir le profil
                        </Link>
                        <button
                          type="button"
                          className="btn-secondary text-xs px-3 py-2"
                          onClick={() => handlePlatformContact(partenaire)}
                        >
                          Contacter
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {isFiltersOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 md:hidden">
          <div className="w-full rounded-t-3xl bg-card p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="text-base font-semibold text-primary">Filtres</div>
              <button
                type="button"
                className="text-sm text-secondary"
                onClick={() => setIsFiltersOpen(false)}
              >
                Fermer
              </button>
            </div>
            <div className="mt-4">{FiltersPanel}</div>
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                className="btn-secondary flex-1 text-sm px-3 py-2"
                onClick={resetFilters}
              >
                Réinitialiser
              </button>
              <button
                type="button"
                className="btn-primary flex-1 text-sm px-3 py-2"
                onClick={() => setIsFiltersOpen(false)}
              >
                Voir les résultats
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

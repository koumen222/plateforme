import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CONFIG } from '../config/config'

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

export default function PartenairesPage() {
  const [partenairesCounts, setPartenairesCounts] = useState([])
  const [searchCategory, setSearchCategory] = useState('')

  useEffect(() => {
    fetchCounts()
  }, [])

  const fetchCounts = async () => {
    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/partenaires`)
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

  const countByDomaine = (value) => {
    if (value === 'all') return partenairesCounts.length
    return partenairesCounts.filter((partenaire) => {
      const domaines = (partenaire.domaines_activite || [partenaire.domaine]).filter(Boolean)
      return domaines.includes(value)
    }).length
  }

  const filteredCategories = domaineOptions.filter((option) => {
    if (!searchCategory.trim()) return true
    return option.label.toLowerCase().includes(searchCategory.trim().toLowerCase())
  })

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
            <Link
              key={option.value}
              className="flex items-center justify-between rounded-xl border border-theme bg-card px-4 py-3 text-left hover:border-accent"
              to={`/partenaires/categorie/${option.value}`}
            >
              <span className="font-medium text-primary">{option.label}</span>
              <span className="text-xs text-secondary">{countByDomaine(option.value)}</span>
            </Link>
          ))}
          <Link
            className="flex items-center justify-between rounded-xl border border-accent bg-card px-4 py-3 text-left"
            to="/partenaires/categorie/all"
          >
            <span className="font-semibold text-accent">Voir tout</span>
            <span className="text-xs text-secondary">{countByDomaine('all')}</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CONFIG } from '../config/config'
import { useAuth } from '../contexts/AuthContext'

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
  const { user, token, loading } = useAuth()
  const navigate = useNavigate()
  const [partenairesCounts, setPartenairesCounts] = useState([])
  const [searchCategory, setSearchCategory] = useState('')

  useEffect(() => {
    fetchCounts()
  }, [])

  const fetchCounts = async () => {
    try {
      const headers = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/partenaires`, {
        headers
      })
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

  const isAuthenticated = !loading && token && user

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative">
      {/* Overlay flou avec message de connexion centré pour les non-connectés */}
      {/* Ne pas afficher pendant le chargement pour éviter la latence */}
      {!loading && !isAuthenticated && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/20">
          <div className="bg-card rounded-2xl border border-theme shadow-xl p-8 max-w-md mx-4">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="text-5xl">🔒</div>
              <div>
                <h2 className="text-xl font-bold text-primary mb-2">Accès réservé aux membres</h2>
                <p className="text-sm text-secondary">Connectez-vous pour accéder à tous les partenaires</p>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-3 bg-accent text-white rounded-lg font-semibold hover:opacity-90 transition-opacity w-full"
              >
                Se connecter
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div>
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

      <div className={`summary-card-lesson mt-6 ${!isAuthenticated ? 'blur-sm pointer-events-none select-none' : ''}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
          <h2 className="text-base font-semibold">Catégories</h2>
          <input
            type="text"
            className="admin-input sm:max-w-xs"
            placeholder="Rechercher une catégorie"
            value={searchCategory}
            onChange={(e) => setSearchCategory(e.target.value)}
            disabled={!isAuthenticated}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredCategories.map((option) => (
            <Link
              key={option.value}
              className={`flex items-center justify-between rounded-xl border border-theme bg-card px-4 py-3 text-left ${isAuthenticated ? 'hover:border-accent' : ''}`}
              to={isAuthenticated ? `/partenaires/categorie/${option.value}` : '#'}
              onClick={(e) => !isAuthenticated && e.preventDefault()}
            >
              <span className="font-medium text-primary">{option.label}</span>
              <span className="text-xs text-secondary">{countByDomaine(option.value)}</span>
            </Link>
          ))}
          <Link
            className={`flex items-center justify-between rounded-xl border border-accent bg-card px-4 py-3 text-left ${isAuthenticated ? '' : 'pointer-events-none'}`}
            to={isAuthenticated ? '/partenaires/categorie/all' : '#'}
            onClick={(e) => !isAuthenticated && e.preventDefault()}
          >
            <span className="font-semibold text-accent">Voir tout</span>
            <span className="text-xs text-secondary">{countByDomaine('all')}</span>
          </Link>
        </div>
      </div>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CONFIG } from '../config/config'
import { FiBook, FiDownload, FiFileText, FiUser, FiTag, FiSearch, FiFilter } from 'react-icons/fi'
import axios from 'axios'

export default function RessourcesPdfPage() {
  const [ressourcesPdf, setRessourcesPdf] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  useEffect(() => {
    fetchRessourcesPdf()
  }, [])

  const fetchRessourcesPdf = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get(`${CONFIG.BACKEND_URL}/api/ressources-pdf`)
      
      if (response.data.success) {
        setRessourcesPdf(response.data.ressourcesPdf || [])
      } else {
        setError('Erreur lors du chargement des ressources PDF')
      }
    } catch (err) {
      console.error('Erreur chargement ressources PDF:', err)
      setError('Impossible de charger les ressources PDF')
    } finally {
      setLoading(false)
    }
  }

  const categories = ['all', ...new Set(ressourcesPdf.map(r => r.category || 'Général'))]

  const filteredRessourcesPdf = ressourcesPdf.filter(ressourcePdf => {
    const matchesSearch = 
      ressourcePdf.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ressourcePdf.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ressourcePdf.author?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = categoryFilter === 'all' || ressourcePdf.category === categoryFilter
    
    return matchesSearch && matchesCategory
  })

  const handleDownload = async (ressourcePdf) => {
    try {
      // Incrémenter le compteur de téléchargements
      await axios.post(`${CONFIG.BACKEND_URL}/api/ressources-pdf/${ressourcePdf._id}/download`)
      
      // Ouvrir le PDF dans un nouvel onglet
      window.open(ressourcePdf.pdfUrl, '_blank')
    } catch (err) {
      console.error('Erreur téléchargement:', err)
      // Ouvrir quand même le PDF même si l'incrémentation échoue
      window.open(ressourcePdf.pdfUrl, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center px-4">
        <div className="text-center p-8 rounded-2xl shadow-lg bg-card border border-theme">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-primary mb-2">Chargement des ressources PDF...</h2>
          <p className="text-secondary">Veuillez patienter</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-secondary py-8 sm:py-12">
      <div className="container-startup w-full max-w-full">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12 px-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-accent/20 to-accent/10 mb-4">
            <FiBook className="w-8 h-8 text-accent" />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary mb-4">
            Ressources PDF
          </h1>
          <p className="text-lg text-secondary max-w-2xl mx-auto">
            Découvrez nos guides pratiques et ressources téléchargeables pour réussir en e-commerce
          </p>
        </div>

        {/* Filtres et recherche */}
        <div className="mb-8 px-4">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            {/* Barre de recherche */}
            <div className="flex-1 relative">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher une ressource PDF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-theme bg-card text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              />
            </div>

            {/* Filtre par catégorie */}
            <div className="relative">
              <FiFilter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary w-5 h-5 z-10" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="pl-12 pr-10 py-3 rounded-xl border border-theme bg-card text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent appearance-none cursor-pointer"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'Toutes les catégories' : cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Compteur de résultats */}
          <p className="text-sm text-secondary">
            {filteredRessourcesPdf.length} ressource{filteredRessourcesPdf.length > 1 ? 's' : ''} PDF trouvée{filteredRessourcesPdf.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* Liste des ressources PDF */}
        {error ? (
          <div className="text-center py-16 px-4">
            <div className="text-5xl mb-4 text-secondary">📚</div>
            <p className="text-xl text-secondary mb-4">{error}</p>
            <button
              onClick={fetchRessourcesPdf}
              className="btn-primary inline-flex items-center gap-2"
            >
              Réessayer
            </button>
          </div>
        ) : filteredRessourcesPdf.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="text-5xl mb-4 text-secondary">📖</div>
            <p className="text-xl text-secondary mb-2">Aucune ressource PDF trouvée</p>
            <p className="text-secondary">
              {searchTerm || categoryFilter !== 'all' 
                ? 'Essayez de modifier vos critères de recherche'
                : 'Aucune ressource PDF disponible pour le moment'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
            {filteredRessourcesPdf.map((ressourcePdf) => (
              <div
                key={ressourcePdf._id}
                className="bg-card border border-theme rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group"
              >
                {/* Image de couverture */}
                <div className="relative h-48 sm:h-56 overflow-hidden bg-gradient-to-br from-accent/10 to-accent/5">
                  {ressourcePdf.coverImage ? (
                    <img
                      src={ressourcePdf.coverImage}
                      alt={ressourcePdf.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.src = '/img/ressource-pdf-default.png'
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FiBook className="w-16 h-16 text-accent/30" />
                    </div>
                  )}
                  {ressourcePdf.isFree && (
                    <div className="absolute top-3 right-3 bg-accent text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                      Gratuit
                    </div>
                  )}
                </div>

                {/* Contenu */}
                <div className="p-5 sm:p-6">
                  {/* Catégorie */}
                  {ressourcePdf.category && (
                    <div className="flex items-center gap-2 mb-3">
                      <FiTag className="w-4 h-4 text-accent" />
                      <span className="text-xs font-medium text-accent uppercase tracking-wider">
                        {ressourcePdf.category}
                      </span>
                    </div>
                  )}

                  {/* Titre */}
                  <h3 className="text-lg sm:text-xl font-bold text-primary mb-2 line-clamp-2 group-hover:text-accent transition-colors">
                    {ressourcePdf.title}
                  </h3>

                  {/* Description */}
                  {ressourcePdf.description && (
                    <p className="text-sm text-secondary mb-4 line-clamp-3">
                      {ressourcePdf.description}
                    </p>
                  )}

                  {/* Métadonnées */}
                  <div className="flex flex-wrap items-center gap-4 mb-4 text-xs text-secondary">
                    {ressourcePdf.author && (
                      <div className="flex items-center gap-1">
                        <FiUser className="w-3 h-3" />
                        <span>{ressourcePdf.author}</span>
                      </div>
                    )}
                    {ressourcePdf.pages > 0 && (
                      <div className="flex items-center gap-1">
                        <FiFileText className="w-3 h-3" />
                        <span>{ressourcePdf.pages} pages</span>
                      </div>
                    )}
                    {ressourcePdf.downloadCount > 0 && (
                      <div className="flex items-center gap-1">
                        <FiDownload className="w-3 h-3" />
                        <span>{ressourcePdf.downloadCount} téléchargement{ressourcePdf.downloadCount > 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>

                  {/* Prix */}
                  {!ressourcePdf.isFree && ressourcePdf.price > 0 && (
                    <div className="mb-4">
                      <span className="text-2xl font-bold text-accent">
                        {ressourcePdf.price.toLocaleString('fr-FR')} FCFA
                      </span>
                    </div>
                  )}

                  {/* Bouton de téléchargement */}
                  <button
                    onClick={() => handleDownload(ressourcePdf)}
                    className="w-full btn-primary inline-flex items-center justify-center gap-2"
                  >
                    <FiDownload className="w-5 h-5" />
                    {ressourcePdf.isFree ? 'Télécharger gratuitement' : 'Télécharger'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


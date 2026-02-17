import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CONFIG } from '../config/config'
import { useAuth } from '../contexts/AuthContext'
import SubscriptionButton from '../components/SubscriptionButton'
import { FiBook, FiDownload, FiFileText, FiUser, FiTag, FiSearch, FiFilter, FiLock } from 'react-icons/fi'
import axios from 'axios'

export default function RessourcesPdfPage() {
  const { user, token, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [ressourcesPdf, setRessourcesPdf] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [selectedPdf, setSelectedPdf] = useState(null)

  useEffect(() => {
    fetchRessourcesPdf()
  }, [])

  const fetchRessourcesPdf = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get(`${CONFIG.BACKEND_URL}/api/ressources-pdf`)
      
      console.log('📚 Réponse API ressources PDF:', response.data)
      
      if (response.data && response.data.success) {
        setRessourcesPdf(response.data.ressourcesPdf || [])
      } else if (Array.isArray(response.data)) {
        // Fallback si la réponse est directement un tableau
        setRessourcesPdf(response.data)
      } else {
        console.error('❌ Format de réponse inattendu:', response.data)
        setError('Format de réponse inattendu du serveur')
      }
    } catch (err) {
      console.error('❌ Erreur chargement ressources PDF:', err)
      console.error('❌ Détails:', err.response?.data || err.message)
      setError(err.response?.data?.error || 'Impossible de charger les ressources PDF')
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

  // Fonction pour détecter si l'utilisateur est sur mobile
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (window.innerWidth <= 768)
  }

  // Fonction pour ouvrir le PDF via la route dédiée dans un nouvel onglet
  const openPdfViaRoute = async (ressourceId) => {
    console.log('📥 Ouverture PDF via route dédiée:', { ressourceId })
    
    try {
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {}
      const downloadUrl = `${CONFIG.BACKEND_URL}/api/ressources-pdf/${ressourceId}/file`
      
      // Vérifier d'abord si l'utilisateur a accès (pour les PDF payants)
      const response = await fetch(downloadUrl, { 
        headers,
        mode: 'cors',
        credentials: 'include'
      })
      
      if (!response.ok) {
        if (response.status === 403) {
          const errorData = await response.json()
          if (errorData.requiresSubscription) {
            throw new Error('REQUIRES_SUBSCRIPTION')
          }
        }
        throw new Error(`HTTP ${response.status}`)
      }

      // Si la réponse contient une URL JSON (redirection)
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json()
        if (data.redirect && data.pdfUrl) {
          console.log('🌐 Ouverture URL externe:', data.pdfUrl)
          window.open(data.pdfUrl, '_blank')
          return true
        }
      }

      // Si c'est une redirection directe, suivre l'URL
      if (response.redirected || response.status === 302) {
        const redirectUrl = response.url || response.headers.get('location')
        console.log('🌐 Ouverture URL externe (redirection):', redirectUrl)
        window.open(redirectUrl, '_blank')
        return true
      }
      
      // Si c'est un blob, créer une URL et l'ouvrir
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      window.open(blobUrl, '_blank')
      
      // Nettoyer l'URL après un délai
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl)
      }, 1000)
      
      return true
    } catch (error) {
      console.error('❌ Erreur ouverture PDF via route:', error)
      if (error.message === 'REQUIRES_SUBSCRIPTION') {
        throw error
      }
      return false
    }
  }

  // Fonction pour ouvrir le PDF dans un nouvel onglet
  const openPdf = (pdfUrl) => {
    console.log('📥 Ouverture PDF dans nouvel onglet:', { pdfUrl })
    
    // Ouvrir directement l'URL dans un nouvel onglet
    window.open(pdfUrl, '_blank', 'noopener,noreferrer')
    return true
  }

  const handleDownload = async (ressourcePdf) => {
    try {
      console.log('📥 Début téléchargement PDF:', ressourcePdf.title)
      console.log('   - isFree:', ressourcePdf.isFree)
      console.log('   - isAuthenticated:', isAuthenticated)
      console.log('   - user.status:', user?.status)
      console.log('   - pdfUrl:', ressourcePdf.pdfUrl)
      console.log('   - isMobile:', isMobile())

      // Si le PDF a une URL externe directe (Google Drive, etc.), l'utiliser directement
      // Sinon, utiliser la route backend qui gère l'authentification et redirige
      const hasExternalUrl = ressourcePdf.pdfUrl && 
        (ressourcePdf.pdfUrl.startsWith('http://') || ressourcePdf.pdfUrl.startsWith('https://'))
      
      if (hasExternalUrl) {
        console.log('✅ URL externe directe disponible:', ressourcePdf.pdfUrl)
      } else {
        console.log('📡 Utilisation route backend pour téléchargement')
      }

      // Cas 1: PDF gratuit → téléchargement direct
      if (ressourcePdf.isFree) {
        console.log('📄 PDF gratuit - téléchargement direct')
        
        // Incrémenter le compteur (optionnel pour les PDF gratuits)
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {}
        try {
          await axios.post(
            `${CONFIG.BACKEND_URL}/api/ressources-pdf/${ressourcePdf._id}/download`,
            {},
            { headers }
          )
          console.log('✅ Compteur incrémenté')
        } catch (err) {
          // Ignorer les erreurs d'incrémentation pour les PDF gratuits
          console.log('⚠️ Note: Impossible d\'incrémenter le compteur pour PDF gratuit')
        }
        
        // Si URL externe directe, ouvrir directement
        if (hasExternalUrl) {
          openPdf(ressourcePdf.pdfUrl)
          return
        }
        
        // Sinon, utiliser la route backend
        try {
          const success = await openPdfViaRoute(ressourcePdf._id)
          if (!success) {
            throw new Error('Échec de l\'ouverture via route dédiée')
          }
        } catch (error) {
          console.error('❌ Erreur ouverture via route dédiée:', error)
          if (error.message === 'REQUIRES_SUBSCRIPTION') {
            setSelectedPdf(ressourcePdf)
            setShowSubscriptionModal(true)
            return
          }
          setError(`Impossible d'ouvrir le PDF: ${error.message || 'Erreur inconnue'}`)
        }
        return
      }

      // Cas 2: PDF payant
      // Si l'utilisateur n'est pas connecté, rediriger vers login
      if (!isAuthenticated) {
        console.log('🔒 Utilisateur non connecté - redirection vers login')
        navigate('/login', { state: { from: '/ressources-pdf', message: 'Connectez-vous pour télécharger cette ressource PDF' } })
        return
      }

      // Si l'utilisateur n'est pas abonné (status !== 'active'), afficher le modal d'abonnement
      if (user?.status !== 'active') {
        console.log('💳 Utilisateur non abonné - affichage modal abonnement')
        setSelectedPdf(ressourcePdf)
        setShowSubscriptionModal(true)
        return
      }

      // Cas 3: PDF payant ET utilisateur abonné → téléchargement direct
      console.log('✅ Utilisateur abonné - téléchargement autorisé')
      const headers = { 'Authorization': `Bearer ${token}` }
      
      const response = await axios.post(
        `${CONFIG.BACKEND_URL}/api/ressources-pdf/${ressourcePdf._id}/download`,
        {},
        { headers }
      )
      
      console.log('📥 Réponse backend:', response.data)
      
      // Vérifier si le backend demande un abonnement (sécurité supplémentaire)
      if (response.data.requiresSubscription) {
        console.log('⚠️ Backend demande abonnement')
        setSelectedPdf(ressourcePdf)
        setShowSubscriptionModal(true)
        return
      }
      
      // Si URL externe directe, ouvrir directement
      if (hasExternalUrl) {
        openPdf(ressourcePdf.pdfUrl)
        return
      }
      
      // Sinon, utiliser la route backend
      try {
        const success = await openPdfViaRoute(ressourcePdf._id)
        if (!success) {
          throw new Error('Échec de l\'ouverture via route dédiée')
        }
      } catch (error) {
        console.error('❌ Erreur ouverture via route dédiée:', error)
        if (error.message === 'REQUIRES_SUBSCRIPTION') {
          setSelectedPdf(ressourcePdf)
          setShowSubscriptionModal(true)
          return
        }
        setError(`Impossible d'ouvrir le PDF: ${error.message || 'Erreur inconnue'}`)
      }
    } catch (err) {
      console.error('❌ Erreur téléchargement:', err)
      console.error('   - Status:', err.response?.status)
      console.error('   - Data:', err.response?.data)
      
      // Si l'erreur indique qu'un abonnement est requis
      if (err.response?.data?.requiresSubscription) {
        console.log('💳 Abonnement requis selon backend')
        setSelectedPdf(ressourcePdf)
        setShowSubscriptionModal(true)
        return
      }
      
      // Si le PDF est gratuit, essayer directement avec l'URL externe si disponible
      if (ressourcePdf.isFree) {
        console.log('🔄 Tentative ouverture PDF gratuit malgré l\'erreur')
        if (hasExternalUrl) {
          openPdf(ressourcePdf.pdfUrl)
        } else {
          try {
            const success = await openPdfViaRoute(ressourcePdf._id)
            if (!success) {
              setError('Impossible d\'ouvrir le PDF. Veuillez réessayer plus tard.')
            }
          } catch (error) {
            console.error('❌ Erreur ouverture PDF gratuit:', error)
            setError('Impossible d\'ouvrir le PDF. Veuillez réessayer plus tard.')
          }
        }
      } else {
        // PDF payant et erreur → demander l'abonnement
        console.log('💳 PDF payant - demande abonnement après erreur')
        setSelectedPdf(ressourcePdf)
        setShowSubscriptionModal(true)
      }
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
            <div className="text-5xl mb-4 text-secondary">⚠️</div>
            <p className="text-xl text-secondary mb-4">{error}</p>
            <div className="flex gap-4 justify-center">
            <button
              onClick={fetchRessourcesPdf}
              className="btn-primary inline-flex items-center gap-2"
            >
              Réessayer
            </button>
              <button
                onClick={() => setError(null)}
                className="btn-secondary inline-flex items-center gap-2"
              >
                Fermer
              </button>
            </div>
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
          <div className="flex flex-col gap-4 px-4">
            {filteredRessourcesPdf.map((ressourcePdf) => (
              <div
                key={ressourcePdf._id}
                className="bg-card border border-theme rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <FiBook className="w-6 h-6 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      {ressourcePdf.category && (
                        <div className="flex items-center gap-2">
                          <FiTag className="w-4 h-4 text-accent" />
                          <span className="text-xs font-medium text-accent uppercase tracking-wider">
                            {ressourcePdf.category}
                          </span>
                        </div>
                      )}
                      {ressourcePdf.isFree && (
                        <span className="bg-accent text-white px-3 py-1 rounded-full text-xs font-bold">
                          Gratuit
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg sm:text-xl font-bold text-primary mb-2">
                      {ressourcePdf.title}
                    </h3>

                    {ressourcePdf.description && (
                      <p className="text-sm text-secondary mb-4">
                        {ressourcePdf.description}
                      </p>
                    )}

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

                    {!ressourcePdf.isFree && (
                      <div className="mb-4 flex items-center gap-2 text-sm text-secondary">
                        <FiLock className="w-4 h-4" />
                        <span>Réservé aux abonnés</span>
                      </div>
                    )}

                    <button
                      onClick={() => handleDownload(ressourcePdf)}
                      className={`inline-flex items-center justify-center gap-2 py-3 px-4 text-base font-semibold rounded-xl transition-all duration-300 ${
                        !ressourcePdf.isFree && user?.status !== 'active'
                          ? 'btn-secondary'
                          : 'btn-primary'
                      } ${isMobile() ? 'touch-manipulation' : ''}`}
                      style={isMobile() ? { 
                        WebkitTapHighlightColor: 'transparent',
                        touchAction: 'manipulation'
                      } : {}}
                    >
                      {!ressourcePdf.isFree && user?.status !== 'active' ? (
                        <>
                          <FiLock className="w-5 h-5" />
                          <span>S'abonner pour télécharger</span>
                        </>
                      ) : (
                        <>
                          <FiDownload className="w-5 h-5" />
                          <span>{ressourcePdf.isFree ? 'Télécharger gratuitement' : 'Télécharger'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de paiement pour PDF payant */}
      {showSubscriptionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-theme rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-theme flex items-center justify-between">
              <h2 className="text-2xl font-bold text-primary">
                Abonnement requis
              </h2>
              <button
                onClick={() => {
                  setShowSubscriptionModal(false)
                  setSelectedPdf(null)
                }}
                className="text-secondary hover:text-primary transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              {selectedPdf && (
                <div className="mb-6 p-4 bg-secondary/50 rounded-xl">
                  <h3 className="text-lg font-semibold text-primary mb-2">
                    {selectedPdf.title}
                  </h3>
                  <p className="text-secondary text-sm">
                    Cette ressource PDF est réservée aux abonnés. Abonnez-vous pour y accéder.
                  </p>
                </div>
              )}
              <SubscriptionButton
                onSuccess={() => {
                  setShowSubscriptionModal(false)
                  setSelectedPdf(null)
                  // Recharger les données utilisateur après paiement
                  window.location.reload()
                }}
                onError={(error) => {
                  setError(error)
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


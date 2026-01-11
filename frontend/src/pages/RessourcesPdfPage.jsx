import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CONFIG } from '../config/config'
import { getImageUrl } from '../utils/imageUtils'
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

  // Fonction pour télécharger le PDF via la route dédiée (meilleure compatibilité mobile)
  const downloadPdfViaRoute = async (ressourceId, filename) => {
    const sanitizedFilename = (filename || 'document.pdf')
      .replace(/[^a-z0-9.-]/gi, '_')
      .toLowerCase()
    
    console.log('📥 Téléchargement via route dédiée:', { ressourceId, filename: sanitizedFilename, isMobile: isMobile() })
    
    try {
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {}
      const downloadUrl = `${CONFIG.BACKEND_URL}/api/ressources-pdf/${ressourceId}/file`
      
      if (isMobile()) {
        // Sur mobile, utiliser fetch + blob
        console.log('📱 Téléchargement mobile via route')
        const response = await fetch(downloadUrl, { 
          headers,
          mode: 'cors',
          credentials: 'include'
        })
        
        // La route /file redirige vers Cloudinary, donc on suit la redirection
        // Si c'est une redirection (status 302), suivre l'URL de redirection
        if (response.redirected || response.status === 302) {
          // Récupérer l'URL de redirection depuis les headers ou utiliser l'URL finale
          const cloudinaryUrl = response.url || response.headers.get('location')
          console.log('🌐 Redirection vers URL Cloudinary:', cloudinaryUrl)
          
          // Télécharger directement depuis Cloudinary
          const cloudinaryResponse = await fetch(cloudinaryUrl, {
            mode: 'cors',
            credentials: 'include'
          })
          if (!cloudinaryResponse.ok) {
            throw new Error(`Erreur téléchargement Cloudinary: ${cloudinaryResponse.status}`)
          }
          const blob = await cloudinaryResponse.blob()
          const blobUrl = window.URL.createObjectURL(blob)
          
          const link = document.createElement('a')
          link.href = blobUrl
          link.download = sanitizedFilename
          link.style.cssText = 'display: none; position: absolute; left: -9999px;'
          link.setAttribute('download', sanitizedFilename)
          
          document.body.appendChild(link)
          setTimeout(() => {
            link.click()
            setTimeout(() => {
              document.body.removeChild(link)
              window.URL.revokeObjectURL(blobUrl)
            }, 2000)
          }, 100)
          return true
        }
        
        if (!response.ok) {
          if (response.status === 403) {
            const errorData = await response.json()
            if (errorData.requiresSubscription) {
              throw new Error('REQUIRES_SUBSCRIPTION')
            }
          }
          throw new Error(`HTTP ${response.status}`)
        }
        
        const blob = await response.blob()
        const blobUrl = window.URL.createObjectURL(blob)
        
        const link = document.createElement('a')
        link.href = blobUrl
        link.download = sanitizedFilename
        link.style.cssText = 'display: none; position: absolute; left: -9999px;'
        link.setAttribute('download', sanitizedFilename)
        
        document.body.appendChild(link)
        
        setTimeout(() => {
          link.click()
          setTimeout(() => {
            document.body.removeChild(link)
            window.URL.revokeObjectURL(blobUrl)
          }, 2000)
        }, 100)
        
        return true
      } else {
        // Sur desktop, ouvrir directement l'URL (qui redirigera vers Cloudinary)
        console.log('💻 Téléchargement desktop via route')
        // La route redirige vers Cloudinary, donc on peut ouvrir directement
        window.open(downloadUrl, '_blank')
        return true
      }
    } catch (error) {
      console.error('❌ Erreur téléchargement via route:', error)
      if (error.message === 'REQUIRES_SUBSCRIPTION') {
        throw error
      }
      return false
    }
  }

  // Fonction pour télécharger le PDF (optimisée pour mobile et desktop)
  const downloadPdf = async (pdfUrl, filename) => {
    const sanitizedFilename = (filename || 'document.pdf')
      .replace(/[^a-z0-9.-]/gi, '_')
      .toLowerCase()
    
    console.log('📥 Téléchargement PDF:', { pdfUrl, filename: sanitizedFilename, isMobile: isMobile() })
    
    // Sur mobile, utiliser une approche plus simple et fiable
    if (isMobile()) {
      console.log('📱 Téléchargement mobile')
      
      // Méthode 1: Essayer avec fetch + blob (meilleure compatibilité)
      try {
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {}
        const response = await fetch(pdfUrl, { 
          headers,
          mode: 'cors',
          credentials: 'include'
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const blob = await response.blob()
        console.log('✅ Blob créé, taille:', blob.size, 'bytes, type:', blob.type)
        
        // Créer un blob URL
        const blobUrl = window.URL.createObjectURL(blob)
        console.log('✅ Blob URL créé')
        
        // Créer et déclencher le téléchargement avec plusieurs tentatives
        const link = document.createElement('a')
        link.href = blobUrl
        link.download = sanitizedFilename
        link.style.cssText = 'display: none; position: absolute; left: -9999px;'
        
        // Ajouter plusieurs attributs pour meilleure compatibilité
        link.setAttribute('download', sanitizedFilename)
        link.setAttribute('target', '_blank')
        
        // Ajouter au DOM
        document.body.appendChild(link)
        
        // Déclencher le clic avec un petit délai pour iOS
        setTimeout(() => {
          try {
            link.click()
            console.log('✅ Clic déclenché sur mobile')
          } catch (e) {
            console.error('❌ Erreur lors du clic:', e)
            // Essayer avec dispatchEvent
            const clickEvent = new MouseEvent('click', {
              view: window,
              bubbles: true,
              cancelable: true
            })
            link.dispatchEvent(clickEvent)
          }
          
          // Nettoyer après un délai plus long pour mobile
          setTimeout(() => {
            try {
              document.body.removeChild(link)
              window.URL.revokeObjectURL(blobUrl)
              console.log('✅ Nettoyage effectué')
            } catch (e) {
              console.warn('⚠️ Erreur nettoyage:', e)
            }
          }, 2000)
        }, 100)
        
        return
      } catch (error) {
        console.error('❌ Erreur téléchargement mobile avec blob:', error)
        console.log('🔄 Fallback vers ouverture directe')
      }
      
      // Méthode 2: Fallback - ouvrir directement dans un nouvel onglet
      // Sur iOS Safari, cela permettra à l'utilisateur de télécharger manuellement via le menu
      try {
        const newWindow = window.open(pdfUrl, '_blank', 'noopener,noreferrer')
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
          // Popup bloquée, utiliser location.href
          console.log('⚠️ Popup bloquée, utilisation de location.href')
          window.location.href = pdfUrl
        } else {
          console.log('✅ PDF ouvert dans nouvel onglet (fallback mobile)')
        }
      } catch (error) {
        console.error('❌ Erreur ouverture PDF:', error)
        // Dernière méthode : redirection
        window.location.href = pdfUrl
      }
    } else {
      // Sur desktop, méthode standard avec lien
      console.log('💻 Téléchargement desktop')
      const link = document.createElement('a')
      link.href = pdfUrl
      link.download = sanitizedFilename
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      link.style.display = 'none'
      
      document.body.appendChild(link)
      link.click()
      
      setTimeout(() => {
        document.body.removeChild(link)
      }, 100)
      
      console.log('✅ Téléchargement desktop initié')
    }
  }

  const handleDownload = async (ressourcePdf) => {
    try {
      console.log('📥 Début téléchargement PDF:', ressourcePdf.title)
      console.log('   - isFree:', ressourcePdf.isFree)
      console.log('   - isAuthenticated:', isAuthenticated)
      console.log('   - user.status:', user?.status)
      console.log('   - pdfUrl:', ressourcePdf.pdfUrl)
      console.log('   - isMobile:', isMobile())

      // Fonction pour construire l'URL complète du PDF
      const buildPdfUrl = (pdfUrl) => {
        if (!pdfUrl) {
          console.error('❌ pdfUrl est vide')
          return null
        }
        
        // Si c'est déjà une URL complète (http/https), l'utiliser telle quelle
        if (pdfUrl.startsWith('http://') || pdfUrl.startsWith('https://')) {
          console.log('✅ URL complète détectée:', pdfUrl)
          return pdfUrl
        }
        
        // Sinon, construire l'URL complète avec le backend
        const fullUrl = `${CONFIG.BACKEND_URL}${pdfUrl.startsWith('/') ? pdfUrl : '/' + pdfUrl}`
        console.log('✅ URL construite:', fullUrl)
        return fullUrl
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
        
        // Télécharger via la route dédiée (meilleure compatibilité mobile)
        const filename = `${ressourcePdf.slug || ressourcePdf.title || 'document'}.pdf`
        try {
          const success = await downloadPdfViaRoute(ressourcePdf._id, filename)
          if (!success) {
            throw new Error('Échec du téléchargement via route dédiée')
          }
        } catch (error) {
          console.error('❌ Erreur téléchargement via route dédiée:', error)
          if (error.message === 'REQUIRES_SUBSCRIPTION') {
            setSelectedPdf(ressourcePdf)
            setShowSubscriptionModal(true)
            return
          }
          // Afficher une erreur plutôt que d'essayer le fallback
          setError(`Impossible de télécharger le PDF: ${error.message || 'Erreur inconnue'}`)
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
      
      // Télécharger via la route dédiée (meilleure compatibilité mobile)
      const filename = `${ressourcePdf.slug || ressourcePdf.title || 'document'}.pdf`
      try {
        const success = await downloadPdfViaRoute(ressourcePdf._id, filename)
        if (!success) {
          throw new Error('Échec du téléchargement via route dédiée')
        }
      } catch (error) {
        console.error('❌ Erreur téléchargement via route dédiée:', error)
        if (error.message === 'REQUIRES_SUBSCRIPTION') {
          setSelectedPdf(ressourcePdf)
          setShowSubscriptionModal(true)
          return
        }
        // Afficher une erreur plutôt que d'essayer le fallback
        setError(`Impossible de télécharger le PDF: ${error.message || 'Erreur inconnue'}`)
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
      
      // Si le PDF est gratuit, essayer quand même via la route dédiée
      if (ressourcePdf.isFree) {
        console.log('🔄 Tentative téléchargement PDF gratuit malgré l\'erreur')
        const filename = `${ressourcePdf.slug || ressourcePdf.title || 'document'}.pdf`
        try {
          const success = await downloadPdfViaRoute(ressourcePdf._id, filename)
          if (!success) {
            setError('Impossible de télécharger le PDF. Veuillez réessayer plus tard.')
          }
        } catch (error) {
          console.error('❌ Erreur téléchargement PDF gratuit:', error)
          setError('Impossible de télécharger le PDF. Veuillez réessayer plus tard.')
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
                      src={getImageUrl(ressourcePdf.coverImage, '/img/ressource-pdf-default.png')}
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

                  {/* Badge payant */}
                  {!ressourcePdf.isFree && (
                    <div className="mb-4 flex items-center gap-2 text-sm text-secondary">
                      <FiLock className="w-4 h-4" />
                      <span>Réservé aux abonnés</span>
                    </div>
                  )}

                  {/* Bouton de téléchargement */}
                  <button
                    onClick={() => handleDownload(ressourcePdf)}
                    className={`w-full inline-flex items-center justify-center gap-2 py-3 px-4 text-base font-semibold rounded-xl transition-all duration-300 ${
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


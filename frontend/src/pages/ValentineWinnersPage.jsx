import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { CONFIG } from '../config/config'
import { useAuth } from '../contexts/AuthContext'
import { FiArrowLeft, FiExternalLink, FiGlobe, FiTrendingUp, FiTrendingDown } from 'react-icons/fi'

export default function ValentineWinnersPage() {
  const { token, user, isAuthenticated, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [valentineProducts, setValentineProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [sortBy, setSortBy] = useState('trend')

  useEffect(() => {
    if (token && !authLoading) {
      fetchValentineProducts()
    }
  }, [token, authLoading])

  const fetchValentineProducts = async () => {
    if (!token) {
      setLoading(false)
      setError('Connecte-toi pour accéder aux winners St Valentin.')
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Toujours ignorer le cache pour avoir les produits les plus récents
      const url = `${CONFIG.BACKEND_URL}/api/valentine-winners?cache=false`
      console.log('🔍 Tentative de chargement depuis:', url)
      
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      })

      if (!res.ok) {
        // Si 404, la route n'existe pas sur le serveur
        if (res.status === 404) {
          const errorMsg = 'La route /api/valentine-winners n\'est pas disponible sur le serveur. Veuillez contacter l\'administrateur pour mettre à jour le serveur.'
          console.error('❌ Route non trouvée (404):', {
            status: res.status,
            url: url,
            message: 'Le serveur de production n\'a peut-être pas été mis à jour'
          })
          setError(errorMsg)
          setValentineProducts([])
          return
        }
        
        const data = await res.json().catch(() => ({}))
        const errorMessage = data.error || `Erreur ${res.status}: ${res.statusText}`
        console.error('❌ Erreur API valentine-winners:', {
          status: res.status,
          statusText: res.statusText,
          error: data.error,
          url: url
        })
        throw new Error(errorMessage)
      }

      const data = await res.json()
      // Les produits sont déjà filtrés par l'API
      setValentineProducts(data.products || [])
      console.log('✅ Produits St Valentin chargés:', data.products?.length || 0)
    } catch (err) {
      console.error('Erreur chargement winners St Valentin:', err)
      // Si c'est une erreur réseau ou autre, afficher un message plus clair
      if (err.message.includes('404') || err.message.includes('Route non trouvée')) {
        setError('La route /api/valentine-winners n\'est pas disponible sur le serveur. Le serveur doit être mis à jour.')
      } else {
        setError(err.message || 'Impossible de charger les winners St Valentin')
      }
      setValentineProducts([])
    } finally {
      setLoading(false)
    }
  }

  const sortedProducts = useMemo(() => {
    return [...valentineProducts].sort((a, b) => {
      if (sortBy === 'trend') {
        return (b.trendScore || 0) - (a.trendScore || 0)
      }
      if (sortBy === 'demand') {
        return (b.demandScore || 0) - (a.demandScore || 0)
      }
      if (sortBy === 'saturation') {
        return (a.saturation || 0) - (b.saturation || 0)
      }
      return 0
    })
  }, [valentineProducts, sortBy])

  const statusBadge = (status) => {
    const map = {
      hot: 'bg-red-500 text-white',
      warm: 'bg-orange-500 text-white',
      dead: 'bg-gray-500 text-white',
    }
    return map[status] || map.warm
  }

  const formatPrice = (priceRange) => {
    if (!priceRange) return 'Prix sur demande'
    
    if (priceRange.includes('FCFA') || priceRange.includes('F CFA')) {
      return priceRange
    }
    
    if (priceRange.includes('EUR') || priceRange.includes('€')) {
      const numbers = priceRange.match(/[\d\s,]+/g)
      if (numbers) {
        const converted = numbers.map(num => {
          const cleanNum = parseFloat(num.replace(/\s/g, '').replace(',', '.'))
          if (!isNaN(cleanNum)) {
            const fcfa = Math.round(cleanNum * 650)
            return fcfa.toLocaleString('fr-FR').replace(/\s/g, ' ')
          }
          return num
        })
        return converted.join(' - ') + ' FCFA'
      }
    }
    
    if (priceRange.includes('USD') || priceRange.includes('$')) {
      const numbers = priceRange.match(/[\d\s,]+/g)
      if (numbers) {
        const converted = numbers.map(num => {
          const cleanNum = parseFloat(num.replace(/\s/g, '').replace(',', '.'))
          if (!isNaN(cleanNum)) {
            const fcfa = Math.round(cleanNum * 600)
            return fcfa.toLocaleString('fr-FR').replace(/\s/g, ' ')
          }
          return num
        })
        return converted.join(' - ') + ' FCFA'
      }
    }
    
    const numbers = priceRange.match(/[\d\s,]+/g)
    if (numbers && !priceRange.match(/[A-Za-z]/)) {
      return priceRange + ' FCFA'
    }
    
    return priceRange
  }

  const canAccess = isAuthenticated && user?.status === 'active'

  return (
    <div className="min-h-screen bg-primary">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-8 pt-8">
        {/* Header avec gradient St Valentin */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/produits-gagnants')}
            className="flex items-center gap-2 text-secondary hover:text-primary mb-4 transition-colors"
          >
            <FiArrowLeft className="w-5 h-5" />
            <span>Retour aux produits</span>
          </button>
          
          <div className="bg-gradient-to-r from-pink-500 via-red-500 to-pink-600 rounded-2xl p-6 sm:p-8 mb-6 border-4 border-pink-300 dark:border-pink-700">
            <div className="flex items-center gap-4">
              <div className="text-5xl">💝</div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                  Winners Saint-Valentin
                </h1>
                <p className="text-white/90 text-base sm:text-lg">
                  Produits gagnants spécialement sélectionnés par l'IA pour la Saint-Valentin
                </p>
              </div>
            </div>
          </div>

          {/* Stats rapides */}
          {!loading && valentineProducts.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="card-startup p-4 text-center">
                <div className="text-2xl font-bold text-accent mb-1">
                  {valentineProducts.length}
                </div>
                <div className="text-sm text-secondary">Produits trouvés</div>
              </div>
              <div className="card-startup p-4 text-center">
                <div className="text-2xl font-bold text-accent mb-1">
                  {valentineProducts.filter(p => p.status === 'hot').length}
                </div>
                <div className="text-sm text-secondary">🔥 Hot</div>
              </div>
              <div className="card-startup p-4 text-center">
                <div className="text-2xl font-bold text-accent mb-1">
                  {valentineProducts.filter(p => p.status === 'warm').length}
                </div>
                <div className="text-sm text-secondary">Warm</div>
              </div>
              <div className="card-startup p-4 text-center">
                <div className="text-2xl font-bold text-gray-500 mb-1">
                  {new Set(valentineProducts.map(p => p.category)).size}
                </div>
                <div className="text-sm text-secondary">Catégories</div>
              </div>
            </div>
          )}
        </div>

        {!isAuthenticated && !authLoading && (
          <div className="mb-6 p-4 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-100">
            Connecte-toi pour voir les winners St Valentin.
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-100">
            {error}
          </div>
        )}

        {/* Contrôles de tri */}
        {!loading && valentineProducts.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-3">
            <button
              onClick={() => setSortBy('trend')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                sortBy === 'trend'
                  ? 'bg-pink-600 text-white shadow-lg'
                  : 'bg-secondary text-primary hover:bg-hover'
              }`}
            >
              <FiTrendingUp className="w-4 h-4" />
              Tendance
            </button>
            <button
              onClick={() => setSortBy('demand')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                sortBy === 'demand'
                  ? 'bg-pink-600 text-white shadow-lg'
                  : 'bg-secondary text-primary hover:bg-hover'
              }`}
            >
              <FiTrendingUp className="w-4 h-4" />
              Demande
            </button>
            <button
              onClick={() => setSortBy('saturation')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                sortBy === 'saturation'
                  ? 'bg-pink-600 text-white shadow-lg'
                  : 'bg-secondary text-primary hover:bg-hover'
              }`}
            >
              <FiTrendingDown className="w-4 h-4" />
              Saturation
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold text-pink-700 dark:text-pink-300 mb-2">
              Chargement des winners St Valentin
            </h3>
            <p className="text-pink-600 dark:text-pink-400">
              Analyse des produits en cours...
            </p>
          </div>
        )}

        {/* Liste des produits */}
        {!loading && sortedProducts.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {sortedProducts.map((product, index) => (
              <div
                key={`valentine-${product.name}-${index}`}
                onClick={() => setSelectedProduct(product)}
                className="card-startup hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group border-2 border-pink-200 dark:border-pink-800 hover:border-pink-400 dark:hover:border-pink-600"
              >
                <div className="flex items-start gap-4">
                  <div className={`${statusBadge(product.status)} px-4 py-2 rounded-xl font-bold text-sm flex-shrink-0`}>
                    {product.status === 'hot' ? '🔥 HOT' : product.status === 'dead' ? 'DEAD' : 'WARM'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-primary group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors mb-3 line-clamp-2">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                      <span className="px-3 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded-lg text-xs font-medium">
                        {product.category || '—'}
                      </span>
                      <span className="flex items-center gap-1 text-sm text-secondary">
                        <FiGlobe className="w-4 h-4" />
                        {product.countries?.slice(0, 2).join(', ')}
                        {product.countries?.length > 2 && ` +${product.countries.length - 2}`}
                      </span>
                    </div>
                    <div className="mb-4">
                      <span className="text-lg font-bold text-pink-600 dark:text-pink-400">
                        {formatPrice(product.priceRange)}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-2 text-center border border-pink-200 dark:border-pink-800">
                        <div className="text-xs text-pink-700 dark:text-pink-300 mb-1">Demande</div>
                        <div className="text-xl font-bold text-pink-600 dark:text-pink-400">
                          {product.demandScore ?? '—'}
                        </div>
                      </div>
                      <div className="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-2 text-center border border-pink-200 dark:border-pink-800">
                        <div className="text-xs text-pink-700 dark:text-pink-300 mb-1">Tendance</div>
                        <div className="text-xl font-bold text-pink-600 dark:text-pink-400">
                          {product.trendScore ?? '—'}
                        </div>
                      </div>
                      <div className="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-2 text-center border border-pink-200 dark:border-pink-800">
                        <div className="text-xs text-pink-700 dark:text-pink-300 mb-1">Saturation</div>
                        <div className="text-xl font-bold text-pink-600 dark:text-pink-400">
                          {product.saturation ?? '—'}
                        </div>
                      </div>
                    </div>
                    <a
                      href={product.alibabaLink || `https://www.alibaba.com/trade/search?fsb=y&IndexArea=product_en&SearchText=${encodeURIComponent(product.name)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white rounded-lg font-medium text-sm shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      <FiExternalLink className="w-4 h-4" />
                      <span>Rechercher sur Alibaba</span>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !loading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💔</div>
            <h3 className="text-xl font-semibold text-pink-700 dark:text-pink-300 mb-2">
              Aucun winner St Valentin trouvé
            </h3>
            <p className="text-pink-600 dark:text-pink-400">
              Les produits St Valentin seront bientôt disponibles
            </p>
          </div>
        )}

        {/* Overlay pour utilisateurs non connectés ou non actifs */}
        {!canAccess && !authLoading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-card rounded-2xl shadow-2xl p-8 max-w-md w-full">
              <div className="w-20 h-20 bg-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-4xl">💝</span>
              </div>
              <h2 className="text-2xl font-bold text-primary mb-4 text-center">
                Winners St Valentin Verrouillés
              </h2>
              {!isAuthenticated ? (
                <>
                  <p className="text-lg text-secondary mb-6 text-center">
                    Connectez-vous pour accéder aux winners St Valentin
                  </p>
                  <button
                    onClick={() => navigate('/login')}
                    className="btn-primary w-full flex items-center justify-center gap-3 px-6 py-4 font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <span>Se connecter</span>
                  </button>
                </>
              ) : (
                <>
                  <p className="text-lg text-secondary mb-6 text-center">
                    Activez votre compte pour accéder aux winners St Valentin
                  </p>
                  <button
                    onClick={() => navigate('/profil')}
                    className="btn-primary w-full flex items-center justify-center gap-3 px-6 py-4 font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <span>Activer mon compte</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal détail produit */}
      {selectedProduct && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedProduct(null)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-4 border-pink-300 dark:border-pink-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-gradient-to-r from-pink-500 to-pink-600 p-6 flex items-center justify-between border-b-4 border-pink-300 dark:border-pink-700">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Détails du produit
                </h2>
                <p className="text-white/90 text-sm mt-1">
                  Analyse complète du winner St Valentin
                </p>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-white hover:text-pink-200 text-2xl font-bold transition-colors bg-white/20 hover:bg-white/30 rounded-full w-10 h-10 flex items-center justify-center"
                aria-label="Fermer"
              >
                ×
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className={`${statusBadge(selectedProduct.status)} inline-block px-4 py-2 rounded-xl font-bold text-sm mb-3`}>
                    {selectedProduct.status === 'hot' ? '🔥 HOT' : selectedProduct.status === 'dead' ? 'DEAD' : 'WARM'}
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {selectedProduct.name}
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1.5 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded-lg text-sm font-medium">
                      {selectedProduct.category || '—'}
                    </span>
                    <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                      <FiGlobe className="w-4 h-4" />
                      {selectedProduct.countries?.length} pays
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-pink-50 dark:bg-pink-900/20 rounded-xl p-5 text-center border border-pink-200 dark:border-pink-800">
                  <div className="text-sm font-semibold text-pink-700 dark:text-pink-300 mb-2">Score de Demande</div>
                  <div className="text-4xl font-bold text-pink-600 dark:text-pink-400 mb-1">
                    {selectedProduct.demandScore ?? '—'}
                  </div>
                  <div className="text-xs text-pink-600 dark:text-pink-400">/ 100</div>
                </div>
                
                <div className="bg-pink-50 dark:bg-pink-900/20 rounded-xl p-5 text-center border border-pink-200 dark:border-pink-800">
                  <div className="text-sm font-semibold text-pink-700 dark:text-pink-300 mb-2">Score de Tendance</div>
                  <div className="text-4xl font-bold text-pink-600 dark:text-pink-400 mb-1">
                    {selectedProduct.trendScore ?? '—'}
                  </div>
                  <div className="text-xs text-pink-600 dark:text-pink-400">/ 100</div>
                </div>
                
                <div className="bg-pink-50 dark:bg-pink-900/20 rounded-xl p-5 text-center border border-pink-200 dark:border-pink-800">
                  <div className="text-sm font-semibold text-pink-700 dark:text-pink-300 mb-2">Saturation Marché</div>
                  <div className="text-4xl font-bold text-pink-600 dark:text-pink-400 mb-1">
                    {selectedProduct.saturation ?? '—'}
                  </div>
                  <div className="text-xs text-pink-600 dark:text-pink-400">%</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-pink-50 dark:bg-pink-900/20 rounded-xl p-5 border border-pink-200 dark:border-pink-800">
                  <div className="text-sm font-semibold text-pink-700 dark:text-pink-300 mb-1">Prix de vente</div>
                  <div className="text-xl font-bold text-pink-600 dark:text-pink-400">
                    {formatPrice(selectedProduct.priceRange)}
                  </div>
                </div>
                
                <div className="bg-pink-50 dark:bg-pink-900/20 rounded-xl p-5 border border-pink-200 dark:border-pink-800">
                  <div className="flex items-center gap-3 mb-3">
                    <FiGlobe className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                    <div>
                      <div className="text-sm font-semibold text-pink-700 dark:text-pink-300 mb-1">Marchés cibles</div>
                      <div className="text-xl font-bold text-gray-900 dark:text-white">
                        {selectedProduct.countries?.length || 0} pays
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {selectedProduct.countries && selectedProduct.countries.length > 0 && (
                <div className="mb-8">
                  <div className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    📍 Pays cibles recommandés
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {selectedProduct.countries.map((country, idx) => (
                      <span
                        key={idx}
                        className="px-4 py-2.5 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-xl text-sm font-medium shadow-sm hover:shadow-md transition-shadow"
                      >
                        {country}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-8">
                <a
                  href={selectedProduct.alibabaLink || `https://www.alibaba.com/trade/search?fsb=y&IndexArea=product_en&SearchText=${encodeURIComponent(selectedProduct.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 w-full px-6 py-4 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <FiExternalLink className="w-5 h-5" />
                  <span>Rechercher sur Alibaba</span>
                  <FiExternalLink className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}



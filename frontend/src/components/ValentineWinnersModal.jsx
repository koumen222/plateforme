import { useState, useEffect } from 'react'
import { CONFIG } from '../config/config'
import { useAuth } from '../contexts/AuthContext'
import { FiX, FiExternalLink, FiGlobe, FiTrendingUp, FiTrendingDown } from 'react-icons/fi'

export default function ValentineWinnersModal({ isOpen, onClose }) {
  const { token } = useAuth()
  const [valentineProducts, setValentineProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [sortBy, setSortBy] = useState('trend')

  useEffect(() => {
    if (isOpen && token) {
      fetchValentineProducts()
    }
  }, [isOpen, token])

  const fetchValentineProducts = async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch(`${CONFIG.BACKEND_URL}/api/success-radar`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Impossible de charger les produits')
      }

      const data = await res.json()
      // Filtrer uniquement les produits St Valentin
      const valentine = (data.products || []).filter(
        p => p.specialEvent === 'saint-valentin'
      )
      setValentineProducts(valentine)
    } catch (err) {
      console.error('Erreur chargement winners St Valentin:', err)
      setError(err.message || 'Impossible de charger les winners St Valentin')
    } finally {
      setLoading(false)
    }
  }

  const sortedProducts = [...valentineProducts].sort((a, b) => {
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

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-gradient-to-br from-pink-50 to-red-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto my-8 border-4 border-pink-300 dark:border-pink-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header avec gradient St Valentin */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-pink-500 via-red-500 to-pink-600 p-6 flex items-center justify-between border-b-4 border-pink-300 dark:border-pink-700">
          <div className="flex items-center gap-4">
            <div className="text-5xl">💝</div>
            <div>
              <h2 className="text-3xl font-bold text-white mb-1">
                Winners Saint-Valentin
              </h2>
              <p className="text-white/90 text-sm">
                Produits gagnants spécialement sélectionnés par l'IA pour la Saint-Valentin
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-pink-200 text-3xl font-bold transition-colors bg-white/20 hover:bg-white/30 rounded-full w-10 h-10 flex items-center justify-center"
            aria-label="Fermer"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Contrôles de tri */}
          {!loading && valentineProducts.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-3">
              <button
                onClick={() => setSortBy('trend')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                  sortBy === 'trend'
                    ? 'bg-pink-600 text-white shadow-lg'
                    : 'bg-white dark:bg-gray-800 text-pink-600 dark:text-pink-400 hover:bg-pink-100 dark:hover:bg-pink-900/30'
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
                    : 'bg-white dark:bg-gray-800 text-pink-600 dark:text-pink-400 hover:bg-pink-100 dark:hover:bg-pink-900/30'
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
                    : 'bg-white dark:bg-gray-800 text-pink-600 dark:text-pink-400 hover:bg-pink-100 dark:hover:bg-pink-900/30'
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

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-100">
              {error}
            </div>
          )}

          {/* Liste des produits */}
          {!loading && sortedProducts.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {sortedProducts.map((product, index) => (
                <div
                  key={`valentine-${product.name}-${index}`}
                  onClick={() => setSelectedProduct(product)}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border-2 border-pink-200 dark:border-pink-800 hover:border-pink-400 dark:hover:border-pink-600"
                >
                  <div className="flex items-start gap-4">
                    <div className={`${statusBadge(product.status)} px-4 py-2 rounded-xl font-bold text-sm flex-shrink-0`}>
                      {product.status === 'hot' ? '🔥 HOT' : product.status === 'dead' ? 'DEAD' : 'WARM'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-2 mb-4 flex-wrap">
                        <span className="px-3 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded-lg text-xs font-medium">
                          {product.category || '—'}
                        </span>
                        <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
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
                  <FiX className="w-6 h-6" />
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
    </div>
  )
}



import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { CONFIG } from '../config/config'
import { useAuth } from '../contexts/AuthContext'
import { FiFilter, FiSearch, FiX, FiTrendingUp, FiTrendingDown, FiGlobe, FiRefreshCw, FiExternalLink, FiLock, FiStar } from 'react-icons/fi'

export default function ProductsPage() {
  const { token, user, isAuthenticated, loading: authLoading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('trend')
  const [showValentineOnly, setShowValentineOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    const fetchProducts = async () => {
      if (!token) {
        setLoading(false)
        setError('Connecte-toi pour accéder au Success Radar.')
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Toujours ignorer le cache pour avoir les produits les plus récents
        const res = await fetch(`${CONFIG.BACKEND_URL}/api/success-radar?cache=false`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || 'Impossible de charger les produits gagnants')
        }

        const data = await res.json()
        setProducts(data.products || [])
        
        if (data.message) {
          if (data.fromCache) {
            if (import.meta.env.DEV) {
              console.log('ℹ️', data.message)
            }
          } else if (!data.products?.length) {
            setError(data.message)
          }
        }
      } catch (err) {
        // Erreur toujours loggée
        console.error('Erreur Success Radar:', err)
        setError(err.message || 'Impossible de charger les produits')
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    }

    if (!authLoading) {
      fetchProducts()
    }
  }, [authLoading, token])

  const handleRefresh = () => {
    setRefreshing(true)
    const fetchProducts = async () => {
      try {
        setError(null)
        // Supprimer le cache en utilisant cache=false
        const res = await fetch(`${CONFIG.BACKEND_URL}/api/success-radar?cache=false&force=true`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || 'Impossible de recharger les produits')
        }

        const data = await res.json()
        setProducts(data.products || [])
      } catch (err) {
        // Erreur toujours loggée
        console.error('Erreur refresh:', err)
        setError(err.message)
      } finally {
        setRefreshing(false)
      }
    }

    fetchProducts()
  }

  const categories = useMemo(
    () => ['all', ...new Set(products.map((p) => p.category || 'Autre'))],
    [products]
  )

  // Séparer les produits Saint-Valentin des autres produits
  const valentineProducts = useMemo(() => {
    const filtered = products.filter(p => p.specialEvent === 'saint-valentin')
    if (import.meta.env.DEV) {
      console.log('💝 Produits St Valentin trouvés:', filtered.length, filtered)
    }
    return filtered
  }, [products])

  const regularProducts = useMemo(() => {
    return products.filter(p => !p.specialEvent || p.specialEvent !== 'saint-valentin')
  }, [products])

  const filteredProducts = useMemo(() => {
    const search = searchTerm.toLowerCase()
    const productsToFilter = showValentineOnly ? valentineProducts : regularProducts
    
    return productsToFilter
      .filter((product) => {
        const matchesSearch =
          product.name?.toLowerCase().includes(search) ||
          product.category?.toLowerCase().includes(search) ||
          product.countries?.some((c) => c.toLowerCase().includes(search))

        const matchesCategory =
          categoryFilter === 'all' || product.category === categoryFilter

        const matchesStatus =
          statusFilter === 'all' || product.status === statusFilter

        return matchesSearch && matchesCategory && matchesStatus
      })
      .sort((a, b) => {
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
  }, [regularProducts, valentineProducts, showValentineOnly, searchTerm, categoryFilter, statusFilter, sortBy])

  const filteredValentineProducts = useMemo(() => {
    return valentineProducts.sort((a, b) => {
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
      hot: 'bg-accent text-white',
      warm: 'bg-accent/80 text-white',
      dead: 'bg-secondary text-secondary border border-theme',
    }
    return map[status] || map.warm
  }

  const sortOptions = [
    { value: 'trend', label: 'Tendance', icon: <FiTrendingUp /> },
    { value: 'demand', label: 'Demande', icon: <FiTrendingUp /> },
    { value: 'saturation', label: 'Saturation', icon: <FiTrendingDown /> },
  ]

  const statusOptions = [
    { value: 'all', label: 'Tous les statuts', color: 'text-secondary' },
    { value: 'hot', label: '🔥 Hot', color: 'text-accent' },
    { value: 'warm', label: 'Warm', color: 'text-accent' },
    { value: 'dead', label: 'Dead', color: 'text-secondary' },
  ]

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

  const canAccess = isAuthenticated && user?.status === 'active';
  
  return (
    <div className="min-h-screen bg-primary">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-8 pt-8">
        {/* Header avec stats */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-primary mb-2">
                🏆 Success Radar
              </h1>
              <p className="text-lg text-secondary">
                Produits gagnants pour l'Afrique francophone • Mise à jour toutes les heures
                {valentineProducts.length > 0 && (
                  <span className="block mt-2 text-pink-600 dark:text-pink-400 font-semibold">
                    💝 {valentineProducts.length} produit{valentineProducts.length > 1 ? 's' : ''} spécial{valentineProducts.length > 1 ? 'aux' : ''} Saint-Valentin disponible{valentineProducts.length > 1 ? 's' : ''}
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {valentineProducts.length > 0 && (
                <button
                  onClick={() => {
                    setShowValentineOnly(!showValentineOnly)
                    setSearchTerm('')
                    setCategoryFilter('all')
                    setStatusFilter('all')
                  }}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 ${
                    showValentineOnly
                      ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-lg hover:from-pink-600 hover:to-pink-700'
                      : 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 hover:bg-pink-200 dark:hover:bg-pink-900/50 border-2 border-pink-300 dark:border-pink-700'
                  }`}
                  aria-label={showValentineOnly ? 'Afficher tous les produits' : 'Afficher uniquement les winners Saint-Valentin'}
                >
                  <span className="text-lg">💝</span>
                  <span>{showValentineOnly ? 'Tous les produits' : `Winners Saint-Valentin (${valentineProducts.length})`}</span>
                </button>
              )}
              <button
                onClick={() => navigate('/winners-st-valentin')}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg hover:from-purple-600 hover:to-purple-700"
                aria-label="Voir les winners Saint-Valentin"
              >
                <span className="text-lg">💝</span>
                <span>Voir les winners St Valentin</span>
              </button>
              <button
                onClick={handleRefresh}
                disabled={refreshing || loading}
                className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"
                aria-label="Rafraîchir les produits"
              >
                <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Rafraîchissement...' : 'Rafraîchir'}
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn-secondary flex items-center gap-2 px-4 py-2 text-sm"
                aria-label={showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
                aria-expanded={showFilters}
              >
                <FiFilter className="w-4 h-4" />
                {showFilters ? 'Masquer filtres' : 'Filtres'}
              </button>
            </div>
          </div>

          {/* Stats rapides */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="card-startup p-4 text-center">
              <div className="text-2xl font-bold text-accent mb-1">
                {filteredProducts.length}
              </div>
              <div className="text-sm text-secondary">Produits trouvés</div>
            </div>
            <div className="card-startup p-4 text-center">
              <div className="text-2xl font-bold text-accent mb-1">
                {products.filter(p => p.status === 'hot').length}
              </div>
              <div className="text-sm text-secondary">🔥 Hot</div>
            </div>
            <div className="card-startup p-4 text-center">
              <div className="text-2xl font-bold text-accent mb-1">
                {products.filter(p => p.status === 'warm').length}
              </div>
              <div className="text-sm text-secondary">Warm</div>
            </div>
            <div className="card-startup p-4 text-center">
              <div className="text-2xl font-bold text-gray-500 mb-1">
                {categories.length - 1}
              </div>
              <div className="text-sm text-secondary">Catégories</div>
            </div>
          </div>
        </div>

        {!isAuthenticated && !authLoading && (
          <div className="mb-6 p-4 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-100">
            Connecte-toi pour voir les produits gagnants.
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-100">
            {error}
          </div>
        )}

        {/* Barre de recherche améliorée */}
        <div className="card-startup p-4 mb-6">
          <div className="relative">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary">
              <FiSearch className="w-5 h-5" />
            </div>
            <input
              type="text"
              placeholder="Rechercher un produit, une catégorie ou un pays..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-startup pl-12 pr-10"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-secondary hover:text-primary"
              >
                <FiX className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Filtres améliorés */}
        {showFilters && (
          <div className="card-startup p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Tri */}
              <div>
                <label className="block text-sm font-semibold text-primary mb-3">
                  <FiTrendingUp className="inline w-4 h-4 mr-2" />
                  Trier par
                </label>
                <div className="flex flex-col gap-2">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSortBy(option.value)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                        sortBy === option.value
                          ? 'bg-accent text-white shadow-md'
                          : 'bg-secondary text-primary hover:bg-hover'
                      }`}
                    >
                      {option.icon}
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Catégories */}
              <div>
                <label className="block text-sm font-semibold text-primary mb-3">
                  <FiFilter className="inline w-4 h-4 mr-2" />
                  Catégories
                </label>
                <div className="max-h-60 overflow-y-auto pr-2">
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setCategoryFilter('all')}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all ${
                        categoryFilter === 'all'
                          ? 'bg-accent text-white shadow-md'
                          : 'bg-secondary text-primary hover:bg-hover'
                      }`}
                    >
                      <span>Toutes les catégories</span>
                      <span className="text-xs opacity-70">({products.length})</span>
                    </button>
                    {categories
                      .filter(cat => cat !== 'all')
                      .map((category) => (
                        <button
                          key={category}
                          onClick={() => setCategoryFilter(category)}
                          className={`flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all ${
                            categoryFilter === category
                              ? 'bg-accent text-white shadow-md'
                              : 'bg-secondary text-primary hover:bg-hover'
                          }`}
                        >
                          <span>{category}</span>
                          <span className="text-xs opacity-70">
                            ({products.filter(p => p.category === category).length})
                          </span>
                        </button>
                      ))}
                  </div>
                </div>
              </div>

              {/* Statuts */}
              <div>
                <label className="block text-sm font-semibold text-primary mb-3">
                  Statuts
                </label>
                <div className="flex flex-col gap-2">
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setStatusFilter(option.value)}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all ${
                        statusFilter === option.value
                          ? 'bg-accent text-white'
                          : 'bg-secondary text-primary hover:bg-hover'
                      }`}
                    >
                      <span className={`${option.color} font-medium`}>
                        {option.label}
                      </span>
                      <span className="text-xs opacity-70">
                        ({option.value === 'all' 
                          ? products.length 
                          : products.filter(p => p.status === option.value).length})
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions des filtres */}
            <div className="flex justify-between items-center mt-6 pt-6 border-t border-theme">
              <div className="text-sm text-secondary">
                {filteredProducts.length} produit{filteredProducts.length !== 1 ? 's' : ''} correspondant{filteredProducts.length !== 1 ? 's' : ''} aux critères
              </div>
              <button
                onClick={() => {
                  setSearchTerm('')
                  setCategoryFilter('all')
                  setStatusFilter('all')
                  setSortBy('trend')
                }}
                className="btn-secondary flex items-center gap-2 px-4 py-2 text-sm"
                aria-label="Réinitialiser tous les filtres"
              >
                <FiX className="w-4 h-4" />
                Réinitialiser les filtres
              </button>
            </div>
          </div>
        )}

        {/* Section spéciale Saint-Valentin - Affichée seulement si on ne filtre pas par Saint-Valentin */}
        {!loading && valentineProducts.length > 0 && canAccess && !showValentineOnly && (
          <div className="mb-12 relative overflow-hidden rounded-2xl border-2" style={{
            background: 'linear-gradient(135deg, #ff6b9d 0%, #c44569 50%, #f8b500 100%)',
            borderColor: '#ff6b9d'
          }}>
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
            </div>
            <div className="relative p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="text-4xl">💝</div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">
                    Winners Saint-Valentin
                  </h2>
                  <p className="text-white/90 text-sm sm:text-base">
                    Produits gagnants spécialement sélectionnés pour la Saint-Valentin
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredValentineProducts.map((product, index) => (
                  <div
                    key={`valentine-${product.name}-${index}`}
                    onClick={() => setSelectedProduct(product)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setSelectedProduct(product)
                      }
                    }}
                    className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group border-2 border-white/50"
                    role="button"
                    tabIndex={0}
                    aria-label={`Voir les détails de ${product.name}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`${statusBadge(product.status)} px-4 py-2 rounded-xl font-bold text-sm flex-shrink-0`}>
                        {product.status === 'hot' ? '🔥 HOT' : product.status === 'dead' ? 'DEAD' : 'WARM'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors mb-2 line-clamp-2">
                              {product.name}
                            </h3>
                            <div className="flex items-center gap-2 mb-3 flex-wrap">
                              <span className="px-3 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded-lg text-xs font-medium">
                                {product.category || '—'}
                              </span>
                              <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                                <FiGlobe className="w-4 h-4" />
                                {product.countries?.slice(0, 2).join(', ')}
                                {product.countries?.length > 2 && ` +${product.countries.length - 2}`}
                              </span>
                            </div>
                          </div>
                          <div className="text-2xl text-pink-500 group-hover:text-pink-600 transition-colors flex-shrink-0">
                            →
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mb-4">
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
            </div>
          </div>
        )}

        {/* Liste des produits améliorée */}
        {loading ? (
          <div className="card-startup p-12 text-center">
            <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold text-primary mb-2">Chargement du Success Radar</h3>
            <p className="text-secondary">Analyse des tendances en cours...</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <>
            {showValentineOnly && (
              <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 border-2 border-pink-200 dark:border-pink-700">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💝</span>
                  <div>
                    <h3 className="font-bold text-pink-700 dark:text-pink-300 text-lg">
                      Winners Saint-Valentin
                    </h3>
                    <p className="text-sm text-pink-600 dark:text-pink-400">
                      {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''} spécial{filteredProducts.length > 1 ? 'aux' : ''} Saint-Valentin
                    </p>
                  </div>
                </div>
              </div>
            )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredProducts.map((product, index) => (
              <div
                key={`${product.name}-${index}`}
                onClick={() => setSelectedProduct(product)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setSelectedProduct(product)
                  }
                }}
                className="card-startup hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
                role="button"
                tabIndex={0}
                aria-label={`Voir les détails de ${product.name}`}
              >
                <div className="flex items-start gap-4">
                  {/* Badge de statut */}
                  <div className={`${statusBadge(product.status)} px-4 py-2 rounded-xl font-bold text-sm`}>
                    {product.status === 'hot' ? '🔥 HOT' : product.status === 'dead' ? 'DEAD' : 'WARM'}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-primary group-hover:text-accent transition-colors mb-2">
                          {product.name}
                        </h3>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="px-3 py-1 bg-secondary text-secondary rounded-lg text-xs font-medium">
                            {product.category || '—'}
                          </span>
                          <span className="flex items-center gap-1 text-sm text-secondary">
                            <FiGlobe className="w-4 h-4" />
                            {product.countries?.slice(0, 2).join(', ')}
                            {product.countries?.length > 2 && ` +${product.countries.length - 2}`}
                          </span>
                        </div>
                      </div>
                      <div className="text-3xl text-secondary group-hover:text-accent transition-colors">
                        →
                      </div>
                    </div>

                    {/* Prix */}
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-lg font-bold text-accent">
                        {formatPrice(product.priceRange)}
                      </span>
                    </div>

                    {/* Métriques */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="bg-secondary rounded-xl p-3 text-center border border-theme">
                        <div className="text-xs text-secondary mb-1">Demande</div>
                        <div className="text-2xl font-bold text-accent">
                          {product.demandScore ?? '—'}
                        </div>
                        <div className="text-xs text-secondary opacity-70">/100</div>
                      </div>
                      <div className="bg-secondary rounded-xl p-3 text-center border border-theme">
                        <div className="text-xs text-secondary mb-1">Tendance</div>
                        <div className="text-2xl font-bold text-accent">
                          {product.trendScore ?? '—'}
                        </div>
                        <div className="text-xs text-secondary opacity-70">/100</div>
                      </div>
                      <div className="bg-secondary rounded-xl p-3 text-center border border-theme">
                        <div className="text-xs text-secondary mb-1">Saturation</div>
                        <div className="text-2xl font-bold text-accent">
                          {product.saturation ?? '—'}
                        </div>
                        <div className="text-xs text-secondary opacity-70">%</div>
                      </div>
                    </div>

                    {/* Lien Alibaba - Toujours affiché */}
                    <a
                      href={product.alibabaLink || `https://www.alibaba.com/trade/search?fsb=y&IndexArea=product_en&SearchText=${encodeURIComponent(product.name)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-lg font-medium text-sm shadow-md hover:shadow-lg transition-all duration-200 mt-4"
                    >
                      <FiExternalLink className="w-4 h-4" />
                      <span>Rechercher sur Alibaba</span>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
          </>
        ) : (
          <div className="card-startup p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-primary mb-2">Aucun produit trouvé</h3>
            <p className="text-secondary mb-6">
              Aucun produit ne correspond à vos critères de recherche. Essayez de modifier vos filtres.
            </p>
            <button
              onClick={() => {
                setSearchTerm('')
                setCategoryFilter('all')
                setStatusFilter('all')
                setSortBy('trend')
                setShowFilters(true)
              }}
              className="btn-primary px-6 py-3"
              aria-label="Réinitialiser les filtres et afficher les options"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}
      </div>

      {/* Modal Popup amélioré */}
      {selectedProduct && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedProduct(null)}
        >
          <div 
            className="bg-card rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-card border-b border-theme p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-primary">
                  Détails du produit
                </h2>
                <p className="text-sm text-secondary mt-1">
                  Analyse complète du produit
                </p>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-secondary hover:text-primary text-2xl font-bold transition-colors"
                aria-label="Fermer les détails du produit"
              >
                ×
              </button>
            </div>
            
            <div className="p-6">
              {/* Header produit */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className={`${statusBadge(selectedProduct.status)} inline-block px-4 py-2 rounded-xl font-bold text-sm mb-3`}>
                    {selectedProduct.status === 'hot' ? '🔥 HOT' : selectedProduct.status === 'dead' ? 'DEAD' : 'WARM'}
                  </div>
                  <h3 className="text-3xl font-bold text-primary mb-2">
                    {selectedProduct.name}
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1.5 bg-secondary text-primary rounded-lg text-sm font-medium">
                      {selectedProduct.category || '—'}
                    </span>
                    <div className="flex items-center gap-1 text-sm text-secondary">
                      <FiGlobe className="w-4 h-4" />
                      {selectedProduct.countries?.length} pays
                    </div>
                  </div>
                </div>
              </div>

              {/* Grille de métriques */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-secondary rounded-xl p-5 text-center border border-theme">
                  <div className="text-sm font-semibold text-secondary mb-2">Score de Demande</div>
                  <div className="text-4xl font-bold text-accent mb-1">
                    {selectedProduct.demandScore ?? '—'}
                  </div>
                  <div className="text-xs text-secondary">/ 100</div>
                  <div className="mt-3 h-2 bg-secondary rounded-full overflow-hidden border border-theme">
                    <div 
                      className="h-full bg-accent"
                      style={{ width: `${selectedProduct.demandScore || 0}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="bg-secondary rounded-xl p-5 text-center border border-theme">
                  <div className="text-sm font-semibold text-secondary mb-2">Score de Tendance</div>
                  <div className="text-4xl font-bold text-accent mb-1">
                    {selectedProduct.trendScore ?? '—'}
                  </div>
                  <div className="text-xs text-secondary">/ 100</div>
                  <div className="mt-3 h-2 bg-secondary rounded-full overflow-hidden border border-theme">
                    <div 
                      className="h-full bg-accent"
                      style={{ width: `${selectedProduct.trendScore || 0}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="bg-secondary rounded-xl p-5 text-center border border-theme">
                  <div className="text-sm font-semibold text-secondary mb-2">Saturation Marché</div>
                  <div className="text-4xl font-bold text-accent mb-1">
                    {selectedProduct.saturation ?? '—'}
                  </div>
                  <div className="text-xs text-secondary">%</div>
                  <div className="mt-3 h-2 bg-secondary rounded-full overflow-hidden border border-theme">
                    <div 
                      className="h-full bg-accent"
                      style={{ width: `${selectedProduct.saturation || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Informations détaillées */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-secondary rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div>
                      <div className="text-sm font-semibold text-secondary mb-1">Prix de vente</div>
                      <div className="text-xl font-bold text-accent">
                        {formatPrice(selectedProduct.priceRange)}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-secondary">
                    Prix estimé pour le marché africain
                  </div>
                </div>
                
                <div className="bg-secondary rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <FiGlobe className="w-6 h-6 text-accent" />
                    <div>
                      <div className="text-sm font-semibold text-secondary mb-1">Marchés cibles</div>
                      <div className="text-xl font-bold text-primary">
                        {selectedProduct.countries?.length || 0} pays
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-secondary">
                    Potentiel de marché
                  </div>
                </div>
              </div>

              {/* Liste des pays */}
              {selectedProduct.countries && selectedProduct.countries.length > 0 && (
                <div className="mb-8">
                  <div className="text-lg font-semibold text-primary mb-4">
                    📍 Pays cibles recommandés
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {selectedProduct.countries.map((country, idx) => (
                      <span
                        key={idx}
                        className="px-4 py-2.5 bg-accent text-white rounded-xl text-sm font-medium shadow-sm hover:shadow-md transition-shadow"
                      >
                        {country}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Lien Alibaba - Toujours affiché */}
              <div className="mb-8">
                <a
                  href={selectedProduct.alibabaLink || `https://www.alibaba.com/trade/search?fsb=y&IndexArea=product_en&SearchText=${encodeURIComponent(selectedProduct.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 w-full px-6 py-4 bg-accent hover:bg-accent-hover text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <FiExternalLink className="w-5 h-5" />
                  <span>Rechercher sur Alibaba</span>
                  <FiExternalLink className="w-5 h-5" />
                </a>
                <p className="text-sm text-secondary text-center mt-3">
                  Cliquez pour trouver des fournisseurs sur Alibaba
                </p>
              </div>

              {/* Timestamp */}
              <div className="pt-6 border-t border-theme">
                <div className="flex items-center justify-between text-sm text-secondary">
                  <div className="flex items-center gap-2">
                    <FiRefreshCw className="w-4 h-4" />
                    <span>
                      Dernière mise à jour :{' '}
                      {selectedProduct.lastUpdated 
                        ? new Date(selectedProduct.lastUpdated).toLocaleString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : '—'}
                    </span>
                  </div>
                  <div className="text-xs px-3 py-1 bg-secondary rounded-full">
                    Success Radar v1.0
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay pour utilisateurs non connectés ou non actifs */}
      {!canAccess && !authLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <FiLock className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-primary mb-4 text-center">
              Success Radar Verrouillé
            </h2>
            {!isAuthenticated ? (
              <>
                <p className="text-lg text-secondary mb-6 text-center">
                  Connectez-vous pour accéder aux produits gagnants
                </p>
                <p className="text-sm text-secondary mb-8 text-center">
                  Accédez à 50 produits WINNERS validés pour l'Afrique francophone avec liens Alibaba, analyses de marché et scores de performance.
                </p>
                <Link
                  to="/login"
                  state={{ from: location }}
                  className="btn-primary w-full flex items-center justify-center gap-3 px-6 py-4 font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <FiStar className="w-5 h-5" />
                  <span>Se connecter pour accéder</span>
                </Link>
                <p className="text-xs text-secondary mt-4 text-center">
                  Pas encore de compte ?{' '}
                  <Link 
                    to="/login" 
                    state={{ register: true, from: location }}
                    className="text-accent hover:underline font-medium"
                  >
                    Créer un compte
                  </Link>
                </p>
              </>
            ) : (
              <>
                <p className="text-lg text-secondary mb-6 text-center">
                  Activez votre compte pour accéder aux produits gagnants
                </p>
                <p className="text-sm text-secondary mb-8 text-center">
                  Votre compte est actuellement en attente d'activation. Activez-le pour débloquer l'accès complet.
                </p>
                <Link
                  to="/profil"
                  state={{ from: location }}
                  className="btn-primary w-full flex items-center justify-center gap-3 px-6 py-4 font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <FiStar className="w-5 h-5" />
                  <span>Activer mon compte</span>
                </Link>
                <p className="text-xs text-secondary mt-4 text-center">
                  Besoin d'aide ?{' '}
                  <Link to="/contact" className="text-accent hover:underline font-medium">
                    Contacter le support
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
import { useState } from 'react'
import { winningProducts } from '../data/products'
import { convertToFCFA } from '../utils/productUtils'

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortBy, setSortBy] = useState('roi')

  // Récupérer toutes les catégories uniques
  const categories = ['all', ...new Set(winningProducts.map(p => p.category))]

  // Filtrer et trier les produits
  const filteredProducts = winningProducts
    .filter(product => {
      const matchesSearch = 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter
      
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      if (sortBy === 'roi') {
        return parseFloat(b.roi) - parseFloat(a.roi)
      } else if (sortBy === 'profit') {
        return parseFloat(b.profitMargin) - parseFloat(a.profitMargin)
      } else if (sortBy === 'price') {
        return parseFloat(a.price) - parseFloat(b.price)
      }
      return 0
    })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-16">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4">
            🏆 50 Produits Gagnants
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Découvrez notre sélection de 50 produits testés et performants sur Facebook Ads. 
            Ces produits ont généré des résultats exceptionnels avec la méthode Andromeda.
          </p>
        </div>

        {/* Filtres et recherche */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#8B5E3C] focus:border-[#8B5E3C] bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#8B5E3C] focus:border-[#8B5E3C] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'Toutes les catégories' : cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#8B5E3C] focus:border-[#8B5E3C] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="roi">ROI (décroissant)</option>
                <option value="profit">Marge bénéficiaire</option>
                <option value="price">Prix (croissant)</option>
              </select>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 font-medium">
            {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''} trouvé{filteredProducts.length > 1 ? 's' : ''}
          </div>
        </div>

        {/* Liste des produits */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {filteredProducts.map(product => (
              <div key={product.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 p-6 transform hover:-translate-y-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="px-3 py-1 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 rounded-full text-sm font-bold">
                    #{product.id}
                  </div>
                  <div className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium">
                    {product.category}
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{product.name}</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm line-clamp-2">{product.description}</p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {product.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Prix</div>
                    <div className="text-sm font-bold text-gray-900 dark:text-white">
                      {convertToFCFA(product.price)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      ({product.currency}{product.price})
                    </div>
                  </div>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Marge</div>
                    <div className="text-sm font-bold text-green-600 dark:text-green-400">
                      {product.profitMargin}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-brand-50 dark:bg-brand-900/20 rounded-lg">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">ROI</div>
                    <div className="text-sm font-bold text-brand dark:text-brand-400">
                      {product.roi}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Budget pub recommandé:</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {(() => {
                        const adSpendParts = product.adSpend.split('-')
                        if (adSpendParts.length > 1) {
                          return `${convertToFCFA(adSpendParts[0])} - ${convertToFCFA(adSpendParts[1])}`
                        }
                        return convertToFCFA(product.adSpend)
                      })()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-xl text-gray-600 dark:text-gray-400">Aucun produit ne correspond à vos critères de recherche.</p>
          </div>
        )}
      </div>
    </div>
  )
}



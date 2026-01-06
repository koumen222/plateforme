import { useState } from 'react'
import { winningProducts } from '../data/products'
import '../styles/products.css'

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
    <div className="products-page">
      <div className="products-header">
        <div className="products-header-content">
          <h1 className="products-title">
            🏆 50 Produits Gagnants
          </h1>
          <p className="products-subtitle">
            Découvrez notre sélection de 50 produits testés et performants sur Facebook Ads. 
            Ces produits ont généré des résultats exceptionnels avec la méthode Andromeda.
          </p>
        </div>
      </div>

      <div className="products-container">
        {/* Filtres et recherche */}
        <div className="products-filters">
          <div className="products-search">
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="products-search-input"
            />
          </div>
          <div className="products-filter-group">
            <label>Catégorie:</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="products-filter-select"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'Toutes les catégories' : cat}
                </option>
              ))}
            </select>
          </div>
          <div className="products-filter-group">
            <label>Trier par:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="products-filter-select"
            >
              <option value="roi">ROI (décroissant)</option>
              <option value="profit">Marge bénéficiaire</option>
              <option value="price">Prix (croissant)</option>
            </select>
          </div>
          <div className="products-count">
            {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''} trouvé{filteredProducts.length > 1 ? 's' : ''}
          </div>
        </div>

        {/* Liste des produits */}
        <div className="products-grid">
          {filteredProducts.map(product => (
            <div key={product.id} className="product-card">
              <div className="product-header">
                <div className="product-rank">#{product.id}</div>
                <div className="product-category">{product.category}</div>
              </div>
              <h3 className="product-name">{product.name}</h3>
              <p className="product-description">{product.description}</p>
              
              <div className="product-tags">
                {product.tags.map((tag, index) => (
                  <span key={index} className="product-tag">{tag}</span>
                ))}
              </div>

              <div className="product-stats">
                <div className="product-stat">
                  <div className="product-stat-label">Prix</div>
                  <div className="product-stat-value">
                    {product.currency}{product.price}
                  </div>
                </div>
                <div className="product-stat">
                  <div className="product-stat-label">Marge</div>
                  <div className="product-stat-value product-stat-profit">
                    {product.profitMargin}
                  </div>
                </div>
                <div className="product-stat">
                  <div className="product-stat-label">ROI</div>
                  <div className="product-stat-value product-stat-roi">
                    {product.roi}
                  </div>
                </div>
              </div>

              <div className="product-ad-spend">
                <span className="product-ad-spend-label">Budget pub recommandé:</span>
                <span className="product-ad-spend-value">
                  {product.currency}{product.adSpend}
                </span>
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="products-empty">
            <p>Aucun produit ne correspond à vos critères de recherche.</p>
          </div>
        )}
      </div>
    </div>
  )
}


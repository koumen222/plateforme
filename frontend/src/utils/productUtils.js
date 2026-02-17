/**
 * Utilitaires pour les produits
 */

// Taux de change approximatif USD vers FCFA (à ajuster si nécessaire)
const USD_TO_FCFA = 600; // 1 USD ≈ 600 FCFA

/**
 * Convertit un prix en USD vers FCFA
 * @param {string|number} price - Prix en USD
 * @returns {string} Prix en FCFA formaté
 */
export function convertToFCFA(price) {
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price
  if (isNaN(numericPrice)) return '0 FCFA'
  
  const priceInFCFA = Math.round(numericPrice * USD_TO_FCFA)
  return `${priceInFCFA.toLocaleString('fr-FR')} FCFA`
}

/**
 * Génère une URL d'image pour un produit basée sur son nom
 * Utilise Unsplash Source API (gratuite, pas besoin de clé API)
 * @param {string} productName - Nom du produit
 * @returns {string} URL de l'image
 */
export function getProductImageUrl(productName) {
  // Nettoyer le nom du produit pour la recherche
  const searchQuery = encodeURIComponent(productName)
  
  // Utiliser Unsplash Source API (gratuite, pas besoin de clé)
  // Format: https://source.unsplash.com/400x400/?[query]
  return `https://source.unsplash.com/400x400/?${searchQuery}`
}

/**
 * Alternative: Utiliser Pexels API (gratuite avec clé API)
 * Ou utiliser une image placeholder si l'API ne fonctionne pas
 */
export function getProductImageUrlWithFallback(productName, productId) {
  // Essayer d'abord avec Unsplash
  const unsplashUrl = getProductImageUrl(productName)
  
  // Si Unsplash ne fonctionne pas, utiliser un placeholder
  // Vous pouvez aussi utiliser une autre API d'images ici
  return unsplashUrl
}

/**
 * Génère une URL d'image depuis Google Images (via proxy ou API)
 * Note: Google Images nécessite une clé API, donc on utilise Unsplash par défaut
 */
export function getGoogleImageUrl(productName) {
  // Pour utiliser Google Custom Search API, il faudrait:
  // 1. Créer un projet Google Cloud
  // 2. Activer Custom Search API
  // 3. Créer un Custom Search Engine
  // 4. Utiliser la clé API
  // 
  // Pour l'instant, on utilise Unsplash qui est plus simple
  
  return getProductImageUrl(productName)
}


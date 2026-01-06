import { CONFIG } from '../config/config'

/**
 * Obtient l'URL complète d'une image pour l'affichage
 * @param {string} imagePath - Chemin de l'image (peut être relatif, absolu, ou URL complète)
 * @param {string} defaultImage - Image par défaut si imagePath est vide (défaut: '/img/fbads.svg')
 * @returns {string} URL complète de l'image
 */
export function getImageUrl(imagePath, defaultImage = '/img/fbads.svg') {
  // En production, logger seulement en mode développement
  const isDev = import.meta.env.DEV
  
  if (!imagePath) {
    if (isDev) console.log('🖼️ getImageUrl: Pas de chemin, utilisation image par défaut:', defaultImage)
    return defaultImage
  }
  
  // Si c'est déjà une URL complète (http/https), l'utiliser telle quelle
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    if (isDev) console.log('🖼️ getImageUrl: URL complète détectée:', imagePath)
    return imagePath
  }
  
  // Si c'est un chemin uploadé (/uploads/...), préfixer avec BACKEND_URL
  if (imagePath.startsWith('/uploads/')) {
    const fullUrl = `${CONFIG.BACKEND_URL}${imagePath}`
    if (isDev) console.log('🖼️ getImageUrl: Image uploadée:', imagePath, '→', fullUrl)
    return fullUrl
  }
  
  // Si c'est un chemin statique frontend (/img/, /assets/), utiliser tel quel
  if (imagePath.startsWith('/img/') || imagePath.startsWith('/assets/')) {
    if (isDev) console.log('🖼️ getImageUrl: Image statique frontend:', imagePath)
    return imagePath
  }
  
  // Sinon, préfixer avec BACKEND_URL
  const fullUrl = `${CONFIG.BACKEND_URL}${imagePath.startsWith('/') ? imagePath : '/' + imagePath}`
  if (isDev) console.log('🖼️ getImageUrl: Chemin relatif, préfixé:', imagePath, '→', fullUrl)
  return fullUrl
}


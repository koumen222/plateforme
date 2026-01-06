import { CONFIG } from '../config/config'

/**
 * Obtient l'URL complète d'une image pour l'affichage
 * @param {string} imagePath - Chemin de l'image (peut être relatif, absolu, ou URL complète)
 * @param {string} defaultImage - Image par défaut si imagePath est vide (défaut: '/img/fbads.svg')
 * @returns {string} URL complète de l'image
 */
export function getImageUrl(imagePath, defaultImage = '/img/fbads.svg') {
  if (!imagePath) {
    return defaultImage
  }
  
  // Si c'est déjà une URL complète (http/https), l'utiliser telle quelle
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }
  
  // Si c'est un chemin uploadé (/uploads/...), préfixer avec BACKEND_URL
  if (imagePath.startsWith('/uploads/')) {
    return `${CONFIG.BACKEND_URL}${imagePath}`
  }
  
  // Si c'est un chemin statique frontend (/img/, /assets/), utiliser tel quel
  if (imagePath.startsWith('/img/') || imagePath.startsWith('/assets/')) {
    return imagePath
  }
  
  // Sinon, préfixer avec BACKEND_URL
  return `${CONFIG.BACKEND_URL}${imagePath.startsWith('/') ? imagePath : '/' + imagePath}`
}


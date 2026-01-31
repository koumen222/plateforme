import { logger } from '../utils/logger'

// Détection automatique de l'URL du backend
const getBackendUrl = () => {
  // Fonction pour nettoyer l'URL (supprimer le slash final et les espaces)
  const cleanUrl = (url) => {
    if (!url) return url
    return url.toString().trim().replace(/\/+$/, '')
  }
  
  // Détection du mode développement : vérifier si on est sur localhost
  const isLocalhost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || 
     window.location.hostname === '127.0.0.1' ||
     window.location.hostname === '')
  
  // En mode développement (localhost), TOUJOURS utiliser le backend local
  if (import.meta.env.DEV || import.meta.env.MODE === 'development' || isLocalhost) {
    // Utiliser 127.0.0.1 pour éviter les conflits IPv6 (::1) sur localhost
    const localBackendUrl = 'http://127.0.0.1:3000'
    logger.log('🌐 MODE DÉVELOPPEMENT - BACKEND_URL local:', localBackendUrl)
    return cleanUrl(localBackendUrl)
  }
  
  // En production, utiliser VITE_API_BASE_URL depuis .env ou URL Railway par défaut
  if (import.meta.env.VITE_API_BASE_URL) {
    const backendUrl = cleanUrl(import.meta.env.VITE_API_BASE_URL)
    logger.log('🌐 MODE PRODUCTION - BACKEND_URL depuis VITE_API_BASE_URL:', backendUrl)
    return backendUrl
  }
  
  // Fallback : utiliser l'URL Railway en production si VITE_API_BASE_URL n'est pas défini
  const railwayBackendUrl = 'https://plateforme-backend-production-2ec6.up.railway.app'
  logger.warn('⚠️ VITE_API_BASE_URL n\'est pas défini, utilisation de l\'URL Railway par défaut:', railwayBackendUrl)
  return cleanUrl(railwayBackendUrl)
}

export const CONFIG = {
  BACKEND_URL: getBackendUrl(),
  MORGAN_PHONE: '237676778377', // Numéro WhatsApp de Morgan (sans + pour l'URL WhatsApp)
  WHATSAPP_MESSAGE: "Bonjour Morgan, je souhaite réactiver mon compte pour débloquer toutes les formations et ressources premium. Merci de m'indiquer la procédure et les modalités de paiement. Je suis prêt(e) à finaliser rapidement.",
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || '1001981040159-an283jv5dfi5c94g0dkj5agdujn3rs34.apps.googleusercontent.com',
  SUBSCRIPTION_MONTHLY: 5000, // Abonnement mensuel en FCFA
  SUBSCRIPTION_YEARLY: 25000 // Abonnement annuel en FCFA
};

import { logger } from '../utils/logger'

// Détection automatique de l'URL du backend
const getBackendUrl = () => {
  // En mode développement (localhost), utiliser le backend local
  if (import.meta.env.DEV || import.meta.env.MODE === 'development') {
    const localBackendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
    logger.log('🌐 MODE DÉVELOPPEMENT - BACKEND_URL local:', localBackendUrl)
    return localBackendUrl
  }
  
  // En production, utiliser VITE_API_BASE_URL depuis .env
  if (import.meta.env.VITE_API_BASE_URL) {
    logger.log('🌐 MODE PRODUCTION - BACKEND_URL depuis VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL)
    return import.meta.env.VITE_API_BASE_URL
  }
  
  // Fallback : essayer de détecter automatiquement
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    const localBackendUrl = 'http://localhost:3000'
    logger.log('🌐 Détection automatique - BACKEND_URL local:', localBackendUrl)
    return localBackendUrl
  }
  
  // ⚠️ ERREUR : VITE_API_BASE_URL n'est pas défini en production
  logger.error('❌ VITE_API_BASE_URL n\'est pas défini dans .env')
  logger.error('⚠️  Créez un fichier .env dans frontend/ avec VITE_API_BASE_URL')
  throw new Error('VITE_API_BASE_URL n\'est pas défini. Créez un fichier .env avec VITE_API_BASE_URL.')
}

export const CONFIG = {
  BACKEND_URL: getBackendUrl(),
  MORGAN_PHONE: '237676778377', // Numéro WhatsApp de Morgan (sans + pour l'URL WhatsApp)
  WHATSAPP_MESSAGE: 'Je veux payer pour avoir mon activation',
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || '1001981040159-an283jv5dfi5c94g0dkj5agdujn3rs34.apps.googleusercontent.com',
  SUBSCRIPTION_MONTHLY: 5000, // Abonnement mensuel en FCFA
  SUBSCRIPTION_YEARLY: 25000 // Abonnement annuel en FCFA
};

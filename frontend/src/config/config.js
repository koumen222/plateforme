import { logger } from '../utils/logger'

// Détection automatique de l'URL du backend
const getBackendUrl = () => {
  // VITE_API_BASE_URL doit être défini dans le fichier .env
  if (import.meta.env.VITE_API_BASE_URL) {
    logger.log('🌐 BACKEND_URL depuis VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL)
    return import.meta.env.VITE_API_BASE_URL
  }
  
  // ⚠️ ERREUR : VITE_API_BASE_URL n'est pas défini
  // Créez un fichier .env dans frontend/ avec :
  // VITE_API_BASE_URL=https://votre-backend-url.com
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

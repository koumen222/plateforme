import { logger } from '../utils/logger'

// Détection automatique de l'URL du backend
const getBackendUrl = () => {
  // Si VITE_API_BASE_URL est défini, l'utiliser (priorité)
  if (import.meta.env.VITE_API_BASE_URL) {
    logger.log('🌐 BACKEND_URL depuis VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL)
    return import.meta.env.VITE_API_BASE_URL
  }
  
  // URL par défaut : serveur AWS
  const apiUrl = 'http://13.60.216.44'
  logger.log('🌐 BACKEND_URL:', apiUrl)
  return apiUrl
}

export const CONFIG = {
  BACKEND_URL: getBackendUrl(),
  MORGAN_PHONE: '237676778377', // Numéro WhatsApp de Morgan (sans + pour l'URL WhatsApp)
  WHATSAPP_MESSAGE: 'Je veux payer pour avoir mon activation',
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || '1001981040159-an283jv5dfi5c94g0dkj5agdujn3rs34.apps.googleusercontent.com',
  SUBSCRIPTION_MONTHLY: 5000, // Abonnement mensuel en FCFA
  SUBSCRIPTION_YEARLY: 25000 // Abonnement annuel en FCFA
};

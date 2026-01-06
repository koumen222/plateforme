// Détection automatique de l'URL du backend
const getBackendUrl = () => {
  // Si VITE_BACKEND_URL est défini, l'utiliser
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL
  }
  
  // En développement local (mode dev de Vite), utiliser localhost
  if (import.meta.env.DEV) {
    return 'http://localhost:3000'
  }
  
  // Sinon, utiliser l'URL de production par défaut
  return 'http://localhost:3000'
}

export const CONFIG = {
  BACKEND_URL: getBackendUrl(),
  MORGAN_PHONE: '237676778377', // Numéro WhatsApp de Morgan (sans + pour l'URL WhatsApp)
  WHATSAPP_MESSAGE: 'Je veux payer pour avoir mon activation',
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || '1001981040159-an283jv5dfi5c94g0dkj5agdujn3rs34.apps.googleusercontent.com'
};

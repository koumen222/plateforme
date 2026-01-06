// Détection automatique de l'URL du backend
const getBackendUrl = () => {
  // Si VITE_BACKEND_URL est défini, l'utiliser (priorité)
  if (import.meta.env.VITE_BACKEND_URL) {
    console.log('🌐 BACKEND_URL depuis VITE_BACKEND_URL:', import.meta.env.VITE_BACKEND_URL)
    return import.meta.env.VITE_BACKEND_URL
  }
  
  // En développement local (mode dev de Vite), utiliser localhost
  if (import.meta.env.DEV) {
    console.log('🌐 BACKEND_URL mode DEV: http://localhost:3000')
    return 'http://localhost:3000'
  }
  
  // En production, utiliser l'URL de production par défaut
  const prodUrl = 'https://plateforme-r1h7.onrender.com'
  console.log('🌐 BACKEND_URL mode PROD:', prodUrl)
  return prodUrl
}

export const CONFIG = {
  BACKEND_URL: getBackendUrl(),
  MORGAN_PHONE: '237676778377', // Numéro WhatsApp de Morgan (sans + pour l'URL WhatsApp)
  WHATSAPP_MESSAGE: 'Je veux payer pour avoir mon activation',
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || '1001981040159-an283jv5dfi5c94g0dkj5agdujn3rs34.apps.googleusercontent.com',
  FORMATION_AMOUNT: 5000 // Montant de la formation en FCFA
};

import axios from "axios";

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
    return cleanUrl('http://localhost:3000')
  }
  
  // En production, utiliser VITE_API_BASE_URL depuis .env
  if (import.meta.env.VITE_API_BASE_URL) {
    return cleanUrl(import.meta.env.VITE_API_BASE_URL)
  }
  
  // ⚠️ ERREUR : VITE_API_BASE_URL n'est pas défini en production
  throw new Error('VITE_API_BASE_URL n\'est pas défini. Créez un fichier .env avec VITE_API_BASE_URL.')
}

// ⚠️ IMPORTANT : 
// - En développement local : utilise automatiquement http://localhost:3000
// - En production : utilise VITE_API_BASE_URL depuis .env
// Si votre frontend est en HTTPS, vous DEVEZ utiliser HTTPS pour le backend
// Sinon vous aurez une erreur "Mixed Content"
// Configurez SSL sur votre serveur AWS (voir backend/SSL_SETUP_GUIDE.md)
// Exemple: VITE_API_BASE_URL=https://api.safitech.shop

export const api = axios.create({
  baseURL: getBackendUrl()
});


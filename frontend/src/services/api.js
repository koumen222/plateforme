import axios from "axios";

// Détection automatique de l'URL du backend
const getBackendUrl = () => {
  // En mode développement (localhost), utiliser le backend local
  if (import.meta.env.DEV || import.meta.env.MODE === 'development') {
    return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
  }
  
  // En production, utiliser VITE_API_BASE_URL depuis .env
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL
  }
  
  // Fallback : essayer de détecter automatiquement
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:3000'
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


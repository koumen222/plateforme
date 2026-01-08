import axios from "axios";

// ⚠️ IMPORTANT : Définissez VITE_API_BASE_URL dans votre fichier .env
// Si votre frontend est en HTTPS, vous DEVEZ utiliser HTTPS pour le backend
// Sinon vous aurez une erreur "Mixed Content"
// Configurez SSL sur votre serveur AWS (voir backend/SSL_SETUP_GUIDE.md)
// Exemple: VITE_API_BASE_URL=https://api.safitech.shop

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL
});


/**
 * Configuration de l'application
 */
export const CONFIG = {
    BACKEND_URL: (() => {
        // Variable d'environnement (priorité)
        if (import.meta.env.VITE_BACKEND_URL) {
            return import.meta.env.VITE_BACKEND_URL
        }
        // Configuration globale depuis window
        if (typeof window !== 'undefined' && window.CONFIG_BACKEND_URL) {
            return window.CONFIG_BACKEND_URL
        }
        // Mode développement : utiliser localhost:3000
        if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
            return 'http://localhost:3000'
        }
        // Production : URL relative (même domaine)
        return ''
    })()
};


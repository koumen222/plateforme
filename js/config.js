/**
 * Configuration de l'application
 * Modifiez BACKEND_URL selon votre environnement d'hébergement
 */

const CONFIG = {
    // URL du backend API
    // Pour développement local : 'http://localhost:3000'
    // Pour production : remplacez par l'URL de votre backend (ex: 'https://api.votre-domaine.com')
    BACKEND_URL: (function() {
        // Si CONFIG_BACKEND_URL est défini globalement (depuis HTML), l'utiliser
        if (typeof window !== 'undefined' && window.CONFIG_BACKEND_URL) {
            return window.CONFIG_BACKEND_URL;
        }
        // Mode développement (fichiers locaux)
        if (typeof window !== 'undefined' && window.location.origin === 'file://') {
            return 'http://localhost:3000';
        }
        // Mode production : URL relative par défaut (même domaine)
        // Si le backend est sur un autre domaine, définissez window.CONFIG_BACKEND_URL dans votre HTML
        return '';
    })()
};

// Pour définir une URL backend personnalisée depuis le HTML, ajoutez avant config.js :
// <script>window.CONFIG_BACKEND_URL = 'https://votre-backend-url.com';</script>

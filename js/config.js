/**
 * Configuration de l'application
 * Modifiez BACKEND_URL selon votre environnement d'hébergement
 */

const CONFIG = {
    // URL du backend API
    // URL par défaut : serveur AWS
    BACKEND_URL: (function() {
        // Si CONFIG_BACKEND_URL est défini globalement (depuis HTML), l'utiliser
        if (typeof window !== 'undefined' && window.CONFIG_BACKEND_URL) {
            return window.CONFIG_BACKEND_URL;
        }
        // URL par défaut : serveur AWS
        return 'http://13.60.216.44';
    })()
};

// Pour définir une URL backend personnalisée depuis le HTML, ajoutez avant config.js :
// <script>window.CONFIG_BACKEND_URL = 'https://votre-backend-url.com';</script>

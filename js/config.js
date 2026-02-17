/**
 * Configuration de l'application
 * Modifiez BACKEND_URL selon votre environnement d'hébergement
 */

const CONFIG = {
    // URL du backend API
    // ⚠️ OBLIGATOIRE : Définissez window.CONFIG_BACKEND_URL dans votre HTML
    BACKEND_URL: (function() {
        // Si CONFIG_BACKEND_URL est défini globalement (depuis HTML), l'utiliser
        if (typeof window !== 'undefined' && window.CONFIG_BACKEND_URL) {
            return window.CONFIG_BACKEND_URL;
        }
        // ⚠️ ERREUR : CONFIG_BACKEND_URL n'est pas défini
        console.error('❌ CONFIG_BACKEND_URL n\'est pas défini. Définissez window.CONFIG_BACKEND_URL dans votre HTML.');
        throw new Error('CONFIG_BACKEND_URL n\'est pas défini. Définissez window.CONFIG_BACKEND_URL dans votre HTML.');
    })()
};

// Pour définir une URL backend personnalisée depuis le HTML, ajoutez avant config.js :
// <script>window.CONFIG_BACKEND_URL = 'https://votre-backend-url.com';</script>

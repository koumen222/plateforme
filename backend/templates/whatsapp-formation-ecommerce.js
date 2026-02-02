/**
 * Modèle d'envoi WhatsApp - Formation E-commerce Gratuite
 * 
 * Ce modèle peut être utilisé pour créer une campagne WhatsApp
 * via l'API ou l'interface admin.
 * 
 * Usage:
 * 1. Via l'interface admin: Créer une nouvelle campagne avec ce message
 * 2. Via API: POST /api/whatsapp-campaigns avec ce template
 */

const FORMATION_ECOMMERCE_TEMPLATE = {
  name: "Formation E-commerce Gratuite 2026",
  
  // Message principal (sera envoyé à tous les contacts)
  message: `🎁 Formation GRATUITE : Se lancer en e-commerce en Afrique (2026)

Salut [PRENOM],

Tu veux te lancer dans l'e-commerce en Afrique en 2026, mais tu ne sais pas par où commencer ?

Bonne nouvelle : une formation 100% gratuite est disponible dès maintenant.

✅ Comprendre les bases pour démarrer correctement
✅ Éviter les erreurs classiques quand on débute
✅ Passer à l'action avec une méthode claire

👉 Accès direct à la formation gratuite :
https://www.safitech.shop/course/se-lancer-en-e-commerce-en-afrique-en-2026---formation-gratuite/lesson/6968e00944195fcebab7847b

Si tu connais quelqu'un que ça peut aider, transfère-lui ce message 🙌

À bientôt,
Kounen Morgan`,

  // Variantes optionnelles (pour A/B testing ou rotation)
  variants: [],
  
  // Configuration des destinataires
  recipients: {
    type: "all", // 'all', 'segment', ou 'list'
    // type: "segment", segment: "active" // pour envoyer uniquement aux utilisateurs actifs
    // type: "list", customPhones: ["237XXXXXXXXX", "221XXXXXXXXX"] // pour une liste personnalisée
  },
  
  // Paramètres d'envoi
  fromPhone: process.env.WHATSAPP_FROM_PHONE || "",
  
  // Planification (optionnel - si null, la campagne est créée en brouillon)
  scheduledAt: null, // new Date("2026-02-05T10:00:00Z") pour planifier
  
  // Statut initial
  status: "draft" // 'draft', 'scheduled', 'sending', 'sent'
};

/**
 * Fonction utilitaire pour créer la campagne via l'API
 * @param {string} apiBaseUrl - URL de base de l'API (ex: https://api.safitech.shop)
 * @param {string} authToken - Token d'authentification JWT
 * @param {Object} customRecipients - Configuration personnalisée des destinataires (optionnel)
 * @returns {Promise<Object>} - La campagne créée
 */
async function createFormationEcommerceCampaign(apiBaseUrl, authToken, customRecipients = null) {
  const campaignData = {
    ...FORMATION_ECOMMERCE_TEMPLATE,
    recipients: customRecipients || FORMATION_ECOMMERCE_TEMPLATE.recipients
  };
  
  try {
    const response = await fetch(`${apiBaseUrl}/api/whatsapp-campaigns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(campaignData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la création de la campagne');
    }
    
    const result = await response.json();
    console.log('✅ Campagne créée avec succès:', result.campaign._id);
    return result.campaign;
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    throw error;
  }
}

/**
 * Fonction utilitaire pour envoyer immédiatement la campagne
 * @param {string} apiBaseUrl - URL de base de l'API
 * @param {string} authToken - Token d'authentification JWT
 * @param {string} campaignId - ID de la campagne
 * @returns {Promise<Object>} - Résultat de l'envoi
 */
async function sendFormationEcommerceCampaign(apiBaseUrl, authToken, campaignId) {
  try {
    const response = await fetch(`${apiBaseUrl}/api/whatsapp-campaigns/${campaignId}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de l\'envoi de la campagne');
    }
    
    const result = await response.json();
    console.log('✅ Campagne envoyée:', result.stats);
    return result;
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    throw error;
  }
}

/**
 * Exemple d'utilisation complète
 */
async function exampleUsage() {
  // Configuration
  const API_URL = process.env.API_URL || 'https://api.safitech.shop';
  const AUTH_TOKEN = process.env.ADMIN_TOKEN; // Récupérer le token JWT admin
  
  // 1. Créer la campagne
  const campaign = await createFormationEcommerceCampaign(API_URL, AUTH_TOKEN);
  
  // 2. Envoyer immédiatement (ou attendre la planification)
  // await sendFormationEcommerceCampaign(API_URL, AUTH_TOKEN, campaign._id);
  
  console.log('ID de la campagne:', campaign._id);
  console.log('Message prévisualisé:');
  console.log(FORMATION_ECOMMERCE_TEMPLATE.message);
}

// Export pour utilisation dans d'autres modules
export {
  FORMATION_ECOMMERCE_TEMPLATE,
  createFormationEcommerceCampaign,
  sendFormationEcommerceCampaign
};

// Export par défaut
export default FORMATION_ECOMMERCE_TEMPLATE;

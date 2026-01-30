import fetch from 'node-fetch';

const MONETBIL_API_URL = 'https://api.monetbil.com/payment/v1';
const MONETBIL_SERVICE_KEY = process.env.MONETBIL_SERVICE_KEY;

/**
 * Initie un paiement via Monetbil
 * @param {Object} params - Paramètres du paiement
 * @param {string} params.phoneNumber - Numéro de téléphone du client
 * @param {number} params.amount - Montant à payer
 * @param {string} params.currency - Devise (XAF par défaut)
 * @param {string} params.operator - Opérateur mobile (optionnel)
 * @param {string} params.itemRef - Référence de l'article (optionnel)
 * @param {string} params.paymentRef - Référence du paiement (optionnel)
 * @param {string} params.user - Identifiant utilisateur (optionnel)
 * @param {string} params.firstName - Prénom (optionnel)
 * @param {string} params.lastName - Nom (optionnel)
 * @param {string} params.email - Email (optionnel)
 * @param {string} params.country - Code pays (CM par défaut)
 * @param {string} params.notifyUrl - URL de notification (optionnel)
 * @returns {Promise<Object>} Réponse de l'API Monetbil
 */
export async function initiatePayment(params) {
  if (!MONETBIL_SERVICE_KEY) {
    throw new Error('MONETBIL_SERVICE_KEY non configurée dans les variables d\'environnement');
  }

  const {
    phoneNumber,
    amount,
    currency = 'XAF',
    operator = null,
    itemRef = null,
    paymentRef = null,
    user = null,
    firstName = null,
    lastName = null,
    email = null,
    country = 'CM',
    notifyUrl = null
  } = params;

  if (!phoneNumber || !amount) {
    throw new Error('phoneNumber et amount sont requis');
  }

  const payload = {
    service: MONETBIL_SERVICE_KEY,
    phonenumber: phoneNumber,
    amount: amount,
    currency: currency,
    country: country
  };

  if (operator) payload.operator = operator;
  if (itemRef) payload.item_ref = itemRef;
  if (paymentRef) payload.payment_ref = paymentRef;
  if (user) payload.user = user;
  if (firstName) payload.first_name = firstName;
  if (lastName) payload.last_name = lastName;
  if (email) payload.email = email;
  if (notifyUrl) payload.notify_url = notifyUrl;

  try {
    const response = await fetch(`${MONETBIL_API_URL}/placePayment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors de l\'initiation du paiement');
    }

    return data;
  } catch (error) {
    console.error('Erreur initiation paiement Monetbil:', error);
    throw error;
  }
}

/**
 * Vérifie le statut d'un paiement
 * @param {string} paymentId - ID du paiement retourné par initiatePayment
 * @returns {Promise<Object>} Statut du paiement
 */
export async function checkPaymentStatus(paymentId) {
  if (!paymentId) {
    throw new Error('paymentId est requis');
  }

  try {
    const response = await fetch(`${MONETBIL_API_URL}/checkPayment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({ paymentId }).toString()
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors de la vérification du paiement');
    }

    return data;
  } catch (error) {
    console.error('Erreur vérification paiement Monetbil:', error);
    throw error;
  }
}

/**
 * Convertit le statut Monetbil en statut interne
 * @param {number} monetbilStatus - Statut retourné par Monetbil (1 = success, 0 = failed, -1 = cancelled)
 * @returns {string} Statut interne ('success', 'failed', 'cancelled', 'pending')
 */
export function mapMonetbilStatus(monetbilStatus) {
  if (monetbilStatus === 1) return 'success';
  if (monetbilStatus === 0) return 'failed';
  if (monetbilStatus === -1) return 'cancelled';
  return 'pending';
}

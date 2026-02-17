/**
 * Utilitaires pour gérer les notifications push web
 * 
 * Ce fichier contient toutes les fonctions nécessaires pour :
 * - Vérifier le support des notifications push
 * - Demander la permission
 * - S'abonner aux notifications
 * - Se désabonner
 * - Gérer les abonnements
 * 
 * Fichier : src/utils/pushNotifications.js
 */

import { CONFIG } from '../config/config';

/**
 * Récupère le token d'authentification depuis localStorage
 * 
 * @returns {string|null} Token JWT ou null
 */
function getAuthToken() {
  return localStorage.getItem('token') || null;
}

// ============================================
// 1. VÉRIFICATION DU SUPPORT
// ============================================

/**
 * Vérifie si les notifications push sont supportées par le navigateur
 * 
 * @returns {boolean} true si supporté, false sinon
 */
export function isPushSupported() {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Vérifie si les notifications sont déjà autorisées
 * 
 * @returns {Promise<string>} 'granted', 'denied', ou 'default'
 */
export async function getNotificationPermission() {
  if (!('Notification' in window)) {
    return 'not-supported';
  }
  return Notification.permission;
}

/**
 * Vérifie si le Service Worker est enregistré et actif
 * 
 * @returns {Promise<boolean>} true si actif, false sinon
 */
export async function isServiceWorkerReady() {
  if (!('serviceWorker' in navigator)) {
    return false;
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    return !!registration;
  } catch (error) {
    console.error('Erreur lors de la vérification du Service Worker:', error);
    return false;
  }
}

// ============================================
// 2. ENREGISTREMENT DU SERVICE WORKER
// ============================================

/**
 * Enregistre le Service Worker
 * 
 * @returns {Promise<ServiceWorkerRegistration>} Registration du Service Worker
 */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Les Service Workers ne sont pas supportés par ce navigateur');
  }
  
  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });
    
    console.log('✅ Service Worker enregistré:', registration.scope);
    
    // Écouter les mises à jour du Service Worker
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('🔄 Nouveau Service Worker disponible');
            // Vous pouvez afficher une notification à l'utilisateur ici
          }
        });
      }
    });
    
    return registration;
  } catch (error) {
    console.error('❌ Erreur lors de l\'enregistrement du Service Worker:', error);
    throw error;
  }
}

// ============================================
// 3. CONVERSION DES CLÉS VAPID
// ============================================

/**
 * Convertit une clé publique VAPID (base64url) en Uint8Array
 * Nécessaire pour subscribe() de PushManager
 * 
 * @param {string} base64String - Clé publique VAPID en base64url
 * @returns {Uint8Array} Clé convertie en Uint8Array
 */
export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Convertit un ArrayBuffer en base64url
 * Pour envoyer les clés p256dh et auth au backend
 * 
 * @param {ArrayBuffer} buffer - Buffer à convertir
 * @returns {string} Chaîne base64url
 */
export function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// ============================================
// 4. RÉCUPÉRATION DE LA CLÉ PUBLIQUE VAPID
// ============================================

/**
 * Récupère la clé publique VAPID depuis le backend
 * 
 * @returns {Promise<string>} Clé publique VAPID
 */
export async function getVapidPublicKey() {
  try {
    const response = await fetch(`${CONFIG.BACKEND_URL}/api/push/public-key`);
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    return data.publicKey;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération de la clé publique:', error);
    throw error;
  }
}

// ============================================
// 5. DEMANDE DE PERMISSION
// ============================================

/**
 * Demande la permission pour afficher des notifications
 * 
 * @returns {Promise<string>} 'granted', 'denied', ou 'default'
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    throw new Error('Les notifications ne sont pas supportées par ce navigateur');
  }
  
  const permission = await Notification.requestPermission();
  
  if (permission === 'granted') {
    console.log('✅ Permission accordée pour les notifications');
  } else if (permission === 'denied') {
    console.warn('⚠️ Permission refusée pour les notifications');
  } else {
    console.log('ℹ️ Permission non définie pour les notifications');
  }
  
  return permission;
}

// ============================================
// 6. ABONNEMENT AUX NOTIFICATIONS
// ============================================

/**
 * S'abonne aux notifications push
 * 
 * @param {Object} options - Options d'abonnement
 * @param {string} [options.deviceInfo] - Information sur l'appareil (optionnel)
 * @returns {Promise<Object>} Résultat de l'abonnement
 */
export async function subscribeToPushNotifications(options = {}) {
  try {
    // 1. Vérifier le support
    if (!isPushSupported()) {
      throw new Error('Les notifications push ne sont pas supportées par ce navigateur');
    }
    
    // 2. Vérifier/Enregistrer le Service Worker
    let registration = await navigator.serviceWorker.ready;
    if (!registration) {
      registration = await registerServiceWorker();
    }
    
    // 3. Demander la permission si nécessaire
    let permission = await getNotificationPermission();
    if (permission === 'default') {
      permission = await requestNotificationPermission();
    }
    
    if (permission !== 'granted') {
      throw new Error('Permission refusée pour les notifications');
    }
    
    // 4. Récupérer la clé publique VAPID
    const publicKey = await getVapidPublicKey();
    
    // 5. S'abonner au PushManager
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true, // Toujours afficher les notifications
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });
    
    console.log('✅ Abonnement push créé:', subscription.endpoint.substring(0, 50) + '...');
    
    // 6. Envoyer l'abonnement au backend
    const subscriptionData = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
        auth: arrayBufferToBase64(subscription.getKey('auth'))
      },
      deviceInfo: options.deviceInfo || getDeviceInfo(),
      userAgent: navigator.userAgent
    };
    
    const token = getAuthToken();
    const headers = {
      'Content-Type': 'application/json'
    };

    // Ajouter le token dans le header Authorization si disponible
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${CONFIG.BACKEND_URL}/api/push/subscribe`, {
      method: 'POST',
      credentials: 'include', // Inclure les cookies (pour l'authentification)
      headers,
      body: JSON.stringify(subscriptionData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || 'Erreur lors de l\'abonnement');
    }
    
    const result = await response.json();
    console.log('✅ Abonnement enregistré sur le backend:', result);
    
    return {
      success: true,
      subscription: result.subscription,
      pushSubscription: subscription
    };
  } catch (error) {
    console.error('❌ Erreur lors de l\'abonnement:', error);
    throw error;
  }
}

// ============================================
// 7. DÉSABONNEMENT
// ============================================

/**
 * Se désabonner des notifications push
 * 
 * @param {PushSubscription} [subscription] - Abonnement à désactiver (optionnel)
 * @returns {Promise<Object>} Résultat du désabonnement
 */
export async function unsubscribeFromPushNotifications(subscription = null) {
  try {
    // 1. Récupérer l'abonnement actuel si non fourni
    if (!subscription) {
      const registration = await navigator.serviceWorker.ready;
      subscription = await registration.pushManager.getSubscription();
    }
    
    if (!subscription) {
      throw new Error('Aucun abonnement trouvé');
    }
    
    // 2. Se désabonner du navigateur
    await subscription.unsubscribe();
    console.log('✅ Désabonnement du navigateur réussi');
    
    // 3. Notifier le backend
    try {
      const token = getAuthToken();
      const headers = {
        'Content-Type': 'application/json'
      };

      // Ajouter le token dans le header Authorization si disponible
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${CONFIG.BACKEND_URL}/api/push/unsubscribe`, {
        method: 'DELETE',
        credentials: 'include',
        headers,
        body: JSON.stringify({
          endpoint: subscription.endpoint
        })
      });
      
      if (!response.ok) {
        console.warn('⚠️ Erreur lors de la suppression sur le backend:', await response.json());
      } else {
        console.log('✅ Abonnement supprimé du backend');
      }
    } catch (error) {
      console.warn('⚠️ Erreur lors de la notification au backend:', error);
      // Ne pas faire échouer le désabonnement si le backend échoue
    }
    
    return {
      success: true,
      message: 'Désabonnement réussi'
    };
  } catch (error) {
    console.error('❌ Erreur lors du désabonnement:', error);
    throw error;
  }
}

// ============================================
// 8. VÉRIFICATION DE L'ABONNEMENT
// ============================================

/**
 * Vérifie si l'utilisateur est actuellement abonné
 * 
 * @returns {Promise<PushSubscription|null>} Abonnement actuel ou null
 */
export async function getCurrentSubscription() {
  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.error('❌ Erreur lors de la vérification de l\'abonnement:', error);
    return null;
  }
}

/**
 * Récupère tous les abonnements de l'utilisateur depuis le backend
 * 
 * @returns {Promise<Array>} Liste des abonnements
 */
export async function getUserSubscriptions() {
  try {
    const token = getAuthToken();
    const headers = {
      'Content-Type': 'application/json'
    };

    // Ajouter le token dans le header Authorization si disponible
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${CONFIG.BACKEND_URL}/api/push/subscriptions`, {
      credentials: 'include', // Inclure les cookies (pour l'authentification)
      headers
    });
    
    if (!response.ok) {
      // Gérer spécifiquement les erreurs d'authentification
      if (response.status === 401) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Non authentifié: ${errorData.message || 'Token manquant ou invalide'}`);
      }
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    return data.subscriptions || [];
  } catch (error) {
    // Ne logger que si ce n'est pas une erreur d'authentification attendue
    if (!error.message.includes('Non authentifié')) {
      console.error('❌ Erreur lors de la récupération des abonnements:', error);
    }
    throw error;
  }
}

// ============================================
// 9. FONCTIONS UTILITAIRES
// ============================================

/**
 * Obtient des informations sur l'appareil/navigateur
 * 
 * @returns {string} Description de l'appareil
 */
export function getDeviceInfo() {
  const ua = navigator.userAgent;
  const platform = navigator.platform || 'Unknown';
  
  // Détecter le navigateur
  let browser = 'Unknown';
  if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';
  else if (ua.includes('Opera')) browser = 'Opera';
  
  // Détecter l'OS
  let os = 'Unknown';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  
  return `${browser} on ${os}`;
}

/**
 * Vérifie si l'utilisateur est sur mobile
 * 
 * @returns {boolean} true si mobile, false sinon
 */
export function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

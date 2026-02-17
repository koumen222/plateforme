import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  isPushSupported,
  getNotificationPermission,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  getCurrentSubscription,
  getUserSubscriptions,
  registerServiceWorker,
  isServiceWorkerReady
} from '../utils/pushNotifications';

/**
 * Hook React pour gérer les notifications push
 * 
 * @returns {Object} État et fonctions pour gérer les notifications push
 * 
 * @example
 * const {
 *   isSupported,
 *   permission,
 *   isSubscribed,
 *   isLoading,
 *   subscriptions,
 *   subscribe,
 *   unsubscribe,
 *   refreshSubscriptions
 * } = usePushNotifications();
 */
export function usePushNotifications() {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState([]);
  const [error, setError] = useState(null);
  const [serviceWorkerReady, setServiceWorkerReady] = useState(false);

  // Vérifier le support et l'état initial
  useEffect(() => {
    // Ne rien faire si l'authentification est encore en cours de chargement
    if (authLoading) {
      return;
    }

    const checkSupport = async () => {
      try {
        // Vérifier le support
        const supported = isPushSupported();
        setIsSupported(supported);

        if (!supported) {
          setIsLoading(false);
          return;
        }

        // Vérifier la permission
        const currentPermission = await getNotificationPermission();
        setPermission(currentPermission);

        // Vérifier le Service Worker
        const swReady = await isServiceWorkerReady();
        
        if (!swReady) {
          // Essayer d'enregistrer le Service Worker
          try {
            await registerServiceWorker();
            setServiceWorkerReady(true);
          } catch (error) {
            console.warn('⚠️ Service Worker non disponible:', error);
            setServiceWorkerReady(false);
          }
        } else {
          setServiceWorkerReady(true);
        }

        // Vérifier l'abonnement actuel
        const currentSubscription = await getCurrentSubscription();
        setIsSubscribed(!!currentSubscription);

        // Charger les abonnements depuis le backend UNIQUEMENT si authentifié et actif
        if (isAuthenticated && user?.status === 'active' && currentPermission === 'granted') {
          try {
            const userSubscriptions = await getUserSubscriptions();
            setSubscriptions(userSubscriptions);
          } catch (error) {
            // Ne pas afficher d'erreur si c'est juste une erreur d'authentification
            if (!error.message.includes('401') && !error.message.includes('Unauthorized') && !error.message.includes('Non authentifié')) {
              console.warn('⚠️ Impossible de charger les abonnements:', error.message);
            }
          }
        } else {
          // Si non authentifié ou non actif, ne pas charger les abonnements
          setSubscriptions([]);
        }
      } catch (error) {
        console.error('❌ Erreur lors de la vérification du support:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    checkSupport();
  }, [isAuthenticated, user, authLoading]);

  /**
   * S'abonner aux notifications push
   * 
   * @param {Object} options - Options d'abonnement
   * @returns {Promise<void>}
   */
  const subscribe = useCallback(async (options = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await subscribeToPushNotifications(options);
      setIsSubscribed(true);
      
      // Rafraîchir la liste des abonnements
      const userSubscriptions = await getUserSubscriptions();
      setSubscriptions(userSubscriptions);
      
      return result;
    } catch (error) {
      console.error('Erreur lors de l\'abonnement:', error);
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Se désabonner des notifications push
   * 
   * @returns {Promise<void>}
   */
  const unsubscribe = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await unsubscribeFromPushNotifications();
      setIsSubscribed(false);
      
      // Rafraîchir la liste des abonnements
      const userSubscriptions = await getUserSubscriptions();
      setSubscriptions(userSubscriptions);
    } catch (error) {
      console.error('Erreur lors du désabonnement:', error);
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Rafraîchir la liste des abonnements depuis le backend
   * 
   * @returns {Promise<void>}
   */
  const refreshSubscriptions = useCallback(async () => {
    try {
      const userSubscriptions = await getUserSubscriptions();
      setSubscriptions(userSubscriptions);
      
      // Vérifier l'abonnement actuel
      const currentSubscription = await getCurrentSubscription();
      setIsSubscribed(!!currentSubscription);
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error);
      setError(error.message);
    }
  }, []);

  /**
   * Demander la permission pour les notifications
   * 
   * @returns {Promise<string>} 'granted', 'denied', ou 'default'
   */
  const requestPermission = useCallback(async () => {
    try {
      const { requestNotificationPermission } = await import('../utils/pushNotifications');
      const newPermission = await requestNotificationPermission();
      setPermission(newPermission);
      return newPermission;
    } catch (error) {
      console.error('Erreur lors de la demande de permission:', error);
      setError(error.message);
      throw error;
    }
  }, []);

  return {
    // État
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscriptions,
    error,
    serviceWorkerReady,
    
    // Actions
    subscribe,
    unsubscribe,
    refreshSubscriptions,
    requestPermission
  };
}

export default usePushNotifications;

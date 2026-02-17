import React, { createContext, useContext, useState, useEffect } from 'react';
import notificationService from '../services/notificationService';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications doit être utilisé dans un NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notificationToken, setNotificationToken] = useState(null);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [scheduledNotifications, setScheduledNotifications] = useState([]);

  // Initialiser les notifications
  useEffect(() => {
    initializeNotifications();
  }, []);

  const initializeNotifications = async () => {
    try {
      // Configurer le canal de notification (Android)
      await notificationService.setupNotificationChannel();

      // Demander les permissions
      const granted = await notificationService.requestNotificationPermissions();
      setPermissionsGranted(granted);

      if (granted) {
        // Obtenir le token de notification push
        const token = await notificationService.getNotificationToken();
        if (token) {
          setNotificationToken(token);
          console.log('Token de notification:', token);
          
          // Envoyer le token au backend
          await sendTokenToBackend(token);
        }

        // Charger les notifications programmées
        const scheduled = await notificationService.getScheduledNotifications();
        setScheduledNotifications(scheduled);
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation des notifications:', error);
    }
  };

  const sendTokenToBackend = async (token) => {
    try {
      // TODO: Implémenter l'envoi du token au backend
      // await api.post('/notifications/token', { token });
      console.log('Token envoyé au backend:', token);
    } catch (error) {
      console.error('Erreur lors de l\'envoi du token au backend:', error);
    }
  };

  const sendNotification = async (title, body, data = {}) => {
    try {
      await notificationService.sendLocalNotification(title, body, data);
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification:', error);
    }
  };

  const sendOrderNotification = async (type, orderData) => {
    const notifications = {
      new_order: {
        title: '📦 Nouvelle commande',
        body: `Commande #${orderData.orderId} - ${orderData.clientName}`,
        data: { type: 'new_order', orderId: orderData._id }
      },
      order_assigned: {
        title: '🚚 Commande assignée',
        body: `Vous avez une nouvelle commande à livrer`,
        data: { type: 'order_assigned', orderId: orderData._id }
      },
      order_taken: {
        title: '✅ Commande prise',
        body: `La commande #${orderData.orderId} a été prise`,
        data: { type: 'order_taken', orderId: orderData._id }
      },
      order_completed: {
        title: '🎉 Commande terminée',
        body: `La commande #${orderData.orderId} a été livrée`,
        data: { type: 'order_completed', orderId: orderData._id }
      }
    };

    const notification = notifications[type];
    if (notification) {
      await sendNotification(notification.title, notification.body, notification.data);
    }
  };

  const scheduleNotification = async (title, body, trigger, data = {}) => {
    try {
      const notificationId = await notificationService.scheduleNotification(title, body, trigger, data);
      
      // Rafraîchir la liste des notifications programmées
      const scheduled = await notificationService.getScheduledNotifications();
      setScheduledNotifications(scheduled);
      
      return notificationId;
    } catch (error) {
      console.error('Erreur lors de la programmation de la notification:', error);
      return null;
    }
  };

  const cancelNotification = async (notificationId) => {
    try {
      await notificationService.cancelNotification(notificationId);
      
      // Rafraîchir la liste des notifications programmées
      const scheduled = await notificationService.getScheduledNotifications();
      setScheduledNotifications(scheduled);
    } catch (error) {
      console.error('Erreur lors de l\'annulation de la notification:', error);
    }
  };

  const clearAllNotifications = async () => {
    try {
      await notificationService.clearAllNotifications();
    } catch (error) {
      console.error('Erreur lors de l\'effacement des notifications:', error);
    }
  };

  const refreshScheduledNotifications = async () => {
    try {
      const scheduled = await notificationService.getScheduledNotifications();
      setScheduledNotifications(scheduled);
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des notifications:', error);
    }
  };

  const value = {
    notificationToken,
    permissionsGranted,
    scheduledNotifications,
    sendNotification,
    sendOrderNotification,
    scheduleNotification,
    cancelNotification,
    clearAllNotifications,
    refreshScheduledNotifications,
    initializeNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

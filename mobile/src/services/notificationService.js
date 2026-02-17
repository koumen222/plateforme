import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Demander les permissions de notification
export const requestNotificationPermissions = async () => {
  if (Platform.OS === 'ios') {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }
  
  if (Platform.OS === 'android') {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }
  
  return false;
};

// Obtenir le token de notification push
export const getNotificationToken = async () => {
  try {
    const { data } = await Notifications.getExpoPushTokenAsync();
    return data;
  } catch (error) {
    console.error('Erreur lors de l\'obtention du token de notification:', error);
    return null;
  }
};

// Envoyer une notification locale
export const sendLocalNotification = async (title, body, data = {}) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
      },
      trigger: null, // Notification immédiate
    });
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification locale:', error);
  }
};

// Envoyer une notification programmée
export const scheduleNotification = async (title, body, trigger, data = {}) => {
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
      },
      trigger,
    });
    return notificationId;
  } catch (error) {
    console.error('Erreur lors de la programmation de la notification:', error);
    return null;
  }
};

// Annuler une notification programmée
export const cancelNotification = async (notificationId) => {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error('Erreur lors de l\'annulation de la notification:', error);
  }
};

// Obtenir toutes les notifications programmées
export const getScheduledNotifications = async () => {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications programmées:', error);
    return [];
  }
};

// Effacer toutes les notifications
export const clearAllNotifications = async () => {
  try {
    await Notifications.dismissAllNotificationsAsync();
  } catch (error) {
    console.error('Erreur lors de l\'effacement des notifications:', error);
  }
};

// Configurer le canal de notification (Android)
export const setupNotificationChannel = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Notifications par défaut',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
      enableLights: true,
      lightColor: '#2563eb',
      enableVibrate: true,
    });
  }
};

// Types de notifications prédéfinis
export const NotificationTypes = {
  NEW_ORDER: 'new_order',
  ORDER_ASSIGNED: 'order_assigned',
  ORDER_TAKEN: 'order_taken',
  ORDER_COMPLETED: 'order_completed',
  PAYMENT_RECEIVED: 'payment_received',
  SYSTEM_UPDATE: 'system_update',
};

// Envoyer une notification basée sur le type
export const sendTypedNotification = async (type, title, body, data = {}) => {
  const notificationData = {
    type,
    timestamp: new Date().toISOString(),
    ...data,
  };
  
  await sendLocalNotification(title, body, notificationData);
};

export default {
  requestNotificationPermissions,
  getNotificationToken,
  sendLocalNotification,
  scheduleNotification,
  cancelNotification,
  getScheduledNotifications,
  clearAllNotifications,
  setupNotificationChannel,
  NotificationTypes,
  sendTypedNotification,
};

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { CONFIG } from '../config/config';

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const { isAuthenticated, token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fonction pour récupérer le token
  const getAuthToken = () => {
    return token || localStorage.getItem('token');
  };

  // Charger les notifications
  const fetchNotifications = useCallback(async (options = {}) => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const authToken = getAuthToken();
      const params = new URLSearchParams();
      
      if (options.limit) params.append('limit', options.limit);
      if (options.skip) params.append('skip', options.skip);
      if (options.read !== undefined) params.append('read', options.read);
      if (options.type) params.append('type', options.type);

      const response = await fetch(`${CONFIG.BACKEND_URL}/api/notifications?${params}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des notifications');
      }

      const data = await response.json();
      
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des notifications:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token]);

  // Charger le nombre de notifications non lues
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }

    try {
      const authToken = getAuthToken();
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/notifications/unread-count`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUnreadCount(data.unreadCount || 0);
        }
      }
    } catch (err) {
      console.error('Erreur lors du chargement du compteur:', err);
    }
  }, [isAuthenticated, token]);

  // Marquer une notification comme lue
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const authToken = getAuthToken();
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        // Mettre à jour localement
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, read: true, readAt: new Date() }
              : notif
          )
        );
        // Mettre à jour le compteur
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Erreur lors du marquage comme lu:', err);
    }
  }, [token]);

  // Marquer toutes les notifications comme lues
  const markAllAsRead = useCallback(async () => {
    try {
      const authToken = getAuthToken();
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/notifications/read-all`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        // Mettre à jour localement
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, read: true, readAt: new Date() }))
        );
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Erreur lors du marquage de toutes comme lues:', err);
    }
  }, [token]);

  // Supprimer une notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      const authToken = getAuthToken();
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        // Mettre à jour localement
        const deletedNotif = notifications.find(n => n.id === notificationId);
        setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
        // Mettre à jour le compteur si la notification n'était pas lue
        if (deletedNotif && !deletedNotif.read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
    }
  }, [token, notifications]);

  // Charger les notifications au montage et quand l'authentification change
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications({ limit: 50 });
      // Rafraîchir le compteur toutes les 30 secondes
      const interval = setInterval(() => {
        fetchUnreadCount();
      }, 30000);
      
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, fetchNotifications, fetchUnreadCount]);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        fetchNotifications,
        fetchUnreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refresh: () => fetchNotifications({ limit: 50 })
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}

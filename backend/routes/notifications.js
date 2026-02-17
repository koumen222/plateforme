import express from 'express';
import { authenticate, checkAccountStatus } from '../middleware/auth.js';
import Notification from '../models/Notification.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);
router.use(checkAccountStatus);

/**
 * GET /api/notifications
 * Récupérer les notifications de l'utilisateur connecté
 * 
 * Query params:
 * - limit: nombre de notifications (défaut: 50)
 * - skip: nombre à ignorer (défaut: 0)
 * - read: true/false/null pour filtrer par statut lu (défaut: null = tous)
 * - type: type de notification (défaut: null = tous)
 * 
 * @returns {Object} { success: boolean, notifications: Array, unreadCount: number }
 */
router.get('/', async (req, res) => {
  try {
    const {
      limit = 50,
      skip = 0,
      read = null,
      type = null
    } = req.query;

    const userId = req.user._id;

    // Récupérer les notifications
    const notifications = await Notification.getUserNotifications(userId, {
      limit: parseInt(limit),
      skip: parseInt(skip),
      read: read === 'true' ? true : read === 'false' ? false : null,
      type: type || null
    });

    // Compter les notifications non lues
    const unreadCount = await Notification.getUnreadCount(userId);

    res.json({
      success: true,
      notifications: notifications.map(notif => ({
        id: notif._id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        link: notif.link,
        icon: notif.icon,
        read: notif.read,
        readAt: notif.readAt,
        createdAt: notif.createdAt,
        metadata: notif.metadata
      })),
      unreadCount,
      total: notifications.length
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des notifications:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des notifications',
      message: error.message
    });
  }
});

/**
 * GET /api/notifications/unread-count
 * Récupérer uniquement le nombre de notifications non lues
 * 
 * @returns {Object} { success: boolean, unreadCount: number }
 */
router.get('/unread-count', async (req, res) => {
  try {
    const userId = req.user._id;
    const unreadCount = await Notification.getUnreadCount(userId);

    res.json({
      success: true,
      unreadCount
    });
  } catch (error) {
    console.error('❌ Erreur lors du comptage des notifications:', error);
    res.status(500).json({
      error: 'Erreur lors du comptage des notifications',
      message: error.message
    });
  }
});

/**
 * PUT /api/notifications/:id/read
 * Marquer une notification comme lue
 * 
 * @returns {Object} { success: boolean, notification: Object }
 */
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOne({
      _id: id,
      userId: userId
    });

    if (!notification) {
      return res.status(404).json({
        error: 'Notification non trouvée'
      });
    }

    await notification.markAsRead();

    res.json({
      success: true,
      notification: {
        id: notification._id,
        read: notification.read,
        readAt: notification.readAt
      }
    });
  } catch (error) {
    console.error('❌ Erreur lors du marquage de la notification:', error);
    res.status(500).json({
      error: 'Erreur lors du marquage de la notification',
      message: error.message
    });
  }
});

/**
 * PUT /api/notifications/read-all
 * Marquer toutes les notifications comme lues
 * 
 * @returns {Object} { success: boolean, updatedCount: number }
 */
router.put('/read-all', async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await Notification.updateMany(
      { userId, read: false },
      { 
        read: true,
        readAt: new Date()
      }
    );

    res.json({
      success: true,
      updatedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('❌ Erreur lors du marquage de toutes les notifications:', error);
    res.status(500).json({
      error: 'Erreur lors du marquage de toutes les notifications',
      message: error.message
    });
  }
});

/**
 * DELETE /api/notifications/:id
 * Supprimer une notification
 * 
 * @returns {Object} { success: boolean }
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      userId: userId
    });

    if (!notification) {
      return res.status(404).json({
        error: 'Notification non trouvée'
      });
    }

    res.json({
      success: true
    });
  } catch (error) {
    console.error('❌ Erreur lors de la suppression de la notification:', error);
    res.status(500).json({
      error: 'Erreur lors de la suppression de la notification',
      message: error.message
    });
  }
});

/**
 * DELETE /api/notifications/read/all
 * Supprimer toutes les notifications lues
 * 
 * @returns {Object} { success: boolean, deletedCount: number }
 */
router.delete('/read/all', async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await Notification.deleteMany({
      userId,
      read: true
    });

    res.json({
      success: true,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('❌ Erreur lors de la suppression des notifications lues:', error);
    res.status(500).json({
      error: 'Erreur lors de la suppression des notifications lues',
      message: error.message
    });
  }
});

export default router;

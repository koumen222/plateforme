import express from 'express';
import { getPublicKey, sendPushNotification, sendPushNotificationToMany } from '../config/push.js';
import { authenticate, checkAccountStatus } from '../middleware/auth.js';
import PushSubscription from '../models/PushSubscription.js';

const router = express.Router();

/**
 * Route publique pour obtenir la clé publique VAPID
 * Cette route permet au frontend de récupérer la clé publique
 * nécessaire pour s'abonner aux notifications push
 * 
 * GET /api/push/public-key
 * 
 * @returns {Object} { publicKey: string, subject: string }
 */
router.get('/public-key', (req, res) => {
  try {
    const publicKey = getPublicKey();
    
    if (!publicKey) {
      return res.status(500).json({ 
        error: 'Web Push non configuré',
        message: 'Les clés VAPID ne sont pas configurées dans le backend'
      });
    }
    
    // Retourner la clé publique et le subject
    // Le subject peut être utile pour le frontend
    res.json({ 
      publicKey,
      subject: process.env.VAPID_SUBJECT || 'mailto:contact@safitech.shop'
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération de la clé publique:', error);
    res.status(500).json({ 
      error: 'Erreur serveur',
      message: error.message 
    });
  }
});

// Routes protégées nécessitant une authentification
router.use(authenticate);
router.use(checkAccountStatus);

/**
 * POST /api/push/subscribe
 * S'abonner aux notifications push
 * 
 * Body:
 * {
 *   endpoint: string,
 *   keys: {
 *     p256dh: string,
 *     auth: string
 *   },
 *   deviceInfo?: string (optionnel),
 *   userAgent?: string (optionnel)
 * }
 * 
 * @returns {Object} { success: boolean, subscription: Object }
 */
router.post('/subscribe', async (req, res) => {
  try {
    const { endpoint, keys, deviceInfo, userAgent } = req.body;

    // Validation des champs requis
    if (!endpoint) {
      return res.status(400).json({ 
        error: 'L\'endpoint est requis',
        field: 'endpoint'
      });
    }

    if (!keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({ 
        error: 'Les clés p256dh et auth sont requises',
        field: 'keys'
      });
    }

    // Vérifier si l'abonnement existe déjà pour cet endpoint
    const existingSubscription = await PushSubscription.findByEndpoint(endpoint);
    
    if (existingSubscription) {
      // Si l'abonnement existe déjà pour un autre utilisateur, erreur
      if (existingSubscription.userId.toString() !== req.user._id.toString()) {
        return res.status(409).json({ 
          error: 'Cet endpoint est déjà utilisé par un autre utilisateur'
        });
      }
      
      // Si l'abonnement existe déjà pour cet utilisateur, le réactiver et mettre à jour
      existingSubscription.isActive = true;
      existingSubscription.p256dh = keys.p256dh;
      existingSubscription.auth = keys.auth;
      if (deviceInfo) existingSubscription.deviceInfo = deviceInfo;
      if (userAgent) existingSubscription.userAgent = userAgent;
      existingSubscription.lastUsedAt = new Date();
      
      await existingSubscription.save();
      
      console.log(`✅ Abonnement push réactivé pour ${req.user.email}`);
      console.log(`   Endpoint: ${endpoint.substring(0, 50)}...`);
      
      return res.json({
        success: true,
        message: 'Abonnement réactivé',
        subscription: {
          id: existingSubscription._id,
          endpoint: existingSubscription.endpoint,
          deviceInfo: existingSubscription.deviceInfo,
          isActive: existingSubscription.isActive,
          createdAt: existingSubscription.createdAt
        }
      });
    }

    // Vérifier le nombre maximum d'abonnements par utilisateur (limite: 5 appareils)
    const userSubscriptions = await PushSubscription.find({ 
      userId: req.user._id,
      isActive: true
    });
    
    if (userSubscriptions.length >= 5) {
      return res.status(400).json({ 
        error: 'Limite atteinte: maximum 5 appareils autorisés',
        maxDevices: 5,
        currentDevices: userSubscriptions.length
      });
    }

    // Créer un nouvel abonnement
    const subscription = new PushSubscription({
      userId: req.user._id,
      endpoint: endpoint.trim(),
      p256dh: keys.p256dh.trim(),
      auth: keys.auth.trim(),
      deviceInfo: deviceInfo ? deviceInfo.trim() : null,
      userAgent: userAgent ? userAgent.trim() : req.headers['user-agent'] || null,
      isActive: true,
      lastUsedAt: new Date()
    });

    await subscription.save();

    console.log(`✅ Nouvel abonnement push créé pour ${req.user.email}`);
    console.log(`   ID: ${subscription._id}`);
    console.log(`   Endpoint: ${endpoint.substring(0, 50)}...`);
    console.log(`   Device: ${deviceInfo || 'Non spécifié'}`);

    res.status(201).json({
      success: true,
      message: 'Abonnement créé avec succès',
      subscription: {
        id: subscription._id,
        endpoint: subscription.endpoint,
        deviceInfo: subscription.deviceInfo,
        isActive: subscription.isActive,
        createdAt: subscription.createdAt
      }
    });
  } catch (error) {
    console.error('❌ Erreur lors de l\'abonnement push:', error);
    
    // Gestion des erreurs MongoDB spécifiques
    if (error.code === 11000) {
      return res.status(409).json({ 
        error: 'Cet endpoint est déjà enregistré',
        message: 'Vous êtes déjà abonné avec cet appareil'
      });
    }
    
    res.status(500).json({ 
      error: 'Erreur lors de l\'abonnement',
      message: error.message 
    });
  }
});

/**
 * GET /api/push/subscriptions
 * Lister tous les abonnements actifs de l'utilisateur
 * 
 * @returns {Object} { subscriptions: Array }
 */
router.get('/subscriptions', async (req, res) => {
  try {
    const subscriptions = await PushSubscription.findActiveByUserId(req.user._id);

    // Retourner les abonnements sans les clés sensibles
    const safeSubscriptions = subscriptions.map(sub => ({
      id: sub._id,
      endpoint: sub.endpoint.substring(0, 50) + '...', // Masquer l'endpoint complet
      deviceInfo: sub.deviceInfo,
      userAgent: sub.userAgent,
      isActive: sub.isActive,
      lastUsedAt: sub.lastUsedAt,
      createdAt: sub.createdAt,
      updatedAt: sub.updatedAt
    }));

    console.log(`📋 ${subscriptions.length} abonnement(s) trouvé(s) pour ${req.user.email}`);

    res.json({
      success: true,
      count: subscriptions.length,
      subscriptions: safeSubscriptions
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des abonnements:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des abonnements',
      message: error.message 
    });
  }
});

/**
 * DELETE /api/push/unsubscribe
 * Se désabonner d'un appareil spécifique
 * 
 * Body:
 * {
 *   endpoint: string (requis)
 * }
 * 
 * OU
 * 
 * Query params:
 * ?endpoint=...
 * 
 * @returns {Object} { success: boolean, message: string }
 */
router.delete('/unsubscribe', async (req, res) => {
  try {
    const endpoint = req.body.endpoint || req.query.endpoint;

    if (!endpoint) {
      return res.status(400).json({ 
        error: 'L\'endpoint est requis',
        field: 'endpoint'
      });
    }

    // Trouver l'abonnement
    const subscription = await PushSubscription.findByEndpoint(endpoint);

    if (!subscription) {
      return res.status(404).json({ 
        error: 'Abonnement non trouvé',
        message: 'Cet endpoint n\'est pas enregistré'
      });
    }

    // Vérifier que l'abonnement appartient à l'utilisateur
    if (subscription.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        error: 'Accès refusé',
        message: 'Cet abonnement ne vous appartient pas'
      });
    }

    // Désactiver ou supprimer l'abonnement
    // On supprime complètement pour libérer l'endpoint unique
    await PushSubscription.deleteOne({ _id: subscription._id });

    console.log(`🗑️  Abonnement push supprimé pour ${req.user.email}`);
    console.log(`   Endpoint: ${endpoint.substring(0, 50)}...`);

    res.json({
      success: true,
      message: 'Abonnement supprimé avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur lors du désabonnement:', error);
    res.status(500).json({ 
      error: 'Erreur lors du désabonnement',
      message: error.message 
    });
  }
});

/**
 * DELETE /api/push/unsubscribe-all
 * Se désabonner de tous les appareils
 * 
 * @returns {Object} { success: boolean, message: string, deletedCount: number }
 */
router.delete('/unsubscribe-all', async (req, res) => {
  try {
    // Supprimer tous les abonnements de l'utilisateur
    const result = await PushSubscription.deleteMany({ 
      userId: req.user._id 
    });

    console.log(`🗑️  ${result.deletedCount} abonnement(s) supprimé(s) pour ${req.user.email}`);

    res.json({
      success: true,
      message: 'Tous les abonnements ont été supprimés',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('❌ Erreur lors de la suppression de tous les abonnements:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la suppression',
      message: error.message 
    });
  }
});

/**
 * POST /api/push/send
 * Envoyer une notification push à l'utilisateur connecté
 * 
 * Body:
 * {
 *   title: string (requis) - Titre de la notification
 *   body: string (requis) - Corps du message
 *   icon?: string (optionnel) - URL de l'icône
 *   url?: string (optionnel) - URL à ouvrir au clic
 *   tag?: string (optionnel) - Tag pour remplacer les notifications similaires
 *   data?: object (optionnel) - Données personnalisées
 * }
 * 
 * @returns {Object} { success: boolean, sent: number, failed: number }
 * 
 * @example
 * POST /api/push/send
 * {
 *   "title": "Nouveau message",
 *   "body": "Vous avez reçu un nouveau message",
 *   "icon": "/img/logo.svg",
 *   "url": "/messages"
 * }
 */
router.post('/send', async (req, res) => {
  try {
    const { title, body, icon, url, tag, data } = req.body;

    // Validation des champs requis
    if (!title || !body) {
      return res.status(400).json({ 
        error: 'Les champs title et body sont requis',
        fields: {
          title: title ? 'OK' : 'Manquant',
          body: body ? 'OK' : 'Manquant'
        }
      });
    }

    // Récupérer les abonnements actifs de l'utilisateur
    const subscriptions = await PushSubscription.findActiveByUserId(req.user._id);
    
    if (subscriptions.length === 0) {
      return res.status(404).json({ 
        error: 'Aucun abonnement actif',
        message: 'Vous devez d\'abord activer les notifications push'
      });
    }

    // Préparer le payload de la notification
    const payload = {
      title: title.trim(),
      body: body.trim(),
      icon: icon || '/img/logo.svg',
      url: url || '/',
      tag: tag || `notification-${Date.now()}`,
      data: data || {}
    };

    console.log(`📤 Envoi de notification à ${req.user.email}`);
    console.log(`   Titre: ${payload.title}`);
    console.log(`   Appareils: ${subscriptions.length}`);

    // Convertir les abonnements MongoDB en format push
    const pushSubscriptions = subscriptions.map(sub => sub.toPushSubscription());

    // Envoyer les notifications à tous les appareils
    const result = await sendPushNotificationToMany(pushSubscriptions, payload);

    console.log(`✅ Notifications envoyées: ${result.success} succès, ${result.failed} échecs`);

    // Si certaines notifications ont échoué avec un code 410 (expiré), les supprimer
    if (result.errors && result.errors.length > 0) {
      for (const error of result.errors) {
        if (error.statusCode === 410) {
          // Trouver et supprimer l'abonnement expiré
          const expiredSub = subscriptions[error.index];
          if (expiredSub) {
            await PushSubscription.deleteOne({ _id: expiredSub._id });
            console.log(`🗑️  Abonnement expiré supprimé: ${expiredSub.endpoint.substring(0, 50)}...`);
          }
        }
      }
    }

    res.json({
      success: true,
      message: 'Notification envoyée',
      sent: result.success,
      failed: result.failed,
      total: subscriptions.length,
      errors: result.errors || []
    });
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de la notification:', error);
    res.status(500).json({ 
      error: 'Erreur lors de l\'envoi de la notification',
      message: error.message 
    });
  }
});

/**
 * POST /api/push/send-to-user/:userId
 * Envoyer une notification push à un utilisateur spécifique (admin uniquement)
 * 
 * Body:
 * {
 *   title: string (requis)
 *   body: string (requis)
 *   icon?: string (optionnel)
 *   url?: string (optionnel)
 *   tag?: string (optionnel)
 *   data?: object (optionnel)
 * }
 * 
 * @returns {Object} { success: boolean, sent: number, failed: number }
 */
router.post('/send-to-user/:userId', async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin (vous pouvez adapter cette vérification)
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Accès refusé',
        message: 'Seuls les administrateurs peuvent envoyer des notifications à d\'autres utilisateurs'
      });
    }

    const { userId } = req.params;
    const { title, body, icon, url, tag, data } = req.body;

    // Validation des champs requis
    if (!title || !body) {
      return res.status(400).json({ 
        error: 'Les champs title et body sont requis'
      });
    }

    // Récupérer les abonnements actifs de l'utilisateur cible
    const subscriptions = await PushSubscription.findActiveByUserId(userId);
    
    if (subscriptions.length === 0) {
      return res.status(404).json({ 
        error: 'Aucun abonnement actif',
        message: 'Cet utilisateur n\'a pas activé les notifications push'
      });
    }

    // Préparer le payload
    const payload = {
      title: title.trim(),
      body: body.trim(),
      icon: icon || '/img/logo.svg',
      url: url || '/',
      tag: tag || `admin-notification-${Date.now()}`,
      data: data || {}
    };

    console.log(`📤 [Admin] Envoi de notification à l'utilisateur ${userId}`);
    console.log(`   Titre: ${payload.title}`);
    console.log(`   Appareils: ${subscriptions.length}`);

    // Convertir et envoyer
    const pushSubscriptions = subscriptions.map(sub => sub.toPushSubscription());
    const result = await sendPushNotificationToMany(pushSubscriptions, payload);

    // Nettoyer les abonnements expirés
    if (result.errors && result.errors.length > 0) {
      for (const error of result.errors) {
        if (error.statusCode === 410) {
          const expiredSub = subscriptions[error.index];
          if (expiredSub) {
            await PushSubscription.deleteOne({ _id: expiredSub._id });
          }
        }
      }
    }

    res.json({
      success: true,
      message: 'Notification envoyée',
      sent: result.success,
      failed: result.failed,
      total: subscriptions.length
    });
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de la notification:', error);
    res.status(500).json({ 
      error: 'Erreur lors de l\'envoi de la notification',
      message: error.message 
    });
  }
});

export default router;

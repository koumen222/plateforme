import express from 'express';
import Message from '../models/Message.js';
import Channel from '../models/Channel.js';
import EcomUser from '../models/EcomUser.js';
import { requireEcomAuth } from '../middleware/ecomAuth.js';

const router = express.Router();

const ADMIN_ROLES = ['ecom_admin', 'super_admin'];

// GET /api/ecom/messages/channels - Liste des canaux du workspace
router.get('/channels', requireEcomAuth, async (req, res) => {
  try {
    const workspaceId = req.workspaceId;
    const channels = await Channel.find({ workspaceId, isActive: true }).sort({ createdAt: 1 }).lean();

    const unreadCounts = {};
    for (const ch of channels) {
      unreadCounts[ch.slug] = await Message.countDocuments({
        workspaceId, channel: ch.slug, deleted: false,
        'readBy.userId': { $ne: req.ecomUser._id },
        senderId: { $ne: req.ecomUser._id }
      });
    }

    res.json({ success: true, channels, unreadCounts });
  } catch (error) {
    console.error('Erreur GET /messages/channels:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/ecom/messages/channels - Créer un canal
router.post('/channels', requireEcomAuth, async (req, res) => {
  try {
    const { name, emoji, description } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, message: 'Nom requis' });

    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const workspaceId = req.workspaceId;

    const existing = await Channel.findOne({ workspaceId, slug });
    if (existing) return res.status(400).json({ success: false, message: 'Un canal avec ce nom existe déjà' });

    const channel = await Channel.create({
      workspaceId,
      name: name.trim(),
      slug,
      emoji: emoji || '💬',
      description: description || '',
      createdBy: req.ecomUser._id
    });

    res.status(201).json({ success: true, channel });
  } catch (error) {
    console.error('Erreur POST /messages/channels:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// DELETE /api/ecom/messages/channels/:slug - Supprimer un canal (admin)
router.delete('/channels/:slug', requireEcomAuth, async (req, res) => {
  try {
    if (!ADMIN_ROLES.includes(req.ecomUser.role)) {
      return res.status(403).json({ success: false, message: 'Réservé aux admins' });
    }
    const channel = await Channel.findOneAndUpdate(
      { workspaceId: req.workspaceId, slug: req.params.slug },
      { isActive: false }
    );
    if (!channel) return res.status(404).json({ success: false, message: 'Canal non trouvé' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/ecom/messages/team/members - Membres de l'équipe dans le workspace
// IMPORTANT: doit être AVANT /:channel pour éviter que 'team' soit capturé comme canal
router.get('/team/members', requireEcomAuth, async (req, res) => {
  try {
    const workspaceId = req.workspaceId;

    const members = await EcomUser.find({
      workspaceId,
      isActive: true
    }).select('name email role lastLogin').lean();

    res.json({ success: true, members });
  } catch (error) {
    console.error('Erreur GET /messages/team/members:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/ecom/messages/:channel - Messages d'un canal
router.get('/:channel', requireEcomAuth, async (req, res) => {
  try {
    const { channel } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const workspaceId = req.workspaceId;
    const userRole = req.ecomUser.role;

    if (!canAccessChannel(userRole, channel)) {
      return res.status(403).json({ success: false, message: 'Accès refusé à ce canal' });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const messages = await Message.find({
      workspaceId,
      channel,
      deleted: false
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Message.countDocuments({ workspaceId, channel, deleted: false });

    // Marquer comme lus
    await Message.updateMany(
      {
        workspaceId,
        channel,
        deleted: false,
        senderId: { $ne: req.ecomUser._id },
        'readBy.userId': { $ne: req.ecomUser._id }
      },
      {
        $addToSet: {
          readBy: { userId: req.ecomUser._id, readAt: new Date() }
        }
      }
    );

    res.json({
      success: true,
      messages: messages.reverse(),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erreur GET /messages/:channel:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/ecom/messages/:channel - Envoyer un message
router.post('/:channel', requireEcomAuth, async (req, res) => {
  try {
    const { channel } = req.params;
    const { content, replyTo } = req.body;
    const workspaceId = req.workspaceId;
    const userRole = req.ecomUser.role;

    if (!canAccessChannel(userRole, channel)) {
      return res.status(403).json({ success: false, message: 'Accès refusé à ce canal' });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Le message ne peut pas être vide' });
    }

    if (content.trim().length > 2000) {
      return res.status(400).json({ success: false, message: 'Message trop long (max 2000 caractères)' });
    }

    let replyToContent = null;
    let replyToSenderName = null;

    if (replyTo) {
      const originalMsg = await Message.findOne({ _id: replyTo, workspaceId, deleted: false });
      if (originalMsg) {
        replyToContent = originalMsg.content;
        replyToSenderName = originalMsg.senderName;
      }
    }

    const message = new Message({
      workspaceId,
      senderId: req.ecomUser._id,
      senderName: req.ecomUser.name || req.ecomUser.email.split('@')[0],
      senderRole: userRole,
      content: content.trim(),
      channel,
      replyTo: replyTo || null,
      replyToContent,
      replyToSenderName,
      readBy: [{ userId: req.ecomUser._id, readAt: new Date() }]
    });

    await message.save();

    res.status(201).json({ success: true, message });
  } catch (error) {
    console.error('Erreur POST /messages/:channel:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PUT /api/ecom/messages/:channel/:messageId - Modifier un message
router.put('/:channel/:messageId', requireEcomAuth, async (req, res) => {
  try {
    const { channel, messageId } = req.params;
    const { content } = req.body;
    const workspaceId = req.workspaceId;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Le message ne peut pas être vide' });
    }

    const message = await Message.findOne({ _id: messageId, workspaceId, channel, deleted: false });

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message non trouvé' });
    }

    const isOwner = message.senderId.toString() === req.ecomUser._id.toString();
    const isAdmin = ['ecom_admin', 'super_admin'].includes(req.ecomUser.role);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Vous ne pouvez modifier que vos propres messages' });
    }

    message.content = content.trim();
    message.edited = true;
    message.editedAt = new Date();
    await message.save();

    res.json({ success: true, message });
  } catch (error) {
    console.error('Erreur PUT /messages/:channel/:messageId:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// DELETE /api/ecom/messages/:channel/:messageId - Supprimer un message
router.delete('/:channel/:messageId', requireEcomAuth, async (req, res) => {
  try {
    const { channel, messageId } = req.params;
    const workspaceId = req.workspaceId;

    const message = await Message.findOne({ _id: messageId, workspaceId, channel, deleted: false });

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message non trouvé' });
    }

    const isOwner = message.senderId.toString() === req.ecomUser._id.toString();
    const isAdmin = ['ecom_admin', 'super_admin'].includes(req.ecomUser.role);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Vous ne pouvez supprimer que vos propres messages' });
    }

    message.deleted = true;
    await message.save();

    res.json({ success: true, message: 'Message supprimé' });
  } catch (error) {
    console.error('Erreur DELETE /messages/:channel/:messageId:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/ecom/messages/:channel/unread/count - Compter les non lus
router.get('/:channel/unread/count', requireEcomAuth, async (req, res) => {
  try {
    const { channel } = req.params;
    const workspaceId = req.workspaceId;
    const userRole = req.ecomUser.role;

    if (!canAccessChannel(userRole, channel)) {
      return res.status(403).json({ success: false, message: 'Accès refusé à ce canal' });
    }

    const count = await Message.countDocuments({
      workspaceId,
      channel,
      deleted: false,
      'readBy.userId': { $ne: req.ecomUser._id },
      senderId: { $ne: req.ecomUser._id }
    });

    res.json({ success: true, count });
  } catch (error) {
    console.error('Erreur GET /messages/:channel/unread/count:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

export default router;

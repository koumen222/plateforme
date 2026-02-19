import express from 'express';
import mongoose from 'mongoose';
import DirectMessage from '../models/DirectMessage.js';
import EcomUser from '../models/EcomUser.js';
import { requireEcomAuth } from '../middleware/ecomAuth.js';

const router = express.Router();

// Clé de conversation entre deux users (ordre stable)
const convKey = (a, b) => [a.toString(), b.toString()].sort().join('_');

// GET /api/ecom/dm/conversations - Liste des conversations avec dernier message
router.get('/conversations', requireEcomAuth, async (req, res) => {
  try {
    const userId = req.ecomUser._id;
    const workspaceId = req.workspaceId;

    // Dernier message par paire de participants
    const convos = await DirectMessage.aggregate([
      { $match: { workspaceId: new mongoose.Types.ObjectId(workspaceId), participants: new mongoose.Types.ObjectId(userId), deleted: false } },
      { $sort: { createdAt: -1 } },
      { $group: {
        _id: { $cond: [
          { $lt: [{ $arrayElemAt: ['$participants', 0] }, { $arrayElemAt: ['$participants', 1] }] },
          { $concat: [{ $toString: { $arrayElemAt: ['$participants', 0] } }, '_', { $toString: { $arrayElemAt: ['$participants', 1] } }] },
          { $concat: [{ $toString: { $arrayElemAt: ['$participants', 1] } }, '_', { $toString: { $arrayElemAt: ['$participants', 0] } }] }
        ]},
        lastMessage: { $first: '$$ROOT' },
        unread: { $sum: {
          $cond: [
            { $and: [
              { $ne: ['$senderId', new mongoose.Types.ObjectId(userId)] },
              { $not: { $in: [new mongoose.Types.ObjectId(userId), '$readBy.userId'] } }
            ]},
            1, 0
          ]
        }}
      }},
      { $sort: { 'lastMessage.createdAt': -1 } }
    ]);

    // Enrichir avec les infos de l'autre participant
    const enriched = await Promise.all(convos.map(async (c) => {
      const otherIds = c.lastMessage.participants.filter(p => p.toString() !== userId.toString());
      const other = await EcomUser.findById(otherIds[0]).select('name email role').lean();
      return { ...c, other };
    }));

    res.json({ success: true, conversations: enriched });
  } catch (error) {
    console.error('Erreur GET /dm/conversations:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/ecom/dm/:userId - Messages avec un utilisateur
router.get('/:userId', requireEcomAuth, async (req, res) => {
  try {
    const meId = req.ecomUser._id;
    const otherId = new mongoose.Types.ObjectId(req.params.userId);
    const workspaceId = req.workspaceId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    const messages = await DirectMessage.find({
      workspaceId,
      participants: { $all: [meId, otherId] },
      deleted: false
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    messages.reverse();

    // Marquer comme lus
    await DirectMessage.updateMany(
      { workspaceId, participants: { $all: [meId, otherId] }, senderId: { $ne: meId }, 'readBy.userId': { $ne: meId } },
      { $push: { readBy: { userId: meId, readAt: new Date() } } }
    );

    const total = await DirectMessage.countDocuments({ workspaceId, participants: { $all: [meId, otherId] }, deleted: false });

    res.json({ success: true, messages, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('Erreur GET /dm/:userId:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/ecom/dm/:userId - Envoyer un message direct
router.post('/:userId', requireEcomAuth, async (req, res) => {
  try {
    const meId = req.ecomUser._id;
    const otherId = new mongoose.Types.ObjectId(req.params.userId);
    const { content } = req.body;

    if (!content?.trim()) return res.status(400).json({ success: false, message: 'Contenu requis' });

    const other = await EcomUser.findOne({ _id: otherId, workspaceId: req.workspaceId }).lean();
    if (!other) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });

    const message = await DirectMessage.create({
      workspaceId: req.workspaceId,
      participants: [meId, otherId],
      senderId: meId,
      senderName: req.ecomUser.name || req.ecomUser.email,
      senderRole: req.ecomUser.role,
      content: content.trim(),
      readBy: [{ userId: meId, readAt: new Date() }]
    });

    res.status(201).json({ success: true, message });
  } catch (error) {
    console.error('Erreur POST /dm/:userId:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// DELETE /api/ecom/dm/message/:id - Supprimer un message DM
router.delete('/message/:id', requireEcomAuth, async (req, res) => {
  try {
    const msg = await DirectMessage.findOne({ _id: req.params.id, workspaceId: req.workspaceId });
    if (!msg) return res.status(404).json({ success: false, message: 'Message non trouvé' });
    if (msg.senderId.toString() !== req.ecomUser._id.toString() && !['ecom_admin', 'super_admin'].includes(req.ecomUser.role)) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }
    msg.deleted = true;
    await msg.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/ecom/dm/unread/count - Nombre total de DM non lus
router.get('/unread/count', requireEcomAuth, async (req, res) => {
  try {
    const count = await DirectMessage.countDocuments({
      workspaceId: req.workspaceId,
      participants: req.ecomUser._id,
      senderId: { $ne: req.ecomUser._id },
      'readBy.userId': { $ne: req.ecomUser._id },
      deleted: false
    });
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

export default router;

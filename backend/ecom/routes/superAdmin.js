import express from 'express';
import EcomUser from '../models/EcomUser.js';
import Workspace from '../models/Workspace.js';
import { requireEcomAuth, requireSuperAdmin } from '../middleware/ecomAuth.js';

const router = express.Router();

// GET /api/ecom/super-admin/users - Tous les utilisateurs de toutes les workspaces
router.get('/users',
  requireEcomAuth,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const { role, workspaceId, isActive, search, page = 1, limit = 50 } = req.query;
      const filter = {};

      if (role) filter.role = role;
      if (workspaceId) filter.workspaceId = workspaceId;
      if (isActive !== undefined) filter.isActive = isActive === 'true';
      if (search) {
        filter.email = { $regex: search, $options: 'i' };
      }

      const users = await EcomUser.find(filter)
        .select('-password')
        .populate('workspaceId', 'name slug')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await EcomUser.countDocuments(filter);

      // Stats globales
      const stats = await EcomUser.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 }
          }
        }
      ]);

      const totalActive = await EcomUser.countDocuments({ isActive: true });
      const totalInactive = await EcomUser.countDocuments({ isActive: false });

      res.json({
        success: true,
        data: {
          users,
          stats: {
            byRole: stats,
            totalUsers: total,
            totalActive,
            totalInactive
          },
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Erreur super-admin get users:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }
);

// GET /api/ecom/super-admin/workspaces - Toutes les workspaces
router.get('/workspaces',
  requireEcomAuth,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const workspaces = await Workspace.find()
        .populate('owner', 'email role')
        .sort({ createdAt: -1 });

      // Compter les membres par workspace
      const memberCounts = await EcomUser.aggregate([
        { $match: { workspaceId: { $ne: null } } },
        { $group: { _id: '$workspaceId', count: { $sum: 1 } } }
      ]);

      const memberMap = {};
      memberCounts.forEach(m => { memberMap[m._id.toString()] = m.count; });

      const workspacesWithCounts = workspaces.map(ws => ({
        ...ws.toObject(),
        memberCount: memberMap[ws._id.toString()] || 0
      }));

      res.json({
        success: true,
        data: {
          workspaces: workspacesWithCounts,
          totalWorkspaces: workspaces.length,
          totalActive: workspaces.filter(w => w.isActive).length
        }
      });
    } catch (error) {
      console.error('Erreur super-admin get workspaces:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }
);

// PUT /api/ecom/super-admin/users/:id/role - Changer le rôle d'un utilisateur
router.put('/users/:id/role',
  requireEcomAuth,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const { role } = req.body;
      if (!['super_admin', 'ecom_admin', 'ecom_closeuse', 'ecom_compta'].includes(role)) {
        return res.status(400).json({ success: false, message: 'Rôle invalide' });
      }

      const user = await EcomUser.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
      }

      user.role = role;
      await user.save();

      res.json({
        success: true,
        message: 'Rôle mis à jour',
        data: { id: user._id, email: user.email, role: user.role }
      });
    } catch (error) {
      console.error('Erreur super-admin update role:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }
);

// PUT /api/ecom/super-admin/users/:id/toggle - Activer/désactiver un utilisateur
router.put('/users/:id/toggle',
  requireEcomAuth,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const user = await EcomUser.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
      }

      if (user._id.toString() === req.ecomUser._id.toString()) {
        return res.status(400).json({ success: false, message: 'Vous ne pouvez pas vous désactiver vous-même' });
      }

      user.isActive = !user.isActive;
      await user.save();

      res.json({
        success: true,
        message: user.isActive ? 'Utilisateur activé' : 'Utilisateur désactivé',
        data: { id: user._id, email: user.email, isActive: user.isActive }
      });
    } catch (error) {
      console.error('Erreur super-admin toggle user:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }
);

// DELETE /api/ecom/super-admin/users/:id - Supprimer un utilisateur
router.delete('/users/:id',
  requireEcomAuth,
  requireSuperAdmin,
  async (req, res) => {
    try {
      if (req.ecomUser._id.toString() === req.params.id) {
        return res.status(400).json({ success: false, message: 'Vous ne pouvez pas supprimer votre propre compte' });
      }

      const user = await EcomUser.findByIdAndDelete(req.params.id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
      }

      res.json({ success: true, message: 'Utilisateur supprimé' });
    } catch (error) {
      console.error('Erreur super-admin delete user:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }
);

// PUT /api/ecom/super-admin/workspaces/:id/toggle - Activer/désactiver un workspace
router.put('/workspaces/:id/toggle',
  requireEcomAuth,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const workspace = await Workspace.findById(req.params.id);
      if (!workspace) {
        return res.status(404).json({ success: false, message: 'Espace non trouvé' });
      }

      workspace.isActive = !workspace.isActive;
      await workspace.save();

      res.json({
        success: true,
        message: workspace.isActive ? 'Espace activé' : 'Espace désactivé',
        data: workspace
      });
    } catch (error) {
      console.error('Erreur super-admin toggle workspace:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }
);

export default router;

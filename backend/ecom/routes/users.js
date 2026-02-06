import express from 'express';
import EcomUser from '../models/EcomUser.js';
import { requireEcomAuth, validateEcomAccess } from '../middleware/ecomAuth.js';

const router = express.Router();

// GET /api/ecom/users - Liste des utilisateurs (admin seulement)
router.get('/',
  requireEcomAuth,
  validateEcomAccess('admin', 'read'),
  async (req, res) => {
    try {
      const { role, isActive } = req.query;
      const filter = { workspaceId: req.workspaceId };
      if (role) filter.role = role;
      if (isActive !== undefined) filter.isActive = isActive === 'true';

      const users = await EcomUser.find(filter)
        .select('-password')
        .sort({ createdAt: -1 });

      // Stats par rôle
      const stats = {
        total: users.length,
        admins: users.filter(u => u.role === 'ecom_admin').length,
        closeuses: users.filter(u => u.role === 'ecom_closeuse').length,
        comptas: users.filter(u => u.role === 'ecom_compta').length,
        active: users.filter(u => u.isActive).length,
        inactive: users.filter(u => !u.isActive).length
      };

      res.json({
        success: true,
        data: { users, stats }
      });
    } catch (error) {
      console.error('Erreur liste utilisateurs ecom:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }
);

// GET /api/ecom/users/:id - Détail d'un utilisateur
router.get('/:id',
  requireEcomAuth,
  validateEcomAccess('admin', 'read'),
  async (req, res) => {
    try {
      const user = await EcomUser.findOne({ _id: req.params.id, workspaceId: req.workspaceId }).select('-password');
      if (!user) {
        return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
      }
      res.json({ success: true, data: user });
    } catch (error) {
      console.error('Erreur détail utilisateur ecom:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }
);

// POST /api/ecom/users - Créer un utilisateur (admin seulement)
router.post('/',
  requireEcomAuth,
  validateEcomAccess('admin', 'write'),
  async (req, res) => {
    try {
      const { email, password, role } = req.body;

      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email et mot de passe requis' });
      }

      if (!['ecom_admin', 'ecom_closeuse', 'ecom_compta'].includes(role)) {
        return res.status(400).json({ success: false, message: 'Rôle invalide' });
      }

      const existing = await EcomUser.findOne({ email: email.toLowerCase() });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Cet email est déjà utilisé' });
      }

      const user = new EcomUser({ email, password, role, workspaceId: req.workspaceId });
      await user.save();

      res.status(201).json({
        success: true,
        message: 'Utilisateur créé avec succès',
        data: {
          id: user._id,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt
        }
      });
    } catch (error) {
      console.error('Erreur création utilisateur ecom:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }
);

// PUT /api/ecom/users/:id - Modifier un utilisateur (rôle, statut)
router.put('/:id',
  requireEcomAuth,
  validateEcomAccess('admin', 'write'),
  async (req, res) => {
    try {
      const { role, isActive } = req.body;
      const user = await EcomUser.findOne({ _id: req.params.id, workspaceId: req.workspaceId });

      if (!user) {
        return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
      }

      // Empêcher l'admin de se désactiver lui-même
      if (req.ecomUser._id.toString() === req.params.id && isActive === false) {
        return res.status(400).json({ success: false, message: 'Vous ne pouvez pas vous désactiver vous-même' });
      }

      if (role && ['ecom_admin', 'ecom_closeuse', 'ecom_compta'].includes(role)) {
        user.role = role;
      }
      if (isActive !== undefined) {
        user.isActive = isActive;
      }

      await user.save();

      res.json({
        success: true,
        message: 'Utilisateur mis à jour',
        data: {
          id: user._id,
          email: user.email,
          role: user.role,
          isActive: user.isActive
        }
      });
    } catch (error) {
      console.error('Erreur mise à jour utilisateur ecom:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }
);

// PUT /api/ecom/users/:id/reset-password - Réinitialiser le mot de passe
router.put('/:id/reset-password',
  requireEcomAuth,
  validateEcomAccess('admin', 'write'),
  async (req, res) => {
    try {
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'Le mot de passe doit contenir au moins 6 caractères' });
      }

      const user = await EcomUser.findOne({ _id: req.params.id, workspaceId: req.workspaceId });
      if (!user) {
        return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
      }

      user.password = newPassword;
      await user.save();

      res.json({
        success: true,
        message: 'Mot de passe réinitialisé avec succès'
      });
    } catch (error) {
      console.error('Erreur reset password ecom:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }
);

// DELETE /api/ecom/users/:id - Supprimer un utilisateur
router.delete('/:id',
  requireEcomAuth,
  validateEcomAccess('admin', 'write'),
  async (req, res) => {
    try {
      // Empêcher l'admin de se supprimer lui-même
      if (req.ecomUser._id.toString() === req.params.id) {
        return res.status(400).json({ success: false, message: 'Vous ne pouvez pas supprimer votre propre compte' });
      }

      const user = await EcomUser.findOneAndDelete({ _id: req.params.id, workspaceId: req.workspaceId });
      if (!user) {
        return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
      }

      res.json({ success: true, message: 'Utilisateur supprimé' });
    } catch (error) {
      console.error('Erreur suppression utilisateur ecom:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }
);

export default router;

import express from 'express';
import jwt from 'jsonwebtoken';
import EcomUser from '../models/EcomUser.js';
import Workspace from '../models/Workspace.js';
import { generateEcomToken } from '../middleware/ecomAuth.js';
import { validateEmail, validatePassword } from '../middleware/validation.js';

const router = express.Router();

// POST /api/ecom/auth/login - Connexion
router.post('/login', validateEmail, async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await EcomUser.findOne({ email, isActive: true });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Mettre à jour lastLogin
    user.lastLogin = new Date();
    await user.save();

    const token = generateEcomToken(user);

    // Charger le workspace
    let workspace = null;
    if (user.workspaceId) {
      workspace = await Workspace.findById(user.workspaceId);
    }

    res.json({
      success: true,
      message: 'Connexion réussie',
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          currency: user.currency,
          lastLogin: user.lastLogin,
          workspaceId: user.workspaceId
        },
        workspace: workspace ? {
          id: workspace._id,
          name: workspace.name,
          slug: workspace.slug,
          inviteCode: user.role === 'ecom_admin' ? workspace.inviteCode : undefined
        } : null
      }
    });
  } catch (error) {
    console.error('Erreur login e-commerce:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET /api/ecom/auth/super-admin-exists - Vérifier si un super admin existe déjà
router.get('/super-admin-exists', async (req, res) => {
  try {
    const exists = await EcomUser.exists({ role: 'super_admin' });
    res.json({ success: true, data: { exists: !!exists } });
  } catch (error) {
    console.error('Erreur check super admin:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/ecom/auth/register - Création d'un compte + workspace
router.post('/register', validateEmail, validatePassword, async (req, res) => {
  try {
    const { email, password, workspaceName, inviteCode, superAdmin, selectedRole } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await EcomUser.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }

    let workspace = null;
    let role = 'ecom_admin';

    // Création super admin (une seule fois)
    if (superAdmin) {
      const superAdminExists = await EcomUser.exists({ role: 'super_admin' });
      if (superAdminExists) {
        return res.status(400).json({
          success: false,
          message: 'Un super administrateur existe déjà. Impossible d\'en créer un autre.'
        });
      }
      role = 'super_admin';
    }

    // Super admin: pas besoin de workspace
    if (superAdmin) {
      const user = new EcomUser({ email, password, role: 'super_admin' });
      await user.save();

      const token = generateEcomToken(user);

      return res.status(201).json({
        success: true,
        message: 'Compte Super Admin créé avec succès',
        data: {
          token,
          user: {
            id: user._id,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            currency: user.currency,
            workspaceId: null
          },
          workspace: null
        }
      });
    }

    if (inviteCode) {
      // Rejoindre un workspace existant via code d'invitation
      workspace = await Workspace.findOne({ inviteCode, isActive: true });
      if (!workspace) {
        return res.status(400).json({
          success: false,
          message: 'Code d\'invitation invalide ou espace inactif'
        });
      }
      // Permettre de choisir un rôle lors de l'inscription (closeuse par défaut)
      const allowedJoinRoles = ['ecom_closeuse', 'ecom_compta', 'ecom_livreur'];
      role = (selectedRole && allowedJoinRoles.includes(selectedRole)) ? selectedRole : 'ecom_closeuse';
    } else {
      // Créer un nouveau workspace
      if (!workspaceName || workspaceName.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Le nom de l\'espace est requis (min. 2 caractères)'
        });
      }
    }

    // Créer l'utilisateur
    const user = new EcomUser({
      email,
      password,
      role
    });

    if (!inviteCode) {
      // Créer le workspace avec cet utilisateur comme owner
      await user.save(); // Sauver d'abord pour avoir l'ID
      workspace = new Workspace({
        name: workspaceName.trim(),
        owner: user._id
      });
      await workspace.save();
      user.workspaceId = workspace._id;
      await user.save();
    } else {
      user.workspaceId = workspace._id;
      await user.save();
    }

    const token = generateEcomToken(user);

    res.status(201).json({
      success: true,
      message: inviteCode ? 'Vous avez rejoint l\'espace avec succès' : 'Espace créé avec succès',
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          currency: user.currency,
          workspaceId: workspace._id
        },
        workspace: {
          id: workspace._id,
          name: workspace.name,
          slug: workspace.slug,
          inviteCode: role === 'ecom_admin' ? workspace.inviteCode : undefined
        }
      }
    });
  } catch (error) {
    console.error('Erreur register e-commerce:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET /api/ecom/auth/me - Obtenir le profil utilisateur
router.get('/me', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token || !token.startsWith('ecom:')) {
      return res.status(401).json({
        success: false,
        message: 'Token invalide'
      });
    }

        const ECOM_JWT_SECRET = process.env.ECOM_JWT_SECRET || 'ecom-secret-key-change-in-production';
    
    const decoded = jwt.verify(token.replace('ecom:', ''), ECOM_JWT_SECRET);
    
    const user = await EcomUser.findById(decoded.id).select('-password');
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé ou inactif'
      });
    }

    // Charger le workspace
    let workspace = null;
    if (user.workspaceId) {
      workspace = await Workspace.findById(user.workspaceId);
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
          workspaceId: user.workspaceId,
          currency: user.currency
        },
        workspace: workspace ? {
          id: workspace._id,
          name: workspace.name,
          slug: workspace.slug,
          inviteCode: user.role === 'ecom_admin' ? workspace.inviteCode : undefined
        } : null
      }
    });
  } catch (error) {
    console.error('Erreur get profile e-commerce:', error);
    res.status(401).json({
      success: false,
      message: 'Token invalide'
    });
  }
});

// PUT /api/ecom/auth/change-password - Changer mot de passe
router.put('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token || !token.startsWith('ecom:')) {
      return res.status(401).json({
        success: false,
        message: 'Token invalide'
      });
    }

        const ECOM_JWT_SECRET = process.env.ECOM_JWT_SECRET || 'ecom-secret-key-change-in-production';
    
    const decoded = jwt.verify(token.replace('ecom:', ''), ECOM_JWT_SECRET);
    
    const user = await EcomUser.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé ou inactif'
      });
    }

    // Vérifier le mot de passe actuel
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe actuel incorrect'
      });
    }

    // Valider le nouveau mot de passe
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le nouveau mot de passe doit contenir au moins 6 caractères'
      });
    }

    // Mettre à jour le mot de passe
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Mot de passe changé avec succès'
    });
  } catch (error) {
    console.error('Erreur change password e-commerce:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// PUT /api/ecom/auth/currency - Changer la devise de l'utilisateur
router.put('/currency', async (req, res) => {
  try {
    const { currency } = req.body;
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token || !token.startsWith('ecom:')) {
      return res.status(401).json({
        success: false,
        message: 'Token invalide'
      });
    }

    const ECOM_JWT_SECRET = process.env.ECOM_JWT_SECRET || 'ecom-secret-key-change-in-production';
    
    const decoded = jwt.verify(token.replace('ecom:', ''), ECOM_JWT_SECRET);
    
    const user = await EcomUser.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé ou inactif'
      });
    }

    // Valider la devise
    const allowedCurrencies = [
      // Afrique Centrale
      'XAF', 'CDF',
      // Afrique de l'Ouest
      'XOF', 'NGN', 'GHS', 'GNF', 'LRD', 'SLL',
      // Afrique du Nord
      'MAD', 'TND', 'DZD', 'EGP', 'LYD',
      // Afrique de l'Est
      'KES', 'UGX', 'TZS', 'RWF', 'BIF', 'ETB', 'SOS', 'SDG', 'SSP', 'ERN', 'DJF',
      // Afrique Australe
      'ZAR', 'BWP', 'NAD', 'ZMW', 'MZN', 'MWK', 'SZL', 'LSL', 'AOA', 'ZWL',
      // Internationales
      'USD', 'EUR', 'GBP', 'CAD', 'CNY'
    ];
    if (!currency || !allowedCurrencies.includes(currency)) {
      return res.status(400).json({
        success: false,
        message: 'Devise non valide'
      });
    }

    // Mettre à jour la devise
    user.currency = currency;
    await user.save();

    res.json({
      success: true,
      message: 'Devise mise à jour avec succès',
      data: { currency }
    });
  } catch (error) {
    console.error('Erreur change currency e-commerce:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

export default router;

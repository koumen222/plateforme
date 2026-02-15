import express from 'express';
import jwt from 'jsonwebtoken';
import { Resend } from 'resend';
import EcomUser from '../models/EcomUser.js';
import Device from '../models/Device.js';
import Workspace from '../models/Workspace.js';
import PasswordResetToken from '../models/PasswordResetToken.js';
import { generateEcomToken } from '../middleware/ecomAuth.js';
import { validateEmail, validatePassword } from '../middleware/validation.js';
import { logAudit, rateLimit } from '../middleware/security.js';

const router = express.Router();

// Rate limiting simple pour forgot-password (anti-abus)
const forgotPasswordAttempts = new Map();
const FORGOT_PASSWORD_LIMIT = 3; // max 3 demandes
const FORGOT_PASSWORD_WINDOW = 15 * 60 * 1000; // par 15 minutes

// POST /api/ecom/auth/login - Connexion (rate limited: 10 tentatives/min)
router.post('/login', rateLimit(10, 60000), validateEmail, async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await EcomUser.findOne({ email, isActive: true });
    if (!user) {
      // Log tentative échouée (utilisateur introuvable)
      console.warn(`⚠️ Tentative login échouée: ${email} (utilisateur non trouvé)`);
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // Log tentative échouée (mauvais mot de passe)
      req.ecomUser = user;
      await logAudit(req, 'LOGIN_FAILED', `Tentative de connexion échouée pour ${email}`, 'auth');
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Mettre à jour lastLogin
    user.lastLogin = new Date();
    await user.save();

    const token = generateEcomToken(user);
    
    // Log connexion réussie
    req.ecomUser = user;
    await logAudit(req, 'LOGIN', `Connexion réussie: ${user.email} (${user.role})`, 'auth', user._id);

    // Charger le workspace
    let workspace = null;
    if (user.workspaceId) {
      workspace = await Workspace.findById(user.workspaceId);
    }

    // Vérifier si l'appareil est déjà enregistré
    const userAgent = req.headers['user-agent'] || '';
    const ip = req.ip || req.connection.remoteAddress || '';
    const acceptLanguage = req.headers['accept-language'] || '';
    const fingerprint = Device.generateFingerprint(userAgent, ip, acceptLanguage);
    
    let existingDevice = await Device.findOne({ 
      fingerprint, 
      userId: user._id,
      isActive: true 
    });

    let deviceInfo = null;
    if (existingDevice) {
      // Mettre à jour la dernière utilisation
      await existingDevice.updateLastUsed();
      deviceInfo = {
        id: existingDevice._id,
        name: existingDevice.deviceName,
        trusted: existingDevice.trusted,
        firstTime: false
      };
    } else {
      // Créer un nouvel appareil
      const deviceId = Device.generateDeviceId();
      const deviceName = getDeviceName(userAgent);
      const deviceType = getDeviceType(userAgent);
      
      const newDevice = new Device({
        userId: user._id,
        deviceId,
        deviceName,
        deviceType,
        platform: getPlatform(userAgent),
        userAgent,
        fingerprint,
        location: {
          ip
        }
      });
      
      await newDevice.save();
      
      deviceInfo = {
        id: newDevice._id,
        name: newDevice.deviceName,
        trusted: newDevice.trusted,
        firstTime: true
      };
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
        } : null,
        device: deviceInfo
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
    const { email, password, name, phone, workspaceName, inviteCode, superAdmin, selectedRole, acceptPrivacy } = req.body;

    // Vérifier l'acceptation de la politique de confidentialité
    if (!superAdmin && !acceptPrivacy) {
      return res.status(400).json({
        success: false,
        message: 'Vous devez accepter la politique de confidentialité pour créer un compte'
      });
    }

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
      name: name?.trim() || '',
      phone: phone?.trim() || '',
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
    
    console.log('🔍 Recherche utilisateur avec ID:', decoded.id);
    const user = await EcomUser.findById(decoded.id).select('-password');
    console.log('👤 Utilisateur trouvé:', user ? user.email : 'Non trouvé');
    console.log('🔑 Utilisateur actif:', user?.isActive);
    
    if (!user || !user.isActive) {
      console.log('❌ Utilisateur non trouvé ou inactif');
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
          name: user.name,
          phone: user.phone,
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

// PUT /api/ecom/auth/profile - Mettre à jour le profil
router.put('/profile', async (req, res) => {
  try {
    const { name, phone } = req.body;
    console.log('🔧 [Profile Update] Données reçues:', { name, phone, body: req.body });
    
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token || !token.startsWith('ecom:')) {
      console.log('❌ [Profile Update] Token invalide:', token?.substring(0, 20));
      return res.status(401).json({ success: false, message: 'Token invalide' });
    }

    const ECOM_JWT_SECRET = process.env.ECOM_JWT_SECRET || 'ecom-secret-key-change-in-production';
    const decoded = jwt.verify(token.replace('ecom:', ''), ECOM_JWT_SECRET);
    console.log('👤 [Profile Update] Token décodé, userId:', decoded.id);
    
    const user = await EcomUser.findById(decoded.id);
    if (!user || !user.isActive) {
      console.log('❌ [Profile Update] Utilisateur non trouvé ou inactif:', decoded.id);
      return res.status(401).json({ success: false, message: 'Utilisateur non trouvé ou inactif' });
    }

    console.log('📋 [Profile Update] Avant modification:', { 
      id: user._id, 
      name: user.name, 
      phone: user.phone,
      email: user.email 
    });

    if (name !== undefined) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    
    console.log('💾 [Profile Update] Sauvegarde en cours...');
    await user.save();
    console.log('✅ [Profile Update] Sauvegarde réussie!');

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      data: { name: user.name, phone: user.phone }
    });
  } catch (error) {
    console.error('❌ [Profile Update] Erreur:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/ecom/auth/forgot-password - Demander une réinitialisation
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email requis' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Rate limiting
    const now = Date.now();
    const key = normalizedEmail;
    const attempts = forgotPasswordAttempts.get(key) || { count: 0, firstAttempt: now };
    
    if (now - attempts.firstAttempt > FORGOT_PASSWORD_WINDOW) {
      attempts.count = 0;
      attempts.firstAttempt = now;
    }
    
    if (attempts.count >= FORGOT_PASSWORD_LIMIT) {
      return res.status(429).json({
        success: false,
        message: 'Trop de tentatives. Veuillez réessayer dans 15 minutes.'
      });
    }
    
    attempts.count++;
    forgotPasswordAttempts.set(key, attempts);

    // Toujours répondre succès (sécurité : ne pas révéler si l'email existe)
    const successMessage = 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.';

    const user = await EcomUser.findOne({ email: normalizedEmail, isActive: true });
    if (!user) {
      console.log(`\u26a0\ufe0f Forgot password: email ${normalizedEmail} non trouv\u00e9`);
      return res.json({ success: true, message: successMessage });
    }

    // Générer le token
    const resetToken = await PasswordResetToken.createToken(user._id);

    // Construire le lien de réinitialisation
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/ecom/reset-password?token=${resetToken.token}`;

    // Envoyer l'email via Resend
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error('\u274c RESEND_API_KEY non configur\u00e9 - impossible d\'envoyer l\'email de r\u00e9initialisation');
      return res.status(500).json({ success: false, message: 'Service email non configur\u00e9' });
    }

    const resend = new Resend(resendApiKey);
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@safitech.shop';

    await resend.emails.send({
      from: `Ecomstarter <${fromEmail}>`,
      to: normalizedEmail,
      subject: 'R\u00e9initialisation de votre mot de passe',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1e40af; font-size: 24px; margin: 0;">R\u00e9initialisation du mot de passe</h1>
          </div>
          <div style="background: #f8fafc; border-radius: 12px; padding: 30px; border: 1px solid #e2e8f0;">
            <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Bonjour,</p>
            <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Vous avez demand\u00e9 la r\u00e9initialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="display: inline-block; background: #2563eb; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">R\u00e9initialiser mon mot de passe</a>
            </div>
            <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 10px;">Ce lien expire dans <strong>1 heure</strong>.</p>
            <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0;">Si vous n'avez pas demand\u00e9 cette r\u00e9initialisation, ignorez simplement cet email.</p>
          </div>
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #94a3b8; font-size: 12px;">Ecomstarter - Plateforme E-commerce</p>
          </div>
        </div>
      `
    });

    console.log(`\u2705 Email de r\u00e9initialisation envoy\u00e9 \u00e0 ${normalizedEmail}`);
    res.json({ success: true, message: successMessage });
  } catch (error) {
    console.error('Erreur forgot-password:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/ecom/auth/reset-password - R\u00e9initialiser le mot de passe avec le token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token et nouveau mot de passe requis' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Le mot de passe doit contenir au moins 6 caract\u00e8res' });
    }

    // V\u00e9rifier le token
    const resetToken = await PasswordResetToken.verifyToken(token);
    if (!resetToken) {
      return res.status(400).json({
        success: false,
        message: 'Lien de r\u00e9initialisation invalide ou expir\u00e9. Veuillez faire une nouvelle demande.'
      });
    }

    // Trouver l'utilisateur
    const user = await EcomUser.findById(resetToken.userId);
    if (!user || !user.isActive) {
      return res.status(400).json({ success: false, message: 'Utilisateur non trouv\u00e9 ou inactif' });
    }

    // Mettre \u00e0 jour le mot de passe
    user.password = newPassword;
    await user.save();

    // Marquer le token comme utilis\u00e9
    resetToken.used = true;
    await resetToken.save();

    // Envoyer un email de confirmation
    try {
      const resendApiKey = process.env.RESEND_API_KEY;
      if (resendApiKey) {
        const resend = new Resend(resendApiKey);
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@safitech.shop';
        await resend.emails.send({
          from: `Ecomstarter <${fromEmail}>`,
          to: user.email,
          subject: 'Votre mot de passe a \u00e9t\u00e9 modifi\u00e9',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: #f0fdf4; border-radius: 12px; padding: 30px; border: 1px solid #bbf7d0;">
                <h2 style="color: #166534; font-size: 20px; margin: 0 0 15px;">\u2705 Mot de passe modifi\u00e9</h2>
                <p style="color: #334155; font-size: 15px; line-height: 1.6; margin: 0 0 15px;">Votre mot de passe a \u00e9t\u00e9 r\u00e9initialis\u00e9 avec succ\u00e8s.</p>
                <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 0;">Si vous n'\u00eates pas \u00e0 l'origine de cette modification, contactez imm\u00e9diatement le support.</p>
              </div>
            </div>
          `
        });
      }
    } catch (emailErr) {
      console.error('Erreur envoi email confirmation:', emailErr);
    }

    console.log(`\u2705 Mot de passe r\u00e9initialis\u00e9 pour ${user.email}`);
    res.json({ success: true, message: 'Mot de passe r\u00e9initialis\u00e9 avec succ\u00e8s' });
  } catch (error) {
    console.error('Erreur reset-password:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
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

// PUT /api/ecom/auth/avatar - Mettre à jour l'avatar
router.put('/avatar', async (req, res) => {
  try {
    const { avatar } = req.body;
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

    // Mettre à jour l'avatar
    if (avatar !== undefined) {
      user.avatar = avatar.trim();
      await user.save();
    }

    res.json({
      success: true,
      message: 'Avatar mis à jour avec succès',
      data: { avatar: user.avatar }
    });
  } catch (error) {
    console.error('Erreur update avatar e-commerce:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET /api/ecom/auth/me - Retourner les infos utilisateur avec avatar
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

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          avatar: user.avatar,
          role: user.role,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
          workspaceId: user.workspaceId,
          currency: user.currency
        }
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

// Fonctions utilitaires pour la détection d'appareil
function getDeviceName(userAgent) {
  if (!userAgent) return 'Appareil inconnu';
  
  if (userAgent.includes('iPhone')) return 'iPhone';
  if (userAgent.includes('iPad')) return 'iPad';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('Windows Phone')) return 'Windows Phone';
  if (userAgent.includes('Macintosh')) return 'Mac';
  if (userAgent.includes('Windows')) return 'Windows PC';
  if (userAgent.includes('Linux')) return 'Linux';
  
  return 'Appareil inconnu';
}

function getDeviceType(userAgent) {
  if (!userAgent) return 'unknown';
  
  if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
    return 'mobile';
  }
  if (userAgent.includes('iPad') || userAgent.includes('Tablet')) {
    return 'tablet';
  }
  if (userAgent.includes('Windows') || userAgent.includes('Macintosh') || userAgent.includes('Linux')) {
    return 'desktop';
  }
  
  return 'unknown';
}

function getPlatform(userAgent) {
  if (!userAgent) return '';
  
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
  
  return '';
}

// POST /api/ecom/auth/device-login - Connexion automatique par appareil
router.post('/device-login', async (req, res) => {
  try {
    const { email, deviceId } = req.body;
    
    if (!email || !deviceId) {
      return res.status(400).json({
        success: false,
        message: 'Email et deviceId requis'
      });
    }

    // Récupérer l'utilisateur
    const user = await EcomUser.findOne({ email, isActive: true });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Vérifier si l'appareil est enregistré et approuvé
    const device = await Device.findOne({ 
      deviceId, 
      userId: user._id,
      isActive: true,
      trusted: true 
    });

    if (!device) {
      return res.status(401).json({
        success: false,
        message: 'Appareil non reconnu ou non approuvé',
        requiresPassword: true
      });
    }

    // Mettre à jour la dernière utilisation
    await device.updateLastUsed();

    // Générer le token
    const token = generateEcomToken(user);
    
    // Mettre à jour lastLogin
    user.lastLogin = new Date();
    await user.save();

    // Log connexion automatique
    req.ecomUser = user;
    await logAudit(req, 'AUTO_LOGIN', `Connexion automatique: ${user.email} via ${device.deviceName}`, 'auth', user._id);

    // Charger le workspace
    let workspace = null;
    if (user.workspaceId) {
      workspace = await Workspace.findById(user.workspaceId);
    }

    res.json({
      success: true,
      message: 'Connexion automatique réussie',
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
        } : null,
        device: {
          id: device._id,
          name: device.deviceName,
          trusted: device.trusted,
          firstTime: false
        }
      }
    });
  } catch (error) {
    console.error('Erreur device login:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// POST /api/ecom/auth/trust-device - Approuver un appareil
router.post('/trust-device', async (req, res) => {
  try {
    const { deviceId } = req.body;
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

    const device = await Device.findOne({ 
      deviceId, 
      userId: user._id,
      isActive: true 
    });

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Appareil non trouvé'
      });
    }

    device.trusted = true;
    await device.save();

    await logAudit(req, 'DEVICE_TRUSTED', `Appareil approuvé: ${device.deviceName} par ${user.email}`, 'auth', user._id);

    res.json({
      success: true,
      message: 'Appareil approuvé avec succès',
      data: {
        device: {
          id: device._id,
          name: device.deviceName,
          trusted: device.trusted
        }
      }
    });
  } catch (error) {
    console.error('Erreur trust device:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET /api/ecom/auth/my-devices - Lister les appareils de l'utilisateur
router.get('/my-devices', async (req, res) => {
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
    
    const devices = await Device.find({ 
      userId: decoded.id,
      isActive: true 
    }).sort({ lastUsed: -1 });

    res.json({
      success: true,
      data: {
        devices: devices.map(device => ({
          id: device._id,
          deviceId: device.deviceId,
          name: device.deviceName,
          type: device.deviceType,
          platform: device.platform,
          trusted: device.trusted,
          lastUsed: device.lastUsed,
          firstUsed: device.createdAt,
          location: device.location
        }))
      }
    });
  } catch (error) {
    console.error('Erreur get devices:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// DELETE /api/ecom/auth/device/:deviceId - Supprimer un appareil
router.delete('/device/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token || !token.startsWith('ecom:')) {
      return res.status(401).json({
        success: false,
        message: 'Token invalide'
      });
    }

    const ECOM_JWT_SECRET = process.env.ECOM_JWT_SECRET || 'ecom-secret-key-change-in-production';
    const decoded = jwt.verify(token.replace('ecom:', ''), ECOM_JWT_SECRET);
    
    const device = await Device.findOne({ 
      deviceId, 
      userId: decoded.id,
      isActive: true 
    });

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Appareil non trouvé'
      });
    }

    device.isActive = false;
    await device.save();

    await logAudit(req, 'DEVICE_REMOVED', `Appareil supprimé: ${device.deviceName}`, 'auth', decoded.id);

    res.json({
      success: true,
      message: 'Appareil supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur delete device:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

export default router;

import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import {
  buildAccessFlags,
  createReferralFromRequest,
  ensureReferralCodeForUser,
  maybeValidateReferralForUser
} from '../services/referralService.js';

const router = express.Router();

console.log('🔧 Module auth.js chargé - routes disponibles:');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// GET /api/admin/check - Vérifier si un admin existe
router.get('/admin/check', async (req, res) => {
  try {
    const existingAdmin = await User.findOne({ 
      role: 'superadmin' 
    });
    
    res.json({ 
      exists: !!existingAdmin,
      canCreate: !existingAdmin
    });
  } catch (error) {
    console.error('Erreur vérification admin:', error);
    res.status(500).json({ error: 'Erreur lors de la vérification' });
  }
});

// POST /api/admin/register - Créer le premier admin (uniquement si aucun admin n'existe)
router.post('/admin/register', async (req, res) => {
  try {
    const { name, email, phoneNumber, password } = req.body;

    // Validation
    if (!name || !email || !phoneNumber || !password) {
      return res.status(400).json({ error: 'Tous les champs sont requis (nom, email, téléphone, mot de passe)' });
    }

    if (name.length < 2) {
      return res.status(400).json({ error: 'Le nom doit contenir au moins 2 caractères' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
    }

    // Vérifier si un admin existe déjà
    const existingAdmin = await User.findOne({ 
      role: 'superadmin' 
    });
    
    if (existingAdmin) {
      return res.status(403).json({ 
        error: 'Un administrateur existe déjà. Impossible de créer un nouveau compte administrateur.' 
      });
    }

    // Vérifier si l'email est déjà utilisé
    const existingUserByEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingUserByEmail) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }

    // Vérifier si le numéro de téléphone est déjà utilisé
    const existingUserByPhone = await User.findOne({ phoneNumber: phoneNumber.trim() });
    if (existingUserByPhone) {
      return res.status(400).json({ error: 'Ce numéro de téléphone est déjà utilisé' });
    }

    // Créer le premier admin avec status "active"
    const trimmedName = name.trim();
    const trimmedEmail = email.toLowerCase().trim();
    const trimmedPhone = phoneNumber.trim();
    
    const user = new User({ 
      name: trimmedName,
      email: trimmedEmail, 
      phoneNumber: trimmedPhone,
      password,
      authProvider: "local",
      emailVerified: false,
      accountStatus: "pending",
      role: 'superadmin',
      status: 'active'
    });
    await user.save();

    // Abonnement automatique à la newsletter pour l'admin aussi
    try {
      const Subscriber = (await import('../models/Subscriber.js')).default;
      const existingSubscriber = await Subscriber.findOne({ email: trimmedEmail });
      
      if (!existingSubscriber) {
        const subscriber = new Subscriber({
          email: trimmedEmail,
          name: trimmedName,
          source: 'manual',
          status: 'active',
          subscribedAt: new Date()
        });
        await subscriber.save();
        console.log(`✅ Admin automatiquement abonné à la newsletter: ${trimmedName} (${trimmedEmail})`);
      } else if (existingSubscriber.status === 'unsubscribed') {
        // Réabonner si désabonné précédemment
        existingSubscriber.status = 'active';
        existingSubscriber.name = trimmedName;
        existingSubscriber.unsubscribedAt = null;
        existingSubscriber.subscribedAt = new Date();
        await existingSubscriber.save();
        console.log(`✅ Admin réabonné à la newsletter: ${trimmedName} (${trimmedEmail})`);
      } else if (!existingSubscriber.name || existingSubscriber.name !== trimmedName) {
        // Mettre à jour le nom si différent
        existingSubscriber.name = trimmedName;
        await existingSubscriber.save();
      }
    } catch (subscriberError) {
      console.warn('⚠️ Abonnement newsletter ignoré:', subscriberError.message);
    }

    // Recharger l'utilisateur depuis la base pour s'assurer d'avoir toutes les données
    const savedUser = await User.findById(user._id);
    
    console.log(`✅ Admin créé: ${savedUser.name} (${savedUser.email}, ${savedUser.phoneNumber})`);
    console.log(`   Nom: "${savedUser.name}"`);

    // Générer le token JWT
    const token = jwt.sign(
      { userId: savedUser._id, email: savedUser.email, status: savedUser.status, role: savedUser.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: 'Administrateur créé avec succès',
      token,
      user: {
        id: savedUser._id.toString(),
        _id: savedUser._id.toString(),
        name: savedUser.name,
        email: savedUser.email,
        phoneNumber: savedUser.phoneNumber,
        status: savedUser.status,
        role: savedUser.role,
        createdAt: savedUser.createdAt
      }
    });
  } catch (error) {
    console.error('❌ Erreur création admin:', error);
    console.error('   Stack:', error.stack);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ 
      error: 'Erreur lors de la création du compte administrateur',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/register - Inscription utilisateur normal (étudiant uniquement)
router.post('/register', async (req, res) => {
  try {
    console.log('🔍 Register request received:', req.body);
    const { name, email, phoneNumber, password } = req.body;

    // Validation
    if (!name || !email || !phoneNumber || !password) {
      console.log('❌ Validation failed - missing fields:', { name: !!name, email: !!email, phoneNumber: !!phoneNumber, password: !!password });
      return res.status(400).json({ error: 'Veuillez remplir tous les champs : nom, email, téléphone et mot de passe sont requis' });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({ error: 'Le nom doit contenir au moins 2 caractères' });
    }

    // Validation de l'email
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Veuillez entrer une adresse email valide (exemple : votre@email.com)' });
    }

    // Validation du téléphone
    if (phoneNumber.trim().length < 5) {
      return res.status(400).json({ error: 'Veuillez entrer un numéro de téléphone valide' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
    }

    // Vérifier si l'email est déjà utilisé
    const existingUserByEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingUserByEmail) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé. Utilisez un autre email ou connectez-vous avec ce compte.' });
    }

    // Vérifier si le numéro de téléphone est déjà utilisé
    const existingUserByPhone = await User.findOne({ phoneNumber: phoneNumber.trim() });
    if (existingUserByPhone) {
      return res.status(400).json({ error: 'Ce numéro de téléphone est déjà utilisé. Utilisez un autre numéro ou connectez-vous avec ce compte.' });
    }

    // Créer un utilisateur étudiant avec status: "pending"
    const trimmedName = name.trim();
    const trimmedEmail = email.toLowerCase().trim();
    const trimmedPhone = phoneNumber.trim();
    
    console.log(`📝 Données reçues pour inscription:`);
    console.log(`   Nom: "${trimmedName}"`);
    console.log(`   Email: "${trimmedEmail}"`);
    console.log(`   Téléphone: "${trimmedPhone}"`);
    
    const user = new User({ 
      name: trimmedName,
      email: trimmedEmail, 
      phoneNumber: trimmedPhone,
      password,
      authProvider: "local",
      emailVerified: false,
      accountStatus: "pending",
      status: 'pending'
    });
    
    await user.save();

    try {
      await ensureReferralCodeForUser(user._id);
      await createReferralFromRequest({ userId: user._id, req });
    } catch (referralError) {
      console.warn('⚠️ Parrainage ignoré (register):', referralError.message);
    }

    // Abonnement automatique à la newsletter (même pour les utilisateurs en attente)
    try {
      const Subscriber = (await import('../models/Subscriber.js')).default;
      const existingSubscriber = await Subscriber.findOne({ email: trimmedEmail });
      
      if (!existingSubscriber) {
        const subscriber = new Subscriber({
          email: trimmedEmail,
          name: trimmedName,
          source: 'website',
          status: 'active',
          subscribedAt: new Date()
        });
        await subscriber.save();
        console.log(`✅ Utilisateur automatiquement abonné à la newsletter: ${trimmedName} (${trimmedEmail})`);
      } else if (existingSubscriber.status === 'unsubscribed') {
        // Réabonner si désabonné précédemment
        existingSubscriber.status = 'active';
        existingSubscriber.name = trimmedName;
        existingSubscriber.unsubscribedAt = null;
        existingSubscriber.subscribedAt = new Date();
        await existingSubscriber.save();
        console.log(`✅ Utilisateur réabonné à la newsletter: ${trimmedName} (${trimmedEmail})`);
      } else if (!existingSubscriber.name || existingSubscriber.name !== trimmedName) {
        // Mettre à jour le nom si différent
        existingSubscriber.name = trimmedName;
        await existingSubscriber.save();
      }
    } catch (subscriberError) {
      console.warn('⚠️ Abonnement newsletter ignoré:', subscriberError.message);
    }
    
    // Recharger l'utilisateur depuis la base pour s'assurer d'avoir toutes les données
    const savedUser = await User.findById(user._id).lean();
    
    if (!savedUser) {
      console.error('❌ Erreur: Utilisateur non trouvé après sauvegarde');
      return res.status(500).json({ error: 'Erreur lors de la création du compte' });
    }
    
    console.log(`✅ Utilisateur créé et sauvegardé:`);
    console.log(`   ID: ${savedUser._id}`);
    console.log(`   Nom: "${savedUser.name}"`);
    console.log(`   Email: "${savedUser.email}"`);
    console.log(`   Téléphone: "${savedUser.phoneNumber}"`);
    console.log(`   Statut: ${savedUser.status}`);
    console.log(`   Rôle: ${savedUser.role}`);

    // Générer le token JWT
    const token = jwt.sign(
      { userId: savedUser._id, email: savedUser.email, status: savedUser.status, role: savedUser.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // S'assurer que toutes les données sont présentes
    const accessFlags = buildAccessFlags(savedUser);
    const userResponse = {
      id: savedUser._id.toString(),
      _id: savedUser._id.toString(),
      name: savedUser.name ? savedUser.name.trim() : '',
      email: savedUser.email ? savedUser.email.trim() : '',
      phoneNumber: savedUser.phoneNumber ? savedUser.phoneNumber.trim() : '',
      status: savedUser.status || 'pending',
      role: savedUser.role || 'student',
      createdAt: savedUser.createdAt || new Date(),
      referralCode: savedUser.referralCode || null,
      referralAccessUnlocked: Boolean(savedUser.referralAccessUnlocked),
      accessGranted: accessFlags.hasAccess,
      allowedModules: savedUser.allowedModules || [],
      allowedCourseModules: (savedUser.allowedCourseModules || []).map(id => id.toString())
    };

    // Validation finale avant envoi
    if (!userResponse.name) {
      console.error('❌ ERREUR: Le nom est vide dans la réponse!');
    }
    if (!userResponse.phoneNumber) {
      console.error('❌ ERREUR: Le téléphone est vide dans la réponse!');
    }

    console.log(`📤 Réponse JSON envoyée:`);
    console.log(`   Nom: "${userResponse.name}"`);
    console.log(`   Email: "${userResponse.email}"`);
    console.log(`   Téléphone: "${userResponse.phoneNumber}"`);
    console.log(`   Statut: "${userResponse.status}"`);
    console.log(`   Rôle: "${userResponse.role}"`);

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('❌ Erreur registration:', error);
    console.error('   Stack:', error.stack);
    if (error.code === 11000) {
      // Erreur de duplication MongoDB
      if (error.keyPattern?.email) {
        return res.status(400).json({ error: 'Cet email est déjà utilisé. Utilisez un autre email ou connectez-vous avec ce compte.' });
      } else if (error.keyPattern?.phoneNumber) {
        return res.status(400).json({ error: 'Ce numéro de téléphone est déjà utilisé. Utilisez un autre numéro ou connectez-vous avec ce compte.' });
      }
      return res.status(400).json({ error: 'Ces informations sont déjà utilisées. Utilisez d\'autres informations ou connectez-vous.' });
    }
    if (error.name === 'ValidationError') {
      // Messages d'erreur de validation plus clairs
      const validationErrors = Object.values(error.errors).map(err => err.message).join(', ');
      return res.status(400).json({ error: `Erreur de validation : ${validationErrors}` });
    }
    res.status(500).json({ 
      error: 'Une erreur est survenue lors de la création de votre compte. Veuillez réessayer dans quelques instants.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/login
router.post('/login', async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;

    // Validation
    if (!emailOrPhone || !password) {
      return res.status(400).json({ error: 'Veuillez remplir tous les champs : email/téléphone et mot de passe sont requis' });
    }

    // Déterminer si c'est un email ou un numéro de téléphone
    const isEmail = /^\S+@\S+\.\S+$/.test(emailOrPhone);
    
    // Trouver l'utilisateur par email ou téléphone
    // Utiliser .select('+password') pour inclure le mot de passe (normalement exclu par select: false)
    let user;
    if (isEmail) {
      console.log(`🔍 Recherche par email: ${emailOrPhone.toLowerCase()}`);
      user = await User.findOne({ email: emailOrPhone.toLowerCase() }).select('+password');
    } else {
      console.log(`🔍 Recherche par téléphone: ${emailOrPhone.trim()}`);
      user = await User.findOne({ phoneNumber: emailOrPhone.trim() }).select('+password');
    }

    if (!user) {
      console.log(`❌ Utilisateur non trouvé avec ${isEmail ? 'email' : 'téléphone'}: ${emailOrPhone}`);
      return res.status(401).json({ error: 'Email/téléphone ou mot de passe incorrect. Vérifiez vos identifiants et réessayez.' });
    }
    
    console.log(`✅ Utilisateur trouvé: ${user.name} (${user.email})`);
    console.log(`   Nom: "${user.name}"`);
    console.log(`   Statut: ${user.status}`);
    console.log(`   PhoneNumber: ${user.phoneNumber || 'N/A'}`);

    // Vérifier que l'utilisateur a un mot de passe (pour les utilisateurs locaux)
    if (!user.password) {
      console.log('⚠️ Utilisateur sans mot de passe (probablement Google OAuth)');
      return res.status(401).json({ error: 'Ce compte utilise l\'authentification Google. Connectez-vous avec Google.' });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Email/téléphone ou mot de passe incorrect. Vérifiez vos identifiants et réessayez.' });
    }

    // Ne jamais bloquer la connexion ici selon le status.
    // Le frontend gérera les restrictions selon user.status

    // Générer le token JWT
    try {
      const ensuredCode = await ensureReferralCodeForUser(user._id);
      if (ensuredCode) {
        user.referralCode = ensuredCode;
      }
      await maybeValidateReferralForUser(user._id);
    } catch (referralError) {
      console.warn('⚠️ Parrainage ignoré (login):', referralError.message);
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, status: user.status, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // S'assurer que le nom est bien présent
    const accessFlags = buildAccessFlags(user);
    const userResponse = {
      id: user._id.toString(),
      _id: user._id.toString(),
      name: user.name || '',
      email: user.email,
      phoneNumber: user.phoneNumber || '',
      status: user.status,
      role: user.role,
      createdAt: user.createdAt,
      referralCode: user.referralCode || null,
      referralAccessUnlocked: Boolean(user.referralAccessUnlocked),
      accessGranted: accessFlags.hasAccess,
      allowedModules: user.allowedModules || [],
      allowedCourseModules: (user.allowedCourseModules || []).map(id => id.toString())
    };

    console.log(`✅ Réponse login - Nom: "${userResponse.name}"`);

    res.json({
      success: true,
      message: 'Connexion réussie',
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('❌ Erreur login:', error);
    console.error('   - Error name:', error.name);
    console.error('   - Error message:', error.message);
    console.error('   - Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Une erreur est survenue lors de la connexion. Veuillez réessayer dans quelques instants.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});


// PUT /api/profile - Mettre à jour le profil de l'utilisateur connecté
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, phoneNumber, avatar } = req.body;
    const userId = req.user._id;

    // Validation
    if (name !== undefined) {
      if (!name || name.trim().length < 2) {
        return res.status(400).json({ error: 'Le nom doit contenir au moins 2 caractères' });
      }
    }

    if (phoneNumber !== undefined) {
      if (!phoneNumber || phoneNumber.trim().length < 5) {
        return res.status(400).json({ error: 'Le numéro de téléphone doit contenir au moins 5 caractères' });
      }
    }

    // Récupérer l'utilisateur
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Mettre à jour les champs
    if (name !== undefined) {
      user.name = name.trim();
    }
    
    if (phoneNumber !== undefined) {
      // Vérifier si le téléphone n'est pas déjà utilisé par un autre utilisateur
      const existingUserByPhone = await User.findOne({ 
        phoneNumber: phoneNumber.trim(), 
        _id: { $ne: userId } 
      });
      if (existingUserByPhone) {
        return res.status(400).json({ error: 'Ce numéro de téléphone est déjà utilisé' });
      }
      user.phoneNumber = phoneNumber.trim();
    }

    // Mettre à jour l'avatar si fourni
    if (avatar !== undefined) {
      user.avatar = avatar.trim();
    }

    await user.save();

    console.log(`✅ Profil mis à jour pour: ${user.name} (${user.email})`);

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      user: {
        id: user._id.toString(),
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        status: user.status,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Erreur mise à jour profil:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Ce numéro de téléphone est déjà utilisé' });
    }
    res.status(500).json({ error: 'Erreur lors de la mise à jour du profil' });
  }
});


// POST /api/auth/forgot-password - Demande de réinitialisation de mot de passe
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    // Validation
    if (!email) {
      return res.status(400).json({ error: 'L\'adresse email est requise' });
    }

    // Validation de l'email
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Veuillez entrer une adresse email valide' });
    }

    // Trouver l'utilisateur par email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    // Pour des raisons de sécurité, on ne révèle pas si l'email existe ou non
    if (!user) {
      console.log(`❌ Tentative de réinitialisation pour un email non trouvé: ${email}`);
      return res.json({ 
        success: true, 
        message: 'Si cet email existe dans notre base de données, vous recevrez un lien de réinitialisation.' 
      });
    }

    // Vérifier que l'utilisateur a un mot de passe (pas OAuth)
    if (!user.password) {
      console.log(`❌ Tentative de réinitialisation pour un compte OAuth: ${email}`);
      return res.json({ 
        success: true, 
        message: 'Ce compte utilise l\'authentification Google. Veuillez vous connecter avec Google.' 
      });
    }

    // Générer un token de réinitialisation
    const crypto = await import('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Sauvegarder le token dans la base de données
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetTokenExpiry;
    await user.save();

    console.log(`✅ Token de réinitialisation généré pour: ${email}`);

    // Envoyer l'email avec Resend
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      console.log('🔧 Tentative d\'envoi email avec Resend...');
      console.log('   - API Key:', process.env.RESEND_API_KEY ? '✅ Définie' : '❌ Manquante');
      console.log('   - From:', process.env.EMAIL_FROM || 'noreply@infomania.store');
      console.log('   - To:', email);
      
      const result = await resend.emails.send({
        from: `Ecomstarter <${process.env.EMAIL_FROM || 'noreply@infomania.store'}>`,
        to: email,
        subject: 'Réinitialisation de votre mot de passe',
        html: `
          <h2 style="color: #333; font-family: Arial, sans-serif;">Réinitialisation de votre mot de passe</h2>
          <p style="color: #666; font-family: Arial, sans-serif;">Bonjour ${user.name},</p>
          <p style="color: #666; font-family: Arial, sans-serif;">Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le lien ci-dessous pour continuer:</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.FRONTEND_URL}/reset-password?token=${resetToken}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Réinitialiser mon mot de passe
            </a>
          </div>
          <p style="color: #999; font-size: 14px; font-family: Arial, sans-serif;">Ce lien expirera dans 10 minutes.</p>
          <p style="color: #999; font-size: 14px; font-family: Arial, sans-serif;">Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; font-family: Arial, sans-serif;">
            Ceci est un email automatique de la plateforme de formation Andromeda.
          </p>
        `
      });
      
      console.log('✅ Email de réinitialisation envoyé à:', email);
      console.log('   - Result ID:', result.id);
    } catch (emailError) {
      console.error('❌ Erreur envoi email:', emailError);
      console.error('   Details:', emailError.message);
      console.error('   Stack:', emailError.stack);
      // Ne pas retourner d'erreur 500, juste logger et continuer
      console.log('⚠️ Email non envoyé mais token généré - mode dégradé');
    }

    res.json({ 
      success: true, 
      message: 'Si cet email existe dans notre base de données, vous recevrez un lien de réinitialisation.' 
    });

  } catch (error) {
    console.error('❌ Erreur forgot-password:', error);
    res.status(500).json({ 
      error: 'Une erreur est survenue lors du traitement de votre demande. Veuillez réessayer plus tard.' 
    });
  }
});

// POST /api/auth/reset-password - Réinitialisation du mot de passe avec token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Validation
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Le token et le nouveau mot de passe sont requis' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' });
    }

    // Trouver l'utilisateur avec le token valide
    console.log(`🔍 Recherche utilisateur pour réinitialisation avec token: ${token.substring(0, 10)}...`);
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() }
    }).select('+password passwordResetToken passwordResetExpires email');

    if (!user) {
      console.log('❌ Token invalide ou expiré');
      // Vérifier si le token existe mais est expiré
      const expiredUser = await User.findOne({ passwordResetToken: token });
      if (expiredUser) {
        console.log(`⚠️ Token trouvé mais expiré à: ${expiredUser.passwordResetExpires}`);
      } else {
        console.log('❌ Aucun utilisateur trouvé avec ce token');
      }
      return res.status(400).json({ error: 'Token invalide ou expiré. Veuillez demander une nouvelle réinitialisation.' });
    }

    console.log(`✅ Utilisateur trouvé pour réinitialisation: ${user.email}`);

    // Mettre à jour le mot de passe
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    console.log(`✅ Mot de passe réinitialisé pour: ${user.email}`);

    res.json({ 
      success: true, 
      message: 'Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.' 
    });

  } catch (error) {
    console.error('❌ Erreur reset-password:', error);
    res.status(500).json({ 
      error: 'Une erreur est survenue lors de la réinitialisation du mot de passe. Veuillez réessayer plus tard.' 
    });
  }
});

// PUT /api/auth/change-password - Changer le mot de passe de l'utilisateur connecté
router.put('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Le mot de passe actuel et le nouveau mot de passe sont requis' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' });
    }

    // Récupérer l'utilisateur avec le mot de passe
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Vérifier si l'utilisateur a un mot de passe (peut être connecté via Google)
    if (!user.password) {
      return res.status(400).json({ error: 'Vous êtes connecté via Google. Impossible de changer le mot de passe.' });
    }

    // Vérifier le mot de passe actuel
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Mot de passe actuel incorrect' });
    }

    // Mettre à jour le mot de passe
    user.password = newPassword;
    await user.save();

    console.log(`✅ Mot de passe modifié pour: ${user.email}`);

    res.json({
      success: true,
      message: 'Mot de passe modifié avec succès'
    });
  } catch (error) {
    console.error('Erreur changement mot de passe:', error);
    res.status(500).json({ error: 'Erreur lors du changement de mot de passe' });
  }
});

// GET /api/user/me - Récupérer les données de l'utilisateur connecté (pour synchronisation)
router.get('/user/me', authenticate, async (req, res) => {
  try {
    try {
      await ensureReferralCodeForUser(req.user._id);
      await maybeValidateReferralForUser(req.user._id);
    } catch (referralError) {
      console.warn('⚠️ Parrainage ignoré (me):', referralError.message);
    }

    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const accessFlags = buildAccessFlags(user);
    res.json({
      success: true,
      user: {
        id: user._id.toString(),
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        avatar: user.avatar,
        status: user.status,
        accountStatus: user.accountStatus,
        emailVerified: user.emailVerified,
        role: user.role,
        authProvider: user.authProvider,
        createdAt: user.createdAt,
        referralCode: user.referralCode || null,
        referralAccessUnlocked: Boolean(user.referralAccessUnlocked),
        accessGranted: accessFlags.hasAccess,
        allowedModules: user.allowedModules || [],
        allowedCourseModules: (user.allowedCourseModules || []).map(id => id.toString())
      }
    });
  } catch (error) {
    console.error('Erreur récupération utilisateur:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des données utilisateur' });
  }
});

// Route temporaire pour valentine-winners (solution de contournement jusqu'à ce que successRadar soit déployé)
router.get('/valentine-winners', authenticate, async (req, res) => {
  try {
    const WinningProduct = (await import('../models/WinningProduct.js')).default;
    const { refreshValentineProducts } = await import('../services/successRadarCron.js');
    
    console.log('💝 Route temporaire /api/valentine-winners appelée');
    
    let valentineProducts = await WinningProduct.find({ specialEvent: 'saint-valentin' })
      .sort({ lastUpdated: -1, createdAt: -1 })
      .lean();
    
    const forceRefresh = req.query.force === 'true' || req.query.force === '1' || req.query.cache === 'false';
    
    if (forceRefresh || !valentineProducts.length) {
      try {
        console.log('💝 Génération de nouveaux produits St Valentin...');
        await WinningProduct.deleteMany({ specialEvent: 'saint-valentin' });
        await refreshValentineProducts();
        valentineProducts = await WinningProduct.find({ specialEvent: 'saint-valentin' })
          .sort({ lastUpdated: -1, createdAt: -1 })
          .lean();
      } catch (err) {
        console.error('❌ Erreur génération produits St Valentin:', err.message);
      }
    }
    
    if (!valentineProducts.length) {
      // Retourner le format attendu même si aucun produit
      return res.json({ 
        success: true,
        products: [
          "Montre connectée couple",
          "Projecteur galaxie",
          "Parfum couple",
          "Bracelet amour magnétique",
          "Lampe coeur LED"
        ],
        message: 'Aucun produit St Valentin disponible pour le moment'
      });
    }
    
    if (req.user?.status === 'blocked') {
      return res.status(403).json({ error: 'Accès refusé. Compte bloqué.' });
    }
    
    if (req.user?.status === 'active') {
      // Retourner le format attendu par le frontend
      const productNames = valentineProducts.map(p => p.name || 'Produit sans nom').filter(Boolean);
      return res.json({ 
        success: true,
        products: productNames.length > 0 ? productNames : [
          "Montre connectée couple",
          "Projecteur galaxie",
          "Parfum couple",
          "Bracelet amour magnétique",
          "Lampe coeur LED"
        ]
      });
    }
    
    // Comptes pending : renvoyer version floutée avec format attendu
    const blurred = valentineProducts.map(p => ({
      name: p.name ? `${p.name.substring(0, 10)}...` : 'Produit réservé',
      category: p.category || 'Catégorie réservée',
      priceRange: 'Disponible pour comptes actifs',
      countries: Array.isArray(p.countries) ? p.countries.slice(0, 1) : [],
      saturation: null,
      demandScore: null,
      trendScore: null,
      status: 'warm',
      lastUpdated: p.lastUpdated
    }));
    
    return res.json({
      success: true,
      products: blurred.map(p => p.name),
      message: 'Active ton compte pour débloquer les données complètes'
    });
  } catch (error) {
    console.error('❌ Erreur récupération produits St Valentin:', error);
    res.status(500).json({ error: 'Impossible de récupérer les produits St Valentin' });
  }
});

export default router;

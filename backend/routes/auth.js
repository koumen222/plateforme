import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

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
    const { name, email, phoneNumber, password } = req.body;

    // Validation
    if (!name || !email || !phoneNumber || !password) {
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
    const userResponse = {
      id: savedUser._id.toString(),
      _id: savedUser._id.toString(),
      name: savedUser.name ? savedUser.name.trim() : '',
      email: savedUser.email ? savedUser.email.trim() : '',
      phoneNumber: savedUser.phoneNumber ? savedUser.phoneNumber.trim() : '',
      status: savedUser.status || 'pending',
      role: savedUser.role || 'student',
      createdAt: savedUser.createdAt || new Date()
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
    let user;
    if (isEmail) {
      console.log(`🔍 Recherche par email: ${emailOrPhone.toLowerCase()}`);
      user = await User.findOne({ email: emailOrPhone.toLowerCase() });
    } else {
      console.log(`🔍 Recherche par téléphone: ${emailOrPhone.trim()}`);
      user = await User.findOne({ phoneNumber: emailOrPhone.trim() });
    }

    if (!user) {
      console.log(`❌ Utilisateur non trouvé avec ${isEmail ? 'email' : 'téléphone'}: ${emailOrPhone}`);
      return res.status(401).json({ error: 'Email/téléphone ou mot de passe incorrect. Vérifiez vos identifiants et réessayez.' });
    }
    
    console.log(`✅ Utilisateur trouvé: ${user.name} (${user.email}, ${user.phoneNumber})`);
    console.log(`   Nom: "${user.name}"`);
    console.log(`   Statut: ${user.status}`);

    // Vérifier le mot de passe
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Email/téléphone ou mot de passe incorrect. Vérifiez vos identifiants et réessayez.' });
    }

    // Vérifier le statut de l'utilisateur (même règle pour tous)
    if (user.status !== 'active') {
      let statusMessage = 'Votre compte est en attente de validation par l\'administrateur. Contactez l\'administrateur pour activer votre compte.';
      if (user.status === 'pending') {
        statusMessage = 'Votre compte est en attente d\'activation. Contactez l\'administrateur via WhatsApp pour finaliser votre paiement et activer votre compte.';
      } else if (user.status === 'inactive') {
        statusMessage = 'Votre compte est inactif. Contactez l\'administrateur pour réactiver votre compte.';
      }
      return res.status(403).json({ 
        error: statusMessage,
        status: user.status
      });
    }

    // Générer le token JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email, status: user.status, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // S'assurer que le nom est bien présent
    const userResponse = {
      id: user._id.toString(),
      _id: user._id.toString(),
      name: user.name || '',
      email: user.email,
      phoneNumber: user.phoneNumber || '',
      status: user.status,
      role: user.role,
      createdAt: user.createdAt
    };

    console.log(`✅ Réponse login - Nom: "${userResponse.name}"`);

    res.json({
      message: 'Connexion réussie',
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Erreur login:', error);
    res.status(500).json({ error: 'Une erreur est survenue lors de la connexion. Veuillez réessayer dans quelques instants.' });
  }
});


// PUT /api/profile - Mettre à jour le profil de l'utilisateur connecté
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, phoneNumber } = req.body;
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

// GET /api/user/me - Récupérer les données de l'utilisateur connecté (pour synchronisation)
router.get('/user/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json({
      success: true,
      user: {
        id: user._id.toString(),
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        status: user.status,
        accountStatus: user.accountStatus,
        emailVerified: user.emailVerified,
        role: user.role,
        authProvider: user.authProvider,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Erreur récupération utilisateur:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des données utilisateur' });
  }
});

export default router;

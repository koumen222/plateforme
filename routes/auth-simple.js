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

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Log pour débogage
console.log('🔧 Routes auth-simple.js en cours de chargement...');

// POST /forgot-password - Demande de réinitialisation de mot de passe
router.post('/auth/forgot-password', async (req, res) => {
  console.log('📨 Route forgot-password appelée!');
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

// POST /auth/reset-password - Réinitialisation du mot de passe avec token
router.post('/auth/reset-password', async (req, res) => {
  console.log('📨 Route reset-password appelée!');
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
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Token invalide ou expiré. Veuillez demander une nouvelle réinitialisation.' });
    }

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

export default router;

import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authenticate = async (req, res, next) => {
  try {
    // Récupérer le token depuis le header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token manquant ou invalide' });
    }

    const token = authHeader.substring(7); // Enlever "Bearer "

    if (!token) {
      return res.status(401).json({ error: 'Token manquant' });
    }

    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');

    // Récupérer l'utilisateur
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token invalide' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expiré' });
    }
    console.error('Erreur auth middleware:', error);
    res.status(500).json({ error: 'Erreur d\'authentification' });
  }
};

/**
 * Middleware pour vérifier le statut du compte
 * Pour les routes API : retourne une erreur JSON
 * Pour les routes HTML : redirige vers email-pending.html
 */
export const checkAccountStatus = (req, res, next) => {
  if (!req.user) {
    // Si c'est une requête API, retourner JSON
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ error: 'Non authentifié' });
    }
    return res.redirect("/login");
  }

  if (req.user.accountStatus === "pending") {
    // Si c'est une requête API, retourner JSON
    if (req.path.startsWith('/api/')) {
      return res.status(403).json({ 
        error: 'Votre compte est en attente de validation. Vérifiez votre email.',
        accountStatus: 'pending',
        emailVerified: req.user.emailVerified
      });
    }
    // Sinon, rediriger vers la page d'attente
    const FRONTEND_URL = process.env.FRONTEND_URL || 'https://www.safitech.shop';
    return res.redirect(`${FRONTEND_URL}/email-pending.html`);
  }

  if (req.user.accountStatus === "blocked") {
    return res.status(403).json({ 
      error: 'Votre compte a été bloqué. Contactez l\'administrateur.',
      accountStatus: 'blocked'
    });
  }

  next();
};


import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Middleware pour authentifier via cookie ou header Authorization
 * Priorité : cookie safitech_token > header Authorization
 */
export const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // 1. Essayer de récupérer le token depuis le cookie
    if (req.cookies && req.cookies.safitech_token) {
      token = req.cookies.safitech_token;
    }
    // 2. Sinon, essayer depuis le header Authorization (pour compatibilité)
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.substring(7);
    }

    if (!token) {
      return res.status(401).json({ error: 'Token manquant ou invalide' });
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
 * Middleware isAuthenticated (alias pour authenticate)
 * Utilisé pour les routes qui nécessitent une authentification
 */
export const isAuthenticated = authenticate;

/**
 * Middleware pour vérifier le statut du compte
 * Pour les routes API : retourne une erreur JSON
 * Pour les routes HTML : redirige vers email-pending.html
 * 🔥 Tous les utilisateurs (Google et classiques) suivent les mêmes règles
 */
export const checkAccountStatus = (req, res, next) => {
  if (!req.user) {
    // Si c'est une requête API, retourner JSON
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ error: 'Non authentifié' });
    }
    return res.redirect("/login");
  }

  // Tous les utilisateurs (Google et classiques) suivent les mêmes règles
  if (req.user.accountStatus === "pending") {
    // Si c'est une requête API, retourner JSON
    if (req.path.startsWith('/api/')) {
      return res.status(403).json({ 
        error: 'Votre compte est en attente de validation. Vérifiez votre email.',
        accountStatus: 'pending',
        emailVerified: req.user.emailVerified
      });
    }
    // Sinon, rediriger vers le dashboard, le frontend gérera l'affichage du message pending
    const FRONTEND_URL = process.env.FRONTEND_URL || 'https://www.safitech.shop';
    return res.redirect(`${FRONTEND_URL}/dashboard`);
  }

  if (req.user.accountStatus === "blocked") {
    return res.status(403).json({ 
      error: 'Votre compte a été bloqué. Contactez l\'administrateur.',
      accountStatus: 'blocked'
    });
  }

  next();
};


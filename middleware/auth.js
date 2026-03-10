import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import EcomUser from '../ecom/models/EcomUser.js';

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
      console.log('🔐 Token récupéré depuis cookie');
    }
    // 2. Sinon, essayer depuis le header Authorization (pour compatibilité)
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.substring(7);
      console.log('🔐 Token récupéré depuis header Authorization');
    }
    // 3. Sinon, essayer depuis les query params (pour SSE qui ne supporte pas les headers)
    else if (req.query && req.query.token) {
      token = req.query.token;
      console.log('🔐 Token récupéré depuis query params');
    }

    if (!token) {
      console.log('❌ Aucun token trouvé dans la requête');
      console.log('   - Cookies:', req.cookies);
      console.log('   - Authorization header:', req.headers.authorization);
      return res.status(401).json({ error: 'Token manquant ou invalide' });
    }
    
    console.log('🔐 Token trouvé, longueur:', token.length);

    // Vérifier si c'est un token e-commerce
    if (token.startsWith('ecom:')) {
      console.log('🔐 Token e-commerce détecté, utilisation du système e-commerce');
      
      try {
        const ECOM_JWT_SECRET = process.env.ECOM_JWT_SECRET || 'ecom-secret-key-change-in-production';
        const decoded = jwt.verify(token.replace('ecom:', ''), ECOM_JWT_SECRET);
        
        // Récupérer l'utilisateur e-commerce
        const ecomUser = await EcomUser.findById(decoded.id).select('-password');
        
        if (!ecomUser || !ecomUser.isActive) {
          return res.status(401).json({ error: 'Utilisateur e-commerce non trouvé ou inactif' });
        }

        // Convertir l'utilisateur e-commerce au format attendu par le middleware principal
        req.user = {
          _id: ecomUser._id,
          email: ecomUser.email,
          name: ecomUser.name,
          role: ecomUser.role,
          status: ecomUser.isActive ? 'active' : 'inactive',
          accountStatus: ecomUser.isActive ? 'active' : 'blocked'
        };
        
        console.log('✅ Utilisateur e-commerce authentifié:', req.user.email);
        next();
        return;
      } catch (ecomError) {
        console.error('❌ Erreur token e-commerce:', ecomError.message);
        return res.status(401).json({ error: 'Token e-commerce invalide ou expiré' });
      }
    }

    // Token normal (système principal)
    console.log('🔐 Token normal détecté, utilisation du système principal');
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
 * Le frontend gère les restrictions pour les utilisateurs pending.
 * On bloque uniquement les comptes "blocked".
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

  // Ne jamais bloquer les utilisateurs pending ici.
  // Le frontend gérera les restrictions selon user.status

  // Bloquer uniquement les comptes "blocked"
  if (req.user.accountStatus === "blocked") {
    return res.status(403).json({ 
      error: 'Votre compte a été bloqué. Contactez l\'administrateur.',
      accountStatus: 'blocked'
    });
  }

  next();
};


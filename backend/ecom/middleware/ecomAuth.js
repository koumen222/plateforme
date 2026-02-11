import jwt from 'jsonwebtoken';
import EcomUser from '../models/EcomUser.js';

// Clé secrète pour les tokens e-commerce (différente du système principal)
const ECOM_JWT_SECRET = process.env.ECOM_JWT_SECRET || 'ecom-secret-key-change-in-production';

// Middleware pour vérifier l'authentification e-commerce
export const requireEcomAuth = async (req, res, next) => {
  try {
    console.log(' Middleware requireEcomAuth appelé');
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log(' Token reçu:', token ? 'Token présent' : 'Token manquant');
    console.log('🔍 Params de la requête:', req.query);
    console.log('🔍 URL complète:', req.originalUrl);
    
    if (!token) {
      console.log(' Token manquant');
      return res.status(401).json({ 
        success: false,
        message: 'Token e-commerce manquant' 
      });
    }

    // Vérifier que le token est bien un token e-commerce
    if (!token.startsWith('ecom:')) {
      console.log(' Token invalide (ne commence pas par ecom:)');
      return res.status(401).json({ 
        success: false,
        message: 'Token e-commerce invalide' 
      });
    }

    console.log(' Token format valide, tentative de décodage...');
    const decoded = jwt.verify(token.replace('ecom:', ''), ECOM_JWT_SECRET);
    console.log(' Token décodé avec succès:', decoded);
    
    const user = await EcomUser.findById(decoded.id).select('-password');
    console.log(' Utilisateur trouvé:', user ? user.email : 'Non trouvé');
    
    if (!user || !user.isActive) {
      console.log(' Utilisateur non trouvé ou inactif');
      return res.status(401).json({ 
        success: false,
        message: 'Utilisateur e-commerce non trouvé ou inactif' 
      });
    }

    console.log(' Utilisateur authentifié avec succès');
    req.ecomUser = user;
    
    // Gestion du workspaceId pour l'incarnation
    if (req.query.workspaceId) {
      // Mode incarnation : utiliser le workspaceId des params
      req.workspaceId = req.query.workspaceId;
      console.log('🎭 Mode incarnation - WorkspaceId depuis params:', req.workspaceId);
    } else if (req.body && req.body.workspaceId) {
      // Mode incarnation : utiliser le workspaceId du corps
      req.workspaceId = req.body.workspaceId;
      console.log('🎭 Mode incarnation - WorkspaceId depuis body:', req.workspaceId);
    } else {
      // Mode normal : utiliser le workspaceId de l'utilisateur
      req.workspaceId = user.workspaceId;
      console.log('👤 Mode normal - WorkspaceId depuis user:', req.workspaceId);
    }
    
    next();
  } catch (error) {
    console.error(' Erreur dans requireEcomAuth:', error.message);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token invalide ou expiré' 
      });
    }
    return res.status(500).json({ 
      success: false,
      message: 'Erreur serveur authentification'
    });
  }
};

// Middleware pour vérifier un rôle spécifique
export const requireEcomRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.ecomUser) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentification e-commerce requise' 
      });
    }

    if (req.ecomUser.role !== requiredRole) {
      return res.status(403).json({ 
        success: false,
        message: 'Rôle e-commerce insuffisant' 
      });
    }

    next();
  };
};

// Middleware pour vérifier une permission spécifique
export const requireEcomPermission = (permission) => {
  return (req, res, next) => {
    if (!req.ecomUser) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentification e-commerce requise' 
      });
    }

    if (!req.ecomUser.hasPermission(permission)) {
      return res.status(403).json({ 
        success: false,
        message: 'Permission e-commerce insuffisante' 
      });
    }

    next();
  };
};

// Middleware pour valider l'accès selon le rôle et la ressource
export const validateEcomAccess = (resource, action) => {
  return (req, res, next) => {
    if (!req.ecomUser) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentification e-commerce requise' 
      });
    }

    const userRole = req.ecomUser.role;
    const permission = `${resource}:${action}`;
    
    // Mode incarnation : Super Admin a accès à tout
    if (req.query.workspaceId && userRole === 'super_admin') {
      console.log('🎭 Mode incarnation - Super Admin accès autorisé pour:', permission);
      return next();
    }

    // Règles d'accès spécifiques
    const accessRules = {
      'super_admin': ['admin:read', 'admin:write', '*'], // Super admin a accès à tout
      'ecom_admin': ['*'],
      'ecom_closeuse': ['orders:read', 'orders:write', 'reports:read', 'reports:write', 'products:read'],
      'ecom_compta': ['finance:read', 'finance:write', 'reports:read', 'reports:write', 'products:read'],
      'ecom_livreur': ['orders:read']
    };

    const userPermissions = accessRules[userRole] || [];
    
    // Le super_admin a accès à tout avec '*'
    if (userPermissions.includes('*')) {
      console.log('🎭 Super Admin accès autorisé pour:', permission);
      return next();
    }
    
    if (!userPermissions.includes('*') && !userPermissions.includes(permission)) {
      return res.status(403).json({ 
        success: false,
        message: `Accès refusé: ${permission} non autorisé pour le rôle ${userRole}` 
      });
    }

    next();
  };
};

// Fonction pour générer un token e-commerce
export const generateEcomToken = (user) => {
  return 'ecom:' + jwt.sign(
    { 
      id: user._id,
      email: user.email,
      role: user.role,
      workspaceId: user.workspaceId
    },
    ECOM_JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Middleware pour vérifier que l'utilisateur est super_admin
export const requireSuperAdmin = (req, res, next) => {
  if (!req.ecomUser || req.ecomUser.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Accès réservé au super administrateur'
    });
  }
  next();
};

// Middleware pour vérifier que l'utilisateur a un workspace
export const requireWorkspace = (req, res, next) => {
  if (!req.workspaceId) {
    return res.status(403).json({
      success: false,
      message: 'Aucun espace de travail associé. Veuillez créer ou rejoindre un espace.'
    });
  }
  next();
};

// Middleware optionnel pour logger les actions e-commerce
export const logEcomAction = (action) => {
  return (req, res, next) => {
    console.log(`[ECOM] ${req.ecomUser?.email} (${req.ecomUser?.role}) - ${action} - ${new Date().toISOString()}`);
    next();
  };
};

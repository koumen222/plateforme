// Middleware pour vérifier que l'utilisateur est admin ou superadmin
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Accès refusé. Rôle superadmin requis.' });
  }

  next();
};


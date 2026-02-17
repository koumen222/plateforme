import express from 'express';

const router = express.Router();

// Route de diagnostic pour vérifier toutes les routes disponibles
router.get('/routes', (req, res) => {
  const app = req.app;
  const routes = [];
  
  // Parcourir toutes les routes enregistrées
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      // Route directe
      const methods = Object.keys(middleware.route.methods);
      methods.forEach(method => {
        routes.push({
          method: method.toUpperCase(),
          path: middleware.route.path,
          type: 'direct'
        });
      });
    } else if (middleware.name === 'router') {
      // Route dans un router
      middleware.handle.stack?.forEach((handler) => {
        if (handler.route) {
          const methods = Object.keys(handler.route.methods);
          methods.forEach(method => {
            routes.push({
              method: method.toUpperCase(),
              path: handler.regexp.source,
              type: 'router',
              basePath: middleware.regexp?.source || 'unknown'
            });
          });
        }
      });
    }
  });
  
  // Filtrer pour trouver valentine-winners
  const valentineRoutes = routes.filter(r => 
    r.path.includes('valentine') || 
    (typeof r.path === 'string' && r.path.includes('valentine'))
  );
  
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    totalRoutes: routes.length,
    valentineRoutesFound: valentineRoutes.length,
    valentineRoutes: valentineRoutes,
    allRoutes: routes.slice(0, 50), // Limiter à 50 pour éviter une réponse trop grande
    environment: process.env.NODE_ENV || 'development',
    serverUrl: req.protocol + '://' + req.get('host')
  });
});

// Route de test pour valentine-winners
router.get('/test-valentine', async (req, res) => {
  try {
    const WinningProduct = (await import('../models/WinningProduct.js')).default;
    const count = await WinningProduct.countDocuments({ specialEvent: 'saint-valentin' });
    
    res.json({
      success: true,
      message: 'Test route valentine-winners',
      productsInDB: count,
      canAccessDB: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.json({
      success: false,
      message: 'Erreur lors du test',
      error: error.message,
      canAccessDB: false,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;


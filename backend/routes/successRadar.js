import express from 'express';
import { authenticate } from '../middleware/auth.js';
import WinningProduct from '../models/WinningProduct.js';
import { refreshSuccessRadar, refreshValentineProducts } from '../services/successRadarCron.js';

const router = express.Router();

// Route de test pour vérifier que le router fonctionne
router.get('/test-success-radar', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Router Success Radar fonctionne',
    routes: ['/success-radar', '/valentine-winners', '/regenerate-products', '/regenerate-valentine']
  });
});

const blurProduct = (product) => {
  const maskedName = product.name ? `${product.name.substring(0, 10)}...` : 'Produit réservé';
  return {
    name: maskedName,
    category: product.category || 'Catégorie réservée',
    priceRange: 'Disponible pour comptes actifs',
    countries: Array.isArray(product.countries) ? product.countries.slice(0, 1) : [],
    saturation: null,
    demandScore: null,
    trendScore: null,
    status: 'warm',
    lastUpdated: product.lastUpdated
  };
};

router.get('/success-radar', authenticate, async (req, res) => {
  try {
    // Vérifier si des produits généraux existent (sans specialEvent ou specialEvent vide)
    let products = await WinningProduct.find({ 
      $or: [
        { specialEvent: { $exists: false } },
        { specialEvent: '' },
        { specialEvent: { $ne: 'saint-valentin' } }
      ]
    })
      .sort({ lastUpdated: -1, createdAt: -1 })
      .limit(50)
      .lean();
    
    const now = new Date();
    const oneHourInMs = 60 * 60 * 1000; // 1 heure en millisecondes
    
    // Forcer la génération si paramètre force=true ou cache=false dans la query
    const forceRefresh = req.query.force === 'true' || req.query.force === '1' || req.query.cache === 'false';
    
    // Si aucun produit OU si le dernier produit a plus de 1h, générer
    let shouldRefresh = false;
    let cacheMessage = null;
    
    if (forceRefresh) {
      console.log('🔄 Régénération forcée demandée (cache ignoré)');
      shouldRefresh = true;
    } else if (!products.length) {
      console.log('⚠️ Aucun produit en base, génération immédiate...');
      shouldRefresh = true;
    } else {
      // Vérifier la date du produit le plus récent
      const mostRecentProduct = products[0];
      if (mostRecentProduct.lastUpdated) {
        const lastUpdate = new Date(mostRecentProduct.lastUpdated);
        const timeSinceUpdate = now - lastUpdate;
        
        if (timeSinceUpdate >= oneHourInMs) {
          console.log(`⏰ Produits obsolètes (${Math.round(timeSinceUpdate / (60 * 60 * 1000))}h), génération...`);
          shouldRefresh = true;
        } else {
          const remainingMinutes = Math.round((oneHourInMs - timeSinceUpdate) / (60 * 1000));
          console.log(`✅ Produits en cache (actualisation dans ${remainingMinutes}min)`);
          cacheMessage = `Produits chargés depuis le cache. Prochaine actualisation dans ${remainingMinutes}min`;
        }
      } else {
        // Si pas de date, considérer comme obsolète
        shouldRefresh = true;
      }
    }
    
    // Générer seulement si nécessaire (pas de cache valide) OU si force=true
    if (shouldRefresh) {
      try {
        console.log('🔄 Génération de 50 nouveaux produits (cache ignoré)...');
        // Supprimer les anciens produits généraux avant de générer (pas les St Valentin)
        await WinningProduct.deleteMany({ 
          $or: [
            { specialEvent: { $exists: false } },
            { specialEvent: '' },
            { specialEvent: { $ne: 'saint-valentin' } }
          ]
        });
        await refreshSuccessRadar();
        products = await WinningProduct.find({ 
          $or: [
            { specialEvent: { $exists: false } },
            { specialEvent: '' },
            { specialEvent: { $ne: 'saint-valentin' } }
          ]
        })
          .sort({ lastUpdated: -1, createdAt: -1 })
          .limit(50)
          .lean();
        console.log(`✅ ${products.length} produits générés et enregistrés en base avec succès`);
      } catch (err) {
        console.error('❌ Erreur génération produits:', err.message);
        // En cas d'erreur, essayer de retourner les produits en cache s'ils existent
        products = await WinningProduct.find({ 
          $or: [
            { specialEvent: { $exists: false } },
            { specialEvent: '' },
            { specialEvent: { $ne: 'saint-valentin' } }
          ]
        })
          .sort({ lastUpdated: -1, createdAt: -1 })
          .limit(50)
          .lean();
        
        if (!products.length) {
          return res.json({ 
            products: [], 
            message: 'Aucun produit disponible. Génération en cours...',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
          });
        }
      }
    } else {
      console.log(`📦 Retour des ${products.length} produits depuis le cache (pas de nouvelle génération)`);
    }

    if (!products.length) {
      return res.json({ products: [], message: 'Aucun produit disponible pour le moment' });
    }

    if (req.user?.status === 'blocked') {
      return res.status(403).json({ error: 'Accès refusé. Compte bloqué.' });
    }

    if (req.user?.status === 'active') {
      return res.json({ 
        products,
        message: cacheMessage || null,
        fromCache: !shouldRefresh
      });
    }

    // Comptes pending : renvoyer version floutée
    const blurred = products.map(blurProduct);
    return res.json({
      products: blurred,
      message: 'Active ton compte pour débloquer les données complètes',
      fromCache: !shouldRefresh
    });
  } catch (error) {
    console.error('❌ Erreur récupération Success Radar:', error);
    res.status(500).json({ error: 'Impossible de récupérer les produits' });
  }
});

// Route pour générer et récupérer les produits St Valentin
console.log('💝 Route /valentine-winners enregistrée');
router.get('/valentine-winners', authenticate, async (req, res) => {
  console.log('💝 Route /valentine-winners appelée');
  console.log('💝 User:', req.user ? { id: req.user._id, status: req.user.status } : 'non authentifié');
  try {
    // Vérifier si des produits St Valentin existent
    let valentineProducts = await WinningProduct.find({ specialEvent: 'saint-valentin' })
      .sort({ lastUpdated: -1, createdAt: -1 })
      .lean();
    
    const now = new Date();
    const twentyFourHoursInMs = 24 * 60 * 60 * 1000; // 24 heures pour St Valentin
    
    // Forcer la génération si paramètre force=true ou cache=false dans la query
    const forceRefresh = req.query.force === 'true' || req.query.force === '1' || req.query.cache === 'false';
    
    // Si aucun produit St Valentin OU si le dernier a plus de 24h, générer
    let shouldRefresh = false;
    let cacheMessage = null;
    
    if (forceRefresh) {
      console.log('💝 Régénération forcée St Valentin demandée (cache ignoré)');
      shouldRefresh = true;
    } else if (!valentineProducts.length) {
      console.log('💝 Aucun produit St Valentin en base, génération immédiate...');
      shouldRefresh = true;
    } else {
      // Vérifier la date du produit St Valentin le plus récent
      const mostRecentValentine = valentineProducts[0];
      if (mostRecentValentine.lastUpdated) {
        const lastUpdate = new Date(mostRecentValentine.lastUpdated);
        const timeSinceUpdate = now - lastUpdate;
        
        if (timeSinceUpdate >= twentyFourHoursInMs) {
          console.log(`💝 Produits St Valentin obsolètes (${Math.round(timeSinceUpdate / (60 * 60 * 1000))}h), génération...`);
          shouldRefresh = true;
        } else {
          const remainingHours = Math.round((twentyFourHoursInMs - timeSinceUpdate) / (60 * 60 * 1000));
          console.log(`💝 Produits St Valentin en cache (actualisation dans ${remainingHours}h)`);
          cacheMessage = `Produits St Valentin chargés depuis le cache. Prochaine actualisation dans ${remainingHours}h`;
        }
      } else {
        shouldRefresh = true;
      }
    }
    
    // Générer seulement si nécessaire OU si force=true
    if (shouldRefresh) {
      try {
        console.log('💝 Génération de nouveaux produits St Valentin via OpenAI (cache ignoré)...');
        // Supprimer les anciens produits St Valentin avant de générer
        await WinningProduct.deleteMany({ specialEvent: 'saint-valentin' });
        await refreshValentineProducts();
        valentineProducts = await WinningProduct.find({ specialEvent: 'saint-valentin' })
          .sort({ lastUpdated: -1, createdAt: -1 })
          .lean();
        console.log(`💝 ${valentineProducts.length} produits St Valentin générés et enregistrés avec succès`);
      } catch (err) {
        console.error('❌ Erreur génération produits St Valentin:', err.message);
        // En cas d'erreur, essayer de retourner les produits en cache s'ils existent
        valentineProducts = await WinningProduct.find({ specialEvent: 'saint-valentin' })
          .sort({ lastUpdated: -1, createdAt: -1 })
          .lean();
        
        if (!valentineProducts.length) {
          return res.json({ 
            products: [], 
            message: 'Aucun produit St Valentin disponible. Génération en cours...',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
          });
        }
      }
    } else {
      console.log(`💝 Retour des ${valentineProducts.length} produits St Valentin depuis le cache`);
    }

    if (!valentineProducts.length) {
      return res.json({ products: [], message: 'Aucun produit St Valentin disponible pour le moment' });
    }

    if (req.user?.status === 'blocked') {
      return res.status(403).json({ error: 'Accès refusé. Compte bloqué.' });
    }

    if (req.user?.status === 'active') {
      return res.json({ 
        products: valentineProducts,
        message: cacheMessage || null,
        fromCache: !shouldRefresh
      });
    }

    // Comptes pending : renvoyer version floutée
    const blurred = valentineProducts.map(blurProduct);
    return res.json({
      products: blurred,
      message: 'Active ton compte pour débloquer les données complètes',
      fromCache: !shouldRefresh
    });
  } catch (error) {
    console.error('❌ Erreur récupération produits St Valentin:', error);
    res.status(500).json({ error: 'Impossible de récupérer les produits St Valentin' });
  }
});

// Route pour forcer la régénération des produits (admin)
router.post('/regenerate-products', authenticate, async (req, res) => {
  try {
    console.log('🔄 Régénération forcée des produits demandée...');
    
    // Vérifier que l'utilisateur est admin ou actif
    if (req.user?.status !== 'active' && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé. Compte actif requis.' });
    }

    // Supprimer tous les anciens produits
    await WinningProduct.deleteMany({});
    console.log('🗑️ Anciens produits supprimés');

    // Générer de nouveaux produits
    await refreshSuccessRadar();
    const products = await WinningProduct.find({})
      .sort({ lastUpdated: -1, createdAt: -1 })
      .limit(50)
      .lean();

    console.log(`✅ ${products.length} nouveaux produits générés`);

    return res.json({
      success: true,
      message: `${products.length} produits générés avec succès`,
      productsCount: products.length
    });
  } catch (error) {
    console.error('❌ Erreur régénération produits:', error);
    res.status(500).json({ error: 'Impossible de régénérer les produits', details: error.message });
  }
});

// Route pour forcer la régénération des produits St Valentin (admin)
router.post('/regenerate-valentine', authenticate, async (req, res) => {
  try {
    console.log('💝 Régénération forcée des produits St Valentin demandée...');
    
    // Vérifier que l'utilisateur est admin ou actif
    if (req.user?.status !== 'active' && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé. Compte actif requis.' });
    }

    // Supprimer tous les anciens produits St Valentin
    await WinningProduct.deleteMany({ specialEvent: 'saint-valentin' });
    console.log('🗑️ Anciens produits St Valentin supprimés');

    // Générer de nouveaux produits St Valentin
    await refreshValentineProducts();
    const valentineProducts = await WinningProduct.find({ specialEvent: 'saint-valentin' })
      .sort({ lastUpdated: -1, createdAt: -1 })
      .lean();

    console.log(`💝 ${valentineProducts.length} nouveaux produits St Valentin générés`);

    return res.json({
      success: true,
      message: `${valentineProducts.length} produits St Valentin générés avec succès`,
      productsCount: valentineProducts.length
    });
  } catch (error) {
    console.error('❌ Erreur régénération produits St Valentin:', error);
    res.status(500).json({ error: 'Impossible de régénérer les produits St Valentin', details: error.message });
  }
});

export default router;


import express from 'express';
import { authenticate } from '../middleware/auth.js';
import WinningProduct from '../models/WinningProduct.js';
import { refreshSuccessRadar } from '../services/successRadarCron.js';

const router = express.Router();

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
    // Vérifier si des produits existent et leur date de mise à jour
    let products = await WinningProduct.find({})
      .sort({ lastUpdated: -1, createdAt: -1 })
      .limit(50)
      .lean();
    
    const now = new Date();
    const sixHoursInMs = 6 * 60 * 60 * 1000; // 6 heures en millisecondes
    
    // Si aucun produit OU si le dernier produit a plus de 6h, générer
    let shouldRefresh = false;
    let cacheMessage = null;
    
    if (!products.length) {
      console.log('⚠️ Aucun produit en base, génération immédiate...');
      shouldRefresh = true;
    } else {
      // Vérifier la date du produit le plus récent
      const mostRecentProduct = products[0];
      if (mostRecentProduct.lastUpdated) {
        const lastUpdate = new Date(mostRecentProduct.lastUpdated);
        const timeSinceUpdate = now - lastUpdate;
        
        if (timeSinceUpdate >= sixHoursInMs) {
          console.log(`⏰ Produits obsolètes (${Math.round(timeSinceUpdate / (60 * 60 * 1000))}h), génération...`);
          shouldRefresh = true;
        } else {
          const remainingHours = Math.round((sixHoursInMs - timeSinceUpdate) / (60 * 60 * 1000));
          const remainingMinutes = Math.round((sixHoursInMs - timeSinceUpdate) / (60 * 1000));
          console.log(`✅ Produits en cache (actualisation dans ${remainingHours}h)`);
          cacheMessage = `Produits chargés depuis le cache. Prochaine actualisation dans ${remainingHours}h`;
        }
      } else {
        // Si pas de date, considérer comme obsolète
        shouldRefresh = true;
      }
    }
    
    // Générer seulement si nécessaire (pas de cache valide)
    if (shouldRefresh) {
      try {
        console.log('🔄 Génération de 50 nouveaux produits...');
        await refreshSuccessRadar();
        products = await WinningProduct.find({})
          .sort({ lastUpdated: -1, createdAt: -1 })
          .limit(50)
          .lean();
        console.log(`✅ ${products.length} produits générés et enregistrés en base avec succès`);
      } catch (err) {
        console.error('❌ Erreur génération produits:', err.message);
        // En cas d'erreur, essayer de retourner les produits en cache s'ils existent
        products = await WinningProduct.find({})
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

export default router;


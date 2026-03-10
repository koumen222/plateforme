import express from 'express';
import Visit from '../models/Visit.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';

const router = express.Router();

/**
 * Enregistrer une nouvelle visite
 * POST /api/visits/track
 */
router.post('/track', async (req, res) => {
  try {
    const { 
      country, 
      countryCode, 
      city, 
      region, 
      path,
      referrer,
      sessionId 
    } = req.body;

    // Récupérer l'IP depuis les headers (Railway, Cloudflare, etc.)
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
               req.headers['x-real-ip'] || 
               req.connection?.remoteAddress || 
               req.socket?.remoteAddress ||
               'unknown';

    // Récupérer le user-agent
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Récupérer l'ID utilisateur si authentifié
    const userId = req.user?._id || null;

    const visit = new Visit({
      ip,
      country: country || 'Unknown',
      countryCode: countryCode || null,
      city: city || null,
      region: region || null,
      userAgent,
      referrer: referrer || null,
      path: path || '/',
      userId,
      sessionId: sessionId || null
    });

    await visit.save();

    res.status(201).json({ 
      success: true, 
      message: 'Visite enregistrée',
      visitId: visit._id 
    });
  } catch (error) {
    console.error('Erreur enregistrement visite:', error);
    res.status(500).json({ 
      error: 'Erreur lors de l\'enregistrement de la visite',
      details: error.message 
    });
  }
});

/**
 * Obtenir les statistiques de visites par pays
 * GET /api/visits/stats
 * Requiert authentification admin
 */
router.get('/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const { period = '30' } = req.query; // Par défaut 30 derniers jours
    const days = parseInt(period, 10);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Statistiques par pays
    const statsByCountry = await Visit.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$country',
          countryCode: { $first: '$countryCode' },
          count: { $sum: 1 },
          uniqueIPs: { $addToSet: '$ip' }
        }
      },
      {
        $project: {
          country: '$_id',
          countryCode: 1,
          visits: '$count',
          uniqueVisitors: { $size: '$uniqueIPs' }
        }
      },
      {
        $sort: { visits: -1 }
      }
    ]);

    // Statistiques globales
    const totalVisits = await Visit.countDocuments({
      createdAt: { $gte: startDate }
    });

    const uniqueVisitors = await Visit.distinct('ip', {
      createdAt: { $gte: startDate }
    });

    // Visites par jour (derniers 30 jours)
    const visitsByDay = await Visit.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          date: '$_id',
          visits: '$count'
        }
      }
    ]);

    res.json({
      success: true,
      period: days,
      totalVisits,
      uniqueVisitors: uniqueVisitors.length,
      statsByCountry,
      visitsByDay
    });
  } catch (error) {
    console.error('Erreur récupération statistiques:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des statistiques',
      details: error.message 
    });
  }
});

/**
 * Obtenir toutes les visites récentes
 * GET /api/visits/recent
 * Requiert authentification admin
 */
router.get('/recent', authenticate, requireAdmin, async (req, res) => {
  try {
    const { limit = 100, page = 1 } = req.query;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const visits = await Visit.find()
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10))
      .skip(skip)
      .select('ip country countryCode city path createdAt userAgent')
      .lean();

    const total = await Visit.countDocuments();

    res.json({
      success: true,
      visits,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / parseInt(limit, 10))
      }
    });
  } catch (error) {
    console.error('Erreur récupération visites récentes:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des visites',
      details: error.message 
    });
  }
});

export default router;

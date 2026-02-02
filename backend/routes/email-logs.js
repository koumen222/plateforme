import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';
import { getEmailLogs, resendFailedEmails, markAsSpam } from '../services/emailService.js';
import EmailLog from '../models/EmailLog.js';

const router = express.Router();

router.use(authenticate);
router.use(requireAdmin);

/**
 * GET /api/email-logs
 * Liste tous les emails envoyés avec filtres et statistiques
 */
router.get('/', async (req, res) => {
  try {
    const {
      campaignId,
      status,
      email,
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const result = await getEmailLogs({
      campaignId,
      status,
      email,
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder
    });
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Erreur récupération email logs:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la récupération des logs',
      details: error.message 
    });
  }
});

/**
 * GET /api/email-logs/stats
 * Statistiques globales des emails
 */
router.get('/stats', async (req, res) => {
  try {
    const { campaignId, dateFrom, dateTo } = req.query;
    
    const matchStage = {};
    if (campaignId) matchStage.campaignId = new mongoose.Types.ObjectId(campaignId);
    if (dateFrom || dateTo) {
      matchStage.createdAt = {};
      if (dateFrom) matchStage.createdAt.$gte = new Date(dateFrom);
      if (dateTo) matchStage.createdAt.$lte = new Date(dateTo);
    }
    
    const stats = await EmailLog.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          sent: { $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] } },
          delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
          opened: { $sum: { $cond: [{ $eq: ['$status', 'opened'] }, 1, 0] } },
          clicked: { $sum: { $cond: [{ $eq: ['$status', 'clicked'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
          bounced: { $sum: { $cond: [{ $eq: ['$status', 'bounced'] }, 1, 0] } },
          spam: { $sum: { $cond: [{ $eq: ['$status', 'spam'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } }
        }
      }
    ]);
    
    // Statistiques par jour
    const dailyStats = await EmailLog.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { 
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          total: { $sum: 1 },
          sent: { $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] } },
          opened: { $sum: { $cond: [{ $eq: ['$status', 'opened'] }, 1, 0] } },
          clicked: { $sum: { $cond: [{ $eq: ['$status', 'clicked'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 30 }
    ]);
    
    // Top des emails avec le plus d'ouvertures
    const topOpened = await EmailLog.find({ status: 'opened' })
      .populate('campaignId', 'name subject')
      .sort({ openedAt: -1 })
      .limit(10)
      .lean();
    
    res.json({
      success: true,
      stats: stats[0] || {
        total: 0, sent: 0, delivered: 0, opened: 0, 
        clicked: 0, failed: 0, bounced: 0, spam: 0, pending: 0
      },
      dailyStats,
      topOpened
    });
  } catch (error) {
    console.error('Erreur récupération stats:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la récupération des statistiques' 
    });
  }
});

/**
 * GET /api/email-logs/:id
 * Détails d'un email spécifique
 */
router.get('/:id', async (req, res) => {
  try {
    const log = await EmailLog.findById(req.params.id)
      .populate('campaignId', 'name subject content')
      .populate('subscriberId', 'name email')
      .lean();
    
    if (!log) {
      return res.status(404).json({ 
        success: false,
        error: 'Log non trouvé' 
      });
    }
    
    res.json({
      success: true,
      log
    });
  } catch (error) {
    console.error('Erreur récupération log:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la récupération du log' 
    });
  }
});

/**
 * POST /api/email-logs/resend
 * Renvoie les emails en échec
 */
router.post('/resend', async (req, res) => {
  try {
    const { campaignId, maxAge = 24, limit = 100 } = req.body;
    
    if (!campaignId) {
      return res.status(400).json({ 
        success: false,
        error: 'campaignId requis' 
      });
    }
    
    const result = await resendFailedEmails(campaignId, { maxAge, limit });
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Erreur renvoi emails:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors du renvoi',
      details: error.message 
    });
  }
});

/**
 * POST /api/email-logs/:id/mark-spam
 * Marque un email comme spam
 */
router.post('/:id/mark-spam', async (req, res) => {
  try {
    const { reason } = req.body;
    
    const log = await markAsSpam(req.params.id, reason);
    
    if (!log) {
      return res.status(404).json({ 
        success: false,
        error: 'Log non trouvé' 
      });
    }
    
    res.json({
      success: true,
      message: 'Email marqué comme spam',
      log
    });
  } catch (error) {
    console.error('Erreur marquage spam:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors du marquage spam' 
    });
  }
});

/**
 * GET /api/email-logs/:id/resend-history
 * Historique des renvois d'un email
 */
router.get('/:id/resend-history', async (req, res) => {
  try {
    const log = await EmailLog.findById(req.params.id)
      .select('resendHistory email status')
      .lean();
    
    if (!log) {
      return res.status(404).json({ 
        success: false,
        error: 'Log non trouvé' 
      });
    }
    
    res.json({
      success: true,
      email: log.email,
      currentStatus: log.status,
      resendHistory: log.resendHistory || []
    });
  } catch (error) {
    console.error('Erreur récupération historique:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la récupération de l\'historique' 
    });
  }
});

/**
 * POST /api/email-logs/:id/resend-single
 * Renvoie un email spécifique
 */
router.post('/:id/resend-single', async (req, res) => {
  try {
    const log = await EmailLog.findById(req.params.id)
      .populate('campaignId')
      .populate('subscriberId');
    
    if (!log) {
      return res.status(404).json({ 
        success: false,
        error: 'Log non trouvé' 
      });
    }
    
    const campaign = log.campaignId;
    
    // Importer sendEmail dynamiquement pour éviter la dépendance circulaire
    const { sendEmail } = await import('../services/emailService.js');
    
    const result = await sendEmail({
      to: log.email,
      subject: campaign.subject,
      html: campaign.content.html,
      text: campaign.content.text,
      fromEmail: campaign.fromEmail,
      fromName: campaign.fromName,
      replyTo: campaign.replyTo,
      campaignId: campaign._id,
      subscriberId: log.subscriberId?._id,
      recipientName: log.subscriberId?.name || ''
    });
    
    // Mettre à jour l'historique
    log.resendHistory.push({
      attemptedAt: new Date(),
      status: 'success',
      error: null
    });
    await log.save();
    
    res.json({
      success: true,
      message: 'Email renvoyé avec succès',
      result
    });
  } catch (error) {
    console.error('Erreur renvoi email:', error);
    
    // Mettre à jour l'historique avec l'échec
    try {
      const log = await EmailLog.findById(req.params.id);
      if (log) {
        log.resendHistory.push({
          attemptedAt: new Date(),
          status: 'failed',
          error: error.message
        });
        await log.save();
      }
    } catch (e) {
      console.error('Erreur sauvegarde historique:', e);
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors du renvoi',
      details: error.message 
    });
  }
});

export default router;

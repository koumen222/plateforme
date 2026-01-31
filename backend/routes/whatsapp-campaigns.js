import express from 'express';
import WhatsAppCampaign from '../models/WhatsAppCampaign.js';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';
import { sendWhatsAppMessage, sendBulkWhatsApp, sendNewsletterCampaign } from '../services/whatsappService.js';

const router = express.Router();

router.use(authenticate);
router.use(requireAdmin);

router.get('/', async (req, res) => {
  try {
    const campaigns = await WhatsAppCampaign.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email')
      .lean();
    
    res.json({ success: true, campaigns });
  } catch (error) {
    console.error('Erreur récupération campagnes WhatsApp:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const campaign = await WhatsAppCampaign.findById(req.params.id)
      .populate('createdBy', 'name email')
      .lean();
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campagne non trouvée' });
    }
    
    res.json({ success: true, campaign });
  } catch (error) {
    console.error('Erreur récupération campagne:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération' });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      name,
      message,
      variants,
      recipients,
      scheduledAt,
      fromPhone
    } = req.body;
    
    // Générer un nom automatique si non fourni
    const campaignName = name || `Newsletter ${new Date().toLocaleDateString('fr-FR')} ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    
    // Vérifier qu'au moins un message ou une variante est fourni
    const hasMessage = message && message.trim();
    const hasVariants = variants && Array.isArray(variants) && variants.some(v => v && v.trim());
    
    if (!hasMessage && !hasVariants) {
      return res.status(400).json({ error: 'Au moins un message ou une variante doit être fourni' });
    }
    
    let recipientCount = 0;
    
    if (recipients?.type === 'all') {
      recipientCount = await User.countDocuments({ 
        $and: [
          {
            $or: [
              { phone: { $exists: true, $ne: '' } },
              { phoneNumber: { $exists: true, $ne: '' } }
            ]
          },
          { role: { $ne: 'admin' } }
        ]
      });
    } else if (recipients?.type === 'segment') {
      // Si c'est un tag de statut utilisateur (pending, active, blocked)
      if (['pending', 'active', 'blocked'].includes(recipients.segment)) {
        recipientCount = await User.countDocuments({ 
          $and: [
            {
              $or: [
                { phone: { $exists: true, $ne: '' } },
                { phoneNumber: { $exists: true, $ne: '' } }
              ]
            },
            {
              $or: [
                { status: recipients.segment },
                { accountStatus: recipients.segment }
              ]
            },
            { role: { $ne: 'admin' } }
          ]
        });
      }
    } else if (recipients?.type === 'list' && recipients.customPhones?.length) {
      recipientCount = recipients.customPhones.length;
    }
    
    const campaign = new WhatsAppCampaign({
      name: campaignName,
      message: hasMessage ? message.trim() : null,
      variants: hasVariants ? variants.filter(v => v && v.trim()) : [],
      recipients: {
        ...recipients,
        count: recipientCount
      },
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      status: scheduledAt ? 'scheduled' : 'draft',
      fromPhone: fromPhone || process.env.WHATSAPP_FROM_PHONE || '',
      createdBy: req.user._id
    });
    
    await campaign.save();
    
    res.status(201).json({
      success: true,
      campaign: campaign.toObject()
    });
  } catch (error) {
    console.error('Erreur création campagne WhatsApp:', error);
    res.status(500).json({ error: 'Erreur lors de la création' });
  }
});

router.post('/:id/send', async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await WhatsAppCampaign.findById(id);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campagne non trouvée' });
    }
    
    if (campaign.status === 'sent') {
      return res.status(400).json({ error: 'Campagne déjà envoyée' });
    }
    
    let users = [];
    
    if (campaign.recipients.type === 'all') {
      users = await User.find({ 
        $or: [
          { phone: { $exists: true, $ne: '' } },
          { phoneNumber: { $exists: true, $ne: '' } }
        ],
        role: { $ne: 'admin' }
      }).select('phone phoneNumber name _id').lean();
    } else if (campaign.recipients.type === 'segment') {
      // Si c'est un tag de statut utilisateur (pending, active, blocked)
      if (['pending', 'active', 'blocked'].includes(campaign.recipients.segment)) {
        users = await User.find({ 
          $and: [
            {
              $or: [
                { phone: { $exists: true, $ne: '' } },
                { phoneNumber: { $exists: true, $ne: '' } }
              ]
            },
            {
              $or: [
                { status: campaign.recipients.segment },
                { accountStatus: campaign.recipients.segment }
              ]
            },
            { role: { $ne: 'admin' } }
          ]
        }).select('phone phoneNumber name _id').lean();
      }
    } else if (campaign.recipients.type === 'list' && campaign.recipients.customPhones?.length) {
      // Pour les listes personnalisées, chercher les utilisateurs correspondants dans la base
      const sanitizePhone = (phone) => {
        if (!phone) return '';
        return phone.toString().replace(/\D/g, '').trim();
      };
      
      const cleanedPhones = campaign.recipients.customPhones.map(p => sanitizePhone(p));
      
      // Chercher les utilisateurs avec ces numéros
      const foundUsers = await User.find({
        $or: [
          { phone: { $in: cleanedPhones } },
          { phoneNumber: { $in: cleanedPhones } }
        ],
        role: { $ne: 'admin' }
      }).select('phone phoneNumber name _id').lean();
      
      // Créer un map pour retrouver rapidement les utilisateurs par numéro
      const userMap = new Map();
      foundUsers.forEach(user => {
        const userPhone = sanitizePhone(user.phoneNumber || user.phone);
        if (userPhone) {
          userMap.set(userPhone, user);
        }
      });
      
      // Créer la liste des utilisateurs avec les numéros fournis
      users = campaign.recipients.customPhones.map(phone => {
        const cleaned = sanitizePhone(phone);
        const foundUser = userMap.get(cleaned);
        if (foundUser) {
          return foundUser;
        }
        // Si pas trouvé, créer un objet minimal avec le numéro
        return { phone: cleaned, phoneNumber: cleaned, name: null, _id: null };
      });
    }
    
    // Normaliser les numéros : utiliser phoneNumber en priorité, sinon phone
    // Et filtrer les utilisateurs sans numéro valide
    users = users
      .map(user => ({
        ...user,
        phone: (user.phoneNumber && user.phoneNumber.trim()) || (user.phone && user.phone.trim()) || null
      }))
      .filter(u => u.phone && u.phone.trim() !== '');
    
    if (users.length === 0) {
      return res.status(400).json({ 
        error: 'Aucun destinataire trouvé',
        details: 'Aucun utilisateur avec le tag sélectionné n\'a de numéro de téléphone valide.'
      });
    }
    
    console.log(`🚀 Démarrage envoi campagne WhatsApp "${campaign.name}" à ${users.length} destinataires`);
    
    campaign.status = 'sending';
    await campaign.save();
    
    // Déterminer si on utilise les variantes ou le message unique
    const useVariants = campaign.variants && campaign.variants.length > 0;
    const variants = useVariants ? campaign.variants : (campaign.message ? [campaign.message] : []);
    
    // Préparer les contacts avec le numéro normalisé et le lien approprié selon le segment
    const frontendUrl = process.env.FRONTEND_URL || 'https://safitech.shop';
    
    // Déterminer le lien selon le segment de la campagne
    let linkToUse = null;
    if (campaign.recipients.type === 'segment' && 
        (campaign.recipients.segment === 'blocked' || campaign.recipients.segment === 'pending')) {
      // Pour les non-actifs ou en attente : lien vers le profil pour récupérer le lien d'affiliation
      linkToUse = `${frontendUrl}/profil`;
    } else {
      // Pour les actifs : lien vers la page d'accueil
      linkToUse = `${frontendUrl}/`;
    }
    
    const contacts = users.map(user => {
      const phone = (user.phoneNumber && user.phoneNumber.trim()) || (user.phone && user.phone.trim());
      // Extraire le prénom du nom complet (premier mot)
      const firstName = user.name ? user.name.split(' ')[0] : null;
      
      return {
        to: phone,
        campaignId: campaign._id,
        userId: user._id || null,
        profileLink: linkToUse,
        firstName: firstName || ''
      };
    });
    
    try {
      console.log(`📱 Début envoi newsletter WhatsApp "${campaign.name}" à ${users.length} destinataires...`);
      console.log(`📋 Variantes disponibles: ${variants.length}`);
      
      // Utiliser sendNewsletterCampaign pour le rythme humain et les variantes
      const newsletterResults = await sendNewsletterCampaign(contacts, variants, (index, total, stats) => {
        // Log de progression tous les 10 messages
        if (index % 10 === 0) {
          console.log(`📊 Progression: ${index}/${total} | ✅ ${stats.sent} | ⚠️ ${stats.skipped} | ❌ ${stats.failed}`);
        }
      });
      
      const results = newsletterResults.results || [];
      
      const sent = results.filter(r => r.success);
      const failed = results.filter(r => !r.success && !r.skipped);
      const skipped = results.filter(r => r.skipped);
      
      // Vérification des logs
      const WhatsAppLog = (await import('../models/WhatsAppLog.js')).default;
      const logs = await WhatsAppLog.find({ campaignId: campaign._id }).lean();
      const confirmedSent = logs.filter(log => log.status === 'sent' || log.status === 'delivered').length;
      
      const stats = {
        total: newsletterResults.total || users.length,
        sent: newsletterResults.sent || sent.length,
        failed: newsletterResults.failed || failed.length,
        skipped: newsletterResults.skipped || skipped.length,
        confirmed: confirmedSent,
        quotaReached: newsletterResults.quotaReached || false,
        failedPhones: failed.map(f => ({ phone: f.phone, error: f.error }))
      };
      
      // Mettre à jour la campagne
      campaign.status = (newsletterResults.sent > 0 && !newsletterResults.quotaReached) ? 'sent' : 
                        (newsletterResults.quotaReached ? 'sending' : 'failed');
      campaign.sentAt = new Date();
      campaign.stats.sent = stats.sent;
      campaign.stats.failed = stats.failed;
      if (newsletterResults.quotaReached) {
        campaign.error = 'Campagne interrompue (quota atteint ou plage horaire dépassée)';
      } else if (failed.length > 0) {
        campaign.error = `${failed.length} message(s) échoué(s)`;
      }
      await campaign.save();
      
      console.log(`✅ Newsletter WhatsApp "${campaign.name}" envoyée:`);
      console.log(`   📊 Total destinataires: ${stats.total}`);
      console.log(`   ✅ Envoyés: ${stats.sent}`);
      console.log(`   ⚠️ Ignorés: ${stats.skipped}`);
      console.log(`   ✓ Confirmés dans logs: ${stats.confirmed}`);
      console.log(`   ❌ Échecs: ${stats.failed}`);
      if (stats.quotaReached) {
        console.log(`   ⏸️ Campagne interrompue (quota ou plage horaire)`);
      }
      
      // Récupérer les numéros des destinataires qui ont reçu le message
      const sentPhones = logs
        .filter(log => log.status === 'sent' || log.status === 'delivered')
        .map(log => log.phone)
        .filter(Boolean);
      
      res.json({
        success: true,
        message: `Newsletter envoyée: ${stats.sent}/${stats.total} messages`,
        stats,
        details: {
          sent: stats.sent,
          failed: stats.failed,
          skipped: stats.skipped,
          confirmed: confirmedSent,
          quotaReached: stats.quotaReached,
          failedPhones: stats.failedPhones,
          sentPhones: sentPhones
        }
      });
    } catch (error) {
      campaign.status = 'failed';
      campaign.error = error.message;
      await campaign.save();
      console.error(`❌ Erreur envoi campagne WhatsApp ${campaign.name}:`, error);
      res.status(500).json({ 
        error: 'Erreur lors de l\'envoi',
        details: error.message
      });
    }
  } catch (error) {
    console.error('Erreur envoi campagne WhatsApp:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi' });
  }
});

router.get('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await WhatsAppCampaign.findById(id).lean();
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campagne non trouvée' });
    }
    
    const WhatsAppLog = (await import('../models/WhatsAppLog.js')).default;
    const logs = await WhatsAppLog.find({ campaignId: id })
      .select('phone firstName messageSent status sentAt error')
      .sort({ sentAt: -1 })
      .lean();
    
    const sentLogs = logs.filter(log => log.status === 'sent' || log.status === 'delivered');
    const failedLogs = logs.filter(log => log.status === 'failed');
    const pendingLogs = logs.filter(log => log.status === 'pending');
    
    res.json({
      success: true,
      campaign: {
        _id: campaign._id,
        name: campaign.name,
        status: campaign.status,
        sentAt: campaign.sentAt,
        createdAt: campaign.createdAt
      },
      stats: {
        total: logs.length,
        sent: sentLogs.length,
        failed: failedLogs.length,
        pending: pendingLogs.length
      },
      sentMessages: sentLogs.map(log => ({
        phone: log.phone,
        firstName: log.firstName || '',
        message: log.messageSent || '',
        sentAt: log.sentAt
      })),
      failedMessages: failedLogs.map(log => ({
        phone: log.phone,
        firstName: log.firstName || '',
        error: log.error || 'Erreur inconnue',
        sentAt: log.sentAt
      }))
    });
  } catch (error) {
    console.error('Erreur récupération statut campagne:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération' });
  }
});

router.get('/:id/verify', async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await WhatsAppCampaign.findById(id);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campagne non trouvée' });
    }
    
    const WhatsAppLog = (await import('../models/WhatsAppLog.js')).default;
    const logs = await WhatsAppLog.find({ campaignId: id })
      .select('phone status sentAt messageId')
      .sort({ sentAt: -1 })
      .lean();
    
    const stats = {
      total: logs.length,
      sent: logs.filter(log => log.status === 'sent').length,
      delivered: logs.filter(log => log.status === 'delivered').length,
      read: logs.filter(log => log.status === 'read').length,
      failed: logs.filter(log => log.status === 'failed').length,
      confirmed: logs.filter(log => ['sent', 'delivered', 'read'].includes(log.status)).length
    };
    
    res.json({
      success: true,
      campaign: {
        _id: campaign._id,
        name: campaign.name,
        status: campaign.status,
        sentAt: campaign.sentAt
      },
      stats,
      logs: logs.map(log => ({
        phone: log.phone,
        status: log.status,
        sentAt: log.sentAt,
        messageId: log.messageId
      }))
    });
  } catch (error) {
    console.error('Erreur vérification campagne:', error);
    res.status(500).json({ error: 'Erreur lors de la vérification' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const campaign = await WhatsAppCampaign.findById(req.params.id);
    
    if (campaign && campaign.status === 'sent') {
      return res.status(400).json({ error: 'Impossible de supprimer une campagne envoyée' });
    }
    
    await WhatsAppCampaign.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Campagne supprimée' });
  } catch (error) {
    console.error('Erreur suppression campagne:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

export default router;

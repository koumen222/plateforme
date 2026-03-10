import express from 'express';
import WhatsAppCampaign from '../models/WhatsAppCampaign.js';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';
import { 
  sendWhatsAppMessage, 
  sendBulkWhatsApp, 
  sendNewsletterCampaign, 
  addSSEConnection,
  // 🆕 Fonctions anti-spam
  analyzeSpamRisk,
  validateMessageBeforeSend,
  monitorSpamMetrics
} from '../services/whatsappService.js';

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
    
    // 🆕 VALIDATION ANTI-SPAM des messages
    const messagesToValidate = hasMessage ? [message] : [];
    if (hasVariants) {
      messagesToValidate.push(...variants.filter(v => v && v.trim()));
    }
    
    const spamValidationResults = messagesToValidate.map(msg => ({
      message: msg.substring(0, 50) + '...',
      analysis: analyzeSpamRisk(msg),
      validated: validateMessageBeforeSend(msg, 'validation-campaign')
    }));
    
    // Vérifier si des messages sont rejetés
    const rejectedMessages = spamValidationResults.filter(r => !r.validated);
    if (rejectedMessages.length > 0) {
      return res.status(400).json({ 
        error: 'Certains messages sont rejetés pour risque de spam élevé',
        details: {
          rejected: rejectedMessages,
          recommendations: rejectedMessages.map(r => ({
            message: r.message,
            warnings: r.analysis.warnings,
            recommendations: r.analysis.recommendations
          }))
        }
      });
    }
    
    // Avertir si des messages sont à risque moyen
    const mediumRiskMessages = spamValidationResults.filter(r => r.analysis.risk === 'MEDIUM');
    if (mediumRiskMessages.length > 0) {
      console.warn('⚠️ Messages à risque moyen détectés:', mediumRiskMessages.map(r => r.message));
    }
    
    if (!recipients || !recipients.type) {
      return res.status(400).json({ error: 'Type de destinataires requis (all, segment, list)' });
    }
    
    // Valider la structure des recipients selon le type
    if (recipients.type === 'list') {
      if (!recipients.customPhones || !Array.isArray(recipients.customPhones)) {
        return res.status(400).json({ error: 'customPhones doit être un tableau pour le type "list"' });
      }
      
      // ✅ 5️⃣ Validations "list" plus strictes
      if (recipients.customPhones.length === 0) {
        return res.status(400).json({ error: 'customPhones ne peut pas être vide pour le type "list"' });
      }
      
      // Fonction de normalisation pour validation
      const normalizePhone = (phone) => {
        if (!phone) return '';
        let cleaned = phone.toString().replace(/\D/g, '').trim();
        
        // ✅ 2️⃣ Corriger le cas 00237699887766
        if (cleaned.startsWith('00')) {
          cleaned = cleaned.substring(2); // Enlever les "00"
        }
        
        // Gérer le préfixe pays (Cameroun 237)
        if (cleaned.length === 9 && cleaned.startsWith('6')) {
          return '237' + cleaned;
        }
        
        return cleaned;
      };
      
      // Valider et normaliser les numéros
      const validPhones = recipients.customPhones
        .map(phone => normalizePhone(phone))
        .filter(phone => phone.length >= 8); // Minimum 8 digits
      
      if (validPhones.length === 0) {
        return res.status(400).json({ 
          error: 'Aucun numéro valide trouvé dans customPhones',
          details: 'Les numéros doivent contenir au moins 8 chiffres'
        });
      }
      
      if (validPhones.length < recipients.customPhones.length) {
        console.warn(`⚠️ ${recipients.customPhones.length - validPhones.length} numéros invalides filtrés`);
      }
      
      // Mettre à jour recipients.count avec le nombre de numéros valides
      recipients.count = validPhones.length;
      console.log(`✅ Validation LIST: ${validPhones.length} numéros valides sur ${recipients.customPhones.length}`);
      
      // ✅ Stocker pour utilisation dans recipientCount
      validPhonesCount = validPhones.length;
    }
    
    let recipientCount = 0;
    let validPhonesCount = 0; // ✅ Déclarer avant pour utilisation partout
    
    if (recipients.type === 'segment' && !recipients.segment) {
      return res.status(400).json({ error: 'segment est requis pour le type "segment"' });
    }
    
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
      // ✅ Utiliser le nombre de numéros valides calculé dans la validation
      recipientCount = validPhonesCount || recipients.customPhones.length;
      console.log(`🔍 Debug LIST: validPhonesCount=${validPhonesCount}, recipients.customPhones.length=${recipients.customPhones.length}, recipientCount=${recipientCount}`);
    }
    
    // Vérifier que req.user existe
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }

    // Préparer les variants - s'assurer que c'est un tableau
    const finalVariants = hasVariants && Array.isArray(variants) 
      ? variants.filter(v => v && v.trim()) 
      : [];

    // Vérifier à nouveau qu'au moins un message ou une variante existe après filtrage
    if (!hasMessage && finalVariants.length === 0) {
      return res.status(400).json({ error: 'Au moins un message ou une variante doit être fourni' });
    }
    
    const campaign = new WhatsAppCampaign({
      name: campaignName,
      message: hasMessage ? message.trim() : null,
      variants: finalVariants,
      recipients: {
        ...recipients,
        count: recipientCount
      },
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      status: scheduledAt ? 'scheduled' : 'draft',
      fromPhone: fromPhone || process.env.WHATSAPP_FROM_PHONE || '',
      createdBy: req.user._id,
      // 🆕 Métadonnées anti-spam
      spamValidation: {
        validated: true,
        riskLevel: mediumRiskMessages.length > 0 ? 'MEDIUM' : 'LOW',
        validatedAt: new Date(),
        results: spamValidationResults
      }
    });
    
    await campaign.save();
    
    res.status(201).json({
      success: true,
      campaign: campaign.toObject(),
      spamValidation: {
        validated: true,
        riskLevel: mediumRiskMessages.length > 0 ? 'MEDIUM' : 'LOW',
        warnings: mediumRiskMessages.length,
        message: mediumRiskMessages.length > 0 
          ? `${mediumRiskMessages.length} message(s) à risque moyen détecté(s)` 
          : 'Tous les messages sont à faible risque'
      }
    });
  } catch (error) {
    console.error('Erreur création campagne WhatsApp:', error.message);
    console.error('   Stack:', error.stack);
    console.error('   Données reçues:', {
      name: req.body.name,
      hasMessage: !!(req.body.message && req.body.message.trim()),
      hasVariants: !!(req.body.variants && Array.isArray(req.body.variants) && req.body.variants.some(v => v && v.trim())),
      recipientsType: req.body.recipients?.type,
      userId: req.user?._id
    });
    
    // Si c'est une erreur de validation Mongoose, retourner les détails
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors || {}).map(err => err.message).join(', ');
      return res.status(400).json({ 
        error: 'Erreur de validation',
        details: validationErrors || error.message
      });
    }
    
    res.status(500).json({ 
      error: 'Erreur lors de la création de la campagne',
      details: error.message
    });
  }
});

router.post('/:id/send', async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await WhatsAppCampaign.findById(id);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campagne non trouvée' });
    }
    
    // ✅ 2️⃣ Logging de diagnostic côté envoi
    console.log('🔍 DIAGNOSTIC ENVOI CAMPAGNE:');
    console.log('   Type de recipients:', campaign.recipients?.type);
    console.log('   Segment:', campaign.recipients?.segment);
    console.log('   Longueur customPhones:', campaign.recipients?.customPhones?.length || 0);
    if (campaign.recipients?.customPhones?.length > 0) {
      console.log('   3-5 numéros exemples:', campaign.recipients.customPhones.slice(0, 5));
    }
    console.log('   Count:', campaign.recipients?.count);
    
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
      // ✅ 3️⃣ Logique "list" améliorée - ne pas dépendre de la DB Users
      console.log('📋 Traitement campagne type LIST');
      
      // ✅ 4️⃣ Fonction de normalisation uniforme
      const normalizePhone = (phone) => {
        if (!phone) return '';
        let cleaned = phone.toString().replace(/\D/g, '').trim();
        
        // ✅ 2️⃣ Corriger le cas 00237699887766
        if (cleaned.startsWith('00')) {
          cleaned = cleaned.substring(2); // Enlever les "00"
        }
        
        // Gérer le préfixe pays (Cameroun 237)
        if (cleaned.length === 9 && cleaned.startsWith('6')) {
          return '237' + cleaned;
        }
        
        return cleaned;
      };
      
      // Normaliser et filtrer les numéros valides
      const validPhones = campaign.recipients.customPhones
        .map(phone => normalizePhone(phone))
        .filter(phone => phone.length >= 8); // Minimum 8 digits
      
      console.log(`   ${validPhones.length} numéros valides sur ${campaign.recipients.customPhones.length}`);
      
      // ✅ 3️⃣ Construire les destinataires directement depuis customPhones
      users = validPhones.map(phone => ({
        phone: phone,
        phoneNumber: phone,
        name: null,
        _id: null
      }));
      
      console.log(`   ✅ Créé ${users.length} destinataires depuis customPhones`);
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
      let firstName = '';
      if (user.name && user.name.trim()) {
        // Prendre le premier mot et capitaliser la première lettre
        const nameParts = user.name.trim().split(/\s+/);
        if (nameParts.length > 0 && nameParts[0]) {
          firstName = nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1).toLowerCase();
        }
      }
      
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

router.get('/:id/stream', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await WhatsAppCampaign.findById(id).lean();
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campagne non trouvée' });
    }
    
    // Configurer les headers SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Désactiver le buffering pour Nginx
    res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'https://www.safitech.shop');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // Envoyer un message initial
    res.write(`event: connected\ndata: ${JSON.stringify({ campaignId: id, campaignName: campaign.name })}\n\n`);
    
    // Ajouter cette connexion au système SSE
    addSSEConnection(id, res);
    
    // Envoyer un heartbeat toutes les 30 secondes pour maintenir la connexion
    const heartbeatInterval = setInterval(() => {
      try {
        res.write(`event: heartbeat\ndata: ${JSON.stringify({ timestamp: new Date().toISOString() })}\n\n`);
      } catch (error) {
        clearInterval(heartbeatInterval);
      }
    }, 30000);
    
    // Nettoyer quand la connexion se ferme
    req.on('close', () => {
      clearInterval(heartbeatInterval);
      res.end();
    });
  } catch (error) {
    console.error('Erreur stream campagne:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion au stream' });
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

// 🆕 Route pour le monitoring anti-spam
router.get('/:id/anti-spam-monitoring', async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await WhatsAppCampaign.findById(id).lean();
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campagne non trouvée' });
    }
    
    // Obtenir les métriques anti-spam
    const monitoring = await monitorSpamMetrics(id);
    
    // Analyser les messages de la campagne
    const messages = campaign.variants && campaign.variants.length > 0 
      ? campaign.variants 
      : (campaign.message ? [campaign.message] : []);
    
    const messageAnalysis = messages.map(msg => ({
      message: msg.substring(0, 100) + (msg.length > 100 ? '...' : ''),
      analysis: analyzeSpamRisk(msg),
      validated: validateMessageBeforeSend(msg, 'monitoring-check')
    }));
    
    // Statistiques globales
    const stats = {
      campaign: {
        id: campaign._id,
        name: campaign.name,
        status: campaign.status,
        createdAt: campaign.createdAt,
        sentAt: campaign.sentAt
      },
      messages: {
        total: messages.length,
        highRisk: messageAnalysis.filter(m => m.analysis.risk === 'HIGH').length,
        mediumRisk: messageAnalysis.filter(m => m.analysis.risk === 'MEDIUM').length,
        lowRisk: messageAnalysis.filter(m => m.analysis.risk === 'LOW').length,
        validated: messageAnalysis.filter(m => m.validated).length
      },
      performance: monitoring.metrics || {},
      alerts: monitoring.alerts || [],
      recommendation: monitoring.recommendation || {}
    };
    
    // Score global de santé anti-spam
    const healthScore = calculateAntiSpamHealthScore(stats);
    stats.healthScore = healthScore;
    
    res.json({
      success: true,
      stats,
      messageAnalysis,
      healthScore,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Erreur monitoring anti-spam:', error);
    res.status(500).json({ error: 'Erreur lors du monitoring anti-spam' });
  }
});

/**
 * Calcule un score de santé anti-spam (0-100)
 */
const calculateAntiSpamHealthScore = (stats) => {
  let score = 100;
  
  // Pénalité pour messages à haut risque
  if (stats.messages.highRisk > 0) {
    score -= stats.messages.highRisk * 30;
  }
  
  // Pénalité pour messages à risque moyen
  if (stats.messages.mediumRisk > 0) {
    score -= stats.messages.mediumRisk * 10;
  }
  
  // Pénalité pour taux de livraison faible
  if (stats.performance.delivery_rate < 0.95) {
    score -= (0.95 - stats.performance.delivery_rate) * 100;
  }
  
  // Pénalité pour taux d'échec élevé
  if (stats.performance.failure_rate > 0.05) {
    score -= stats.performance.failure_rate * 50;
  }
  
  // Bonus pour bonne performance
  if (stats.performance.delivery_rate > 0.98) {
    score += 5;
  }
  
  if (stats.performance.read_rate > 0.50) {
    score += 5;
  }
  
  return Math.max(0, Math.min(100, Math.round(score)));
};

export default router;

// 🆕 Route pour l'aperçu/envoi à une seule personne
router.post('/preview-send', async (req, res) => {
  try {
    const { 
      message, 
      phoneNumber, 
      userId, 
      firstName
    } = req.body;
    
    // ✅ Générer previewId unique
    const previewId = 'preview-' + Date.now();
    
    // Validation des champs requis
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Le message est requis' });
    }
    
    if (!phoneNumber || !phoneNumber.trim()) {
      return res.status(400).json({ error: 'Le numéro de téléphone est requis' });
    }
    
    // 🆕 VALIDATION ANTI-SPAM du message
    const analysis = analyzeSpamRisk(message);
    const isValid = validateMessageBeforeSend(message, userId || 'preview-user');
    
    if (!isValid) {
      return res.status(400).json({ 
        error: 'Message rejeté pour risque de spam élevé',
        analysis: {
          risk: analysis.risk,
          score: analysis.score,
          warnings: analysis.warnings,
          recommendations: analysis.recommendations
        }
      });
    }
    
    // Nettoyer et valider le numéro
    const cleanedPhone = phoneNumber.replace(/\D/g, '').trim();
    if (!cleanedPhone || cleanedPhone.length < 8) {
      return res.status(400).json({ error: 'Numéro de téléphone invalide' });
    }
    
    // Vérifier si le numéro commence par un indicatif pays
    const countryCodes = ['237', '221', '229', '226', '225', '223', '241', '242', '33', '1', '212', '213', '216', '20', '234', '254', '27'];
    const hasValidCountryCode = countryCodes.some(code => cleanedPhone.startsWith(code));
    
    if (!hasValidCountryCode) {
      return res.status(400).json({ 
        error: 'Numéro invalide - doit commencer par un indicatif pays valide (ex: 237 pour le Cameroun)' 
      });
    }
    
    console.log(`📱 Envoi d\'aperçu WhatsApp à ${cleanedPhone} (${firstName || 'Inconnu'})`);
    console.log(`   Message: "${message.substring(0, 50)}..."`);
    console.log(`   Risque spam: ${analysis.risk} (score: ${analysis.score})`);
    
    // Préparer les données pour l'envoi
    const messageData = {
      to: cleanedPhone,
      message: message.trim(),
      campaignId: null,  // ✅ Pas de vraie campagne
      previewId,         // ✅ ID de preview unique
      userId: userId || null,
      firstName: firstName || null
    };
    
    // Envoyer le message en utilisant le système anti-spam
    try {
      const result = await sendWhatsAppMessage(messageData);
      
      console.log(`✅ Message d\'aperçu envoyé avec succès`);
      console.log(`   ID du message: ${result.messageId}`);
      console.log(`   ID du log: ${result.logId}`);
      
      res.json({
        success: true,
        message: 'Message d\'aperçu envoyé avec succès',
        result: {
          messageId: result.messageId,
          logId: result.logId,
          phone: cleanedPhone,
          firstName: firstName || null,
          sentAt: new Date(),
          spamAnalysis: {
            risk: analysis.risk,
            score: analysis.score,
            validated: true
          }
        }
      });
      
    } catch (error) {
      console.error(`❌ Erreur envoi aperçu: ${error.message}`);
      
      // Gérer les erreurs spécifiques
      if (error.message.includes('HTTP_466')) {
        return res.status(429).json({ 
          error: 'Limite de débit atteinte - veuillez réessayer dans quelques minutes',
          type: 'rate_limit',
          retryAfter: 60
        });
      }
      
      if (error.message.includes('numéro invalide')) {
        return res.status(400).json({ 
          error: 'Numéro de téléphone invalide ou non enregistré sur WhatsApp',
          type: 'invalid_phone'
        });
      }
      
      res.status(500).json({ 
        error: 'Erreur lors de l\'envoi du message d\'aperçu',
        details: error.message
      });
    }
    
  } catch (error) {
    console.error('Erreur générale aperçu WhatsApp:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de l\'envoi d\'aperçu',
      details: error.message
    });
  }
});

// 🆕 Route pour tester un message sans l'envoyer
router.post('/test-message', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Le message est requis' });
    }
    
    // Analyse anti-spam complète
    const analysis = analyzeSpamRisk(message);
    const isValid = validateMessageBeforeSend(message, 'test-user');
    
    res.json({
      success: true,
      message: 'Message testé avec succès',
      analysis: {
        risk: analysis.risk,
        score: analysis.score,
        warnings: analysis.warnings,
        recommendations: analysis.recommendations,
        validated: isValid,
        length: message.length,
        wordCount: message.split(/\s+/).length
      },
      verdict: isValid ? '✅ Message safe pour envoi' : '❌ Message à risque - modifications recommandées'
    });
    
  } catch (error) {
    console.error('Erreur test message:', error);
    res.status(500).json({ 
      error: 'Erreur lors du test du message',
      details: error.message
    });
  }
});

import express from 'express';
import EmailCampaign from '../models/EmailCampaign.js';
import Subscriber from '../models/Subscriber.js';
import EmailTemplate from '../models/EmailTemplate.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';
import { sendEmail, sendBulkEmails } from '../services/emailService.js';

const router = express.Router();

router.use(authenticate);
router.use(requireAdmin);

router.get('/', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [campaigns, total] = await Promise.all([
      EmailCampaign.find(filter)
        .populate('templateId', 'name')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      EmailCampaign.countDocuments(filter)
    ]);
    
    res.json({
      success: true,
      campaigns,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erreur récupération campagnes:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des campagnes' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const campaign = await EmailCampaign.findById(req.params.id)
      .populate('templateId')
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
      subject,
      templateId,
      content,
      recipients,
      scheduledAt,
      fromEmail,
      fromName,
      replyTo
    } = req.body;
    
    if (!name || !subject || !content?.html) {
      return res.status(400).json({ error: 'Nom, sujet et contenu HTML requis' });
    }
    
    let recipientCount = 0;
    
    if (recipients?.type === 'all') {
      recipientCount = await Subscriber.countDocuments({ status: 'active' });
    } else if (recipients?.type === 'segment') {
      // Si c'est un tag de statut utilisateur (pending, active, blocked)
      if (['pending', 'active', 'blocked'].includes(recipients.segment)) {
        const User = (await import('../models/User.js')).default;
        // Compter directement les utilisateurs avec ce statut
        recipientCount = await User.countDocuments({ 
          email: { $exists: true, $ne: '' },
          $or: [
            { status: recipients.segment },
            { accountStatus: recipients.segment }
          ]
        });
      } else {
        recipientCount = await Subscriber.countDocuments({ status: recipients.segment });
      }
    } else if (recipients?.type === 'list' && recipients.customEmails?.length) {
      recipientCount = recipients.customEmails.length;
    } else if (recipients?.type === 'single' && recipients.email) {
      recipientCount = 1;
    }
    
    const campaign = new EmailCampaign({
      name,
      subject,
      templateId,
      content,
      recipients: {
        ...recipients,
        count: recipientCount
      },
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      status: scheduledAt ? 'scheduled' : 'draft',
      fromEmail: fromEmail || process.env.EMAIL_FROM || 'contact@infomania.store',
      fromName: fromName || 'Infomania',
      replyTo: replyTo || process.env.EMAIL_REPLY_TO || 'contact@infomania.store',
      createdBy: req.user._id
    });
    
    await campaign.save();
    
    res.status(201).json({
      success: true,
      campaign: campaign.toObject()
    });
  } catch (error) {
    console.error('Erreur création campagne:', error);
    res.status(500).json({ error: 'Erreur lors de la création' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await EmailCampaign.findById(id);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campagne non trouvée' });
    }
    
    if (campaign.status === 'sent') {
      return res.status(400).json({ error: 'Campagne déjà envoyée' });
    }
    
    const {
      name,
      subject,
      templateId,
      content,
      recipients,
      scheduledAt,
      status,
      fromEmail,
      fromName,
      replyTo
    } = req.body;
    
    if (name) campaign.name = name;
    if (subject) campaign.subject = subject;
    if (templateId !== undefined) campaign.templateId = templateId;
    if (content) campaign.content = content;
    if (recipients) {
      let recipientCount = 0;
      if (recipients.type === 'all') {
        recipientCount = await Subscriber.countDocuments({ status: 'active' });
      } else if (recipients.type === 'segment') {
        // Si c'est un tag de statut utilisateur (pending, active, blocked)
        if (['pending', 'active', 'blocked'].includes(recipients.segment)) {
          const User = (await import('../models/User.js')).default;
          // Compter directement les utilisateurs avec ce statut
          recipientCount = await User.countDocuments({ 
            email: { $exists: true, $ne: '' },
            $or: [
              { status: recipients.segment },
              { accountStatus: recipients.segment }
            ]
          });
        } else {
          recipientCount = await Subscriber.countDocuments({ status: recipients.segment });
        }
      } else if (recipients.type === 'list' && recipients.customEmails?.length) {
        recipientCount = recipients.customEmails.length;
      } else if (recipients.type === 'single' && recipients.email) {
        recipientCount = 1;
      }
      campaign.recipients = { ...recipients, count: recipientCount };
    }
    if (scheduledAt !== undefined) campaign.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
    if (status) campaign.status = status;
    if (fromEmail) campaign.fromEmail = fromEmail;
    if (fromName) campaign.fromName = fromName;
    if (replyTo) campaign.replyTo = replyTo;
    
    await campaign.save();
    
    res.json({
      success: true,
      campaign: campaign.toObject()
    });
  } catch (error) {
    console.error('Erreur mise à jour campagne:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  }
});

router.post('/:id/send', async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await EmailCampaign.findById(id);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campagne non trouvée' });
    }
    
    if (campaign.status === 'sent') {
      return res.status(400).json({ error: 'Campagne déjà envoyée' });
    }
    
    let subscribers = [];
    
    if (campaign.recipients.type === 'all') {
      subscribers = await Subscriber.find({ status: 'active' }).lean();
    } else if (campaign.recipients.type === 'segment') {
      // Si c'est un tag de statut utilisateur (pending, active, blocked)
      if (['pending', 'active', 'blocked'].includes(campaign.recipients.segment)) {
        const User = (await import('../models/User.js')).default;
        
        // Récupérer TOUS les utilisateurs avec le statut sélectionné
        const users = await User.find({ 
          email: { $exists: true, $ne: '' },
          $or: [
            { status: campaign.recipients.segment },
            { accountStatus: campaign.recipients.segment }
          ]
        }).select('email name status accountStatus').lean();
        
        console.log(`📧 Tag "${campaign.recipients.segment}": ${users.length} utilisateurs trouvés`);
        
        // Pour chaque utilisateur, s'assurer qu'il existe dans Subscriber
        let createdCount = 0;
        let reactivatedCount = 0;
        const subscriberPromises = users.map(async (user) => {
          const emailLower = user.email.toLowerCase().trim();
          
          // Validation email
          if (!emailLower || !/^\S+@\S+\.\S+$/.test(emailLower)) {
            console.warn(`⚠️ Email invalide ignoré: ${emailLower}`);
            return null;
          }
          
          try {
            // Vérifier si l'utilisateur existe déjà dans Subscriber
            let subscriber = await Subscriber.findOne({ email: emailLower }).lean();
            
            if (!subscriber) {
              // Créer l'entrée Subscriber si elle n'existe pas
              const newSubscriber = new Subscriber({
                email: emailLower,
                name: user.name || '',
                source: 'sync',
                status: 'active', // Toujours actif pour recevoir les emails
                subscribedAt: new Date()
              });
              await newSubscriber.save();
              subscriber = newSubscriber.toObject();
              createdCount++;
            } else if (subscriber.status !== 'active') {
              // Réactiver si nécessaire
              await Subscriber.findByIdAndUpdate(subscriber._id, { status: 'active' });
              subscriber.status = 'active';
              reactivatedCount++;
            }
            
            return {
              ...subscriber,
              email: emailLower,
              name: subscriber.name || user.name || ''
            };
          } catch (error) {
            console.error(`❌ Erreur traitement ${emailLower}:`, error.message);
            return null;
          }
        });
        
        const subscriberResults = await Promise.all(subscriberPromises);
        subscribers = subscriberResults.filter(s => s !== null);
        
        console.log(`📊 Tag "${campaign.recipients.segment}":`);
        console.log(`   👥 ${users.length} utilisateurs trouvés`);
        console.log(`   ✅ ${createdCount} subscribers créés`);
        console.log(`   🔄 ${reactivatedCount} subscribers réactivés`);
        console.log(`   📧 ${subscribers.length} destinataires finaux prêts`);
      } else {
        subscribers = await Subscriber.find({ status: campaign.recipients.segment }).lean();
      }
    } else if (campaign.recipients.type === 'list' && campaign.recipients.customEmails?.length) {
      subscribers = campaign.recipients.customEmails.map(email => ({ email, _id: null }));
    } else if (campaign.recipients.type === 'single' && campaign.recipients.email) {
      // Envoi à une seule personne
      subscribers = [{ email: campaign.recipients.email, _id: null, name: campaign.recipients.name || '' }];
    }
    
    if (subscribers.length === 0) {
      return res.status(400).json({ 
        error: 'Aucun destinataire trouvé',
        details: `Aucun utilisateur avec le tag "${campaign.recipients.segment || 'sélectionné'}" n'a été trouvé ou n'a d'email valide.`
      });
    }
    
    console.log(`🚀 Démarrage envoi campagne "${campaign.name}" à ${subscribers.length} destinataires`);
    
    campaign.status = 'sending';
    await campaign.save();
    
    // Envoi synchrone avec vérification
    const emails = subscribers.map(sub => ({
      to: sub.email,
      subject: campaign.subject,
      html: campaign.content.html,
      text: campaign.content.text,
      fromEmail: campaign.fromEmail,
      fromName: campaign.fromName,
      replyTo: campaign.replyTo,
      campaignId: campaign._id,
      subscriberId: sub._id,
      recipientName: sub.name || ''
    }));
    
    try {
      console.log(`📧 Début envoi campagne "${campaign.name}" à ${subscribers.length} destinataires...`);
      console.log(`📋 Premiers destinataires:`, subscribers.slice(0, 5).map(s => s.email).join(', '));
      
      const results = await sendBulkEmails(emails);
      
      const sent = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);
      
      // Vérification des logs pour confirmer l'envoi
      const EmailLog = (await import('../models/EmailLog.js')).default;
      const logs = await EmailLog.find({ campaignId: campaign._id }).lean();
      const confirmedSent = logs.filter(log => log.status === 'sent' || log.status === 'delivered' || log.status === 'opened').length;
      
      const stats = {
        total: subscribers.length,
        sent: sent.length,
        failed: failed.length,
        confirmed: confirmedSent,
        failedEmails: failed.map(f => ({ email: f.email, error: f.error }))
      };
      
      // Mettre à jour la campagne
      campaign.status = sent.length > 0 ? 'sent' : 'failed';
      campaign.sentAt = new Date();
      campaign.stats.sent = stats.sent;
      campaign.stats.failed = stats.failed;
      if (failed.length > 0) {
        campaign.error = `${failed.length} email(s) échoué(s)`;
      }
      await campaign.save();
      
      console.log(`✅ Campagne "${campaign.name}" envoyée:`);
      console.log(`   📊 Total destinataires: ${stats.total}`);
      console.log(`   ✅ Envoyés: ${stats.sent}`);
      console.log(`   ✓ Confirmés dans logs: ${stats.confirmed}`);
      console.log(`   ❌ Échecs: ${stats.failed}`);
      
      if (failed.length > 0) {
        console.warn(`⚠️ Emails en échec (${failed.length}):`, failed.slice(0, 10).map(f => f.email).join(', '));
        if (failed.length > 10) {
          console.warn(`   ... et ${failed.length - 10} autres`);
        }
      }
      
      // Vérification finale : s'assurer que tous les destinataires ont bien reçu un email
      const finalLogs = await EmailLog.find({ campaignId: campaign._id }).lean();
      const uniqueEmailsSent = new Set(finalLogs.map(log => log.email.toLowerCase()));
      const uniqueDestEmails = new Set(subscribers.map(s => s.email.toLowerCase()));
      
      const missingEmails = Array.from(uniqueDestEmails).filter(email => !uniqueEmailsSent.has(email));
      if (missingEmails.length > 0) {
        console.warn(`⚠️ ATTENTION: ${missingEmails.length} destinataires n'ont pas d'entrée dans les logs:`);
        console.warn(`   ${missingEmails.slice(0, 10).join(', ')}`);
      } else {
        console.log(`✅ Vérification: Tous les ${subscribers.length} destinataires ont une entrée dans les logs`);
      }
      
      res.json({
        success: true,
        message: `Campagne envoyée: ${stats.sent}/${stats.total} emails`,
        stats,
        details: {
          sent: sent.length,
          failed: failed.length,
          confirmed: confirmedSent,
          failedEmails: stats.failedEmails
        }
      });
    } catch (error) {
      campaign.status = 'failed';
      campaign.error = error.message;
      await campaign.save();
      console.error(`❌ Erreur envoi campagne ${campaign.name}:`, error);
      res.status(500).json({ 
        error: 'Erreur lors de l\'envoi',
        details: error.message
      });
    }
  } catch (error) {
    console.error('Erreur envoi campagne:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi' });
  }
});

router.get('/:id/verify', async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await EmailCampaign.findById(id);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campagne non trouvée' });
    }
    
    const EmailLog = (await import('../models/EmailLog.js')).default;
    const logs = await EmailLog.find({ campaignId: id }).lean();
    
    const stats = {
      total: logs.length,
      sent: logs.filter(log => log.status === 'sent').length,
      delivered: logs.filter(log => log.status === 'delivered').length,
      opened: logs.filter(log => log.status === 'opened').length,
      clicked: logs.filter(log => log.status === 'clicked').length,
      failed: logs.filter(log => log.status === 'failed').length,
      bounced: logs.filter(log => log.status === 'bounced').length,
      confirmed: logs.filter(log => ['sent', 'delivered', 'opened', 'clicked'].includes(log.status)).length
    };
    
    res.json({
      success: true,
      campaign: {
        _id: campaign._id,
        name: campaign.name,
        status: campaign.status,
        sentAt: campaign.sentAt
      },
      stats
    });
  } catch (error) {
    console.error('Erreur vérification campagne:', error);
    res.status(500).json({ error: 'Erreur lors de la vérification' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const campaign = await EmailCampaign.findById(req.params.id);
    
    if (campaign && campaign.status === 'sent') {
      return res.status(400).json({ error: 'Impossible de supprimer une campagne envoyée' });
    }
    
    await EmailCampaign.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Campagne supprimée' });
  } catch (error) {
    console.error('Erreur suppression campagne:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

export default router;

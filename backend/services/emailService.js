import { Resend } from 'resend';
import { v4 as uuidv4 } from 'uuid';
import EmailLog from '../models/EmailLog.js';
import { 
  generateAntiSpamHeaders, 
  validateSpamScore,
  formatSubject,
  htmlToText 
} from './emailFormatterService.js';

let resend = null;

const initEmailService = () => {
  const resendApiKey = process.env.RESEND_API_KEY;
  
  if (!resendApiKey) {
    console.warn('⚠️ RESEND_API_KEY non configuré - Les campagnes email ne seront pas disponibles');
    return;
  }
  
  try {
    resend = new Resend(resendApiKey);
    console.log('✅ Service email Resend configuré');
  } catch (error) {
    console.error('❌ Erreur configuration Resend:', error.message);
  }
};

const sendEmail = async ({ to, subject, html, text, fromEmail, fromName, replyTo, campaignId, subscriberId, recipientName = '', unsubscribeUrl = '' }) => {
  if (!resend) {
    throw new Error('Service email Resend non configuré');
  }
  
  // Formater le sujet pour éviter le spam
  const formattedSubject = formatSubject(subject);
  
  // Valider le score spam
  const spamCheck = validateSpamScore(html);
  if (spamCheck.risk === 'high') {
    console.warn('⚠️ Alerte: Contenu email avec risque spam élevé:', spamCheck.warnings);
  }
  
  // Remplacer les variables de substitution dans le HTML et le sujet
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
  const unsubToken = uuidv4();
  const finalUnsubscribeUrl = unsubscribeUrl || `${backendUrl}/api/subscribers/unsubscribe/${unsubToken}`;
  
  const replaceVariables = (content) => {
    if (!content) return content;
    return content
      .replace(/\{\{name\}\}/gi, recipientName || '')
      .replace(/\{\{email\}\}/gi, to || '')
      .replace(/\{\{unsubscribeUrl\}\}/gi, finalUnsubscribeUrl)
      .replace(/\{\{date\}\}/gi, new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }))
      .replace(/\{\{year\}\}/gi, new Date().getFullYear().toString())
      .replace(/\{\{fromName\}\}/gi, fromName || 'Infomania')
      .replace(/\{\{subject\}\}/gi, formattedSubject);
  };
  
  // Appliquer les variables au HTML et au sujet
  let finalHtml = replaceVariables(html);
  const finalSubject = replaceVariables(formattedSubject);
  
  // Auto-détection : si le contenu ne contient pas de balises HTML, 
  // convertir les retours à la ligne en <br> pour préserver le formatage
  const hasHtmlTags = /<[a-z][\s\S]*>/i.test(finalHtml);
  if (!hasHtmlTags) {
    // C'est du texte brut — convertir en HTML avec formatage préservé
    const htmlContent = finalHtml
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n\n/g, '</p><p style="margin: 0 0 16px 0; line-height: 1.6; color: #333;">')
      .replace(/\n/g, '<br>');
    
    finalHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 20px; background-color: #f9f9f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px 40px; border-radius: 8px;">
    <p style="margin: 0 0 16px 0; line-height: 1.6; color: #333;">${htmlContent}</p>
  </div>
</body>
</html>`;
    console.log('📝 Contenu texte brut détecté — auto-converti en HTML avec formatage');
  }
  
  const finalText = replaceVariables(text) || htmlToText(finalHtml);
  
  const emailLog = new EmailLog({
    campaignId,
    subscriberId,
    email: to,
    status: 'pending',
    tracking: {
      openToken: uuidv4(),
      clickToken: uuidv4()
    },
    unsubscribeToken: unsubToken
  });
  
  try {
    // Ajouter le pixel de tracking au HTML
    const trackingPixel = `<img src="${backendUrl}/api/email/track/open/${emailLog.tracking.openToken}" width="1" height="1" style="display:none;" />`;
    
    // Injecter le pixel avant </body> si présent, sinon à la fin
    if (finalHtml.includes('</body>')) {
      finalHtml = finalHtml.replace('</body>', `${trackingPixel}</body>`);
    } else {
      finalHtml = finalHtml + trackingPixel;
    }
    
    // Remplacer les liens par des liens de tracking
    const clickTrackingUrl = `${backendUrl}/api/email/track/click/${emailLog.tracking.clickToken}?url=`;
    const htmlWithClickTracking = finalHtml.replace(
      /href=["']([^"']+)["']/g,
      (match, url) => {
        if (url.startsWith('http') && !url.includes('/api/email/track/') && !url.includes('unsubscribe')) {
          return `href="${clickTrackingUrl}${encodeURIComponent(url)}"`;
        }
        return match;
      }
    );
    
    const from = fromName ? `${fromName} <${fromEmail}>` : `Ecomstarter <${fromEmail}>`;
    
    // Générer les headers anti-spam
    const antiSpamHeaders = generateAntiSpamHeaders({
      campaignId,
      subscriberId,
      listId: 'newsletter-main'
    });
    
    let retries = 0;
    const maxRetries = 3;
    let data = null;
    let error = null;
    
    while (retries <= maxRetries) {
      try {
        const result = await resend.emails.send({
          from,
          to,
          subject: finalSubject,
          html: htmlWithClickTracking,
          text: finalText,
          reply_to: replyTo || fromEmail,
          headers: {
            ...antiSpamHeaders,
            'X-Campaign-ID': campaignId?.toString() || '',
            'X-Open-Token': emailLog.tracking.openToken,
            'X-Click-Token': emailLog.tracking.clickToken
          }
        });
        
        error = result.error;
        data = result.data;
        
        if (error) {
          // Si c'est une erreur de rate limit, attendre et retry
          if (error.message && error.message.toLowerCase().includes('rate limit')) {
            if (retries < maxRetries) {
              const waitTime = (retries + 1) * 2000; // 2s, 4s, 6s
              console.warn(`⚠️ Rate limit pour ${to}, attente de ${waitTime}ms avant retry ${retries + 1}/${maxRetries}...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
              retries++;
              continue;
            }
          }
          
          // Erreur non récupérable ou max retries atteint
          emailLog.status = 'failed';
          emailLog.error = error.message || 'Erreur envoi Resend';
          emailLog.providerResponse = {
            error: error.message,
            code: error.name
          };
          await emailLog.save();
          throw new Error(error.message || 'Erreur envoi Resend');
        }
        
        // Succès, sortir de la boucle
        break;
      } catch (err) {
        // Gérer les exceptions (pas seulement les erreurs dans la réponse)
        if (err.message && err.message.toLowerCase().includes('rate limit')) {
          if (retries < maxRetries) {
            const waitTime = (retries + 1) * 2000;
            console.warn(`⚠️ Rate limit exception pour ${to}, attente de ${waitTime}ms avant retry ${retries + 1}/${maxRetries}...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            retries++;
            continue;
          }
        }
        // Autre erreur ou max retries atteint
        emailLog.status = 'failed';
        emailLog.error = err.message;
        await emailLog.save();
        throw err;
      }
    }
    
    // Vérifier que l'envoi a réussi
    if (error) {
      emailLog.status = 'failed';
      emailLog.error = error.message || 'Erreur envoi Resend';
      emailLog.providerResponse = {
        error: error.message,
        code: error.name
      };
      await emailLog.save();
      throw new Error(error.message || 'Erreur envoi Resend');
    }
    
    if (!data || !data.id) {
      emailLog.status = 'failed';
      emailLog.error = 'Aucune réponse de Resend';
      await emailLog.save();
      throw new Error('Aucune réponse de Resend');
    }
    
    emailLog.status = 'sent';
    emailLog.sentAt = new Date();
    emailLog.providerResponse = {
      id: data.id,
      message: 'Email envoyé via Resend',
      timestamp: new Date().toISOString()
    };
    
    await emailLog.save();
    
    console.log(`✅ Email envoyé à ${to} (ID: ${data.id})`);
    
    return { success: true, logId: emailLog._id, messageId: data.id };
  } catch (error) {
    if (emailLog.status !== 'failed') {
      emailLog.status = 'failed';
      emailLog.error = error.message;
      await emailLog.save();
    }
    
    console.error(`❌ Erreur envoi email à ${to}:`, error.message);
    throw error;
  }
};

const sendBulkEmails = async (emails) => {
  const results = [];
  
  // Resend limite à 2 requêtes par seconde
  // On envoie les emails séquentiellement avec un délai de 500ms entre chaque
  const delayBetweenEmails = 500; // 500ms = 2 emails par seconde max
  
  console.log(`📧 Envoi de ${emails.length} emails avec délai de ${delayBetweenEmails}ms entre chaque...`);
  
  for (let i = 0; i < emails.length; i++) {
    const emailData = emails[i];
    
    try {
      const result = await sendEmail(emailData);
      
      // Vérification supplémentaire : attendre un peu et vérifier le log
      await new Promise(resolve => setTimeout(resolve, 100));
      const EmailLog = (await import('../models/EmailLog.js')).default;
      const log = await EmailLog.findById(result.logId);
      
      if (log && log.status === 'sent') {
        results.push({ success: true, email: emailData.to, ...result, confirmed: true });
      } else {
        results.push({ success: true, email: emailData.to, ...result, confirmed: false });
      }
      
      // Afficher la progression tous les 10 emails
      if ((i + 1) % 10 === 0) {
        console.log(`   📊 Progression: ${i + 1}/${emails.length} emails envoyés`);
      }
    } catch (error) {
      // Gérer les erreurs de rate limiting avec retry
      if (error.message && error.message.includes('rate limit')) {
        console.warn(`⚠️ Rate limit détecté pour ${emailData.to}, attente de 2 secondes...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Retry une fois
        try {
          const retryResult = await sendEmail(emailData);
          const EmailLog = (await import('../models/EmailLog.js')).default;
          const log = await EmailLog.findById(retryResult.logId);
          if (log && log.status === 'sent') {
            results.push({ success: true, email: emailData.to, ...retryResult, confirmed: true });
          } else {
            results.push({ success: true, email: emailData.to, ...retryResult, confirmed: false });
          }
        } catch (retryError) {
          console.error(`❌ Erreur retry pour ${emailData.to}:`, retryError.message);
          results.push({ success: false, email: emailData.to, error: retryError.message });
        }
      } else {
        console.error(`❌ Erreur envoi à ${emailData.to}:`, error.message);
        results.push({ success: false, email: emailData.to, error: error.message });
      }
    }
    
    // Attendre entre chaque email (sauf pour le dernier)
    if (i < emails.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenEmails));
    }
  }
  
  // Vérification finale : compter les logs confirmés
  const EmailLog = (await import('../models/EmailLog.js')).default;
  const campaignId = emails[0]?.campaignId;
  if (campaignId) {
    await new Promise(resolve => setTimeout(resolve, 500)); // Attendre un peu pour que les logs soient sauvegardés
    const confirmedLogs = await EmailLog.countDocuments({ 
      campaignId, 
      status: { $in: ['sent', 'delivered', 'opened', 'clicked'] }
    });
    const failedLogs = await EmailLog.countDocuments({ 
      campaignId, 
      status: 'failed'
    });
    console.log(`📊 Vérification finale campagne ${campaignId}:`);
    console.log(`   ✅ ${confirmedLogs} emails confirmés dans les logs`);
    console.log(`   ❌ ${failedLogs} emails en échec`);
  }
  
  console.log(`✅ Envoi terminé: ${results.filter(r => r.success).length}/${emails.length} emails envoyés avec succès`);
  
  return results;
};

const trackEmailOpen = async (openToken) => {
  try {
    const log = await EmailLog.findOne({ 'tracking.openToken': openToken });
    if (log && log.status !== 'opened') {
      log.status = 'opened';
      log.openedAt = new Date();
      await log.save();
      
      // Mettre à jour les stats de la campagne
      if (log.campaignId) {
        const Campaign = (await import('../models/EmailCampaign.js')).default;
        await Campaign.findByIdAndUpdate(log.campaignId, {
          $inc: { 'stats.opened': 1 }
        });
      }
    }
  } catch (error) {
    console.error('Erreur tracking open:', error);
  }
};

const trackEmailClick = async (clickToken, url) => {
  try {
    const log = await EmailLog.findOne({ 'tracking.clickToken': clickToken });
    if (log && log.status !== 'clicked') {
      log.status = 'clicked';
      log.clickedAt = new Date();
      await log.save();
      
      // Mettre à jour les stats de la campagne
      if (log.campaignId) {
        const Campaign = (await import('../models/EmailCampaign.js')).default;
        await Campaign.findByIdAndUpdate(log.campaignId, {
          $inc: { 'stats.clicked': 1 }
        });
      }
    }
  } catch (error) {
    console.error('Erreur tracking click:', error);
  }
  
  return url || '#';
};

/**
 * Récupère la liste des emails envoyés avec filtres et statistiques
 */
const getEmailLogs = async ({
  campaignId,
  status,
  email,
  page = 1,
  limit = 50,
  sortBy = 'createdAt',
  sortOrder = 'desc'
}) => {
  try {
    const filter = {};
    
    if (campaignId) filter.campaignId = campaignId;
    if (status) filter.status = status;
    if (email) filter.email = { $regex: email, $options: 'i' };
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    
    const [logs, total] = await Promise.all([
      EmailLog.find(filter)
        .populate('campaignId', 'name subject')
        .populate('subscriberId', 'name')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      EmailLog.countDocuments(filter)
    ]);
    
    // Calculer les statistiques par statut
    const stats = await EmailLog.aggregate([
      { $match: filter },
      { $group: {
        _id: '$status',
        count: { $sum: 1 }
      }}
    ]);
    
    const statsMap = stats.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});
    
    return {
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      stats: {
        total,
        sent: statsMap.sent || 0,
        delivered: statsMap.delivered || 0,
        opened: statsMap.opened || 0,
        clicked: statsMap.clicked || 0,
        failed: statsMap.failed || 0,
        bounced: statsMap.bounced || 0,
        spam: statsMap.spam || 0,
        pending: statsMap.pending || 0
      }
    };
  } catch (error) {
    console.error('Erreur récupération logs:', error);
    throw error;
  }
};

/**
 * Renvoie les emails en échec ou en attente
 */
const resendFailedEmails = async (campaignId, options = {}) => {
  const { maxAge = 24, limit = 100 } = options; // maxAge en heures
  
  try {
    const cutoffDate = new Date(Date.now() - maxAge * 60 * 60 * 1000);
    
    // Récupérer les emails en échec ou en attente
    const failedLogs = await EmailLog.find({
      campaignId,
      status: { $in: ['failed', 'pending', 'bounced'] },
      createdAt: { $gte: cutoffDate },
      $or: [
        { resendHistory: { $size: 0 } },
        { resendHistory: { $exists: false } },
        { 'resendHistory.2': { $exists: false } } // Max 3 tentatives
      ]
    }).populate('campaignId').limit(parseInt(limit));
    
    if (failedLogs.length === 0) {
      return { message: 'Aucun email à renvoyer', resent: 0 };
    }
    
    const results = [];
    
    for (const log of failedLogs) {
      try {
        const campaign = log.campaignId;
        
        // Préparer les données pour le renvoi
        const emailData = {
          to: log.email,
          subject: campaign.subject,
          html: campaign.content.html,
          text: campaign.content.text,
          fromEmail: campaign.fromEmail,
          fromName: campaign.fromName,
          replyTo: campaign.replyTo,
          campaignId: campaign._id,
          subscriberId: log.subscriberId,
          recipientName: log.subscriberId?.name || ''
        };
        
        // Tenter le renvoi
        const result = await sendEmail(emailData);
        
        // Mettre à jour l'historique
        log.resendHistory.push({
          attemptedAt: new Date(),
          status: 'success',
          error: null
        });
        await log.save();
        
        results.push({ email: log.email, success: true, logId: result.logId });
        
      } catch (error) {
        // Mettre à jour l'historique avec l'échec
        log.resendHistory.push({
          attemptedAt: new Date(),
          status: 'failed',
          error: error.message
        });
        await log.save();
        
        results.push({ email: log.email, success: false, error: error.message });
      }
      
      // Petit délai entre chaque envoi
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    return {
      message: `Renvoi terminé: ${successful}/${results.length} emails`,
      resent: successful,
      failed,
      results
    };
    
  } catch (error) {
    console.error('Erreur renvoi emails:', error);
    throw error;
  }
};

/**
 * Marque un email comme spam
 */
const markAsSpam = async (emailLogId, reason = '') => {
  try {
    const log = await EmailLog.findByIdAndUpdate(
      emailLogId,
      {
        status: 'spam',
        markedAsSpamAt: new Date(),
        spamReason: reason
      },
      { new: true }
    );
    
    // Mettre à jour les stats de la campagne
    if (log && log.campaignId) {
      const Campaign = (await import('../models/EmailCampaign.js')).default;
      await Campaign.findByIdAndUpdate(log.campaignId, {
        $inc: { 'stats.complained': 1 }
      });
    }
    
    return log;
  } catch (error) {
    console.error('Erreur marquage spam:', error);
    throw error;
  }
};

export {
  initEmailService,
  sendEmail,
  sendBulkEmails,
  trackEmailOpen,
  trackEmailClick,
  getEmailLogs,
  resendFailedEmails,
  markAsSpam
};

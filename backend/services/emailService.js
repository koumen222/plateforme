import { Resend } from 'resend';
import { v4 as uuidv4 } from 'uuid';
import EmailLog from '../models/EmailLog.js';

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

const sendEmail = async ({ to, subject, html, text, fromEmail, fromName, replyTo, campaignId, subscriberId }) => {
  if (!resend) {
    throw new Error('Service email Resend non configuré');
  }
  
  const emailLog = new EmailLog({
    campaignId,
    subscriberId,
    email: to,
    status: 'pending',
    tracking: {
      openToken: uuidv4(),
      clickToken: uuidv4()
    }
  });
  
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    const trackingPixel = `<img src="${backendUrl}/api/email/track/open/${emailLog.tracking.openToken}" width="1" height="1" style="display:none;" />`;
    const htmlWithTracking = html.replace('</body>', `${trackingPixel}</body>`);
    
    // Remplacer les liens par des liens de tracking
    const clickTrackingUrl = `${backendUrl}/api/email/track/click/${emailLog.tracking.clickToken}?url=`;
    const htmlWithClickTracking = htmlWithTracking.replace(
      /href=["']([^"']+)["']/g,
      (match, url) => {
        if (url.startsWith('http') && !url.includes('/api/email/track/')) {
          return `href="${clickTrackingUrl}${encodeURIComponent(url)}"`;
        }
        return match;
      }
    );
    
    const from = fromName ? `${fromName} <${fromEmail}>` : fromEmail;
    
    let retries = 0;
    const maxRetries = 3;
    let data = null;
    let error = null;
    
    while (retries <= maxRetries) {
      try {
        const result = await resend.emails.send({
          from,
          to,
          subject,
          html: htmlWithClickTracking,
          text: text || html.replace(/<[^>]*>/g, ''),
          reply_to: replyTo || fromEmail,
          headers: {
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

export {
  initEmailService,
  sendEmail,
  sendBulkEmails,
  trackEmailOpen,
  trackEmailClick
};

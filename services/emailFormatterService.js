/**
 * Service de formatage d'emails anti-spam
 * 
 * Stratégies implémentées :
 * 1. Formatage propre avec retours à la ligne
 * 2. Headers anti-spam optimisés
 * 3. Structure HTML/Text équilibrée
 * 4. Liens de désabonnement clairs
 * 5. Contenu personnalisé
 */

/**
 * Convertit le texte brut en HTML formaté avec retours à la ligne
 */
export const formatTextToHtml = (text) => {
  if (!text) return '';
  
  // Remplacer les retours à la ligne par des balises <br> et <p>
  const paragraphs = text
    .split(/\n\n+/)
    .map(para => para.trim())
    .filter(para => para.length > 0);
  
  return paragraphs.map(para => {
    // Convertir les sauts de ligne simples en <br>
    const withLineBreaks = para.replace(/\n/g, '<br>');
    return `<p style="margin: 0 0 16px 0; line-height: 1.6; color: #333;">${withLineBreaks}</p>`;
  }).join('\n');
};

/**
 * Génère une version texte propre à partir du HTML
 */
export const htmlToText = (html) => {
  if (!html) return '';
  
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
};

/**
 * Crée un template email complet avec structure anti-spam
 */
export const createEmailTemplate = ({
  subject,
  content,
  recipientName = '',
  unsubscribeUrl = '',
  companyName = 'Infomania',
  companyAddress = 'contact@infomania.store',
  previewText = ''
}) => {
  const formattedContent = formatTextToHtml(content);
  const textContent = htmlToText(content);
  
  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${subject}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <!-- Preview Text (hidden) -->
  <div style="display: none; max-height: 0px; overflow: hidden; mso-hide: all;">
    ${previewText || subject}
  </div>
  
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 30px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold; text-align: center;">
                ${companyName}
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${recipientName ? `<p style="margin: 0 0 20px 0; font-size: 16px; color: #333;">Bonjour ${recipientName},</p>` : ''}
              
              <div style="font-size: 16px; line-height: 1.6; color: #333;">
                ${formattedContent}
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; border-top: 1px solid #e9ecef;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #6c757d;">
                      © ${new Date().getFullYear()} ${companyName}. Tous droits réservés.
                    </p>
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #6c757d;">
                      ${companyAddress}
                    </p>
                    ${unsubscribeUrl ? `
                    <p style="margin: 10px 0 0 0; font-size: 12px; color: #6c757d;">
                      Si vous ne souhaitez plus recevoir nos emails, 
                      <a href="${unsubscribeUrl}" style="color: #667eea; text-decoration: underline;">cliquez ici pour vous désabonner</a>.
                    </p>
                    ` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return {
    html,
    text: `${recipientName ? `Bonjour ${recipientName},\n\n` : ''}${textContent}\n\n---\n© ${new Date().getFullYear()} ${companyName}\n${companyAddress}${unsubscribeUrl ? `\n\nSe désabonner: ${unsubscribeUrl}` : ''}`
  };
};

/**
 * Génère les headers anti-spam pour l'email
 */
export const generateAntiSpamHeaders = ({
  campaignId,
  subscriberId,
  listId = 'newsletter-main',
  precedence = 'bulk'
}) => {
  return {
    // Identification de la campagne
    'X-Campaign-ID': campaignId?.toString() || '',
    'X-Subscriber-ID': subscriberId?.toString() || '',
    'X-Mailing-List': listId,
    'X-List-ID': `<${listId}.listid.infomania.store>`,
    
    // Headers anti-spam standards
    'Precedence': precedence,
    'X-Precedence': precedence,
    'X-Mailer': 'Infomania Email System 1.0',
    'X-Priority': '3',
    'Importance': 'normal',
    
    // Authentification et tracking
    'X-Auto-Response-Suppress': 'OOF, AutoReply',
    'X-Report-Abuse': 'Please report abuse to: abuse@infomania.store',
    
    // DKIM/SPF hints (le service email doit configurer côté DNS)
    'X-DKIM-Signature': 'v=1',
    
    // Feedback Loop pour les FAI
    'X-Microsoft-Exchange-Diagnostics': '1',
    'X-MS-Exchange-Organization-AuthSource': 'infomania.store',
    'X-MS-Exchange-Organization-AuthAs': 'Anonymous'
  };
};

/**
 * Valide le contenu pour éviter les déclencheurs de spam
 */
export const validateSpamScore = (content) => {
  const spamTriggers = [
    { pattern: /\b(gratuit|free|100% free)\b/gi, weight: 2, name: 'Mot "gratuit"' },
    { pattern: /\b(urgent|immédiat|maintenant|limite)\b/gi, weight: 1, name: 'Urgence' },
    { pattern: /\$\d+/g, weight: 1, name: 'Montants en dollars' },
    { pattern: /\b(gagner|gagnez|argent facile)\b/gi, weight: 3, name: 'Promesse de gain' },
    { pattern: /\b(viagra|cialis|medicament)\b/gi, weight: 5, name: 'Mots médicaux suspects' },
    { pattern: /\b(credit|prêt|financement)\b/gi, weight: 2, name: 'Services financiers' },
    { pattern: /!!!+/g, weight: 2, name: 'Multiples points d\'exclamation' },
    { pattern: /\b(cliquez ici|click here)\b/gi, weight: 1, name: 'Call-to-action générique' },
    { pattern: /[A-Z]{5,}/g, weight: 2, name: 'Texte tout en majuscules' }
  ];
  
  let score = 0;
  const warnings = [];
  
  spamTriggers.forEach(trigger => {
    const matches = content.match(trigger.pattern);
    if (matches) {
      score += trigger.weight * matches.length;
      warnings.push(`${trigger.name} (${matches.length} occurence(s))`);
    }
  });
  
  // Calculer le ratio texte/images
  const imageTags = (content.match(/<img/gi) || []).length;
  const textLength = content.replace(/<[^>]*>/g, '').length;
  const imageToTextRatio = textLength > 0 ? imageTags / (textLength / 1000) : 0;
  
  if (imageToTextRatio > 0.5) {
    score += 3;
    warnings.push('Trop d\'images par rapport au texte');
  }
  
  return {
    score,
    warnings,
    risk: score < 5 ? 'low' : score < 10 ? 'medium' : 'high',
    recommendations: score > 5 ? [
      'Réduire l\'utilisation de mots comme "gratuit", "urgent"',
      'Ajouter plus de texte par rapport aux images',
      'Personnaliser les call-to-action',
      'Éviter les majuscules excessives'
    ] : []
  };
};

/**
 * Formate le sujet de l'email pour éviter le spam
 */
export const formatSubject = (subject) => {
  let formatted = subject.trim();
  
  // Éviter les sujets entièrement en majuscules
  if (formatted === formatted.toUpperCase() && formatted.length > 10) {
    formatted = formatted.toLowerCase();
    formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }
  
  // Limiter la longueur
  if (formatted.length > 100) {
    formatted = formatted.substring(0, 97) + '...';
  }
  
  // Éviter les caractères répétitifs
  formatted = formatted.replace(/([!?.]){2,}/g, '$1');
  
  return formatted;
};

export default {
  formatTextToHtml,
  htmlToText,
  createEmailTemplate,
  generateAntiSpamHeaders,
  validateSpamScore,
  formatSubject
};

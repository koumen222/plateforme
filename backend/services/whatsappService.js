import WhatsAppLog from '../models/WhatsAppLog.js';

let whatsappProvider = null;
let providerType = null;
let warmupCompleted = false; // Flag pour le warm-up

const initWhatsAppService = async () => {
  // Configuration Green API uniquement
  const greenApiId = process.env.GREEN_API_ID_INSTANCE;
  const greenApiToken = process.env.GREEN_API_TOKEN_INSTANCE;
  const greenApiUrl = process.env.GREEN_API_URL;
  
  if (greenApiId && greenApiToken) {
    providerType = 'green_api';
    whatsappProvider = {
      idInstance: greenApiId,
      apiTokenInstance: greenApiToken,
      apiUrl: greenApiUrl || `https://${greenApiId}.api.greenapi.com`
    };
    // Service configuré silencieusement
    
    // Warm-up automatique pour Green API
    warmupCompleted = false;
    return;
  }
  
  // Green API non configuré (erreur silencieuse)
};

/**
 * Nettoie et normalise un numéro de téléphone
 * Supprime espaces, +, tirets, parenthèses
 * Conserve uniquement les chiffres
 */
const sanitizePhoneNumber = (phone) => {
  if (!phone || typeof phone !== 'string') {
    return null;
  }
  
  // Supprimer tous les caractères non numériques
  let cleaned = phone.replace(/\D/g, '');
  
  // Si vide après nettoyage, retourner null
  if (!cleaned || cleaned.length === 0) {
    return null;
  }
  
  return cleaned;
};

/**
 * Vérifie si un numéro de téléphone est valide
 * Doit commencer par un indicatif pays valide
 * Doit avoir une longueur raisonnable (8-15 chiffres)
 */
const isValidPhoneNumber = (phone) => {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  
  const cleaned = sanitizePhoneNumber(phone);
  if (!cleaned) {
    return false;
  }
  
  // Liste des indicatifs pays courants (à étendre selon vos besoins)
  const countryCodes = [
    '237', // Cameroun
    '221', // Sénégal
    '229', // Bénin
    '226', // Burkina Faso
    '225', // Côte d'Ivoire
    '223', // Mali
    '241', // Gabon
    '242', // Congo
    '33',  // France
    '1',   // USA/Canada
    '212', // Maroc
    '213', // Algérie
    '216', // Tunisie
    '20',  // Égypte
    '234', // Nigeria
    '254', // Kenya
    '27',  // Afrique du Sud
  ];
  
  // Vérifier si le numéro commence par un indicatif valide
  const hasValidCountryCode = countryCodes.some(code => cleaned.startsWith(code));
  
  // Vérifier la longueur (8-15 chiffres est une plage raisonnable)
  const isValidLength = cleaned.length >= 8 && cleaned.length <= 15;
  
  return hasValidCountryCode && isValidLength;
};

/**
 * Vérifie si un numéro possède WhatsApp via Green API
 * Retourne { exists: boolean, error: string|null }
 * Note: Cette fonction est optionnelle, le retry intelligent gère mieux les erreurs
 */
const checkWhatsappNumber = async (phone) => {
  if (!whatsappProvider || providerType !== 'green_api') {
    return { exists: true, error: null };
  }
  
  const cleaned = sanitizePhoneNumber(phone);
  if (!cleaned || !isValidPhoneNumber(cleaned)) {
    return { exists: false, error: 'Numéro invalide' };
  }
  
  try {
    const fetch = (await import('node-fetch')).default;
    const apiUrl = whatsappProvider.apiUrl || `https://${whatsappProvider.idInstance}.api.greenapi.com`;
    const endpoint = `${apiUrl}/waInstance${whatsappProvider.idInstance}/checkWhatsapp/${whatsappProvider.apiTokenInstance}`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumber: cleaned
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      if (response.status === 466) {
        return { exists: false, error: 'Numéro invalide (HTTP 466)' };
      }
      return { exists: false, error: data.error || `HTTP ${response.status}` };
    }
    
    if (data.exists === false) {
      return { exists: false, error: 'Numéro sans WhatsApp' };
    }
    
    return { exists: true, error: null };
  } catch (error) {
    // En cas d'erreur de vérification, on assume que ça existe pour ne pas bloquer
    return { exists: true, error: null };
  }
};

/**
 * Fonction de délai (sleep)
 */
const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Normalise un numéro de téléphone (fonction legacy pour compatibilité)
 */
const normalizePhone = (phone) => {
  const cleaned = sanitizePhoneNumber(phone);
  return cleaned || phone; // Fallback sur le numéro original si nettoyage échoue
};

/**
 * Warm-up automatique pour Green API
 * Envoie 2-3 messages de test vers des numéros de confiance pour réveiller la session
 * Ces messages ne créent PAS de logs dans la base de données (pas de campaignId)
 */
const performWarmup = async () => {
  if (warmupCompleted || !whatsappProvider || providerType !== 'green_api') {
    return;
  }
  
  // Numéros de confiance pour le warm-up (peuvent être configurés via env)
  const warmupPhones = process.env.WHATSAPP_WARMUP_PHONES 
    ? process.env.WHATSAPP_WARMUP_PHONES.split(',').map(p => p.trim()).filter(p => p)
    : [];
  
  if (warmupPhones.length === 0) {
    warmupCompleted = true;
    return;
  }
  
  const warmupMessage = 'Test warm-up';
  let successCount = 0;
  
  for (let i = 0; i < Math.min(warmupPhones.length, 3); i++) {
    const phone = sanitizePhoneNumber(warmupPhones[i]);
    if (!phone || !isValidPhoneNumber(phone)) {
      continue;
    }
    
    try {
      const fetch = (await import('node-fetch')).default;
      const apiUrl = whatsappProvider.apiUrl || `https://${whatsappProvider.idInstance}.api.greenapi.com`;
      const endpoint = `${apiUrl}/waInstance${whatsappProvider.idInstance}/sendMessage/${whatsappProvider.apiTokenInstance}`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: `${phone}@c.us`,
          message: warmupMessage
        })
      });
      
      const data = await response.json();
      
      // Utiliser les VRAIES réponses de l'API Green API
      if (response.ok && data.idMessage) {
        successCount++;
      }
      
      // Délai entre chaque message de warm-up
      if (i < Math.min(warmupPhones.length, 3) - 1) {
        await sleep(7000);
      }
    } catch (error) {
      // Erreur silencieuse pour le warm-up
    }
  }
  
  warmupCompleted = true;
};

/**
 * Envoie un message WhatsApp (fonction interne, appelée par sendMessageWithDelay)
 * Cette fonction ne gère PAS le retry, elle fait juste un essai unique
 * ⚠️ IMPORTANT: Cette fonction REJETTE immédiatement les numéros mal formatés
 */
const sendWhatsAppMessage = async ({ to, message, campaignId, userId, attemptNumber = 1 }) => {
  if (!whatsappProvider || providerType !== 'green_api') {
    throw new Error('Service WhatsApp Green API non configuré');
  }
  
  // Warm-up automatique (une seule fois)
  if (!warmupCompleted) {
    await performWarmup();
  }
  
  // 1️⃣ Nettoyage du numéro (OBLIGATOIRE)
  const cleanedPhone = sanitizePhoneNumber(to);
  if (!cleanedPhone) {
    throw new Error('Numéro de téléphone invalide ou vide');
  }
  
  // 2️⃣ Validation STRICTE du format (OBLIGATOIRE)
  // Un numéro invalide ne doit JAMAIS être envoyé
  if (!isValidPhoneNumber(cleanedPhone)) {
    throw new Error(`Numéro invalide: ${cleanedPhone} (doit commencer par un indicatif pays valide et avoir 8-15 chiffres)`);
  }
  
  const whatsappLog = new WhatsAppLog({
    campaignId,
    userId,
    phone: cleanedPhone,
    status: 'pending'
  });
  
  try {
    const fetch = (await import('node-fetch')).default;
    
    // Envoi via Green API uniquement
    const apiUrl = whatsappProvider.apiUrl || `https://${whatsappProvider.idInstance}.api.greenapi.com`;
    const endpoint = `${apiUrl}/waInstance${whatsappProvider.idInstance}/sendMessage/${whatsappProvider.apiTokenInstance}`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chatId: `${cleanedPhone}@c.us`,
        message: message
      })
    });
    
    const data = await response.json();
    
    // Utiliser les VRAIS logs de l'API Green API
    // Gestion de l'erreur HTTP 466 (vraie réponse de l'API)
    if (response.status === 466) {
      const apiError = data.error || data.errorMessage || `HTTP ${response.status}`;
      whatsappLog.status = 'failed';
      whatsappLog.error = apiError;
      whatsappLog.providerResponse = {
        error: apiError,
        statusCode: response.status,
        apiResponse: data
      };
      await whatsappLog.save();
      throw new Error('HTTP_466'); // Code spécial pour déclencher le retry dans la fonction appelante
    }
    
    // Autres erreurs HTTP (vraies réponses de l'API)
    if (!response.ok) {
      const errorMsg = data.error || data.errorMessage || `HTTP ${response.status}`;
      whatsappLog.status = 'failed';
      whatsappLog.error = errorMsg;
      whatsappLog.providerResponse = {
        error: errorMsg,
        statusCode: response.status,
        apiResponse: data
      };
      await whatsappLog.save();
      throw new Error(`Erreur Green API: ${errorMsg}`);
    }
    
    // Erreur dans la réponse JSON (vraie réponse de l'API)
    if (data.error) {
      const errorMsg = data.error || data.errorMessage || 'Erreur Green API';
      whatsappLog.status = 'failed';
      whatsappLog.error = errorMsg;
      whatsappLog.providerResponse = {
        error: data.error,
        errorMessage: data.errorMessage,
        apiResponse: data
      };
      await whatsappLog.save();
      throw new Error(errorMsg);
    }
    
    // Succès (vraie réponse de l'API avec idMessage)
    whatsappLog.status = data.idMessage ? 'sent' : 'failed';
    whatsappLog.messageId = data.idMessage;
    whatsappLog.providerResponse = {
      idMessage: data.idMessage,
      timestamp: data.timestamp,
      status: data.status || 'sent',
      apiResponse: data
    };
    
    whatsappLog.sentAt = new Date();
    await whatsappLog.save();
    
    return { success: true, logId: whatsappLog._id, messageId: whatsappLog.messageId, apiResponse: data };
  } catch (error) {
    // Ne sauvegarder le log que si ce n'est pas déjà fait
    if (whatsappLog.status === 'pending') {
      whatsappLog.status = 'failed';
      whatsappLog.error = error.message;
      await whatsappLog.save();
    }
    
    // Propager l'erreur pour que la fonction appelante gère le retry
    throw error;
  }
};

/**
 * Envoie un message WhatsApp avec retry intelligent pour HTTP 466
 * Chaque numéro est traité INDÉPENDAMMENT avec son propre compteur d'essais
 * ⚠️ IMPORTANT: Distinction entre HTTP 466 "limite atteinte" et HTTP 466 "numéro invalide"
 * ⚠️ IMPORTANT: Les numéros mal formatés sont REJETÉS immédiatement (pas de retry)
 */
const sendMessageWithDelay = async (messageData, isRateLimit = false) => {
  const originalPhone = messageData.to;
  
  // VALIDATION PRÉALABLE STRICTE (avant même d'essayer d'envoyer)
  // Nettoyer et valider le numéro AVANT toute tentative d'envoi
  const cleanedPhone = sanitizePhoneNumber(originalPhone);
  if (!cleanedPhone) {
    return { 
      success: false, 
      phone: originalPhone, 
      error: 'Numéro vide après nettoyage',
      skipped: true
    };
  }
  
  if (!isValidPhoneNumber(cleanedPhone)) {
    return { 
      success: false, 
      phone: cleanedPhone, 
      error: 'Format de numéro invalide (doit commencer par un indicatif pays valide et avoir 8-15 chiffres)',
      skipped: true
    };
  }
  
  // Mettre à jour le numéro nettoyé pour l'envoi
  messageData.to = cleanedPhone;
  
  // Compteur d'essais LOCAL à ce numéro (jamais global)
  let attempts = 0;
  const maxAttempts = 2; // Maximum 2 essais par numéro
  
  while (attempts < maxAttempts) {
    attempts++;
    
    try {
      // Tentative d'envoi avec le numéro d'essai
      // Le numéro est déjà validé et nettoyé, donc sendWhatsAppMessage ne devrait pas rejeter
      const result = await sendWhatsAppMessage({ 
        ...messageData, 
        attemptNumber: attempts 
      });
      
      // Succès : retourner immédiatement
      if (attempts > 1) {
        return { success: true, phone: cleanedPhone, ...result, retried: true };
      }
      
      return { success: true, phone: cleanedPhone, ...result };
      
    } catch (error) {
      const errorMessage = error.message || 'Erreur inconnue';
      
      // Si erreur de validation (format invalide), rejeter immédiatement (pas de retry)
      if (errorMessage.includes('invalide') || errorMessage.includes('vide')) {
        return { 
          success: false, 
          phone: cleanedPhone, 
          error: errorMessage,
          skipped: true,
          attempts: attempts
        };
      }
      
      // Gestion spécifique du HTTP 466 (vraie réponse de l'API)
      if (errorMessage === 'HTTP_466' || errorMessage.includes('HTTP 466')) {
        // Si c'est un retry après une pause (limite de débit), attendre plus longtemps
        if (isRateLimit && attempts === 1) {
          await sleep(15000);
          continue;
        }
        
        // Si c'est le premier essai normal, on retry
        if (attempts === 1) {
          await sleep(10000);
          continue;
        } else {
          // 2ème essai aussi en HTTP 466 : ce numéro est vraiment invalide (vraie réponse API)
          return { 
            success: false, 
            phone: cleanedPhone, 
            error: 'Numéro invalide (HTTP 466 après 2 tentatives)',
            skipped: true,
            attempts: attempts
          };
        }
      }
      
      // Autres erreurs : ne pas retry, retourner l'erreur (vraie réponse API)
      return { 
        success: false, 
        phone: cleanedPhone, 
        error: errorMessage,
        attempts: attempts
      };
    }
  }
  
  // Ne devrait jamais arriver ici, mais sécurité
  return { 
    success: false, 
    phone: cleanedPhone, 
    error: 'Nombre maximum d\'essais atteint',
    skipped: true
  };
};

/**
 * Envoie plusieurs messages WhatsApp de manière séquentielle avec délais
 * ⚠️ CRITIQUE: Green API limite à 3 messages actifs
 * Après 3 messages, attendre 10-15 secondes avant de continuer
 */
const sendBulkWhatsApp = async (messages) => {
  const results = [];
  
  // Délai entre chaque message: 4 secondes (dans la plage 3-5 recommandée)
  const delayBetweenMessages = 4000; // 4 secondes
  
  // Compteur de messages actifs (limite Green API: 3 messages)
  let activeMessages = 0;
  const MAX_ACTIVE_MESSAGES = 3; // Limite stricte Green API
  
  if (!whatsappProvider || providerType !== 'green_api') {
    throw new Error('Service WhatsApp Green API non configuré');
  }
  
  // Log initial uniquement pour le démarrage
  console.log(`📱 Envoi de ${messages.length} messages WhatsApp via Green API`);
  
  // Warm-up automatique au début (une seule fois)
  if (!warmupCompleted) {
    await performWarmup();
  }
  
  for (let i = 0; i < messages.length; i++) {
    const messageData = messages[i];
    const originalPhone = messageData.to;
    
    // VALIDATION PRÉALABLE STRICTE (avant même d'appeler sendMessageWithDelay)
    // Nettoyer le numéro avant traitement
    const cleanedPhone = sanitizePhoneNumber(originalPhone);
    if (!cleanedPhone) {
      results.push({ 
        success: false, 
        phone: originalPhone, 
        error: 'Numéro vide après nettoyage',
        skipped: true
      });
      continue;
    }
    
    // Vérifier la validité STRICTE du format
    if (!isValidPhoneNumber(cleanedPhone)) {
      results.push({ 
        success: false, 
        phone: cleanedPhone, 
        error: 'Format de numéro invalide (doit commencer par un indicatif pays valide et avoir 8-15 chiffres)',
        skipped: true
      });
      continue;
    }
    
    // Mettre à jour le numéro nettoyé et validé
    messageData.to = cleanedPhone;
    
    // ⚠️ GESTION DE LA LIMITE DE 3 MESSAGES ACTIFS
    // Vérifier AVANT d'envoyer le message
    let justPaused = false;
    if (activeMessages >= MAX_ACTIVE_MESSAGES) {
      await sleep(12000); // Attendre 12 secondes (dans la plage 10-15 recommandée)
      activeMessages = 0; // Réinitialiser le compteur
      justPaused = true; // Marquer qu'on vient de faire une pause
    }
    
    // Envoyer UNIQUEMENT aux numéros bien formatés
    // sendMessageWithDelay fera une double vérification pour sécurité
    // Passer isRateLimit=true si on vient de faire une pause (pour distinguer limite de numéro invalide)
    const result = await sendMessageWithDelay(messageData, justPaused);
    results.push(result);
    
    // Incrémenter le compteur seulement si succès
    // Un message réussi compte comme un message actif
    if (result.success) {
      activeMessages++;
    }
    
    // Délai obligatoire entre chaque message (ANTI-BLOCAGE)
    // Le délai est déjà géré dans sendMessageWithDelay pour les retries (10 secondes)
    // On ajoute un délai supplémentaire seulement si pas de retry
    if (i < messages.length - 1) {
      if (result.retried) {
        // Si retry effectué, le délai de 10s a déjà été pris dans le retry
        // On attend juste un peu plus pour éviter le rate limiting
        await sleep(3000); // 3 secondes supplémentaires après un retry
      } else {
        // Pas de retry, délai normal entre chaque message
        await sleep(delayBetweenMessages);
      }
    }
    
    // Afficher la progression tous les 10 messages (statistiques basées sur les vraies réponses API)
    if ((i + 1) % 10 === 0) {
      const successCount = results.filter(r => r.success).length;
      const skippedCount = results.filter(r => r.skipped).length;
      const failedCount = results.filter(r => !r.success && !r.skipped).length;
      console.log(`📊 Progression: ${i + 1}/${messages.length} | ✅ ${successCount} | ⚠️ ${skippedCount} | ❌ ${failedCount}`);
    }
  }
  
  // Statistiques finales basées sur les vraies réponses de l'API
  const successCount = results.filter(r => r.success).length;
  const skippedCount = results.filter(r => r.skipped).length;
  const failedCount = results.filter(r => !r.success && !r.skipped).length;
  
  console.log(`✅ Envoi terminé: ${successCount}/${messages.length} succès | ${skippedCount} ignorés | ${failedCount} échecs`);
  
  return results;
};

/**
 * Sélectionne une variante aléatoire parmi les variantes disponibles
 * @param {string[]} variants - Tableau de variantes de messages
 * @returns {string} - Une variante aléatoire
 */
const getRandomVariant = (variants) => {
  if (!variants || variants.length === 0) {
    return null;
  }
  // Filtrer les variantes vides
  const validVariants = variants.filter(v => v && v.trim());
  if (validVariants.length === 0) {
    return null;
  }
  const randomIndex = Math.floor(Math.random() * validVariants.length);
  return validVariants[randomIndex].trim();
};

/**
 * Génère un délai aléatoire entre 25 et 45 secondes entre chaque message
 * @returns {number} - Délai en millisecondes (25000-45000ms)
 */
const getHumanDelay = () => {
  const minDelay = 25 * 1000; // 25 secondes
  const maxDelay = 45 * 1000; // 45 secondes
  return Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
};

/**
 * Génère une pause longue de 2 à 3 minutes
 * @returns {number} - Délai en millisecondes (120000-180000ms)
 */
const getLongPause = () => {
  const minPause = 2 * 60 * 1000; // 2 minutes
  const maxPause = 3 * 60 * 1000; // 3 minutes
  return Math.floor(Math.random() * (maxPause - minPause + 1)) + minPause;
};

/**
 * Vérifie si l'heure actuelle est dans la plage horaire autorisée (08h00 - 19h00)
 * @returns {boolean} - true si dans la plage autorisée
 */
const checkTimeWindow = () => {
  const now = new Date();
  const hour = now.getHours();
  // Plage horaire : 08h00 - 19h00
  return hour >= 8 && hour < 19;
};

/**
 * Envoie une newsletter WhatsApp avec variantes et rythme humain
 * - Sélection aléatoire d'une variante par contact
 * - Délai de 25-45 secondes entre chaque message
 * - Pause de 2-3 minutes toutes les 15 personnes
 * - Limite quotidienne de 80-100 messages par jour
 * - Vérification de la plage horaire (08h-19h)
 * - Gestion des erreurs 466 (quota) avec pause immédiate
 * 
 * @param {Array} contacts - Tableau de contacts avec { to, userId, campaignId, profileLink? }
 * @param {string[]} variants - Tableau de variantes de messages (1 à 3)
 * @param {Function} onProgress - Callback de progression (index, total, stats)
 * @returns {Promise<Object>} - Résultats de l'envoi
 */
const sendNewsletterCampaign = async (contacts, variants, onProgress = null) => {
  const results = [];
  let paused = false;
  let quotaReached = false;
  
  if (!whatsappProvider || providerType !== 'green_api') {
    throw new Error('Service WhatsApp Green API non configuré');
  }
  
  // Vérifier la plage horaire
  if (!checkTimeWindow()) {
    throw new Error('Envoi autorisé uniquement entre 08h00 et 19h00');
  }
  
  // Filtrer les variantes valides
  const validVariants = variants.filter(v => v && v.trim());
  if (validVariants.length === 0) {
    throw new Error('Au moins une variante valide doit être fournie');
  }
  
  // Warm-up automatique au début (une seule fois)
  if (!warmupCompleted) {
    await performWarmup();
  }
  
  // Limite de volume quotidien : 80-100 messages par jour
  const maxDailyVolume = Math.floor(Math.random() * (100 - 80 + 1)) + 80; // 80-100 aléatoire
  
  // Vérifier le nombre de messages envoyés aujourd'hui (via les logs)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const todayLogs = await WhatsAppLog.countDocuments({
    sentAt: { $gte: today, $lt: tomorrow },
    status: { $in: ['sent', 'delivered'] }
  });
  
  if (todayLogs >= maxDailyVolume) {
    throw new Error(`Limite quotidienne atteinte: ${todayLogs}/${maxDailyVolume} messages envoyés aujourd'hui`);
  }
  
  // Limiter le nombre de contacts à envoyer pour ne pas dépasser la limite quotidienne
  const remainingQuota = maxDailyVolume - todayLogs;
  const contactsToProcess = Math.min(contacts.length, remainingQuota);
  
  if (contactsToProcess < contacts.length) {
    console.log(`⚠️ Limite quotidienne: ${contactsToProcess}/${contacts.length} contacts seront traités aujourd'hui`);
  }
  
  let sentCount = 0;
  let failedCount = 0;
  let skippedCount = 0;
  
  for (let i = 0; i < contactsToProcess; i++) {
    // Vérifier si on doit faire une pause longue (toutes les 15 personnes)
    if (i > 0 && i % 15 === 0 && !paused) {
      const pauseDuration = getLongPause();
      const pauseMinutes = Math.round(pauseDuration / 60000);
      console.log(`⏸️ Pause longue de ${pauseMinutes} minutes après ${i} messages...`);
      await sleep(pauseDuration);
      paused = false; // Réinitialiser le flag après la pause
    }
    
    // Vérifier la plage horaire avant chaque envoi
    if (!checkTimeWindow()) {
      console.log(`⏰ Plage horaire dépassée (08h-19h), arrêt de la campagne`);
      quotaReached = true;
      break;
    }
    
    const contact = contacts[i];
    const originalPhone = contact.to;
    
    // VALIDATION PRÉALABLE STRICTE
    const cleanedPhone = sanitizePhoneNumber(originalPhone);
    if (!cleanedPhone) {
      results.push({ 
        success: false, 
        phone: originalPhone, 
        error: 'Numéro vide après nettoyage',
        skipped: true
      });
      skippedCount++;
      continue;
    }
    
    if (!isValidPhoneNumber(cleanedPhone)) {
      results.push({ 
        success: false, 
        phone: cleanedPhone, 
        error: 'Format de numéro invalide',
        skipped: true
      });
      skippedCount++;
      continue;
    }
    
    // Sélectionner une variante aléatoire pour ce contact
    let selectedVariant = getRandomVariant(validVariants);
    if (!selectedVariant) {
      results.push({ 
        success: false, 
        phone: cleanedPhone, 
        error: 'Aucune variante valide disponible',
        skipped: true
      });
      skippedCount++;
      continue;
    }
    
    // Remplacer [LIEN_PROFIL] par le lien approprié (profil pour non-actifs, accueil pour actifs)
    if (contact.profileLink && selectedVariant.includes('[LIEN_PROFIL]')) {
      selectedVariant = selectedVariant.replace(/\[LIEN_PROFIL\]/g, contact.profileLink);
    }
    
    // Remplacer aussi les liens directs si présents dans les messages pré-définis
    // (pour les campagnes de bienvenue qui ont déjà le lien dans le message)
    // Pas besoin de modification supplémentaire car les messages sont déjà complets
    
    // Préparer le message avec la variante sélectionnée (et personnalisée)
    const messageData = {
      to: cleanedPhone,
      message: selectedVariant,
      campaignId: contact.campaignId,
      userId: contact.userId || null
    };
    
    try {
      // Envoyer le message (avec retry intelligent pour HTTP 466)
      const result = await sendMessageWithDelay(messageData, false);
      results.push({
        ...result,
        variant: selectedVariant.substring(0, 50) + '...' // Stocker un aperçu de la variante
      });
      
      if (result.success) {
        sentCount++;
      } else if (result.skipped) {
        skippedCount++;
      } else {
        failedCount++;
        
        // Si erreur 466 (quota), faire une pause immédiate
        if (result.error && result.error.includes('HTTP 466')) {
          console.log(`⚠️ Erreur 466 détectée, pause immédiate de 5 minutes...`);
          await sleep(5 * 60 * 1000); // Pause de 5 minutes
          quotaReached = true;
          // Ne pas arrêter complètement, mais continuer avec prudence
        }
      }
      
      // Callback de progression
      if (onProgress) {
        onProgress(i + 1, contactsToProcess, {
          sent: sentCount,
          failed: failedCount,
          skipped: skippedCount,
          total: i + 1
        });
      }
      
      // Délai de 25-45 secondes entre chaque message
      // Sauf pour le dernier message
      if (i < contactsToProcess - 1 && !quotaReached) {
        const delay = getHumanDelay();
        const delaySeconds = Math.round(delay / 1000);
        console.log(`   ⏱️ Délai de ${delaySeconds} secondes avant le prochain message...`);
        await sleep(delay);
      }
      
    } catch (error) {
      failedCount++;
      results.push({ 
        success: false, 
        phone: cleanedPhone, 
        error: error.message || 'Erreur inconnue'
      });
      
      // Si erreur critique, arrêter
      if (error.message && error.message.includes('quota')) {
        quotaReached = true;
        break;
      }
    }
  }
  
  return {
    total: contactsToProcess,
    sent: sentCount,
    failed: failedCount,
    skipped: skippedCount,
    quotaReached,
    results,
    dailyLimit: maxDailyVolume,
    remainingQuota: maxDailyVolume - todayLogs - sentCount
  };
};

export {
  initWhatsAppService,
  sendWhatsAppMessage,
  sendBulkWhatsApp,
  sendNewsletterCampaign,
  sanitizePhoneNumber,
  isValidPhoneNumber,
  checkWhatsappNumber,
  sendMessageWithDelay,
  getRandomVariant,
  getHumanDelay,
  getLongPause,
  checkTimeWindow,
  sleep
};

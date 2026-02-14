// Service WhatsApp simplifié - Envoi de message basique

let whatsappConfig = null;

// Initialiser la configuration WhatsApp
export const initWhatsApp = () => {
  const greenApiId = process.env.GREEN_API_ID_INSTANCE;
  const greenApiToken = process.env.GREEN_API_TOKEN_INSTANCE;
  const greenApiUrl = process.env.GREEN_API_URL;

  if (greenApiId && greenApiToken) {
    whatsappConfig = {
      idInstance: greenApiId,
      apiTokenInstance: greenApiToken,
      apiUrl: greenApiUrl || `https://${greenApiId}.api.greenapi.com`
    };
    console.log('✅ WhatsApp Service initialisé');
    console.log('📱 Instance ID:', greenApiId);
    return true;
  }

  console.error('❌ WhatsApp non configuré - variables GREEN_API manquantes');
  return false;
};

// Fonction simple pour envoyer un message
export const sendMessage = async (phoneNumber, message) => {
  console.log('\n🚀 ==================== ENVOI MESSAGE ====================');
  console.log('📱 Numéro destinataire:', phoneNumber);
  console.log('💬 Message:', message);
  
  // Initialiser si pas encore fait
  if (!whatsappConfig) {
    console.log('🔧 Initialisation WhatsApp...');
    const initialized = initWhatsApp();
    if (!initialized) {
      console.error('❌ Impossible d\'initialiser WhatsApp');
      return { success: false, error: 'WhatsApp non configuré' };
    }
  }

  try {
    // Formater le numéro au format WhatsApp (ex: 237698459328@c.us)
    let chatId = phoneNumber;
    if (!chatId.includes('@c.us')) {
      // Nettoyer le numéro (enlever espaces, tirets, etc.)
      const cleanNumber = phoneNumber.replace(/\D/g, '');
      chatId = `${cleanNumber}@c.us`;
    }
    
    console.log('📞 ChatId formaté:', chatId);

    // Construire l'URL de l'API Green API
    const url = `${whatsappConfig.apiUrl}/waInstance${whatsappConfig.idInstance}/sendMessage/${whatsappConfig.apiTokenInstance}`;
    console.log('🔗 URL API:', url);

    // Importer fetch
    const fetchModule = await import('node-fetch');
    const fetch = fetchModule.default;

    // Envoyer le message
    console.log('📤 Envoi en cours...');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chatId: chatId,
        message: message
      })
    });

    const data = await response.json();
    console.log('📥 Réponse Green API:', JSON.stringify(data, null, 2));

    if (response.ok && data.idMessage) {
      console.log('✅ ==================== MESSAGE REÇU ====================');
      console.log('✅ Message envoyé avec succès !');
      console.log('🆔 Message ID:', data.idMessage);
      console.log('⏰ Timestamp:', data.timestamp || new Date().toISOString());
      console.log('✅ =========================================================\n');
      
      return {
        success: true,
        messageId: data.idMessage,
        timestamp: data.timestamp
      };
    } else {
      console.error('❌ Erreur Green API:', data.error || 'Erreur inconnue');
      console.error('📄 Réponse complète:', JSON.stringify(data, null, 2));
      return {
        success: false,
        error: data.error || 'Erreur lors de l\'envoi'
      };
    }

  } catch (error) {
    console.error('❌ ==================== ERREUR ENVOI ====================');
    console.error('❌ Erreur:', error.message);
    console.error('📍 Stack:', error.stack);
    console.error('❌ =========================================================\n');
    
    return {
      success: false,
      error: error.message
    };
  }
};

// Fonction pour recevoir un message (webhook)
export const handleIncomingMessage = async (webhookData) => {
  console.log('\n📨 ==================== MESSAGE REÇU ====================');
  console.log('📱 Instance:', webhookData.instanceData?.wid || 'non défini');
  console.log('👤 Expéditeur:', webhookData.senderData?.sender || 'non défini');
  console.log('💬 Message:', webhookData.messageData?.textMessageData?.textMessage || 'non défini');
  console.log('⏰ Timestamp:', webhookData.timestamp || 'non défini');
  console.log('📨 =========================================================\n');

  // Extraire les infos
  const senderPhone = webhookData.senderData?.sender?.replace('@c.us', '').replace('@g.us', '');
  const messageText = webhookData.messageData?.textMessageData?.textMessage;

  if (!messageText) {
    console.log('⏭️ Message ignoré (pas de texte)');
    return { success: true, message: 'Message sans texte ignoré' };
  }

  // Répondre automatiquement
  const replyMessage = `Bonjour ! J'ai bien reçu votre message : "${messageText}"`;
  
  console.log('🤖 Envoi de la réponse automatique...');
  const result = await sendMessage(senderPhone, replyMessage);

  return {
    success: true,
    processed: true,
    responseSent: result.success
  };
};

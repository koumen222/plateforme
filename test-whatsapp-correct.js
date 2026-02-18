#!/usr/bin/env node

import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Charger les variables d'environnement depuis le bon dossier
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger .env depuis le dossier backend/backend
dotenv.config({ path: join(__dirname, 'backend', '.env') });

// Se connecter à la base de données
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connecté à MongoDB');
  } catch (error) {
    console.error('❌ Erreur de connexion MongoDB:', error.message);
    process.exit(1);
  }
};

async function testWhatsAppFromCorrectFolder() {
  try {
    await connectDB();
    
    console.log('📱 ==================== TEST WHATSAPP (BON DOSSIER) ====================');
    
    // Vérifier les variables d'environnement
    console.log('\n🔧 Variables WhatsApp:');
    console.log(`   GREEN_API_ID_INSTANCE: ${process.env.GREEN_API_ID_INSTANCE ? '✅' : '❌'}`);
    console.log(`   GREEN_API_TOKEN_INSTANCE: ${process.env.GREEN_API_TOKEN_INSTANCE ? '✅' : '❌'}`);
    console.log(`   GREEN_API_URL: ${process.env.GREEN_API_URL || '❌'}`);
    
    // Importer le service WhatsApp depuis le bon dossier
    const { 
      initWhatsAppService, 
      sendWhatsAppMessage,
      sanitizePhoneNumber,
      isValidPhoneNumber 
    } = await import('./backend/services/whatsappService.js');
    
    console.log('\n🚀 Initialisation du service WhatsApp...');
    await initWhatsAppService();
    console.log('✅ Service WhatsApp initialisé');
    
    // Trouver une commande avec téléphone
    const { default: Order } = await import('./backend/ecom/models/Order.js');
    const testOrder = await Order.findOne({ 
      workspaceId: '69870da96590f43912bf4ca2',
      clientPhone: { $exists: true, $ne: '' }
    });
    
    if (!testOrder) {
      console.log('❌ Aucune commande avec téléphone trouvée');
      return;
    }
    
    console.log(`\n📦 Commande test: ${testOrder.clientName} - ${testOrder.clientPhone}`);
    
    // Nettoyer et valider le numéro
    const cleanedPhone = sanitizePhoneNumber(testOrder.clientPhone);
    const isValid = isValidPhoneNumber(testOrder.clientPhone);
    
    console.log(`   Numéro nettoyé: ${cleanedPhone}`);
    console.log(`   Numéro valide: ${isValid ? '✅' : '❌'}`);
    
    if (!isValid) {
      console.log('❌ Numéro invalide, impossible de tester');
      return;
    }
    
    // Envoyer un message test
    console.log('\n📤 Envoi message test...');
    
    try {
      const result = await sendWhatsAppMessage({
        to: cleanedPhone,
        message: `🧪 Test de diagnostic WhatsApp - ${new Date().toLocaleString()}\n\nCommande: ${testOrder.product}\nClient: ${testOrder.clientName}`,
        campaignId: 'test-diagnostic',
        userId: 'test-user',
        firstName: testOrder.clientName?.split(' ')[0] || 'Client'
      });
      
      console.log('✅ MESSAGE WHATSAPP ENVOYÉ AVEC SUCCÈS !');
      console.log(`   Message ID: ${result.messageId}`);
      console.log(`   Log ID: ${result.logId}`);
      console.log(`   Timestamp: ${result.timestamp}`);
      
      console.log('\n🎉 Le service WhatsApp fonctionne parfaitement !');
      console.log('   Les campagnes devraient maintenant fonctionner.');
      
    } catch (error) {
      console.error('❌ Erreur envoi WhatsApp:', error.message);
      
      if (error.message.includes('HTTP_466')) {
        console.log('💡 Erreur 466: Numéro invalide ou limite atteinte');
        console.log('   Essayez avec un autre numéro ou attendez quelques minutes');
      } else if (error.message.includes('numéro invalide')) {
        console.log('💡 Numéro de téléphone invalide');
        console.log('   Vérifiez que le numéro est bien formaté pour WhatsApp');
      } else {
        console.log('💡 Erreur technique:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🎉 ==================== TEST TERMINÉ ====================');
  }
}

testWhatsAppFromCorrectFolder();

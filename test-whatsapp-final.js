#!/usr/bin/env node

import dotenv from 'dotenv';
import mongoose from 'mongoose';
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

async function testWhatsAppFinal() {
  try {
    await connectDB();
    
    console.log('📱 ==================== TEST WHATSAPP FINAL ====================');
    
    // Importer le service WhatsApp
    const { 
      initWhatsAppService, 
      sendWhatsAppMessage
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
    
    // Créer des ObjectId valides pour le test
    const campaignId = new mongoose.Types.ObjectId();
    const userId = new mongoose.Types.ObjectId();
    
    console.log('\n📤 Envoi message test avec IDs valides...');
    
    try {
      const result = await sendWhatsAppMessage({
        to: testOrder.clientPhone.replace(/\D/g, ''),
        message: `🧪 Test WhatsApp FINAL - ${new Date().toLocaleString()}\n\nCommande: ${testOrder.product}\nClient: ${testOrder.clientName}\n\n✅ Le service fonctionne !`,
        campaignId: campaignId.toString(),
        userId: userId.toString(),
        firstName: testOrder.clientName?.split(' ')[0] || 'Client'
      });
      
      console.log('🎉 MESSAGE WHATSAPP ENVOYÉ AVEC SUCCÈS !');
      console.log(`   Message ID: ${result.messageId}`);
      console.log(`   Log ID: ${result.logId}`);
      console.log(`   Timestamp: ${result.timestamp}`);
      
      console.log('\n🎊 FÉLICITATIONS ! Le service WhatsApp fonctionne parfaitement !');
      console.log('   Les campagnes WhatsApp devraient maintenant fonctionner.');
      console.log('   Vous pouvez relancer vos campagnes existantes.');
      
    } catch (error) {
      console.error('❌ Erreur envoi WhatsApp:', error.message);
      
      if (error.message.includes('HTTP_466')) {
        console.log('💡 Erreur 466: Numéro invalide ou limite atteinte');
      } else if (error.message.includes('numéro invalide')) {
        console.log('💡 Numéro invalide');
      } else {
        console.log('💡 Erreur technique:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🎉 ==================== TEST FINAL TERMINÉ ====================');
  }
}

testWhatsAppFinal();

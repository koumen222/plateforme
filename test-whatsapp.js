#!/usr/bin/env node

import dotenv from 'dotenv';
import { initWhatsAppService, sendWhatsAppMessage, sanitizePhoneNumber, isValidPhoneNumber } from './services/whatsappService.js';

// Charger les variables d'environnement
dotenv.config();

console.log('🔧 ==================== TEST WHATSAPP SERVICE ====================');
console.log('📋 Variables d\'environnement WhatsApp:');
console.log('   GREEN_API_ID_INSTANCE:', process.env.GREEN_API_ID_INSTANCE ? '✅ Configuré' : '❌ Manquant');
console.log('   GREEN_API_TOKEN_INSTANCE:', process.env.GREEN_API_TOKEN_INSTANCE ? '✅ Configuré' : '❌ Manquant');
console.log('   GREEN_API_URL:', process.env.GREEN_API_URL || 'Non défini');
console.log('   WHATSAPP_FROM_PHONE:', process.env.WHATSAPP_FROM_PHONE || 'Non défini');
console.log('   WHATSAPP_WARMUP_PHONES:', process.env.WHATSAPP_WARMUP_PHONES || 'Non défini');

async function testWhatsAppService() {
  try {
    console.log('\n🚀 Initialisation du service WhatsApp...');
    
    // Tester l'initialisation
    await initWhatsAppService();
    console.log('✅ Service WhatsApp initialisé avec succès');
    
    // Tester la validation de numéros
    console.log('\n📞 Tests de validation de numéros:');
    const testNumbers = [
      '237676778377', // Numéro de test
      '237698459328', // WHATSAPP_FROM_PHONE
      '+237676778377', // Avec +
      '676778377',    // Sans indicatif
      '123456789',    // Invalide
      ''              // Vide
    ];
    
    testNumbers.forEach(phone => {
      const sanitized = sanitizePhoneNumber(phone);
      const valid = isValidPhoneNumber(phone);
      console.log(`   ${phone || '(vide)'} -> "${sanitized}" -> ${valid ? '✅ Valide' : '❌ Invalide'}`);
    });
    
    // Tester l'envoi de message (optionnel - commenter si pas envie d'envoyer)
    console.log('\n📤 Test d\'envoi de message (optionnel)...');
    const testPhone = '237676778377'; // Numéro de test
    const testMessage = 'Test de diagnostic WhatsApp - ' + new Date().toISOString();
    
    if (isValidPhoneNumber(testPhone)) {
      console.log(`   Envoi d'un message de test à ${testPhone}...`);
      
      try {
        const result = await sendWhatsAppMessage({
          to: testPhone,
          message: testMessage,
          campaignId: 'test-diagnostic',
          userId: 'test-user',
          firstName: 'Test'
        });
        
        console.log('✅ Message envoyé avec succès:', result);
      } catch (sendError) {
        console.error('❌ Erreur lors de l\'envoi:', sendError.message);
        
        // Analyse des erreurs courantes
        if (sendError.message.includes('HTTP_466')) {
          console.log('💡 Erreur HTTP 466: Numéro invalide ou limite atteinte');
        } else if (sendError.message.includes('non configuré')) {
          console.log('💡 Service WhatsApp non configuré - vérifiez les variables d\'environnement');
        } else if (sendError.message.includes('fetch')) {
          console.log('💡 Erreur réseau - vérifiez votre connexion internet');
        }
      }
    } else {
      console.log(`❌ Numéro de test invalide: ${testPhone}`);
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Exécuter le test
testWhatsAppService().then(() => {
  console.log('\n🎉 ==================== TEST TERMINÉ ====================');
}).catch(error => {
  console.error('\n💥 ==================== ERREUR CRITIQUE ====================');
  console.error('Erreur:', error.message);
  console.error('Stack:', error.stack);
});

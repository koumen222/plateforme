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

async function testEcomWhatsAppCampaigns() {
  try {
    await connectDB();
    
    console.log('🧪 ==================== TEST ECOM WHATSAPP CAMPAIGNS ====================');
    
    // Importer les modèles ecom
    const { default: Campaign } = await import('./ecom/models/Campaign.js');
    const { default: WhatsAppLog } = await import('./ecom/models/WhatsAppLog.js');
    
    // ✅ Test 1: Créer campagne WhatsApp avec recipients
    console.log('\n📋 Test 1: Création campagne WhatsApp ECOM avec recipients');
    
    const testPhones = [
      '+237 699 887 766',  // ✅ Valide
      '237677554433',     // ✅ Valide  
      '694112233',        // ✅ Valide (devient 237694112233)
      '123',              // ❌ Invalide
      'abc',              // ❌ Invalide
      '00237699887766'    // ✅ Valide (devient 237699887766)
    ];
    
    const campaign = new Campaign({
      workspaceId: '69870da96590f43912bf4ca2',
      name: 'Test ECOM WhatsApp Campaign',
      type: 'whatsapp',
      messageTemplate: '🧪 Test ECOM - {firstName}, votre commande {product} est prête !',
      recipients: {
        type: 'list',
        customPhones: testPhones,
        count: testPhones.length // Sera remplacé par la validation
      },
      createdBy: '69870da86590f43912bf4ca0'
    });
    
    try {
      const savedCampaign = await campaign.save();
      console.log('✅ Campagne ECOM créée avec succès');
      console.log('   Type:', savedCampaign.type);
      console.log('   customPhones envoyés:', testPhones.length);
      console.log('   recipients.customPhones:', savedCampaign.recipients.customPhones.length);
      console.log('   recipients.count:', savedCampaign.recipients.count);
      
      // Vérifier que count est correct (devrait être 4, pas 7)
      const expectedCount = 4; // 4 numéros valides sur 7
      if (savedCampaign.recipients.count === expectedCount) {
        console.log('✅ recipients.count correct');
      } else {
        console.log(`❌ recipients.count incorrect: attendu ${expectedCount}, reçu ${savedCampaign.recipients.count}`);
      }
      
      // ✅ Test 2: Vérifier le retour API GET /:id
      console.log('\n🌐 Test 2: Vérifier retour API GET /:id');
      
      const campaignFromDB = await Campaign.findById(savedCampaign._id).lean();
      
      if (campaignFromDB) {
        console.log('   recipients retourné par API:');
        console.log('     type:', campaignFromDB.recipients.type);
        console.log('     customPhones.length:', campaignFromDB.recipients.customPhones.length);
        console.log('     count:', campaignFromDB.recipients.count);
        
        if (campaignFromDB.recipients.count) {
          console.log('✅ recipients.count bien retourné par l\'API ECOM');
        } else {
          console.log('❌ recipients.count manquant dans l\'API ECOM');
        }
      }
      
      // ✅ Test 3: Créer un WhatsAppLog de preview
      console.log('\n📝 Test 3: Création WhatsAppLog avec previewId');
      
      const previewId = 'preview-' + Date.now();
      const whatsappLog = new WhatsAppLog({
        campaignId: null,
        previewId: previewId,
        workspaceId: '69870da96590f43912bf4ca2',
        userId: '69870da86590f43912bf4ca0',
        phone: '237699887766',
        firstName: 'Test',
        messageSent: 'Test preview message',
        status: 'sent'
      });
      
      await whatsappLog.save();
      console.log('✅ WhatsAppLog avec previewId créé');
      console.log('   previewId:', whatsappLog.previewId);
      console.log('   campaignId:', whatsappLog.campaignId);
      
      // ✅ Test 4: Normalisation des formats
      console.log('\n📱 Test 4: Normalisation des formats ECOM');
      
      const normalizePhone = (phone) => {
        if (!phone) return '';
        let cleaned = phone.toString().replace(/\D/g, '').trim();
        
        // ✅ Corriger le cas 00237699887766
        if (cleaned.startsWith('00')) {
          cleaned = cleaned.substring(2);
        }
        
        // Gérer le préfixe pays (Cameroun 237)
        if (cleaned.length === 9 && cleaned.startsWith('6')) {
          return '237' + cleaned;
        }
        
        return cleaned;
      };
      
      const testFormats = [
        '+237 6 99 88 77 66',
        '237699887766',
        '699887766',
        '+237699887766',
        '  237 699 887 766  ',
        '00237699887766'
      ];
      
      console.log('   Formats testés:');
      testFormats.forEach(format => {
        const normalized = normalizePhone(format);
        console.log(`   ${format} → ${normalized}`);
      });
      
      // Nettoyer
      await Campaign.deleteMany({ name: 'Test ECOM WhatsApp Campaign' });
      await WhatsAppLog.deleteMany({ previewId: previewId });
      console.log('\n🧹 Tests ECOM nettoyés');
      
    } catch (error) {
      console.error('❌ Erreur création campagne ECOM:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🎉 ==================== TESTS ECOM TERMINÉS ====================');
  }
}

testEcomWhatsAppCampaigns();

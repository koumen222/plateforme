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

async function testRecipientsCount() {
  try {
    await connectDB();
    
    console.log('🧪 ==================== TEST RECIPIENTS COUNT ====================');
    
    // Importer les modèles
    const { default: WhatsAppCampaign } = await import('./backend/models/WhatsAppCampaign.js');
    
    // ✅ Test 1: Créer campagne LIST avec numéros valides et invalides
    console.log('\n📋 Test 1: Création campagne LIST avec numéros valides/invalides');
    
    const testPhones = [
      '+237 699 887 766',  // ✅ Valide
      '237677554433',     // ✅ Valide  
      '694112233',        // ✅ Valide (devient 237694112233)
      '123',              // ❌ Invalide
      'abc',              // ❌ Invalide
      '',                 // ❌ Invalide
      '00237699887766'    // ✅ Valide (devient 237699887766)
    ];
    
    const campaign = new WhatsAppCampaign({
      name: 'Test Recipients Count',
      message: '🧪 Test message',
      recipients: {
        type: 'list',
        customPhones: testPhones,
        count: testPhones.length // Sera remplacé par la validation
      },
      createdBy: '507f1f77bcf86cd799439011'
    });
    
    try {
      const savedCampaign = await campaign.save();
      console.log('✅ Campagne créée avec succès');
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
      
    } catch (error) {
      console.error('❌ Erreur création campagne:', error.message);
    }
    
    // ✅ Test 2: Vérifier le retour API GET /:id
    console.log('\n🌐 Test 2: Vérifier retour API GET /:id');
    
    if (campaign._id) {
      const campaignFromDB = await WhatsAppCampaign.findById(campaign._id).lean();
      
      if (campaignFromDB) {
        console.log('   recipients retourné par API:');
        console.log('     type:', campaignFromDB.recipients.type);
        console.log('     customPhones.length:', campaignFromDB.recipients.customPhones.length);
        console.log('     count:', campaignFromDB.recipients.count);
        
        if (campaignFromDB.recipients.count) {
          console.log('✅ recipients.count bien retourné par l\'API');
        } else {
          console.log('❌ recipients.count manquant dans l\'API');
        }
      }
    }
    
    // Nettoyer
    await WhatsAppCampaign.deleteMany({ name: 'Test Recipients Count' });
    console.log('\n🧹 Test nettoyé');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🎉 ==================== TEST TERMINÉ ====================');
  }
}

testRecipientsCount();

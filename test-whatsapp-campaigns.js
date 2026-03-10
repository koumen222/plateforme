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

async function testWhatsAppCampaigns() {
  try {
    await connectDB();
    
    console.log('🧪 ==================== TEST WHATSAPP CAMPAIGNS ====================');
    
    // Importer les modèles avec les bons chemins
    const { default: WhatsAppCampaign } = await import('./backend/models/WhatsAppCampaign.js');
    const { default: User } = await import('./backend/models/User.js');
    
    // ✅ Test 1: Créer campagne list avec 3 numéros
    console.log('\n📋 Test 1: Création campagne LIST avec 3 numéros');
    
    const testPhones = [
      '+237 699 887 766',  // Format avec + et espaces
      '237677554433',     // Format sans +
      '694112233'         // Format court (doit devenir 237694112233)
    ];
    
    const campaign1 = new WhatsAppCampaign({
      name: 'Test Campaign LIST',
      message: '🧪 Test message - {name}',
      recipients: {
        type: 'list',
        customPhones: testPhones,
        count: 3 // Sera remplacé par la validation
      },
      createdBy: '507f1f77bcf86cd799439011' // ObjectId fictif
    });
    
    try {
      const savedCampaign = await campaign1.save();
      console.log('✅ Campagne créée avec succès');
      console.log('   ID:', savedCampaign._id);
      console.log('   customPhones:', savedCampaign.recipients.customPhones);
      console.log('   count:', savedCampaign.recipients.count);
      
      // Vérifier que customPhones est bien persisté
      if (savedCampaign.recipients.customPhones.length === 3) {
        console.log('✅ customPhones bien persisté en DB');
      } else {
        console.log('❌ customPhones mal persisté');
      }
      
    } catch (error) {
      console.error('❌ Erreur création campagne:', error.message);
    }
    
    // ✅ Test 2: Normalisation des formats
    console.log('\n📱 Test 2: Normalisation des formats');
    
    const normalizePhone = (phone) => {
      if (!phone) return '';
      const cleaned = phone.toString().replace(/\D/g, '').trim();
      
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
    
    // ✅ Test 3: Numéros invalides
    console.log('\n❌ Test 3: Numéros invalides');
    
    const invalidPhones = ['123', 'abc', '', '1234567', '69']; // Moins de 8 digits
    
    const campaign3 = new WhatsAppCampaign({
      name: 'Test Invalid Phones',
      message: 'Test',
      recipients: {
        type: 'list',
        customPhones: invalidPhones,
        count: invalidPhones.length
      },
      createdBy: '507f1f77bcf86cd799439011'
    });
    
    try {
      await campaign3.save();
      console.log('❌ ERREUR: Campagne avec numéros invalides acceptée (ne devrait pas arriver)');
    } catch (error) {
      console.log('✅ Campagne avec numéros invalides rejetée:', error.message);
    }
    
    // ✅ Test 4: Simulation d'envoi
    console.log('\n📤 Test 4: Simulation d\'envoi');
    
    if (campaign1._id) {
      console.log('   Simulation envoi campagne ID:', campaign1._id);
      
      // Simuler la logique d'envoi
      const campaign = await WhatsAppCampaign.findById(campaign1._id);
      
      if (campaign) {
        console.log('   🔍 DIAGNOSTIC ENVOI CAMPAGNE:');
        console.log('      Type de recipients:', campaign.recipients?.type);
        console.log('      Segment:', campaign.recipients?.segment);
        console.log('      Longueur customPhones:', campaign.recipients?.customPhones?.length || 0);
        if (campaign.recipients?.customPhones?.length > 0) {
          console.log('      3-5 numéros exemples:', campaign.recipients.customPhones.slice(0, 5));
        }
        console.log('      Count:', campaign.recipients?.count);
        
        // Simuler la création des destinataires
        const normalizePhone = (phone) => {
          if (!phone) return '';
          const cleaned = phone.toString().replace(/\D/g, '').trim();
          
          if (cleaned.length === 9 && cleaned.startsWith('6')) {
            return '237' + cleaned;
          }
          
          return cleaned;
        };
        
        const validPhones = campaign.recipients.customPhones
          .map(phone => normalizePhone(phone))
          .filter(phone => phone.length >= 8);
        
        const users = validPhones.map(phone => ({
          phone: phone,
          phoneNumber: phone,
          name: null,
          _id: null
        }));
        
        console.log(`   ✅ ${users.length} destinataires créés depuis customPhones`);
        users.forEach((user, index) => {
          console.log(`      ${index + 1}. ${user.phone}`);
        });
      }
    }
    
    // Nettoyer les tests
    console.log('\n🧹 Nettoyage des tests...');
    await WhatsAppCampaign.deleteMany({ 
      name: { $in: ['Test Campaign LIST', 'Test Invalid Phones'] }
    });
    console.log('✅ Tests nettoyés');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🎉 ==================== TESTS TERMINÉS ====================');
  }
}

testWhatsAppCampaigns();

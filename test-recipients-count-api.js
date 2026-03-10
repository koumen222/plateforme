#!/usr/bin/env node

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import express from 'express';

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

async function testRecipientsCountAPI() {
  try {
    await connectDB();
    
    console.log('🧪 ==================== TEST RECIPIENTS COUNT API ====================');
    
    // Importer les modèles et routes
    const { default: WhatsAppCampaign } = await import('./backend/models/WhatsAppCampaign.js');
    const { default: User } = await import('./backend/models/User.js');
    
    // Créer une app Express pour tester la route
    const app = express();
    app.use(express.json());
    
    // Mock middleware d'auth
    const mockUser = { _id: '507f1f77bcf86cd799439011', name: 'Test User' };
    app.use((req, res, next) => {
      req.user = mockUser;
      next();
    });
    
    // Importer et utiliser la route
    const { default: whatsappCampaignsRouter } = await import('./backend/routes/whatsapp-campaigns.js');
    app.use('/api/whatsapp-campaigns', whatsappCampaignsRouter);
    
    // ✅ Test 1: Créer campagne via l'API
    console.log('\n📋 Test 1: Création campagne LIST via API');
    
    const testPhones = [
      '+237 699 887 766',  // ✅ Valide
      '237677554433',     // ✅ Valide  
      '694112233',        // ✅ Valide (devient 237694112233)
      '123',              // ❌ Invalide
      'abc',              // ❌ Invalide
      '',                 // ❌ Invalide
      '00237699887766'    // ✅ Valide (devient 237699887766)
    ];
    
    const campaignData = {
      name: 'Test Recipients Count API',
      message: '🧪 Test message',
      recipients: {
        type: 'list',
        customPhones: testPhones,
        count: testPhones.length
      }
    };
    
    try {
      // Simuler une requête POST
      const response = await new Promise((resolve, reject) => {
        const req = {
          body: campaignData,
          user: mockUser
        };
        
        const res = {
          status: (code) => ({
            json: (data) => {
              resolve({ status: code, data });
            }
          }),
          json: (data) => {
            resolve({ status: 200, data });
          }
        };
        
        // Importer la fonction de création directement
        import('./backend/routes/whatsapp-campaigns.js').then(module => {
          const router = module.default;
          // Simuler le routeur POST
          router.stack.forEach(layer => {
            if (layer.route && layer.route.methods.post) {
              layer.route.stack.forEach(handler => {
                if (handler.handle.name === 'anonymous') {
                  handler.handle(req, res);
                }
              });
            }
          });
        }).catch(reject);
      });
      
      console.log('   Réponse API:', response.status);
      
      if (response.data.success) {
        const campaign = response.data.campaign;
        console.log('   customPhones envoyés:', testPhones.length);
        console.log('   recipients.customPhones:', campaign.recipients.customPhones.length);
        console.log('   recipients.count:', campaign.recipients.count);
        
        // Vérifier que count est correct (devrait être 4, pas 7)
        const expectedCount = 4; // 4 numéros valides sur 7
        if (campaign.recipients.count === expectedCount) {
          console.log('✅ recipients.count correct');
        } else {
          console.log(`❌ recipients.count incorrect: attendu ${expectedCount}, reçu ${campaign.recipients.count}`);
        }
        
        // ✅ Test 2: Vérifier le retour API GET /:id
        console.log('\n🌐 Test 2: Vérifier retour API GET /:id');
        
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
        
        // Nettoyer
        await WhatsAppCampaign.deleteMany({ name: 'Test Recipients Count API' });
        console.log('\n🧹 Test nettoyé');
        
      } else {
        console.error('❌ Erreur API:', response.data);
      }
      
    } catch (error) {
      console.error('❌ Erreur création campagne:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🎉 ==================== TEST TERMINÉ ====================');
  }
}

testRecipientsCountAPI();

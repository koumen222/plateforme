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

async function debugRapideWhatsApp() {
  try {
    await connectDB();
    
    console.log('🔍 ==================== DEBUG RAPIDE WHATSAPP ====================');
    
    // ✅ 1. Vérifier instanceId correct
    const instanceId = process.env.GREEN_API_ID_INSTANCE;
    console.log(`✅ instanceId: ${instanceId ? 'OK' : '❌ MANQUANT'} - ${instanceId}`);
    
    // ✅ 2. Vérifier apiTokenInstance correct
    const apiToken = process.env.GREEN_API_TOKEN_INSTANCE;
    console.log(`✅ apiTokenInstance: ${apiToken ? 'OK' : '❌ MANQUANT'} - ${apiToken?.substring(0, 10)}...`);
    
    // ✅ 3. Construire l'URL
    const apiUrl = process.env.GREEN_API_URL || `https://${instanceId}.api.greenapi.com`;
    const endpoint = `${apiUrl}/waInstance${instanceId}/sendMessage/${apiToken}`;
    console.log(`✅ Endpoint: ${endpoint}`);
    
    // ✅ 4. Trouver une commande avec téléphone
    const { default: Order } = await import('./backend/ecom/models/Order.js');
    const testOrder = await Order.findOne({ 
      workspaceId: '69870da96590f43912bf4ca2',
      clientPhone: { $exists: true, $ne: '' }
    });
    
    if (!testOrder) {
      console.log('❌ Aucune commande avec téléphone trouvée');
      return;
    }
    
    console.log(`✅ Commande test: ${testOrder.clientName} - ${testOrder.clientPhone}`);
    
    // ✅ 5. Formater le numéro
    const cleanedPhone = testOrder.clientPhone.replace(/\D/g, '');
    const chatId = `${cleanedPhone}@c.us`;
    console.log(`✅ Numéro formaté: ${chatId}`);
    
    // ✅ 6. Préparer le body
    const body = JSON.stringify({
      chatId: chatId,
      message: `🧪 DEBUG RAPIDE - ${new Date().toLocaleString()}`
    });
    console.log(`✅ Body: ${body}`);
    
    // ✅ 7. Préparer les headers
    const headers = {
      'Content-Type': 'application/json'
    };
    console.log(`✅ Headers: ${JSON.stringify(headers)}`);
    
    // ✅ 8. Faire l'appel API avec logs détaillés
    console.log('\n📡 Appel API Green API...');
    
    const fetchModule = await import('node-fetch');
    const fetch = fetchModule.default;
    
    try {
      console.log('🔗 Envoi de la requête...');
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: headers,
        body: body
      });
      
      // ✅ 9. Log response.status
      console.log(`✅ response.status: ${response.status}`);
      console.log(`✅ response.statusText: ${response.statusText}`);
      
      // ✅ 10. Log response.text()
      const responseText = await response.text();
      console.log(`✅ response.text(): ${responseText}`);
      console.log(`✅ response.length: ${responseText.length}`);
      
      // ✅ 11. Parser JSON avec gestion d'erreur
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('✅ JSON.parse(): SUCCESS');
        console.log(`📦 Data parsed: ${JSON.stringify(data, null, 2)}`);
        
        if (data.idMessage) {
          console.log('🎉 MESSAGE ENVOYÉ AVEC SUCCÈS !');
          console.log(`   Message ID: ${data.idMessage}`);
        } else {
          console.log('⚠️ Pas de idMessage dans la réponse');
        }
        
      } catch (parseError) {
        console.error('❌ JSON.parse() ERROR:', parseError.message);
        console.error('📄 Texte brut qui a causé l\'erreur:', responseText);
        
        // Analyser le texte pour trouver le problème
        if (responseText.trim() === '') {
          console.log('💡 Réponse vide - possible timeout ou problème réseau');
        } else if (responseText.includes('<html>')) {
          console.log('💡 Réponse HTML - possible erreur 404/500');
        } else if (responseText.length < 10) {
          console.log('💡 Réponse très courte - possible erreur de format');
        }
      }
      
    } catch (fetchError) {
      console.error('❌ Erreur fetch:', fetchError.message);
      console.error('Stack:', fetchError.stack);
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🎉 ==================== DEBUG TERMINÉ ====================');
  }
}

debugRapideWhatsApp();

#!/usr/bin/env node

import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Charger les variables d'environnement
dotenv.config();

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

async function checkClientsAndPhones() {
  try {
    await connectDB();
    
    console.log('🔍 ==================== VÉRIFICATION CLIENTS & NUMÉROS ====================');
    
    // Importer les modèles
    const { default: Client } = await import('./backend/ecom/models/Client.js');
    const { default: Order } = await import('./backend/ecom/models/Order.js');
    const { default: AgentConversation } = await import('./backend/ecom/models/AgentConversation.js');
    
    // Vérifier les clients
    console.log('\n👥 Vérification des clients...');
    const clients = await Client.find({});
    console.log(`   Total clients: ${clients.length}`);
    
    const clientsWithPhones = clients.filter(c => c.phone && c.phone.trim());
    console.log(`   Clients avec téléphone: ${clientsWithPhones.length}`);
    
    if (clientsWithPhones.length > 0) {
      console.log('\n📱 Numéros de téléphone trouvés:');
      clientsWithPhones.forEach((client, index) => {
        console.log(`   ${index + 1}. ${client.name || 'Sans nom'}: ${client.phone}`);
      });
    }
    
    // Vérifier les commandes
    console.log('\n📦 Vérification des commandes...');
    const orders = await Order.find({});
    console.log(`   Total commandes: ${orders.length}`);
    
    const ordersWithPhones = orders.filter(o => o.clientPhone && o.clientPhone.trim());
    console.log(`   Commandes avec téléphone: ${ordersWithPhones.length}`);
    
    if (ordersWithPhones.length > 0) {
      console.log('\n📱 Numéros dans les commandes:');
      ordersWithPhones.forEach((order, index) => {
        console.log(`   ${index + 1}. ${order.clientName}: ${order.clientPhone} (${order.product})`);
      });
    }
    
    // Vérifier les conversations agent
    console.log('\n🤖 Vérification des conversations agent...');
    const conversations = await AgentConversation.find({});
    console.log(`   Total conversations: ${conversations.length}`);
    
    const conversationsWithPhones = conversations.filter(c => c.clientPhone && c.clientPhone.trim());
    console.log(`   Conversations avec téléphone: ${conversationsWithPhones.length}`);
    
    if (conversationsWithPhones.length > 0) {
      console.log('\n📱 Numéros dans les conversations:');
      conversationsWithPhones.forEach((conv, index) => {
        console.log(`   ${index + 1}. ${conv.clientName}: ${conv.clientPhone} (${conv.product}) - ${conv.active ? 'Actif' : 'Inactif'}`);
      });
    }
    
    // Vérifier les formats de numéros
    console.log('\n🔍 Analyse des formats de numéros:');
    const allPhones = new Set();
    
    clientsWithPhones.forEach(c => allPhones.add(c.phone.trim()));
    ordersWithPhones.forEach(o => allPhones.add(o.clientPhone.trim()));
    conversationsWithPhones.forEach(c => allPhones.add(c.clientPhone.trim()));
    
    console.log(`   Total numéros uniques: ${allPhones.size}`);
    
    const phoneFormats = {
      valid: [],
      invalid: [],
      needsPrefix: []
    };
    
    allPhones.forEach(phone => {
      // Nettoyer le numéro
      const cleanPhone = phone.replace(/\D/g, '');
      
      if (cleanPhone.length === 9 && cleanPhone.startsWith('6')) {
        phoneFormats.needsPrefix.push(phone);
      } else if (cleanPhone.length >= 10 && cleanPhone.startsWith('237')) {
        phoneFormats.valid.push(phone);
      } else {
        phoneFormats.invalid.push(phone);
      }
    });
    
    console.log(`\n✅ Numéros valides (avec indicatif): ${phoneFormats.valid.length}`);
    phoneFormats.valid.forEach(p => console.log(`   - ${p}`));
    
    console.log(`\n⚠️ Numéros qui besoin du préfixe 237: ${phoneFormats.needsPrefix.length}`);
    phoneFormats.needsPrefix.forEach(p => console.log(`   - ${p} -> 237${p.replace(/\D/g, '')}`));
    
    console.log(`\n❌ Numéros invalides: ${phoneFormats.invalid.length}`);
    phoneFormats.invalid.forEach(p => console.log(`   - ${p}`));
    
    // Recommandations
    console.log('\n💡 RECOMMANDATIONS:');
    if (phoneFormats.needsPrefix.length > 0) {
      console.log('   1. Ajouter le préfixe 237 aux numéros sans indicatif');
      console.log('   2. Mettre à jour la base de données avec les numéros corrigés');
    }
    
    if (phoneFormats.invalid.length > 0) {
      console.log('   3. Corriger ou supprimer les numéros invalides');
    }
    
    if (phoneFormats.valid.length === 0 && phoneFormats.needsPrefix.length === 0) {
      console.log('   ❌ AUCUN NUMÉRO VALIDE TROUVÉ - C\'est pourquoi les campagnes ont 0 ciblés !');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🎉 ==================== VÉRIFICATION TERMINÉE ====================');
  }
}

checkClientsAndPhones();

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

async function checkCampaignsAndOrders() {
  try {
    await connectDB();
    
    console.log('🔍 ==================== DIAGNOSTIC CAMPAGNES WHATSAPP ====================');
    
    // Importer les modèles
    const { default: Order } = await import('./backend/ecom/models/Order.js');
    const { default: Campaign } = await import('./backend/ecom/models/Campaign.js');
    const { default: Client } = await import('./backend/ecom/models/Client.js');
    
    // Vérifier les commandes par statut
    console.log('\n📊 Commandes par statut:');
    const orderStats = await Order.aggregate([
      { $match: { workspaceId: '69870da96590f43912bf4ca2' } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    orderStats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count} commandes`);
    });
    
    // Vérifier spécifiquement les statuts utilisés dans les campagnes
    const campaignStatuses = ['called', 'postponed', 'unreachable', 'pending'];
    console.log('\n🎯 Vérification des statuts de campagne:');
    
    for (const status of campaignStatuses) {
      const orders = await Order.find({ 
        workspaceId: '69870da96590f43912bf4ca2',
        status: status,
        clientPhone: { $exists: true, $ne: '' }
      }).select('clientName clientPhone product status').limit(5);
      
      console.log(`\n   Statut "${status}": ${orders.length} commandes avec téléphone`);
      
      if (orders.length > 0) {
        orders.forEach((order, index) => {
          console.log(`     ${index + 1}. ${order.clientName} - ${order.clientPhone} - ${order.product}`);
        });
      }
    }
    
    // Vérifier les clients
    console.log('\n👥 Clients dans la base:');
    const clientStats = await Client.aggregate([
      { $match: { workspaceId: '69870da96590f43912bf4ca2' } },
      { $group: { _id: null, total: { $sum: 1 }, withPhone: { 
        $sum: { $cond: [{ $and: [{ $ne: ['$phone', null] }, { $ne: ['$phone', ''] }] }, 1, 0] } 
      }}}
    ]);
    
    if (clientStats.length > 0) {
      const stats = clientStats[0];
      console.log(`   Total clients: ${stats.total}`);
      console.log(`   Avec téléphone: ${stats.withPhone}`);
    }
    
    // Afficher quelques clients avec téléphone
    const clientsWithPhone = await Client.find({ 
      workspaceId: '69870da96590f43912bf4ca2',
      phone: { $exists: true, $ne: '' }
    }).select('firstName lastName phone').limit(5);
    
    if (clientsWithPhone.length > 0) {
      console.log('\n   Exemples de clients avec téléphone:');
      clientsWithPhone.forEach((client, index) => {
        console.log(`     ${index + 1}. ${client.firstName} ${client.lastName} - ${client.phone}`);
      });
    }
    
    // Vérifier les campagnes récentes
    console.log('\n📋 Campagnes récentes:');
    const recentCampaigns = await Campaign.find({ 
      workspaceId: '69870da96590f43912bf4ca2'
    }).sort({ createdAt: -1 }).limit(5);
    
    recentCampaigns.forEach((campaign, index) => {
      console.log(`   ${index + 1}. ${campaign.name} - ${campaign.status} - ${campaign.stats?.targeted || 0} ciblés`);
      
      if (campaign.targetFilters && campaign.targetFilters.orderStatus) {
        console.log(`      Filtre: orderStatus = ${campaign.targetFilters.orderStatus}`);
      }
    });
    
    // Diagnostic du problème
    console.log('\n💡 DIAGNOSTIC:');
    
    const hasOrdersWithStatus = await Order.countDocuments({ 
      workspaceId: '69870da96590f43912bf4ca2',
      status: { $in: campaignStatuses },
      clientPhone: { $exists: true, $ne: '' }
    });
    
    if (hasOrdersWithStatus === 0) {
      console.log('   ❌ PROBLÈME TROUVÉ: Aucune commande avec les statuts de campagne et téléphone valide');
      console.log('   🔧 SOLUTIONS:');
      console.log('      1. Importer des commandes depuis Google Sheets');
      console.log('      2. Mettre à jour manuellement les statuts des commandes existantes');
      console.log('      3. Ajouter des numéros de téléphone aux commandes');
    } else {
      console.log(`   ✅ ${hasOrdersWithStatus} commandes trouvées avec les bons statuts`);
    }
    
    // Vérifier la configuration WhatsApp
    console.log('\n📱 Configuration WhatsApp:');
    console.log(`   GREEN_API_ID_INSTANCE: ${process.env.GREEN_API_ID_INSTANCE ? '✅ Configuré' : '❌ Manquant'}`);
    console.log(`   GREEN_API_TOKEN_INSTANCE: ${process.env.GREEN_API_TOKEN_INSTANCE ? '✅ Configuré' : '❌ Manquant'}`);
    console.log(`   GREEN_API_URL: ${process.env.GREEN_API_URL || 'Non défini'}`);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🎉 ==================== DIAGNOSTIC TERMINÉ ====================');
  }
}

checkCampaignsAndOrders();

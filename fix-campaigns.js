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

async function updateOrderStatuses() {
  try {
    await connectDB();
    
    console.log('🔧 ==================== MISE À JOUR STATUTS COMMANDES ====================');
    
    // Importer le modèle Order
    const { default: Order } = await import('./backend/ecom/models/Order.js');
    
    // Vérifier les commandes existantes
    const allOrders = await Order.find({ 
      workspaceId: '69870da96590f43912bf4ca2'
    }).select('clientName clientPhone status product').limit(20);
    
    console.log(`\n📦 ${allOrders.length} commandes trouvées au total`);
    
    if (allOrders.length === 0) {
      console.log('\n❌ Aucune commande trouvée. Vous devez d\'abord importer des commandes.');
      console.log('\n💡 Options:');
      console.log('   1. Importez depuis Google Sheets (via l\'interface)');
      console.log('   2. Créez des commandes manuellement');
      console.log('   3. Utilisez l\'API pour créer des commandes test');
      return;
    }
    
    console.log('\n📋 Commandes actuelles:');
    allOrders.forEach((order, index) => {
      console.log(`   ${index + 1}. ${order.clientName} - ${order.clientPhone} - ${order.status} - ${order.product}`);
    });
    
    // Compter par statut
    const statusCounts = await Order.aggregate([
      { $match: { workspaceId: '69870da96590f43912bf4ca2' } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\n📊 Répartition par statut:');
    statusCounts.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count} commandes`);
    });
    
    // Mettre à jour quelques commandes pour tester
    const pendingOrders = await Order.find({ 
      workspaceId: '69870da96590f43912bf4ca2',
      status: 'pending',
      clientPhone: { $exists: true, $ne: '' }
    }).limit(10);
    
    if (pendingOrders.length > 0) {
      console.log(`\n🔄 Mise à jour de ${pendingOrders.length} commandes 'pending' vers d'autres statuts...`);
      
      const statuses = ['called', 'postponed', 'unreachable'];
      let updatedCount = 0;
      
      for (let i = 0; i < pendingOrders.length; i++) {
        const order = pendingOrders[i];
        const newStatus = statuses[i % statuses.length];
        
        await Order.findByIdAndUpdate(order._id, { status: newStatus });
        console.log(`   ✅ ${order.clientName}: ${order.status} → ${newStatus}`);
        updatedCount++;
      }
      
      console.log(`\n🎉 ${updatedCount} commandes mises à jour avec succès !`);
      
      // Vérifier le résultat
      console.log('\n📊 Nouvelle répartition:');
      const newStatusCounts = await Order.aggregate([
        { $match: { workspaceId: '69870da96590f43912bf4ca2' } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
      
      newStatusCounts.forEach(stat => {
        console.log(`   ${stat._id}: ${stat.count} commandes`);
      });
      
    } else {
      console.log('\n⚠️ Aucune commande avec statut "pending" et téléphone trouvé');
      console.log('   Créez d\'abord des commandes avec des numéros de téléphone');
    }
    
    // Tester une campagne
    console.log('\n🧪 Test d\'envoi WhatsApp...');
    
    // Trouver une commande avec téléphone
    const testOrder = await Order.findOne({ 
      workspaceId: '69870da96590f43912bf4ca2',
      clientPhone: { $exists: true, $ne: '' }
    });
    
    if (testOrder) {
      console.log(`   Commande test: ${testOrder.clientName} - ${testOrder.clientPhone}`);
      
      // Importer le service WhatsApp
      const { sendWhatsAppMessage } = await import('./backend/services/whatsappService.js');
      
      try {
        const result = await sendWhatsAppMessage({
          to: testOrder.clientPhone.replace(/\D/g, ''),
          message: `🧪 Test de diagnostic - Commande: ${testOrder.product} - ${new Date().toLocaleString()}`,
          campaignId: 'test-diagnostic',
          userId: 'test-user',
          firstName: testOrder.clientName?.split(' ')[0] || 'Client'
        });
        
        console.log('✅ Message WhatsApp envoyé avec succès !');
        console.log(`   Message ID: ${result.messageId}`);
        console.log(`   Log ID: ${result.logId}`);
        
      } catch (error) {
        console.error('❌ Erreur envoi WhatsApp:', error.message);
        
        if (error.message.includes('HTTP_466')) {
          console.log('💡 Erreur 466: Numéro invalide ou limite atteinte');
        } else if (error.message.includes('non configuré')) {
          console.log('💡 Service WhatsApp non configuré');
        }
      }
      
    } else {
      console.log('❌ Aucune commande avec téléphone trouvée pour le test');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🎉 ==================== MISE À JOUR TERMINÉE ====================');
  }
}

updateOrderStatuses();

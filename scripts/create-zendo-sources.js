import mongoose from 'mongoose';
import dotenv from 'dotenv';
import OrderSource from '../ecom/models/OrderSource.js';
import EcomUser from '../ecom/models/EcomUser.js';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/plateforme';

async function createZendoSources() {
  try {
    console.log('🔄 Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Trouver un utilisateur admin
    const adminUser = await EcomUser.findOne({ role: 'ecom_admin' });
    if (!adminUser) {
      console.error('❌ Aucun utilisateur admin trouvé');
      return;
    }

    console.log('👤 Utilisateur admin trouvé:', adminUser.email);
    console.log('🏢 WorkspaceId:', adminUser.workspaceId);

    // Supprimer les sources existantes
    await OrderSource.deleteMany({ workspaceId: adminUser.workspaceId });
    console.log('🗑️ Sources existantes supprimées');

    // Créer les sources Zendo et Afriexpress
    const zendoSources = [
      {
        name: 'Commandes Zendo',
        description: 'Source principale synchronisée depuis Google Sheets',
        color: '#10B981',
        icon: '📊',
        workspaceId: adminUser.workspaceId,
        createdBy: adminUser._id,
        metadata: {
          type: 'google_sheets',
          lastSync: '17/02'
        }
      },
      {
        name: 'Commande afriexpress',
        description: 'Source Afriexpress synchronisée depuis Google Sheets',
        color: '#F97316',
        icon: '🚚',
        workspaceId: adminUser.workspaceId,
        createdBy: adminUser._id,
        metadata: {
          type: 'google_sheets',
          lastSync: '17/02'
        }
      }
    ];

    const createdSources = await OrderSource.insertMany(zendoSources);
    console.log('✅ Sources Zendo créées avec succès:', createdSources.length);
    
    createdSources.forEach(source => {
      console.log(`  - ${source.icon} ${source.name} (${source.color})`);
      console.log(`    📊 Dernière sync: ${source.metadata.lastSync}`);
    });

    // Afficher toutes les sources finales
    const allSources = await OrderSource.find({ 
      workspaceId: adminUser.workspaceId,
      isActive: true 
    }).sort({ name: 1 });
    
    console.log('\n📋 Liste complète des sources disponibles:');
    allSources.forEach(source => {
      console.log(`  - ${source.icon} ${source.name} (${source.color})`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

createZendoSources();

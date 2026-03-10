import mongoose from 'mongoose';
import OrderSource from '../ecom/models/OrderSource.js';
import EcomUser from '../ecom/models/EcomUser.js';

// Configuration MongoDB - utiliser les variables d'environnement
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function createDefaultSources() {
  try {
    console.log('🔄 Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Trouver un utilisateur admin pour créer les sources
    const adminUser = await EcomUser.findOne({ role: 'ecom_admin' });
    if (!adminUser) {
      console.error('❌ Aucun utilisateur admin trouvé');
      return;
    }

    console.log('👤 Utilisateur admin trouvé:', adminUser.email);
    console.log('🏢 WorkspaceId:', adminUser.workspaceId);

    // Vérifier si des sources existent déjà
    const existingSources = await OrderSource.find({ workspaceId: adminUser.workspaceId });
    console.log('📊 Sources existantes:', existingSources.length);

    if (existingSources.length === 0) {
      console.log('🆕 Création des sources par défaut...');

      const defaultSources = [
        {
          name: 'WhatsApp',
          description: 'Commandes via WhatsApp',
          color: '#25D366',
          icon: '📱',
          workspaceId: adminUser.workspaceId,
          createdBy: adminUser._id
        },
        {
          name: 'Facebook',
          description: 'Commandes via Facebook Messenger',
          color: '#1877F2',
          icon: '📘',
          workspaceId: adminUser.workspaceId,
          createdBy: adminUser._id
        },
        {
          name: 'Instagram',
          description: 'Commandes via Instagram DM',
          color: '#E4405F',
          icon: '📷',
          workspaceId: adminUser.workspaceId,
          createdBy: adminUser._id
        },
        {
          name: 'Site Web',
          description: 'Commandes via le site web',
          color: '#3B82F6',
          icon: '🌐',
          workspaceId: adminUser.workspaceId,
          createdBy: adminUser._id
        },
        {
          name: 'Téléphone',
          description: 'Commandes par téléphone',
          color: '#10B981',
          icon: '📞',
          workspaceId: adminUser.workspaceId,
          createdBy: adminUser._id
        }
      ];

      const createdSources = await OrderSource.insertMany(defaultSources);
      console.log('✅ Sources créées:', createdSources.length);
      
      createdSources.forEach(source => {
        console.log(`  - ${source.icon} ${source.name} (${source.color})`);
      });
    } else {
      console.log('ℹ️ Des sources existent déjà');
      existingSources.forEach(source => {
        console.log(`  - ${source.icon} ${source.name} (${source.color})`);
      });
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

createDefaultSources();

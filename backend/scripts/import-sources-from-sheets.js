import mongoose from 'mongoose';
import dotenv from 'dotenv';
import OrderSource from '../ecom/models/OrderSource.js';
import EcomUser from '../ecom/models/EcomUser.js';
import WorkspaceSettings from '../ecom/models/WorkspaceSettings.js';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/plateforme';

async function importSourcesFromSheets() {
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

    // Récupérer les settings du workspace
    const workspaceSettings = await WorkspaceSettings.findOne({ 
      workspaceId: adminUser.workspaceId 
    });
    
    if (!workspaceSettings) {
      console.error('❌ Aucun WorkspaceSettings trouvé');
      return;
    }

    console.log('📋 WorkspaceSettings trouvé');

    // Sources à créer depuis les différentes configurations
    const sourcesToCreate = [];

    // 1. Source legacy Google Sheets
    if (workspaceSettings.googleSheets?.spreadsheetId) {
      sourcesToCreate.push({
        name: 'Commandes Zendo',
        description: 'Source principale synchronisée depuis Google Sheets',
        color: '#10B981',
        icon: '📊',
        workspaceId: adminUser.workspaceId,
        createdBy: adminUser._id,
        metadata: {
          type: 'google_sheets',
          spreadsheetId: workspaceSettings.googleSheets.spreadsheetId,
          sheetName: workspaceSettings.googleSheets.sheetName || 'Sheet1'
        }
      });
    }

    // 2. Sources custom depuis settings.sources
    if (workspaceSettings.sources && workspaceSettings.sources.length > 0) {
      workspaceSettings.sources.forEach((source, index) => {
        if (source.isActive) {
          sourcesToCreate.push({
            name: source.name || `Source ${index + 1}`,
            description: `Source synchronisée depuis Google Sheets: ${source.spreadsheetId}`,
            color: source.color || '#3B82F6',
            icon: source.icon || '📱',
            workspaceId: adminUser.workspaceId,
            createdBy: adminUser._id,
            metadata: {
              type: 'google_sheets',
              spreadsheetId: source.spreadsheetId,
              sheetName: source.sheetName || 'Sheet1'
            }
          });
        }
      });
    }

    // 3. Sources par défaut si aucune n'est configurée
    if (sourcesToCreate.length === 0) {
      console.log('ℹ️ Aucune source Google Sheets configurée, création des sources par défaut...');
      const defaultSources = [
        {
          name: 'WhatsApp',
          description: 'Commandes via WhatsApp',
          color: '#25D366',
          icon: '📱',
          workspaceId: adminUser.workspaceId,
          createdBy: adminUser._id,
          metadata: {
            type: 'manual'
          }
        },
        {
          name: 'Facebook',
          description: 'Commandes via Facebook Messenger',
          color: '#1877F2',
          icon: '📘',
          workspaceId: adminUser.workspaceId,
          createdBy: adminUser._id,
          metadata: {
            type: 'manual'
          }
        },
        {
          name: 'Instagram',
          description: 'Commandes via Instagram DM',
          color: '#E4405F',
          icon: '📷',
          workspaceId: adminUser.workspaceId,
          createdBy: adminUser._id,
          metadata: {
            type: 'manual'
          }
        },
        {
          name: 'Site Web',
          description: 'Commandes via le site web',
          color: '#3B82F6',
          icon: '🌐',
          workspaceId: adminUser.workspaceId,
          createdBy: adminUser._id,
          metadata: {
            type: 'manual'
          }
        },
        {
          name: 'Téléphone',
          description: 'Commandes par téléphone',
          color: '#10B981',
          icon: '📞',
          workspaceId: adminUser.workspaceId,
          createdBy: adminUser._id,
          metadata: {
            type: 'manual'
          }
        }
      ];
      sourcesToCreate.push(...defaultSources);
    }

    // Vérifier les sources existantes
    const existingSources = await OrderSource.find({ 
      workspaceId: adminUser.workspaceId 
    });
    
    console.log(`📊 Sources existantes: ${existingSources.length}`);
    console.log(`🆕 Sources à créer: ${sourcesToCreate.length}`);

    // Créer seulement les sources qui n'existent pas
    const existingNames = new Set(existingSources.map(s => s.name));
    const newSources = sourcesToCreate.filter(source => !existingNames.has(source.name));

    if (newSources.length > 0) {
      const createdSources = await OrderSource.insertMany(newSources);
      console.log('✅ Sources créées avec succès:', createdSources.length);
      
      createdSources.forEach(source => {
        console.log(`  - ${source.icon} ${source.name} (${source.color})`);
        if (source.metadata?.type === 'google_sheets') {
          console.log(`    📊 Google Sheets: ${source.metadata.spreadsheetId}`);
        }
      });
    } else {
      console.log('ℹ️ Toutes les sources existent déjà');
    }

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

importSourcesFromSheets();

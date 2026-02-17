import mongoose from 'mongoose';
import dotenv from 'dotenv';
import OrderSource from '../ecom/models/OrderSource.js';
import EcomUser from '../ecom/models/EcomUser.js';
import WorkspaceSettings from '../ecom/models/WorkspaceSettings.js';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/plateforme';

async function syncRealSources() {
  try {
    console.log('🔄 Connexion à MongoDB...');
    
    // Options de connexion optimisées pour MongoDB Atlas
    const connectionOptions = {
      serverSelectionTimeoutMS: 0, // Pas de timeout — attend indéfiniment le serveur
      socketTimeoutMS: 0, // Pas de timeout socket
      connectTimeoutMS: 0, // Pas de timeout connexion
      heartbeatFrequencyMS: 10000, // Vérifier la connexion toutes les 10s
      maxPoolSize: 10,
      minPoolSize: 2,
      retryWrites: true,
      retryReads: true,
      w: 'majority',
      // Pour MongoDB Atlas spécifiquement
      ...(MONGODB_URI.includes('mongodb.net') && {
        tls: true,
        tlsAllowInvalidCertificates: false,
      })
    };
    
    await mongoose.connect(MONGODB_URI, connectionOptions);
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
    console.log('🔍 Sources configurées:', workspaceSettings.sources?.length || 0);

    // Supprimer toutes les sources existantes
    await OrderSource.deleteMany({ workspaceId: adminUser.workspaceId });
    console.log('🗑️ Sources existantes supprimées');

    // Créer les vraies sources depuis Google Sheets
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
            description: `Source synchronisée depuis Google Sheets`,
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

    if (sourcesToCreate.length > 0) {
      const createdSources = await OrderSource.insertMany(sourcesToCreate);
      console.log('✅ Sources synchronisées avec succès:', createdSources.length);
      
      createdSources.forEach(source => {
        console.log(`  - ${source.icon} ${source.name} (${source.color})`);
        if (source.metadata?.type === 'google_sheets') {
          console.log(`    📊 Google Sheets: ${source.metadata.spreadsheetId}`);
        }
      });
    } else {
      console.log('ℹ️ Aucune source Google Sheets configurée');
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

syncRealSources();

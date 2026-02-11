import mongoose from 'mongoose';
import WorkspaceSettings from '../ecom/models/WorkspaceSettings.js';
import { connectDB } from '../config/database.js';

const addSyncLocksField = async () => {
  try {
    await connectDB();
    console.log('🔗 Connexion à MongoDB établie');

    // Trouver tous les documents sans le champ syncLocks
    const settingsWithoutLocks = await WorkspaceSettings.find({ 
      syncLocks: { $exists: false } 
    });

    console.log(`📋 ${settingsWithoutLocks.length} documents à mettre à jour`);

    if (settingsWithoutLocks.length > 0) {
      // Ajouter le champ syncLocks avec un tableau vide
      const result = await WorkspaceSettings.updateMany(
        { syncLocks: { $exists: false } },
        { $set: { syncLocks: [] } }
      );

      console.log(`✅ ${result.modifiedCount} documents mis à jour avec le champ syncLocks`);
    } else {
      console.log('ℹ️ Tous les documents ont déjà le champ syncLocks');
    }

    // Vérifier le résultat
    const allSettings = await WorkspaceSettings.find({});
    console.log(`📊 Total des documents: ${allSettings.length}`);
    
    for (const setting of allSettings) {
      console.log(`🏢 Workspace: ${setting.workspaceId}`);
      console.log(`🔒 syncLocks: ${setting.syncLocks ? setting.syncLocks.length : 'non défini'} éléments`);
    }

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnexion de MongoDB');
  }
};

addSyncLocksField();

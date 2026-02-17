import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const cleanupIndexes = async () => {
  try {
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté.');

    const collection = mongoose.connection.collection('ecom_goals');
    
    console.log('🔍 Récupération des index existants...');
    const indexes = await collection.indexes();
    console.log('Index actuels:', JSON.stringify(indexes, null, 2));

    const oldIndexName = 'workspaceId_1_year_1_weekNumber_1_type_1';
    
    if (indexes.some(idx => idx.name === oldIndexName)) {
      console.log(`🗑️ Suppression de l'ancien index: ${oldIndexName}...`);
      await collection.dropIndex(oldIndexName);
      console.log('✅ Index supprimé.');
    } else {
      console.log('ℹ️ L\'ancien index n\'existe pas ou a déjà été supprimé.');
    }

    console.log('🚀 Fin du nettoyage.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
    process.exit(1);
  }
};

cleanupIndexes();

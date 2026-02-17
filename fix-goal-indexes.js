import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Goal from './ecom/models/Goal.js';

// Charger les variables d'environnement
dotenv.config();

async function fixGoalIndexes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connecté à MongoDB');

    // Get the collection
    const collection = mongoose.connection.db.collection('ecom_goals');
    
    // Drop all existing indexes except the default _id index
    console.log('🗑️  Suppression des anciens index...');
    await collection.dropIndexes();
    console.log('✅ Anciens index supprimés');

    // Recreate indexes with the new schema
    console.log('📧 Création des nouveaux index...');
    await Goal.createIndexes();
    console.log('✅ Nouveaux index créés');

    // List current indexes to verify
    const indexes = await collection.listIndexes().toArray();
    console.log('📋 Index actuels:');
    indexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    console.log('🎉 Index fixés avec succès!');
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixGoalIndexes();

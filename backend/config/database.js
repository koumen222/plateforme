import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/plateforme';

export const connectDB = async () => {
  try {
    console.log('🔄 Tentative de connexion à MongoDB...');
    console.log('📡 URI:', MONGO_URI.replace(/\/\/.*@/, '//***:***@')); // Masquer les credentials dans les logs
    
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout après 5s
    });
    
    console.log('✅ MongoDB connecté avec succès');
    console.log('📊 Base de données:', mongoose.connection.db.databaseName);
    console.log('🌐 Host:', mongoose.connection.host);
    console.log('🔌 Port:', mongoose.connection.port);
    
    // Écouter les événements de connexion
    mongoose.connection.on('error', (err) => {
      console.error('❌ Erreur MongoDB:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB déconnecté');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnecté');
    });
    
  } catch (error) {
    console.error('❌ Erreur de connexion MongoDB:');
    console.error('   Type:', error.name);
    console.error('   Message:', error.message);
    
    if (error.name === 'MongoServerSelectionError') {
      console.error('   Cause: Impossible de se connecter au serveur MongoDB');
      if (MONGO_URI.includes('mongodb.net')) {
        console.error('   Vous utilisez MongoDB Atlas');
        console.error('   Vérifiez:');
        console.error('     - Que votre IP est autorisée dans MongoDB Atlas');
        console.error('     - Que l\'URI de connexion est correcte');
        console.error('     - Que votre connexion internet fonctionne');
        console.error('     - Que les credentials (username/password) sont corrects');
      } else {
        console.error('   Vérifiez que MongoDB est démarré localement');
        console.error('   Commande: mongod (ou service MongoDB démarré)');
      }
    } else if (error.name === 'MongoParseError') {
      console.error('   Cause: URI MongoDB invalide');
      console.error('   Vérifiez le format de MONGO_URI dans votre .env');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('   Cause: Impossible de résoudre le nom de domaine');
      console.error('   Vérifiez votre connexion internet et l\'URI MongoDB');
    }
    
    console.error('\n   URI utilisée (masquée):', MONGO_URI.replace(/\/\/.*@/, '//***:***@'));
    process.exit(1);
  }
};


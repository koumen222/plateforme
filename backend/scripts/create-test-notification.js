import dotenv from 'dotenv';
import { connectDB } from '../config/database.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

dotenv.config();

/**
 * Script pour créer une notification de test
 * 
 * Usage:
 *   node scripts/create-test-notification.js user@example.com
 */
async function createTestNotification() {
  try {
    console.log('🧪 Création d\'une notification de test\n');

    // 1. Connexion MongoDB
    console.log('📡 Connexion à MongoDB...');
    await connectDB();
    console.log('✅ MongoDB connecté\n');

    // 2. Trouver l'utilisateur
    const userEmail = process.argv[2];
    
    if (!userEmail) {
      console.error('❌ Veuillez fournir un email utilisateur');
      console.log('\nUsage: node scripts/create-test-notification.js user@example.com');
      process.exit(1);
    }

    const user = await User.findOne({ email: userEmail.toLowerCase() });
    
    if (!user) {
      console.error(`❌ Utilisateur non trouvé: ${userEmail}`);
      process.exit(1);
    }

    console.log(`✅ Utilisateur trouvé: ${user.email}`);
    console.log(`   Nom: ${user.name || 'Non défini'}`);
    console.log(`   Status: ${user.status}\n`);

    // 3. Créer une notification de test
    const notification = await Notification.createNotification({
      userId: user._id,
      type: 'system',
      title: '🧪 Notification de test',
      message: 'Ceci est une notification de test créée depuis le backend. Elle devrait apparaître dans votre interface !',
      link: '/test-notifications',
      icon: '/img/logo.svg',
      metadata: {
        test: true,
        createdAt: new Date().toISOString()
      }
    });

    console.log('✅ Notification créée avec succès !');
    console.log(`   ID: ${notification._id}`);
    console.log(`   Type: ${notification.type}`);
    console.log(`   Titre: ${notification.title}`);
    console.log(`   Message: ${notification.message}`);
    console.log(`   Lien: ${notification.link || 'Aucun'}`);
    console.log(`   Lu: ${notification.read ? 'Oui' : 'Non'}`);
    console.log(`   Créée le: ${notification.createdAt}`);

    console.log('\n💡 La notification devrait maintenant apparaître dans l\'interface utilisateur !');
    console.log('   Rafraîchissez la page pour la voir.');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erreur lors de la création de la notification:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Exécuter le script
createTestNotification();

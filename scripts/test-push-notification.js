import dotenv from 'dotenv';
import { connectDB } from '../config/database.js';
import { configureWebPush, sendPushNotification } from '../config/push.js';
import PushSubscription from '../models/PushSubscription.js';
import User from '../models/User.js';

dotenv.config();

/**
 * Script de test pour envoyer une notification push
 * 
 * Usage:
 *   node scripts/test-push-notification.js
 * 
 * Ou avec un email spécifique:
 *   node scripts/test-push-notification.js user@example.com
 */
async function testPushNotification() {
  try {
    console.log('🧪 Test de notification push\n');

    // 1. Connexion MongoDB
    console.log('📡 Connexion à MongoDB...');
    await connectDB();
    console.log('✅ MongoDB connecté\n');

    // 2. Configuration Web Push
    console.log('🔧 Configuration Web Push...');
    configureWebPush();
    console.log('✅ Web Push configuré\n');

    // 3. Trouver un utilisateur avec un abonnement actif
    const userEmail = process.argv[2]; // Email optionnel en argument
    
    let user;
    if (userEmail) {
      console.log(`🔍 Recherche de l'utilisateur: ${userEmail}`);
      user = await User.findOne({ email: userEmail.toLowerCase() });
      if (!user) {
        console.error(`❌ Utilisateur non trouvé: ${userEmail}`);
        process.exit(1);
      }
    } else {
      console.log('🔍 Recherche d\'un utilisateur actif avec abonnement...');
      // Trouver un utilisateur actif qui a des abonnements
      const usersWithSubscriptions = await User.aggregate([
        { $match: { status: 'active' } },
        {
          $lookup: {
            from: 'pushsubscriptions',
            localField: '_id',
            foreignField: 'userId',
            as: 'subscriptions'
          }
        },
        { $match: { 'subscriptions.isActive': true } },
        { $limit: 1 }
      ]);

      if (usersWithSubscriptions.length === 0) {
        console.error('❌ Aucun utilisateur actif avec abonnement trouvé');
        console.log('\n💡 Pour tester:');
        console.log('   1. Connectez-vous sur le frontend (http://localhost:5173)');
        console.log('   2. Activez les notifications push');
        console.log('   3. Relancez ce script');
        console.log('\n   Ou spécifiez un email:');
        console.log('   node scripts/test-push-notification.js user@example.com');
        process.exit(1);
      }

      user = await User.findById(usersWithSubscriptions[0]._id);
    }

    console.log(`✅ Utilisateur trouvé: ${user.email}`);
    console.log(`   Nom: ${user.name || 'Non défini'}`);
    console.log(`   Status: ${user.status}\n`);

    // 4. Récupérer les abonnements actifs
    console.log('📋 Récupération des abonnements actifs...');
    const subscriptions = await PushSubscription.findActiveByUserId(user._id);
    
    if (subscriptions.length === 0) {
      console.error('❌ Aucun abonnement actif trouvé pour cet utilisateur');
      console.log('\n💡 Pour créer un abonnement:');
      console.log('   1. Connectez-vous sur le frontend');
      console.log('   2. Cliquez sur le bouton de notifications push dans le Header');
      console.log('   3. Autorisez les notifications');
      process.exit(1);
    }

    console.log(`✅ ${subscriptions.length} abonnement(s) trouvé(s)\n`);

    // 5. Préparer le message de notification
    const notificationData = {
      title: '🧪 Test de notification push',
      body: `Bonjour ${user.name || user.email.split('@')[0]} ! Ceci est une notification de test depuis le backend.`,
      icon: '/img/logo.svg',
      badge: '/img/logo.svg',
      url: '/',
      tag: 'test-notification',
      data: {
        test: true,
        timestamp: Date.now(),
        userId: user._id.toString()
      }
    };

    console.log('📤 Envoi des notifications...\n');

    // 6. Envoyer une notification à chaque abonnement
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < subscriptions.length; i++) {
      const sub = subscriptions[i];
      console.log(`📱 Appareil ${i + 1}/${subscriptions.length}:`);
      console.log(`   Device: ${sub.deviceInfo || 'Non spécifié'}`);
      console.log(`   Endpoint: ${sub.endpoint.substring(0, 60)}...`);

      try {
        const result = await sendPushNotification(sub.toPushSubscription(), notificationData);

        if (result.success) {
          console.log('   ✅ Notification envoyée avec succès\n');
          successCount++;
          
          // Mettre à jour la date de dernière utilisation
          await sub.updateLastUsed();
        } else {
          console.log(`   ❌ Erreur: ${result.error}`);
          if (result.statusCode === 410) {
            console.log('   ⚠️  Abonnement expiré, suppression...');
            await PushSubscription.deleteOne({ _id: sub._id });
          }
          console.log('');
          failCount++;
        }
      } catch (error) {
        console.log(`   ❌ Erreur: ${error.message}\n`);
        failCount++;
      }
    }

    // 7. Résumé
    console.log('📊 Résumé:');
    console.log(`   ✅ Succès: ${successCount}`);
    console.log(`   ❌ Échecs: ${failCount}`);
    console.log(`   📱 Total: ${subscriptions.length}`);

    if (successCount > 0) {
      console.log('\n✅ Test réussi ! Vérifiez votre navigateur pour voir la notification.');
      console.log('   💡 La notification devrait apparaître même si l\'onglet est fermé.');
    }

    if (failCount > 0) {
      console.log('\n⚠️  Certaines notifications ont échoué.');
      console.log('   Vérifiez les logs ci-dessus pour plus de détails.');
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erreur lors du test:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Exécuter le test
testPushNotification();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Importer le modèle EcomUser
const EcomUser = require('./ecom/models/EcomUser.js').default;

async function createEcomAdmin() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/formation-andromeda');
    
    console.log('✅ Connecté à MongoDB');

    // Vérifier si un admin existe déjà
    const existingAdmin = await EcomUser.findOne({ role: 'ecom_admin' });
    if (existingAdmin) {
      console.log('⚠️ Un administrateur e-commerce existe déjà:');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Role: ${existingAdmin.role}`);
      console.log(`   Actif: ${existingAdmin.isActive ? 'Oui' : 'Non'}`);
      return;
    }

    // Créer le compte admin
    const adminData = {
      email: 'admin@ecommerce.com',
      password: 'admin123',
      role: 'ecom_admin',
      isActive: true,
      firstName: 'Administrateur',
      lastName: 'E-commerce'
    };

    const admin = new EcomUser(adminData);
    await admin.save();

    console.log('🎉 Compte administrateur e-commerce créé avec succès!');
    console.log('\n📋 Identifiants de connexion:');
    console.log('   🌐 URL: http://localhost:5173/ecom/login');
    console.log('   📧 Email: admin@ecommerce.com');
    console.log('   🔑 Mot de passe: admin123');
    console.log('   🎯 Rôle: ecom_admin (accès complet)');
    console.log('\n💡 Vous pouvez maintenant vous connecter avec ces identifiants!');

  } catch (error) {
    console.error('❌ Erreur lors de la création du compte admin:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le script
createEcomAdmin();

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import { connectDB } from '../config/database.js';

dotenv.config();

const createSuperAdmin = async () => {
  try {
    await connectDB();

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminRole = process.env.ADMIN_ROLE || 'superadmin';

    if (!adminEmail || !adminPassword) {
      console.log('⚠️  ADMIN_EMAIL et ADMIN_PASSWORD non configurés, superadmin non créé');
      return;
    }

    // Vérifier si le superadmin existe déjà
    const existingAdmin = await User.findOne({ email: adminEmail.toLowerCase() });
    
    if (existingAdmin) {
      console.log(`✅ Superadmin ${adminEmail} existe déjà`);
      // Mettre à jour le rôle et le statut si nécessaire
      if (existingAdmin.role !== adminRole || existingAdmin.status !== 'active') {
        existingAdmin.role = adminRole;
        existingAdmin.status = 'active';
        await existingAdmin.save();
        console.log(`✅ Superadmin ${adminEmail} mis à jour (role: ${adminRole}, status: active)`);
      }
      return;
    }

    // Créer le superadmin
    const superAdmin = new User({
      email: adminEmail.toLowerCase(),
      password: adminPassword,
      role: adminRole,
      status: 'active'
    });

    await superAdmin.save();
    console.log(`✅ Superadmin créé avec succès: ${adminEmail} (role: ${adminRole})`);
  } catch (error) {
    console.error('❌ Erreur lors de la création du superadmin:', error);
  } finally {
    await mongoose.connection.close();
  }
};

createSuperAdmin();


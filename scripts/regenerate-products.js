import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from '../config/database.js';
import { refreshSuccessRadar, refreshValentineProducts } from '../services/successRadarCron.js';
import WinningProduct from '../models/WinningProduct.js';

dotenv.config();

async function regenerateAllProducts() {
  try {
    console.log('🔗 Connexion à MongoDB...');
    await connectDB();
    console.log('✅ Connecté à MongoDB');

    console.log('\n🗑️ Suppression des anciens produits...');
    const deletedGeneral = await WinningProduct.deleteMany({ specialEvent: { $ne: 'saint-valentin' } });
    const deletedValentine = await WinningProduct.deleteMany({ specialEvent: 'saint-valentin' });
    console.log(`   - ${deletedGeneral.deletedCount} produits généraux supprimés`);
    console.log(`   - ${deletedValentine.deletedCount} produits St Valentin supprimés`);

    console.log('\n🔄 Génération des nouveaux produits généraux...');
    await refreshSuccessRadar();
    const generalProducts = await WinningProduct.find({ specialEvent: { $ne: 'saint-valentin' } }).lean();
    console.log(`✅ ${generalProducts.length} produits généraux générés`);

    console.log('\n💝 Génération des nouveaux produits St Valentin...');
    await refreshValentineProducts();
    const valentineProducts = await WinningProduct.find({ specialEvent: 'saint-valentin' }).lean();
    console.log(`✅ ${valentineProducts.length} produits St Valentin générés`);

    console.log(`\n✨ Régénération terminée !`);
    console.log(`   - Total produits généraux: ${generalProducts.length}`);
    console.log(`   - Total produits St Valentin: ${valentineProducts.length}`);
    console.log(`   - Total général: ${generalProducts.length + valentineProducts.length} produits`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la régénération:', error);
    process.exit(1);
  }
}

regenerateAllProducts();


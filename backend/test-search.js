// Test script pour vérifier la recherche de produits
import mongoose from 'mongoose';
import Product from './ecom/models/Product.js';

// Configuration de la base de données
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/formation-andromeda';

async function testSearch() {
  try {
    // Connexion à la base de données
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Créer un produit de test si aucun n'existe
    const existingProducts = await Product.countDocuments();
    if (existingProducts === 0) {
      console.log('📦 Création de produits de test...');
      
      const testProducts = [
        {
          name: 'Gummies Intime',
          status: 'winner',
          sellingPrice: 15000,
          productCost: 8000,
          deliveryCost: 2000,
          avgAdsCost: 1000,
          stock: 50,
          reorderThreshold: 10,
          isActive: true,
          createdBy: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011')
        },
        {
          name: 'Sérum Visage Anti-âge',
          status: 'stable',
          sellingPrice: 12000,
          productCost: 6000,
          deliveryCost: 1500,
          avgAdsCost: 800,
          stock: 30,
          reorderThreshold: 15,
          isActive: true,
          createdBy: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011')
        },
        {
          name: 'Ceinture Minceur',
          status: 'test',
          sellingPrice: 18000,
          productCost: 10000,
          deliveryCost: 2000,
          avgAdsCost: 1500,
          stock: 20,
          reorderThreshold: 5,
          isActive: true,
          createdBy: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011')
        }
      ];

      await Product.insertMany(testProducts);
      console.log('✅ Produits de test créés');
    }

    // Test de recherche par nom
    console.log('\n🔍 Test recherche par nom: "gummies"');
    const searchByName = await Product.find({
      isActive: true,
      $or: [
        { name: { $regex: 'gummies', $options: 'i' } },
        { status: { $regex: 'gummies', $options: 'i' } }
      ]
    });
    console.log(`Résultats: ${searchByName.length} produits trouvés`);
    searchByName.forEach(p => console.log(`- ${p.name} (${p.status})`));

    // Test de recherche par statut
    console.log('\n🔍 Test recherche par statut: "winner"');
    const searchByStatus = await Product.find({
      isActive: true,
      $or: [
        { name: { $regex: 'winner', $options: 'i' } },
        { status: { $regex: 'winner', $options: 'i' } }
      ]
    });
    console.log(`Résultats: ${searchByStatus.length} produits trouvés`);
    searchByStatus.forEach(p => console.log(`- ${p.name} (${p.status})`));

    // Test de recherche générale
    console.log('\n🔍 Test recherche générale: "sérum"');
    const generalSearch = await Product.find({
      isActive: true,
      $or: [
        { name: { $regex: 'sérum', $options: 'i' } },
        { status: { $regex: 'sérum', $options: 'i' } }
      ]
    });
    console.log(`Résultats: ${generalSearch.length} produits trouvés`);
    generalSearch.forEach(p => console.log(`- ${p.name} (${p.status})`));

    console.log('\n✅ Tests de recherche terminés avec succès');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

testSearch();

// Test script pour vérifier l'API ProductResearch
import mongoose from 'mongoose';

// Configuration de la base de données
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/formation-andromeda';

async function testAPI() {
  try {
    // Connexion à la base de données
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Importer le modèle
    const ProductResearch = await import('./ecom/models/ProductResearch.js');
    const ProductModel = ProductResearch.default;

    // Créer un produit de test
    console.log('📦 Création d\'un produit de test...');
    
    const testProduct = new ProductModel({
      workspaceId: '507f1f77bcf86cd799439011',
      createdBy: '507f1f77bcf86cd799439011',
      name: 'Drain Stick Test',
      imageUrl: 'https://example.com/image.jpg',
      creative: 'https://example.com/ad',
      alibabaLink: 'https://alibaba.com/product/123',
      researchLink: 'https://facebook.com/ads/123',
      websiteUrl: 'https://example.com/product',
      
      sourcingPrice: 360,
      weight: 0.10,
      shippingUnitCost: 1200,
      cogs: 1560,
      sellingPrice: 1560,
      
      demand: 'high',
      competition: 'medium',
      trend: 'growing',
      
      opportunityScore: 4,
      monthlyEstimate: 100,
      
      status: 'research',
      notes: 'Produit de test pour vérifier l\'API',
      pros: ['Forte demande', 'Bonne marge'],
      cons: ['Compétition moyenne']
    });

    // Calculer les financiers
    testProduct.calculateFinancials();
    
    await testProduct.save();
    console.log('✅ Produit de test créé:', testProduct._id);
    console.log('📊 Marges:', {
      cogs: testProduct.cogs,
      sellingPrice: testProduct.sellingPrice,
      profit: testProduct.profit,
      margin: testProduct.margin
    });

    // Tester la recherche
    console.log('\n🔍 Test de recherche...');
    const products = await ProductModel.find({ 
      workspaceId: '507f1f77bcf86cd799439011' 
    }).sort({ researchDate: -1 });
    
    console.log(`📋 ${products.length} produits trouvés`);
    products.forEach(p => {
      console.log(`- ${p.name}: ${p.margin}% marge, statut: ${p.status}`);
    });

    console.log('\n✅ Tests terminés avec succès!');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

testAPI();

const mongoose = require('mongoose');
const Order = require('./ecom/models/Order.js');

mongoose.connect('mongodb://localhost:27017/formation-andromeda-backend')
  .then(async () => {
    console.log('Connecté à MongoDB');
    
    const orders = await Order.find({ sourceId: '69943f09ca55865f33163f17' })
      .limit(10)
      .select('product city clientName');
    
    console.log(`\n📋 ${orders.length} premières commandes dans la source assignée:`);
    console.log('=' .repeat(80));
    
    orders.forEach((order, i) => {
      console.log(`${i+1}. Produit: "${order.product}"`);
      console.log(`   Ville: "${order.city}"`);
      console.log(`   Client: ${order.clientName}`);
      console.log('');
    });
    
    // Vérifier aussi les produits uniques
    const uniqueProducts = await Order.distinct('product', { sourceId: '69943f09ca55865f33163f17' });
    console.log(`\n🎯 ${uniqueProducts.length} produits uniques dans cette source:`);
    console.log('=' .repeat(40));
    uniqueProducts.forEach((product, i) => {
      console.log(`${i+1}. "${product}"`);
    });
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Erreur:', err);
    process.exit(1);
  });

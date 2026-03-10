import mongoose from 'mongoose';
import dotenv from 'dotenv';
import WinningProduct from '../models/WinningProduct.js';
import { connectDB } from '../config/database.js';

dotenv.config();

const valentineProducts = [
  {
    name: 'Bouquet de roses artificielles LED',
    category: 'Cadeaux romantiques',
    priceRange: '5000 - 15000 FCFA',
    countries: ['Cameroun', 'Côte d\'Ivoire', 'Sénégal'],
    saturation: 25,
    demandScore: 85,
    trendScore: 90,
    status: 'hot',
    problemSolved: 'Cadeau romantique durable et original pour la Saint-Valentin',
    whyItWorks: 'Les roses LED sont tendance, durables et créent une ambiance romantique',
    proofIndicator: 'Tendances en hausse sur les réseaux sociaux',
    supplierPrice: 2000,
    sellingPrice: 8000,
    marketingAngle: 'Cadeau parfait pour la Saint-Valentin - Ne se fane jamais',
    scalingPotential: 'Élevé',
    alibabaLink: 'https://www.alibaba.com/trade/search?fsb=y&IndexArea=product_en&SearchText=LED+rose+artificial',
    specialEvent: 'saint-valentin'
  },
  {
    name: 'Boîte cadeau romantique avec message personnalisé',
    category: 'Cadeaux romantiques',
    priceRange: '3000 - 8000 FCFA',
    countries: ['Cameroun', 'Gabon', 'Congo'],
    saturation: 20,
    demandScore: 80,
    trendScore: 85,
    status: 'hot',
    problemSolved: 'Cadeau personnalisé et émotionnel pour exprimer ses sentiments',
    whyItWorks: 'Les cadeaux personnalisés sont très appréciés et créent un lien émotionnel fort',
    proofIndicator: 'Demande croissante pour les produits personnalisés',
    supplierPrice: 1500,
    sellingPrice: 5000,
    marketingAngle: 'Montrez votre amour avec un cadeau unique et personnalisé',
    scalingPotential: 'Élevé',
    alibabaLink: 'https://www.alibaba.com/trade/search?fsb=y&IndexArea=product_en&SearchText=romantic+gift+box',
    specialEvent: 'saint-valentin'
  },
  {
    name: 'Bijoux en forme de cœur - Collier et bracelet',
    category: 'Bijoux',
    priceRange: '8000 - 25000 FCFA',
    countries: ['Cameroun', 'Côte d\'Ivoire', 'Sénégal', 'Mali'],
    saturation: 30,
    demandScore: 88,
    trendScore: 92,
    status: 'hot',
    problemSolved: 'Cadeau élégant et symbolique pour la Saint-Valentin',
    whyItWorks: 'Les bijoux en forme de cœur sont intemporels et très demandés',
    proofIndicator: 'Tendances stables avec pic saisonnier pour la Saint-Valentin',
    supplierPrice: 3000,
    sellingPrice: 15000,
    marketingAngle: 'Symbole éternel de l\'amour - Cadeau parfait pour elle',
    scalingPotential: 'Élevé',
    alibabaLink: 'https://www.alibaba.com/trade/search?fsb=y&IndexArea=product_en&SearchText=heart+jewelry',
    specialEvent: 'saint-valentin'
  },
  {
    name: 'Parfum romantique pour couple',
    category: 'Parfums et cosmétiques',
    priceRange: '10000 - 30000 FCFA',
    countries: ['Cameroun', 'Gabon', 'Côte d\'Ivoire'],
    saturation: 35,
    demandScore: 82,
    trendScore: 87,
    status: 'warm',
    problemSolved: 'Cadeau premium et intime pour créer des souvenirs',
    whyItWorks: 'Les parfums sont des cadeaux premium très appréciés',
    proofIndicator: 'Marché stable avec augmentation saisonnière',
    supplierPrice: 5000,
    sellingPrice: 20000,
    marketingAngle: 'Créez des souvenirs inoubliables avec ce parfum romantique',
    scalingPotential: 'Moyen',
    alibabaLink: 'https://www.alibaba.com/trade/search?fsb=y&IndexArea=product_en&SearchText=romantic+perfume',
    specialEvent: 'saint-valentin'
  },
  {
    name: 'Lumière LED en forme de cœur pour chambre',
    category: 'Décoration',
    priceRange: '4000 - 12000 FCFA',
    countries: ['Cameroun', 'Sénégal', 'Côte d\'Ivoire'],
    saturation: 22,
    demandScore: 83,
    trendScore: 88,
    status: 'hot',
    problemSolved: 'Décoration romantique pour créer une ambiance intime',
    whyItWorks: 'Les lumières LED décoratives sont très tendance et créent une ambiance',
    proofIndicator: 'Tendances en forte hausse sur TikTok et Instagram',
    supplierPrice: 1800,
    sellingPrice: 7000,
    marketingAngle: 'Transformez votre chambre en nid d\'amour avec cette lumière romantique',
    scalingPotential: 'Élevé',
    alibabaLink: 'https://www.alibaba.com/trade/search?fsb=y&IndexArea=product_en&SearchText=LED+heart+light',
    specialEvent: 'saint-valentin'
  }
];

async function addValentineProducts() {
  try {
    console.log('🔗 Connexion à MongoDB...');
    await connectDB();
    console.log('✅ Connecté à MongoDB');

    console.log(`\n📦 Ajout de ${valentineProducts.length} produits Saint-Valentin...`);

    let added = 0;
    let updated = 0;

    for (const productData of valentineProducts) {
      // Vérifier si le produit existe déjà (par nom)
      const existing = await WinningProduct.findOne({ 
        name: productData.name,
        specialEvent: 'saint-valentin'
      });

      if (existing) {
        // Mettre à jour le produit existant
        Object.assign(existing, productData);
        existing.lastUpdated = new Date();
        await existing.save();
        updated++;
        console.log(`✅ Mis à jour: ${productData.name}`);
      } else {
        // Créer un nouveau produit
        const product = new WinningProduct({
          ...productData,
          lastUpdated: new Date()
        });
        await product.save();
        added++;
        console.log(`✅ Ajouté: ${productData.name}`);
      }
    }

    console.log(`\n✨ Terminé !`);
    console.log(`   - ${added} produit(s) ajouté(s)`);
    console.log(`   - ${updated} produit(s) mis à jour`);
    console.log(`   - Total: ${added + updated} produit(s) Saint-Valentin`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

addValentineProducts();


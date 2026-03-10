import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, '.env') });

// Script pour insérer directement les produits de recherche dans la base de données
import mongoose from 'mongoose';

// Configuration de la base de données
const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/formation-andromeda';

// Définition du schéma ProductResearch (simplifié pour le script)
const productResearchSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, required: true },
  
  // Informations de base
  name: { type: String, required: true },
  imageUrl: String,
  creative: String,
  alibabaLink: String,
  researchLink: String,
  websiteUrl: String,
  
  // Prix et coûts
  sourcingPrice: { type: Number, default: 0 },
  weight: { type: Number, default: 0 },
  shippingUnitCost: { type: Number, default: 0 },
  cogs: { type: Number, default: 0 },
  sellingPrice: { type: Number, default: 0 },
  
  // Champs additionnels
  category: String,
  demand: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  competition: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  trend: { type: String, enum: ['declining', 'stable', 'growing'], default: 'stable' },
  
  // Notes et observations
  notes: String,
  pros: [String],
  cons: [String],
  
  // Potentiel
  opportunityScore: { type: Number, min: 1, max: 5, default: 3 },
  monthlyEstimate: { type: Number, default: 0 },
  
  // Statut
  status: { type: String, enum: ['research', 'testing', 'validated', 'rejected'], default: 'research' },
  
  // Calculs automatiques
  margin: { type: Number, default: 0 },
  profit: { type: Number, default: 0 },
  
  researchDate: { type: Date, default: Date.now }
}, {
  collection: 'ecom_product_research',
  timestamps: true
});

// Méthode pour calculer les financiers
productResearchSchema.methods.calculateFinancials = function() {
  // Calculer le COGS si non défini
  if (!this.cogs) {
    this.cogs = (this.sourcingPrice || 0) + (this.shippingUnitCost || 0);
  }
  
  // Calculer la marge et le bénéfice
  if (this.sellingPrice > 0) {
    this.profit = this.sellingPrice - this.cogs;
    this.margin = ((this.sellingPrice - this.cogs) / this.sellingPrice) * 100;
  } else {
    this.profit = 0;
    this.margin = 0;
  }
};

const ProductResearch = mongoose.model('ProductResearch', productResearchSchema);

// Fonction pour parser les nombres français
const parseFrenchNumber = (value) => {
  if (!value || value.trim() === '') return 0;
  
  // Enlever les espaces insécables et les espaces normaux
  let cleanValue = value.replace(/\s/g, '');
  
  // Remplacer la virgule par un point pour les décimales
  cleanValue = cleanValue.replace(',', '.');
  
  // Parser en nombre
  const parsed = parseFloat(cleanValue);
  
  // Retourner 0 si NaN, sinon le nombre
  return isNaN(parsed) ? 0 : parsed;
};

// Produits à insérer
const productsToInsert = [
  {
    name: 'DRAIN STICK',
    imageUrl: 'https://drive.google.com/file/d/1VKpeTlTV0WA3vSafl-8MprbqrEBVOJBB/view?usp=share_link',
    creative: 'https://www.alibaba.com/product-detail/Drain-cleaning-and-sanitation-pipes-sticks_62246107858.html?spm=a2700.galleryofferlist.0.0.63a54d6d0yusyK',
    alibabaLink: 'https://www.alibaba.com/product-detail/Drain-cleaning-and-sanitation-pipes-sticks_62246107858.html?spm=a2700.galleryofferlist.0.0.63a54d6d0yusyK',
    researchLink: 'https://www.facebook.com/ads/library/?id=1188938655134167',
    websiteUrl: 'https://africaoffre.com/products/tiges',
    sourcingPrice: parseFrenchNumber('360,00'),
    weight: parseFrenchNumber('0,10'),
    shippingUnitCost: parseFrenchNumber('1200'),
    cogs: parseFrenchNumber('1\u202f560,00'),
    sellingPrice: parseFrenchNumber('20000'),
    opportunityScore: 4,
    monthlyEstimate: 50,
    status: 'research',
    notes: 'Produit trouvé sur Alibaba',
    pros: ['Forte demande', 'Simple à utiliser'],
    cons: ['Compétition moyenne']
  },
  {
    name: 'CORRECTEUR BLANCHEUR',
    imageUrl: 'https://drive.google.com/file/d/1u1Y9P-1GQizSZO6SZIDh0F_sKXDD3wOK/view?usp=share_link',
    creative: 'https://www.tiktok.com/@cosmile.co/video/7112749127234080005?is_from_webapp=1&sender_device=pc&web_id=7208337992691058181',
    alibabaLink: 'https://www.alibaba.com/product-detail/Private-Label-V34-Colour-Corrector-Serum_1600808374175.html?spm=a2700.galleryofferlist.normal_offer.d_title.63676bf3tj2Dnz&s=p',
    researchLink: 'https://app.minea.com/posts/364525732348961',
    websiteUrl: 'https://cosmile.co/products/copy-of-correcteur-de-couleur-c15-cosmile',
    sourcingPrice: parseFrenchNumber('2100'),
    weight: parseFrenchNumber('0,07'),
    shippingUnitCost: parseFrenchNumber('840'),
    cogs: parseFrenchNumber('2\u202f940,00'),
    sellingPrice: parseFrenchNumber('20000'),
    opportunityScore: 4,
    monthlyEstimate: 80,
    status: 'research',
    notes: 'Produit cosmétique tendance',
    pros: ['Très forte demande', 'Bon marché'],
    cons: ['Marge faible', 'Réglementation cosmétique']
  },
  {
    name: 'Patch anti douleurs',
    imageUrl: 'https://app.minea.com/posts/364525732348961?tab=ad_analysis',
    creative: 'https://app.minea.com/posts/364525732348961?tab=ad_analysis',
    alibabaLink: 'https://www.alibaba.com/product-detail/Best-selling-Chinese-Herbal-Hot-Moxibustion_1600751291493.html?spm=a2700.picsearch.offer-list.10.448b5f93xYywxU',
    researchLink: 'https://app.minea.com/posts/364525732348961?tab=ad_analysis',
    websiteUrl: 'https://georgleroy.com/products/patch-anti-douleur?_pos=1&_sid=9e4fd3b09&_ss=r',
    sourcingPrice: parseFrenchNumber('630'),
    weight: parseFrenchNumber('0,15'),
    shippingUnitCost: parseFrenchNumber('1800'),
    cogs: parseFrenchNumber('2\u202f430,00'),
    sellingPrice: parseFrenchNumber('20000'),
    opportunityScore: 4,
    monthlyEstimate: 30,
    status: 'testing',
    notes: 'Produit médical, faible concurrence',
    pros: ['Faible concurrence', 'Bonne marge potentielle'],
    cons: ['Réglementation médicale', 'Niche spécifique']
  },
  {
    name: 'Sangle de Mâchoire médicale ANTI-RONFLEMENT & ANTI-APNÉE',
    imageUrl: '',
    creative: '',
    alibabaLink: '',
    researchLink: 'https://www.facebook.com/ads/library/?id=1987605268844534',
    websiteUrl: 'https://daakshop1.com/products/sangle-de-machoire-medicale-anti-ronflements',
    sourcingPrice: parseFrenchNumber('0'),
    weight: parseFrenchNumber('0'),
    shippingUnitCost: parseFrenchNumber('0'),
    cogs: parseFrenchNumber('0'),
    sellingPrice: parseFrenchNumber('20000'),
    opportunityScore: 3,
    monthlyEstimate: 20,
    status: 'research',
    notes: 'Produit médical pour ronflement',
    pros: ['Problème courant', 'Bonne marge potentielle'],
    cons: ['Réglementation médicale', 'Concurrence']
  },
  {
    name: 'Créme pour traiter definitivement les verrues',
    imageUrl: '',
    creative: '',
    alibabaLink: '',
    researchLink: 'https://www.facebook.com/ads/library/?id=1286841873356973',
    websiteUrl: 'https://luxemarket.click/index.php?id=67894642',
    sourcingPrice: parseFrenchNumber('0'),
    weight: parseFrenchNumber('0'),
    shippingUnitCost: parseFrenchNumber('0'),
    cogs: parseFrenchNumber('0'),
    sellingPrice: parseFrenchNumber('20000'),
    opportunityScore: 3,
    monthlyEstimate: 15,
    status: 'research',
    notes: 'Produit dermatologique',
    pros: ['Problème courant', 'Bonne marge'],
    cons: ['Réglementation', 'Concurrence']
  },
  {
    name: 'ceinture de maintiens chemise',
    imageUrl: '',
    creative: '',
    alibabaLink: '',
    researchLink: 'https://www.facebook.com/ads/library/?id=1994187088160311',
    websiteUrl: 'https://u0x0en-bt.myshopify.com/products/shirt-stay-ceninture-et-maintient-de-chemises',
    sourcingPrice: parseFrenchNumber('0'),
    weight: parseFrenchNumber('0'),
    shippingUnitCost: parseFrenchNumber('0'),
    cogs: parseFrenchNumber('0'),
    sellingPrice: parseFrenchNumber('20000'),
    opportunityScore: 3,
    monthlyEstimate: 25,
    status: 'research',
    notes: 'Accessoire mode',
    pros: ['Produit tendance', 'Bonne marge'],
    cons: ['Concurrence', 'Saisonnier']
  },
  {
    name: 'Gel EXFOLIANT (anti tache corporelle)',
    imageUrl: '',
    creative: '',
    alibabaLink: '',
    researchLink: 'https://www.facebook.com/ads/library/?id=1553769635908932',
    websiteUrl: 'https://afriecom.com/fr-cm/products/gel-exfoliant-purifiant',
    sourcingPrice: parseFrenchNumber('0'),
    weight: parseFrenchNumber('0'),
    shippingUnitCost: parseFrenchNumber('0'),
    cogs: parseFrenchNumber('0'),
    sellingPrice: parseFrenchNumber('20000'),
    opportunityScore: 3,
    monthlyEstimate: 35,
    status: 'research',
    notes: 'Produit cosmétique exfoliant',
    pros: ['Demande beauté', 'Bonne marge'],
    cons: ['Concurrence', 'Réglementation']
  }
];

async function insertProducts() {
  try {
    // Connexion à la base de données
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // ID du workspace et utilisateur (à adapter selon votre configuration)
    const workspaceId = '69870da96590f43912bf4ca2'; // ID de votre workspace
    const createdBy = '69870da86590f43912bf4ca0'; // ID de l'utilisateur

    console.log(`📦 Insertion de ${productsToInsert.length} produits...`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < productsToInsert.length; i++) {
      try {
        const productData = {
          ...productsToInsert[i],
          workspaceId: workspaceId,
          createdBy: createdBy
        };

        // Calculer les financiers
        const product = new ProductResearch(productData);
        product.calculateFinancials();
        
        await product.save();
        
        console.log(`✅ Produit ${i + 1} inséré: ${product.name}`);
        console.log(`   💰 Prix: ${product.sourcingPrice} → COGS: ${product.cogs} → Vente: ${product.sellingPrice}`);
        console.log(`   📊 Marge: ${product.margin.toFixed(1)}% | Bénéfice: ${product.profit} FCFA`);
        
        successCount++;
      } catch (error) {
        console.error(`❌ Erreur insertion produit ${i + 1}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n🎯 Insertion terminée:`);
    console.log(`✅ ${successCount} produit(s) inséré(s) avec succès`);
    console.log(`❌ ${errorCount} produit(s) en erreur`);

    if (successCount > 0) {
      console.log(`\n📊 Les produits sont maintenant disponibles dans /ecom/product-research-list`);
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter l'insertion
insertProducts();

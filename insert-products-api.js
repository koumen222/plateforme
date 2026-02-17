// Script pour insérer les produits via l'API REST
const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000'; // URL de votre backend
const API_URL = `${BASE_URL}/api/ecom/products-research/research`;

// Token d'authentification (vous pouvez le récupérer depuis le localStorage du navigateur)
// Pour l'instant, on va essayer sans token car les routes sont configurées pour accepter sans auth

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
  console.log('📦 Insertion de produits via API REST...');
  console.log(`🔗 URL de l'API: ${API_URL}`);
  
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < productsToInsert.length; i++) {
    try {
      const productData = productsToInsert[i];
      
      console.log(`\n📤 Insertion produit ${i + 1}/${productsToInsert.length}: ${productData.name}`);
      console.log(`   💰 Prix: ${productData.sourcingPrice} → COGS: ${productData.cogs} → Vente: ${productData.sellingPrice}`);
      
      const response = await axios.post(API_URL, productData, {
        headers: {
          'Content-Type': 'application/json',
          // Ajouter le header si nécessaire
          // 'Authorization': 'Bearer votre_token_ici'
        }
      });
      
      if (response.data.success) {
        console.log(`✅ Produit ${i + 1} inséré avec succès`);
        console.log(`   📊 ID: ${response.data.data._id}`);
        successCount++;
      } else {
        console.log(`❌ Erreur insertion produit ${i + 1}: ${response.data.message}`);
        errorCount++;
      }
    } catch (error) {
      console.error(`❌ Erreur insertion produit ${i + 1}:`, error.message);
      if (error.response) {
        console.error(`   Status: ${error.response.status}`);
        console.error(`   Data:`, error.response.data);
      }
      errorCount++;
    }
  }

  console.log(`\n🎯 Insertion terminée:`);
  console.log(`✅ ${successCount} produit(s) inséré(s) avec succès`);
  console.log(`❌ ${errorCount} produit(s) en erreur`);

  if (successCount > 0) {
    console.log(`\n📊 Les produits sont maintenant disponibles dans:`);
    console.log(`   - Frontend: http://localhost:5173/ecom/product-research-list`);
    console.log(`   - Backend: ${API_URL}`);
  }
}

// Exécuter l'insertion
insertProducts().catch(console.error);

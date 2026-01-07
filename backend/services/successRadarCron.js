import cron from 'node-cron';
import OpenAI from 'openai';
import WinningProduct from '../models/WinningProduct.js';

const SCHEDULE = '0 */6 * * *'; // every 6 hours

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const buildPrompt = () => `Rôle :
Tu es un expert e-commerce senior spécialisé dans les marchés africains (Afrique de l'Ouest, Centrale et du Nord), avec une expertise avancée en product research, data Meta Ads, Minea, Alibaba et AliExpress.

Objectif :
Identifier EXACTEMENT 50 produits WINNERS (gadgets) qui ont déjà prouvé leur rentabilité en Afrique, adaptés au dropshipping, à la vente en ligne et au cash on delivery (COD).

IMPORTANT : Tu DOIS générer exactement 50 produits, pas moins.

Sources d'analyse obligatoires :
- Meta Ads Library (publicités actives + récurrentes en Afrique)
- Minea (produits gagnants + scaling proof)
- Alibaba & AliExpress (volume de commandes, fournisseurs fiables)
- Tendances locales africaines (problèmes quotidiens, habitudes de consommation, pouvoir d'achat)

Critères STRICTS de sélection des produits :
- Déjà vendus avec succès en Afrique (preuve publicitaire ou volume)
- Gadget à effet "WOW", solution à un problème réel
- Prix fournisseur idéal : 2$ à 15$
- Prix de vente potentiel Afrique : x3 à x6 minimum
- Facile à expliquer en vidéo (UGC / démonstration)
- Pas fragile, pas électronique complexe, pas interdit
- Compatible livraison locale & COD

IMPORTANT - Format de réponse JSON :
Réponds UNIQUEMENT avec un objet JSON valide de la forme {"products":[...]} sans texte avant ou après.
Le JSON doit être complet et valide.

Pour chaque produit, fournis OBLIGATOIREMENT dans le JSON :
- name : Nom précis du produit (marque + modèle si applicable)
- category : Maison, Auto, Beauté, Santé, Cuisine, Sécurité, etc.
- problemSolved : Problème précis résolu (contexte africain)
- whyItWorks : Pourquoi le produit marche en Afrique (culture, climat, habitudes, besoin local)
- proofIndicator : Indicateur de preuve (Meta Ads actives, Minea, volume Alibaba/AliExpress)
- supplierPrice : Prix fournisseur estimé en USD (2$ à 15$)
- sellingPrice : Prix de vente recommandé en FCFA (x3 à x6 du prix fournisseur)
- priceRange : Plage de prix en FCFA (format "X 000 - Y 000 FCFA")
- countries : Pays africains les PLUS adaptés (array de 2-5 pays : Sénégal, Côte d'Ivoire, Maroc, Cameroun, etc.)
- marketingAngle : Angle marketing principal (peur, gain, confort, économie, statut)
- scalingPotential : Potentiel de scaling (Faible / Moyen / Élevé)
- demandScore : 0-100 (basé sur la preuve de traction)
- trendScore : 0-100 (basé sur les tendances actuelles)
- saturation : 0-100 (saturation du marché, plus bas = mieux)
- status : "hot" si demandScore >= 75 ET trendScore >= 75, "dead" si les deux <= 30, sinon "warm"

Contraintes :
- Aucun produit "théorique"
- Aucun produit sans preuve de traction
- Focus EXCLUSIF sur des produits déjà validés sur le marché africain
- Classer les 50 produits du plus fort potentiel au plus faible

Exemple de format JSON attendu :
{
  "products": [
    {
      "name": "Lampe LED rechargeable solaire portable",
      "category": "Maison",
      "problemSolved": "Coupures d'électricité fréquentes en Afrique",
      "whyItWorks": "Autonomie énergétique, pas besoin de réseau électrique, adapté aux zones rurales",
      "proofIndicator": "Meta Ads actives au Sénégal et Côte d'Ivoire, volume élevé sur AliExpress",
      "supplierPrice": 5,
      "sellingPrice": 25000,
      "priceRange": "20 000 - 30 000 FCFA",
      "countries": ["Sénégal", "Côte d'Ivoire", "Cameroun", "Mali"],
      "marketingAngle": "confort",
      "scalingPotential": "Élevé",
      "demandScore": 90,
      "trendScore": 85,
      "saturation": 25,
      "status": "hot"
    }
  ]
}`;

// Fonction pour nettoyer et extraire le JSON de la réponse
const cleanJSONContent = (content) => {
  if (!content) return '';
  
  let cleaned = content.trim();
  
  // Enlever les markdown code blocks si présents
  cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  
  // Trouver le premier { et le dernier } pour extraire le JSON
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  
  return cleaned;
};

const parseProducts = (content) => {
  try {
    const cleaned = cleanJSONContent(content);
    if (!cleaned) return [];
    
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (err) {
    console.error('❌ Échec parsing JSON OpenAI:', err.message);
    console.error('   Contenu reçu (premiers 500 caractères):', content?.substring(0, 500));
  }
  return [];
};

// Fonction pour normaliser les prix en FCFA
const normalizePriceToFCFA = (priceRange) => {
  if (!priceRange) return '';
  
  const priceStr = priceRange.toString().trim();
  
  // Si déjà en FCFA, retourner tel quel
  if (priceStr.includes('FCFA') || priceStr.includes('F CFA')) {
    return priceStr;
  }
  
  // Si contient EUR ou €, convertir (1 EUR ≈ 650 FCFA)
  if (priceStr.includes('EUR') || priceStr.includes('€')) {
    const numbers = priceStr.match(/[\d\s,]+/g);
    if (numbers) {
      const converted = numbers.map(num => {
        const cleanNum = parseFloat(num.replace(/\s/g, '').replace(',', '.'));
        if (!isNaN(cleanNum)) {
          const fcfa = Math.round(cleanNum * 650);
          return fcfa.toLocaleString('fr-FR').replace(/\s/g, ' ');
        }
        return num;
      });
      return converted.join(' - ') + ' FCFA';
    }
  }
  
  // Si contient USD ou $, convertir (1 USD ≈ 600 FCFA)
  if (priceStr.includes('USD') || priceStr.includes('$')) {
    const numbers = priceStr.match(/[\d\s,]+/g);
    if (numbers) {
      const converted = numbers.map(num => {
        const cleanNum = parseFloat(num.replace(/\s/g, '').replace(',', '.'));
        if (!isNaN(cleanNum)) {
          const fcfa = Math.round(cleanNum * 600);
          return fcfa.toLocaleString('fr-FR').replace(/\s/g, ' ');
        }
        return num;
      });
      return converted.join(' - ') + ' FCFA';
    }
  }
  
  // Si juste des nombres, supposer que c'est déjà en FCFA et ajouter "FCFA"
  const numbers = priceStr.match(/[\d\s,]+/g);
  if (numbers && !priceStr.match(/[A-Za-z]/)) {
    return priceStr + ' FCFA';
  }
  
  // Sinon, retourner tel quel (sera peut-être corrigé manuellement)
  return priceStr;
};

// Fonction pour générer un lien de recherche Alibaba
const generateAlibabaLink = (productName) => {
  if (!productName) return '';
  
  // Nettoyer le nom du produit pour la recherche
  const searchQuery = encodeURIComponent(productName);
  
  // Lien de recherche Alibaba
  return `https://www.alibaba.com/trade/search?fsb=y&IndexArea=product_en&CatId=&SearchText=${searchQuery}`;
};

const normalizeProduct = (product) => {
  const name = product.name?.toString().trim() || 'Produit sans nom';
  
  // Utiliser priceRange si fourni, sinon calculer depuis sellingPrice
  let priceRange = product.priceRange;
  if (!priceRange && product.sellingPrice) {
    const price = Number(product.sellingPrice);
    if (!isNaN(price)) {
      const minPrice = Math.round(price * 0.8);
      const maxPrice = Math.round(price * 1.2);
      priceRange = `${minPrice.toLocaleString('fr-FR').replace(/\s/g, ' ')} - ${maxPrice.toLocaleString('fr-FR').replace(/\s/g, ' ')} FCFA`;
    }
  }
  
  // Générer le lien Alibaba si non fourni
  let alibabaLink = product.alibabaLink?.toString().trim() || '';
  if (!alibabaLink) {
    alibabaLink = generateAlibabaLink(name);
  }
  
  return {
    name: name,
    category: product.category?.toString().trim() || '',
    priceRange: normalizePriceToFCFA(priceRange || ''),
    countries: Array.isArray(product.countries) ? product.countries.map(c => c.toString().trim()) : [],
    saturation: Number.isFinite(product.saturation) ? Math.max(0, Math.min(100, product.saturation)) : 0,
    demandScore: Number.isFinite(product.demandScore) ? Math.max(0, Math.min(100, product.demandScore)) : 0,
    trendScore: Number.isFinite(product.trendScore) ? Math.max(0, Math.min(100, product.trendScore)) : 0,
    status: ['hot', 'warm', 'dead'].includes(product.status) ? product.status : 'warm',
    // Champs supplémentaires du nouveau format
    problemSolved: product.problemSolved?.toString().trim() || '',
    whyItWorks: product.whyItWorks?.toString().trim() || '',
    proofIndicator: product.proofIndicator?.toString().trim() || '',
    supplierPrice: Number.isFinite(product.supplierPrice) ? product.supplierPrice : 0,
    sellingPrice: Number.isFinite(product.sellingPrice) ? product.sellingPrice : 0,
    marketingAngle: product.marketingAngle?.toString().trim() || '',
    scalingPotential: product.scalingPotential?.toString().trim() || '',
    alibabaLink: alibabaLink,
    lastUpdated: new Date()
  };
};

export const fetchWinningProducts = async () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY manquant pour Success Radar');
  }

  const messages = [
    { role: 'system', content: 'Tu es un générateur de tendances e-commerce précis et concis.' },
    { role: 'user', content: buildPrompt() }
  ];

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    temperature: 0.7,
    max_tokens: 8000, // Augmenté pour éviter les JSON tronqués
    response_format: { type: 'json_object' }
  });

  const content = response.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Réponse OpenAI vide pour Success Radar');
  }

  console.log('📥 Réponse OpenAI reçue, longueur:', content.length);
  
  // Nettoyer le contenu avant parsing
  const cleanedContent = cleanJSONContent(content);
  
  // response_format json_object => expect { products: [...] }
  let products = [];
  try {
    const parsed = JSON.parse(cleanedContent);
    
    // Chercher le tableau de produits dans différentes structures possibles
    if (Array.isArray(parsed)) {
      products = parsed;
    } else if (Array.isArray(parsed.products)) {
      products = parsed.products;
    } else if (Array.isArray(parsed.data)) {
      products = parsed.data;
    } else if (parsed.products && typeof parsed.products === 'object') {
      // Si products est un objet, essayer de le convertir en array
      products = Object.values(parsed.products);
    }
    
    console.log(`✅ ${products.length} produits extraits du JSON`);
  } catch (err) {
    console.error('❌ Erreur parsing principal:', err.message);
    console.error('   Position erreur:', err.message.match(/position (\d+)/)?.[1]);
    
    // Essayer avec la fonction de fallback
    products = parseProducts(content);
    
    if (!products.length) {
      // Dernier recours : essayer d'extraire manuellement
      console.log('⚠️ Tentative d\'extraction manuelle du JSON...');
      try {
        const jsonMatch = content.match(/\{[\s\S]*"products"[\s\S]*\}/);
        if (jsonMatch) {
          const manualParsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(manualParsed.products)) {
            products = manualParsed.products;
            console.log(`✅ ${products.length} produits extraits manuellement`);
          }
        }
      } catch (manualErr) {
        console.error('❌ Échec extraction manuelle:', manualErr.message);
      }
    }
  }

  if (!products.length) {
    throw new Error('Aucune donnée produit reçue depuis OpenAI');
  }

  // Limiter à 50 produits comme demandé dans le prompt
  return products.slice(0, 50).map(normalizeProduct);
};

export const refreshSuccessRadar = async () => {
  console.log('🔄 Mise à jour Success Radar...');
  const products = await fetchWinningProducts();

  // Supprimer les anciens produits
  await WinningProduct.deleteMany({});
  
  // Insérer les 50 nouveaux produits
  if (products.length > 0) {
    await WinningProduct.insertMany(products, { ordered: false });
    console.log(`✅ ${products.length} produits enregistrés en base de données`);
  } else {
    console.warn('⚠️ Aucun produit à enregistrer');
  }
};

export const startSuccessRadarCron = () => {
  cron.schedule(SCHEDULE, async () => {
    try {
      await refreshSuccessRadar();
    } catch (err) {
      console.error('❌ Erreur lors de la mise à jour Success Radar:', err.message);
    }
  });

  console.log(`⏰ Cron Success Radar démarré avec l'expression "${SCHEDULE}"`);
};

export const runSuccessRadarOnce = async () => {
  try {
    await refreshSuccessRadar();
  } catch (err) {
    console.error('❌ Impossible d’exécuter Success Radar initial:', err.message);
  }
};


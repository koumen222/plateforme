import cron from 'node-cron';
import OpenAI from 'openai';
import WinningProduct from '../models/WinningProduct.js';

const SCHEDULE = '0 */2 * * *'; // every 2 hours

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const buildValentinePrompt = () => `Rôle :
Tu es un expert e-commerce senior spécialisé dans les marchés africains (Afrique de l'Ouest, Centrale et du Nord), avec une expertise avancée en product research, data Meta Ads, Minea, Alibaba et AliExpress.

Objectif :
Identifier EXACTEMENT 50 produits WINNERS RÉELS spécialement adaptés pour la SAINT-VALENTIN en Afrique francophone. Ces produits doivent être des cadeaux romantiques RÉELS qui ont VRAIMENT été vendus avec succès pendant la période St Valentin.

IMPORTANT : Tu DOIS générer exactement 50 produits St Valentin RÉELS, pas moins.
IMPORTANT : Tous les produits DOIVENT avoir le champ "specialEvent" défini à "saint-valentin" dans le JSON.
IMPORTANT : Tous les produits doivent être RÉELS avec des PRIX CONCRETS en FCFA et des PREUVES de vente.

Sources d'analyse obligatoires :
- Meta Ads Library (publicités actives + récurrentes en Afrique)
- Minea (produits gagnants + scaling proof)
- Alibaba & AliExpress (volume de commandes, fournisseurs fiables)
- Tendances locales africaines (problèmes quotidiens, habitudes de consommation, pouvoir d'achat)

Critères STRICTS de sélection des produits ST VALENTIN RÉELS :
- PRODUITS RÉELS : Fleurs artificielles LED, bijoux romantiques, bougies parfumées, gadgets LED cœur, etc.
- PREUVES DE VENTE : Doivent avoir été VRAIMENT vendus pendant St Valentin (publicités Meta actives, ventes sur Minea, commandes Alibaba/AliExpress)
- PRIX RÉELS : Fournir des prix CONCRETS en FCFA (ex: 15 000 FCFA, 25 000 FCFA, 35 000 FCFA)
- PRIX FOURNISSEUR : 2$ à 20$ USD (convertis en FCFA dans le prix de vente)
- PRIX DE VENTE : x3 à x6 du prix fournisseur, en FCFA CONCRET (ex: fournisseur 8$ = vente 30 000 - 40 000 FCFA)
- PRODUITS CONCRETS : Fleur artificielle LED rose, Powerbank cœur LED, Bougie parfumée romantique, Bijou cœur, etc.
- FACILE À EXPLIQUER : Produits qui se vendent bien en vidéo UGC romantique
- COMPATIBLE COD : Livraison locale et paiement à la livraison
- THÈMES RÉELS : Bijoux cœur, fleurs LED, bougies parfumées, gadgets LED romantiques, boîtes cadeau personnalisées, etc.

IMPORTANT - Format de réponse JSON :
Réponds UNIQUEMENT avec un objet JSON valide de la forme {"products":[...]} sans texte avant ou après.
Le JSON doit être complet et valide.

Pour chaque produit ST VALENTIN RÉEL, fournis OBLIGATOIREMENT dans le JSON :
- name : Nom PRÉCIS et RÉEL du produit romantique (ex: "Fleur artificielle LED rose avec message", "Powerbank cœur LED romantique", "Bougie parfumée cœur")
- category : Cadeaux romantiques, Bijoux, Beauté, Maison, Parfums, Décorations, etc.
- specialEvent : TOUJOURS "saint-valentin" (OBLIGATOIRE)
- problemSolved : Besoin romantique RÉEL résolu (ex: "Besoin de cadeau romantique durable pour St Valentin")
- whyItWorks : Pourquoi ce produit RÉEL marche VRAIMENT pendant St Valentin en Afrique (preuves concrètes)
- proofIndicator : PREUVE RÉELLE de vente (ex: "Meta Ads actives au Maroc depuis février", "3000+ ventes sur AliExpress en février", "Scaling actif sur Minea")
- supplierPrice : Prix fournisseur RÉEL en USD (2$ à 20$)
- sellingPrice : Prix de vente RÉEL en FCFA (ex: 25000, 35000, 45000 - prix CONCRET)
- priceRange : Plage de prix RÉELLE en FCFA (format "25 000 - 30 000 FCFA" avec prix CONCRETS)
- countries : Pays africains où le produit est VRAIMENT vendu pendant St Valentin (array de 2-5 pays)
- marketingAngle : Angle marketing RÉEL utilisé (romance, émotion, statut, confort, gain)
- scalingPotential : Potentiel RÉEL basé sur ventes actuelles (Faible / Moyen / Élevé)
- demandScore : 0-100 (basé sur PREUVES RÉELLES de traction pendant St Valentin)
- trendScore : 0-100 (basé sur tendances RÉELLES St Valentin actuelles)
- saturation : 0-100 (saturation RÉELLE du marché St Valentin)
- status : "hot" si demandScore >= 75 ET trendScore >= 75 ET preuves réelles, "dead" si les deux <= 30, sinon "warm"

Contraintes STRICTES ST VALENTIN :
- AUCUN produit théorique ou inventé
- TOUS les produits doivent être RÉELS et EXISTER vraiment
- TOUS doivent avoir des PREUVES RÉELLES de vente pendant St Valentin
- PRIX RÉELS en FCFA (ex: 25 000 FCFA, 35 000 FCFA - pas de plages vagues)
- Focus EXCLUSIF sur produits romantiques VRAIMENT vendus pendant St Valentin en Afrique
- Classer les 50 produits du plus fort potentiel RÉEL au plus faible
- Exemples de produits RÉELS acceptés : Fleur artificielle LED, Powerbank cœur, Bougie parfumée, Bijou cœur, etc.

Exemple de format JSON attendu pour ST VALENTIN :
{
  "products": [
    {
      "name": "Bouquet de roses artificielles LED avec message personnalisé",
      "category": "Cadeaux romantiques",
      "specialEvent": "saint-valentin",
      "problemSolved": "Besoin d'un cadeau romantique durable et original pour St Valentin en Afrique",
      "whyItWorks": "Roses qui ne fanent jamais, effet LED romantique, personnalisation du message, adapté au budget africain",
      "proofIndicator": "Meta Ads actives au Sénégal et Côte d'Ivoire pendant St Valentin, volume élevé sur AliExpress en février",
      "supplierPrice": 8,
      "sellingPrice": 35000,
      "priceRange": "30 000 - 40 000 FCFA",
      "countries": ["Sénégal", "Côte d'Ivoire", "Cameroun", "Maroc"],
      "marketingAngle": "romance",
      "scalingPotential": "Élevé",
      "demandScore": 92,
      "trendScore": 88,
      "saturation": 20,
      "status": "hot"
    }
  ]
}`;

const buildPrompt = () => `Rôle :
Tu es un expert e-commerce senior spécialisé dans les marchés africains (Afrique de l'Ouest, Centrale et du Nord), avec une expertise avancée en product research, data Meta Ads, Minea, Alibaba et AliExpress.

Objectif :
Identifier EXACTEMENT 50 produits WINNERS RÉELS qui ont VRAIMENT été vendus avec succès en Afrique francophone. Ces produits doivent être CONCRETS, avec des PRIX RÉELS et des PREUVES de vente.

IMPORTANT : Tu DOIS générer exactement 50 produits RÉELS, pas moins. Chaque produit doit avoir un nom précis, un prix réel en FCFA, et une preuve de vente.

Sources d'analyse obligatoires :
- Meta Ads Library (publicités ACTIVES et RÉCURRENTES en Afrique francophone)
- Minea (produits gagnants avec PREUVES de scaling et ventes réelles)
- Alibaba & AliExpress (volume de commandes RÉEL, fournisseurs avec ventes vérifiées)
- Tendances locales africaines (produits VRAIMENT vendus, pas théoriques)

Critères STRICTS de sélection des produits RÉELS :
- PRODUITS RÉELS : Doivent être des produits CONCRETS qui existent vraiment (ex: Powerbank 20000mAh, Fleur artificielle LED, etc.)
- PREUVES DE VENTE : Doivent avoir été VRAIMENT vendus en Afrique (publicités Meta actives, ventes sur Minea, commandes Alibaba/AliExpress)
- PRIX RÉELS : Fournir des prix CONCRETS en FCFA (ex: 15 000 FCFA, 25 000 FCFA, pas de plages vagues)
- PRIX FOURNISSEUR : 2$ à 20$ USD (convertis en FCFA dans le prix de vente)
- PRIX DE VENTE : x3 à x6 du prix fournisseur, en FCFA CONCRET (ex: fournisseur 5$ = vente 15 000 - 20 000 FCFA)
- GADGETS RÉELS : Powerbank, fleurs artificielles LED, gadgets USB, accessoires téléphone, etc.
- FACILE À EXPLIQUER : Produits qui se vendent bien en vidéo UGC
- COMPATIBLE COD : Livraison locale et paiement à la livraison

IMPORTANT - Format de réponse JSON :
Réponds UNIQUEMENT avec un objet JSON valide de la forme {"products":[...]} sans texte avant ou après.
Le JSON doit être complet et valide.

Pour chaque produit RÉEL, fournis OBLIGATOIREMENT dans le JSON :
- name : Nom PRÉCIS et RÉEL du produit (ex: "Powerbank 20000mAh avec LED", "Fleur artificielle LED rose", "Chargeur USB magnétique")
- category : Maison, Auto, Beauté, Santé, Cuisine, Sécurité, Électronique, etc.
- problemSolved : Problème RÉEL résolu en Afrique (ex: "Coupures d'électricité fréquentes", "Besoin de charger téléphone sans électricité")
- whyItWorks : Pourquoi ce produit RÉEL marche VRAIMENT en Afrique (preuves concrètes, pas théoriques)
- proofIndicator : PREUVE RÉELLE de vente (ex: "Meta Ads actives au Sénégal depuis 3 mois", "5000+ ventes sur AliExpress", "Scaling actif sur Minea")
- supplierPrice : Prix fournisseur RÉEL en USD (2$ à 20$)
- sellingPrice : Prix de vente RÉEL en FCFA (ex: 15000, 25000, 35000 - prix CONCRET, pas de plage)
- priceRange : Plage de prix RÉELLE en FCFA (format "15 000 - 20 000 FCFA" avec prix CONCRETS)
- countries : Pays africains où le produit est VRAIMENT vendu (array de 2-5 pays : Sénégal, Côte d'Ivoire, Maroc, Cameroun, etc.)
- marketingAngle : Angle marketing RÉEL utilisé (peur, gain, confort, économie, statut)
- scalingPotential : Potentiel RÉEL basé sur les ventes actuelles (Faible / Moyen / Élevé)
- demandScore : 0-100 (basé sur PREUVES RÉELLES de traction : publicités actives, ventes réelles)
- trendScore : 0-100 (basé sur tendances RÉELLES actuelles, pas théoriques)
- saturation : 0-100 (saturation RÉELLE du marché basée sur données concrètes)
- status : "hot" si demandScore >= 75 ET trendScore >= 75 ET preuves réelles, "dead" si les deux <= 30, sinon "warm"

Contraintes STRICTES :
- AUCUN produit théorique ou inventé
- TOUS les produits doivent être RÉELS et EXISTER vraiment
- TOUS doivent avoir des PREUVES RÉELLES de vente (publicités actives, ventes vérifiées)
- PRIX RÉELS en FCFA (ex: 15 000 FCFA, 25 000 FCFA - pas de plages vagues)
- Focus EXCLUSIF sur produits VRAIMENT vendus en Afrique francophone
- Classer les 50 produits du plus fort potentiel RÉEL au plus faible
- Exemples de produits RÉELS acceptés : Powerbank 20000mAh, Fleur artificielle LED, Chargeur USB, Gadgets téléphone, etc.

Exemple de format JSON attendu avec produits RÉELS :
{
  "products": [
    {
      "name": "Powerbank 20000mAh avec LED et charge rapide",
      "category": "Électronique",
      "problemSolved": "Coupures d'électricité fréquentes en Afrique, besoin de charger téléphone sans électricité",
      "whyItWorks": "Autonomie élevée, charge rapide, LED intégrée pour éclairage, vendu activement au Sénégal et Côte d'Ivoire",
      "proofIndicator": "Meta Ads actives au Sénégal depuis 4 mois, 8000+ ventes sur AliExpress, scaling actif sur Minea",
      "supplierPrice": 6,
      "sellingPrice": 25000,
      "priceRange": "22 000 - 28 000 FCFA",
      "countries": ["Sénégal", "Côte d'Ivoire", "Cameroun", "Mali"],
      "marketingAngle": "confort",
      "scalingPotential": "Élevé",
      "demandScore": 92,
      "trendScore": 88,
      "saturation": 20,
      "status": "hot"
    },
    {
      "name": "Fleur artificielle LED rose avec message personnalisé",
      "category": "Décoration",
      "problemSolved": "Besoin de cadeau romantique durable et original",
      "whyItWorks": "Ne fane jamais, effet LED romantique, personnalisation, vendu activement pendant St Valentin",
      "proofIndicator": "Meta Ads actives au Maroc et Cameroun, 5000+ ventes sur AliExpress en février",
      "supplierPrice": 8,
      "sellingPrice": 35000,
      "priceRange": "30 000 - 40 000 FCFA",
      "countries": ["Maroc", "Cameroun", "Sénégal", "Côte d'Ivoire"],
      "marketingAngle": "romance",
      "scalingPotential": "Élevé",
      "demandScore": 85,
      "trendScore": 90,
      "saturation": 15,
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

const normalizeProduct = (product, specialEvent = '') => {
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
  
  // Déterminer specialEvent : utiliser celui du produit ou celui passé en paramètre
  const event = product.specialEvent?.toString().trim() || specialEvent || '';
  
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
    specialEvent: event,
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

  // S'assurer d'avoir au moins 50 produits
  if (products.length < 50) {
    console.warn(`⚠️ Seulement ${products.length} produits générés, minimum 50 requis`);
  }
  
  // Limiter à 50 produits comme demandé dans le prompt
  // Les produits généraux n'ont pas de specialEvent (ou specialEvent vide)
  return products.slice(0, 50).map(p => normalizeProduct(p, ''));
};

// Fonction pour générer spécifiquement les produits St Valentin
export const fetchValentineProducts = async () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY manquant pour Success Radar');
  }

  const messages = [
    { role: 'system', content: 'Tu es un générateur de tendances e-commerce spécialisé dans les produits romantiques pour la Saint-Valentin en Afrique.' },
    { role: 'user', content: buildValentinePrompt() }
  ];

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    temperature: 0.8, // Légèrement plus élevé pour plus de créativité romantique
    max_tokens: 6000,
    response_format: { type: 'json_object' }
  });

  const content = response.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Réponse OpenAI vide pour produits St Valentin');
  }

  console.log('💝 Réponse OpenAI St Valentin reçue, longueur:', content.length);
  
  // Nettoyer le contenu avant parsing
  const cleanedContent = cleanJSONContent(content);
  
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
      products = Object.values(parsed.products);
    }
    
    console.log(`💝 ${products.length} produits St Valentin extraits du JSON`);
  } catch (err) {
    console.error('❌ Erreur parsing produits St Valentin:', err.message);
    
    // Essayer avec la fonction de fallback
    products = parseProducts(content);
    
    if (!products.length) {
      console.log('⚠️ Tentative d\'extraction manuelle du JSON St Valentin...');
      try {
        const jsonMatch = content.match(/\{[\s\S]*"products"[\s\S]*\}/);
        if (jsonMatch) {
          const manualParsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(manualParsed.products)) {
            products = manualParsed.products;
            console.log(`💝 ${products.length} produits St Valentin extraits manuellement`);
          }
        }
      } catch (manualErr) {
        console.error('❌ Échec extraction manuelle St Valentin:', manualErr.message);
      }
    }
  }

  if (!products.length) {
    throw new Error('Aucune donnée produit St Valentin reçue depuis OpenAI');
  }

  // Normaliser les produits avec specialEvent = 'saint-valentin'
  // S'assurer d'avoir au moins 50 produits
  if (products.length < 50) {
    console.warn(`⚠️ Seulement ${products.length} produits St Valentin générés, minimum 50 requis`);
  }
  return products.slice(0, 50).map(p => normalizeProduct(p, 'saint-valentin'));
};

export const refreshSuccessRadar = async () => {
  console.log('🔄 Mise à jour Success Radar...');
  const products = await fetchWinningProducts();

  // Supprimer uniquement les anciens produits généraux (pas les St Valentin)
  await WinningProduct.deleteMany({ 
    $or: [
      { specialEvent: { $exists: false } },
      { specialEvent: '' },
      { specialEvent: { $ne: 'saint-valentin' } }
    ]
  });
  
  // Insérer les 50 nouveaux produits généraux
  if (products.length > 0) {
    await WinningProduct.insertMany(products, { ordered: false });
    console.log(`✅ ${products.length} produits généraux enregistrés en base de données`);
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
    console.error('❌ Impossible d\'exécuter Success Radar initial:', err.message);
  }
};

// Fonction pour rafraîchir uniquement les produits St Valentin
export const refreshValentineProducts = async () => {
  console.log('💝 Mise à jour produits St Valentin...');
  const products = await fetchValentineProducts();

  // Supprimer uniquement les anciens produits St Valentin
  await WinningProduct.deleteMany({ specialEvent: 'saint-valentin' });
  
  // Insérer les nouveaux produits St Valentin
  if (products.length > 0) {
    await WinningProduct.insertMany(products, { ordered: false });
    console.log(`💝 ${products.length} produits St Valentin enregistrés en base de données`);
  } else {
    console.warn('⚠️ Aucun produit St Valentin à enregistrer');
  }
};


import cron from 'node-cron';
import OpenAI from 'openai';
import WinningProduct from '../models/WinningProduct.js';

const SCHEDULE = '0 * * * *'; // every 1 hour

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Fonction pour construire un prompt simplifié St Valentin pour 15 produits
const buildValentinePrompt = (batchNumber = 1) => {
  return `Tu es une API qui renvoie UNIQUEMENT du JSON VALIDE. Pas de texte, pas de commentaire, pas de markdown.

Règles strictes :
- Réponds UNIQUEMENT avec un objet JSON valide {"products":[...]}
- Pas de texte avant ou après le JSON
- Pas de commentaires dans le JSON
- Pas de markdown (pas de \`\`\`)
- EXACTEMENT 15 produits dans le tableau "products"
- Si tu ne peux pas finir, ferme proprement tous les objets JSON avec } et ]

Génère EXACTEMENT 15 produits romantiques St Valentin RÉELS vendus en Afrique francophone.
IMPORTANT : Produits winners réels trouvés sur AliExpress (pas de services).
Évite les services, abonnements, prestations ou offres immatérielles.

Champs OBLIGATOIRES pour chaque produit :
- name : Nom du produit romantique
- category : Cadeaux romantiques, Bijoux, Beauté, etc.
- specialEvent : "saint-valentin" (OBLIGATOIRE)
- problemSolved : Besoin romantique résolu
- whyItWorks : Pourquoi ça marche pendant St Valentin
- proofIndicator : Preuve de vente St Valentin
- supplierPrice : Prix fournisseur USD (2-20$)
- sellingPrice : Prix vente FCFA (ex: 25000, 35000)
- priceRange : Plage prix FCFA (ex: "25 000 - 30 000 FCFA")
- countries : ["Sénégal", "Côte d'Ivoire", ...]
- marketingAngle : romance, émotion, statut, confort, gain
- scalingPotential : Faible, Moyen, Élevé
- demandScore : 0-100
- trendScore : 0-100
- saturation : 0-100
- status : hot, warm, dead

Format JSON strict :
{
  "products": [
    {"name": "...", "category": "...", "specialEvent": "saint-valentin", ...},
    ...
  ]
}`;
};

// Fonction pour construire un prompt simplifié pour 20 produits
const buildPrompt = (batchNumber = 1, totalBatches = 3, includeSkinCare = true) => {
  const skinCareCount = batchNumber === 1 ? 4 : (batchNumber === 2 ? 4 : 2); // 4+4+2 = 10 produits Skin Care
  
  return `Tu es une API qui renvoie UNIQUEMENT du JSON VALIDE. Pas de texte, pas de commentaire, pas de markdown.

Règles strictes :
- Réponds UNIQUEMENT avec un objet JSON valide {"products":[...]}
- Pas de texte avant ou après le JSON
- Pas de commentaires dans le JSON
- Pas de markdown (pas de \`\`\`)
- EXACTEMENT 20 produits dans le tableau "products"
- Si tu ne peux pas finir, ferme proprement tous les objets JSON avec } et ]

Mission :
- Génère EXACTEMENT 20 produits e-commerce RÉELS vendus en Afrique francophone.
- 1 produit = 1 objet précis (pas de catégorie vague).
- Nom générique EXACT, trouvable tel quel sur AliExpress/Minea.
- Pas de services, abonnements ou offres immatérielles.
- Doit résoudre un problème réel local (coupures d'électricité, chaleur, mobilité, sécurité, eau, enfants, etc.).
- Achat impulsif possible, démontrable en vidéo, logistique simple.
- Prix adapté au pouvoir d'achat africain.

Catégories à couvrir (variété obligatoire) :
Beauté & soins (non médicaux), Maison & cuisine, Mode & accessoires, Santé du quotidien (bien-être non médical),
Énergie & solaire, Sécurité & protection, Enfants & bébés, Téléphones & accessoires, Vie quotidienne africaine (eau, chaleur, mobilité).

IMPORTANT : Pas de produits "classiques" de dropshipping ou ultra-génériques déjà vus partout.
Évite absolument : montres/bracelets connectés génériques, écouteurs Bluetooth basiques, bagues LED/anneaux lumineux, mini projecteurs, gaines amincissantes, brosses nettoyantes faciales génériques, lampes décoratives sans valeur claire.
Privilégie des produits réellement vendus en commerce local avec une utilité évidente et des acheteurs récurrents.
${includeSkinCare ? `Inclus ${skinCareCount} produits Skin Care (category: "Skin Care") parmi les 20 produits.` : ''}

Règles de prix (FCFA) :
- Petit produit : 5 000 - 10 000 FCFA
- Produit moyen : 10 000 - 25 000 FCFA
- Produit premium : 25 000 - 50 000 FCFA

Champs OBLIGATOIRES pour chaque produit :
- name : Nom du produit (objet précis)
- category : Catégorie produit (ex: Skin Care, Maison, Sécurité, Mode, Énergie & solaire)
- problemCategory : Catégorie du problème (Beauté / Maison / Mode / Santé / Énergie / Sécurité / Enfants / Téléphones / Vie quotidienne)
- problemSolved : Problème résolu
- whyItWorks : Pourquoi ça se vend en Afrique
- proofIndicator : Preuve de vente ou signal de traction
- supplierPrice : Prix fournisseur USD (2-20$)
- sellingPrice : Prix vente FCFA (ex: 15000, 25000)
- priceRange : Plage prix FCFA (ex: "15 000 - 20 000 FCFA")
- countries : ["Sénégal", "Côte d'Ivoire", ...]
- marketingAngle : Angle marketing principal (peur, gain, confort, économie, statut, etc.)
- mainPlatform : Plateforme principale (FB Marketplace / TikTok / Ads / AliExpress)
- adPotential : Potentiel publicitaire (Faible / Moyen / Fort ou "🔥 Fort")
- videoType : Type de vidéo recommandé (démo, avant/après, témoignage, UGC)
- scalingPotential : Faible, Moyen, Élevé
- demandScore : 0-100
- trendScore : 0-100
- saturation : 0-100
- status : hot, warm, dead

Format JSON strict :
{
  "products": [
    {"name": "...", "category": "...", ...},
    ...
  ]
}`;
};

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
  
  // Normaliser la catégorie Skin Care (plusieurs variantes possibles)
  let category = product.category?.toString().trim() || '';
  const categoryLower = category.toLowerCase();
  if (categoryLower.includes('skin') && categoryLower.includes('care')) {
    category = 'Skin Care'; // Standardiser sur "Skin Care"
  } else if (categoryLower.includes('soin') && (categoryLower.includes('peau') || categoryLower.includes('visage'))) {
    category = 'Skin Care'; // Traduire "Soin de la peau" en "Skin Care"
  }
  
  return {
    name: name,
    category: category,
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
    problemCategory: product.problemCategory?.toString().trim() || '',
    mainPlatform: product.mainPlatform?.toString().trim() || '',
    adPotential: product.adPotential?.toString().trim() || '',
    videoType: product.videoType?.toString().trim() || '',
    scalingPotential: product.scalingPotential?.toString().trim() || '',
    alibabaLink: alibabaLink,
    specialEvent: event,
    lastUpdated: new Date()
  };
};

// Fonction pour extraire les produits d'un JSON tronqué
const extractProductsFromTruncatedJSON = (content, specialEvent = '') => {
  const products = [];
  
  try {
    // Chercher le début du tableau products
    const productsStart = content.indexOf('"products"');
    if (productsStart === -1) return products;
    
    // Chercher l'ouverture du tableau [
    const arrayStart = content.indexOf('[', productsStart);
    if (arrayStart === -1) return products;
    
    let depth = 0;
    let inString = false;
    let escapeNext = false;
    let currentProduct = '';
    let braceDepth = 0;
    
    // Parcourir caractère par caractère pour extraire les objets produits complets
    for (let i = arrayStart + 1; i < content.length; i++) {
      const char = content[i];
      
      if (escapeNext) {
        currentProduct += char;
        escapeNext = false;
        continue;
      }
      
      if (char === '\\') {
        currentProduct += char;
        escapeNext = true;
        continue;
      }
      
      if (char === '"') {
        inString = !inString;
        currentProduct += char;
        continue;
      }
      
      if (inString) {
        currentProduct += char;
        continue;
      }
      
      if (char === '{') {
        braceDepth++;
        currentProduct += char;
        continue;
      }
      
      if (char === '}') {
        braceDepth--;
        currentProduct += char;
        
        // Si on ferme un objet produit complet
        if (braceDepth === 0) {
          try {
            const productObj = JSON.parse(currentProduct);
            if (productObj.name || productObj.category) {
              products.push(productObj);
            }
          } catch (e) {
            // Ignorer les objets invalides
          }
          currentProduct = '';
        }
        continue;
      }
      
      if (char === '[') {
        depth++;
        currentProduct += char;
        continue;
      }
      
      if (char === ']') {
        depth--;
        if (depth < 0) break; // Fin du tableau
        currentProduct += char;
        continue;
      }
      
      if (braceDepth > 0) {
        currentProduct += char;
      }
    }
    
    // Essayer d'extraire le dernier produit incomplet si possible
    if (currentProduct.trim() && currentProduct.includes('"name"')) {
      try {
        // Essayer de compléter l'objet en ajoutant les accolades manquantes
        let tempProduct = currentProduct;
        const openBraces = (tempProduct.match(/\{/g) || []).length;
        const closeBraces = (tempProduct.match(/\}/g) || []).length;
        while (openBraces > closeBraces) {
          tempProduct += '}';
        }
        // Fermer les chaînes ouvertes si nécessaire
        const quotes = (tempProduct.match(/"/g) || []).length;
        if (quotes % 2 !== 0) {
          // Trouver la dernière chaîne ouverte et la fermer
          const lastQuoteIndex = tempProduct.lastIndexOf('"');
          if (lastQuoteIndex !== -1) {
            const afterQuote = tempProduct.substring(lastQuoteIndex + 1);
            if (!afterQuote.match(/^\s*[,:}]/)) {
              tempProduct += '"';
            }
          }
        }
        const productObj = JSON.parse(tempProduct);
        if (productObj.name || productObj.category) {
          products.push(productObj);
        }
      } catch (e) {
        // Essayer une extraction plus agressive : chercher les champs essentiels
        try {
          const nameMatch = currentProduct.match(/"name"\s*:\s*"([^"]+)"/);
          const categoryMatch = currentProduct.match(/"category"\s*:\s*"([^"]+)"/);
          if (nameMatch && nameMatch[1]) {
            // Créer un produit minimal avec les champs disponibles
            const minimalProduct = {
              name: nameMatch[1],
              category: categoryMatch ? categoryMatch[1] : 'Autre',
              problemCategory: '',
              problemSolved: '',
              whyItWorks: '',
              proofIndicator: '',
              supplierPrice: 0,
              sellingPrice: 0,
              priceRange: '',
              countries: [],
              marketingAngle: '',
              mainPlatform: '',
              adPotential: '',
              videoType: '',
              scalingPotential: 'Moyen',
              demandScore: 50,
              trendScore: 50,
              saturation: 50,
              status: 'warm'
            };
            if (specialEvent) {
              minimalProduct.specialEvent = specialEvent;
            }
            products.push(minimalProduct);
          }
        } catch (e2) {
          // Ignorer si on ne peut toujours pas parser
        }
      }
    }
    
  } catch (err) {
    console.error('❌ Erreur extraction JSON tronqué:', err.message);
  }
  
  return products;
};

// Fonction helper pour extraire les produits d'une réponse OpenAI
const extractProductsFromResponse = (content) => {
  const cleanedContent = cleanJSONContent(content);
  let products = [];
  
  try {
    const parsed = JSON.parse(cleanedContent);
    
    if (Array.isArray(parsed)) {
      products = parsed;
    } else if (Array.isArray(parsed.products)) {
      products = parsed.products;
    } else if (Array.isArray(parsed.data)) {
      products = parsed.data;
    } else if (parsed.products && typeof parsed.products === 'object') {
      products = Object.values(parsed.products);
    }
  } catch (err) {
    console.error('❌ Erreur parsing JSON complet:', err.message);
    
    // Si le JSON est tronqué, essayer d'extraire les produits valides
    console.log('🔄 Tentative d\'extraction depuis JSON tronqué...');
    products = extractProductsFromTruncatedJSON(content, '');
    
    if (products.length > 0) {
      console.log(`✅ ${products.length} produits extraits depuis JSON tronqué`);
    } else {
      // Essayer avec parseProducts comme fallback
    products = parseProducts(content);
    
    if (!products.length) {
      try {
        const jsonMatch = content.match(/\{[\s\S]*"products"[\s\S]*\}/);
        if (jsonMatch) {
          const manualParsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(manualParsed.products)) {
            products = manualParsed.products;
          }
        }
      } catch (manualErr) {
        console.error('❌ Échec extraction manuelle:', manualErr.message);
          // Dernier recours : extraction depuis JSON tronqué
          products = extractProductsFromTruncatedJSON(content, '');
        }
      }
    }
  }
  
  return products;
};

// Fonction pour générer les produits manquants
const generateMissingProducts = async (existingProducts, specialEvent = '') => {
  const missingCount = 50 - existingProducts.length;
  if (missingCount <= 0) return [];
  
  console.log(`🔄 Génération de ${missingCount} produits manquants...`);
  
  const existingNames = existingProducts.map(p => (p.name || '').toLowerCase());
  
  // Compter les produits Skin Care existants
  const existingSkinCare = existingProducts.filter(p => {
    const category = (p.category || '').toLowerCase();
    return category.includes('skin') || category.includes('care') || category.includes('soin');
  }).length;
  
  const targetSkinCare = 10; // Objectif : 10 produits Skin Care
  const missingSkinCare = Math.max(0, targetSkinCare - existingSkinCare);
  const skinCareToGenerate = Math.min(missingSkinCare, Math.floor(missingCount * 0.4)); // 40% des produits manquants en Skin Care
  
  const completionPrompt = specialEvent === 'saint-valentin' 
    ? `Génère EXACTEMENT ${missingCount} produits romantiques St Valentin supplémentaires pour compléter une liste. Ces produits doivent être DIFFÉRENTS de ceux déjà générés. Produits winners réels trouvés sur AliExpress (pas de services). Format JSON: {"products":[...]}. Chaque produit doit avoir tous les champs requis avec specialEvent="saint-valentin".`
    : `Génère EXACTEMENT ${missingCount} produits e-commerce supplémentaires pour compléter une liste de 50 produits pour l'Afrique francophone. 
    
⚠️ IMPORTANT : Inclus OBLIGATOIREMENT ${skinCareToGenerate} produits Skin Care (category: "Skin Care") parmi les ${missingCount} produits à générer.
Produits Skin Care acceptés : Crèmes éclaircissantes, Savons noirs, Masques visage, Sérums, Lotions hydratantes, Crèmes anti-âge, etc.
IMPORTANT : Produits RÉELS vendus en commerce (physique et en ligne). Pas de produits classiques/ultra-génériques de dropshipping.
Évite : montres/bracelets connectés génériques, écouteurs Bluetooth basiques, bagues LED, mini projecteurs, gaines amincissantes, brosses faciales génériques, lampes décoratives sans valeur claire.
Respecte les prix FCFA (5 000 - 50 000) et ajoute les champs: problemCategory, mainPlatform, adPotential, videoType.
Ces produits doivent être DIFFÉRENTS de ceux déjà générés. Format JSON: {"products":[...]}. Chaque produit doit avoir tous les champs requis.`;
  
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: 'Tu es un générateur de produits e-commerce. Génère EXACTEMENT le nombre de produits demandé en JSON valide.' 
        },
        { role: 'user', content: completionPrompt }
      ],
      temperature: 0.8,
      max_tokens: 8000,
      response_format: { type: 'json_object' }
    });
    
      const content = response.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('Réponse OpenAI vide pour produits complémentaires');
      }
      
      // Vérifier si le JSON est tronqué
      const isTruncated = !content.trim().endsWith('}') && !content.trim().endsWith(']');
      if (isTruncated) {
        console.warn(`⚠️ JSON complémentaire semble tronqué`);
      }
      
      const additionalProducts = extractProductsFromResponse(content);
      
      if (additionalProducts.length === 0) {
        console.warn(`⚠️ Aucun produit complémentaire extrait depuis la réponse`);
        return [];
      }
      
      // Filtrer les doublons basés sur le nom
      const uniqueProducts = additionalProducts.filter(p => {
        const name = (p.name || '').toLowerCase();
        return name && !existingNames.includes(name);
      });
      
      console.log(`✅ ${uniqueProducts.length} produits complémentaires générés (${uniqueProducts.length >= missingCount ? 'suffisant' : 'insuffisant'})`);
      return uniqueProducts.slice(0, missingCount);
  } catch (error) {
    console.error('❌ Erreur génération produits complémentaires:', error.message);
    return [];
  }
};

// Fonction pour réparer un JSON tronqué de manière plus intelligente
const repairTruncatedJSON = (content) => {
  let repaired = content.trim();
  
  // Si ça ne se termine pas par } ou ], essayer de fermer proprement
  if (!repaired.endsWith('}') && !repaired.endsWith(']')) {
    // Compter les accolades ouvertes/fermées (en tenant compte des chaînes)
    let openBraces = 0;
    let closeBraces = 0;
    let openBrackets = 0;
    let closeBrackets = 0;
    let inString = false;
    let escapeNext = false;
    
    for (let i = 0; i < repaired.length; i++) {
      const char = repaired[i];
      
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      
      if (char === '\\') {
        escapeNext = true;
        continue;
      }
      
      if (char === '"') {
        inString = !inString;
        continue;
      }
      
      if (inString) continue;
      
      if (char === '{') openBraces++;
      if (char === '}') closeBraces++;
      if (char === '[') openBrackets++;
      if (char === ']') closeBrackets++;
    }
    
    // Fermer les chaînes ouvertes si nécessaire
    if (inString) {
      // Trouver la dernière chaîne ouverte et la fermer
      const lastQuote = repaired.lastIndexOf('"');
      if (lastQuote !== -1) {
        // Vérifier si c'est une ouverture ou fermeture
        const beforeQuote = repaired.substring(Math.max(0, lastQuote - 10), lastQuote);
        if (!beforeQuote.match(/:\s*$/)) {
          repaired += '"';
        }
      }
    }
    
    // Fermer les tableaux ouverts
    while (openBrackets > closeBrackets) {
      repaired += ']';
      closeBrackets++;
    }
    
    // Fermer les objets ouverts
    while (openBraces > closeBraces) {
      repaired += '}';
      closeBraces++;
    }
  }
  
  return repaired;
};

// Fonction pour générer un batch de 20 produits avec retry et gestion robuste
const generateBatch = async (batchNumber, totalBatches, existingProducts = [], specialEvent = '', retryCount = 0) => {
  const existingNames = existingProducts.map(p => (p.name || '').toLowerCase());
  const prompt = specialEvent === 'saint-valentin' 
    ? buildValentinePrompt(batchNumber)
    : buildPrompt(batchNumber, totalBatches, true);
  
  const systemMessage = specialEvent === 'saint-valentin'
    ? 'Tu es une API JSON. Réponds UNIQUEMENT avec du JSON valide. Pas de texte, pas de commentaire. Si tu ne peux pas finir, ferme proprement tous les objets avec } et ].'
    : 'Tu es une API JSON. Réponds UNIQUEMENT avec du JSON valide. Pas de texte, pas de commentaire. Si tu ne peux pas finir, ferme proprement tous les objets avec } et ].';
  
  const maxRetries = 2;
  
  try {
    console.log(`🔄 Génération batch ${batchNumber}/${totalBatches} (${retryCount > 0 ? `tentative ${retryCount + 1}` : 'première tentative'})...`);
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 6000, // Réduit pour éviter les troncatures
      response_format: { type: 'json_object' }
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Réponse OpenAI vide');
    }

    console.log(`📥 Réponse batch ${batchNumber} reçue, longueur:`, content.length);
    
    // Vérifier si le JSON est tronqué
    let isTruncated = !content.trim().endsWith('}') && !content.trim().endsWith(']');
    let processedContent = content;
    
    if (isTruncated) {
      console.warn(`⚠️ JSON batch ${batchNumber} semble tronqué, tentative de réparation...`);
      processedContent = repairTruncatedJSON(content);
    }
    
    // Essayer d'extraire les produits avec plusieurs méthodes
    let products = extractProductsFromResponse(processedContent);
    
    // Si aucun produit extrait et JSON tronqué, essayer avec le contenu original
    if (products.length === 0 && isTruncated) {
      console.log(`🔄 Tentative extraction depuis JSON tronqué brut...`);
      products = extractProductsFromTruncatedJSON(content, specialEvent);
    }
    
    // Si toujours aucun produit et retry possible, réessayer
    if (products.length === 0 && retryCount < maxRetries) {
      console.warn(`⚠️ Aucun produit extrait, nouvelle tentative dans 2 secondes...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return generateBatch(batchNumber, totalBatches, existingProducts, specialEvent, retryCount + 1);
    }
    
    // Filtrer les doublons avec les produits existants
    const uniqueProducts = products.filter(p => {
      const name = (p.name || '').toLowerCase();
      return name && !existingNames.includes(name);
    });
    
    if (uniqueProducts.length > 0) {
      console.log(`✅ Batch ${batchNumber}: ${uniqueProducts.length} produits uniques extraits`);
    } else {
      console.warn(`⚠️ Batch ${batchNumber}: Aucun produit unique extrait`);
    }
    
    return uniqueProducts;
    
  } catch (error) {
    console.error(`❌ Erreur batch ${batchNumber}:`, error.message);
    
    // Retry si erreur et pas encore au max
    if (retryCount < maxRetries) {
      console.log(`🔄 Nouvelle tentative batch ${batchNumber} dans 2 secondes...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return generateBatch(batchNumber, totalBatches, existingProducts, specialEvent, retryCount + 1);
    }
    
    return [];
  }
};

export const fetchWinningProducts = async () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY manquant pour Success Radar');
  }

  let allProducts = [];
  const TARGET = 50;
  const MAX_ATTEMPTS = 8; // garde-fou : max 8 passes au total
  let attempt = 0;

  while (allProducts.length < TARGET && attempt < MAX_ATTEMPTS) {
    attempt++;
    const remaining = TARGET - allProducts.length;
    console.log(`🔄 Passe ${attempt}/${MAX_ATTEMPTS} — ${allProducts.length}/${TARGET} produits, besoin de ${remaining} de plus...`);

    const batchProducts = attempt <= 3
      ? await generateBatch(attempt, 3, allProducts, '')
      : await generateMissingProducts(allProducts, '');

    if (batchProducts.length > 0) {
      allProducts = [...allProducts, ...batchProducts];

      // Dédupliquer par nom
      const seen = new Set();
      allProducts = allProducts.filter(p => {
        const name = (p.name || '').toLowerCase();
        if (!name || seen.has(name)) return false;
        seen.add(name);
        return true;
      });
    }

    console.log(`📊 Total produits accumulés: ${allProducts.length}/${TARGET}`);

    if (allProducts.length >= TARGET) break;

    // Pause entre les passes pour éviter les rate limits
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  if (allProducts.length < TARGET) {
    console.error(`❌ ERREUR CRITIQUE : Impossible de générer ${TARGET} produits après ${attempt} passes. Seulement ${allProducts.length} produits obtenus.`);
    throw new Error(`Impossible de générer ${TARGET} produits. Seulement ${allProducts.length} produits obtenus.`);
  }
  
  // Vérifier que les produits Skin Care sont présents
  let skinCareProducts = allProducts.filter(p => {
    const category = (p.category || '').toLowerCase();
    return category.includes('skin') || category.includes('care') || category.includes('soin');
  });
  
  const requiredSkinCare = 10; // Objectif : 10 produits Skin Care minimum
  const currentSkinCareCount = skinCareProducts.length;
  
  // Si moins de 10 produits Skin Care, générer les produits Skin Care manquants
  if (currentSkinCareCount < requiredSkinCare && allProducts.length >= 50) {
    const missingSkinCare = requiredSkinCare - currentSkinCareCount;
    console.log(`⚠️ Seulement ${currentSkinCareCount} produits Skin Care détectés. Génération de ${missingSkinCare} produits Skin Care supplémentaires...`);
    
    try {
      const skinCarePrompt = `Génère EXACTEMENT ${missingSkinCare} produits Skin Care / Soins de la peau RÉELS vendus en commerce pour l'Afrique francophone. Ces produits doivent être DIFFÉRENTS de ceux déjà générés. Format JSON: {"products":[...]}. Chaque produit DOIT avoir "category": "Skin Care". Produits acceptés : Crèmes éclaircissantes, Savons noirs, Masques visage, Sérums, Lotions hydratantes, Crèmes anti-âge, etc. Évite les produits Skin Care ultra-génériques sans valeur claire.`;
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'Tu es un générateur de produits Skin Care pour l\'Afrique. Génère EXACTEMENT le nombre de produits demandé avec category="Skin Care".' 
          },
          { role: 'user', content: skinCarePrompt }
        ],
        temperature: 0.8,
        max_tokens: 6000,
        response_format: { type: 'json_object' }
      });
      
      const content = response.choices?.[0]?.message?.content;
      if (content) {
        const newSkinCareProducts = extractProductsFromResponse(content);
        
        // S'assurer que tous ont bien category = "Skin Care"
        const correctedSkinCare = newSkinCareProducts.map(p => ({
          ...p,
          category: 'Skin Care'
        }));
        
        // Filtrer les doublons avec les produits existants
        const existingNames = allProducts.map(p => (p.name || '').toLowerCase());
        const uniqueSkinCare = correctedSkinCare.filter(p => {
          const name = (p.name || '').toLowerCase();
          return name && !existingNames.includes(name);
        });
        
        // Remplacer certains produits non-Skin Care par des produits Skin Care
        const nonSkinCareProducts = allProducts.filter(p => {
          const category = (p.category || '').toLowerCase();
          return !category.includes('skin') && !category.includes('care') && !category.includes('soin');
        });
        
        // Remplacer les produits non-Skin Care en excès par des produits Skin Care
        const toReplace = Math.min(uniqueSkinCare.length, nonSkinCareProducts.length, missingSkinCare);
        if (toReplace > 0) {
          // Retirer les produits non-Skin Care en excès
          const productsToKeep = nonSkinCareProducts.slice(0, Math.max(0, nonSkinCareProducts.length - toReplace));
          const skinCareToAdd = uniqueSkinCare.slice(0, toReplace);
          
          // Reconstruire la liste : garder les Skin Care existants + nouveaux Skin Care + autres produits
          allProducts = [
            ...skinCareProducts,
            ...skinCareToAdd,
            ...productsToKeep
          ];
          
          console.log(`✅ ${toReplace} produits Skin Care ajoutés (remplacement de produits non-Skin Care)`);
        } else {
          // Si on peut juste ajouter sans remplacer
          allProducts = [...allProducts, ...uniqueSkinCare.slice(0, missingSkinCare)];
          console.log(`✅ ${Math.min(uniqueSkinCare.length, missingSkinCare)} produits Skin Care ajoutés`);
        }
        
        // Re-vérifier le nombre de produits Skin Care
        skinCareProducts = allProducts.filter(p => {
          const category = (p.category || '').toLowerCase();
          return category.includes('skin') || category.includes('care') || category.includes('soin');
        });
      }
    } catch (error) {
      console.error('❌ Erreur génération produits Skin Care complémentaires:', error.message);
    }
  }
  
  if (skinCareProducts.length < 8) {
    console.warn(`⚠️ ATTENTION : Seulement ${skinCareProducts.length} produits Skin Care détectés après complétion`);
    console.warn(`   Le prompt exige au minimum 8-12 produits Skin Care.`);
  } else {
    console.log(`✅ ${skinCareProducts.length} produits Skin Care détectés (requis: 8-12, objectif: 10)`);
  }
  
  // Limiter à exactement 50 produits et normaliser
  const finalProducts = allProducts.slice(0, 50).map(p => normalizeProduct(p, ''));
  
  console.log(`✅ Exactement ${finalProducts.length} produits générés et normalisés`);
  
  return finalProducts;
};

// Fonction pour générer spécifiquement les produits St Valentin
export const fetchValentineProducts = async () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY manquant pour Success Radar');
  }

  const targetValentineCount = 15;
  let allProducts = [];
  const batches = [15]; // 15 produits
  
  // Générer les batches séquentiellement
  for (let i = 0; i < batches.length; i++) {
    const batchSize = batches[i];
    const batchNumber = i + 1;
    const totalBatches = batches.length;
    
    // Générer le batch
    const batchProducts = await generateBatch(batchNumber, totalBatches, allProducts, 'saint-valentin');
    
    if (batchProducts.length > 0) {
      // S'assurer que tous ont specialEvent="saint-valentin"
      const correctedProducts = batchProducts.map(p => ({
        ...p,
        specialEvent: 'saint-valentin'
      }));
      
      allProducts = [...allProducts, ...correctedProducts];
      
      // Éliminer les doublons
      const seen = new Set();
      allProducts = allProducts.filter(p => {
        const name = (p.name || '').toLowerCase();
        if (!name || seen.has(name)) return false;
        seen.add(name);
        return true;
      });
    }
    
    console.log(`💝 Total produits St Valentin accumulés: ${allProducts.length}/${targetValentineCount}`);
    
    // Si on a déjà le nombre cible, arrêter
    if (allProducts.length >= targetValentineCount) {
      break;
    }
    
    // Attendre un peu entre les batches pour éviter les rate limits
    if (i < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Si on n'a pas le nombre cible, on garde simplement ce qui a été généré
  if (allProducts.length < targetValentineCount) {
    console.warn(`⚠️ Seulement ${allProducts.length} produits St Valentin générés. Pas de génération complémentaire.`);
  }

  if (allProducts.length < targetValentineCount) {
    console.warn(`⚠️ Génération partielle St Valentin : ${allProducts.length} produits obtenus (au lieu de ${targetValentineCount}).`);
  }
  
  // Vérifier que tous les produits ont bien specialEvent="saint-valentin"
  const invalidProducts = allProducts.filter(p => p.specialEvent !== 'saint-valentin');
  if (invalidProducts.length > 0) {
    console.warn(`⚠️ ${invalidProducts.length} produits sans specialEvent="saint-valentin" détectés. Correction...`);
    allProducts = allProducts.map(p => ({
      ...p,
      specialEvent: 'saint-valentin'
    }));
  }
  
  // Limiter au nombre cible max et normaliser
  const finalValentineProducts = allProducts.slice(0, targetValentineCount).map(p => normalizeProduct(p, 'saint-valentin'));
  
  console.log(`✅ ${finalValentineProducts.length} produits St Valentin générés et normalisés`);
  
  return finalValentineProducts;
};

export const refreshSuccessRadar = async (force = false) => {
  console.log('🔄 Vérification Success Radar...');
  
  // Vérifier si des produits existent déjà et sont récents (moins d'1h)
  if (!force) {
    const existingProducts = await WinningProduct.find({ 
      $or: [
        { specialEvent: { $exists: false } },
        { specialEvent: '' },
        { specialEvent: { $ne: 'saint-valentin' } }
      ]
    })
      .sort({ lastUpdated: -1 })
      .limit(1)
      .lean();
    
    if (existingProducts.length > 0 && existingProducts[0].lastUpdated) {
      const now = new Date();
      const lastUpdate = new Date(existingProducts[0].lastUpdated);
      const oneHourInMs = 1 * 60 * 60 * 1000;
      const timeSinceUpdate = now - lastUpdate;
      
      if (timeSinceUpdate < oneHourInMs) {
        const remainingMinutes = Math.round((oneHourInMs - timeSinceUpdate) / (60 * 1000));
        console.log(`✅ Produits déjà générés il y a moins d'1h (${remainingMinutes}min restantes). Cache respecté.`);
        return;
      }
    }
  }
  
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


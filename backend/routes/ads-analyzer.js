import express from 'express';
import OpenAI from 'openai';
import fetch from 'node-fetch';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Vérifier que AbortController est disponible (Node.js 18+)
if (typeof AbortController === 'undefined') {
  throw new Error('AbortController non disponible. Node.js 18+ requis ou installez abort-controller');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  fetch: (url, options) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 60_000);

    return fetch(url, {
      ...options,
      signal: controller.signal
    }).finally(() => clearTimeout(id));
  }
});

const HKD_TO_FCFA = 78;
const REVENUE_PER_RESULT = 3000; // FCFA par résultat

console.log('📊 Router ads-analyzer initialisé');

/**
 * Parse l'analyse ANDROMEDA pour extraire les informations structurées
 * @param {string} analysisText - Texte de l'analyse ANDROMEDA
 * @param {Array} campaigns - Liste des campagnes
 * @returns {Object} Données parsées (diagnostics, decisions, actions)
 */
function parseAndromedaAnalysis(analysisText, campaigns) {
  const result = {
    globalDiagnostics: [],
    globalDecision: 'OPTIMISER',
    globalActions: [],
    campaignAnalyses: []
  };

  if (!analysisText || !analysisText.trim()) {
    return result;
  }

  const text = analysisText.toUpperCase();
  
  // Extraire la décision globale
  if (text.includes('STOP') || text.includes('ARRÊT')) {
    result.globalDecision = 'STOP';
  } else if (text.includes('SCALE') || text.includes('AUGMENTER') || text.includes('SCALER')) {
    result.globalDecision = 'SCALE';
  }

  // Extraire les diagnostics globaux
  const diagnosticMatches = analysisText.match(/diagnostic[:\s]+([^\n]+)/gi);
  if (diagnosticMatches) {
    result.globalDiagnostics = diagnosticMatches.map(m => m.replace(/diagnostic[:\s]+/gi, '').trim());
  }

  // Extraire les actions recommandées
  const actionMatches = analysisText.match(/(?:action|recommandation)[\s\d:]+([^\n-]+)/gi);
  if (actionMatches) {
    result.globalActions = actionMatches
      .map(m => m.replace(/(?:action|recommandation)[\s\d:]+/gi, '').trim())
      .filter(a => a.length > 10)
      .slice(0, 3);
  }

  // Extraire les actions numérotées
  const numberedActions = analysisText.match(/(?:^|\n)\s*[-•]\s*([^\n]+)/g);
  if (numberedActions && numberedActions.length > 0) {
    result.globalActions = numberedActions
      .map(m => m.replace(/^\s*[-•]\s*/, '').trim())
      .filter(a => a.length > 10 && !a.match(/^(action|recommandation)/i))
      .slice(0, 3);
  }

  // Parser chaque campagne individuellement
  const campaignSections = analysisText.split(/Campagne\s*:/i);
  campaignSections.forEach((section, index) => {
    if (index === 0) return; // Skip first section (before first "Campagne:")
    
    const campaignAnalysis = {
      campaignIndex: index - 1,
      decision: 'OPTIMISER',
      diagnostics: [],
      actions: []
    };

    const sectionUpper = section.toUpperCase();
    if (sectionUpper.includes('STOP')) {
      campaignAnalysis.decision = 'STOP';
    } else if (sectionUpper.includes('SCALE')) {
      campaignAnalysis.decision = 'SCALE';
    }

    // Extraire les diagnostics de cette campagne
    const diagMatch = section.match(/Diagnostic[:\s]+([^\n]+)/i);
    if (diagMatch) {
      campaignAnalysis.diagnostics.push(diagMatch[1].trim());
    }

    // Extraire les actions de cette campagne
    const actionsMatch = section.match(/Actions\s+recommandées[:\s]+([\s\S]*?)(?:\n\n|\n---|$)/i);
    if (actionsMatch) {
      const actionsText = actionsMatch[1];
      const actionLines = actionsText.match(/(?:^|\n)\s*[-•]\s*([^\n]+)/g);
      if (actionLines) {
        campaignAnalysis.actions = actionLines
          .map(m => m.replace(/^\s*[-•]\s*/, '').trim())
          .filter(a => a.length > 5)
          .slice(0, 3);
      }
    }

    result.campaignAnalyses.push(campaignAnalysis);
  });

  return result;
}

/**
 * Wrapper retry sécurisé pour les appels OpenAI
 * @param {Object} payload - Payload OpenAI
 * @param {number} attempt - Tentative actuelle
 * @returns {Promise} Réponse OpenAI
 */
async function safeOpenAICall(payload, attempt = 1) {
  try {
    const response = await openai.chat.completions.create(payload);
    console.log(`✅ OpenAI API call réussie (tentative ${attempt})`);
    console.log(`📊 Tokens utilisés: ${response.usage?.total_tokens || 'N/A'} (prompt: ${response.usage?.prompt_tokens || 'N/A'}, completion: ${response.usage?.completion_tokens || 'N/A'})`);
    return response;
  } catch (err) {
    console.error(`⚠️ OpenAI error attempt ${attempt}:`, err.message);
    console.error('Détails erreur:', {
      code: err.code,
      type: err.type,
      status: err.status,
      message: err.message
    });

    if (attempt >= 3) throw err;
    await new Promise(r => setTimeout(r, 2000 * attempt));
    return safeOpenAICall(payload, attempt + 1);
    }
}

/**
 * Normalise une valeur numérique (remplace les virgules par des points)
 * @param {any} value - Valeur à normaliser
 * @returns {string} Valeur normalisée
 */
function normalizeNumericValue(value) {
  if (value === null || value === undefined || value === '') {
    return '0';
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  // Remplacer les virgules par des points et nettoyer
  return String(value).trim().replace(/,/g, '.').replace(/[^\d.-]/g, '') || '0';
}

/**
 * Parse un nombre depuis une chaîne normalisée
 * @param {any} value - Valeur à parser
 * @returns {number} Nombre parsé
 */
function parseNormalizedFloat(value) {
  const normalized = normalizeNumericValue(value);
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Parse un entier depuis une chaîne normalisée
 * @param {any} value - Valeur à parser
 * @returns {number} Entier parsé
 */
function parseNormalizedInt(value) {
  const normalized = normalizeNumericValue(value);
  const parsed = parseInt(normalized, 10);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Trouve un champ dans une ligne en cherchant par nom normalisé
 * @param {Object} row - Ligne de données
 * @param {string|Array} fieldNames - Nom(s) du champ à chercher
 * @returns {any} Valeur trouvée ou null
 */
function findField(row, fieldNames) {
  const names = Array.isArray(fieldNames) ? fieldNames : [fieldNames];
          const keys = Object.keys(row);
  
  for (const name of names) {
          const found = keys.find(k => {
      const normalized = k.toLowerCase().trim()
        .replace(/\s+/g, '_')
        .replace(/[^\w_]/g, '');
      const normalizedName = name.toLowerCase().trim()
        .replace(/\s+/g, '_')
        .replace(/[^\w_]/g, '');
      return normalized === normalizedName || normalized.includes(normalizedName);
    });
    
          if (found) {
      return row[found];
    }
  }
  
  return null;
}

/**
 * Normalise une ligne de données selon la structure Google Sheet Facebook Ads
 * @param {Object} row - Ligne brute du CSV/Sheet
 * @returns {Object} Ligne normalisée avec toutes les colonnes
 */
function normalizeRow(row) {
  return {
    // Dates
    startDate: findField(row, ['début_des_rapports', 'start_date', 'date_start']) || '',
    endDate: findField(row, ['fin_des_rapports', 'end_date', 'date_end']) || '',
    
    // Informations de base
    adset: findField(row, ['nom_de_lensemble_de_publicits', 'adset', 'ad_set', 'nom_ensemble']) || '',
    status: findField(row, ['diffusion_des_ensembles_de_publicits', 'status', 'statut']) || '',
    budget: parseNormalizedFloat(findField(row, ['budget_des_ensembles_de_publicits', 'budget', 'budget_amount'])),
    budgetType: findField(row, ['type_de_budget_de_lensemble_de_publicits', 'budget_type', 'type_budget']) || '',
    
    // Métriques de coût
    cpm: parseNormalizedFloat(findField(row, ['cpm_coût_pour_1_000_impressions_hkd', 'cpm', 'cost_per_mille'])),
    spend: parseNormalizedFloat(findField(row, ['montant_dépensé_hkd', 'spend', 'amount_spent', 'montant_dpens_hkd'])),
    cpc: parseNormalizedFloat(findField(row, ['cpc_coût_par_clic_sur_un_lien_hkd', 'cpc', 'cost_per_click'])),
    costPerResult: parseNormalizedFloat(findField(row, ['coût_par_résultat', 'cost_per_result', 'cot_par_rsultat', 'cpa'])),
    
    // Métriques de performance
    results: parseNormalizedInt(findField(row, ['résultats', 'results', 'rsultats', 'purchases', 'conversions'])),
    resultType: findField(row, ['indicateur_de_résultats', 'result_type', 'indicateur_rsultats']) || '',
    roas: parseNormalizedFloat(findField(row, ['roas_des_résultats', 'roas', 'roas_results'])),
    roasType: findField(row, ['indicateur_de_roas', 'roas_type', 'indicateur_roas']) || '',
    
    // Métriques d'audience
    reach: parseNormalizedInt(findField(row, ['couverture', 'reach'])),
    impressions: parseNormalizedInt(findField(row, ['impressions', 'impression', 'imp'])),
    
    // Métriques de clics
    ctr: parseNormalizedFloat(findField(row, ['ctr_sur_des_liens_sortants', 'ctr', 'click_through_rate'])),
    uniqueClicks: parseNormalizedInt(findField(row, ['clics_uniques_sur_un_lien', 'unique_clicks', 'uniqueclicks'])),
    outboundClicks: parseNormalizedInt(findField(row, ['clics_sortants', 'outbound_clicks', 'outboundclicks'])),
    
    // Métriques de vidéo et landing page
    video3s: parseNormalizedInt(findField(row, ['lectures_de_vidéo_de_3_secondes', 'video_3s', 'video3s'])),
    lpViews: parseNormalizedInt(findField(row, ['vues_de_la_page_de_destination_du_site_web', 'lp_views', 'lpviews', 'landing_page_views'])),
    
    // Autres
    attribution: findField(row, ['paramètre_dattribution', 'attribution', 'attribution_setting']) || '',
    lastSignificantEdit: findField(row, ['dernière_modification_importante', 'last_significant_edit', 'last_edit']) || ''
  };
}

/**
 * Compresse et filtre les données ads pour OpenAI
 * @param {Array} rows - Données brutes du CSV
 * @returns {Array} Données compressées (max 30 lignes, toutes les colonnes normalisées)
 */
function compressAdsData(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return [];
  }

  // Normaliser toutes les lignes avec toutes les colonnes
  const normalized = rows.slice(0, 30).map(row => normalizeRow(row));

  // Filtrer les lignes avec un spend > 0
  return normalized.filter(item => item.spend > 0);
}

/**
 * Construit le payload pour GPT avec toutes les colonnes normalisées
 * @param {Array} data - Données normalisées
 * @returns {Array} Payload formaté pour GPT
 */
function buildAIPayload(data) {
  return data.map(item => {
    const spendFCFA = (item.spend || 0) * HKD_TO_FCFA;
    const cpmFCFA = (item.cpm || 0) * HKD_TO_FCFA;
    const cpcFCFA = (item.cpc || 0) * HKD_TO_FCFA;
    const costPerResultFCFA = (item.costPerResult || 0) * HKD_TO_FCFA;
    
    // Calculer le CA depuis ROAS si disponible, sinon estimer
    const revenueFCFA = item.roas > 0 ? spendFCFA * item.roas : (item.results || 0) * REVENUE_PER_RESULT;
    
    return {
      dateStart: item.startDate || '',
      dateEnd: item.endDate || '',
      adset: item.adset || '',
      status: item.status || '',
      budget: item.budget || 0,
      spend: spendFCFA,
      cpm: cpmFCFA,
      ctr: item.ctr || 0,
      cpc: cpcFCFA,
      impressions: item.impressions || 0,
      reach: item.reach || 0,
      purchases: item.results || 0,
      roas: item.roas || 0,
      video3s: item.video3s || 0,
      uniqueClicks: item.uniqueClicks || 0,
      outboundClicks: item.outboundClicks || 0,
      lpViews: item.lpViews || 0,
      costPerResult: costPerResultFCFA
    };
  });
}

/**
 * Construit le prompt ANDROMEDA pour OpenAI
 * @param {Array} data - Données compressées et normalisées
 * @returns {string} Prompt formaté
 */
function buildPrompt(data) {
  // Préparer les données au format tableau pour le prompt
  const tableData = data.map((item, index) => {
    const depenseFCFA = (item.spend || 0) * HKD_TO_FCFA;
    const cpmFCFA = (item.cpm || 0) * HKD_TO_FCFA;
    const cpcFCFA = (item.cpc || 0) * HKD_TO_FCFA;
    
    // Calculer le CA depuis ROAS si disponible, sinon estimer
    const revenueFCFA = item.roas > 0 ? depenseFCFA * item.roas : (item.results || 0) * REVENUE_PER_RESULT;

      return {
      'Nom de la campagne': item.adset || `Campagne ${index + 1}`,
      'Nom de l\'ensemble de publicités': item.adset || `Ensemble ${index + 1}`,
      'Dépense (FCFA)': Math.round(depenseFCFA),
      'Impressions': item.impressions || 0,
      'Clics': item.outboundClicks || item.uniqueClicks || 0,
      'Achats': item.results || 0,
      'Chiffre d\'affaires (FCFA)': Math.round(revenueFCFA),
      'CPM': Math.round(cpmFCFA),
      'CTR': parseFloat((item.ctr || 0).toFixed(2)),
      'CPC': Math.round(cpcFCFA)
      };
    });

  return `🎯 PROMPT ANDROMEDA – ANALYSE DES PERFORMANCES FACEBOOK ADS

Tu es un expert Facebook Ads spécialisé dans le marché africain.
Tu analyses des campagnes Facebook Ads dont les données sont fournies sous forme de tableau.

Les montants sont convertis en FCFA.

🔢 DONNÉES REÇUES

Tu reçois pour chaque ligne :

- Nom de la campagne
- Nom de l'ensemble de publicités
- Dépense (FCFA)
- Impressions
- Clics
- Achats
- Chiffre d'affaires (FCFA)
- CPM
- CTR
- CPC

📊 CALCULS À FAIRE

CPA = Dépense / Achats
ROAS = Chiffre d'affaires / Dépense

🎯 SEUILS ANDROMEDA
Indicateur	Bon
CPM	≤ 1 000 FCFA
CTR	≥ 1,5 %
CPC	≤ 150 FCFA
CPA	≤ 3 000 FCFA
ROAS	≥ 3

🧠 ANALYSE À PRODUIRE

Pour chaque campagne :

1. Résumé clair de la performance
2. Interprétation humaine :
   - CTR faible → créative faible
   - CPM élevé → problème de structure / confiance Facebook
   - CPC élevé → message pas clair
   - CPA élevé → page / offre faible
3. Décision stratégique :
   - ❌ STOP
   - 🔧 OPTIMISER
   - 🚀 SCALE
4. 3 actions concrètes immédiates

🧾 FORMAT DE SORTIE

Pour chaque campagne, retourne exactement ce format :

Campagne : {nom}
Dépense : {fcfa} FCFA
CA : {fcfa} FCFA
CPA : {fcfa} FCFA
ROAS : {x}

Diagnostic :
{interprétation claire}

Décision :
STOP / OPTIMISER / SCALE

Actions recommandées :
- Action 1
- Action 2
- Action 3

---

DONNÉES À ANALYSER :

${JSON.stringify(tableData, null, 2)}

---

🧠 PHRASE FINALE À AFFICHER

Tu ne regardes plus des chiffres.
Tu traduis ce que Facebook comprend de ton marché.`;
}

/**
 * Calcule les statistiques depuis les données compressées
 * @param {Array} data - Données compressées
 * @returns {Object} Statistiques calculées
 */
function calculateStats(data) {
  if (!data || data.length === 0) {
    return {
      avgCPA: 0,
      totalSpentFCFA: 0,
      totalResults: 0,
      top5Profitable: [],
      bottom5ToCut: []
    };
  }

  const campaigns = data.map((item, index) => {
    const spentHKD = item.spend || 0;
    const spentFCFA = spentHKD * HKD_TO_FCFA;
    const results = item.results || 0;
    
    // Calculer le CA depuis ROAS si disponible, sinon estimer depuis results
    const roasFromData = item.roas || 0;
    const revenueFCFA = roasFromData > 0 ? spentFCFA * roasFromData : (results * REVENUE_PER_RESULT);
    
    const cpaHKD = item.costPerResult || (results > 0 ? spentHKD / results : 0);
    const cpaFCFA = cpaHKD * HKD_TO_FCFA;
    const roas = spentFCFA > 0 ? revenueFCFA / spentFCFA : roasFromData;

    return {
      index,
      name: item.adset || `Campaign ${index + 1}`,
      spentHKD,
      spentFCFA,
      results,
      cpaFCFA,
      revenueFCFA,
      roas,
      impressions: item.impressions || 0,
      clicks: item.outboundClicks || item.uniqueClicks || 0,
      reach: item.reach || 0,
      lpViews: item.lpViews || 0,
      video3s: item.video3s || 0
    };
  });

  const totalSpentFCFA = campaigns.reduce((sum, c) => sum + c.spentFCFA, 0);
  const totalResults = campaigns.reduce((sum, c) => sum + c.results, 0);
  const totalImpressions = campaigns.reduce((sum, c) => sum + c.impressions, 0);
  const totalRevenueFCFA = campaigns.reduce((sum, c) => sum + c.revenueFCFA, 0);
  const totalClicks = campaigns.reduce((sum, c) => sum + (c.clicks || 0), 0);
  const avgCPA = totalResults > 0 ? (totalSpentFCFA / totalResults) : 0;
  const avgCPM = totalImpressions > 0 ? (totalSpentFCFA / totalImpressions) * 1000 : 0;
  const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const avgCPC = totalClicks > 0 ? (totalSpentFCFA / totalClicks) : 0;
  const avgROAS = totalSpentFCFA > 0 ? (totalRevenueFCFA / totalSpentFCFA) : 0;

  // Calculer les métriques pour chaque campagne
  const campaignsDetailed = campaigns.map((c, idx) => {
    const item = data[idx];
    // Utiliser les valeurs calculées si disponibles, sinon recalculer
    const cpmHKD = item.cpm || (c.impressions > 0 ? (c.spentHKD / c.impressions) * 1000 : 0);
    const cpmFCFA = cpmHKD * HKD_TO_FCFA;
    const ctr = item.ctr || (c.impressions > 0 ? ((c.clicks || 0) / c.impressions) * 100 : 0);
    const cpcHKD = item.cpc || ((c.clicks || 0) > 0 ? c.spentHKD / (c.clicks || 1) : 0);
    const cpcFCFA = cpcHKD * HKD_TO_FCFA;

    const campaignName = item.adset || c.name;
    const adSetName = item.adset || c.name;
    
    return {
      campaignName: campaignName,
      adSetName: adSetName,
      amountSpentFCFA: c.spentFCFA,
      purchaseValueFCFA: c.revenueFCFA,
      impressions: c.impressions,
      reach: c.reach || 0,
      linkClicks: c.clicks || 0,
      uniqueClicks: item.uniqueClicks || 0,
      outboundClicks: item.outboundClicks || 0,
      purchases: c.results,
      lpViews: c.lpViews || 0,
      video3s: c.video3s || 0,
      cpmFCFA: cpmFCFA,
      ctr: ctr,
      cpcFCFA: cpcFCFA,
      cpaFCFA: c.cpaFCFA,
      roas: c.roas,
      analysis: {
        cpm: { status: cpmFCFA <= 1000 ? 'good' : cpmFCFA <= 1500 ? 'warning' : 'bad' },
        ctr: { status: ctr >= 1.5 ? 'good' : ctr >= 1 ? 'warning' : 'bad' },
        cpc: { status: cpcFCFA <= 150 ? 'good' : cpcFCFA <= 200 ? 'warning' : 'bad' },
        cpa: { status: c.cpaFCFA <= 3000 ? 'good' : 'bad' },
        roas: { status: c.roas >= 3 ? 'good' : c.roas >= 2 ? 'warning' : 'bad' }
      }
    };
  });

  const top5Profitable = [...campaigns]
    .sort((a, b) => b.roas - a.roas)
    .slice(0, 5)
    .map(c => ({
      name: c.name,
      roas: c.roas,
      spentFCFA: c.spentFCFA,
      results: c.results
    }));

  const bottom5ToCut = [...campaigns]
    .sort((a, b) => a.roas - b.roas)
    .slice(0, 5)
    .map(c => ({
      name: c.name,
      roas: c.roas,
      spentFCFA: c.spentFCFA,
      results: c.results,
      cpaFCFA: c.cpaFCFA
    }));

  return {
    avgCPA,
    totalSpentFCFA,
    totalResults,
    totalImpressions,
    totalRevenueFCFA,
    totalCampaigns: campaigns.length,
    avgCPM,
    avgCTR,
    avgCPC,
    avgROAS,
    campaigns: campaignsDetailed,
    top5Profitable,
    bottom5ToCut
  };
}

router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Route ads-analyzer fonctionne' });
});

router.post('/analyze', authenticate, async (req, res) => {
  console.log('📥 Requête reçue sur /api/ads-analyzer/analyze');
  
  try {
    const { rawData } = req.body;

    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
      console.error('❌ Données brutes manquantes ou invalides');
      return res.status(400).json({ 
        success: false,
        error: 'Données brutes manquantes ou invalides' 
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OpenAI API key non configurée');
      return res.status(500).json({ 
        success: false,
        error: 'OpenAI API key non configurée' 
      });
    }

    console.log(`📊 Normalisation de ${rawData.length} lignes...`);
    console.log('📋 Colonnes détectées dans la première ligne:', rawData.length > 0 ? Object.keys(rawData[0]) : []);
    
    const compressedData = compressAdsData(rawData);
    
    if (compressedData.length === 0) {
      console.error('❌ Aucune donnée valide après normalisation');
      return res.status(400).json({ 
        success: false,
        error: 'Aucune donnée valide trouvée dans le CSV' 
      });
    }

    console.log(`✅ ${compressedData.length} campagnes normalisées`);
    console.log('📊 Exemple de données normalisées:', JSON.stringify(compressedData[0], null, 2));
    
    // Construire le payload pour GPT avec toutes les colonnes
    const aiPayload = buildAIPayload(compressedData);
    console.log('📤 Payload GPT construit:', JSON.stringify(aiPayload[0], null, 2));

    const stats = calculateStats(compressedData);
    console.log(`📈 Stats calculées - CPA moyen: ${stats.avgCPA.toFixed(0)} FCFA, Total dépensé: ${stats.totalSpentFCFA.toFixed(0)} FCFA`);

    let aiAnalysis = 'Analyse non disponible';
    let parsedAnalysis = null;

    try {
      console.log('🤖 Appel OpenAI...');
      const prompt = buildPrompt(compressedData);
      console.log(`📝 Prompt envoyé (${prompt.length} caractères)`);
      
      const completion = await safeOpenAICall({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
            content: 'Tu es un expert Facebook Ads spécialisé dans le marché africain. Tu analyses des campagnes Facebook Ads et fournis des analyses détaillées selon le format ANDROMEDA.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
        max_tokens: 2000
    });

    const content = completion.choices?.[0]?.message?.content;
    
      if (content && content.trim()) {
        aiAnalysis = content.trim();
        console.log('✅ Analyse OpenAI reçue');
        console.log('📋 Réponse OpenAI complète:');
        console.log('='.repeat(80));
        console.log(content);
        console.log('='.repeat(80));
        console.log(`📏 Longueur réponse: ${content.length} caractères`);
        
        // Parser l'analyse ANDROMEDA
        parsedAnalysis = parseAndromedaAnalysis(content, stats.campaigns);
        console.log('🔍 Analyse parsée:', JSON.stringify(parsedAnalysis, null, 2));
      } else {
        console.warn('⚠️ Réponse OpenAI vide, utilisation du fallback');
      }
    } catch (openaiError) {
      console.error('❌ Erreur OpenAI:', openaiError.message);
      console.error('Détails:', {
        code: openaiError.code,
        type: openaiError.type,
        status: openaiError.status,
        stack: openaiError.stack
      });
      
      aiAnalysis = `Analyse automatique basée sur ${compressedData.length} campagnes. CPA moyen: ${stats.avgCPA.toFixed(0)} FCFA. ${stats.top5Profitable.length > 0 ? `Top campagne: ${stats.top5Profitable[0].name} (ROAS: ${stats.top5Profitable[0].roas.toFixed(2)})` : ''}`;
    }

    // Fusionner les analyses parsées avec les campagnes
    const campaignsWithAnalysis = stats.campaigns.map((c, index) => {
      const campaignAnalysis = parsedAnalysis?.campaignAnalyses?.find(a => a.campaignIndex === index);
      return {
      id: index + 1,
        ...c,
        amountSpentFCFA: Math.round(c.amountSpentFCFA),
        purchaseValueFCFA: Math.round(c.purchaseValueFCFA),
        cpmFCFA: Math.round(c.cpmFCFA),
        ctr: parseFloat(c.ctr.toFixed(2)),
        cpcFCFA: Math.round(c.cpcFCFA),
        cpaFCFA: Math.round(c.cpaFCFA),
        roas: parseFloat(c.roas.toFixed(2)),
        // Ajouter les analyses parsées si disponibles
        aiDecision: campaignAnalysis?.decision || null,
        aiDiagnostics: campaignAnalysis?.diagnostics || [],
        aiActions: campaignAnalysis?.actions || []
      };
    });

    res.json({
      success: true,
      stats: {
        avgCPA: Math.round(stats.avgCPA),
        totalSpentFCFA: Math.round(stats.totalSpentFCFA),
        totalResults: stats.totalResults,
        totalImpressions: stats.totalImpressions || 0,
        totalRevenueFCFA: Math.round(stats.totalRevenueFCFA || 0),
        totalCampaigns: stats.totalCampaigns,
        avgCPM: Math.round(stats.avgCPM || 0),
        avgCTR: parseFloat((stats.avgCTR || 0).toFixed(2)),
        avgCPC: Math.round(stats.avgCPC || 0),
        avgROAS: parseFloat((stats.avgROAS || 0).toFixed(2)),
        top5Profitable: stats.top5Profitable.map(c => ({
          name: c.name,
          roas: parseFloat(c.roas.toFixed(2)),
          spentFCFA: Math.round(c.spentFCFA),
          results: c.results
        })),
        bottom5ToCut: stats.bottom5ToCut.map(c => ({
          name: c.name,
          roas: parseFloat(c.roas.toFixed(2)),
          spentFCFA: Math.round(c.spentFCFA),
          results: c.results,
          cpaFCFA: Math.round(c.cpaFCFA)
        }))
      },
      campaigns: campaignsWithAnalysis,
      aiAnalysis,
      parsedAnalysis: parsedAnalysis || {
        globalDecision: 'OPTIMISER',
        globalDiagnostics: [],
        globalActions: []
      },
      // Ajouter le payload complet envoyé à GPT pour référence
      aiPayload: aiPayload
    });

  } catch (error) {
    console.error('❌ Erreur critique analyse:', error);
    console.error('Stack:', error.stack);
    
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'analyse',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

console.log('✅ Router ads-analyzer exporté');

// Exporter les fonctions pour utilisation dans d'autres modules
export { 
  compressAdsData, 
  buildPrompt, 
  calculateStats, 
  safeOpenAICall, 
  parseAndromedaAnalysis,
  normalizeRow,
  buildAIPayload,
  parseNormalizedFloat,
  parseNormalizedInt
};

export default router;

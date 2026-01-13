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
 * Wrapper retry sécurisé pour les appels OpenAI
 * @param {Object} payload - Payload OpenAI
 * @param {number} attempt - Tentative actuelle
 * @returns {Promise} Réponse OpenAI
 */
async function safeOpenAICall(payload, attempt = 1) {
  try {
    return await openai.chat.completions.create(payload);
  } catch (err) {
    console.error(`⚠️ OpenAI error attempt ${attempt}:`, err.message);

    if (attempt >= 3) throw err;
    await new Promise(r => setTimeout(r, 2000 * attempt));
    return safeOpenAICall(payload, attempt + 1);
  }
}

/**
 * Compresse et filtre les données ads pour OpenAI
 * @param {Array} rows - Données brutes du CSV
 * @returns {Array} Données compressées (max 30 lignes, champs spécifiques)
 */
function compressAdsData(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return [];
  }

  const compressed = rows.slice(0, 30).map((row) => {
    const getField = (fieldName) => {
          const keys = Object.keys(row);
          const found = keys.find(k => {
        const normalized = k.toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/g, '');
        return normalized === fieldName || normalized.includes(fieldName);
          });
      if (!found) return null;
      
            const value = row[found];
            if (typeof value === 'string') {
              const cleaned = value.trim().replace(/[^\d.-]/g, '');
              return cleaned ? parseFloat(cleaned) : 0;
            }
            return parseFloat(value) || 0;
      };

      return {
      nom_de_lensemble_de_publicits: row.nom_de_lensemble_de_publicits || 
        getField('nom_de_lensemble_de_publicits') || 
        getField('ad_set') || 
        getField('adset') || 
        'N/A',
      montant_dpens_hkd: getField('montant_dpens_hkd') || getField('spend') || getField('amount_spent') || 0,
      rsultats: getField('rsultats') || getField('results') || getField('purchases') || getField('conversions') || 0,
      cot_par_rsultat: getField('cot_par_rsultat') || getField('cost_per_result') || getField('cpa') || 0,
      impressions: getField('impressions') || 0
      };
    });

  return compressed.filter(item => item.montant_dpens_hkd > 0);
}

/**
 * Construit le prompt pour OpenAI
 * @param {Array} data - Données compressées
 * @returns {string} Prompt formaté
 */
function buildPrompt(data) {
  return `Tu es un expert en publicité Facebook Ads pour le marché africain.

Analyse ces ${data.length} campagnes Facebook Ads (données déjà filtrées et compressées) :

${JSON.stringify(data, null, 2)}

CONTEXTE :
- Taux de change : 1 HKD = ${HKD_TO_FCFA} FCFA
- Revenu estimé par résultat : ${REVENUE_PER_RESULT} FCFA

CALCULS À FAIRE :
1. Convertir montant_dpens_hkd en FCFA (× ${HKD_TO_FCFA})
2. Calculer ROAS estimé = (rsultats × ${REVENUE_PER_RESULT}) / montant_dpens_fcfa
3. Identifier les 5 meilleures campagnes (ROAS élevé)
4. Identifier les 5 pires campagnes (ROAS faible ou CPA élevé)

Fournis une analyse concise en 3-4 paragraphes maximum :
- Vue d'ensemble des performances
- Points forts et faiblesses principaux
- Recommandations actionnables prioritaires
- Décision : SCALE / OPTIMISER / STOP

Réponds UNIQUEMENT en texte, pas de JSON.`;
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
    const spentHKD = item.montant_dpens_hkd || 0;
    const spentFCFA = spentHKD * HKD_TO_FCFA;
    const results = item.rsultats || 0;
    const cpa = item.cot_par_rsultat || (results > 0 ? spentHKD / results : 0);
    const cpaFCFA = cpa * HKD_TO_FCFA;
    const revenueFCFA = results * REVENUE_PER_RESULT;
    const roas = spentFCFA > 0 ? revenueFCFA / spentFCFA : 0;

    return {
      index,
      name: item.nom_de_lensemble_de_publicits || `Campaign ${index + 1}`,
      spentHKD,
      spentFCFA,
      results,
      cpaFCFA,
      revenueFCFA,
      roas,
      impressions: item.impressions || 0
    };
  });

  const totalSpentFCFA = campaigns.reduce((sum, c) => sum + c.spentFCFA, 0);
  const totalResults = campaigns.reduce((sum, c) => sum + c.results, 0);
  const avgCPA = totalResults > 0 ? (totalSpentFCFA / totalResults) : 0;

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
    totalCampaigns: campaigns.length,
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

    console.log(`📊 Compression de ${rawData.length} lignes...`);
    const compressedData = compressAdsData(rawData);
    
    if (compressedData.length === 0) {
      console.error('❌ Aucune donnée valide après compression');
      return res.status(400).json({ 
        success: false,
        error: 'Aucune donnée valide trouvée dans le CSV' 
      });
    }

    console.log(`✅ ${compressedData.length} campagnes compressées`);

    const stats = calculateStats(compressedData);
    console.log(`📈 Stats calculées - CPA moyen: ${stats.avgCPA.toFixed(0)} FCFA, Total dépensé: ${stats.totalSpentFCFA.toFixed(0)} FCFA`);

    let aiAnalysis = 'Analyse non disponible';

    try {
      console.log('🤖 Appel OpenAI...');
      const prompt = buildPrompt(compressedData);
      
      const completion = await safeOpenAICall({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Tu es un expert en publicité Facebook Ads et e-commerce en Afrique. Tu fournis des analyses concises et actionnables.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

    const content = completion.choices?.[0]?.message?.content;
    
      if (content && content.trim()) {
        aiAnalysis = content.trim();
        console.log('✅ Analyse OpenAI reçue');
      } else {
        console.warn('⚠️ Réponse OpenAI vide, utilisation du fallback');
      }
    } catch (openaiError) {
      console.error('❌ Erreur OpenAI:', openaiError.message);
      console.error('Détails:', {
        code: openaiError.code,
        type: openaiError.type,
        status: openaiError.status
      });
      
      aiAnalysis = `Analyse automatique basée sur ${compressedData.length} campagnes. CPA moyen: ${stats.avgCPA.toFixed(0)} FCFA. ${stats.top5Profitable.length > 0 ? `Top campagne: ${stats.top5Profitable[0].name} (ROAS: ${stats.top5Profitable[0].roas.toFixed(2)})` : ''}`;
    }

    res.json({
      success: true,
      stats: {
        avgCPA: Math.round(stats.avgCPA),
        totalSpentFCFA: Math.round(stats.totalSpentFCFA),
        totalResults: stats.totalResults,
        totalCampaigns: stats.totalCampaigns,
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
      aiAnalysis
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

export default router;

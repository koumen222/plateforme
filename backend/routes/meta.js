import express from 'express';
import { authenticate } from '../middleware/auth.js';
import User from '../models/User.js';
import { getRedisValue } from '../config/redis.js';

const router = express.Router();

// Stockage temporaire des tokens Facebook en mémoire (fallback si Redis indisponible)
// Format: { userId: { accessToken, expiresAt } }
// Note: Ce Map est partagé avec server.js pour les routes OAuth
let facebookTokens = null;

// Fonction pour initialiser le Map depuis server.js (fallback)
export function setFacebookTokens(tokensMap) {
  facebookTokens = tokensMap;
}

// Fonction pour obtenir le Map (utilisée dans server.js)
export function getFacebookTokens() {
  return facebookTokens;
}

/**
 * Récupère le token Meta depuis Redis ou le fallback mémoire
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Object|null>} Token data ou null
 */
async function getMetaToken(userId) {
  // Essayer Redis d'abord
  try {
    const redisKey = `meta:${userId}`;
    const tokenDataStr = await getRedisValue(redisKey);
    
    if (tokenDataStr) {
      const tokenData = JSON.parse(tokenDataStr);
      // Vérifier si le token n'est pas expiré
      if (tokenData.expiresAt && Date.now() < tokenData.expiresAt) {
        return tokenData;
      } else {
        // Token expiré, le supprimer
        console.log(`⚠️ Token Meta expiré pour utilisateur ${userId}`);
        return null;
      }
    }
  } catch (error) {
    console.warn('⚠️ Erreur récupération token depuis Redis, utilisation du fallback:', error.message);
  }

  // Fallback: utiliser le Map en mémoire
  const tokens = getFacebookTokens();
  if (tokens && tokens.has(userId)) {
    const tokenData = tokens.get(userId);
    // Vérifier expiration
    if (tokenData.expiresAt && Date.now() < tokenData.expiresAt) {
      return tokenData;
    } else {
      tokens.delete(userId);
    }
  }

  return null;
}

/**
 * GET /api/meta/status
 * Vérifier le statut de connexion Facebook et la campagne sélectionnée
 */
router.get('/status', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const userId = req.user._id.toString();
    const tokenData = await getMetaToken(userId);
    const hasToken = !!tokenData;
    const selectedCampaign = user.metaSelectedCampaign?.campaignId ? {
      id: user.metaSelectedCampaign.campaignId,
      name: user.metaSelectedCampaign.campaignName,
      businessId: user.metaSelectedCampaign.businessId,
      adAccountId: user.metaSelectedCampaign.adAccountId
    } : null;

    res.json({
      connected: hasToken,
      selectedCampaign: selectedCampaign
    });
  } catch (error) {
    console.error('Erreur vérification statut Meta:', error);
    res.status(500).json({ error: 'Erreur lors de la vérification du statut' });
  }
});

/**
 * GET /api/meta/businesses
 * Lister les Business Managers de l'utilisateur connecté
 */
router.get('/businesses', authenticate, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const tokenData = await getMetaToken(userId);
    
    if (!tokenData || !tokenData.accessToken) {
      return res.status(401).json({ error: 'Non connecté à Facebook. Veuillez vous connecter d\'abord.' });
    }

    // Appel à l'API Graph Facebook
    const response = await fetch(`https://graph.facebook.com/v18.0/me/businesses?access_token=${tokenData.accessToken}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Erreur API Facebook businesses:', errorData);
      
      if (response.status === 401) {
        // Token expiré ou invalide - sera automatiquement supprimé par Redis TTL
        return res.status(401).json({ error: 'Session Facebook expirée. Veuillez vous reconnecter.' });
      }
      
      throw new Error(errorData.error?.message || 'Erreur lors de la récupération des Business Managers');
    }

    const data = await response.json();
    
    res.json({
      success: true,
      businesses: (data.data || []).map(business => ({
        id: business.id,
        name: business.name
      }))
    });
  } catch (error) {
    console.error('Erreur récupération Business Managers:', error);
    res.status(500).json({ error: error.message || 'Erreur lors de la récupération des Business Managers' });
  }
});

/**
 * GET /api/meta/adaccounts
 * Lister les comptes publicitaires d'un Business Manager
 */
router.get('/adaccounts', authenticate, async (req, res) => {
  try {
    const { business_id } = req.query;
    
    if (!business_id) {
      return res.status(400).json({ error: 'business_id est requis' });
    }

    const userId = req.user._id.toString();
    const tokenData = await getMetaToken(userId);
    
    if (!tokenData || !tokenData.accessToken) {
      return res.status(401).json({ error: 'Non connecté à Facebook. Veuillez vous connecter d\'abord.' });
    }

    // Appel à l'API Graph Facebook
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${business_id}/owned_ad_accounts?fields=id,name,account_id&access_token=${tokenData.accessToken}`
    );
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Erreur API Facebook adaccounts:', errorData);
      
      if (response.status === 401) {
        const tokens = getFacebookTokens();
        if (tokens) {
          tokens.delete(req.user._id.toString());
        }
        return res.status(401).json({ error: 'Session Facebook expirée. Veuillez vous reconnecter.' });
      }
      
      throw new Error(errorData.error?.message || 'Erreur lors de la récupération des comptes publicitaires');
    }

    const data = await response.json();
    
    res.json({
      success: true,
      adAccounts: (data.data || []).map(account => ({
        id: account.id,
        name: account.name || `Compte ${account.account_id}`,
        accountId: account.account_id
      }))
    });
  } catch (error) {
    console.error('Erreur récupération comptes publicitaires:', error);
    res.status(500).json({ error: error.message || 'Erreur lors de la récupération des comptes publicitaires' });
  }
});

/**
 * GET /api/meta/campaigns
 * Lister les campagnes d'un compte publicitaire
 */
router.get('/campaigns', authenticate, async (req, res) => {
  try {
    const { adaccount_id } = req.query;
    
    if (!adaccount_id) {
      return res.status(400).json({ error: 'adaccount_id est requis' });
    }

    const userId = req.user._id.toString();
    const tokenData = await getMetaToken(userId);
    
    if (!tokenData || !tokenData.accessToken) {
      return res.status(401).json({ error: 'Non connecté à Facebook. Veuillez vous connecter d\'abord.' });
    }

    // Appel à l'API Graph Facebook
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${adaccount_id}/campaigns?fields=id,name,status&access_token=${tokenData.accessToken}`
    );
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Erreur API Facebook campaigns:', errorData);
      
      if (response.status === 401) {
        const tokens = getFacebookTokens();
        if (tokens) {
          tokens.delete(req.user._id.toString());
        }
        return res.status(401).json({ error: 'Session Facebook expirée. Veuillez vous reconnecter.' });
      }
      
      throw new Error(errorData.error?.message || 'Erreur lors de la récupération des campagnes');
    }

    const data = await response.json();
    
    res.json({
      success: true,
      campaigns: (data.data || []).map(campaign => ({
        id: campaign.id,
        name: campaign.name,
        status: campaign.status
      }))
    });
  } catch (error) {
    console.error('Erreur récupération campagnes:', error);
    res.status(500).json({ error: error.message || 'Erreur lors de la récupération des campagnes' });
  }
});

/**
 * POST /api/meta/select
 * Sauvegarder la sélection de campagne (sans stocker le token)
 */
router.post('/select', authenticate, async (req, res) => {
  try {
    const { campaignId, businessId, adAccountId } = req.body;
    
    if (!campaignId) {
      return res.status(400).json({ error: 'campaignId est requis' });
    }

    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Récupérer le nom de la campagne depuis l'API Facebook
    const userId = req.user._id.toString();
    const tokenData = await getMetaToken(userId);
    let campaignName = `Campagne ${campaignId}`;
    
    if (tokenData && tokenData.accessToken) {
      try {
        const response = await fetch(
          `https://graph.facebook.com/v18.0/${campaignId}?fields=name&access_token=${tokenData.accessToken}`
        );
        
        if (response.ok) {
          const data = await response.json();
          campaignName = data.name || campaignName;
        }
      } catch (err) {
        console.warn('Impossible de récupérer le nom de la campagne:', err);
      }
    }

    // Sauvegarder uniquement les IDs (pas le token)
    user.metaSelectedCampaign = {
      campaignId,
      campaignName,
      businessId: businessId || null,
      adAccountId: adAccountId || null,
      selectedAt: new Date()
    };

    await user.save();

    res.json({
      success: true,
      message: 'Campagne sélectionnée avec succès',
      campaign: {
        id: campaignId,
        name: campaignName
      }
    });
  } catch (error) {
    console.error('Erreur sauvegarde campagne:', error);
    res.status(500).json({ error: 'Erreur lors de la sauvegarde de la campagne' });
  }
});

/**
 * POST /api/meta/analyze
 * Récupère les données des campagnes depuis Meta API et les analyse
 */
router.post('/analyze', authenticate, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const tokenData = await getMetaToken(userId);
    
    if (!tokenData || !tokenData.accessToken) {
      return res.status(401).json({ error: 'Non connecté à Meta. Veuillez vous connecter d\'abord.' });
    }

    const user = await User.findById(req.user._id);
    if (!user || !user.metaSelectedCampaign?.adAccountId) {
      return res.status(400).json({ error: 'Aucun compte publicitaire sélectionné' });
    }

    const adAccountId = user.metaSelectedCampaign.adAccountId;
    const accessToken = tokenData.accessToken;

    // Calculer la période (30 derniers jours par défaut)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const dateRange = {
      since: startDate.toISOString().split('T')[0],
      until: endDate.toISOString().split('T')[0]
    };

    console.log(`📊 Récupération des insights Meta pour le compte ${adAccountId}`);

    // Récupérer les insights des campagnes
    const insightsUrl = `https://graph.facebook.com/v18.0/${adAccountId}/insights?` +
      `fields=campaign_id,campaign_name,spend,impressions,clicks,actions,action_values,cost_per_action_type&` +
      `time_range={'since':'${dateRange.since}','until':'${dateRange.until}'}&` +
      `level=campaign&` +
      `access_token=${accessToken}`;

    const response = await fetch(insightsUrl);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Erreur API Meta insights:', errorData);
      
      if (response.status === 401) {
        return res.status(401).json({ error: 'Session Meta expirée. Veuillez vous reconnecter.' });
      }
      
      throw new Error(errorData.error?.message || 'Erreur lors de la récupération des insights');
    }

    const insightsData = await response.json();
    const insights = insightsData.data || [];

    if (insights.length === 0) {
      return res.status(404).json({ error: 'Aucune donnée trouvée pour cette période' });
    }

    console.log(`✅ ${insights.length} campagnes récupérées depuis Meta API`);

    // Transformer les données Meta au format attendu par l'analyseur ANDROMEDA
    const rawData = insights.map(insight => {
      // Extraire les actions (purchases, conversions, etc.)
      const actions = insight.actions || [];
      const purchases = actions.find(a => a.action_type === 'purchase' || a.action_type === 'onsite_conversion')?.value || '0';
      const linkClicks = actions.find(a => a.action_type === 'link_click')?.value || insight.clicks || '0';
      
      // Extraire les valeurs d'actions
      const actionValues = insight.action_values || [];
      const purchaseValue = actionValues.find(a => a.action_type === 'purchase' || a.action_type === 'onsite_conversion')?.value || '0';
      
      // Calculer le CPA depuis cost_per_action_type
      const costPerAction = insight.cost_per_action_type || [];
      const cpa = costPerAction.find(c => c.action_type === 'purchase' || c.action_type === 'onsite_conversion')?.value || '0';

      // Convertir spend de la devise Meta vers HKD (approximation, ajustez selon votre cas)
      // Meta retourne généralement en USD, donc conversion USD -> HKD (1 USD ≈ 7.8 HKD)
      const spendUSD = parseFloat(insight.spend || 0);
      const spendHKD = spendUSD * 7.8; // Ajustez selon votre devise Meta

      const impressions = parseInt(insight.impressions || 0);
      const clicks = parseInt(linkClicks) || 0;
      const achats = parseInt(purchases) || 0;
      const purchaseValueHKD = parseFloat(purchaseValue) || 0;
      
      // Calculer les métriques si non fournies
      const cpm = impressions > 0 ? (spendHKD / impressions) * 1000 : 0;
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
      const cpc = clicks > 0 ? spendHKD / clicks : 0;

      return {
        nom_de_la_campagne: insight.campaign_name || `Campagne ${insight.campaign_id}`,
        nom_de_lensemble_de_publicits: insight.campaign_name || `Campagne ${insight.campaign_id}`,
        montant_dpens_hkd: spendHKD,
        impressions: impressions,
        clics: clicks,
        achats: achats,
        chiffre_daffaires_hkd: purchaseValueHKD,
        cpm: cpm,
        ctr: ctr,
        cpc: cpc,
        cot_par_rsultat: parseFloat(cpa) || 0
      };
    });

    // Importer et utiliser les fonctions d'analyse existantes
    const adsAnalyzerModule = await import('./ads-analyzer.js');
    
    // Utiliser la fonction compressAdsData de l'analyseur
    const compressAdsData = adsAnalyzerModule.compressAdsData || ((rows) => rows.slice(0, 30));
    const calculateStats = adsAnalyzerModule.calculateStats || (() => ({}));
    const buildPrompt = adsAnalyzerModule.buildPrompt || (() => '');
    const safeOpenAICall = adsAnalyzerModule.safeOpenAICall || (async (payload) => {
      throw new Error('OpenAI non configuré');
    });
    const parseAndromedaAnalysis = adsAnalyzerModule.parseAndromedaAnalysis || (() => ({
      globalDecision: 'OPTIMISER',
      globalDiagnostics: [],
      globalActions: []
    }));

    const compressedData = compressAdsData(rawData);
    
    if (compressedData.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Aucune donnée valide après traitement' 
      });
    }

    const stats = calculateStats(compressedData);
    let aiAnalysis = 'Analyse non disponible';
    let parsedAnalysis = null;

    // Appel OpenAI si configuré
    if (process.env.OPENAI_API_KEY) {
      try {
        const prompt = buildPrompt(compressedData);
        console.log(`📝 Prompt Meta envoyé (${prompt.length} caractères)`);
        
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
          console.log('✅ Analyse OpenAI Meta reçue');
          console.log('📋 Réponse OpenAI complète:');
          console.log('='.repeat(80));
          console.log(content);
          console.log('='.repeat(80));
          console.log(`📏 Longueur réponse: ${content.length} caractères`);
          
          // Parser l'analyse ANDROMEDA
          parsedAnalysis = parseAndromedaAnalysis(content, stats.campaigns);
          console.log('🔍 Analyse parsée Meta:', JSON.stringify(parsedAnalysis, null, 2));
        }
      } catch (openaiError) {
        console.error('❌ Erreur OpenAI Meta:', openaiError.message);
        console.error('Détails:', {
          code: openaiError.code,
          type: openaiError.type,
          status: openaiError.status,
          stack: openaiError.stack
        });
        aiAnalysis = `Analyse automatique basée sur ${compressedData.length} campagnes. CPA moyen: ${stats.avgCPA?.toFixed(0) || 0} FCFA.`;
      }
    }

    res.json({
      success: true,
      stats: {
        avgCPA: Math.round(stats.avgCPA || 0),
        totalSpentFCFA: Math.round(stats.totalSpentFCFA || 0),
        totalResults: stats.totalResults || 0,
        totalImpressions: stats.totalImpressions || 0,
        totalRevenueFCFA: Math.round(stats.totalRevenueFCFA || 0),
        totalCampaigns: stats.totalCampaigns || 0,
        avgCPM: Math.round(stats.avgCPM || 0),
        avgCTR: parseFloat((stats.avgCTR || 0).toFixed(2)),
        avgCPC: Math.round(stats.avgCPC || 0),
        avgROAS: parseFloat((stats.avgROAS || 0).toFixed(2)),
        top5Profitable: (stats.top5Profitable || []).map(c => ({
          name: c.name,
          roas: parseFloat(c.roas.toFixed(2)),
          spentFCFA: Math.round(c.spentFCFA),
          results: c.results
        })),
        bottom5ToCut: (stats.bottom5ToCut || []).map(c => ({
          name: c.name,
          roas: parseFloat(c.roas.toFixed(2)),
          spentFCFA: Math.round(c.spentFCFA),
          results: c.results,
          cpaFCFA: Math.round(c.cpaFCFA)
        }))
      },
      campaigns: (stats.campaigns || []).map((c, index) => {
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
      }),
      aiAnalysis,
      parsedAnalysis: parsedAnalysis || {
        globalDecision: 'OPTIMISER',
        globalDiagnostics: [],
        globalActions: []
      },
      source: 'meta_api',
      dateRange: dateRange
    });

  } catch (error) {
    console.error('❌ Erreur analyse Meta:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'analyse Meta',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;


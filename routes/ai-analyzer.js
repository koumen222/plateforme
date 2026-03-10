import express from 'express'
import OpenAI from 'openai'

const router = express.Router()

const CURRENCY_RATES = {
  FCFA: 1,
  XOF: 1,
  XAF: 1,
  CFA: 1,
  USD: 600,
  EUR: 650,
  GBP: 750,
  HKD: 78
}

const CAMPAIGN_FIELDS = [
  'campaign', 'campaign_name', 'campaign_name_', 'nom_de_la_campagne', 'nom_campagne'
]

const ADSET_FIELDS = [
  'adset', 'ad_set', 'adset_name', 'ad_set_name', 'ensemble', 'adset_name_',
  'nom_de_lensemble_de_publicites', 'nom_de_lensemble_de_publicits'
]

const SPEND_FIELDS = [
  'amount_spent', 'spend', 'depense', 'dépense', 'montant_depense', 'montant_dépense',
  'cost', 'spent', 'montant', 'montant_dpens', 'montant_dpens_hkd'
]

const CLICKS_FIELDS = [
  'clicks', 'clics', 'link_clicks', 'outbound_clicks', 'unique_clicks'
]

const RESULTS_FIELDS = [
  'results', 'resultats', 'résultats', 'purchases', 'achats', 'conversions'
]

const IMPRESSIONS_FIELDS = [
  'impressions', 'impression', 'imp'
]

const COUNTRY_FIELDS = [
  'country', 'pays', 'geo', 'location'
]

const CURRENCY_FIELDS = [
  'currency', 'devise', 'currency_code'
]

const DATE_FIELDS = [
  'date', 'date_start', 'date_end', 'start_date', 'end_date'
]

const normalizeHeader = (value) => {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
}

const parseNumber = (value) => {
  if (value === null || value === undefined || value === '') return 0
  if (typeof value === 'number') return value
  const cleaned = String(value).replace(',', '.').replace(/[^\d.-]/g, '')
  const parsed = parseFloat(cleaned)
  return Number.isNaN(parsed) ? 0 : parsed
}

const findField = (row, fields) => {
  const keys = Object.keys(row || {})
  for (const field of fields) {
    const normalizedField = normalizeHeader(field)
    const matched = keys.find(key => normalizeHeader(key) === normalizedField)
      || keys.find(key => normalizeHeader(key).includes(normalizedField))
    if (matched) return row[matched]
  }
  return null
}

const detectFieldName = (row, fields) => {
  const keys = Object.keys(row || {})
  for (const field of fields) {
    const normalizedField = normalizeHeader(field)
    const matched = keys.find(key => normalizeHeader(key) === normalizedField)
      || keys.find(key => normalizeHeader(key).includes(normalizedField))
    if (matched) return matched
  }
  return null
}

const detectCurrency = (row) => {
  const currencyValue = findField(row, CURRENCY_FIELDS)
  if (currencyValue) {
    const upper = String(currencyValue).toUpperCase()
    if (CURRENCY_RATES[upper]) return upper
  }

  const keys = Object.keys(row || {}).map(normalizeHeader)
  if (keys.some(k => k.includes('usd'))) return 'USD'
  if (keys.some(k => k.includes('eur'))) return 'EUR'
  if (keys.some(k => k.includes('gbp'))) return 'GBP'
  if (keys.some(k => k.includes('hkd'))) return 'HKD'
  return 'FCFA'
}

const toFCFA = (value, currency) => {
  const rate = CURRENCY_RATES[currency] || 1
  return parseNumber(value) * rate
}

const getVerdict = (profit, roas) => {
  if (profit <= 0 || roas < 1) return '🔴 déficitaire'
  if (roas < 2 || profit < 0.2 * Math.max(1, Math.abs(profit))) return '🟠 fragile'
  return '🟢 rentable'
}

const getDecision = (roas, cpa, breakEven) => {
  if (roas >= 3 && cpa <= breakEven * 0.8) return 'SCALE'
  if (roas >= 1.2 && cpa <= breakEven) return 'OPTIMISER'
  return 'STOP'
}

router.post('/analyze', async (req, res) => {
  try {
    const { rawData, businessContext } = req.body || {}
    const revenueTotal = parseNumber(businessContext?.revenueTotal)
    const campaignDays = parseNumber(businessContext?.campaignDays)
    const dailyBudget = parseNumber(businessContext?.dailyBudget)
    const productPrice = parseNumber(businessContext?.productPrice)

    if (!Array.isArray(rawData) || rawData.length === 0) {
      return res.status(400).json({ success: false, error: 'Aucune donnée CSV détectée.' })
    }

    if (!revenueTotal || !campaignDays || !dailyBudget || !productPrice) {
      return res.status(400).json({ success: false, error: 'Contexte business incomplet.' })
    }

    const firstRow = rawData[0] || {}
    const detectedColumns = Object.keys(firstRow)
    const fieldMap = {
      campaign: detectFieldName(firstRow, CAMPAIGN_FIELDS),
      adSet: detectFieldName(firstRow, ADSET_FIELDS),
      spend: detectFieldName(firstRow, SPEND_FIELDS),
      clicks: detectFieldName(firstRow, CLICKS_FIELDS),
      results: detectFieldName(firstRow, RESULTS_FIELDS),
      impressions: detectFieldName(firstRow, IMPRESSIONS_FIELDS),
      country: detectFieldName(firstRow, COUNTRY_FIELDS),
      currency: detectFieldName(firstRow, CURRENCY_FIELDS),
      date: detectFieldName(firstRow, DATE_FIELDS)
    }

    const normalizedRows = rawData.map(row => {
      const campaignRaw = findField(row, CAMPAIGN_FIELDS)
      const adSetRaw = findField(row, ADSET_FIELDS)
      const campaignName = campaignRaw || adSetRaw || 'Campagne inconnue'
      const adSetName = adSetRaw || campaignRaw || 'Ensemble inconnu'
      const spend = findField(row, SPEND_FIELDS)
      const clicks = findField(row, CLICKS_FIELDS)
      const results = findField(row, RESULTS_FIELDS)
      const impressions = findField(row, IMPRESSIONS_FIELDS)
      const country = findField(row, COUNTRY_FIELDS)
      const date = findField(row, DATE_FIELDS)
      const currency = detectCurrency(row)

      return {
        campaign: String(campaignName),
        adSet: String(adSetName),
        spendFCFA: toFCFA(spend, currency),
        clicks: parseNumber(clicks),
        results: parseNumber(results),
        impressions: parseNumber(impressions),
        country: country ? String(country) : null,
        date: date ? String(date) : null
      }
    }).filter(row => row.spendFCFA > 0 || row.clicks > 0 || row.results > 0 || row.impressions > 0)

    if (normalizedRows.length === 0) {
      return res.status(400).json({ success: false, error: 'Aucune ligne exploitable après nettoyage.' })
    }

    const totals = normalizedRows.reduce((acc, row) => {
      acc.spendFCFA += row.spendFCFA
      acc.clicks += row.clicks
      acc.results += row.results
      acc.impressions += row.impressions
      return acc
    }, { spendFCFA: 0, clicks: 0, results: 0, impressions: 0 })

    const revenuePerSale = totals.results > 0 ? revenueTotal / totals.results : productPrice
    const cpaGlobal = totals.results > 0 ? totals.spendFCFA / totals.results : 0
    const roasGlobal = totals.spendFCFA > 0 ? revenueTotal / totals.spendFCFA : 0
    const profitFCFA = revenueTotal - totals.spendFCFA
    const breakEvenCPA = revenuePerSale

    const campaignMap = new Map()
    const adSetMap = new Map()
    const countriesSet = new Set()
    normalizedRows.forEach(row => {
      if (row.country) {
        countriesSet.add(row.country)
      }
      if (!campaignMap.has(row.campaign)) {
        campaignMap.set(row.campaign, { ...row })
      } else {
        const current = campaignMap.get(row.campaign)
        campaignMap.set(row.campaign, {
          ...current,
          spendFCFA: current.spendFCFA + row.spendFCFA,
          clicks: current.clicks + row.clicks,
          results: current.results + row.results,
          impressions: current.impressions + row.impressions
        })
      }

      if (!adSetMap.has(row.adSet)) {
        adSetMap.set(row.adSet, { ...row })
      } else {
        const current = adSetMap.get(row.adSet)
        adSetMap.set(row.adSet, {
          ...current,
          spendFCFA: current.spendFCFA + row.spendFCFA,
          clicks: current.clicks + row.clicks,
          results: current.results + row.results,
          impressions: current.impressions + row.impressions
        })
      }
    })

    const campaigns = Array.from(campaignMap.values()).map(campaign => {
      const revenue = totals.results > 0
        ? (campaign.results / Math.max(1, totals.results)) * revenueTotal
        : (campaign.spendFCFA / Math.max(1, totals.spendFCFA)) * revenueTotal
      const cpa = campaign.results > 0 ? campaign.spendFCFA / campaign.results : 0
      const roas = campaign.spendFCFA > 0 ? revenue / campaign.spendFCFA : 0

      return {
        name: campaign.campaign,
        spendFCFA: Math.round(campaign.spendFCFA),
        results: Math.round(campaign.results),
        clicks: Math.round(campaign.clicks),
        impressions: Math.round(campaign.impressions),
        cpaFCFA: Math.round(cpa),
        roas,
        revenueFCFA: Math.round(revenue),
        decision: getDecision(roas, cpa, breakEvenCPA)
      }
    })

    const adSets = Array.from(adSetMap.values()).map(adSet => {
      const revenue = totals.results > 0
        ? (adSet.results / Math.max(1, totals.results)) * revenueTotal
        : (adSet.spendFCFA / Math.max(1, totals.spendFCFA)) * revenueTotal
      const cpa = adSet.results > 0 ? adSet.spendFCFA / adSet.results : 0
      const roas = adSet.spendFCFA > 0 ? revenue / adSet.spendFCFA : 0

      return {
        name: adSet.adSet,
        spendFCFA: Math.round(adSet.spendFCFA),
        results: Math.round(adSet.results),
        clicks: Math.round(adSet.clicks),
        impressions: Math.round(adSet.impressions),
        cpaFCFA: Math.round(cpa),
        roas,
        revenueFCFA: Math.round(revenue),
        decision: getDecision(roas, cpa, breakEvenCPA)
      }
    })

    const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0
    const cpc = totals.clicks > 0 ? totals.spendFCFA / totals.clicks : 0
    const conversionRate = totals.clicks > 0 ? (totals.results / totals.clicks) * 100 : 0

    const indicators = [
      {
        key: 'ctr',
        label: 'CTR',
        value: `${ctr.toFixed(2)}%`,
        interpretation: ctr < 1
          ? 'CTR faible → créa ou message peu convaincant.'
          : ctr < 2
            ? 'CTR moyen → amélioration créative possible.'
            : 'CTR solide → créa et message pertinents.'
      },
      {
        key: 'cpc',
        label: 'CPC',
        value: `${Math.round(cpc).toLocaleString('fr-FR')} FCFA`,
        interpretation: ctr > 0 && cpc / Math.max(1, ctr) > 200
          ? 'CPC élevé pour le CTR → ciblage ou offre à revoir.'
          : 'CPC cohérent → diffusion correcte.'
      },
      {
        key: 'conversion',
        label: 'Conversion',
        value: `${conversionRate.toFixed(2)}%`,
        interpretation: conversionRate < 1
          ? 'Conversion faible → problème landing/offre.'
          : conversionRate < 2
            ? 'Conversion moyenne → optimisation requise.'
            : 'Conversion solide → trafic bien qualifié.'
      },
      {
        key: 'roas',
        label: 'ROAS',
        value: roasGlobal.toFixed(2),
        interpretation: roasGlobal < 1
          ? 'ROAS inférieur à 1 → perte nette.'
          : roasGlobal < 2
            ? 'ROAS faible → fragile pour scaler.'
            : 'ROAS correct → marge de croissance possible.'
      }
    ]

    const summary = {
      verdict: getVerdict(profitFCFA, roasGlobal),
      profitFCFA: Math.round(profitFCFA),
      decision: roasGlobal >= 2 ? 'OPTIMISER PUIS SCALE' : 'STOP OU RECONSTRUIRE',
      reason: roasGlobal >= 2
        ? 'Le compte est globalement positif mais nécessite une stabilisation avant scale.'
        : 'Les performances globales sont trop faibles pour scaler.'
    }

    const conclusions = {
      whatWorks: [
        ctr >= 1.5 ? 'Engagement correct sur les créas.' : 'Les créas ont un potentiel d’amélioration.',
        roasGlobal >= 2 ? 'Rentabilité globale acceptable.' : 'Rentabilité insuffisante.'
      ],
      blockers: [
        conversionRate < 1 ? 'Landing/offre freine la conversion.' : 'Optimisation des conversions possible.',
        cpaGlobal > breakEvenCPA ? 'CPA au-dessus du break-even.' : 'CPA proche du seuil acceptable.'
      ],
      risks: [
        roasGlobal < 1.5 ? 'Scaler maintenant = risque de perte.' : 'Scaler doit rester progressif.',
        dailyBudget * campaignDays < totals.spendFCFA ? 'Dépense réelle supérieure au budget déclaré.' : 'Budget cohérent avec les dépenses.'
      ]
    }

    const actionPlan = [
      {
        title: 'Corriger la landing page (priorité 1)',
        reason: conversionRate < 1 ? 'Conversion trop faible par rapport au trafic.' : 'Améliorer la conversion pour sécuriser le ROAS.'
      },
      {
        title: 'Optimiser les créas et hooks',
        reason: ctr < 1.5 ? 'CTR faible → message peu convaincant.' : 'Tester de nouveaux angles pour scaler.'
      },
      {
        title: 'Scaler progressivement (+20%) uniquement si CPA < break-even',
        reason: `Break-even CPA ≈ ${Math.round(breakEvenCPA).toLocaleString('fr-FR')} FCFA.`
      }
    ]

    let aiNarrative = null
    if (process.env.OPENAI_API_KEY) {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      const prompt = `Tu es un media buyer senior. Analyse ces données comme un humain. 
Contexte business: CA total ${revenueTotal} FCFA, jours ${campaignDays}, budget quotidien ${dailyBudget} FCFA, prix ${productPrice} FCFA.
Résumé calculé: Dépense ${Math.round(totals.spendFCFA)} FCFA, ROAS ${roasGlobal.toFixed(2)}, CPA ${Math.round(cpaGlobal)} FCFA.
Campagnes: ${JSON.stringify(campaigns, null, 2)}
Indicateurs: ${JSON.stringify(indicators, null, 2)}
Donne une analyse claire, verdict, risques, et plan d'action (3-5 actions).`

      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'Analyse Facebook Ads comme un consultant senior, en français.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 800
        })
        aiNarrative = completion.choices?.[0]?.message?.content?.trim() || null
      } catch (error) {
        aiNarrative = null
      }
    }

    res.json({
      success: true,
      summary,
      campaigns,
      indicators,
      conclusions,
      actionPlan,
      stats: {
        spendFCFA: Math.round(totals.spendFCFA),
        clicks: totals.clicks,
        results: totals.results,
        impressions: totals.impressions,
        cpaFCFA: Math.round(cpaGlobal),
        roas: roasGlobal
      },
      metadata: {
        rowCount: normalizedRows.length,
        columns: detectedColumns,
        fieldMap,
        campaignsCount: campaigns.length,
        adSetsCount: adSets.length,
        countries: Array.from(countriesSet)
      },
      adSets,
      aiNarrative
    })
  } catch (error) {
    console.error('Erreur analyse IA:', error)
    res.status(500).json({ success: false, error: 'Erreur lors de l’analyse IA.' })
  }
})

export default router

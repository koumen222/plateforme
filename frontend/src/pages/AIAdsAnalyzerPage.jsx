import { useState } from 'react'
import Papa from 'papaparse'
import { CONFIG } from '../config/config'
import { FiUpload, FiFileText, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi'

export default function AIAdsAnalyzerPage() {
  const [fileName, setFileName] = useState('')
  const [rawData, setRawData] = useState([])
  const [parseError, setParseError] = useState('')
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState('')
  const [analysisResult, setAnalysisResult] = useState(null)

  const [businessContext, setBusinessContext] = useState({
    revenueTotal: '',
    campaignDays: '',
    dailyBudget: '',
    productPrice: '',
    currency: 'FCFA'
  })

  const handleFile = (file) => {
    setParseError('')
    setAnalysisError('')
    setAnalysisResult(null)
    setFileName(file?.name || '')
    setRawData([])

    if (!file) return

    setLoading(true)
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        const parsed = Array.isArray(results.data) ? results.data : []
        if (parsed.length === 0) {
          setParseError('Le fichier est vide ou illisible.')
        }
        setRawData(parsed)
        setLoading(false)
      },
      error: (error) => {
        setParseError(error.message || 'Erreur lors de la lecture du fichier.')
        setLoading(false)
      }
    })
  }

  const isBusinessContextValid =
    businessContext.revenueTotal &&
    businessContext.campaignDays &&
    businessContext.dailyBudget &&
    businessContext.productPrice

  const handleAnalyze = async () => {
    if (!isBusinessContextValid || rawData.length === 0) return

    setAnalyzing(true)
    setAnalysisError('')
    setAnalysisResult(null)

    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/ai-analyzer/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawData,
          businessContext: {
            revenueTotal: Number(businessContext.revenueTotal),
            campaignDays: Number(businessContext.campaignDays),
            dailyBudget: Number(businessContext.dailyBudget),
            productPrice: Number(businessContext.productPrice),
            currency: businessContext.currency
          }
        })
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors de l’analyse.')
      }

      setAnalysisResult(data)
    } catch (error) {
      setAnalysisError(error.message || 'Erreur lors de l’analyse.')
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="min-h-screen bg-secondary py-10">
      <div className="container-startup">
        <div className="bg-card border border-theme rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
              🧠
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary">
              Analyseur IA Facebook Ads
            </h1>
          </div>
          <p className="text-secondary mb-6">
            Analyse comme un consultant senior : vue globale, campagne par campagne, indicateurs et plan d’action.
          </p>

          {/* Step 1 - Upload */}
          <div className="bg-secondary/60 border border-theme rounded-xl p-5 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <FiUpload className="w-5 h-5 text-accent" />
              <h2 className="text-lg font-semibold text-primary">Étape 1 — Import du fichier</h2>
            </div>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => handleFile(e.target.files?.[0])}
              className="block w-full text-sm text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-accent file:text-white file:font-semibold hover:file:bg-accent-hover"
            />
            {fileName && (
              <div className="mt-3 flex items-center gap-2 text-sm text-secondary">
                <FiFileText className="w-4 h-4" />
                <span>{fileName}</span>
              </div>
            )}
            {loading && <p className="mt-3 text-sm text-secondary">Lecture du fichier…</p>}
            {parseError && (
              <p className="mt-3 text-sm text-red-600 flex items-center gap-2">
                <FiAlertTriangle className="w-4 h-4" />
                {parseError}
              </p>
            )}
            {!parseError && rawData.length > 0 && (
              <p className="mt-3 text-sm text-green-600 flex items-center gap-2">
                <FiCheckCircle className="w-4 h-4" />
                {rawData.length} lignes détectées
              </p>
            )}
          </div>

          {/* Step 2 - Business questions */}
          <div className="bg-secondary/60 border border-theme rounded-xl p-5 mb-6">
            <h2 className="text-lg font-semibold text-primary mb-4">Étape 2 — Questions business (obligatoires)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="number"
                inputMode="decimal"
                placeholder="Chiffre d’affaires total (FCFA)"
                value={businessContext.revenueTotal}
                onChange={(e) => setBusinessContext(prev => ({ ...prev, revenueTotal: e.target.value }))}
                className="input-startup"
              />
              <input
                type="number"
                inputMode="numeric"
                placeholder="Nombre de jours de campagne"
                value={businessContext.campaignDays}
                onChange={(e) => setBusinessContext(prev => ({ ...prev, campaignDays: e.target.value }))}
                className="input-startup"
              />
              <input
                type="number"
                inputMode="decimal"
                placeholder="Budget quotidien (FCFA)"
                value={businessContext.dailyBudget}
                onChange={(e) => setBusinessContext(prev => ({ ...prev, dailyBudget: e.target.value }))}
                className="input-startup"
              />
              <input
                type="number"
                inputMode="decimal"
                placeholder="Prix de vente produit (FCFA)"
                value={businessContext.productPrice}
                onChange={(e) => setBusinessContext(prev => ({ ...prev, productPrice: e.target.value }))}
                className="input-startup"
              />
            </div>
            <p className="text-xs text-secondary mt-3">
              Tant que ces réponses ne sont pas fournies, l’analyse ne démarre pas.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleAnalyze}
              disabled={!isBusinessContextValid || rawData.length === 0 || analyzing}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {analyzing ? 'Analyse en cours…' : 'Lancer l’analyse IA'}
            </button>
            {analysisError && <span className="text-sm text-red-600">{analysisError}</span>}
          </div>
        </div>

        {analysisResult && (
          <div className="mt-8 space-y-6">
            {/* Données détectées */}
            <div className="bg-card border border-theme rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-primary mb-4">Données détectées</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-secondary">
                <div>
                  <div className="font-semibold text-primary mb-2">Colonnes trouvées</div>
                  <div className="flex flex-wrap gap-2">
                    {(analysisResult.metadata?.columns || []).map(col => (
                      <span key={col} className="px-2 py-1 rounded-full bg-secondary/60 text-xs">
                        {col}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-primary mb-2">Champs détectés</div>
                  <div className="space-y-1">
                    {Object.entries(analysisResult.metadata?.fieldMap || {}).map(([key, value]) => (
                      <div key={key}>
                        <span className="text-primary font-medium">{key}:</span>{' '}
                        <span>{value || 'non détecté'}</span>
                      </div>
                    ))}
                  </div>
                  {analysisResult.metadata?.countries?.length > 0 && (
                    <div className="mt-2">
                      <span className="text-primary font-medium">Pays:</span>{' '}
                      {analysisResult.metadata.countries.join(', ')}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section 1 — Vue globale */}
            <div className="bg-card border border-theme rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-primary mb-4">Vue globale</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-secondary/60 rounded-xl p-4">
                  <div className="text-sm text-secondary mb-1">Verdict</div>
                  <div className="text-lg font-bold text-primary">{analysisResult.summary?.verdict}</div>
                </div>
                <div className="bg-secondary/60 rounded-xl p-4">
                  <div className="text-sm text-secondary mb-1">Profit brut</div>
                  <div className="text-lg font-bold text-primary">{analysisResult.summary?.profitFCFA?.toLocaleString('fr-FR')} FCFA</div>
                </div>
                <div className="bg-secondary/60 rounded-xl p-4">
                  <div className="text-sm text-secondary mb-1">Décision globale</div>
                  <div className="text-lg font-bold text-primary">{analysisResult.summary?.decision}</div>
                </div>
              </div>
              <p className="text-secondary mt-4">{analysisResult.summary?.reason}</p>
            </div>

            {/* Section 2 — Par campagne */}
            <div className="bg-card border border-theme rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-primary mb-4">Analyse par campagne</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/70">
                    <tr>
                      <th className="px-4 py-3 text-left text-secondary">Campagne</th>
                      <th className="px-4 py-3 text-right text-secondary">Dépense</th>
                      <th className="px-4 py-3 text-right text-secondary">Résultats</th>
                      <th className="px-4 py-3 text-right text-secondary">CPA</th>
                      <th className="px-4 py-3 text-right text-secondary">ROAS</th>
                      <th className="px-4 py-3 text-right text-secondary">Décision</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme">
                    {(analysisResult.campaigns || []).map((campaign) => (
                      <tr key={campaign.name}>
                        <td className="px-4 py-3 text-primary font-medium">{campaign.name}</td>
                        <td className="px-4 py-3 text-right text-secondary">{campaign.spendFCFA.toLocaleString('fr-FR')}</td>
                        <td className="px-4 py-3 text-right text-secondary">{campaign.results}</td>
                        <td className="px-4 py-3 text-right text-secondary">{campaign.cpaFCFA.toLocaleString('fr-FR')}</td>
                        <td className="px-4 py-3 text-right text-secondary">{campaign.roas.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-primary">{campaign.decision}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 2 bis — Ensembles de pub */}
            <div className="bg-card border border-theme rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-primary mb-4">Ensembles de pub</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/70">
                    <tr>
                      <th className="px-4 py-3 text-left text-secondary">Ensemble</th>
                      <th className="px-4 py-3 text-right text-secondary">Dépense</th>
                      <th className="px-4 py-3 text-right text-secondary">Résultats</th>
                      <th className="px-4 py-3 text-right text-secondary">CPA</th>
                      <th className="px-4 py-3 text-right text-secondary">ROAS</th>
                      <th className="px-4 py-3 text-right text-secondary">Décision</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme">
                    {(analysisResult.adSets || []).map((adSet) => (
                      <tr key={adSet.name}>
                        <td className="px-4 py-3 text-primary font-medium">{adSet.name}</td>
                        <td className="px-4 py-3 text-right text-secondary">{adSet.spendFCFA.toLocaleString('fr-FR')}</td>
                        <td className="px-4 py-3 text-right text-secondary">{adSet.results}</td>
                        <td className="px-4 py-3 text-right text-secondary">{adSet.cpaFCFA.toLocaleString('fr-FR')}</td>
                        <td className="px-4 py-3 text-right text-secondary">{adSet.roas.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-primary">{adSet.decision}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 3 — Indicateurs */}
            <div className="bg-card border border-theme rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-primary mb-4">Analyse des indicateurs</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(analysisResult.indicators || []).map((indicator) => (
                  <div key={indicator.key} className="bg-secondary/60 rounded-xl p-4">
                    <div className="text-sm text-secondary mb-1">{indicator.label}</div>
                    <div className="text-lg font-bold text-primary">{indicator.value}</div>
                    <p className="text-sm text-secondary mt-2">{indicator.interpretation}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 4 — Conclusions */}
            <div className="bg-card border border-theme rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-primary mb-4">Conclusions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h3 className="font-semibold text-primary mb-2">Ce qui marche</h3>
                  <ul className="text-sm text-secondary space-y-2">
                    {(analysisResult.conclusions?.whatWorks || []).map(item => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-primary mb-2">Ce qui bloque</h3>
                  <ul className="text-sm text-secondary space-y-2">
                    {(analysisResult.conclusions?.blockers || []).map(item => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-primary mb-2">Ce qui est dangereux</h3>
                  <ul className="text-sm text-secondary space-y-2">
                    {(analysisResult.conclusions?.risks || []).map(item => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Section 5 — Plan d’action */}
            <div className="bg-card border border-theme rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-primary mb-4">Plan d’action</h2>
              <ul className="space-y-3 text-secondary text-sm">
                {(analysisResult.actionPlan || []).map((action) => (
                  <li key={action.title} className="bg-secondary/60 rounded-xl p-4">
                    <div className="font-semibold text-primary">{action.title}</div>
                    <div className="text-secondary">{action.reason}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

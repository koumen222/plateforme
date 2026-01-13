import { useState, useRef } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { useAuth } from '../contexts/AuthContext';
import { CONFIG } from '../config/config';
import { FiUpload, FiFile, FiX, FiAlertCircle, FiCheckCircle, FiTrendingUp, FiTrendingDown, FiDollarSign, FiUsers, FiMousePointer, FiShoppingCart, FiLoader } from 'react-icons/fi';

export default function AndromedaAdsAnalyzerPage() {
  const { token } = useAuth();
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [data, setData] = useState(null);
  const [chatGPTAnalysis, setChatGPTAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  // Taux de conversion fixes
  const EXCHANGE_RATES = {
    USD: 600,
    HKD: 75
  };

  // Seuils ANDROMEDA
  const THRESHOLDS = {
    CPM: { good: 1000, warning: 1500 },
    CTR: { good: 1.5, warning: 1.0 },
    CPC: { good: 150, warning: 200 },
    CPA: { good: 3000, warning: 5000 },
    ROAS: { good: 3, warning: 2 }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (selectedFile) => {
    setError(null);
    setData(null);
    setFile(selectedFile);
    setFileName(selectedFile.name);
    setLoading(true);

    try {
      const extension = selectedFile.name.split('.').pop().toLowerCase();
      
      if (extension === 'csv') {
        await parseCSV(selectedFile);
      } else if (['xls', 'xlsx'].includes(extension)) {
        await parseXLS(selectedFile);
      } else {
        throw new Error('Format de fichier non supporté. Utilisez CSV ou XLS/XLSX');
      }
    } catch (err) {
      console.error('Erreur parsing:', err);
      setError(err.message || 'Erreur lors du traitement du fichier');
      setFile(null);
      setFileName('');
    } finally {
      setLoading(false);
    }
  };

  const parseCSV = async (file) => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => {
          // Normaliser les en-têtes pour gérer les espaces et caractères spéciaux
          return header.trim().toLowerCase()
            .replace(/\s+/g, '_')
            .replace(/[^\w_]/g, '');
        },
        complete: (results) => {
          if (results.errors.length > 0 && results.errors.some(e => e.type === 'Quotes')) {
            // Ignorer les erreurs de guillemets mineures
            console.warn('Avertissements CSV:', results.errors);
          }
          
          if (!results.data || results.data.length === 0) {
            reject(new Error('Le fichier CSV est vide ou ne contient pas de données valides'));
            return;
          }
          
          // Afficher les colonnes détectées pour debug
          if (results.data.length > 0) {
            console.log('📊 Colonnes détectées:', Object.keys(results.data[0]));
          }
          
          processData(results.data).then(() => resolve()).catch(reject);
        },
        error: (error) => {
          reject(new Error('Erreur CSV: ' + error.message));
        }
      });
    });
  };

  const parseXLS = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          
          // Normaliser les en-têtes
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
            defval: null,
            raw: false
          });
          
          if (jsonData.length === 0) {
            reject(new Error('Le fichier Excel est vide'));
            return;
          }
          
          // Normaliser les clés des objets
          const normalizedData = jsonData.map(row => {
            const normalized = {};
            Object.keys(row).forEach(key => {
              const normalizedKey = key.trim().toLowerCase()
                .replace(/\s+/g, '_')
                .replace(/[^\w_]/g, '');
              normalized[normalizedKey] = row[key];
            });
            return normalized;
          });
          
          // Afficher les colonnes détectées pour debug
          if (normalizedData.length > 0) {
            console.log('📊 Colonnes détectées:', Object.keys(normalizedData[0]));
          }
          
          processData(normalizedData).then(() => resolve()).catch(reject);
        } catch (error) {
          reject(new Error('Erreur lors du parsing Excel: ' + error.message));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Erreur lors de la lecture du fichier'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  };

  const processData = async (rawData) => {
    if (!rawData || rawData.length === 0) {
      throw new Error('Le fichier est vide');
    }

    // Détecter la devise (chercher dans les premières lignes)
    let detectedCurrency = 'USD';
    const currencyPatterns = {
      USD: /\$|USD|usd/i,
      HKD: /HKD|hkd|HK\$/i
    };

    for (let i = 0; i < Math.min(5, rawData.length); i++) {
      const rowStr = JSON.stringify(rawData[i]);
      if (currencyPatterns.HKD.test(rowStr)) {
        detectedCurrency = 'HKD';
        break;
      }
    }

    const exchangeRate = EXCHANGE_RATES[detectedCurrency] || EXCHANGE_RATES.USD;
    
    // Envoyer les données brutes à ChatGPT pour qu'il fasse toute l'analyse
    await analyzeWithChatGPT(rawData, detectedCurrency, exchangeRate);
  };
  
  const analyzeWithChatGPT = async (rawData, currency, exchangeRate) => {
    if (!token) {
      setError('Vous devez être connecté pour utiliser l\'analyse ChatGPT');
      return;
    }
    
    try {
      setAnalyzing(true);
      setError(null);
      
      const url = `${CONFIG.BACKEND_URL}/api/ads-analyzer/analyze`;
      console.log('📤 Envoi requête à:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          rawData: rawData,
          currency: currency,
          exchangeRate: exchangeRate
        })
      });
      
      console.log('📥 Réponse reçue:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Erreur réponse:', errorData);
        
        if (response.status === 404) {
          throw new Error(`Route non trouvée: ${url}. Vérifiez que le serveur backend a été redémarré.`);
        }
        
        throw new Error(errorData.error || `Erreur HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      if (result.success && result.analysis) {
        // ChatGPT a fait toute l'analyse, utiliser ses résultats
        const analysis = result.analysis;
        
        // Convertir la décision en format compatible avec l'UI
        let decisionColor = 'green';
        let decisionIcon = <FiTrendingUp className="w-6 h-6" />;
        if (analysis.decision === 'STOP') {
          decisionColor = 'red';
          decisionIcon = <FiX className="w-6 h-6" />;
        } else if (analysis.decision === 'OPTIMISER') {
          decisionColor = 'yellow';
          decisionIcon = <FiAlertCircle className="w-6 h-6" />;
        }
        
        // Préparer les données pour l'affichage
        setData({
          rows: analysis.campaigns || [],
          totals: analysis.totals || {},
          globalAnalysis: analysis.globalAnalysis || {},
          diagnostics: analysis.diagnostics || [],
          decision: analysis.decision || 'OPTIMISER',
          decisionColor,
          decisionIcon,
          actions: analysis.nextSteps || [],
          currency: currency,
          exchangeRate: exchangeRate
        });
        
        // Stocker l'analyse complète ChatGPT
        setChatGPTAnalysis(analysis);
      }
    } catch (error) {
      console.error('Erreur analyse ChatGPT:', error);
      setError(error.message || 'Erreur lors de l\'analyse avec ChatGPT');
    } finally {
      setAnalyzing(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount).replace('XOF', 'FCFA');
  };

  const formatPercent = (value) => {
    return `${value.toFixed(2)}%`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'good': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'bad': return 'text-red-500';
      default: return 'text-secondary';
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'good': return 'bg-green-500/10 border-green-500/20';
      case 'warning': return 'bg-yellow-500/10 border-yellow-500/20';
      case 'bad': return 'bg-red-500/10 border-red-500/20';
      default: return 'bg-secondary/10 border-theme';
    }
  };

  const reset = () => {
    setFile(null);
    setFileName('');
    setData(null);
    setChatGPTAnalysis(null);
    setError(null);
    setAnalyzing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/95 to-accent/10 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-primary mb-2">Andromeda Ads Analyzer</h1>
          <p className="text-secondary">Analysez vos exports Facebook Ads et obtenez des recommandations automatiques</p>
        </div>

        {/* Upload Zone */}
        {!data && (
          <div
            ref={dropZoneRef}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`mb-8 p-12 border-2 border-dashed rounded-xl transition-all ${
              dragActive
                ? 'border-accent bg-accent/10'
                : 'border-theme bg-secondary/50 hover:border-accent/50'
            } ${loading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xls,.xlsx"
              onChange={handleFileSelect}
              className="hidden"
              disabled={loading}
            />
            
            <div className="text-center">
              {loading ? (
                <>
                  <div className="w-12 h-12 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-secondary">Traitement du fichier en cours...</p>
                </>
              ) : (
                <>
                  <FiUpload className="w-16 h-16 text-accent mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-primary mb-2">
                    Glissez-déposez votre fichier Facebook Ads
                  </h3>
                  <p className="text-secondary mb-4">
                    ou{' '}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-accent hover:text-accent-hover font-medium underline"
                    >
                      parcourez vos fichiers
                    </button>
                  </p>
                  <p className="text-xs text-secondary">
                    Formats supportés: CSV, XLS, XLSX
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
            <FiAlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              <button
                onClick={reset}
                className="mt-2 text-xs text-red-600 dark:text-red-400 hover:underline"
              >
                Réessayer
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        {data && (
          <div className="space-y-6">
            {/* File Info */}
            <div className="card-startup p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FiFile className="w-5 h-5 text-accent" />
                <div>
                  <p className="text-primary font-medium">{fileName}</p>
                  <p className="text-xs text-secondary">
                    Devise détectée: {data.currency} (Taux: {data.exchangeRate} FCFA)
                  </p>
                </div>
              </div>
              <button
                onClick={reset}
                className="p-2 text-secondary hover:text-primary hover:bg-hover rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* ChatGPT Analysis Card */}
            {analyzing && (
              <div className="card-startup p-6">
                <div className="flex items-center gap-3">
                  <FiLoader className="w-5 h-5 text-accent animate-spin" />
                  <p className="text-primary">Analyse approfondie en cours avec ChatGPT...</p>
                </div>
              </div>
            )}
            
            {chatGPTAnalysis && (
              <div className="card-startup p-6 border-2 border-accent/30">
                <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                  <FiCheckCircle className="w-5 h-5 text-accent" />
                  Analyse ChatGPT
                </h2>
                
                {chatGPTAnalysis.summary && (
                  <div className="mb-4 p-4 bg-secondary/50 rounded-xl">
                    <p className="text-primary">{chatGPTAnalysis.summary}</p>
                  </div>
                )}
                
                {chatGPTAnalysis.strengths && chatGPTAnalysis.strengths.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-2">Points forts</h3>
                    <ul className="list-disc list-inside space-y-1 text-secondary">
                      {chatGPTAnalysis.strengths.map((strength, index) => (
                        <li key={index}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {chatGPTAnalysis.weaknesses && chatGPTAnalysis.weaknesses.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-yellow-600 dark:text-yellow-400 mb-2">Points faibles</h3>
                    <ul className="list-disc list-inside space-y-1 text-secondary">
                      {chatGPTAnalysis.weaknesses.map((weakness, index) => (
                        <li key={index}>{weakness}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {chatGPTAnalysis.recommendations && chatGPTAnalysis.recommendations.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-primary mb-2">Recommandations</h3>
                    <div className="space-y-3">
                      {chatGPTAnalysis.recommendations.map((rec, index) => (
                        <div key={index} className="p-3 bg-secondary/50 rounded-xl">
                          <div className="flex items-start gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              rec.priority === 'high' ? 'bg-red-500/20 text-red-600 dark:text-red-400' :
                              rec.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' :
                              'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                            }`}>
                              {rec.priority === 'high' ? 'Haute' : rec.priority === 'medium' ? 'Moyenne' : 'Basse'}
                            </span>
                          </div>
                          <p className="font-semibold text-primary mb-1">{rec.action}</p>
                          {rec.reason && <p className="text-sm text-secondary mb-1">{rec.reason}</p>}
                          {rec.expectedImpact && (
                            <p className="text-xs text-accent">Impact attendu: {rec.expectedImpact}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {chatGPTAnalysis.decision && (
                  <div className={`mt-4 p-4 rounded-xl border-2 ${
                    chatGPTAnalysis.decision === 'STOP' ? 'border-red-500 bg-red-500/10' :
                    chatGPTAnalysis.decision === 'OPTIMISER' ? 'border-yellow-500 bg-yellow-500/10' :
                    'border-green-500 bg-green-500/10'
                  }`}>
                    <h3 className="text-lg font-bold text-primary mb-2">
                      Décision ChatGPT: {chatGPTAnalysis.decision}
                    </h3>
                    {chatGPTAnalysis.decisionReason && (
                      <p className="text-secondary">{chatGPTAnalysis.decisionReason}</p>
                    )}
                  </div>
                )}
                
                {chatGPTAnalysis.nextSteps && chatGPTAnalysis.nextSteps.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-theme">
                    <h3 className="text-lg font-semibold text-primary mb-3">Prochaines étapes</h3>
                    <ul className="space-y-2">
                      {chatGPTAnalysis.nextSteps.map((step, index) => (
                        <li key={index} className="flex items-start gap-2 text-secondary">
                          <span className="text-accent font-bold">{index + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Decision Card */}
            <div className={`card-startup p-6 border-2 ${
              data.decisionColor === 'red' ? 'border-red-500' :
              data.decisionColor === 'yellow' ? 'border-yellow-500' :
              'border-green-500'
            }`}>
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 rounded-xl ${
                  data.decisionColor === 'red' ? 'bg-red-500/10' :
                  data.decisionColor === 'yellow' ? 'bg-yellow-500/10' :
                  'bg-green-500/10'
                }`}>
                  {data.decisionIcon}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-primary">Décision: {data.decision}</h2>
                  <p className="text-secondary text-sm">
                    {data.decision === 'STOP' && 'Arrêtez cette campagne et analysez les problèmes'}
                    {data.decision === 'OPTIMISER' && 'Optimisez les points faibles avant de scaler'}
                    {data.decision === 'SCALE' && 'Campagne performante, vous pouvez augmenter le budget'}
                  </p>
                </div>
              </div>

              {/* Actions concrètes */}
              <div className="mt-4 pt-4 border-t border-theme">
                <h3 className="text-lg font-semibold text-primary mb-3">Actions concrètes à faire :</h3>
                <ul className="space-y-2">
                  {data.actions.slice(0, 3).map((action, index) => (
                    <li key={index} className="flex items-start gap-2 text-secondary">
                      <span className="text-accent font-bold">{index + 1}.</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Diagnostic Card */}
            <div className="card-startup p-6">
              <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                <FiAlertCircle className="w-5 h-5 text-accent" />
                Diagnostic ANDROMEDA
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                {Object.entries(data.globalAnalysis).map(([key, analysis]) => (
                  <div key={key} className={`p-4 rounded-xl border ${getStatusBg(analysis.status)}`}>
                    <p className="text-xs text-secondary mb-1 uppercase">{key}</p>
                    <p className={`text-lg font-bold ${getStatusColor(analysis.status)}`}>
                      {key === 'ctr' ? formatPercent(analysis.value) :
                       key === 'roas' ? analysis.value.toFixed(2) :
                       formatCurrency(analysis.value)}
                    </p>
                    <p className={`text-xs mt-1 ${getStatusColor(analysis.status)}`}>
                      {analysis.status === 'good' ? '✅ Bon' :
                       analysis.status === 'warning' ? '⚠️ À surveiller' :
                       '❌ Mauvais'}
                    </p>
                  </div>
                ))}
              </div>

              {data.diagnostics.length > 0 && (
                <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                  <p className="text-sm font-semibold text-yellow-600 dark:text-yellow-400 mb-2">Problèmes détectés :</p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-secondary">
                    {data.diagnostics.map((diagnostic, index) => (
                      <li key={index}>{diagnostic}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Totals Summary */}
            <div className="card-startup p-6">
              <h2 className="text-xl font-bold text-primary mb-4">Résumé global (FCFA)</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-secondary/50 rounded-xl">
                  <FiDollarSign className="w-6 h-6 text-accent mx-auto mb-2" />
                  <p className="text-xs text-secondary mb-1">Dépense</p>
                  <p className="text-lg font-bold text-primary">{formatCurrency(data.totals.amountSpentFCFA)}</p>
                </div>
                <div className="text-center p-4 bg-secondary/50 rounded-xl">
                  <FiShoppingCart className="w-6 h-6 text-accent mx-auto mb-2" />
                  <p className="text-xs text-secondary mb-1">CA</p>
                  <p className="text-lg font-bold text-primary">{formatCurrency(data.totals.purchaseValueFCFA)}</p>
                </div>
                <div className="text-center p-4 bg-secondary/50 rounded-xl">
                  <FiUsers className="w-6 h-6 text-accent mx-auto mb-2" />
                  <p className="text-xs text-secondary mb-1">Impressions</p>
                  <p className="text-lg font-bold text-primary">{data.totals.impressions.toLocaleString()}</p>
                </div>
                <div className="text-center p-4 bg-secondary/50 rounded-xl">
                  <FiMousePointer className="w-6 h-6 text-accent mx-auto mb-2" />
                  <p className="text-xs text-secondary mb-1">Clics</p>
                  <p className="text-lg font-bold text-primary">{data.totals.linkClicks.toLocaleString()}</p>
                </div>
                <div className="text-center p-4 bg-secondary/50 rounded-xl">
                  <FiShoppingCart className="w-6 h-6 text-accent mx-auto mb-2" />
                  <p className="text-xs text-secondary mb-1">Achats</p>
                  <p className="text-lg font-bold text-primary">{data.totals.purchases.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Detailed Table */}
            <div className="card-startup overflow-hidden">
              <h2 className="text-xl font-bold text-primary mb-4 p-6 pb-0">Détail par campagne</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-secondary/50 border-b border-theme">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-primary">Campagne</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-primary">Ad Set</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-primary">Dépense</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-primary">CA</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-primary">CPM</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-primary">CTR</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-primary">CPC</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-primary">CPA</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-primary">ROAS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme">
                    {data.rows.map((row, index) => (
                      <tr key={row.id || index} className="hover:bg-hover transition-colors">
                        <td className="px-4 py-3 text-primary text-sm">{row.campaignName || `Campaign ${index + 1}`}</td>
                        <td className="px-4 py-3 text-secondary text-sm">{row.adSetName || `Ad Set ${index + 1}`}</td>
                        <td className="px-4 py-3 text-right text-primary text-sm">{formatCurrency(row.amountSpentFCFA || 0)}</td>
                        <td className="px-4 py-3 text-right text-primary text-sm">{formatCurrency(row.purchaseValueFCFA || 0)}</td>
                        <td className={`px-4 py-3 text-right text-sm ${getStatusColor(row.analysis?.cpm?.status || 'bad')}`}>
                          {formatCurrency(row.cpmFCFA || 0)}
                        </td>
                        <td className={`px-4 py-3 text-right text-sm ${getStatusColor(row.analysis?.ctr?.status || 'bad')}`}>
                          {formatPercent(row.ctr || 0)}
                        </td>
                        <td className={`px-4 py-3 text-right text-sm ${getStatusColor(row.analysis?.cpc?.status || 'bad')}`}>
                          {formatCurrency(row.cpcFCFA || 0)}
                        </td>
                        <td className={`px-4 py-3 text-right text-sm ${getStatusColor(row.analysis?.cpa?.status || 'bad')}`}>
                          {row.cpaFCFA > 0 ? formatCurrency(row.cpaFCFA) : '-'}
                        </td>
                        <td className={`px-4 py-3 text-right text-sm font-bold ${getStatusColor(row.analysis?.roas?.status || 'bad')}`}>
                          {row.roas > 0 ? row.roas.toFixed(2) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


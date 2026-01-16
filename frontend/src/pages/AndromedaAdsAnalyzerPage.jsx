import { useState, useRef } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { useAuth } from '../contexts/AuthContext';
import { CONFIG } from '../config/config';
import { 
  FiUpload, FiFile, FiX, FiAlertCircle, FiCheckCircle, FiTrendingUp, 
  FiTrendingDown, FiDollarSign, FiUsers, FiMousePointer, FiShoppingCart, 
  FiLoader, FiBarChart2, FiTarget, FiZap, FiEye, FiArrowUp, FiArrowDown
} from 'react-icons/fi';

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

  const EXCHANGE_RATES = {
    USD: 600,
    HKD: 75
  };

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
          return header.trim().toLowerCase()
            .replace(/\s+/g, '_')
            .replace(/[^\w_]/g, '');
        },
        complete: (results) => {
          if (results.errors.length > 0 && results.errors.some(e => e.type === 'Quotes')) {
            console.warn('Avertissements CSV:', results.errors);
          }
          
          if (!results.data || results.data.length === 0) {
            reject(new Error('Le fichier CSV est vide ou ne contient pas de données valides'));
            return;
          }
          
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
          
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
            defval: null,
            raw: false
          });
          
          if (jsonData.length === 0) {
            reject(new Error('Le fichier Excel est vide'));
            return;
          }
          
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
    let detectedCurrency = 'HKD';
    let exchangeRate = EXCHANGE_RATES.HKD;

    if (rawData.length > 0) {
      const firstRow = rawData[0];
      const keys = Object.keys(firstRow);
      
      if (keys.some(k => k.includes('usd') || k.includes('dollar'))) {
        detectedCurrency = 'USD';
        exchangeRate = EXCHANGE_RATES.USD;
      }
    }

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
      console.log('📥 Résultat reçu:', result);
      console.log('📋 Analyse AI complète:', result.aiAnalysis);
      console.log('🔍 Analyse parsée:', result.parsedAnalysis);
      
      if (result.success) {
        const { stats, campaigns, aiAnalysis, parsedAnalysis } = result;
        
        if (aiAnalysis) {
          setChatGPTAnalysis({
            summary: aiAnalysis,
            aiAnalysis: aiAnalysis
          });
        }
        
        let decision = parsedAnalysis?.globalDecision || 'OPTIMISER';
        let decisionColor = 'yellow';
        let decisionIcon = <FiAlertCircle className="w-6 h-6" />;
        
        if (decision === 'STOP') {
          decisionColor = 'red';
          decisionIcon = <FiX className="w-6 h-6" />;
        } else if (decision === 'SCALE') {
          decisionColor = 'green';
          decisionIcon = <FiTrendingUp className="w-6 h-6" />;
        } else if (aiAnalysis) {
          const upperAnalysis = aiAnalysis.toUpperCase();
          if (upperAnalysis.includes('STOP') || upperAnalysis.includes('ARRÊT')) {
            decision = 'STOP';
            decisionColor = 'red';
            decisionIcon = <FiX className="w-6 h-6" />;
          } else if (upperAnalysis.includes('SCALE') || upperAnalysis.includes('AUGMENTER')) {
            decision = 'SCALE';
            decisionColor = 'green';
            decisionIcon = <FiTrendingUp className="w-6 h-6" />;
          }
        }
        
        const diagnostics = parsedAnalysis?.globalDiagnostics || [];
        const actions = parsedAnalysis?.globalActions || [];
        
        if (actions.length === 0 && aiAnalysis) {
          const actionMatches = aiAnalysis.match(/(?:^|\n)\s*[-•]\s*([^\n]+)/g);
          if (actionMatches) {
            actions.push(...actionMatches
              .map(m => m.replace(/^\s*[-•]\s*/, '').trim())
              .filter(a => a.length > 10)
              .slice(0, 3));
          }
        }
        
        // Utiliser directement les stats du backend qui sont déjà calculées correctement
        const totalImpressions = stats.totalImpressions || 0;
        const totalClicks = campaigns?.reduce((sum, c) => sum + (c.linkClicks || 0), 0) || 0;
        const totalPurchases = stats.totalResults || 0;
        const totalLpViews = campaigns?.reduce((sum, c) => sum + (c.lpViews || 0), 0) || 0;
        
        setData({
          rows: campaigns || [],
          totals: {
            amountSpentFCFA: stats.totalSpentFCFA || 0,
            purchaseValueFCFA: stats.totalRevenueFCFA || 0,
            impressions: totalImpressions,
            linkClicks: totalClicks,
            purchases: totalPurchases,
            lpViews: totalLpViews
          },
          globalAnalysis: {
            cpm: { value: stats.avgCPM || 0, status: (stats.avgCPM || 0) <= 1000 ? 'good' : (stats.avgCPM || 0) <= 1500 ? 'warning' : 'bad' },
            ctr: { value: stats.avgCTR || 0, status: (stats.avgCTR || 0) >= 1.5 ? 'good' : (stats.avgCTR || 0) >= 1 ? 'warning' : 'bad' },
            cpc: { value: stats.avgCPC || 0, status: (stats.avgCPC || 0) <= 150 ? 'good' : (stats.avgCPC || 0) <= 200 ? 'warning' : 'bad' },
            cpa: { value: stats.avgCPA || 0, status: (stats.avgCPA || 0) <= 3000 ? 'good' : 'bad' },
            roas: { value: stats.avgROAS || 0, status: (stats.avgROAS || 0) >= 3 ? 'good' : (stats.avgROAS || 0) >= 2 ? 'warning' : 'bad' }
          },
          diagnostics: diagnostics,
          decision: decision,
          decisionColor,
          decisionIcon,
          actions: actions,
          currency: currency,
          exchangeRate: exchangeRate,
          stats: stats
        });
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
    if (status === 'good') return 'text-green-600 dark:text-green-400';
    if (status === 'warning') return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getStatusBg = (status) => {
    if (status === 'good') return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
    if (status === 'warning') return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
  };

  const getStatusBadge = (status) => {
    if (status === 'good') return { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', icon: '✓' };
    if (status === 'warning') return { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', icon: '⚠' };
    return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', icon: '✗' };
  };

  const reset = () => {
    setFile(null);
    setFileName('');
    setData(null);
    setChatGPTAnalysis(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Andromeda Ads Analyzer
            </h1>
            {data && (
              <button
                onClick={reset}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Nouvelle analyse
              </button>
            )}
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Analysez vos campagnes Facebook Ads avec l'intelligence artificielle
          </p>
        </div>

        {/* Upload Zone */}
        {!data && (
          <div
            ref={dropZoneRef}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative mb-8 p-16 border-2 border-dashed rounded-2xl transition-all duration-200 ${
              dragActive
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-[1.02]'
                : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-lg'
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
                  <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">Traitement du fichier en cours...</p>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <FiUpload className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Glissez-déposez votre fichier
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    ou{' '}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                    >
                      parcourez vos fichiers
                    </button>
                  </p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <FiFile className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">CSV, XLS, XLSX</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg flex items-start gap-3 shadow-sm">
            <FiAlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800 dark:text-red-300">{error}</p>
              <button
                onClick={reset}
                className="mt-2 text-xs text-red-600 dark:text-red-400 hover:underline font-medium"
              >
                Réessayer
              </button>
            </div>
          </div>
        )}

        {/* Results Dashboard */}
        {data && (
          <div className="space-y-6">
            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <FiDollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getStatusBadge(data.globalAnalysis.roas.status).bg} ${getStatusBadge(data.globalAnalysis.roas.status).text}`}>
                    {getStatusBadge(data.globalAnalysis.roas.status).icon}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Dépense totale</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(data.totals.amountSpentFCFA)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">{data.stats?.totalCampaigns || 0} campagnes</p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <FiTrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getStatusBadge(data.globalAnalysis.roas.status).bg} ${getStatusBadge(data.globalAnalysis.roas.status).text}`}>
                    ROAS {data.globalAnalysis.roas.value >= 3 ? <FiArrowUp className="inline w-3 h-3" /> : <FiArrowDown className="inline w-3 h-3" />}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">ROAS moyen</p>
                <p className={`text-2xl font-bold ${getStatusColor(data.globalAnalysis.roas.status)}`}>
                  {data.stats?.avgROAS ? data.stats.avgROAS.toFixed(2) : '-'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">CA: {formatCurrency(data.totals.purchaseValueFCFA)}</p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <FiShoppingCart className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getStatusBadge(data.globalAnalysis.cpa.status).bg} ${getStatusBadge(data.globalAnalysis.cpa.status).text}`}>
                    {getStatusBadge(data.globalAnalysis.cpa.status).icon}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Achats</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.totals.purchases.toLocaleString()}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">CPA: {formatCurrency(data.stats?.avgCPA || 0)}</p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <FiEye className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getStatusBadge(data.globalAnalysis.ctr.status).bg} ${getStatusBadge(data.globalAnalysis.ctr.status).text}`}>
                    CTR {formatPercent(data.globalAnalysis.ctr.value)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Impressions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.totals.impressions.toLocaleString()}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">{data.totals.linkClicks.toLocaleString()} clics</p>
              </div>
            </div>

            {/* AI Analysis Section - Loading */}
            {analyzing && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Analyse en cours...</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">L'IA analyse vos campagnes</p>
                  </div>
                </div>
              </div>
            )}



            {/* Campaigns Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <FiBarChart2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Détail par campagne
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{data.rows.length} campagnes analysées</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Adset</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Spend</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Purchases</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">ROAS</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">CTR</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">CPC</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">CPM</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Impressions</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">LP Views</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {data.rows.map((row, index) => (
                      <tr key={row.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                          {row.adSetName || row.campaignName || `Ad Set ${index + 1}`}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(row.amountSpentFCFA || 0)}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium text-gray-900 dark:text-white">
                          {row.purchases || 0}
                        </td>
                        <td className={`px-6 py-4 text-right text-sm font-bold ${
                          row.analysis?.roas?.status === 'good' ? 'text-green-600 dark:text-green-400' :
                          row.analysis?.roas?.status === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-red-600 dark:text-red-400'
                        }`}>
                          {row.roas > 0 ? row.roas.toFixed(2) : '-'}
                        </td>
                        <td className={`px-6 py-4 text-right text-sm font-medium ${
                          row.analysis?.ctr?.status === 'good' ? 'text-green-600 dark:text-green-400' :
                          row.analysis?.ctr?.status === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-gray-900 dark:text-white'
                        }`}>
                          {formatPercent(row.ctr || 0)}
                        </td>
                        <td className={`px-6 py-4 text-right text-sm font-medium ${
                          row.analysis?.cpc?.status === 'good' ? 'text-green-600 dark:text-green-400' :
                          row.analysis?.cpc?.status === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-gray-900 dark:text-white'
                        }`}>
                          {formatCurrency(row.cpcFCFA || 0)}
                        </td>
                        <td className={`px-6 py-4 text-right text-sm font-medium ${
                          row.analysis?.cpm?.status === 'good' ? 'text-green-600 dark:text-green-400' :
                          row.analysis?.cpm?.status === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-gray-900 dark:text-white'
                        }`}>
                          {formatCurrency(row.cpmFCFA || 0)}
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-gray-600 dark:text-gray-400">
                          {(row.impressions || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-gray-600 dark:text-gray-400">
                          {(row.lpViews || 0).toLocaleString()}
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

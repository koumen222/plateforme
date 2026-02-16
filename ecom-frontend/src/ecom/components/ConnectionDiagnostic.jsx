import React, { useState, useEffect } from 'react';
import { ecomApi } from '../services/ecommApi';

const ConnectionDiagnostic = ({ onDiagnosticComplete }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState([]);
  const [currentTest, setCurrentTest] = useState('');

  const addResult = (test, status, message, details = '') => {
    const result = { test, status, message, details, timestamp: new Date() };
    setResults(prev => [...prev, result]);
    console.log(`🔍 ${test}: ${status} - ${message}`, details);
  };

  const runDiagnostic = async () => {
    setIsRunning(true);
    setResults([]);
    setCurrentTest('Début du diagnostic...');

    try {
      // Test 1: Détection de l'environnement
      setCurrentTest('Détection de l\'environnement...');
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isLocalhost = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1' ||
                         window.location.hostname.includes('192.168.') ||
                         window.location.hostname.includes('10.') ||
                         window.location.hostname.includes('172.');
      
      addResult('Environnement', 'success', 
        `Mobile: ${isMobile}, Localhost: ${isLocalhost}`,
        `User-Agent: ${navigator.userAgent}\nHostname: ${window.location.hostname}`);

      // Test 2: URL de l'API
      setCurrentTest('Vérification de l\'URL API...');
      const apiUrl = ecomApi.defaults.baseURL;
      addResult('URL API', 'info', `URL configurée: ${apiUrl}`, apiUrl);

      // Test 3: Connectivité réseau
      setCurrentTest('Test de connectivité...');
      try {
        const response = await fetch('/favicon.ico', { method: 'HEAD' });
        addResult('Connectivité', 'success', 'Connectivité de base OK', `Status: ${response.status}`);
      } catch (error) {
        addResult('Connectivité', 'error', 'Problème de connectivité', error.message);
      }

      // Test 4: Test de l'API backend
      setCurrentTest('Test de l\'API backend...');
      try {
        const startTime = Date.now();
        // Utiliser un endpoint qui existe plutôt que /health
        const response = await ecomApi.get('/auth/me', { timeout: 10000 });
        const endTime = Date.now();
        
        // Si on reçoit 401, c'est normal (non connecté) mais l'API répond
        if (response.status === 401) {
          addResult('API Backend', 'success', 
            `Backend accessible (${endTime - startTime}ms)`,
            `Status: ${response.status}\nAPI répond correctement (401 = non connecté)`);
        } else {
          addResult('API Backend', 'success', 
            `Backend accessible (${endTime - startTime}ms)`,
            `Status: ${response.status}\nData: ${JSON.stringify(response.data)}`);
        }
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          addResult('API Backend', 'error', 'Backend inaccessible (ECONNREFUSED)', 
            'Le backend ne répond pas. Vérifiez qu\'il est démarré.');
        } else if (error.code === 'ERR_NETWORK') {
          addResult('API Backend', 'error', 'Erreur réseau (ERR_NETWORK)', 
            'Problème de réseau ou CORS.');
        } else if (error.response) {
          if (error.response.status === 401) {
            addResult('API Backend', 'success', 'Backend accessible (401 = non connecté)', 
              'L\'API répond correctement mais nécessite une authentification.');
          } else {
            addResult('API Backend', 'warning', 'Backend accessible mais erreur HTTP', 
              `Status: ${error.response.status}\nMessage: ${error.response.data?.message || 'No message'}`);
          }
        } else {
          addResult('API Backend', 'error', 'Erreur inconnue', error.message);
        }
      }

      // Test 5: Authentification
      setCurrentTest('Test d\'authentification...');
      const token = localStorage.getItem('ecomToken');
      if (token) {
        addResult('Authentification', 'info', 'Token présent', `Token: ${token.substring(0, 20)}...`);
        
        try {
          const response = await ecomApi.get('/auth/me');
          addResult('Authentification', 'success', 'Token valide', `User: ${response.data.data?.email || 'Unknown'}`);
        } catch (error) {
          if (error.response?.status === 401) {
            addResult('Authentification', 'error', 'Token invalide ou expiré', 'Token expiré ou invalide');
          } else {
            addResult('Authentification', 'error', 'Erreur vérification token', error.message);
          }
        }
      } else {
        addResult('Authentification', 'info', 'Aucun token trouvé', 'Utilisateur non connecté');
      }

      // Test 6: Workspace
      setCurrentTest('Test du workspace...');
      const workspace = JSON.parse(localStorage.getItem('ecomWorkspace') || 'null');
      if (workspace) {
        addResult('Workspace', 'success', 'Workspace configuré', 
          `Name: ${workspace.name}\nID: ${workspace._id || workspace.id}`);
      } else {
        addResult('Workspace', 'warning', 'Aucun workspace', 'Pas de workspace configuré');
      }

      addResult('Diagnostic', 'success', 'Diagnostic terminé', 'Tous les tests effectués');
      
    } catch (error) {
      addResult('Diagnostic', 'error', 'Erreur durant le diagnostic', error.message);
    } finally {
      setIsRunning(false);
      setCurrentTest('');
      onDiagnosticComplete?.(results);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '❓';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      case 'info': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <h3 className="text-lg font-bold mb-4">🔍 Diagnostic de Connexion</h3>
      
      <button
        onClick={runDiagnostic}
        disabled={isRunning}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 mb-4"
      >
        {isRunning ? '⏳ Diagnostic en cours...' : '🔍 Lancer le diagnostic'}
      </button>

      {isRunning && (
        <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
          <p className="text-blue-800">🔄 {currentTest}</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-700">Résultats:</h4>
          {results.map((result, index) => (
            <div key={index} className="border rounded p-3 bg-gray-50">
              <div className="flex items-center justify-between">
                <span className={`font-medium ${getStatusColor(result.status)}`}>
                  {getStatusIcon(result.status)} {result.test}
                </span>
                <span className="text-xs text-gray-500">
                  {result.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm text-gray-700 mt-1">{result.message}</p>
              {result.details && (
                <details className="mt-2">
                  <summary className="text-xs text-gray-600 cursor-pointer">Détails</summary>
                  <pre className="text-xs bg-gray-100 p-2 rounded mt-1 whitespace-pre-wrap">
                    {result.details}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 text-xs text-gray-600">
        <p>💡 Conseils:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Si "Backend inaccessible": vérifiez que le backend est démarré et accessible</li>
          <li>Si "Erreur réseau": vérifiez votre connexion WiFi/4G</li>
          <li>Sur mobile, utilisez l'URL de production: https://plateforme-backend.onrender.com</li>
          <li>En développement local, assurez-vous que votre mobile est sur le même réseau que votre ordinateur</li>
        </ul>
      </div>
    </div>
  );
};

export default ConnectionDiagnostic;

import React, { useState } from 'react';

const WebhookTest = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ message: '', type: 'info' });

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const updateStatus = (message, type) => {
    setStatus({ message, type });
  };

  const testWebhook = async () => {
    updateStatus('⚠️ Test webhook désactivé', 'warning');
    addLog('⚠️ Les tests webhook sont désactivés pour éviter les simulations');
    addLog('� Envoie un vrai message WhatsApp au +237698459328 pour tester');
    addLog('🔗 Le webhook recevra automatiquement les vrais messages Green API');
  };

  const testHealth = async () => {
    addLog('🏥 Test santé webhook Railway...');
    
    try {
      const response = await fetch('https://plateforme-backend-production-2ec6.up.railway.app/api/ecom/agent/health');
      const data = await response.json();
      
      if (data.status === 'healthy') {
        addLog('✅ Webhook Railway opérationnel');
        updateStatus('✅ Serveur Railway OK', 'success');
      } else {
        addLog('❌ Webhook Railway dégradé');
        updateStatus('⚠️ Serveur Railway dégradé', 'warning');
      }
    } catch (error) {
      addLog('❌ Erreur santé Railway: ' + error.message);
      updateStatus('❌ Erreur connexion Railway', 'error');
    }
  };

  const clearLogs = () => {
    setLogs([]);
    setStatus({ message: '', type: 'info' });
  };

  const getStatusClass = () => {
    switch (status.type) {
      case 'success': return 'bg-green-100 text-green-800 border-green-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">🧪 Test Webhook Railway (React)</h1>
        
        {status.message && (
          <div className={`p-4 rounded-lg border mb-6 ${getStatusClass()}`}>
            <p className="font-semibold">{status.message}</p>
          </div>
        )}
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-3">📡 Configuration Webhook Railway</h2>
          <div className="bg-gray-100 p-3 rounded-lg font-mono text-sm break-all">
            <strong>URL:</strong> https://plateforme-backend-production-2ec6.up.railway.app/api/ecom/agent/webhook
          </div>
        </div>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-3">🧪 Tests Disponibles</h2>
          <div className="flex flex-wrap gap-3">
            <button 
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                loading 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
              onClick={testHealth}
              disabled={loading}
            >
              🏥 Santé Railway
            </button>
            <button 
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                loading 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
              onClick={testWebhook}
              disabled={loading}
            >
              📱 Test Webhook Railway
            </button>
            <button 
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                loading 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
              onClick={clearLogs}
              disabled={loading}
            >
              🗑️ Clear Logs
            </button>
          </div>
        </div>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-3">📊 Logs du test</h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm h-96 overflow-y-auto whitespace-pre-wrap">
            {logs.length > 0 ? logs.join('\n') : 'Cliquez sur un bouton pour commencer...'}
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <p className="text-blue-800">
            <strong>💡 Info:</strong> Ce composant teste le webhook déployé sur Railway.
            Les messages sont envoyés au format Green API réel vers l'URL de production.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WebhookTest;

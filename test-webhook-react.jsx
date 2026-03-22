import React, { useState } from 'react';

const WebhookTest = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const updateStatus = (message, type) => {
    setStatus({ message, type });
  };

  const testWebhook = async () => {
    setLoading(true);
    updateStatus('🔄 Test du webhook Railway...', 'warning');
    addLog('🚀 Début du test webhook Railway');
    
    // Données webhook au format Green API réel
    const testData = {
      typeWebhook: 'incomingMessageReceived',
      instanceData: {
        idInstance: 7103497791,
        wid: '237676778377@c.us',
        typeInstance: 'whatsapp'
      },
      timestamp: Math.floor(Date.now() / 1000),
      idMessage: 'REACT_TEST_' + Date.now(),
      senderData: {
        chatId: '237698459328@c.us',
        sender: '237698459328@c.us',
        senderName: 'Test Client React',
        chatName: 'Test Client React'
      },
      messageData: {
        typeMessage: 'textMessage',
        textMessageData: {
          textMessage: 'Bonjour, ceci est un test depuis React !'
        }
      }
    };
    
    addLog('📤 Envoi webhook Railway: ' + JSON.stringify(testData, null, 2));
    
    try {
      const response = await fetch('https://plateforme-backend-production-513f.up.railway.app/api/ecom/agent/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      });
      
      const result = await response.json();
      addLog('📥 Réponse Railway: ' + JSON.stringify(result, null, 2));
      
      if (result.success || result.processed) {
        updateStatus('✅ Webhook Railway fonctionnel !', 'success');
        addLog('✅ Le serveur Railway traite bien les messages');
        
        if (result.responseSent) {
          addLog('✅ Message de réponse envoyé avec succès');
        }
      } else {
        updateStatus('❌ Webhook Railway échoué: ' + (result.error || 'Erreur inconnue'), 'error');
        addLog('❌ Erreur: ' + (result.error || 'Erreur inconnue'));
      }
    } catch (error) {
      updateStatus('❌ Erreur réseau Railway: ' + error.message, 'error');
      addLog('❌ Erreur réseau: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const testHealth = async () => {
    addLog('🏥 Test santé webhook Railway...');
    
    try {
      const response = await fetch('https://plateforme-backend-production-513f.up.railway.app/api/ecom/agent/health');
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
    setStatus('');
  };

  const styles = {
    container: {
      fontFamily: 'Arial, sans-serif',
      maxWidth: '1000px',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: '#f5f5f5'
    },
    card: {
      backgroundColor: 'white',
      padding: '30px',
      borderRadius: '10px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      marginBottom: '20px'
    },
    button: {
      backgroundColor: '#4f46e5',
      color: 'white',
      border: 'none',
      padding: '12px 24px',
      borderRadius: '6px',
      cursor: 'pointer',
      margin: '10px 5px',
      fontSize: '16px'
    },
    buttonHover: {
      backgroundColor: '#4338ca'
    },
    status: {
      padding: '15px',
      borderRadius: '6px',
      margin: '15px 0',
      fontWeight: 'bold'
    },
    success: { backgroundColor: '#d1fae5', color: '#065f46' },
    error: { backgroundColor: '#fee2e2', color: '#991b1b' },
    warning: { backgroundColor: '#fef3c7', color: '#92400e' },
    info: { backgroundColor: '#dbeafe', color: '#1e40af' },
    logs: {
      backgroundColor: '#1f2937',
      color: '#f3f4f6',
      padding: '15px',
      borderRadius: '6px',
      fontFamily: 'monospace',
      fontSize: '12px',
      maxHeight: '400px',
      overflowY: 'auto',
      whiteSpace: 'pre-wrap'
    },
    title: {
      color: '#1f2937',
      marginBottom: '10px'
    },
    url: {
      backgroundColor: '#f3f4f6',
      padding: '10px',
      borderRadius: '6px',
      fontFamily: 'monospace',
      fontSize: '14px',
      wordBreak: 'break-all'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🧪 Test Webhook Railway (React)</h1>
        
        <div style={{...styles.status, ...styles[status.type || 'info']}}>
          {status.message || 'Prêt à tester'}
        </div>
        
        <h2>📡 Configuration Webhook Railway</h2>
        <div style={styles.url}>
          URL: https://plateforme-backend-production-513f.up.railway.app/api/ecom/agent/webhook
        </div>
        
        <h2>🧪 Tests Disponibles</h2>
        <button 
          style={styles.button} 
          onClick={testHealth}
          disabled={loading}
        >
          🏥 Santé Railway
        </button>
        <button 
          style={styles.button} 
          onClick={testWebhook}
          disabled={loading}
        >
          📱 Test Webhook Railway
        </button>
        <button 
          style={styles.button} 
          onClick={clearLogs}
          disabled={loading}
        >
          🗑️ Clear Logs
        </button>
        
        <h2>📊 Logs du test</h2>
        <div style={styles.logs}>
          {logs.length > 0 ? logs.join('\n') : 'Cliquez sur un bouton pour commencer...'}
        </div>
        
        <div style={{...styles.status, ...styles.info}}>
          <strong>💡 Info:</strong> Ce composant teste le webhook déployé sur Railway.
          Les messages sont envoyés au format Green API réel.
        </div>
      </div>
    </div>
  );
};

export default WebhookTest;

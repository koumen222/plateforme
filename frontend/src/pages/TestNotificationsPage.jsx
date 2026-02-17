import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CONFIG } from '../config/config';
import { FiSend, FiBell, FiCheckCircle, FiXCircle, FiLoader, FiEye } from 'react-icons/fi';

export default function TestNotificationsPage() {
  const { user, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    title: 'Test de notification',
    body: 'Ceci est un test de notification push depuis le frontend',
    url: '/',
    icon: '/img/logo.svg'
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showPreview, setShowPreview] = useState(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Récupérer le token JWT depuis localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Vous devez être connecté pour envoyer des notifications');
      }

      const response = await fetch(`${CONFIG.BACKEND_URL}/api/push/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Erreur lors de l\'envoi');
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Fonction pour tester la notification en temps réel
  const testNotification = async () => {
    if (!('Notification' in window)) {
      alert('Les notifications ne sont pas supportées par ce navigateur');
      return;
    }

    if (Notification.permission === 'denied') {
      alert('Les notifications sont bloquées. Activez-les dans les paramètres du navigateur.');
      return;
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert('Permission refusée pour les notifications');
        return;
      }
    }

    // Créer une notification de test
    const notification = new Notification(formData.title || 'Test', {
      body: formData.body || 'Ceci est un test',
      icon: formData.icon || '/img/logo.svg',
      badge: '/img/logo.svg',
      tag: 'test-preview',
      requireInteraction: false,
      data: {
        url: formData.url || '/'
      }
    });

    notification.onclick = () => {
      window.focus();
      if (formData.url && formData.url !== '/') {
        window.location.href = formData.url;
      }
      notification.close();
    };

    // Fermer automatiquement après 5 secondes
    setTimeout(() => {
      notification.close();
    }, 5000);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-8">
          <FiXCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Connexion requise
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Vous devez être connecté pour tester les notifications push
          </p>
          <a
            href="/login"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Se connecter
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <FiBell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Test de notifications push
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Envoyez une notification push à vos appareils connectés
              </p>
            </div>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Utilisateur :</strong> {user?.email || user?.name || 'Non défini'}
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
              <strong>Status :</strong> {user?.status === 'active' ? '✅ Actif' : '⏳ En attente'}
            </p>
          </div>
        </div>

        {/* Aperçu de la notification */}
        {showPreview && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FiEye className="w-5 h-5" />
                Aperçu de la notification
              </h2>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {showPreview ? 'Masquer' : 'Afficher'}
              </button>
            </div>
            
            {/* Simulation de notification système */}
            <div className="relative">
              {/* Fond flou pour simuler le système */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-lg blur-sm opacity-50"></div>
              
              {/* Notification simulée */}
              <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-2xl p-4 border border-gray-200 dark:border-gray-700 max-w-md mx-auto">
                <div className="flex items-start gap-3">
                  {/* Icône */}
                  <div className="flex-shrink-0">
                    {formData.icon ? (
                      <img 
                        src={formData.icon} 
                        alt="Notification icon"
                        className="w-12 h-12 rounded-lg object-cover"
                        onError={(e) => {
                          e.target.src = '/img/logo.svg';
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                        <FiBell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                    )}
                  </div>
                  
                  {/* Contenu */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                      {formData.title || 'Titre de la notification'}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                      {formData.body || 'Corps du message de la notification...'}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>Maintenant</span>
                      {formData.url && formData.url !== '/' && (
                        <>
                          <span>•</span>
                          <span className="truncate">{formData.url}</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Bouton fermer simulé */}
                  <button className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <FiXCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Légende */}
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  💡 C'est ainsi que la notification apparaîtra sur votre appareil
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Formulaire */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Formulaire de notification
            </h2>
            {!showPreview && (
              <button
                onClick={() => setShowPreview(true)}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
              >
                <FiEye className="w-4 h-4" />
                Aperçu
              </button>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Titre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Titre de la notification"
              />
            </div>

            <div>
              <label htmlFor="body" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                id="body"
                name="body"
                value={formData.body}
                onChange={handleChange}
                required
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                placeholder="Corps du message"
              />
            </div>

            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                URL à ouvrir
              </label>
              <input
                type="text"
                id="url"
                name="url"
                value={formData.url}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="/"
              />
            </div>

            <div>
              <label htmlFor="icon" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Icône (URL)
              </label>
              <input
                type="text"
                id="icon"
                name="icon"
                value={formData.icon}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="/img/logo.svg"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={testNotification}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
              >
                <FiBell className="w-5 h-5" />
                Tester l'aperçu
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? (
                  <>
                    <FiLoader className="w-5 h-5 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <FiSend className="w-5 h-5" />
                    Envoyer
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Résultat */}
        {result && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <FiCheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-green-900 dark:text-green-200 mb-2">
                  Notification envoyée avec succès !
                </h3>
                <div className="space-y-1 text-sm text-green-800 dark:text-green-300">
                  <p><strong>Envoyé à :</strong> {result.sent} appareil(s)</p>
                  {result.failed > 0 && (
                    <p className="text-orange-600 dark:text-orange-400">
                      <strong>Échecs :</strong> {result.failed} appareil(s)
                    </p>
                  )}
                  <p><strong>Total :</strong> {result.total} appareil(s)</p>
                </div>
                {result.errors && result.errors.length > 0 && (
                  <div className="mt-3 p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <p className="text-sm font-medium text-orange-900 dark:text-orange-200 mb-1">
                      Erreurs :
                    </p>
                    <ul className="text-xs text-orange-800 dark:text-orange-300 space-y-1">
                      {result.errors.map((err, idx) => (
                        <li key={idx}>• {err.error || err.message}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Erreur */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <FiXCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-2">
                  Erreur lors de l'envoi
                </h3>
                <p className="text-sm text-red-800 dark:text-red-300">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            📋 Instructions
          </h3>
          <ol className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex gap-2">
              <span className="font-bold">1.</span>
              <span>Assurez-vous d'avoir activé les notifications push (bouton dans le Header)</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold">2.</span>
              <span>Remplissez le formulaire ci-dessus</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold">3.</span>
              <span>Cliquez sur "Envoyer la notification"</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold">4.</span>
              <span>La notification devrait apparaître sur tous vos appareils connectés</span>
            </li>
          </ol>
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-xs text-blue-800 dark:text-blue-200">
              <strong>💡 Astuce :</strong> La notification apparaîtra même si l'onglet est fermé ou si vous êtes sur un autre site !
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

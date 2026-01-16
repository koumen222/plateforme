import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CONFIG } from '../config/config';
import { FiFacebook, FiCheckCircle, FiAlertCircle, FiLoader, FiChevronRight } from 'react-icons/fi';

export default function ConnectFacebook() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // États pour les sélections
  const [isConnected, setIsConnected] = useState(false);
  const [businesses, setBusinesses] = useState([]);
  const [adAccounts, setAdAccounts] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  
  const [selectedBusinessId, setSelectedBusinessId] = useState('');
  const [selectedAdAccountId, setSelectedAdAccountId] = useState('');
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  
  const [loadingBusinesses, setLoadingBusinesses] = useState(false);
  const [loadingAdAccounts, setLoadingAdAccounts] = useState(false);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);

  // Vérifier si l'utilisateur est déjà connecté à Facebook
  useEffect(() => {
    if (token) {
      checkFacebookConnection();
    }
    
    // Vérifier les paramètres d'URL pour les messages de succès/erreur
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const errorParam = urlParams.get('error');
    
    if (success === 'connected' && token) {
      setSuccess(true);
      setIsConnected(true);
      // Charger les Business Managers automatiquement
      setTimeout(() => {
        loadBusinesses();
      }, 1000);
      // Nettoyer l'URL
      window.history.replaceState({}, '', window.location.pathname);
    }
    
    if (errorParam) {
      setError('Erreur lors de la connexion à Facebook. Veuillez réessayer.');
      // Nettoyer l'URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [token, loadBusinesses]);

  const checkFacebookConnection = async () => {
    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/meta/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsConnected(data.connected || false);
        if (data.selectedCampaign) {
          setSelectedCampaignId(data.selectedCampaign.id);
        }
      }
    } catch (err) {
      console.error('Erreur vérification connexion Facebook:', err);
    }
  };

  const handleFacebookConnect = async () => {
    if (!token) {
      setError('Vous devez être connecté pour utiliser cette fonctionnalité');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Rediriger vers l'authentification Facebook
      window.location.href = `${CONFIG.BACKEND_URL}/auth/facebook?redirect=${encodeURIComponent(window.location.href)}`;
    } catch (err) {
      console.error('Erreur connexion Facebook:', err);
      setError('Erreur lors de la connexion à Facebook. Veuillez réessayer.');
      setLoading(false);
    }
  };

  const loadBusinesses = useCallback(async () => {
    if (!token) return;
    
    setLoadingBusinesses(true);
    setError(null);

    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/meta/businesses`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des Business Managers');
      }

      const data = await response.json();
      setBusinesses(data.businesses || []);
      
      if (data.businesses && data.businesses.length > 0) {
        setIsConnected(true);
      }
    } catch (err) {
      console.error('Erreur chargement Business Managers:', err);
      setError(err.message || 'Erreur lors du chargement des Business Managers');
    } finally {
      setLoadingBusinesses(false);
    }
  }, [token]);

  const loadAdAccounts = async (businessId) => {
    if (!token || !businessId) return;
    
    setLoadingAdAccounts(true);
    setError(null);
    setAdAccounts([]);
    setCampaigns([]);
    setSelectedAdAccountId('');
    setSelectedCampaignId('');

    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/meta/adaccounts?business_id=${businessId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des comptes publicitaires');
      }

      const data = await response.json();
      setAdAccounts(data.adAccounts || []);
    } catch (err) {
      console.error('Erreur chargement comptes publicitaires:', err);
      setError(err.message || 'Erreur lors du chargement des comptes publicitaires');
    } finally {
      setLoadingAdAccounts(false);
    }
  };

  const loadCampaigns = async (adAccountId) => {
    if (!token || !adAccountId) return;
    
    setLoadingCampaigns(true);
    setError(null);
    setCampaigns([]);
    setSelectedCampaignId('');

    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/meta/campaigns?adaccount_id=${adAccountId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des campagnes');
      }

      const data = await response.json();
      setCampaigns(data.campaigns || []);
    } catch (err) {
      console.error('Erreur chargement campagnes:', err);
      setError(err.message || 'Erreur lors du chargement des campagnes');
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const handleBusinessChange = (e) => {
    const businessId = e.target.value;
    setSelectedBusinessId(businessId);
    if (businessId) {
      loadAdAccounts(businessId);
    } else {
      setAdAccounts([]);
      setCampaigns([]);
      setSelectedAdAccountId('');
      setSelectedCampaignId('');
    }
  };

  const handleAdAccountChange = (e) => {
    const adAccountId = e.target.value;
    setSelectedAdAccountId(adAccountId);
    if (adAccountId) {
      loadCampaigns(adAccountId);
    } else {
      setCampaigns([]);
      setSelectedCampaignId('');
    }
  };

  const handleCampaignChange = (e) => {
    setSelectedCampaignId(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedCampaignId) {
      setError('Veuillez sélectionner une campagne');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/meta/select`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          campaignId: selectedCampaignId,
          businessId: selectedBusinessId,
          adAccountId: selectedAdAccountId
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erreur lors de la sauvegarde de la campagne');
      }

      const data = await response.json();
      setSuccess(true);
      setError(null);
      
      // Réinitialiser après 3 secondes
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Erreur sauvegarde campagne:', err);
      setError(err.message || 'Erreur lors de la sauvegarde de la campagne');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
              <FiFacebook className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Connexion Facebook Ads
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Connectez votre compte Facebook et sélectionnez une campagne pour la synchronisation automatique
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
              <FiAlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-3">
              <FiCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-800 dark:text-green-200">
                Campagne sélectionnée avec succès ! La synchronisation automatique est maintenant activée.
              </p>
            </div>
          )}

          {!isConnected ? (
            <div className="text-center py-8">
              <button
                onClick={handleFacebookConnect}
                disabled={loading}
                className="inline-flex items-center gap-3 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <FiLoader className="w-5 h-5 animate-spin" />
                    <span>Connexion en cours...</span>
                  </>
                ) : (
                  <>
                    <FiFacebook className="w-5 h-5" />
                    <span>Se connecter à Facebook</span>
                  </>
                )}
              </button>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                Vous serez redirigé vers Facebook pour autoriser l'accès à votre compte publicitaire
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Business Manager */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Business Manager
                </label>
                <div className="flex gap-2">
                  <select
                    value={selectedBusinessId}
                    onChange={handleBusinessChange}
                    disabled={loadingBusinesses}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Sélectionner un Business Manager</option>
                    {businesses.map((business) => (
                      <option key={business.id} value={business.id}>
                        {business.name}
                      </option>
                    ))}
                  </select>
                  {!businesses.length && (
                    <button
                      type="button"
                      onClick={loadBusinesses}
                      disabled={loadingBusinesses}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {loadingBusinesses ? (
                        <FiLoader className="w-5 h-5 animate-spin" />
                      ) : (
                        'Charger'
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Compte Publicitaire */}
              {selectedBusinessId && (
                <div className="animate-fadeIn">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Compte Publicitaire
                  </label>
                  <select
                    value={selectedAdAccountId}
                    onChange={handleAdAccountChange}
                    disabled={loadingAdAccounts || !selectedBusinessId}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {loadingAdAccounts ? 'Chargement...' : 'Sélectionner un compte publicitaire'}
                    </option>
                    {adAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} ({account.id})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Campagne */}
              {selectedAdAccountId && (
                <div className="animate-fadeIn">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Campagne
                  </label>
                  <select
                    value={selectedCampaignId}
                    onChange={handleCampaignChange}
                    disabled={loadingCampaigns || !selectedAdAccountId}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {loadingCampaigns ? 'Chargement...' : 'Sélectionner une campagne'}
                    </option>
                    {campaigns.map((campaign) => (
                      <option key={campaign.id} value={campaign.id}>
                        {campaign.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Bouton Valider */}
              {selectedCampaignId && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="submit"
                    disabled={loading || !selectedCampaignId}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <FiLoader className="w-5 h-5 animate-spin" />
                        <span>Enregistrement...</span>
                      </>
                    ) : (
                      <>
                        <span>Valider la campagne</span>
                        <FiChevronRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}


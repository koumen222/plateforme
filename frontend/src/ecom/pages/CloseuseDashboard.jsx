import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useEcomAuth } from '../hooks/useEcomAuth';
import ecomApi from '../services/ecommApi.js';

const CloseuseDashboard = () => {
  const { user } = useEcomAuth();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [todayReports, setTodayReports] = useState([]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    productId: '',
    ordersReceived: '',
    ordersDelivered: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Charger uniquement les produits actifs et les rapports du jour
      const [productsRes, reportsRes] = await Promise.all([
        ecomApi.get('/products?isActive=true'),
        ecomApi.get('/reports?date=' + new Date().toISOString().split('T')[0])
      ]);

      setProducts(productsRes.data.data);
      setTodayReports(reportsRes.data.data.reports || []);
    } catch (error) {
      console.error('Erreur chargement dashboard closeuse:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');

    try {
      const reportData = {
        ...formData,
        ordersReceived: parseInt(formData.ordersReceived),
        ordersDelivered: parseInt(formData.ordersDelivered),
        adSpend: 0
      };

      await ecomApi.post('/reports', reportData);
      
      setMessage('Rapport enregistré avec succès!');
      setFormData({ date: formData.date, productId: '', ordersReceived: '', ordersDelivered: '', notes: '' });
      
      // Recharger les données
      await loadDashboardData();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getStatusColor = (status) => {
    const colors = {
      test: 'bg-yellow-100 text-yellow-800',
      stable: 'bg-blue-100 text-blue-800',
      winner: 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6 max-w-7xl mx-auto">
        {/* Message */}
        {message && (
          <div className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg text-sm ${
            message.includes('succès') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
          {/* Formulaire de saisie */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Saisie des Commandes</h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="p-3 sm:p-6">
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date du rapport *
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Produit *
                  </label>
                  <select
                    name="productId"
                    value={formData.productId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Sélectionner un produit</option>
                    {products.map((product) => (
                      <option key={product._id} value={product._id}>
                        {product.name} (Stock: {product.stock})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Commandes Reçues *
                    </label>
                    <input
                      type="number"
                      name="ordersReceived"
                      value={formData.ordersReceived}
                      onChange={handleInputChange}
                      min="0"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Commandes Livrées *
                    </label>
                    <input
                      type="number"
                      name="ordersDelivered"
                      value={formData.ordersDelivered}
                      onChange={handleInputChange}
                      min="0"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (optionnel)
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Observations sur la journée..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Enregistrement...' : 'Enregistrer le rapport'}
                </button>
              </form>
            </div>
          </div>

          {/* Produits Actifs */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Produits Actifs</h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {products.length} produit{products.length > 1 ? 's' : ''} en cours
              </p>
            </div>
            <div className="p-3 sm:p-6">
              <div className="space-y-3">
                {products.map((product) => {
                  const todayReport = todayReports.find(r => (r.productId?._id || r.productId)?.toString() === product._id?.toString());
                  return (
                    <div key={product._id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Link to={`/ecom/products/${product._id}`} className="font-medium text-blue-600 hover:text-blue-800 hover:underline">{product.name}</Link>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(product.status)}`}>
                          {product.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Stock:</span>
                          <span className="ml-2 font-medium">{product.stock}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Prix:</span>
                          <span className="ml-2 font-medium">{product.sellingPrice} FCFA</span>
                        </div>
                      </div>

                      {todayReport && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Reçues:</span>
                              <span className="ml-2 font-medium">{todayReport.ordersReceived}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Livrées:</span>
                              <span className="ml-2 font-medium">{todayReport.ordersDelivered}</span>
                            </div>
                          </div>
                          {todayReport.notes && (
                            <p className="mt-2 text-xs text-gray-600 italic">
                              "{todayReport.notes}"
                            </p>
                          )}
                        </div>
                      )}

                      {!todayReport && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs text-gray-500 italic">
                            Pas encore de rapport pour aujourd'hui
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Résumé de la journée */}
        {todayReports.length > 0 && (
          <div className="mt-4 sm:mt-8 bg-white rounded-lg shadow">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Résumé du Jour</h3>
            </div>
            <div className="p-3 sm:p-6">
              <div className="grid grid-cols-3 gap-3 sm:gap-6">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-blue-600">
                    {todayReports.reduce((sum, report) => sum + report.ordersReceived, 0)}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Commandes Reçues</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-green-600">
                    {todayReports.reduce((sum, report) => sum + report.ordersDelivered, 0)}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Commandes Livrées</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-purple-600">
                    {(() => {
                      const received = todayReports.reduce((sum, report) => sum + report.ordersReceived, 0);
                      const delivered = todayReports.reduce((sum, report) => sum + report.ordersDelivered, 0);
                      return received > 0 ? Math.round((delivered / received) * 100) : 0;
                    })()}%
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Taux de Livraison</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Guide rapide */}
        <div className="mt-4 sm:mt-8 bg-blue-50 rounded-lg p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-2 sm:mb-3">📋 Guide Quick Start</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p>• <strong>1.</strong> Sélectionnez un produit dans la liste</p>
            <p>• <strong>2.</strong> Saisissez le nombre de commandes reçues aujourd'hui</p>
            <p>• <strong>3.</strong> Saisissez le nombre de commandes livrées aujourd'hui</p>
            <p>• <strong>4.</strong> Ajoutez des notes si nécessaire (problèmes, retards, etc.)</p>
            <p>• <strong>5.</strong> Cliquez sur "Enregistrer le rapport"</p>
          </div>
          <div className="mt-4 p-3 bg-blue-100 rounded text-xs text-blue-700">
            <strong>Important:</strong> Vous ne voyez pas les informations financières (dépenses pub, bénéfices) 
            pour vous concentrer uniquement sur la gestion des commandes.
          </div>
        </div>
    </div>
  );
};

export default CloseuseDashboard;

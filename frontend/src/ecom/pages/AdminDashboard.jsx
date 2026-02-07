import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useEcomAuth } from '../hooks/useEcomAuth';
import ecomApi from '../services/ecommApi.js';

const AdminDashboard = () => {
  const { user, logout } = useEcomAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    products: [],
    stockAlerts: [],
    financialStats: {},
    decisions: []
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log('📊 Chargement des données du dashboard admin...');
      
      // Charger les données en parallèle
      const [productsRes, alertsRes, financialRes, decisionsRes] = await Promise.all([
        ecomApi.get('/products?isActive=true'),
        ecomApi.get('/stock/alerts'),
        ecomApi.get('/reports/stats/financial'),
        ecomApi.get('/decisions/dashboard/overview')
      ]);

      console.log('📦 Produits:', productsRes.data);
      console.log('🚨 Alertes stock:', alertsRes.data);
      console.log('💰 Stats financières BRUTES:', financialRes.data);
      console.log('🔄 Décisions:', decisionsRes.data);

      const financialData = financialRes.data?.data || {};
      console.log('💰 Stats financières EXTRAITES:', financialData);

      setStats({
        products: productsRes.data?.data || [],
        stockAlerts: alertsRes.data?.data || [],
        financialStats: financialData,
        decisions: decisionsRes.data?.data || {}
      });

      console.log('✅ Dashboard chargé avec succès');
    } catch (error) {
      console.error('❌ Erreur chargement dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `${amount?.toLocaleString('fr-FR') || 0} FCFA`;
  };

  const formatPercent = (value) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getStatusColor = (status) => {
    const colors = {
      test: 'bg-yellow-100 text-yellow-800',
      stable: 'bg-blue-100 text-blue-800',
      winner: 'bg-green-100 text-green-800',
      pause: 'bg-orange-100 text-orange-800',
      stop: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Ajouter une fonction pour calculer la marge bénéficiaire
  const calculateProductMargin = (product) => {
    const sellingPrice = product.sellingPrice || 0;
    const productCost = product.productCost || 0;
    const deliveryCost = product.deliveryCost || 0;
    const avgAdsCost = product.avgAdsCost || 0;
    const totalCost = productCost + deliveryCost + avgAdsCost;
    return sellingPrice - totalCost;
  };

  const getUrgencyColor = (urgency) => {
    const colors = {
      critical: 'bg-red-500 text-white',
      high: 'bg-orange-500 text-white',
      medium: 'bg-yellow-500 text-white'
    };
    return colors[urgency] || 'bg-gray-500 text-white';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6 max-w-7xl mx-auto">
        {/* Actions Rapides */}
        <div className="mb-4 sm:mb-8 bg-white rounded-lg shadow">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Actions Rapides</h3>
          </div>
          <div className="p-3 sm:p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
              <Link
                to="/ecom/products/new"
                className="px-3 py-2.5 sm:px-4 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-center font-medium text-xs sm:text-sm"
              >
                + Produit
              </Link>
              <Link
                to="/ecom/reports/new"
                className="px-3 py-2.5 sm:px-4 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-center font-medium text-xs sm:text-sm"
              >
                + Rapport
              </Link>
              <Link
                to="/ecom/stock/orders/new"
                className="px-3 py-2.5 sm:px-4 sm:py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-center font-medium text-xs sm:text-sm"
              >
                + Stock
              </Link>
              <Link
                to="/ecom/transactions/new"
                className="px-3 py-2.5 sm:px-4 sm:py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition text-center font-medium text-xs sm:text-sm"
              >
                + Transaction
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-8">
          <div className="bg-white rounded-lg shadow p-3 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 hidden sm:block">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">P</span>
                </div>
              </div>
              <div className="sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Produits Actifs</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.products.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-3 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 hidden sm:block">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">F</span>
                </div>
              </div>
              <div className="sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Bénéfice Net</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.financialStats.totalProfit)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-3 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 hidden sm:block">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">!</span>
                </div>
              </div>
              <div className="sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Alertes Stock</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {stats.stockAlerts.summary?.lowStockCount || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-3 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 hidden sm:block">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">D</span>
                </div>
              </div>
              <div className="sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Décisions en cours</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {stats.decisions.overdue?.totalActive || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stock actuel */}
        <div className="bg-white rounded-lg shadow mb-4 sm:mb-8">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Stock actuel</h3>
            <Link to="/ecom/stock/orders" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              Gérer le stock →
            </Link>
          </div>
          <div className="p-3 sm:p-6">
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
              {stats.products.map((product) => (
                <div key={product._id} className={`rounded-lg p-3 sm:p-4 border ${
                  product.stock === 0 
                    ? 'bg-red-50 border-red-300' 
                    : product.stock <= product.reorderThreshold 
                    ? 'bg-yellow-50 border-yellow-300' 
                    : 'bg-green-50 border-green-300'
                }`}>
                  <p className="text-xs sm:text-sm font-medium text-gray-700 truncate">{product.name}</p>
                  <p className={`text-2xl sm:text-3xl font-bold mt-1 ${
                    product.stock === 0 
                      ? 'text-red-600' 
                      : product.stock <= product.reorderThreshold 
                      ? 'text-yellow-600' 
                      : 'text-green-600'
                  }`}>
                    {product.stock}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {product.stock === 0 ? 'Rupture de stock' : product.stock <= product.reorderThreshold ? 'Stock bas' : 'En stock'}
                    {' · Seuil: '}{product.reorderThreshold}
                  </p>
                </div>
              ))}
            </div>
            {stats.products.length === 0 && (
              <p className="text-gray-500 text-center py-4">Aucun produit actif</p>
            )}
          </div>
        </div>

        {/* Alertes Stock */}
        {stats.stockAlerts.summary?.lowStockCount > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <h3 className="text-lg font-semibold text-red-800 mb-3">⚠️ Alertes Stock Critiques</h3>
            <div className="space-y-2">
              {stats.stockAlerts.lowStockProducts.slice(0, 3).map((alert, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getUrgencyColor(alert.urgency)}`}>
                      {alert.urgency.toUpperCase()}
                    </span>
                    <span className="ml-3 text-sm text-gray-700">
                      {alert.name}: {alert.stock} unités (seuil: {alert.reorderThreshold})
                    </span>
                  </div>
                  <Link
                    to="/ecom/stock"
                    className="text-sm text-red-600 hover:text-red-800 font-medium"
                  >
                    Voir le stock
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
          {/* Produits Actifs */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Produits Actifs</h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {stats.products.slice(0, 5).map((product) => {
                  const margin = calculateProductMargin(product);
                  return (
                    <div key={product._id} className="flex items-center justify-between">
                      <div>
                        <Link to={`/ecom/products/${product._id}`} className="font-medium text-blue-600 hover:text-blue-800 hover:underline">{product.name}</Link>
                        <p className="text-sm text-gray-500">
                          Stock: {product.stock} | Marge: <span className={margin >= 0 ? 'text-green-600' : 'text-red-600'}>{formatCurrency(margin)}</span>
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(product.status)}`}>
                          {product.status}
                        </span>
                        {product.stock <= product.reorderThreshold && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                            Stock bas
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4">
                <Link
                  to="/ecom/products"
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Voir tous les produits →
                </Link>
              </div>
            </div>
          </div>

          {/* Métriques Financières */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Métriques Financières</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Chiffre d'affaires</span>
                  <span className="font-semibold text-blue-600">{formatCurrency(stats.financialStats.totalRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Coûts totaux</span>
                  <span className="font-semibold text-red-600">
                    {formatCurrency(stats.financialStats.totalCost)}
                  </span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-900 font-semibold">Bénéfice net</span>
                    <span className={`font-bold text-lg ${stats.financialStats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(stats.financialStats.totalProfit)}
                    </span>
                  </div>
                  {stats.financialStats.totalProfit !== 0 && (
                    <div className="mt-1 text-xs text-gray-500">
                      {stats.financialStats.totalProfit >= 0 ? '✅ Rentable' : '⚠️ Perte'}
                    </div>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Taux de rentabilité</span>
                  <span className={`font-semibold ${stats.financialStats.profitabilityRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.financialStats.profitabilityRate?.toFixed(1) || 0}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Commandes vendues</span>
                  <span className="font-semibold">{stats.financialStats.totalOrdersDelivered || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Taux de livraison</span>
                  <span className="font-semibold">{formatPercent(stats.financialStats.deliveryRate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">ROAS</span>
                  <span className="font-semibold">{stats.financialStats.roas?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
              <div className="mt-4">
                <Link
                  to="/ecom/reports"
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Voir les rapports →
                </Link>
              </div>
            </div>
          </div>
        </div>

    </div>
  );
};

export default AdminDashboard;

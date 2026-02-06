import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEcomAuth } from '../hooks/useEcomAuth';
import ecomApi from '../services/ecommApi.js';

const ReportForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useEcomAuth();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [error, setError] = useState('');
  const [products, setProducts] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    productId: '',
    ordersReceived: '',
    ordersDelivered: '',
    adSpend: '0',
    notes: ''
  });

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (id) {
      setIsEditing(true);
      loadReport();
    }
  }, [id]);

  const loadReport = async () => {
    try {
      setInitialLoading(true);
      const response = await ecomApi.get(`/reports/${id}`);
      const report = response.data.data;
      
      setFormData({
        date: new Date(report.date).toISOString().split('T')[0],
        productId: report.productId?._id || report.productId,
        ordersReceived: report.ordersReceived?.toString() || '',
        ordersDelivered: report.ordersDelivered?.toString() || '',
        adSpend: report.adSpend?.toString() || '0',
        notes: report.notes || ''
      });
    } catch (error) {
      setError('Erreur lors du chargement du rapport');
      console.error(error);
    } finally {
      setInitialLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await ecomApi.get('/products', { params: { isActive: true } });
      // Correction: les produits sont directement dans response.data.data
      const productsData = response.data?.data || [];
      setProducts(Array.isArray(productsData) ? productsData : []);
      console.log('📦 Produits chargés pour rapports:', productsData.length);
    } catch (error) {
      console.error('Erreur chargement produits:', error);
      setProducts([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('📊 Soumission du rapport:', formData);
      
      const reportData = {
        date: formData.date,
        productId: formData.productId,
        ordersReceived: parseInt(formData.ordersReceived),
        ordersDelivered: parseInt(formData.ordersDelivered),
        adSpend: parseFloat(formData.adSpend) || 0,
        notes: formData.notes
      };

      if (isEditing) {
        await ecomApi.put(`/reports/${id}`, reportData);
        console.log('✅ Rapport mis à jour avec succès');
      } else {
        reportData.reportedBy = user._id;
        await ecomApi.post('/reports', reportData);
        console.log('✅ Rapport créé avec succès');
      }
      
      navigate('/ecom/reports');
    } catch (error) {
      console.error('❌ Erreur:', error);
      setError(error.response?.data?.message || `Erreur lors de ${isEditing ? 'la modification' : 'la création'} du rapport`);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-3xl font-bold text-gray-900">
          {isEditing ? 'Modifier un rapport' : 'Nouveau rapport'}
        </h1>
        <p className="text-gray-600 mt-2">
          {isEditing ? 'Modifiez les données du rapport' : 'Enregistrez les données quotidiennes pour un produit'}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date *
            </label>
            <input
              type="date"
              name="date"
              required
              value={formData.date}
              onChange={handleChange}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Produit *
            </label>
            <select
              name="productId"
              required
              value={formData.productId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Sélectionnez un produit</option>
              {products.map((product) => (
                <option key={product._id} value={product._id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Commandes reçues *
            </label>
            <input
              type="number"
              name="ordersReceived"
              required
              min="0"
              value={formData.ordersReceived}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Commandes livrées *
            </label>
            <input
              type="number"
              name="ordersDelivered"
              required
              min="0"
              value={formData.ordersDelivered}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {user?.role !== 'ecom_closeuse' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dépenses publicitaires (FCFA)
              </label>
              <input
                type="number"
                name="adSpend"
                min="0"
                step="0.01"
                value={formData.adSpend}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            name="notes"
            rows="4"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Informations supplémentaires sur la journée..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Calcul du taux de livraison */}
        {formData.ordersReceived && formData.ordersDelivered && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Statistiques calculées</h3>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 text-sm">
              <div>
                <span className="text-blue-700">Taux de livraison:</span>
                <span className="ml-2 font-semibold">
                  {((formData.ordersDelivered / formData.ordersReceived) * 100).toFixed(1)}%
                </span>
              </div>
              <div>
                <span className="text-blue-700">Commandes en attente:</span>
                <span className="ml-2 font-semibold">
                  {formData.ordersReceived - formData.ordersDelivered}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/ecom/reports')}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (isEditing ? 'Modification...' : 'Création...') : (isEditing ? 'Modifier le rapport' : 'Créer le rapport')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReportForm;

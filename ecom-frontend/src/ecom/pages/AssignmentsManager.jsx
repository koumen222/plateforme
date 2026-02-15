import React, { useState, useEffect } from 'react';
import ecomApi from '../services/ecommApi.js';

const AssignmentsManager = () => {
  const [loading, setLoading] = useState(true);
  const [sources, setSources] = useState([]);
  const [closeuses, setCloseuses] = useState([]);
  const [products, setProducts] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [formData, setFormData] = useState({
    closeuseId: '',
    orderSources: [],
    productAssignments: [],
    notes: ''
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [sourcesRes, closeusesRes, productsRes, assignmentsRes] = await Promise.all([
        ecomApi.get('/assignments/sources'),
        ecomApi.get('/users?role=ecom_closeuse'),
        ecomApi.get('/products'),
        ecomApi.get('/assignments')
      ]);

      setSources(sourcesRes.data.data);
      setCloseuses(closeusesRes.data.data);
      setProducts(productsRes.data.data);
      setAssignments(assignmentsRes.data.data);
    } catch (error) {
      console.error('Erreur chargement données:', error);
      setMessage('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    
    try {
      if (editingAssignment) {
        await ecomApi.put(`/assignments/${editingAssignment._id}`, formData);
        setMessage('Affectation mise à jour avec succès');
      } else {
        await ecomApi.post('/assignments', formData);
        setMessage('Affectation créée avec succès');
      }
      
      setShowForm(false);
      setEditingAssignment(null);
      setFormData({
        closeuseId: '',
        orderSources: [],
        productAssignments: [],
        notes: ''
      });
      
      await loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Erreur lors de l\'enregistrement');
    }
  };

  const handleEdit = (assignment) => {
    setEditingAssignment(assignment);
    setFormData({
      closeuseId: assignment.closeuseId._id,
      orderSources: assignment.orderSources.map(os => ({ sourceId: os.sourceId._id })),
      productAssignments: assignment.productAssignments.map(pa => ({
        sourceId: pa.sourceId._id,
        productIds: pa.productIds.map(p => p._id)
      })),
      notes: assignment.notes
    });
    setShowForm(true);
  };

  const handleDelete = async (assignmentId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette affectation ?')) return;
    
    try {
      await ecomApi.delete(`/assignments/${assignmentId}`);
      setMessage('Affectation supprimée avec succès');
      await loadData();
    } catch (error) {
      setMessage('Erreur lors de la suppression');
    }
  };

  const addOrderSource = () => {
    setFormData(prev => ({
      ...prev,
      orderSources: [...prev.orderSources, { sourceId: '' }]
    }));
  };

  const removeOrderSource = (index) => {
    setFormData(prev => ({
      ...prev,
      orderSources: prev.orderSources.filter((_, i) => i !== index)
    }));
  };

  const addProductAssignment = () => {
    setFormData(prev => ({
      ...prev,
      productAssignments: [...prev.productAssignments, { sourceId: '', productIds: [] }]
    }));
  };

  const removeProductAssignment = (index) => {
    setFormData(prev => ({
      ...prev,
      productAssignments: prev.productAssignments.filter((_, i) => i !== index)
    }));
  };

  const updateProductAssignment = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      productAssignments: prev.productAssignments.map((pa, i) => 
        i === index ? { ...pa, [field]: value } : pa
      )
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Affectations</h1>
        <p className="text-gray-600 mt-1">Affectez des sources de commandes et des produits aux closeuses</p>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-lg ${
          message.includes('succès') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message}
        </div>
      )}

      <div className="mb-6">
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Nouvelle Affectation
        </button>
      </div>

      {/* Liste des affectations */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Affectations existantes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Closeuse</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sources</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produits</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {assignments.map((assignment) => (
                <tr key={assignment._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {assignment.closeuseId.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {assignment.closeuseId.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {assignment.orderSources.map((os) => (
                        <span
                          key={os.sourceId._id}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                          style={{ backgroundColor: os.sourceId.color + '20', color: os.sourceId.color }}
                        >
                          {os.sourceId.icon} {os.sourceId.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {assignment.productAssignments.map((pa) => (
                        <div key={pa.sourceId._id} className="text-xs">
                          <span className="font-medium">{pa.sourceId.name}:</span> {pa.productIds.length} produits
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {assignment.notes || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(assignment)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(assignment._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {assignments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Aucune affectation trouvée
            </div>
          )}
        </div>
      </div>

      {/* Modal formulaire */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingAssignment ? 'Modifier l\'affectation' : 'Nouvelle affectation'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Sélection de la closeuse */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Closeuse *
                  </label>
                  <select
                    value={formData.closeuseId}
                    onChange={(e) => setFormData(prev => ({ ...prev, closeuseId: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Sélectionner une closeuse</option>
                    {closeuses.map((closeuse) => (
                      <option key={closeuse._id} value={closeuse._id}>
                        {closeuse.name} ({closeuse.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sources de commandes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sources de commandes
                  </label>
                  {formData.orderSources.map((os, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <select
                        value={os.sourceId}
                        onChange={(e) => {
                          const newOrderSources = [...formData.orderSources];
                          newOrderSources[index] = { sourceId: e.target.value };
                          setFormData(prev => ({ ...prev, orderSources: newOrderSources }));
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">Sélectionner une source</option>
                        {sources.map((source) => (
                          <option key={source._id} value={source._id}>
                            {source.icon} {source.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => removeOrderSource(index)}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        Supprimer
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addOrderSource}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Ajouter une source
                  </button>
                </div>

                {/* Affectations de produits */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Produits par source
                  </label>
                  {formData.productAssignments.map((pa, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                      <div className="flex gap-2 mb-3">
                        <select
                          value={pa.sourceId}
                          onChange={(e) => updateProductAssignment(index, 'sourceId', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="">Sélectionner une source</option>
                          {sources.map((source) => (
                            <option key={source._id} value={source._id}>
                              {source.icon} {source.name}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => removeProductAssignment(index)}
                          className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          Supprimer
                        </button>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Produits pour cette source
                        </label>
                        <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2">
                          {products.map((product) => (
                            <label key={product._id} className="flex items-center mb-1">
                              <input
                                type="checkbox"
                                checked={pa.productIds.includes(product._id)}
                                onChange={(e) => {
                                  const newProductIds = e.target.checked
                                    ? [...pa.productIds, product._id]
                                    : pa.productIds.filter(id => id !== product._id);
                                  updateProductAssignment(index, 'productIds', newProductIds);
                                }}
                                className="mr-2"
                              />
                              <span className="text-sm">{product.name} ({product.sellingPrice} FCFA)</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addProductAssignment}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Ajouter une affectation de produits
                  </button>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Notes optionnelles..."
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingAssignment ? 'Mettre à jour' : 'Créer'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingAssignment(null);
                      setFormData({
                        closeuseId: '',
                        orderSources: [],
                        productAssignments: [],
                        notes: ''
                      });
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentsManager;

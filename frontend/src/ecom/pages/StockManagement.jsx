import React, { useState, useEffect } from 'react';
import ecomApi from '../services/ecommApi.js';

const StockManagement = () => {
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tab, setTab] = useState('overview'); // overview, list, add
  const [filterCity, setFilterCity] = useState('');
  const [filterAgency, setFilterAgency] = useState('');
  const [filterProduct, setFilterProduct] = useState('');

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    productId: '', city: '', agency: '', quantity: '', unitCost: '', notes: ''
  });
  const [adjustForm, setAdjustForm] = useState({ adjustment: '', reason: '' });

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [entriesRes, summaryRes, productsRes] = await Promise.all([
        ecomApi.get('/stock-locations'),
        ecomApi.get('/stock-locations/summary'),
        ecomApi.get('/products')
      ]);
      setEntries(entriesRes.data.data || []);
      setSummary(summaryRes.data.data || null);
      setProducts(productsRes.data.data?.products || productsRes.data.data || []);
    } catch (err) {
      setError('Erreur chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.productId || !form.city || !form.quantity) {
      setError('Produit, ville et quantité sont requis');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await ecomApi.post('/stock-locations', {
        productId: form.productId,
        city: form.city.trim(),
        agency: form.agency.trim(),
        quantity: parseInt(form.quantity),
        unitCost: parseFloat(form.unitCost) || 0,
        notes: form.notes
      });
      setSuccess('Stock ajouté avec succès');
      setShowAddModal(false);
      setForm({ productId: '', city: '', agency: '', quantity: '', unitCost: '', notes: '' });
      loadAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdjust = async (e) => {
    e.preventDefault();
    if (!adjustForm.adjustment) { setError('Ajustement requis'); return; }
    setSubmitting(true);
    setError('');
    try {
      await ecomApi.post(`/stock-locations/${selectedEntry._id}/adjust`, {
        adjustment: parseInt(adjustForm.adjustment),
        reason: adjustForm.reason
      });
      setSuccess('Stock ajusté');
      setShowAdjustModal(false);
      setAdjustForm({ adjustment: '', reason: '' });
      setSelectedEntry(null);
      loadAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cet emplacement ?')) return;
    try {
      await ecomApi.delete(`/stock-locations/${id}`);
      setSuccess('Emplacement supprimé');
      loadAll();
    } catch { setError('Erreur suppression'); }
  };

  const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n || 0);
  const fmtMoney = (n) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(n || 0);

  const filteredEntries = entries.filter(e => {
    if (filterCity && !e.city?.toLowerCase().includes(filterCity.toLowerCase())) return false;
    if (filterAgency && !e.agency?.toLowerCase().includes(filterAgency.toLowerCase())) return false;
    if (filterProduct && e.productId?._id !== filterProduct) return false;
    return true;
  });

  // Get unique cities and agencies for filters
  const uniqueCities = [...new Set(entries.map(e => e.city).filter(Boolean))].sort();
  const uniqueAgencies = [...new Set(entries.map(e => e.agency).filter(Boolean))].sort();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <svg className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-gray-500">Chargement du stock...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Gestion du Stock</h1>
          <p className="text-sm text-gray-500 mt-0.5">Stock par ville et agence de livraison</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Ajouter du stock
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center justify-between">
          {error}
          <button onClick={() => setError('')} className="text-red-500 hover:text-red-700 ml-2">&times;</button>
        </div>
      )}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm flex items-center justify-between">
          {success}
          <button onClick={() => setSuccess('')} className="text-green-500 hover:text-green-700 ml-2">&times;</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
        {[
          { key: 'overview', label: 'Vue d\'ensemble' },
          { key: 'list', label: 'Détail stock' },
          { key: 'cities', label: 'Par ville' },
          { key: 'agencies', label: 'Par agence' }
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-medium transition ${
              tab === t.key ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && summary && (
        <div className="space-y-6">
          {/* Totals */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{fmt(summary.totals?.totalQuantity)}</p>
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-medium mt-1">Total unités</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
              <p className="text-lg sm:text-2xl font-bold text-green-600">{fmtMoney(summary.totals?.totalValue)}</p>
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-medium mt-1">Valeur totale</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">{summary.totals?.citiesCount || 0}</p>
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-medium mt-1">Villes</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
              <p className="text-2xl font-bold text-orange-600">{summary.totals?.agenciesCount || 0}</p>
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-medium mt-1">Agences</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-4 text-center col-span-2 sm:col-span-1">
              <p className="text-2xl font-bold text-gray-700">{summary.totals?.totalEntries || 0}</p>
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-medium mt-1">Emplacements</p>
            </div>
          </div>

          {/* By Product */}
          {summary.byProduct?.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="px-4 py-3 border-b bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-800">Stock par produit</h3>
              </div>
              <div className="divide-y">
                {summary.byProduct.map((p, i) => (
                  <div key={i} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{p.productName}</p>
                      <p className="text-xs text-gray-500">{p.cities?.length || 0} ville(s)</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{fmt(p.totalQuantity)} unités</p>
                      <p className="text-xs text-green-600 font-medium">{fmtMoney(p.totalValue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* List Tab */}
      {tab === 'list' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border p-3 flex flex-wrap gap-2">
            <select value={filterProduct} onChange={e => setFilterProduct(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
              <option value="">Tous les produits</option>
              {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
            <select value={filterCity} onChange={e => setFilterCity(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
              <option value="">Toutes les villes</option>
              {uniqueCities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={filterAgency} onChange={e => setFilterAgency(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
              <option value="">Toutes les agences</option>
              {uniqueAgencies.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            {(filterCity || filterAgency || filterProduct) && (
              <button onClick={() => { setFilterCity(''); setFilterAgency(''); setFilterProduct(''); }}
                className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition">
                Réinitialiser
              </button>
            )}
          </div>

          {/* Entries */}
          {filteredEntries.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <p className="text-sm">Aucun stock enregistré</p>
              <button onClick={() => setShowAddModal(true)} className="mt-3 text-blue-600 text-sm font-medium hover:underline">
                Ajouter du stock
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredEntries.map(entry => (
                <div key={entry._id} className="bg-white rounded-xl shadow-sm border p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-900">{entry.productId?.name || '?'}</span>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-medium rounded-full">{entry.city}</span>
                        {entry.agency && (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-medium rounded-full">{entry.agency}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-500">Qté: <strong className="text-gray-800">{fmt(entry.quantity)}</strong></span>
                        <span className="text-xs text-gray-500">Coût unit: <strong className="text-gray-800">{fmtMoney(entry.unitCost)}</strong></span>
                        <span className="text-xs text-green-600 font-medium">Valeur: {fmtMoney(entry.quantity * entry.unitCost)}</span>
                      </div>
                      {entry.notes && <p className="text-[10px] text-gray-400 mt-1 truncate">{entry.notes}</p>}
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => { setSelectedEntry(entry); setAdjustForm({ adjustment: '', reason: '' }); setShowAdjustModal(true); }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Ajuster">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(entry._id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition" title="Supprimer">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Cities Tab */}
      {tab === 'cities' && summary?.byCity && (
        <div className="space-y-3">
          {summary.byCity.length === 0 ? (
            <p className="text-center py-12 text-gray-400 text-sm">Aucune donnée par ville</p>
          ) : (
            summary.byCity.map((c, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{c._id}</p>
                      <p className="text-xs text-gray-500">{c.entries} emplacement(s)</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{fmt(c.totalQuantity)}</p>
                    <p className="text-xs text-green-600 font-medium">{fmtMoney(c.totalValue)}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Agencies Tab */}
      {tab === 'agencies' && summary?.byAgency && (
        <div className="space-y-3">
          {summary.byAgency.length === 0 ? (
            <p className="text-center py-12 text-gray-400 text-sm">Aucune agence enregistrée</p>
          ) : (
            summary.byAgency.map((a, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{a._id}</p>
                      <p className="text-xs text-gray-500">{a.cities?.join(', ')} · {a.entries} emplacement(s)</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{fmt(a.totalQuantity)}</p>
                    <p className="text-xs text-green-600 font-medium">{fmtMoney(a.totalValue)}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-5" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Ajouter du stock</h3>
            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Produit *</label>
                <select value={form.productId} onChange={e => setForm(p => ({ ...p, productId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" required>
                  <option value="">-- Choisir --</option>
                  {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ville *</label>
                  <input type="text" value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Douala" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Agence de livraison</label>
                  <input type="text" value={form.agency} onChange={e => setForm(p => ({ ...p, agency: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Lygos, Anka" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantité *</label>
                  <input type="number" min="0" value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="0" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Coût unitaire (FCFA)</label>
                  <input type="number" min="0" value={form.unitCost} onChange={e => setForm(p => ({ ...p, unitCost: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="Auto si vide" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <input type="text" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="Optionnel" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm">
                  Annuler
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium">
                  {submitting ? 'Ajout...' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Modal */}
      {showAdjustModal && selectedEntry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAdjustModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Ajuster le stock</h3>
            <p className="text-sm text-gray-500 mb-4">
              {selectedEntry.productId?.name} · {selectedEntry.city}
              {selectedEntry.agency ? ` · ${selectedEntry.agency}` : ''}
              <br />Stock actuel: <strong>{fmt(selectedEntry.quantity)}</strong>
            </p>
            <form onSubmit={handleAdjust} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ajustement (+ ou -)</label>
                <input type="number" value={adjustForm.adjustment}
                  onChange={e => setAdjustForm(p => ({ ...p, adjustment: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: 10 ou -5" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Raison</label>
                <input type="text" value={adjustForm.reason}
                  onChange={e => setAdjustForm(p => ({ ...p, reason: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Réception, Livraison, Perte..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAdjustModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm">
                  Annuler
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium">
                  {submitting ? 'Ajustement...' : 'Ajuster'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockManagement;

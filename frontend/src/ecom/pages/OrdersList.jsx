import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEcomAuth } from '../hooks/useEcomAuth';
import { useMoney } from '../hooks/useMoney.js';
import ecomApi from '../services/ecommApi.js';

const SL = { pending: 'En attente', confirmed: 'Confirmé', shipped: 'Expédié', delivered: 'Livré', returned: 'Retour', cancelled: 'Annulé' };
const SC = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  shipped: 'bg-purple-100 text-purple-800 border-purple-200',
  delivered: 'bg-green-100 text-green-800 border-green-200',
  returned: 'bg-orange-100 text-orange-800 border-orange-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200'
};
const SD = {
  pending: 'border-l-yellow-400', confirmed: 'border-l-blue-400', shipped: 'border-l-purple-400',
  delivered: 'border-l-green-400', returned: 'border-l-orange-400', cancelled: 'border-l-red-400'
};

const OrdersList = () => {
  const navigate = useNavigate();
  const { user } = useEcomAuth();
  const { fmt } = useMoney();
  const isAdmin = user?.role === 'ecom_admin';
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [backfilling, setBackfilling] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig] = useState({ spreadsheetId: '', sheetName: 'Sheet1' });
  const [configLoading, setConfigLoading] = useState(false);
  const [sources, setSources] = useState([]);
  const [selectedSourceId, setSelectedSourceId] = useState('');
  const [lastSyncs, setLastSyncs] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [viewMode, setViewMode] = useState('table');
  const [showSourceSelector, setShowSourceSelector] = useState(true);

  const fetchOrders = async () => {
    try {
      const params = { page, limit: 50 };
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus;
      if (filterCity) params.city = filterCity;
      if (filterProduct) params.product = filterProduct;
      if (filterTag) params.tag = filterTag;
      if (filterStartDate) params.startDate = filterStartDate;
      if (filterEndDate) params.endDate = filterEndDate;
      if (selectedSourceId) params.sourceId = selectedSourceId;
      const res = await ecomApi.get('/orders', { params });
      setOrders(res.data.data.orders);
      setStats(res.data.data.stats);
      setPagination(res.data.data.pagination || {});
    } catch { setError('Erreur chargement commandes'); }
  };

  const fetchConfig = async () => {
    try {
      const res = await ecomApi.get('/orders/settings');
      if (res.data.success) {
        let allSources = res.data.data.sources || [];
        
        // Ajouter la source "Legacy/Principal" si elle est configurée
        if (res.data.data.googleSheets?.spreadsheetId) {
          allSources = [
            {
              _id: 'legacy',
              name: 'Commandes Zendo',
              sheetName: res.data.data.googleSheets.sheetName || 'Sheet1',
              isActive: true,
              lastSyncAt: res.data.data.googleSheets.lastSyncAt
            },
            ...allSources
          ];
        }
        
        setSources(allSources);
        
        const syncs = {};
        allSources.forEach(s => {
          if (s.lastSyncAt) syncs[s._id] = s.lastSyncAt;
        });
        setLastSyncs(syncs);
      }
    } catch (err) {
      console.error('Error fetching config:', err);
    }
  };

  useEffect(() => {
    const init = async () => {
      if (isAdmin) await fetchConfig();
      // On n'appelle fetchOrders que si on n'est pas en mode sélection de source
      // ou si on veut charger les stats globales
      await fetchOrders();
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => { if (!loading) fetchOrders(); }, [search, filterStatus, filterCity, filterProduct, filterTag, filterStartDate, filterEndDate, selectedSourceId, page]);
  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 4000); return () => clearTimeout(t); } }, [success]);
  useEffect(() => { if (error) { const t = setTimeout(() => setError(''), 5000); return () => clearTimeout(t); } }, [error]);

  const handleSync = async (sourceId = null) => {
    setSyncing(true); setError('');
    try {
      const res = await ecomApi.post('/orders/sync-sheets', { sourceId: sourceId || selectedSourceId }, { timeout: 120000 });
      setSuccess(res.data.message);
      fetchConfig(); // Refresh sources for sync times
      fetchOrders();
    } catch (err) { setError(err.response?.data?.message || 'Erreur synchronisation'); }
    finally { setSyncing(false); }
  };

  const handleBackfillClients = async () => {
    setBackfilling(true); setError('');
    try {
      const res = await ecomApi.post('/orders/backfill-clients', {}, { timeout: 120000 });
      setSuccess(res.data.message);
    } catch (err) { setError(err.response?.data?.message || 'Erreur backfill clients'); }
    finally { setBackfilling(false); }
  };

  const handleSaveConfig = async () => {
    setConfigLoading(true);
    try {
      await ecomApi.put('/orders/settings', config);
      setSuccess('Configuration sauvegardée');
      setShowConfig(false);
    } catch (err) { setError(err.response?.data?.message || 'Erreur sauvegarde'); }
    finally { setConfigLoading(false); }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await ecomApi.put(`/orders/${orderId}`, { status: newStatus });
      fetchOrders();
    } catch { setError('Erreur modification'); }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' }) : '-';
  const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';

  const getProductName = (o) => {
    if (o.product && isNaN(o.product)) return o.product;
    if (o.rawData) {
      const entry = Object.entries(o.rawData).find(([k, v]) => v && isNaN(v) && /produit|product|article|item|d[eé]signation/i.test(k));
      if (entry) return entry[1];
    }
    return o.product || '';
  };

  const sheetCols = useMemo(() => {
    const hasRaw = orders.some(o => o.rawData && Object.keys(o.rawData).length > 0);
    return hasRaw ? [...new Set(orders.flatMap(o => Object.keys(o.rawData || {})))] : [];
  }, [orders]);

  const uniqueCities = useMemo(() => [...new Set(orders.map(o => o.city).filter(Boolean))].sort(), [orders]);
  const uniqueProducts = useMemo(() => [...new Set(orders.map(o => getProductName(o)).filter(Boolean))].sort(), [orders]);
  const uniqueTags = useMemo(() => [...new Set(orders.flatMap(o => o.tags || []))].sort(), [orders]);

  const activeFiltersCount = [filterCity, filterProduct, filterTag, filterStartDate, filterEndDate].filter(Boolean).length;

  const clearAllFilters = () => {
    setFilterStatus('');
    setFilterCity('');
    setFilterProduct('');
    setFilterTag('');
    setFilterStartDate('');
    setFilterEndDate('');
    setSearch('');
    setPage(1);
  };

  const deliveryRate = stats.total ? ((stats.delivered || 0) / stats.total * 100).toFixed(1) : 0;
  const returnRate = stats.total ? ((stats.returned || 0) / stats.total * 100).toFixed(1) : 0;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  if (showSourceSelector && isAdmin) {
    return (
      <div className="p-4 sm:p-6 max-w-5xl mx-auto min-h-[80vh] flex flex-col justify-center">
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Gestion des Commandes</h1>
          <p className="text-gray-500 mt-3 text-lg">Choisissez une source de données pour commencer</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Option Vue Globale */}
          <button
            onClick={() => {
              setSelectedSourceId('');
              setPage(1);
              setShowSourceSelector(false);
            }}
            className="flex flex-col items-center justify-center p-8 bg-white border-2 border-gray-100 rounded-3xl hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 transition-all group"
          >
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </div>
            <span className="font-bold text-gray-900 text-lg">Vue globale</span>
            <span className="text-sm text-gray-400 mt-2 text-center">Toutes les sources consolidées</span>
          </button>

          {/* Liste des sources existantes */}
          {sources.map(source => (
            <button
              key={source._id}
              onClick={() => {
                setSelectedSourceId(source._id);
                setPage(1);
                setShowSourceSelector(false);
              }}
              className="flex flex-col items-center justify-center p-8 bg-white border-2 border-gray-100 rounded-3xl hover:border-green-500 hover:shadow-xl hover:shadow-green-500/10 transition-all group"
            >
              <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="font-bold text-gray-900 text-lg">{source.name}</span>
              <span className="text-sm text-gray-400 mt-2">{source.sheetName}</span>
              <div className="mt-4 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${source.isActive ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{source.isActive ? 'Actif' : 'Inactif'}</span>
              </div>
            </button>
          ))}

          {/* Option Ajouter une source */}
          <button
            onClick={() => navigate('/ecom/settings')}
            className="flex flex-col items-center justify-center p-8 bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl hover:border-blue-400 hover:bg-blue-50/50 transition-all group"
          >
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-5 shadow-sm group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-gray-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="font-bold text-gray-500 group-hover:text-blue-600 text-lg">Ajouter un sheet</span>
            <span className="text-sm text-gray-400 mt-2 text-center">Configurer une nouvelle source</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6 max-w-[1400px] mx-auto">
      {success && <div className="mb-3 p-2.5 bg-green-50 text-green-800 rounded-lg text-sm border border-green-200 flex items-center gap-2"><svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>{success}</div>}
      {error && <div className="mb-3 p-2.5 bg-red-50 text-red-800 rounded-lg text-sm border border-red-200 flex items-center gap-2"><svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/></svg>{error}</div>}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {isAdmin && sources.length > 0 && (
            <button
              onClick={() => {
                setShowSourceSelector(true);
                setPage(1);
              }}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
              title="Changer de source"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
              </svg>
            </button>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              {selectedSourceId ? sources.find(s => s._id === selectedSourceId)?.name : (showSourceSelector ? 'Gestion des Commandes' : 'Vue globale')}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {stats.total || 0} total
              {Object.keys(lastSyncs).length > 0 && <> · Dernières synchronisations actives</>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {isAdmin && (
            <>
              {sources.length > 0 && (
                <div className="flex items-center gap-2 mr-2">
                  <select
                    value={selectedSourceId}
                    onChange={(e) => setSelectedSourceId(e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="">Toutes les sources actives</option>
                    {sources.map(s => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <button onClick={() => navigate('/ecom/settings')} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition" title="Gérer les sources">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              </button>
              <button onClick={() => handleSync()} disabled={syncing} className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-xs font-medium disabled:opacity-50 flex items-center gap-1.5">
                <svg className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                {syncing ? 'Sync...' : 'Sync Sheets'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <div className="bg-white rounded-xl shadow-sm border p-3">
          <p className="text-[10px] text-gray-400 font-medium uppercase">Revenu livré</p>
          <p className="text-lg font-bold text-gray-900 mt-0.5">{fmt(stats.totalRevenue)}</p>
          <p className="text-[10px] text-green-600 mt-0.5">{stats.delivered || 0} livrées</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-3">
          <p className="text-[10px] text-gray-400 font-medium uppercase">Taux livraison</p>
          <p className="text-lg font-bold text-gray-900 mt-0.5">{deliveryRate}%</p>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1.5">
            <div className="bg-green-500 h-1.5 rounded-full transition-all" style={{ width: `${Math.min(deliveryRate, 100)}%` }}></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-3">
          <p className="text-[10px] text-gray-400 font-medium uppercase">Taux retour</p>
          <p className="text-lg font-bold text-gray-900 mt-0.5">{returnRate}%</p>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1.5">
            <div className="bg-orange-500 h-1.5 rounded-full transition-all" style={{ width: `${Math.min(returnRate, 100)}%` }}></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-3">
          <p className="text-[10px] text-gray-400 font-medium uppercase">En cours</p>
          <p className="text-lg font-bold text-gray-900 mt-0.5">{(stats.pending || 0) + (stats.confirmed || 0) + (stats.shipped || 0)}</p>
          <p className="text-[10px] text-blue-600 mt-0.5">{stats.pending || 0} en attente · {stats.shipped || 0} expédiées</p>
        </div>
      </div>

      {/* Status filter pills + search + advanced filters */}
      <div className="bg-white rounded-xl shadow-sm border p-3 mb-4">
        <div className="flex flex-wrap items-center gap-2 mb-2.5">
          <button onClick={() => { setFilterStatus(''); setPage(1); }} className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition ${!filterStatus ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            Tous ({stats.total || 0})
          </button>
          {[
            { key: 'pending', label: 'En attente', color: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100' },
            { key: 'confirmed', label: 'Confirmé', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
            { key: 'shipped', label: 'Expédié', color: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
            { key: 'delivered', label: 'Livré', color: 'bg-green-50 text-green-700 hover:bg-green-100' },
            { key: 'returned', label: 'Retour', color: 'bg-orange-50 text-orange-700 hover:bg-orange-100' },
            { key: 'cancelled', label: 'Annulé', color: 'bg-red-50 text-red-700 hover:bg-red-100' },
          ].map(s => (
            <button key={s.key} onClick={() => { setFilterStatus(filterStatus === s.key ? '' : s.key); setPage(1); }}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition ${filterStatus === s.key ? 'ring-2 ring-offset-1 ring-gray-400 ' : ''}${s.color}`}>
              {s.label} ({stats[s.key] || 0})
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input type="text" placeholder="Rechercher nom, tél, ville, produit..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition border ${showFilters || activeFiltersCount > 0 ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>
            Filtres{activeFiltersCount > 0 && <span className="bg-blue-600 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center">{activeFiltersCount}</span>}
          </button>
          {sheetCols.length > 0 && (
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <button onClick={() => setViewMode('table')} className={`px-2.5 py-2 text-xs ${viewMode === 'table' ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`} title="Vue tableau">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M3 6h18M3 18h18"/></svg>
              </button>
              <button onClick={() => setViewMode('cards')} className={`px-2.5 py-2 text-xs ${viewMode === 'cards' ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`} title="Vue cartes">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>
              </button>
            </div>
          )}
        </div>

        {/* Advanced filters panel */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <div>
                <label className="block text-[10px] font-medium text-gray-500 mb-1">Date début</label>
                <input type="date" value={filterStartDate} onChange={e => { setFilterStartDate(e.target.value); setPage(1); }}
                  className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-500 mb-1">Date fin</label>
                <input type="date" value={filterEndDate} onChange={e => { setFilterEndDate(e.target.value); setPage(1); }}
                  className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-500 mb-1">Ville</label>
                <select value={filterCity} onChange={e => { setFilterCity(e.target.value); setPage(1); }}
                  className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Toutes les villes</option>
                  {uniqueCities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-500 mb-1">Produit</label>
                <select value={filterProduct} onChange={e => { setFilterProduct(e.target.value); setPage(1); }}
                  className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Tous les produits</option>
                  {uniqueProducts.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-500 mb-1">Tag</label>
                <select value={filterTag} onChange={e => { setFilterTag(e.target.value); setPage(1); }}
                  className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Tous les tags</option>
                  {uniqueTags.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            {activeFiltersCount > 0 && (
              <div className="flex items-center justify-between mt-2.5">
                <div className="flex flex-wrap gap-1.5">
                  {filterStartDate && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-medium">Depuis: {filterStartDate} <button onClick={() => { setFilterStartDate(''); setPage(1); }} className="hover:text-blue-900">&times;</button></span>}
                  {filterEndDate && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-medium">Jusqu'au: {filterEndDate} <button onClick={() => { setFilterEndDate(''); setPage(1); }} className="hover:text-blue-900">&times;</button></span>}
                  {filterCity && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full text-[10px] font-medium">{filterCity} <button onClick={() => { setFilterCity(''); setPage(1); }} className="hover:text-purple-900">&times;</button></span>}
                  {filterProduct && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-[10px] font-medium">{filterProduct} <button onClick={() => { setFilterProduct(''); setPage(1); }} className="hover:text-green-900">&times;</button></span>}
                  {filterTag && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-50 text-orange-700 rounded-full text-[10px] font-medium">{filterTag} <button onClick={() => { setFilterTag(''); setPage(1); }} className="hover:text-orange-900">&times;</button></span>}
                </div>
                <button onClick={clearAllFilters} className="text-[10px] text-red-600 hover:text-red-800 font-medium">Tout effacer</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Orders */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-10 text-center">
          <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
          </div>
          <p className="text-gray-500 text-sm font-medium">Aucune commande</p>
          {isAdmin && <p className="text-xs text-gray-400 mt-1">Configurez Google Sheets et cliquez "Sync Sheets"</p>}
        </div>
      ) : viewMode === 'table' && sheetCols.length > 0 ? (
        /* Vue tableau dynamique */
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/80">
                  <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider w-8">#</th>
                  {sheetCols.map((col, i) => (
                    <th key={i} className="px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{col}</th>
                  ))}
                  <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50/80">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((o, idx) => (
                  <tr key={o._id} className={`hover:bg-blue-50/30 transition cursor-pointer ${expandedId === o._id ? 'bg-blue-50/40' : ''}`} onClick={() => navigate(`/ecom/orders/${o._id}`)}>
                    <td className="px-3 py-2 text-[10px] text-gray-400 font-mono">{(page - 1) * 50 + idx + 1}</td>
                    {sheetCols.map((col, i) => {
                      const val = o.rawData?.[col] || '';
                      return (
                        <td key={i} className="px-3 py-2 text-xs text-gray-700 whitespace-nowrap max-w-[180px]">
                          <span className="truncate block" title={val}>{val || <span className="text-gray-300">—</span>}</span>
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 whitespace-nowrap sticky right-0 bg-white" onClick={(e) => e.stopPropagation()}>
                      <select value={o.status} onChange={(e) => handleStatusChange(o._id, e.target.value)}
                        className={`text-[10px] px-2 py-1 rounded-full font-medium border cursor-pointer ${SC[o.status]}`}>
                        {Object.entries(SL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Vue cartes */
        <div className="space-y-2">
          {orders.map(o => (
            <div key={o._id} className={`bg-white rounded-xl shadow-sm border border-l-4 ${SD[o.status]} overflow-hidden`}>
              <div className="p-3 sm:p-4 cursor-pointer" onClick={() => navigate(`/ecom/orders/${o._id}`)}>
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900 truncate">{o.clientName || 'Sans nom'}</span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${SC[o.status]}`}>{SL[o.status]}</span>
                      {o.orderId && o.orderId !== `#${o.sheetRowId?.split('_')[1]}` && (
                        <span className="text-[10px] font-mono text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">{o.orderId}</span>
                      )}
                      {(o.tags || []).map(tag => (
                        <span key={tag} className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${
                          tag === 'Client' ? 'bg-emerald-100 text-emerald-700' :
                          tag === 'En attente' ? 'bg-amber-100 text-amber-700' :
                          tag === 'Annulé' ? 'bg-red-100 text-red-700' :
                          tag === 'Confirmé' ? 'bg-blue-100 text-blue-700' :
                          tag === 'Expédié' ? 'bg-violet-100 text-violet-700' :
                          tag === 'Retour' ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>{tag}</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap text-[11px] text-gray-400">
                      {o.clientPhone && <span className="flex items-center gap-0.5"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>{o.clientPhone}</span>}
                      {o.city && <><span className="text-gray-300">·</span><span className="flex items-center gap-0.5"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>{o.city}</span></>}
                      {getProductName(o) && <><span className="text-gray-300">·</span><span>{getProductName(o)}</span></>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {o.price > 0 && <p className="text-sm font-bold text-gray-900">{fmt(o.price * (o.quantity || 1))}</p>}
                    <p className="text-[10px] text-gray-400">{fmtDate(o.date)}</p>
                  </div>
                  <svg className={`w-4 h-4 text-gray-300 flex-shrink-0 transition-transform ${expandedId === o._id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                </div>
              </div>

              {/* Expanded details */}
              {expandedId === o._id && (
                <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-semibold text-gray-500 uppercase">Détails commande</p>
                    <select value={o.status} onChange={(e) => handleStatusChange(o._id, e.target.value)}
                      className={`text-[11px] px-3 py-1 rounded-full font-medium border cursor-pointer ${SC[o.status]}`}>
                      {Object.entries(SL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  {o.rawData && Object.keys(o.rawData).length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5">
                      {Object.entries(o.rawData).map(([key, val]) => (
                        <div key={key}>
                          <p className="text-[9px] text-gray-400 uppercase font-medium">{key}</p>
                          <p className="text-xs text-gray-700 truncate" title={val}>{val || '—'}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5">
                      <div><p className="text-[9px] text-gray-400 uppercase font-medium">Client</p><p className="text-xs text-gray-700">{o.clientName || '—'}</p></div>
                      <div><p className="text-[9px] text-gray-400 uppercase font-medium">Téléphone</p><p className="text-xs text-gray-700">{o.clientPhone || '—'}</p></div>
                      <div><p className="text-[9px] text-gray-400 uppercase font-medium">Ville</p><p className="text-xs text-gray-700">{o.city || '—'}</p></div>
                      <div><p className="text-[9px] text-gray-400 uppercase font-medium">Produit</p><p className="text-xs text-gray-700">{o.product || '—'}</p></div>
                      <div><p className="text-[9px] text-gray-400 uppercase font-medium">Prix</p><p className="text-xs text-gray-700">{o.price ? fmt(o.price) : '—'}</p></div>
                      <div><p className="text-[9px] text-gray-400 uppercase font-medium">Date</p><p className="text-xs text-gray-700">{fmtDate(o.date)}</p></div>
                      {o.notes && <div className="col-span-2 sm:col-span-3"><p className="text-[9px] text-gray-400 uppercase font-medium">Notes</p><p className="text-xs text-gray-700">{o.notes}</p></div>}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-4 bg-white rounded-xl shadow-sm border px-4 py-2.5">
          <p className="text-[11px] text-gray-400">Page {page}/{pagination.pages} · {pagination.total} commandes</p>
          <div className="flex gap-1">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="px-3 py-1 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30">Préc</button>
            <button onClick={() => setPage(Math.min(pagination.pages, page + 1))} disabled={page >= pagination.pages} className="px-3 py-1 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30">Suiv</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersList;

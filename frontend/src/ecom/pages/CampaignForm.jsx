import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ecomApi from '../services/ecommApi.js';

const CampaignForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    name: '',
    type: 'custom',
    messageTemplate: '',
    targetFilters: { clientStatus: '', city: '', product: '', tag: '', minOrders: 0, maxOrders: 0 },
    scheduledAt: '',
    tags: ''
  });
  const [templates, setTemplates] = useState([]);
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [selectedClients, setSelectedClients] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEdit);
  const [error, setError] = useState('');
  const [showPhoneList, setShowPhoneList] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    ecomApi.get('/campaigns/templates').then(res => setTemplates(res.data.data)).catch(() => {});
    if (isEdit) {
      ecomApi.get(`/campaigns/${id}`).then(res => {
        const c = res.data.data;
        setFormData({
          name: c.name || '',
          type: c.type || 'custom',
          messageTemplate: c.messageTemplate || '',
          targetFilters: c.targetFilters || { clientStatus: '', city: '', product: '', tag: '', minOrders: 0, maxOrders: 0 },
          scheduledAt: c.scheduledAt ? new Date(c.scheduledAt).toISOString().slice(0, 16) : '',
          tags: (c.tags || []).join(', ')
        });
      }).catch(() => setError('Campagne introuvable')).finally(() => setFetchLoading(false));
    }
  }, [id, isEdit]);

  const handlePreview = async () => {
    setPreviewLoading(true);
    try {
      const res = await ecomApi.post('/campaigns/preview', { targetFilters: formData.targetFilters });
      setPreview(res.data.data);
      // Sélectionner tous par défaut
      setSelectedClients(new Set(res.data.data.clients.map(c => c._id)));
    } catch { setError('Erreur prévisualisation'); }
    finally { setPreviewLoading(false); }
  };

  const toggleClient = (id) => {
    setSelectedClients(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (!preview) return;
    if (selectedClients.size === preview.clients.length) {
      setSelectedClients(new Set());
    } else {
      setSelectedClients(new Set(preview.clients.map(c => c._id)));
    }
  };

  const getSelectedPhones = () => {
    if (!preview) return [];
    return preview.clients.filter(c => selectedClients.has(c._id)).map(c => c.phone).filter(Boolean);
  };

  const copyPhones = () => {
    const phones = getSelectedPhones().join('\n');
    navigator.clipboard.writeText(phones).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const quickFilter = (tag) => {
    const statusMap = { 'Client': 'delivered', 'En attente': 'prospect', 'Annulé': 'returned' };
    updateFilter('clientStatus', statusMap[tag] || '');
    updateFilter('tag', tag);
    // Auto-preview
    setTimeout(() => handlePreview(), 100);
  };

  const applyTemplate = (tpl) => {
    setFormData(prev => ({
      ...prev,
      name: prev.name || tpl.name,
      type: tpl.type || 'custom',
      messageTemplate: tpl.message,
      targetFilters: { ...prev.targetFilters, ...tpl.targetFilters }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (!formData.name.trim() || !formData.messageTemplate.trim()) {
      setError('Nom et message requis');
      setLoading(false);
      return;
    }
    try {
      const payload = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        scheduledAt: formData.scheduledAt || null
      };
      if (isEdit) {
        await ecomApi.put(`/campaigns/${id}`, payload);
      } else {
        await ecomApi.post('/campaigns', payload);
      }
      navigate('/ecom/campaigns');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur enregistrement');
    } finally { setLoading(false); }
  };

  const updateFilter = (key, value) => {
    setFormData(prev => ({ ...prev, targetFilters: { ...prev.targetFilters, [key]: value } }));
  };

  const renderPreviewMessage = () => {
    if (!formData.messageTemplate) return '';
    return formData.messageTemplate
      .replace(/\{firstName\}/g, 'Aminata')
      .replace(/\{lastName\}/g, 'Koné')
      .replace(/\{fullName\}/g, 'Aminata Koné')
      .replace(/\{phone\}/g, '+225 07 00 00 00')
      .replace(/\{city\}/g, 'Abidjan')
      .replace(/\{product\}/g, 'Crème visage')
      .replace(/\{totalOrders\}/g, '3')
      .replace(/\{totalSpent\}/g, '45000');
  };

  const variables = [
    { var: '{firstName}', label: 'Prénom' },
    { var: '{lastName}', label: 'Nom' },
    { var: '{fullName}', label: 'Nom complet' },
    { var: '{city}', label: 'Ville' },
    { var: '{product}', label: 'Produits' },
    { var: '{totalOrders}', label: 'Nb commandes' },
    { var: '{totalSpent}', label: 'Total dépensé' }
  ];

  const insertVariable = (v) => {
    setFormData(prev => ({ ...prev, messageTemplate: prev.messageTemplate + v }));
  };

  if (fetchLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  const inputClass = "block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="p-3 sm:p-4 lg:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{isEdit ? 'Modifier la campagne' : 'Nouvelle campagne'}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Créez une campagne de relance WhatsApp personnalisée</p>
        </div>
        <button onClick={() => navigate('/ecom/campaigns')} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition">Annuler</button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>}

        {/* Templates rapides */}
        {!isEdit && templates.length > 0 && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-100">
            <p className="text-sm font-semibold text-gray-800 mb-2">Templates rapides</p>
            <div className="flex flex-wrap gap-2">
              {templates.map(tpl => (
                <button key={tpl.id} type="button" onClick={() => applyTemplate(tpl)}
                  className="px-3 py-1.5 bg-white text-xs font-medium text-purple-700 rounded-lg border border-purple-200 hover:bg-purple-50 transition">
                  {tpl.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Infos de base */}
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Informations</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Nom de la campagne *</label>
              <input type="text" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} className={inputClass} placeholder="Ex: Relance clients janvier" />
            </div>
            <div>
              <label className={labelClass}>Type</label>
              <select value={formData.type} onChange={e => setFormData(p => ({ ...p, type: e.target.value }))} className={inputClass}>
                <option value="custom">Personnalisée</option>
                <option value="relance_pending">Relance en attente</option>
                <option value="relance_cancelled">Relance annulés</option>
                <option value="promo">Promotion</option>
                <option value="followup">Suivi livraison</option>
              </select>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 mt-3">
            <div>
              <label className={labelClass}>Tags (séparés par virgules)</label>
              <input type="text" value={formData.tags} onChange={e => setFormData(p => ({ ...p, tags: e.target.value }))} className={inputClass} placeholder="relance, janvier, promo..." />
            </div>
            <div>
              <label className={labelClass}>Programmer l'envoi</label>
              <input type="datetime-local" value={formData.scheduledAt} onChange={e => setFormData(p => ({ ...p, scheduledAt: e.target.value }))} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Ciblage */}
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">Ciblage des clients</h2>
            <button type="button" onClick={handlePreview} disabled={previewLoading}
              className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-xs font-medium disabled:opacity-50 flex items-center gap-1">
              {previewLoading ? <><svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Chargement...</> : <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg> Prévisualiser</>}
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-medium text-gray-500 mb-1">Statut client</label>
              <select value={formData.targetFilters.clientStatus} onChange={e => updateFilter('clientStatus', e.target.value)} className={inputClass}>
                <option value="">Tous</option>
                <option value="prospect">Prospect</option>
                <option value="confirmed">Confirmé</option>
                <option value="delivered">Livré (Client)</option>
                <option value="returned">Retour</option>
                <option value="blocked">Bloqué</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-500 mb-1">Ville</label>
              <input type="text" value={formData.targetFilters.city} onChange={e => updateFilter('city', e.target.value)} className={inputClass} placeholder="Ex: Abidjan" />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-500 mb-1">Produit</label>
              <input type="text" value={formData.targetFilters.product} onChange={e => updateFilter('product', e.target.value)} className={inputClass} placeholder="Ex: Crème" />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-500 mb-1">Tag</label>
              <input type="text" value={formData.targetFilters.tag} onChange={e => updateFilter('tag', e.target.value)} className={inputClass} placeholder="Ex: Client" />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-500 mb-1">Min commandes</label>
              <input type="number" min="0" value={formData.targetFilters.minOrders} onChange={e => updateFilter('minOrders', parseInt(e.target.value) || 0)} className={inputClass} />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-500 mb-1">Max commandes</label>
              <input type="number" min="0" value={formData.targetFilters.maxOrders} onChange={e => updateFilter('maxOrders', parseInt(e.target.value) || 0)} className={inputClass} />
            </div>
          </div>

          {/* Quick filter buttons */}
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-100">
            <span className="text-[10px] text-gray-400 font-medium self-center mr-1">Filtres rapides :</span>
            {[{ tag: 'Client', label: 'Clients livrés', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
              { tag: 'En attente', label: 'En attente', color: 'bg-amber-50 text-amber-700 border-amber-200' },
              { tag: 'Annulé', label: 'Annulés / Retours', color: 'bg-red-50 text-red-700 border-red-200' },
              { tag: 'Confirmé', label: 'Confirmés', color: 'bg-blue-50 text-blue-700 border-blue-200' }
            ].map(f => (
              <button key={f.tag} type="button" onClick={() => quickFilter(f.tag)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border transition hover:opacity-80 ${f.color}`}>
                {f.label}
              </button>
            ))}
            <button type="button" onClick={() => { updateFilter('clientStatus', ''); updateFilter('tag', ''); setTimeout(() => handlePreview(), 100); }}
              className="px-2.5 py-1 rounded-lg text-[10px] font-medium border bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 transition">
              Tous
            </button>
          </div>

          {/* Preview results */}
          {preview && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={selectedClients.size === preview.clients.length && preview.clients.length > 0} onChange={toggleAll}
                      className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm font-semibold text-indigo-700">{selectedClients.size}/{preview.count} sélectionné{selectedClients.size > 1 ? 's' : ''}</span>
                  </label>
                </div>
                <div className="flex items-center gap-1.5">
                  <button type="button" onClick={() => setShowPhoneList(!showPhoneList)}
                    className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-[10px] font-medium hover:bg-gray-200 transition">
                    {showPhoneList ? 'Masquer' : 'Voir'} numéros
                  </button>
                  <button type="button" onClick={copyPhones}
                    className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-[10px] font-medium hover:bg-blue-200 transition">
                    {copied ? 'Copié !' : 'Copier numéros'}
                  </button>
                </div>
              </div>

              {/* Client list with checkboxes */}
              <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
                {preview.clients.map(c => (
                  <label key={c._id} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer transition text-xs ${selectedClients.has(c._id) ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-transparent hover:bg-gray-100'}`}>
                    <input type="checkbox" checked={selectedClients.has(c._id)} onChange={() => toggleClient(c._id)}
                      className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0" />
                    <span className="font-medium text-gray-800 min-w-[100px]">{c.firstName} {c.lastName}</span>
                    <span className="text-gray-500 font-mono">{c.phone}</span>
                    {c.city && <span className="text-gray-400">· {c.city}</span>}
                    {(c.tags || []).map(t => (
                      <span key={t} className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                        t === 'Client' ? 'bg-emerald-100 text-emerald-700' :
                        t === 'En attente' ? 'bg-amber-100 text-amber-700' :
                        t === 'Annulé' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>{t}</span>
                    ))}
                    {(c.products || []).length > 0 && <span className="text-[9px] text-indigo-500">{(c.products || []).join(', ')}</span>}
                  </label>
                ))}
              </div>

              {/* Phone list */}
              {showPhoneList && selectedClients.size > 0 && (
                <div className="mt-2 p-2.5 bg-gray-900 rounded-lg">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-gray-400 font-medium">{getSelectedPhones().length} numéros</span>
                    <button type="button" onClick={copyPhones} className="text-[10px] text-blue-400 hover:text-blue-300 font-medium">{copied ? 'Copié !' : 'Copier tout'}</button>
                  </div>
                  <div className="text-xs text-green-400 font-mono max-h-32 overflow-y-auto whitespace-pre-wrap">
                    {getSelectedPhones().join('\n')}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Message template */}
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Message WhatsApp</h2>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {variables.map(v => (
              <button key={v.var} type="button" onClick={() => insertVariable(v.var)}
                className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-[10px] font-medium hover:bg-blue-100 transition">
                {v.label} <code className="ml-0.5 text-blue-500">{v.var}</code>
              </button>
            ))}
          </div>
          <textarea
            rows={6}
            value={formData.messageTemplate}
            onChange={e => setFormData(p => ({ ...p, messageTemplate: e.target.value }))}
            className={inputClass}
            placeholder="Bonjour {firstName} 👋&#10;&#10;Votre message personnalisé ici..."
          />
          {formData.messageTemplate && (
            <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-[10px] font-semibold text-green-700 uppercase mb-1.5">Aperçu du message</p>
              <div className="bg-white rounded-lg p-3 text-sm text-gray-800 whitespace-pre-wrap shadow-sm border border-green-100">
                {renderPreviewMessage()}
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button type="submit" disabled={loading}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium disabled:opacity-50">
            {loading ? 'Enregistrement...' : (isEdit ? 'Enregistrer les modifications' : 'Créer la campagne')}
          </button>
          <button type="button" onClick={() => navigate('/ecom/campaigns')}
            className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium">
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
};

export default CampaignForm;

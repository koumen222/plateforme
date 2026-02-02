import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const STATUS_COLORS = {
  sent: 'bg-blue-100 text-blue-800',
  delivered: 'bg-green-100 text-green-800',
  opened: 'bg-yellow-100 text-yellow-800',
  clicked: 'bg-purple-100 text-purple-800',
  failed: 'bg-red-100 text-red-800',
  bounced: 'bg-orange-100 text-orange-800',
  spam: 'bg-red-200 text-red-900',
  pending: 'bg-gray-100 text-gray-800',
  unsubscribed: 'bg-slate-100 text-slate-800',
  complained: 'bg-pink-100 text-pink-800'
};

const STATUS_LABELS = {
  sent: 'Envoyé',
  delivered: 'Livré',
  opened: 'Ouvert',
  clicked: 'Cliqué',
  failed: 'Échec',
  bounced: 'Rebondi',
  spam: 'Spam',
  pending: 'En attente',
  unsubscribed: 'Désabonné',
  complained: 'Plainte'
};

export default function AdminEmailLogsPage() {
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    email: '',
    campaignId: '',
    page: 1,
    limit: 50
  });
  const [pagination, setPagination] = useState({});
  const [selectedLogs, setSelectedLogs] = useState([]);
  const [resending, setResending] = useState(false);
  const [campaigns, setCampaigns] = useState([]);

  useEffect(() => {
    fetchLogs();
    fetchStats();
    fetchCampaigns();
  }, [filters.page, filters.status, filters.campaignId]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.email) queryParams.append('email', filters.email);
      if (filters.campaignId) queryParams.append('campaignId', filters.campaignId);
      queryParams.append('page', filters.page);
      queryParams.append('limit', filters.limit);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/email-logs?${queryParams}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) throw new Error('Erreur lors de la récupération des logs');

      const data = await response.json();
      setLogs(data.logs || []);
      setPagination(data.pagination || {});
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/email-logs/stats`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) throw new Error('Erreur lors de la récupération des stats');

      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      console.error('Erreur stats:', error);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/email-campaigns`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) throw new Error('Erreur lors de la récupération des campagnes');

      const data = await response.json();
      setCampaigns(data.campaigns || []);
    } catch (error) {
      console.error('Erreur campagnes:', error);
    }
  };

  const handleResendFailed = async (campaignId) => {
    if (!confirm('Voulez-vous renvoyer les emails en échec de cette campagne ?')) return;
    
    setResending(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/email-logs/resend`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ campaignId, maxAge: 24, limit: 100 })
        }
      );

      if (!response.ok) throw new Error('Erreur lors du renvoi');

      const data = await response.json();
      alert(data.message);
      fetchLogs();
      fetchStats();
    } catch (error) {
      console.error('Erreur renvoi:', error);
      alert('Erreur lors du renvoi: ' + error.message);
    } finally {
      setResending(false);
    }
  };

  const handleResendSingle = async (logId) => {
    if (!confirm('Voulez-vous renvoyer cet email ?')) return;
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/email-logs/${logId}/resend-single`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!response.ok) throw new Error('Erreur lors du renvoi');

      const data = await response.json();
      alert(data.message);
      fetchLogs();
    } catch (error) {
      console.error('Erreur renvoi:', error);
      alert('Erreur lors du renvoi: ' + error.message);
    }
  };

  const handleMarkAsSpam = async (logId) => {
    if (!confirm('Marquer cet email comme spam ?')) return;
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/email-logs/${logId}/mark-spam`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!response.ok) throw new Error('Erreur lors du marquage');

      fetchLogs();
      fetchStats();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur: ' + error.message);
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('fr-FR');
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Tracking des Emails</h1>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg shadow">
            <p className="text-sm text-green-600">Envoyés</p>
            <p className="text-2xl font-bold text-green-700">{stats.sent}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg shadow">
            <p className="text-sm text-blue-600">Ouverts</p>
            <p className="text-2xl font-bold text-blue-700">{stats.opened}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg shadow">
            <p className="text-sm text-purple-600">Cliqués</p>
            <p className="text-2xl font-bold text-purple-700">{stats.clicked}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg shadow">
            <p className="text-sm text-red-600">Échecs</p>
            <p className="text-2xl font-bold text-red-700">{stats.failed + stats.bounced}</p>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
              className="border rounded px-3 py-2"
            >
              <option value="">Tous</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Campagne</label>
            <select
              value={filters.campaignId}
              onChange={(e) => setFilters({ ...filters, campaignId: e.target.value, page: 1 })}
              className="border rounded px-3 py-2"
            >
              <option value="">Toutes</option>
              {campaigns.map(campaign => (
                <option key={campaign._id} value={campaign._id}>{campaign.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="text"
              value={filters.email}
              onChange={(e) => setFilters({ ...filters, email: e.target.value })}
              placeholder="Rechercher..."
              className="border rounded px-3 py-2"
            />
          </div>
          <button
            onClick={fetchLogs}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Rechercher
          </button>
          {filters.campaignId && (
            <button
              onClick={() => handleResendFailed(filters.campaignId)}
              disabled={resending}
              className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 disabled:opacity-50"
            >
              {resending ? 'Renvoi...' : 'Renvoyer les échecs'}
            </button>
          )}
        </div>
      </div>

      {/* Tableau des logs */}
      {loading ? (
        <div className="text-center py-8">Chargement...</div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campagne</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Envoyé le</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ouvert le</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{log.email}</div>
                      {log.subscriberId?.name && (
                        <div className="text-xs text-gray-500">{log.subscriberId.name}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">{log.campaignId?.name || '-'}</div>
                      <div className="text-xs text-gray-500">{log.campaignId?.subject || ''}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[log.status] || 'bg-gray-100'}`}>
                        {STATUS_LABELS[log.status] || log.status}
                      </span>
                      {log.error && (
                        <div className="text-xs text-red-600 mt-1" title={log.error}>
                          {log.error.substring(0, 50)}...
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(log.sentAt)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(log.openedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {(log.status === 'failed' || log.status === 'bounced' || log.status === 'pending') && (
                          <button
                            onClick={() => handleResendSingle(log._id)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                            title="Renvoyer"
                          >
                            🔄
                          </button>
                        )}
                        <button
                          onClick={() => handleMarkAsSpam(log._id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                          title="Marquer comme spam"
                        >
                          🚫
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                disabled={filters.page === 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Précédent
              </button>
              <span className="px-3 py-1">
                Page {pagination.page} / {pagination.pages}
              </span>
              <button
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                disabled={filters.page === pagination.pages}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

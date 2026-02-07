import React, { useState, useEffect } from 'react';
import { useEcomAuth } from '../hooks/useEcomAuth';
import ecomApi from '../services/ecommApi.js';

const roleLabels = {
  super_admin: 'Super Admin',
  ecom_admin: 'Admin',
  ecom_closeuse: 'Closeuse',
  ecom_compta: 'Comptable',
  ecom_livreur: 'Livreur'
};

const roleColors = {
  super_admin: 'bg-red-100 text-red-800',
  ecom_admin: 'bg-purple-100 text-purple-800',
  ecom_closeuse: 'bg-blue-100 text-blue-800',
  ecom_compta: 'bg-green-100 text-green-800',
  ecom_livreur: 'bg-orange-100 text-orange-800'
};

const SuperAdminDashboard = () => {
  const { user: currentUser } = useEcomAuth();
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterWorkspace, setFilterWorkspace] = useState('');

  const fetchUsers = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (filterRole) params.role = filterRole;
      if (filterWorkspace) params.workspaceId = filterWorkspace;

      const res = await ecomApi.get('/super-admin/users', { params });
      setUsers(res.data.data.users);
      setStats(res.data.data.stats);
    } catch (err) {
      setError('Erreur chargement utilisateurs');
    }
  };

  const fetchWorkspaces = async () => {
    try {
      const res = await ecomApi.get('/super-admin/workspaces');
      setWorkspaces(res.data.data.workspaces);
    } catch (err) {
      setError('Erreur chargement espaces');
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchUsers(), fetchWorkspaces()]);
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (!loading) fetchUsers();
  }, [search, filterRole, filterWorkspace]);

  const handleToggleUser = async (userId) => {
    try {
      const res = await ecomApi.put(`/super-admin/users/${userId}/toggle`);
      setSuccess(res.data.message);
      fetchUsers();
    } catch (err) {
      setError('Erreur modification utilisateur');
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      const res = await ecomApi.put(`/super-admin/users/${userId}/role`, { role: newRole });
      setSuccess(res.data.message);
      fetchUsers();
    } catch (err) {
      setError('Erreur changement de rôle');
    }
  };

  const handleDeleteUser = async (userId, email) => {
    if (!confirm(`Supprimer définitivement ${email} ?`)) return;
    try {
      await ecomApi.delete(`/super-admin/users/${userId}`);
      setSuccess('Utilisateur supprimé');
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur suppression');
    }
  };

  const handleToggleWorkspace = async (wsId) => {
    try {
      const res = await ecomApi.put(`/super-admin/workspaces/${wsId}/toggle`);
      setSuccess(res.data.message);
      fetchWorkspaces();
    } catch (err) {
      setError('Erreur modification espace');
    }
  };

  useEffect(() => {
    if (success) { const t = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(t); }
  }, [success]);
  useEffect(() => {
    if (error) { const t = setTimeout(() => setError(''), 4000); return () => clearTimeout(t); }
  }, [error]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const getRoleStat = (role) => {
    const found = stats.byRole?.find(s => s._id === role);
    return found?.count || 0;
  };

  return (
    <div className="p-3 sm:p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Messages */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-800 rounded-lg text-sm border border-green-200">{success}</div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-lg text-sm border border-red-200">{error}</div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Super Administration</h1>
        <p className="text-sm text-gray-500 mt-1">Vue globale de tous les espaces et utilisateurs</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3 mb-6">
        <div className="bg-white rounded-lg shadow p-3 text-center">
          <p className="text-2xl font-bold text-gray-900">{stats.totalUsers || 0}</p>
          <p className="text-[10px] text-gray-500 uppercase font-medium mt-1">Total</p>
        </div>
        <div className="bg-white rounded-lg shadow p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{stats.totalActive || 0}</p>
          <p className="text-[10px] text-gray-500 uppercase font-medium mt-1">Actifs</p>
        </div>
        <div className="bg-white rounded-lg shadow p-3 text-center">
          <p className="text-2xl font-bold text-red-600">{getRoleStat('super_admin')}</p>
          <p className="text-[10px] text-gray-500 uppercase font-medium mt-1">Super Admin</p>
        </div>
        <div className="bg-white rounded-lg shadow p-3 text-center">
          <p className="text-2xl font-bold text-purple-600">{getRoleStat('ecom_admin')}</p>
          <p className="text-[10px] text-gray-500 uppercase font-medium mt-1">Admins</p>
        </div>
        <div className="bg-white rounded-lg shadow p-3 text-center">
          <p className="text-2xl font-bold text-blue-600">{getRoleStat('ecom_closeuse')}</p>
          <p className="text-[10px] text-gray-500 uppercase font-medium mt-1">Closeuses</p>
        </div>
        <div className="bg-white rounded-lg shadow p-3 text-center">
          <p className="text-2xl font-bold text-emerald-600">{getRoleStat('ecom_compta')}</p>
          <p className="text-[10px] text-gray-500 uppercase font-medium mt-1">Comptables</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-lg bg-gray-100 p-1 mb-4 max-w-xs">
        <button
          onClick={() => setTab('users')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition ${
            tab === 'users' ? 'bg-white text-red-700 shadow-sm' : 'text-gray-500'
          }`}
        >
          Utilisateurs
        </button>
        <button
          onClick={() => setTab('workspaces')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition ${
            tab === 'workspaces' ? 'bg-white text-red-700 shadow-sm' : 'text-gray-500'
          }`}
        >
          Espaces
        </button>
      </div>

      {/* Users Tab */}
      {tab === 'users' && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            <input
              type="text"
              placeholder="Rechercher par email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-[180px] px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Tous les rôles</option>
              <option value="super_admin">Super Admin</option>
              <option value="ecom_admin">Admin</option>
              <option value="ecom_closeuse">Closeuse</option>
              <option value="ecom_compta">Comptable</option>
            </select>
            <select
              value={filterWorkspace}
              onChange={(e) => setFilterWorkspace(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Tous les espaces</option>
              {workspaces.map(ws => (
                <option key={ws._id} value={ws._id}>{ws.name}</option>
              ))}
            </select>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rôle</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Espace</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Statut</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Dernière connexion</th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-3 py-8 text-center text-gray-400 text-sm">Aucun utilisateur trouvé</td>
                    </tr>
                  ) : (
                    users.map(u => (
                      <tr key={u._id} className={`hover:bg-gray-50 ${!u.isActive ? 'opacity-50' : ''}`}>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                              {u.email?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 truncate max-w-[150px] sm:max-w-none">{u.email}</p>
                              <p className="text-[10px] text-gray-400 sm:hidden">
                                {u.workspaceId?.name || 'Sans espace'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <select
                            value={u.role}
                            onChange={(e) => handleChangeRole(u._id, e.target.value)}
                            disabled={u._id === currentUser?.id}
                            className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${roleColors[u.role]} disabled:cursor-not-allowed`}
                          >
                            <option value="super_admin">Super Admin</option>
                            <option value="ecom_admin">Admin</option>
                            <option value="ecom_closeuse">Closeuse</option>
                            <option value="ecom_compta">Comptable</option>
                            <option value="ecom_livreur">Livreur</option>
                          </select>
                        </td>
                        <td className="px-3 py-3 hidden sm:table-cell">
                          <span className="text-sm text-gray-600 truncate max-w-[120px] block">
                            {u.workspaceId?.name || <span className="text-gray-400 italic">Sans espace</span>}
                          </span>
                        </td>
                        <td className="px-3 py-3 hidden md:table-cell">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium ${u.isActive ? 'text-green-600' : 'text-red-500'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-green-500' : 'bg-red-400'}`}></span>
                            {u.isActive ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td className="px-3 py-3 hidden lg:table-cell">
                          <span className="text-xs text-gray-500">
                            {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Jamais'}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleToggleUser(u._id)}
                              disabled={u._id === currentUser?.id}
                              className={`px-2 py-1 text-xs rounded-md font-medium transition disabled:opacity-30 ${
                                u.isActive
                                  ? 'text-orange-700 bg-orange-50 hover:bg-orange-100'
                                  : 'text-green-700 bg-green-50 hover:bg-green-100'
                              }`}
                              title={u.isActive ? 'Désactiver' : 'Activer'}
                            >
                              {u.isActive ? 'Désactiver' : 'Activer'}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u._id, u.email)}
                              disabled={u._id === currentUser?.id}
                              className="px-2 py-1 text-xs rounded-md font-medium text-red-700 bg-red-50 hover:bg-red-100 transition disabled:opacity-30"
                              title="Supprimer"
                            >
                              Suppr.
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Workspaces Tab */}
      {tab === 'workspaces' && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-400">Aucun espace créé</div>
          ) : (
            workspaces.map(ws => (
              <div key={ws._id} className={`bg-white rounded-lg shadow p-4 border-l-4 ${ws.isActive ? 'border-green-500' : 'border-red-400'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{ws.name}</h3>
                    <p className="text-xs text-gray-400">{ws.slug}</p>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${ws.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {ws.isActive ? 'Actif' : 'Inactif'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-gray-50 rounded p-2 text-center">
                    <p className="text-lg font-bold text-gray-900">{ws.memberCount}</p>
                    <p className="text-[10px] text-gray-500">Membres</p>
                  </div>
                  <div className="bg-gray-50 rounded p-2 text-center">
                    <p className="text-xs font-mono text-gray-700 truncate">{ws.inviteCode}</p>
                    <p className="text-[10px] text-gray-500">Code invite</p>
                  </div>
                </div>

                <div className="text-xs text-gray-500 mb-3">
                  <span className="font-medium">Owner:</span> {ws.owner?.email || 'N/A'}
                </div>
                <div className="text-xs text-gray-400 mb-3">
                  Créé le {new Date(ws.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleWorkspace(ws._id)}
                    className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                      ws.isActive
                        ? 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                    }`}
                  >
                    {ws.isActive ? 'Désactiver' : 'Activer'}
                  </button>
                  <button
                    onClick={() => { setFilterWorkspace(ws._id); setTab('users'); }}
                    className="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                  >
                    Voir membres
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;

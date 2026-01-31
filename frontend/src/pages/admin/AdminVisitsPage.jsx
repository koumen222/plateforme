import { useState, useEffect } from 'react';
import { CONFIG } from '../../config/config.js';
import { useAuth } from '../../contexts/AuthContext';
import { FiGlobe, FiTrendingUp, FiUsers, FiCalendar, FiRefreshCw } from 'react-icons/fi';

export default function AdminVisitsPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');
  const [recentVisits, setRecentVisits] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/visits/stats?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erreur récupération statistiques');
      }

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentVisits = async () => {
    try {
      setLoadingRecent(true);
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/visits/recent?limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erreur récupération visites récentes');
      }

      const data = await response.json();
      setRecentVisits(data.visits || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoadingRecent(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchRecentVisits();
  }, [period, token]);

  const getCountryFlag = (countryCode) => {
    if (!countryCode) return '🌍';
    // Convertir le code pays en emoji drapeau
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <FiRefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-accent" />
          <p className="text-secondary">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Comment vérifier que le tracking fonctionne */}
      <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 text-sm">
        <p className="font-semibold text-primary mb-2">Comment vérifier que les visites sont trackées ?</p>
        <ul className="list-disc list-inside text-secondary space-y-1">
          <li>Ouvrez le site dans un autre onglet ou navigateur (ou en navigation privée) et naviguez sur une page.</li>
          <li>Attendez 1 à 2 secondes puis actualisez cette page admin : une nouvelle ligne doit apparaître dans « Visites récentes ».</li>
          <li>En dev : ouvrez la console (F12) et cherchez le message <code className="bg-secondary px-1 rounded">✅ Visite enregistrée</code>.</li>
          <li>Si vous voyez des données dans « Top Pays » et « Visites récentes », le tracking fonctionne.</li>
        </ul>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
            <FiGlobe className="w-8 h-8 text-accent" />
            Statistiques des Visites
          </h1>
          <p className="text-secondary mt-2">Suivi des visites par pays et région</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-theme rounded-xl bg-card text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="7">7 derniers jours</option>
            <option value="30">30 derniers jours</option>
            <option value="90">90 derniers jours</option>
            <option value="365">1 an</option>
          </select>
          <button
            onClick={fetchStats}
            className="px-4 py-2 bg-accent text-white rounded-xl hover:bg-accent/90 transition-colors flex items-center gap-2"
          >
            <FiRefreshCw className="w-4 h-4" />
            Actualiser
          </button>
        </div>
      </div>

      {/* Statistiques globales */}
      {stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card border border-theme rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-secondary text-sm font-medium">Total Visites</p>
                  <p className="text-3xl font-bold text-primary mt-2">{stats.totalVisits?.toLocaleString() || 0}</p>
                </div>
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                  <FiTrendingUp className="w-6 h-6 text-accent" />
                </div>
              </div>
            </div>

            <div className="bg-card border border-theme rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-secondary text-sm font-medium">Visiteurs Uniques</p>
                  <p className="text-3xl font-bold text-primary mt-2">{stats.uniqueVisitors?.toLocaleString() || 0}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                  <FiUsers className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </div>

            <div className="bg-card border border-theme rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-secondary text-sm font-medium">Pays</p>
                  <p className="text-3xl font-bold text-primary mt-2">{stats.statsByCountry?.length || 0}</p>
                </div>
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                  <FiGlobe className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Top Pays */}
          <div className="bg-card border border-theme rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
              <FiGlobe className="w-5 h-5 text-accent" />
              Top Pays ({period} derniers jours)
            </h2>
            {stats.statsByCountry && stats.statsByCountry.length > 0 ? (
              <div className="space-y-4">
                {stats.statsByCountry.map((country, index) => (
                  <div
                    key={country.country}
                    className="flex items-center justify-between p-4 bg-secondary rounded-xl hover:bg-secondary/80 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-2xl">{getCountryFlag(country.countryCode)}</div>
                      <div>
                        <p className="font-semibold text-primary">{country.country}</p>
                        <p className="text-sm text-secondary">
                          {country.uniqueVisitors} visiteurs uniques
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-accent">{country.visits.toLocaleString()}</p>
                      <p className="text-xs text-secondary">visites</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-secondary text-center py-8">Aucune visite enregistrée</p>
            )}
          </div>

          {/* Visites récentes */}
          <div className="bg-card border border-theme rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                <FiCalendar className="w-5 h-5 text-accent" />
                Visites Récentes
              </h2>
              <button
                onClick={fetchRecentVisits}
                disabled={loadingRecent}
                className="px-3 py-1 text-sm bg-secondary hover:bg-secondary/80 rounded-lg transition-colors flex items-center gap-2"
              >
                <FiRefreshCw className={`w-4 h-4 ${loadingRecent ? 'animate-spin' : ''}`} />
                Actualiser
              </button>
            </div>
            {loadingRecent ? (
              <div className="text-center py-8">
                <FiRefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-accent" />
                <p className="text-secondary">Chargement...</p>
              </div>
            ) : recentVisits.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-theme">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-secondary">Pays</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-secondary">Ville</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-secondary">Page</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-secondary">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentVisits.map((visit, index) => (
                      <tr key={index} className="border-b border-theme/50 hover:bg-secondary/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{getCountryFlag(visit.countryCode)}</span>
                            <span className="text-primary">{visit.country}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-secondary">{visit.city || '-'}</td>
                        <td className="py-3 px-4">
                          <span className="text-primary font-mono text-sm">{visit.path || '/'}</span>
                        </td>
                        <td className="py-3 px-4 text-secondary text-sm">
                          {new Date(visit.createdAt).toLocaleString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-secondary text-center py-8">Aucune visite récente</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

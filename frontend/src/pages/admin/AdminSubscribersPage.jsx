import { useState, useEffect } from 'react'
import { CONFIG } from '../../config/config'
import { useAuth } from '../../contexts/AuthContext'

export default function AdminSubscribersPage() {
  const { token } = useAuth()
  const [subscribers, setSubscribers] = useState([])
  const [allSubscribers, setAllSubscribers] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [userStatusFilter, setUserStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [stats, setStats] = useState(null)
  const [notification, setNotification] = useState(null)
  const [showImport, setShowImport] = useState(false)
  const [importEmails, setImportEmails] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [syncResults, setSyncResults] = useState(null)

  useEffect(() => {
    if (token) {
      fetchSubscribers()
      fetchStats()
    }
  }, [token, statusFilter, userStatusFilter, search, page])

  useEffect(() => {
    // Filtrer les abonnés selon les filtres
    let filtered = allSubscribers

    // Filtre statut newsletter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(sub => sub.status === statusFilter)
    }

    // Filtre statut utilisateur plateforme
    if (userStatusFilter !== 'all') {
      filtered = filtered.filter(sub => {
        const userStatus = sub.userStatus || sub.userAccountStatus
        return userStatus === userStatusFilter
      })
    }

    // Filtre recherche
    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(sub => 
        sub.email.toLowerCase().includes(searchLower) ||
        (sub.name && sub.name.toLowerCase().includes(searchLower)) ||
        (sub.userPhone && sub.userPhone.toLowerCase().includes(searchLower))
      )
    }

    setSubscribers(filtered)
  }, [allSubscribers, statusFilter, userStatusFilter, search])

  const fetchSubscribers = async () => {
    if (!token) return
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '10000'
      })
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (search) params.append('search', search)

      const response = await fetch(`${CONFIG.BACKEND_URL}/api/subscribers?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setAllSubscribers(data.subscribers || [])
      }
    } catch (error) {
      showNotification('Erreur chargement abonnés', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    if (!token) return
    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/subscribers/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Erreur stats:', error)
    }
  }

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const handleImport = async () => {
    const emails = importEmails.split('\n').map(e => e.trim()).filter(e => e)
    if (emails.length === 0) {
      showNotification('Aucun email à importer', 'error')
      return
    }

    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/subscribers/import`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ emails })
      })

      if (response.ok) {
        const data = await response.json()
        showNotification(`Import: ${data.results.success} réussis, ${data.results.failed} échoués`)
        setShowImport(false)
        setImportEmails('')
        fetchSubscribers()
        fetchStats()
      }
    } catch (error) {
      showNotification('Erreur import', 'error')
    }
  }

  const handleSyncAllUsers = async () => {
    if (!confirm('Synchroniser tous les utilisateurs existants avec les abonnés ?\n\nCela va transformer tous les utilisateurs en abonnés à la newsletter.')) return
    
    setSyncing(true)
    setSyncResults(null)
    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/subscribers/sync-all-users`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('📊 Résultats synchronisation:', data)
        console.log('📧 Emails créés:', data.emails?.created)
        console.log('📧 Emails mis à jour:', data.emails?.updated)
        console.log('📧 Emails ignorés:', data.emails?.skipped)
        setSyncResults(data)
        showNotification(`Synchronisation terminée: ${data.results.created} créés, ${data.results.updated} mis à jour, ${data.results.skipped} ignorés`)
        fetchSubscribers()
        fetchStats()
      } else {
        const errorData = await response.json()
        console.error('❌ Erreur synchronisation:', errorData)
        showNotification(errorData.error || errorData.details || 'Erreur synchronisation', 'error')
      }
    } catch (error) {
      showNotification('Erreur synchronisation', 'error')
    } finally {
      setSyncing(false)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  if (loading && !subscribers.length) {
    return (
      <div className="admin-comments-page">
        <div className="admin-loading">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="admin-comments-page">
      {notification && (
        <div className={`admin-notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      <div className="admin-page-header">
        <div>
          <h1>📧 Abonnés Newsletter</h1>
          <p>Gestion des abonnés et statistiques</p>
        </div>
        <div className="admin-comments-stats">
          <div className="admin-stat-mini">
            <span className="admin-stat-mini-label">Total</span>
            <span className="admin-stat-mini-value">{allSubscribers.length}</span>
          </div>
          <div className="admin-stat-mini">
            <span className="admin-stat-mini-label">En attente</span>
            <span className="admin-stat-mini-value">
              {allSubscribers.filter(s => (s.userStatus || s.userAccountStatus) === 'pending').length}
            </span>
          </div>
          <div className="admin-stat-mini">
            <span className="admin-stat-mini-label">Actifs</span>
            <span className="admin-stat-mini-value">
              {allSubscribers.filter(s => (s.userStatus || s.userAccountStatus) === 'active').length}
            </span>
          </div>
          <div className="admin-stat-mini">
            <span className="admin-stat-mini-label">Inactifs</span>
            <span className="admin-stat-mini-value">
              {allSubscribers.filter(s => (s.userStatus || s.userAccountStatus) === 'blocked').length}
            </span>
          </div>
        </div>
      </div>

      <div className="admin-filter-bar" style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Rechercher par email ou nom..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ddd', minWidth: '300px' }}
        />
        <button
          onClick={() => setShowImport(!showImport)}
          className="admin-btn"
          style={{ backgroundColor: '#10b981', color: 'white' }}
        >
          📥 Importer
        </button>
        <button
          onClick={handleSyncAllUsers}
          disabled={syncing}
          className="admin-btn"
          style={{ 
            backgroundColor: syncing ? '#ccc' : '#6366f1', 
            color: 'white' 
          }}
        >
          {syncing ? '⏳ Synchronisation...' : '🔄 Synchroniser tous les utilisateurs'}
        </button>
      </div>

      {showImport && (
        <div style={{ marginBottom: '20px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '10px' }}>Importer des emails</h3>
          <textarea
            value={importEmails}
            onChange={(e) => setImportEmails(e.target.value)}
            placeholder="Un email par ligne"
            rows="5"
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', marginBottom: '10px' }}
          />
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleImport} className="admin-btn admin-btn-success">Importer</button>
            <button onClick={() => { setShowImport(false); setImportEmails(''); }} className="admin-btn">Annuler</button>
          </div>
        </div>
      )}

      {syncResults && (
        <div style={{ marginBottom: '20px', padding: '20px', backgroundColor: '#e7f3ff', borderRadius: '8px', border: '1px solid #b3d9ff' }}>
          <h3 style={{ marginBottom: '16px', color: '#004085' }}>📊 Résultats de la synchronisation</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '6px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>{syncResults.results.created}</div>
              <div style={{ fontSize: '12px', color: '#6c757d' }}>Créés</div>
            </div>
            <div style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '6px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#6366f1' }}>{syncResults.results.updated}</div>
              <div style={{ fontSize: '12px', color: '#6c757d' }}>Mis à jour</div>
            </div>
            <div style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '6px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#6c757d' }}>{syncResults.results.skipped}</div>
              <div style={{ fontSize: '12px', color: '#6c757d' }}>Ignorés</div>
            </div>
            <div style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '6px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#004085' }}>{syncResults.results.total}</div>
              <div style={{ fontSize: '12px', color: '#6c757d' }}>Total</div>
            </div>
          </div>

          {syncResults.emails?.created && syncResults.emails.created.length > 0 && (
            <details style={{ marginBottom: '16px' }} open>
              <summary style={{ cursor: 'pointer', fontWeight: '600', color: '#10b981', marginBottom: '8px', fontSize: '15px' }}>
                ✅ {syncResults.emails.created.length} email(s) créé(s) - Cliquez pour voir les détails
              </summary>
              <div style={{ maxHeight: '300px', overflowY: 'auto', backgroundColor: '#fff', padding: '12px', borderRadius: '6px', fontSize: '13px', marginTop: '8px' }}>
                {syncResults.emails.created.map((item, index) => (
                  <div key={index} style={{ padding: '8px 0', borderBottom: index < syncResults.emails.created.length - 1 ? '1px solid #e9ecef' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ minWidth: '200px' }}>
                        <strong style={{ color: '#212529', display: 'block' }}>{item.name || 'Sans nom'}</strong>
                      </div>
                      <div style={{ flex: 1 }}>
                        <span style={{ color: '#6c757d', fontFamily: 'monospace' }}>{item.email}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )}

          {syncResults.emails?.updated && syncResults.emails.updated.length > 0 && (
            <details style={{ marginBottom: '16px' }}>
              <summary style={{ cursor: 'pointer', fontWeight: '600', color: '#6366f1', marginBottom: '8px', fontSize: '15px' }}>
                🔄 {syncResults.emails.updated.length} email(s) mis à jour - Cliquez pour voir les détails
              </summary>
              <div style={{ maxHeight: '300px', overflowY: 'auto', backgroundColor: '#fff', padding: '12px', borderRadius: '6px', fontSize: '13px', marginTop: '8px' }}>
                {syncResults.emails.updated.map((item, index) => (
                  <div key={index} style={{ padding: '8px 0', borderBottom: index < syncResults.emails.updated.length - 1 ? '1px solid #e9ecef' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ minWidth: '200px' }}>
                        <strong style={{ color: '#212529', display: 'block' }}>{item.name || 'Sans nom'}</strong>
                      </div>
                      <div style={{ flex: 1 }}>
                        <span style={{ color: '#6c757d', fontFamily: 'monospace' }}>{item.email}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )}

          {syncResults.emails?.skipped && syncResults.emails.skipped.length > 0 && (
            <details>
              <summary style={{ cursor: 'pointer', fontWeight: '600', color: '#6c757d', marginBottom: '8px', fontSize: '15px' }}>
                ⏭️ {syncResults.emails.skipped.length} email(s) ignoré(s) - Cliquez pour voir les détails
              </summary>
              <div style={{ maxHeight: '300px', overflowY: 'auto', backgroundColor: '#fff', padding: '12px', borderRadius: '6px', fontSize: '13px', marginTop: '8px' }}>
                {syncResults.emails.skipped.map((item, index) => (
                  <div key={index} style={{ padding: '8px 0', borderBottom: index < syncResults.emails.skipped.length - 1 ? '1px solid #e9ecef' : 'none' }}>
                    <span style={{ fontWeight: '500', fontFamily: 'monospace' }}>{item.email}</span>
                    <span style={{ color: '#6c757d', marginLeft: '12px' }}>- {item.reason}</span>
                  </div>
                ))}
              </div>
            </details>
          )}

          <button
            onClick={() => setSyncResults(null)}
            className="admin-btn"
            style={{ marginTop: '12px', fontSize: '12px', padding: '6px 12px' }}
          >
            Fermer
          </button>
        </div>
      )}

      <div className="admin-filter-bar" style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: '600', marginRight: '8px' }}>Statut Newsletter:</span>
          <button
            onClick={() => setStatusFilter('all')}
            className={`admin-filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
          >
            Tous
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`admin-filter-btn ${statusFilter === 'active' ? 'active' : ''}`}
          >
            Actifs
          </button>
          <button
            onClick={() => setStatusFilter('unsubscribed')}
            className={`admin-filter-btn ${statusFilter === 'unsubscribed' ? 'active' : ''}`}
          >
            Désabonnés
          </button>
        </div>
      </div>

      <div className="admin-filter-bar">
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: '600', marginRight: '8px' }}>Statut Plateforme:</span>
          <button
            onClick={() => setUserStatusFilter('all')}
            className={`admin-filter-btn ${userStatusFilter === 'all' ? 'active' : ''}`}
          >
            Tous
          </button>
          <button
            onClick={() => setUserStatusFilter('pending')}
            className={`admin-filter-btn ${userStatusFilter === 'pending' ? 'active' : ''}`}
            style={{ backgroundColor: userStatusFilter === 'pending' ? '#ffc107' : '', color: userStatusFilter === 'pending' ? '#000' : '' }}
          >
            ⏳ En attente ({allSubscribers.filter(s => (s.userStatus || s.userAccountStatus) === 'pending').length})
          </button>
          <button
            onClick={() => setUserStatusFilter('active')}
            className={`admin-filter-btn ${userStatusFilter === 'active' ? 'active' : ''}`}
            style={{ backgroundColor: userStatusFilter === 'active' ? '#10b981' : '', color: userStatusFilter === 'active' ? '#fff' : '' }}
          >
            ✅ Actifs ({allSubscribers.filter(s => (s.userStatus || s.userAccountStatus) === 'active').length})
          </button>
          <button
            onClick={() => setUserStatusFilter('blocked')}
            className={`admin-filter-btn ${userStatusFilter === 'blocked' ? 'active' : ''}`}
            style={{ backgroundColor: userStatusFilter === 'blocked' ? '#ef4444' : '', color: userStatusFilter === 'blocked' ? '#fff' : '' }}
          >
            ❌ Inactifs ({allSubscribers.filter(s => (s.userStatus || s.userAccountStatus) === 'blocked').length})
          </button>
        </div>
      </div>

      {subscribers.length === 0 && !loading ? (
        <div className="admin-empty">
          <div className="admin-empty-icon">📧</div>
          <h3>Aucun abonné</h3>
          <p>Aucun abonné trouvé pour le moment.</p>
          <p style={{ marginTop: '16px', fontSize: '14px', color: '#6c757d', maxWidth: '500px', margin: '16px auto 0' }}>
            💡 <strong>Astuce :</strong> Cliquez sur "Synchroniser tous les utilisateurs" pour ajouter automatiquement tous les utilisateurs existants comme abonnés à la newsletter.
          </p>
        </div>
      ) : (
        <div style={{ backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
              <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Nom</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Téléphone</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Statut Newsletter</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Statut Plateforme</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Source</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
            </tr>
          </thead>
          <tbody>
            {subscribers.map((sub, index) => {
              const getUserStatusBadge = (userStatus) => {
                if (!userStatus) return { label: 'N/A', class: 'admin-badge-pending' }
                const badges = {
                  'active': { label: 'Actif', class: 'admin-badge-active' },
                  'pending': { label: 'En attente', class: 'admin-badge-pending' },
                  'blocked': { label: 'Bloqué', class: 'admin-badge-inactive' }
                }
                return badges[userStatus] || { label: userStatus, class: 'admin-badge-pending' }
              }
              
              const userStatus = sub.userStatus || sub.userAccountStatus || 'pending'
              const userBadge = getUserStatusBadge(userStatus)
              
              // Déterminer la couleur du tag selon le statut plateforme
              let tagColor = '#6c757d'
              let tagBg = '#e9ecef'
              if (userStatus === 'active') {
                tagColor = '#10b981'
                tagBg = '#d1fae5'
              } else if (userStatus === 'pending') {
                tagColor = '#f59e0b'
                tagBg = '#fef3c7'
              } else if (userStatus === 'blocked') {
                tagColor = '#ef4444'
                tagBg = '#fee2e2'
              }
              
              const userPhone = sub.userPhone || null
              
              return (
                <tr key={sub._id} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                  <td className="px-4 py-3 text-sm">{sub.email}</td>
                  <td className="px-4 py-3 text-sm">{sub.name || '—'}</td>
                  <td className="px-4 py-3 text-sm">
                    {userPhone ? (
                      <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '4px',
                        color: '#10b981',
                        fontWeight: '500'
                      }}>
                        📱 {userPhone}
                      </span>
                    ) : (
                      <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`admin-badge ${
                      sub.status === 'active' ? 'admin-badge-active' :
                      sub.status === 'unsubscribed' ? 'admin-badge-inactive' :
                      'admin-badge-pending'
                    }`}>
                      {sub.status === 'active' ? 'Actif' :
                       sub.status === 'unsubscribed' ? 'Désabonné' :
                       sub.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: tagBg,
                      color: tagColor,
                      display: 'inline-block'
                    }}>
                      {userBadge.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{sub.source}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatDate(sub.subscribedAt)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        </div>
      )}
    </div>
  )
}

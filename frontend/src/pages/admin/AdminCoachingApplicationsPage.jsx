import { useState, useEffect } from 'react'
import { CONFIG } from '../../config/config'
import { useAuth } from '../../contexts/AuthContext'

export default function AdminCoachingApplicationsPage() {
  const { token } = useAuth()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [notification, setNotification] = useState(null)
  const [analyzingId, setAnalyzingId] = useState(null)
  const [generatingId, setGeneratingId] = useState(null)
  const [analyzingAll, setAnalyzingAll] = useState(false)
  const [analysisResults, setAnalysisResults] = useState({})
  const [generatedMessages, setGeneratedMessages] = useState({})
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    if (token) {
      fetchApplications()
    }
  }, [token, statusFilter])

  const fetchApplications = async () => {
    if (!token) return
    setLoading(true)
    try {
      const url = statusFilter !== 'all'
        ? `${CONFIG.BACKEND_URL}/api/coaching-applications/admin?status=${statusFilter}`
        : `${CONFIG.BACKEND_URL}/api/coaching-applications/admin`

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setApplications(data.applications || [])
      } else {
        const errorData = await response.json().catch(() => ({}))
        showNotification(errorData.error || 'Erreur chargement candidatures', 'error')
      }
    } catch (error) {
      showNotification('Erreur chargement candidatures', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const handleAccept = async (id) => {
    try {
      const response = await fetch(
        `${CONFIG.BACKEND_URL}/api/coaching-applications/${id}/accept`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.ok) {
        showNotification('Candidature acceptée')
        fetchApplications()
      } else {
        const data = await response.json()
        showNotification(data.error || 'Erreur acceptation', 'error')
      }
    } catch (error) {
      showNotification('Erreur acceptation', 'error')
    }
  }

  const handleReject = async (id) => {
    try {
      const response = await fetch(
        `${CONFIG.BACKEND_URL}/api/coaching-applications/${id}/reject`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.ok) {
        showNotification('Candidature refusée')
        fetchApplications()
      } else {
        const data = await response.json()
        showNotification(data.error || 'Erreur refus', 'error')
      }
    } catch (error) {
      showNotification('Erreur refus', 'error')
    }
  }

  const copyWhatsApp = (whatsapp) => {
    navigator.clipboard.writeText(whatsapp)
    showNotification('Numéro WhatsApp copié')
  }

  const handleAnalyze = async (id) => {
    setAnalyzingId(id)
    try {
      const response = await fetch(
        `${CONFIG.BACKEND_URL}/api/coaching-applications/${id}/analyze`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setAnalysisResults(prev => ({ ...prev, [id]: data.analysis }))
        showNotification(`Analyse terminée: ${data.analysis.decision} (Score: ${data.analysis.score})`)
      } else {
        const errorData = await response.json()
        showNotification(errorData.error || 'Erreur analyse IA', 'error')
      }
    } catch (error) {
      showNotification('Erreur analyse IA', 'error')
    } finally {
      setAnalyzingId(null)
    }
  }

  const handleGenerateMessage = async (id) => {
    setGeneratingId(id)
    try {
      const response = await fetch(
        `${CONFIG.BACKEND_URL}/api/coaching-applications/${id}/generate-message`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setGeneratedMessages(prev => ({ ...prev, [id]: data.message }))
        showNotification('Message généré avec succès')
      } else {
        const errorData = await response.json()
        showNotification(errorData.error || 'Erreur génération message', 'error')
      }
    } catch (error) {
      showNotification('Erreur génération message', 'error')
    } finally {
      setGeneratingId(null)
    }
  }

  const handleSendWhatsApp = (whatsapp, message) => {
    if (!message) {
      showNotification('Génère d\'abord un message', 'error')
      return
    }
    const cleanPhone = whatsapp.replace(/\D/g, '')
    const encodedMessage = encodeURIComponent(message)
    window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank')
  }

  const handleAnalyzeAll = async () => {
    if (applications.length === 0) {
      showNotification('Aucune candidature à analyser', 'error')
      return
    }

    setAnalyzingAll(true)
    try {
      const response = await fetch(
        `${CONFIG.BACKEND_URL}/api/coaching-applications/analyze-all`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        const newResults = {}
        data.results.forEach(result => {
          if (result.success) {
            newResults[result.id] = result.analysis
          }
        })
        setAnalysisResults(prev => ({ ...prev, ...newResults }))
        showNotification(`Analyse terminée: ${data.successCount}/${data.count} profils analysés`)
      } else {
        const errorData = await response.json()
        showNotification(errorData.error || 'Erreur analyse batch', 'error')
      }
    } catch (error) {
      showNotification('Erreur analyse batch', 'error')
    } finally {
      setAnalyzingAll(false)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    const date = new Date(dateStr)
    if (Number.isNaN(date.getTime())) return dateStr
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const getStatusBadge = (status) => {
    const badges = {
      'En attente': { label: 'En attente', class: 'admin-badge-pending' },
      'Accepté': { label: 'Accepté', class: 'admin-badge-active' },
      'Refusé': { label: 'Refusé', class: 'admin-badge-inactive' }
    }
    return badges[status] || badges['En attente']
  }

  if (loading) {
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
          <h1>📋 Candidatures Coaching 7 Jours</h1>
          <p>Gestion des candidatures</p>
        </div>
        <div className="admin-comments-stats">
          <div className="admin-stat-mini">
            <span className="admin-stat-mini-label">Total</span>
            <span className="admin-stat-mini-value">{applications.length}</span>
          </div>
          <div className="admin-stat-mini">
            <span className="admin-stat-mini-label">En attente</span>
            <span className="admin-stat-mini-value">
              {applications.filter(a => a.status === 'En attente').length}
            </span>
          </div>
        </div>
      </div>

      <div className="admin-filter-bar" style={{ marginBottom: '1rem' }}>
        <button
          onClick={handleAnalyzeAll}
          disabled={analyzingAll || applications.length === 0}
          className="admin-btn"
          style={{ 
            backgroundColor: analyzingAll || applications.length === 0 ? '#ccc' : '#6366f1', 
            color: 'white',
            marginLeft: 'auto'
          }}
        >
          {analyzingAll ? '⏳ Analyse en cours...' : '🧠 Analyser tous les profils'}
        </button>
      </div>

      <div className="admin-filter-bar">
        <button
          onClick={() => setStatusFilter('all')}
          className={`admin-filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
        >
          Tous
        </button>
        <button
          onClick={() => setStatusFilter('En attente')}
          className={`admin-filter-btn ${statusFilter === 'En attente' ? 'active' : ''}`}
        >
          En attente
        </button>
        <button
          onClick={() => setStatusFilter('Accepté')}
          className={`admin-filter-btn ${statusFilter === 'Accepté' ? 'active' : ''}`}
        >
          Acceptés
        </button>
        <button
          onClick={() => setStatusFilter('Refusé')}
          className={`admin-filter-btn ${statusFilter === 'Refusé' ? 'active' : ''}`}
        >
          Refusés
        </button>
      </div>

      {applications.length === 0 ? (
        <div className="admin-empty">
          <div className="admin-empty-icon">📭</div>
          <h3>Aucune candidature</h3>
          <p>Aucune candidature pour le moment.</p>
        </div>
      ) : (
        <div style={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #dee2e6' }}>
            <table className="w-full">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Nom</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Statut</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                </tr>
              </thead>
            </table>
          </div>
          <div>
            {applications.map((app, index) => {
              const badge = getStatusBadge(app.status)
              const isExpanded = expandedId === app._id
              return (
                <div key={app._id} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <div 
                    onClick={() => setExpandedId(isExpanded ? null : app._id)}
                    style={{ 
                      padding: '16px',
                      cursor: 'pointer',
                      backgroundColor: isExpanded ? '#f8f9fa' : index % 2 === 0 ? '#fff' : '#f8f9fa',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => !isExpanded && (e.currentTarget.style.backgroundColor = '#e9ecef')}
                    onMouseLeave={(e) => !isExpanded && (e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#fff' : '#f8f9fa')}
                  >
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ fontWeight: '600', fontSize: '15px', color: '#212529' }}>
                        {app.fullName}
                      </div>
                      <span className={`admin-badge ${badge.class}`}>{badge.label}</span>
                      <span style={{ fontSize: '12px', color: '#6c757d' }}>
                        {formatDate(app.createdAt)}
                      </span>
                    </div>
                    <div style={{ fontSize: '18px', color: '#6c757d' }}>
                      {isExpanded ? '▼' : '▶'}
                    </div>
                  </div>
                  {isExpanded && (
                    <div style={{ padding: '20px', backgroundColor: '#fff', borderTop: '1px solid #dee2e6' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                        <div>
                          <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>Pays</div>
                          <div style={{ fontSize: '14px', fontWeight: '500' }}>{app.country || '—'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>WhatsApp</div>
                          <div style={{ fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontFamily: 'monospace' }}>{app.whatsapp}</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); copyWhatsApp(app.whatsapp); }}
                              className="text-blue-600 hover:text-blue-800 text-xs"
                              title="Copier"
                              style={{ cursor: 'pointer', padding: '2px 4px' }}
                            >
                              📋
                            </button>
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>Email</div>
                          <div style={{ fontSize: '14px', fontWeight: '500' }}>{app.email || '—'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>Ventes/mois</div>
                          <div style={{ fontSize: '14px', fontWeight: '500' }}>{app.monthlySales || '—'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>Budget</div>
                          <div style={{ fontSize: '14px', fontWeight: '500' }}>{app.budget || '—'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>Expérience</div>
                          <div style={{ fontSize: '14px', fontWeight: '500' }}>{app.adExperience || '—'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>Produit</div>
                          <span style={{ 
                            padding: '4px 12px', 
                            borderRadius: '4px',
                            backgroundColor: app.hasProduct === 'Oui' ? '#d4edda' : '#f8d7da',
                            color: app.hasProduct === 'Oui' ? '#155724' : '#721c24',
                            fontSize: '13px',
                            fontWeight: '500'
                          }}>
                            {app.hasProduct}
                          </span>
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>Shopify</div>
                          <span style={{ 
                            padding: '4px 12px', 
                            borderRadius: '4px',
                            backgroundColor: app.hasShopify === 'Oui' ? '#d4edda' : '#f8d7da',
                            color: app.hasShopify === 'Oui' ? '#155724' : '#721c24',
                            fontSize: '13px',
                            fontWeight: '500'
                          }}>
                            {app.hasShopify}
                          </span>
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>Stock</div>
                          <span style={{ 
                            padding: '4px 12px', 
                            borderRadius: '4px',
                            backgroundColor: app.hasStock === 'Oui' ? '#d4edda' : '#f8d7da',
                            color: app.hasStock === 'Oui' ? '#155724' : '#721c24',
                            fontSize: '13px',
                            fontWeight: '500'
                          }}>
                            {app.hasStock}
                          </span>
                        </div>
                      </div>

                      {(app.mainGoal || app.facebookAdsExperience || app.motivation) && (
                        <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                          {app.mainGoal && (
                            <div style={{ marginBottom: '12px' }}>
                              <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>Objectif</div>
                              <div style={{ fontSize: '14px' }}>{app.mainGoal}</div>
                            </div>
                          )}
                          {app.facebookAdsExperience && (
                            <div style={{ marginBottom: '12px' }}>
                              <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>Niveau FB Ads</div>
                              <div style={{ fontSize: '14px' }}>{app.facebookAdsExperience}</div>
                            </div>
                          )}
                          {app.motivation && (
                            <div>
                              <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>Motivation</div>
                              <div style={{ fontSize: '14px' }}>{app.motivation}</div>
                            </div>
                          )}
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                        {app.status === 'En attente' && (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleAccept(app._id); }}
                              className="admin-btn admin-btn-sm admin-btn-success"
                              style={{ fontSize: '12px', padding: '6px 12px' }}
                            >
                              ✅ Accepter
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleReject(app._id); }}
                              className="admin-btn admin-btn-sm admin-btn-danger"
                              style={{ fontSize: '12px', padding: '6px 12px' }}
                            >
                              ❌ Refuser
                            </button>
                          </>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleAnalyze(app._id); }}
                          disabled={analyzingId === app._id}
                          className="admin-btn admin-btn-sm"
                          style={{ 
                            backgroundColor: analyzingId === app._id ? '#ccc' : '#6366f1', 
                            color: 'white',
                            fontSize: '12px',
                            padding: '6px 12px',
                            cursor: analyzingId === app._id ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {analyzingId === app._id ? '⏳ Analyse...' : '🧠 Analyser avec IA'}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleGenerateMessage(app._id); }}
                          disabled={generatingId === app._id || app.status !== 'Accepté'}
                          className="admin-btn admin-btn-sm"
                          style={{ 
                            backgroundColor: generatingId === app._id || app.status !== 'Accepté' ? '#ccc' : '#10b981', 
                            color: 'white',
                            fontSize: '12px',
                            padding: '6px 12px',
                            cursor: generatingId === app._id || app.status !== 'Accepté' ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {generatingId === app._id ? '⏳ Génération...' : '✉️ Générer message'}
                        </button>
                        {app.status === 'Accepté' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleSendWhatsApp(app.whatsapp, generatedMessages[app._id]); }}
                            disabled={!generatedMessages[app._id]}
                            className="admin-btn admin-btn-sm"
                            style={{ 
                              backgroundColor: !generatedMessages[app._id] ? '#ccc' : '#25d366', 
                              color: 'white',
                              fontSize: '12px',
                              padding: '6px 12px',
                              cursor: !generatedMessages[app._id] ? 'not-allowed' : 'pointer'
                            }}
                          >
                            📲 Envoyer sur WhatsApp
                          </button>
                        )}
                      </div>

                      {analysisResults[app._id] && (
                        <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#e7f3ff', borderRadius: '8px', border: '1px solid #b3d9ff' }}>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: '#004085', marginBottom: '6px' }}>
                            Score IA: {analysisResults[app._id].score}/100
                          </div>
                          <div style={{ fontSize: '13px', color: '#004085', marginBottom: '4px' }}>
                            Décision: <strong>{analysisResults[app._id].decision}</strong>
                          </div>
                          <div style={{ fontSize: '12px', color: '#004085', lineHeight: '1.5' }}>
                            {analysisResults[app._id].raison}
                          </div>
                        </div>
                      )}

                      {generatedMessages[app._id] && (
                        <div style={{ padding: '12px', backgroundColor: '#d4edda', borderRadius: '8px', border: '1px solid #b3e5b3' }}>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: '#155724', marginBottom: '6px' }}>Message généré:</div>
                          <div style={{ fontSize: '13px', color: '#155724', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{generatedMessages[app._id]}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

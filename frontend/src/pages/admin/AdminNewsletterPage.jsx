import { useState, useEffect } from 'react'
import { CONFIG } from '../../config/config'
import { useAuth } from '../../contexts/AuthContext'

export default function AdminNewsletterPage() {
  const { token } = useAuth()
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [notification, setNotification] = useState(null)
  const [stats, setStats] = useState(null)
  const [sendResults, setSendResults] = useState(null)
  
  const [formData, setFormData] = useState({
    subject: '',
    content: '',
    recipients: { type: 'segment', segment: 'active', customEmails: [], email: '', name: '' },
    fromName: 'Infomania'
  })

  useEffect(() => {
    if (token) {
      fetchStats()
    }
  }, [token])

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
    setTimeout(() => setNotification(null), 5000)
  }

  const getRecipientCount = (recipients) => {
    if (!stats) return 0
    if (!recipients || !recipients.type) return 0
    if (recipients.type === 'all') return stats.active || 0
    if (recipients.type === 'segment') {
      if (recipients.segment === 'active') return stats.byUserStatus?.active || 0
      if (recipients.segment === 'pending') return stats.byUserStatus?.pending || 0
      if (recipients.segment === 'blocked') return stats.byUserStatus?.blocked || 0
      return 0
    }
    if (recipients.type === 'list') return recipients.customEmails?.length || 0
    if (recipients.type === 'single') return recipients.email ? 1 : 0
    return 0
  }

  const handleSend = async (e) => {
    e.preventDefault()
    
    if (!formData.subject || !formData.content) {
      showNotification('Sujet et contenu requis', 'error')
      return
    }

    if (formData.recipients.type === 'single' && !formData.recipients.email) {
      showNotification('Email du destinataire requis', 'error')
      return
    }

    if (formData.recipients.type === 'list' && (!formData.recipients.customEmails || formData.recipients.customEmails.length === 0)) {
      showNotification('Ajoute au moins un email dans la liste personnalisée', 'error')
      return
    }

    if (!confirm(`Envoyer cette newsletter à ${getRecipientCount(formData.recipients)} destinataire(s) ?`)) {
      return
    }

    setSending(true)
    try {
      // Créer la campagne
      const campaignResponse = await fetch(`${CONFIG.BACKEND_URL}/api/email-campaigns`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: `Newsletter ${formData.recipients.type}${formData.recipients.type === 'segment' ? `:${formData.recipients.segment}` : ''}${formData.recipients.type === 'single' && formData.recipients.email ? `:${formData.recipients.email}` : ''} - ${new Date().toLocaleDateString('fr-FR')}`,
          subject: formData.subject,
          content: {
            html: formData.content,
            text: formData.content.replace(/<[^>]*>/g, '')
          },
          recipients: formData.recipients,
          fromEmail: 'contact@infomania.store',
          fromName: formData.fromName,
          replyTo: 'contact@infomania.store'
        })
      })

      if (!campaignResponse.ok) {
        const errorData = await campaignResponse.json()
        throw new Error(errorData.error || 'Erreur création campagne')
      }

      const campaignData = await campaignResponse.json()
      const campaignId = campaignData.campaign._id

      // Envoyer la campagne
      const sendResponse = await fetch(`${CONFIG.BACKEND_URL}/api/email-campaigns/${campaignId}/send`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (sendResponse.ok) {
        const sendData = await sendResponse.json()
        const results = sendData.details || sendData.stats || {}
        setSendResults({
          total: results.total || sendData.stats?.total || 0,
          sent: results.sent || 0,
          failed: results.failed || 0,
          confirmed: results.confirmed || 0,
          delivered: results.delivered || 0,
          opened: results.opened || 0,
          failedEmails: results.failedEmails || []
        })
        
        // Vérification supplémentaire après 2 secondes
        setTimeout(async () => {
          try {
            const verifyResponse = await fetch(`${CONFIG.BACKEND_URL}/api/email-campaigns/${campaignId}/verify`, {
              headers: { Authorization: `Bearer ${token}` }
            })
            if (verifyResponse.ok) {
              const verifyData = await verifyResponse.json()
              setSendResults(prev => ({
                ...prev,
                confirmed: verifyData.stats?.confirmed || prev?.confirmed || 0,
                delivered: verifyData.stats?.delivered || 0,
                opened: verifyData.stats?.opened || 0
              }))
            }
          } catch (err) {
            console.error('Erreur vérification:', err)
          }
        }, 2000)
        
        const totalSent = results.sent || sendData.stats?.sent || 0
        const totalDest = results.total || sendData.stats?.total || 0
        showNotification(`✅ Newsletter envoyée: ${totalSent}/${totalDest} emails`, 'success')
        setFormData({
          subject: '',
          content: '',
          recipients: { type: 'segment', segment: 'active', customEmails: [], email: '', name: '' },
          fromName: 'Infomania'
        })
        fetchStats()
      } else {
        const errorData = await sendResponse.json()
        throw new Error(errorData.error || 'Erreur envoi')
      }
    } catch (error) {
      console.error('Erreur envoi newsletter:', error)
      showNotification(error.message || 'Erreur lors de l\'envoi', 'error')
    } finally {
      setSending(false)
    }
  }

  const tagLabels = {
    all: '📧 Tous les abonnés actifs',
    active: '✅ Actifs',
    pending: '⏳ En attente',
    blocked: '❌ Inactifs'
  }

  const getRecipientsButtonLabel = () => {
    if (formData.recipients.type === 'all') return tagLabels.all
    if (formData.recipients.type === 'segment') return tagLabels[formData.recipients.segment] || 'Segment'
    if (formData.recipients.type === 'list') return '🧾 Liste personnalisée'
    if (formData.recipients.type === 'single') return '� Une seule personne'
    return 'Destinataires'
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
          <h1>📬 Newsletter</h1>
          <p>Envoyer une newsletter à un tag spécifique</p>
        </div>
        {stats && (
          <div className="admin-comments-stats">
            <div className="admin-stat-mini">
              <span className="admin-stat-mini-label">Total</span>
              <span className="admin-stat-mini-value">{stats.total || 0}</span>
            </div>
            <div className="admin-stat-mini">
              <span className="admin-stat-mini-label">Actifs</span>
              <span className="admin-stat-mini-value">{stats.active || 0}</span>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ marginBottom: '20px', fontSize: '18px' }}>Nouvelle Newsletter</h2>
          <form onSubmit={handleSend}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Destinataires *</label>
              <select
                value={formData.recipients.type}
                onChange={(e) => setFormData({ ...formData, recipients: { ...formData.recipients, type: e.target.value } })}
                required
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              >
                <option value="all">📧 Tous les abonnés actifs</option>
                <option value="segment">🏷️ Segment</option>
                <option value="list">🧾 Liste personnalisée</option>
                <option value="single">👤 Une seule personne</option>
              </select>
              {formData.recipients.type === 'segment' && (
                <div style={{ marginTop: '10px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Segment *</label>
                  <select
                    value={formData.recipients.segment}
                    onChange={(e) => setFormData({ ...formData, recipients: { ...formData.recipients, segment: e.target.value } })}
                    required
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                  >
                    <option value="active">✅ Actifs</option>
                    <option value="pending">⏳ En attente</option>
                    <option value="blocked">❌ Inactifs</option>
                  </select>
                </div>
              )}

              {formData.recipients.type === 'list' && (
                <div style={{ marginTop: '10px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Liste d'emails (un par ligne) *</label>
                  <textarea
                    value={(formData.recipients.customEmails || []).join('\n')}
                    onChange={(e) => {
                      const raw = e.target.value
                      const emails = raw
                        .split(/\r?\n|,|;/g)
                        .map(v => v.trim().toLowerCase())
                        .filter(Boolean)
                      const unique = Array.from(new Set(emails))
                      setFormData({ ...formData, recipients: { ...formData.recipients, customEmails: unique } })
                    }}
                    rows="6"
                    placeholder="email1@exemple.com\nemail2@exemple.com"
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', fontFamily: 'monospace', fontSize: '13px' }}
                  />
                </div>
              )}

              {formData.recipients.type === 'single' && (
                <div style={{ marginTop: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Email *</label>
                    <input
                      type="email"
                      value={formData.recipients.email}
                      onChange={(e) => setFormData({ ...formData, recipients: { ...formData.recipients, email: e.target.value } })}
                      required
                      placeholder="email@exemple.com"
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Nom</label>
                    <input
                      type="text"
                      value={formData.recipients.name}
                      onChange={(e) => setFormData({ ...formData, recipients: { ...formData.recipients, name: e.target.value } })}
                      placeholder="Prénom Nom"
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                    />
                  </div>
                </div>
              )}

              <p style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                {getRecipientCount(formData.recipients)} destinataire(s) recevront cette newsletter
              </p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Sujet *</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                required
                placeholder="Ex: Nouvelle formation disponible"
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Contenu HTML *</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                required
                rows="12"
                placeholder="<h1>Bonjour</h1><p>Votre contenu ici...</p>"
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', fontFamily: 'monospace', fontSize: '13px' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Nom expéditeur</label>
              <input
                type="text"
                value={formData.fromName}
                onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="admin-btn admin-btn-success"
              style={{ width: '100%', fontSize: '14px', padding: '10px' }}
            >
              {sending ? '⏳ Envoi en cours...' : `📤 Envoyer à ${getRecipientsButtonLabel()}`}
            </button>
          </form>
        </div>

        <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>📋 Tags disponibles</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e9ecef' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '600' }}>✅ Actifs</span>
                <span style={{ fontSize: '14px', color: '#6c757d' }}>{stats?.active || 0} abonnés</span>
              </div>
              <p style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                Utilisateurs avec statut "active" sur la plateforme
              </p>
            </div>
            <div style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e9ecef' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '600' }}>⏳ En attente</span>
                <span style={{ fontSize: '14px', color: '#6c757d' }}>{stats?.byUserStatus?.pending || 0} abonnés</span>
              </div>
              <p style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                Utilisateurs avec statut "pending" sur la plateforme
              </p>
            </div>
            <div style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e9ecef' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '600' }}>❌ Inactifs</span>
                <span style={{ fontSize: '14px', color: '#6c757d' }}>{stats?.byUserStatus?.blocked || 0} abonnés</span>
              </div>
              <p style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                Utilisateurs avec statut "blocked" sur la plateforme
              </p>
            </div>
            <div style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e9ecef' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '600' }}>📧 Tous</span>
                <span style={{ fontSize: '14px', color: '#6c757d' }}>{stats?.active || 0} abonnés</span>
              </div>
              <p style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                Tous les abonnés actifs à la newsletter
              </p>
            </div>
          </div>
        </div>
      </div>

      {sendResults && (
        <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📊 Résultats d'envoi
            <button 
              onClick={() => setSendResults(null)}
              style={{ marginLeft: 'auto', padding: '4px 8px', fontSize: '12px', backgroundColor: '#f0f0f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              ✕ Fermer
            </button>
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '16px' }}>
            <div style={{ padding: '12px', backgroundColor: '#e8f5e9', borderRadius: '6px', border: '1px solid #4caf50' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2e7d32' }}>{sendResults.sent || 0}</div>
              <div style={{ fontSize: '12px', color: '#2e7d32' }}>✅ Envoyés</div>
            </div>
            <div style={{ padding: '12px', backgroundColor: '#c8e6c9', borderRadius: '6px', border: '1px solid #66bb6a' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1b5e20' }}>{sendResults.confirmed || 0}</div>
              <div style={{ fontSize: '12px', color: '#1b5e20' }}>✓ Confirmés</div>
            </div>
            {sendResults.delivered > 0 && (
              <div style={{ padding: '12px', backgroundColor: '#b2dfdb', borderRadius: '6px', border: '1px solid #26a69a' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#004d40' }}>{sendResults.delivered || 0}</div>
                <div style={{ fontSize: '12px', color: '#004d40' }}>📬 Livrés</div>
              </div>
            )}
            {sendResults.opened > 0 && (
              <div style={{ padding: '12px', backgroundColor: '#b3e5fc', borderRadius: '6px', border: '1px solid #29b6f6' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#01579b' }}>{sendResults.opened || 0}</div>
                <div style={{ fontSize: '12px', color: '#01579b' }}>👁️ Ouverts</div>
              </div>
            )}
            <div style={{ padding: '12px', backgroundColor: '#fff3e0', borderRadius: '6px', border: '1px solid #ff9800' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#e65100' }}>{sendResults.failed || 0}</div>
              <div style={{ fontSize: '12px', color: '#e65100' }}>❌ Échecs</div>
            </div>
            <div style={{ padding: '12px', backgroundColor: '#e3f2fd', borderRadius: '6px', border: '1px solid #2196f3' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1565c0' }}>{sendResults.total || 0}</div>
              <div style={{ fontSize: '12px', color: '#1565c0' }}>📧 Total</div>
            </div>
          </div>
          {sendResults.failedEmails && sendResults.failedEmails.length > 0 && (
            <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#ffebee', borderRadius: '6px', border: '1px solid #f44336' }}>
              <div style={{ fontWeight: '600', marginBottom: '8px', color: '#c62828' }}>Emails en échec:</div>
              <div style={{ fontSize: '12px', maxHeight: '150px', overflowY: 'auto' }}>
                {sendResults.failedEmails.map((item, idx) => (
                  <div key={idx} style={{ padding: '4px 0', borderBottom: '1px solid #ffcdd2' }}>
                    <strong>{item.email}</strong>: {item.error}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px', fontSize: '12px', color: '#666' }}>
            <div style={{ fontWeight: '600', marginBottom: '4px' }}>💡 Système de vérification</div>
            <div>• Les emails sont envoyés via Resend avec confirmation immédiate</div>
            <div>• Vérification automatique dans les logs système après envoi</div>
            <div>• Statut mis à jour en temps réel (envoyé → livré → ouvert)</div>
            {sendResults.confirmed > 0 && sendResults.confirmed === sendResults.sent && (
              <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#e8f5e9', borderRadius: '4px', color: '#2e7d32', fontWeight: '600' }}>
                ✅ Tous les emails ont été confirmés dans les logs
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

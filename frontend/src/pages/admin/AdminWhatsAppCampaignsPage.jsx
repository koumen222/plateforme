import { useState, useEffect } from 'react'
import { CONFIG } from '../../config/config'
import { useAuth } from '../../contexts/AuthContext'

export default function AdminWhatsAppCampaignsPage() {
  const { token } = useAuth()
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendingWelcome, setSendingWelcome] = useState(false)
  const [sendingRelance, setSendingRelance] = useState(false)
  const [notification, setNotification] = useState(null)
  const [stats, setStats] = useState(null)
  const [sendResults, setSendResults] = useState(null)
  const [campaigns, setCampaigns] = useState([])
  
  const [formData, setFormData] = useState({
    message: '',
    variant1: '',
    variant2: '',
    variant3: '',
    tag: 'active',
    fromPhone: ''
  })
  
  const [welcomeCampaign, setWelcomeCampaign] = useState({
    variant1: 'Bienvenue sur Ecom Starter 3.0 ! 🎉\n\nNous sommes ravis de vous compter parmi nous. Vous avez maintenant accès à toutes les fonctionnalités de la plateforme : formation e-commerce complète, liste de livreurs et fournisseurs, générateur de produits gagnants, coaching personnalisé et tous les outils essentiels pour créer un business rentable.\n\nExplorez votre espace : https://www.safitech.shop/',
    variant2: 'Salut ! 👋\n\nBienvenue dans Ecom Starter 3.0 ! Vous avez maintenant accès à toutes nos fonctionnalités premium : formation e-commerce complète, liste de livreurs et fournisseurs, générateur de produits gagnants, accompagnement personnalisé et ressources exclusives.\n\nDécouvrez la plateforme : https://www.safitech.shop/',
    variant3: 'Bonjour et bienvenue sur Ecom Starter 3.0 ! 🌟\n\nFélicitations pour votre inscription ! Vous pouvez maintenant accéder à toutes les fonctionnalités de la plateforme : formation e-commerce, liste de livreurs et fournisseurs, générateur de produits gagnants, coaching et support dédié.\n\nAccédez à votre espace : https://www.safitech.shop/',
    enabled: false
  })
  
  const [relanceCampaign, setRelanceCampaign] = useState({
    variant1: 'Bonjour ! 👋\n\nVotre compte Ecom Starter 3.0 est en attente d\'activation.\n\nBonne nouvelle : vous pouvez obtenir un accès gratuit à toutes les fonctionnalités (formation e-commerce, liste de livreurs et fournisseurs, générateur de produits gagnants) en partageant votre lien d\'affiliation !\n\nRécupérez votre lien dans votre profil : https://www.safitech.shop/profil',
    variant2: 'Salut ! 😊\n\nVotre compte Ecom Starter 3.0 est en attente, mais nous avons une offre spéciale pour vous !\n\nPartagez votre lien d\'affiliation et obtenez un accès gratuit à toutes les fonctionnalités : formation e-commerce, liste de livreurs et fournisseurs, générateur de produits gagnants. C\'est simple et rapide !\n\nRécupérez votre lien dans votre profil : https://www.safitech.shop/profil',
    variant3: 'Hello ! 🌟\n\nActivez votre compte Ecom Starter 3.0 dès maintenant !\n\nProfitez d\'un accès gratuit à toutes les fonctionnalités (formation e-commerce, liste de livreurs et fournisseurs, générateur de produits gagnants) en partageant votre lien d\'affiliation avec vos proches. Plus vous partagez, plus vous bénéficiez !\n\nRécupérez votre lien dans votre profil : https://www.safitech.shop/profil',
    enabled: false
  })

  useEffect(() => {
    if (token) {
      fetchStats()
      fetchCampaigns()
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

  const fetchCampaigns = async () => {
    if (!token) return
    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/whatsapp-campaigns`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setCampaigns(data.campaigns || [])
      }
    } catch (error) {
      console.error('Erreur récupération campagnes:', error)
    }
  }

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 5000)
  }

  const sendWelcomeCampaign = async (variants) => {
    setSendingWelcome(true)
    try {
      const campaignResponse = await fetch(`${CONFIG.BACKEND_URL}/api/whatsapp-campaigns`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: `Campagne de Bienvenue ${new Date().toLocaleDateString('fr-FR')}`,
          variants: variants,
          recipients: {
            type: 'segment',
            segment: 'active'
          }
        })
      })

      if (!campaignResponse.ok) {
        const errorData = await campaignResponse.json()
        throw new Error(errorData.error || 'Erreur création campagne')
      }

      const campaignData = await campaignResponse.json()
      const campaignId = campaignData.campaign._id

      const sendResponse = await fetch(`${CONFIG.BACKEND_URL}/api/whatsapp-campaigns/${campaignId}/send`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (sendResponse.ok) {
        const sendData = await sendResponse.json()
        const sentCount = sendData.stats?.sent || 0
        const totalCount = sendData.stats?.total || 0
        
        // Récupérer les numéros des destinataires depuis les logs
        try {
          const verifyResponse = await fetch(`${CONFIG.BACKEND_URL}/api/whatsapp-campaigns/${campaignId}/verify`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (verifyResponse.ok) {
            const verifyData = await verifyResponse.json()
            const logs = verifyData.logs || []
            const phoneNumbers = logs
              .filter(log => log.status === 'sent' || log.status === 'delivered')
              .map(log => log.phone)
              .filter(Boolean)
            
            if (phoneNumbers.length > 0) {
              showNotification(`✅ Campagne de bienvenue envoyée: ${sentCount}/${totalCount} messages`, 'success')
              setSendResults({
                total: totalCount,
                sent: sentCount,
                failed: sendData.stats?.failed || 0,
                skipped: sendData.stats?.skipped || 0,
                confirmed: verifyData.stats?.confirmed || 0,
                phoneNumbers: phoneNumbers
              })
            } else {
              showNotification(`✅ Campagne de bienvenue envoyée: ${sentCount}/${totalCount} messages`, 'success')
            }
          } else {
            showNotification(`✅ Campagne de bienvenue envoyée: ${sentCount}/${totalCount} messages`, 'success')
          }
        } catch (err) {
          showNotification(`✅ Campagne de bienvenue envoyée: ${sentCount}/${totalCount} messages`, 'success')
        }
        
        fetchStats()
        fetchCampaigns()
      } else {
        const errorData = await sendResponse.json()
        throw new Error(errorData.error || 'Erreur envoi')
      }
    } catch (error) {
      console.error('Erreur campagne de bienvenue:', error)
      showNotification(error.message || 'Erreur lors de l\'envoi', 'error')
    } finally {
      setSendingWelcome(false)
    }
  }

  const sendRelanceCampaign = async (variants) => {
    setSendingRelance(true)
    try {
      const campaignResponse = await fetch(`${CONFIG.BACKEND_URL}/api/whatsapp-campaigns`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: `Campagne de Relance ${new Date().toLocaleDateString('fr-FR')}`,
          variants: variants,
          recipients: {
            type: 'segment',
            segment: 'pending'
          }
        })
      })

      if (!campaignResponse.ok) {
        const errorData = await campaignResponse.json()
        throw new Error(errorData.error || 'Erreur création campagne')
      }

      const campaignData = await campaignResponse.json()
      const campaignId = campaignData.campaign._id

      const sendResponse = await fetch(`${CONFIG.BACKEND_URL}/api/whatsapp-campaigns/${campaignId}/send`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (sendResponse.ok) {
        const sendData = await sendResponse.json()
        const sentCount = sendData.stats?.sent || 0
        const totalCount = sendData.stats?.total || 0
        
        // Récupérer les numéros des destinataires depuis les logs
        try {
          const verifyResponse = await fetch(`${CONFIG.BACKEND_URL}/api/whatsapp-campaigns/${campaignId}/verify`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (verifyResponse.ok) {
            const verifyData = await verifyResponse.json()
            const logs = verifyData.logs || []
            const phoneNumbers = logs
              .filter(log => log.status === 'sent' || log.status === 'delivered')
              .map(log => log.phone)
              .filter(Boolean)
            
            if (phoneNumbers.length > 0) {
              showNotification(`✅ Campagne de relance envoyée: ${sentCount}/${totalCount} messages`, 'success')
              setSendResults({
                total: totalCount,
                sent: sentCount,
                failed: sendData.stats?.failed || 0,
                skipped: sendData.stats?.skipped || 0,
                confirmed: verifyData.stats?.confirmed || 0,
                phoneNumbers: phoneNumbers
              })
            } else {
              showNotification(`✅ Campagne de relance envoyée: ${sentCount}/${totalCount} messages`, 'success')
            }
          } else {
            showNotification(`✅ Campagne de relance envoyée: ${sentCount}/${totalCount} messages`, 'success')
          }
        } catch (err) {
          showNotification(`✅ Campagne de relance envoyée: ${sentCount}/${totalCount} messages`, 'success')
        }
        
        fetchStats()
        fetchCampaigns()
      } else {
        const errorData = await sendResponse.json()
        throw new Error(errorData.error || 'Erreur envoi')
      }
    } catch (error) {
      console.error('Erreur campagne de relance:', error)
      showNotification(error.message || 'Erreur lors de l\'envoi', 'error')
    } finally {
      setSendingRelance(false)
    }
  }

  const getTagCount = (tag) => {
    if (!stats) return 0
    if (tag === 'active') return stats.byUserStatus?.active || 0
    if (tag === 'pending') return stats.byUserStatus?.pending || 0
    if (tag === 'blocked') return stats.byUserStatus?.blocked || 0
    if (tag === 'all') {
      // Compter tous les utilisateurs avec un numéro de téléphone
      return stats.usersWithPhone || stats.active || 0
    }
    return 0
  }

  const handleSend = async (e) => {
    e.preventDefault()
    
    // Vérifier qu'au moins un message ou une variante est fourni
    const hasMessage = formData.message && formData.message.trim()
    const variants = [
      formData.variant1?.trim(),
      formData.variant2?.trim(),
      formData.variant3?.trim()
    ].filter(v => v && v.length > 0)
    
    if (!hasMessage && variants.length === 0) {
      showNotification('Au moins un message ou une variante doit être fourni', 'error')
      return
    }

    if (!confirm(`Envoyer ce message WhatsApp à ${getTagCount(formData.tag)} utilisateurs avec le tag "${formData.tag}" ?`)) {
      return
    }

    setSending(true)
    try {
      // Créer la campagne
      const campaignResponse = await fetch(`${CONFIG.BACKEND_URL}/api/whatsapp-campaigns`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: `Newsletter ${new Date().toLocaleDateString('fr-FR')} ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
          message: hasMessage ? formData.message.trim() : null,
          variants: variants.length > 0 ? variants : null,
          recipients: {
            type: formData.tag === 'all' ? 'all' : 'segment',
            segment: formData.tag === 'all' ? 'active' : formData.tag
          },
          fromPhone: formData.fromPhone || ''
        })
      })

      if (!campaignResponse.ok) {
        const errorData = await campaignResponse.json()
        throw new Error(errorData.error || 'Erreur création campagne')
      }

      const campaignData = await campaignResponse.json()
      const campaignId = campaignData.campaign._id

      // Envoyer la campagne
      const sendResponse = await fetch(`${CONFIG.BACKEND_URL}/api/whatsapp-campaigns/${campaignId}/send`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (sendResponse.ok) {
        const sendData = await sendResponse.json()
        const results = sendData.details || sendData.stats || {}
        // Récupérer les numéros des destinataires depuis les détails ou les logs
        let phoneNumbers = sendData.details?.sentPhones || results.sentPhones || []
        if (phoneNumbers.length === 0) {
          try {
            const verifyResponse = await fetch(`${CONFIG.BACKEND_URL}/api/whatsapp-campaigns/${campaignId}/verify`, {
              headers: { Authorization: `Bearer ${token}` }
            })
            if (verifyResponse.ok) {
              const verifyData = await verifyResponse.json()
              const logs = verifyData.logs || []
              phoneNumbers = logs
                .filter(log => log.status === 'sent' || log.status === 'delivered')
                .map(log => log.phone)
                .filter(Boolean)
            }
          } catch (err) {
            console.error('Erreur récupération numéros:', err)
          }
        }
        
        setSendResults({
          total: results.total || sendData.stats?.total || 0,
          sent: results.sent || 0,
          failed: results.failed || 0,
          skipped: results.skipped || 0,
          confirmed: results.confirmed || 0,
          delivered: results.delivered || 0,
          read: results.read || 0,
          quotaReached: results.quotaReached || false,
          failedPhones: results.failedPhones || [],
          phoneNumbers: phoneNumbers
        })
        
        // Vérification supplémentaire après 2 secondes
        setTimeout(async () => {
          try {
            const verifyResponse = await fetch(`${CONFIG.BACKEND_URL}/api/whatsapp-campaigns/${campaignId}/verify`, {
              headers: { Authorization: `Bearer ${token}` }
            })
            if (verifyResponse.ok) {
              const verifyData = await verifyResponse.json()
              setSendResults(prev => ({
                ...prev,
                confirmed: verifyData.stats?.confirmed || prev?.confirmed || 0,
                delivered: verifyData.stats?.delivered || 0,
                read: verifyData.stats?.read || 0
              }))
            }
          } catch (err) {
            console.error('Erreur vérification:', err)
          }
        }, 2000)
        
        const totalSent = results.sent || sendData.stats?.sent || 0
        const totalDest = results.total || sendData.stats?.total || 0
        showNotification(`✅ Message WhatsApp envoyé: ${totalSent}/${totalDest} messages`, 'success')
        setFormData({
          message: '',
          variant1: '',
          variant2: '',
          variant3: '',
          tag: 'active',
          fromPhone: ''
        })
        fetchStats()
        fetchCampaigns()
      } else {
        const errorData = await sendResponse.json()
        throw new Error(errorData.error || 'Erreur envoi')
      }
    } catch (error) {
      console.error('Erreur envoi message WhatsApp:', error)
      showNotification(error.message || 'Erreur lors de l\'envoi', 'error')
    } finally {
      setSending(false)
    }
  }

  const tagLabels = {
    active: '✅ Actifs',
    pending: '⏳ En attente',
    blocked: '❌ Inactifs',
    all: '📱 Tous'
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
          <h1>📱 Campagnes WhatsApp</h1>
          <p>Envoyer des messages WhatsApp automatiques à un tag spécifique</p>
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

      {/* Campagnes automatiques */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Campagne de Bienvenue */}
        <div style={{ padding: '20px', backgroundColor: '#e8f5e9', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '2px solid #4caf50' }}>
          <h2 style={{ marginBottom: '16px', fontSize: '18px', color: '#2e7d32', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🎉 Campagne de Bienvenue
          </h2>
          <p style={{ fontSize: '13px', color: '#6c757d', marginBottom: '16px' }}>
            Envoie automatiquement un message de bienvenue à tous les utilisateurs <strong>actifs</strong> lors de l'activation.
          </p>
          
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500' }}>Variante 1 *</label>
            <textarea
              value={welcomeCampaign.variant1}
              onChange={(e) => setWelcomeCampaign({ ...welcomeCampaign, variant1: e.target.value })}
              rows="3"
              placeholder="Message de bienvenue variante 1..."
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' }}
            />
          </div>
          
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500' }}>Variante 2 (optionnel)</label>
            <textarea
              value={welcomeCampaign.variant2}
              onChange={(e) => setWelcomeCampaign({ ...welcomeCampaign, variant2: e.target.value })}
              rows="3"
              placeholder="Message de bienvenue variante 2..."
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' }}
            />
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500' }}>Variante 3 (optionnel)</label>
            <textarea
              value={welcomeCampaign.variant3}
              onChange={(e) => setWelcomeCampaign({ ...welcomeCampaign, variant3: e.target.value })}
              rows="3"
              placeholder="Message de bienvenue variante 3..."
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' }}
            />
          </div>
          
          <button
            onClick={async () => {
              const variants = [
                welcomeCampaign.variant1?.trim(),
                welcomeCampaign.variant2?.trim(),
                welcomeCampaign.variant3?.trim()
              ].filter(v => v && v.length > 0)
              
              if (variants.length === 0) {
                showNotification('Au moins une variante doit être fournie', 'error')
                return
              }
              
              if (!confirm(`Envoyer le message de bienvenue à ${getTagCount('active')} utilisateurs actifs ?`)) {
                return
              }
              
              await sendWelcomeCampaign(variants)
            }}
            disabled={sendingWelcome}
            className="admin-btn admin-btn-success"
            style={{ width: '100%', fontSize: '14px', padding: '10px', backgroundColor: '#4caf50', color: 'white', border: 'none', opacity: sendingWelcome ? 0.6 : 1 }}
          >
            {sendingWelcome ? '⏳ Envoi en cours...' : '📤 Envoyer'}
          </button>
        </div>

        {/* Campagne de Relance */}
        <div style={{ padding: '20px', backgroundColor: '#fff3e0', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '2px solid #ff9800' }}>
          <h2 style={{ marginBottom: '16px', fontSize: '18px', color: '#e65100', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🔄 Campagne de Relance
          </h2>
          <p style={{ fontSize: '13px', color: '#6c757d', marginBottom: '16px' }}>
            Envoie un message aux utilisateurs <strong>non-actifs</strong> leur indiquant qu'ils peuvent avoir un accès gratuit s'ils partagent un lien d'affiliation.
          </p>
          
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500' }}>Variante 1 *</label>
            <textarea
              value={relanceCampaign.variant1}
              onChange={(e) => setRelanceCampaign({ ...relanceCampaign, variant1: e.target.value })}
              rows="3"
              placeholder="Message de relance variante 1 (mentionner l'accès gratuit avec lien d'affiliation)..."
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' }}
            />
          </div>
          
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500' }}>Variante 2 (optionnel)</label>
            <textarea
              value={relanceCampaign.variant2}
              onChange={(e) => setRelanceCampaign({ ...relanceCampaign, variant2: e.target.value })}
              rows="3"
              placeholder="Message de relance variante 2..."
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' }}
            />
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500' }}>Variante 3 (optionnel)</label>
            <textarea
              value={relanceCampaign.variant3}
              onChange={(e) => setRelanceCampaign({ ...relanceCampaign, variant3: e.target.value })}
              rows="3"
              placeholder="Message de relance variante 3..."
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' }}
            />
          </div>
          
          <button
            onClick={async () => {
              const variants = [
                relanceCampaign.variant1?.trim(),
                relanceCampaign.variant2?.trim(),
                relanceCampaign.variant3?.trim()
              ].filter(v => v && v.length > 0)
              
              if (variants.length === 0) {
                showNotification('Au moins une variante doit être fournie', 'error')
                return
              }
              
              if (!confirm(`Envoyer le message de relance à ${getTagCount('blocked')} utilisateurs non-actifs ?`)) {
                return
              }
              
              await sendRelanceCampaign(variants)
            }}
            disabled={sendingRelance}
            className="admin-btn"
            style={{ width: '100%', fontSize: '14px', padding: '10px', backgroundColor: '#ff9800', color: 'white', border: 'none', opacity: sendingRelance ? 0.6 : 1 }}
          >
            {sendingRelance ? '⏳ Envoi en cours...' : '📤 Envoyer'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ marginBottom: '20px', fontSize: '18px' }}>Nouveau Message WhatsApp</h2>
          <form onSubmit={handleSend}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Tag destinataires *</label>
              <select
                value={formData.tag}
                onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                required
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              >
                <option value="active">✅ Actifs</option>
                <option value="pending">⏳ En attente</option>
                <option value="blocked">❌ Inactifs</option>
                <option value="all">📱 Tous les utilisateurs</option>
              </select>
              <p style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                {getTagCount(formData.tag)} utilisateurs recevront ce message
              </p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>
                Message unique (optionnel si variantes utilisées)
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows="4"
                placeholder="Message unique si vous n'utilisez pas les variantes..."
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' }}
              />
            </div>

            <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f0f7ff', borderRadius: '6px', border: '1px solid #b3d9ff' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#0066cc' }}>
                📝 Variantes de message (recommandé)
              </label>
              <p style={{ fontSize: '12px', color: '#0066cc', marginBottom: '12px' }}>
                Créez 1 à 3 variantes. Chaque contact recevra une variante choisie aléatoirement pour un envoi plus naturel.
              </p>
              
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500' }}>Variante 1 *</label>
                <textarea
                  value={formData.variant1}
                  onChange={(e) => setFormData({ ...formData, variant1: e.target.value })}
                  rows="4"
                  placeholder="Première variante du message..."
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' }}
                />
              </div>
              
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500' }}>Variante 2 (optionnel)</label>
                <textarea
                  value={formData.variant2}
                  onChange={(e) => setFormData({ ...formData, variant2: e.target.value })}
                  rows="4"
                  placeholder="Deuxième variante du message..."
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' }}
                />
              </div>
              
              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500' }}>Variante 3 (optionnel)</label>
                <textarea
                  value={formData.variant3}
                  onChange={(e) => setFormData({ ...formData, variant3: e.target.value })}
                  rows="4"
                  placeholder="Troisième variante du message..."
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' }}
                />
              </div>
              
              <p style={{ fontSize: '11px', color: '#6c757d', marginTop: '8px' }}>
                💡 Astuce: Utilisez au moins 2 variantes pour un envoi plus naturel et moins détectable comme spam.
              </p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Numéro expéditeur (optionnel)</label>
              <input
                type="text"
                value={formData.fromPhone}
                onChange={(e) => setFormData({ ...formData, fromPhone: e.target.value })}
                placeholder="Ex: +33123456789"
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
              <p style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                Laissé vide pour utiliser le numéro par défaut configuré
              </p>
            </div>

            <button
              type="submit"
              disabled={sending}
              className="admin-btn admin-btn-success"
              style={{ width: '100%', fontSize: '14px', padding: '10px' }}
            >
              {sending ? '⏳ Envoi en cours...' : `📤 Envoyer à ${tagLabels[formData.tag]}`}
            </button>
          </form>
        </div>

        <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>📋 Tags disponibles</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e9ecef' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '600' }}>✅ Actifs</span>
                <span style={{ fontSize: '14px', color: '#6c757d' }}>{stats?.byUserStatus?.active || 0} utilisateurs</span>
              </div>
              <p style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                Utilisateurs avec statut "active" sur la plateforme
              </p>
            </div>
            <div style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e9ecef' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '600' }}>⏳ En attente</span>
                <span style={{ fontSize: '14px', color: '#6c757d' }}>{stats?.byUserStatus?.pending || 0} utilisateurs</span>
              </div>
              <p style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                Utilisateurs avec statut "pending" sur la plateforme
              </p>
            </div>
            <div style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e9ecef' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '600' }}>❌ Inactifs</span>
                <span style={{ fontSize: '14px', color: '#6c757d' }}>{stats?.byUserStatus?.blocked || 0} utilisateurs</span>
              </div>
              <p style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                Utilisateurs avec statut "blocked" sur la plateforme
              </p>
            </div>
            <div style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e9ecef' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '600' }}>📱 Tous</span>
                <span style={{ fontSize: '14px', color: '#6c757d' }}>{stats?.active || 0} utilisateurs</span>
              </div>
              <p style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                Tous les utilisateurs avec un numéro de téléphone
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
            {sendResults.read > 0 && (
              <div style={{ padding: '12px', backgroundColor: '#b3e5fc', borderRadius: '6px', border: '1px solid #29b6f6' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#01579b' }}>{sendResults.read || 0}</div>
                <div style={{ fontSize: '12px', color: '#01579b' }}>👁️ Lus</div>
              </div>
            )}
            <div style={{ padding: '12px', backgroundColor: '#fff3e0', borderRadius: '6px', border: '1px solid #ff9800' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#e65100' }}>{sendResults.failed || 0}</div>
              <div style={{ fontSize: '12px', color: '#e65100' }}>❌ Échecs</div>
            </div>
            {sendResults.skipped > 0 && (
              <div style={{ padding: '12px', backgroundColor: '#f3e5f5', borderRadius: '6px', border: '1px solid #9c27b0' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#6a1b9a' }}>{sendResults.skipped || 0}</div>
                <div style={{ fontSize: '12px', color: '#6a1b9a' }}>⚠️ Ignorés</div>
              </div>
            )}
            {sendResults.quotaReached && (
              <div style={{ padding: '12px', backgroundColor: '#fff9c4', borderRadius: '6px', border: '1px solid #fbc02d' }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#f57f17' }}>⏸️ Interrompu</div>
                <div style={{ fontSize: '11px', color: '#f57f17' }}>Quota ou plage horaire</div>
              </div>
            )}
            <div style={{ padding: '12px', backgroundColor: '#e3f2fd', borderRadius: '6px', border: '1px solid #2196f3' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1565c0' }}>{sendResults.total || 0}</div>
              <div style={{ fontSize: '12px', color: '#1565c0' }}>📱 Total</div>
            </div>
          </div>
          {sendResults.phoneNumbers && sendResults.phoneNumbers.length > 0 && (
            <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#e8f5e9', borderRadius: '6px', border: '1px solid #4caf50' }}>
              <div style={{ fontWeight: '600', marginBottom: '8px', color: '#2e7d32' }}>📱 Numéros des destinataires ({sendResults.phoneNumbers.length}):</div>
              <div style={{ fontSize: '12px', maxHeight: '200px', overflowY: 'auto', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {sendResults.phoneNumbers.map((phone, idx) => (
                  <div key={idx} style={{ padding: '4px 8px', backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #c8e6c9' }}>
                    {phone}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {sendResults.failedPhones && sendResults.failedPhones.length > 0 && (
            <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#ffebee', borderRadius: '6px', border: '1px solid #f44336' }}>
              <div style={{ fontWeight: '600', marginBottom: '8px', color: '#c62828' }}>Numéros en échec:</div>
              <div style={{ fontSize: '12px', maxHeight: '150px', overflowY: 'auto' }}>
                {sendResults.failedPhones.map((item, idx) => (
                  <div key={idx} style={{ padding: '4px 0', borderBottom: '1px solid #ffcdd2' }}>
                    <strong>{item.phone}</strong>: {item.error}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {campaigns.length > 0 && (
        <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>📋 Campagnes précédentes</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Nom</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Statut</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Envoyés</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign, idx) => (
                  <tr key={campaign._id} style={{ borderBottom: '1px solid #dee2e6', backgroundColor: idx % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                    <td style={{ padding: '12px' }}>{campaign.name}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        fontSize: '12px',
                        backgroundColor: campaign.status === 'sent' ? '#d1fae5' : campaign.status === 'failed' ? '#fee2e2' : '#fef3c7',
                        color: campaign.status === 'sent' ? '#065f46' : campaign.status === 'failed' ? '#991b1b' : '#92400e'
                      }}>
                        {campaign.status === 'sent' ? '✅ Envoyé' : campaign.status === 'failed' ? '❌ Échoué' : '⏳ ' + campaign.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>{campaign.stats?.sent || 0}</td>
                    <td style={{ padding: '12px', fontSize: '12px', color: '#6c757d' }}>
                      {campaign.sentAt ? new Date(campaign.sentAt).toLocaleDateString('fr-FR') : new Date(campaign.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

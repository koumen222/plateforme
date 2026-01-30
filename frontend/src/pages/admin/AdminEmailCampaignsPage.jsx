import { useState, useEffect } from 'react'
import { CONFIG } from '../../config/config'
import { useAuth } from '../../contexts/AuthContext'

export default function AdminEmailCampaignsPage() {
  const { token } = useAuth()
  const [campaigns, setCampaigns] = useState([])
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [notification, setNotification] = useState(null)
  
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    templateId: '',
    content: { html: '', text: '' },
    recipients: { type: 'all', segment: 'active', customEmails: [] },
    scheduledAt: '',
    fromEmail: process.env.EMAIL_FROM || 'contact@infomania.store',
    fromName: 'Infomania',
    replyTo: process.env.EMAIL_REPLY_TO || 'contact@infomania.store'
  })

  useEffect(() => {
    if (token) {
      fetchCampaigns()
      fetchTemplates()
    }
  }, [token, statusFilter])

  const fetchCampaigns = async () => {
    if (!token) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: '1', limit: '50' })
      if (statusFilter !== 'all') params.append('status', statusFilter)

      const response = await fetch(`${CONFIG.BACKEND_URL}/api/email-campaigns?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setCampaigns(data.campaigns || [])
      }
    } catch (error) {
      showNotification('Erreur chargement campagnes', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchTemplates = async () => {
    if (!token) return
    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/email-templates`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Erreur templates:', error)
    }
  }

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const handleTemplateSelect = async (templateId) => {
    if (!templateId) return
    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/email-templates/${templateId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setFormData(prev => ({
          ...prev,
          templateId: templateId,
          subject: data.template.subject,
          content: data.template.content
        }))
      }
    } catch (error) {
      console.error('Erreur chargement template:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const url = editingId
        ? `${CONFIG.BACKEND_URL}/api/email-campaigns/${editingId}`
        : `${CONFIG.BACKEND_URL}/api/email-campaigns`
      
      const method = editingId ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        showNotification(editingId ? 'Campagne mise à jour' : 'Campagne créée')
        setShowCreate(false)
        setEditingId(null)
        resetForm()
        fetchCampaigns()
      } else {
        const data = await response.json()
        showNotification(data.error || 'Erreur', 'error')
      }
    } catch (error) {
      showNotification('Erreur sauvegarde', 'error')
    }
  }

  const handleSend = async (id) => {
    if (!confirm('Envoyer cette campagne maintenant ?')) return
    
    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/email-campaigns/${id}/send`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.ok) {
        showNotification('Envoi en cours...')
        setTimeout(() => fetchCampaigns(), 2000)
      } else {
        const data = await response.json()
        showNotification(data.error || 'Erreur envoi', 'error')
      }
    } catch (error) {
      showNotification('Erreur envoi', 'error')
    }
  }

  const handleEdit = (campaign) => {
    setFormData({
      name: campaign.name,
      subject: campaign.subject,
      templateId: campaign.templateId?._id || '',
      content: campaign.content,
      recipients: campaign.recipients,
      scheduledAt: campaign.scheduledAt ? new Date(campaign.scheduledAt).toISOString().slice(0, 16) : '',
      fromEmail: campaign.fromEmail,
      fromName: campaign.fromName,
      replyTo: campaign.replyTo
    })
    setEditingId(campaign._id)
    setShowCreate(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      subject: '',
      templateId: '',
      content: { html: '', text: '' },
      recipients: { type: 'all', segment: 'active', customEmails: [] },
      scheduledAt: '',
      fromEmail: process.env.EMAIL_FROM || 'noreply@infomania.store',
      fromName: 'Infomania',
      replyTo: process.env.EMAIL_REPLY_TO || 'contact@infomania.store'
    })
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const getStatusBadge = (status) => {
    const badges = {
      draft: { label: 'Brouillon', class: 'admin-badge-pending' },
      scheduled: { label: 'Programmée', class: 'admin-badge-active' },
      sending: { label: 'Envoi...', class: 'admin-badge-active' },
      sent: { label: 'Envoyée', class: 'admin-badge-success' },
      paused: { label: 'En pause', class: 'admin-badge-pending' },
      cancelled: { label: 'Annulée', class: 'admin-badge-inactive' }
    }
    return badges[status] || badges.draft
  }

  if (loading && !campaigns.length) {
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
          <h1>📬 Campagnes Email</h1>
          <p>Créer et gérer vos campagnes marketing</p>
        </div>
        <button
          onClick={() => { resetForm(); setEditingId(null); setShowCreate(true); }}
          className="admin-btn admin-btn-success"
        >
          ➕ Nouvelle campagne
        </button>
      </div>

      {showCreate && (
        <div style={{ marginBottom: '20px', padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ marginBottom: '20px' }}>{editingId ? 'Modifier' : 'Nouvelle'} campagne</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Nom de la campagne *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Template</label>
                <select
                  value={formData.templateId}
                  onChange={(e) => handleTemplateSelect(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                >
                  <option value="">Sélectionner un template</option>
                  {templates.map(t => (
                    <option key={t._id} value={t._id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Sujet *</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                required
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Contenu HTML *</label>
              <textarea
                value={formData.content.html}
                onChange={(e) => setFormData({ ...formData, content: { ...formData.content, html: e.target.value } })}
                required
                rows="10"
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', fontFamily: 'monospace' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Destinataires</label>
                <select
                  value={formData.recipients.type}
                  onChange={(e) => setFormData({ ...formData, recipients: { ...formData.recipients, type: e.target.value } })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                >
                  <option value="all">Tous les abonnés actifs</option>
                  <option value="segment">Segment</option>
                  <option value="list">Liste personnalisée</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Programmer l'envoi</label>
                <input
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="admin-btn admin-btn-success">
                {editingId ? 'Mettre à jour' : 'Créer'}
              </button>
              <button type="button" onClick={() => { setShowCreate(false); resetForm(); setEditingId(null); }} className="admin-btn">
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="admin-filter-bar">
        <button
          onClick={() => setStatusFilter('all')}
          className={`admin-filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
        >
          Toutes
        </button>
        <button
          onClick={() => setStatusFilter('draft')}
          className={`admin-filter-btn ${statusFilter === 'draft' ? 'active' : ''}`}
        >
          Brouillons
        </button>
        <button
          onClick={() => setStatusFilter('scheduled')}
          className={`admin-filter-btn ${statusFilter === 'scheduled' ? 'active' : ''}`}
        >
          Programmées
        </button>
        <button
          onClick={() => setStatusFilter('sent')}
          className={`admin-filter-btn ${statusFilter === 'sent' ? 'active' : ''}`}
        >
          Envoyées
        </button>
      </div>

      <div style={{ backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
              <th className="px-4 py-3 text-left text-sm font-semibold">Nom</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Sujet</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Destinataires</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Statut</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Stats</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((campaign, index) => {
              const badge = getStatusBadge(campaign.status)
              return (
                <tr key={campaign._id} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                  <td className="px-4 py-3 text-sm font-semibold">{campaign.name}</td>
                  <td className="px-4 py-3 text-sm">{campaign.subject}</td>
                  <td className="px-4 py-3 text-sm">{campaign.recipients.count || 0}</td>
                  <td className="px-4 py-3">
                    <span className={`admin-badge ${badge.class}`}>{badge.label}</span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {campaign.stats?.sent > 0 && (
                      <div style={{ fontSize: '11px' }}>
                        Envoyés: {campaign.stats.sent}<br/>
                        {campaign.stats.opened > 0 && `Ouverts: ${campaign.stats.opened} (${Math.round(campaign.stats.opened / campaign.stats.sent * 100)}%)`}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {campaign.scheduledAt ? formatDate(campaign.scheduledAt) : formatDate(campaign.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {campaign.status === 'draft' && (
                        <button
                          onClick={() => handleSend(campaign._id)}
                          className="admin-btn admin-btn-sm admin-btn-success"
                          style={{ fontSize: '11px', padding: '4px 8px' }}
                        >
                          📤 Envoyer
                        </button>
                      )}
                      {campaign.status !== 'sent' && (
                        <button
                          onClick={() => handleEdit(campaign)}
                          className="admin-btn admin-btn-sm"
                          style={{ fontSize: '11px', padding: '4px 8px' }}
                        >
                          ✏️ Modifier
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

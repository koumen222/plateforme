import { useState, useEffect } from 'react'
import { CONFIG } from '../../config/config'
import { useAuth } from '../../contexts/AuthContext'

export default function AdminEmailTemplatesPage() {
  const { token } = useAuth()
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [notification, setNotification] = useState(null)
  
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    content: { html: '', text: '' },
    category: 'newsletter',
    variables: []
  })

  useEffect(() => {
    if (token) {
      fetchTemplates()
    }
  }, [token, categoryFilter])

  const fetchTemplates = async () => {
    if (!token) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (categoryFilter !== 'all') params.append('category', categoryFilter)

      const response = await fetch(`${CONFIG.BACKEND_URL}/api/email-templates?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      showNotification('Erreur chargement templates', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const url = editingId
        ? `${CONFIG.BACKEND_URL}/api/email-templates/${editingId}`
        : `${CONFIG.BACKEND_URL}/api/email-templates`
      
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
        showNotification(editingId ? 'Template mis à jour' : 'Template créé')
        setShowCreate(false)
        setEditingId(null)
        resetForm()
        fetchTemplates()
      } else {
        const data = await response.json()
        showNotification(data.error || 'Erreur', 'error')
      }
    } catch (error) {
      showNotification('Erreur sauvegarde', 'error')
    }
  }

  const handleEdit = (template) => {
    setFormData({
      name: template.name,
      subject: template.subject,
      content: template.content,
      category: template.category,
      variables: template.variables || []
    })
    setEditingId(template._id)
    setShowCreate(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce template ?')) return
    
    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/email-templates/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.ok) {
        showNotification('Template supprimé')
        fetchTemplates()
      }
    } catch (error) {
      showNotification('Erreur suppression', 'error')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      subject: '',
      content: { html: '', text: '' },
      category: 'newsletter',
      variables: []
    })
  }

  const insertVariable = (variable) => {
    const textarea = document.getElementById('html-content')
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const text = textarea.value
      const before = text.substring(0, start)
      const after = text.substring(end, text.length)
      const newText = before + `{{${variable}}}` + after
      setFormData({ ...formData, content: { ...formData.content, html: newText } })
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const categoryLabels = {
    newsletter: 'Newsletter',
    announcement: 'Annonce',
    promotional: 'Promotion',
    transactional: 'Transactionnel',
    welcome: 'Bienvenue',
    other: 'Autre'
  }

  if (loading && !templates.length) {
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
          <h1>📝 Templates Email</h1>
          <p>Créer et gérer vos templates d'emails</p>
        </div>
        <button
          onClick={() => { resetForm(); setEditingId(null); setShowCreate(true); }}
          className="admin-btn admin-btn-success"
        >
          ➕ Nouveau template
        </button>
      </div>

      {showCreate && (
        <div style={{ marginBottom: '20px', padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ marginBottom: '20px' }}>{editingId ? 'Modifier' : 'Nouveau'} template</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Nom *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Catégorie</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                >
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ fontWeight: '600' }}>Contenu HTML *</label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {['name', 'email', 'unsubscribeUrl'].map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => insertVariable(v)}
                      style={{ fontSize: '11px', padding: '2px 6px', backgroundColor: '#e9ecef', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                id="html-content"
                value={formData.content.html}
                onChange={(e) => setFormData({ ...formData, content: { ...formData.content, html: e.target.value } })}
                required
                rows="15"
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', fontFamily: 'monospace' }}
              />
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
          onClick={() => setCategoryFilter('all')}
          className={`admin-filter-btn ${categoryFilter === 'all' ? 'active' : ''}`}
        >
          Toutes
        </button>
        {Object.entries(categoryLabels).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setCategoryFilter(value)}
            className={`admin-filter-btn ${categoryFilter === value ? 'active' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
        {templates.map((template) => (
          <div key={template._id} style={{ padding: '16px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>{template.name}</h3>
              <span style={{ fontSize: '11px', padding: '2px 8px', backgroundColor: '#e9ecef', borderRadius: '4px' }}>
                {categoryLabels[template.category]}
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#6c757d', marginBottom: '12px' }}>{template.subject}</p>
            <div style={{ fontSize: '11px', color: '#6c757d', marginBottom: '12px' }}>
              Créé le {formatDate(template.createdAt)}
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={() => handleEdit(template)}
                className="admin-btn admin-btn-sm"
                style={{ fontSize: '11px', padding: '4px 8px' }}
              >
                ✏️ Modifier
              </button>
              <button
                onClick={() => handleDelete(template._id)}
                className="admin-btn admin-btn-sm admin-btn-danger"
                style={{ fontSize: '11px', padding: '4px 8px' }}
              >
                🗑️ Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { CONFIG } from '../../config/config'
import { useAuth } from '../../contexts/AuthContext'

export default function AdminEbooksPage() {
  const { token } = useAuth()
  const [ebooks, setEbooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [notification, setNotification] = useState(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: 100,
    currency: 'XAF',
    content: '',
    coverImage: '',
    fileUrl: '',
    isActive: true
  })

  useEffect(() => {
    if (token) {
      fetchEbooks()
    }
  }, [token])

  const fetchEbooks = async () => {
    if (!token) return
    setLoading(true)
    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/ebooks/admin/all`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setEbooks(data.ebooks || [])
      }
    } catch (error) {
      showNotification('Erreur chargement ebooks', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 5000)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.title || !formData.description || !formData.content) {
      showNotification('Titre, description et contenu requis', 'error')
      return
    }

    try {
      const url = editingId 
        ? `${CONFIG.BACKEND_URL}/api/ebooks/${editingId}`
        : `${CONFIG.BACKEND_URL}/api/ebooks`
      
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
        showNotification(editingId ? 'Ebook mis à jour' : 'Ebook créé', 'success')
        setShowCreate(false)
        setEditingId(null)
        resetForm()
        fetchEbooks()
      } else {
        const errorData = await response.json()
        showNotification(errorData.error || 'Erreur', 'error')
      }
    } catch (error) {
      showNotification('Erreur lors de la sauvegarde', 'error')
    }
  }

  const handleEdit = (ebook) => {
    setEditingId(ebook._id)
    setFormData({
      title: ebook.title || '',
      description: ebook.description || '',
      price: ebook.price || 500,
      currency: ebook.currency || 'XAF',
      content: ebook.content || '',
      coverImage: ebook.coverImage || '',
      fileUrl: ebook.fileUrl || '',
      isActive: ebook.isActive !== undefined ? ebook.isActive : true
    })
    setShowCreate(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cet ebook ?')) return

    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/ebooks/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.ok) {
        showNotification('Ebook supprimé', 'success')
        fetchEbooks()
      } else {
        const errorData = await response.json()
        showNotification(errorData.error || 'Erreur', 'error')
      }
    } catch (error) {
      showNotification('Erreur lors de la suppression', 'error')
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      price: 100,
      currency: 'XAF',
      content: '',
      coverImage: '',
      fileUrl: '',
      isActive: true
    })
    setEditingId(null)
  }

  const createTestEbook = async () => {
    const testEbook = {
      title: 'Guide E-commerce Starter 3.0',
      description: 'Un guide complet pour démarrer votre business e-commerce avec succès. Découvrez les stratégies, outils et techniques pour créer une boutique en ligne rentable.',
      price: 100,
      currency: 'XAF',
      content: `
        <h1>Guide E-commerce Starter 3.0</h1>
        <h2>Introduction</h2>
        <p>Bienvenue dans ce guide complet pour démarrer votre business e-commerce. Ce guide vous accompagnera étape par étape dans la création de votre boutique en ligne.</p>
        
        <h2>Chapitre 1 : Les Fondamentaux</h2>
        <p>Avant de commencer, il est essentiel de comprendre les bases de l'e-commerce...</p>
        
        <h2>Chapitre 2 : Choisir votre Niche</h2>
        <p>La sélection de votre niche est cruciale pour le succès de votre business...</p>
        
        <h2>Chapitre 3 : Trouver des Produits</h2>
        <p>Découvrez comment identifier et sourcer des produits rentables...</p>
        
        <h2>Chapitre 4 : Créer votre Boutique</h2>
        <p>Guide étape par étape pour créer votre boutique en ligne...</p>
        
        <h2>Chapitre 5 : Marketing et Ventes</h2>
        <p>Stratégies de marketing digital pour promouvoir votre boutique...</p>
        
        <h2>Conclusion</h2>
        <p>Vous avez maintenant toutes les clés pour démarrer votre business e-commerce. Bonne chance !</p>
      `,
      coverImage: '',
      fileUrl: '',
      isActive: true
    }

    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/ebooks`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testEbook)
      })

      if (response.ok) {
        showNotification('Ebook de test créé avec succès', 'success')
        fetchEbooks()
      } else {
        const errorData = await response.json()
        showNotification(errorData.error || 'Erreur création ebook test', 'error')
      }
    } catch (error) {
      showNotification('Erreur lors de la création', 'error')
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div>Chargement...</div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600' }}>📚 Gestion des Ebooks</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={createTestEbook}
            className="admin-btn"
            style={{ backgroundColor: '#2196f3', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer' }}
          >
            ➕ Créer ebook de test
          </button>
          <button
            onClick={() => {
              resetForm()
              setShowCreate(true)
            }}
            className="admin-btn admin-btn-success"
          >
            ➕ Nouvel ebook
          </button>
        </div>
      </div>

      {notification && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: '20px',
            borderRadius: '6px',
            backgroundColor: notification.type === 'success' ? '#e8f5e9' : '#ffebee',
            color: notification.type === 'success' ? '#2e7d32' : '#c62828',
            border: `1px solid ${notification.type === 'success' ? '#4caf50' : '#f44336'}`
          }}
        >
          {notification.message}
        </div>
      )}

      {showCreate && (
        <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <h2 style={{ marginBottom: '20px' }}>{editingId ? 'Modifier l\'ebook' : 'Nouvel ebook'}</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Titre *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Prix (FCFA) *</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 100 })}
                  required
                  min="0"
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows="3"
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Contenu (HTML) *</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                required
                rows="10"
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', fontFamily: 'monospace' }}
                placeholder="<h1>Titre</h1><p>Contenu...</p>"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Image de couverture (URL)</label>
                <input
                  type="url"
                  value={formData.coverImage}
                  onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                  placeholder="https://..."
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Fichier PDF (URL)</label>
                <input
                  type="url"
                  value={formData.fileUrl}
                  onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                <span>Actif</span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" className="admin-btn admin-btn-success">
                {editingId ? '💾 Enregistrer' : '➕ Créer'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreate(false)
                  resetForm()
                }}
                className="admin-btn"
                style={{ backgroundColor: '#6c757d', color: 'white' }}
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Titre</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Prix</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Achats</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Statut</th>
              <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {ebooks.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>
                  Aucun ebook trouvé
                </td>
              </tr>
            ) : (
              ebooks.map((ebook) => (
                <tr key={ebook._id} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: '600' }}>{ebook.title}</div>
                    <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                      {ebook.description?.substring(0, 60)}...
                    </div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    {ebook.price} {ebook.currency}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {ebook.purchaseCount || 0}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor: ebook.isActive ? '#e8f5e9' : '#ffebee',
                        color: ebook.isActive ? '#2e7d32' : '#c62828'
                      }}
                    >
                      {ebook.isActive ? '✅ Actif' : '❌ Inactif'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleEdit(ebook)}
                        className="admin-btn"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        ✏️ Modifier
                      </button>
                      <button
                        onClick={() => window.open(`/ebook/${ebook._id}`, '_blank')}
                        className="admin-btn"
                        style={{ padding: '6px 12px', fontSize: '12px', backgroundColor: '#2196f3', color: 'white' }}
                      >
                        👁️ Voir
                      </button>
                      <button
                        onClick={() => handleDelete(ebook._id)}
                        className="admin-btn"
                        style={{ padding: '6px 12px', fontSize: '12px', backgroundColor: '#f44336', color: 'white' }}
                      >
                        🗑️ Supprimer
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
  )
}

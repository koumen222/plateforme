import { useState, useEffect } from 'react'
import { CONFIG } from '../../config/config'
import { useAuth } from '../../contexts/AuthContext'
import { getImageUrl, handleImageError } from '../../utils/imageUtils'
import axios from 'axios'
import { FiBook, FiUpload, FiDownload, FiEdit, FiTrash2, FiX, FiCheck } from 'react-icons/fi'

export default function AdminRessourcesPdfPage() {
  const { token } = useAuth()
  const [ressourcesPdf, setRessourcesPdf] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    coverImage: '/img/ressource-pdf-default.png',
    pdfUrl: '',
    slug: '',
    category: 'Général',
    author: 'Ecom Starter',
    pages: 0,
    price: 0,
    isFree: true,
    isPublished: false
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editFormData, setEditFormData] = useState(null)
  const categoryOptions = [
    'Général',
    ...new Set((ressourcesPdf || []).map((item) => item.category).filter(Boolean))
  ]

  useEffect(() => {
    if (token) {
      fetchRessourcesPdf()
    }
  }, [token])

  const fetchRessourcesPdf = async () => {
    try {
      setLoading(true)
      setError('')
      
      if (!token) {
        setError('Token manquant. Veuillez vous reconnecter.')
        console.error('❌ Token manquant dans AdminRessourcesPdfPage')
        return
      }
      
      console.log('📥 Appel API /api/admin/ressources-pdf')
      console.log('   - Backend URL:', CONFIG.BACKEND_URL)
      console.log('   - Token présent:', !!token)
      console.log('   - Token length:', token?.length)
      
      const response = await axios.get(`${CONFIG.BACKEND_URL}/api/admin/ressources-pdf`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      })
      
      if (response.data.success) {
        setRessourcesPdf(response.data.ressourcesPdf || [])
        console.log('✅ Ressources PDF chargées:', response.data.ressourcesPdf?.length || 0)
      }
    } catch (err) {
      console.error('❌ Erreur chargement ressources PDF:', err)
      console.error('   - Status:', err.response?.status)
      console.error('   - Message:', err.response?.data?.error || err.message)
      
      if (err.response?.status === 401) {
        setError('Token invalide ou expiré. Veuillez vous reconnecter.')
        // Optionnel : rediriger vers la page de login
        // window.location.href = '/admin/login'
      } else {
        setError(err.response?.data?.error || 'Erreur lors du chargement des ressources PDF')
      }
    } finally {
      setLoading(false)
    }
  }

  // Les uploads de fichiers ont été supprimés - utilisation uniquement d'URLs (Google Drive, etc.)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    // Vérifier qu'une URL PDF est fournie
    if (!formData.pdfUrl || (!formData.pdfUrl.startsWith('http://') && !formData.pdfUrl.startsWith('https://'))) {
      setError('Veuillez fournir une URL valide pour le PDF (ex: Google Drive)')
      setSubmitting(false)
      return
    }

    try {
      const response = await axios.post(
        `${CONFIG.BACKEND_URL}/api/ressources-pdf`,
        formData,
        { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      )

      if (response.data.success) {
        setSuccess('✅ Ressource PDF créée avec succès !')
        setShowAddForm(false)
        setFormData({
          title: '',
          description: '',
          coverImage: '/img/ressource-pdf-default.png',
          pdfUrl: '',
          slug: '',
          category: 'Général',
          author: 'Ecom Starter',
          pages: 0,
          price: 0,
          isFree: true,
          isPublished: false
        })
        fetchRessourcesPdf()
        setTimeout(() => setSuccess(''), 5000)
      }
    } catch (err) {
      console.error('Erreur création ressource PDF:', err)
      setError(err.response?.data?.error || err.response?.data?.details || 'Erreur lors de la création de la ressource PDF')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (ressourcePdf) => {
    setEditingId(ressourcePdf._id)
    setEditFormData({
      title: ressourcePdf.title,
      description: ressourcePdf.description,
      coverImage: ressourcePdf.coverImage,
      pdfUrl: ressourcePdf.pdfUrl,
      slug: ressourcePdf.slug,
      category: ressourcePdf.category,
      author: ressourcePdf.author,
      pages: ressourcePdf.pages,
      price: ressourcePdf.price,
      isFree: ressourcePdf.isFree,
      isPublished: ressourcePdf.isPublished
    })
  }

  const handleUpdate = async () => {
    if (!editingId || !editFormData) return

    setSubmitting(true)
    setError('')
    setSuccess('')

    // Vérifier qu'une URL PDF valide est fournie
    if (!editFormData.pdfUrl || (!editFormData.pdfUrl.startsWith('http://') && !editFormData.pdfUrl.startsWith('https://'))) {
      setError('Veuillez fournir une URL valide pour le PDF (ex: Google Drive)')
      setSubmitting(false)
      return
    }

    try {
      const response = await axios.put(
        `${CONFIG.BACKEND_URL}/api/ressources-pdf/${editingId}`,
        editFormData,
        { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      )

      if (response.data.success) {
        setSuccess('✅ Ressource PDF mise à jour avec succès !')
        setEditingId(null)
        setEditFormData(null)
        fetchRessourcesPdf()
        setTimeout(() => setSuccess(''), 5000)
      }
    } catch (err) {
      console.error('Erreur mise à jour ressource PDF:', err)
      setError(err.response?.data?.error || 'Erreur lors de la mise à jour')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette ressource PDF ?')) return

    try {
      const response = await axios.delete(
        `${CONFIG.BACKEND_URL}/api/admin/ressources-pdf/${id}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      )

      if (response.data.success) {
        setSuccess('✅ Ressource PDF supprimée avec succès !')
        fetchRessourcesPdf()
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err) {
      console.error('Erreur suppression ressource PDF:', err)
      setError(err.response?.data?.error || 'Erreur lors de la suppression')
    }
  }

  const handleTogglePublish = async (id, currentStatus) => {
    try {
      const response = await axios.put(
        `${CONFIG.BACKEND_URL}/api/admin/ressources-pdf/${id}`,
        { isPublished: !currentStatus },
        { headers: { 'Authorization': `Bearer ${token}` } }
      )

      if (response.data.success) {
        setSuccess(`✅ Ressource PDF ${!currentStatus ? 'publiée' : 'dépubliée'} !`)
        fetchRessourcesPdf()
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err) {
      console.error('Erreur changement statut:', err)
      setError(err.response?.data?.error || 'Erreur lors de la mise à jour')
    }
  }

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-page-header">
          <h1>📄 Gestion des Ressources PDF</h1>
        </div>
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-secondary">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-page admin-ressources-pdf-page">
      <div className="admin-page-header">
        <div className="admin-page-title-row">
          <div>
            <h1>📄 Gestion des Ressources PDF</h1>
            <p className="admin-page-subtitle">Créez et gérez les ressources PDF de la plateforme</p>
          </div>
          <div className="admin-header-actions">
            <button
              onClick={() => {
                setShowAddForm(!showAddForm)
                setError('')
                setSuccess('')
                setEditingId(null)
                setEditFormData(null)
              }}
              className={`admin-btn ${showAddForm ? 'admin-btn-secondary' : 'admin-btn-primary'}`}
            >
              {showAddForm ? '✕ Annuler' : '➕ Nouvelle ressource PDF'}
            </button>
          </div>
        </div>
      </div>

      {(error || success) && (
        <div className={`admin-alert ${error ? 'admin-alert-error' : 'admin-alert-success'}`}>
          <span className="admin-alert-icon">{error ? '❌' : '✅'}</span>
          <span>{error || success}</span>
        </div>
      )}

      {showAddForm && (
        <div className="admin-form-card">
          <h2 className="admin-form-title">Nouvelle ressource PDF</h2>
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="admin-form-group">
              <label>Titre *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => {
                  const title = e.target.value
                  setFormData(prev => ({
                    ...prev,
                    title,
                    slug: prev.slug || generateSlug(title)
                  }))
                }}
                required
                placeholder="Ex: Guide Facebook Ads"
              />
            </div>

            <div className="admin-form-group">
              <label>Slug *</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                required
                placeholder="Ex: guide-facebook-ads"
              />
            </div>

            <div className="admin-form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows="3"
                placeholder="Description de la ressource PDF"
              />
            </div>

            <div className="admin-form-group">
              <label>URL du PDF (Google Drive, etc.) *</label>
              <input
                type="url"
                value={formData.pdfUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, pdfUrl: e.target.value }))}
                placeholder="https://drive.google.com/file/d/..."
                required
                className="w-full"
              />
              {formData.pdfUrl && (
                <a href={formData.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-accent hover:underline mt-1 block">
                  🔗 Vérifier le lien
                </a>
              )}
            </div>

            <div className="admin-form-group">
              <label>URL de l'image de couverture</label>
              <input
                type="url"
                value={formData.coverImage}
                onChange={(e) => setFormData(prev => ({ ...prev, coverImage: e.target.value }))}
                placeholder="https://..."
                className="w-full"
              />
              {formData.coverImage && formData.coverImage.startsWith('http') && (
                <img
                  src={formData.coverImage}
                  alt="Couverture"
                  className="w-32 h-32 object-cover rounded-lg border border-theme mt-2"
                />
              )}
            </div>

            <div className="admin-form-row">
              <div className="admin-form-group">
                <label>Catégorie</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                >
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-form-group">
                <label>Auteur</label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                  placeholder="Ex: Ecom Starter"
                />
              </div>
            </div>

            <div className="admin-form-group">
              <label>Nombre de pages</label>
              <input
                type="number"
                value={formData.pages}
                onChange={(e) => setFormData(prev => ({ ...prev, pages: parseInt(e.target.value) || 0 }))}
                min="0"
              />
            </div>

            <div className="admin-form-group">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isFree}
                  onChange={(e) => {
                    const isFree = e.target.checked
                    setFormData(prev => ({
                      ...prev,
                      isFree,
                      price: 0 // Toujours 0, le prix n'est pas utilisé
                    }))
                  }}
                  className="cursor-pointer"
                />
                <span>Gratuit</span>
              </label>
              <p className="text-xs text-secondary mt-1 ml-6">
                {formData.isFree 
                  ? '✅ Cette ressource PDF sera accessible gratuitement à tous les utilisateurs connectés'
                  : '🔒 Cette ressource PDF sera réservée aux utilisateurs abonnés (status: active). Les utilisateurs non abonnés devront payer l\'abonnement pour y accéder.'}
              </p>
            </div>

            <div className="admin-form-group">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData(prev => ({ ...prev, isPublished: e.target.checked }))}
                />
                Publié (visible sur le site)
              </label>
            </div>

            <div className="admin-form-actions">
              <button type="submit" className="admin-btn admin-btn-primary" disabled={submitting}>
                {submitting ? '⏳ Création...' : '✅ Créer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {editingId && editFormData && (
        <div className="admin-form-card">
          <h2 className="admin-form-title">Modifier la ressource PDF</h2>
          <div className="admin-form">
            <div className="admin-form-group">
              <label>Titre *</label>
              <input
                type="text"
                value={editFormData.title}
                onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>

            <div className="admin-form-group">
              <label>Slug *</label>
              <input
                type="text"
                value={editFormData.slug}
                onChange={(e) => setEditFormData(prev => ({ ...prev, slug: e.target.value }))}
                required
              />
            </div>

            <div className="admin-form-group">
              <label>Description</label>
              <textarea
                value={editFormData.description}
                onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                rows="3"
              />
            </div>

            <div className="admin-form-group">
              <label>URL du PDF (Google Drive, etc.) *</label>
              <input
                type="url"
                value={editFormData.pdfUrl}
                onChange={(e) => setEditFormData(prev => ({ ...prev, pdfUrl: e.target.value }))}
                placeholder="https://drive.google.com/file/d/..."
                required
                className="w-full"
              />
              {editFormData.pdfUrl && (
                <a href={editFormData.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-accent hover:underline mt-1 block">
                  🔗 Vérifier le lien
                </a>
              )}
            </div>

            <div className="admin-form-group">
              <label>URL de l'image de couverture</label>
              <input
                type="url"
                value={editFormData.coverImage}
                onChange={(e) => setEditFormData(prev => ({ ...prev, coverImage: e.target.value }))}
                placeholder="https://..."
                className="w-full"
              />
              {editFormData.coverImage && editFormData.coverImage.startsWith('http') && (
                <img
                  src={editFormData.coverImage}
                  alt="Couverture"
                  className="w-32 h-32 object-cover rounded-lg border border-theme mt-2"
                />
              )}
            </div>

            <div className="admin-form-row">
              <div className="admin-form-group">
                <label>Catégorie</label>
                <select
                  value={editFormData.category || 'Général'}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, category: e.target.value }))}
                >
                  {[editFormData.category, ...categoryOptions]
                    .filter(Boolean)
                    .filter((value, index, self) => self.indexOf(value) === index)
                    .map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                </select>
              </div>

              <div className="admin-form-group">
                <label>Auteur</label>
                <input
                  type="text"
                  value={editFormData.author}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, author: e.target.value }))}
                />
              </div>
            </div>

            <div className="admin-form-group">
              <label>Nombre de pages</label>
              <input
                type="number"
                value={editFormData.pages}
                onChange={(e) => setEditFormData(prev => ({ ...prev, pages: parseInt(e.target.value) || 0 }))}
                min="0"
              />
            </div>

            <div className="admin-form-group">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editFormData.isFree}
                  onChange={(e) => {
                    const isFree = e.target.checked
                    setEditFormData(prev => ({
                      ...prev,
                      isFree,
                      price: 0 // Toujours 0, le prix n'est pas utilisé
                    }))
                  }}
                  className="cursor-pointer"
                />
                <span>Gratuit</span>
              </label>
              <p className="text-xs text-secondary mt-1 ml-6">
                {editFormData.isFree 
                  ? '✅ Cette ressource PDF sera accessible gratuitement à tous les utilisateurs connectés'
                  : '🔒 Cette ressource PDF sera réservée aux utilisateurs abonnés (status: active). Les utilisateurs non abonnés devront payer l\'abonnement pour y accéder.'}
              </p>
            </div>

            <div className="admin-form-group">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editFormData.isPublished}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, isPublished: e.target.checked }))}
                />
                Publié (visible sur le site)
              </label>
            </div>

            <div className="admin-form-actions">
              <button
                onClick={handleUpdate}
                className="admin-btn admin-btn-primary"
                disabled={submitting}
              >
                {submitting ? '⏳ Mise à jour...' : '✅ Enregistrer'}
              </button>
              <button
                onClick={() => {
                  setEditingId(null)
                  setEditFormData(null)
                }}
                className="admin-btn admin-btn-secondary"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="admin-ressources-pdf-grid">
        {ressourcesPdf.map((ressourcePdf) => (
          <div key={ressourcePdf._id} className="admin-ressource-pdf-card">
            <div className="admin-ressource-pdf-card-header">
              <div className="admin-ressource-pdf-card-title">
                <h3>{ressourcePdf.title}</h3>
                <div className="admin-course-badges">
                  {ressourcePdf.isFree && (
                    <span className="admin-badge admin-badge-success">Gratuit</span>
                  )}
                  <span className={`admin-badge ${ressourcePdf.isPublished ? 'admin-badge-success' : 'admin-badge-inactive'}`}>
                    {ressourcePdf.isPublished ? '✓ Publié' : '○ Non publié'}
                  </span>
                </div>
              </div>
              <div className="admin-course-card-actions">
                <button
                  onClick={() => handleTogglePublish(ressourcePdf._id, ressourcePdf.isPublished)}
                  className={`admin-btn admin-btn-sm ${ressourcePdf.isPublished ? 'admin-btn-warning' : 'admin-btn-success'}`}
                >
                  {ressourcePdf.isPublished ? '⏸ Dépublier' : '▶ Publier'}
                </button>
                <button
                  onClick={() => handleEdit(ressourcePdf)}
                  className="admin-btn admin-btn-sm admin-btn-primary"
                >
                  <FiEdit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(ressourcePdf._id)}
                  className="admin-btn admin-btn-sm admin-btn-danger"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="admin-ressource-pdf-card-content">
              {ressourcePdf.coverImage && (
                <img
                  src={getImageUrl(ressourcePdf.coverImage)}
                  alt={ressourcePdf.title}
                  className="admin-ressource-pdf-cover"
                  onError={handleImageError()}
                />
              )}
              <div className="admin-ressource-pdf-info">
                <p className="admin-course-description">{ressourcePdf.description || 'Aucune description'}</p>
                <div className="admin-ressource-pdf-meta">
                  <span><strong>Catégorie:</strong> {ressourcePdf.category}</span>
                  <span><strong>Auteur:</strong> {ressourcePdf.author}</span>
                  {ressourcePdf.pages > 0 && <span><strong>Pages:</strong> {ressourcePdf.pages}</span>}
                  {!ressourcePdf.isFree && ressourcePdf.price > 0 && (
                    <span><strong>Prix:</strong> {ressourcePdf.price.toLocaleString('fr-FR')} FCFA</span>
                  )}
                  <span><strong>Téléchargements:</strong> {ressourcePdf.downloadCount || 0}</span>
                </div>
                {ressourcePdf.pdfUrl && (
                  <a
                    href={ressourcePdf.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="admin-btn admin-btn-sm admin-btn-secondary inline-flex items-center gap-2 mt-2"
                  >
                    <FiDownload className="w-4 h-4" />
                    Voir le PDF
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {ressourcesPdf.length === 0 && !showAddForm && (
        <div className="text-center py-12">
          <FiBook className="w-16 h-16 text-secondary mx-auto mb-4" />
          <p className="text-secondary text-lg">Aucune ressource PDF pour le moment</p>
          <p className="text-secondary">Cliquez sur "Nouvelle ressource PDF" pour en ajouter une</p>
        </div>
      )}
    </div>
  )
}


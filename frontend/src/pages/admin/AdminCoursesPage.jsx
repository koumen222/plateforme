import { useState, useEffect } from 'react'
import { CONFIG } from '../../config/config'
import { useAuth } from '../../contexts/AuthContext'
import axios from 'axios'
import '../../styles/admin.css'
import '../../styles/admin-courses.css'

export default function AdminCoursesPage() {
  const { token } = useAuth()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedCourseId, setExpandedCourseId] = useState(null)
  const [expandedCourse, setExpandedCourse] = useState(null)
  const [loadingExpanded, setLoadingExpanded] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    coverImage: '/img/fbads.svg',
    slug: '',
    isDefault: false,
    isPublished: false
  })
  const [submitting, setSubmitting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [initializing, setInitializing] = useState(false)
  const [moduleForm, setModuleForm] = useState({ title: '', order: '' })
  const [lessonForm, setLessonForm] = useState({ 
    moduleId: '', 
    title: '', 
    videoId: '', 
    videoType: 'vimeo', 
    order: '', 
    locked: false, 
    isCoaching: false 
  })
  const [savingModule, setSavingModule] = useState(false)
  const [savingLesson, setSavingLesson] = useState(false)
  const [editingLesson, setEditingLesson] = useState(null)
  const [editingCourse, setEditingCourse] = useState(null)
  const [editCourseForm, setEditCourseForm] = useState({
    title: '',
    description: '',
    coverImage: '',
    slug: '',
    isDefault: false,
    isPublished: false
  })
  const [uploadingEditImage, setUploadingEditImage] = useState(false)
  const [savingCourse, setSavingCourse] = useState(false)

  useEffect(() => {
    if (token) {
      fetchCourses()
    }
  }, [token])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${CONFIG.BACKEND_URL}/api/admin/courses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.data.success) {
        setCourses(response.data.courses || [])
      }
    } catch (err) {
      console.error('Erreur chargement cours:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchCourseDetails = async (courseId) => {
    try {
      setLoadingExpanded(true)
      const response = await axios.get(`${CONFIG.BACKEND_URL}/api/admin/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.success) {
        setExpandedCourse(response.data.course)
        const firstModuleId = response.data.course?.modules?.[0]?._id || ''
        setLessonForm((prev) => ({ ...prev, moduleId: prev.moduleId || firstModuleId }))
      }
    } catch (err) {
      console.error('Erreur chargement détails cours:', err)
      setError(err.response?.data?.error || 'Erreur lors du chargement du cours')
    } finally {
      setLoadingExpanded(false)
    }
  }

  const toggleCourseManage = async (courseId) => {
    setError('')
    setSuccess('')
    if (expandedCourseId === courseId) {
      setExpandedCourseId(null)
      setExpandedCourse(null)
      return
    }
    setExpandedCourseId(courseId)
    setExpandedCourse(null)
    await fetchCourseDetails(courseId)
  }

  const handleImageUpload = async (e, isEdit = false) => {
    const file = e.target.files[0]
    if (!file) return

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner une image valide')
      return
    }

    // Vérifier la taille (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('L\'image ne doit pas dépasser 5MB')
      return
    }

    if (isEdit) {
      setUploadingEditImage(true)
    } else {
      setUploadingImage(true)
    }
    setError('')

    try {
      const formDataUpload = new FormData()
      formDataUpload.append('image', file)

      const response = await axios.post(
        `${CONFIG.BACKEND_URL}/api/admin/upload/course-image`,
        formDataUpload,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      )

      if (response.data.success) {
        if (isEdit) {
          setEditCourseForm({
            ...editCourseForm,
            coverImage: response.data.imagePath
          })
        } else {
          setFormData({
            ...formData,
            coverImage: response.data.imagePath
          })
        }
        setSuccess('✅ Image uploadée avec succès !')
        setTimeout(() => setSuccess(''), 2000)
      }
    } catch (err) {
      console.error('Erreur upload image:', err)
      setError(err.response?.data?.error || 'Erreur lors de l\'upload de l\'image')
    } finally {
      if (isEdit) {
        setUploadingEditImage(false)
      } else {
        setUploadingImage(false)
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const response = await axios.post(
        `${CONFIG.BACKEND_URL}/api/admin/course`,
        formData,
        { headers: { 'Authorization': `Bearer ${token}` } }
      )

      if (response.data.success) {
        setSuccess('✅ Cours créé avec succès !')
        setShowAddForm(false)
        setFormData({
          title: '',
          description: '',
          coverImage: '/img/fbads.svg',
          slug: '',
          isDefault: false,
          isPublished: false
        })
        fetchCourses()
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err) {
      console.error('Erreur création cours:', err)
      setError(err.response?.data?.error || 'Erreur lors de la création du cours')
    } finally {
      setSubmitting(false)
    }
  }

  const handleTogglePublish = async (courseId, currentStatus) => {
    setError('')
    setSuccess('')
    try {
      const response = await axios.put(
        `${CONFIG.BACKEND_URL}/api/admin/course/${courseId}`,
        { isPublished: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (response.data.success) {
        setSuccess(`✅ Cours ${!currentStatus ? 'activé' : 'désactivé'} !`)
        fetchCourses()
        setTimeout(() => setSuccess(''), 2000)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la mise à jour')
    }
  }

  const handleDeleteCourse = async (courseId) => {
    if (!confirm('⚠️ Supprimer ce cours et tous ses modules/leçons ?')) return
    setError('')
    setSuccess('')
    try {
      const response = await axios.delete(
        `${CONFIG.BACKEND_URL}/api/admin/course/${courseId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (response.data.success) {
        setSuccess('✅ Cours supprimé !')
        fetchCourses()
        setTimeout(() => setSuccess(''), 2000)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la suppression')
    }
  }

  const handleAddModule = async (e) => {
    e.preventDefault()
    if (!expandedCourseId) return
    setSavingModule(true)
    setError('')
    setSuccess('')
    try {
      const payload = {
        title: moduleForm.title,
        order: moduleForm.order ? Number(moduleForm.order) : undefined
      }
      const res = await axios.post(
        `${CONFIG.BACKEND_URL}/api/admin/courses/${expandedCourseId}/modules`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (res.data.success) {
        setSuccess('✅ Module ajouté !')
        setModuleForm({ title: '', order: '' })
        await fetchCourseDetails(expandedCourseId)
        setTimeout(() => setSuccess(''), 2000)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'ajout du module')
    } finally {
      setSavingModule(false)
    }
  }

  const handleAddLesson = async (e) => {
    e.preventDefault()
    if (!lessonForm.moduleId) {
      setError('Veuillez sélectionner un module')
      return
    }
    setSavingLesson(true)
    setError('')
    setSuccess('')
    try {
      const payload = {
        title: lessonForm.title,
        videoId: lessonForm.videoId,
        videoType: lessonForm.videoType,
        order: lessonForm.order ? Number(lessonForm.order) : undefined,
        locked: lessonForm.locked,
        isCoaching: lessonForm.isCoaching
      }
      const res = await axios.post(
        `${CONFIG.BACKEND_URL}/api/admin/modules/${lessonForm.moduleId}/lessons`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (res.data.success) {
        setSuccess('✅ Leçon ajoutée !')
        setLessonForm({
          moduleId: lessonForm.moduleId,
          title: '',
          videoId: '',
          videoType: 'vimeo',
          order: '',
          locked: false,
          isCoaching: false
        })
        await fetchCourseDetails(expandedCourseId)
        setTimeout(() => setSuccess(''), 2000)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'ajout de la leçon')
    } finally {
      setSavingLesson(false)
    }
  }

  const handleDeleteModule = async (moduleId) => {
    if (!confirm('⚠️ Supprimer ce module et toutes ses leçons ?')) return
    setError('')
    setSuccess('')
    try {
      const res = await axios.delete(
        `${CONFIG.BACKEND_URL}/api/admin/modules/${moduleId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (res.data.success) {
        setSuccess('✅ Module supprimé !')
        await fetchCourseDetails(expandedCourseId)
        setTimeout(() => setSuccess(''), 2000)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la suppression')
    }
  }

  const handleDeleteLesson = async (lessonId) => {
    if (!confirm('⚠️ Supprimer cette leçon ?')) return
    setError('')
    setSuccess('')
    try {
      const res = await axios.delete(
        `${CONFIG.BACKEND_URL}/api/admin/lessons/${lessonId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (res.data.success) {
        setSuccess('✅ Leçon supprimée !')
        await fetchCourseDetails(expandedCourseId)
        setTimeout(() => setSuccess(''), 2000)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la suppression')
    }
  }

  const handleEditLesson = (lesson) => {
    setEditingLesson(lesson)
    setLessonForm({
      moduleId: lesson.moduleId,
      title: lesson.title,
      videoId: lesson.videoId,
      videoType: lesson.videoType || 'vimeo',
      order: lesson.order || '',
      locked: lesson.locked || false,
      isCoaching: lesson.isCoaching || false
    })
    // Scroll vers le formulaire
    setTimeout(() => {
      document.querySelector('.admin-lesson-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
  }

  const handleUpdateLesson = async (e) => {
    e.preventDefault()
    if (!editingLesson) return
    setSavingLesson(true)
    setError('')
    setSuccess('')
    try {
      const payload = {
        title: lessonForm.title,
        videoId: lessonForm.videoId,
        videoType: lessonForm.videoType,
        order: lessonForm.order ? Number(lessonForm.order) : undefined,
        locked: lessonForm.locked,
        isCoaching: lessonForm.isCoaching
      }
      const res = await axios.put(
        `${CONFIG.BACKEND_URL}/api/admin/lessons/${editingLesson._id}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (res.data.success) {
        setSuccess('✅ Leçon modifiée !')
        setEditingLesson(null)
        setLessonForm({
          moduleId: lessonForm.moduleId,
          title: '',
          videoId: '',
          videoType: 'vimeo',
          order: '',
          locked: false,
          isCoaching: false
        })
        await fetchCourseDetails(expandedCourseId)
        setTimeout(() => setSuccess(''), 2000)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la modification')
    } finally {
      setSavingLesson(false)
    }
  }

  const handleDuplicateLesson = async (lesson) => {
    if (!confirm('📋 Dupliquer cette leçon ?')) return
    setError('')
    setSuccess('')
    try {
      const payload = {
        title: `${lesson.title} (copie)`,
        videoId: lesson.videoId,
        videoType: lesson.videoType || 'vimeo',
        order: (lesson.order || 0) + 1,
        locked: lesson.locked || false,
        isCoaching: lesson.isCoaching || false
      }
      const res = await axios.post(
        `${CONFIG.BACKEND_URL}/api/admin/modules/${lesson.moduleId}/lessons`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (res.data.success) {
        setSuccess('✅ Leçon dupliquée !')
        await fetchCourseDetails(expandedCourseId)
        setTimeout(() => setSuccess(''), 2000)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la duplication')
    }
  }

  const handleCancelEdit = () => {
    setEditingLesson(null)
    setLessonForm({
      moduleId: lessonForm.moduleId,
      title: '',
      videoId: '',
      videoType: 'vimeo',
      order: '',
      locked: false,
      isCoaching: false
    })
  }

  const handleEditCourse = (course) => {
    setEditingCourse(course._id)
    setEditCourseForm({
      title: course.title || '',
      description: course.description || '',
      coverImage: course.coverImage || '/img/fbads.png',
      slug: course.slug || '',
      isDefault: course.isDefault || false,
      isPublished: course.isPublished || false
    })
    setError('')
    setSuccess('')
  }

  const handleCancelEditCourse = () => {
    setEditingCourse(null)
    setEditCourseForm({
      title: '',
      description: '',
      coverImage: '/img/fbads.svg',
      slug: '',
      isDefault: false,
      isPublished: false
    })
  }

  const handleUpdateCourse = async (e) => {
    e.preventDefault()
    if (!editingCourse) return

    setSavingCourse(true)
    setError('')
    setSuccess('')

    try {
      const response = await axios.put(
        `${CONFIG.BACKEND_URL}/api/admin/course/${editingCourse}`,
        editCourseForm,
        { headers: { 'Authorization': `Bearer ${token}` } }
      )

      if (response.data.success) {
        setSuccess('✅ Cours modifié avec succès !')
        setEditingCourse(null)
        await fetchCourses()
        if (expandedCourseId === editingCourse) {
          await fetchCourseDetails(editingCourse)
        }
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err) {
      console.error('Erreur modification cours:', err)
      setError(err.response?.data?.error || 'Erreur lors de la modification du cours')
    } finally {
      setSavingCourse(false)
    }
  }

  const handleInitFacebookAds = async () => {
    if (!confirm('Voulez-vous initialiser le cours Facebook Ads avec toutes les leçons ?')) return
    setInitializing(true)
    setError('')
    setSuccess('')
    try {
      const response = await axios.post(
        `${CONFIG.BACKEND_URL}/api/courses/init-facebook-ads`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      )
      if (response.data.success) {
        setSuccess('✅ Cours Facebook Ads initialisé !')
        fetchCourses()
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err) {
      console.error('Erreur initialisation:', err)
      setError(err.response?.data?.error || 'Erreur lors de l\'initialisation du cours')
    } finally {
      setInitializing(false)
    }
  }

  return (
    <div className="admin-page admin-courses-page">
      <div className="admin-page-header">
        <div className="admin-page-title-row">
          <div>
            <h1>📚 Gestion des cours</h1>
            <p className="admin-page-subtitle">Créez et gérez les cours de la plateforme</p>
          </div>
          <div className="admin-header-actions">
            <button
              onClick={() => {
                setShowAddForm(!showAddForm)
                setError('')
                setSuccess('')
              }}
              className={`admin-btn ${showAddForm ? 'admin-btn-secondary' : 'admin-btn-primary'}`}
            >
              {showAddForm ? '✕ Annuler' : '➕ Nouveau cours'}
            </button>
            <button
              onClick={handleInitFacebookAds}
              className="admin-btn admin-btn-accent"
              disabled={initializing}
            >
              {initializing ? '⏳ Initialisation...' : '🚀 Init Facebook Ads'}
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
          <h2 className="admin-form-title">➕ Créer un nouveau cours</h2>
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label htmlFor="title">Titre du cours *</label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    title: e.target.value,
                    slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
                  })}
                  required
                  placeholder="Ex: Facebook Ads Mastery"
                  className="admin-input"
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="slug">Slug (URL) *</label>
                <input
                  type="text"
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') 
                  })}
                  required
                  placeholder="facebook-ads-mastery"
                  pattern="[a-z0-9\-]+"
                  className="admin-input"
                />
                <small className="admin-input-hint">
                  URL: /course/{formData.slug || 'votre-slug'}
                </small>
              </div>
            </div>

            <div className="admin-form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="3"
                placeholder="Décrivez ce que les étudiants vont apprendre..."
                className="admin-textarea"
              />
            </div>

            <div className="admin-form-group">
              <label htmlFor="coverImage">Image de couverture</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <input
                      type="file"
                      id="imageFile"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, false)}
                      disabled={uploadingImage}
                      style={{ display: 'none' }}
                    />
                    <label
                      htmlFor="imageFile"
                      className="admin-btn admin-btn-secondary"
                      style={{
                        display: 'inline-block',
                        cursor: uploadingImage ? 'not-allowed' : 'pointer',
                        opacity: uploadingImage ? 0.6 : 1
                      }}
                    >
                      {uploadingImage ? '⏳ Upload...' : '📤 Uploader une image'}
                    </label>
                  </div>
                  <div style={{ flex: 1 }}>
                    <input
                      type="text"
                      id="coverImage"
                      value={formData.coverImage}
                      onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                      placeholder="/img/fbads.svg ou URL"
                      className="admin-input"
                    />
                    <small className="admin-input-hint">
                      Ou entrez une URL d'image
                    </small>
                  </div>
                </div>
                {formData.coverImage && (
                  <div style={{
                    marginTop: '0.5rem',
                    padding: '0.75rem',
                    background: 'var(--bg-secondary)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                      Aperçu:
                    </div>
                    <img
                      src={formData.coverImage.startsWith('http') || formData.coverImage.startsWith('/') 
                        ? formData.coverImage 
                        : `${CONFIG.BACKEND_URL}${formData.coverImage}`}
                      alt="Aperçu"
                      style={{
                        width: '100%',
                        maxWidth: '300px',
                        height: '150px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none'
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="admin-form-checkboxes">
              <label className="admin-checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="admin-checkbox"
                />
                <span>Cours par défaut</span>
              </label>

              <label className="admin-checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                  className="admin-checkbox"
                />
                <span>Activer le cours (visible sur la page d'accueil)</span>
              </label>
            </div>

            <button
              type="submit"
              className="admin-btn admin-btn-primary admin-btn-lg"
              disabled={submitting}
            >
              {submitting ? '⏳ Création en cours...' : '✅ Créer le cours'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="admin-loading">
          <div className="admin-spinner" />
          <p>Chargement des cours...</p>
        </div>
      ) : (
        <div className="admin-courses-grid">
          {courses.map((course) => (
            <div key={course._id} className="admin-course-card">
              <div className="admin-course-card-header">
                <div className="admin-course-card-title">
                  <h3>{course.title}</h3>
                  <div className="admin-course-badges">
                    {course.isDefault && (
                      <span className="admin-badge admin-badge-default">Par défaut</span>
                    )}
                    <span className={`admin-badge ${course.isPublished ? 'admin-badge-success' : 'admin-badge-inactive'}`}>
                      {course.isPublished ? '✓ Actif' : '○ Inactif'}
                    </span>
                  </div>
                </div>
                <div className="admin-course-card-actions">
                  <button
                    onClick={() => handleTogglePublish(course._id, course.isPublished)}
                    className={`admin-btn admin-btn-sm ${course.isPublished ? 'admin-btn-warning' : 'admin-btn-success'}`}
                    title={course.isPublished ? 'Désactiver' : 'Activer'}
                  >
                    {course.isPublished ? '⏸ Désactiver' : '▶ Activer'}
                  </button>
                  <button
                    onClick={() => toggleCourseManage(course._id)}
                    className="admin-btn admin-btn-sm admin-btn-primary"
                  >
                    {expandedCourseId === course._id ? '✕ Fermer' : '⚙️ Gérer'}
                  </button>
                  <button
                    onClick={() => handleDeleteCourse(course._id)}
                    className="admin-btn admin-btn-sm admin-btn-danger"
                    title="Supprimer le cours"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <p className="admin-course-description">
                {course.description || 'Aucune description'}
              </p>

              <div className="admin-course-meta">
                <span>📦 {course.modulesCount || 0} module(s)</span>
                <span>📅 {new Date(course.createdAt).toLocaleDateString('fr-FR')}</span>
              </div>

              {expandedCourseId === course._id && (
                <div className="admin-course-expanded">
                  {loadingExpanded ? (
                    <div className="admin-loading-inline">
                      <div className="admin-spinner-sm" />
                      <span>Chargement...</span>
                    </div>
                  ) : expandedCourse ? (
                    <>
                      <div className="admin-section">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                          <h4 className="admin-section-title">
                            {editingCourse === expandedCourseId ? '✏️ Modifier le cours' : '📝 Informations du cours'}
                          </h4>
                          {editingCourse !== expandedCourseId && (
                            <button
                              onClick={() => handleEditCourse(expandedCourse)}
                              className="admin-btn admin-btn-sm admin-btn-primary"
                            >
                              ✏️ Modifier
                            </button>
                          )}
                        </div>

                        {editingCourse === expandedCourseId ? (
                          <form onSubmit={handleUpdateCourse} className="admin-form">
                            <div className="admin-form-row">
                              <div className="admin-form-group">
                                <label htmlFor="edit-title">Titre du cours *</label>
                                <input
                                  type="text"
                                  id="edit-title"
                                  value={editCourseForm.title}
                                  onChange={(e) => setEditCourseForm({ 
                                    ...editCourseForm, 
                                    title: e.target.value,
                                    slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
                                  })}
                                  required
                                  className="admin-input"
                                />
                              </div>
                              <div className="admin-form-group">
                                <label htmlFor="edit-slug">Slug (URL) *</label>
                                <input
                                  type="text"
                                  id="edit-slug"
                                  value={editCourseForm.slug}
                                  onChange={(e) => setEditCourseForm({ 
                                    ...editCourseForm, 
                                    slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') 
                                  })}
                                  required
                                  pattern="[a-z0-9\-]+"
                                  className="admin-input"
                                />
                              </div>
                            </div>

                            <div className="admin-form-group">
                              <label htmlFor="edit-description">Description</label>
                              <textarea
                                id="edit-description"
                                value={editCourseForm.description}
                                onChange={(e) => setEditCourseForm({ ...editCourseForm, description: e.target.value })}
                                rows="3"
                                className="admin-textarea"
                              />
                            </div>

                            <div className="admin-form-group">
                              <label htmlFor="edit-coverImage">Image de couverture</label>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
                                  <div style={{ flex: 1 }}>
                                    <input
                                      type="file"
                                      id="editImageFile"
                                      accept="image/*"
                                      onChange={(e) => handleImageUpload(e, true)}
                                      disabled={uploadingEditImage}
                                      style={{ display: 'none' }}
                                    />
                                    <label
                                      htmlFor="editImageFile"
                                      className="admin-btn admin-btn-secondary"
                                      style={{
                                        display: 'inline-block',
                                        cursor: uploadingEditImage ? 'not-allowed' : 'pointer',
                                        opacity: uploadingEditImage ? 0.6 : 1
                                      }}
                                    >
                                      {uploadingEditImage ? '⏳ Upload...' : '📤 Uploader une image'}
                                    </label>
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <input
                                      type="text"
                                      id="edit-coverImage"
                                      value={editCourseForm.coverImage}
                                      onChange={(e) => setEditCourseForm({ ...editCourseForm, coverImage: e.target.value })}
                                      placeholder="/img/fbads.svg ou URL"
                                      className="admin-input"
                                    />
                                    <small className="admin-input-hint">
                                      Ou entrez une URL d'image
                                    </small>
                                  </div>
                                </div>
                                {editCourseForm.coverImage && (
                                  <div style={{
                                    marginTop: '0.5rem',
                                    padding: '0.75rem',
                                    background: 'var(--bg-secondary)',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)'
                                  }}>
                                    <div style={{ fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                                      Aperçu:
                                    </div>
                                    <img
                                      src={editCourseForm.coverImage.startsWith('http') || editCourseForm.coverImage.startsWith('/') 
                                        ? editCourseForm.coverImage 
                                        : `${CONFIG.BACKEND_URL}${editCourseForm.coverImage}`}
                                      alt="Aperçu"
                                      style={{
                                        width: '100%',
                                        maxWidth: '300px',
                                        height: '150px',
                                        objectFit: 'cover',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-color)'
                                      }}
                                      onError={(e) => {
                                        e.target.style.display = 'none'
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="admin-form-checkboxes">
                              <label className="admin-checkbox-label">
                                <input
                                  type="checkbox"
                                  checked={editCourseForm.isDefault}
                                  onChange={(e) => setEditCourseForm({ ...editCourseForm, isDefault: e.target.checked })}
                                  className="admin-checkbox"
                                />
                                <span>Cours par défaut</span>
                              </label>
                              <label className="admin-checkbox-label">
                                <input
                                  type="checkbox"
                                  checked={editCourseForm.isPublished}
                                  onChange={(e) => setEditCourseForm({ ...editCourseForm, isPublished: e.target.checked })}
                                  className="admin-checkbox"
                                />
                                <span>Activer le cours (visible sur la page d'accueil)</span>
                              </label>
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                              <button
                                type="submit"
                                disabled={savingCourse}
                                className="admin-btn admin-btn-primary"
                              >
                                {savingCourse ? '⏳ Enregistrement...' : '✅ Enregistrer'}
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelEditCourse}
                                className="admin-btn admin-btn-secondary"
                                disabled={savingCourse}
                              >
                                ✕ Annuler
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div style={{
                            padding: '1rem',
                            background: 'var(--bg-secondary)',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)'
                          }}>
                            <div style={{ marginBottom: '0.75rem' }}>
                              <strong>Titre:</strong> {expandedCourse.title}
                            </div>
                            <div style={{ marginBottom: '0.75rem' }}>
                              <strong>Slug:</strong> {expandedCourse.slug}
                            </div>
                            <div style={{ marginBottom: '0.75rem' }}>
                              <strong>Description:</strong> {expandedCourse.description || 'Aucune description'}
                            </div>
                            <div style={{ marginBottom: '0.75rem' }}>
                              <strong>Image:</strong> {expandedCourse.coverImage || '/img/fbads.svg'}
                            </div>
                            {expandedCourse.coverImage && (
                              <div style={{ marginTop: '0.75rem' }}>
                                <img
                                  src={expandedCourse.coverImage.startsWith('http') || expandedCourse.coverImage.startsWith('/') 
                                    ? expandedCourse.coverImage 
                                    : `${CONFIG.BACKEND_URL}${expandedCourse.coverImage}`}
                                  alt={expandedCourse.title}
                                  style={{
                                    width: '100%',
                                    maxWidth: '300px',
                                    height: '150px',
                                    objectFit: 'cover',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)'
                                  }}
                                  onError={(e) => {
                                    e.target.style.display = 'none'
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="admin-section">
                        <h4 className="admin-section-title">➕ Ajouter un module</h4>
                        <form onSubmit={handleAddModule} className="admin-inline-form">
                          <input
                            type="text"
                            placeholder="Titre du module *"
                            value={moduleForm.title}
                            onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                            required
                            className="admin-input admin-input-sm"
                          />
                          <input
                            type="number"
                            placeholder="Ordre (optionnel)"
                            value={moduleForm.order}
                            onChange={(e) => setModuleForm({ ...moduleForm, order: e.target.value })}
                            className="admin-input admin-input-sm admin-input-number"
                          />
                          <button
                            type="submit"
                            disabled={savingModule}
                            className="admin-btn admin-btn-sm admin-btn-primary"
                          >
                            {savingModule ? '⏳' : '✅ Ajouter'}
                          </button>
                        </form>
                      </div>

                      <div className="admin-section">
                        <h4 className="admin-section-title">
                          {editingLesson ? '✏️ Modifier la leçon' : '➕ Ajouter une leçon'}
                        </h4>
                        {editingLesson && (
                          <div className="admin-edit-notice">
                            <span>📝 Modification de : <strong>{editingLesson.title}</strong></span>
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              className="admin-btn admin-btn-xs admin-btn-secondary"
                            >
                              ✕ Annuler
                            </button>
                          </div>
                        )}
                        <form onSubmit={editingLesson ? handleUpdateLesson : handleAddLesson} className="admin-lesson-form">
                          <div className="admin-form-row">
                            <select
                              value={lessonForm.moduleId}
                              onChange={(e) => setLessonForm({ ...lessonForm, moduleId: e.target.value })}
                              required
                              className="admin-select"
                            >
                              <option value="">Sélectionner un module *</option>
                              {expandedCourse.modules?.map((mod) => (
                                <option key={mod._id} value={mod._id}>
                                  {mod.title}
                                </option>
                              ))}
                            </select>
                            <input
                              type="text"
                              placeholder="Titre de la leçon *"
                              value={lessonForm.title}
                              onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                              required
                              className="admin-input admin-input-sm"
                            />
                          </div>
                          <div className="admin-form-row">
                            <input
                              type="text"
                              placeholder="ID vidéo (YouTube/Vimeo) *"
                              value={lessonForm.videoId}
                              onChange={(e) => setLessonForm({ ...lessonForm, videoId: e.target.value })}
                              required
                              className="admin-input admin-input-sm"
                            />
                            <select
                              value={lessonForm.videoType}
                              onChange={(e) => setLessonForm({ ...lessonForm, videoType: e.target.value })}
                              className="admin-select"
                            >
                              <option value="vimeo">Vimeo</option>
                              <option value="youtube">YouTube</option>
                            </select>
                            <input
                              type="number"
                              placeholder="Ordre"
                              value={lessonForm.order}
                              onChange={(e) => setLessonForm({ ...lessonForm, order: e.target.value })}
                              className="admin-input admin-input-sm admin-input-number"
                            />
                          </div>
                          <div className="admin-form-checkboxes">
                            <label className="admin-checkbox-label">
                              <input
                                type="checkbox"
                                checked={lessonForm.locked}
                                onChange={(e) => setLessonForm({ ...lessonForm, locked: e.target.checked })}
                                className="admin-checkbox"
                              />
                              <span>Verrouillée</span>
                            </label>
                            <label className="admin-checkbox-label">
                              <input
                                type="checkbox"
                                checked={lessonForm.isCoaching}
                                onChange={(e) => setLessonForm({ ...lessonForm, isCoaching: e.target.checked })}
                                className="admin-checkbox"
                              />
                              <span>Coaching</span>
                            </label>
                          </div>
                          <button
                            type="submit"
                            disabled={savingLesson}
                            className="admin-btn admin-btn-sm admin-btn-primary"
                          >
                            {savingLesson 
                              ? (editingLesson ? '⏳ Modification...' : '⏳ Ajout...') 
                              : (editingLesson ? '✅ Modifier la leçon' : '✅ Ajouter la leçon')
                            }
                          </button>
                        </form>
                      </div>

                      <div className="admin-section">
                        <h4 className="admin-section-title">📚 Modules & Leçons</h4>
                        {expandedCourse.modules?.length === 0 ? (
                          <p className="admin-empty-state">Aucun module pour ce cours</p>
                        ) : (
                          <div className="admin-modules-list">
                            {expandedCourse.modules?.map((mod) => (
                              <div key={mod._id} className="admin-module-item">
                                <div className="admin-module-header">
                                  <h5>📦 {mod.title}</h5>
                                  <button
                                    onClick={() => handleDeleteModule(mod._id)}
                                    className="admin-btn admin-btn-xs admin-btn-danger"
                                    title="Supprimer le module"
                                  >
                                    🗑️
                                  </button>
                                </div>
                                {mod.lessons?.length === 0 ? (
                                  <p className="admin-empty-state-sm">Aucune leçon</p>
                                ) : (
                                  <ul className="admin-lessons-list">
                                    {mod.lessons?.map((lesson) => (
                                      <li key={lesson._id} className="admin-lesson-item">
                                        <span className="admin-lesson-title">
                                          {lesson.order}. {lesson.title}
                                        </span>
                                        <div className="admin-lesson-badges">
                                          <span className="admin-badge-xs">{lesson.videoType}</span>
                                          {lesson.locked && <span className="admin-badge-xs admin-badge-warning">🔒</span>}
                                          {lesson.isCoaching && <span className="admin-badge-xs admin-badge-accent">🎓</span>}
                                        </div>
                                        <div className="admin-lesson-actions">
                                          <button
                                            onClick={() => handleEditLesson(lesson)}
                                            className="admin-btn admin-btn-xs admin-btn-primary"
                                            title="Modifier la leçon"
                                          >
                                            ✏️
                                          </button>
                                          <button
                                            onClick={() => handleDuplicateLesson(lesson)}
                                            className="admin-btn admin-btn-xs admin-btn-secondary"
                                            title="Dupliquer la leçon"
                                          >
                                            📋
                                          </button>
                                          <button
                                            onClick={() => handleDeleteLesson(lesson._id)}
                                            className="admin-btn admin-btn-xs admin-btn-danger"
                                            title="Supprimer la leçon"
                                          >
                                            🗑️
                                          </button>
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  ) : null}
                </div>
              )}
            </div>
          ))}

          {courses.length === 0 && (
            <div className="admin-empty-state-large">
              <div className="admin-empty-icon">📚</div>
              <h3>Aucun cours pour le moment</h3>
              <p>Créez votre premier cours pour commencer</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

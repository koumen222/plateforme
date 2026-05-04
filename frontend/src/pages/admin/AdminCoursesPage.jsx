import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { CONFIG } from '../../config/config'
import { useAuth } from '../../contexts/AuthContext'
import { getImageUrl, handleImageError } from '../../utils/imageUtils'
import axios from 'axios'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

/* ── Inline SVG icons ─────────────────────────────────────── */
const Ico = ({ d, size = 14, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}>
    <path d={d} />
  </svg>
)
const IcoCircle = ({ children, size = 14, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}>
    {children}
  </svg>
)

const IconPlus        = ({ size }) => <Ico size={size} d="M12 5v14M5 12h14" />
const IconX           = ({ size }) => <Ico size={size} d="M18 6 6 18M6 6l12 12" />
const IconCheck       = ({ size }) => <Ico size={size} d="M20 6 9 17l-5-5" />
const IconPencil      = ({ size }) => <Ico size={size} d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
const IconTrash       = ({ size }) => <Ico size={size} d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
const IconCopy        = ({ size }) => <Ico size={size} d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2M8 4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2Z" />
const IconCog         = ({ size }) => <Ico size={size} d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
const IconUpload      = ({ size }) => <Ico size={size} d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
const IconEye         = ({ size }) => <Ico size={size} d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7ZM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
const IconEyeOff      = ({ size }) => <Ico size={size} d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" />
const IconLock        = ({ size }) => <Ico size={size} d="M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2ZM7 11V7a5 5 0 0 1 10 0v4" />
const IconBook        = ({ size }) => <Ico size={size} d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15Z" />
const IconGift        = ({ size }) => <Ico size={size} d="M20 12v10H4V12M22 7H2v5h20V7ZM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7ZM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7Z" />
const IconGraduate    = ({ size }) => <Ico size={size} d="M22 10v6M2 10l10-5 10 5-10 5-10-5ZM6 12v5c3 3 9 3 12 0v-5" />
const IconSave        = ({ size }) => <Ico size={size} d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2ZM17 21v-8H7v8M7 3v5h8" />
const IconPlay        = ({ size }) => <IcoCircle size={size}><polygon points="5 3 19 12 5 21 5 3" /></IcoCircle>
const IconPause       = ({ size }) => <IcoCircle size={size}><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></IcoCircle>
const IconLoader      = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" style={{ display: 'inline-block', verticalAlign: 'middle', animation: 'spin 1s linear infinite' }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
)
const IconAlertCircle = ({ size }) => (
  <IcoCircle size={size}>
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </IcoCircle>
)
const IconCheckCircle = ({ size }) => (
  <IcoCircle size={size}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </IcoCircle>
)
const IconVideo       = ({ size }) => (
  <IcoCircle size={size}>
    <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
  </IcoCircle>
)
const IconStar        = ({ size }) => <Ico size={size} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z" />
const IconCalendar    = ({ size }) => (
  <IcoCircle size={size}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </IcoCircle>
)
const IconLayers      = ({ size }) => <Ico size={size} d="M12 2 2 7l10 5 10-5-10-5ZM2 17l10 5 10-5M2 12l10 5 10-5" />
const IconZap         = ({ size }) => <Ico size={size} d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" />

const predefinedLessonBlocks = [
  {
    id: 'summary',
    label: 'Résumé',
    html: `
      <h2>Résumé</h2>
      <p>Explique ici les points importants de cette leçon en quelques lignes.</p>
      <ul>
        <li>Point important 1</li>
        <li>Point important 2</li>
        <li>Point important 3</li>
      </ul>
    `
  },
  {
    id: 'comment',
    label: 'Commentaire',
    html: `
      <h3>Espace commentaire</h3>
      <p>Les apprenants peuvent laisser leurs questions et retours dans l'espace commentaires sous la leçon. Les messages arrivent dans l'administration avant publication.</p>
    `
  },
  {
    id: 'resources',
    label: 'Ressources',
    html: `
      <h3>Ressources utiles</h3>
      <p>Ajoute les liens, documents ou fichiers que l'apprenant doit consulter.</p>
      <ul>
        <li><a href="https://example.com" target="_blank">Nom de la ressource</a></li>
      </ul>
    `
  },
  {
    id: 'exercise',
    label: 'Exercice',
    html: `
      <h3>Exercice à faire</h3>
      <p>Décris ici l'action concrète que l'apprenant doit réaliser après la vidéo.</p>
      <ol>
        <li>Étape 1</li>
        <li>Étape 2</li>
        <li>Étape 3</li>
      </ol>
    `
  },
  {
    id: 'warning',
    label: 'Attention',
    html: `
      <h3>Attention</h3>
      <blockquote>Indique ici l'erreur à éviter ou le point de vigilance principal.</blockquote>
    `
  },
  {
    id: 'checklist',
    label: 'Checklist',
    html: `
      <h3>Checklist</h3>
      <ul>
        <li>Élément à vérifier 1</li>
        <li>Élément à vérifier 2</li>
        <li>Élément à vérifier 3</li>
      </ul>
    `
  }
]

export default function AdminCoursesPage() {
  const { token } = useAuth()
  const quillRef = useRef(null)
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
    isPublished: false,
    isFree: false
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
    content: '',
    resources: [],
    order: '', 
    locked: false, 
    isCoaching: false 
  })
  const [savingModule, setSavingModule] = useState(false)
  const [savingLesson, setSavingLesson] = useState(false)
  const [editingLesson, setEditingLesson] = useState(null)
  const [editingModuleId, setEditingModuleId] = useState(null)
  const [editModuleForm, setEditModuleForm] = useState({ title: '', order: '' })
  const [updatingModule, setUpdatingModule] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const [editCourseForm, setEditCourseForm] = useState({
    title: '',
    description: '',
    coverImage: '',
    slug: '',
    isDefault: false,
    isPublished: false,
    isFree: false
  })
  const [uploadingEditImage, setUploadingEditImage] = useState(false)
  const [savingCourse, setSavingCourse] = useState(false)
  const [uploadingLessonAsset, setUploadingLessonAsset] = useState(false)
  const [draggedModuleId, setDraggedModuleId] = useState(null)
  const [draggedLesson, setDraggedLesson] = useState(null)

  const getAssetUrl = (path) => {
    if (!path) return ''
    if (/^https?:\/\//i.test(path)) return path
    return `${CONFIG.BACKEND_URL}${path}`
  }

  const normalizeOrders = (items = []) => items.map((item, index) => ({ ...item, order: index + 1 }))

  const insertAtOrder = (items = [], item, order) => {
    const nextItems = items.filter((current) => current._id !== item._id)
    const parsedOrder = Number(order)
    const targetIndex = Number.isFinite(parsedOrder) && parsedOrder > 0
      ? Math.min(Math.round(parsedOrder) - 1, nextItems.length)
      : nextItems.length
    nextItems.splice(targetIndex, 0, item)
    return normalizeOrders(nextItems)
  }

  const updateModuleLocally = (moduleId, updater) => {
    setExpandedCourse((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        modules: normalizeOrders((prev.modules || []).map((mod) => (
          mod._id === moduleId ? updater(mod) : mod
        )))
      }
    })
  }

  const updateLessonLocally = (moduleId, lessonId, updater) => {
    updateModuleLocally(moduleId, (mod) => ({
      ...mod,
      lessons: normalizeOrders((mod.lessons || []).map((lesson) => (
        lesson._id === lessonId ? updater(lesson) : lesson
      )))
    }))
  }

  const insertIntoEditor = (type, value, label = '') => {
    const editor = quillRef.current?.getEditor()
    if (!editor) return
    const range = editor.getSelection(true) || { index: editor.getLength(), length: 0 }
    if (type === 'image') {
      editor.insertEmbed(range.index, 'image', value, 'user')
      editor.setSelection(range.index + 1, 0)
      return
    }
    if (type === 'link') {
      editor.insertText(range.index, label || value, 'link', value, 'user')
      editor.setSelection(range.index + (label || value).length, 0)
    }
  }

  const insertPredefinedBlock = (block) => {
    const editor = quillRef.current?.getEditor()
    if (!editor) return
    const range = editor.getSelection(true) || { index: editor.getLength(), length: 0 }
    editor.clipboard.dangerouslyPasteHTML(range.index, block.html, 'user')
    setTimeout(() => {
      editor.setSelection(Math.min(range.index + 1, editor.getLength()), 0)
    }, 0)
  }

  const uploadLessonAsset = useCallback(async (file, assetType) => {
    if (!file) return null
    const isImage = assetType === 'image'
    const endpoint = isImage ? '/api/admin/upload/course-image' : '/api/admin/upload/pdf'
    const fieldName = isImage ? 'image' : 'pdf'

    setUploadingLessonAsset(true)
    setError('')
    try {
      const data = new FormData()
      data.append(fieldName, file)
      const response = await axios.post(`${CONFIG.BACKEND_URL}${endpoint}`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })
      if (!response.data.success) return null
      return {
        path: response.data.url || response.data.imagePath || response.data.pdfPath,
        filename: response.data.filename || file.name
      }
    } catch (err) {
      setError(err.response?.data?.error || `Erreur lors de l'upload ${isImage ? "de l'image" : 'du PDF'}`)
      return null
    } finally {
      setUploadingLessonAsset(false)
    }
  }, [token])

  const openLessonAssetPicker = useCallback((assetType) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = assetType === 'image' ? 'image/*' : 'application/pdf'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      const uploaded = await uploadLessonAsset(file, assetType)
      if (!uploaded?.path) return

      const assetUrl = getAssetUrl(uploaded.path)
      if (assetType === 'image') {
        insertIntoEditor('image', assetUrl)
        setSuccess('✅ Image ajoutée au contenu !')
      } else {
        const title = uploaded.filename || 'Document PDF'
        const newResource = {
          icon: '📎',
          title,
          type: 'PDF',
          link: assetUrl,
          download: true
        }
        setLessonForm((prev) => ({
          ...prev,
          resources: [...(prev.resources || []), newResource]
        }))
        insertIntoEditor('link', assetUrl, `📎 ${title}`)
        setSuccess('✅ PDF attaché à la leçon !')
      }
      setTimeout(() => setSuccess(''), 2000)
    }
    input.click()
  }, [uploadLessonAsset])

  const quillModules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ color: [] }, { background: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ align: [] }],
        ['blockquote', 'code-block'],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: () => openLessonAssetPicker('image')
      }
    }
  }), [openLessonAssetPicker])

  const quillFormats = useMemo(() => [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'color',
    'background',
    'list',
    'bullet',
    'align',
    'blockquote',
    'code-block',
    'link',
    'image'
  ], [])

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
          isPublished: false,
          isFree: false
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
        setCourses((prev) => prev.map((course) => (
          course._id === courseId ? { ...course, isPublished: !currentStatus } : course
        )))
        setExpandedCourse((prev) => (
          prev?._id === courseId ? { ...prev, isPublished: !currentStatus } : prev
        ))
        setTimeout(() => setSuccess(''), 2000)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la mise à jour')
    }
  }

  const handleToggleFree = async (courseId, currentStatus) => {
    setError('')
    setSuccess('')
    try {
      const response = await axios.put(
        `${CONFIG.BACKEND_URL}/api/admin/course/${courseId}`,
        { isFree: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (response.data.success) {
        setSuccess(`✅ Statut ${!currentStatus ? 'gratuit' : 'payant'} appliqué !`)
        setCourses((prev) => prev.map((course) => (
          course._id === courseId ? { ...course, isFree: !currentStatus } : course
        )))
        setExpandedCourse((prev) => (
          prev?._id === courseId ? { ...prev, isFree: !currentStatus } : prev
        ))
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
        setExpandedCourse((prev) => ({
          ...prev,
          modules: insertAtOrder(prev.modules || [], { ...res.data.module, lessons: [] }, payload.order)
        }))
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
        content: lessonForm.content,
        resources: lessonForm.resources || [],
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
        const selectedModuleId = lessonForm.moduleId
        setLessonForm({
          moduleId: selectedModuleId,
          title: '',
          videoId: '',
          videoType: 'vimeo',
          content: '',
          resources: [],
          order: '',
          locked: false,
          isCoaching: false
        })
        updateModuleLocally(selectedModuleId, (mod) => ({
          ...mod,
          lessons: insertAtOrder(mod.lessons || [], res.data.lesson, payload.order)
        }))
        setTimeout(() => setSuccess(''), 2000)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'ajout de la leçon')
    } finally {
      setSavingLesson(false)
    }
  }

  const handleStartEditModule = (mod) => {
    setEditingModuleId(mod._id)
    setEditModuleForm({ title: mod.title || '', order: mod.order ?? '' })
  }

  const handleCancelEditModule = () => {
    setEditingModuleId(null)
    setEditModuleForm({ title: '', order: '' })
  }

  const handleUpdateModule = async (moduleId) => {
    if (!editModuleForm.title.trim()) {
      setError('Le titre du module est requis')
      return
    }
    setUpdatingModule(true)
    setError('')
    setSuccess('')
    try {
      const payload = {
        title: editModuleForm.title.trim(),
        order: editModuleForm.order !== '' ? Number(editModuleForm.order) : undefined
      }
      const res = await axios.put(
        `${CONFIG.BACKEND_URL}/api/admin/modules/${moduleId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (res.data.success) {
        setSuccess('✅ Module modifié !')
        handleCancelEditModule()
        setExpandedCourse((prev) => {
          if (!prev) return prev
          const updatedModules = (prev.modules || []).map((mod) => (
            mod._id === moduleId ? { ...mod, ...res.data.module, lessons: mod.lessons || [] } : mod
          ))
          if (!Number.isFinite(Number(payload.order))) {
            return { ...prev, modules: normalizeOrders(updatedModules) }
          }
          const updatedModule = updatedModules.find((mod) => mod._id === moduleId)
          return {
            ...prev,
            modules: updatedModule ? insertAtOrder(updatedModules, updatedModule, payload.order) : normalizeOrders(updatedModules)
          }
        })
        setTimeout(() => setSuccess(''), 2000)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la modification du module')
    } finally {
      setUpdatingModule(false)
    }
  }

  const handleDropModule = async (targetModuleId) => {
    if (!draggedModuleId || draggedModuleId === targetModuleId || !expandedCourse?.modules?.length) {
      setDraggedModuleId(null)
      return
    }

    const currentIds = expandedCourse.modules.map((mod) => mod._id)
    const draggedIndex = currentIds.indexOf(draggedModuleId)
    const targetIndex = currentIds.indexOf(targetModuleId)
    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedModuleId(null)
      return
    }

    const nextIds = [...currentIds]
    const [movedId] = nextIds.splice(draggedIndex, 1)
    nextIds.splice(targetIndex, 0, movedId)

    setExpandedCourse((prev) => ({
      ...prev,
      modules: nextIds.map((id, index) => {
        const mod = prev.modules.find((item) => item._id === id)
        return { ...mod, order: index + 1 }
      })
    }))

    setDraggedModuleId(null)
    setError('')
    try {
      await axios.put(
        `${CONFIG.BACKEND_URL}/api/admin/courses/${expandedCourseId}/modules/reorder`,
        { moduleIds: nextIds },
        { headers: { Authorization: `Bearer ${token}` } }
      )
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors du déplacement du module')
      await fetchCourseDetails(expandedCourseId)
    }
  }

  const handleDropLesson = async (targetModuleId, targetLessonId) => {
    if (!draggedLesson || draggedLesson.moduleId !== targetModuleId || draggedLesson.lessonId === targetLessonId) {
      setDraggedLesson(null)
      return
    }

    const module = expandedCourse?.modules?.find((mod) => mod._id === targetModuleId)
    if (!module?.lessons?.length) {
      setDraggedLesson(null)
      return
    }

    const currentIds = module.lessons.map((lesson) => lesson._id)
    const draggedIndex = currentIds.indexOf(draggedLesson.lessonId)
    const targetIndex = currentIds.indexOf(targetLessonId)
    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedLesson(null)
      return
    }

    const nextIds = [...currentIds]
    const [movedId] = nextIds.splice(draggedIndex, 1)
    nextIds.splice(targetIndex, 0, movedId)

    setExpandedCourse((prev) => ({
      ...prev,
      modules: prev.modules.map((mod) => {
        if (mod._id !== targetModuleId) return mod
        return {
          ...mod,
          lessons: nextIds.map((id, index) => {
            const lesson = mod.lessons.find((item) => item._id === id)
            return { ...lesson, order: index + 1 }
          })
        }
      })
    }))

    setDraggedLesson(null)
    setError('')
    try {
      await axios.put(
        `${CONFIG.BACKEND_URL}/api/admin/modules/${targetModuleId}/lessons/reorder`,
        { lessonIds: nextIds },
        { headers: { Authorization: `Bearer ${token}` } }
      )
    } catch (err) {
      const isMissingReorderRoute = err.response?.status === 404
        && String(err.response?.data?.error || '').includes('/lessons/reorder')

      if (isMissingReorderRoute) {
        try {
          for (const [index, lessonId] of nextIds.entries()) {
            await axios.put(
              `${CONFIG.BACKEND_URL}/api/admin/lessons/${lessonId}`,
              { order: index + 1 },
              { headers: { Authorization: `Bearer ${token}` } }
            )
          }
          return
        } catch (fallbackErr) {
          setError(fallbackErr.response?.data?.error || 'Erreur lors du déplacement de la leçon')
          await fetchCourseDetails(expandedCourseId)
          return
        }
      }

      setError(err.response?.data?.error || 'Erreur lors du déplacement de la leçon')
      await fetchCourseDetails(expandedCourseId)
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
        setExpandedCourse((prev) => ({
          ...prev,
          modules: normalizeOrders((prev.modules || []).filter((mod) => mod._id !== moduleId))
        }))
        setTimeout(() => setSuccess(''), 2000)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la suppression')
    }
  }

  const handleDuplicateModule = async (moduleId) => {
    if (!confirm('Dupliquer ce module avec toutes ses leçons ?')) return
    setError('')
    setSuccess('')
    try {
      const res = await axios.post(
        `${CONFIG.BACKEND_URL}/api/admin/modules/${moduleId}/duplicate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (res.data.success) {
        setSuccess('✅ Module dupliqué !')
        setExpandedCourse((prev) => ({
          ...prev,
          modules: normalizeOrders([...(prev.modules || []), res.data.module])
        }))
        setTimeout(() => setSuccess(''), 2000)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la duplication du module')
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
        setExpandedCourse((prev) => ({
          ...prev,
          modules: (prev.modules || []).map((mod) => ({
            ...mod,
            lessons: normalizeOrders((mod.lessons || []).filter((lesson) => lesson._id !== lessonId))
          }))
        }))
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
      videoId: lesson.videoId || '',
      videoType: lesson.videoType || 'vimeo',
      content: lesson.content || '',
      resources: lesson.resources || [],
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
        content: lessonForm.content,
        resources: lessonForm.resources || [],
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
        const selectedModuleId = lessonForm.moduleId
        updateLessonLocally(selectedModuleId, editingLesson._id, (lesson) => ({ ...lesson, ...res.data.lesson }))
        if (Number.isFinite(Number(payload.order))) {
          updateModuleLocally(selectedModuleId, (mod) => {
            const updatedLesson = (mod.lessons || []).find((lesson) => lesson._id === editingLesson._id)
            return {
              ...mod,
              lessons: updatedLesson ? insertAtOrder(mod.lessons || [], updatedLesson, payload.order) : mod.lessons
            }
          })
        }
        setEditingLesson(null)
        setLessonForm({
          moduleId: selectedModuleId,
          title: '',
          videoId: '',
          videoType: 'vimeo',
          content: '',
          resources: [],
          order: '',
          locked: false,
          isCoaching: false
        })
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
        videoId: lesson.videoId || '',
        videoType: lesson.videoType || 'vimeo',
        content: lesson.content || '',
        resources: lesson.resources || [],
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
        updateModuleLocally(lesson.moduleId, (mod) => ({
          ...mod,
          lessons: insertAtOrder(mod.lessons || [], res.data.lesson, payload.order)
        }))
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
      content: '',
      resources: [],
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
      coverImage: course.coverImage || '/img/fbads.svg',
      slug: course.slug || '',
      isDefault: course.isDefault || false,
      isPublished: course.isPublished || false,
      isFree: course.isFree || false
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
      isPublished: false,
      isFree: false
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
        setCourses((prev) => prev.map((course) => (
          course._id === editingCourse ? { ...course, ...response.data.course } : course
        )))
        setExpandedCourse((prev) => (
          prev?._id === editingCourse ? { ...prev, ...response.data.course, modules: prev.modules || [] } : prev
        ))
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

  const totalLessons = courses.reduce((acc, c) => acc + (c.lessonsCount || 0), 0)
  const publishedCount = courses.filter(c => c.isPublished).length
  const freeCount = courses.filter(c => c.isFree).length

  return (
    <div className="admin-page admin-courses-page">

      {/* ── Header ── */}
      <div className="admin-page-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
        <div className="admin-page-title-row">
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <IconBook size={20} /> Gestion des cours
            </h1>
            <p className="admin-page-subtitle" style={{ marginTop: '0.25rem' }}>Créez et gérez les formations de la plateforme</p>
          </div>
          <div className="admin-header-actions">
            <button onClick={handleInitFacebookAds} className="admin-btn admin-btn-accent" disabled={initializing} style={{ fontSize: '0.8rem', gap: '0.4rem', display: 'flex', alignItems: 'center' }}>
              {initializing ? <><IconLoader /> Initialisation…</> : <><IconZap size={13} /> Init Facebook Ads</>}
            </button>
            <button onClick={() => { setShowAddForm(!showAddForm); setError(''); setSuccess('') }}
              className={`admin-btn ${showAddForm ? 'admin-btn-secondary' : 'admin-btn-primary'}`}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {showAddForm ? <><IconX size={13} /> Annuler</> : <><IconPlus size={13} /> Nouveau cours</>}
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
          {[
            { label: 'Total', value: courses.length, color: 'var(--accent)', icon: <IconBook size={16} /> },
            { label: 'Publiés', value: publishedCount, color: '#22c55e', icon: <IconEye size={16} /> },
            { label: 'Gratuits', value: freeCount, color: '#f59e0b', icon: <IconGift size={16} /> },
            { label: 'Leçons', value: totalLessons, color: '#8b5cf6', icon: <IconLayers size={16} /> },
          ].map(s => (
            <div key={s.label} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-color)',
              borderRadius: '10px', padding: '0.75rem 1.25rem', minWidth: '115px',
              borderTop: `3px solid ${s.color}`, display: 'flex', flexDirection: 'column', gap: '0.3rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: s.color }}>
                {s.icon}
                <span style={{ fontSize: '1.4rem', fontWeight: 700, lineHeight: 1 }}>{s.value}</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Alerts ── */}
      {(error || success) && (
        <div className={`admin-alert ${error ? 'admin-alert-error' : 'admin-alert-success'}`}
          style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {error ? <IconAlertCircle size={16} /> : <IconCheckCircle size={16} />}
          <span>{error || success}</span>
        </div>
      )}

      {/* ── Add Course Form ── */}
      {showAddForm && (
        <div className="admin-form-card" style={{ marginBottom: '1.5rem' }}>
          <h2 className="admin-form-title" style={{ marginBottom: '1.25rem', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <IconPlus size={16} /> Créer un nouveau cours
          </h2>
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label htmlFor="title">Titre *</label>
                <input type="text" id="title" value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })}
                  required placeholder="Ex: Facebook Ads Mastery" className="admin-input" />
              </div>
              <div className="admin-form-group">
                <label htmlFor="slug">Slug (URL) *</label>
                <input type="text" id="slug" value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })}
                  required placeholder="facebook-ads-mastery" pattern="[a-z0-9\-]+" className="admin-input" />
                <small className="admin-input-hint">/course/{formData.slug || 'votre-slug'}</small>
              </div>
            </div>
            <div className="admin-form-group">
              <label htmlFor="description">Description</label>
              <textarea id="description" value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="3" placeholder="Décrivez ce que les étudiants vont apprendre…" className="admin-textarea" />
            </div>
            <div className="admin-form-group">
              <label>Image de couverture</label>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <input type="file" id="imageFile" accept="image/*" onChange={(e) => handleImageUpload(e, false)} disabled={uploadingImage} style={{ display: 'none' }} />
                <label htmlFor="imageFile" className="admin-btn admin-btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', cursor: uploadingImage ? 'not-allowed' : 'pointer', opacity: uploadingImage ? 0.6 : 1 }}>
                  {uploadingImage ? <><IconLoader /> Upload…</> : <><IconUpload size={13} /> Uploader</>}
                </label>
                <input type="text" value={formData.coverImage}
                  onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                  placeholder="ou URL de l'image" className="admin-input" style={{ flex: 1, minWidth: '180px' }} />
                {formData.coverImage && (
                  <img src={getImageUrl(formData.coverImage)} alt="Aperçu"
                    style={{ width: '80px', height: '50px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border-color)', flexShrink: 0 }}
                    onError={handleImageError()} />
                )}
              </div>
            </div>
            <div className="admin-form-checkboxes">
              <label className="admin-checkbox-label">
                <input type="checkbox" checked={formData.isDefault} onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })} className="admin-checkbox" />
                <span>Cours par défaut</span>
              </label>
              <label className="admin-checkbox-label">
                <input type="checkbox" checked={formData.isFree} onChange={(e) => setFormData({ ...formData, isFree: e.target.checked })} className="admin-checkbox" />
                <IconGift size={12} style={{ marginLeft: '0.25rem' }} /> <span>Formation gratuite</span>
              </label>
              <label className="admin-checkbox-label">
                <input type="checkbox" checked={formData.isPublished} onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })} className="admin-checkbox" />
                <IconEye size={12} style={{ marginLeft: '0.25rem' }} /> <span>Publié (visible)</span>
              </label>
            </div>
            <button type="submit" className="admin-btn admin-btn-primary" disabled={submitting}
              style={{ marginTop: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              {submitting ? <><IconLoader /> Création…</> : <><IconCheck size={13} /> Créer le cours</>}
            </button>
          </form>
        </div>
      )}

      {/* ── Courses List ── */}
      {loading ? (
        <div className="admin-loading"><div className="admin-spinner" /><p>Chargement des cours…</p></div>
      ) : courses.length === 0 ? (
        <div className="admin-empty-state-large">
          <div className="admin-empty-icon"><IconBook size={40} /></div>
          <h3>Aucun cours pour le moment</h3>
          <p>Créez votre premier cours pour commencer</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {courses.map((course) => (
            <div key={course._id} style={{
              background: 'var(--bg-card)',
              border: `1px solid ${expandedCourseId === course._id ? 'var(--accent)' : 'var(--border-color)'}`,
              borderRadius: '12px', overflow: 'hidden', transition: 'border-color 0.2s'
            }}>
              {/* Card row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1.25rem' }}>
                {/* Thumbnail */}
                <div style={{ flexShrink: 0, width: '64px', height: '44px', borderRadius: '8px', overflow: 'hidden', background: 'var(--bg-secondary)' }}>
                  <img src={getImageUrl(course.coverImage || '/img/fbads.svg')} alt={course.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={handleImageError()} />
                </div>

                {/* Title + badges */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.925rem' }}>{course.title}</span>
                    {course.isDefault && <span className="admin-badge admin-badge-default" style={{ fontSize: '0.68rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}><IconStar size={10} /> Défaut</span>}
                    <span className={`admin-badge ${course.isPublished ? 'admin-badge-success' : 'admin-badge-inactive'}`}
                      style={{ fontSize: '0.68rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                      {course.isPublished ? <><IconEye size={10} /> Publié</> : <><IconEyeOff size={10} /> Brouillon</>}
                    </span>
                    <span className={`admin-badge ${course.isFree ? 'admin-badge-warning' : 'admin-badge-inactive'}`}
                      style={{ fontSize: '0.68rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                      {course.isFree ? <><IconGift size={10} /> Gratuit</> : 'Payant'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', marginTop: '0.2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><IconLayers size={11} /> {course.modulesCount || 0} module{course.modulesCount !== 1 ? 's' : ''}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><IconCalendar size={11} /> {new Date(course.createdAt).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center' }}>
                  <button onClick={() => handleTogglePublish(course._id, course.isPublished)}
                    className={`admin-btn admin-btn-xs ${course.isPublished ? 'admin-btn-warning' : 'admin-btn-success'}`}
                    title={course.isPublished ? 'Dépublier' : 'Publier'}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    {course.isPublished ? <><IconEyeOff size={11} /> Dépublier</> : <><IconEye size={11} /> Publier</>}
                  </button>
                  <button onClick={() => handleToggleFree(course._id, course.isFree)}
                    className={`admin-btn admin-btn-xs ${course.isFree ? 'admin-btn-secondary' : 'admin-btn-accent'}`}
                    title={course.isFree ? 'Passer payant' : 'Passer gratuit'}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    {course.isFree ? 'Payant' : <><IconGift size={11} /> Gratuit</>}
                  </button>
                  <button onClick={() => toggleCourseManage(course._id)}
                    className={`admin-btn admin-btn-xs ${expandedCourseId === course._id ? 'admin-btn-secondary' : 'admin-btn-primary'}`}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    {expandedCourseId === course._id ? <><IconX size={11} /> Fermer</> : <><IconCog size={11} /> Gérer</>}
                  </button>
                  <button onClick={() => handleDeleteCourse(course._id)}
                    className="admin-btn admin-btn-xs admin-btn-danger" title="Supprimer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <IconTrash size={11} />
                  </button>
                </div>
              </div>

              {/* ── Expanded management panel ── */}
              {expandedCourseId === course._id && (
                <div style={{ borderTop: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
                  {loadingExpanded ? (
                    <div className="admin-loading-inline" style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <IconLoader size={16} /> <span>Chargement…</span>
                    </div>
                  ) : expandedCourse ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>

                      {/* LEFT */}
                      <div style={{ padding: '1.25rem', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* Edit course info */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <IconBook size={13} /> Informations
                            </span>
                            {editingCourse !== expandedCourseId && (
                              <button onClick={() => handleEditCourse(expandedCourse)}
                                className="admin-btn admin-btn-xs admin-btn-primary"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                <IconPencil size={11} /> Modifier
                              </button>
                            )}
                          </div>

                          {editingCourse === expandedCourseId ? (
                            <form onSubmit={handleUpdateCourse} className="admin-form" style={{ gap: '0.75rem' }}>
                              <div className="admin-form-row">
                                <div className="admin-form-group">
                                  <label>Titre *</label>
                                  <input type="text" value={editCourseForm.title}
                                    onChange={(e) => setEditCourseForm({ ...editCourseForm, title: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })}
                                    required className="admin-input" />
                                </div>
                                <div className="admin-form-group">
                                  <label>Slug *</label>
                                  <input type="text" value={editCourseForm.slug}
                                    onChange={(e) => setEditCourseForm({ ...editCourseForm, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })}
                                    required pattern="[a-z0-9\-]+" className="admin-input" />
                                </div>
                              </div>
                              <div className="admin-form-group">
                                <label>Description</label>
                                <textarea value={editCourseForm.description}
                                  onChange={(e) => setEditCourseForm({ ...editCourseForm, description: e.target.value })}
                                  rows="2" className="admin-textarea" />
                              </div>
                              <div className="admin-form-group">
                                <label>Image</label>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                  <input type="file" id="editImageFile" accept="image/*" onChange={(e) => handleImageUpload(e, true)} disabled={uploadingEditImage} style={{ display: 'none' }} />
                                  <label htmlFor="editImageFile" className="admin-btn admin-btn-xs admin-btn-secondary"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', cursor: uploadingEditImage ? 'not-allowed' : 'pointer', opacity: uploadingEditImage ? 0.6 : 1 }}>
                                    {uploadingEditImage ? <><IconLoader /> …</> : <><IconUpload size={11} /> Upload</>}
                                  </label>
                                  <input type="text" value={editCourseForm.coverImage}
                                    onChange={(e) => setEditCourseForm({ ...editCourseForm, coverImage: e.target.value })}
                                    placeholder="URL image" className="admin-input" style={{ flex: 1 }} />
                                  {editCourseForm.coverImage && (
                                    <img src={getImageUrl(editCourseForm.coverImage)} alt=""
                                      style={{ width: '48px', height: '32px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }}
                                      onError={handleImageError()} />
                                  )}
                                </div>
                              </div>
                              <div className="admin-form-checkboxes" style={{ gap: '0.5rem' }}>
                                {[
                                  { key: 'isDefault', label: 'Défaut', icon: <IconStar size={11} /> },
                                  { key: 'isFree', label: 'Gratuit', icon: <IconGift size={11} /> },
                                  { key: 'isPublished', label: 'Publié', icon: <IconEye size={11} /> },
                                ].map(({ key, label, icon }) => (
                                  <label key={key} className="admin-checkbox-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <input type="checkbox" checked={editCourseForm[key]}
                                      onChange={(e) => setEditCourseForm({ ...editCourseForm, [key]: e.target.checked })}
                                      className="admin-checkbox" />
                                    {icon} <span>{label}</span>
                                  </label>
                                ))}
                              </div>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button type="submit" disabled={savingCourse} className="admin-btn admin-btn-sm admin-btn-primary"
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                                  {savingCourse ? <><IconLoader /> Enregistrement…</> : <><IconSave size={13} /> Sauvegarder</>}
                                </button>
                                <button type="button" onClick={handleCancelEditCourse} className="admin-btn admin-btn-sm admin-btn-secondary" disabled={savingCourse}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                                  <IconX size={13} /> Annuler
                                </button>
                              </div>
                            </form>
                          ) : (
                            <div style={{ background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '0.875rem', fontSize: '0.875rem', display: 'flex', gap: '1rem' }}>
                              {expandedCourse.coverImage && (
                                <img src={getImageUrl(expandedCourse.coverImage)} alt=""
                                  style={{ width: '72px', height: '48px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }}
                                  onError={handleImageError()} />
                              )}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Slug</span>
                                  <code style={{ background: 'var(--bg-secondary)', padding: '1px 6px', borderRadius: '4px', fontSize: '0.78rem' }}>{expandedCourse.slug}</code>
                                </div>
                                <div style={{ color: 'var(--text-secondary)', lineHeight: 1.5, fontSize: '0.825rem' }}>{expandedCourse.description || 'Aucune description'}</div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Add module */}
                        <div>
                          <span style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.6rem' }}>
                            <IconLayers size={13} /> Nouveau module
                          </span>
                          <form onSubmit={handleAddModule} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <input type="text" placeholder="Titre du module *" value={moduleForm.title}
                              onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                              required className="admin-input admin-input-sm" style={{ flex: 1 }} />
                            <input type="number" placeholder="Ordre" value={moduleForm.order}
                              onChange={(e) => setModuleForm({ ...moduleForm, order: e.target.value })}
                              className="admin-input admin-input-sm" style={{ width: '70px' }} />
                            <button type="submit" disabled={savingModule} className="admin-btn admin-btn-sm admin-btn-primary"
                              style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                              {savingModule ? <IconLoader /> : <IconPlus size={13} />}
                              Ajouter
                            </button>
                          </form>
                        </div>

                        {/* Add / edit lesson */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <IconVideo size={13} /> {editingLesson ? 'Modifier la leçon' : 'Nouvelle leçon'}
                            </span>
                            {editingLesson && (
                              <button type="button" onClick={handleCancelEdit} className="admin-btn admin-btn-xs admin-btn-secondary"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                <IconX size={11} /> Annuler
                              </button>
                            )}
                          </div>
                          {editingLesson && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--accent)', marginBottom: '0.5rem', padding: '0.4rem 0.6rem', background: 'var(--bg-card)', borderRadius: '6px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <IconPencil size={12} /> {editingLesson.title}
                            </div>
                          )}
                          <form onSubmit={editingLesson ? handleUpdateLesson : handleAddLesson} className="admin-lesson-form" style={{ gap: '0.6rem' }}>
                            <div className="admin-form-row" style={{ gap: '0.5rem' }}>
                              <select value={lessonForm.moduleId}
                                onChange={(e) => setLessonForm({ ...lessonForm, moduleId: e.target.value })}
                                required className="admin-select" style={{ flex: 1 }}>
                                <option value="">Module *</option>
                                {expandedCourse.modules?.map((mod) => (
                                  <option key={mod._id} value={mod._id}>{mod.title}</option>
                                ))}
                              </select>
                              <input type="text" placeholder="Titre de la leçon *" value={lessonForm.title}
                                onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                                required className="admin-input admin-input-sm" style={{ flex: 2 }} />
                            </div>
                            <div className="admin-form-row" style={{ gap: '0.5rem' }}>
                              <select value={lessonForm.videoType}
                                onChange={(e) => setLessonForm({ ...lessonForm, videoType: e.target.value })}
                                className="admin-select" style={{ width: '105px' }}>
                                <option value="vimeo">Vimeo</option>
                                <option value="youtube">YouTube</option>
                                <option value="text">Texte</option>
                              </select>
                              {lessonForm.videoType !== 'text' && (
                                <input type="text" placeholder="ID vidéo *" value={lessonForm.videoId}
                                  onChange={(e) => setLessonForm({ ...lessonForm, videoId: e.target.value })}
                                  required className="admin-input admin-input-sm" style={{ flex: 2 }} />
                              )}
                              <input type="number" placeholder="Ordre" value={lessonForm.order}
                                onChange={(e) => setLessonForm({ ...lessonForm, order: e.target.value })}
                                className="admin-input admin-input-sm" style={{ width: '70px', marginLeft: lessonForm.videoType === 'text' ? 'auto' : 0 }} />
                            </div>
                            <div style={{ marginBottom: '0.5rem' }}>
                              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                                {lessonForm.videoType === 'text' ? 'Contenu de la leçon' : 'Texte supplémentaire sous la vidéo'}
                              </div>
                              <div style={{ marginBottom: '0.6rem' }}>
                                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>
                                  Blocs prédéfinis
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                  {predefinedLessonBlocks.map((block) => (
                                    <button
                                      key={block.id}
                                      type="button"
                                      onClick={() => insertPredefinedBlock(block)}
                                      className="admin-btn admin-btn-xs admin-btn-secondary"
                                    >
                                      {block.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                                <button
                                  type="button"
                                    onClick={() => openLessonAssetPicker('image')}
                                    disabled={uploadingLessonAsset}
                                    className="admin-btn admin-btn-xs admin-btn-secondary"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                                  >
                                    <IconUpload size={11} /> Image
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openLessonAssetPicker('pdf')}
                                    disabled={uploadingLessonAsset}
                                    className="admin-btn admin-btn-xs admin-btn-secondary"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                                  >
                                    <IconUpload size={11} /> PDF
                                  </button>
                                  {uploadingLessonAsset && (
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                      <IconLoader size={12} /> Upload en cours...
                                    </span>
                                  )}
                                </div>
                                <ReactQuill 
                                  ref={quillRef}
                                  theme="snow" 
                                  value={lessonForm.content} 
                                  onChange={(value) => setLessonForm({ ...lessonForm, content: value })} 
                                  modules={quillModules}
                                  formats={quillFormats}
                                  placeholder="Contenu complet du cours..." 
                                  style={{ background: '#fff', color: '#000', borderRadius: '4px' }} 
                                />
                                {lessonForm.resources?.length > 0 && (
                                  <div style={{ marginTop: '0.6rem', display: 'grid', gap: '0.4rem' }}>
                                    {lessonForm.resources.map((resource, index) => (
                                      <div key={`${resource.link}-${index}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 0.6rem', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'var(--bg-card)' }}>
                                        <span style={{ fontSize: '0.85rem', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                          {resource.icon || '📎'} {resource.title || resource.link}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => setLessonForm((prev) => ({
                                            ...prev,
                                            resources: (prev.resources || []).filter((_, i) => i !== index)
                                          }))}
                                          className="admin-btn admin-btn-xs admin-btn-danger"
                                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                                        >
                                          <IconX size={10} /> Retirer
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                              <label className="admin-checkbox-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                                <input type="checkbox" checked={lessonForm.locked} onChange={(e) => setLessonForm({ ...lessonForm, locked: e.target.checked })} className="admin-checkbox" />
                                <IconLock size={12} /> <span style={{ fontSize: '0.8rem' }}>Verrouillée</span>
                              </label>
                              <label className="admin-checkbox-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                                <input type="checkbox" checked={lessonForm.isCoaching} onChange={(e) => setLessonForm({ ...lessonForm, isCoaching: e.target.checked })} className="admin-checkbox" />
                                <IconGraduate size={12} /> <span style={{ fontSize: '0.8rem' }}>Coaching</span>
                              </label>
                              <button type="submit" disabled={savingLesson} className="admin-btn admin-btn-sm admin-btn-primary"
                                style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                                {savingLesson ? <><IconLoader /> …</> : editingLesson ? <><IconSave size={13} /> Modifier</> : <><IconPlus size={13} /> Ajouter</>}
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>

                      {/* RIGHT: Modules & Lessons tree */}
                      <div style={{ padding: '1.25rem', maxHeight: '560px', overflowY: 'auto' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.75rem' }}>
                          <IconLayers size={13} /> Contenu
                          <span style={{ fontWeight: 400, textTransform: 'none', color: 'var(--text-muted)', marginLeft: '0.25rem' }}>
                            ({expandedCourse.modules?.length || 0} module{expandedCourse.modules?.length !== 1 ? 's' : ''})
                          </span>
                        </span>

                        {!expandedCourse.modules?.length ? (
                          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                            Aucun module — ajoutez-en un à gauche.
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            {expandedCourse.modules.map((mod, modIdx) => (
                              <div
                                key={mod._id}
                                draggable={editingModuleId !== mod._id}
                                onDragStart={(event) => {
                                  setDraggedModuleId(mod._id)
                                  event.dataTransfer.effectAllowed = 'move'
                                }}
                                onDragOver={(event) => {
                                  event.preventDefault()
                                  event.dataTransfer.dropEffect = 'move'
                                }}
                                onDrop={(event) => {
                                  event.preventDefault()
                                  handleDropModule(mod._id)
                                }}
                                onDragEnd={() => setDraggedModuleId(null)}
                                style={{
                                  background: 'var(--bg-card)',
                                  border: `1px solid ${draggedModuleId === mod._id ? 'var(--accent)' : 'var(--border-color)'}`,
                                  borderRadius: '8px',
                                  overflow: 'hidden',
                                  opacity: draggedModuleId === mod._id ? 0.55 : 1,
                                  cursor: editingModuleId === mod._id ? 'default' : 'grab'
                                }}
                              >
                                {/* Module header */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.55rem 0.75rem', background: 'var(--bg-secondary)', borderBottom: mod.lessons?.length ? '1px solid var(--border-color)' : 'none' }}>
                                  {editingModuleId === mod._id ? (
                                    <>
                                      <input type="text" value={editModuleForm.title}
                                        onChange={(e) => setEditModuleForm({ ...editModuleForm, title: e.target.value })}
                                        className="admin-input" style={{ flex: 1, fontSize: '0.8rem', padding: '0.25rem 0.5rem' }} autoFocus />
                                      <input type="number" min="1" value={editModuleForm.order}
                                        onChange={(e) => setEditModuleForm({ ...editModuleForm, order: e.target.value })}
                                        className="admin-input" style={{ width: '60px', fontSize: '0.8rem', padding: '0.25rem 0.5rem' }} />
                                      <button onClick={() => handleUpdateModule(mod._id)} disabled={updatingModule}
                                        className="admin-btn admin-btn-xs admin-btn-primary"
                                        style={{ display: 'inline-flex', alignItems: 'center' }}>
                                        {updatingModule ? <IconLoader size={12} /> : <IconCheck size={12} />}
                                      </button>
                                      <button onClick={handleCancelEditModule} disabled={updatingModule}
                                        className="admin-btn admin-btn-xs admin-btn-secondary"
                                        style={{ display: 'inline-flex', alignItems: 'center' }}>
                                        <IconX size={12} />
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--accent)', background: 'rgba(139,92,246,0.12)', padding: '1px 8px', borderRadius: '10px', flexShrink: 0 }}>
                                        M{mod.order ?? modIdx + 1}
                                      </span>
                                      <span title="Glisser pour déplacer" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1, flexShrink: 0 }}>⋮⋮</span>
                                      <span style={{ flex: 1, fontSize: '0.84rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mod.title}</span>
                                      <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                        <IconVideo size={10} /> {mod.lessons?.length || 0}
                                      </span>
                                      <button onClick={() => handleStartEditModule(mod)} className="admin-btn admin-btn-xs admin-btn-primary" title="Modifier"
                                        style={{ display: 'inline-flex', alignItems: 'center' }}>
                                        <IconPencil size={11} />
                                      </button>
                                      <button onClick={() => handleDuplicateModule(mod._id)} className="admin-btn admin-btn-xs admin-btn-secondary" title="Dupliquer le module"
                                        style={{ display: 'inline-flex', alignItems: 'center' }}>
                                        <IconCopy size={11} />
                                      </button>
                                      <button onClick={() => handleDeleteModule(mod._id)} className="admin-btn admin-btn-xs admin-btn-danger" title="Supprimer"
                                        style={{ display: 'inline-flex', alignItems: 'center' }}>
                                        <IconTrash size={11} />
                                      </button>
                                    </>
                                  )}
                                </div>

                                {/* Lessons */}
                                {mod.lessons?.length > 0 && (
                                  <div>
                                    {mod.lessons.map((lesson, i) => (
                                      <div
                                        key={lesson._id}
                                        draggable
                                        onDragStart={(event) => {
                                          setDraggedLesson({ moduleId: mod._id, lessonId: lesson._id })
                                          event.dataTransfer.effectAllowed = 'move'
                                        }}
                                        onDragOver={(event) => {
                                          event.preventDefault()
                                          event.dataTransfer.dropEffect = 'move'
                                        }}
                                        onDrop={(event) => {
                                          event.preventDefault()
                                          handleDropLesson(mod._id, lesson._id)
                                        }}
                                        onDragEnd={() => setDraggedLesson(null)}
                                        style={{
                                          display: 'flex', alignItems: 'center', gap: '0.5rem',
                                          padding: '0.4rem 0.75rem',
                                          borderBottom: i < mod.lessons.length - 1 ? '1px solid var(--border-color)' : 'none',
                                          fontSize: '0.82rem',
                                          opacity: draggedLesson?.lessonId === lesson._id ? 0.55 : 1,
                                          cursor: 'grab',
                                          background: draggedLesson?.lessonId === lesson._id ? 'var(--bg-secondary)' : 'transparent'
                                        }}
                                      >
                                        <span style={{ color: 'var(--text-secondary)', width: '18px', flexShrink: 0, fontSize: '0.72rem', textAlign: 'right' }}>{lesson.order}.</span>
                                        <span title="Glisser pour déplacer" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1, flexShrink: 0 }}>⋮⋮</span>
                                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lesson.title}</span>
                                        <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', flexShrink: 0 }}>
                                          <span style={{ fontSize: '0.63rem', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '1px 5px', borderRadius: '4px' }}>{lesson.videoType}</span>
                                          {lesson.locked && <IconLock size={11} style={{ color: '#f59e0b' }} title="Verrouillée" />}
                                          {lesson.isCoaching && <IconGraduate size={11} style={{ color: '#8b5cf6' }} title="Coaching" />}
                                          <button onClick={() => handleEditLesson(lesson)} className="admin-btn admin-btn-xs admin-btn-primary" title="Modifier"
                                            style={{ display: 'inline-flex', alignItems: 'center' }}>
                                            <IconPencil size={11} />
                                          </button>
                                          <button onClick={() => handleDuplicateLesson(lesson)} className="admin-btn admin-btn-xs admin-btn-secondary" title="Dupliquer"
                                            style={{ display: 'inline-flex', alignItems: 'center' }}>
                                            <IconCopy size={11} />
                                          </button>
                                          <button onClick={() => handleDeleteLesson(lesson._id)} className="admin-btn admin-btn-xs admin-btn-danger" title="Supprimer"
                                            style={{ display: 'inline-flex', alignItems: 'center' }}>
                                            <IconTrash size={11} />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {!mod.lessons?.length && (
                                  <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.78rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Aucune leçon</div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

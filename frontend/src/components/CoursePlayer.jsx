import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { CONFIG } from '../config/config'
import axios from 'axios'
import ProtectedVideo from './ProtectedVideo'
import { FiChevronDown, FiChevronRight, FiCheck, FiPlay, FiLock, FiMenu, FiX } from 'react-icons/fi'

export default function CoursePlayer({ addShopifyModule = false }) {
  const { slug, lessonId } = useParams()
  const navigate = useNavigate()
  const { user, token, isAuthenticated } = useAuth()
  
  const [course, setCourse] = useState(null)
  const [modules, setModules] = useState([])
  const [currentLesson, setCurrentLesson] = useState(null)
  const [progress, setProgress] = useState({
    completedLessons: 0,
    totalLessons: 0,
    progressPercentage: 0,
    lessons: []
  })
  const [expandedModules, setExpandedModules] = useState({})
  const [loading, setLoading] = useState(true)
  const [markingComplete, setMarkingComplete] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  // Charger le cours et ses modules/leçons
  useEffect(() => {
    loadCourse()
  }, [slug])

  // Charger la progression
  useEffect(() => {
    if (course && isAuthenticated && token) {
      loadProgress()
    }
  }, [course, isAuthenticated, token])

  // Charger la leçon actuelle
  useEffect(() => {
    if (lessonId && modules.length > 0) {
      loadCurrentLesson()
    } else if (!lessonId && modules.length > 0) {
      // Rediriger vers la première leçon si pas de lessonId
      const firstModule = modules[0]
      if (firstModule.lessons && firstModule.lessons.length > 0) {
        const firstLesson = firstModule.lessons[0]
        navigate(`/course/${slug}/lesson/${firstLesson._id}`, { replace: true })
      }
    }
  }, [lessonId, modules, slug, navigate])

  const loadCourse = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${CONFIG.BACKEND_URL}/api/courses/slug/${slug}`)
      
      if (response.data.success) {
        let courseData = response.data.course
        let modulesData = courseData.modules || []
        
        // Ajouter le module Shopify si demandé et pour ecom-starter-20
        if (addShopifyModule && slug === 'ecom-starter-20') {
          const shopifyModule = {
            _id: 'shopify-module-special',
            title: 'Formation Shopify Complète',
            order: 0, // Sera ajusté après insertion
            lessons: [
              {
                _id: 'shopify-lesson-redirect',
                title: '🚀 Accéder à la Formation Shopify 2026',
                videoId: 'redirect-to-shopify-course',
                videoType: 'vimeo',
                order: 1,
                locked: false,
                isCoaching: false,
                summary: {
                  text: 'Cette leçon vous redirige vers notre formation Shopify complète 2026. Vous y apprendrez tout sur la création et la gestion de votre boutique Shopify.',
                  points: [
                    'Création de boutique Shopify étape par étape',
                    'Configuration des produits et collections',
                    'Marketing et optimisation des conversions',
                    'Gestion des commandes et expéditions'
                  ]
                },
                resources: [
                  {
                    icon: '🎯',
                    title: 'Formation Shopify 2026',
                    type: 'course',
                    link: '/course/formation-shopify-2026',
                    download: false
                  }
                ]
              }
            ]
          }
          
          // Trouver le module "Recherche Produit" et insérer après
          const rechercheIndex = modulesData.findIndex(m => 
            m.title.toLowerCase().includes('recherche') && 
            m.title.toLowerCase().includes('produit')
          )
          
          if (rechercheIndex !== -1) {
            // Insérer après le module Recherche Produit
            modulesData.splice(rechercheIndex + 1, 0, shopifyModule)
            
            // Réajuster les ordres
            modulesData.forEach((module, index) => {
              module.order = index + 1
            })
          } else {
            // Si pas trouvé, ajouter à la fin
            shopifyModule.order = modulesData.length + 1
            modulesData.push(shopifyModule)
          }
        }
        
        setCourse(courseData)
        setModules(modulesData)
        
        // Ouvrir le premier module par défaut
        if (modulesData.length > 0) {
          setExpandedModules({ [modulesData[0]._id]: true })
        }
      }
    } catch (error) {
      console.error('Erreur chargement cours:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadProgress = async () => {
    try {
      const response = await axios.get(
        `${CONFIG.BACKEND_URL}/api/courses/${course._id}/progress`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      
      if (response.data.success) {
        setProgress(response.data.progress)
      }
    } catch (error) {
      console.error('Erreur chargement progression:', error)
    }
  }

  const loadCurrentLesson = () => {
    for (const module of modules) {
      const lesson = module.lessons?.find(l => l._id === lessonId)
      if (lesson) {
        setCurrentLesson({ ...lesson, moduleTitle: module.title })
        return
      }
    }
  }

  const toggleModule = (moduleId) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }))
  }

  const isLessonCompleted = (lessonId) => {
    return progress.lessons.some(l => l._id === lessonId && l.completed)
  }

  const handleLessonClick = (lesson, moduleId) => {
    // Cas spécial : leçon de redirection Shopify
    if (lesson._id === 'shopify-lesson-redirect') {
      navigate('/course/formation-shopify-2026')
      return
    }
    
    navigate(`/course/${slug}/lesson/${lesson._id}`)
    
    // Ouvrir le module de la leçon cliquée
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: true
    }))
    
    // Fermer le sidebar mobile
    setIsMobileSidebarOpen(false)
  }

  const handleResourceClick = (resource) => {
    if (resource.type === 'course' && resource.link) {
      navigate(resource.link)
    } else if (resource.link) {
      window.open(resource.link, '_blank')
    }
  }

  const markAsCompleted = async () => {
    if (!isAuthenticated || !token || !currentLesson || !course) return

    setMarkingComplete(true)
    try {
      const response = await axios.post(
        `${CONFIG.BACKEND_URL}/api/courses/${course._id}/lessons/${currentLesson._id}/complete`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      if (response.data.success) {
        // Recharger la progression
        await loadProgress()
        
        // Passer à la leçon suivante
        goToNextLesson()
      }
    } catch (error) {
      console.error('Erreur marquage leçon:', error)
    } finally {
      setMarkingComplete(false)
    }
  }

  const goToNextLesson = () => {
    if (!currentLesson) return

    // Trouver la leçon suivante
    let foundCurrent = false
    for (const module of modules) {
      for (const lesson of module.lessons || []) {
        if (foundCurrent) {
          navigate(`/course/${slug}/lesson/${lesson._id}`)
          return
        }
        if (lesson._id === currentLesson._id) {
          foundCurrent = true
        }
      }
    }
  }

  const goToPreviousLesson = () => {
    if (!currentLesson) return

    let previousLesson = null
    for (const module of modules) {
      for (const lesson of module.lessons || []) {
        if (lesson._id === currentLesson._id) {
          if (previousLesson) {
            navigate(`/course/${slug}/lesson/${previousLesson._id}`)
          }
          return
        }
        previousLesson = lesson
      }
    }
  }

  const getVideoUrl = (lesson) => {
    if (!lesson.videoId) return null

    const videoId = lesson.videoId.toString().trim()
    const isYouTube = lesson.videoType === 'youtube' || videoId.length === 11 || videoId.includes('youtube')

    if (isYouTube) {
      let youtubeId = videoId
      if (videoId.includes('youtube.com/watch?v=')) {
        youtubeId = videoId.split('v=')[1]?.split('&')[0] || videoId
      } else if (videoId.includes('youtu.be/')) {
        youtubeId = videoId.split('youtu.be/')[1]?.split('?')[0] || videoId
      } else if (videoId.includes('youtube.com/embed/')) {
        youtubeId = videoId.split('embed/')[1]?.split('?')[0] || videoId
      }
      return {
        type: 'youtube',
        url: `https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1&playsinline=1&autoplay=0`
      }
    } else {
      let vimeoId = videoId
      if (videoId.includes('vimeo.com/')) {
        vimeoId = videoId.split('vimeo.com/')[1]?.split('?')[0] || videoId
      }
      return {
        type: 'vimeo',
        url: `https://player.vimeo.com/video/${vimeoId}?title=0&byline=0&portrait=0&autoplay=0`
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-secondary">Cours non trouvé</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR - Desktop & Mobile Drawer */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
        flex flex-col overflow-hidden
        transform transition-transform duration-300 ease-in-out
        ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* En-tête sidebar */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-primary truncate">{course.title}</h2>
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <FiX className="w-5 h-5 text-secondary" />
            </button>
          </div>
          
          {/* Barre de progression */}
          {isAuthenticated && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-secondary font-medium">Progression</span>
                <span className="text-accent font-bold">{progress.progressPercentage}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-accent transition-all duration-300"
                  style={{ width: `${progress.progressPercentage}%` }}
                />
              </div>
              <p className="text-xs text-secondary">
                {progress.completedLessons} / {progress.totalLessons} leçons terminées
              </p>
            </div>
          )}
        </div>

        {/* Liste des modules et leçons */}
        <div className="flex-1 overflow-y-auto">
          {modules.map((module) => (
            <div key={module._id} className="border-b border-gray-200 dark:border-gray-700">
              {/* Module header - Accordion */}
              <button
                onClick={() => toggleModule(module._id)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="font-semibold text-sm text-primary">
                  {module._id === 'shopify-module-special' ? '🛍️ ' : 'Module '}{module.title}
                </span>
                {expandedModules[module._id] ? (
                  <FiChevronDown className="w-4 h-4 text-secondary" />
                ) : (
                  <FiChevronRight className="w-4 h-4 text-secondary" />
                )}
              </button>

              {/* Leçons du module */}
              {expandedModules[module._id] && (
                <div className="bg-gray-50 dark:bg-gray-900">
                  {module.lessons?.map((lesson, index) => {
                    const isCompleted = isLessonCompleted(lesson._id)
                    const isActive = currentLesson?._id === lesson._id

                    return (
                      <button
                        key={lesson._id}
                        onClick={() => handleLessonClick(lesson, module._id)}
                        className={`w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                          isActive ? 'bg-accent/10 border-l-4 border-accent' : ''
                        }`}
                      >
                        {/* Icône statut */}
                        <div className="flex-shrink-0 w-5 h-5 mt-0.5">
                          {isCompleted ? (
                            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                              <FiCheck className="w-3 h-3 text-white" />
                            </div>
                          ) : isActive ? (
                            <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                              <FiPlay className="w-3 h-3 text-white" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                          )}
                        </div>

                        {/* Titre leçon */}
                        <div className="flex-1 text-left">
                          <p className={`text-sm font-medium ${
                            isActive ? 'text-accent' : 'text-primary'
                          }`}>
                            {index + 1}. {lesson.title}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>

      {/* CONTENU PRINCIPAL */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile Menu Button */}
        <div className="lg:hidden sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="flex items-center gap-2 text-primary font-semibold"
          >
            <FiMenu className="w-5 h-5" />
            <span>Chapitres</span>
          </button>
        </div>

        <div className="max-w-5xl mx-auto p-4 lg:p-8">
          {currentLesson ? (
            <>
              {/* En-tête leçon */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 bg-accent/10 text-accent text-xs font-semibold rounded-full">
                    {currentLesson.moduleTitle}
                  </span>
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold text-primary mb-4">
                  {currentLesson.title}
                </h1>

                {/* Bouton "Marquer comme terminé" */}
                {isAuthenticated && !isLessonCompleted(currentLesson._id) && (
                  <button
                    onClick={markAsCompleted}
                    disabled={markingComplete}
                    className="btn-primary px-6 py-3 flex items-center gap-2"
                  >
                    {markingComplete ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <FiCheck className="w-4 h-4" />
                        Marquer comme terminé
                      </>
                    )}
                  </button>
                )}

                {isAuthenticated && isLessonCompleted(currentLesson._id) && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg">
                    <FiCheck className="w-4 h-4" />
                    <span className="font-semibold">Leçon terminée</span>
                  </div>
                )}
              </div>

              {/* Vidéo */}
              {currentLesson.videoId && (
                <div className="mb-8">
                  <ProtectedVideo
                    video={getVideoUrl(currentLesson)}
                    isFirstVideo={false}
                    isFreeCourse={course.isFree}
                  />
                </div>
              )}

              {/* Résumé */}
              {currentLesson.summary && (currentLesson.summary.text || currentLesson.summary.points?.length > 0) && (
                <div className="card-startup mb-8">
                  <h3 className="text-xl font-bold text-primary mb-4">Résumé de la leçon</h3>
                  {currentLesson.summary.text && (
                    <p className="text-base text-primary mb-4 leading-relaxed">
                      {currentLesson.summary.text}
                    </p>
                  )}
                  {currentLesson.summary.points?.length > 0 && (
                    <ul className="space-y-2">
                      {currentLesson.summary.points.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center text-xs font-bold mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="flex-1 text-primary">{point}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Ressources */}
              {currentLesson.resources?.length > 0 && (
                <div className="card-startup mb-8">
                  <h3 className="text-xl font-bold text-primary mb-4">Ressources</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {currentLesson.resources.map((resource, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => handleResourceClick(resource)}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <span className="text-2xl">{resource.icon || '📄'}</span>
                          <div>
                            <p className="font-semibold text-primary text-sm">{resource.title}</p>
                            <p className="text-xs text-secondary">{resource.type}</p>
                          </div>
                        </div>
                        {resource.download ? (
                          <a
                            href={resource.link}
                            download
                            className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors"
                          >
                            Télécharger
                          </a>
                        ) : (
                          <a
                            href={resource.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors"
                          >
                            Accéder
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between gap-4 mt-8">
                <button
                  onClick={goToPreviousLesson}
                  className="btn-secondary px-6 py-3"
                >
                  ← Leçon précédente
                </button>
                <button
                  onClick={goToNextLesson}
                  className="btn-primary px-6 py-3"
                >
                  Leçon suivante →
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg text-secondary">Sélectionnez une leçon pour commencer</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

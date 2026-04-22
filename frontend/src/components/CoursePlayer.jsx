import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { CONFIG } from '../config/config'
import axios from 'axios'
import ProtectedVideo from './ProtectedVideo'
import { FiChevronDown, FiChevronRight, FiChevronLeft, FiCheck, FiPlay, FiLock, FiMenu, FiX, FiArrowLeft, FiList, FiBookOpen, FiPaperclip, FiSearch, FiClock, FiAward } from 'react-icons/fi'

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
  const [isCurriculumOpen, setIsCurriculumOpen] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')

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
                    link: 'https://www.safitech.shop/course/formation-shopify-2026',
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
    for (let mi = 0; mi < modules.length; mi++) {
      const module = modules[mi]
      const lessonIdx = module.lessons?.findIndex(l => l._id === lessonId) ?? -1
      if (lessonIdx !== -1) {
        const lesson = module.lessons[lessonIdx]
        setCurrentLesson({
          ...lesson,
          moduleTitle: module.title,
          moduleId: module._id,
          moduleIndex: mi,
          lessonIndex: lessonIdx
        })
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

    // Détection MP4 direct
    if (lesson.videoType === 'mp4' || videoId.endsWith('.mp4') || (videoId.startsWith('http') && videoId.includes('.mp4'))) {
      return { type: 'mp4', url: videoId }
    }

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

  const totalLessons = modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0)
  const completedCount = progress.completedLessons || 0

  const filteredModules = searchQuery.trim()
    ? modules
        .map((m) => ({
          ...m,
          lessons: (m.lessons || []).filter((l) =>
            l.title?.toLowerCase().includes(searchQuery.toLowerCase())
          )
        }))
        .filter((m) => m.lessons.length > 0)
    : modules

  const getModuleStats = (module) => {
    const total = module.lessons?.length || 0
    const done = (module.lessons || []).filter((l) => isLessonCompleted(l._id)).length
    return { total, done }
  }

  const cleanModuleTitle = (title) =>
    (title || '').replace(/^Module\s*\d*\s*[:\-–—]?\s*/i, '').trim()

  const OVERVIEW_CATEGORIES = [
    {
      id: 'intro',
      test: /(intro|présent|bienvenue|par\s*où\s*commencer|avant de commencer|à propos|découverte|jour\s*1\b|vue d'ensemble)/i,
      build: (t, m) => ({
        text: `Cette leçon d'introduction ${m ? `ouvre le module « ${m} »` : 'pose les fondations de la formation'}. Prenez le temps d'en absorber la vision d'ensemble avant de passer au concret.`,
        points: [
          'Le contexte et les objectifs de cette section',
          'Ce que vous saurez faire à la fin du module',
          'La meilleure façon d\'aborder les prochaines leçons',
          'Les prérequis éventuels à avoir en tête'
        ]
      })
    },
    {
      id: 'product-research',
      test: /(produit gagnant|winning|recherche\s*produit|niche|tendance|viral|aliexpress|spy|adspy|minea)/i,
      build: (t) => ({
        text: `Apprenez à repérer un produit à fort potentiel. Cette leçon vous donne la méthodologie pour filtrer, valider et choisir sans tomber dans les pièges classiques du débutant.`,
        points: [
          'Les critères qui rendent un produit vendeur',
          'Les outils et sources fiables pour repérer les tendances',
          'Comment valider la demande avant d\'investir',
          'Les erreurs à éviter dans la recherche produit',
          'Exemples concrets de produits performants'
        ]
      })
    },
    {
      id: 'facebook-ads',
      test: /(facebook|meta|instagram|ads?\b|publicit|pub\b|cbo|abo|pixel|campagne|ciblage|audience|creative)/i,
      build: (t) => ({
        text: `Maîtrisez les leviers publicitaires Meta pour générer du trafic qualifié vers votre boutique. Cette leçon se concentre sur l'aspect opérationnel, avec les réglages et les bonnes pratiques qui font la différence.`,
        points: [
          'Paramétrer correctement cette étape dans le Business Manager',
          'Comprendre les variables qui influencent la performance',
          'Les bonnes pratiques de budget et de phases de test',
          'Ce qu\'il faut surveiller pour ajuster rapidement',
          'Les pièges à éviter pour ne pas cramer votre budget'
        ]
      })
    },
    {
      id: 'shopify',
      test: /(shopify|boutique|store\b|thème|theme|page\s*produit|checkout|woocommerce|site web)/i,
      build: (t) => ({
        text: `Configurez votre boutique de façon professionnelle. Une base technique propre est la condition pour convertir le trafic que vous allez générer ensuite.`,
        points: [
          'Les réglages prioritaires à faire dès l\'ouverture',
          'Structurer la fiche produit pour rassurer l\'acheteur',
          'Les éléments de confiance indispensables',
          'Éviter les frictions qui font abandonner le panier',
          'Optimiser pour mobile en priorité'
        ]
      })
    },
    {
      id: 'livraison',
      test: /(livraison|logistique|cod|cash\s*on|fournisseur|dropship|supplier|agent|expédition|emballage)/i,
      build: (t) => ({
        text: `Sécurisez la partie opérationnelle de votre business : faire livrer et encaisser. C'est souvent là que les marges se perdent quand tout n'est pas bien organisé.`,
        points: [
          'Les options adaptées au contexte africain',
          'Comment choisir un fournisseur ou un agent fiable',
          'Réduire les retours et les colis refusés',
          'Les étapes à automatiser dès que possible',
          'Calculer ses vraies marges après tous les frais'
        ]
      })
    },
    {
      id: 'paiement',
      test: /(paiement|mobile\s*money|wave|orange money|mtn|stripe|flutterwave|paypal|lygos)/i,
      build: (t) => ({
        text: `Mettez en place des moyens de paiement adaptés à vos clients. Plus vous enlevez de friction à l'étape du paiement, plus vous convertissez.`,
        points: [
          'Les solutions disponibles et leurs frais réels',
          'Comment intégrer la solution sur votre boutique',
          'Gérer les paiements manuels sans perdre d\'argent',
          'Sécuriser les transactions et éviter les litiges'
        ]
      })
    },
    {
      id: 'marketing',
      test: /(marketing|email|newsletter|whatsapp|sms|contenu|branding|marque|influenceur|tiktok|organique)/i,
      build: (t) => ({
        text: `Déployez un levier marketing complémentaire pour augmenter votre chiffre d'affaires sans dépendre uniquement de la publicité payante.`,
        points: [
          'Pourquoi ce canal est pertinent pour votre activité',
          'La méthode pas-à-pas à appliquer',
          'Des exemples concrets à dupliquer',
          'Les indicateurs à suivre pour mesurer l\'impact',
          'Comment industrialiser le processus'
        ]
      })
    },
    {
      id: 'analytics',
      test: /(analyt|stat|kpi|metric|tracking|mesure|roas|cpa|conversion|chiffres|pilotage)/i,
      build: (t) => ({
        text: `Pilotez votre business avec des chiffres plutôt qu'au feeling. Cette leçon vous donne les indicateurs qui comptent vraiment et comment les interpréter.`,
        points: [
          'Les KPI à suivre au quotidien',
          'Comment les interpréter sans se tromper',
          'Quelles décisions prendre selon les chiffres',
          'Installer un tableau de bord simple et fiable'
        ]
      })
    },
    {
      id: 'mindset',
      test: /(mindset|motivation|état\s*d'esprit|discipline|psycho|perseverance)/i,
      build: (t) => ({
        text: `Avant la technique, il y a la posture. Cette leçon vous aide à garder la bonne attitude pour durer dans la durée, parce que c'est la constance qui paie.`,
        points: [
          'Les blocages mentaux les plus fréquents',
          'Comment rester constant malgré les échecs',
          'Construire des habitudes gagnantes',
          'Gérer la pression et l\'incertitude'
        ]
      })
    },
    {
      id: 'juridique',
      test: /(juridique|légal|impôt|fiscal|société|entreprise|statut|facture)/i,
      build: (t) => ({
        text: `Structurez légalement votre activité pour avancer sereinement. Cette leçon vous donne les repères essentiels sans jargon inutile.`,
        points: [
          'Les démarches à faire pour être en règle',
          'Quand et comment déclarer son activité',
          'Les documents à garder systématiquement',
          'Les risques d\'ignorer cette étape'
        ]
      })
    }
  ]

  const generateOverview = (lesson, module) => {
    if (!lesson) return { text: '', points: [], generated: false }
    const title = lesson.title || 'cette leçon'
    const moduleTitle = cleanModuleTitle(module?.title || lesson.moduleTitle)
    const matched =
      OVERVIEW_CATEGORIES.find((c) => c.test.test(title)) ||
      OVERVIEW_CATEGORIES.find((c) => c.test.test(moduleTitle))
    if (matched) {
      return { ...matched.build(title, moduleTitle), generated: true }
    }
    const cleanedTitle = title.replace(/^(jour\s*\d+\s*[:\-–—]?\s*)/i, '').trim()
    return {
      text: `Dans cette leçon, vous allez explorer « ${cleanedTitle} »${moduleTitle ? ` dans le cadre du module « ${moduleTitle} »` : ''}. L'objectif : vous donner les repères concrets pour passer à la pratique dès la fin de la vidéo.`,
      points: [
        `Les notions essentielles à maîtriser sur ${cleanedTitle.toLowerCase()}`,
        'Les étapes à appliquer pas-à-pas',
        'Les erreurs classiques à éviter',
        'Ce que vous devriez savoir faire à la fin'
      ],
      generated: true
    }
  }

  const renderCurriculum = (variant = 'desktop') => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FiList className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-bold text-primary uppercase tracking-wide">Programme</h3>
          </div>
          {variant === 'mobile' && (
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <FiX className="w-5 h-5 text-secondary" />
            </button>
          )}
          {variant === 'desktop' && (
            <button
              onClick={() => setIsCurriculumOpen(false)}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="Masquer le programme"
            >
              <FiChevronRight className="w-4 h-4 text-secondary" />
            </button>
          )}
        </div>
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une leçon…"
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 border-0 rounded-lg focus:ring-2 focus:ring-accent/40 focus:outline-none text-primary placeholder:text-secondary"
          />
        </div>
      </div>

      {/* Liste modules */}
      <div className="flex-1 overflow-y-auto">
        {filteredModules.length === 0 ? (
          <div className="p-6 text-center text-sm text-secondary">
            Aucune leçon ne correspond à « {searchQuery} »
          </div>
        ) : (
          filteredModules.map((module, moduleIndex) => {
            const isShopifyModule = module._id === 'shopify-module-special'
            const cleanTitle = cleanModuleTitle(module.title)
            const stats = getModuleStats(module)
            const isExpanded = expandedModules[module._id]
            const hasActiveLesson = module.lessons?.some((l) => l._id === currentLesson?._id)

            return (
              <div key={module._id} className="border-b border-gray-100 dark:border-gray-800 last:border-b-0">
                <button
                  onClick={() => toggleModule(module._id)}
                  className={`w-full px-4 py-3.5 flex items-center gap-3 transition-colors ${
                    hasActiveLesson ? 'bg-accent/5' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm transition-colors ${
                    stats.done === stats.total && stats.total > 0
                      ? 'bg-green-500 text-white'
                      : 'bg-accent/10 text-accent'
                  }`}>
                    {stats.done === stats.total && stats.total > 0 ? (
                      <FiCheck className="w-4 h-4" />
                    ) : isShopifyModule ? '🛍️' : moduleIndex + 1}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-accent">
                        Module {moduleIndex + 1}
                      </div>
                      <div className="text-[10px] text-secondary font-medium">
                        {stats.done}/{stats.total}
                      </div>
                    </div>
                    <div className="font-semibold text-sm text-primary truncate leading-tight">
                      {cleanTitle || `Module ${moduleIndex + 1}`}
                    </div>
                  </div>
                  <FiChevronDown
                    className={`w-4 h-4 text-secondary flex-shrink-0 transition-transform ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isExpanded && (
                  <div className="bg-gray-50/50 dark:bg-gray-900/50 py-1">
                    {module.lessons?.map((lesson, index) => {
                      const isCompleted = isLessonCompleted(lesson._id)
                      const isActive = currentLesson?._id === lesson._id
                      return (
                        <button
                          key={lesson._id}
                          onClick={() => handleLessonClick(lesson, module._id)}
                          className={`w-full pl-5 pr-4 py-2.5 flex items-center gap-3 text-left transition-all group relative ${
                            isActive
                              ? 'bg-accent/10'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                        >
                          {isActive && (
                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-accent rounded-r-full" />
                          )}
                          <div className="flex-shrink-0 w-5 h-5">
                            {isCompleted ? (
                              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shadow-sm shadow-green-500/30">
                                <FiCheck className="w-3 h-3 text-white" strokeWidth={3} />
                              </div>
                            ) : isActive ? (
                              <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center shadow-sm shadow-accent/40">
                                <FiPlay className="w-2.5 h-2.5 text-white ml-0.5" fill="currentColor" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600 group-hover:border-accent transition-colors" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm truncate leading-tight ${
                              isActive ? 'text-accent font-semibold' : isCompleted ? 'text-secondary' : 'text-primary font-medium'
                            }`}>
                              <span className="text-xs opacity-70 mr-1">{moduleIndex + 1}.{index + 1}</span>
                              {lesson.title}
                            </p>
                          </div>
                          {lesson.locked && <FiLock className="w-3 h-3 text-secondary flex-shrink-0" />}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      {/* TOP BAR */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex items-center justify-between px-4 lg:px-6 h-14">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              onClick={() => navigate('/my-courses')}
              className="flex items-center gap-1.5 text-secondary hover:text-primary transition-colors text-sm font-medium flex-shrink-0"
              title="Retour aux cours"
            >
              <FiArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Mes cours</span>
            </button>
            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 hidden sm:block" />
            <div className="min-w-0 flex-1 hidden sm:block">
              <div className="text-[10px] font-bold uppercase tracking-wider text-accent leading-none">Formation</div>
              <h1 className="text-sm font-bold text-primary truncate leading-tight">{course.title}</h1>
            </div>
            <h1 className="sm:hidden text-sm font-bold text-primary truncate">{course.title}</h1>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {isAuthenticated && totalLessons > 0 && (
              <div className="hidden md:flex items-center gap-3 px-4 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full">
                <FiAward className="w-4 h-4 text-accent" />
                <div className="text-xs">
                  <span className="font-bold text-primary">{completedCount}</span>
                  <span className="text-secondary"> / {totalLessons}</span>
                </div>
                <div className="w-24 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent to-accent/70 transition-all duration-500"
                    style={{ width: `${progress.progressPercentage}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-accent">{progress.progressPercentage}%</span>
              </div>
            )}
            <button
              onClick={() => {
                if (window.innerWidth < 1024) setIsMobileSidebarOpen(true)
                else setIsCurriculumOpen(!isCurriculumOpen)
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 hover:bg-accent/20 text-accent rounded-lg text-sm font-semibold transition-colors"
            >
              <FiList className="w-4 h-4" />
              <span className="hidden sm:inline">Programme</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* CURRICULUM DESKTOP - GAUCHE */}
        {isCurriculumOpen && (
          <aside className="hidden lg:flex w-80 xl:w-96 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex-col">
            {renderCurriculum('desktop')}
          </aside>
        )}

        {/* Bouton pour rouvrir sur desktop */}
        {!isCurriculumOpen && (
          <button
            onClick={() => setIsCurriculumOpen(true)}
            className="hidden lg:flex fixed left-4 top-20 z-30 w-10 h-10 bg-accent hover:bg-accent/90 text-white rounded-full shadow-lg items-center justify-center transition-colors"
            title="Afficher le programme"
          >
            <FiList className="w-4 h-4" />
          </button>
        )}

        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto">
          {currentLesson ? (
            <>
              {/* HERO VIDEO */}
              <div className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
                <div className="max-w-4xl mx-auto px-4 lg:px-6 py-5 lg:py-6">
                  {/* Badges module/leçon */}
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {typeof currentLesson.moduleIndex === 'number' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent text-white text-[11px] font-bold rounded-full uppercase tracking-wide">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
                        Module {currentLesson.moduleIndex + 1}
                      </span>
                    )}
                    {typeof currentLesson.lessonIndex === 'number' && (
                      <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-[11px] font-semibold rounded-full">
                        Leçon {currentLesson.lessonIndex + 1}
                      </span>
                    )}
                    {isAuthenticated && isLessonCompleted(currentLesson._id) && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 dark:bg-green-500/20 text-green-700 dark:text-green-300 text-[11px] font-bold rounded-full border border-green-200 dark:border-green-500/30">
                        <FiCheck className="w-3 h-3" strokeWidth={3} />
                        Terminée
                      </span>
                    )}
                  </div>

                  {/* Titre leçon */}
                  <h2 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-4 leading-tight tracking-tight">
                    {currentLesson.title}
                  </h2>

                  {/* Vidéo */}
                  {currentLesson.videoId && (
                    <div className="rounded-2xl overflow-hidden shadow-lg ring-1 ring-gray-200 dark:ring-white/10">
                      <ProtectedVideo
                        video={getVideoUrl(currentLesson)}
                        isFirstVideo={false}
                        isFreeCourse={course.isFree}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* ACTIONS BAR */}
              <div className="sticky top-14 z-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                <div className="max-w-6xl mx-auto px-4 lg:px-6">
                  <div className="flex items-center justify-between gap-3 py-3">
                    {/* Tabs */}
                    <div className="flex items-center gap-1 overflow-x-auto">
                      <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-3 lg:px-4 py-2 text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap ${
                          activeTab === 'overview'
                            ? 'bg-accent/10 text-accent'
                            : 'text-secondary hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        <FiBookOpen className="w-4 h-4" />
                        Aperçu
                      </button>
                      {currentLesson.resources?.length > 0 && (
                        <button
                          onClick={() => setActiveTab('resources')}
                          className={`px-3 lg:px-4 py-2 text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap ${
                            activeTab === 'resources'
                              ? 'bg-accent/10 text-accent'
                              : 'text-secondary hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                        >
                          <FiPaperclip className="w-4 h-4" />
                          Ressources
                          <span className="px-1.5 py-0.5 bg-accent/20 text-accent text-[10px] font-bold rounded-full">
                            {currentLesson.resources.length}
                          </span>
                        </button>
                      )}
                    </div>

                    {/* Bouton terminer */}
                    {isAuthenticated && !isLessonCompleted(currentLesson._id) && (
                      <button
                        onClick={markAsCompleted}
                        disabled={markingComplete}
                        className="px-4 py-2 bg-accent hover:bg-accent/90 text-white text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap shadow-sm shadow-accent/30"
                      >
                        {markingComplete ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span className="hidden sm:inline">Enregistrement…</span>
                          </>
                        ) : (
                          <>
                            <FiCheck className="w-4 h-4" strokeWidth={3} />
                            <span className="hidden sm:inline">Marquer terminé</span>
                            <span className="sm:hidden">Terminer</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* CONTENU TAB */}
              <div className="max-w-6xl mx-auto px-4 lg:px-6 py-6 lg:py-8">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* MODULE CARD */}
                    {(() => {
                      const currentModule = typeof currentLesson.moduleIndex === 'number' ? modules[currentLesson.moduleIndex] : null
                      const moduleLessons = currentModule?.lessons || []
                      const completedInModule = moduleLessons.filter(l => isLessonCompleted(l._id)).length
                      const modulePercent = moduleLessons.length > 0 ? Math.round((completedInModule / moduleLessons.length) * 100) : 0

                      return currentModule ? (
                        <div className="card-startup">
                          {/* En-tête module */}
                          <div className="flex items-start justify-between gap-4 mb-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                                <FiBookOpen className="w-5 h-5 text-accent" />
                              </div>
                              <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-accent mb-0.5">Module {currentLesson.moduleIndex + 1}</p>
                                <h3 className="text-base font-bold text-primary leading-tight">{currentModule.title}</h3>
                              </div>
                            </div>
                            <span className="flex-shrink-0 text-sm font-bold text-accent">{modulePercent}%</span>
                          </div>

                          {/* Barre de progression */}
                          <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full mb-5 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-accent to-accent/70 rounded-full transition-all duration-500"
                              style={{ width: `${modulePercent}%` }}
                            />
                          </div>

                          {/* Liste des leçons du module */}
                          <ul className="space-y-1.5">
                            {moduleLessons.map((lesson, idx) => {
                              const isCompleted = isLessonCompleted(lesson._id)
                              const isCurrent = lesson._id === currentLesson._id
                              return (
                                <li key={lesson._id}>
                                  <button
                                    onClick={() => handleLessonClick(lesson, currentModule._id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 group ${
                                      isCurrent
                                        ? 'bg-accent/10 border border-accent/30'
                                        : 'hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent'
                                    }`}
                                  >
                                    {/* Icône état */}
                                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                                      isCompleted
                                        ? 'bg-green-500 text-white'
                                        : isCurrent
                                          ? 'bg-accent text-white'
                                          : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                    }`}>
                                      {isCompleted
                                        ? <FiCheck className="w-3 h-3" strokeWidth={3} />
                                        : isCurrent
                                          ? <FiPlay className="w-3 h-3 ml-0.5" />
                                          : <span>{idx + 1}</span>
                                      }
                                    </div>
                                    {/* Titre */}
                                    <span className={`flex-1 text-sm leading-snug ${
                                      isCurrent ? 'font-semibold text-accent' : 'font-medium text-primary'
                                    }`}>
                                      {lesson.title}
                                    </span>
                                    {/* Badge en cours */}
                                    {isCurrent && (
                                      <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 bg-accent text-white rounded-full">
                                        En cours
                                      </span>
                                    )}
                                  </button>
                                </li>
                              )
                            })}
                          </ul>

                          {/* Stat basse */}
                          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2 text-xs text-secondary">
                            <FiCheck className="w-3.5 h-3.5 text-green-500" />
                            <span>{completedInModule} / {moduleLessons.length} leçons complétées</span>
                          </div>
                        </div>
                      ) : null
                    })()}

                    {/* RÉSUMÉ LEÇON */}
                    {currentLesson.summary && (currentLesson.summary.text || currentLesson.summary.points?.length > 0) && (
                      <>
                        {currentLesson.summary.text && (
                          <div className="prose prose-gray dark:prose-invert max-w-none">
                            <p className="text-base lg:text-lg text-primary leading-relaxed">
                              {currentLesson.summary.text}
                            </p>
                          </div>
                        )}
                        {currentLesson.summary.points?.length > 0 && (
                          <div className="card-startup">
                            <div className="flex items-center gap-3 mb-5">
                              <div className="w-9 h-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center flex-shrink-0">
                                <FiAward className="w-4 h-4" />
                              </div>
                              <h3 className="text-base font-bold text-primary uppercase tracking-wide">Ce que vous allez apprendre</h3>
                            </div>
                            <ul className="grid gap-3 sm:grid-cols-2">
                              {currentLesson.summary.points.map((point, idx) => (
                                <li key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/15 text-accent flex items-center justify-center mt-0.5">
                                    <FiCheck className="w-3.5 h-3.5" strokeWidth={3} />
                                  </span>
                                  <span className="flex-1 text-sm text-primary leading-relaxed">{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {activeTab === 'resources' && currentLesson.resources?.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {currentLesson.resources.map((resource, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-accent hover:shadow-lg transition-all cursor-pointer group"
                        onClick={() => handleResourceClick(resource)}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/10 to-accent/5 flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-105 transition-transform">
                            {resource.icon || '📄'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-primary text-sm truncate">{resource.title}</p>
                            <p className="text-xs text-secondary uppercase tracking-wide font-medium">{resource.type}</p>
                          </div>
                        </div>
                        {resource.download ? (
                          <a
                            href={resource.link}
                            download
                            onClick={(e) => e.stopPropagation()}
                            className="px-3 py-1.5 bg-accent text-white rounded-lg text-xs font-semibold hover:bg-accent/90 transition-colors flex-shrink-0"
                          >
                            Télécharger
                          </a>
                        ) : (
                          <a
                            href={resource.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="px-3 py-1.5 bg-accent text-white rounded-lg text-xs font-semibold hover:bg-accent/90 transition-colors flex-shrink-0"
                          >
                            Accéder
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* FOOTER NAV */}
              <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                <div className="max-w-6xl mx-auto px-4 lg:px-6 py-4 flex items-center justify-between gap-3">
                  <button
                    onClick={goToPreviousLesson}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-primary hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <FiChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Précédent</span>
                  </button>
                  <button
                    onClick={goToNextLesson}
                    className="flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent/90 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm shadow-accent/30"
                  >
                    <span>Leçon suivante</span>
                    <FiChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
                  <FiBookOpen className="w-8 h-8 text-accent" />
                </div>
                <p className="text-lg text-secondary">Sélectionnez une leçon pour commencer</p>
              </div>
            </div>
          )}
        </main>

      </div>

      {/* CURRICULUM MOBILE DRAWER (depuis la gauche) */}
      {isMobileSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-[85%] max-w-sm bg-white dark:bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {renderCurriculum('mobile')}
      </aside>
    </div>
  )
}

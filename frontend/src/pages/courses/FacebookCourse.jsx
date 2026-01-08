import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import LessonPage from '../LessonPage'
import CoachingPage from '../CoachingPage'
import { CONFIG } from '../../config/config'
import axios from 'axios'

export default function FacebookCourse() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCourse = async () => {
      try {
        setLoading(true)
        const response = await axios.get(`${CONFIG.BACKEND_URL}/api/courses/slug/${slug || 'facebook-ads'}`)
        
        if (response.data.success) {
          setCourse(response.data.course)
          
          // Rediriger vers la première leçon si on est à la racine
          if (response.data.course.modules && response.data.course.modules.length > 0) {
            const firstModule = response.data.course.modules[0]
            if (firstModule.lessons && firstModule.lessons.length > 0) {
              const firstLesson = firstModule.lessons[0]
              if (window.location.pathname === `/course/${slug || 'facebook-ads'}` || 
                  window.location.pathname === `/course/${slug || 'facebook-ads'}/`) {
                navigate(`/course/${slug || 'facebook-ads'}/lesson/${firstLesson._id}`, { replace: true })
              }
            }
          }
        }
      } catch (error) {
        console.error('Erreur chargement cours:', error)
      } finally {
        setLoading(false)
      }
    }

    loadCourse()
  }, [slug, navigate])

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-primary font-semibold">Chargement du cours...</p>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-primary mb-2">Cours non trouvé</h2>
          <p className="text-secondary mb-6">Le cours demandé n'existe pas ou n'est plus disponible.</p>
          <a href="/cours" className="btn-primary inline-flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour aux cours
          </a>
        </div>
      </div>
    )
  }

  // Vérifier si le cours a des leçons
  const hasLessons = course.modules?.some(module => module.lessons && module.lessons.length > 0)
  
  if (!hasLessons) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center px-4">
        <div className="card-startup max-w-2xl w-full text-center">
          <div className="w-20 h-20 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 className="text-2xl lg:text-3xl font-bold text-primary mb-3">
            {course.title}
          </h2>
          <p className="text-lg text-secondary mb-2">
            Pas de leçon encore disponible pour ce cours
          </p>
          <p className="text-sm text-secondary mb-6">
            Le contenu de cette formation est en cours de préparation. Revenez bientôt !
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="/cours" className="btn-secondary inline-flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Retour aux cours
            </a>
            <a href="/" className="btn-primary inline-flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Accueil
            </a>
          </div>
        </div>
      </div>
    )
  }

  // Créer les routes dynamiquement depuis les leçons de la DB
  const routes = []
  
  if (course.modules) {
    course.modules.forEach((module) => {
      if (module.lessons) {
        module.lessons.forEach((lesson, index) => {
          const isLast = index === module.lessons.length - 1 && 
                        course.modules.indexOf(module) === course.modules.length - 1
          
          routes.push(
            <Route
              key={lesson._id}
              path={`lesson/${lesson._id}`}
              element={
                isLast ? (
                  <CoachingPage lesson={convertLessonToLegacyFormat(lesson, index + 1, slug || 'facebook-ads')} />
                ) : (
                  <LessonPage lesson={convertLessonToLegacyFormat(lesson, index + 1, slug || 'facebook-ads')} />
                )
              }
            />
          )
        })
      }
    })
  }

  return (
    <Routes>
      <Route index element={<Navigate to={`lesson/${course.modules?.[0]?.lessons?.[0]?._id || ''}`} replace />} />
      {routes}
      {/* Routes legacy pour compatibilité */}
      <Route path="dashboard" element={<Navigate to={`lesson/${course.modules?.[0]?.lessons?.[0]?._id || ''}`} replace />} />
      <Route path="jour-2" element={<Navigate to={`lesson/${course.modules?.[0]?.lessons?.[1]?._id || ''}`} replace />} />
      <Route path="jour-3" element={<Navigate to={`lesson/${course.modules?.[0]?.lessons?.[2]?._id || ''}`} replace />} />
      <Route path="jour-4" element={<Navigate to={`lesson/${course.modules?.[0]?.lessons?.[3]?._id || ''}`} replace />} />
      <Route path="jour-5" element={<Navigate to={`lesson/${course.modules?.[0]?.lessons?.[4]?._id || ''}`} replace />} />
      <Route path="jour-6" element={<Navigate to={`lesson/${course.modules?.[0]?.lessons?.[5]?._id || ''}`} replace />} />
      <Route path="jour-7" element={<Navigate to={`lesson/${course.modules?.[0]?.lessons?.[6]?._id || ''}`} replace />} />
      <Route path="jour-8" element={<Navigate to={`lesson/${course.modules?.[0]?.lessons?.[7]?._id || ''}`} replace />} />
    </Routes>
  )
}

// Fonction pour convertir une leçon de la DB au format legacy
function convertLessonToLegacyFormat(lesson, order, courseSlug = 'facebook-ads') {
  if (!lesson.videoId) {
    console.warn('⚠️ Leçon sans videoId:', lesson.title)
    return {
      id: order,
      _id: lesson._id,
      path: `/course/${courseSlug}/lesson/${lesson._id}`,
      title: lesson.title,
      badge: `JOUR ${order}`,
      meta: 'Formation',
      video: {
        type: 'youtube',
        url: ''
      },
      summary: lesson.summary || { text: '', points: [] },
      resources: lesson.resources || [],
      isCoaching: lesson.isCoaching || false
    }
  }

  // Déterminer le type de vidéo
  let videoType = 'vimeo'
  let videoUrl = ''
  
  const videoId = lesson.videoId.toString().trim()
  
  // Détection YouTube (ID de 11 caractères ou contient 'youtube')
  if (videoId.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    videoType = 'youtube'
    videoUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1&autoplay=0`
  }
  // Détection URL YouTube complète
  else if (videoId.includes('youtube.com') || videoId.includes('youtu.be')) {
    videoType = 'youtube'
    let youtubeId = videoId
    // Extraire l'ID depuis l'URL
    if (videoId.includes('youtube.com/watch?v=')) {
      youtubeId = videoId.split('v=')[1]?.split('&')[0] || videoId
    } else if (videoId.includes('youtu.be/')) {
      youtubeId = videoId.split('youtu.be/')[1]?.split('?')[0] || videoId
    } else if (videoId.includes('youtube.com/embed/')) {
      youtubeId = videoId.split('embed/')[1]?.split('?')[0] || videoId
    }
    videoUrl = `https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1&playsinline=1&autoplay=0`
  }
  // Détection Vimeo (contient 'vimeo' ou est un nombre)
  else if (videoId.includes('vimeo.com') || videoId.includes('vimeo')) {
    videoType = 'vimeo'
    let vimeoId = videoId
    // Extraire l'ID depuis l'URL Vimeo
    if (videoId.includes('vimeo.com/')) {
      vimeoId = videoId.split('vimeo.com/')[1]?.split('?')[0] || videoId
    }
    videoUrl = `https://player.vimeo.com/video/${vimeoId}?title=0&byline=0&portrait=0&autoplay=0`
  }
  // Par défaut, traiter comme Vimeo (ID numérique)
  else {
    videoType = 'vimeo'
    videoUrl = `https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0&autoplay=0`
  }

  const badgeMatch = lesson.title.match(/JOUR \d+/)
  const badge = badgeMatch ? badgeMatch[0] : `JOUR ${order}`
  const meta = lesson.title.split(' - ')[1] || 'Formation'

  console.log(`📹 Vidéo détectée - Type: ${videoType}, ID: ${videoId.substring(0, 20)}...`)

  return {
    id: order,
    _id: lesson._id,
    path: `/course/${courseSlug}/lesson/${lesson._id}`,
    title: lesson.title,
    badge: badge,
    meta: meta,
    video: {
      type: videoType,
      url: videoUrl
    },
    summary: lesson.summary || { text: '', points: [] },
    resources: lesson.resources || [],
    isCoaching: lesson.isCoaching || false
  }
}


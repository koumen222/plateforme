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
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '1rem'
      }}>
        <div style={{ fontSize: '3rem' }}>⏳</div>
        <p>Chargement du cours...</p>
      </div>
    )
  }

  if (!course) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '1rem'
      }}>
        <div style={{ fontSize: '3rem' }}>❌</div>
        <p>Cours non trouvé</p>
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
                  <CoachingPage lesson={convertLessonToLegacyFormat(lesson, index + 1)} />
                ) : (
                  <LessonPage lesson={convertLessonToLegacyFormat(lesson, index + 1)} />
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
function convertLessonToLegacyFormat(lesson, order) {
  // Déterminer le type de vidéo (si videoId fait 11 caractères, c'est YouTube, sinon Vimeo)
  const isYouTube = lesson.videoId && (lesson.videoId.length === 11 || lesson.videoId.includes('youtube'))
  const videoType = isYouTube ? 'youtube' : 'vimeo'
  const videoUrl = videoType === 'youtube' 
    ? `https://www.youtube.com/embed/${lesson.videoId}?rel=0&modestbranding=1&playsinline=1`
    : `https://player.vimeo.com/video/${lesson.videoId}?title=0&byline=0&portrait=0`

  const badgeMatch = lesson.title.match(/JOUR \d+/)
  const badge = badgeMatch ? badgeMatch[0] : `JOUR ${order}`
  const meta = lesson.title.split(' - ')[1] || 'Formation'

  return {
    id: order,
    _id: lesson._id,
    path: `/course/facebook-ads/lesson/${lesson._id}`,
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


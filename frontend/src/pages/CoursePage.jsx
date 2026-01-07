import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CONFIG } from '../config/config'
import axios from 'axios'
import ProtectedVideo from '../components/ProtectedVideo'

export default function CoursePage() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedLesson, setSelectedLesson] = useState(null)

  useEffect(() => {
    if (courseId) {
      fetchCourse()
    }
  }, [courseId])

  const fetchCourse = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${CONFIG.BACKEND_URL}/api/courses/${courseId}`)
      
      if (response.data.success) {
        setCourse(response.data.course)
        
        // Sélectionner automatiquement la première leçon
        if (response.data.course.modules && response.data.course.modules.length > 0) {
          const firstModule = response.data.course.modules[0]
          if (firstModule.lessons && firstModule.lessons.length > 0) {
            setSelectedLesson(firstModule.lessons[0])
          }
        }
      } else {
        setError('Cours non trouvé')
      }
    } catch (err) {
      console.error('Erreur chargement cours:', err)
      setError('Erreur lors du chargement du cours')
    } finally {
      setLoading(false)
    }
  }

  const handleLessonClick = (lesson) => {
    setSelectedLesson(lesson)
    navigate(`/course/${courseId}/lesson/${lesson._id}`, { replace: true })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-brand border-t-transparent mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-gray-400">Chargement du cours...</p>
        </div>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">❌</div>
          <p className="text-xl font-semibold text-red-600 dark:text-red-400 mb-6">{error || 'Cours non trouvé'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-brand text-white font-semibold rounded-xl hover:bg-brand-600 transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Sidebar avec modules et leçons */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{course.title}</h2>
              
              <div className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                {course.modules && course.modules.map((module) => (
                  <div key={module._id}>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3">
                      {module.title}
                    </h3>
                    <div className="space-y-2 pl-4">
                      {module.lessons && module.lessons.map((lesson, index) => (
                        <button
                          key={lesson._id}
                          onClick={() => handleLessonClick(lesson)}
                          className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                            selectedLesson?._id === lesson._id
                              ? 'bg-brand text-white shadow-md'
                              : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                          }`}
                        >
                          <span className="font-medium">{index + 1}. {lesson.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Contenu principal avec la vidéo */}
          <div className="flex-1 min-w-0">
            {selectedLesson ? (
              <ProtectedVideo
                video={{
                  type: 'vimeo',
                  url: `https://player.vimeo.com/video/${selectedLesson.videoId}?title=0&byline=0&portrait=0`
                }}
                title={selectedLesson.title}
              />
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 flex flex-col items-center justify-center min-h-[400px] text-center">
                <div className="text-6xl mb-4">📚</div>
                <p className="text-lg text-gray-600 dark:text-gray-400">Sélectionnez une leçon pour commencer</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


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

  if (error || !course) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '1rem'
      }}>
        <div style={{ fontSize: '3rem', color: '#dc3545' }}>❌</div>
        <p style={{ color: '#dc3545' }}>{error || 'Cours non trouvé'}</p>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'var(--primary-color)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Retour à l'accueil
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', gap: '2rem', padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Sidebar avec modules et leçons */}
      <div style={{
        width: '300px',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '12px',
        padding: '1.5rem',
        height: 'fit-content',
        position: 'sticky',
        top: '2rem'
      }}>
        <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>{course.title}</h2>
        
        {course.modules && course.modules.map((module) => (
          <div key={module._id} style={{ marginBottom: '2rem' }}>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: 'bold',
              marginBottom: '0.75rem',
              color: 'var(--text-primary)'
            }}>
              {module.title}
            </h3>
            <div style={{ paddingLeft: '1rem' }}>
              {module.lessons && module.lessons.map((lesson, index) => (
                <div
                  key={lesson._id}
                  onClick={() => handleLessonClick(lesson)}
                  style={{
                    padding: '0.75rem',
                    marginBottom: '0.5rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: selectedLesson?._id === lesson._id ? 'var(--primary-color)' : 'transparent',
                    color: selectedLesson?._id === lesson._id ? '#fff' : 'var(--text-primary)',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => {
                    if (selectedLesson?._id !== lesson._id) {
                      e.currentTarget.style.backgroundColor = 'var(--bg-primary)'
                    }
                  }}
                  onMouseOut={(e) => {
                    if (selectedLesson?._id !== lesson._id) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }
                  }}
                >
                  {index + 1}. {lesson.title}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Contenu principal avec la vidéo */}
      <div style={{ flex: 1 }}>
        {selectedLesson ? (
          <ProtectedVideo
            video={{
              type: 'vimeo',
              url: `https://player.vimeo.com/video/${selectedLesson.videoId}?title=0&byline=0&portrait=0`
            }}
            title={selectedLesson.title}
          />
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            gap: '1rem'
          }}>
            <div style={{ fontSize: '3rem' }}>📚</div>
            <p>Sélectionnez une leçon pour commencer</p>
          </div>
        )}
      </div>
    </div>
  )
}


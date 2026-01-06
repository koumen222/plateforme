import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CONFIG } from '../config/config'
import { getImageUrl } from '../utils/imageUtils'
import axios from 'axios'
import '../styles/home.css'

export default function HomePage() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${CONFIG.BACKEND_URL}/api/courses`)
      
      if (response.data.success) {
        setCourses(response.data.courses || [])
      } else {
        setError('Erreur lors du chargement des cours')
      }
    } catch (err) {
      console.error('Erreur chargement cours:', err)
      setError('Erreur lors du chargement des cours')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="home-loading">
        <div className="home-loading-card">
          <div className="home-spinner" aria-label="Chargement" />
          <div className="home-loading-title">Chargement des cours…</div>
          <div className="home-loading-subtitle">Veuillez patienter quelques secondes.</div>
        </div>

        <div className="courses-grid home-skeleton-grid" aria-hidden="true">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="course-card home-skeleton-card">
              <div className="course-card-image home-skeleton-block" />
              <div className="course-card-content">
                <div className="home-skeleton-line home-skeleton-line-lg" />
                <div className="home-skeleton-line" />
                <div className="home-skeleton-line home-skeleton-line-sm" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error && courses.length === 0) {
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
        <p style={{ color: '#dc3545' }}>{error}</p>
        <button
          onClick={fetchCourses}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'var(--primary-color)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Réessayer
        </button>
      </div>
    )
  }

  return (
    <div className="home-page">
      <div className="home-header">
        <h1>📚 Tous les cours</h1>
        <p>Choisissez un cours pour commencer votre formation</p>
      </div>

      <div className="courses-grid">
        {courses.map((course) => (
          <Link
            key={course._id}
            to={`/course/${course.slug}`}
            className="course-card"
            style={{
              textDecoration: 'none',
              color: 'inherit'
            }}
          >
            <div className="course-card-image">
              <img
                src={getImageUrl(course.coverImage)}
                alt={course.title}
                onError={(e) => {
                  // En cas d'erreur, essayer l'image par défaut
                  const defaultImg = '/img/fbads.svg'
                  if (e.target.src !== defaultImg && !e.target.src.includes(defaultImg)) {
                    e.target.src = defaultImg
                  }
                }}
              />
              {course.isDefault && (
                <div className="course-badge">
                  Par défaut
                </div>
              )}
            </div>
            <div className="course-card-content">
              <h3>{course.title}</h3>
              <p>{course.description || 'Aucune description'}</p>
            </div>
          </Link>
        ))}
      </div>

      {courses.length === 0 && !loading && (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: 'var(--text-secondary)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
          <p>Aucun cours disponible pour le moment</p>
        </div>
      )}
    </div>
  )
}

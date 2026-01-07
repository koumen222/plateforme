import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CONFIG } from '../config/config'
import { getImageUrl } from '../utils/imageUtils'
import axios from 'axios'
import '../styles/home.css'

export default function CoursesPage() {
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
      <div className="home-error">
        <div className="home-error-icon">❌</div>
        <p className="home-error-message">{error}</p>
        <button onClick={fetchCourses} className="home-error-btn">
          Réessayer
        </button>
      </div>
    )
  }

  return (
    <div className="home-page">
      <div className="home-section-header">
        <h1 className="home-section-title">🏠 Accueil</h1>
        <p className="home-section-subtitle">
          Choisissez une formation pour lancer votre business e-commerce en Afrique
        </p>
      </div>

      {courses.length > 0 ? (
        <div className="courses-grid">
          {courses.map((course) => (
            <Link
              key={course._id}
              to={`/course/${course.slug}`}
              className="course-card"
            >
              <div className="course-card-image">
                <img
                  src={getImageUrl(course.coverImage)}
                  alt={course.title}
                  onError={(e) => {
                    const defaultImg = '/img/fbads.svg'
                    if (e.target.src !== defaultImg && !e.target.src.includes(defaultImg)) {
                      e.target.src = defaultImg
                    }
                  }}
                />
                {course.isDefault && (
                  <div className="course-badge">⭐ Populaire</div>
                )}
                <div className="course-card-overlay">
                  <span className="course-card-action">Voir la formation →</span>
                </div>
              </div>
              <div className="course-card-content">
                <h3>{course.title}</h3>
                <p>{course.description || 'Formation complète et pratique pour maîtriser les concepts essentiels.'}</p>
                <div className="course-card-footer">
                  <span className="course-card-meta">📹 Vidéos HD</span>
                  <span className="course-card-meta">📚 Ressources</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="home-empty-state">
          <div className="home-empty-icon">📚</div>
          <p className="home-empty-text">Aucun cours disponible pour le moment</p>
        </div>
      )}
    </div>
  )
}


import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { CONFIG } from '../config/config'
import { getImageUrl } from '../utils/imageUtils'
import axios from 'axios'
import '../styles/home.css'

export default function HomePage() {
  const { isAuthenticated } = useAuth()
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
      {/* Hero Section */}
      <section className="home-hero">
        <div className="home-hero-content">
          <div className="home-hero-badge">🚀 Plateforme de Formation Premium</div>
          <h1 className="home-hero-title">
            Transformez votre <span className="home-hero-highlight">Expertise Digitale</span>
          </h1>
          <p className="home-hero-subtitle">
            Accédez à des formations complètes et pratiques pour maîtriser Facebook Ads, 
            TikTok Ads et le e-commerce. Apprenez à votre rythme avec un accès illimité.
          </p>
          <div className="home-hero-cta">
            {!isAuthenticated ? (
              <Link to="/login" className="home-btn home-btn-primary">
                Commencer maintenant
              </Link>
            ) : (
              <Link to="/profil" className="home-btn home-btn-primary">
                Accéder à mes cours
              </Link>
            )}
            <Link to="/produits-gagnants" className="home-btn home-btn-secondary">
              Voir les produits gagnants
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="home-stats">
        <div className="home-stat-card">
          <div className="home-stat-icon">📚</div>
          <div className="home-stat-number">{courses.length}+</div>
          <div className="home-stat-label">Formations disponibles</div>
        </div>
        <div className="home-stat-card">
          <div className="home-stat-icon">🎯</div>
          <div className="home-stat-number">100%</div>
          <div className="home-stat-label">Pratique & Actionnable</div>
        </div>
        <div className="home-stat-card">
          <div className="home-stat-icon">⏰</div>
          <div className="home-stat-number">24/7</div>
          <div className="home-stat-label">Accès illimité</div>
        </div>
        <div className="home-stat-card">
          <div className="home-stat-icon">👥</div>
          <div className="home-stat-number">1000+</div>
          <div className="home-stat-label">Étudiants actifs</div>
        </div>
      </section>

      {/* Features Section */}
      <section className="home-features">
        <div className="home-section-header">
          <h2 className="home-section-title">Pourquoi choisir notre plateforme ?</h2>
          <p className="home-section-subtitle">
            Une expérience d'apprentissage complète et adaptée à vos besoins
          </p>
        </div>
        <div className="home-features-grid">
          <div className="home-feature-card">
            <div className="home-feature-icon">🎓</div>
            <h3 className="home-feature-title">Formations complètes</h3>
            <p className="home-feature-text">
              Des cours structurés avec vidéos, ressources téléchargeables et exercices pratiques 
              pour une maîtrise complète des sujets.
            </p>
          </div>
          <div className="home-feature-card">
            <div className="home-feature-icon">💡</div>
            <h3 className="home-feature-title">Méthodes éprouvées</h3>
            <p className="home-feature-text">
              Apprenez des stratégies testées et validées sur le marché africain, 
              avec des résultats concrets et mesurables.
            </p>
          </div>
          <div className="home-feature-card">
            <div className="home-feature-icon">🔄</div>
            <h3 className="home-feature-title">Mises à jour régulières</h3>
            <p className="home-feature-text">
              Accédez aux dernières tendances et mises à jour des plateformes publicitaires 
              pour rester à jour avec les meilleures pratiques.
            </p>
          </div>
          <div className="home-feature-card">
            <div className="home-feature-icon">🤝</div>
            <h3 className="home-feature-title">Support communautaire</h3>
            <p className="home-feature-text">
              Rejoignez une communauté active d'apprenants et bénéficiez d'un support 
              pour progresser ensemble.
            </p>
          </div>
          <div className="home-feature-card">
            <div className="home-feature-icon">📱</div>
            <h3 className="home-feature-title">Accessible partout</h3>
            <p className="home-feature-text">
              Apprenez depuis votre ordinateur, tablette ou smartphone, 
              où que vous soyez et quand vous le souhaitez.
            </p>
          </div>
          <div className="home-feature-card">
            <div className="home-feature-icon">🏆</div>
            <h3 className="home-feature-title">Certification</h3>
            <p className="home-feature-text">
              Obtenez une certification à la fin de chaque formation pour valoriser 
              vos compétences sur le marché.
            </p>
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section className="home-courses">
        <div className="home-section-header">
          <h2 className="home-section-title">Nos formations</h2>
          <p className="home-section-subtitle">
            Choisissez la formation qui correspond à vos objectifs
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
      </section>

      {/* CTA Section */}
      <section className="home-cta">
        <div className="home-cta-content">
          <h2 className="home-cta-title">Prêt à transformer vos compétences ?</h2>
          <p className="home-cta-text">
            Rejoignez des centaines d'étudiants qui ont déjà transformé leur expertise digitale 
            avec nos formations.
          </p>
          <div className="home-cta-buttons">
            {!isAuthenticated ? (
              <Link to="/login" className="home-btn home-btn-primary home-btn-large">
                Commencer maintenant
              </Link>
            ) : (
              <Link to="/profil" className="home-btn home-btn-primary home-btn-large">
                Accéder à mes cours
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

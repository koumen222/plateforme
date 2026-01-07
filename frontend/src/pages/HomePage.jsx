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
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Charger seulement les 3 premiers cours pour la page d'accueil
    fetchFeaturedCourses()
  }, [])

  const fetchFeaturedCourses = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${CONFIG.BACKEND_URL}/api/courses`)
      
      if (response.data.success) {
        // Prendre seulement les 3 premiers cours pour l'affichage
        setCourses((response.data.courses || []).slice(0, 3))
      }
    } catch (err) {
      console.error('Erreur chargement cours:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="home-hero">
        <div className="home-hero-content">
          <div className="home-hero-badge">🚀 Ecom Starter - Votre Partenaire E-commerce en Afrique</div>
          <h1 className="home-hero-title">
            Lancez votre <span className="home-hero-highlight">Business E-commerce</span> en Afrique
          </h1>
          <p className="home-hero-subtitle">
            Tout ce qu'il faut pour se lancer en e-commerce en Afrique sur cette plateforme. 
            Formations complètes : Facebook Ads, TikTok Ads, Shopify, Créatives avec Sora 2, 
            Achat sur Alibaba, Recherche produit, et tous les outils essentiels pour créer un business rentable.
          </p>
          <div className="home-hero-cta">
            <Link to="/cours" className="home-btn home-btn-primary">
              Commencer maintenant
            </Link>
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
          <div className="home-stat-number">3+</div>
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
          <h2 className="home-section-title">Tout ce qu'il faut pour réussir en e-commerce en Afrique</h2>
          <p className="home-section-subtitle">
            Des formations adaptées au marché africain avec des stratégies qui fonctionnent réellement
          </p>
        </div>
        <div className="home-features-grid">
          <div className="home-feature-card">
            <div className="home-feature-icon">🎯</div>
            <h3 className="home-feature-title">Publicité Facebook & TikTok</h3>
            <p className="home-feature-text">
              Maîtrisez les campagnes publicitaires sur Facebook et TikTok adaptées au marché africain. 
              Apprenez à créer des annonces qui convertissent et génèrent des ventes.
            </p>
          </div>
          <div className="home-feature-card">
            <div className="home-feature-icon">🛍️</div>
            <h3 className="home-feature-title">Formation Shopify</h3>
            <p className="home-feature-text">
              Apprenez à créer et gérer votre boutique Shopify de A à Z. Configuration, 
              produits, paiements, livraison et optimisation pour le marché africain.
            </p>
          </div>
          <div className="home-feature-card">
            <div className="home-feature-icon">🎬</div>
            <h3 className="home-feature-title">Créatives avec Sora 2</h3>
            <p className="home-feature-text">
              Maîtrisez la création de vidéos publicitaires avec Sora 2. Apprenez à créer 
              des créatives percutantes qui génèrent des conversions et des ventes.
            </p>
          </div>
          <div className="home-feature-card">
            <div className="home-feature-icon">📦</div>
            <h3 className="home-feature-title">Achat sur Alibaba</h3>
            <p className="home-feature-text">
              Découvrez comment acheter en gros sur Alibaba pour votre business e-commerce. 
              Négociation, qualité, shipping et gestion des commandes depuis la Chine.
            </p>
          </div>
          <div className="home-feature-card">
            <div className="home-feature-icon">🔍</div>
            <h3 className="home-feature-title">Recherche de produits</h3>
            <p className="home-feature-text">
              Outils et méthodes pour trouver les produits gagnants. Analyse de marché, 
              tendances, validation de produits et identification des opportunités.
            </p>
          </div>
          <div className="home-feature-card">
            <div className="home-feature-icon">🤝</div>
            <h3 className="home-feature-title">Contact fournisseurs</h3>
            <p className="home-feature-text">
              Apprenez à contacter et négocier avec les fournisseurs. Communication efficace, 
              négociation des prix, gestion des relations et sourcing de qualité.
            </p>
          </div>
          <div className="home-feature-card">
            <div className="home-feature-icon">📦</div>
            <h3 className="home-feature-title">Produits gagnants testés</h3>
            <p className="home-feature-text">
              Accédez à notre liste exclusive de 50 produits gagnants testés et validés 
              sur le marché africain. Des produits qui génèrent réellement des ventes.
            </p>
          </div>
          <div className="home-feature-card">
            <div className="home-feature-icon">💰</div>
            <h3 className="home-feature-title">Monétisation & Scaling</h3>
            <p className="home-feature-text">
              Apprenez à optimiser vos marges, scaler vos campagnes et maximiser vos profits. 
              Des méthodes concrètes pour faire croître votre business.
            </p>
          </div>
          <div className="home-feature-card">
            <div className="home-feature-icon">🌍</div>
            <h3 className="home-feature-title">Spécifique marché africain</h3>
            <p className="home-feature-text">
              Toutes nos formations sont adaptées aux réalités du marché africain : 
              moyens de paiement locaux, logistique, réglementations et habitudes d'achat.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Courses Section */}
      <section className="home-courses">
        <div className="home-section-header">
          <h2 className="home-section-title">Nos formations</h2>
          <p className="home-section-subtitle">
            Découvrez nos formations complètes et pratiques
          </p>
        </div>
        {courses.length > 0 ? (
          <>
            <div className="courses-grid">
              {courses.slice(0, 3).map((course) => (
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
            {courses.length > 3 && (
              <div className="home-courses-cta">
                <Link to="/cours" className="home-btn home-btn-secondary">
                  Voir tous les cours ({courses.length})
                </Link>
              </div>
            )}
          </>
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
          <h2 className="home-cta-title">Prêt à lancer votre business e-commerce en Afrique ?</h2>
          <p className="home-cta-text">
            Rejoignez des centaines d'entrepreneurs qui ont déjà créé des business rentables 
            en e-commerce grâce à nos formations adaptées au marché africain.
          </p>
          <div className="home-cta-buttons">
            <Link to="/cours" className="home-btn home-btn-primary home-btn-large">
              Commencer maintenant
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import '../styles/landing.css'

export default function LandingPage() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-hero-content">
          <div className="landing-badge">🚀 Formation Premium</div>
          <h1 className="landing-title">
            Maîtrisez Facebook Ads avec la <span className="landing-highlight">Méthode Andromeda</span>
          </h1>
          <p className="landing-subtitle">
            Créez des campagnes qui génèrent des ventes de manière prévisible et scalable. 
            Une méthode révolutionnaire adaptée au marché africain.
          </p>
          <div className="landing-cta-group">
            {isAuthenticated ? (
              <Link to="/" className="landing-btn landing-btn-primary">
                Accéder à la formation
              </Link>
            ) : (
              <>
                <Link to="/login" className="landing-btn landing-btn-primary">
                  Commencer maintenant
                </Link>
                <Link to="/login" className="landing-btn landing-btn-secondary">
                  Voir la première leçon
                </Link>
              </>
            )}
          </div>
          <div className="landing-stats">
            <div className="landing-stat">
              <div className="landing-stat-number">8</div>
              <div className="landing-stat-label">Jours de formation</div>
            </div>
            <div className="landing-stat">
              <div className="landing-stat-number">100%</div>
              <div className="landing-stat-label">Pratique</div>
            </div>
            <div className="landing-stat">
              <div className="landing-stat-number">24/7</div>
              <div className="landing-stat-label">Accès illimité</div>
            </div>
          </div>
        </div>
        <div className="landing-hero-visual">
          <div className="landing-visual-card">
            <div className="landing-visual-icon">📊</div>
            <div className="landing-visual-text">Campagnes performantes</div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="landing-products-section">
        <div className="landing-container">
          <div className="landing-products-card">
            <h2 className="landing-products-title">🏆 50 Produits Gagnants</h2>
            <p className="landing-products-text">
              Accédez à notre liste exclusive de 50 produits testés et performants sur Facebook Ads. 
              Ces produits ont généré des résultats exceptionnels avec la méthode Andromeda.
            </p>
            <Link to="/produits-gagnants" className="landing-btn landing-btn-secondary">
              Voir les 50 produits gagnants
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="landing-features">
        <div className="landing-container">
          <h2 className="landing-section-title">Ce que vous allez apprendre</h2>
          <div className="landing-features-grid">
            <div className="landing-feature-card">
              <div className="landing-feature-icon">🎯</div>
              <h3 className="landing-feature-title">Structure de campagne</h3>
              <p className="landing-feature-text">
                Découvrez la structure complète d'une campagne Andromeda qui convertit et génère des ventes.
              </p>
            </div>
            <div className="landing-feature-card">
              <div className="landing-feature-icon">🎬</div>
              <h3 className="landing-feature-title">Création de vidéos</h3>
              <p className="landing-feature-text">
                Apprenez à créer des créatives verticales captivantes qui maximisent l'engagement et les conversions.
              </p>
            </div>
            <div className="landing-feature-card">
              <div className="landing-feature-icon">⚙️</div>
              <h3 className="landing-feature-title">Configuration optimale</h3>
              <p className="landing-feature-text">
                Paramétrez correctement votre compte publicitaire pour un tracking précis et des résultats mesurables.
              </p>
            </div>
            <div className="landing-feature-card">
              <div className="landing-feature-icon">🚀</div>
              <h3 className="landing-feature-title">Lancement & Scaling</h3>
              <p className="landing-feature-text">
                Lancez vos campagnes efficacement et apprenez à les optimiser progressivement pour maximiser vos résultats.
              </p>
            </div>
            <div className="landing-feature-card">
              <div className="landing-feature-icon">📈</div>
              <h3 className="landing-feature-title">Analyse & Optimisation</h3>
              <p className="landing-feature-text">
                Maîtrisez l'analyse des métriques et les techniques d'optimisation pour améliorer continuellement vos performances.
              </p>
            </div>
            <div className="landing-feature-card">
              <div className="landing-feature-icon">💬</div>
              <h3 className="landing-feature-title">Support personnalisé</h3>
              <p className="landing-feature-text">
                Bénéficiez d'un accompagnement personnalisé avec des sessions de coaching pour affiner votre stratégie.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Program Section */}
      <section className="landing-program">
        <div className="landing-container">
          <h2 className="landing-section-title">Programme de formation</h2>
          <div className="landing-program-list">
            <div className="landing-program-item">
              <div className="landing-program-day">JOUR 1</div>
              <div className="landing-program-content">
                <h3>Introduction</h3>
                <p>Découvrez les fondamentaux de la méthode Andromeda</p>
              </div>
            </div>
            <div className="landing-program-item">
              <div className="landing-program-day">JOUR 2</div>
              <div className="landing-program-content">
                <h3>Structure de campagne</h3>
                <p>La structure complète d'une campagne qui nourrit Andromeda</p>
              </div>
            </div>
            <div className="landing-program-item">
              <div className="landing-program-day">JOUR 3</div>
              <div className="landing-program-content">
                <h3>Création de la créative</h3>
                <p>Créez la créative Andromeda qui convertit</p>
              </div>
            </div>
            <div className="landing-program-item">
              <div className="landing-program-day">JOUR 4</div>
              <div className="landing-program-content">
                <h3>Paramétrage du compte</h3>
                <p>Configurez correctement votre compte publicitaire</p>
              </div>
            </div>
            <div className="landing-program-item">
              <div className="landing-program-day">JOUR 5</div>
              <div className="landing-program-content">
                <h3>Lancement</h3>
                <p>Activez votre première campagne Andromeda</p>
              </div>
            </div>
            <div className="landing-program-item">
              <div className="landing-program-day">JOUR 6</div>
              <div className="landing-program-content">
                <h3>Analyse</h3>
                <p>Analysez les premiers résultats sans intervenir</p>
              </div>
            </div>
            <div className="landing-program-item">
              <div className="landing-program-day">JOUR 7</div>
              <div className="landing-program-content">
                <h3>Mini Scaling</h3>
                <p>Première optimisation et augmentation progressive du budget</p>
              </div>
            </div>
            <div className="landing-program-item">
              <div className="landing-program-day">JOUR 8</div>
              <div className="landing-program-content">
                <h3>Coaching</h3>
                <p>Réservation de sessions de coaching personnalisées</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="landing-cta-section">
        <div className="landing-container">
          <div className="landing-cta-card">
            <h2 className="landing-cta-title">Prêt à transformer votre business ?</h2>
            <p className="landing-cta-text">
              Rejoignez des centaines d'entrepreneurs qui utilisent déjà la méthode Andromeda 
              pour générer des ventes avec Facebook Ads.
            </p>
            {isAuthenticated ? (
              <Link to="/" className="landing-btn landing-btn-primary landing-btn-large">
                Accéder à ma formation
              </Link>
            ) : (
              <Link to="/login" className="landing-btn landing-btn-primary landing-btn-large">
                Commencer ma formation maintenant
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}


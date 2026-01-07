import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function LandingPage() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <section className="relative bg-brand text-white py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="container-startup relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold mb-6">
                🚀 Formation Premium
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Maîtrisez Facebook Ads avec la{' '}
                <span className="text-yellow-300">Méthode Andromeda</span>
          </h1>
              <p className="text-xl text-white/90 mb-8 leading-relaxed">
            Créez des campagnes qui génèrent des ventes de manière prévisible et scalable. 
            Une méthode révolutionnaire adaptée au marché africain.
          </p>
              <div className="flex flex-wrap gap-4 mb-12">
            {isAuthenticated ? (
                  <Link to="/" className="btn-primary bg-white text-brand hover:bg-gray-50">
                Accéder à la formation
              </Link>
            ) : (
              <>
                    <Link to="/login" className="btn-primary bg-white text-brand hover:bg-gray-50">
                  Commencer maintenant
                </Link>
                    <Link to="/login" className="btn-secondary bg-white/10 text-white border-white/30 hover:bg-white/20">
                  Voir la première leçon
                </Link>
              </>
            )}
          </div>
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">8</div>
                  <div className="text-sm text-white/80">Jours de formation</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">100%</div>
                  <div className="text-sm text-white/80">Pratique</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">24/7</div>
                  <div className="text-sm text-white/80">Accès illimité</div>
                </div>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl">
                <div className="text-6xl mb-4 text-center">📊</div>
                <div className="text-center text-xl font-semibold">Campagnes performantes</div>
            </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="container-startup">
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-2xl p-8 md:p-12 text-center shadow-xl">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              🏆 50 Produits Gagnants
            </h2>
            <p className="text-lg text-gray-800 mb-6 max-w-2xl mx-auto">
              Accédez à notre liste exclusive de 50 produits testés et performants sur Facebook Ads. 
              Ces produits ont généré des résultats exceptionnels avec la méthode Andromeda.
            </p>
            <Link to="/produits-gagnants" className="btn-primary">
              Voir les 50 produits gagnants
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="container-startup">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Ce que vous allez apprendre
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '🎯', title: 'Structure de campagne', text: 'Découvrez la structure complète d\'une campagne Andromeda qui convertit et génère des ventes.' },
              { icon: '🎬', title: 'Création de vidéos', text: 'Apprenez à créer des créatives verticales captivantes qui maximisent l\'engagement et les conversions.' },
              { icon: '⚙️', title: 'Configuration optimale', text: 'Paramétrez correctement votre compte publicitaire pour un tracking précis et des résultats mesurables.' },
              { icon: '🚀', title: 'Lancement & Scaling', text: 'Lancez vos campagnes efficacement et apprenez à les optimiser progressivement pour maximiser vos résultats.' },
              { icon: '📈', title: 'Analyse & Optimisation', text: 'Maîtrisez l\'analyse des métriques et les techniques d\'optimisation pour améliorer continuellement vos performances.' },
              { icon: '💬', title: 'Support personnalisé', text: 'Bénéficiez d\'un accompagnement personnalisé avec des sessions de coaching pour affiner votre stratégie.' }
            ].map((feature, index) => (
              <div key={index} className="card-startup">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {feature.text}
              </p>
            </div>
            ))}
          </div>
        </div>
      </section>

      {/* Program Section */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="container-startup">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Programme de formation
          </h2>
          <div className="space-y-4 max-w-3xl mx-auto">
            {[
              { day: 'JOUR 1', title: 'Introduction', text: 'Découvrez les fondamentaux de la méthode Andromeda' },
              { day: 'JOUR 2', title: 'Structure de campagne', text: 'La structure complète d\'une campagne qui nourrit Andromeda' },
              { day: 'JOUR 3', title: 'Créez la créative', text: 'Créez la créative Andromeda qui convertit' },
              { day: 'JOUR 4', title: 'Paramétrage du compte', text: 'Configurez correctement votre compte publicitaire' },
              { day: 'JOUR 5', title: 'Lancement', text: 'Activez votre première campagne Andromeda' },
              { day: 'JOUR 6', title: 'Analyse', text: 'Analysez les premiers résultats sans intervenir' },
              { day: 'JOUR 7', title: 'Mini Scaling', text: 'Première optimisation et augmentation progressive du budget' },
              { day: 'JOUR 8', title: 'Coaching', text: 'Réservation de sessions de coaching personnalisées' }
            ].map((item, index) => (
              <div key={index} className="flex gap-6 items-start bg-gray-50 dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-all">
                <div className="flex-shrink-0 w-24 text-center">
                  <div className="bg-brand text-white rounded-xl px-4 py-2 font-bold text-sm">
                    {item.day}
              </div>
            </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {item.text}
                  </p>
            </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-brand text-white">
        <div className="container-startup">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Prêt à transformer votre business ?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Rejoignez des centaines d'entrepreneurs qui utilisent déjà la méthode Andromeda 
              pour générer des ventes avec Facebook Ads.
            </p>
            {isAuthenticated ? (
              <Link to="/" className="btn-primary bg-white text-brand hover:bg-gray-50 text-lg px-8 py-4">
                Accéder à ma formation
              </Link>
            ) : (
              <Link to="/login" className="btn-primary bg-white text-brand hover:bg-gray-50 text-lg px-8 py-4">
                Commencer ma formation maintenant
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

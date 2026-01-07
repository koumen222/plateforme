import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { CONFIG } from '../config/config'
import { getImageUrl } from '../utils/imageUtils'
import axios from 'axios'

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
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-brand-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container-startup py-16 sm:py-20 lg:py-28">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-sm font-medium mb-6">
              Ecom Starter - Votre Partenaire E-commerce en Afrique
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Lancez votre <span className="text-brand dark:text-brand-400">Business E-commerce</span> en Afrique
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Tout ce qu'il faut pour se lancer en e-commerce en Afrique sur cette plateforme. 
              Formations complètes : Facebook Ads, TikTok Ads, Shopify, Créatives avec Sora 2, 
              Achat sur Alibaba, Recherche produit, et tous les outils essentiels pour créer un business rentable.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                to="/cours" 
                className="btn-primary w-full sm:w-auto px-8 py-4 text-base"
              >
                Commencer maintenant
              </Link>
              <a 
                href="#temoignages" 
                className="btn-secondary w-full sm:w-auto px-8 py-4 text-base"
                onClick={(e) => {
                  e.preventDefault()
                  const element = document.getElementById('temoignages')
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }
                }}
              >
                Voir les témoignages
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 sm:py-16 bg-gradient-to-b from-white via-gray-50/50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="container-startup">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            <div className="card-startup text-center p-6">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-brand dark:text-brand-400 mb-2">3+</div>
              <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-medium">Formations disponibles</div>
            </div>
            <div className="card-startup text-center p-6">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-brand dark:text-brand-400 mb-2">100%</div>
              <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-medium">Pratique & Actionnable</div>
            </div>
            <div className="card-startup text-center p-6">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-brand dark:text-brand-400 mb-2">24/7</div>
              <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-medium">Accès illimité</div>
            </div>
            <div className="card-startup text-center p-6">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-brand dark:text-brand-400 mb-2">1000+</div>
              <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-medium">Étudiants actifs</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
        <div className="container-startup">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Tout ce qu'il faut pour réussir en e-commerce en Afrique
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Des formations adaptées au marché africain avec des stratégies qui fonctionnent réellement
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="card-startup group">
              <div className="w-12 h-12 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-brand dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Publicité Facebook & TikTok</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Maîtrisez les campagnes publicitaires sur Facebook et TikTok adaptées au marché africain. 
                Apprenez à créer des annonces qui convertissent et génèrent des ventes.
              </p>
            </div>
            <div className="card-startup group">
              <div className="w-12 h-12 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-brand dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Formation Shopify</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Apprenez à créer et gérer votre boutique Shopify de A à Z. Configuration, 
                produits, paiements, livraison et optimisation pour le marché africain.
              </p>
            </div>
            <div className="card-startup group">
              <div className="w-12 h-12 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-brand dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Créatives avec Sora 2</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Maîtrisez la création de vidéos publicitaires avec Sora 2. Apprenez à créer 
                des créatives percutantes qui génèrent des conversions et des ventes.
              </p>
            </div>
            <div className="card-startup group">
              <div className="w-12 h-12 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-brand dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Achat sur Alibaba</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Découvrez comment acheter en gros sur Alibaba pour votre business e-commerce. 
                Négociation, qualité, shipping et gestion des commandes depuis la Chine.
              </p>
            </div>
            <div className="card-startup group">
              <div className="w-12 h-12 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-brand dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Recherche de produits</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Outils et méthodes pour trouver les produits gagnants. Analyse de marché, 
                tendances, validation de produits et identification des opportunités.
              </p>
            </div>
            <div className="card-startup group">
              <div className="w-12 h-12 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-brand dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Contact fournisseurs</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Apprenez à contacter et négocier avec les fournisseurs. Communication efficace, 
                négociation des prix, gestion des relations et sourcing de qualité.
              </p>
            </div>
            <div className="card-startup group">
              <div className="w-12 h-12 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-brand dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Produits gagnants testés</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Accédez à notre liste exclusive de 50 produits gagnants testés et validés 
                sur le marché africain. Des produits qui génèrent réellement des ventes.
              </p>
            </div>
            <div className="card-startup group">
              <div className="w-12 h-12 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-brand dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Monétisation & Scaling</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Apprenez à optimiser vos marges, scaler vos campagnes et maximiser vos profits. 
                Des méthodes concrètes pour faire croître votre business.
              </p>
            </div>
            <div className="card-startup group">
              <div className="w-12 h-12 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-brand dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Spécifique marché africain</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Toutes nos formations sont adaptées aux réalités du marché africain : 
                moyens de paiement locaux, logistique, réglementations et habitudes d'achat.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="temoignages" className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-white via-brand-50/20 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container-startup">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Témoignages vidéo
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Découvrez les succès de nos étudiants qui ont lancé leur business e-commerce en Afrique
            </p>
          </div>
          <div className="flex flex-col md:grid md:grid-cols-2 gap-6 lg:gap-8">
            <div className="card-startup overflow-hidden p-0 w-full">
              <div className="relative pb-[177.78%] md:pb-[56.25%] h-0 overflow-hidden rounded-t-xl">
                <iframe
                  src="https://www.youtube.com/embed/YLfDVtHyXU8"
                  title="Témoignage étudiant 1"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="absolute top-0 left-0 w-full h-full"
                ></iframe>
              </div>
            </div>
            <div className="card-startup overflow-hidden p-0 w-full">
              <div className="relative pb-[177.78%] md:pb-[56.25%] h-0 overflow-hidden rounded-t-xl">
                <iframe
                  src="https://www.youtube.com/embed/ziJ-Ap95rh8"
                  title="Témoignage étudiant 2"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="absolute top-0 left-0 w-full h-full"
                ></iframe>
              </div>
            </div>
            <div className="card-startup overflow-hidden p-0 w-full">
              <div className="relative pb-[177.78%] md:pb-[56.25%] h-0 overflow-hidden rounded-t-xl">
                <iframe
                  src="https://www.youtube.com/embed/8hozirNxVKk"
                  title="Témoignage étudiant 3"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="absolute top-0 left-0 w-full h-full"
                ></iframe>
              </div>
            </div>
            <div className="card-startup overflow-hidden p-0 w-full">
              <div className="relative pb-[177.78%] md:pb-[56.25%] h-0 overflow-hidden rounded-t-xl">
                <iframe
                  src="https://www.youtube.com/embed/DoraVMrGvUw"
                  title="Témoignage étudiant 4"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="absolute top-0 left-0 w-full h-full"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Courses Section */}
      <section className="py-16 bg-gradient-to-br from-brand-50/40 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container-startup">
          <div className="text-center mb-12">
            <div className="inline-block w-32 h-1 bg-gradient-to-r from-brand via-brand-600 to-brand rounded-full mb-4"></div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
              Nos Formations
            </h2>
            <p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
              Découvrez nos formations complètes et pratiques pour réussir en e-commerce en Afrique
          </p>
      </div>
        {courses.length > 0 ? (
          <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {courses.slice(0, 3).map((course) => (
          <Link
            key={course._id}
            to={`/course/${course.slug}`}
                    className="course-card-african group"
          >
                    <div className="relative overflow-hidden h-56">
              <img
                      src={getImageUrl(course.coverImage)}
                alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                onError={(e) => {
                        const defaultImg = '/img/fbads.svg'
                        if (e.target.src !== defaultImg && !e.target.src.includes(defaultImg)) {
                          e.target.src = defaultImg
                        }
                }}
              />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <span className="text-white font-bold text-lg px-6 py-3 bg-brand rounded-full shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                          Découvrir →
                        </span>
                      </div>
              {course.isDefault && (
                        <div className="absolute top-4 right-4 bg-brand text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg">
                          ⭐ Populaire
                        </div>
                    )}
                      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/60 to-transparent"></div>
                </div>
                    <div className="p-6 relative">
                      <div className="absolute -top-4 left-6 w-12 h-1 bg-gradient-to-r from-brand via-brand-600 to-brand rounded-full"></div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-brand dark:group-hover:text-brand-400 transition-colors">
                        {course.title}
                      </h3>
                      <p className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-3 leading-relaxed">
                        {course.description || 'Formation complète et pratique pour maîtriser les concepts essentiels.'}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-2 px-3 py-1 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 rounded-full font-semibold">
                          📹 Vidéos HD
                        </span>
                        <span className="flex items-center gap-2 px-3 py-1 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 rounded-full font-semibold">
                          📚 Ressources
                        </span>
                    </div>
            </div>
          </Link>
        ))}
      </div>
            {courses.length > 3 && (
                <div className="text-center mt-8">
                  <Link to="/cours" className="btn-primary inline-block">
                  Voir tous les cours ({courses.length})
                </Link>
              </div>
            )}
          </>
        ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📚</div>
              <p className="text-xl text-gray-600 dark:text-gray-400">Aucun cours disponible pour le moment</p>
          </div>
        )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-brand via-brand-600 to-brand-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        <div className="container-startup relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              Prêt à lancer votre business e-commerce en Afrique ?
            </h2>
            <p className="text-lg sm:text-xl text-white/90 mb-8 leading-relaxed">
              Rejoignez des centaines d'entrepreneurs qui ont déjà créé des business rentables 
              en e-commerce grâce à nos formations adaptées au marché africain.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/cours" className="btn-primary bg-white text-brand hover:bg-gray-50 text-lg px-8 py-4 inline-block">
                Commencer maintenant
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

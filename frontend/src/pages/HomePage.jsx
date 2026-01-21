import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { CONFIG } from '../config/config'
import { getImageUrl } from '../utils/imageUtils'
import axios from 'axios'
import { FiBook, FiDownload } from 'react-icons/fi'

export default function HomePage() {
  const { isAuthenticated } = useAuth()
  const [courses, setCourses] = useState([])
  const [ressourcesPdf, setRessourcesPdf] = useState([])
  const [loading, setLoading] = useState(false)
  const [ressourcesPdfLoading, setRessourcesPdfLoading] = useState(false)

  useEffect(() => {
    // Charger toutes les formations pour la page d'accueil
    fetchFeaturedCourses()
    fetchFeaturedRessourcesPdf()
  }, [])

  const fetchFeaturedCourses = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${CONFIG.BACKEND_URL}/api/courses`)
      
      if (response.data.success) {
        const coursesData = response.data.courses || []
        console.log('📚 Cours reçus:', coursesData.length)
        console.log('📚 Ordre des cours avant tri:', coursesData.map(c => ({ title: c.title, slug: c.slug })))
        
        // Tri de sécurité côté frontend pour garantir l'ordre
        const getCoursePriority = (course) => {
          const slug = (course.slug || '').toLowerCase().trim();
          const title = (course.title || '').toLowerCase().trim();
          if (slug === 'facebook-ads' || slug.includes('facebook') || title.includes('facebook')) return 1;
          if (slug === 'tiktok-ads' || slug.includes('tiktok') || title.includes('tiktok')) return 2;
          return 3;
        };
        
        const sortedCourses = [...coursesData].sort((a, b) => {
          const priorityA = getCoursePriority(a);
          const priorityB = getCoursePriority(b);
          return priorityA - priorityB;
        });
        
        console.log('📚 Ordre des cours après tri:', sortedCourses.map(c => ({ title: c.title, slug: c.slug, priority: getCoursePriority(c) })))
        // Afficher toutes les formations
        setCourses(sortedCourses)
      } else {
        console.error('❌ Réponse API invalide:', response.data)
      }
    } catch (err) {
      console.error('❌ Erreur chargement cours:', err)
      if (import.meta.env.DEV) {
        console.error('Détails erreur:', err.response?.data || err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchFeaturedRessourcesPdf = async () => {
    try {
      setRessourcesPdfLoading(true)
      const response = await axios.get(`${CONFIG.BACKEND_URL}/api/ressources-pdf`)
      
      console.log('📚 Réponse API ressources PDF (HomePage):', response.data)
      
      if (response.data && response.data.success) {
        // Limiter à 3 ressources PDF pour la page d'accueil
        const ressourcesPdfData = (response.data.ressourcesPdf || []).slice(0, 3)
        setRessourcesPdf(ressourcesPdfData)
      } else if (response.data && Array.isArray(response.data)) {
        // Fallback si la réponse est directement un tableau
        const ressourcesPdfData = (response.data || []).slice(0, 3)
        setRessourcesPdf(ressourcesPdfData)
      } else {
        console.warn('⚠️ Format de réponse inattendu pour ressources PDF:', response.data)
      }
    } catch (err) {
      console.error('❌ Erreur chargement ressources PDF:', err)
      console.error('❌ Détails:', err.response?.data || err.message)
      // Ne pas bloquer l'affichage de la page si les ressources PDF ne se chargent pas
      setRessourcesPdf([])
    } finally {
      setRessourcesPdfLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-primary overflow-x-hidden">
      {/* Hero Section */}
      <section className="py-12 sm:py-16 lg:py-20 relative overflow-hidden w-full bg-gradient-to-br from-purple-950 via-purple-900 to-purple-950">
        {/* Image de fond - visible avec style funnel pro */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
          style={{
            backgroundImage: 'url(/img/pexels-pixabay-356056.jpg)'
          }}
        ></div>
        {/* Dégradé violet foncé style funnel pro - couche principale */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950/85 via-purple-900/80 to-purple-950/85"></div>
        {/* Dégradé radial pour effet de profondeur au centre */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at center, rgba(88, 28, 135, 0.3) 0%, rgba(76, 29, 149, 0.5) 50%, rgba(59, 7, 100, 0.9) 100%)'
          }}
        ></div>
        {/* Overlay sombre supplémentaire pour masquer l'image */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
        {/* Effets de lumière subtils violet foncé */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-96 h-96 bg-purple-700/15 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-purple-800/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/8 rounded-full blur-3xl"></div>
        </div>
        <div className="container-startup relative z-10 w-full max-w-full">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-medium mb-6 animate-fade-in hover:scale-105 transition-transform duration-300 shadow-lg border border-white/30">
              Ecom Starter - Votre Partenaire E-commerce en Afrique
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight animate-slide-up drop-shadow-lg">
              Lancez votre <span className="text-white relative inline-block">
                <span className="relative z-10">Business E-commerce</span>
                <span className="absolute bottom-0 left-0 w-full h-3 bg-white/30 -z-0"></span>
              </span> en Afrique
            </h1>
            <p className="text-lg sm:text-xl text-white mb-8 max-w-3xl mx-auto leading-relaxed animate-fade-in drop-shadow-md">
              Tout ce qu'il faut pour se lancer en e-commerce en Afrique sur cette plateforme. 
              Formations complètes : Facebook Ads, TikTok Ads, Shopify, Créatives avec Sora 2, 
              Achat sur Alibaba, Recherche produit, et tous les outils essentiels pour créer un business rentable.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in">
              <Link 
                to="/cours" 
                className="btn-primary dark:bg-purple-600 dark:hover:bg-purple-700 dark:text-white w-full sm:w-auto px-8 py-4 text-base transform hover:scale-105 hover:shadow-xl transition-all duration-300"
                aria-label="Commencer les formations"
              >
                Commencer maintenant
              </Link>
              <button
                onClick={() => {
                  const element = document.getElementById('temoignages')
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }
                }}
                className="btn-primary dark:bg-purple-600 dark:hover:bg-purple-700 dark:text-white w-full sm:w-auto px-8 py-4 text-base transform hover:scale-105 hover:shadow-xl transition-all duration-300"
                aria-label="Aller à la section témoignages"
              >
                Voir les témoignages
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-secondary border-y border-theme w-full overflow-x-hidden">
        <div className="container-startup w-full max-w-full">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
            <div className="card-startup text-center p-6 transform hover:scale-105 hover:shadow-lg transition-all duration-300 group">
              <div className="text-3xl lg:text-4xl font-bold text-accent mb-2 group-hover:scale-110 transition-transform duration-300">3+</div>
              <div className="text-sm text-secondary font-medium">Formations disponibles</div>
            </div>
            <div className="card-startup text-center p-6 transform hover:scale-105 hover:shadow-lg transition-all duration-300 group">
              <div className="text-3xl lg:text-4xl font-bold text-accent mb-2 group-hover:scale-110 transition-transform duration-300">100%</div>
              <div className="text-sm text-secondary font-medium">Pratique & Actionnable</div>
            </div>
            <div className="card-startup text-center p-6 transform hover:scale-105 hover:shadow-lg transition-all duration-300 group">
              <div className="text-3xl lg:text-4xl font-bold text-accent mb-2 group-hover:scale-110 transition-transform duration-300">24/7</div>
              <div className="text-sm text-secondary font-medium">Accès illimité</div>
            </div>
            <div className="card-startup text-center p-6 transform hover:scale-105 hover:shadow-lg transition-all duration-300 group">
              <div className="text-3xl lg:text-4xl font-bold text-accent mb-2 group-hover:scale-110 transition-transform duration-300">1000+</div>
              <div className="text-sm text-secondary font-medium">Étudiants actifs</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-primary w-full overflow-x-hidden">
        <div className="container-startup w-full max-w-full">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-primary mb-4">
              Tout ce qu'il faut pour réussir en e-commerce en Afrique
            </h2>
            <p className="text-lg text-secondary max-w-2xl mx-auto">
              Des formations adaptées au marché africain avec des stratégies qui fonctionnent réellement
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="card-startup group overflow-hidden transform hover:-translate-y-2 hover:shadow-xl transition-all duration-300">
              <div className="relative mb-4 rounded-lg overflow-hidden">
                <img 
                  src="/img/tiktok-ads-2026.png" 
                  alt="Lancer ses campagnes TikTok comme un pro en 2026"
                  className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <h3 className="text-xl font-bold text-primary mb-3 group-hover:text-accent transition-colors duration-300">Publicité Facebook & TikTok</h3>
              <p className="text-secondary leading-relaxed">
                Maîtrisez les campagnes publicitaires sur Facebook et TikTok adaptées au marché africain. 
                Apprenez à créer des annonces qui convertissent et génèrent des ventes.
              </p>
            </div>
            <div className="card-startup group transform hover:-translate-y-2 hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent group-hover:scale-110 transition-all duration-300">
                <svg className="w-6 h-6 text-accent group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-primary mb-3 group-hover:text-accent transition-colors duration-300">Formation Shopify</h3>
              <p className="text-secondary leading-relaxed">
                Apprenez à créer et gérer votre boutique Shopify de A à Z. Configuration, 
                produits, paiements, livraison et optimisation pour le marché africain.
              </p>
            </div>
            <div className="card-startup group transform hover:-translate-y-2 hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent group-hover:scale-110 transition-all duration-300">
                <svg className="w-6 h-6 text-accent group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-primary mb-3 group-hover:text-accent transition-colors duration-300">Créatives avec Sora 2</h3>
              <p className="text-secondary leading-relaxed">
                Maîtrisez la création de vidéos publicitaires avec Sora 2. Apprenez à créer 
                des créatives percutantes qui génèrent des conversions et des ventes.
              </p>
            </div>
            <div className="card-startup group transform hover:-translate-y-2 hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent group-hover:scale-110 transition-all duration-300">
                <svg className="w-6 h-6 text-accent group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-primary mb-3 group-hover:text-accent transition-colors duration-300">Achat sur Alibaba</h3>
              <p className="text-secondary leading-relaxed">
                Découvrez comment acheter en gros sur Alibaba pour votre business e-commerce. 
                Négociation, qualité, shipping et gestion des commandes depuis la Chine.
              </p>
            </div>
            <div className="card-startup group transform hover:-translate-y-2 hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent group-hover:scale-110 transition-all duration-300">
                <svg className="w-6 h-6 text-accent group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-primary mb-3 group-hover:text-accent transition-colors duration-300">Recherche de produits</h3>
              <p className="text-secondary leading-relaxed">
                Outils et méthodes pour trouver les produits gagnants. Analyse de marché, 
                tendances, validation de produits et identification des opportunités.
              </p>
            </div>
            <div className="card-startup group transform hover:-translate-y-2 hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent group-hover:scale-110 transition-all duration-300">
                <svg className="w-6 h-6 text-accent group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-primary mb-3 group-hover:text-accent transition-colors duration-300">Contact fournisseurs</h3>
              <p className="text-secondary leading-relaxed">
                Apprenez à contacter et négocier avec les fournisseurs. Communication efficace, 
                négociation des prix, gestion des relations et sourcing de qualité.
              </p>
            </div>
            <div className="card-startup group transform hover:-translate-y-2 hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent group-hover:scale-110 transition-all duration-300">
                <svg className="w-6 h-6 text-accent group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-primary mb-3 group-hover:text-accent transition-colors duration-300">Produits gagnants testés</h3>
              <p className="text-secondary leading-relaxed">
                Accédez à notre liste exclusive de 50 produits gagnants testés et validés 
                sur le marché africain. Des produits qui génèrent réellement des ventes.
              </p>
            </div>
            <div className="card-startup group transform hover:-translate-y-2 hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent group-hover:scale-110 transition-all duration-300">
                <svg className="w-6 h-6 text-accent group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-primary mb-3 group-hover:text-accent transition-colors duration-300">Monétisation & Scaling</h3>
              <p className="text-secondary leading-relaxed">
                Apprenez à optimiser vos marges, scaler vos campagnes et maximiser vos profits. 
                Des méthodes concrètes pour faire croître votre business.
              </p>
            </div>
            <div className="card-startup group transform hover:-translate-y-2 hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent group-hover:scale-110 transition-all duration-300">
                <svg className="w-6 h-6 text-accent group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-primary mb-3 group-hover:text-accent transition-colors duration-300">Spécifique marché africain</h3>
              <p className="text-secondary leading-relaxed">
                Toutes nos formations sont adaptées aux réalités du marché africain : 
                moyens de paiement locaux, logistique, réglementations et habitudes d'achat.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="temoignages" className="py-16 bg-secondary w-full overflow-x-hidden">
        <div className="container-startup w-full max-w-full">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-primary mb-4">
              Témoignages vidéo
            </h2>
            <p className="text-lg text-secondary max-w-2xl mx-auto">
              Découvrez les succès de nos étudiants qui ont lancé leur business e-commerce en Afrique
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            <div className="card-startup overflow-hidden p-0 transform hover:scale-[1.02] hover:shadow-xl transition-all duration-300 group">
              <div className="relative pb-[56.25%] overflow-hidden">
                <iframe
                  src="https://www.youtube.com/embed/YLfDVtHyXU8"
                  title="Témoignage étudiant 1"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="absolute top-0 left-0 w-full h-full group-hover:scale-105 transition-transform duration-300"
                ></iframe>
              </div>
            </div>
            <div className="card-startup overflow-hidden p-0 transform hover:scale-[1.02] hover:shadow-xl transition-all duration-300 group">
              <div className="relative pb-[56.25%] overflow-hidden">
                <iframe
                  src="https://www.youtube.com/embed/ziJ-Ap95rh8"
                  title="Témoignage étudiant 2"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="absolute top-0 left-0 w-full h-full group-hover:scale-105 transition-transform duration-300"
                ></iframe>
              </div>
            </div>
            <div className="card-startup overflow-hidden p-0 transform hover:scale-[1.02] hover:shadow-xl transition-all duration-300 group">
              <div className="relative pb-[56.25%] overflow-hidden">
                <iframe
                  src="https://www.youtube.com/embed/8hozirNxVKk"
                  title="Témoignage étudiant 3"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="absolute top-0 left-0 w-full h-full group-hover:scale-105 transition-transform duration-300"
                ></iframe>
              </div>
            </div>
            <div className="card-startup overflow-hidden p-0 transform hover:scale-[1.02] hover:shadow-xl transition-all duration-300 group">
              <div className="relative pb-[56.25%] overflow-hidden">
                <iframe
                  src="https://www.youtube.com/embed/DoraVMrGvUw"
                  title="Témoignage étudiant 4"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="absolute top-0 left-0 w-full h-full group-hover:scale-105 transition-transform duration-300"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Courses Section */}
      <section className="py-8 sm:py-12 md:py-16 bg-primary w-full overflow-x-hidden">
        <div className="container-startup w-full max-w-full">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-primary mb-4">
              Nos Formations
            </h2>
            <p className="text-lg text-secondary max-w-2xl mx-auto">
              Découvrez nos formations complètes et pratiques pour réussir en e-commerce en Afrique
            </p>
          </div>
          {courses.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 lg:gap-8 px-2 sm:px-0">
                {courses.map((course) => (
                  <Link
                    key={course._id}
                    to={`/course/${course.slug}`}
                    className="course-card-african group hover:shadow-xl transform hover:-translate-y-1 md:hover:-translate-y-2 transition-all duration-300 w-full max-w-full overflow-hidden"
                  >
                    <div className="relative overflow-hidden h-48 sm:h-52 md:h-56 w-full">
                      <img
                        src={
                          course.slug?.toLowerCase().includes('tiktok') || 
                          course.title?.toLowerCase().includes('tiktok')
                            ? '/img/tiktok-ads-2026.png'
                            : (course.slug?.toLowerCase().includes('facebook') || 
                               course.title?.toLowerCase().includes('facebook'))
                              ? '/img/facebook-ads-2026.png'
                              : (course.slug?.toLowerCase().includes('shopify') || 
                                 course.title?.toLowerCase().includes('shopify'))
                                ? '/img/shopify-2026.png'
                                : (course.slug?.toLowerCase().includes('creatives') || 
                                   course.slug?.toLowerCase().includes('sora') ||
                                   course.title?.toLowerCase().includes('creatives') ||
                                   course.title?.toLowerCase().includes('sora') ||
                                   course.title?.toLowerCase().includes('vidéo publicitaire'))
                                  ? '/img/creatives-2026.png'
                                  : (course.slug?.toLowerCase().includes('alibaba') || 
                                     course.title?.toLowerCase().includes('alibaba'))
                                    ? '/img/alibaba-2026.png'
                                    : (course.slug?.toLowerCase().includes('produit') || 
                                       course.slug?.toLowerCase().includes('recherche') ||
                                       course.title?.toLowerCase().includes('produit') ||
                                       course.title?.toLowerCase().includes('recherche'))
                                      ? '/img/cours-2026.png'
                                      : course.coverImage 
                                        ? getImageUrl(course.coverImage)
                                        : '/img/cours-2026.png'
                        }
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          const defaultImg = '/img/fbads.svg'
                          if (e.target.src !== defaultImg && !e.target.src.includes(defaultImg)) {
                            e.target.src = defaultImg
                          }
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      {course.isDefault && (
                        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4 bg-accent text-white px-2 py-0.5 sm:px-3 sm:py-1 rounded-lg text-xs font-bold shadow-lg">
                          Populaire
                        </div>
                      )}
                    </div>
                    <div className="p-4 sm:p-5 md:p-6 overflow-hidden">
                      <h3 className="text-base sm:text-lg md:text-xl font-bold text-primary mb-2 sm:mb-3 group-hover:text-accent transition-colors duration-300 line-clamp-2">
                        {course.title}
                      </h3>
                      <p className="text-sm sm:text-base text-secondary mb-3 sm:mb-4 line-clamp-2 sm:line-clamp-3 leading-relaxed">
                        {course.description || 'Formation complète et pratique pour maîtriser les concepts essentiels.'}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-1 sm:px-3 sm:py-1 bg-accent/10 text-accent rounded-lg font-medium text-xs sm:text-sm whitespace-nowrap">
                          {course.lessonsCount || 0} leçons
                        </span>
                        <span className="px-2 py-1 sm:px-3 sm:py-1 bg-accent/10 text-accent rounded-lg font-medium text-xs sm:text-sm whitespace-nowrap">
                          Vidéos HD
                        </span>
                        <span className="px-2 py-1 sm:px-3 sm:py-1 bg-accent/10 text-accent rounded-lg font-medium text-xs sm:text-sm whitespace-nowrap">
                          Ressources
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <div className="text-5xl mb-4 text-secondary">📚</div>
              <p className="text-xl text-secondary">Aucun cours disponible pour le moment</p>
            </div>
          )}
        </div>
      </section>

      {/* Featured Ressources PDF Section */}
      {ressourcesPdf.length > 0 && (
        <section className="py-8 sm:py-12 md:py-16 bg-secondary w-full overflow-x-hidden">
          <div className="container-startup w-full max-w-full">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-accent/20 to-accent/10 mb-4">
                <FiBook className="w-8 h-8 text-accent" />
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-primary mb-4">
                Ressources PDF
              </h2>
              <p className="text-lg text-secondary max-w-2xl mx-auto">
                Téléchargez nos guides pratiques et ressources pour approfondir vos connaissances
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 lg:gap-8 px-2 sm:px-0">
              {ressourcesPdf.map((ressourcePdf) => (
                <div
                  key={ressourcePdf._id}
                  className="bg-card border border-theme rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group"
                >
                  {/* Image de couverture */}
                  <div className="relative h-48 sm:h-52 md:h-56 overflow-hidden bg-gradient-to-br from-accent/10 to-accent/5">
                    {ressourcePdf.coverImage ? (
                      <img
                        src={ressourcePdf.coverImage}
                        alt={ressourcePdf.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.src = '/img/ressource-pdf-default.png'
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FiBook className="w-16 h-16 text-accent/30" />
                      </div>
                    )}
                    {ressourcePdf.isFree && (
                      <div className="absolute top-3 right-3 bg-accent text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                        Gratuit
                      </div>
                    )}
                  </div>

                  {/* Contenu */}
                  <div className="p-4 sm:p-5 md:p-6">
                    {ressourcePdf.category && (
                      <div className="mb-2">
                        <span className="text-xs font-medium text-accent uppercase tracking-wider">
                          {ressourcePdf.category}
                        </span>
                      </div>
                    )}
                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-primary mb-2 sm:mb-3 group-hover:text-accent transition-colors duration-300 line-clamp-2">
                      {ressourcePdf.title}
                    </h3>
                    {ressourcePdf.description && (
                      <p className="text-sm sm:text-base text-secondary mb-3 sm:mb-4 line-clamp-2 sm:line-clamp-3 leading-relaxed">
                        {ressourcePdf.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      {!ressourcePdf.isFree && ressourcePdf.price > 0 ? (
                        <span className="text-lg font-bold text-accent">
                          {ressourcePdf.price.toLocaleString('fr-FR')} FCFA
                        </span>
                      ) : (
                        <span className="text-sm text-secondary">
                          {ressourcePdf.pages > 0 && `${ressourcePdf.pages} pages`}
                        </span>
                      )}
                      <Link
                        to="/ressources-pdf"
                        className="btn-primary inline-flex items-center gap-2 text-sm px-4 py-2"
                      >
                        <FiDownload className="w-4 h-4" />
                        Voir
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link
                to="/ressources-pdf"
                className="btn-secondary inline-flex items-center gap-2"
              >
                <FiBook className="w-5 h-5" />
                Voir toutes les ressources PDF
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 bg-accent text-white relative overflow-hidden w-full">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/20 to-transparent"></div>
        </div>
        <div className="container-startup relative z-10 w-full max-w-full">
          <div className="max-w-3xl mx-auto text-center w-full">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6 transform hover:scale-105 transition-transform duration-300">
              Prêt à lancer votre business e-commerce en Afrique ?
            </h2>
            <p className="text-lg text-white/90 mb-8 leading-relaxed">
              Rejoignez des centaines d'entrepreneurs qui ont déjà créé des business rentables 
              en e-commerce grâce à nos formations adaptées au marché africain.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/cours" className="btn-primary bg-white text-accent hover:bg-white/90 text-lg px-8 py-4 transform hover:scale-105 hover:shadow-2xl transition-all duration-300" aria-label="Commencer les formations">
                Commencer maintenant
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
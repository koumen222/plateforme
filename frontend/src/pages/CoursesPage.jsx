import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CONFIG } from '../config/config'
import axios from 'axios'

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
        const coursesData = response.data.courses || []
        console.log('📚 Cours reçus:', coursesData.length)
        console.log('📚 Ordre des cours:', coursesData.map(c => ({ title: c.title, slug: c.slug })))
        setCourses(coursesData)
      } else {
        console.error('❌ Réponse API invalide:', response.data)
        setError('Erreur lors du chargement des cours')
      }
    } catch (err) {
      console.error('❌ Erreur chargement cours:', err)
      if (import.meta.env.DEV) {
        console.error('Détails erreur:', err.response?.data || err.message)
      }
      setError('Erreur lors du chargement des cours')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-primary py-6 md:py-8 lg:py-12 px-4 md:px-0">
        <div className="container-startup">
          <div className="text-center mb-8 md:mb-12">
            <div className="inline-block animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-4 border-accent border-t-transparent mb-3 md:mb-4"></div>
            <h2 className="text-xl md:text-2xl font-bold text-primary mb-2">Chargement des cours…</h2>
            <p className="text-sm md:text-base text-secondary">Veuillez patienter quelques secondes.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="bg-card rounded-2xl overflow-hidden shadow-sm animate-pulse border border-theme">
                <div className="h-48 sm:h-52 md:h-56 bg-secondary" />
                <div className="p-4 sm:p-5 md:p-6 space-y-3 md:space-y-4">
                  <div className="h-4 bg-secondary rounded w-3/4" />
                  <div className="h-3 bg-secondary rounded" />
                  <div className="h-3 bg-secondary rounded w-5/6" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error && courses.length === 0) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-4xl md:text-6xl mb-3 md:mb-4">⚠️</div>
          <p className="text-lg md:text-xl font-semibold text-primary mb-4 px-2">{error}</p>
          <button 
            onClick={fetchCourses} 
            className="btn-primary px-5 md:px-6 py-2.5 md:py-3 text-sm md:text-base"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-primary py-6 md:py-8 lg:py-12 px-4 md:px-0">
      <div className="container-startup">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12 lg:mb-16">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-primary mb-3 md:mb-4 px-2">
            Nos Formations
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-secondary max-w-2xl mx-auto px-2">
            Découvrez nos formations complètes pour maîtriser le e-commerce et développer votre business
          </p>
        </div>

        {/* Courses Grid */}
        {courses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
            {courses.map((course) => (
              <Link
                key={course._id}
                to={`/course/${course.slug}`}
                className="course-card-african group hover:shadow-lg transition-all duration-300"
              >
                <div className="relative overflow-hidden h-48 sm:h-52 md:h-56 rounded-t-2xl">
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
                                : '/img/cours-2026.png'
                    }
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      const defaultImg = '/img/fbads.svg'
                      if (e.target.src !== defaultImg && !e.target.src.includes(defaultImg)) {
                        e.target.src = defaultImg
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4 md:pb-6">
                    <span className="text-white font-bold text-sm md:text-base px-3 md:px-4 py-1.5 md:py-2 bg-accent rounded-xl">
                      Voir la formation
                    </span>
                  </div>
                  {course.isDefault && (
                    <div className="absolute top-2 right-2 md:top-4 md:right-4 bg-accent text-white px-2 md:px-3 py-0.5 md:py-1 rounded-lg text-xs font-bold">
                      Populaire
                    </div>
                  )}
                </div>
                <div className="p-4 sm:p-5 md:p-6">
                  <h3 className="text-lg sm:text-xl font-bold text-primary mb-2 md:mb-3 group-hover:text-accent transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-sm sm:text-base text-secondary mb-3 md:mb-4 line-clamp-3 leading-relaxed">
                    {course.description || 'Formation complète et pratique pour maîtriser les concepts essentiels.'}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="px-2 md:px-3 py-1 bg-accent/10 text-accent rounded-lg font-medium text-xs md:text-sm">
                      {course.lessonsCount || 0} leçons
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 md:py-16">
            <div className="text-4xl md:text-5xl mb-3 md:mb-4 text-secondary">📚</div>
            <p className="text-lg md:text-xl text-secondary px-4">Aucun cours disponible pour le moment</p>
          </div>
        )}
      </div>
    </div>
  )
}
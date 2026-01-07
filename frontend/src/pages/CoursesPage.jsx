import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CONFIG } from '../config/config'
import { getImageUrl } from '../utils/imageUtils'
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
      <div className="min-h-screen bg-primary py-12">
        <div className="container-startup">
          <div className="text-center mb-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent mb-4"></div>
            <h2 className="text-2xl font-bold text-primary mb-2">Chargement des cours…</h2>
            <p className="text-secondary">Veuillez patienter quelques secondes.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="bg-card rounded-2xl overflow-hidden shadow-sm animate-pulse border border-theme">
                <div className="h-48 bg-secondary" />
                <div className="p-6 space-y-4">
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
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-xl font-semibold text-primary mb-4">{error}</p>
          <button 
            onClick={fetchCourses} 
            className="btn-primary px-6 py-3"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-primary py-12">
      <div className="container-startup">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-16">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary mb-4">
            Nos Formations
          </h1>
          <p className="text-lg text-secondary max-w-2xl mx-auto">
            Découvrez nos formations complètes pour maîtriser le e-commerce et développer votre business
          </p>
        </div>

        {/* Courses Grid */}
        {courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {courses.map((course) => (
              <Link
                key={course._id}
                to={`/course/${course.slug}`}
                className="course-card-african group hover:shadow-lg transition-all duration-300"
              >
                <div className="relative overflow-hidden h-56 rounded-t-2xl">
                  <img
                    src={
                      course.slug?.toLowerCase().includes('tiktok') || 
                      course.title?.toLowerCase().includes('tiktok')
                        ? '/img/tiktok-ads-2026.png'
                        : (course.slug?.toLowerCase().includes('facebook') || 
                           course.title?.toLowerCase().includes('facebook'))
                          ? '/img/facebook-ads-2026.png'
                          : getImageUrl(course.coverImage)
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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
                    <span className="text-white font-bold text-base px-4 py-2 bg-accent rounded-xl">
                      Voir la formation
                    </span>
                  </div>
                  {course.isDefault && (
                    <div className="absolute top-4 right-4 bg-accent text-white px-3 py-1 rounded-lg text-xs font-bold">
                      Populaire
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-primary mb-3 group-hover:text-accent transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-secondary mb-4 line-clamp-3 leading-relaxed">
                    {course.description || 'Formation complète et pratique pour maîtriser les concepts essentiels.'}
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="px-3 py-1 bg-accent/10 text-accent rounded-lg font-medium">
                      {course.lessonsCount || 0} leçons
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-5xl mb-4 text-secondary">📚</div>
            <p className="text-xl text-secondary">Aucun cours disponible pour le moment</p>
          </div>
        )}
      </div>
    </div>
  )
}
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-brand border-t-transparent mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Chargement des cours…</h2>
            <p className="text-gray-600 dark:text-gray-400">Veuillez patienter quelques secondes.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm animate-pulse">
                <div className="h-48 bg-gray-200 dark:bg-gray-700" />
                <div className="p-6 space-y-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{error}</p>
          <button 
            onClick={fetchCourses} 
            className="px-6 py-3 bg-brand text-white font-semibold rounded-xl hover:bg-brand-600 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50 dark:from-gray-900 dark:via-orange-950 dark:to-red-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-7xl">
        {/* Header - Design Africain Premium */}
        <div className="text-center mb-12 lg:mb-16 relative">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-0.5 bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500 rounded-full"></div>
          <h1 className="text-display-xsm-bold sm:text-display-sm-bold lg:text-display-md mb-4 mt-8 bg-gradient-to-r from-orange-600 via-red-600 to-yellow-600 bg-clip-text text-transparent">
            🌍 Nos Formations Africaines
          </h1>
          <p className="text-lg-medium sm:text-xl text-neutral-700 dark:text-neutral-300 max-w-3xl mx-auto">
            Choisissez une formation pour lancer votre business e-commerce en Afrique avec succès
          </p>
          <div className="flex justify-center gap-2 mt-6">
            <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }}></div>
          </div>
        </div>

        {/* Courses Grid - Design Africain */}
        {courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {courses.map((course) => (
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
                    <span className="text-white font-bold text-lg px-6 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-2xl shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                      Découvrir la formation →
                    </span>
                  </div>
                  {course.isDefault && (
                    <div className="absolute top-4 right-4 bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500 text-white px-4 py-2 rounded-md text-xs font-bold shadow-md animate-pulse">
                      ⭐ Populaire
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/60 to-transparent"></div>
                </div>
                <div className="p-6 relative">
                  <div className="absolute -top-1 left-6 w-12 h-0.5 bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500 rounded-full"></div>
                  <h3 className="text-display-xxs-bold text-neutral-900 dark:text-white mb-3 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-md text-neutral-600 dark:text-neutral-300 mb-4 line-clamp-3 leading-relaxed">
                    {course.description || 'Formation complète et pratique pour maîtriser les concepts essentiels.'}
                  </p>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-md font-semibold">
                      📹 Vidéos HD
                    </span>
                    <span className="flex items-center gap-2 px-3 py-1.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-md font-semibold">
                      📚 Ressources
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📚</div>
            <p className="text-xl text-gray-600 dark:text-gray-400">Aucun cours disponible pour le moment</p>
          </div>
        )}
      </div>
    </div>
  )
}


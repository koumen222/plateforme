import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { CONFIG } from '../config/config'
import { getCourseCoverImage, getImageUrl } from '../utils/imageUtils'
import { useAuth } from '../contexts/AuthContext'
import { FiBook, FiTrendingUp, FiUsers } from 'react-icons/fi'

const domaineLabel = (value) => {
  const labels = {
    livreur: 'Livreur',
    livreur_personnel: 'Livreur personnel',
    agence_livraison: 'Agence de livraison',
    transitaire: 'Transitaire',
    closeur: 'Closeur',
    fournisseur: 'Fournisseur',
    autre: 'Autre'
  }
  return labels[value] || value || '—'
}

const getCourseDate = (course) => {
  const dateValue = course?.createdAt || course?.created_at
  const parsed = dateValue ? new Date(dateValue) : null
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed.getTime() : 0
}

export default function MobileHomePage() {
  const { token } = useAuth()
  const [courses, setCourses] = useState([])
  const [partenaires, setPartenaires] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [partnersLoading, setPartnersLoading] = useState(false)
  const [productsLoading, setProductsLoading] = useState(false)

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true)
      try {
        const response = await axios.get(`${CONFIG.BACKEND_URL}/api/courses`)
        if (response.data?.success) {
          setCourses(response.data.courses || [])
        } else if (Array.isArray(response.data)) {
          setCourses(response.data)
        } else {
          setCourses([])
        }
      } catch (error) {
        setCourses([])
      } finally {
        setLoading(false)
      }
    }

    fetchCourses()
  }, [])

  useEffect(() => {
    const fetchPartenaires = async () => {
      setPartnersLoading(true)
      try {
        const response = await axios.get(`${CONFIG.BACKEND_URL}/api/partenaires`)
        const data = response.data?.partenaires || []
        setPartenaires(Array.isArray(data) ? data : [])
      } catch (error) {
        setPartenaires([])
      } finally {
        setPartnersLoading(false)
      }
    }

    fetchPartenaires()
  }, [])

  useEffect(() => {
    const fetchProducts = async () => {
      if (!token) {
        setProducts([])
        return
      }
      setProductsLoading(true)
      try {
        const res = await fetch(`${CONFIG.BACKEND_URL}/api/success-radar?cache=false`, {
          headers: {
            Authorization: `Bearer ${token}`
          },
          credentials: 'include'
        })
        if (!res.ok) {
          setProducts([])
          return
        }
        const data = await res.json()
        setProducts(data.products || [])
      } catch (error) {
        setProducts([])
      } finally {
        setProductsLoading(false)
      }
    }

    fetchProducts()
  }, [token])

  const coursesWithNew = useMemo(() => {
    const now = Date.now()
    return (courses || []).map((course) => {
      const createdAt = getCourseDate(course)
      const isNew = createdAt && now - createdAt < 1000 * 60 * 60 * 24 * 30
      return { ...course, _isNew: isNew }
    })
  }, [courses])

  const visibleCourses = useMemo(() => {
    return [...coursesWithNew].sort((a, b) => getCourseDate(b) - getCourseDate(a)).slice(0, 3)
  }, [coursesWithNew])

  const visiblePartenaires = useMemo(() => {
    const sorted = [...(partenaires || [])].sort((a, b) => {
      const aDate = new Date(a.created_at || 0).getTime()
      const bDate = new Date(b.created_at || 0).getTime()
      return bDate - aDate
    })
    return sorted.slice(0, 3)
  }, [partenaires])

  const visibleProducts = useMemo(() => (products || []).slice(0, 3), [products])

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto w-full max-w-md space-y-6 px-4 py-4">
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Tableau de bord</p>
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Résumé</span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-2">
              <div className="text-lg font-semibold text-slate-900">{courses.length}</div>
              <div className="text-[10px] text-slate-500">Cours</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-2">
              <div className="text-lg font-semibold text-slate-900">{partenaires.length}</div>
              <div className="text-[10px] text-slate-500">Partenaires</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-2">
              <div className="text-lg font-semibold text-slate-900">{products.length}</div>
              <div className="text-[10px] text-slate-500">Produits</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Accès rapides</p>
            <span className="text-[11px] text-slate-400">Raccourcis</span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Link
              to="/cours"
              className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white px-2 py-3 text-xs font-semibold text-slate-700 shadow-sm"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <FiBook className="h-4 w-4" />
              </span>
              Cours
            </Link>
            <Link
              to="/partenaires"
              className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white px-2 py-3 text-xs font-semibold text-slate-700 shadow-sm"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                <FiUsers className="h-4 w-4" />
              </span>
              Partenaires
            </Link>
            <Link
              to="/produits-gagnants"
              className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white px-2 py-3 text-xs font-semibold text-slate-700 shadow-sm"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 text-purple-700">
                <FiTrendingUp className="h-4 w-4" />
              </span>
              Produits
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Cours récents</p>
              <p className="text-[11px] text-slate-500">Continue ta progression</p>
            </div>
            <Link to="/cours" className="text-xs font-semibold text-accent">
              Voir tout
            </Link>
          </div>
          <div className="mt-3 space-y-3">
            {loading ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                Chargement des cours...
              </div>
            ) : visibleCourses.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                Aucun cours disponible pour le moment.
              </div>
            ) : (
              visibleCourses.map((course) => (
                <Link
                  key={course._id || course.slug}
                  to={`/course/${course.slug}`}
                  className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-slate-300"
                >
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    <img
                      src={getCourseCoverImage(course)}
                      alt={course.title}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/img/cours-2026.png'
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-slate-900 line-clamp-2">{course.title}</h3>
                      {course._isNew && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                          Nouveau
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                      {course.description || 'Cours disponible sur la plateforme.'}
                    </p>
                    <div className="mt-2 text-[11px] text-slate-500">
                      {course.lessonsCount || 0} leçons
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Partenaires récents</p>
              <p className="text-[11px] text-slate-500">Des profils vérifiés</p>
            </div>
            <Link to="/partenaires" className="text-xs font-semibold text-accent">
              Voir tout
            </Link>
          </div>
          <div className="mt-3 space-y-3">
            {partnersLoading ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                Chargement des partenaires...
              </div>
            ) : visiblePartenaires.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                Aucun partenaire disponible pour le moment.
              </div>
            ) : (
              visiblePartenaires.map((partenaire) => {
                const domaines = (partenaire.domaines_activite || [partenaire.domaine]).filter(Boolean)
                const label = domaines.length ? domaines.map(domaineLabel).join(', ') : '—'
                return (
                  <Link
                    key={partenaire._id}
                    to={`/partenaires/${partenaire._id}`}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-slate-300"
                  >
                    <div className="relative h-12 w-12 flex-shrink-0 rounded-2xl bg-slate-100 text-sm font-semibold text-slate-600 flex items-center justify-center overflow-hidden">
                      {(partenaire.nom || '?').slice(0, 1).toUpperCase()}
                      {partenaire.logo_url && (
                        <img
                          src={getImageUrl(partenaire.logo_url)}
                          alt={`Logo ${partenaire.nom || 'Partenaire'}`}
                          className="absolute inset-0 h-full w-full object-cover"
                          onError={(event) => {
                            event.currentTarget.style.display = 'none'
                          }}
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">{partenaire.nom || 'Partenaire'}</p>
                      <p className="text-xs text-slate-500">{label}</p>
                      <p className="text-[11px] text-slate-400">
                        {partenaire.ville || '—'} {partenaire.pays ? `• ${partenaire.pays}` : ''}
                      </p>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Produits gagnants</p>
              <p className="text-[11px] text-slate-500">Sélection du moment</p>
            </div>
            <Link to="/produits-gagnants" className="text-xs font-semibold text-accent">
              Voir tout
            </Link>
          </div>
          <div className="mt-3 space-y-3">
            {productsLoading ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                Chargement des produits...
              </div>
            ) : visibleProducts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                Aucun produit disponible pour le moment.
              </div>
            ) : (
              visibleProducts.map((product, index) => (
                <Link
                  key={`${product.name}-${index}`}
                  to="/produits-gagnants"
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-slate-300"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{product.name || 'Produit'}</p>
                    <p className="text-xs text-slate-500">{product.category || 'Autre'}</p>
                    {product.countries?.length ? (
                      <p className="text-[11px] text-slate-400">
                        {product.countries.slice(0, 2).join(', ')}
                        {product.countries.length > 2 ? ` +${product.countries.length - 2}` : ''}
                      </p>
                    ) : null}
                  </div>
                  {product.status && (
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase text-slate-600">
                      {product.status}
                    </span>
                  )}
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

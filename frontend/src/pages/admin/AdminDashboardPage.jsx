import { useState, useEffect } from 'react'
import { CONFIG } from '../../config/config'
import { useAuth } from '../../contexts/AuthContext'

export default function AdminDashboardPage() {
  const { token } = useAuth()
  const [stats, setStats] = useState({
    users: { total: 0, pending: 0, active: 0 },
    courses: 0,
    loading: true
  })

  useEffect(() => {
    if (token) {
      fetchStats()
    }
  }, [token])

  const fetchStats = async () => {
    try {
      const [usersRes, coursesRes] = await Promise.all([
        fetch(`${CONFIG.BACKEND_URL}/api/admin/users`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }),
        fetch(`${CONFIG.BACKEND_URL}/api/admin/courses`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      ])

      if (usersRes.ok && coursesRes.ok) {
        const usersData = await usersRes.json()
        const coursesData = await coursesRes.json()

        const totalUsers = usersData.users?.length || 0
        const pendingUsers = usersData.users?.filter(u => u.status === 'pending').length || 0
        const activeUsers = usersData.users?.filter(u => u.status === 'active').length || 0

        setStats({
          users: {
            total: totalUsers,
            pending: pendingUsers,
            active: activeUsers
          },
          courses: coursesData.courses?.length || 0,
          loading: false
        })
      } else {
        setStats(prev => ({ ...prev, loading: false }))
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error)
      setStats(prev => ({ ...prev, loading: false }))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header avec titre moderne */}
      <div className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold text-primary mb-2">
          Tableau de bord
        </h1>
        <p className="text-secondary text-lg">
          Vue d'ensemble de la plateforme et statistiques
        </p>
      </div>

      {/* Grille de statistiques moderne */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {/* Carte Total Utilisateurs */}
        <div className="card-startup hover:shadow-lg transition-all duration-300 group">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-secondary mb-1 font-medium">Total Utilisateurs</p>
              <p className="text-3xl font-bold text-primary mb-2">
                {stats.loading ? (
                  <span className="inline-block w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  stats.users.total.toLocaleString()
                )}
              </p>
              <div className="flex items-center gap-2 text-xs text-secondary">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Tous les comptes</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Carte En attente */}
        <div className="card-startup hover:shadow-lg transition-all duration-300 group">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-secondary mb-1 font-medium">En attente</p>
              <p className="text-3xl font-bold text-primary mb-2">
                {stats.loading ? (
                  <span className="inline-block w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  stats.users.pending.toLocaleString()
                )}
              </p>
              <div className="flex items-center gap-2 text-xs text-secondary">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <span>Validation requise</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Carte Utilisateurs actifs */}
        <div className="card-startup hover:shadow-lg transition-all duration-300 group">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-secondary mb-1 font-medium">Utilisateurs actifs</p>
              <p className="text-3xl font-bold text-primary mb-2">
                {stats.loading ? (
                  <span className="inline-block w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  stats.users.active.toLocaleString()
                )}
              </p>
              <div className="flex items-center gap-2 text-xs text-secondary">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Comptes validés</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Carte Cours */}
        <div className="card-startup hover:shadow-lg transition-all duration-300 group">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-secondary mb-1 font-medium">Cours</p>
              <p className="text-3xl font-bold text-primary mb-2">
                {stats.loading ? (
                  <span className="inline-block w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  stats.courses.toLocaleString()
                )}
              </p>
              <div className="flex items-center gap-2 text-xs text-secondary">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Formations disponibles</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Section actions rapides */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-startup">
          <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Actions rapides
          </h3>
          <div className="space-y-2">
            <a href="/admin/users" className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors group">
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-colors">
                <svg className="w-5 h-5 text-accent group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-primary">Gérer les utilisateurs</p>
                <p className="text-sm text-secondary">Valider et gérer les comptes</p>
              </div>
            </a>
            <a href="/admin/courses" className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors group">
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-colors">
                <svg className="w-5 h-5 text-accent group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-primary">Gérer les cours</p>
                <p className="text-sm text-secondary">Créer et modifier les formations</p>
              </div>
            </a>
          </div>
        </div>

        <div className="card-startup">
          <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Statistiques détaillées
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-secondary rounded-xl">
              <span className="text-sm text-secondary">Taux d'activation</span>
              <span className="font-bold text-primary">
                {stats.loading ? '...' : stats.users.total > 0 
                  ? Math.round((stats.users.active / stats.users.total) * 100) 
                  : 0}%
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-secondary rounded-xl">
              <span className="text-sm text-secondary">En attente de validation</span>
              <span className="font-bold text-primary">
                {stats.loading ? '...' : stats.users.pending}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


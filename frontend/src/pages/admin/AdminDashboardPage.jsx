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
    <div className="admin-dashboard">
      <div className="admin-page-header">
        <h1>Tableau de bord</h1>
        <p>Vue d'ensemble de la plateforme</p>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-icon">👥</div>
          <div className="admin-stat-content">
            <h3>Total Utilisateurs</h3>
            <p className="admin-stat-value">{stats.loading ? '...' : stats.users.total}</p>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">⏳</div>
          <div className="admin-stat-content">
            <h3>En attente</h3>
            <p className="admin-stat-value">{stats.loading ? '...' : stats.users.pending}</p>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">✅</div>
          <div className="admin-stat-content">
            <h3>Utilisateurs actifs</h3>
            <p className="admin-stat-value">{stats.loading ? '...' : stats.users.active}</p>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">📚</div>
          <div className="admin-stat-content">
            <h3>Cours</h3>
            <p className="admin-stat-value">{stats.loading ? '...' : stats.courses}</p>
          </div>
        </div>
      </div>
    </div>
  )
}


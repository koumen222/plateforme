import '../../styles/admin.css'

// Données statiques pour le dashboard
const stats = {
  users: {
    total: 5,
    pending: 2,
    active: 3
  },
  courses: 8
}

export default function AdminDashboard() {
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
            <p className="admin-stat-value">{stats.users.total}</p>
          </div>
          <div className="admin-stat-link">Statistiques</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">⏳</div>
          <div className="admin-stat-content">
            <h3>En attente</h3>
            <p className="admin-stat-value">{stats.users.pending}</p>
          </div>
          <div className="admin-stat-link">Statistiques</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">✅</div>
          <div className="admin-stat-content">
            <h3>Utilisateurs actifs</h3>
            <p className="admin-stat-value">{stats.users.active}</p>
          </div>
          <div className="admin-stat-link">Statistiques</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">📚</div>
          <div className="admin-stat-content">
            <h3>Cours</h3>
            <p className="admin-stat-value">{stats.courses}</p>
          </div>
          <div className="admin-stat-link">Statistiques</div>
        </div>
      </div>
    </div>
  )
}


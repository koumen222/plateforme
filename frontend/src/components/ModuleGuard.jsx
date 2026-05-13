import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { hasModuleAccess } from '../config/modules'

export default function ModuleGuard({ moduleKey, children }) {
  const { user, isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ fontSize: '2rem' }}>⏳</div>
        <p>Chargement...</p>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!hasModuleAccess(user, moduleKey)) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center p-6">
        <div className="bg-card rounded-2xl shadow-xl border border-theme max-w-md w-full p-8 text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-primary mb-2">Accès restreint</h2>
          <p className="text-secondary mb-6">
            Vous n'avez pas accès à ce module. Contactez l'administrateur pour en obtenir l'accès.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-xl font-semibold transition-all"
          >
            Retour
          </button>
        </div>
      </div>
    )
  }

  return children
}

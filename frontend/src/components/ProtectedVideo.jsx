import { useAuth } from '../contexts/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import VideoPlayer from './VideoPlayer'

export default function ProtectedVideo({ video, title, isFirstVideo = false }) {
  const { isAuthenticated, user, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] sm:min-h-[400px] gap-4 p-4 sm:p-8">
        <div className="w-8 h-8 sm:w-12 sm:h-12 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm sm:text-lg" style={{ color: 'var(--text-secondary)' }}>Chargement...</p>
      </div>
    )
  }

  if (!isFirstVideo && (!isAuthenticated || !user)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] sm:min-h-[400px] gap-4 sm:gap-6 p-4 sm:p-8 text-center rounded-2xl border shadow-sm my-6 sm:my-8" style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border)'
      }}>
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-neutral-700 rounded-full flex items-center justify-center mb-3 sm:mb-4">
          <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-base sm:text-display-xxs-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Accès réservé aux membres
        </h2>
        <p className="text-sm sm:text-lg max-w-md mb-4 sm:mb-6 px-4" style={{ color: 'var(--text-secondary)' }}>
          Pour accéder à cette vidéo, vous devez créer un compte ou vous connecter.
        </p>
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center w-full sm:w-auto px-4 sm:px-0">
          <button
            onClick={() => navigate('/login', { state: { register: true, from: location } })}
            className="btn-primary text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3 w-full sm:w-auto"
          >
            S'inscrire
          </button>
          <button
            onClick={() => navigate('/login', { state: { from: location } })}
            className="btn-secondary text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3 w-full sm:w-auto"
          >
            Se connecter
          </button>
        </div>
      </div>
    )
  }

  return <VideoPlayer video={video} title={title} isFirstVideo={isFirstVideo} />
}

import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import VideoPlayer from './VideoPlayer'
import SubscriptionButton from './SubscriptionButton'
import { CONFIG } from '../config/config'

export default function ProtectedVideo({ video, title, isFirstVideo = false }) {
  const { isAuthenticated, user, loading } = useAuth()
  const navigate = useNavigate()

  // Pendant le chargement, afficher un loader
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        gap: '1rem',
        padding: '2rem'
      }}>
        <p>Chargement...</p>
      </div>
    )
  }

  // Si pas authentifié et pas première vidéo, afficher un message avec bouton pour s'inscrire
  if (!isFirstVideo && (!isAuthenticated || !user)) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        gap: '1.5rem',
        padding: '3rem 2rem',
        textAlign: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: '12px',
        margin: '2rem 0'
      }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#333' }}>
          Accès réservé aux membres
        </h2>
        <p style={{ fontSize: '1.1rem', color: '#666', maxWidth: '500px', margin: 0 }}>
          Pour accéder à cette vidéo, vous devez créer un compte ou vous connecter.
        </p>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <button
            onClick={() => navigate('/login', { state: { register: true } })}
            style={{
              padding: '0.75rem 2rem',
              fontSize: '1rem',
              fontWeight: 'bold',
              backgroundColor: '#4285F4',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#357ae8'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#4285F4'}
          >
            S'inscrire
          </button>
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '0.75rem 2rem',
              fontSize: '1rem',
              backgroundColor: '#fff',
              color: '#4285F4',
              border: '2px solid #4285F4',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#f5f5f5'
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#fff'
            }}
          >
            Se connecter
          </button>
        </div>
      </div>
    )
  }

  // Toujours afficher la vidéo (VideoPlayer gère l'affichage flouté et les éléments d'abonnement)
  // La première vidéo est toujours accessible
  return <VideoPlayer video={video} title={title} isFirstVideo={isFirstVideo} />
}


import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { CONFIG } from '../config/config'

export default function VideoPlayer({ video, title }) {
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()

  if (!video) return null

  const { type, url } = video

  // Vérifier si l'utilisateur est connecté ET que son compte est actif
  const canWatchVideo = isAuthenticated && user && user.status === 'active'

  const handleUnlockClick = () => {
    if (!isAuthenticated) {
      // Pas connecté, rediriger vers la page de connexion
      navigate('/login', { state: { from: { pathname: window.location.pathname } } })
    } else if (user && user.status === 'pending') {
      // Connecté mais pas validé, rediriger vers le profil
      navigate('/profil')
    } else {
      // Autre cas, rediriger vers la connexion
      navigate('/login', { state: { from: { pathname: window.location.pathname } } })
    }
  }

  const getLockMessage = () => {
    if (!isAuthenticated) {
      return {
        title: 'Vidéo verrouillée',
        message: 'Connectez-vous pour accéder à cette vidéo de formation',
        button: 'Débloquer la vidéo'
      }
    } else if (user && user.status === 'pending') {
      return {
        title: 'Vidéo verrouillée',
        message: 'Votre compte est en attente d\'activation. Contactez Morgan via WhatsApp pour finaliser votre paiement et activer votre compte.',
        button: 'Voir mon profil',
        whatsappButton: true
      }
    } else {
      return {
        title: 'Vidéo verrouillée',
        message: 'Vous devez être connecté pour accéder à cette vidéo',
        button: 'Débloquer la vidéo'
      }
    }
  }

  const lockInfo = getLockMessage()

  return (
    <div className="video-container">
      {title && (
        <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', color: 'var(--text-primary)' }}>
          {title}
        </h3>
      )}
      <div className={`video-wrapper ${!canWatchVideo ? 'video-locked' : 'video-unlocked'}`}>
        {!canWatchVideo ? (
          <div className="video-lock-overlay">
            <div className="video-lock-content">
              <div className="video-lock-icon">🔒</div>
              <h3>{lockInfo.title}</h3>
              <p>{lockInfo.message}</p>
              <div className="video-lock-actions">
                {lockInfo.whatsappButton && (
                  <a 
                    href={`https://wa.me/${CONFIG.MORGAN_PHONE}?text=${encodeURIComponent(CONFIG.WHATSAPP_MESSAGE)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="whatsapp-btn video-whatsapp-btn"
                  >
                    💬 Contacter Morgan sur WhatsApp
                  </a>
                )}
                <button onClick={handleUnlockClick} className="video-unlock-btn">
                  {lockInfo.button}
                </button>
              </div>
            </div>
          </div>
        ) : (
        <iframe
          src={url}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          title={title || 'Video player'}
        ></iframe>
        )}
      </div>
    </div>
  )
}


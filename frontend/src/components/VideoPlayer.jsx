import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { CONFIG } from '../config/config'
import PayButton from './PayButton'

export default function VideoPlayer({ video, title }) {
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()

  if (!video) return null

  const { type, url } = video

  // Vérifier si l'utilisateur est connecté ET que son compte est actif
  const canWatchVideo = isAuthenticated && user && user.status === 'active'

  const handleUnlockClick = () => {
    if (!isAuthenticated) {
      // Pas connecté, rediriger vers la page d'inscription
      navigate('/login', { state: { from: { pathname: window.location.pathname }, register: true } })
    } else if (user && user.status === 'pending') {
      // Connecté mais pas validé, rediriger vers le profil
      navigate('/profil')
    } else {
      // Autre cas, rediriger vers l'inscription
      navigate('/login', { state: { from: { pathname: window.location.pathname }, register: true } })
    }
  }

  const getLockMessage = () => {
    if (!isAuthenticated) {
      return {
        title: 'Vidéo verrouillée',
        message: 'Créez un compte pour accéder à cette vidéo de formation',
        button: 'S\'inscrire maintenant'
      }
    } else if (user && user.status === 'pending') {
      return {
        title: 'Vidéo verrouillée',
        message: 'Votre compte est en attente d\'activation. Effectuez le paiement pour activer votre compte.',
        button: 'Voir mon profil',
        showPayment: true
      }
    } else {
      return {
        title: 'Vidéo verrouillée',
        message: 'Créez un compte pour accéder à cette vidéo',
        button: 'S\'inscrire maintenant'
      }
    }
  }

  const lockInfo = getLockMessage()

  return (
    <div className="video-container">
      {title && (
        <h3 style={{ 
          marginBottom: '1rem', 
          fontSize: 'clamp(1rem, 4vw, 1.25rem)', 
          color: 'var(--text-primary)',
          lineHeight: '1.4',
          wordBreak: 'break-word'
        }}>
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
              <div className="video-lock-actions" style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                alignItems: 'center',
                width: '100%',
                maxWidth: '400px'
              }}>
                {lockInfo.showPayment && user && (
                  <>
                    <PayButton
                      amount={CONFIG.FORMATION_AMOUNT}
                      orderId={`PAY-${user?._id || user?.id || 'USER'}-${Date.now()}`}
                      onSuccess={() => {
                        console.log('Paiement initié avec succès')
                      }}
                      onError={(error) => {
                        console.error('Erreur paiement:', error)
                      }}
                    />
                    <div style={{ 
                      fontSize: '0.9rem', 
                      color: 'var(--text-secondary)',
                      margin: '0.5rem 0'
                    }}>
                      ou
                    </div>
                    <a
                      href={`https://wa.me/${CONFIG.MORGAN_PHONE}?text=${encodeURIComponent(CONFIG.WHATSAPP_MESSAGE)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '0.75rem 1.5rem',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        color: '#fff',
                        backgroundColor: '#25D366',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        transition: 'background-color 0.2s',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        width: '100%',
                        justifyContent: 'center'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.backgroundColor = '#20BA5A'
                      }}
                      onMouseOut={(e) => {
                        e.target.style.backgroundColor = '#25D366'
                      }}
                    >
                      <span>💬</span>
                      <span>Contacter sur WhatsApp</span>
                    </a>
                  </>
                )}
                {!lockInfo.showPayment && (
                  <button onClick={handleUnlockClick} className="video-unlock-btn">
                    {lockInfo.button}
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <iframe
            src={url}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            title={title || 'Video player'}
            style={{
              width: '100%',
              height: '100%',
              minHeight: '200px',
              border: 'none',
              display: 'block'
            }}
            onLoad={() => {
              console.log('✅ Vidéo chargée avec succès:', url)
            }}
            onError={(e) => {
              console.error('❌ Erreur chargement vidéo:', url)
            }}
            playsInline
            webkit-playsinline="true"
          ></iframe>
        </div>
        )}
      </div>
    </div>
  )
}


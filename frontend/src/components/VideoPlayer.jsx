import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { CONFIG } from '../config/config'
import PayButton from './PayButton'

export default function VideoPlayer({ video, title }) {
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()

  if (!video) return null

  const { type, url } = video

  // Vérifier si l'utilisateur a un abonnement actif
  const hasActiveSubscription = () => {
    if (!isAuthenticated || !user) return false
    
    // Vérifier si l'utilisateur a un abonnement valide
    if (user.subscriptionExpiry) {
      const expiryDate = new Date(user.subscriptionExpiry)
      const now = new Date()
      return expiryDate > now
    }
    
    // Fallback: vérifier le statut 'active' pour compatibilité
    return user.status === 'active'
  }
  
  const canWatchVideo = hasActiveSubscription()

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
        message: 'Créez un compte et abonnez-vous pour accéder à toutes les vidéos de formation',
        button: 'S\'inscrire maintenant'
      }
    } else {
      // Vérifier si l'abonnement a expiré
      const isExpired = user?.subscriptionExpiry && new Date(user.subscriptionExpiry) <= new Date()
      
      return {
        title: 'Vidéo verrouillée',
        message: isExpired 
          ? 'Votre abonnement a expiré. Renouvelez votre abonnement pour continuer à accéder à toutes les vidéos.'
          : 'Abonnez-vous pour débloquer toutes les vidéos de formation. Accès illimité à tous les cours.',
        button: 'Voir mon profil',
        showPayment: true
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
                    <SubscriptionButton
                      onSuccess={() => {
                        console.log('Paiement abonnement initié avec succès')
                      }}
                      onError={(error) => {
                        console.error('Erreur paiement abonnement:', error)
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


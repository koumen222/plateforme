import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { CONFIG } from '../config/config'
import SubscriptionButton from './SubscriptionButton'

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
      <div className={`video-wrapper ${!canWatchVideo ? 'video-locked' : 'video-unlocked'}`} style={{ position: 'relative' }}>
        <div 
          style={{ 
            position: 'relative', 
            width: '100%', 
            height: '100%',
            filter: !canWatchVideo ? 'blur(8px)' : 'none',
            pointerEvents: !canWatchVideo ? 'auto' : 'auto',
            cursor: !canWatchVideo ? 'pointer' : 'default'
          }}
          onClick={!canWatchVideo ? () => {
            // Scroll vers les éléments d'abonnement en bas
            const subscriptionOverlay = document.querySelector('.subscription-overlay')
            if (subscriptionOverlay) {
              subscriptionOverlay.scrollIntoView({ behavior: 'smooth', block: 'center' })
              // Mettre en évidence l'overlay
              subscriptionOverlay.style.animation = 'pulse 0.5s ease-in-out'
              setTimeout(() => {
                subscriptionOverlay.style.animation = ''
              }, 500)
            }
          } : undefined}
        >
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
              display: 'block',
              pointerEvents: !canWatchVideo ? 'none' : 'auto'
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
          {!canWatchVideo && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              color: 'white',
              zIndex: 10,
              pointerEvents: 'none',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Vidéo en attente de validation</h3>
              <p style={{ fontSize: '0.9rem', opacity: 0.9 }}>Cliquez pour voir les options d'abonnement</p>
            </div>
          )}
        </div>
        
        {/* Éléments d'abonnement en position absolue (overlay en bas) */}
        {!canWatchVideo && (
          <div 
            className="subscription-overlay"
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '1.5rem',
              background: 'linear-gradient(to top, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.7) 70%, transparent 100%)',
              borderRadius: '0 0 16px 16px',
              zIndex: 20
            }}
          >
            <div style={{
              textAlign: 'center',
              marginBottom: '1rem'
            }}>
              <h3 style={{ 
                fontSize: '1.1rem', 
                marginBottom: '0.5rem',
                color: 'white',
                fontWeight: '600'
              }}>
                {lockInfo.title}
              </h3>
              <p style={{ 
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '0.9rem'
              }}>
                {lockInfo.message}
              </p>
            </div>
            
            {lockInfo.showPayment && user ? (
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
                  fontSize: '0.85rem', 
                  color: 'rgba(255, 255, 255, 0.8)',
                  margin: '0.75rem 0',
                  textAlign: 'center'
                }}>
                  ou
                </div>
                <a
                  href={`https://wa.me/${CONFIG.MORGAN_PHONE}?text=${encodeURIComponent(CONFIG.WHATSAPP_MESSAGE)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '0.75rem 1.5rem',
                    fontSize: '0.95rem',
                    fontWeight: 'bold',
                    color: '#fff',
                    backgroundColor: '#25D366',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'background-color 0.2s',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    width: '100%',
                    maxWidth: '400px',
                    margin: '0 auto'
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
            ) : !lockInfo.showPayment ? (
              <div style={{ textAlign: 'center' }}>
                <button 
                  onClick={handleUnlockClick} 
                  className="video-unlock-btn"
                  style={{
                    padding: '0.75rem 2rem',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    backgroundColor: 'var(--accent)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                >
                  {lockInfo.button}
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}


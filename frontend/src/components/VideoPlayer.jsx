import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import SubscriptionButton from './SubscriptionButton'

export default function VideoPlayer({ video, title, isFirstVideo = false }) {
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()

  if (!video) return null

  const { type, url } = video

  const handleSubscribeClick = () => {
    // Faire défiler vers la section d'abonnement
    const subscriptionSection = document.querySelector('.subscription-section')
    if (subscriptionSection) {
      subscriptionSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
      // Mettre en évidence la section
      subscriptionSection.style.transition = 'box-shadow 0.3s ease'
      subscriptionSection.style.boxShadow = '0 0 20px rgba(244, 162, 97, 0.5)'
      setTimeout(() => {
        subscriptionSection.style.boxShadow = ''
      }, 2000)
    }
  }

  // Vérifier si l'utilisateur a un statut actif
  const isActive = () => {
    if (!isAuthenticated || !user) return false
    
    // Vérifier si l'utilisateur a un abonnement valide
    if (user.subscriptionExpiry) {
      const expiryDate = new Date(user.subscriptionExpiry)
      const now = new Date()
      return expiryDate > now
    }
    
    // Vérifier le statut 'active' pour compatibilité
    return user.status === 'active'
  }
  
  // La première vidéo est toujours accessible, même sans abonnement actif
  const isInactive = !isFirstVideo && !isActive()

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
      <div 
        className={`video-wrapper ${isInactive ? 'video-locked' : 'video-unlocked'}`} 
        style={{ 
          position: 'relative'
        }}
      >
        {isInactive ? (
          <div style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '16px',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
              opacity: 0.3
            }}></div>
            <div style={{
              textAlign: 'center',
              zIndex: 1,
              color: '#fff',
              position: 'relative'
            }}>
              <div style={{
                fontSize: '4rem',
                marginBottom: '1rem',
                opacity: 0.7
              }}>
                🔒
              </div>
              <h3 style={{
                fontSize: '1.75rem',
                fontWeight: 'bold',
                marginBottom: '0.5rem',
                color: '#fff'
              }}>
                Vidéo bloquée
              </h3>
              <p style={{
                fontSize: '1rem',
                opacity: 0.8,
                color: '#ccc',
                marginBottom: '2rem'
              }}>
                Abonnez-vous pour accéder à cette vidéo
              </p>
              <button
                onClick={handleSubscribeClick}
                style={{
                  padding: '0.875rem 2rem',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  backgroundColor: '#f4a261',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s, transform 0.2s',
                  boxShadow: '0 4px 12px rgba(244, 162, 97, 0.4)',
                  marginTop: '1rem'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#fb8500'
                  e.target.style.transform = 'translateY(-2px)'
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = '#f4a261'
                  e.target.style.transform = 'translateY(0)'
                }}
              >
                💳 S'abonner
              </button>
            </div>
          </div>
        ) : (
          <iframe
            src={url}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            title={title || 'Video player'}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
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
        )}
      </div>
      
      {/* Bouton "S'abonner" avec les abonnements en bas (sous la vidéo) si statut inactif */}
      {isInactive && (
        <div 
          className="subscription-section"
          style={{
            marginTop: '2rem',
            padding: '2rem',
            borderRadius: '16px',
            background: 'var(--bg-secondary, #f5f5f5)'
          }}
        >
          <div style={{
            textAlign: 'center',
            marginBottom: '2rem'
          }}>
            <h3 style={{
              fontSize: '1.75rem',
              fontWeight: 'bold',
              color: 'var(--text-primary)',
              marginBottom: '0.5rem'
            }}>
              S'abonner
            </h3>
            <p style={{
              fontSize: '1rem',
              color: 'var(--text-secondary)',
              margin: 0
            }}>
              Abonnez-vous pour accéder à toutes les vidéos
            </p>
          </div>
          <SubscriptionButton
            onSuccess={() => {
              console.log('Paiement abonnement initié avec succès')
            }}
            onError={(error) => {
              console.error('Erreur paiement abonnement:', error)
            }}
          />
        </div>
      )}
    </div>
  )
}


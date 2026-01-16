import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import SubscriptionButton from './SubscriptionButton'

export default function VideoPlayer({ video, title, isFirstVideo = false, isFreeCourse = false }) {
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()

  if (!video) return null

  const { type, url } = video

  const handleSubscribeClick = () => {
    const subscriptionSection = document.querySelector('.subscription-section')
    if (subscriptionSection) {
      subscriptionSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
      subscriptionSection.style.transition = 'box-shadow 0.3s ease'
      subscriptionSection.style.boxShadow = '0 0 20px rgba(249, 115, 22, 0.5)'
      setTimeout(() => {
        subscriptionSection.style.boxShadow = ''
      }, 2000)
    }
  }

  const isActive = () => {
    if (!isAuthenticated || !user) return false
    
    if (user.subscriptionExpiry) {
      const expiryDate = new Date(user.subscriptionExpiry)
      const now = new Date()
      return expiryDate > now
    }
    
    return user.status === 'active'
  }
  
  const isInactive = !isFirstVideo && !isActive() && !isFreeCourse

  return (
    <div className="w-full max-w-full mb-6 sm:mb-8 overflow-x-hidden">
      {title && (
        <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-3 sm:mb-4 leading-tight px-1 text-primary break-words">
          {title}
        </h3>
      )}
      <div className="relative w-full aspect-video rounded-xl sm:rounded-2xl overflow-hidden bg-neutral-900 shadow-lg">
        {isInactive ? (
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 flex items-center justify-center">
            <div className="absolute inset-0 opacity-30" style={{
              background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)'
            }}></div>
            <div className="relative z-10 text-center px-4 sm:px-6 max-w-md">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-full flex items-center justify-center" style={{
                background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)',
                boxShadow: '0 4px 12px var(--accent-shadow)'
              }}>
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-2 sm:mb-3">
                Vidéo bloquée
              </h3>
              <p className="text-sm sm:text-base text-neutral-300 mb-6 sm:mb-8 leading-relaxed">
                Abonnez-vous pour accéder à cette vidéo et à toutes les formations
              </p>
              <button
                onClick={handleSubscribeClick}
                className="btn-primary text-sm sm:text-base px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl"
              >
                S'abonner maintenant
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
            className="absolute inset-0 w-full h-full border-none"
            onLoad={() => {
              console.log('Vidéo chargée avec succès:', url)
            }}
            onError={(e) => {
              console.error('Erreur chargement vidéo:', url)
            }}
            playsInline
            webkit-playsinline="true"
          />
        )}
      </div>
      
      {isInactive && (
        <div className="subscription-section mt-6 sm:mt-8 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 border shadow-sm card-startup">
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center" style={{
              background: 'linear-gradient(135deg, rgba(96, 60, 139, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)'
            }}>
              <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2 sm:mb-3 text-primary">
              S'abonner pour accéder à toutes les formations
            </h3>
            <p className="text-sm sm:text-base text-secondary leading-relaxed">
              Débloquez l'accès à toutes les vidéos et ressources de la plateforme
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

import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import VideoPlayer from './VideoPlayer'
import SubscriptionButton from './SubscriptionButton'
import { CONFIG } from '../config/config'

export default function ProtectedVideo({ video, title }) {
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
        <div style={{ fontSize: '2rem' }}>⏳</div>
        <p>Chargement...</p>
      </div>
    )
  }

  // Si pas authentifié, afficher un message avec bouton pour s'inscrire
  if (!isAuthenticated || !user) {
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
        <div style={{ fontSize: '4rem' }}>🔒</div>
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

  // Si l'utilisateur est en attente (pending), afficher un message avec bouton de paiement
  if (user.status === 'pending') {
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
        backgroundColor: '#fff3cd',
        borderRadius: '12px',
        margin: '2rem 0',
        border: '2px solid #ffc107'
      }}>
        <div style={{ fontSize: '4rem' }}>⏳</div>
        <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#856404' }}>
          Abonnez-vous pour accéder à toutes les vidéos
        </h2>
        <p style={{ fontSize: '1.1rem', color: '#856404', maxWidth: '500px', margin: 0 }}>
          Pour débloquer toutes les vidéos de formation, choisissez votre abonnement. 
          Accès illimité à tous les cours et ressources.
        </p>
        <div style={{ 
          marginTop: '1.5rem', 
          width: '100%',
          maxWidth: '800px'
        }}>
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
            color: '#856404',
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
        </div>
      </div>
    )
  }

  // Si l'utilisateur est actif, afficher la vidéo
  return <VideoPlayer video={video} title={title} />
}


import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { CONFIG } from '../config/config'
import axios from 'axios'
import '../styles/subscription.css'

export default function SubscriptionButton({ onSuccess, onError }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedPlan, setSelectedPlan] = useState('monthly') // 'monthly' ou 'yearly'

  const handlePayment = async (planType) => {
    try {
      setLoading(true)
      setError('')
      setSelectedPlan(planType)

      const amount = planType === 'monthly' ? CONFIG.SUBSCRIPTION_MONTHLY : CONFIG.SUBSCRIPTION_YEARLY
      const orderId = `SUB-${user?._id || user?.id || 'USER'}-${planType}-${Date.now()}`

      console.log('Initialisation du paiement abonnement...')
      console.log('   - Plan:', planType)
      console.log('   - Amount:', amount)
      console.log('   - Order ID:', orderId)

      // Appeler le backend pour initialiser le paiement
      const response = await axios.post(`${CONFIG.BACKEND_URL}/api/payment/init`, {
        amount: amount,
        order_id: orderId,
        subscription_type: planType // 'monthly' ou 'yearly'
      }, {
        timeout: 30000
      })

      if (response.data && response.data.link) {
        const paymentLink = response.data.link
        console.log('Lien de paiement reçu:', paymentLink)
        
        // Vérifier que le lien est valide
        if (!paymentLink.startsWith('http://') && !paymentLink.startsWith('https://')) {
          throw new Error('Lien de paiement invalide')
        }
        
        // Appeler onSuccess avant la redirection
        if (onSuccess) {
          onSuccess()
        }
        
        // Rediriger vers le lien de paiement
        window.location.replace(paymentLink)
      } else {
        throw new Error('Lien de paiement non reçu dans la réponse')
      }
    } catch (err) {
      console.error('Erreur initialisation paiement:', err)
      
      let errorMessage = 'Erreur lors de l\'initialisation du paiement'
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error
      } else if (err.message) {
        errorMessage = err.message
      } else if (err.response?.status === 500) {
        errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.'
      } else if (err.response?.status === 401 || err.response?.status === 403) {
        errorMessage = 'Vous devez être connecté pour effectuer un paiement.'
      }
      
      setError(errorMessage)
      if (onError) {
        onError(errorMessage)
      }
      setLoading(false)
    }
  }

  return (
    <div className="subscription-container">
      {error && (
        <div style={{
          padding: '1rem',
          marginBottom: '1rem',
          backgroundColor: '#fee',
          color: '#c33',
          borderRadius: '8px',
          fontSize: '0.9rem'
        }}>
          {error}
        </div>
      )}

      <div className="subscription-plans">
        <div className="subscription-plan-card">
          <div className="plan-header">
            <h3 className="plan-title">Mensuel</h3>
            <div className="plan-price">
              <span className="plan-amount">{CONFIG.SUBSCRIPTION_MONTHLY.toLocaleString('fr-FR')}</span>
              <span className="plan-currency">FCFA</span>
            </div>
            <p className="plan-period">par mois</p>
          </div>
          <ul className="plan-features">
            <li>Accès à toutes les vidéos</li>
            <li>Toutes les formations</li>
            <li>Ressources téléchargeables</li>
            <li>Support communautaire</li>
          </ul>
          <button
            onClick={() => handlePayment('monthly')}
            disabled={loading && selectedPlan === 'monthly'}
            className="subscription-btn subscription-btn-monthly"
          >
            {loading && selectedPlan === 'monthly' ? (
              <>Chargement...</>
            ) : (
              <>S'abonner mensuel</>
            )}
          </button>
          <a
            href={`https://wa.me/${CONFIG.MORGAN_PHONE}?text=${encodeURIComponent(`Bonjour, je souhaite payer pour l'abonnement mensuel de ${CONFIG.SUBSCRIPTION_MONTHLY.toLocaleString('fr-FR')} FCFA.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              fontSize: '0.95rem',
              fontWeight: '600',
              color: '#fff',
              backgroundColor: '#25D366',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              textDecoration: 'none',
              transition: 'background-color 0.2s, transform 0.2s',
              boxShadow: '0 2px 4px rgba(37, 211, 102, 0.3)',
              marginTop: '0.75rem',
              width: '100%'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#20BA5A'
              e.target.style.transform = 'translateY(-2px)'
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#25D366'
              e.target.style.transform = 'translateY(0)'
            }}
          >
            <FaWhatsapp /> <span>Payer via WhatsApp</span>
          </a>
        </div>

        <div className="subscription-plan-card subscription-plan-featured">
          <div className="plan-badge">Meilleure valeur</div>
          <div className="plan-header">
            <h3 className="plan-title">Annuel</h3>
            <div className="plan-price">
              <span className="plan-amount">{CONFIG.SUBSCRIPTION_YEARLY.toLocaleString('fr-FR')}</span>
              <span className="plan-currency">FCFA</span>
            </div>
            <p className="plan-period">par an</p>
            <div className="plan-savings">
              Économisez {((CONFIG.SUBSCRIPTION_MONTHLY * 12) - CONFIG.SUBSCRIPTION_YEARLY).toLocaleString('fr-FR')} FCFA
            </div>
          </div>
          <ul className="plan-features">
            <li>Accès à toutes les vidéos</li>
            <li>Toutes les formations</li>
            <li>Ressources téléchargeables</li>
            <li>Support communautaire</li>
            <li>Économie de 35 000 FCFA</li>
          </ul>
          <button
            onClick={() => handlePayment('yearly')}
            disabled={loading && selectedPlan === 'yearly'}
            className="subscription-btn subscription-btn-yearly"
          >
            {loading && selectedPlan === 'yearly' ? (
              <>Chargement...</>
            ) : (
              <>S'abonner annuel</>
            )}
          </button>
          <a
            href={`https://wa.me/${CONFIG.MORGAN_PHONE}?text=${encodeURIComponent(`Bonjour, je souhaite payer pour l'abonnement annuel de ${CONFIG.SUBSCRIPTION_YEARLY.toLocaleString('fr-FR')} FCFA.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              fontSize: '0.95rem',
              fontWeight: '600',
              color: '#fff',
              backgroundColor: '#25D366',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              textDecoration: 'none',
              transition: 'background-color 0.2s, transform 0.2s',
              boxShadow: '0 2px 4px rgba(37, 211, 102, 0.3)',
              marginTop: '0.75rem',
              width: '100%'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#20BA5A'
              e.target.style.transform = 'translateY(-2px)'
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#25D366'
              e.target.style.transform = 'translateY(0)'
            }}
          >
            <FaWhatsapp /> <span>Payer via WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  )
}


import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { CONFIG } from '../config/config'
import axios from 'axios'
import { FaWhatsapp } from 'react-icons/fa'

export default function SubscriptionButton({ onSuccess, onError }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedPlan, setSelectedPlan] = useState('monthly') // 'monthly' ou 'yearly'

  // Ne pas afficher le composant si l'utilisateur est déjà actif
  if (user?.status === 'active') {
    return (
      <div className="w-full max-w-5xl mx-auto">
        <div className="p-6 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg text-center">
          <p className="text-lg font-semibold mb-2">✅ Votre compte est déjà actif</p>
          <p className="text-sm">Vous avez accès à toutes les formations et ressources.</p>
        </div>
      </div>
    )
  }

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
    <div className="w-full max-w-5xl mx-auto">
      {error && (
        <div className="p-4 mb-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
        {/* Plan Mensuel */}
        <div className="card-startup hover:-translate-y-1 hover:shadow-xl hover:border-accent dark:hover:border-accent flex flex-col relative">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-primary mb-4">Mensuel</h3>
            <div className="flex items-baseline justify-center gap-2 mb-2">
              <span className="text-4xl font-extrabold text-accent">{CONFIG.SUBSCRIPTION_MONTHLY.toLocaleString('fr-FR')}</span>
              <span className="text-xl font-semibold text-secondary">FCFA</span>
            </div>
            <p className="text-base text-secondary mb-2">par mois</p>
          </div>
          <ul className="list-none p-0 m-0 mb-8 flex-1 space-y-3">
            <li className="py-3 text-primary text-sm border-b border-theme last:border-0">Accès à toutes les vidéos</li>
            <li className="py-3 text-primary text-sm border-b border-theme last:border-0">Toutes les formations</li>
            <li className="py-3 text-primary text-sm border-b border-theme last:border-0">Ressources téléchargeables</li>
            <li className="py-3 text-primary text-sm border-b border-theme last:border-0">Support communautaire</li>
          </ul>
          <button
            onClick={() => handlePayment('monthly')}
            disabled={loading && selectedPlan === 'monthly'}
            className="btn-primary w-full px-8 py-4 text-base font-bold disabled:opacity-60 disabled:cursor-not-allowed hover:-translate-y-0.5 hover:shadow-xl"
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
            className="btn-whatsapp mt-3"
          >
            <FaWhatsapp /> <span>Payer via WhatsApp</span>
          </a>
        </div>

        {/* Plan Annuel - Featured */}
        <div className="card-startup border-2 border-accent hover:-translate-y-1 hover:shadow-xl flex flex-col relative bg-secondary/30">
          <div className="absolute -top-3 right-6 bg-accent text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg">
            Meilleure valeur
          </div>
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-primary mb-4">Annuel</h3>
            <div className="flex items-baseline justify-center gap-2 mb-2">
              <span className="text-4xl font-extrabold text-accent">{CONFIG.SUBSCRIPTION_YEARLY.toLocaleString('fr-FR')}</span>
              <span className="text-xl font-semibold text-secondary">FCFA</span>
            </div>
            <p className="text-base text-secondary mb-2">par an</p>
            <div className="text-sm text-accent font-semibold mt-2">
              Économisez {((CONFIG.SUBSCRIPTION_MONTHLY * 12) - CONFIG.SUBSCRIPTION_YEARLY).toLocaleString('fr-FR')} FCFA
            </div>
          </div>
          <ul className="list-none p-0 m-0 mb-8 flex-1 space-y-3">
            <li className="py-3 text-primary text-sm border-b border-theme last:border-0">Accès à toutes les vidéos</li>
            <li className="py-3 text-primary text-sm border-b border-theme last:border-0">Toutes les formations</li>
            <li className="py-3 text-primary text-sm border-b border-theme last:border-0">Ressources téléchargeables</li>
            <li className="py-3 text-primary text-sm border-b border-theme last:border-0">Support communautaire</li>
            <li className="py-3 text-primary text-sm border-b border-theme last:border-0">Économie de 35 000 FCFA</li>
          </ul>
          <button
            onClick={() => handlePayment('yearly')}
            disabled={loading && selectedPlan === 'yearly'}
            className="btn-primary w-full px-8 py-4 text-base font-bold disabled:opacity-60 disabled:cursor-not-allowed hover:-translate-y-0.5 hover:shadow-xl"
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
            className="btn-whatsapp mt-3"
          >
            <FaWhatsapp /> <span>Payer via WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  )
}
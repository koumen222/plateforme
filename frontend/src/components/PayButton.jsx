import { useState } from 'react'
import { CONFIG } from '../config/config'
import axios from 'axios'

export default function PayButton({ amount, orderId, onSuccess, onError }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePayment = async () => {
    try {
      setLoading(true)
      setError('')

      if (!amount || amount <= 0) {
        setError('Le montant doit être supérieur à 0')
        setLoading(false)
        return
      }

      if (!orderId) {
        setError('L\'identifiant de commande est requis')
        setLoading(false)
        return
      }

      console.log('💳 Initialisation du paiement...')
      console.log('   - Amount:', amount)
      console.log('   - Order ID:', orderId)

      // Appeler le backend pour initialiser le paiement
      const response = await axios.post(`${CONFIG.BACKEND_URL}/api/payment/init`, {
        amount: amount,
        order_id: orderId
      }, {
        timeout: 30000 // 30 secondes de timeout
      })

      if (response.data && response.data.link) {
        const paymentLink = response.data.link
        console.log('✅ Lien de paiement reçu:', paymentLink)
        
        // Vérifier que le lien est valide
        if (!paymentLink.startsWith('http://') && !paymentLink.startsWith('https://')) {
          throw new Error('Lien de paiement invalide')
        }
        
        // Appeler onSuccess avant la redirection
        if (onSuccess) {
          onSuccess()
        }
        
        // Rediriger directement vers le lien de paiement LYGOS
        // Utiliser replace() pour éviter les problèmes de navigation
        window.location.replace(paymentLink)
      } else {
        throw new Error('Lien de paiement non reçu dans la réponse')
      }
    } catch (err) {
      console.error('❌ Erreur initialisation paiement:', err)
      console.error('   - Détails:', err.response?.data || err.message)
      
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
    <div>
      {error && (
        <div className="p-4 mb-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg text-sm">
          ❌ {error}
        </div>
      )}
      <button
        onClick={handlePayment}
        disabled={loading}
        className="btn-primary flex items-center gap-2"
      >
        {loading ? (
          <>
            <span>⏳</span>
            <span>Chargement...</span>
          </>
        ) : (
          <>
            <span>💳</span>
            <span>Payer {amount.toLocaleString('fr-FR')} FCFA</span>
          </>
        )}
      </button>
    </div>
  )
}


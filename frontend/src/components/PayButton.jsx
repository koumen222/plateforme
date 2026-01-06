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
      })

      if (response.data.link) {
        console.log('✅ Lien de paiement reçu:', response.data.link)
        
        // Rediriger directement vers le lien de paiement LYGOS
        window.location.href = response.data.link
      } else {
        throw new Error('Lien de paiement non reçu')
      }
    } catch (err) {
      console.error('❌ Erreur initialisation paiement:', err)
      const errorMessage = err.response?.data?.error || err.message || 'Erreur lors de l\'initialisation du paiement'
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
        <div style={{
          padding: '1rem',
          marginBottom: '1rem',
          backgroundColor: '#fee',
          color: '#c33',
          borderRadius: '4px',
          fontSize: '0.9rem'
        }}>
          ❌ {error}
        </div>
      )}
      <button
        onClick={handlePayment}
        disabled={loading}
        style={{
          padding: '0.75rem 1.5rem',
          fontSize: '1rem',
          fontWeight: 'bold',
          color: '#fff',
          backgroundColor: loading ? '#999' : '#25D366',
          border: 'none',
          borderRadius: '8px',
          cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          transition: 'background-color 0.2s',
          boxShadow: loading ? 'none' : '0 2px 4px rgba(0,0,0,0.1)'
        }}
        onMouseOver={(e) => {
          if (!loading) e.target.style.backgroundColor = '#20BA5A'
        }}
        onMouseOut={(e) => {
          if (!loading) e.target.style.backgroundColor = '#25D366'
        }}
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


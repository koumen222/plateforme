import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { CONFIG } from '../config/config'
import { useAuth } from '../contexts/AuthContext'

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setUser, user } = useAuth()
  const [verifying, setVerifying] = useState(true)
  const [paid, setPaid] = useState(false)
  const [error, setError] = useState('')
  const [transaction, setTransaction] = useState(null)
  const [activating, setActivating] = useState(false)

  useEffect(() => {
    const verifyPayment = async () => {
      const orderId = searchParams.get('order_id')

      if (!orderId) {
        setError('Identifiant de commande manquant')
        setVerifying(false)
        return
      }

      try {
        console.log('🔍 Vérification du paiement...')
        console.log('   - Order ID:', orderId)

        // Attendre un peu pour que le paiement soit enregistré côté Lygos
        await new Promise(resolve => setTimeout(resolve, 2000))

        const response = await axios.get(`${CONFIG.BACKEND_URL}/api/payment/verify/${orderId}`)

        if (response.data.paid) {
          console.log('✅ Paiement validé')
          setPaid(true)
          setTransaction(response.data.transaction)
          
          // Activer automatiquement l'utilisateur
          setActivating(true)
          try {
            const activateResponse = await axios.post(`${CONFIG.BACKEND_URL}/api/payment/activate`, {
              order_id: orderId
            })
            
            if (activateResponse.data.success) {
              console.log('✅ Compte activé automatiquement')
              
              // Mettre à jour l'utilisateur dans le contexte
              const token = localStorage.getItem('token')
              if (token) {
                const userResponse = await axios.get(`${CONFIG.BACKEND_URL}/api/auth/me`, {
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                })
                
                if (userResponse.data.success && userResponse.data.user) {
                  setUser(userResponse.data.user)
                  console.log('✅ Utilisateur mis à jour dans le contexte')
                }
              }
            }
          } catch (activateErr) {
            console.error('⚠️ Erreur activation automatique:', activateErr)
            // Ne pas bloquer l'affichage si l'activation échoue
          } finally {
            setActivating(false)
          }
        } else {
          console.log('⚠️ Paiement non confirmé')
          setPaid(false)
        }
      } catch (err) {
        console.error('❌ Erreur vérification paiement:', err)
        setError(err.response?.data?.error || 'Erreur lors de la vérification du paiement')
        setPaid(false)
      } finally {
        setVerifying(false)
      }
    }

    verifyPayment()
  }, [searchParams])

  if (verifying || activating) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: '1rem',
        padding: '2rem'
      }}>
        <div style={{ fontSize: '3rem' }}>⏳</div>
        <h2>
          {verifying ? 'Vérification du paiement en cours...' : 'Activation de votre compte...'}
        </h2>
        <p>Veuillez patienter quelques instants</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: '1rem',
        padding: '2rem'
      }}>
        <div style={{ fontSize: '3rem' }}>❌</div>
        <h2>Erreur</h2>
        <p style={{ color: '#c33' }}>{error}</p>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            backgroundColor: '#4285F4',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Retour au dashboard
        </button>
      </div>
    )
  }

  if (paid) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: '1rem',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '4rem' }}>✅</div>
        <h1 style={{ color: '#4caf50', margin: 0 }}>Paiement validé !</h1>
        <p style={{ fontSize: '1.1rem', color: '#666' }}>
          Votre paiement a été confirmé avec succès.
        </p>
        
        {transaction && (
          <div style={{
            marginTop: '2rem',
            padding: '1.5rem',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px',
            minWidth: '300px'
          }}>
            <h3 style={{ marginTop: 0 }}>Détails de la transaction</h3>
            <p><strong>Commande:</strong> {transaction.order_id}</p>
            <p><strong>Montant:</strong> {transaction.amount} FCFA</p>
            <p><strong>Statut:</strong> {transaction.status}</p>
            {transaction.created_at && (
              <p><strong>Date:</strong> {new Date(transaction.created_at).toLocaleString('fr-FR')}</p>
            )}
          </div>
        )}

        <button
          onClick={() => navigate('/dashboard')}
          style={{
            marginTop: '2rem',
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
          Retour au dashboard
        </button>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      gap: '1rem',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '4rem' }}>⚠️</div>
      <h1 style={{ color: '#ff9800', margin: 0 }}>Paiement non confirmé</h1>
      <p style={{ fontSize: '1.1rem', color: '#666' }}>
        Le paiement n'a pas pu être vérifié. Veuillez contacter le support si vous avez effectué le paiement.
      </p>
      
      <button
        onClick={() => navigate('/dashboard')}
        style={{
          marginTop: '2rem',
          padding: '0.75rem 2rem',
          fontSize: '1rem',
          backgroundColor: '#4285F4',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        Retour au dashboard
      </button>
    </div>
  )
}


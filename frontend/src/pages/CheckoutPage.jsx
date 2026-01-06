import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { CONFIG } from '../config/config'

export default function CheckoutPage() {
  const { checkoutId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Si on a un checkoutId, on essaie de récupérer les informations de paiement
    // Sinon, on redirige vers le dashboard
    if (!checkoutId) {
      console.warn('⚠️ Aucun checkoutId dans l\'URL')
      navigate('/', { replace: true })
      return
    }

    // LYGOS peut générer un lien qui pointe vers notre frontend au lieu de leur propre domaine
    // Dans ce cas, on doit rediriger vers la vraie page de paiement LYGOS
    console.log('🔍 Checkout ID reçu:', checkoutId)
    
    // On essaie de construire l'URL de paiement LYGOS
    // Le format attendu est généralement : https://pay.lygosapp.com/checkout/{checkoutId}
    const lygosCheckoutUrl = `https://pay.lygosapp.com/checkout/${checkoutId}`
    
    console.log('🔄 Redirection vers la page de paiement LYGOS:', lygosCheckoutUrl)
    
    // Rediriger immédiatement vers la page de paiement LYGOS
    window.location.href = lygosCheckoutUrl
    
    // Si la redirection échoue, on redirige vers la page d'accueil après 3 secondes
    const timer = setTimeout(() => {
      console.log('⚠️ La redirection vers LYGOS a peut-être échoué, retour à l\'accueil')
      navigate('/', { replace: true })
    }, 3000)

    setLoading(false)

    return () => clearTimeout(timer)
  }, [checkoutId, navigate])

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        textAlign: 'center',
        padding: '2rem'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
        <h1 style={{ color: 'var(--text-primary)' }}>Chargement...</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Redirection en cours...</p>
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
        textAlign: 'center',
        padding: '2rem'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem', color: '#dc3545' }}>❌</div>
        <h1 style={{ color: '#dc3545' }}>Erreur</h1>
        <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
        <button
          onClick={() => navigate('/')}
          style={{
            marginTop: '1rem',
            padding: '12px 24px',
            backgroundColor: 'var(--primary-color)',
            color: 'white',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold'
          }}
        >
          Retour à l'accueil
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
      textAlign: 'center',
      padding: '2rem'
    }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
      <h1 style={{ color: 'var(--text-primary)' }}>Redirection...</h1>
      <p style={{ color: 'var(--text-secondary)' }}>Vous allez être redirigé dans quelques instants.</p>
    </div>
  )
}


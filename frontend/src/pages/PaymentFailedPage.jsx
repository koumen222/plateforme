import { useSearchParams, useNavigate } from 'react-router-dom'

export default function PaymentFailedPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const orderId = searchParams.get('order_id')

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
      <div style={{ fontSize: '4rem' }}>❌</div>
      <h1 style={{ color: '#f44336', margin: 0 }}>Paiement échoué</h1>
      <p style={{ fontSize: '1.1rem', color: '#666' }}>
        Le paiement n'a pas pu être effectué. Veuillez réessayer.
      </p>
      
      {orderId && (
        <p style={{ fontSize: '0.9rem', color: '#999' }}>
          Commande: {orderId}
        </p>
      )}

      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '0.75rem 2rem',
            fontSize: '1rem',
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
          Retour à l'accueil
        </button>
        
        <button
          onClick={() => window.location.reload()}
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
          Réessayer
        </button>
      </div>
    </div>
  )
}


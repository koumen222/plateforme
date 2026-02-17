import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CONFIG } from '../config/config'
import { useAuth } from '../contexts/AuthContext'

export default function EbookPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token, user } = useAuth()
  const [ebook, setEbook] = useState(null)
  const [loading, setLoading] = useState(true)
  const [purchased, setPurchased] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [checkingPayment, setCheckingPayment] = useState(false)
  const [paymentId, setPaymentId] = useState(null)
  const [paymentInfo, setPaymentInfo] = useState(null)
  const [error, setError] = useState(null)

  const [formData, setFormData] = useState({
    phoneNumber: user?.phoneNumber || '',
    operator: ''
  })

  useEffect(() => {
    if (token && id) {
      fetchEbook()
    } else if (!token) {
      navigate('/login')
    }
  }, [token, id])

  useEffect(() => {
    if (paymentId && !purchased) {
      const interval = setInterval(() => {
        checkPaymentStatus()
      }, 5000) // Vérifier toutes les 5 secondes

      return () => clearInterval(interval)
    }
  }, [paymentId, purchased])

  const fetchEbook = async () => {
    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/ebooks/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setEbook(data.ebook)
        setPurchased(data.ebook.purchased || false)
      } else {
        setError('Ebook non trouvé')
      }
    } catch (err) {
      setError('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleInitiatePayment = async (e) => {
    e.preventDefault()

    if (!formData.phoneNumber) {
      setError('Veuillez entrer votre numéro de téléphone')
      return
    }

    setPaymentLoading(true)
    setError(null)

    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/payments/initiate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ebookId: id,
          phoneNumber: formData.phoneNumber,
          operator: formData.operator || null
        })
      })

      const data = await response.json()

      if (response.ok) {
        setPaymentId(data.paymentId)
        setPaymentInfo({
          channel: data.channel,
          channelName: data.channelName,
          channelUssd: data.channelUssd,
          paymentUrl: data.paymentUrl,
          message: data.message
        })
      } else {
        setError(data.error || 'Erreur lors de l\'initiation du paiement')
      }
    } catch (err) {
      setError('Erreur lors de l\'initiation du paiement')
    } finally {
      setPaymentLoading(false)
    }
  }

  const checkPaymentStatus = async () => {
    if (!paymentId || checkingPayment) return

    setCheckingPayment(true)
    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/payments/check`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ paymentId })
      })

      const data = await response.json()

      console.log('📊 Statut paiement:', data.status, data)

      if (data.status === 'success') {
        console.log('✅ Paiement confirmé avec succès!')
        setPurchased(true)
        setPaymentId(null)
        setPaymentInfo(null)
        fetchEbook() // Recharger l'ebook pour avoir accès au contenu
      } else if (data.status === 'failed' || data.status === 'cancelled') {
        console.log('❌ Paiement échoué ou annulé:', data.status)
        setError('Paiement échoué ou annulé')
        setPaymentId(null)
        setPaymentInfo(null)
      } else {
        // Statut pending - continuer à vérifier
        console.log('⏳ Paiement en attente...')
      }
    } catch (err) {
      console.error('Erreur vérification paiement:', err)
    } finally {
      setCheckingPayment(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div>Chargement...</div>
      </div>
    )
  }

  if (error && !ebook) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ color: '#f44336' }}>{error}</div>
        <button onClick={() => navigate('/')} style={{ marginTop: '20px', padding: '10px 20px' }}>
          Retour à l'accueil
        </button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      {ebook && (
        <>
          <div style={{ marginBottom: '30px' }}>
            <h1 style={{ fontSize: '28px', marginBottom: '10px' }}>{ebook.title}</h1>
            <p style={{ fontSize: '16px', color: '#666', marginBottom: '20px' }}>{ebook.description}</p>
            
            {ebook.coverImage && (
              <img 
                src={ebook.coverImage} 
                alt={ebook.title}
                style={{ width: '100%', maxWidth: '400px', borderRadius: '8px', marginBottom: '20px' }}
              />
            )}

            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4caf50', marginBottom: '20px' }}>
              {ebook.price} {ebook.currency}
            </div>
          </div>

          {purchased ? (
            <div style={{ padding: '20px', backgroundColor: '#e8f5e9', borderRadius: '8px', marginBottom: '30px' }}>
              <h2 style={{ color: '#2e7d32', marginBottom: '10px' }}>✅ Achat confirmé</h2>
              <p>Vous avez accès au contenu complet de cet ebook.</p>
              
              {ebook.content && (
                <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#fff', borderRadius: '8px' }}>
                  <div dangerouslySetInnerHTML={{ __html: ebook.content }} />
                </div>
              )}

              {ebook.fileUrl && (
                <div style={{ marginTop: '20px' }}>
                  <a 
                    href={ebook.fileUrl} 
                    download
                    style={{ 
                      display: 'inline-block', 
                      padding: '12px 24px', 
                      backgroundColor: '#4caf50', 
                      color: 'white', 
                      textDecoration: 'none', 
                      borderRadius: '6px',
                      fontWeight: '600'
                    }}
                  >
                    📥 Télécharger le fichier PDF
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
              {!paymentId ? (
                <form onSubmit={handleInitiatePayment}>
                  <h2 style={{ marginBottom: '20px' }}>Acheter cet ebook</h2>
                  
                  {error && (
                    <div style={{ padding: '12px', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '6px', marginBottom: '16px' }}>
                      {error}
                    </div>
                  )}

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                      Numéro de téléphone *
                    </label>
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      placeholder="237XXXXXXXXX"
                      required
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '16px' }}
                    />
                    <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                      Format: 237XXXXXXXXX (sans espaces ni caractères spéciaux)
                    </p>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                      Opérateur mobile (optionnel)
                    </label>
                    <select
                      value={formData.operator}
                      onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '16px' }}
                    >
                      <option value="">Sélectionner un opérateur</option>
                      <option value="CM_MTNMOBILEMONEY">MTN Mobile Money</option>
                      <option value="CM_ORANGEMONEY">Orange Money</option>
                      <option value="CM_EUMM">Express Union Mobile Money</option>
                      <option value="CM_YUP">YUP</option>
                      <option value="CM_NEXTTELPOSSA">Nexttel Possa</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={paymentLoading}
                    style={{
                      width: '100%',
                      padding: '14px',
                      fontSize: '16px',
                      fontWeight: '600',
                      backgroundColor: paymentLoading ? '#ccc' : '#4caf50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: paymentLoading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {paymentLoading ? '⏳ Traitement...' : `Payer ${ebook.price} ${ebook.currency}`}
                  </button>
                </form>
              ) : (
                <div>
                  <h2 style={{ marginBottom: '20px', color: '#ff9800' }}>⏳ Paiement en cours</h2>
                  
                  {paymentInfo && (
                    <div style={{ padding: '16px', backgroundColor: '#fff3e0', borderRadius: '6px', marginBottom: '20px' }}>
                      <p style={{ marginBottom: '10px', fontWeight: '600' }}>
                        Opérateur: {paymentInfo.channelName}
                      </p>
                      <p style={{ marginBottom: '10px' }}>
                        Code USSD: <strong>{paymentInfo.channelUssd}</strong>
                      </p>
                      <p style={{ fontSize: '14px', color: '#666' }}>
                        {paymentInfo.message}
                      </p>
                      
                      {paymentInfo.paymentUrl && (
                        <div style={{ marginTop: '16px' }}>
                          <a 
                            href={paymentInfo.paymentUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ 
                              display: 'inline-block', 
                              padding: '10px 20px', 
                              backgroundColor: '#ff9800', 
                              color: 'white', 
                              textDecoration: 'none', 
                              borderRadius: '6px',
                              fontWeight: '600'
                            }}
                          >
                            Ouvrir le lien de paiement Orange Money
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ padding: '16px', backgroundColor: '#e3f2fd', borderRadius: '6px' }}>
                    <p style={{ marginBottom: '10px' }}>
                      <strong>Instructions:</strong>
                    </p>
                    <ol style={{ paddingLeft: '20px', marginBottom: '10px' }}>
                      <li>Composez le code USSD sur votre téléphone</li>
                      <li>Confirmez le paiement</li>
                      <li>Attendez la confirmation (vérification automatique en cours...)</li>
                    </ol>
                    {checkingPayment && (
                      <p style={{ color: '#1976d2', fontSize: '14px' }}>
                        🔄 Vérification du paiement en cours...
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { updateUser, setToken } = useAuth()

  useEffect(() => {
    const token = searchParams.get('token')
    const userParam = searchParams.get('user')

    if (token && userParam) {
      try {
        const user = JSON.parse(userParam)
        
        // Sauvegarder le token et l'utilisateur
        setToken(token)
        updateUser(user)
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))

        console.log('✅ Authentification Google réussie - Utilisateur:', user.name || user.email)
        
        // Rediriger vers la page d'accueil
        navigate('/', { replace: true })
      } catch (error) {
        console.error('Erreur lors du traitement du callback:', error)
        navigate('/login?error=callback_error', { replace: true })
      }
    } else {
      // Pas de token, rediriger vers login
      navigate('/login?error=no_token', { replace: true })
    }
  }, [searchParams, navigate, updateUser, setToken])

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      <div style={{ fontSize: '2rem' }}>⏳</div>
      <p>Connexion en cours...</p>
    </div>
  )
}


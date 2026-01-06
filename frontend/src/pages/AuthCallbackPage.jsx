import { useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { CONFIG } from '../config/config'

export default function AuthCallbackPage() {
  const { setUser, setToken } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const handleAuth = async () => {
      try {
        console.log('🔐 ========== AUTH CALLBACK PAGE ==========')
        
        // 1. Extraire le token de l'URL
        const token = searchParams.get('token')
        
        if (!token) {
          console.error('❌ Pas de token dans l\'URL')
          navigate('/login?error=no_token', { replace: true })
          return
        }

        console.log('✅ Token reçu depuis l\'URL')
        console.log('   - Token length:', token.length)

        // 2. Stocker le token dans localStorage
        localStorage.setItem('token', token)
        console.log('✅ Token stocké dans localStorage')

        // 3. Définir le token dans le contexte
        setToken(token)

        // 4. Récupérer les informations de l'utilisateur depuis le backend
        const res = await axios.get(`${CONFIG.BACKEND_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          withCredentials: true
        })

        if (res.data.success && res.data.user) {
          const userData = res.data.user
          
          // 5. Stocker l'utilisateur dans localStorage et contexte
          localStorage.setItem('user', JSON.stringify(userData))
          setUser(userData)
          
          console.log('✅ Authentification Google réussie')
          console.log('   - Utilisateur:', userData.name || userData.email)
          console.log('   - Email:', userData.email)
          console.log('   - Status:', userData.status)
          console.log('   - Role:', userData.role)
          console.log('🔐 ========== FIN AUTH CALLBACK ==========')

          // 6. Rediriger vers le dashboard
          navigate('/', { replace: true })
        } else {
          console.error('❌ Pas d\'utilisateur dans la réponse:', res.data)
          navigate('/login?error=no_user', { replace: true })
        }
      } catch (error) {
        console.error('❌ Erreur lors de l\'authentification:', error)
        if (error.response) {
          console.error('   - Status:', error.response.status)
          console.error('   - Data:', error.response.data)
        }
        // Nettoyer le localStorage en cas d'erreur
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/login?error=auth_failed', { replace: true })
      }
    }

    handleAuth()
  }, [searchParams, navigate, setUser, setToken])

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


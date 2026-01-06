import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'
import { CONFIG } from '../config/config'

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const { setUser } = useAuth()

  useEffect(() => {
    // Récupérer l'utilisateur depuis le cookie via /api/auth/me
    // Le token est déjà dans le cookie après la redirection depuis Google
    axios.get(`${CONFIG.BACKEND_URL}/api/auth/me`, {
      withCredentials: true
    })
    .then(res => {
      if (res.data.success && res.data.user) {
        setUser(res.data.user)
        console.log('✅ Authentification Google réussie - Utilisateur:', res.data.user.name || res.data.user.email)
        
        // Rediriger vers le dashboard
        navigate('/dashboard', { replace: true })
      } else {
        console.error('❌ Pas d\'utilisateur dans la réponse')
        navigate('/login?error=no_user', { replace: true })
      }
    })
    .catch(error => {
      console.error('❌ Erreur lors de la récupération de l\'utilisateur:', error)
      navigate('/login?error=callback_error', { replace: true })
    })
  }, [navigate, setUser])

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


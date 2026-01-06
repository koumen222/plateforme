import { useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'
import { CONFIG } from '../config/config'

export default function AuthCallbackPage() {
  const { setUser } = useAuth()

  useEffect(() => {
    // Récupérer l'utilisateur depuis le cookie via /api/auth/me
    // Le token est déjà dans le cookie après la redirection depuis Google
    axios.get(`${CONFIG.BACKEND_URL}/api/auth/me`, {
      withCredentials: true
    })
    .then(res => {
      // La réponse est { success: true, user: {...} }
      if (res.data.success && res.data.user) {
        setUser(res.data.user)
        console.log('✅ Authentification Google réussie - Utilisateur:', res.data.user.name || res.data.user.email)
        console.log('   Status:', res.data.user.status)
        console.log('   Account Status:', res.data.user.accountStatus)
        
        // Attendre un peu pour que le state soit mis à jour avant la redirection
        setTimeout(() => {
          window.location.href = "/"
        }, 100)
      } else {
        console.error('❌ Pas d\'utilisateur dans la réponse:', res.data)
        window.location.href = "/"
      }
    })
    .catch(error => {
      console.error('❌ Erreur lors de la récupération de l\'utilisateur:', error)
      if (error.response) {
        console.error('   Status:', error.response.status)
        console.error('   Data:', error.response.data)
      }
      // Rediriger vers la page d'accueil même en cas d'erreur
      window.location.href = "/"
    })
  }, [setUser])

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


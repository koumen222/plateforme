import { useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'
import { CONFIG } from '../config/config'

export default function AuthCallbackPage() {
  const { setUser } = useAuth()

  useEffect(() => {
    // Attendre un peu pour que le cookie soit disponible après la redirection
    const fetchUser = async () => {
      // Essayer plusieurs fois avec un délai (le cookie peut prendre un moment à être disponible)
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          if (attempt > 0) {
            // Attendre avant de réessayer
            await new Promise(resolve => setTimeout(resolve, 500 * attempt))
          }
          
          const res = await axios.get(`${CONFIG.BACKEND_URL}/api/auth/me`, {
            withCredentials: true
          })
          
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
            return // Succès, sortir de la boucle
          } else {
            console.error('❌ Pas d\'utilisateur dans la réponse:', res.data)
            if (attempt === 2) {
              // Dernière tentative échouée
              window.location.href = "/login?error=no_token"
            }
          }
        } catch (error) {
          console.error(`❌ Erreur lors de la récupération de l'utilisateur (tentative ${attempt + 1}):`, error)
          if (error.response) {
            console.error('   Status:', error.response.status)
            console.error('   Data:', error.response.data)
            
            // Si c'est une erreur 401 (token manquant/invalide), rediriger vers login
            if (error.response.status === 401 && attempt === 2) {
              window.location.href = "/login?error=no_token"
              return
            }
          }
          
          // Si c'est la dernière tentative, rediriger vers login avec erreur
          if (attempt === 2) {
            window.location.href = "/login?error=no_token"
          }
        }
      }
    }
    
    fetchUser()
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


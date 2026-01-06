import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { CONFIG } from '../config/config'
import '../styles/login.css'

export default function LoginPage() {
  const [error, setError] = useState('')
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Si déjà authentifié, rediriger vers la page d'accueil
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/'
      navigate(from, { replace: true })
      return
    }
    
    // Vérifier les paramètres d'erreur dans l'URL
    const urlParams = new URLSearchParams(location.search)
    const errorParam = urlParams.get('error')
    if (errorParam) {
      let errorMessage = ''
      switch (errorParam) {
        case 'no_token':
          errorMessage = '❌ Erreur d\'authentification : token manquant. Veuillez réessayer.'
          break
        case 'no_user':
          errorMessage = '❌ Erreur d\'authentification : utilisateur non trouvé. Veuillez réessayer.'
          break
        case 'invalid_user_id':
          errorMessage = '❌ Erreur d\'authentification : identifiant utilisateur invalide. Veuillez réessayer.'
          break
        case 'google_auth_failed':
          errorMessage = '❌ L\'authentification Google a échoué. Veuillez réessayer.'
          break
        case 'callback_error':
          errorMessage = '❌ Erreur lors du traitement de l\'authentification. Veuillez réessayer.'
          break
        case 'auth_failed':
          errorMessage = '❌ Erreur d\'authentification. Veuillez réessayer.'
          break
        default:
          errorMessage = `❌ Erreur d'authentification : ${errorParam}. Veuillez réessayer.`
      }
      setError(errorMessage)
      // Nettoyer l'URL en supprimant le paramètre d'erreur
      navigate(location.pathname, { replace: true })
    }
  }, [isAuthenticated, navigate, location])

  const handleGoogleSignIn = () => {
    console.log('🔐 Redirection vers Google OAuth...')
    // Redirection vers le backend pour l'authentification OAuth
    window.location.href = `${CONFIG.BACKEND_URL}/auth/google`;
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>🔐 Connexion</h1>
          <p>Connectez-vous avec Google pour accéder à la plateforme</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Bouton Google - Seule méthode d'authentification */}
        {CONFIG.GOOGLE_CLIENT_ID ? (
          <div className="google-signin-container">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="google-signin-btn"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.96-2.184l-2.908-2.258c-.806.54-1.837.86-3.052.86-2.347 0-4.33-1.585-5.04-3.715H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
                <path d="M3.96 10.703c-.18-.54-.282-1.117-.282-1.703s.102-1.163.282-1.703V4.965H.957C.348 6.175 0 7.55 0 9s.348 2.825.957 4.035l3.003-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.965L3.96 7.297C4.67 5.167 6.653 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Se connecter avec Google
            </button>
          </div>
        ) : (
          <div className="error-message">
            ⚠️ L'authentification Google n'est pas configurée
          </div>
        )}

        <div className="login-footer">
          <p className="login-info">
            ℹ️ En vous connectant, votre compte sera créé automatiquement s'il n'existe pas encore.
          </p>
        </div>
      </div>
    </div>
  )
}


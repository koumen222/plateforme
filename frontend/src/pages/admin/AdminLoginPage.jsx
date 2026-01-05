import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { CONFIG } from '../../config/config'
import '../../styles/admin.css'

export default function AdminLoginPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [emailOrPhone, setEmailOrPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isRegisterMode, setIsRegisterMode] = useState(false)
  const [checkingAdmin, setCheckingAdmin] = useState(true)
  const { login, isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Vérifier si un admin existe
  useEffect(() => {
    const checkAdminExists = async () => {
      try {
        const response = await fetch(`${CONFIG.BACKEND_URL}/api/admin/check`)
        if (response.ok) {
          const data = await response.json()
          setIsRegisterMode(!data.exists) // Mode inscription si aucun admin n'existe
        }
      } catch (err) {
        console.error('Erreur vérification admin:', err)
      } finally {
        setCheckingAdmin(false)
      }
    }
    checkAdminExists()
  }, [])

  // Rediriger si déjà connecté en tant qu'admin
  useEffect(() => {
    if (isAuthenticated && user && user.role === 'superadmin') {
      navigate('/admin', { replace: true })
    }
  }, [isAuthenticated, user, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isRegisterMode) {
        // Mode inscription : créer le premier admin
        if (!name || !email || !phoneNumber || !password) {
          setError('Tous les champs sont requis (nom, email, téléphone, mot de passe)')
          setLoading(false)
          return
        }
        const response = await fetch(`${CONFIG.BACKEND_URL}/api/admin/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name, email, phoneNumber, password }),
        })

        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text()
          console.error('Réponse non-JSON reçue:', text.substring(0, 200))
          throw new Error(`Erreur serveur (${response.status}): ${response.statusText}`)
        }

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Erreur lors de la création du compte')
        }

        // Connexion automatique après création
        const { token: newToken, user: userData } = data
        localStorage.setItem('token', newToken)
        localStorage.setItem('user', JSON.stringify(userData))
        
        // Recharger la page pour mettre à jour le contexte auth
        window.location.href = '/admin'
      } else {
        // Mode connexion : utiliser la fonction login du contexte
        if (!emailOrPhone || !password) {
          setError('Email/téléphone et mot de passe requis')
          setLoading(false)
          return
        }
        const result = await login(emailOrPhone, password)

        if (result.success) {
          // Vérifier que l'utilisateur est admin ou superadmin
          const currentUser = JSON.parse(localStorage.getItem('user'))
          if (currentUser && currentUser.role === 'superadmin') {
            navigate('/admin', { replace: true })
          } else {
            setError('Accès refusé. Seuls les administrateurs peuvent accéder à cet espace.')
            // Déconnecter l'utilisateur
            localStorage.removeItem('token')
            localStorage.removeItem('user')
          }
        } else {
          setError(result.error || 'Une erreur est survenue')
        }
      }
    } catch (err) {
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  if (checkingAdmin) {
    return (
      <div className="admin-login-container">
        <div className="admin-login-card">
          <div className="admin-login-header">
            <div className="admin-logo">🔐</div>
            <h1>Espace Administrateur</h1>
            <p>Vérification...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <div className="admin-logo">🔐</div>
          <h1>Espace Administrateur</h1>
          <p>
            {isRegisterMode 
              ? 'Créez le compte administrateur (première connexion uniquement)'
              : "Connectez-vous pour accéder au panneau d'administration"}
          </p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-login-form">
          {isRegisterMode && (
            <div className="form-group">
              <label htmlFor="name">Nom complet</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={isRegisterMode}
                placeholder="Votre nom complet"
                disabled={loading}
                minLength={2}
              />
            </div>
          )}

          {isRegisterMode ? (
            <>
              <div className="form-group">
                <label htmlFor="email">Email administrateur</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@example.com"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="phoneNumber">Numéro de téléphone</label>
                <input
                  type="tel"
                  id="phoneNumber"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  placeholder="+237 6 76 77 83 77"
                  disabled={loading}
                />
              </div>
            </>
          ) : (
            <div className="form-group">
              <label htmlFor="emailOrPhone">Email ou numéro de téléphone</label>
              <input
                type="text"
                id="emailOrPhone"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                required
                placeholder="admin@example.com ou +237 6 76 77 83 77"
                disabled={loading}
              />
              <small className="form-help">
                Vous pouvez vous connecter avec votre email ou votre numéro de téléphone
              </small>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="admin-login-btn"
            disabled={loading}
          >
            {loading 
              ? (isRegisterMode ? 'Création...' : 'Connexion...') 
              : (isRegisterMode ? 'Créer le compte administrateur' : 'Se connecter')}
          </button>
        </form>

        <div className="admin-login-footer">
          <a href="/" className="back-link">
            ← Retour à la plateforme
          </a>
        </div>
      </div>
    </div>
  )
}

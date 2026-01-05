import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import '../styles/login.css'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, register, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Rediriger si déjà connecté
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/'
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, location])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = isLogin 
        ? await login(email, password)
        : await register(email, password)

      if (result.success) {
        const from = location.state?.from?.pathname || '/'
        navigate(from, { replace: true })
      } else {
        setError(result.error || 'Une erreur est survenue')
      }
    } catch (err) {
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>🔐 {isLogin ? 'Connexion' : 'Inscription'}</h1>
          <p>
            {isLogin 
              ? 'Connectez-vous pour accéder aux vidéos de formation'
              : 'Créez votre compte pour commencer votre formation'}
          </p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="votre@email.com"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              minLength={6}
              disabled={loading}
            />
            {!isLogin && (
              <small className="form-help">
                Minimum 6 caractères
              </small>
            )}
          </div>

          <button 
            type="submit" 
            className="login-btn"
            disabled={loading}
          >
            {loading ? 'Chargement...' : (isLogin ? 'Se connecter' : 'S\'inscrire')}
          </button>
        </form>

        <div className="login-footer">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin)
              setError('')
            }}
            className="toggle-mode-btn"
            disabled={loading}
          >
            {isLogin 
              ? 'Pas encore de compte ? S\'inscrire'
              : 'Déjà un compte ? Se connecter'}
          </button>
        </div>

        {!isLogin && (
          <div className="register-note">
            <p>ℹ️ Après l'inscription, votre compte sera en attente de validation par l'administrateur.</p>
          </div>
        )}
      </div>
    </div>
  )
}


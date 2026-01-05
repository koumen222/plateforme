import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import '../styles/login.css'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [emailOrPhone, setEmailOrPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, register, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Vérifier si on doit afficher le mode inscription depuis l'état
  useEffect(() => {
    if (location.state?.register) {
      setIsLogin(false)
    }
  }, [location.state])

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
      let result
      if (isLogin) {
        // Connexion : utiliser emailOrPhone
        if (!emailOrPhone || !password) {
          setError('Email/téléphone et mot de passe requis')
          setLoading(false)
          return
        }
        result = await login(emailOrPhone, password)
      } else {
        // Inscription : utiliser name, email, phoneNumber, password
        if (!name || !email || !phoneNumber || !password) {
          setError('Tous les champs sont requis')
          setLoading(false)
          return
        }
        result = await register(name, email, phoneNumber, password)
      }

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
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="name">Nom complet</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLogin}
                placeholder="Votre nom complet"
                disabled={loading}
                minLength={2}
              />
            </div>
          )}

          {isLogin ? (
            <div className="form-group">
              <label htmlFor="emailOrPhone">Email ou numéro de téléphone</label>
              <input
                type="text"
                id="emailOrPhone"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                required
                placeholder="votre@email.com ou +237 6 76 77 83 77"
                disabled={loading}
              />
              <small className="form-help">
                Vous pouvez vous connecter avec votre email ou votre numéro de téléphone
              </small>
            </div>
          ) : (
            <>
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
                <label htmlFor="phoneNumber">Numéro de téléphone</label>
                <div className="phone-input-wrapper">
                  <span className="phone-indicator">+237</span>
                  <input
                    type="tel"
                    id="phoneNumber"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                    placeholder="6 76 77 83 77"
                    disabled={loading}
                    className="phone-input"
                  />
                </div>
              </div>
            </>
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
              // Réinitialiser les champs lors du changement de mode
              setName('')
              setEmail('')
              setPhoneNumber('')
              setEmailOrPhone('')
              setPassword('')
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


import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { countries } from '../data/countries'
import '../styles/login.css'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [emailOrPhone, setEmailOrPhone] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, register, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [selectedCountry, setSelectedCountry] = useState(countries.find(c => c.code === 'CM') || countries[0])
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [countrySearchTerm, setCountrySearchTerm] = useState('')

  // Vérifier si on doit afficher le mode inscription depuis l'état
  useEffect(() => {
    if (location.state?.register) {
      setIsLogin(false)
    }
    if (isAuthenticated) {
      // Toujours rediriger vers la page d'accueil après connexion
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, navigate, location])

  // Fermer le dropdown de pays quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showCountryDropdown && !e.target.closest('.country-selector')) {
        setShowCountryDropdown(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showCountryDropdown])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      let result
      if (isLogin) {
        // Connexion : utiliser emailOrPhone
        if (!emailOrPhone || !password) {
          setError('⚠️ Veuillez remplir tous les champs : email/téléphone et mot de passe sont requis')
          setLoading(false)
          return
        }
        result = await login(emailOrPhone, password)
      } else {
        // Inscription : utiliser name, email, phoneNumber, password
        if (!name || !email || !phoneNumber || !password) {
          setError('⚠️ Veuillez remplir tous les champs : nom, email, téléphone et mot de passe sont requis')
          setLoading(false)
          return
        }
        // Validation du nom
        if (name.trim().length < 2) {
          setError('⚠️ Le nom doit contenir au moins 2 caractères')
          setLoading(false)
          return
        }
        // Validation de l'email
        const emailRegex = /^\S+@\S+\.\S+$/
        if (!emailRegex.test(email)) {
          setError('⚠️ Veuillez entrer une adresse email valide (exemple : votre@email.com)')
          setLoading(false)
          return
        }
        // Validation du téléphone
        if (phoneNumber.trim().length < 5) {
          setError('⚠️ Veuillez entrer un numéro de téléphone valide')
          setLoading(false)
          return
        }
        // Validation du mot de passe
        if (password.length < 6) {
          setError('⚠️ Le mot de passe doit contenir au moins 6 caractères')
          setLoading(false)
          return
        }
        // Ajouter le préfixe du pays sélectionné si pas déjà présent
        let finalPhoneNumber = phoneNumber.trim()
        if (!finalPhoneNumber.startsWith('+')) {
          // Si aucun préfixe, ajouter celui du pays sélectionné
          finalPhoneNumber = `${selectedCountry.dialCode}${finalPhoneNumber}`
        }
        
        result = await register(name, email, finalPhoneNumber, password)
      }

      if (result.success) {
        // Toujours rediriger vers la page d'accueil après inscription/connexion
        navigate('/', { replace: true })
      } else {
        // Messages d'erreur plus clairs pour l'utilisateur
        const errorMessage = result.error || 'Une erreur est survenue'
        let userFriendlyError = errorMessage
        
        // Traduire les erreurs techniques en messages compréhensibles
        if (errorMessage.includes('Email/téléphone ou mot de passe incorrect')) {
          userFriendlyError = 'Email/téléphone ou mot de passe incorrect. Vérifiez vos identifiants et réessayez.'
        } else if (errorMessage.includes('Compte en attente')) {
          userFriendlyError = 'Votre compte est en attente de validation. Contactez l\'administrateur pour activer votre compte.'
        } else if (errorMessage.includes('déjà utilisé')) {
          if (errorMessage.includes('email')) {
            userFriendlyError = 'Cet email est déjà utilisé. Utilisez un autre email ou connectez-vous avec ce compte.'
          } else if (errorMessage.includes('téléphone')) {
            userFriendlyError = 'Ce numéro de téléphone est déjà utilisé. Utilisez un autre numéro ou connectez-vous avec ce compte.'
          }
        } else if (errorMessage.includes('champs sont requis')) {
          userFriendlyError = '⚠️ ' + errorMessage
        } else if (errorMessage.includes('caractères')) {
          userFriendlyError = '⚠️ ' + errorMessage
        } else if (errorMessage.includes('Erreur serveur')) {
          userFriendlyError = 'Erreur de connexion au serveur. Veuillez réessayer dans quelques instants.'
        } else if (errorMessage.includes('Erreur')) {
          userFriendlyError = errorMessage
        }
        
        setError(userFriendlyError)
      }
    } catch (err) {
      // Messages d'erreur pour les exceptions
      let errorMessage = 'Une erreur est survenue'
      if (err.message) {
        if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
          errorMessage = 'Problème de connexion. Vérifiez votre connexion internet et réessayez.'
        } else if (err.message.includes('JSON')) {
          errorMessage = 'Erreur de communication avec le serveur. Veuillez réessayer.'
        } else {
          errorMessage = err.message
        }
      }
      setError(errorMessage)
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
                required
                placeholder="Votre nom complet"
                disabled={loading}
                minLength={2}
              />
            </div>
          )}

          {isLogin ? (
            <div className="form-group">
              <label htmlFor="emailOrPhone">Email ou Téléphone</label>
              <input
                type="text"
                id="emailOrPhone"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                required
                placeholder="votre@email.com ou +237 6 76 77 83 77"
                disabled={loading}
              />
            </div>
          ) : (
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
          )}

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="phoneNumber">Numéro de téléphone</label>
              <div className="phone-input-wrapper">
                <div className="country-selector">
                  <button
                    type="button"
                    className="country-selector-btn"
                    onClick={(e) => {
                      e.preventDefault()
                      setShowCountryDropdown(!showCountryDropdown)
                      if (!showCountryDropdown) {
                        setCountrySearchTerm('')
                      }
                    }}
                    disabled={loading}
                  >
                    <span className="country-flag">{selectedCountry.flag}</span>
                    <span className="country-dial-code">{selectedCountry.dialCode}</span>
                    <span className="country-arrow">▼</span>
                  </button>
                  {showCountryDropdown && (
                    <div className="country-dropdown">
                      <input
                        type="text"
                        className="country-search"
                        placeholder="Rechercher un pays..."
                        value={countrySearchTerm}
                        onFocus={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          setCountrySearchTerm(e.target.value)
                        }}
                      />
                      <div className="country-list">
                        {countries
                          .filter(country => {
                            if (!countrySearchTerm) return true
                            const searchTerm = countrySearchTerm.toLowerCase()
                            return (
                              country.name.toLowerCase().includes(searchTerm) ||
                              country.dialCode.includes(searchTerm) ||
                              country.code.toLowerCase().includes(searchTerm)
                            )
                          })
                          .map((country) => (
                            <div
                              key={country.code}
                              className={`country-option ${selectedCountry.code === country.code ? 'selected' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedCountry(country)
                                setShowCountryDropdown(false)
                                setCountrySearchTerm('')
                              }}
                            >
                              <span className="country-flag">{country.flag}</span>
                              <span className="country-name">{country.name}</span>
                              <span className="country-dial-code">{country.dialCode}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
                <input
                  type="tel"
                  id="phoneNumber"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  placeholder="6 76 77 83 77"
                  disabled={loading}
                  className="phone-number-input"
                />
              </div>
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


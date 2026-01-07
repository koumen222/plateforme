import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { countries } from '../data/countries'
import { FiUser, FiMail, FiPhone, FiLock, FiChevronDown, FiSearch, FiGlobe } from 'react-icons/fi'

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

  useEffect(() => {
    if (location.state?.register) {
      setIsLogin(false)
    }
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/'
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, location])

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
        if (!emailOrPhone || !password) {
          setError('⚠️ Veuillez remplir tous les champs : email/téléphone et mot de passe sont requis')
          setLoading(false)
          return
        }
        result = await login(emailOrPhone, password)
      } else {
        if (!name || !email || !phoneNumber || !password) {
          setError('⚠️ Veuillez remplir tous les champs : nom, email, téléphone et mot de passe sont requis')
          setLoading(false)
          return
        }
        if (name.trim().length < 2) {
          setError('⚠️ Le nom doit contenir au moins 2 caractères')
          setLoading(false)
          return
        }
        const emailRegex = /^\S+@\S+\.\S+$/
        if (!emailRegex.test(email)) {
          setError('⚠️ Veuillez entrer une adresse email valide (exemple : votre@email.com)')
          setLoading(false)
          return
        }
        if (phoneNumber.trim().length < 5) {
          setError('⚠️ Veuillez entrer un numéro de téléphone valide')
          setLoading(false)
          return
        }
        if (password.length < 6) {
          setError('⚠️ Le mot de passe doit contenir au moins 6 caractères')
          setLoading(false)
          return
        }
        let finalPhoneNumber = phoneNumber.trim()
        if (!finalPhoneNumber.startsWith('+')) {
          finalPhoneNumber = `${selectedCountry.dialCode}${finalPhoneNumber}`
        }
        
        result = await register(name, email, finalPhoneNumber, password)
      }

      if (result.success) {
        const from = location.state?.from?.pathname || '/'
        navigate(from, { replace: true })
      } else {
        const errorMessage = result.error || 'Une erreur est survenue'
        let userFriendlyError = errorMessage
        
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

  const filteredCountries = countries.filter(country => {
    if (!countrySearchTerm) return true
    const searchTerm = countrySearchTerm.toLowerCase()
    return (
      country.name.toLowerCase().includes(searchTerm) ||
      country.dialCode.includes(searchTerm) ||
      country.code.toLowerCase().includes(searchTerm)
    )
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/95 to-accent/10 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="card-startup p-8 sm:p-10 shadow-2xl border-accent/20">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-accent to-accent/70 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <FiLock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-3">
              {isLogin ? 'Connexion' : 'Créer un compte'}
            </h1>
            <p className="text-secondary">
              {isLogin 
                ? 'Accédez à votre espace de formation'
                : 'Rejoignez la communauté des entrepreneurs'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                  <FiUser className="w-4 h-4" />
                  Nom complet
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Votre nom complet"
                  disabled={loading}
                  minLength={2}
                  className="input-startup"
                />
              </div>
            )}

            {isLogin ? (
              <div>
                <label htmlFor="emailOrPhone" className="block text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                  <FiMail className="w-4 h-4" />
                  Email ou Téléphone
                </label>
                <input
                  type="text"
                  id="emailOrPhone"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  required
                  placeholder="votre@email.com ou +237 6 76 77 83 77"
                  disabled={loading}
                  className="input-startup"
                />
              </div>
            ) : (
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                  <FiMail className="w-4 h-4" />
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="votre@email.com"
                  disabled={loading}
                  className="input-startup"
                />
              </div>
            )}

            {!isLogin && (
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                  <FiPhone className="w-4 h-4" />
                  Numéro de téléphone
                </label>
                <div className="flex gap-2">
                  <div className="relative country-selector">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        setShowCountryDropdown(!showCountryDropdown)
                        if (!showCountryDropdown) {
                          setCountrySearchTerm('')
                        }
                      }}
                      disabled={loading}
                      className="flex items-center gap-2 px-3 py-3 border border-theme rounded-xl bg-card text-primary hover:bg-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
                    >
                      <span className="text-lg">{selectedCountry.flag}</span>
                      <span className="text-sm font-medium">{selectedCountry.dialCode}</span>
                      <FiChevronDown className={`w-4 h-4 transition-transform ${showCountryDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showCountryDropdown && (
                      <div className="absolute z-50 mt-2 w-full bg-card border border-theme rounded-xl shadow-2xl max-h-80 overflow-hidden">
                        <div className="p-3 border-b border-theme">
                          <div className="relative">
                            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary" />
                            <input
                              type="text"
                              placeholder="Rechercher un pays..."
                              value={countrySearchTerm}
                              onFocus={(e) => e.stopPropagation()}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => setCountrySearchTerm(e.target.value)}
                              className="w-full pl-10 pr-4 py-2 bg-secondary text-primary rounded-lg focus:outline-none"
                            />
                          </div>
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                          {filteredCountries.map((country) => (
                            <div
                              key={country.code}
                              className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-hover transition-colors ${
                                selectedCountry.code === country.code ? 'bg-accent/10 border-l-4 border-l-accent' : ''
                              }`}
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedCountry(country)
                                setShowCountryDropdown(false)
                                setCountrySearchTerm('')
                              }}
                            >
                              <span className="text-lg">{country.flag}</span>
                              <div className="flex-1">
                                <span className="block text-sm font-medium text-primary">{country.name}</span>
                                <span className="block text-xs text-secondary">{country.dialCode}</span>
                              </div>
                              {selectedCountry.code === country.code && (
                                <div className="w-2 h-2 bg-accent rounded-full"></div>
                              )}
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
                    className="input-startup flex-1"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                <FiLock className="w-4 h-4" />
                Mot de passe
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                minLength={6}
                disabled={loading}
                className="input-startup"
              />
              {!isLogin && (
                <small className="mt-1 block text-xs text-secondary pl-6">
                  Minimum 6 caractères
                </small>
              )}
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary w-full py-3 px-4 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Chargement...
                </>
              ) : (
                <>
                  {isLogin ? 'Se connecter' : 'S\'inscrire'}
                  <FiChevronDown className="w-4 h-4 transform rotate-90" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Mode */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin)
                setError('')
                setName('')
                setEmail('')
                setEmailOrPhone('')
                setPhoneNumber('')
                setPassword('')
              }}
              disabled={loading}
              className="text-sm text-accent hover:text-accent/80 font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mx-auto"
            >
              {isLogin 
                ? <>
                    <FiUser className="w-4 h-4" />
                    Pas encore de compte ? S'inscrire
                  </>
                : <>
                    <FiLock className="w-4 h-4" />
                    Déjà un compte ? Se connecter
                  </>}
            </button>
          </div>

          {/* Info Note */}
          {!isLogin && (
            <div className="mt-6 p-4 bg-accent/10 border border-accent/30 rounded-xl">
              <div className="flex items-start gap-3">
                <FiGlobe className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <p className="text-sm text-primary">
                  <span className="font-semibold text-accent">Info :</span> Après l'inscription, votre compte sera activé par l'administrateur dans les plus brefs délais.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
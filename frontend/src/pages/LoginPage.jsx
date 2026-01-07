import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { countries } from '../data/countries'

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
      // Rediriger vers la page d'origine ou la page d'accueil par défaut
      const from = location.state?.from?.pathname || '/'
      console.log('✅ Connexion réussie - Redirection vers:', from)
      navigate(from, { replace: true })
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
        // Rediriger vers la page d'origine ou la page d'accueil par défaut
        const from = location.state?.from?.pathname || '/'
        console.log('✅ Connexion/Inscription réussie - Redirection vers:', from)
        navigate(from, { replace: true })
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
    <div className="min-h-screen bg-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 sm:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
              🔐 {isLogin ? 'Connexion' : 'Inscription'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {isLogin 
                ? 'Connectez-vous pour accéder aux vidéos de formation'
                : 'Créez votre compte pour commencer votre formation'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
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
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#8B5E3C] focus:border-[#8B5E3C] bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                />
              </div>
            )}

            {isLogin ? (
              <div>
                <label htmlFor="emailOrPhone" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
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
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#8B5E3C] focus:border-[#8B5E3C] bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                />
              </div>
            ) : (
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
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
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#8B5E3C] focus:border-[#8B5E3C] bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                />
              </div>
            )}

            {!isLogin && (
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Numéro de téléphone
                </label>
                <div className="flex gap-2">
                  <div className="relative">
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
                      className="flex items-center gap-2 px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span>{selectedCountry.flag}</span>
                      <span className="text-sm font-medium">{selectedCountry.dialCode}</span>
                      <span className="text-xs">▼</span>
                    </button>
                    {showCountryDropdown && (
                      <div className="absolute z-50 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-80 overflow-hidden">
                        <input
                          type="text"
                          placeholder="Rechercher un pays..."
                          value={countrySearchTerm}
                          onFocus={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => setCountrySearchTerm(e.target.value)}
                          className="w-full px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                        />
                        <div className="max-h-60 overflow-y-auto">
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
                                className={`flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                                  selectedCountry.code === country.code ? 'bg-brand-50 dark:bg-brand-900/20' : ''
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedCountry(country)
                                  setShowCountryDropdown(false)
                                  setCountrySearchTerm('')
                                }}
                              >
                                <span className="text-lg">{country.flag}</span>
                                <span className="flex-1 text-sm text-gray-900 dark:text-white">{country.name}</span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">{country.dialCode}</span>
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
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#8B5E3C] focus:border-[#8B5E3C] bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
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
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#8B5E3C] focus:border-[#8B5E3C] bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              />
              {!isLogin && (
                <small className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                  Minimum 6 caractères
                </small>
              )}
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 px-4 bg-brand hover:bg-brand-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md transition-all duration-200"
            >
              {loading ? 'Chargement...' : (isLogin ? 'Se connecter' : 'S\'inscrire')}
            </button>
          </form>

          {/* Toggle Mode */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin)
                setError('')
              }}
              disabled={loading}
              className="text-sm text-brand dark:text-brand-400 hover:text-brand-600 dark:hover:text-brand-500 font-medium transition-colors disabled:opacity-50"
            >
              {isLogin 
                ? 'Pas encore de compte ? S\'inscrire'
                : 'Déjà un compte ? Se connecter'}
            </button>
          </div>

          {/* Register Note */}
          {!isLogin && (
            <div className="mt-6 p-4 bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-lg">
              <p className="text-sm text-brand-700 dark:text-brand-400 text-center">
                ℹ️ Après l'inscription, votre compte sera en attente de validation par l'administrateur.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


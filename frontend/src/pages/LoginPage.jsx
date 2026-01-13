import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { countries } from '../data/countries'
import { FiUser, FiMail, FiPhone, FiLock, FiChevronDown, FiSearch, FiGlobe, FiEye, FiEyeOff } from 'react-icons/fi'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [emailOrPhone, setEmailOrPhone] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, register, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [selectedCountry, setSelectedCountry] = useState(countries.find(c => c.code === 'CM') || countries[0])
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [countrySearchTerm, setCountrySearchTerm] = useState('')
  
  // Validation en temps réel
  const [fieldErrors, setFieldErrors] = useState({})
  const [touchedFields, setTouchedFields] = useState({})

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

  // Validation en temps réel
  const validateField = (fieldName, value) => {
    const errors = { ...fieldErrors }
    
    if (!touchedFields[fieldName]) {
      delete errors[fieldName]
      setFieldErrors(errors)
      return
    }

    switch (fieldName) {
      case 'name':
        if (!value || value.trim().length === 0) {
          errors.name = 'Le nom est requis'
        } else if (value.trim().length < 2) {
          errors.name = 'Le nom doit contenir au moins 2 caractères'
        } else {
          delete errors.name
        }
        break
      case 'email':
        if (!value || value.trim().length === 0) {
          errors.email = 'L\'email est requis'
        } else {
          const emailRegex = /^\S+@\S+\.\S+$/
          if (!emailRegex.test(value)) {
            errors.email = 'Veuillez entrer une adresse email valide'
          } else {
            delete errors.email
          }
        }
        break
      case 'phoneNumber':
        if (!value || value.trim().length === 0) {
          errors.phoneNumber = 'Le numéro de téléphone est requis'
        } else if (value.trim().length < 5) {
          errors.phoneNumber = 'Veuillez entrer un numéro de téléphone valide'
        } else {
          delete errors.phoneNumber
        }
        break
      case 'password':
        if (!value || value.length === 0) {
          errors.password = 'Le mot de passe est requis'
        } else if (value.length < 6) {
          errors.password = 'Le mot de passe doit contenir au moins 6 caractères'
        } else {
          delete errors.password
        }
        break
      case 'emailOrPhone':
        if (!value || value.trim().length === 0) {
          errors.emailOrPhone = 'L\'email ou le téléphone est requis'
        } else {
          delete errors.emailOrPhone
        }
        break
      default:
        break
    }
    
    setFieldErrors(errors)
  }

  const handleFieldChange = (fieldName, value, setter) => {
    setter(value)
    if (!touchedFields[fieldName]) {
      setTouchedFields({ ...touchedFields, [fieldName]: true })
    }
    // Délai pour éviter trop de validations pendant la saisie
    setTimeout(() => validateField(fieldName, value), 300)
  }

  const handleFieldBlur = (fieldName, value) => {
    setTouchedFields({ ...touchedFields, [fieldName]: true })
    validateField(fieldName, value)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    // Marquer tous les champs comme touchés
    const allFieldsTouched = isLogin 
      ? { emailOrPhone: true, password: true }
      : { name: true, email: true, phoneNumber: true, password: true }
    setTouchedFields(allFieldsTouched)
    
    // Valider tous les champs
    if (isLogin) {
      validateField('emailOrPhone', emailOrPhone)
      validateField('password', password)
    } else {
      validateField('name', name)
      validateField('email', email)
      validateField('phoneNumber', phoneNumber)
      validateField('password', password)
    }
    
    // Vérifier s'il y a des erreurs
    const hasErrors = Object.keys(fieldErrors).length > 0
    if (hasErrors) {
      setError('⚠️ Veuillez corriger les erreurs dans le formulaire')
      setLoading(false)
      return
    }
    
    // Vérification finale avant soumission
    if (isLogin) {
      if (!emailOrPhone || !password) {
        setError('⚠️ Veuillez remplir tous les champs')
        setLoading(false)
        return
      }
    } else {
      if (!name || !email || !phoneNumber || !password) {
        setError('⚠️ Veuillez remplir tous les champs')
        setLoading(false)
        return
      }
    }
    
    setLoading(true)

    try {
      let result
      if (isLogin) {
        result = await login(emailOrPhone, password)
      } else {
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
            <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
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
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-700 dark:text-red-400 flex-1">{error}</p>
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
                  onChange={(e) => handleFieldChange('name', e.target.value, setName)}
                  onBlur={(e) => handleFieldBlur('name', e.target.value)}
                  required
                  placeholder="Votre nom complet"
                  disabled={loading}
                  minLength={2}
                  className={`input-startup ${fieldErrors.name ? 'border-red-500 focus:border-red-500' : ''}`}
                />
                {fieldErrors.name && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400 pl-6">{fieldErrors.name}</p>
                )}
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
                  onChange={(e) => handleFieldChange('emailOrPhone', e.target.value, setEmailOrPhone)}
                  onBlur={(e) => handleFieldBlur('emailOrPhone', e.target.value)}
                  required
                  placeholder="votre@email.com ou +237 6 76 77 83 77"
                  disabled={loading}
                  className={`input-startup ${fieldErrors.emailOrPhone ? 'border-red-500 focus:border-red-500' : ''}`}
                />
                {fieldErrors.emailOrPhone && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400 pl-6">{fieldErrors.emailOrPhone}</p>
                )}
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
                  onChange={(e) => handleFieldChange('email', e.target.value, setEmail)}
                  onBlur={(e) => handleFieldBlur('email', e.target.value)}
                  required
                  placeholder="votre@email.com"
                  disabled={loading}
                  className={`input-startup ${fieldErrors.email ? 'border-red-500 focus:border-red-500' : ''}`}
                />
                {fieldErrors.email && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400 pl-6">{fieldErrors.email}</p>
                )}
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
                    onChange={(e) => handleFieldChange('phoneNumber', e.target.value, setPhoneNumber)}
                    onBlur={(e) => handleFieldBlur('phoneNumber', e.target.value)}
                    required
                    placeholder="6 76 77 83 77"
                    disabled={loading}
                    className={`input-startup flex-1 ${fieldErrors.phoneNumber ? 'border-red-500 focus:border-red-500' : ''}`}
                  />
                </div>
                {fieldErrors.phoneNumber && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400 pl-6">{fieldErrors.phoneNumber}</p>
                )}
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                <FiLock className="w-4 h-4" />
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => handleFieldChange('password', e.target.value, setPassword)}
                  onBlur={(e) => handleFieldBlur('password', e.target.value)}
                  required
                  placeholder="••••••••"
                  minLength={6}
                  disabled={loading}
                  className={`input-startup pr-12 ${fieldErrors.password ? 'border-red-500 focus:border-red-500' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary transition-colors disabled:opacity-50"
                  disabled={loading}
                  tabIndex={-1}
                >
                  {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                </button>
              </div>
              {fieldErrors.password ? (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400 pl-6">{fieldErrors.password}</p>
              ) : !isLogin && (
                <small className="mt-1 block text-xs text-secondary pl-6">
                  Minimum 6 caractères
                </small>
              )}
            </div>

            <button 
              type="submit" 
              disabled={loading || Object.keys(fieldErrors).length > 0}
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
                setFieldErrors({})
                setTouchedFields({})
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
import { createContext, useContext, useState, useEffect } from 'react'
import { CONFIG } from '../config/config'
import axios from 'axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(() => {
    // Charger le token depuis localStorage au démarrage
    return localStorage.getItem('token') || null
  })

  useEffect(() => {
    console.log('🔐 ========== AUTH CONTEXT INIT ==========')
    
    // Récupérer le token depuis localStorage
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    
    if (storedToken) {
      console.log('✅ Token trouvé dans localStorage')
      console.log('   - Token length:', storedToken.length)
      setToken(storedToken)
      
      // Si on a aussi l'utilisateur en cache, l'utiliser temporairement
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser)
          setUser(userData)
          console.log('✅ Utilisateur chargé depuis localStorage:', userData.email)
        } catch (e) {
          console.error('❌ Erreur parsing user depuis localStorage:', e)
        }
      }
      
      // Vérifier le token avec le backend
      axios.get(`${CONFIG.BACKEND_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${storedToken}`
        },
        withCredentials: true
      })
      .then(res => {
        if (res.data.success && res.data.user) {
          const userData = res.data.user
          setUser(userData)
          // Mettre à jour le localStorage avec les données fraîches
          localStorage.setItem('user', JSON.stringify(userData))
          console.log('✅ Token valide - Utilisateur:', userData.email)
          console.log('   - Status:', userData.status)
          console.log('   - Role:', userData.role)
        } else {
          console.error('❌ Réponse invalide du serveur')
          // Token invalide, nettoyer
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setToken(null)
          setUser(null)
        }
      })
      .catch(error => {
        // Ne pas nettoyer si c'est juste une erreur 401 et qu'on a déjà un utilisateur en cache
        // Cela peut arriver si le token vient d'être créé et n'est pas encore reconnu
        if (error.response?.status === 401) {
          // Si on a un utilisateur en cache, garder les données et juste logger
          if (storedUser) {
            console.log('⚠️ Token invalide mais utilisateur en cache conservé')
            // Ne pas nettoyer, garder l'utilisateur en cache
          } else {
            // Pas d'utilisateur en cache, nettoyer
            console.log('⚠️ Token invalide, nettoyage')
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            setToken(null)
            setUser(null)
          }
        } else {
          console.error('❌ Erreur lors de la vérification du token:', error.response?.status || error.message)
          // Nettoyer en cas d'erreur serveur seulement si pas d'utilisateur en cache
          if (!storedUser) {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            setToken(null)
            setUser(null)
          }
        }
      })
      .finally(() => {
        setLoading(false)
        console.log('🔐 ========== FIN AUTH CONTEXT INIT ==========')
      })
    } else {
      console.log('⚠️ Pas de token dans localStorage')
      setToken(null)
      setUser(null)
      setLoading(false)
      console.log('🔐 ========== FIN AUTH CONTEXT INIT ==========')
    }
  }, [])

  const login = async (emailOrPhone, password) => {
    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emailOrPhone, password }),
      })

      // Vérifier si la réponse est du JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        console.error('Réponse non-JSON reçue:', text.substring(0, 200))
        throw new Error(`Erreur serveur (${response.status}): ${response.statusText}`)
      }

      const data = await response.json()

      if (!response.ok) {
        // Messages d'erreur plus clairs
        let errorMessage = data.error || 'Erreur de connexion'
        if (data.error) {
          if (data.error.includes('Compte en attente')) {
            errorMessage = 'Compte en attente de validation par l\'administrateur'
          } else if (data.error.includes('incorrect')) {
            errorMessage = 'Email/téléphone ou mot de passe incorrect'
          }
        }
        throw new Error(errorMessage)
      }

      const { token: newToken, user: userData } = data
      
      // S'assurer que le nom est présent
      if (userData && !userData.name) {
        console.warn('⚠️ Nom utilisateur manquant dans la réponse:', userData)
      }
      
      console.log('✅ Connexion réussie - Utilisateur:', userData?.name || userData?.email)
      
      if (!newToken) {
        console.error('❌ ERREUR: Pas de token dans la réponse de connexion!')
        throw new Error('Token manquant dans la réponse du serveur')
      }
      
      if (!userData) {
        console.error('❌ ERREUR: Pas de données utilisateur dans la réponse!')
        throw new Error('Données utilisateur manquantes dans la réponse du serveur')
      }
      
      console.log('   - Token reçu, length:', newToken.length)
      console.log('   - User data:', { name: userData.name, email: userData.email, status: userData.status })
      
      // Stocker le token et l'utilisateur
      setToken(newToken)
      setUser(userData)
      localStorage.setItem('token', newToken)
      localStorage.setItem('user', JSON.stringify(userData))
      
      // Vérifier que le token est bien stocké
      const storedToken = localStorage.getItem('token')
      if (storedToken !== newToken) {
        console.error('❌ Erreur: Token non correctement stocké dans localStorage')
        console.error('   - Token original:', newToken.substring(0, 20) + '...')
        console.error('   - Token stocké:', storedToken?.substring(0, 20) + '...')
      } else {
        console.log('✅ Token correctement stocké dans localStorage')
      }
      
      return { success: true }
    } catch (error) {
      console.error('Erreur login:', error)
      return { success: false, error: error.message }
    }
  }

  const register = async (name, email, phoneNumber, password) => {
    try {
      console.log('📤 Envoi inscription:', { name: name.trim(), email, phoneNumber: phoneNumber.trim() });
      
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name: name.trim(), 
          email: email.trim(), 
          phoneNumber: phoneNumber.trim(), 
          password 
        }),
      })

      // Vérifier si la réponse est du JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        console.error('Réponse non-JSON reçue:', text.substring(0, 200))
        throw new Error(`Erreur serveur (${response.status}): ${response.statusText}`)
      }

      const data = await response.json()

      if (!response.ok) {
        // Messages d'erreur plus clairs pour l'inscription
        let errorMessage = data.error || 'Erreur lors de l\'inscription'
        if (data.error) {
          if (data.error.includes('déjà utilisé')) {
            if (data.error.includes('email')) {
              errorMessage = 'Cet email est déjà utilisé. Utilisez un autre email ou connectez-vous.'
            } else if (data.error.includes('téléphone')) {
              errorMessage = 'Ce numéro de téléphone est déjà utilisé. Utilisez un autre numéro ou connectez-vous.'
            }
          } else if (data.error.includes('champs sont requis')) {
            errorMessage = data.error
          } else if (data.error.includes('caractères')) {
            errorMessage = data.error
          }
        }
        throw new Error(errorMessage)
      }

      const { token: newToken, user: userData } = data
      
      console.log('📥 Données reçues du serveur:', userData);
      
      // S'assurer que le nom et le téléphone sont présents
      if (userData) {
        if (!userData.name) {
          console.warn('⚠️ Nom utilisateur manquant dans la réponse:', userData)
        }
        if (!userData.phoneNumber) {
          console.warn('⚠️ Téléphone utilisateur manquant dans la réponse:', userData)
        }
        console.log(`✅ Inscription réussie - Nom: "${userData.name || 'MANQUANT'}", Téléphone: "${userData.phoneNumber || 'MANQUANT'}"`);
      }
      
      setToken(newToken)
      setUser(userData)
      localStorage.setItem('token', newToken)
      localStorage.setItem('user', JSON.stringify(userData))
      
      // Vérifier que les données sont bien stockées
      const storedUser = JSON.parse(localStorage.getItem('user'));
      console.log('💾 Données stockées dans localStorage:', storedUser);
      
      return { success: true }
    } catch (error) {
      console.error('Erreur register:', error)
      return { success: false, error: error.message }
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const updateUser = (userData) => {
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const updateProfile = async (name, phoneNumber) => {
    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, phoneNumber }),
      })

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        console.error('Réponse non-JSON reçue:', text.substring(0, 200))
        throw new Error(`Erreur serveur (${response.status}): ${response.statusText}`)
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la mise à jour du profil')
      }

      const { user: userData } = data
      setUser(userData)
      localStorage.setItem('user', JSON.stringify(userData))
      
      return { success: true, user: userData }
    } catch (error) {
      console.error('Erreur updateProfile:', error)
      return { success: false, error: error.message }
    }
  }


  const refreshUser = async () => {
    try {
      console.log('🔄 Rafraîchissement des données utilisateur...')
      const currentToken = token || localStorage.getItem('token')
      
      if (!currentToken) {
        console.error('❌ Pas de token pour rafraîchir l\'utilisateur')
        return { success: false, error: 'Pas de token' }
      }

      const response = await fetch(`${CONFIG.BACKEND_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${currentToken}`
        },
        credentials: 'include'
      })

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        console.error('Réponse non-JSON reçue:', text.substring(0, 200))
        throw new Error(`Erreur serveur (${response.status}): ${response.statusText}`)
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la récupération des données')
      }

      const userData = data.user
      
      // Vérifier si le statut a changé
      const oldStatus = user?.status
      const newStatus = userData?.status
      
      if (oldStatus !== newStatus) {
        console.log(`🔄 Statut utilisateur changé: ${oldStatus} → ${newStatus}`)
      }
      
      setUser(userData)
      localStorage.setItem('user', JSON.stringify(userData))
      
      return { success: true, user: userData, statusChanged: oldStatus !== newStatus }
    } catch (error) {
      // Si le token est invalide (401), nettoyer silencieusement
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setToken(null)
        setUser(null)
        return { success: false, error: 'Token invalide ou expiré' }
      }
      // Pour les autres erreurs, logger
      console.error('Erreur refreshUser:', error)
      return { success: false, error: error.message }
    }
  }

  // isAuthenticated basé sur token ET user
  const isAuthenticated = !!(token && user)

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated,
        login,
        register,
        logout,
        updateUser,
        setUser, // Exposer setUser pour permettre la mise à jour directe
        updateProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}


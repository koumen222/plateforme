import { createContext, useContext, useState, useEffect } from 'react'
import { CONFIG } from '../config/config'
import axios from 'axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(null) // Token n'est plus utilisé depuis localStorage

  useEffect(() => {
    // Récupérer l'utilisateur depuis le cookie via /api/auth/me
    axios.get(`${CONFIG.BACKEND_URL}/api/auth/me`, {
      withCredentials: true
    })
    .then(res => {
      if (res.data.success && res.data.user) {
        setUser(res.data.user)
        // Garder le token pour compatibilité avec les anciennes routes
        const storedToken = localStorage.getItem('token')
        if (storedToken) {
          setToken(storedToken)
        }
      }
    })
    .catch(() => {
      // Pas d'utilisateur connecté ou erreur
      setUser(null)
      setToken(null)
      // Nettoyer le localStorage si nécessaire
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    })
    .finally(() => {
      setLoading(false)
    })
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
      
      setToken(newToken)
      setUser(userData)
      localStorage.setItem('token', newToken)
      localStorage.setItem('user', JSON.stringify(userData))
      
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
    if (!token) return { success: false, error: 'Non authentifié' }
    
    try {
      console.log('🔄 Rafraîchissement des données utilisateur...')
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/user/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
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

      const { user: userData } = data
      
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
      console.error('Erreur refreshUser:', error)
      return { success: false, error: error.message }
    }
  }

  const isAuthenticated = !!user && !!token

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


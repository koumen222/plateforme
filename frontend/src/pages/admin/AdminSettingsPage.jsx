import { useState, useEffect } from 'react'
import { CONFIG } from '../../config/config'
import { useAuth } from '../../contexts/AuthContext'
import { 
  FiSettings, FiUser, FiMail, FiPhone, FiShield, FiRefreshCw, FiDatabase, 
  FiTrendingUp, FiClock, FiSave, FiEdit, FiEye, FiEyeOff, FiCheckCircle, 
  FiAlertCircle, FiInfo, FiZap, FiBarChart2, FiUsers, FiBook, FiFileText,
  FiMessageSquare, FiTrash2, FiDownload, FiUpload
} from 'react-icons/fi'

export default function AdminSettingsPage() {
  const { user, token, refreshUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState(null)
  const [activeTab, setActiveTab] = useState('account')
  const [showPassword, setShowPassword] = useState(false)
  
  // État pour les informations du compte
  const [accountData, setAccountData] = useState({
    name: '',
    email: '',
    phoneNumber: ''
  })
  
  // État pour le changement de mot de passe
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  // État pour les statistiques
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalCourses: 0,
    totalComments: 0,
    totalRessources: 0
  })
  
  // État pour les paramètres de génération
  const [generationSettings, setGenerationSettings] = useState({
    generalProductsCount: 50,
    valentineProductsCount: 50,
    generationFrequency: '1h'
  })

  useEffect(() => {
    if (user) {
      setAccountData({
        name: user.name || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || ''
      })
    }
    fetchStats()
  }, [user])

  const fetchStats = async () => {
    try {
      const [usersRes, coursesRes, commentsRes, ressourcesRes] = await Promise.all([
        fetch(`${CONFIG.BACKEND_URL}/api/admin/users`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${CONFIG.BACKEND_URL}/api/admin/courses`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${CONFIG.BACKEND_URL}/api/admin/comments`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${CONFIG.BACKEND_URL}/api/admin/ressources-pdf`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      const usersData = await usersRes.json().catch(() => ({ users: [] }))
      const coursesData = await coursesRes.json().catch(() => ({ courses: [] }))
      const commentsData = await commentsRes.json().catch(() => ({ comments: [] }))
      const ressourcesData = await ressourcesRes.json().catch(() => ({ ressources: [] }))

      setStats({
        totalUsers: usersData.users?.length || 0,
        activeUsers: usersData.users?.filter(u => u.status === 'active')?.length || 0,
        totalCourses: coursesData.courses?.length || 0,
        totalComments: commentsData.comments?.length || 0,
        totalRessources: ressourcesData.ressources?.length || 0
      })
    } catch (error) {
      console.error('Erreur récupération statistiques:', error)
    }
  }

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 5000)
  }

  const handleUpdateAccount = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(accountData)
      })

      const data = await response.json()
      if (response.ok) {
        showNotification('Profil mis à jour avec succès', 'success')
        await refreshUser()
      } else {
        showNotification(data.error || 'Erreur lors de la mise à jour', 'error')
      }
    } catch (error) {
      showNotification('Erreur lors de la mise à jour du profil', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showNotification('Les mots de passe ne correspondent pas', 'error')
      return
    }

    if (passwordData.newPassword.length < 6) {
      showNotification('Le mot de passe doit contenir au moins 6 caractères', 'error')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      })

      const data = await response.json()
      if (response.ok) {
        showNotification('Mot de passe modifié avec succès', 'success')
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      } else {
        showNotification(data.error || 'Erreur lors du changement de mot de passe', 'error')
      }
    } catch (error) {
      showNotification('Erreur lors du changement de mot de passe', 'error')
    } finally {
      setLoading(false)
    }
  }

  const [regenerating, setRegenerating] = useState({ general: false, valentine: false })

  const handleRegenerateProducts = async (type) => {
    if (!confirm(`Êtes-vous sûr de vouloir forcer la génération immédiate de tous les produits ${type === 'general' ? 'généraux' : 'St Valentin'} ?\n\nCette action va :\n- Supprimer tous les produits existants\n- Générer 50 nouveaux produits via OpenAI\n- Ignorer le cache de 1h`)) {
      return
    }

    setRegenerating({ ...regenerating, [type]: true })
    try {
      const endpoint = type === 'general' 
        ? '/api/regenerate-products' 
        : '/api/regenerate-valentine'
      
      const response = await fetch(`${CONFIG.BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (response.ok) {
        showNotification(`✅ ${data.productsCount || 50} produits ${type === 'general' ? 'généraux' : 'St Valentin'} générés avec succès !`, 'success')
      } else {
        showNotification(data.error || data.details || 'Erreur lors de la régénération', 'error')
      }
    } catch (error) {
      console.error('Erreur régénération:', error)
      showNotification('Erreur lors de la régénération : ' + error.message, 'error')
    } finally {
      setRegenerating({ ...regenerating, [type]: false })
    }
  }

  const tabs = [
    { id: 'account', label: 'Mon Compte', icon: FiUser },
    { id: 'security', label: 'Sécurité', icon: FiShield },
    { id: 'generation', label: 'Génération Produits', icon: FiZap },
    { id: 'stats', label: 'Statistiques', icon: FiBarChart2 }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card rounded-xl shadow-lg p-6 border border-theme">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
              <FiSettings className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary">Paramètres</h1>
              <p className="text-secondary text-sm mt-1">Gérez les paramètres de votre compte et de la plateforme</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-lg">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold text-accent">Super Admin</span>
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in ${
          notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {notification.type === 'success' ? (
            <FiCheckCircle className="w-5 h-5" />
          ) : (
            <FiAlertCircle className="w-5 h-5" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-card rounded-xl shadow-lg border border-theme overflow-hidden">
        <div className="border-b border-theme">
          <div className="flex overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-semibold transition-all duration-200 border-b-2 whitespace-nowrap ${
                    isActive
                      ? 'text-accent border-accent bg-accent/5'
                      : 'text-secondary border-transparent hover:text-primary hover:bg-secondary'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Mon Compte */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <FiUser className="w-6 h-6 text-accent" />
                <h2 className="text-xl font-bold text-primary">Informations du compte</h2>
              </div>

              <form onSubmit={handleUpdateAccount} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-primary mb-2">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    value={accountData.name}
                    onChange={(e) => setAccountData({ ...accountData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-secondary border border-theme rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-primary"
                    placeholder="Votre nom"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-primary mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={accountData.email}
                    onChange={(e) => setAccountData({ ...accountData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-secondary border border-theme rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-primary"
                    placeholder="votre@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-primary mb-2">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={accountData.phoneNumber}
                    onChange={(e) => setAccountData({ ...accountData, phoneNumber: e.target.value })}
                    className="w-full px-4 py-3 bg-secondary border border-theme rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-primary"
                    placeholder="+237 6XX XXX XXX"
                  />
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-accent text-white rounded-lg font-semibold hover:bg-accent/90 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiSave className="w-5 h-5" />
                    {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Sécurité */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <FiShield className="w-6 h-6 text-accent" />
                <h2 className="text-xl font-bold text-primary">Sécurité</h2>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-primary mb-2">
                    Mot de passe actuel
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="w-full px-4 py-3 bg-secondary border border-theme rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-primary pr-12"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary"
                    >
                      {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-primary mb-2">
                    Nouveau mot de passe
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full px-4 py-3 bg-secondary border border-theme rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-primary"
                    placeholder="Au moins 6 caractères"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-primary mb-2">
                    Confirmer le nouveau mot de passe
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 bg-secondary border border-theme rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-primary"
                    placeholder="Répétez le mot de passe"
                  />
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex items-start gap-3">
                  <FiInfo className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-primary">
                    <p className="font-semibold mb-1">Conseils de sécurité :</p>
                    <ul className="list-disc list-inside space-y-1 text-secondary">
                      <li>Utilisez au moins 8 caractères</li>
                      <li>Mélangez lettres, chiffres et symboles</li>
                      <li>Ne partagez jamais votre mot de passe</li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-accent text-white rounded-lg font-semibold hover:bg-accent/90 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiShield className="w-5 h-5" />
                    {loading ? 'Modification...' : 'Modifier le mot de passe'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Génération Produits */}
          {activeTab === 'generation' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <FiZap className="w-6 h-6 text-accent" />
                <h2 className="text-xl font-bold text-primary">Génération de produits</h2>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <FiInfo className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-primary">
                    <p className="font-semibold mb-1">À propos de la génération</p>
                    <p className="text-secondary mb-2">
                      Les produits sont générés automatiquement toutes les heures via OpenAI et mis en cache pendant 1h.
                    </p>
                    <p className="text-secondary font-semibold">
                      ⚡ Le bouton "Forcer la génération immédiate" permet de bypasser le cache et régénérer immédiatement 50 nouveaux produits (incluant des produits Skin Care).
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Produits généraux */}
                <div className="bg-secondary rounded-xl p-6 border border-theme">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-primary">Produits généraux</h3>
                    <FiTrendingUp className="w-5 h-5 text-accent" />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-secondary mb-2">Nombre de produits</p>
                      <p className="text-2xl font-bold text-primary">{generationSettings.generalProductsCount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-secondary mb-2">Fréquence</p>
                      <p className="text-lg font-semibold text-primary">{generationSettings.generationFrequency}</p>
                    </div>
                    <button
                      onClick={() => handleRegenerateProducts('general')}
                      disabled={regenerating.general || loading}
                      className="w-full px-4 py-3 bg-accent text-white rounded-lg font-semibold hover:bg-accent/90 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                    >
                      <FiRefreshCw className={`w-5 h-5 ${regenerating.general ? 'animate-spin' : ''}`} />
                      {regenerating.general ? 'Génération en cours...' : '🔄 Forcer la génération immédiate'}
                    </button>
                    {regenerating.general && (
                      <p className="text-xs text-secondary text-center mt-2">
                        ⏳ Génération de 50 produits via OpenAI...
                      </p>
                    )}
                  </div>
                </div>

                {/* Produits St Valentin */}
                <div className="bg-secondary rounded-xl p-6 border border-theme">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-primary">Produits St Valentin</h3>
                    <FiTrendingUp className="w-5 h-5 text-pink-500" />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-secondary mb-2">Nombre de produits</p>
                      <p className="text-2xl font-bold text-primary">{generationSettings.valentineProductsCount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-secondary mb-2">Fréquence</p>
                      <p className="text-lg font-semibold text-primary">{generationSettings.generationFrequency}</p>
                    </div>
                    <button
                      onClick={() => handleRegenerateProducts('valentine')}
                      disabled={regenerating.valentine || loading}
                      className="w-full px-4 py-3 bg-pink-500 text-white rounded-lg font-semibold hover:bg-pink-600 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                    >
                      <FiRefreshCw className={`w-5 h-5 ${regenerating.valentine ? 'animate-spin' : ''}`} />
                      {regenerating.valentine ? 'Génération en cours...' : '🔄 Forcer la génération immédiate'}
                    </button>
                    {regenerating.valentine && (
                      <p className="text-xs text-secondary text-center mt-2">
                        ⏳ Génération de 50 produits St Valentin via OpenAI...
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Statistiques */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <FiBarChart2 className="w-6 h-6 text-accent" />
                <h2 className="text-xl font-bold text-primary">Statistiques de la plateforme</h2>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-xl p-6 border border-blue-500/20">
                  <div className="flex items-center justify-between mb-4">
                    <FiUsers className="w-8 h-8 text-blue-500" />
                    <span className="text-xs font-semibold text-blue-500 bg-blue-500/20 px-2 py-1 rounded">Total</span>
                  </div>
                  <p className="text-3xl font-bold text-primary mb-1">{stats.totalUsers}</p>
                  <p className="text-sm text-secondary">Utilisateurs</p>
                </div>

                <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-xl p-6 border border-green-500/20">
                  <div className="flex items-center justify-between mb-4">
                    <FiUsers className="w-8 h-8 text-green-500" />
                    <span className="text-xs font-semibold text-green-500 bg-green-500/20 px-2 py-1 rounded">Actifs</span>
                  </div>
                  <p className="text-3xl font-bold text-primary mb-1">{stats.activeUsers}</p>
                  <p className="text-sm text-secondary">Utilisateurs actifs</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-xl p-6 border border-purple-500/20">
                  <div className="flex items-center justify-between mb-4">
                    <FiBook className="w-8 h-8 text-purple-500" />
                    <span className="text-xs font-semibold text-purple-500 bg-purple-500/20 px-2 py-1 rounded">Total</span>
                  </div>
                  <p className="text-3xl font-bold text-primary mb-1">{stats.totalCourses}</p>
                  <p className="text-sm text-secondary">Cours</p>
                </div>

                <div className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 rounded-xl p-6 border border-orange-500/20">
                  <div className="flex items-center justify-between mb-4">
                    <FiMessageSquare className="w-8 h-8 text-orange-500" />
                    <span className="text-xs font-semibold text-orange-500 bg-orange-500/20 px-2 py-1 rounded">Total</span>
                  </div>
                  <p className="text-3xl font-bold text-primary mb-1">{stats.totalComments}</p>
                  <p className="text-sm text-secondary">Commentaires</p>
                </div>

                <div className="bg-gradient-to-br from-pink-500/10 to-pink-500/5 rounded-xl p-6 border border-pink-500/20">
                  <div className="flex items-center justify-between mb-4">
                    <FiFileText className="w-8 h-8 text-pink-500" />
                    <span className="text-xs font-semibold text-pink-500 bg-pink-500/20 px-2 py-1 rounded">Total</span>
                  </div>
                  <p className="text-3xl font-bold text-primary mb-1">{stats.totalRessources}</p>
                  <p className="text-sm text-secondary">Ressources PDF</p>
                </div>

                <div className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-xl p-6 border border-accent/20">
                  <div className="flex items-center justify-between mb-4">
                    <FiDatabase className="w-8 h-8 text-accent" />
                    <span className="text-xs font-semibold text-accent bg-accent/20 px-2 py-1 rounded">Système</span>
                  </div>
                  <p className="text-3xl font-bold text-primary mb-1">
                    {stats.totalUsers + stats.totalCourses + stats.totalComments + stats.totalRessources}
                  </p>
                  <p className="text-sm text-secondary">Total éléments</p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={fetchStats}
                  className="px-4 py-2 bg-secondary text-primary rounded-lg font-semibold hover:bg-theme transition-all duration-200 flex items-center gap-2"
                >
                  <FiRefreshCw className="w-5 h-5" />
                  Actualiser les statistiques
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


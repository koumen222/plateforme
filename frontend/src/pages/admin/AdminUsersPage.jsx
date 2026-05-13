import { useState, useEffect, useMemo } from 'react'
import { CONFIG } from '../../config/config'
import { useAuth } from '../../contexts/AuthContext'
import { MODULES, ALL_MODULE_KEYS } from '../../config/modules'
import { FiSearch, FiFilter, FiRefreshCw, FiEdit, FiTrash2, FiUser, FiMail, FiPhone, FiCalendar, FiCheckCircle, FiXCircle, FiClock, FiTrendingUp, FiDownload, FiMoreVertical, FiUserCheck, FiUserX, FiMessageCircle, FiLock, FiUnlock } from 'react-icons/fi'

export default function AdminUsersPage() {
  const { token } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [editingUser, setEditingUser] = useState(null)
  const [deleteUser, setDeleteUser] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [notification, setNotification] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [token])

  const fetchUsers = async () => {
    try {
      setRefreshing(true)
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        const usersData = data.users || []
        console.log('📋 Utilisateurs récupérés:', usersData.length)
        setUsers(usersData)
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ Erreur récupération utilisateurs:', errorData)
        showNotification(errorData.error || 'Erreur lors du chargement', 'error')
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des utilisateurs:', error)
      showNotification('Erreur lors du chargement des utilisateurs', 'error')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 4000)
  }

  const handleValidate = async (userId) => {
    const userIndex = users.findIndex(u => u._id === userId)
    if (userIndex !== -1) {
      const updatedUsers = [...users]
      updatedUsers[userIndex] = { ...updatedUsers[userIndex], status: 'active' }
      setUsers(updatedUsers)
    }
    
    const event = new CustomEvent('userStatusChanged', { 
      detail: { userId, newStatus: 'active' },
      bubbles: true,
      cancelable: true
    })
    window.dispatchEvent(event)
    
    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/admin/validate/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        showNotification('Utilisateur validé avec succès')
        fetchUsers()
      } else {
        fetchUsers()
        const data = await response.json()
        showNotification(data.error || 'Erreur lors de la validation', 'error')
      }
    } catch (error) {
      fetchUsers()
      showNotification('Erreur lors de la validation', 'error')
    }
  }

  const handleStatusChange = async (userId, newStatus) => {
    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        const data = await response.json()
        const statusLabels = {
          active: 'Actif',
          pending: 'En attente',
          inactive: 'Inactif'
        }
        showNotification(`Statut mis à jour: ${statusLabels[newStatus] || newStatus}`)
        fetchUsers()
        
        const event = new CustomEvent('userStatusChanged', { 
          detail: { userId, newStatus },
          bubbles: true,
          cancelable: true
        })
        window.dispatchEvent(event)
        
        return true
      } else {
        const data = await response.json()
        showNotification(data.error || 'Erreur lors du changement de statut', 'error')
        return false
      }
    } catch (error) {
      showNotification('Erreur lors du changement de statut', 'error')
      return false
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    
    if (!editingUser.name || editingUser.name.trim().length < 2) {
      showNotification('Le nom doit contenir au moins 2 caractères', 'error')
      return
    }
    
    if (!editingUser.email || !editingUser.email.includes('@')) {
      showNotification('Email invalide', 'error')
      return
    }
    
    if (!editingUser.phoneNumber || editingUser.phoneNumber.trim().length < 5) {
      showNotification('Numéro de téléphone invalide', 'error')
      return
    }
    
    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/admin/users/${editingUser._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: editingUser.name.trim(),
          email: editingUser.email.trim().toLowerCase(),
          phoneNumber: editingUser.phoneNumber.trim(),
          status: editingUser.status,
          role: editingUser.role
        })
      })

      const data = await response.json()

      if (response.ok) {
        if (editingUser.role !== 'superadmin') {
          await handleUpdateModules(editingUser._id, editingUser.allowedModules || [], true)
        }
        showNotification('Utilisateur mis à jour avec succès')
        setEditingUser(null)
        fetchUsers()

        if (data.user && data.user.status) {
          const event = new CustomEvent('userStatusChanged', {
            detail: { userId: editingUser._id, newStatus: data.user.status },
            bubbles: true,
            cancelable: true
          })
          window.dispatchEvent(event)
        }
      } else {
        showNotification(data.error || 'Erreur lors de la mise à jour', 'error')
      }
    } catch (error) {
      showNotification('Erreur lors de la mise à jour', 'error')
    }
  }

  const handleDelete = async () => {
    if (!deleteUser) return

    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/admin/users/${deleteUser._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        showNotification('Utilisateur supprimé avec succès')
        setDeleteUser(null)
        fetchUsers()
      } else {
        const data = await response.json()
        showNotification(data.error || 'Erreur lors de la suppression', 'error')
      }
    } catch (error) {
      showNotification('Erreur lors de la suppression', 'error')
    }
  }

  const handleResetProgress = async (userId, skipConfirm = false) => {
    if (!skipConfirm && !window.confirm('Êtes-vous sûr de vouloir réinitialiser la progression de cet utilisateur ?')) {
      return false
    }

    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/admin/users/${userId}/reset-progress`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (response.ok) {
        showNotification(data.message || 'Progression réinitialisée avec succès')
        fetchUsers()
        return true
      } else {
        showNotification(data.error || 'Erreur lors de la réinitialisation', 'error')
        return false
      }
    } catch (error) {
      showNotification(`Erreur: ${error.message || 'Erreur lors de la réinitialisation'}`, 'error')
      return false
    }
  }

  const handleUpdateModules = async (userId, allowedModules, silent = false) => {
    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/admin/users/${userId}/modules`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ allowedModules })
      })

      if (response.ok) {
        if (!silent) {
          showNotification('Modules mis à jour avec succès')
          fetchUsers()
        }
        return true
      } else {
        const data = await response.json()
        showNotification(data.error || 'Erreur lors de la mise à jour des modules', 'error')
        return false
      }
    } catch (error) {
      showNotification('Erreur lors de la mise à jour des modules', 'error')
      return false
    }
  }

  const toggleModule = (moduleKey) => {
    const current = editingUser.allowedModules || []
    const updated = current.includes(moduleKey)
      ? current.filter(k => k !== moduleKey)
      : [...current, moduleKey]
    setEditingUser({ ...editingUser, allowedModules: updated })
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: { label: 'En attente', class: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: <FiClock className="w-4 h-4" /> },
      active: { label: 'Actif', class: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: <FiCheckCircle className="w-4 h-4" /> },
      inactive: { label: 'Inactif', class: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: <FiXCircle className="w-4 h-4" /> }
    }
    return badges[status] || badges.pending
  }

  const getRoleBadge = (role) => {
    const badges = {
      superadmin: { label: 'Super Admin', class: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400', icon: <FiUserCheck className="w-4 h-4" /> },
      student: { label: 'Étudiant', class: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: <FiUser className="w-4 h-4" /> }
    }
    return badges[role] || badges.student
  }

  const generateWhatsAppLink = (user) => {
    let phoneNumber = user.phoneNumber || ''
    phoneNumber = phoneNumber.replace(/[\s\-\(\)]/g, '')
    if (phoneNumber.startsWith('+')) {
      phoneNumber = phoneNumber.substring(1)
    }
    
    const userName = user.name?.trim() || user.email?.split('@')[0] || 'Cher utilisateur'
    const message = `Bonjour ${userName},\n\nVotre compte à la plateforme Ecom Starter est en attente d’activation. Une fois le paiement confirmé, vous aurez un accès complet à toutes les formations, vidéos et ressources premium.\n\n✅ Tarifs d’activation :\n- 5 000 FCFA / mois\n- 25 000 FCFA / an\n\n✅ Avantages :\n- Accès illimité à toutes les formations\n- Ressources et mises à jour régulières\n- Support prioritaire\n\nPour activer votre compte rapidement, merci de me confirmer votre mode de paiement ou d’effectuer le règlement dès maintenant. Je reste disponible si vous avez besoin d’aide.\n\nMerci pour votre confiance !`
    
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
    return whatsappUrl
  }

  const handleWhatsAppClick = (user) => {
    if (!user.phoneNumber) {
      showNotification('Numéro de téléphone non renseigné pour cet utilisateur', 'error')
      return
    }
    
    const whatsappUrl = generateWhatsAppLink(user)
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
  }

  const filteredUsers = useMemo(() => {
    let filtered = users.filter(user => {
      const matchesSearch = 
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phoneNumber?.includes(searchTerm)
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter
      const matchesRole = roleFilter === 'all' || user.role === roleFilter
      return matchesSearch && matchesStatus && matchesRole
    })

    // Tri
    filtered.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt) - new Date(a.createdAt)
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt) - new Date(b.createdAt)
      }
      if (sortBy === 'name') {
        return (a.name || '').localeCompare(b.name || '')
      }
      if (sortBy === 'email') {
        return (a.email || '').localeCompare(b.email || '')
      }
      return 0
    })

    return filtered
  }, [users, searchTerm, statusFilter, roleFilter, sortBy])

  // Statistiques
  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter(u => u.status === 'active').length,
      pending: users.filter(u => u.status === 'pending').length,
      inactive: users.filter(u => u.status === 'inactive').length,
      students: users.filter(u => u.role === 'student').length,
      admins: users.filter(u => u.role === 'superadmin').length
    }
  }, [users])

  if (loading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-primary mb-2">Chargement des utilisateurs</h3>
          <p className="text-secondary">Récupération des données...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-primary p-6">
      <div className="max-w-7xl mx-auto">
        {/* Notification */}
        {notification && (
          <div className={`mb-6 p-4 rounded-lg ${
            notification.type === 'error' 
              ? 'bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-100' 
              : 'bg-green-50 text-green-700 dark:bg-green-900/40 dark:text-green-100'
          }`}>
            {notification.message}
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-primary mb-2">
                👥 Gestion des Utilisateurs
              </h1>
              <p className="text-lg text-secondary">
                Gérez les comptes utilisateurs, validez les inscriptions et contrôlez les accès
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchUsers}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-xl font-semibold transition-all disabled:opacity-50"
              >
                <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Rafraîchissement...' : 'Rafraîchir'}
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-hover text-primary rounded-xl font-semibold transition-all"
              >
                <FiFilter className="w-4 h-4" />
                {showFilters ? 'Masquer filtres' : 'Filtres'}
              </button>
            </div>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-card rounded-xl p-4 border border-theme">
              <div className="text-2xl font-bold text-accent mb-1">{stats.total}</div>
              <div className="text-sm text-secondary">Total</div>
            </div>
            <div className="bg-card rounded-xl p-4 border border-theme">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">{stats.active}</div>
              <div className="text-sm text-secondary">Actifs</div>
            </div>
            <div className="bg-card rounded-xl p-4 border border-theme">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">{stats.pending}</div>
              <div className="text-sm text-secondary">En attente</div>
            </div>
            <div className="bg-card rounded-xl p-4 border border-theme">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400 mb-1">{stats.inactive}</div>
              <div className="text-sm text-secondary">Inactifs</div>
            </div>
            <div className="bg-card rounded-xl p-4 border border-theme">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">{stats.students}</div>
              <div className="text-sm text-secondary">Étudiants</div>
            </div>
            <div className="bg-card rounded-xl p-4 border border-theme">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">{stats.admins}</div>
              <div className="text-sm text-secondary">Admins</div>
            </div>
          </div>

          {/* Barre de recherche */}
          <div className="bg-card rounded-xl p-4 mb-6 border border-theme">
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher par nom, email ou téléphone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-secondary border border-theme rounded-xl text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          {/* Filtres */}
          {showFilters && (
            <div className="bg-card rounded-xl p-6 mb-6 border border-theme">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-primary mb-3">
                    <FiFilter className="inline w-4 h-4 mr-2" />
                    Statut
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-3 bg-secondary border border-theme rounded-xl text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="pending">⏳ En attente</option>
                    <option value="active">✅ Actifs</option>
                    <option value="inactive">🚫 Inactifs</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-primary mb-3">
                    <FiUser className="inline w-4 h-4 mr-2" />
                    Rôle
                  </label>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="w-full px-4 py-3 bg-secondary border border-theme rounded-xl text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="all">Tous les rôles</option>
                    <option value="student">👤 Étudiants</option>
                    <option value="superadmin">🔐 Administrateurs</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-primary mb-3">
                    <FiTrendingUp className="inline w-4 h-4 mr-2" />
                    Trier par
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-4 py-3 bg-secondary border border-theme rounded-xl text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="newest">Plus récents</option>
                    <option value="oldest">Plus anciens</option>
                    <option value="name">Nom (A-Z)</option>
                    <option value="email">Email (A-Z)</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-theme flex justify-between items-center">
                <div className="text-sm text-secondary">
                  {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''} trouvé{filteredUsers.length > 1 ? 's' : ''}
                </div>
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setStatusFilter('all')
                    setRoleFilter('all')
                    setSortBy('newest')
                  }}
                  className="text-sm text-accent hover:underline"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tableau des utilisateurs */}
        <div className="bg-card rounded-xl border border-theme overflow-hidden">
          {filteredUsers.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-primary mb-2">Aucun utilisateur trouvé</h3>
              <p className="text-secondary mb-6">
                Aucun utilisateur ne correspond à vos critères de recherche.
              </p>
              <button
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('all')
                  setRoleFilter('all')
                  setSortBy('newest')
                }}
                className="px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-xl font-semibold transition-all"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary border-b border-theme">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-primary">Utilisateur</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-primary">Rôle</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-primary">Statut</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-primary">Progression</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-primary">Inscription</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-primary">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme">
                  {filteredUsers.map((user) => {
                    const statusBadge = getStatusBadge(user.status)
                    const roleBadge = getRoleBadge(user.role)
                    const progressStats = user.progressStats || { totalCourses: 0, completedCourses: 0, progressPercentage: 0 }
                    
                    return (
                      <tr 
                        key={user._id}
                        onClick={(e) => {
                          if (e.target.closest('button, select, .admin-actions')) {
                            return
                          }
                          setSelectedUser(user)
                        }}
                        className="hover:bg-secondary/50 transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                              <FiUser className="w-5 h-5 text-accent" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-primary mb-1 flex items-center gap-2">
                                {user.name || 'Non renseigné'}
                                {!user.name && (
                                  <span className="text-yellow-600 dark:text-yellow-400" title="Nom manquant">⚠️</span>
                                )}
                              </div>
                              <div className="text-sm text-secondary flex items-center gap-2 mb-1">
                                <FiMail className="w-3 h-3" />
                                {user.email}
                              </div>
                              {user.phoneNumber && (
                                <div className="text-sm text-secondary flex items-center gap-2">
                                  <FiPhone className="w-3 h-3" />
                                  {user.phoneNumber}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${roleBadge.class}`}>
                            {roleBadge.icon}
                            {roleBadge.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-2">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold w-fit ${statusBadge.class}`}>
                              {statusBadge.icon}
                              {statusBadge.label}
                            </span>
                            {user.status === 'active' && (
                              <span className="text-xs text-green-600 dark:text-green-400">✅ Accès complet</span>
                            )}
                            {(user.status === 'pending' || user.status === 'inactive') && (
                              <span className="text-xs text-red-600 dark:text-red-400">🚫 Pas d'accès</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {user.role === 'student' && user.status === 'active' ? (
                            <div className="flex flex-col gap-2">
                              <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                                <div 
                                  className="h-full bg-accent transition-all"
                                  style={{ width: `${progressStats.progressPercentage || 0}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-secondary">
                                {progressStats.completedLessons || progressStats.completedCourses || 0} / {progressStats.totalLessons || progressStats.totalCourses || 0} ({progressStats.progressPercentage || 0}%)
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-secondary">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-secondary">
                            <FiCalendar className="w-4 h-4" />
                            {new Date(user.createdAt).toLocaleDateString('fr-FR', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2 admin-actions">
                            <button
                              onClick={() => setEditingUser({ ...user })}
                              className="p-2 hover:bg-secondary rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <FiEdit className="w-4 h-4 text-primary" />
                            </button>
                            {user.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleWhatsAppClick(user)}
                                  className="p-2 hover:bg-secondary rounded-lg transition-colors"
                                  title="Envoyer WhatsApp"
                                >
                                  <FiMessageCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                                </button>
                                <button
                                  onClick={() => handleValidate(user._id)}
                                  className="p-2 hover:bg-secondary rounded-lg transition-colors"
                                  title="Valider"
                                >
                                  <FiCheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                                </button>
                              </>
                            )}
                            <select
                              value={user.status}
                              onChange={(e) => handleStatusChange(user._id, e.target.value)}
                              className="px-3 py-1.5 bg-secondary border border-theme rounded-lg text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <option value="pending">⏳ En attente</option>
                              <option value="active">✅ Actif</option>
                              <option value="inactive">🚫 Inactif</option>
                            </select>
                            {user.role === 'student' && user.status === 'active' && (
                              <button
                                onClick={() => handleResetProgress(user._id)}
                                className="p-2 hover:bg-secondary rounded-lg transition-colors"
                                title="Réinitialiser progression"
                              >
                                <FiRefreshCw className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                              </button>
                            )}
                            <button
                              onClick={() => setDeleteUser(user)}
                              className="p-2 hover:bg-secondary rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <FiTrash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal d'édition */}
        {editingUser && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setEditingUser(null)}>
            <div className="bg-card rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-theme" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-card border-b border-theme p-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-primary">Modifier l'utilisateur</h2>
                  <p className="text-sm text-secondary mt-1">Le statut contrôle l'accès aux cours, vidéos, chat et ressources</p>
                </div>
                <button
                  onClick={() => setEditingUser(null)}
                  className="text-secondary hover:text-primary text-2xl font-bold transition-colors"
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleUpdate} className="p-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-primary mb-4">📝 Informations personnelles</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-primary mb-2">Nom complet *</label>
                        <input
                          type="text"
                          value={editingUser.name || ''}
                          onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                          required
                          className="w-full px-4 py-3 bg-secondary border border-theme rounded-xl text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-accent"
                          placeholder="Nom de l'utilisateur"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-primary mb-2">Email *</label>
                        <input
                          type="email"
                          value={editingUser.email}
                          onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                          required
                          className="w-full px-4 py-3 bg-secondary border border-theme rounded-xl text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-accent"
                          placeholder="email@exemple.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-primary mb-2">Numéro de téléphone *</label>
                        <input
                          type="tel"
                          value={editingUser.phoneNumber || ''}
                          onChange={(e) => setEditingUser({ ...editingUser, phoneNumber: e.target.value })}
                          required
                          className="w-full px-4 py-3 bg-secondary border border-theme rounded-xl text-primary placeholder-secondary focus:outline-none focus:ring-2 focus:ring-accent"
                          placeholder="+237 6 76 77 83 77"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-primary mb-4">🔐 Paramètres de compte</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-primary mb-2">Rôle</label>
                        <select
                          value={editingUser.role}
                          onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                          className="w-full px-4 py-3 bg-secondary border border-theme rounded-xl text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                        >
                          <option value="student">👤 Étudiant</option>
                          <option value="superadmin">🔐 Super Admin</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-primary mb-2">Statut</label>
                        <select
                          value={editingUser.status}
                          onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })}
                          className="w-full px-4 py-3 bg-secondary border border-theme rounded-xl text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                        >
                          <option value="pending">⏳ En attente (Pas d'accès)</option>
                          <option value="active">✅ Actif (Accès complet)</option>
                          <option value="inactive">🚫 Inactif (Pas d'accès)</option>
                        </select>
                        <p className={`mt-2 text-sm ${editingUser.status === 'active' ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                          {editingUser.status === 'active' ? (
                            <>✅ L'utilisateur aura accès à tous les cours, vidéos, chat et ressources</>
                          ) : (
                            <>⚠️ L'utilisateur n'aura PAS accès aux cours, vidéos, chat et ressources</>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {editingUser.role !== 'superadmin' && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-primary">🧩 Modules autorisés</h3>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingUser({ ...editingUser, allowedModules: ALL_MODULE_KEYS })}
                            className="text-xs px-3 py-1.5 bg-accent/10 text-accent hover:bg-accent/20 rounded-lg font-medium transition-all"
                          >
                            Tout sélectionner
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingUser({ ...editingUser, allowedModules: [] })}
                            className="text-xs px-3 py-1.5 bg-secondary hover:bg-hover text-secondary rounded-lg font-medium transition-all"
                          >
                            Tout désélectionner
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-secondary mb-3">
                        Sélectionnez les modules auxquels cet utilisateur aura accès.
                        {editingUser.role === 'superadmin' && ' Les super admins ont accès à tout par défaut.'}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {ALL_MODULE_KEYS.map((key) => {
                          const mod = MODULES[key]
                          const isActive = (editingUser.allowedModules || []).includes(key)
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => toggleModule(key)}
                              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${
                                isActive
                                  ? 'bg-accent/10 border-accent/50 text-accent'
                                  : 'bg-secondary border-theme text-secondary hover:border-accent/30'
                              }`}
                            >
                              <span className="text-lg">{mod.icon}</span>
                              <div className="flex-1 min-w-0">
                                <div className={`text-sm font-semibold ${isActive ? 'text-accent' : 'text-primary'}`}>{mod.label}</div>
                                <div className="text-xs text-secondary truncate">{mod.description}</div>
                              </div>
                              {isActive
                                ? <FiUnlock className="w-4 h-4 flex-shrink-0 text-accent" />
                                : <FiLock className="w-4 h-4 flex-shrink-0 text-secondary" />
                              }
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-theme">
                  <button 
                    type="button" 
                    onClick={() => setEditingUser(null)} 
                    className="px-6 py-3 bg-secondary hover:bg-hover text-primary rounded-xl font-semibold transition-all"
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit" 
                    className="px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-xl font-semibold transition-all"
                  >
                    💾 Enregistrer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de suppression */}
        {deleteUser && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setDeleteUser(null)}>
            <div className="bg-card rounded-2xl shadow-2xl max-w-md w-full border border-theme" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-theme">
                <h2 className="text-2xl font-bold text-primary">Confirmer la suppression</h2>
              </div>
              <div className="p-6">
                <p className="text-primary mb-4">
                  Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>{deleteUser.email}</strong> ?
                </p>
                <p className="text-red-600 dark:text-red-400 font-semibold">Cette action est irréversible.</p>
              </div>
              <div className="flex justify-end gap-3 p-6 border-t border-theme">
                <button
                  onClick={() => setDeleteUser(null)}
                  className="px-6 py-3 bg-secondary hover:bg-hover text-primary rounded-xl font-semibold transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDelete}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal détail utilisateur */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedUser(null)}>
            <div className="bg-card rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-theme" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-card border-b border-theme p-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-primary">Détails de l'utilisateur</h2>
                  <p className="text-sm text-secondary mt-1">{selectedUser.name || selectedUser.email}</p>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-secondary hover:text-primary text-2xl font-bold transition-colors"
                >
                  ×
                </button>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-secondary rounded-xl p-4">
                      <div className="text-sm text-secondary mb-1">Email</div>
                      <div className="font-semibold text-primary">{selectedUser.email}</div>
                    </div>
                    {selectedUser.phoneNumber && (
                      <div className="bg-secondary rounded-xl p-4">
                        <div className="text-sm text-secondary mb-1">Téléphone</div>
                        <div className="font-semibold text-primary">{selectedUser.phoneNumber}</div>
                      </div>
                    )}
                  </div>
                  <div className="bg-secondary rounded-xl p-4">
                    <div className="text-sm text-secondary mb-2">Statut actuel</div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${getStatusBadge(selectedUser.status).class}`}>
                      {getStatusBadge(selectedUser.status).icon}
                      {getStatusBadge(selectedUser.status).label}
                    </span>
                  </div>
                  {selectedUser.role === 'student' && selectedUser.status === 'active' && (
                    <div className="bg-secondary rounded-xl p-4">
                      <div className="text-sm text-secondary mb-2">Progression</div>
                      <div className="w-full bg-primary rounded-full h-3 mb-2">
                        <div 
                          className="h-full bg-accent rounded-full transition-all"
                          style={{ width: `${selectedUser.progressStats?.progressPercentage || 0}%` }}
                        ></div>
                      </div>
                      <div className="text-sm text-secondary">
                        {selectedUser.progressStats?.completedLessons || selectedUser.progressStats?.completedCourses || 0} / {selectedUser.progressStats?.totalLessons || selectedUser.progressStats?.totalCourses || 0} ({selectedUser.progressStats?.progressPercentage || 0}%)
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-semibold text-primary mb-2">Changer le statut</label>
                    <select
                      value={selectedUser.status}
                      onChange={async (e) => {
                        const newStatus = e.target.value
                        const success = await handleStatusChange(selectedUser._id, newStatus)
                        if (success) {
                          setSelectedUser(prev => ({ ...prev, status: newStatus }))
                        }
                      }}
                      className="w-full px-4 py-3 bg-secondary border border-theme rounded-xl text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      <option value="pending">⏳ En attente (Pas d'accès)</option>
                      <option value="active">✅ Actif (Accès complet)</option>
                      <option value="inactive">🚫 Inactif (Pas d'accès)</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-col gap-3 mt-8 pt-6 border-t border-theme">
                  {selectedUser.status === 'pending' && (
                    <button
                      onClick={() => {
                        handleWhatsAppClick(selectedUser)
                      }}
                      className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                    >
                      <FiMessageCircle className="w-5 h-5" />
                      Envoyer un message WhatsApp
                    </button>
                  )}
                  {selectedUser.role === 'student' && selectedUser.status === 'active' && (
                    <button
                      onClick={async () => {
                        if (window.confirm('Êtes-vous sûr de vouloir réinitialiser la progression de cet utilisateur ?')) {
                          const success = await handleResetProgress(selectedUser._id, true)
                          if (success) {
                            setSelectedUser(null)
                          }
                        }
                      }}
                      className="w-full px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                    >
                      <FiRefreshCw className="w-5 h-5" />
                      Réinitialiser la progression
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="w-full px-6 py-3 bg-secondary hover:bg-hover text-primary rounded-xl font-semibold transition-all"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

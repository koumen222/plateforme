import { useState, useEffect } from 'react'
import { CONFIG } from '../../config/config'
import { useAuth } from '../../contexts/AuthContext'
import '../../styles/admin.css'
import '../../styles/admin-users.css'

export default function AdminUsersPage() {
  const { token } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [editingUser, setEditingUser] = useState(null)
  const [deleteUser, setDeleteUser] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [notification, setNotification] = useState(null)

  useEffect(() => {
    fetchUsers()
  }, [token])

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        const usersData = data.users || []
        console.log('📋 Utilisateurs récupérés:', usersData.length)
        if (usersData.length > 0) {
          console.log('   Exemple utilisateur:', {
            name: usersData[0].name,
            email: usersData[0].email,
            phoneNumber: usersData[0].phoneNumber
          })
        }
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
    }
  }

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const handleValidate = async (userId) => {
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
        
        // Déclencher un événement pour notifier le changement de statut
        const event = new CustomEvent('userStatusChanged', { 
          detail: { userId, newStatus: 'active' },
          bubbles: true,
          cancelable: true
        })
        window.dispatchEvent(event)
        console.log('📢 Événement userStatusChanged dispatché:', { userId, newStatus: 'active' })
      } else {
        const data = await response.json()
        showNotification(data.error || 'Erreur lors de la validation', 'error')
      }
    } catch (error) {
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
        console.log('✅ Statut mis à jour:', data)
        const statusLabels = {
          active: 'Actif',
          pending: 'En attente',
          inactive: 'Inactif'
        }
        showNotification(`Statut mis à jour: ${statusLabels[newStatus] || newStatus}`)
        fetchUsers()
        
        // Déclencher un événement pour notifier les autres onglets/composants
        const event = new CustomEvent('userStatusChanged', { 
          detail: { userId, newStatus },
          bubbles: true,
          cancelable: true
        })
        window.dispatchEvent(event)
        console.log('📢 Événement userStatusChanged dispatché:', { userId, newStatus })
        
        return true
      } else {
        const data = await response.json()
        console.error('❌ Erreur changement statut:', data)
        showNotification(data.error || 'Erreur lors du changement de statut', 'error')
        return false
      }
    } catch (error) {
      console.error('❌ Erreur changement statut:', error)
      showNotification('Erreur lors du changement de statut', 'error')
      return false
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    
    // Validation
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
      console.log('🔄 Mise à jour utilisateur:', {
        id: editingUser._id,
        name: editingUser.name,
        email: editingUser.email,
        phoneNumber: editingUser.phoneNumber,
        status: editingUser.status,
        role: editingUser.role
      })
      
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

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Utilisateur mis à jour:', data.user)
        showNotification('Utilisateur mis à jour avec succès')
        setEditingUser(null)
        fetchUsers()
        
        // Déclencher un événement si le statut a changé
        if (data.user && data.user.status) {
          const event = new CustomEvent('userStatusChanged', { 
            detail: { userId: editingUser._id, newStatus: data.user.status },
            bubbles: true,
            cancelable: true
          })
          window.dispatchEvent(event)
          console.log('📢 Événement userStatusChanged dispatché:', { userId: editingUser._id, newStatus: data.user.status })
        }
      } else {
        const data = await response.json()
        console.error('❌ Erreur mise à jour:', data)
        showNotification(data.error || 'Erreur lors de la mise à jour', 'error')
      }
    } catch (error) {
      console.error('❌ Erreur mise à jour:', error)
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
        console.error('Erreur réinitialisation:', data)
        showNotification(data.error || 'Erreur lors de la réinitialisation', 'error')
        return false
      }
    } catch (error) {
      console.error('Erreur réinitialisation progression:', error)
      showNotification(`Erreur: ${error.message || 'Erreur lors de la réinitialisation'}`, 'error')
      return false
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: { label: 'En attente', class: 'admin-badge-pending' },
      active: { label: 'Actif', class: 'admin-badge-active' },
      inactive: { label: 'Inactif', class: 'admin-badge-inactive' }
    }
    return badges[status] || badges.pending
  }

  const getRoleBadge = (role) => {
    const badges = {
      superadmin: { label: 'Super Admin', class: 'admin-badge-admin' },
      student: { label: 'Étudiant', class: 'admin-badge-student' }
    }
    return badges[role] || badges.student
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phoneNumber?.includes(searchTerm)
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    return matchesSearch && matchesStatus && matchesRole
  })

  if (loading) {
    return (
      <div className="admin-users-page">
        <div className="admin-loading">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="admin-users-page">
      {notification && (
        <div className={`admin-notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      <div className="admin-page-header">
        <div>
          <h1>Gestion des Utilisateurs</h1>
          <p>Gérer les comptes utilisateurs de la plateforme - Modifier, valider, activer ou désactiver les utilisateurs</p>
        </div>
        <div className="admin-header-actions">
          <div className="admin-search-box">
            <input
              type="text"
              placeholder="Rechercher par nom, email ou téléphone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="admin-search-input"
            />
          </div>
        </div>
      </div>

      <div className="admin-filters">
        <div className="admin-filter-group">
          <label>Statut:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="admin-filter-select"
          >
            <option value="all">Tous</option>
            <option value="pending">En attente</option>
            <option value="active">Actifs</option>
            <option value="inactive">Inactifs</option>
          </select>
        </div>
        <div className="admin-filter-group">
          <label>Rôle:</label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="admin-filter-select"
          >
            <option value="all">Tous</option>
            <option value="student">Étudiants</option>
            <option value="superadmin">Administrateurs</option>
          </select>
        </div>
        <div className="admin-filter-badge">
          {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''}
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Informations</th>
              <th>Rôle</th>
              <th>Statut</th>
              <th>Progression</th>
              <th>Date d'inscription</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="6" className="admin-table-empty">
                  Aucun utilisateur trouvé
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => {
                const statusBadge = getStatusBadge(user.status)
                const roleBadge = getRoleBadge(user.role)
                const progressStats = user.progressStats || { totalCourses: 0, completedCourses: 0, progressPercentage: 0 }
                
                return (
                  <tr 
                    key={user._id}
                    onClick={(e) => {
                      // Ne pas ouvrir la modal si on clique sur les boutons ou selects
                      if (e.target.closest('button, select, .admin-actions')) {
                        return
                      }
                      setSelectedUser(user)
                    }}
                    className="admin-user-row"
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <div className="admin-user-info">
                        <div className="admin-user-name">
                          {user.name || 'Non renseigné'}
                          {!user.name && (
                            <span className="admin-warning-badge" title="Nom manquant">⚠️</span>
                          )}
                        </div>
                        <div className="admin-user-email">{user.email}</div>
                        <div className="admin-user-phone">{user.phoneNumber || 'Non renseigné'}</div>
                      </div>
                    </td>
                    <td>
                      <span className={`admin-badge ${roleBadge.class}`}>
                        {roleBadge.label}
                      </span>
                    </td>
                    <td>
                      <div className="admin-status-cell">
                        <span className={`admin-badge ${statusBadge.class}`}>
                          {statusBadge.label}
                        </span>
                        {user.status === 'active' && (
                          <span className="admin-access-badge" title="Accès complet aux cours, vidéos, chat et ressources">
                            ✅ Accès complet
                          </span>
                        )}
                        {user.status === 'pending' && (
                          <span className="admin-access-badge admin-access-pending" title="En attente de validation - Pas d'accès aux ressources">
                            ⏳ Pas d'accès
                          </span>
                        )}
                        {user.status === 'inactive' && (
                          <span className="admin-access-badge admin-access-inactive" title="Compte inactif - Pas d'accès aux ressources">
                            🚫 Pas d'accès
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      {user.role === 'student' && user.status === 'active' ? (
                        <div className="admin-progress-cell">
                          <div className="admin-progress-bar-container">
                            <div 
                              className="admin-progress-bar-fill" 
                              style={{ width: `${progressStats.progressPercentage}%` }}
                            ></div>
                          </div>
                          <span className="admin-progress-text">
                            {progressStats.completedLessons || progressStats.completedCourses}/{progressStats.totalLessons || progressStats.totalCourses} ({progressStats.progressPercentage}%)
                          </span>
                        </div>
                      ) : (
                        <span className="admin-progress-na">N/A</span>
                      )}
                    </td>
                    <td>
                      {new Date(user.createdAt).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </td>
                    <td>
                      <div className="admin-actions">
                        <button
                          onClick={() => setEditingUser({ ...user })}
                          className="admin-btn admin-btn-edit"
                          title="Modifier l'utilisateur (nom, email, téléphone, rôle, statut)"
                        >
                          ✏️ Modifier
                        </button>
                        {user.status === 'pending' && (
                          <button
                            onClick={() => handleValidate(user._id)}
                            className="admin-btn admin-btn-validate"
                            title="Valider l'utilisateur (passe en actif)"
                          >
                            ✅ Valider
                          </button>
                        )}
                        <select
                          value={user.status}
                          onChange={(e) => handleStatusChange(user._id, e.target.value)}
                          className="admin-status-select"
                          title={`Changer le statut - ${user.status === 'active' ? 'Accès complet' : 'Pas d\'accès'}`}
                        >
                          <option value="pending">⏳ En attente (Pas d'accès)</option>
                          <option value="active">✅ Actif (Accès complet)</option>
                          <option value="inactive">🚫 Inactif (Pas d'accès)</option>
                        </select>
                        {user.role === 'student' && user.status === 'active' && (
                          <button
                            onClick={() => handleResetProgress(user._id)}
                            className="admin-btn admin-btn-reset"
                            title="Réinitialiser la progression"
                          >
                            🔄 Reset
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteUser(user)}
                          className="admin-btn admin-btn-delete"
                          title="Supprimer l'utilisateur"
                        >
                          🗑️ Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {editingUser && (
        <div className="admin-modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h2>Modifier l'utilisateur</h2>
                <p className="admin-modal-subtitle">
                  Le statut contrôle l'accès aux cours, vidéos, chat et ressources
                </p>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="admin-modal-close"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleUpdate} className="admin-modal-form">
              <div className="admin-form-section">
                <h3 className="admin-form-section-title">📝 Informations personnelles</h3>
                <div className="admin-form-group">
                  <label>Nom complet *</label>
                  <input
                    type="text"
                    value={editingUser.name || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    required
                    className="admin-form-input"
                    placeholder="Nom de l'utilisateur"
                  />
                </div>
                <div className="admin-form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    required
                    className="admin-form-input"
                    placeholder="email@exemple.com"
                  />
                </div>
                <div className="admin-form-group">
                  <label>Numéro de téléphone *</label>
                  <input
                    type="tel"
                    value={editingUser.phoneNumber || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, phoneNumber: e.target.value })}
                    required
                    className="admin-form-input"
                    placeholder="+237 6 76 77 83 77"
                  />
                </div>
              </div>

              <div className="admin-form-section">
                <h3 className="admin-form-section-title">🔐 Paramètres de compte</h3>
                <div className="admin-form-group">
                  <label>Rôle:</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                    className="admin-form-input"
                  >
                    <option value="student">👤 Étudiant</option>
                    <option value="superadmin">🔐 Super Admin</option>
                  </select>
                </div>
              <div className="admin-form-group">
                <label>Statut:</label>
                <select
                  value={editingUser.status}
                  onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })}
                  className="admin-form-input"
                >
                  <option value="pending">⏳ En attente (Pas d'accès)</option>
                  <option value="active">✅ Actif (Accès complet)</option>
                  <option value="inactive">🚫 Inactif (Pas d'accès)</option>
                </select>
                <small className="admin-form-help">
                  {editingUser.status === 'active' && (
                    <span className="admin-help-success">
                      ✅ L'utilisateur aura accès à tous les cours, vidéos, chat et ressources
                    </span>
                  )}
                  {(editingUser.status === 'pending' || editingUser.status === 'inactive') && (
                    <span className="admin-help-warning">
                      ⚠️ L'utilisateur n'aura PAS accès aux cours, vidéos, chat et ressources
                    </span>
                  )}
                </small>
              </div>
              </div>
              <div className="admin-modal-actions">
                <button type="button" onClick={() => setEditingUser(null)} className="admin-btn admin-btn-secondary">
                  Annuler
                </button>
                <button type="submit" className="admin-btn admin-btn-primary">
                  💾 Enregistrer les modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteUser && (
        <div className="admin-modal-overlay" onClick={() => setDeleteUser(null)}>
          <div className="admin-modal admin-modal-confirm" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>Confirmer la suppression</h2>
              <button
                onClick={() => setDeleteUser(null)}
                className="admin-modal-close"
              >
                ×
              </button>
            </div>
            <div className="admin-modal-body">
              <p>Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>{deleteUser.email}</strong> ?</p>
              <p className="admin-warning">Cette action est irréversible.</p>
            </div>
            <div className="admin-modal-actions">
              <button
                onClick={() => setDeleteUser(null)}
                className="admin-btn admin-btn-secondary"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="admin-btn admin-btn-danger"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedUser && (
        <div className="admin-modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="admin-modal admin-modal-confirm" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h2>Gérer l'utilisateur</h2>
                <p className="admin-modal-subtitle">
                  {selectedUser.name || selectedUser.email}
                </p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="admin-modal-close"
              >
                ×
              </button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-user-details">
                <div className="admin-user-detail-row">
                  <strong>Email:</strong>
                  <span>{selectedUser.email}</span>
                </div>
                {selectedUser.phoneNumber && (
                  <div className="admin-user-detail-row">
                    <strong>Téléphone:</strong>
                    <span>{selectedUser.phoneNumber}</span>
                  </div>
                )}
                <div className="admin-user-detail-row">
                  <strong>Statut actuel:</strong>
                  <span className={`admin-badge ${getStatusBadge(selectedUser.status).class}`}>
                    {getStatusBadge(selectedUser.status).label}
                  </span>
                </div>
                {selectedUser.role === 'student' && selectedUser.status === 'active' && (
                  <div className="admin-user-detail-row">
                    <strong>Progression:</strong>
                    <span>
                      {selectedUser.progressStats?.completedLessons || selectedUser.progressStats?.completedCourses || 0} / {selectedUser.progressStats?.totalLessons || selectedUser.progressStats?.totalCourses || 0} ({selectedUser.progressStats?.progressPercentage || 0}%)
                    </span>
                  </div>
                )}
              </div>
              <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                <div className="admin-form-group">
                  <label>Changer le statut:</label>
                  <select
                    value={selectedUser.status}
                    onChange={async (e) => {
                      const newStatus = e.target.value
                      const success = await handleStatusChange(selectedUser._id, newStatus)
                      if (success) {
                        // Mettre à jour le statut localement après le succès
                        setSelectedUser(prev => ({ ...prev, status: newStatus }))
                      }
                    }}
                    className="admin-status-select"
                    style={{ width: '100%' }}
                  >
                    <option value="pending">⏳ En attente (Pas d'accès)</option>
                    <option value="active">✅ Actif (Accès complet)</option>
                    <option value="inactive">🚫 Inactif (Pas d'accès)</option>
                  </select>
                  <small className="admin-form-help">
                    {selectedUser.status === 'active' && (
                      <span className="admin-help-success">
                        ✅ L'utilisateur a accès à tous les cours, vidéos, chat et ressources
                      </span>
                    )}
                    {(selectedUser.status === 'pending' || selectedUser.status === 'inactive') && (
                      <span className="admin-help-warning">
                        ⚠️ L'utilisateur n'a PAS accès aux cours, vidéos, chat et ressources
                      </span>
                    )}
                  </small>
                </div>
              </div>
            </div>
            <div className="admin-modal-actions" style={{ flexDirection: 'column', gap: '10px' }}>
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
                  className="admin-btn admin-btn-reset"
                  style={{ width: '100%' }}
                >
                  🔄 Réinitialiser la progression
                </button>
              )}
              <button
                onClick={() => setSelectedUser(null)}
                className="admin-btn admin-btn-secondary"
                style={{ width: '100%' }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


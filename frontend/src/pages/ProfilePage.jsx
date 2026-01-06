import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { CONFIG } from '../config/config'
import { lessons } from '../data/lessons'
import '../styles/profile.css'

export default function ProfilePage() {
  const { user, token, logout, updateUser, updateProfile, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [progress, setProgress] = useState(null)
  const [progressLoading, setProgressLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editPhoneNumber, setEditPhoneNumber] = useState('')

  useEffect(() => {
    // Log pour déboguer
    console.log('👤 ProfilePage - Données utilisateur:', user);
    if (user) {
      console.log(`   Nom: "${user.name || 'MANQUANT'}"`);
      console.log(`   Email: "${user.email || 'MANQUANT'}"`);
      console.log(`   Téléphone: "${user.phoneNumber || 'MANQUANT'}"`);
      console.log(`   Statut: "${user.status || 'MANQUANT'}"`);
    }
    
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/profil' } } })
    } else if (user.status === 'active' && token) {
      fetchProgress()
    }

    // Rafraîchir les données utilisateur périodiquement pour détecter les changements de statut
    const refreshInterval = setInterval(async () => {
      if (token && user) {
        const result = await refreshUser()
        if (result.success && result.statusChanged) {
          setMessage({ 
            type: 'success', 
            text: `Votre statut a été mis à jour: ${result.user.status === 'active' ? 'Actif' : result.user.status === 'pending' ? 'En attente' : 'Inactif'}` 
          })
          // Si le statut devient actif, charger la progression
          if (result.user.status === 'active' && token) {
            fetchProgress()
          }
        }
      }
    }, 10000) // Vérifier toutes les 10 secondes

    // Écouter les événements de mise à jour de progression
    const handleProgressUpdate = () => {
      if (user?.status === 'active' && token) {
        fetchProgress()
      }
    }

    // Écouter les événements de changement de statut depuis l'admin
    const handleStatusChange = async (event) => {
      if (token) {
        console.log('📢 Événement userStatusChanged reçu:', event.detail)
        const result = await refreshUser()
        if (result.success && result.statusChanged) {
          setMessage({ 
            type: 'success', 
            text: `Votre statut a été mis à jour: ${result.user.status === 'active' ? 'Actif' : result.user.status === 'pending' ? 'En attente' : 'Inactif'}` 
          })
          // Si le statut devient actif, charger la progression
          if (result.user.status === 'active' && token) {
            fetchProgress()
          }
        }
      }
    }

    window.addEventListener('progressUpdated', handleProgressUpdate)
    window.addEventListener('userStatusChanged', handleStatusChange)

    return () => {
      clearInterval(refreshInterval)
      window.removeEventListener('progressUpdated', handleProgressUpdate)
      window.removeEventListener('userStatusChanged', handleStatusChange)
    }
  }, [user, token, navigate, refreshUser])

  const fetchProgress = async () => {
    if (!token || user?.status !== 'active') return
    
    setProgressLoading(true)
    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/api/progress`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setProgress(data.progress)
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la progression:', error)
    } finally {
      setProgressLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleEdit = () => {
    setEditName(user.name || '')
    setEditPhoneNumber(user.phoneNumber || '')
    setIsEditing(true)
    setMessage({ type: '', text: '' })
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditName('')
    setEditPhoneNumber('')
    setMessage({ type: '', text: '' })
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    // Validation
    if (!editName || editName.trim().length < 2) {
      setMessage({ type: 'error', text: 'Le nom doit contenir au moins 2 caractères' })
      setLoading(false)
      return
    }

    if (!editPhoneNumber || editPhoneNumber.trim().length < 5) {
      setMessage({ type: 'error', text: 'Le numéro de téléphone doit contenir au moins 5 caractères' })
      setLoading(false)
      return
    }

    try {
      const result = await updateProfile(editName.trim(), editPhoneNumber.trim())
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Profil mis à jour avec succès !' })
        setIsEditing(false)
        // Le contexte est déjà mis à jour par updateProfile
      } else {
        setMessage({ type: 'error', text: result.error || 'Erreur lors de la mise à jour' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Erreur lors de la mise à jour' })
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return null
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active':
        return { text: 'Actif', class: 'status-active' }
      case 'pending':
        return { text: 'En attente', class: 'status-pending' }
      default:
        return { text: status, class: 'status-default' }
    }
  }

  const status = getStatusLabel(user.status)

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>👤 Mon Profil</h1>
        <p>Gérez vos informations personnelles</p>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="profile-card">
        <div className="profile-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2>Informations du compte</h2>
            {!isEditing && (
              <button 
                onClick={handleEdit}
                className="edit-profile-btn"
                disabled={loading}
              >
                ✏️ Modifier
              </button>
            )}
          </div>
          
          {isEditing ? (
            <form onSubmit={handleSaveProfile}>
              <div className="profile-field">
                <label htmlFor="editName">Nom complet</label>
                <input
                  type="text"
                  id="editName"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="profile-input"
                  required
                  minLength={2}
                  disabled={loading}
                />
              </div>

              <div className="profile-field">
                <label>Email</label>
                <div className="profile-value">{user.email || 'Non renseigné'}</div>
                <small style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  L'email ne peut pas être modifié
                </small>
              </div>

              <div className="profile-field">
                <label htmlFor="editPhoneNumber">Numéro de téléphone</label>
                <input
                  type="tel"
                  id="editPhoneNumber"
                  value={editPhoneNumber}
                  onChange={(e) => setEditPhoneNumber(e.target.value)}
                  className="profile-input"
                  required
                  minLength={5}
                  disabled={loading}
                  placeholder="+237 6 76 77 83 77"
                />
              </div>

              <div className="profile-edit-actions">
                <button 
                  type="submit"
                  className="save-profile-btn"
                  disabled={loading}
                >
                  {loading ? 'Enregistrement...' : '💾 Enregistrer'}
                </button>
                <button 
                  type="button"
                  onClick={handleCancelEdit}
                  className="cancel-profile-btn"
                  disabled={loading}
                >
                  Annuler
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="profile-field">
                <label>Nom complet</label>
                <div className="profile-value">{user.name?.trim() || user.name || 'Non renseigné'}</div>
              </div>

              <div className="profile-field">
                <label>Email</label>
                <div className="profile-value">{user.email || 'Non renseigné'}</div>
              </div>

              <div className="profile-field">
                <label>Numéro de téléphone</label>
                <div className="profile-value">{user.phoneNumber?.trim() || user.phoneNumber || 'Non renseigné'}</div>
              </div>
            </>
          )}

          <div className="profile-field">
            <label>Statut</label>
            <div className={`profile-value ${status.class}`}>
              {status.text}
            </div>
          </div>

          <div className="profile-field">
            <label>Rôle</label>
            <div className="profile-value capitalize">
              {user.role === 'superadmin' ? 'Super Administrateur' : 'Étudiant'}
            </div>
          </div>

          {user.createdAt && (
            <div className="profile-field">
              <label>Date d'inscription</label>
              <div className="profile-value">
                {new Date(user.createdAt).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          )}
        </div>

        {user.status === 'pending' && (
          <div className="profile-notice profile-notice-pending">
            <div className="profile-notice-icon">⏳</div>
            <div className="profile-notice-content">
              <h3>Votre compte est en attente d'activation</h3>
              <p>
                Pour activer votre compte et accéder à toutes les vidéos de formation, 
                effectuez le paiement de la formation.
              </p>
              <div style={{ 
                marginTop: '1.5rem', 
                display: 'flex', 
                flexDirection: 'column',
                gap: '1rem',
                alignItems: 'center',
                width: '100%',
                maxWidth: '400px',
                marginLeft: 'auto',
                marginRight: 'auto'
              }}>
                <PayButton
                  amount={CONFIG.FORMATION_AMOUNT}
                  orderId={`PAY-${user?._id || user?.id || 'USER'}-${Date.now()}`}
                  onSuccess={() => {
                    console.log('Paiement initié avec succès')
                  }}
                  onError={(error) => {
                    console.error('Erreur paiement:', error)
                  }}
                />
                <div style={{ 
                  fontSize: '0.9rem', 
                  color: 'var(--text-secondary)',
                  margin: '0.5rem 0'
                }}>
                  ou
                </div>
                <a
                  href={`https://wa.me/${CONFIG.MORGAN_PHONE}?text=${encodeURIComponent(CONFIG.WHATSAPP_MESSAGE)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '0.75rem 1.5rem',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    color: '#fff',
                    backgroundColor: '#25D366',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'background-color 0.2s',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    width: '100%',
                    justifyContent: 'center'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = '#20BA5A'
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = '#25D366'
                  }}
                >
                  <span>💬</span>
                  <span>Contacter sur WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {user.status === 'active' && (
          <div className="profile-section">
            <h2>📊 Ma Progression</h2>
            
            {progressLoading ? (
              <div className="progress-loading">Chargement de votre progression depuis la base de données...</div>
            ) : progress ? (
              <>
                <div className="progress-stats">
                  <div className="progress-stat-card">
                    <div className="progress-stat-value">{progress.progressPercentage || 0}%</div>
                    <div className="progress-stat-label">Progression globale</div>
                  </div>
                  <div className="progress-stat-card">
                    <div className="progress-stat-value">
                      {progress.completedLessons || progress.completedCourses || 0}/{progress.totalLessons || lessons.length}
                    </div>
                    <div className="progress-stat-label">Leçons complétées</div>
                  </div>
                  <div className="progress-stat-card">
                    <div className="progress-stat-value">
                      {(progress.totalLessons || lessons.length) - (progress.completedLessons || progress.completedCourses || 0)}
                    </div>
                    <div className="progress-stat-label">Leçons restantes</div>
                  </div>
                </div>

                <div className="progress-bar-container">
                  <div 
                    className="progress-bar-fill" 
                    style={{ width: `${progress.progressPercentage || 0}%` }}
                  ></div>
                </div>
                <div className="progress-bar-info">
                  <span>{progress.progressPercentage || 0}% complété</span>
                </div>

                <div className="progress-lessons">
                  <h3>📚 Leçons de la formation</h3>
                  <div className="lessons-grid">
                    {progress.courses && progress.courses.length > 0 ? (
                      progress.courses.map((course, index) => {
                        // Trouver la leçon correspondante
                        const lesson = lessons[index]
                        if (!lesson) return null
                        
                        const isCompleted = course.completed || false
                        return (
                          <Link 
                            key={lesson.id} 
                            to={lesson.path} 
                            className={`lesson-progress-card ${isCompleted ? 'completed' : ''}`}
                          >
                            <div className="lesson-progress-icon">
                              {isCompleted ? '✅' : '📚'}
                            </div>
                            <div className="lesson-progress-content">
                              <h4>{lesson.badge}</h4>
                              <p>{lesson.title}</p>
                            </div>
                            {isCompleted && (
                              <div className="lesson-progress-badge">Complété</div>
                            )}
                          </Link>
                        )
                      }).filter(Boolean)
                    ) : (
                      lessons.map((lesson, index) => {
                        const lessonNumber = index + 1
                        const completedLessons = progress.completedLessons || progress.completedCourses || 0
                        const isCompleted = lessonNumber <= completedLessons
                        return (
                          <Link 
                            key={lesson.id} 
                            to={lesson.path} 
                            className={`lesson-progress-card ${isCompleted ? 'completed' : ''}`}
                          >
                            <div className="lesson-progress-icon">
                              {isCompleted ? '✅' : '📚'}
                            </div>
                            <div className="lesson-progress-content">
                              <h4>{lesson.badge}</h4>
                              <p>{lesson.title}</p>
                            </div>
                            {isCompleted && (
                              <div className="lesson-progress-badge">Complété</div>
                            )}
                          </Link>
                        )
                      })
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="progress-empty">
                <p>Aucune progression disponible pour le moment.</p>
                <p className="progress-empty-hint">Commencez votre première leçon pour démarrer votre progression !</p>
              </div>
            )}
          </div>
        )}

        <div className="profile-actions">
          <button 
            onClick={handleLogout}
            className="logout-btn"
            disabled={loading}
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  )
}


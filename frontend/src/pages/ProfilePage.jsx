import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { CONFIG } from '../config/config'
import { lessons } from '../data/lessons'
import SubscriptionButton from '../components/SubscriptionButton'

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
    console.log('ProfilePage - Données utilisateur:', user);
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
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">👤</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Mon Profil</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Chargement de votre profil...</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
              Si cette page ne se charge pas, veuillez vous reconnecter.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-3 bg-brand text-white font-semibold rounded-xl hover:bg-brand-600 transition-colors"
            >
              Se connecter
            </button>
          </div>
        </div>
      </div>
    )
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-3">👤 Mon Profil</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">Gérez vos informations personnelles</p>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 lg:p-8 mb-6">
          <div className="mb-5">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-0">Informations du compte</h2>
            {!isEditing && (
              <button 
                onClick={handleEdit}
                className="btn-profile-primary"
                disabled={loading}
              >
                ✏️ Modifier
              </button>
            )}
          </div>
          
          {isEditing ? (
            <form onSubmit={handleSaveProfile}>
              <div className="field-profile">
                <label htmlFor="editName">Nom complet</label>
                <input
                  type="text"
                  id="editName"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="input-profile"
                  required
                  minLength={2}
                  disabled={loading}
                />
              </div>

              <div className="field-profile">
                <label >Email</label>
                <div className="value-profile">{user.email || 'Non renseigné'}</div>
                <small className="text-gray-500 dark:text-gray-400 text-xs">
                  L'email ne peut pas être modifié
                </small>
              </div>

              <div className="field-profile">
                <label htmlFor="editPhoneNumber">Numéro de téléphone</label>
                <input
                  type="tel"
                  id="editPhoneNumber"
                  value={editPhoneNumber}
                  onChange={(e) => setEditPhoneNumber(e.target.value)}
                  className="input-profile"
                  required
                  minLength={5}
                  disabled={loading}
                  placeholder="+237 6 76 77 83 77"
                />
              </div>

              <div className="actions-profile-edit">
                <button 
                  type="submit"
                  className="btn-profile-primary"
                  disabled={loading}
                >
                  {loading ? 'Enregistrement...' : '💾 Enregistrer'}
                </button>
                <button 
                  type="button"
                  onClick={handleCancelEdit}
                  className="btn-profile-secondary"
                  disabled={loading}
                >
                  Annuler
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="field-profile">
                <label>Nom complet</label>
                <div className="value-profile">{user.name?.trim() || user.name || 'Non renseigné'}</div>
              </div>

              <div className="field-profile">
                <label >Email</label>
                <div className="value-profile">{user.email || 'Non renseigné'}</div>
              </div>

              <div className="field-profile">
                <label>Numéro de téléphone</label>
                <div className="value-profile">{user.phoneNumber?.trim() || user.phoneNumber || 'Non renseigné'}</div>
              </div>
            </>
          )}

          <div className="field-profile">
            <label>Statut</label>
            <div className={`value-profile ${status.class}`}>
              {status.text}
            </div>
          </div>

          <div className="field-profile">
            <label>Rôle</label>
            <div className="value-profile capitalize">
              {user.role === 'superadmin' ? 'Super Administrateur' : 'Étudiant'}
            </div>
          </div>

          {user.createdAt && (
            <div className="field-profile">
              <label>Date d'inscription</label>
              <div className="value-profile">
                {new Date(user.createdAt).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          )}
        </div>

        {user.status !== 'active' && (!user.subscriptionExpiry || new Date(user.subscriptionExpiry) <= new Date()) && (
          <div className="notice-profile notice-profile-pending">
            <div className="notice-profile-content">
              <h3>Abonnez-vous pour accéder à toutes les vidéos</h3>
              <p>
                Pour débloquer toutes les vidéos de formation, choisissez votre abonnement. 
                Accès illimité à tous les cours et ressources.
              </p>
              <div className="mt-6 w-full max-w-2xl mx-auto">
                <SubscriptionButton
                  onSuccess={() => {
                    console.log('Paiement abonnement initié avec succès')
                  }}
                  onError={(error) => {
                    console.error('Erreur paiement abonnement:', error)
                  }}
                />
                <div className="text-sm text-gray-600 dark:text-gray-400 my-2 text-center">
                  ou
                </div>
                <a
                  href={`https://wa.me/${CONFIG.MORGAN_PHONE}?text=${encodeURIComponent(CONFIG.WHATSAPP_MESSAGE)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-whatsapp"
                >
                  <span>Contacter sur WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {user.status === 'active' && (
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">📊 Ma Progression</h2>
            
            {progressLoading ? (
              <div className="text-center py-5 text-gray-500 dark:text-gray-400 italic">Chargement de votre progression depuis la base de données...</div>
            ) : progress ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                  <div className="card-profile-stat">
                    <div className="text-2xl font-bold text-brand dark:text-brand-400 mb-2">{progress.progressPercentage || 0}%</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">Progression globale</div>
                  </div>
                  <div className="card-profile-stat">
                    <div className="text-2xl font-bold text-brand dark:text-brand-400 mb-2">
                      {progress.completedLessons || progress.completedCourses || 0}/{progress.totalLessons || lessons.length}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">Leçons complétées</div>
                  </div>
                  <div className="card-profile-stat">
                    <div className="text-2xl font-bold text-brand dark:text-brand-400 mb-2">
                      {(progress.totalLessons || lessons.length) - (progress.completedLessons || progress.completedCourses || 0)}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">Leçons restantes</div>
                  </div>
                </div>

                <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-2xl overflow-hidden mb-2 border-2 border-gray-300 dark:border-gray-600 relative shadow-inner">
                  <div 
                    className="h-full bg-brand rounded transition-all duration-500 relative overflow-hidden"
                    style={{ width: `${progress.progressPercentage || 0}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                  </div>
                </div>
                <div className="text-center text-xs text-gray-600 dark:text-gray-400 mb-6 font-medium">
                  <span>{progress.progressPercentage || 0}% complété</span>
                </div>

                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Leçons de la formation</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                            className={`card-profile-lesson ${isCompleted ? 'completed' : ''}`}
                          >
                            <div className="text-2xl flex-shrink-0">
                              {isCompleted ? '✅' : ''}
                            </div>
                            <div className="flex-1">
                              <h4 className="text-xs font-semibold text-brand dark:text-brand-400 mb-1 uppercase tracking-wide">{lesson.badge}</h4>
                              <p className="text-sm text-gray-900 dark:text-gray-100 m-0 leading-snug">{lesson.title}</p>
                            </div>
                            {isCompleted && (
                              <div className="absolute top-4 right-4 bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 px-3 py-1 rounded-2xl text-xs font-semibold uppercase">Complété</div>
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
                            className={`card-profile-lesson ${isCompleted ? 'completed' : ''}`}
                          >
                            <div className="text-2xl flex-shrink-0">
                              {isCompleted ? '✅' : ''}
                            </div>
                            <div className="flex-1">
                              <h4 className="text-xs font-semibold text-brand dark:text-brand-400 mb-1 uppercase tracking-wide">{lesson.badge}</h4>
                              <p className="text-sm text-gray-900 dark:text-gray-100 m-0 leading-snug">{lesson.title}</p>
                            </div>
                            {isCompleted && (
                              <div className="absolute top-4 right-4 bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 px-3 py-1 rounded-2xl text-xs font-semibold uppercase">Complété</div>
                            )}
                          </Link>
                        )
                      })
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-5 text-gray-500 dark:text-gray-400 italic">
                <p>Aucune progression disponible pour le moment.</p>
                <p className="text-xs opacity-80 mt-2">Commencez votre première leçon pour démarrer votre progression !</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          <button 
            onClick={handleLogout}
            className="px-7 py-3.5 bg-brand text-white rounded-2xl text-sm font-semibold cursor-pointer transition-all duration-200 hover:bg-brand-600 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={loading}
          >
            Se déconnecter
          </button>
        </div>
        </div>
      </div>
    </div>
  )
}


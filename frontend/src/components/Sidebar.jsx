import { Link, useLocation } from 'react-router-dom'
import { lessons } from '../data/lessons'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { CONFIG } from '../config/config'
import ThemeToggle from './ThemeToggle'

export default function Sidebar() {
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const { isAuthenticated, user, token, logout, refreshUser } = useAuth()
  const [progress, setProgress] = useState(null)
  const [progressLoading, setProgressLoading] = useState(false)

  const toggleMenu = () => setIsOpen(!isOpen)

  const fetchProgress = useCallback(async () => {
    if (!token || user?.status !== 'active') {
      setProgress(null)
      return
    }
    
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
      } else {
        console.error('Erreur API progression:', response.status)
        setProgress(null)
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la progression:', error)
      setProgress(null)
    } finally {
      setProgressLoading(false)
    }
  }, [token, user?.status])

  useEffect(() => {
    if (isAuthenticated && user?.status === 'active' && token) {
      fetchProgress()
    } else {
      setProgress(null)
    }

    // Écouter les événements de mise à jour de progression
    const handleProgressUpdate = () => {
      if (isAuthenticated && user?.status === 'active' && token) {
        fetchProgress()
      }
    }

    // Écouter les changements de statut utilisateur
    const handleStatusChange = async () => {
      if (token && refreshUser) {
        const result = await refreshUser()
        if (result.success && result.statusChanged) {
          // Si le statut devient actif, charger la progression
          if (result.user.status === 'active' && token) {
            fetchProgress()
          } else {
            // Si le statut n'est plus actif, vider la progression
            setProgress(null)
          }
        }
      }
    }

    window.addEventListener('progressUpdated', handleProgressUpdate)
    window.addEventListener('userStatusChanged', handleStatusChange)

    return () => {
      window.removeEventListener('progressUpdated', handleProgressUpdate)
      window.removeEventListener('userStatusChanged', handleStatusChange)
    }
  }, [isAuthenticated, user, token, fetchProgress, refreshUser])

  return (
    <>
      <button 
        className="mobile-menu-toggle" 
        aria-label="Menu"
        onClick={toggleMenu}
      >
        ☰
      </button>
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h1>📚 Formation FB Ads</h1>
          <p>Maîtrisez la publicité Facebook</p>
        </div>
        <nav>
          <ul className="sidebar-nav">
            {lessons.map((lesson) => (
              <li key={lesson.id}>
                <Link
                  to={lesson.path}
                  className={location.pathname === lesson.path ? 'active' : ''}
                  onClick={() => setIsOpen(false)}
                >
                  <span className="lesson-number">{lesson.id}</span>
                  {lesson.title}
                </Link>
              </li>
            ))}
                 </ul>
               </nav>

               {isAuthenticated && user?.status === 'active' && (
                 <div className="sidebar-comments-link">
                   <Link
                     to="/commentaires"
                     className={`sidebar-auth-link ${location.pathname === '/commentaires' ? 'active' : ''}`}
                     onClick={() => setIsOpen(false)}
                   >
                     💬 Commentaires
                   </Link>
                 </div>
               )}
        
        {isAuthenticated && user?.status === 'active' && (
          <div className="sidebar-progress">
            {progressLoading ? (
              <div className="sidebar-progress-loading">Chargement...</div>
            ) : progress ? (
              <>
                <div className="sidebar-progress-header">
                  <span className="sidebar-progress-label">📊 Ma Progression</span>
                  <span className="sidebar-progress-percentage">{progress.progressPercentage || 0}%</span>
                </div>
                <div className="sidebar-progress-bar-container">
                  <div 
                    className="sidebar-progress-bar-fill" 
                    style={{ width: `${progress.progressPercentage || 0}%` }}
                  ></div>
                </div>
                <div className="sidebar-progress-info">
                  {progress.completedLessons || progress.completedCourses || 0} / {progress.totalLessons || 8} leçons complétées
                </div>
              </>
            ) : (
              <>
                <div className="sidebar-progress-header">
                  <span className="sidebar-progress-label">📊 Ma Progression</span>
                  <span className="sidebar-progress-percentage">0%</span>
                </div>
                <div className="sidebar-progress-bar-container">
                  <div 
                    className="sidebar-progress-bar-fill" 
                    style={{ width: '0%' }}
                  ></div>
                </div>
                <div className="sidebar-progress-info">
                  0 / 8 leçons complétées
                </div>
              </>
            )}
          </div>
        )}

        <ThemeToggle />

        <div className="sidebar-auth">
          {isAuthenticated ? (
            <>
                     <Link
                       to="/profil"
                       className={`sidebar-auth-link ${location.pathname === '/profil' ? 'active' : ''}`}
                       onClick={() => setIsOpen(false)}
                     >
                       👤 {user?.name?.trim() || user?.email || 'Mon Profil'}
                     </Link>
              {user?.role === 'superadmin' && (
                <Link
                  to="/admin"
                  className={`sidebar-auth-link ${location.pathname.startsWith('/admin') ? 'active' : ''}`}
                  onClick={() => setIsOpen(false)}
                >
                  🔐 Administration
                </Link>
              )}
              <button
                onClick={() => {
                  logout()
                  setIsOpen(false)
                }}
                className="sidebar-logout-btn"
              >
                Se déconnecter
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className={`sidebar-auth-link ${location.pathname === '/login' ? 'active' : ''}`}
                onClick={() => setIsOpen(false)}
              >
                🔐 Se connecter
              </Link>
              <Link
                to="/admin/login"
                className="sidebar-auth-link sidebar-admin-link"
                onClick={() => setIsOpen(false)}
              >
                🔐 Espace Admin
              </Link>
            </>
          )}
        </div>
      </aside>
    </>
  )
}


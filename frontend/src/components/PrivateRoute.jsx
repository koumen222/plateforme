import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function PrivateRoute({ children }) {
  const { user, token, loading } = useAuth()
  
  if (loading) {
    // Afficher un loader pendant le chargement pour éviter la page blanche
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{ fontSize: '2rem' }}>⏳</div>
        <p>Chargement...</p>
      </div>
    )
  }
  
  // Vérifier le token depuis localStorage (fallback si le contexte n'est pas encore chargé)
  const storedToken = localStorage.getItem('token')
  const hasToken = token || storedToken
  
  // Si pas de token OU pas d'utilisateur → rediriger vers login
  if (!hasToken || !user) {
    console.log('🛡️ Accès refusé - Token ou utilisateur manquant')
    console.log('   - Token présent:', !!hasToken)
    console.log('   - User présent:', !!user)
    return <Navigate to="/login" replace />
  }
  
  // Si l'utilisateur est en pending, afficher le dashboard normalement
  // Le composant enfant (LessonPage) gérera l'affichage du message pending
  return children
}


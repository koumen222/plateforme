import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return null // Ou un spinner de chargement
  }
  
  if (!user) {
    return <Navigate to="/login" />
  }
  
  // Si l'utilisateur est en pending, afficher un message au lieu de bloquer complètement
  // Le composant enfant pourra gérer l'affichage du message pending
  return children
}


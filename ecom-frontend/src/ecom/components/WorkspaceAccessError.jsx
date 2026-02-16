import React from 'react';
import { useNavigate } from 'react-router-dom';

const WorkspaceAccessError = ({ error, onRetry, onReload }) => {
  const navigate = useNavigate();
  
  const handleGoToLogin = () => {
    // Nettoyer les données et retourner au login
    localStorage.removeItem('ecomToken');
    localStorage.removeItem('ecomUser');
    localStorage.removeItem('ecomWorkspace');
    navigate('/login');
  };
  
  const handleReload = () => {
    window.location.reload();
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
        <div className="text-center">
          {/* Icône d'erreur */}
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Accès au workspace refusé
          </h3>
          
          <p className="text-sm text-gray-600 mb-6">
            {error?.message || 'Vous n\'avez pas les permissions nécessaires pour accéder à ce workspace.'}
          </p>
          
          {/* Options */}
          <div className="space-y-3">
            <button
              onClick={onRetry || handleReload}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              🔄 Réessayer
            </button>
            
            <button
              onClick={handleGoToLogin}
              className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              🔐 Se reconnecter
            </button>
            
            <button
              onClick={() => navigate('/')}
              className="w-full text-blue-600 hover:text-blue-800 text-sm transition"
            >
              🏠 Retour à l'accueil
            </button>
          </div>
          
          {/* Informations de debug */}
          <details className="mt-6 text-left">
            <summary className="text-xs text-gray-500 cursor-pointer">Informations techniques</summary>
            <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
              <p><strong>Erreur:</strong> {error?.message || 'Inconnue'}</p>
              <p><strong>URL:</strong> {window.location.href}</p>
              <p><strong>Workspace:</strong> {JSON.parse(localStorage.getItem('ecomWorkspace') || 'null')?.name || 'Non défini'}</p>
              <p><strong>User:</strong> {JSON.parse(localStorage.getItem('ecomUser') || 'null')?.email || 'Non connecté'}</p>
            </div>
          </details>
          
          {/* Conseils */}
          <div className="mt-6 text-left">
            <h4 className="text-sm font-medium text-gray-900 mb-2">💡 Solutions possibles:</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Vérifiez que vous êtes bien membre de ce workspace</li>
              <li>• Contactez l'administrateur du workspace</li>
              <li>• Reconnectez-vous pour rafraîchir vos permissions</li>
              <li>• Sélectionnez un autre workspace si vous y avez accès</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceAccessError;

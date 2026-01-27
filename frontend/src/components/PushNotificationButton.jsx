import { useState, useEffect } from 'react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { FiBell, FiBellOff } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

/**
 * Composant bouton pour activer/désactiver les notifications push
 * 
 * Affiche un bouton avec une icône qui change selon l'état d'abonnement
 * Gère automatiquement la demande de permission et l'abonnement
 */
export default function PushNotificationButton() {
  const { isAuthenticated, user } = useAuth();

  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    requestPermission
  } = usePushNotifications();

  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipMessage, setTooltipMessage] = useState('');

  // Déterminer le message du tooltip selon l'état
  useEffect(() => {
    if (permission === 'denied') {
      setTooltipMessage('Notifications bloquées. Activez dans les paramètres.');
    } else if (isSubscribed) {
      setTooltipMessage('Notifications activées');
    } else {
      setTooltipMessage('Activer les notifications push');
    }
  }, [permission, isSubscribed]);

  const handleToggle = async () => {
    try {
      if (isSubscribed) {
        // Se désabonner
        await unsubscribe();
        setTooltipMessage('Notifications désactivées');
        setShowTooltip(true);
        setTimeout(() => setShowTooltip(false), 2000);
      } else {
        // Demander la permission si nécessaire
        if (permission === 'default') {
          const newPermission = await requestPermission();
          if (newPermission !== 'granted') {
            setTooltipMessage('Permission refusée. Activez dans les paramètres du navigateur.');
            setShowTooltip(true);
            setTimeout(() => setShowTooltip(false), 3000);
            return;
          }
        }

        // S'abonner
        await subscribe({
          deviceInfo: `${navigator.userAgentData?.platform || 'Unknown'} on ${navigator.userAgentData?.brands?.[0]?.brand || 'Unknown'}`
        });
        setTooltipMessage('Notifications activées !');
        setShowTooltip(true);
        setTimeout(() => setShowTooltip(false), 2000);
      }
    } catch (error) {
      console.error('Erreur lors du toggle des notifications:', error);
      
      let errorMessage = 'Erreur lors de l\'activation';
      if (error.message.includes('Limite atteinte')) {
        errorMessage = 'Limite de 5 appareils atteinte';
      } else if (error.message.includes('Permission')) {
        errorMessage = 'Permission refusée';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setTooltipMessage(errorMessage);
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 3000);
    }
  };

  // Ne pas afficher si l'utilisateur n'est pas authentifié ou si non supporté
  if (!isAuthenticated || !isSupported) {
    return null;
  }

  // Ne pas afficher si le compte n'est pas actif
  if (user?.status !== 'active') {
    return null;
  }

  // Ne pas afficher pendant le chargement initial
  if (isLoading && !isSubscribed) {
    return null;
  }
  
  // Styles inline pour garantir la visibilité
  const buttonStyle = {
    width: '36px',
    height: '36px',
    minWidth: '36px',
    minHeight: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    border: '1px solid rgba(0,0,0,0.1)',
    backgroundColor: isSubscribed ? '#dbeafe' : '#f3f4f6',
    color: isSubscribed ? '#2563eb' : '#6b7280',
    cursor: (isLoading || permission === 'denied') ? 'not-allowed' : 'pointer',
    opacity: (isLoading || permission === 'denied') ? 0.5 : 1,
    transition: 'all 0.2s',
    padding: 0,
    margin: 0,
    flexShrink: 0,
    position: 'relative',
    zIndex: 1
  };
  
  return (
    <div 
      className="relative" 
      data-testid="push-notification-button"
      style={{ 
        display: 'inline-flex', 
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 4px',
        width: '36px',
        height: '36px',
        flexShrink: 0
      }}
    >
      <button
        onClick={handleToggle}
        disabled={isLoading || permission === 'denied'}
        style={buttonStyle}
        className="hover:opacity-80"
        aria-label={isSubscribed ? 'Désactiver les notifications push' : 'Activer les notifications push'}
        title={tooltipMessage}
      >
        {isLoading ? (
          <div 
            style={{ 
              width: '16px', 
              height: '16px', 
              border: '2px solid currentColor', 
              borderTopColor: 'transparent', 
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              display: 'block'
            }} 
          />
        ) : isSubscribed ? (
          <FiBell style={{ width: '18px', height: '18px', display: 'block', flexShrink: 0 }} />
        ) : (
          <FiBellOff style={{ width: '18px', height: '18px', display: 'block', flexShrink: 0 }} />
        )}
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute right-0 top-full mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-50 whitespace-nowrap">
          {tooltipMessage}
          <div className="absolute -top-1 right-4 w-2 h-2 bg-gray-900 transform rotate-45" />
        </div>
      )}

      {/* Badge si permission refusée */}
      {permission === 'denied' && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-800" />
      )}
    </div>
  );
}

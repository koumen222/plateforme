import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CONFIG } from '../config/config.js';

/**
 * Composant pour tracker automatiquement les visites sur la plateforme
 * Enregistre le pays, la ville, et autres informations de géolocalisation
 */
function VisitTracker() {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    // Générer un ID de session unique (stocké dans sessionStorage)
    const getSessionId = () => {
      let sessionId = sessionStorage.getItem('visit_session_id');
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('visit_session_id', sessionId);
      }
      return sessionId;
    };

    // Fonction pour obtenir la géolocalisation depuis l'IP
    const getLocationFromIP = async () => {
      try {
        // Utiliser ipapi.co (gratuit, 1000 requêtes/jour)
        const response = await fetch('https://ipapi.co/json/');
        if (!response.ok) {
          throw new Error('Erreur récupération géolocalisation');
        }
        const data = await response.json();
        return {
          country: data.country_name || 'Unknown',
          countryCode: data.country_code || null,
          city: data.city || null,
          region: data.region || null
        };
      } catch (error) {
        console.warn('Erreur géolocalisation IP:', error);
        // Fallback sur ip-api.com si ipapi.co échoue
        try {
          const response = await fetch('http://ip-api.com/json/?fields=status,message,country,countryCode,city,regionName');
          if (response.ok) {
            const data = await response.json();
            if (data.status === 'success') {
              return {
                country: data.country || 'Unknown',
                countryCode: data.countryCode || null,
                city: data.city || null,
                region: data.regionName || null
              };
            }
          }
        } catch (fallbackError) {
          console.warn('Erreur géolocalisation IP (fallback):', fallbackError);
        }
        // Retourner des valeurs par défaut si tout échoue
        return {
          country: 'Unknown',
          countryCode: null,
          city: null,
          region: null
        };
      }
    };

    // Fonction pour enregistrer la visite
    const trackVisit = async () => {
      try {
        const sessionId = getSessionId();
        const locationData = await getLocationFromIP();
        const referrer = document.referrer || null;

        const visitData = {
          ...locationData,
          path: location.pathname,
          referrer: referrer,
          sessionId: sessionId
        };

        const response = await fetch(`${CONFIG.BACKEND_URL}/api/visits/track`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(visitData)
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Erreur enregistrement visite: ${response.status} ${errText}`);
        }

        const result = await response.json();
        // Log court en dev pour vérifier que le tracking fonctionne
        if (import.meta.env.DEV) {
          console.log('✅ Visite enregistrée:', visitData.country, visitData.path, result.visitId);
        }
      } catch (error) {
        // Toujours logger l'erreur pour diagnostiquer si le tracking échoue
        console.warn('[VisitTracker] Erreur tracking visite:', error.message);
      }
    };

    // Délai pour éviter de tracker trop rapidement lors de la navigation
    const timeoutId = setTimeout(() => {
      trackVisit();
    }, 1000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [location.pathname, user]);

  // Ce composant ne rend rien visuellement
  return null;
}

export default VisitTracker;

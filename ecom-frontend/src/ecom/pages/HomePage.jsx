import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEcomAuth } from '../hooks/useEcomAuth.jsx';

const HomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, checkDeviceRegistration } = useEcomAuth();
  const [checkingDevice, setCheckingDevice] = useState(true);
  const [deviceRegistered, setDeviceRegistered] = useState(false);

  useEffect(() => {
    const checkAuthAndDevice = async () => {
      console.log('🏠 Vérification page d\'accueil...');
      
      // Si l'utilisateur n'est pas connecté, rester sur la page d'accueil
      if (!isAuthenticated) {
        console.log('👤 Utilisateur non connecté, affichage page d\'accueil');
        setCheckingDevice(false);
        return;
      }

      // Si l'utilisateur est connecté, vérifier si l'appareil est enregistré
      console.log('👤 Utilisateur connecté, vérification appareil...');
      try {
        const isRegistered = await checkDeviceRegistration();
        setDeviceRegistered(isRegistered);
        
        if (isRegistered) {
          console.log('✅ Appareil enregistré, redirection vers dashboard...');
          // Rediriger directement vers le dashboard selon le rôle
          const roleDashboardMap = {
            'super_admin': '/super-admin',
            'ecom_admin': '/dashboard/admin',
            'ecom_closeuse': '/dashboard/closeuse',
            'ecom_compta': '/dashboard/compta',
            'livreur': '/livreur'
          };
          
          const dashboardPath = roleDashboardMap[user?.role] || '/dashboard';
          navigate(dashboardPath, { replace: true });
        } else {
          console.log('📱 Appareil non enregistré, affichage page d\'accueil');
        }
      } catch (error) {
        console.error('❌ Erreur vérification appareil:', error);
      } finally {
        setCheckingDevice(false);
      }
    };

    checkAuthAndDevice();
  }, [isAuthenticated, user, checkDeviceRegistration, navigate]);

  // Si on est en train de vérifier
  if (checkingDevice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Vérification en cours...</p>
        </div>
      </div>
    );
  }

  // Si l'utilisateur est connecté et l'appareil n'est pas enregistré
  if (isAuthenticated && !deviceRegistered) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Bienvenue {user?.name || 'sur votre espace'}
          </h2>
          <p className="text-gray-600 mb-6">
            Votre appareil n'est pas encore enregistré pour les notifications.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Accéder à mon dashboard
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Enregistrer mon appareil
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Page d'accueil normale pour les visiteurs
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Ecom Platform
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            La solution complète pour votre e-commerce
          </p>
          <div className="space-y-4">
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Se connecter
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-8 py-3 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition"
            >
              Créer un compte
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;

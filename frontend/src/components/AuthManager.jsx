import React, { useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthManager = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isPermanent, setIsPermanent] = useState(false);
  const [showRememberOption, setShowRememberOption] = useState(true);

  useEffect(() => {
    // Initialisation au chargement du composant
    const initAuth = async () => {
      try {
        const authenticated = await authService.init();
        setIsAuthenticated(authenticated);
        
        if (authenticated) {
          const status = await authService.checkDeviceStatus();
          setUser(status.user);
          setIsPermanent(status.isPermanent);
          setShowRememberOption(!status.isPermanent);
        }
      } catch (error) {
        console.error('Erreur init auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const handleLogin = async (email, password, rememberDevice = false) => {
    try {
      const response = await authService.login(email, password, rememberDevice);
      
      if (response.success) {
        setIsAuthenticated(true);
        setUser(response.data.user);
        setIsPermanent(response.data.isPermanent);
        setShowRememberOption(!response.data.isPermanent);
        
        // Si l'appareil est enregistré, ne plus montrer l'option
        if (response.data.isPermanent) {
          localStorage.setItem('hide_remember_option', 'true');
        }
        
        return response;
      }
    } catch (error) {
      console.error('Erreur login:', error);
      throw error;
    }
  };

  const handleRegisterDevice = async () => {
    try {
      const response = await authService.registerDevice();
      
      if (response.success) {
        setIsPermanent(true);
        setShowRememberOption(false);
        localStorage.setItem('hide_remember_option', 'true');
        
        // Afficher une notification
        alert('✅ Appareil enregistré ! Vous ne serez plus déconnecté.');
      }
    } catch (error) {
      console.error('Erreur register device:', error);
      alert('❌ Erreur lors de l\'enregistrement de l\'appareil');
    }
  };

  const handleRevokeDevice = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir révoquer l\'accès de cet appareil ? Vous devrez vous reconnecter.')) {
      try {
        await authService.revokeDevice();
        setIsAuthenticated(false);
        setUser(null);
        setIsPermanent(false);
        setShowRememberOption(true);
        localStorage.removeItem('hide_remember_option');
        
        // Rediriger vers la page de login
        window.location.href = '/login';
      } catch (error) {
        console.error('Erreur revoke device:', error);
        alert('❌ Erreur lors de la révocation de l\'appareil');
      }
    }
  };

  const handleLogout = () => {
    authService.logout();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Afficher la page de login
    return <LoginPage onLogin={handleLogin} showRememberOption={showRememberOption} />;
  }

  // Afficher l'application avec l'utilisateur connecté
  return (
    <div>
      {/* Header avec infos utilisateur et options d'appareil */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Ecomstarter</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-gray-700">{user?.email}</span>
              </div>
              
              {/* Options d'appareil */}
              {isPermanent && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                    📱 Appareil enregistré
                  </span>
                  <button
                    onClick={handleRevokeDevice}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Révoquer
                  </button>
                </div>
              )}
              
              {/* Bouton pour enregistrer l'appareil (si non permanent) */}
              {!isPermanent && showRememberOption && (
                <button
                  onClick={handleRegisterDevice}
                  className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                >
                  📱 Enregistrer cet appareil
                </button>
              )}
              
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu de l'application */}
      <main>
        {children}
      </main>
    </div>
  );
};

// Composant de login
const LoginPage = ({ onLogin, showRememberOption }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberDevice, setRememberDevice] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await onLogin(email, password, rememberDevice);
    } catch (error) {
      setError(error.message || 'Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Connexion à Ecomstarter
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {showRememberOption && (
              <span className="text-blue-600">
                📱 Option d'enregistrement d'appareil disponible
              </span>
            )}
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Adresse email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {showRememberOption && (
            <div className="flex items-center">
              <input
                id="remember-device"
                name="remember-device"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
              />
              <label htmlFor="remember-device" className="ml-2 block text-sm text-gray-900">
                📱 Enregistrer cet appareil (ne plus jamais se déconnecter)
              </label>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                'Se connecter'
              )}
            </button>
          </div>

          {showRememberOption && (
            <div className="text-xs text-gray-500 text-center">
              <p>
                ✅ Enregistrez votre appareil pour ne plus jamais avoir à vous reconnecter
              </p>
              <p className="mt-1">
                🔒 Votre session restera active même après fermeture du navigateur
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AuthManager;

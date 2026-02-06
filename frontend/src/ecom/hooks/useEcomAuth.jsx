import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authApi } from '../services/ecommApi.js';

// Contexte d'authentification e-commerce
const EcomAuthContext = createContext();

// État initial
const initialState = {
  user: null,
  workspace: JSON.parse(localStorage.getItem('ecomWorkspace') || 'null'),
  token: localStorage.getItem('ecomToken'),
  isAuthenticated: false,
  loading: true,
  error: null
};

// Reducer pour gérer les états d'authentification
const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        loading: true,
        error: null
      };
    
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        workspace: action.payload.workspace || state.workspace,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
        error: null
      };
    
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload
      };
    
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        workspace: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null
      };
    
    case 'LOAD_USER_SUCCESS':
      return {
        ...state,
        user: action.payload.user || action.payload,
        workspace: action.payload.workspace || state.workspace,
        isAuthenticated: true,
        loading: false,
        error: null
      };
    
    case 'LOAD_USER_FAILURE':
      return {
        ...state,
        user: null,
        workspace: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null
      };
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    
    default:
      return state;
  }
};

// Provider d'authentification
export const EcomAuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Effacer le token du localStorage
  const clearToken = () => {
    localStorage.removeItem('ecomToken');
    localStorage.removeItem('ecomUser');
    localStorage.removeItem('ecomWorkspace');
  };

  // Sauvegarder le token dans le localStorage
  const saveToken = (token, user, workspace) => {
    localStorage.setItem('ecomToken', token);
    localStorage.setItem('ecomUser', JSON.stringify(user));
    if (workspace) localStorage.setItem('ecomWorkspace', JSON.stringify(workspace));
  };

  // Charger l'utilisateur depuis le token
  const loadUser = async () => {
    const token = localStorage.getItem('ecomToken');
    console.log('🔍 Vérification du token:', token ? 'Token trouvé' : 'Pas de token');
    
    if (!token) {
      dispatch({ type: 'LOAD_USER_FAILURE' });
      return;
    }

    try {
      console.log('👤 Tentative de chargement du profil...');
      console.log('🔑 Token utilisé:', token);
      
      const response = await authApi.getProfile();
      console.log('📩 Réponse complète de getProfile:', response);
      console.log('📦 Données utilisateur:', response.data);
      
      const wsData = response.data.data.workspace;
      if (wsData) localStorage.setItem('ecomWorkspace', JSON.stringify(wsData));
      
      dispatch({
        type: 'LOAD_USER_SUCCESS',
        payload: { user: response.data.data.user, workspace: wsData }
      });
    } catch (error) {
      console.error('❌ Erreur chargement utilisateur - Détails complets:');
      console.error('Status:', error.response?.status);
      console.error('Status Text:', error.response?.statusText);
      console.error('Response Data:', error.response?.data);
      console.error('Message:', error.message);
      console.error('Config:', error.config);
      
      clearToken();
      dispatch({ type: 'LOAD_USER_FAILURE' });
    }
  };

  // Connexion
  const login = async (email, password) => {
    dispatch({ type: 'LOGIN_START' });

    try {
      console.log('🔐 Tentative de connexion avec:', email);
      const response = await authApi.login({ email, password });
      console.log('📩 Réponse de l\'API:', response.data);
      
      const { token, user, workspace } = response.data.data;
      console.log('🔑 Token et utilisateur extraits:', { token, user, workspace });

      // Sauvegarder le token et l'utilisateur
      saveToken(token, user, workspace);
      console.log('💾 Token sauvegardé dans localStorage');

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { token, user, workspace }
      });

      return response.data;
    } catch (error) {
      console.error('❌ Erreur de connexion:', error);
      const errorMessage = error.response?.data?.message || 'Erreur de connexion';
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: errorMessage
      });
      throw error;
    }
  };

  // Déconnexion
  const logout = () => {
    clearToken();
    dispatch({ type: 'LOGOUT' });
  };

  // Inscription (création espace ou rejoindre)
  const register = async (userData) => {
    try {
      const response = await authApi.register(userData);
      const { token, user, workspace } = response.data.data;
      
      // Auto-login après inscription
      saveToken(token, user, workspace);
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { token, user, workspace }
      });
      
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erreur d\'inscription';
      throw new Error(errorMessage);
    }
  };

  // Changer le mot de passe
  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await authApi.changePassword({
        currentPassword,
        newPassword
      });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erreur lors du changement de mot de passe';
      throw new Error(errorMessage);
    }
  };

  // Vérifier les permissions de l'utilisateur
  const hasPermission = (permission) => {
    if (!state.user) return false;

    const permissions = {
      'ecom_admin': ['*'],
      'ecom_closeuse': ['orders:read', 'orders:write'],
      'ecom_compta': ['finance:read']
    };

    const userPermissions = permissions[state.user.role] || [];
    return userPermissions.includes('*') || userPermissions.includes(permission);
  };

  // Vérifier si l'utilisateur a un rôle spécifique
  const hasRole = (role) => {
    return state.user?.role === role;
  };

  // Effacer les erreurs
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Charger l'utilisateur au montage du composant
  useEffect(() => {
    console.log('🚀 EcomAuthProvider monté, début du loadUser');
    loadUser();
  }, []);

  const value = {
    ...state,
    login,
    logout,
    register,
    changePassword,
    hasPermission,
    hasRole,
    clearError,
    loadUser
  };

  return (
    <EcomAuthContext.Provider value={value}>
      {children}
    </EcomAuthContext.Provider>
  );
};

// Hook pour vérifier l'état d'authentification (debug)
export const EcomAuthDebug = () => {
  const { isAuthenticated, user, loading, token } = useEcomAuth();
  
  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'black',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999
    }}>
      <div>🔐 Debug Auth:</div>
      <div>Loading: {loading ? 'Oui' : 'Non'}</div>
      <div>Auth: {isAuthenticated ? 'Oui' : 'Non'}</div>
      <div>User: {user ? user.email : 'Null'}</div>
      <div>Role: {user ? user.role : 'Null'}</div>
      <div>Token: {token ? 'Présent' : 'Absent'}</div>
    </div>
  );
};

// Hook personnalisé pour utiliser l'authentification
export const useEcomAuth = () => {
  const context = useContext(EcomAuthContext);
  
  if (!context) {
    throw new Error('useEcomAuth doit être utilisé dans un EcomAuthProvider');
  }
  
  return context;
};

// Hook pour vérifier l'authentification avant d'accéder à une page
export const useRequireAuth = () => {
  const { isAuthenticated, loading, user } = useEcomAuth();
  
  return {
    isAuthenticated,
    loading,
    user,
    // Fonction pour rediriger si non authentifié
    requireAuth: () => {
      if (!loading && !isAuthenticated) {
        window.location.href = '/ecom/login';
        return false;
      }
      return true;
    }
  };
};

// Hook pour vérifier les permissions spécifiques
export const useRequirePermission = (permission) => {
  const { hasPermission, user } = useEcomAuth();
  
  return {
    hasPermission: hasPermission(permission),
    user,
    // Fonction pour vérifier et rediriger si permission manquante
    requirePermission: () => {
      if (!hasPermission(permission)) {
        // Rediriger vers le dashboard approprié ou page d'erreur
        const dashboardMap = {
          'ecom_admin': '/ecom/dashboard',
          'ecom_closeuse': '/ecom/dashboard',
          'ecom_compta': '/ecom/dashboard'
        };
        
        window.location.href = dashboardMap[user?.role] || '/ecom/login';
        return false;
      }
      return true;
    }
  };
};

// Hook pour obtenir le dashboard approprié selon le rôle
export const useRoleBasedDashboard = () => {
  const { user, isAuthenticated } = useEcomAuth();
  
  const getDashboardPath = () => {
    if (!isAuthenticated || !user) return '/ecom/login';
    
    const dashboardMap = {
      'ecom_admin': '/ecom/dashboard/admin',
      'ecom_closeuse': '/ecom/dashboard/closeuse',
      'ecom_compta': '/ecom/dashboard/compta'
    };
    
    return dashboardMap[user.role] || '/ecom/login';
  };
  
  const getDashboardComponent = () => {
    if (!isAuthenticated || !user) return null;
    
    // Ces composants seront importés dynamiquement selon le besoin
    const componentMap = {
      'ecom_admin': 'AdminDashboard',
      'ecom_closeuse': 'CloseuseDashboard',
      'ecom_compta': 'ComptaDashboard'
    };
    
    return componentMap[user.role] || null;
  };
  
  return {
    dashboardPath: getDashboardPath(),
    dashboardComponent: getDashboardComponent(),
    userRole: user?.role
  };
};

export default EcomAuthContext;

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authApi } from '../services/ecommApi.js';

// Contexte d'authentification e-commerce
const EcomAuthContext = createContext();

// État initial
const initialState = {
  user: null,
  token: localStorage.getItem('ecomToken'),
  isAuthenticated: false,
  loading: true,
  error: null
};

// Reducer pour gérer les états d'authentification
const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
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
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null
      };
    
    case 'LOAD_USER_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        loading: false,
        error: null
      };
    
    case 'LOAD_USER_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
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
  };

  // Sauvegarder le token dans le localStorage
  const saveToken = (token, user) => {
    localStorage.setItem('ecomToken', token);
    localStorage.setItem('ecomUser', JSON.stringify(user));
  };

  // Charger l'utilisateur depuis le token
  const loadUser = async () => {
    const token = localStorage.getItem('ecomToken');
    
    if (!token) {
      dispatch({ type: 'LOAD_USER_FAILURE' });
      return;
    }

    try {
      const response = await authApi.getProfile();
      const user = response.data.data;
      
      dispatch({
        type: 'LOAD_USER_SUCCESS',
        payload: user
      });
    } catch (error) {
      console.error('Erreur chargement utilisateur:', error);
      clearToken();
      dispatch({ type: 'LOAD_USER_FAILURE' });
    }
  };

  // Connexion
  const login = async (email, password) => {
    try {
      const response = await authApi.login({ email, password });

      if (response.data && response.data.token && response.data.user) {
        const { token, user } = response.data;
        
        // Sauvegarder dans localStorage
        saveToken(token, user);
        
        dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
        
        return { success: true, user };
      } else {
        throw new Error('Réponse invalide du serveur');
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Erreur de connexion';
      dispatch({ type: 'LOGIN_FAILURE', payload: message });
      throw error;
    }
  };

  // Déconnexion
  const logout = () => {
    clearToken();
    dispatch({ type: 'LOGOUT' });
  };

  // Effacer les erreurs
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Vérifier si l'utilisateur a un rôle spécifique
  const hasRole = (role) => {
    return state.user?.role === role;
  };

  // Vérifier les permissions
  const hasPermission = (permission) => {
    if (!state.user) return false;
    return state.user.role === 'ecom_admin'; 
  };

  // Effet pour charger l'utilisateur au montage
  useEffect(() => {
    loadUser();
  }, []);

  const value = {
    ...state,
    login,
    logout,
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

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../services/ecomApi';

// Contexte d'authentification e-commerce
const EcomAuthContext = createContext();

// État initial
const initialState = {
  user: null,
  workspace: null,
  token: null,
  isAuthenticated: false,
  loading: true,
  error: null
};

// Reducer pour gérer les états d'authentification
const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true, error: null };
    
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
    
    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.payload } };
    
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    
    default:
      return state;
  }
};

// Provider d'authentification
export const EcomAuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Effacer le token du storage
  const clearToken = async () => {
    try {
      await AsyncStorage.removeItem('ecomToken');
      await AsyncStorage.removeItem('ecomUser');
      await AsyncStorage.removeItem('ecomWorkspace');
    } catch (error) {
      console.error('Erreur suppression token:', error);
    }
  };

  // Sauvegarder le token dans le storage
  const saveToken = async (token, user, workspace) => {
    try {
      await AsyncStorage.setItem('ecomToken', token);
      await AsyncStorage.setItem('ecomUser', JSON.stringify(user));
      if (workspace) {
        await AsyncStorage.setItem('ecomWorkspace', JSON.stringify(workspace));
      }
    } catch (error) {
      console.error('Erreur sauvegarde token:', error);
    }
  };

  // Charger l'utilisateur depuis le token
  const loadUser = async () => {
    try {
      const token = await AsyncStorage.getItem('ecomToken');
      console.log('🔍 Vérification du token:', token ? 'Token trouvé' : 'Pas de token');
      
      if (!token) {
        dispatch({ type: 'LOAD_USER_FAILURE' });
        return;
      }

      console.log('👤 Tentative de chargement du profil...');
      const response = await authApi.getProfile();
      console.log('📩 Réponse de getProfile:', response.data);
      
      const wsData = response.data.data?.workspace;
      if (wsData) {
        await AsyncStorage.setItem('ecomWorkspace', JSON.stringify(wsData));
      }
      
      dispatch({
        type: 'LOAD_USER_SUCCESS',
        payload: { user: response.data.data?.user, workspace: wsData }
      });
    } catch (error) {
      console.error('❌ Erreur chargement utilisateur:', error.message);
      await clearToken();
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
      
      await saveToken(token, user, workspace);
      console.log('💾 Token sauvegardé');

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { token, user, workspace }
      });

      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Erreur de connexion:', error);
      const errorMessage = error.response?.data?.message || 'Erreur de connexion';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Déconnexion
  const logout = async () => {
    await clearToken();
    dispatch({ type: 'LOGOUT' });
  };

  // Inscription
  const register = async (userData) => {
    try {
      const response = await authApi.register(userData);
      const { token, user, workspace } = response.data.data;
      
      await saveToken(token, user, workspace);
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { token, user, workspace }
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erreur d\'inscription';
      return { success: false, error: errorMessage };
    }
  };

  // Changer le mot de passe
  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await authApi.changePassword({ currentPassword, newPassword });
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erreur lors du changement de mot de passe';
      return { success: false, error: errorMessage };
    }
  };

  // Vérifier les permissions
  const hasPermission = (permission) => {
    if (!state.user) return false;

    const permissions = {
      'super_admin': ['*'],
      'ecom_admin': ['*'],
      'ecom_closeuse': ['orders:read', 'orders:write', 'clients:read', 'clients:write', 'reports:read', 'reports:write'],
      'ecom_compta': ['finance:read', 'reports:read', 'transactions:read', 'transactions:write'],
      'ecom_livreur': ['orders:read']
    };

    const userPermissions = permissions[state.user.role] || [];
    return userPermissions.includes('*') || userPermissions.includes(permission);
  };

  // Vérifier le rôle
  const hasRole = (role) => state.user?.role === role;

  // Effacer les erreurs
  const clearError = () => dispatch({ type: 'CLEAR_ERROR' });

  // Charger l'utilisateur au montage
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

// Hook personnalisé
export const useEcomAuth = () => {
  const context = useContext(EcomAuthContext);
  if (!context) {
    throw new Error('useEcomAuth doit être utilisé dans un EcomAuthProvider');
  }
  return context;
};

// Hook pour obtenir le dashboard selon le rôle
export const useRoleDashboard = () => {
  const { user, isAuthenticated } = useEcomAuth();
  
  const getDashboardScreen = () => {
    if (!isAuthenticated || !user) return 'Login';
    
    const dashboardMap = {
      'super_admin': 'SuperAdminDashboard',
      'ecom_admin': 'AdminDashboard',
      'ecom_closeuse': 'CloseuseDashboard',
      'ecom_compta': 'ComptaDashboard',
      'ecom_livreur': 'Orders'
    };
    
    return dashboardMap[user.role] || 'Login';
  };
  
  return {
    dashboardScreen: getDashboardScreen(),
    userRole: user?.role
  };
};

export default EcomAuthContext;

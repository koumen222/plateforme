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
  error: null,
  // Mode incarnation pour Super Admin
  isImpersonating: false,
  originalUser: JSON.parse(localStorage.getItem('ecomOriginalUser') || 'null'),
  impersonatedUser: JSON.parse(localStorage.getItem('ecomImpersonatedUser') || 'null')
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
    
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    
    case 'START_IMPERSONATION':
      return {
        ...state,
        isImpersonating: true,
        originalUser: action.payload.originalUser,
        impersonatedUser: action.payload.targetUser,
        user: action.payload.targetUser,
        workspace: action.payload.targetWorkspace
      };
    
    case 'STOP_IMPERSONATION':
      return {
        ...state,
        isImpersonating: false,
        originalUser: null,
        impersonatedUser: null,
        user: action.payload.originalUser,
        workspace: action.payload.originalWorkspace
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
    localStorage.removeItem('ecomOriginalUser');
    localStorage.removeItem('ecomImpersonatedUser');
  };

  // Sauvegarder le token dans le localStorage
  const saveToken = (token, user, workspace) => {
    localStorage.setItem('ecomToken', token);
    localStorage.setItem('ecomUser', JSON.stringify(user));
    if (workspace) localStorage.setItem('ecomWorkspace', JSON.stringify(workspace));
  };

  // Sauvegarder l'état d'incarnation
  const saveImpersonation = (originalUser, targetUser, targetWorkspace) => {
    localStorage.setItem('ecomOriginalUser', JSON.stringify(originalUser));
    localStorage.setItem('ecomImpersonatedUser', JSON.stringify(targetUser));
    if (targetWorkspace) localStorage.setItem('ecomWorkspace', JSON.stringify(targetWorkspace));
  };

  // Effacer l'incarnation
  const clearImpersonation = () => {
    localStorage.removeItem('ecomOriginalUser');
    localStorage.removeItem('ecomImpersonatedUser');
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

  // Changer la devise
  const changeCurrency = async (currency) => {
    try {
      const response = await authApi.changeCurrency({ currency });
      
      // Update state
      dispatch({
        type: 'UPDATE_USER',
        payload: { currency }
      });
      
      // Update localStorage with new currency
      const storedUser = JSON.parse(localStorage.getItem('ecomUser') || '{}');
      storedUser.currency = currency;
      localStorage.setItem('ecomUser', JSON.stringify(storedUser));
      
      // Reload page to force all components to update with new currency
      window.location.reload();
      
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erreur lors du changement de devise';
      throw new Error(errorMessage);
    }
  };

  // Incarnation : Super Admin peut devenir n'importe quel utilisateur
  const impersonateUser = async (targetUserId, targetUserData = null) => {
    // Vérifier que l'utilisateur actuel est un Super Admin
    if (state.user?.role !== 'super_admin') {
      throw new Error('Seul le Super Admin peut utiliser l\'incarnation');
    }

    try {
      let targetUser, targetWorkspace;

      if (targetUserData) {
        // Utiliser les données fournies directement (depuis la liste des utilisateurs)
        targetUser = targetUserData;
        targetWorkspace = targetUserData.workspaceId;
        console.log('🎭 Incarnation avec données fournies:', targetUser.email);
        console.log('🏢 Workspace cible:', targetWorkspace?.name || 'Sans workspace');
      } else {
        // Approche de secours avec données simulées
        targetUser = {
          _id: targetUserId,
          email: 'user_' + targetUserId.substring(0, 8) + '@example.com',
          role: 'ecom_admin',
          workspaceId: null
        };
        targetWorkspace = null;
        console.log('🎭 Incarnation avec données simulées');
      }

      // Démarrer l'incarnation
      dispatch({
        type: 'START_IMPERSONATION',
        payload: {
          originalUser: state.user,
          targetUser,
          targetWorkspace
        }
      });

      // Sauvegarder l'état d'incarnation et le workspace
      saveImpersonation(state.user, targetUser, targetWorkspace);
      
      // Mettre à jour le workspace actif dans localStorage
      if (targetWorkspace) {
        localStorage.setItem('ecomWorkspace', JSON.stringify(targetWorkspace));
        console.log('💾 Workspace sauvegardé:', targetWorkspace.name);
      }

      console.log('🎭 Incarnation réussie pour:', targetUser.email, 'workspace:', targetWorkspace?.name);
      return { success: true, targetUser, targetWorkspace };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erreur lors de l\'incarnation';
      throw new Error(errorMessage);
    }
  };

  // Arrêter l'incarnation et revenir au Super Admin
  const stopImpersonation = () => {
    if (!state.isImpersonating) {
      throw new Error('Aucune incarnation en cours');
    }

    // Restaurer l'utilisateur original
    dispatch({
      type: 'STOP_IMPERSONATION',
      payload: {
        originalUser: state.originalUser,
        originalWorkspace: state.originalUser?.workspace
      }
    });

    // Effacer l'état d'incarnation
    clearImpersonation();
    
    // Restaurer le workspace original du Super Admin
    if (state.originalUser?.workspace) {
      localStorage.setItem('ecomWorkspace', JSON.stringify(state.originalUser.workspace));
      console.log('🔄 Workspace original restauré:', state.originalUser.workspace?.name);
    } else {
      localStorage.removeItem('ecomWorkspace');
      console.log('🔄 Workspace supprimé (Super Admin sans workspace)');
    }

    // Naviguer vers le dashboard Super Admin
    window.location.href = '/ecom/super-admin';
  };

  // Restaurer l'incarnation au chargement
  const restoreImpersonation = () => {
    const originalUser = JSON.parse(localStorage.getItem('ecomOriginalUser') || 'null');
    const impersonatedUser = JSON.parse(localStorage.getItem('ecomImpersonatedUser') || 'null');

    if (originalUser && impersonatedUser && originalUser.role === 'super_admin') {
      dispatch({
        type: 'START_IMPERSONATION',
        payload: {
          originalUser,
          targetUser: impersonatedUser,
          targetWorkspace: impersonatedUser.workspace
        }
      });
    }
  };

  // Vérifier les permissions de l'utilisateur
  const hasPermission = (permission) => {
    if (!state.user) return false;

    const permissions = {
      'ecom_admin': ['*'],
      'ecom_closeuse': ['orders:read', 'orders:write'],
      'ecom_compta': ['finance:read'],
      'ecom_livreur': ['orders:read']
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
    // Restaurer l'incarnation si elle existe
    restoreImpersonation();
  }, []);

  const value = {
    ...state,
    login,
    logout,
    register,
    changePassword,
    changeCurrency,
    hasPermission,
    hasRole,
    clearError,
    loadUser,
    impersonateUser,
    stopImpersonation
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

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const ECOM_API_URL = 'http://localhost:3000'; // Adapter selon votre configuration

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
    
    case 'SET_WORKSPACE':
      return {
        ...state,
        workspace: action.payload
      };
    
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    
    default:
      return state;
  }
};

// Provider d'authentification e-commerce
export const EcomAuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Charger les données d'authentification au démarrage
  useEffect(() => {
    loadAuthData();
  }, []);

  const loadAuthData = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('ecomToken');
      const storedWorkspace = await AsyncStorage.getItem('ecomWorkspace');
      const storedUser = await AsyncStorage.getItem('ecomUser');

      if (storedToken && storedUser) {
        const user = JSON.parse(storedUser);
        const workspace = storedWorkspace ? JSON.parse(storedWorkspace) : null;

        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user,
            workspace,
            token: storedToken
          }
        });

        // Vérifier la validité du token
        try {
          const response = await axios.get(`${ECOM_API_URL}/api/ecom/auth/me`, {
            headers: {
              'Authorization': `Bearer ${storedToken}`,
              'X-Workspace-ID': workspace?.id || 'default'
            }
          });

          if (response.data.success) {
            dispatch({
              type: 'UPDATE_USER',
              payload: response.data.user
            });
          }
        } catch (error) {
          console.error('Token validation failed:', error);
          if (error.response?.status === 401) {
            await logout();
          }
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } catch (error) {
      console.error('Error loading auth data:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const login = async (email, password, workspaceId = null) => {
    try {
      dispatch({ type: 'LOGIN_START' });

      const response = await axios.post(`${ECOM_API_URL}/api/ecom/login`, {
        email,
        password,
        workspaceId
      });

      if (response.data.success) {
        const { user, workspace, token } = response.data;

        // Sauvegarder dans AsyncStorage
        await AsyncStorage.setItem('ecomToken', token);
        await AsyncStorage.setItem('ecomUser', JSON.stringify(user));
        if (workspace) {
          await AsyncStorage.setItem('ecomWorkspace', JSON.stringify(workspace));
        }

        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user,
            workspace,
            token
          }
        });

        return { success: true };
      } else {
        throw new Error(response.data.error || 'Erreur de connexion');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Erreur de connexion';
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: errorMessage
      });
      return { success: false, error: errorMessage };
    }
  };

  const register = async (userData, workspaceId = null) => {
    try {
      dispatch({ type: 'LOGIN_START' });

      const response = await axios.post(`${ECOM_API_URL}/api/ecom/register`, {
        ...userData,
        workspaceId
      });

      if (response.data.success) {
        const { user, workspace, token } = response.data;

        // Sauvegarder dans AsyncStorage
        await AsyncStorage.setItem('ecomToken', token);
        await AsyncStorage.setItem('ecomUser', JSON.stringify(user));
        if (workspace) {
          await AsyncStorage.setItem('ecomWorkspace', JSON.stringify(workspace));
        }

        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user,
            workspace,
            token
          }
        });

        return { success: true };
      } else {
        throw new Error(response.data.error || 'Erreur lors de l\'inscription');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Erreur lors de l\'inscription';
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: errorMessage
      });
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      // Nettoyer AsyncStorage
      await AsyncStorage.removeItem('ecomToken');
      await AsyncStorage.removeItem('ecomUser');
      await AsyncStorage.removeItem('ecomWorkspace');

      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      console.error('Error during logout:', error);
      dispatch({ type: 'LOGOUT' });
    }
  };

  const setWorkspace = async (workspace) => {
    try {
      await AsyncStorage.setItem('ecomWorkspace', JSON.stringify(workspace));
      dispatch({
        type: 'SET_WORKSPACE',
        payload: workspace
      });
    } catch (error) {
      console.error('Error setting workspace:', error);
    }
  };

  const updateUser = async (userData) => {
    try {
      await AsyncStorage.setItem('ecomUser', JSON.stringify(userData));
      dispatch({
        type: 'UPDATE_USER',
        payload: userData
      });
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    setWorkspace,
    updateUser,
  };

  return (
    <EcomAuthContext.Provider value={value}>
      {children}
    </EcomAuthContext.Provider>
  );
};

export const useEcomAuth = () => {
  const context = useContext(EcomAuthContext);
  if (!context) {
    throw new Error('useEcomAuth must be used within an EcomAuthProvider');
  }
  return context;
};

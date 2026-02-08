import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const EcomAuthContext = createContext(null);

// Configuration de l'API Ecom
const ECOM_API_URL = 'http://localhost:3000'; 

export const EcomAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [workspace, setWorkspace] = useState(null);

  useEffect(() => {
    loadEcomAuthData();
  }, []);

  const loadEcomAuthData = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('ecomToken');
      const storedUser = await AsyncStorage.getItem('ecomUser');
      const storedWorkspace = await AsyncStorage.getItem('ecomWorkspace');
      
      if (storedToken) {
        setToken(storedToken);
        
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
        }
        
        if (storedWorkspace) {
          const workspaceData = JSON.parse(storedWorkspace);
          setWorkspace(workspaceData);
        }
        
        // Vérifier le token avec le backend Ecom
        try {
          const response = await axios.get(`${ECOM_API_URL}/api/ecom/auth/me`, {
            headers: {
              'Authorization': `Bearer ${storedToken}`
            }
          });
          
          if (response.data.success && response.data.data) {
            const { user: userData, workspace: workspaceData } = response.data.data;
            setUser(userData);
            setWorkspace(workspaceData);
            await AsyncStorage.setItem('ecomUser', JSON.stringify(userData));
            if (workspaceData) {
              await AsyncStorage.setItem('ecomWorkspace', JSON.stringify(workspaceData));
            }
          }
        } catch (error) {
          console.error('Ecom token validation failed:', error);
          if (error.response?.status === 401) {
            await AsyncStorage.removeItem('ecomToken');
            await AsyncStorage.removeItem('ecomUser');
            await AsyncStorage.removeItem('ecomWorkspace');
            setToken(null);
            setUser(null);
            setWorkspace(null);
          }
        }
      }
    } catch (error) {
      console.error('Error loading ecom auth data:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${ECOM_API_URL}/api/ecom/auth/login`, {
        email,
        password
      });

      if (response.data.success) {
        const { token: newToken, user: userData, workspace: workspaceData } = response.data.data;
        
        setToken(newToken);
        setUser(userData);
        setWorkspace(workspaceData);
        
        await AsyncStorage.setItem('ecomToken', newToken);
        await AsyncStorage.setItem('ecomUser', JSON.stringify(userData));
        if (workspaceData) {
          await AsyncStorage.setItem('ecomWorkspace', JSON.stringify(workspaceData));
        }
        
        return { success: true };
      } else {
        throw new Error(response.data.message || 'Erreur de connexion');
      }
    } catch (error) {
      console.error('Ecom login error:', error);
      return { success: false, error: error.response?.data?.message || error.message };
    }
  };

  const register = async (name, email, phoneNumber, password, workspaceName = null) => {
    try {
      const response = await axios.post(`${ECOM_API_URL}/api/ecom/auth/register`, {
        name: name.trim(),
        email: email.trim(),
        phone: phoneNumber.trim(),
        password,
        workspaceName
      });

      if (response.data.success) {
        const { token: newToken, user: userData, workspace: workspaceData } = response.data.data;
        
        setToken(newToken);
        setUser(userData);
        setWorkspace(workspaceData);
        
        await AsyncStorage.setItem('ecomToken', newToken);
        await AsyncStorage.setItem('ecomUser', JSON.stringify(userData));
        if (workspaceData) {
          await AsyncStorage.setItem('ecomWorkspace', JSON.stringify(workspaceData));
        }
        
        return { success: true };
      } else {
        throw new Error(response.data.message || 'Erreur lors de l\'inscription');
      }
    } catch (error) {
      console.error('Ecom register error:', error);
      return { success: false, error: error.response?.data?.message || error.message };
    }
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    setWorkspace(null);
    await AsyncStorage.removeItem('ecomToken');
    await AsyncStorage.removeItem('ecomUser');
    await AsyncStorage.removeItem('ecomWorkspace');
  };

  const updateProfile = async (name, phone) => {
    try {
      const response = await axios.put(`${ECOM_API_URL}/api/ecom/auth/profile`, 
        { name, phone },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        }
      );

      if (response.data.success) {
        const userData = { ...user, ...response.data.data };
        setUser(userData);
        await AsyncStorage.setItem('ecomUser', JSON.stringify(userData));
        return { success: true, user: userData };
      } else {
        throw new Error(response.data.message || 'Erreur lors de la mise à jour du profil');
      }
    } catch (error) {
      console.error('Ecom update profile error:', error);
      return { success: false, error: error.response?.data?.message || error.message };
    }
  };

  const isAuthenticated = !!(token && user);

  return (
    <EcomAuthContext.Provider
      value={{
        user,
        token,
        workspace,
        loading,
        isAuthenticated,
        login,
        register,
        logout,
        updateProfile,
        setUser,
      }}
    >
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

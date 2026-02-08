import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const AuthContext = createContext(null);

// Configuration de l'API - utilisez la même URL que le backend web
const API_URL = 'http://localhost:3000'; // À adapter selon votre configuration

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    loadAuthData();
  }, []);

  const loadAuthData = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');
      
      if (storedToken) {
        setToken(storedToken);
        
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
        }
        
        // Vérifier le token avec le backend
        try {
          const response = await axios.get(`${API_URL}/api/user/me`, {
            headers: {
              'Authorization': `Bearer ${storedToken}`
            }
          });
          
          if (response.data.success && response.data.user) {
            const userData = response.data.user;
            setUser(userData);
            await AsyncStorage.setItem('user', JSON.stringify(userData));
          }
        } catch (error) {
          console.error('Token validation failed:', error);
          if (error.response?.status === 401) {
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
            setToken(null);
            setUser(null);
          }
        }
      }
    } catch (error) {
      console.error('Error loading auth data:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      console.log('🔍 Mobile login attempt:', { email, passwordLength: password?.length });
      
      const response = await axios.post(`${API_URL}/api/login`, {
        emailOrPhone: email.trim(),
        password
      });

      console.log('📝 Mobile login response:', response.data);

      if (response.data.success) {
        const { token: newToken, user: userData } = response.data;
        
        setToken(newToken);
        setUser(userData);
        
        await AsyncStorage.setItem('token', newToken);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        
        console.log('✅ Mobile login successful');
        return { success: true };
      } else {
        console.log('❌ Mobile login failed:', response.data.error);
        throw new Error(response.data.error || 'Erreur de connexion');
      }
    } catch (error) {
      console.error('🚨 Mobile login error:', error);
      console.error('🚨 Error response:', error.response?.data);
      return { success: false, error: error.message };
    }
  };

  const register = async (name, email, phoneNumber, password) => {
    try {
      console.log('🔍 Mobile register attempt:', { name, email, phoneNumber, passwordLength: password?.length });
      
      const response = await axios.post(`${API_URL}/api/register`, {
        name: name.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        password
      });

      console.log('📝 Mobile register response:', response.data);

      if (response.data.success) {
        const { token: newToken, user: userData } = response.data;
        
        setToken(newToken);
        setUser(userData);
        
        await AsyncStorage.setItem('token', newToken);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        
        console.log('✅ Mobile register successful');
        return { success: true };
      } else {
        console.log('❌ Mobile register failed:', response.data.error);
        throw new Error(response.data.error || 'Erreur lors de l\'inscription');
      }
    } catch (error) {
      console.error('🚨 Mobile register error:', error);
      console.error('🚨 Error response:', error.response?.data);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
  };

  const updateUser = (userData) => {
    setUser(userData);
    AsyncStorage.setItem('user', JSON.stringify(userData));
  };

  const updateProfile = async (name, phoneNumber) => {
    try {
      const response = await axios.put(`${API_URL}/api/profile`, 
        { name, phoneNumber },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        }
      );

      if (response.data.success) {
        const { user: userData } = response.data;
        setUser(userData);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        return { success: true, user: userData };
      } else {
        throw new Error(response.data.error || 'Erreur lors de la mise à jour du profil');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: error.message };
    }
  };

  const refreshUser = async () => {
    try {
      if (!token) {
        return { success: false, error: 'Pas de token' };
      }

      const response = await axios.get(`${API_URL}/api/user/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        const userData = response.data.user;
        const oldStatus = user?.status;
        const newStatus = userData?.status;
        
        if (oldStatus !== newStatus) {
          console.log(`Status changed: ${oldStatus} → ${newStatus}`);
        }
        
        setUser(userData);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        
        return { success: true, user: userData, statusChanged: oldStatus !== newStatus };
      } else {
        throw new Error(response.data.error || 'Erreur lors de la récupération des données');
      }
    } catch (error) {
      console.error('Refresh user error:', error);
      if (error.response?.status === 401) {
        await logout();
      }
      return { success: false, error: error.message };
    }
  };

  const isAuthenticated = !!(token && user);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated,
        login,
        register,
        logout,
        updateUser,
        setUser,
        updateProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationsProvider } from './contexts/NotificationsContext';
import { EcomAuthProvider } from './contexts/EcomAuthContext';
import { CartProvider } from './contexts/ecom/CartContext';
import { CurrencyProvider } from './contexts/ecom/CurrencyContext';
import AppNavigator from './navigation/AppNavigator';

const App = () => {
  return (
    <PaperProvider>
      <ThemeProvider>
        <AuthProvider>
          <NotificationsProvider>
            <EcomAuthProvider>
              <CurrencyProvider>
                <CartProvider>
                  <NavigationContainer>
                    <AppNavigator />
                    <StatusBar style="auto" />
                  </NavigationContainer>
                </CartProvider>
              </CurrencyProvider>
            </EcomAuthProvider>
          </NotificationsProvider>
        </AuthProvider>
      </ThemeProvider>
    </PaperProvider>
  );
};

export default App;

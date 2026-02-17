import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import EcomNavigator from './navigation/EcomNavigator';
import { NotificationProvider } from '../contexts/NotificationContext';

const EcomApp = () => {
  return (
    <NotificationProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <EcomNavigator />
      </NavigationContainer>
    </NotificationProvider>
  );
};

export default EcomApp;

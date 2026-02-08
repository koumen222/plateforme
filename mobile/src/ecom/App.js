import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import EcomNavigator from './navigation/EcomNavigator';

const EcomApp = () => {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <EcomNavigator />
    </NavigationContainer>
  );
};

export default EcomApp;

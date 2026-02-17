import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useThemeSafe } from '../utils/useThemeSafe';

const LoadingScreen = () => {
  const theme = useThemeSafe();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={[styles.loadingText, { color: theme.colors.text }]}>
        Chargement...
      </Text>
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
  },
};

export default LoadingScreen;

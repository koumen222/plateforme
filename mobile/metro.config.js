const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add web-specific configurations
config.resolver.platforms = ['ios', 'android', 'web', 'native'];

// Handle expo-font for web
config.resolver.alias = {
  ...config.resolver.alias,
  'expo-font': 'expo-font/build/ExpoFont.web.js',
};

module.exports = config;

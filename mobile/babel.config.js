module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Required for expo-font
      'react-native-reanimated/plugin',
    ],
  };
};

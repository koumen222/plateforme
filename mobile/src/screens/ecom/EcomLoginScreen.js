import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useEcomAuth } from '../../contexts/EcomAuthContext';
import { useThemeSafe } from '../../utils/useThemeSafe';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const EcomLoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useEcomAuth();
  const theme = useThemeSafe();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const result = await login(email.trim(), password.trim());
      
      if (!result.success) {
        setError(result.error || 'Erreur de connexion');
      } else {
        // Navigation vers le dashboard Ecom après connexion réussie
        navigation.navigate('EcomHome');
      }
    } catch (error) {
      setError('Une erreur est survenue lors de la connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        style={[{ backgroundColor: '#030712' }]} // bg-gray-950
      >
        {/* Background effects */}
        <View style={styles.backgroundEffects}>
          <View style={[styles.backgroundCircle, styles.topRightCircle]} />
          <View style={[styles.backgroundCircle, styles.bottomLeftCircle]} />
        </View>

        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.navigate('CookpiLanding')}
              style={styles.logoContainer}
            >
              <Image 
                source={require('../../../assets/ecom-logo (1).png')} 
                style={styles.logo}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <Text style={styles.title}>Bon retour !</Text>
            <Text style={styles.subtitle}>Connectez-vous à votre espace de travail</Text>
          </View>

          {/* Form card */}
          <View style={styles.formCard}>
            {/* Error Message */}
            {error && (
              <View style={styles.errorContainer}>
                <MaterialIcons name="error" size={16} color="#ef4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={[styles.input, { color: '#ffffff' }]}
                  placeholder="votre@email.com"
                  placeholderTextColor="#6b7280"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Mot de passe</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={[styles.input, styles.passwordInput, { color: '#ffffff' }]}
                    placeholder="••••••••"
                    placeholderTextColor="#6b7280"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                    disabled={loading}
                  >
                    <MaterialIcons
                      name={showPassword ? "visibility" : "visibility-off"}
                      size={20}
                      color="#6b7280"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color="white" size="small" />
                    <Text style={styles.buttonText}>Connexion...</Text>
                  </View>
                ) : (
                  <Text style={styles.buttonText}>Se connecter</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Register links */}
            <View style={styles.registerButtons}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => navigation.navigate('EcomRegister')}
                disabled={loading}
              >
                <Text style={styles.secondaryButtonText}>Créer un espace</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => navigation.navigate('EcomRegister')}
                disabled={loading}
              >
                <Text style={styles.secondaryButtonText}>Rejoindre une équipe</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <Text style={styles.footer}>
            © {new Date().getFullYear()} Ecom Cockpit · Tous droits réservés
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = {
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  backgroundEffects: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  backgroundCircle: {
    position: 'absolute',
    borderRadius: 999,
  },
  topRightCircle: {
    top: -160,
    right: -160,
    width: 320,
    height: 320,
    backgroundColor: 'rgba(37, 99, 235, 0.1)', // blue-600/10
  },
  bottomLeftCircle: {
    bottom: -160,
    left: -160,
    width: 320,
    height: 320,
    backgroundColor: 'rgba(147, 51, 234, 0.1)', // purple-600/10
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logo: {
    width: 56,
    height: 56,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af', // gray-400
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: '#111827', // gray-900
    borderWidth: 1,
    borderColor: '#374151', // gray-800
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)', // red-500/10
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)', // red-500/30
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    color: '#f87171', // red-400
    fontSize: 14,
    flex: 1,
  },
  form: {
    gap: 20,
  },
  inputContainer: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#d1d5db', // gray-300
  },
  input: {
    backgroundColor: '#1f2937', // gray-800
    borderWidth: 1,
    borderColor: '#374151', // gray-700
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  passwordInputContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 40,
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -10 }],
    padding: 4,
  },
  button: {
    backgroundColor: '#2563eb', // blue-600
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#374151', // gray-800
  },
  dividerText: {
    fontSize: 12,
    color: '#6b7280', // gray-500
  },
  registerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#1f2937', // gray-800
    borderWidth: 1,
    borderColor: '#374151', // gray-700
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#d1d5db', // gray-300
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: '#4b5563', // gray-600
    marginTop: 32,
  },
};

export default EcomLoginScreen;

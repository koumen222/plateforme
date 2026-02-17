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

const EcomRegisterScreen = ({ navigation }) => {
  const [mode, setMode] = useState('create'); // 'create' ou 'join'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    workspaceName: '',
    inviteCode: '',
    selectedRole: 'ecom_closeuse'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { register } = useEcomAuth();
  const theme = useThemeSafe();

  const handleRegister = async () => {
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (mode === 'create' && (!formData.workspaceName || formData.workspaceName.trim().length < 2)) {
      setError('Le nom de votre espace doit contenir au moins 2 caractères');
      return;
    }

    if (mode === 'join' && !formData.inviteCode.trim()) {
      setError('Le code d\'invitation est requis');
      return;
    }

    setLoading(true);
    
    try {
      const payload = {
        email: formData.email.trim(),
        password: formData.password
      };

      if (mode === 'create') {
        payload.workspaceName = formData.workspaceName.trim();
      } else {
        payload.inviteCode = formData.inviteCode.trim();
        payload.selectedRole = formData.selectedRole;
      }

      const result = await register(payload);
      
      if (!result.success) {
        setError(result.error || 'Erreur lors de l\'inscription');
      } else {
        // Navigation vers le dashboard Ecom après inscription réussie
        navigation.navigate('EcomHome');
      }
    } catch (error) {
      setError('Une erreur est survenue lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
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
          <View style={[styles.backgroundCircle, styles.topLeftCircle]} />
          <View style={[styles.backgroundCircle, styles.bottomRightCircle]} />
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
            <Text style={styles.title}>Créer votre compte</Text>
            <Text style={styles.subtitle}>Lancez votre espace ou rejoignez une équipe</Text>
          </View>

          {/* Form card */}
          <View style={styles.formCard}>
            {/* Mode selector */}
            <View style={styles.modeSelector}>
              <TouchableOpacity
                style={[styles.modeButton, mode === 'create' && styles.modeButtonActive]}
                onPress={() => { setMode('create'); setError(''); }}
                disabled={loading}
              >
                <Text style={[styles.modeButtonText, mode === 'create' && styles.modeButtonTextActive]}>
                  Créer un espace
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeButton, mode === 'join' && styles.modeButtonActive]}
                onPress={() => { setMode('join'); setError(''); }}
                disabled={loading}
              >
                <Text style={[styles.modeButtonText, mode === 'join' && styles.modeButtonTextActive]}>
                  Rejoindre
                </Text>
              </TouchableOpacity>
            </View>

            {/* Error Message */}
            {error && (
              <View style={styles.errorContainer}>
                <MaterialIcons name="error" size={16} color="#ef4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.form}>
              {mode === 'create' && (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Nom de votre espace</Text>
                  <TextInput
                    style={[styles.input, { color: '#ffffff' }]}
                    placeholder="Ex: Ma Boutique, Mon Business..."
                    placeholderTextColor="#6b7280"
                    value={formData.workspaceName}
                    onChangeText={(value) => handleInputChange('workspaceName', value)}
                    editable={!loading}
                  />
                  <Text style={styles.helperText}>Vous pourrez inviter votre équipe ensuite</Text>
                </View>
              )}

              {mode === 'join' && (
                <>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Code d'invitation</Text>
                    <TextInput
                      style={[styles.input, styles.fontMono, { color: '#ffffff' }]}
                      placeholder="Collez le code reçu de votre admin"
                      placeholderTextColor="#6b7280"
                      value={formData.inviteCode}
                      onChangeText={(value) => handleInputChange('inviteCode', value)}
                      editable={!loading}
                    />
                    <Text style={styles.helperText}>Demandez le code à l'administrateur de l'espace</Text>
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Votre rôle</Text>
                    <View style={styles.roleSelector}>
                      {[
                        { value: 'ecom_closeuse', label: 'Closeuse' },
                        { value: 'ecom_compta', label: 'Comptable' },
                        { value: 'ecom_livreur', label: 'Livreur' }
                      ].map((role) => (
                        <TouchableOpacity
                          key={role.value}
                          style={[
                            styles.roleOption,
                            formData.selectedRole === role.value && styles.roleOptionActive
                          ]}
                          onPress={() => handleInputChange('selectedRole', role.value)}
                          disabled={loading}
                        >
                          <Text style={[
                            styles.roleOptionText,
                            formData.selectedRole === role.value && styles.roleOptionTextActive
                          ]}>
                            {role.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </>
              )}

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={[styles.input, { color: '#ffffff' }]}
                  placeholder="votre@email.com"
                  placeholderTextColor="#6b7280"
                  value={formData.email}
                  onChangeText={(value) => handleInputChange('email', value)}
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
                    placeholder="Min. 6 caractères"
                    placeholderTextColor="#6b7280"
                    value={formData.password}
                    onChangeText={(value) => handleInputChange('password', value)}
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

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirmer le mot de passe</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={[styles.input, styles.passwordInput, { color: '#ffffff' }]}
                    placeholder="Retapez votre mot de passe"
                    placeholderTextColor="#6b7280"
                    value={formData.confirmPassword}
                    onChangeText={(value) => handleInputChange('confirmPassword', value)}
                    secureTextEntry={!showConfirmPassword}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeIcon}
                    disabled={loading}
                  >
                    <MaterialIcons
                      name={showConfirmPassword ? "visibility" : "visibility-off"}
                      size={20}
                      color="#6b7280"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color="white" size="small" />
                    <Text style={styles.buttonText}>
                      {mode === 'create' ? 'Création de l\'espace...' : 'Inscription...'}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.buttonText}>
                    {mode === 'create' ? 'Créer mon espace' : 'Rejoindre l\'équipe'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>déjà un compte ?</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('EcomLogin')}
              disabled={loading}
            >
              <Text style={styles.secondaryButtonText}>Se connecter</Text>
            </TouchableOpacity>
          </View>

          {/* Info box */}
          <View style={styles.infoBox}>
            {mode === 'create' ? (
              <>
                <Text style={styles.infoTitle}>Comment ça marche</Text>
                <View style={styles.infoList}>
                  {[
                    'Créez votre espace de travail en tant qu\'admin',
                    'Invitez vos closeuses et comptables avec un code',
                    'Gérez vos produits, rapports et finances'
                  ].map((text, i) => (
                    <View key={i} style={styles.infoItem}>
                      <View style={styles.infoNumber}>
                        <Text style={styles.infoNumberText}>{i + 1}</Text>
                      </View>
                      <Text style={styles.infoText}>{text}</Text>
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <>
                <Text style={styles.infoTitle}>Rejoindre une équipe</Text>
                <View style={styles.infoList}>
                  {[
                    'Demandez le code d\'invitation à votre admin',
                    'Choisissez votre rôle : Closeuse, Comptable ou Livreur',
                    'Vous aurez accès aux fonctionnalités de votre rôle'
                  ].map((text, i) => (
                    <View key={i} style={styles.infoItem}>
                      <View style={styles.infoNumber}>
                        <Text style={styles.infoNumberText}>{i + 1}</Text>
                      </View>
                      <Text style={styles.infoText}>{text}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
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
  topLeftCircle: {
    top: -160,
    left: -160,
    width: 320,
    height: 320,
    backgroundColor: 'rgba(147, 51, 234, 0.1)', // purple-600/10
  },
  bottomRightCircle: {
    bottom: -160,
    right: -160,
    width: 320,
    height: 320,
    backgroundColor: 'rgba(37, 99, 235, 0.1)', // blue-600/10
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
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: '#1f2937', // gray-800
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#2563eb', // blue-600
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 2,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9ca3af', // gray-400
  },
  modeButtonTextActive: {
    color: '#ffffff',
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
    gap: 16,
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
  fontMono: {
    fontFamily: 'monospace',
    letterSpacing: 0.5,
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
  helperText: {
    fontSize: 12,
    color: '#6b7280', // gray-500
    marginTop: 6,
  },
  roleSelector: {
    gap: 8,
  },
  roleOption: {
    backgroundColor: '#1f2937', // gray-800
    borderWidth: 1,
    borderColor: '#374151', // gray-700
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  roleOptionActive: {
    backgroundColor: '#2563eb', // blue-600
    borderColor: '#2563eb',
  },
  roleOptionText: {
    fontSize: 14,
    color: '#d1d5db', // gray-300
  },
  roleOptionTextActive: {
    color: '#ffffff',
  },
  button: {
    backgroundColor: '#2563eb', // blue-600
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
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
  secondaryButton: {
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
  infoBox: {
    marginTop: 24,
    backgroundColor: 'rgba(17, 24, 39, 0.5)', // gray-900/50
    borderWidth: 1,
    borderColor: '#374151', // gray-800
    borderRadius: 12,
    padding: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#d1d5db', // gray-300
    marginBottom: 10,
  },
  infoList: {
    gap: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  infoNumber: {
    width: 20,
    height: 20,
    backgroundColor: 'rgba(37, 99, 235, 0.2)', // blue-500/20
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoNumberText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#60a5fa', // blue-400
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#9ca3af', // gray-400
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: '#4b5563', // gray-600
    marginTop: 24,
  },
};

export default EcomRegisterScreen;

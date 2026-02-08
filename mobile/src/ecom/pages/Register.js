import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useEcomAuth } from '../hooks/useEcomAuth';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const Register = ({ navigation }) => {
  const { register } = useEcomAuth();
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

  const handleSubmit = async () => {
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
      }
    } catch (err) {
      setError('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { value: 'ecom_closeuse', label: 'Closeuse' },
    { value: 'ecom_compta', label: 'Comptable' },
    { value: 'ecom_livreur', label: 'Livreur' }
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.bgEffect1} />
        <View style={styles.bgEffect2} />

        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Landing')}
              style={styles.logoContainer}
            >
              <View style={styles.logoPlaceholder}>
                <Text style={styles.logoText}>EC</Text>
              </View>
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
              >
                <Text style={[styles.modeButtonText, mode === 'create' && styles.modeButtonTextActive]}>
                  Créer un espace
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeButton, mode === 'join' && styles.modeButtonActive]}
                onPress={() => { setMode('join'); setError(''); }}
              >
                <Text style={[styles.modeButtonText, mode === 'join' && styles.modeButtonTextActive]}>
                  Rejoindre
                </Text>
              </TouchableOpacity>
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={16} color="#f87171" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {mode === 'create' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nom de votre espace</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Ma Boutique, Mon Business..."
                  placeholderTextColor="#6b7280"
                  value={formData.workspaceName}
                  onChangeText={(text) => setFormData({ ...formData, workspaceName: text })}
                  editable={!loading}
                />
                <Text style={styles.helperText}>Vous pourrez inviter votre équipe ensuite</Text>
              </View>
            )}

            {mode === 'join' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Code d'invitation</Text>
                  <TextInput
                    style={[styles.input, styles.monoInput]}
                    placeholder="Collez le code reçu"
                    placeholderTextColor="#6b7280"
                    value={formData.inviteCode}
                    onChangeText={(text) => setFormData({ ...formData, inviteCode: text })}
                    editable={!loading}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Votre rôle</Text>
                  <View style={styles.roleSelector}>
                    {roles.map((role) => (
                      <TouchableOpacity
                        key={role.value}
                        style={[
                          styles.roleOption,
                          formData.selectedRole === role.value && styles.roleOptionActive
                        ]}
                        onPress={() => setFormData({ ...formData, selectedRole: role.value })}
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

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="votre@email.com"
                placeholderTextColor="#6b7280"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mot de passe</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Min. 6 caractères"
                  placeholderTextColor="#6b7280"
                  value={formData.password}
                  onChangeText={(text) => setFormData({ ...formData, password: text })}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <MaterialIcons
                    name={showPassword ? 'visibility' : 'visibility-off'}
                    size={20}
                    color="#6b7280"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirmer le mot de passe</Text>
              <TextInput
                style={styles.input}
                placeholder="Retapez votre mot de passe"
                placeholderTextColor="#6b7280"
                value={formData.confirmPassword}
                onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                secureTextEntry={!showPassword}
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.submitButtonText}>
                    {mode === 'create' ? 'Création...' : 'Inscription...'}
                  </Text>
                </View>
              ) : (
                <Text style={styles.submitButtonText}>
                  {mode === 'create' ? 'Créer mon espace' : 'Rejoindre l\'équipe'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>déjà un compte ?</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.secondaryButtonText}>Se connecter</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>
            © {new Date().getFullYear()} Ecom Cockpit · Tous droits réservés
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  bgEffect1: {
    position: 'absolute',
    top: -160,
    left: -160,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(147, 51, 234, 0.1)',
  },
  bgEffect2: {
    position: 'absolute',
    bottom: -160,
    right: -160,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 16,
    padding: 24,
  },
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#2563eb',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9ca3af',
  },
  modeButtonTextActive: {
    color: '#fff',
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    color: '#f87171',
    fontSize: 14,
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#d1d5db',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#fff',
  },
  monoInput: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 0.5,
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 6,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 44,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 4,
  },
  roleSelector: {
    gap: 8,
  },
  roleOption: {
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  roleOptionActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  roleOptionText: {
    fontSize: 14,
    color: '#d1d5db',
  },
  roleOptionTextActive: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#374151',
  },
  dividerText: {
    fontSize: 12,
    color: '#6b7280',
  },
  secondaryButton: {
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#d1d5db',
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: '#4b5563',
    marginTop: 24,
  },
});

export default Register;

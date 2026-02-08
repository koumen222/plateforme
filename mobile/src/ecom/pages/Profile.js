import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useEcomAuth } from '../hooks/useEcomAuth';
import { authApi } from '../services/ecomApi';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const Profile = ({ navigation }) => {
  const { user, workspace, logout, loadUser } = useEcomAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const getRoleLabel = (role) => {
    const labels = {
      'super_admin': 'Super Admin',
      'ecom_admin': 'Administrateur',
      'ecom_closeuse': 'Closeuse',
      'ecom_compta': 'Comptabilité',
      'ecom_livreur': 'Livreur'
    };
    return labels[role] || role;
  };

  const getRoleColor = (role) => {
    const colors = {
      'super_admin': '#8b5cf6',
      'ecom_admin': '#2563eb',
      'ecom_closeuse': '#ec4899',
      'ecom_compta': '#10b981',
      'ecom_livreur': '#f59e0b'
    };
    return colors[role] || '#6b7280';
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      await authApi.updateProfile(formData);
      await loadUser();
      setEditing(false);
      Alert.alert('Succès', 'Profil mis à jour');
    } catch (error) {
      Alert.alert('Erreur', error.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);
    try {
      await authApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
      Alert.alert('Succès', 'Mot de passe modifié');
    } catch (error) {
      Alert.alert('Erreur', error.response?.data?.message || 'Erreur lors du changement');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Déconnexion', style: 'destructive', onPress: logout }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        {/* Profile Header */}
        <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: getRoleColor(user?.role) }]}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
          </Text>
        </View>
        <Text style={styles.userName}>{user?.name || 'Utilisateur'}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user?.role) + '20' }]}>
          <Text style={[styles.roleText, { color: getRoleColor(user?.role) }]}>
            {getRoleLabel(user?.role)}
          </Text>
        </View>
        {workspace?.name && (
          <Text style={styles.workspaceName}>📍 {workspace.name}</Text>
        )}
      </View>

      {/* Profile Info */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Informations</Text>
          {!editing && (
            <TouchableOpacity onPress={() => setEditing(true)}>
              <Text style={styles.editButton}>Modifier</Text>
            </TouchableOpacity>
          )}
        </View>

        {editing ? (
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nom</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(t) => setFormData({ ...formData, name: t })}
                placeholder="Votre nom"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Téléphone</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(t) => setFormData({ ...formData, phone: t })}
                placeholder="Votre téléphone"
                keyboardType="phone-pad"
              />
            </View>
            <View style={styles.formActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setEditing(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveProfile}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Enregistrer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <MaterialIcons name="person" size={20} color="#6b7280" />
              <Text style={styles.infoLabel}>Nom</Text>
              <Text style={styles.infoValue}>{user?.name || '-'}</Text>
            </View>
            <View style={styles.infoItem}>
              <MaterialIcons name="email" size={20} color="#6b7280" />
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user?.email || '-'}</Text>
            </View>
            <View style={styles.infoItem}>
              <MaterialIcons name="phone" size={20} color="#6b7280" />
              <Text style={styles.infoLabel}>Téléphone</Text>
              <Text style={styles.infoValue}>{user?.phone || '-'}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Password Section */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => setShowPasswordForm(!showPasswordForm)}
        >
          <Text style={styles.sectionTitle}>Mot de passe</Text>
          <MaterialIcons
            name={showPasswordForm ? 'expand-less' : 'expand-more'}
            size={24}
            color="#6b7280"
          />
        </TouchableOpacity>

        {showPasswordForm && (
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mot de passe actuel</Text>
              <TextInput
                style={styles.input}
                value={passwordData.currentPassword}
                onChangeText={(t) => setPasswordData({ ...passwordData, currentPassword: t })}
                secureTextEntry
                placeholder="••••••••"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nouveau mot de passe</Text>
              <TextInput
                style={styles.input}
                value={passwordData.newPassword}
                onChangeText={(t) => setPasswordData({ ...passwordData, newPassword: t })}
                secureTextEntry
                placeholder="Min. 6 caractères"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirmer</Text>
              <TextInput
                style={styles.input}
                value={passwordData.confirmPassword}
                onChangeText={(t) => setPasswordData({ ...passwordData, confirmPassword: t })}
                secureTextEntry
                placeholder="Retapez le mot de passe"
              />
            </View>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleChangePassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Changer le mot de passe</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <MaterialIcons name="logout" size={20} color="#ef4444" />
        <Text style={styles.logoutText}>Déconnexion</Text>
      </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  roleBadge: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roleText: {
    fontSize: 13,
    fontWeight: '600',
  },
  workspaceName: {
    marginTop: 12,
    fontSize: 13,
    color: '#6b7280',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  editButton: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '500',
  },
  infoList: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
    width: 80,
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  form: {
    gap: 12,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    marginHorizontal: 16,
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ef4444',
  },
});

export default Profile;

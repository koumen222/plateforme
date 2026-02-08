import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useEcomAuth } from '../../contexts/EcomAuthContext';
import ecomApi from '../../services/ecom/ecomApi';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const Settings = ({ navigation }) => {
  const { user, logout } = useEcomAuth();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    notifications: true,
    emailNotifications: true,
    pushNotifications: true,
    darkMode: false,
    autoBackup: true,
    language: 'fr'
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await ecomApi.settings.get();
      setSettings(response.data.data || settings);
    } catch (error) {
      console.error('Erreur chargement paramètres:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await ecomApi.settings.update(settings);
      Alert.alert('Succès', 'Paramètres sauvegardés');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder les paramètres');
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
        { text: 'Se déconnecter', onPress: logout }
      ]
    );
  };

  const renderSettingItem = (title, subtitle, value, onToggle) => (
    <View style={styles.settingItem}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
        thumbColor={value ? '#ffffff' : '#f3f4f6'}
      />
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Paramètres</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        {renderSettingItem(
          'Notifications push',
          'Recevoir des notifications sur votre appareil',
          settings.pushNotifications,
          (value) => handleSettingChange('pushNotifications', value)
        )}
        {renderSettingItem(
          'Notifications email',
          'Recevoir des notifications par email',
          settings.emailNotifications,
          (value) => handleSettingChange('emailNotifications', value)
        )}
        {renderSettingItem(
          'Notifications générales',
          'Activer toutes les notifications',
          settings.notifications,
          (value) => handleSettingChange('notifications', value)
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Apparence</Text>
        {renderSettingItem(
          'Mode sombre',
          'Utiliser le thème sombre',
          settings.darkMode,
          (value) => handleSettingChange('darkMode', value)
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Données</Text>
        {renderSettingItem(
          'Sauvegarde automatique',
          'Sauvegarder automatiquement vos données',
          settings.autoBackup,
          (value) => handleSettingChange('autoBackup', value)
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>À propos</Text>
        <View style={styles.aboutItem}>
          <Text style={styles.aboutTitle}>Version</Text>
          <Text style={styles.aboutValue}>1.0.0</Text>
        </View>
        <View style={styles.aboutItem}>
          <Text style={styles.aboutTitle}>Utilisateur</Text>
          <Text style={styles.aboutValue}>{user?.email}</Text>
        </View>
        <View style={styles.aboutItem}>
          <Text style={styles.aboutTitle}>Workspace</Text>
          <Text style={styles.aboutValue}>{user?.workspace?.name || 'N/A'}</Text>
        </View>
        <View style={styles.aboutItem}>
          <Text style={styles.aboutTitle}>Rôle</Text>
          <Text style={styles.aboutValue}>{user?.role || 'N/A'}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleSave}
          disabled={loading}
        >
          <MaterialIcons name="save" size={20} color="#3b82f6" />
          <Text style={styles.actionButtonText}>Sauvegarder les paramètres</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.logoutButton]}
          onPress={handleLogout}
        >
          <MaterialIcons name="logout" size={20} color="#ef4444" />
          <Text style={[styles.actionButtonText, styles.logoutButtonText]}>Se déconnecter</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  section: {
    backgroundColor: '#ffffff',
    marginTop: 16,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  aboutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  aboutTitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  aboutValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    marginBottom: 8,
    gap: 12,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  logoutButton: {
    backgroundColor: '#fef2f2',
  },
  logoutButtonText: {
    color: '#ef4444',
  },
});

export default Settings;

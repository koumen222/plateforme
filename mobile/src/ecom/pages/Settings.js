import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
} from 'react-native';
import { useEcomAuth } from '../hooks/useEcomAuth';
import { useCurrency } from '../contexts/CurrencyContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const Settings = ({ navigation }) => {
  const { user, workspace } = useEcomAuth();
  const { code: currentCurrency } = useCurrency();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const currencies = [
    { code: 'XAF', label: 'FCFA (Afrique Centrale)' },
    { code: 'XOF', label: 'FCFA (Afrique Ouest)' },
    { code: 'EUR', label: 'Euro' },
    { code: 'USD', label: 'Dollar US' },
    { code: 'NGN', label: 'Naira' },
    { code: 'GHS', label: 'Cedi' },
    { code: 'MAD', label: 'Dirham' },
  ];

  const handleCurrencyChange = (currency) => {
    Alert.alert(
      'Changer de devise',
      `Passer à ${currency} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Confirmer', onPress: () => console.log('Change to', currency) }
      ]
    );
  };

  const SettingItem = ({ icon, title, subtitle, onPress, rightComponent }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress} disabled={!onPress}>
      <View style={styles.settingIcon}>
        <MaterialIcons name={icon} size={22} color="#6b7280" />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightComponent || (onPress && <MaterialIcons name="chevron-right" size={20} color="#d1d5db" />)}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        {/* Workspace Info */}
      {workspace && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Espace de travail</Text>
          <View style={styles.workspaceCard}>
            <View style={styles.workspaceIcon}>
              <MaterialIcons name="business" size={24} color="#2563eb" />
            </View>
            <View style={styles.workspaceInfo}>
              <Text style={styles.workspaceName}>{workspace.name}</Text>
              <Text style={styles.workspaceId}>ID: {workspace._id?.slice(-8)}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Préférences</Text>
        
        <SettingItem
          icon="notifications"
          title="Notifications"
          subtitle="Recevoir les alertes"
          rightComponent={
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#e5e7eb', true: '#93c5fd' }}
              thumbColor={notifications ? '#2563eb' : '#9ca3af'}
            />
          }
        />

        <SettingItem
          icon="dark-mode"
          title="Mode sombre"
          subtitle="Thème de l'application"
          rightComponent={
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#e5e7eb', true: '#93c5fd' }}
              thumbColor={darkMode ? '#2563eb' : '#9ca3af'}
            />
          }
        />
      </View>

      {/* Currency */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Devise</Text>
        <Text style={styles.sectionSubtitle}>Devise actuelle: {currentCurrency}</Text>
        
        <View style={styles.currencyGrid}>
          {currencies.map((currency) => (
            <TouchableOpacity
              key={currency.code}
              style={[
                styles.currencyButton,
                currentCurrency === currency.code && styles.currencyButtonActive
              ]}
              onPress={() => handleCurrencyChange(currency.code)}
            >
              <Text style={[
                styles.currencyCode,
                currentCurrency === currency.code && styles.currencyCodeActive
              ]}>
                {currency.code}
              </Text>
              <Text style={[
                styles.currencyLabel,
                currentCurrency === currency.code && styles.currencyLabelActive
              ]}>
                {currency.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Admin Settings */}
      {user?.role === 'ecom_admin' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Administration</Text>
          
          <SettingItem
            icon="group"
            title="Gestion de l'équipe"
            subtitle="Inviter et gérer les membres"
            onPress={() => navigation.navigate('Users')}
          />
          
          <SettingItem
            icon="inventory"
            title="Gestion du stock"
            subtitle="Emplacements et alertes"
            onPress={() => navigation.navigate('Stock')}
          />
          
          <SettingItem
            icon="campaign"
            title="Marketing"
            subtitle="Campagnes et promotions"
            onPress={() => navigation.navigate('Campaigns')}
          />
        </View>
      )}

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>À propos</Text>
        
        <SettingItem
          icon="info"
          title="Version"
          subtitle="1.0.0"
        />
        
        <SettingItem
          icon="help"
          title="Aide & Support"
          onPress={() => Alert.alert('Support', 'Contactez-nous à support@ecomcockpit.com')}
        />
        
        <SettingItem
          icon="description"
          title="Conditions d'utilisation"
          onPress={() => {}}
        />
        
        <SettingItem
          icon="privacy-tip"
          title="Politique de confidentialité"
          onPress={() => {}}
        />
      </View>

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
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 12,
  },
  workspaceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    padding: 14,
    borderRadius: 10,
  },
  workspaceIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  workspaceInfo: {
    marginLeft: 12,
  },
  workspaceName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  workspaceId: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingContent: {
    flex: 1,
    marginLeft: 12,
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
  currencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  currencyButton: {
    width: '48%',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 12,
  },
  currencyButtonActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  currencyCode: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  currencyCodeActive: {
    color: '#2563eb',
  },
  currencyLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  currencyLabelActive: {
    color: '#3b82f6',
  },
});

export default Settings;

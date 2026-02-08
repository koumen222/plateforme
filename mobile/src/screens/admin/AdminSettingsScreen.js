import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useThemeSafe } from '../../contexts/ThemeContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const AdminSettingsScreen = () => {
  const theme = useThemeSafe();

  const [notifications, setNotifications] = useState(true);
  const [autoBackup, setAutoBackup] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [debugMode, setDebugMode] = useState(false);

  const settingsSections = [
    {
      title: 'Général',
      items: [
        {
          icon: 'dark-mode',
          title: 'Mode sombre',
          subtitle: 'Changer le thème de l\'application',
          toggle: isDarkMode,
          onToggle: toggleTheme,
        },
        {
          icon: 'language',
          title: 'Langue',
          subtitle: 'Français',
          onPress: () => console.log('Language settings'),
        },
        {
          icon: 'schedule',
          title: 'Fuseau horaire',
          subtitle: 'Europe/Paris',
          onPress: () => console.log('Timezone settings'),
        },
      ],
    },
    {
      title: 'Notifications',
      items: [
        {
          icon: 'notifications',
          title: 'Notifications push',
          subtitle: 'Recevoir les notifications du système',
          toggle: notifications,
          onToggle: setNotifications,
        },
        {
          icon: 'email',
          title: 'Notifications email',
          subtitle: 'Alertes par email',
          onPress: () => console.log('Email notifications'),
        },
        {
          icon: 'sms',
          title: 'Notifications SMS',
          subtitle: 'Alertes par SMS',
          onPress: () => console.log('SMS notifications'),
        },
      ],
    },
    {
      title: 'Système',
      items: [
        {
          icon: 'backup',
          title: 'Sauvegarde automatique',
          subtitle: 'Sauvegarder les données quotidiennement',
          toggle: autoBackup,
          onToggle: setAutoBackup,
        },
        {
          icon: 'build',
          title: 'Mode maintenance',
          subtitle: 'Mettre le site en maintenance',
          toggle: maintenanceMode,
          onToggle: setMaintenanceMode,
        },
        {
          icon: 'bug-report',
          title: 'Mode debug',
          subtitle: 'Activer les logs de debug',
          toggle: debugMode,
          onToggle: setDebugMode,
        },
      ],
    },
    {
      title: 'Sécurité',
      items: [
        {
          icon: 'security',
          title: 'Authentification',
          subtitle: 'Configurer l\'authentification',
          onPress: () => console.log('Authentication settings'),
        },
        {
          icon: 'vpn-key',
          title: 'Clés API',
          subtitle: 'Gérer les clés API',
          onPress: () => console.log('API keys'),
        },
        {
          icon: 'lock',
          title: 'Permissions',
          subtitle: 'Gérer les permissions des utilisateurs',
          onPress: () => console.log('Permissions'),
        },
      ],
    },
    {
      title: 'Données',
      items: [
        {
          icon: 'storage',
          title: 'Stockage',
          subtitle: 'Gérer l\'espace de stockage',
          onPress: () => console.log('Storage settings'),
        },
        {
          icon: 'cloud-upload',
          title: 'Exportation',
          subtitle: 'Exporter les données',
          onPress: () => console.log('Export data'),
        },
        {
          icon: 'cloud-download',
          title: 'Importation',
          subtitle: 'Importer des données',
          onPress: () => console.log('Import data'),
        },
      ],
    },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Paramètres administrateur</Text>
      
      {settingsSections.map((section, sectionIndex) => (
        <View key={sectionIndex} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {section.title}
          </Text>
          
          {section.items.map((item, itemIndex) => (
            <TouchableOpacity 
              key={itemIndex}
              style={[styles.settingItem, { backgroundColor: theme.colors.surface }]}
              onPress={item.onPress}
              disabled={item.toggle !== undefined}
            >
              <View style={styles.settingLeft}>
                <MaterialIcons name={item.icon} size={24} color={theme.colors.text} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                    {item.title}
                  </Text>
                  <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
                    {item.subtitle}
                  </Text>
                </View>
              </View>
              
              {item.toggle !== undefined ? (
                <Switch
                  value={item.toggle}
                  onValueChange={item.onToggle}
                  trackColor={{ false: '#ccc', true: theme.colors.primary }}
                  thumbColor={item.toggle ? '#fff' : '#f4f3f4'}
                />
              ) : (
                <MaterialIcons name="chevron-right" size={24} color={theme.colors.textSecondary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      ))}

      <View style={styles.dangerSection}>
        <Text style={[styles.sectionTitle, { color: '#F44336' }]}>Actions dangereuses</Text>
        
        <TouchableOpacity style={[styles.dangerButton, { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#F44336' }]}>
          <MaterialIcons name="refresh" size={24} color="#F44336" />
          <Text style={[styles.dangerButtonText, { color: '#F44336' }]}>
            Réinitialiser les paramètres
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.dangerButton, { backgroundColor: '#F44336' }]}>
          <MaterialIcons name="delete-forever" size={24} color="white" />
          <Text style={styles.dangerButtonText}>Supprimer toutes les données</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.infoSection, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.infoTitle, { color: theme.colors.text }]}>Informations système</Text>
        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Version:</Text>
          <Text style={[styles.infoValue, { color: theme.colors.text }]}>1.0.0</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Dernière sauvegarde:</Text>
          <Text style={[styles.infoValue, { color: theme.colors.text }]}>08/02/2024 14:30</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Espace utilisé:</Text>
          <Text style={[styles.infoValue, { color: theme.colors.text }]}>2.3 GB / 10 GB</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 16,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  dangerSection: {
    marginBottom: 20,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoSection: {
    padding: 16,
    borderRadius: 8,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default AdminSettingsScreen;

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useThemeSafe } from '../../contexts/ThemeContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const EcomProfileScreen = ({ navigation }) => {
  const theme = useThemeSafe();

  const [notifications, setNotifications] = React.useState(true);
  const [newsletter, setNewsletter] = React.useState(false);

  const menuItems = [
    {
      icon: 'person',
      title: 'Informations personnelles',
      subtitle: 'Nom, email, téléphone',
      onPress: () => console.log('Informations personnelles'),
    },
    {
      icon: 'location-on',
      title: 'Adresses de livraison',
      subtitle: 'Gérer vos adresses',
      onPress: () => console.log('Adresses'),
    },
    {
      icon: 'credit-card',
      title: 'Moyens de paiement',
      subtitle: 'Cartes bancaires, PayPal',
      onPress: () => console.log('Paiements'),
    },
    {
      icon: 'receipt',
      title: 'Historique des commandes',
      subtitle: 'Voir toutes vos commandes',
      onPress: () => navigation.navigate('EcomOrders'),
    },
    {
      icon: 'favorite',
      title: 'Favoris',
      subtitle: 'Produits en favoris',
      onPress: () => console.log('Favoris'),
    },
    {
      icon: 'notifications',
      title: 'Notifications',
      subtitle: 'Gérer les notifications',
      onPress: () => console.log('Notifications'),
      toggle: notifications,
      onToggle: setNotifications,
    },
    {
      icon: 'email',
      title: 'Newsletter',
      subtitle: 'Abonnements aux offres',
      onPress: () => console.log('Newsletter'),
      toggle: newsletter,
      onToggle: setNewsletter,
    },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.avatar}>
          <MaterialIcons name="person" size={50} color={theme.colors.primary} />
        </View>
        <Text style={[styles.name, { color: theme.colors.text }]}>
          Jean Dupont
        </Text>
        <Text style={[styles.email, { color: theme.colors.textSecondary }]}>
          jean.dupont@email.com
        </Text>
        <TouchableOpacity style={[styles.editButton, { backgroundColor: theme.colors.primary }]}>
          <MaterialIcons name="edit" size={16} color="white" />
          <Text style={styles.editButtonText}>Modifier le profil</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Préférences</Text>
        
        <TouchableOpacity style={[styles.settingItem, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.settingLeft}>
            <MaterialIcons name="dark-mode" size={24} color={theme.colors.text} />
            <View style={styles.settingText}>
              <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                Mode sombre
              </Text>
              <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
                {isDarkMode ? 'Activé' : 'Désactivé'}
              </Text>
            </View>
          </View>
          <Switch
            value={isDarkMode}
            onValueChange={toggleTheme}
            trackColor={{ false: '#ccc', true: theme.colors.primary }}
            thumbColor={isDarkMode ? '#fff' : '#f4f3f4'}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Compte</Text>
        
        {menuItems.map((item, index) => (
          <TouchableOpacity 
            key={index}
            style={[styles.menuItem, { backgroundColor: theme.colors.surface }]}
            onPress={item.onPress}
          >
            <View style={styles.menuLeft}>
              <MaterialIcons name={item.icon} size={24} color={theme.colors.text} />
              <View style={styles.menuText}>
                <Text style={[styles.menuTitle, { color: theme.colors.text }]}>
                  {item.title}
                </Text>
                <Text style={[styles.menuSubtitle, { color: theme.colors.textSecondary }]}>
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

      <View style={styles.section}>
        <TouchableOpacity style={[styles.dangerButton, { backgroundColor: '#ff4444' }]}>
          <MaterialIcons name="logout" size={24} color="white" />
          <Text style={styles.dangerButtonText}>Déconnexion</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.dangerButton, { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#ff4444' }]}>
          <MaterialIcons name="delete" size={24} color="#ff4444" />
          <Text style={[styles.dangerButtonText, { color: '#ff4444' }]}>Supprimer le compte</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 30,
    margin: 16,
    borderRadius: 12,
    elevation: 2,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    marginBottom: 20,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  section: {
    padding: 16,
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
    elevation: 1,
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
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 1,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuText: {
    marginLeft: 16,
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  menuSubtitle: {
    fontSize: 14,
    marginTop: 2,
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
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default EcomProfileScreen;

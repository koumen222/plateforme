import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useThemeSafe } from '../utils/useThemeSafe';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const theme = useThemeSafe();

  const handleLogout = () => {
    logout();
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.avatar}>
          <MaterialIcons name="person" size={50} color={theme.colors.primary} />
        </View>
        <Text style={[styles.name, { color: theme.colors.text }]}>
          {user?.name || 'Utilisateur'}
        </Text>
        <Text style={[styles.email, { color: theme.colors.textSecondary }]}>
          {user?.email || 'email@example.com'}
        </Text>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.colors.surface }]}>
          <MaterialIcons name="settings" size={24} color={theme.colors.text} />
          <Text style={[styles.menuText, { color: theme.colors.text }]}>Paramètres</Text>
          <MaterialIcons name="chevron-right" size={24} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.colors.surface }]}>
          <MaterialIcons name="notifications" size={24} color={theme.colors.text} />
          <Text style={[styles.menuText, { color: theme.colors.text }]}>Notifications</Text>
          <MaterialIcons name="chevron-right" size={24} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.colors.surface }]}>
          <MaterialIcons name="help" size={24} color={theme.colors.text} />
          <Text style={[styles.menuText, { color: theme.colors.text }]}>Aide</Text>
          <MaterialIcons name="chevron-right" size={24} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.logoutButton, { backgroundColor: '#ff4444' }]}
          onPress={handleLogout}
        >
          <MaterialIcons name="logout" size={24} color="white" />
          <Text style={styles.logoutText}>Déconnexion</Text>
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
  },
  section: {
    padding: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 1,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ProfileScreen;

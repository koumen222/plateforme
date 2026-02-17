import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useThemeSafe } from '../../contexts/ThemeContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const AdminUsersScreen = () => {
  const theme = useThemeSafe();
  const [searchTerm, setSearchTerm] = useState('');

  const users = [
    { id: 1, name: 'Jean Dupont', email: 'jean@email.com', role: 'user', status: 'active', joinDate: '01/01/2024' },
    { id: 2, name: 'Marie Martin', email: 'marie@email.com', role: 'admin', status: 'active', joinDate: '15/01/2024' },
    { id: 3, name: 'Pierre Durand', email: 'pierre@email.com', role: 'user', status: 'inactive', joinDate: '20/01/2024' },
    { id: 4, name: 'Sophie Petit', email: 'sophie@email.com', role: 'user', status: 'active', joinDate: '05/02/2024' },
  ];

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    return status === 'active' ? '#4CAF50' : '#F44336';
  };

  const getRoleColor = (role) => {
    return role === 'admin' ? '#9C27B0' : '#2196F3';
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Gestion des utilisateurs</Text>
      
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface }]}>
        <MaterialIcons name="search" size={24} color={theme.colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text }]}
          placeholder="Rechercher un utilisateur..."
          placeholderTextColor={theme.colors.textSecondary}
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.statNumber, { color: theme.colors.primary }]}>{users.length}</Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Total</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.statNumber, { color: '#4CAF50' }]}>
            {users.filter(u => u.status === 'active').length}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Actifs</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.statNumber, { color: '#9C27B0' }]}>
            {users.filter(u => u.role === 'admin').length}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Admins</Text>
        </View>
      </View>

      {filteredUsers.map(user => (
        <TouchableOpacity key={user.id} style={[styles.userCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <MaterialIcons name="person" size={32} color={theme.colors.primary} />
            </View>
            <View style={styles.userDetails}>
              <Text style={[styles.userName, { color: theme.colors.text }]}>{user.name}</Text>
              <Text style={[styles.userEmail, { color: theme.colors.textSecondary }]}>{user.email}</Text>
              <Text style={[styles.joinDate, { color: theme.colors.textSecondary }]}>
                Inscrit le {user.joinDate}
              </Text>
            </View>
          </View>
          
          <View style={styles.userBadges}>
            <View style={[styles.badge, { backgroundColor: getRoleColor(user.role) }]}>
              <Text style={styles.badgeText}>{user.role === 'admin' ? 'Admin' : 'Utilisateur'}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: getStatusColor(user.status) }]}>
              <Text style={styles.badgeText}>
                {user.status === 'active' ? 'Actif' : 'Inactif'}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.moreButton}>
            <MaterialIcons name="more-vert" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={[styles.addButton, { backgroundColor: theme.colors.primary }]}>
        <MaterialIcons name="add" size={24} color="white" />
        <Text style={styles.addButtonText}>Ajouter un utilisateur</Text>
      </TouchableOpacity>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 2,
  },
  joinDate: {
    fontSize: 12,
  },
  userBadges: {
    flexDirection: 'column',
    gap: 4,
    marginRight: 12,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  moreButton: {
    padding: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default AdminUsersScreen;

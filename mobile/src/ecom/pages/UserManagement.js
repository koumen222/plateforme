import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { useEcomAuth } from '../hooks/useEcomAuth';
import { usersApi } from '../services/ecomApi';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const UserManagement = ({ navigation }) => {
  const { user: currentUser, workspace } = useEcomAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({});

  const loadUsers = async () => {
    try {
      const response = await usersApi.getUsers({});
      // Backend returns: { success: true, data: { users, stats } }
      const usersData = response.data?.data?.users || [];
      const statsData = response.data?.data?.stats || {};
      
      setUsers(Array.isArray(usersData) ? usersData : []);
      setStats(statsData);
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
      setUsers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const getRoleLabel = (role) => {
    const labels = {
      'ecom_admin': 'Admin',
      'ecom_closeuse': 'Closeuse',
      'ecom_compta': 'Comptable',
      'ecom_livreur': 'Livreur'
    };
    return labels[role] || role;
  };

  const getRoleColor = (role) => {
    const colors = {
      'ecom_admin': '#2563eb',
      'ecom_closeuse': '#ec4899',
      'ecom_compta': '#10b981',
      'ecom_livreur': '#f59e0b'
    };
    return colors[role] || '#6b7280';
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    Alert.alert(
      currentStatus ? 'Désactiver' : 'Activer',
      `${currentStatus ? 'Désactiver' : 'Activer'} cet utilisateur ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              await usersApi.toggleUserStatus(userId);
              loadUsers();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de modifier le statut');
            }
          }
        }
      ]
    );
  };

  const renderUser = ({ item }) => {
    const isCurrentUser = item._id === currentUser?._id;
    
    return (
      <View style={styles.userCard}>
        <View style={[styles.avatar, { backgroundColor: getRoleColor(item.role) }]}>
          <Text style={styles.avatarText}>
            {item.name?.charAt(0)?.toUpperCase() || item.email?.charAt(0)?.toUpperCase() || 'U'}
          </Text>
        </View>
        
        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.userName}>{item.name || 'Sans nom'}</Text>
            {isCurrentUser && <Text style={styles.youBadge}>Vous</Text>}
          </View>
          <Text style={styles.userEmail}>{item.email}</Text>
          
          <View style={styles.tagsRow}>
            <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) + '20' }]}>
              <Text style={[styles.roleText, { color: getRoleColor(item.role) }]}>
                {getRoleLabel(item.role)}
              </Text>
            </View>
            <View style={[
              styles.statusBadge,
              { backgroundColor: item.isActive ? '#dcfce7' : '#fee2e2' }
            ]}>
              <Text style={[
                styles.statusText,
                { color: item.isActive ? '#16a34a' : '#dc2626' }
              ]}>
                {item.isActive ? 'Actif' : 'Inactif'}
              </Text>
            </View>
          </View>
        </View>

        {!isCurrentUser && currentUser?.role === 'ecom_admin' && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleToggleStatus(item._id, item.isActive)}
          >
            <MaterialIcons
              name={item.isActive ? 'block' : 'check-circle'}
              size={22}
              color={item.isActive ? '#ef4444' : '#10b981'}
            />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Page Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Équipe</Text>
          <Text style={styles.subtitle}>{workspace?.name}</Text>
        </View>
        
        {currentUser?.role === 'ecom_admin' && (
          <TouchableOpacity
            style={styles.inviteButton}
            onPress={() => Alert.alert('Invitation', 'Fonctionnalité à venir')}
          >
            <MaterialIcons name="person-add" size={20} color="#fff" />
            <Text style={styles.inviteButtonText}>Inviter</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{users.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{users.filter(u => u.isActive).length}</Text>
          <Text style={styles.statLabel}>Actifs</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{users.filter(u => u.role === 'ecom_admin').length}</Text>
          <Text style={styles.statLabel}>Admins</Text>
        </View>
      </View>

      {/* Users List */}
      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="group" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>Aucun membre</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  inviteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  listContent: {
    padding: 16,
    paddingTop: 4,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  youBadge: {
    fontSize: 10,
    color: '#2563eb',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  userEmail: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actionButton: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
});

export default UserManagement;

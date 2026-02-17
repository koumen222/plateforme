import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { useThemeSafe } from '../../utils/useThemeSafe';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const ClientsListScreen = ({ navigation }) => {
  const theme = useThemeSafe();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, active, inactive

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      // Simuler le chargement des clients
      const mockClients = [
        {
          id: 1,
          name: 'Jean Dupont',
          email: 'jean.dupont@email.com',
          phone: '+33612345678',
          status: 'active',
          lastOrder: '2024-01-15',
          totalSpent: 1250,
          ordersCount: 8,
        },
        {
          id: 2,
          name: 'Marie Martin',
          email: 'marie.martin@email.com',
          phone: '+33687654321',
          status: 'active',
          lastOrder: '2024-01-20',
          totalSpent: 890,
          ordersCount: 5,
        },
        {
          id: 3,
          name: 'Pierre Bernard',
          email: 'pierre.bernard@email.com',
          phone: '+33611223344',
          status: 'inactive',
          lastOrder: '2023-12-10',
          totalSpent: 450,
          ordersCount: 3,
        },
        {
          id: 4,
          name: 'Sophie Petit',
          email: 'sophie.petit@email.com',
          phone: '+33655443322',
          status: 'active',
          lastOrder: '2024-01-22',
          totalSpent: 2100,
          ordersCount: 12,
        },
      ];
      setClients(mockClients);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les clients');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadClients();
  };

  const getStatusColor = (status) => {
    return status === 'active' ? theme.colors.success : theme.colors.textSecondary;
  };

  const getStatusText = (status) => {
    return status === 'active' ? 'Actif' : 'Inactif';
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(search.toLowerCase()) ||
                         client.email.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || client.status === filter;
    return matchesSearch && matchesFilter;
  });

  const renderClientItem = (client) => (
    <TouchableOpacity
      key={client.id}
      style={[styles.clientCard, { backgroundColor: theme.colors.surface }]}
      onPress={() => navigation.navigate('ClientDetail', { clientId: client.id })}
    >
      <View style={styles.clientHeader}>
        <View style={styles.clientInfo}>
          <Text style={[styles.clientName, { color: theme.colors.text }]}>
            {client.name}
          </Text>
          <Text style={[styles.clientEmail, { color: theme.colors.textSecondary }]}>
            {client.email}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(client.status) }]}>
          <Text style={styles.statusText}>{getStatusText(client.status)}</Text>
        </View>
      </View>

      <View style={styles.clientStats}>
        <View style={styles.statItem}>
          <MaterialIcons name="shopping-cart" size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
            {client.ordersCount} commandes
          </Text>
        </View>

        <View style={styles.statItem}>
          <MaterialIcons name="currency-euro" size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
            {client.totalSpent}€ total
          </Text>
        </View>

        <View style={styles.statItem}>
          <MaterialIcons name="calendar-today" size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
            Dernière: {client.lastOrder}
          </Text>
        </View>
      </View>

      <View style={styles.clientActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => navigation.navigate('ClientForm', { clientId: client.id })}
        >
          <MaterialIcons name="edit" size={16} color="white" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.success }]}
          onPress={() => Alert.alert('Info', 'Fonctionnalité d\'appel à implémenter')}
        >
          <MaterialIcons name="phone" size={16} color="white" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.warning }]}
          onPress={() => Alert.alert('Info', 'Fonctionnalité d\'email à implémenter')}
        >
          <MaterialIcons name="email" size={16} color="white" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderFilterButton = (filterType, title) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        { 
          backgroundColor: filter === filterType ? theme.colors.primary : theme.colors.surface,
          borderColor: theme.colors.border
        }
      ]}
      onPress={() => setFilter(filterType)}
    >
      <Text style={[
        styles.filterButtonText,
        { color: filter === filterType ? 'white' : theme.colors.text }
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Clients
        </Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => navigation.navigate('ClientForm')}
        >
          <MaterialIcons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface }]}>
        <MaterialIcons name="search" size={20} color={theme.colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text }]}
          placeholder="Rechercher un client..."
          placeholderTextColor={theme.colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.filtersContainer}>
        {renderFilterButton('all', 'Tous')}
        {renderFilterButton('active', 'Actifs')}
        {renderFilterButton('inactive', 'Inactifs')}
      </View>

      <ScrollView
        style={styles.clientsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredClients.map(renderClientItem)}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
    paddingHorizontal: 15,
    borderRadius: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  clientsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  clientCard: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
  },
  clientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  clientEmail: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  clientStats: {
    marginBottom: 15,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  statText: {
    marginLeft: 8,
    fontSize: 14,
  },
  clientActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    width: 35,
    height: 35,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
});

export default ClientsListScreen;

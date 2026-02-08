import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  ScrollView,
  Linking,
} from 'react-native';
import { useEcomAuth } from '../hooks/useEcomAuth';
import { clientsApi } from '../services/ecomApi';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AppHeader from '../components/AppHeader';

// Status labels and colors matching web app
const statusLabels = { prospect: 'Prospect', confirmed: 'Confirmé', delivered: 'Livré', returned: 'Retour', blocked: 'Bloqué' };
const statusColors = {
  prospect: { bg: '#fef3c7', text: '#92400e' },
  confirmed: { bg: '#dbeafe', text: '#1e40af' },
  delivered: { bg: '#d1fae5', text: '#065f46' },
  returned: { bg: '#ffedd5', text: '#9a3412' },
  blocked: { bg: '#fee2e2', text: '#991b1b' }
};

const ClientsList = ({ navigation }) => {
  const { user } = useEcomAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [stats, setStats] = useState({});

  const loadClients = async () => {
    try {
      const params = { limit: 50 };
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus;
      
      const response = await clientsApi.getClients(params);
      const clientsData = response.data?.data?.clients || [];
      const statsData = response.data?.data?.stats || {};
      
      setClients(Array.isArray(clientsData) ? clientsData : []);
      setStats(statsData);
    } catch (error) {
      console.error('Erreur chargement clients:', error);
      setClients([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (!loading) loadClients();
  }, [search, filterStatus]);

  const onRefresh = () => {
    setRefreshing(true);
    loadClients();
  };

  const handleCall = (phone) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const getClientName = (client) => {
    if (client.firstName || client.lastName) {
      return `${client.firstName || ''} ${client.lastName || ''}`.trim();
    }
    return client.name || 'Client sans nom';
  };

  const renderClient = ({ item }) => {
    const statusStyle = statusColors[item.status] || statusColors.prospect;
    return (
      <TouchableOpacity
        style={styles.clientCard}
        onPress={() => navigation.navigate('ClientDetail', { clientId: item._id })}
      >
        <View style={styles.clientHeader}>
          <View style={styles.clientHeaderLeft}>
            <Text style={styles.clientName}>{getClientName(item)}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
              <Text style={[styles.statusText, { color: statusStyle.text }]}>
                {statusLabels[item.status] || item.status}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.clientDetails}>
          {item.phone && (
            <TouchableOpacity style={styles.detailRow} onPress={() => handleCall(item.phone)}>
              <MaterialIcons name="phone" size={14} color="#9ca3af" />
              <Text style={styles.detailText}>{item.phone}</Text>
            </TouchableOpacity>
          )}
          {item.email && (
            <View style={styles.detailRow}>
              <MaterialIcons name="email" size={14} color="#9ca3af" />
              <Text style={styles.detailText}>{item.email}</Text>
            </View>
          )}
          {item.city && (
            <View style={styles.detailRow}>
              <MaterialIcons name="location-on" size={14} color="#9ca3af" />
              <Text style={styles.detailText}>{item.city}</Text>
            </View>
          )}
        </View>

        {item.products && item.products.length > 0 && (
          <View style={styles.productsRow}>
            <Text style={styles.productsLabel}>Produits: </Text>
            <Text style={styles.productsText}>{item.products.join(', ')}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Chargement des clients...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* App Header */}
      <AppHeader navigation={navigation} />

      <FlatList
        data={clients}
        renderItem={renderClient}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />
        }
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* Page Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>Clients</Text>
                <Text style={styles.subtitle}>{stats.total || 0} client{(stats.total || 0) > 1 ? 's' : ''}</Text>
              </View>
              {(user?.role === 'ecom_admin' || user?.role === 'ecom_closeuse') && (
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => navigation.navigate('ClientForm')}
                >
                  <Text style={styles.addButtonText}>+ Client</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Stats Cards - like web */}
            <View style={styles.statsContainer}>
              <View style={[styles.statCard, { borderLeftColor: '#f59e0b' }]}>
                <Text style={[styles.statValue, { color: '#f59e0b' }]}>{stats.prospects || 0}</Text>
                <Text style={styles.statLabel}>PROSPECTS</Text>
              </View>
              <View style={[styles.statCard, { borderLeftColor: '#3b82f6' }]}>
                <Text style={[styles.statValue, { color: '#3b82f6' }]}>{stats.confirmed || 0}</Text>
                <Text style={styles.statLabel}>CONFIRMÉS</Text>
              </View>
              <View style={[styles.statCard, { borderLeftColor: '#10b981' }]}>
                <Text style={[styles.statValue, { color: '#10b981' }]}>{stats.delivered || 0}</Text>
                <Text style={styles.statLabel}>LIVRÉS</Text>
              </View>
              <View style={[styles.statCard, { borderLeftColor: '#f97316' }]}>
                <Text style={[styles.statValue, { color: '#f97316' }]}>{stats.returned || 0}</Text>
                <Text style={styles.statLabel}>RETOURS</Text>
              </View>
              <View style={[styles.statCard, { borderLeftColor: '#ef4444' }]}>
                <Text style={[styles.statValue, { color: '#ef4444' }]}>{stats.blocked || 0}</Text>
                <Text style={styles.statLabel}>BLOQUÉS</Text>
              </View>
            </View>

            {/* Filters */}
            <View style={styles.filtersCard}>
              {/* Search */}
              <View style={styles.searchContainer}>
                <MaterialIcons name="search" size={18} color="#9ca3af" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Rechercher nom, tél, email, ville..."
                  placeholderTextColor="#9ca3af"
                  value={search}
                  onChangeText={setSearch}
                />
              </View>

              {/* Status filter pills */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusFilters}>
                <TouchableOpacity
                  style={[styles.statusPill, !filterStatus && styles.statusPillActive]}
                  onPress={() => setFilterStatus('')}
                >
                  <Text style={[styles.statusPillText, !filterStatus && styles.statusPillTextActive]}>
                    Tous les statuts
                  </Text>
                </TouchableOpacity>
                {Object.entries(statusLabels).map(([key, label]) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.statusPill,
                      filterStatus === key && { backgroundColor: statusColors[key].bg }
                    ]}
                    onPress={() => setFilterStatus(filterStatus === key ? '' : key)}
                  >
                    <Text style={[
                      styles.statusPillText,
                      filterStatus === key && { color: statusColors[key].text }
                    ]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="people-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyTitle}>Aucun client trouvé</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ClientForm')}>
              <Text style={styles.emptyLink}>Ajouter votre premier client</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
    fontSize: 14,
  },
  listContent: {
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  addButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '18%',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderLeftWidth: 3,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 8,
    color: '#6b7280',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  filtersCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 14,
    color: '#111827',
  },
  statusFilters: {
    flexDirection: 'row',
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  statusPillActive: {
    backgroundColor: '#111827',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6b7280',
  },
  statusPillTextActive: {
    color: '#fff',
  },
  clientCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  clientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  clientHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  clientName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  clientDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 11,
    color: '#9ca3af',
  },
  productsRow: {
    flexDirection: 'row',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  productsLabel: {
    fontSize: 11,
    color: '#6b7280',
  },
  productsText: {
    fontSize: 11,
    color: '#111827',
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  emptyLink: {
    marginTop: 8,
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '500',
  },
});

export default ClientsList;

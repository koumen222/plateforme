import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useEcomAuth } from '../../contexts/EcomAuthContext';
import ecomApi from '../../services/ecom/ecomApi';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const ProspectsList = ({ navigation }) => {
  const { user } = useEcomAuth();
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadProspects();
  }, []);

  const loadProspects = async () => {
    try {
      setLoading(true);
      // Note: Cette route n'existe pas encore dans le backend, c'est un exemple
      // const response = await ecomApi.prospects.getAll();
      // setProspects(response.data.data || []);
      
      // Données de démonstration
      setProspects([
        {
          _id: '1',
          name: 'John Doe',
          email: 'john.doe@example.com',
          phone: '+237 6 76 77 83 77',
          source: 'Site web',
          status: 'new',
          createdAt: new Date().toISOString()
        },
        {
          _id: '2',
          name: 'Jane Smith',
          email: 'jane.smith@example.com',
          phone: '+237 6 55 44 33 22',
          source: 'Référence',
          status: 'contacted',
          createdAt: new Date(Date.now() - 86400000).toISOString()
        }
      ]);
    } catch (error) {
      console.error('Erreur chargement prospects:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProspects();
  };

  const getStatusColor = (status) => {
    const colors = {
      new: '#10b981',
      contacted: '#f59e0b',
      converted: '#3b82f6',
      lost: '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  const renderProspect = ({ item }) => (
    <View style={styles.prospectCard}>
      <View style={styles.prospectHeader}>
        <View style={styles.prospectInfo}>
          <Text style={styles.prospectName}>{item.name}</Text>
          <Text style={styles.prospectEmail}>{item.email}</Text>
          <Text style={styles.prospectPhone}>{item.phone}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <View style={styles.prospectDetails}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Source</Text>
          <Text style={styles.detailValue}>{item.source}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Contacté le</Text>
          <Text style={styles.detailValue}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
      
      <View style={styles.prospectActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#10b981' }]}
          onPress={() => Alert.alert('Info', 'Conversion à implémenter')}
        >
          <MaterialIcons name="check-circle" size={16} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#3b82f6' }]}
          onPress={() => Alert.alert('Info', 'Contact à implémenter')}
        >
          <MaterialIcons name="phone" size={16} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#10b981" />
      <Text style={styles.loadingText}>Chargement des prospects...</Text>
    </View>
  );

  if (loading) {
    return renderLoading();
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Prospects</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => Alert.alert('Info', 'Ajout de prospect à implémenter')}
        >
          <MaterialIcons name="add" size={20} color="white" />
          <Text style={styles.addButtonText}>Nouveau</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <MaterialIcons name="person-search" size={24} color="#10b981" />
          <Text style={styles.statValue}>{prospects.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialIcons name="new-releases" size={24} color="#10b981" />
          <Text style={styles.statValue}>
            {prospects.filter(p => p.status === 'new').length}
          </Text>
          <Text style={styles.statLabel}>Nouveaux</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialIcons name="phone" size={24} color="#f59e0b" />
          <Text style={styles.statValue}>
            {prospects.filter(p => p.status === 'contacted').length}
          </Text>
          <Text style={styles.statLabel}>Contactés</Text>
        </View>
      </View>

      <FlatList
        data={prospects}
        renderItem={renderProspect}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="person-search" size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>Aucun prospect trouvé</Text>
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  listContainer: {
    padding: 16,
  },
  prospectCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  prospectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  prospectInfo: {
    flex: 1,
  },
  prospectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  prospectEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  prospectPhone: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  prospectDetails: {
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 12,
    color: '#111827',
  },
  prospectActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
  },
});

export default ProspectsList;

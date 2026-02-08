import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { useEcomAuth } from '../../contexts/EcomAuthContext';
import { useMoney } from '../../contexts/ecom/useMoney';
import ecomApi from '../../services/ecom/ecomApi';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const ReportsList = ({ navigation }) => {
  const { user } = useEcomAuth();
  const { fmt } = useMoney();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const params = {};
      if (dateFilter !== 'all') {
        params.dateFilter = dateFilter;
      }
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      const response = await ecomApi.get('/reports', { params });
      setReports(response.data.data?.reports || []);
    } catch (error) {
      console.error('Erreur chargement rapports:', error);
      Alert.alert('Erreur', 'Impossible de charger les rapports');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadReports();
  };

  const handleDelete = (reportId) => {
    Alert.alert(
      'Supprimer le rapport',
      'Êtes-vous sûr de vouloir supprimer ce rapport ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: async () => {
            try {
              await ecomApi.delete(`/reports/${reportId}`);
              Alert.alert('Succès', 'Rapport supprimé');
              loadReports();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer le rapport');
            }
          }
        }
      ]
    );
  };

  const renderReport = ({ item }) => {
    const deliveryRate = item.ordersReceived > 0 
      ? Math.round((item.ordersDelivered / item.ordersReceived) * 100) 
      : 0;
    
    return (
      <TouchableOpacity
        style={styles.reportCard}
        onPress={() => navigation.navigate('ReportDetail', { reportId: item._id })}
      >
        <View style={styles.reportHeader}>
          <View style={styles.reportInfo}>
            <Text style={styles.reportDate}>
              {new Date(item.date).toLocaleDateString('fr-FR')}
            </Text>
            <Text style={styles.reportId}>ID: {item._id?.slice(-8) || 'N/A'}</Text>
          </View>
          <View style={styles.reportActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#3b82f6' }]}
              onPress={() => navigation.navigate('ReportForm', { reportId: item._id })}
            >
              <MaterialIcons name="edit" size={16} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#ef4444' }]}
              onPress={() => handleDelete(item._id)}
            >
              <MaterialIcons name="delete" size={16} color="white" />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.reportMetrics}>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Reçues</Text>
            <Text style={styles.metricValue}>{item.ordersReceived}</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Livrées</Text>
            <Text style={styles.metricValue}>{item.ordersDelivered}</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Taux</Text>
            <Text style={[
              styles.metricValue,
              { color: deliveryRate >= 80 ? '#10b981' : deliveryRate >= 60 ? '#f59e0b' : '#ef4444' }
            ]}>
              {deliveryRate}%
            </Text>
          </View>
        </View>
        
        {item.notes && (
          <Text style={styles.reportNotes} numberOfLines={2}>
            {item.notes}
          </Text>
        )}
        
        <View style={styles.reportFooter}>
          <Text style={styles.reportTime}>
            {new Date(item.createdAt).toLocaleTimeString('fr-FR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
          <MaterialIcons name="chevron-right" size={20} color="#6b7280" />
        </View>
      </TouchableOpacity>
    );
  };

  const renderFilterButton = () => (
    <TouchableOpacity
      style={styles.filterButton}
      onPress={() => setShowFilters(!showFilters)}
    >
      <MaterialIcons name="filter-list" size={20} color="#6b7280" />
      <Text style={styles.filterButtonText}>Filtres</Text>
    </TouchableOpacity>
  );

  const renderFilters = () => {
    if (!showFilters) return null;
    
    return (
      <View style={styles.filtersContainer}>
        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Période</Text>
          <View style={styles.filterOptions}>
            {[
              { value: 'all', label: 'Tous' },
              { value: 'today', label: "Aujourd'hui" },
              { value: 'week', label: 'Cette semaine' },
              { value: 'month', label: 'Ce mois' }
            ].map((filter) => (
              <TouchableOpacity
                key={filter.value}
                style={[
                  styles.filterOption,
                  dateFilter === filter.value && styles.filterOptionActive
                ]}
                onPress={() => {
                  setDateFilter(filter.value);
                  setShowFilters(false);
                  loadReports();
                }}
              >
                <Text style={[
                  styles.filterOptionText,
                  dateFilter === filter.value && styles.filterOptionTextActive
                ]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#8b5cf6" />
      <Text style={styles.loadingText}>Chargement des rapports...</Text>
    </View>
  );

  if (loading) {
    return renderLoading();
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Rapports</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('ReportForm')}
        >
          <MaterialIcons name="add" size={20} color="white" />
          <Text style={styles.addButtonText}>Nouveau</Text>
        </TouchableOpacity>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInput}>
          <MaterialIcons name="search" size={20} color="#6b7280" />
          <TextInput
            style={styles.searchTextInput}
            placeholder="Rechercher un rapport..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            onSubmitEditing={loadReports}
          />
        </View>
        {renderFilterButton()}
      </View>

      {renderFilters()}

      {/* Reports List */}
      <FlatList
        data={reports}
        renderItem={renderReport}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="bar-chart" size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>Aucun rapport trouvé</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate('ReportForm')}
            >
              <Text style={styles.emptyButtonText}>Créer un rapport</Text>
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
    backgroundColor: '#8b5cf6',
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
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchTextInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  filterButtonText: {
    fontSize: 14,
    color: '#374151',
  },
  filtersContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterSection: {
    marginBottom: 16,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterOptionActive: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  filterOptionText: {
    fontSize: 12,
    color: '#374151',
  },
  filterOptionTextActive: {
    color: '#ffffff',
  },
  listContainer: {
    padding: 16,
  },
  reportCard: {
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
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reportInfo: {
    flex: 1,
  },
  reportDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  reportId: {
    fontSize: 12,
    color: '#6b7280',
  },
  reportActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metric: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    color: '#6b7280',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  reportNotes: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportTime: {
    fontSize: 12,
    color: '#9ca3af',
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
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ReportsList;

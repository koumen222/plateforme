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
import { useMoney } from '../hooks/useMoney';
import { reportsApi, productsApi } from '../services/ecomApi';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const ReportsList = ({ navigation }) => {
  const { user } = useEcomAuth();
  const { fmt } = useMoney();
  const isAdmin = user?.role === 'ecom_admin';
  const [reports, setReports] = useState([]);
  const [financialStats, setFinancialStats] = useState({});
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  const loadReports = async () => {
    try {
      const params = { limit: 50 };
      
      const [reportsRes, statsRes, productsRes] = await Promise.all([
        reportsApi.getReports(params).catch(() => ({ data: { data: { reports: [] } } })),
        reportsApi.getFinancialStats().catch(() => ({ data: { data: {} } })),
        productsApi.getProducts({ isActive: true }).catch(() => ({ data: { data: [] } }))
      ]);
      
      const reportsData = reportsRes.data?.data?.reports || [];
      setReports(Array.isArray(reportsData) ? reportsData : []);
      setFinancialStats(statsRes.data?.data || {});
      setProducts(productsRes.data?.data || []);
    } catch (error) {
      console.error('Erreur chargement rapports:', error);
      setReports([]);
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const deleteReport = async (reportId) => {
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
              await reportsApi.deleteReport(reportId);
              loadReports();
            } catch (error) {
              Alert.alert('Erreur', 'Erreur lors de la suppression');
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    loadReports();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadReports();
  };

  const filteredReports = reports.filter(report => {
    if (filter === 'all') return true;
    if (filter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      return report.date?.startsWith(today);
    }
    if (filter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(report.date) >= weekAgo;
    }
    return true;
  });

  const totals = filteredReports.reduce((acc, r) => ({
    ordersReceived: acc.ordersReceived + (r.ordersReceived || 0),
    ordersDelivered: acc.ordersDelivered + (r.ordersDelivered || 0),
    revenue: acc.revenue + (r.revenue || 0)
  }), { ordersReceived: 0, ordersDelivered: 0, revenue: 0 });

  // Safe financial stats with defaults
  const safeStats = {
    totalCost: financialStats.totalCost || 0,
    totalProductCost: financialStats.totalProductCost || 0,
    totalDeliveryCost: financialStats.totalDeliveryCost || 0,
    totalAdSpend: financialStats.totalAdSpend || 0,
    totalRevenue: financialStats.totalRevenue || 0,
    totalProfit: financialStats.totalProfit || 0
  };

  const renderReport = ({ item }) => (
    <TouchableOpacity
      style={styles.reportCard}
      onPress={() => navigation.navigate('ReportDetail', { reportId: item._id })}
    >
      <View style={styles.reportHeader}>
        <View style={styles.dateContainer}>
          <MaterialIcons name="event" size={16} color="#6b7280" />
          <Text style={styles.reportDate}>
            {new Date(item.date).toLocaleDateString('fr-FR', {
              weekday: 'short',
              day: 'numeric',
              month: 'short'
            })}
          </Text>
        </View>
        <View style={styles.reportActions}>
          {item.user?.name && (
            <Text style={styles.reportAuthor}>{item.user.name}</Text>
          )}
          {isAdmin && (
            <TouchableOpacity onPress={() => deleteReport(item._id)} style={styles.deleteBtn}>
              <MaterialIcons name="delete-outline" size={18} color="#ef4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.ordersReceived || 0}</Text>
          <Text style={styles.statLabel}>Reçues</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.ordersDelivered || 0}</Text>
          <Text style={styles.statLabel}>Livrées</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#10b981' }]}>{fmt(item.revenue)}</Text>
          <Text style={styles.statLabel}>Revenu</Text>
        </View>
      </View>

      {/* Additional stats like web */}
      <View style={styles.extraStats}>
        <View style={styles.extraStatItem}>
          <Text style={styles.extraStatLabel}>Pub</Text>
          <Text style={styles.extraStatValue}>{fmt(item.adSpend)}</Text>
        </View>
        <View style={styles.extraStatItem}>
          <Text style={styles.extraStatLabel}>Retours</Text>
          <Text style={styles.extraStatValue}>{item.ordersReturned || 0}</Text>
        </View>
        <View style={styles.extraStatItem}>
          <Text style={styles.extraStatLabel}>Confirmées</Text>
          <Text style={styles.extraStatValue}>{item.ordersConfirmed || 0}</Text>
        </View>
      </View>

      {item.notes && (
        <Text style={styles.notes} numberOfLines={2}>{item.notes}</Text>
      )}
    </TouchableOpacity>
  );

  const FilterButton = ({ value, label }) => (
    <TouchableOpacity
      style={[styles.filterButton, filter === value && styles.filterButtonActive]}
      onPress={() => setFilter(value)}
    >
      <Text style={[styles.filterButtonText, filter === value && styles.filterButtonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredReports}
        renderItem={renderReport}
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
                <Text style={styles.title}>Rapports</Text>
                <Text style={styles.subtitle}>{reports.length} rapport{reports.length > 1 ? 's' : ''} • {products.length} produit{products.length > 1 ? 's' : ''}</Text>
              </View>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate('ReportForm')}
              >
                <Text style={styles.addButtonText}>+ Rapport</Text>
              </TouchableOpacity>
            </View>

            {/* Products Summary */}
            <View style={styles.productsSummary}>
              <Text style={styles.productsTitle}>Produits actifs</Text>
              <View style={styles.productsGrid}>
                {products.slice(0, 4).map(product => (
                  <View key={product._id} style={styles.productChip}>
                    <Text style={styles.productName}>{product.name}</Text>
                  </View>
                ))}
                {products.length > 4 && (
                  <View style={styles.productChip}>
                    <Text style={styles.productName}>+{products.length - 4}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Financial Stats - like web */}
            <View style={styles.financialGrid}>
              <View style={[styles.financialCard, { borderLeftColor: '#ef4444' }]}>
                <Text style={styles.financialLabel}>COÛTS TOTAUX</Text>
                <Text style={[styles.financialValue, { color: '#ef4444' }]}>{fmt(safeStats.totalCost)}</Text>
                <Text style={styles.financialDetail}>
                  Produits: {fmt(safeStats.totalProductCost)} · Livraison: {fmt(safeStats.totalDeliveryCost)}
                </Text>
              </View>
              <View style={[styles.financialCard, { borderLeftColor: '#f97316' }]}>
                <Text style={styles.financialLabel}>DÉPENSES PUB</Text>
                <Text style={[styles.financialValue, { color: '#f97316' }]}>{fmt(safeStats.totalAdSpend)}</Text>
              </View>
              <View style={[styles.financialCard, { borderLeftColor: '#3b82f6' }]}>
                <Text style={styles.financialLabel}>REVENU</Text>
                <Text style={[styles.financialValue, { color: '#3b82f6' }]}>{fmt(safeStats.totalRevenue)}</Text>
              </View>
              <View style={[styles.financialCard, { borderLeftColor: safeStats.totalProfit >= 0 ? '#10b981' : '#ef4444' }]}>
                <Text style={styles.financialLabel}>BÉNÉFICE</Text>
                <Text style={[styles.financialValue, { color: safeStats.totalProfit >= 0 ? '#10b981' : '#ef4444' }]}>
                  {fmt(safeStats.totalProfit)}
                </Text>
              </View>
            </View>

            {/* Summary from reports */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Résumé des rapports</Text>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{totals.ordersReceived}</Text>
                  <Text style={styles.summaryLabel}>Reçues</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{totals.ordersDelivered}</Text>
                  <Text style={styles.summaryLabel}>Livrées</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryValue, { color: '#10b981' }]}>{fmt(totals.revenue)}</Text>
                  <Text style={styles.summaryLabel}>Revenu</Text>
                </View>
              </View>
            </View>

            {/* Filters */}
            <View style={styles.filtersRow}>
              <FilterButton value="all" label="Tous" />
              <FilterButton value="today" label="Aujourd'hui" />
              <FilterButton value="week" label="7 jours" />
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="assessment" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>Aucun rapport trouvé</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ReportForm')}>
              <Text style={styles.emptyLink}>Créer votre premier rapport</Text>
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
    backgroundColor: '#16a34a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  productsSummary: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  productsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  productChip: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  productName: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
  },
  financialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  financialCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
  },
  financialLabel: {
    fontSize: 9,
    fontWeight: '500',
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  financialValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  financialDetail: {
    fontSize: 9,
    color: '#9ca3af',
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e5e7eb',
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  filterButtonText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  reportCard: {
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
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reportDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    textTransform: 'capitalize',
  },
  reportActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reportAuthor: {
    fontSize: 12,
    color: '#6b7280',
  },
  deleteBtn: {
    padding: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 2,
  },
  extraStats: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  extraStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  extraStatLabel: {
    fontSize: 9,
    color: '#9ca3af',
    textTransform: 'uppercase',
  },
  extraStatValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginTop: 2,
  },
  notes: {
    marginTop: 10,
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  emptyLink: {
    marginTop: 8,
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '500',
  },
});

export default ReportsList;

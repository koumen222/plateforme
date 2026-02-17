import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useEcomAuth } from '../hooks/useEcomAuth';
import { useMoney } from '../hooks/useMoney';
import { productsApi, reportsApi, stockApi } from '../services/ecomApi';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AppHeader from '../components/AppHeader';

const AdminDashboard = ({ navigation }) => {
  const { user, workspace } = useEcomAuth();
  const { fmt } = useMoney();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    products: [],
    stockAlerts: {},
    financialStats: {}
  });

  const loadData = async () => {
    try {
      const [productsRes, alertsRes, financialRes] = await Promise.all([
        productsApi.getProducts({ isActive: true }).catch(() => ({ data: { data: [] } })),
        stockApi.getStockAlerts().catch(() => ({ data: { data: {} } })),
        reportsApi.getFinancialStats().catch(() => ({ data: { data: {} } }))
      ]);

      setStats({
        products: productsRes.data?.data || [],
        stockAlerts: alertsRes.data?.data || {},
        financialStats: financialRes.data?.data || {}
      });
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Calculate product margin like web
  const calculateProductMargin = (product) => {
    const sellingPrice = product.sellingPrice || 0;
    const productCost = product.productCost || 0;
    const deliveryCost = product.deliveryCost || 0;
    const avgAdsCost = product.avgAdsCost || 0;
    return sellingPrice - productCost - deliveryCost - avgAdsCost;
  };

  const getStatusColor = (status) => {
    const colors = {
      test: { bg: '#fef3c7', text: '#92400e' },
      stable: { bg: '#dbeafe', text: '#1e40af' },
      winner: { bg: '#d1fae5', text: '#065f46' },
      pause: { bg: '#ffedd5', text: '#9a3412' },
      stop: { bg: '#fee2e2', text: '#991b1b' }
    };
    return colors[status] || { bg: '#f3f4f6', text: '#6b7280' };
  };

  const getStockColor = (product) => {
    if (product.stock === 0) return { bg: '#fee2e2', border: '#fca5a5', text: '#dc2626' };
    if (product.stock <= product.reorderThreshold) return { bg: '#fef3c7', border: '#fcd34d', text: '#d97706' };
    return { bg: '#d1fae5', border: '#6ee7b7', text: '#059669' };
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const products = Array.isArray(stats.products) ? stats.products : [];
  const lowStockCount = stats.stockAlerts?.lowStockCount || 0;
  const lowStockProducts = stats.stockAlerts?.lowStockProducts || [];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Chargement du dashboard...</Text>
      </View>
    );
  }

  const { width } = Dimensions.get('window');

  return (
    <View style={styles.container}>
      {/* App Header */}
      <AppHeader navigation={navigation} notificationCount={lowStockCount} />

      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
        }
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Message */}
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>Bonjour, {user?.name?.split(' ')[0] || 'Admin'} 👋</Text>
          <Text style={styles.welcomeSubtitle}>Voici votre aperçu du jour</Text>
          <View style={styles.dateBadge}>
            <Text style={styles.dateText}>{new Date().toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}</Text>
          </View>
        </View>

        {/* Main Dashboard Card */}
        <View style={styles.mainDashboardCard}>
          <View style={styles.dashboardHeader}>
            <Text style={styles.dashboardTitle}>Tableau de Bord</Text>
          </View>
          
         
          
          <View style={styles.financialSummary}>
            <View style={styles.financialRow}>
              <Text style={styles.financialLabel}>Chiffre d'affaires</Text>
              <Text style={[styles.financialValue, { color: '#3b82f6' }]}>{fmt(stats.financialStats?.totalRevenue || 0)}</Text>
            </View>
            <View style={styles.financialRow}>
              <Text style={styles.financialLabel}>Coûts totaux</Text>
              <Text style={[styles.financialValue, { color: '#ef4444' }]}>{fmt(stats.financialStats?.totalCost || 0)}</Text>
            </View>
            <View style={[styles.financialRow, styles.financialHighlight]}>
              <Text style={styles.financialLabelBold}>Bénéfice net</Text>
              <Text style={[styles.financialValueBold, { color: (stats.financialStats?.totalProfit || 0) >= 0 ? '#10b981' : '#ef4444' }]}>
                {fmt(stats.financialStats?.totalProfit || 0)}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions Rapides</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity style={styles.quickActionBtn} onPress={() => navigation.navigate('ProductForm')}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#dbeafe' }]}>
                <MaterialIcons name="add-shopping-cart" size={24} color="#1e40af" />
              </View>
              <Text style={styles.quickActionText}>Ajouter Produit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionBtn} onPress={() => navigation.navigate('ReportForm')}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#dcfce7' }]}>
                <MaterialIcons name="assessment" size={24} color="#166534" />
              </View>
              <Text style={styles.quickActionText}>Nouveau Rapport</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionBtn} onPress={() => navigation.navigate('Stock')}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#fef3c7' }]}>
                <MaterialIcons name="inventory" size={24} color="#92400e" />
              </View>
              <Text style={styles.quickActionText}>Gérer Stock</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionBtn} onPress={() => navigation.navigate('TransactionForm')}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#fce7f3' }]}>
                <MaterialIcons name="account-balance-wallet" size={24} color="#9f1239" />
              </View>
              <Text style={styles.quickActionText}>Transaction</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Produits Récents</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Products')}>
              <Text style={styles.sectionLink}>Voir tous</Text>
            </TouchableOpacity>
          </View>
          
          {products.slice(0, 3).map((product) => {
            const margin = calculateProductMargin(product);
            const stockColor = getStockColor(product);
            return (
              <TouchableOpacity key={product._id} style={styles.productCard} onPress={() => navigation.navigate('ProductDetail', { productId: product._id })}>
                <View style={styles.productLeft}>
                  <View style={[styles.productStockIndicator, { backgroundColor: stockColor.bg }]}>
                    <Text style={[styles.productStockText, { color: stockColor.text }]}>{product.stock}</Text>
                  </View>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.productMeta}>
                      Marge: <Text style={{ color: margin >= 0 ? '#10b981' : '#ef4444', fontWeight: '600' }}>{fmt(margin)}</Text>
                    </Text>
                  </View>
                </View>
                <View style={styles.productRight}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(product.status).bg }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(product.status).text }]}>{product.status}</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color="#9ca3af" />
                </View>
              </TouchableOpacity>
            );
          })}
          
          {products.length === 0 && (
            <View style={styles.emptyState}>
              <MaterialIcons name="inventory-2" size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>Aucun produit actif</Text>
              <TouchableOpacity style={styles.emptyButton} onPress={() => navigation.navigate('ProductForm')}>
                <Text style={styles.emptyButtonText}>Ajouter un produit</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 14,
  },
  
  // Welcome Card
  welcomeCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
  },
  
  // Main Dashboard Card
  mainDashboardCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  dashboardHeader: {
    marginBottom: 8,
  },
  dashboardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
  },
  keyMetricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  financialSummary: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
  },
  financialHighlight: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
    marginTop: 8,
  },
  financialLabelBold: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  financialValueBold: {
    fontSize: 16,
    fontWeight: '700',
  },
  dateBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  
  // Section
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    letterSpacing: 0.3,
  },
  sectionLink: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
  },
  
  // Quick Actions
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionBtn: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
  },
  
  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statTrend: {
    padding: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  
  // Financial Card
  financialCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  financialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  financialTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  financialItem: {
    flex: 1,
  },
  financialLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  financialValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  
  // Product Cards
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  productLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  productStockIndicator: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productStockText: {
    fontSize: 14,
    fontWeight: '600',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  productMeta: {
    fontSize: 12,
    color: '#64748b',
  },
  productRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 12,
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default AdminDashboard;

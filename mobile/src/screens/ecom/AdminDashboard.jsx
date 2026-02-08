import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useEcomAuth } from '../../contexts/EcomAuthContext';
import { useMoney } from '../../contexts/ecom/useMoney';
import ecomApi from '../../services/ecom/ecomApi';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const AdminDashboard = ({ navigation }) => {
  const { user } = useEcomAuth();
  const { fmt } = useMoney();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    products: [],
    stockAlerts: [],
    financialStats: {},
    decisions: []
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log('📊 Chargement des données du dashboard admin...');
      
      // Charger les données en parallèle
      const [productsRes, alertsRes, financialRes, decisionsRes] = await Promise.all([
        ecomApi.get('/products?isActive=true'),
        ecomApi.get('/stock/alerts'),
        ecomApi.get('/reports/stats/financial'),
        ecomApi.get('/decisions/dashboard/overview')
      ]);

      const financialData = financialRes.data?.data || {};

      setStats({
        products: productsRes.data?.data || [],
        stockAlerts: alertsRes.data?.data || [],
        financialStats: financialData,
        decisions: decisionsRes.data?.data || {}
      });

      console.log('✅ Dashboard chargé avec succès');
    } catch (error) {
      console.error('❌ Erreur chargement dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const formatPercent = (value) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getStatusColor = (status) => {
    const colors = {
      test: '#fef3c7', // yellow-100
      stable: '#dbeafe', // blue-100
      winner: '#d1fae5', // green-100
      pause: '#fed7aa', // orange-100
      stop: '#fee2e2' // red-100
    };
    return colors[status] || '#f3f4f6';
  };

  const getStatusTextColor = (status) => {
    const colors = {
      test: '#92400e', // yellow-800
      stable: '#1e40af', // blue-800
      winner: '#065f46', // green-800
      pause: '#9a3412', // orange-800
      stop: '#991b1b' // red-800
    };
    return colors[status] || '#374151';
  };

  const calculateProductMargin = (product) => {
    const sellingPrice = product.sellingPrice || 0;
    const productCost = product.productCost || 0;
    const deliveryCost = product.deliveryCost || 0;
    const avgAdsCost = product.avgAdsCost || 0;
    const totalCost = productCost + deliveryCost + avgAdsCost;
    return sellingPrice - totalCost;
  };

  const getUrgencyColor = (urgency) => {
    const colors = {
      critical: '#ef4444',
      high: '#f97316',
      medium: '#eab308'
    };
    return colors[urgency] || '#6b7280';
  };

  const StatCard = ({ title, value, subtitle, icon, color, onPress }) => (
    <TouchableOpacity style={styles.statCard} onPress={onPress}>
      <View style={[styles.statIcon, { backgroundColor: color }]}>
        <MaterialIcons name={icon} size={24} color="white" />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
        {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
      </View>
    </TouchableOpacity>
  );

  const ProductCard = ({ product }) => {
    const margin = calculateProductMargin(product);
    const marginPercent = product.sellingPrice ? (margin / product.sellingPrice) * 100 : 0;
    
    return (
      <View style={styles.productCard}>
        <View style={styles.productHeader}>
          <Text style={styles.productName}>{product.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(product.status) }]}>
            <Text style={[styles.statusText, { color: getStatusTextColor(product.status) }]}>
              {product.status}
            </Text>
          </View>
        </View>
        
        <View style={styles.productMetrics}>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Prix vente</Text>
            <Text style={styles.metricValue}>{fmt(product.sellingPrice)}</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Marge</Text>
            <Text style={[
              styles.metricValue,
              { color: margin >= 0 ? '#10b981' : '#ef4444' }
            ]}>
              {fmt(margin)} ({marginPercent.toFixed(1)}%)
            </Text>
          </View>
        </View>
        
        <View style={styles.productFooter}>
          <Text style={styles.productStock}>
            Stock: {product.stock || 0} unités
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('ProductDetail', { productId: product._id })}>
            <MaterialIcons name="chevron-right" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const AlertCard = ({ alert }) => (
    <View style={styles.alertCard}>
      <View style={[styles.alertIndicator, { backgroundColor: getUrgencyColor(alert.urgency) }]}>
        <MaterialIcons name="warning" size={16} color="white" />
      </View>
      <View style={styles.alertContent}>
        <Text style={styles.alertTitle}>{alert.productName}</Text>
        <Text style={styles.alertMessage}>{alert.message}</Text>
        <Text style={styles.alertUrgency}>Urgence: {alert.urgency}</Text>
      </View>
    </View>
  );

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#3b82f6" />
      <Text style={styles.loadingText}>Chargement du dashboard...</Text>
    </View>
  );

  if (loading) {
    return renderLoading();
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard Admin</Text>
        <Text style={styles.headerSubtitle}>
          Bienvenue, {user?.email}
        </Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsGrid}>
        <StatCard
          title="Produits actifs"
          value={stats.products.length}
          icon="inventory-2"
          color="#3b82f6"
          onPress={() => navigation.navigate('ProductsList')}
        />
        <StatCard
          title="Alertes stock"
          value={stats.stockAlerts.length}
          subtitle={stats.stockAlerts.filter(a => a.urgency === 'critical').length + ' critiques'}
          icon="warning"
          color="#ef4444"
          onPress={() => navigation.navigate('StockOrdersList')}
        />
        <StatCard
          title="Revenu total"
          value={fmt(stats.financialStats.totalRevenue || 0)}
          subtitle={stats.financialStats.ordersCount || 0 + ' commandes'}
          icon="account-balance-wallet"
          color="#10b981"
          onPress={() => navigation.navigate('TransactionsList')}
        />
        <StatCard
          title="Décisions"
          value={stats.decisions.pending || 0}
          subtitle="en attente"
          icon="lightbulb"
          color="#f59e0b"
          onPress={() => navigation.navigate('DecisionsList')}
        />
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions rapides</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickActionButton, { backgroundColor: '#3b82f6' }]}
            onPress={() => navigation.navigate('ProductForm')}
          >
            <MaterialIcons name="add" size={20} color="white" />
            <Text style={styles.quickActionText}>Nouveau produit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickActionButton, { backgroundColor: '#10b981' }]}
            onPress={() => navigation.navigate('OrderForm')}
          >
            <MaterialIcons name="shopping-cart" size={20} color="white" />
            <Text style={styles.quickActionText}>Nouvelle commande</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickActionButton, { backgroundColor: '#f59e0b' }]}
            onPress={() => navigation.navigate('ReportForm')}
          >
            <MaterialIcons name="bar-chart" size={20} color="white" />
            <Text style={styles.quickActionText}>Nouveau rapport</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Products */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Produits récents</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ProductsList')}>
            <Text style={styles.seeAllText}>Voir tout</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.productsList}>
          {stats.products.slice(0, 3).map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </View>
      </View>

      {/* Stock Alerts */}
      {stats.stockAlerts.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Alertes stock</Text>
            <TouchableOpacity onPress={() => navigation.navigate('StockOrdersList')}>
              <Text style={styles.seeAllText}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.alertsList}>
            {stats.stockAlerts.slice(0, 3).map((alert, index) => (
              <AlertCard key={index} alert={alert} />
            ))}
          </View>
        </View>
      )}
    </ScrollView>
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
    padding: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  statTitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  statSubtitle: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 16,
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
    fontWeight: '600',
    color: '#111827',
  },
  seeAllText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  quickActionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  productsList: {
    gap: 12,
  },
  productCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  productMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metric: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productStock: {
    fontSize: 12,
    color: '#6b7280',
  },
  alertsList: {
    gap: 8,
  },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  alertIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  alertMessage: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  alertUrgency: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 2,
  },
});

export default AdminDashboard;

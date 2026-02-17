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

const ComptaDashboard = ({ navigation }) => {
  const { user } = useEcomAuth();
  const { fmt } = useMoney();
  const [financialStats, setFinancialStats] = useState({});
  const [productStats, setProductStats] = useState([]);
  const [txSummary, setTxSummary] = useState({});
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [loadingStats, setLoadingStats] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadFinancialData();
  }, [dateRange]);

  const loadFinancialData = async () => {
    try {
      setLoadingStats(true);
      
      const [statsRes, productsRes, txSummaryRes, txListRes] = await Promise.all([
        ecomApi.get('/reports/stats/financial', { params: dateRange }).catch(() => ({ data: { data: {} } })),
        ecomApi.get('/products/stats/overview').catch(() => ({ data: { data: { byStatus: [] } } })),
        ecomApi.get('/transactions/summary', { params: { startDate: dateRange.startDate, endDate: dateRange.endDate } }).catch(() => ({ data: { data: {} } })),
        ecomApi.get('/transactions', { params: { startDate: dateRange.startDate, endDate: dateRange.endDate, limit: 5 } }).catch(() => ({ data: { data: { transactions: [] } } }))
      ]);

      setFinancialStats(statsRes.data.data || {});
      setProductStats(productsRes.data.data?.byStatus || []);
      setTxSummary(txSummaryRes.data.data || {});
      setRecentTransactions(txListRes.data.data?.transactions || []);
    } catch (error) {
      console.error('Erreur chargement données financières:', error);
    } finally {
      setLoadingStats(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadFinancialData();
  };

  const formatPercent = (value) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getProfitColor = (value) => {
    return value >= 0 ? '#10b981' : '#ef4444';
  };

  const getROASColor = (value) => {
    if (value >= 3) return '#10b981';
    if (value >= 2) return '#eab308';
    return '#ef4444';
  };

  const getTransactionTypeColor = (type) => {
    const colors = {
      income: '#10b981',
      expense: '#ef4444',
      refund: '#f59e0b'
    };
    return colors[type] || '#6b7280';
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

  const TransactionCard = ({ transaction }) => (
    <View style={styles.transactionCard}>
      <View style={[styles.transactionIndicator, { backgroundColor: getTransactionTypeColor(transaction.type) }]}>
        <MaterialIcons 
          name={transaction.type === 'income' ? 'arrow-downward' : transaction.type === 'expense' ? 'arrow-upward' : 'swap-horiz'} 
          size={16} 
          color="white" 
        />
      </View>
      <View style={styles.transactionContent}>
        <Text style={styles.transactionTitle}>{transaction.description}</Text>
        <Text style={styles.transactionDate}>
          {new Date(transaction.date).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.transactionAmount}>
        <Text style={[
          styles.transactionValue,
          { color: getTransactionTypeColor(transaction.type) }
        ]}>
          {transaction.type === 'income' ? '+' : '-'}{fmt(transaction.amount)}
        </Text>
        <Text style={styles.transactionType}>{transaction.type}</Text>
      </View>
    </View>
  );

  const ProductStatCard = ({ stat }) => (
    <View style={styles.productStatCard}>
      <Text style={styles.productStatName}>{stat.name}</Text>
      <View style={styles.productStatMetrics}>
        <View style={styles.productStatMetric}>
          <Text style={styles.productStatLabel}>Revenu</Text>
          <Text style={styles.productStatValue}>{fmt(stat.totalRevenue)}</Text>
        </View>
        <View style={styles.productStatMetric}>
          <Text style={styles.productStatLabel}>Ventes</Text>
          <Text style={styles.productStatValue}>{stat.totalSales}</Text>
        </View>
        <View style={styles.productStatMetric}>
          <Text style={styles.productStatLabel}>Marge</Text>
          <Text style={[
            styles.productStatValue,
            { color: getProfitColor(stat.totalProfit) }
          ]}>
            {fmt(stat.totalProfit)}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#10b981" />
      <Text style={styles.loadingText}>Chargement du dashboard...</Text>
    </View>
  );

  if (loadingStats && !financialStats.totalRevenue && !txSummary.totalIncome) {
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
        <Text style={styles.headerTitle}>Dashboard Comptabilité</Text>
        <Text style={styles.headerSubtitle}>
          Période: {dateRange.startDate} - {dateRange.endDate}
        </Text>
      </View>

      {/* Financial Overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Aperçu financier</Text>
        <View style={styles.statsGrid}>
          <StatCard
            title="Revenu total"
            value={fmt(financialStats.totalRevenue || 0)}
            subtitle={txSummary.totalIncome || 0 + ' entrées'}
            icon="account-balance-wallet"
            color="#10b981"
            onPress={() => navigation.navigate('TransactionsList')}
          />
          <StatCard
            title="Dépenses"
            value={fmt(financialStats.totalExpenses || 0)}
            subtitle={txSummary.totalExpenses || 0 + ' sorties'}
            icon="money-off"
            color="#ef4444"
            onPress={() => navigation.navigate('TransactionsList')}
          />
          <StatCard
            title="Bénéfice net"
            value={fmt(financialStats.netProfit || 0)}
            subtitle={formatPercent(financialStats.profitMargin || 0)}
            icon="trending-up"
            color={financialStats.netProfit >= 0 ? '#10b981' : '#ef4444'}
          />
          <StatCard
            title="ROAS moyen"
            value={formatPercent(financialStats.avgROAS || 0)}
            subtitle="Retour sur investissement"
            icon="analytics"
            color="#8b5cf6"
          />
        </View>
      </View>

      {/* Date Range Selector */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Période d'analyse</Text>
        <View style={styles.dateRangeContainer}>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => {
              // TODO: Implement date picker
              Alert.alert('Info', 'Sélecteur de date à implémenter');
            }}
          >
            <MaterialIcons name="calendar-today" size={20} color="#6b7280" />
            <Text style={styles.dateButtonText}>Derniers 30 jours</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Product Performance */}
      {productStats.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Performance produits</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ProductsList')}>
              <Text style={styles.seeAllText}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.productStatsList}>
            {productStats.slice(0, 3).map((stat, index) => (
              <ProductStatCard key={index} stat={stat} />
            ))}
          </View>
        </View>
      )}

      {/* Recent Transactions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Transactions récentes</Text>
          <TouchableOpacity onPress={() => navigation.navigate('TransactionsList')}>
            <Text style={styles.seeAllText}>Voir tout</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.transactionsList}>
          {recentTransactions.slice(0, 5).map((transaction, index) => (
            <TransactionCard key={index} transaction={transaction} />
          ))}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions rapides</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickActionButton, { backgroundColor: '#10b981' }]}
            onPress={() => navigation.navigate('TransactionForm')}
          >
            <MaterialIcons name="add" size={20} color="white" />
            <Text style={styles.quickActionText}>Nouvelle transaction</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickActionButton, { backgroundColor: '#8b5cf6' }]}
            onPress={() => navigation.navigate('Data')}
          >
            <MaterialIcons name="assessment" size={20} color="white" />
            <Text style={styles.quickActionText}>Rapport détaillé</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickActionButton, { backgroundColor: '#f59e0b' }]}
            onPress={() => navigation.navigate('ReportsList')}
          >
            <MaterialIcons name="bar-chart" size={20} color="white" />
            <Text style={styles.quickActionText}>Voir les rapports</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Summary Cards */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Résumé mensuel</Text>
        <View style={styles.summaryCards}>
          <View style={styles.summaryCard}>
            <MaterialIcons name="trending-up" size={20} color="#10b981" />
            <Text style={styles.summaryTitle}>Croissance</Text>
            <Text style={[styles.summaryValue, { color: '#10b981' }]}>
              {formatPercent(financialStats.growthRate || 0)}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <MaterialIcons name="people" size={20} color="#8b5cf6" />
            <Text style={styles.summaryTitle}>Clients actifs</Text>
            <Text style={styles.summaryValue}>
              {financialStats.activeCustomers || 0}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <MaterialIcons name="shopping-cart" size={20} color="#f59e0b" />
            <Text style={styles.summaryTitle}>Panier moyen</Text>
            <Text style={styles.summaryValue}>
              {fmt(financialStats.avgOrderValue || 0)}
            </Text>
          </View>
        </View>
      </View>
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
    color: '#10b981',
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
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
    fontSize: 18,
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
  dateRangeContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  dateButtonText: {
    fontSize: 14,
    color: '#374151',
  },
  productStatsList: {
    gap: 12,
  },
  productStatCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  productStatName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  productStatMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  productStatMetric: {
    alignItems: 'center',
  },
  productStatLabel: {
    fontSize: 10,
    color: '#6b7280',
  },
  productStatValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  transactionsList: {
    gap: 8,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionContent: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  transactionDate: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  transactionType: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 2,
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
  summaryCards: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
});

export default ComptaDashboard;

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useEcomAuth } from '../hooks/useEcomAuth';
import { useMoney } from '../hooks/useMoney';
import { reportsApi, transactionsApi } from '../services/ecomApi';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AppHeader from '../components/AppHeader';

const ComptaDashboard = ({ navigation }) => {
  const { user } = useEcomAuth();
  const { fmt } = useMoney();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    pendingTransactions: 0,
    monthlyRevenue: 0,
    monthlyExpenses: 0
  });

  const loadData = async () => {
    try {
      const [transactionsRes, summaryRes] = await Promise.all([
        transactionsApi.getTransactions({ limit: 100 }).catch(() => ({ data: { data: { transactions: [] } } })),
        transactionsApi.getSummary().catch(() => ({ data: { data: {} } }))
      ]);

      // Transactions: { success: true, data: { transactions, pagination } }
      const transactions = transactionsRes.data?.data?.transactions || [];
      const txArray = Array.isArray(transactions) ? transactions : [];
      
      // Summary from backend if available
      const summary = summaryRes.data?.data || {};
      
      // Calculate from transactions if no summary
      const income = txArray.filter(t => t.type === 'income');
      const expenses = txArray.filter(t => t.type === 'expense');
      const pending = txArray.filter(t => t.status === 'pending');

      const totalRevenue = summary.totalIncome || income.reduce((sum, t) => sum + (t.amount || 0), 0);
      const totalExpenses = summary.totalExpense || expenses.reduce((sum, t) => sum + (t.amount || 0), 0);

      setStats({
        totalRevenue,
        totalExpenses,
        netProfit: totalRevenue - totalExpenses,
        pendingTransactions: pending.length,
        monthlyRevenue: totalRevenue,
        monthlyExpenses: totalExpenses
      });
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const StatCard = ({ icon, title, value, color, subtitle }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <MaterialIcons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* App Header */}
      <AppHeader navigation={navigation} notificationCount={stats.pendingTransactions || 0} />

      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
        }
      >
        {/* Page Header */}
        <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour, {user?.name?.split(' ')[0] || 'Comptable'} 📊</Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </Text>
        </View>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>Comptabilité</Text>
        </View>
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Bilan du mois</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Revenus</Text>
            <Text style={[styles.summaryValue, { color: '#10b981' }]}>
              +{fmt(stats.monthlyRevenue)}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Dépenses</Text>
            <Text style={[styles.summaryValue, { color: '#ef4444' }]}>
              -{fmt(stats.monthlyExpenses)}
            </Text>
          </View>
        </View>
        <View style={styles.netProfitRow}>
          <Text style={styles.netProfitLabel}>Bénéfice net</Text>
          <Text style={[
            styles.netProfitValue,
            { color: stats.monthlyRevenue - stats.monthlyExpenses >= 0 ? '#10b981' : '#ef4444' }
          ]}>
            {fmt(stats.monthlyRevenue - stats.monthlyExpenses)}
          </Text>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard
          icon="trending-up"
          title="Revenus totaux"
          value={fmt(stats.totalRevenue)}
          color="#10b981"
        />
        <StatCard
          icon="trending-down"
          title="Dépenses totales"
          value={fmt(stats.totalExpenses)}
          color="#ef4444"
        />
        <StatCard
          icon="account-balance"
          title="Bénéfice net"
          value={fmt(stats.netProfit)}
          color={stats.netProfit >= 0 ? '#10b981' : '#ef4444'}
        />
        <StatCard
          icon="pending-actions"
          title="En attente"
          value={stats.pendingTransactions}
          color="#f59e0b"
        />
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Transactions')}
        >
          <MaterialIcons name="receipt-long" size={22} color="#10b981" />
          <Text style={styles.actionButtonText}>Gérer les transactions</Text>
          <MaterialIcons name="chevron-right" size={20} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Reports')}
        >
          <MaterialIcons name="assessment" size={22} color="#3b82f6" />
          <Text style={styles.actionButtonText}>Consulter les rapports</Text>
          <MaterialIcons name="chevron-right" size={20} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Data')}
        >
          <MaterialIcons name="analytics" size={22} color="#8b5cf6" />
          <Text style={styles.actionButtonText}>Données & Statistiques</Text>
          <MaterialIcons name="chevron-right" size={20} color="#9ca3af" />
        </TouchableOpacity>
      </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
  },
  date: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  roleBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roleBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e5e7eb',
  },
  netProfitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  netProfitLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  netProfitValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  statTitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  statSubtitle: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    gap: 12,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
});

export default ComptaDashboard;

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';
import { useEcomAuth } from '../hooks/useEcomAuth';
import { useMoney } from '../hooks/useMoney';
import { reportsApi, ordersApi, clientsApi } from '../services/ecomApi';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AppHeader from '../components/AppHeader';

const CloseuseDashboard = ({ navigation }) => {
  const { user } = useEcomAuth();
  const { fmt } = useMoney();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    todayOrders: 0,
    todayRevenue: 0,
    pendingOrders: 0,
    totalClients: 0
  });
  const [quickReport, setQuickReport] = useState({
    ordersReceived: '',
    ordersDelivered: '',
    revenue: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [ordersRes, clientsRes] = await Promise.all([
        ordersApi.getOrders({ limit: 100 }).catch(() => ({ data: { data: { orders: [], stats: {} } } })),
        clientsApi.getClients({ limit: 1 }).catch(() => ({ data: { data: { clients: [], stats: {} } } }))
      ]);

      // Orders: { success: true, data: { orders, stats, pagination } }
      const ordersStats = ordersRes.data?.data?.stats || {};
      
      // Clients: { success: true, data: { clients, stats, pagination } }
      const clientsStats = clientsRes.data?.data?.stats || {};

      setStats({
        todayOrders: ordersStats.pending || 0,
        todayRevenue: ordersStats.totalRevenue || 0,
        pendingOrders: ordersStats.pending || 0,
        totalClients: clientsStats.total || 0,
        delivered: ordersStats.delivered || 0,
        confirmed: ordersStats.confirmed || 0
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

  const handleQuickReport = async () => {
    if (!quickReport.ordersReceived || !quickReport.ordersDelivered) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setSubmitting(true);
    try {
      await reportsApi.createReport({
        date: new Date().toISOString().split('T')[0],
        ordersReceived: parseInt(quickReport.ordersReceived),
        ordersDelivered: parseInt(quickReport.ordersDelivered),
        revenue: parseFloat(quickReport.revenue) || 0
      });
      
      Alert.alert('Succès', 'Rapport envoyé !');
      setQuickReport({ ordersReceived: '', ordersDelivered: '', revenue: '' });
      loadData();
    } catch (error) {
      Alert.alert('Erreur', error.response?.data?.message || 'Erreur lors de l\'envoi');
    } finally {
      setSubmitting(false);
    }
  };

  const StatCard = ({ icon, title, value, color }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <MaterialIcons name={icon} size={24} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ec4899" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* App Header */}
      <AppHeader navigation={navigation} notificationCount={stats.pendingOrders || 0} />

      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ec4899" />
        }
      >
        {/* Page Header */}
        <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour, {user?.name?.split(' ')[0] || 'Closeuse'} 💖</Text>
          <Text style={styles.date}>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
        </View>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>Closeuse</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsGrid}>
        <StatCard
          icon="shopping-cart"
          title="Commandes aujourd'hui"
          value={stats.todayOrders}
          color="#ec4899"
        />
        <StatCard
          icon="attach-money"
          title="Revenu aujourd'hui"
          value={fmt(stats.todayRevenue)}
          color="#10b981"
        />
        <StatCard
          icon="pending"
          title="En attente"
          value={stats.pendingOrders}
          color="#f59e0b"
        />
        <StatCard
          icon="people"
          title="Clients"
          value={stats.totalClients}
          color="#3b82f6"
        />
      </View>

      {/* Quick Report */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📝 Rapport rapide</Text>
        <View style={styles.reportCard}>
          <View style={styles.reportRow}>
            <View style={styles.reportInput}>
              <Text style={styles.inputLabel}>Commandes reçues</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
                value={quickReport.ordersReceived}
                onChangeText={(t) => setQuickReport({ ...quickReport, ordersReceived: t })}
              />
            </View>
            <View style={styles.reportInput}>
              <Text style={styles.inputLabel}>Livrées</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
                value={quickReport.ordersDelivered}
                onChangeText={(t) => setQuickReport({ ...quickReport, ordersDelivered: t })}
              />
            </View>
          </View>
          <View style={styles.reportInput}>
            <Text style={styles.inputLabel}>Revenu (FCFA)</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              value={quickReport.revenue}
              onChangeText={(t) => setQuickReport({ ...quickReport, revenue: t })}
            />
          </View>
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleQuickReport}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Envoyer le rapport</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions rapides</Text>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Orders')}
        >
          <MaterialIcons name="list-alt" size={22} color="#ec4899" />
          <Text style={styles.actionButtonText}>Voir les commandes</Text>
          <MaterialIcons name="chevron-right" size={20} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Clients')}
        >
          <MaterialIcons name="person-add" size={22} color="#3b82f6" />
          <Text style={styles.actionButtonText}>Gérer les clients</Text>
          <MaterialIcons name="chevron-right" size={20} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Reports')}
        >
          <MaterialIcons name="assessment" size={22} color="#10b981" />
          <Text style={styles.actionButtonText}>Mes rapports</Text>
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
    backgroundColor: '#ec4899',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roleBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    alignItems: 'flex-start',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
  },
  statTitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
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
  reportCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  reportRow: {
    flexDirection: 'row',
    gap: 12,
  },
  reportInput: {
    flex: 1,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
  },
  submitButton: {
    backgroundColor: '#ec4899',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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

export default CloseuseDashboard;

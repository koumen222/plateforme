import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useEcomAuth } from '../../contexts/EcomAuthContext';
import ecomApi from '../../services/ecom/ecomApi';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const CloseuseDashboard = ({ navigation }) => {
  const { user } = useEcomAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState([]);
  const [todayReports, setTodayReports] = useState([]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    productId: '',
    ordersReceived: '',
    ordersDelivered: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Charger uniquement les produits actifs et les rapports du jour
      const [productsRes, reportsRes] = await Promise.all([
        ecomApi.get('/products?isActive=true'),
        ecomApi.get('/reports?date=' + new Date().toISOString().split('T')[0])
      ]);

      setProducts(productsRes.data.data || []);
      setTodayReports(reportsRes.data.data?.reports || []);
    } catch (error) {
      console.error('Erreur chargement dashboard closeuse:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleSubmit = async () => {
    if (!formData.productId || !formData.ordersReceived || !formData.ordersDelivered) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    setSubmitting(true);
    setMessage('');

    try {
      const reportData = {
        ...formData,
        ordersReceived: parseInt(formData.ordersReceived),
        ordersDelivered: parseInt(formData.ordersDelivered),
        adSpend: 0
      };

      await ecomApi.post('/reports', reportData);
      
      Alert.alert('Succès', 'Rapport enregistré avec succès!');
      setFormData({ 
        date: formData.date, 
        productId: '', 
        ordersReceived: '', 
        ordersDelivered: '', 
        notes: '' 
      });
      
      // Recharger les données
      await loadDashboardData();
    } catch (error) {
      Alert.alert('Erreur', error.response?.data?.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      test: '#fef3c7',
      stable: '#dbeafe',
      winner: '#d1fae5',
      pause: '#fed7aa',
      stop: '#fee2e2'
    };
    return colors[status] || '#f3f4f6';
  };

  const getStatusTextColor = (status) => {
    const colors = {
      test: '#92400e',
      stable: '#1e40af',
      winner: '#065f46',
      pause: '#9a3412',
      stop: '#991b1b'
    };
    return colors[status] || '#374151';
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

  const ProductCard = ({ product }) => (
    <TouchableOpacity 
      style={styles.productCard}
      onPress={() => setFormData(prev => ({ ...prev, productId: product._id }))}
    >
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
          <Text style={styles.metricLabel}>Prix</Text>
          <Text style={styles.metricValue}>{product.sellingPrice}€</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Stock</Text>
          <Text style={styles.metricValue}>{product.stock || 0}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const ReportCard = ({ report }) => {
    const product = products.find(p => p._id === report.productId);
    return (
      <View style={styles.reportCard}>
        <View style={styles.reportHeader}>
          <Text style={styles.reportProductName}>{product?.name || 'Produit inconnu'}</Text>
          <Text style={styles.reportDate}>{new Date(report.date).toLocaleDateString()}</Text>
        </View>
        
        <View style={styles.reportMetrics}>
          <View style={styles.reportMetric}>
            <Text style={styles.reportMetricLabel}>Reçues</Text>
            <Text style={styles.reportMetricValue}>{report.ordersReceived}</Text>
          </View>
          <View style={styles.reportMetric}>
            <Text style={styles.reportMetricLabel}>Livrées</Text>
            <Text style={styles.reportMetricValue}>{report.ordersDelivered}</Text>
          </View>
          <View style={styles.reportMetric}>
            <Text style={styles.reportMetricLabel}>Taux</Text>
            <Text style={styles.reportMetricValue}>
              {report.ordersReceived > 0 
                ? Math.round((report.ordersDelivered / report.ordersReceived) * 100) + '%'
                : '0%'
              }
            </Text>
          </View>
        </View>
        
        {report.notes && (
          <Text style={styles.reportNotes} numberOfLines={2}>
            {report.notes}
          </Text>
        )}
      </View>
    );
  };

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#ec4899" />
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
        <Text style={styles.headerTitle}>Dashboard Closeuse</Text>
        <Text style={styles.headerSubtitle}>
          Bienvenue, {user?.email?.split('@')[0]}
        </Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsGrid}>
        <StatCard
          title="Produits actifs"
          value={products.length}
          icon="inventory-2"
          color="#ec4899"
          onPress={() => navigation.navigate('ProductsList')}
        />
        <StatCard
          title="Rapports aujourd'hui"
          value={todayReports.length}
          icon="bar-chart"
          color="#8b5cf6"
          onPress={() => navigation.navigate('ReportsList')}
        />
        <StatCard
          title="Commandes reçues"
          value={todayReports.reduce((sum, r) => sum + r.ordersReceived, 0)}
          icon="shopping-cart"
          color="#10b981"
          onPress={() => navigation.navigate('OrdersList')}
        />
        <StatCard
          title="Taux livraison"
          value={
            todayReports.length > 0 && todayReports.reduce((sum, r) => sum + r.ordersReceived, 0) > 0
              ? Math.round(
                  (todayReports.reduce((sum, r) => sum + r.ordersDelivered, 0) / 
                   todayReports.reduce((sum, r) => sum + r.ordersReceived, 0)) * 100
                ) + '%'
              : '0%'
          }
          icon="local-shipping"
          color="#f59e0b"
        />
      </View>

      {/* Quick Report Form */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rapport rapide</Text>
        
        <View style={styles.form}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Date</Text>
            <TextInput
              style={styles.input}
              value={formData.date}
              onChangeText={(text) => setFormData(prev => ({ ...prev, date: text }))}
              editable={false}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Produit</Text>
            <TouchableOpacity
              style={[styles.input, styles.selectInput]}
              onPress={() => navigation.navigate('ProductsList', { 
                onSelect: (product) => setFormData(prev => ({ ...prev, productId: product._id })) 
              })}
            >
              <Text style={styles.selectText}>
                {products.find(p => p._id === formData.productId)?.name || 'Sélectionner un produit'}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Commandes reçues</Text>
              <TextInput
                style={styles.input}
                value={formData.ordersReceived}
                onChangeText={(text) => setFormData(prev => ({ ...prev, ordersReceived: text }))}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>
            
            <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Commandes livrées</Text>
              <TextInput
                style={styles.input}
                value={formData.ordersDelivered}
                onChangeText={(text) => setFormData(prev => ({ ...prev, ordersDelivered: text }))}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Notes (optionnel)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.notes}
              onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
              placeholder="Informations supplémentaires..."
              multiline
              numberOfLines={3}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.submitButtonText}>Enregistrer le rapport</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Today's Reports */}
      {todayReports.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Rapports d'aujourd'hui</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ReportsList')}>
              <Text style={styles.seeAllText}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.reportsList}>
            {todayReports.map((report, index) => (
              <ReportCard key={index} report={report} />
            ))}
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions rapides</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickActionButton, { backgroundColor: '#ec4899' }]}
            onPress={() => navigation.navigate('OrdersList')}
          >
            <MaterialIcons name="shopping-cart" size={20} color="white" />
            <Text style={styles.quickActionText}>Voir les commandes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickActionButton, { backgroundColor: '#8b5cf6' }]}
            onPress={() => navigation.navigate('ClientsList')}
          >
            <MaterialIcons name="people" size={20} color="white" />
            <Text style={styles.quickActionText}>Voir les clients</Text>
          </TouchableOpacity>
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
    color: '#ec4899',
    fontWeight: '500',
  },
  form: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: {
    color: '#111827',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#ec4899',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  productCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 8,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  productMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metric: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    color: '#6b7280',
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  reportsList: {
    gap: 8,
  },
  reportCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reportProductName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  reportDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  reportMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reportMetric: {
    alignItems: 'center',
  },
  reportMetricLabel: {
    fontSize: 10,
    color: '#6b7280',
  },
  reportMetricValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  reportNotes: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
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
});

export default CloseuseDashboard;

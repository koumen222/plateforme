import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useEcomAuth } from '../../contexts/EcomAuthContext';
import { useMoney } from '../../contexts/ecom/useMoney';
import ecomApi from '../../services/ecom/ecomApi';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const Data = ({ navigation }) => {
  const { user } = useEcomAuth();
  const { fmt } = useMoney();
  const [data, setData] = useState({
    financial: {},
    products: [],
    orders: [],
    customers: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Charger les données financières
      const financialRes = await ecomApi.reports.getRevenue({ 
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      });
      
      // Charger les produits
      const productsRes = await ecomApi.products.getAll();
      
      // Charger les commandes
      const ordersRes = await ecomApi.orders.getAll();
      
      // Charger les clients
      const clientsRes = await ecomApi.clients.getAll();

      setData({
        financial: financialRes.data.data || {},
        products: productsRes.data.data || [],
        orders: ordersRes.data.data || [],
        customers: clientsRes.data.data || []
      });
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#3b82f6" />
      <Text style={styles.loadingText}>Chargement des données...</Text>
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Données et Analytics</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Résumé financier</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <MaterialIcons name="account-balance-wallet" size={24} color="#10b981" />
            <Text style={styles.statValue}>
              {fmt(data.financial.totalRevenue || 0)}
            </Text>
            <Text style={styles.statLabel}>Revenu total</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="trending-up" size={24} color="#10b981" />
            <Text style={styles.statValue}>
              {fmt(data.financial.totalProfit || 0)}
            </Text>
            <Text style={styles.statLabel}>Bénéfice</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="shopping-cart" size={24} color="#3b82f6" />
            <Text style={styles.statValue}>{data.orders.length}</Text>
            <Text style={styles.statLabel}>Commandes</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="people" size={24} color="#8b5cf6" />
            <Text style={styles.statValue}>{data.customers.length}</Text>
            <Text style={styles.statLabel}>Clients</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Produits performants</Text>
        <View style={styles.productsList}>
          {data.products.slice(0, 5).map((product, index) => (
            <View key={index} style={styles.productItem}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productPrice}>{fmt(product.sellingPrice)}</Text>
              <Text style={styles.productStock}>Stock: {product.stock || 0}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tendances</Text>
        <View style={styles.trendsContainer}>
          <View style={styles.trendItem}>
            <Text style={styles.trendTitle}>Croissance mensuelle</Text>
            <Text style={styles.trendValue}>
              {data.financial.growthRate ? `${(data.financial.growthRate * 100).toFixed(1)}%` : 'N/A'}
            </Text>
          </View>
          <View style={styles.trendItem}>
            <Text style={styles.trendTitle}>Panier moyen</Text>
            <Text style={styles.trendValue}>
              {fmt(data.financial.avgOrderValue || 0)}
            </Text>
          </View>
          <View style={styles.trendItem}>
            <Text style={styles.trendTitle}>Taux de conversion</Text>
            <Text style={styles.trendValue}>
              {data.financial.conversionRate ? `${(data.financial.conversionRate * 100).toFixed(1)}%` : 'N/A'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informations système</Text>
        <View style={styles.systemInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Utilisateur</Text>
            <Text style={styles.infoValue}>{user?.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Workspace</Text>
            <Text style={styles.infoValue}>{user?.workspace?.name || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Rôle</Text>
            <Text style={styles.infoValue}>{user?.role || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Dernière mise à jour</Text>
            <Text style={styles.infoValue}>
              {new Date().toLocaleString('fr-FR')}
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
  section: {
    backgroundColor: '#ffffff',
    marginTop: 16,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  productsList: {
    gap: 8,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    flex: 1,
  },
  productPrice: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
  },
  productStock: {
    fontSize: 12,
    color: '#6b7280',
  },
  trendsContainer: {
    gap: 12,
  },
  trendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  trendTitle: {
    fontSize: 14,
    color: '#374151',
  },
  trendValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  systemInfo: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
});

export default Data;

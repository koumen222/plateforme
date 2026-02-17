import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useThemeSafe } from '../../utils/useThemeSafe';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const AdminDashboardScreen = ({ navigation }) => {
  const theme = useThemeSafe();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalClients: 0,
    activeCampaigns: 0,
    recentOrders: [],
    topProducts: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Simuler le chargement des données du dashboard
      const mockStats = {
        totalRevenue: 45678,
        totalOrders: 234,
        totalClients: 89,
        activeCampaigns: 3,
        recentOrders: [
          {
            id: 1,
            client: 'Jean Dupont',
            amount: 125,
            status: 'completed',
            date: '2024-01-22',
          },
          {
            id: 2,
            client: 'Marie Martin',
            amount: 89,
            status: 'pending',
            date: '2024-01-22',
          },
          {
            id: 3,
            client: 'Pierre Bernard',
            amount: 234,
            status: 'completed',
            date: '2024-01-21',
          },
        ],
        topProducts: [
          {
            id: 1,
            name: 'Cooking Set Pro',
            sales: 45,
            revenue: 2250,
          },
          {
            id: 2,
            name: 'Recipe Book Premium',
            sales: 32,
            revenue: 960,
          },
          {
            id: 3,
            name: 'Kitchen Tools Kit',
            sales: 28,
            revenue: 840,
          },
        ],
      };
      setStats(mockStats);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return theme.colors.success;
      case 'pending':
        return theme.colors.warning;
      case 'cancelled':
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Terminée';
      case 'pending':
        return 'En attente';
      case 'cancelled':
        return 'Annulée';
      default:
        return status;
    }
  };

  const renderStatCard = (title, value, icon, color) => (
    <TouchableOpacity
      key={title}
      style={[styles.statCard, { backgroundColor: theme.colors.surface }]}
      onPress={() => {
        // Navigation vers la page détaillée correspondante
        if (title.includes('Revenu')) {
          navigation.navigate('Reports');
        } else if (title.includes('Commandes')) {
          navigation.navigate('Orders');
        } else if (title.includes('Clients')) {
          navigation.navigate('Clients');
        } else if (title.includes('Campagnes')) {
          navigation.navigate('Campaigns');
        }
      }}
    >
      <View style={[styles.iconContainer, { backgroundColor: color }]}>
        <MaterialIcons name={icon} size={24} color="white" />
      </View>
      <Text style={[styles.statValue, { color: theme.colors.text }]}>{value}</Text>
      <Text style={[styles.statTitle, { color: theme.colors.textSecondary }]}>{title}</Text>
    </TouchableOpacity>
  );

  const renderRecentOrder = (order) => (
    <TouchableOpacity
      key={order.id}
      style={[styles.orderItem, { backgroundColor: theme.colors.surface }]}
      onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
    >
      <View style={styles.orderInfo}>
        <Text style={[styles.orderClient, { color: theme.colors.text }]}>
          {order.client}
        </Text>
        <Text style={[styles.orderDate, { color: theme.colors.textSecondary }]}>
          {order.date}
        </Text>
      </View>
      <View style={styles.orderDetails}>
        <Text style={[styles.orderAmount, { color: theme.colors.text }]}>
          {order.amount}€
        </Text>
        <View style={[styles.orderStatus, { backgroundColor: getStatusColor(order.status) }]}>
          <Text style={styles.orderStatusText}>{getStatusText(order.status)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderTopProduct = (product, index) => (
    <View
      key={product.id}
      style={[styles.productItem, { backgroundColor: theme.colors.surface }]}
    >
      <View style={styles.productRank}>
        <Text style={[styles.rankNumber, { color: theme.colors.primary }]}>
          #{index + 1}
        </Text>
      </View>
      <View style={styles.productInfo}>
        <Text style={[styles.productName, { color: theme.colors.text }]}>
          {product.name}
        </Text>
        <Text style={[styles.productStats, { color: theme.colors.textSecondary }]}>
          {product.sales} ventes • {product.revenue}€
        </Text>
      </View>
      <MaterialIcons name="trending-up" size={20} color={theme.colors.success} />
    </View>
  );

  const renderQuickAction = (title, icon, screen, color) => (
    <TouchableOpacity
      key={title}
      style={[styles.quickAction, { backgroundColor: color }]}
      onPress={() => navigation.navigate(screen)}
    >
      <MaterialIcons name={icon} size={24} color="white" />
      <Text style={styles.quickActionText}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Tableau de bord
          </Text>
          <TouchableOpacity onPress={onRefresh}>
            <MaterialIcons name="refresh" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          {renderStatCard('Revenu total', `${stats.totalRevenue}€`, 'currency-euro', theme.colors.success)}
          {renderStatCard('Commandes', stats.totalOrders, 'shopping-cart', theme.colors.primary)}
          {renderStatCard('Clients', stats.totalClients, 'people', theme.colors.warning)}
          {renderStatCard('Campagnes actives', stats.activeCampaigns, 'campaign', theme.colors.error)}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Actions rapides
          </Text>
          <View style={styles.quickActionsGrid}>
            {renderQuickAction('Nouvelle commande', 'add-shopping-cart', 'OrderForm', theme.colors.primary)}
            {renderQuickAction('Ajouter client', 'person-add', 'ClientForm', theme.colors.success)}
            {renderQuickAction('Nouvelle campagne', 'campaign', 'CampaignForm', theme.colors.warning)}
            {renderQuickAction('Ajouter produit', 'inventory', 'ProductForm', theme.colors.error)}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Commandes récentes
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Orders')}>
              <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>
                Voir tout
              </Text>
            </TouchableOpacity>
          </View>
          {stats.recentOrders.map(renderRecentOrder)}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Produits populaires
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Products')}>
              <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>
                Voir tout
              </Text>
            </TouchableOpacity>
          </View>
          {stats.topProducts.map((product, index) => renderTopProduct(product, index))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
    elevation: 2,
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statTitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAction: {
    width: '48%',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
    elevation: 2,
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
  },
  quickActionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
  },
  orderInfo: {
    flex: 1,
  },
  orderClient: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
  },
  orderDetails: {
    alignItems: 'flex-end',
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  orderStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  orderStatusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
  },
  productRank: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  rankNumber: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  productStats: {
    fontSize: 14,
  },
});

export default AdminDashboardScreen;

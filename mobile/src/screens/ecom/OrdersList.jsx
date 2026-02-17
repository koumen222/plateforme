import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useEcomAuth } from '../../contexts/EcomAuthContext';
import { useMoney } from '../../contexts/ecom/useMoney';
import ecomApi from '../../services/ecom/ecomApi';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const OrdersList = ({ navigation }) => {
  const { user } = useEcomAuth();
  const { fmt } = useMoney();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await ecomApi.orders.getAll();
      setOrders(response.data.data || []);
    } catch (error) {
      console.error('Erreur chargement commandes:', error);
      Alert.alert('Erreur', 'Impossible de charger les commandes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      confirmed: '#3b82f6',
      preparing: '#8b5cf6',
      ready: '#10b981',
      delivered: '#10b981',
      cancelled: '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  const renderOrder = ({ item }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => navigation.navigate('OrderDetail', { orderId: item._id })}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderId}>#{item._id?.slice(-8) || 'N/A'}</Text>
          <Text style={styles.orderDate}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <View style={styles.orderContent}>
        <Text style={styles.orderTitle}>{item.title || 'Commande sans titre'}</Text>
        <Text style={styles.orderCustomer}>Client: {item.customerName || 'N/A'}</Text>
        <View style={styles.orderItems}>
          <Text style={styles.itemsTitle}>Produits:</Text>
          {item.items?.slice(0, 3).map((item, index) => (
            <Text key={index} style={styles.itemText}>
              • {item.name} x {item.quantity}
            </Text>
          ))}
          {item.items?.length > 3 && (
            <Text style={styles.moreItemsText}>
              +{item.items.length - 3} autres produits
            </Text>
          )}
        </View>
      </View>
      
      <View style={styles.orderFooter}>
        <View style={styles.orderAmount}>
          <Text style={styles.amountLabel}>Total</Text>
          <Text style={styles.amountValue}>{fmt(item.totalAmount)}</Text>
        </View>
        <MaterialIcons name="chevron-right" size={20} color="#6b7280" />
      </View>
    </TouchableOpacity>
  );

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#3b82f6" />
      <Text style={styles.loadingText}>Chargement des commandes...</Text>
    </View>
  );

  if (loading) {
    return renderLoading();
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Commandes</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => Alert.alert('Info', 'Création de commande à implémenter')}
        >
          <MaterialIcons name="add" size={20} color="white" />
          <Text style={styles.addButtonText}>Nouvelle</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <MaterialIcons name="shopping-cart" size={24} color="#3b82f6" />
          <Text style={styles.statValue}>{orders.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialIcons name="pending" size={24} color="#f59e0b" />
          <Text style={styles.statValue}>
            {orders.filter(o => o.status === 'pending').length}
          </Text>
          <Text style={styles.statLabel}>En attente</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialIcons name="local-shipping" size={24} color="#10b981" />
          <Text style={styles.statValue}>
            {orders.filter(o => o.status === 'delivered').length}
          </Text>
          <Text style={styles.statLabel}>Livrées</Text>
        </View>
      </View>

      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="shopping-cart" size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>Aucune commande trouvée</Text>
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
    backgroundColor: '#3b82f6',
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
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  listContainer: {
    padding: 16,
  },
  orderCard: {
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
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  orderContent: {
    marginBottom: 12,
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  orderCustomer: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  orderItems: {
    marginBottom: 8,
  },
  itemsTitle: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  itemText: {
    fontSize: 12,
    color: '#374151',
    marginBottom: 2,
  },
  moreItemsText: {
    fontSize: 10,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
  },
  orderAmount: {
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  amountValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
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
  },
});

export default OrdersList;

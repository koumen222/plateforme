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
import ecomApi from '../../services/ecom/ecomApi';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const StockManagement = ({ navigation }) => {
  const { user } = useEcomAuth();
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStockData();
  }, []);

  const loadStockData = async () => {
    try {
      setLoading(true);
      const response = await ecomApi.stock.overview();
      setStockData(response.data.data || []);
    } catch (error) {
      console.error('Erreur chargement données stock:', error);
      Alert.alert('Erreur', 'Impossible de charger les données de stock');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadStockData();
  };

  const getStockLevelColor = (level) => {
    if (level <= 5) return '#ef4444'; // Critique
    if (level <= 15) return '#f59e0b'; // Bas
    return '#10b981'; // Normal
  };

  const renderStockItem = ({ item }) => (
    <View style={styles.stockCard}>
      <View style={styles.stockHeader}>
        <Text style={styles.productName}>{item.name}</Text>
        <View style={[styles.stockLevel, { backgroundColor: getStockLevelColor(item.stock) }]}>
          <Text style={styles.stockLevelText}>{item.stock}</Text>
        </View>
      </View>
      
      <View style={styles.stockInfo}>
        <Text style={styles.stockLabel}>SKU: {item.sku || 'N/A'}</Text>
        <Text style={styles.stockLabel}>Prix: {item.sellingPrice}€</Text>
        <Text style={styles.stockLabel}>Statut: {item.status}</Text>
      </View>
      
      <View style={styles.stockActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#3b82f6' }]}
          onPress={() => navigation.navigate('ProductDetail', { productId: item._id })}
        >
          <MaterialIcons name="visibility" size={16} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#10b981' }]}
          onPress={() => navigation.navigate('StockOrderForm', { productId: item._id })}
        >
          <MaterialIcons name="add-shopping-cart" size={16} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#3b82f6" />
      <Text style={styles.loadingText}>Chargement des données de stock...</Text>
    </View>
  );

  if (loading) {
    return renderLoading();
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gestion du Stock</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('StockOrderForm')}
        >
          <MaterialIcons name="add" size={20} color="white" />
          <Text style={styles.addButtonText}>Commande</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <MaterialIcons name="inventory" size={24} color="#3b82f6" />
          <Text style={styles.statValue}>{stockData.length}</Text>
          <Text style={styles.statLabel}>Produits</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialIcons name="warning" size={24} color="#ef4444" />
          <Text style={styles.statValue}>
            {stockData.filter(item => item.stock <= 5).length}
          </Text>
          <Text style={styles.statLabel}>Stock critique</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialIcons name="trending-down" size={24} color="#f59e0b" />
          <Text style={styles.statValue}>
            {stockData.filter(item => item.stock > 5 && item.stock <= 15).length}
          </Text>
          <Text style={styles.statLabel}>Stock bas</Text>
        </View>
      </View>

      <FlatList
        data={stockData}
        renderItem={renderStockItem}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="inventory" size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>Aucun produit en stock</Text>
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
  stockCard: {
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
  stockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  stockLevel: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    minWidth: 40,
    alignItems: 'center',
  },
  stockLevelText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  stockInfo: {
    marginBottom: 12,
  },
  stockLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  stockActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
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

export default StockManagement;

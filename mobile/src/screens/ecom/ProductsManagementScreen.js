import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Switch,
} from 'react-native';
import { useThemeSafe } from '../../utils/useThemeSafe';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const ProductsManagementScreen = ({ navigation }) => {
  const theme = useThemeSafe();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, active, inactive, outOfStock

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      // Simuler le chargement des produits
      const mockProducts = [
        {
          id: 1,
          name: 'Cooking Set Pro',
          description: 'Ensemble complet de cuisine professionnel',
          price: 49.99,
          stock: 25,
          category: 'Cuisson',
          status: 'active',
          image: 'https://via.placeholder.com/100x100',
          sales: 45,
          revenue: 2249.55,
        },
        {
          id: 2,
          name: 'Recipe Book Premium',
          description: 'Livre de recettes exclusives',
          price: 29.99,
          stock: 0,
          category: 'Livres',
          status: 'active',
          image: 'https://via.placeholder.com/100x100',
          sales: 32,
          revenue: 959.68,
        },
        {
          id: 3,
          name: 'Kitchen Tools Kit',
          description: 'Kit d\'outils de cuisine essentiel',
          price: 34.99,
          stock: 15,
          category: 'Ustensiles',
          status: 'active',
          image: 'https://via.placeholder.com/100x100',
          sales: 28,
          revenue: 979.72,
        },
        {
          id: 4,
          name: 'Digital Scale',
          description: 'Balance de cuisine numérique précise',
          price: 24.99,
          stock: 8,
          category: 'Mesure',
          status: 'inactive',
          image: 'https://via.placeholder.com/100x100',
          sales: 12,
          revenue: 299.88,
        },
      ];
      setProducts(mockProducts);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les produits');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  const toggleProductStatus = async (productId) => {
    try {
      setProducts(prev => prev.map(product => 
        product.id === productId 
          ? { ...product, status: product.status === 'active' ? 'inactive' : 'active' }
          : product
      ));
      Alert.alert('Succès', 'Statut du produit mis à jour');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour le statut');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return theme.colors.success;
      case 'inactive':
        return theme.colors.textSecondary;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'Actif';
      case 'inactive':
        return 'Inactif';
      default:
        return status;
    }
  };

  const getStockColor = (stock) => {
    if (stock === 0) return theme.colors.error;
    if (stock < 10) return theme.colors.warning;
    return theme.colors.success;
  };

  const getStockText = (stock) => {
    if (stock === 0) return 'Rupture';
    if (stock < 10) return `Faible (${stock})`;
    return `En stock (${stock})`;
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase()) ||
                         product.description.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || 
                         (filter === 'outOfStock' && product.stock === 0) ||
                         product.status === filter;
    return matchesSearch && matchesFilter;
  });

  const renderProductItem = (product) => (
    <TouchableOpacity
      key={product.id}
      style={[styles.productCard, { backgroundColor: theme.colors.surface }]}
      onPress={() => navigation.navigate('ProductForm', { productId: product.id })}
    >
      <View style={styles.productHeader}>
        <View style={styles.productInfo}>
          <Text style={[styles.productName, { color: theme.colors.text }]}>
            {product.name}
          </Text>
          <Text style={[styles.productCategory, { color: theme.colors.textSecondary }]}>
            {product.category}
          </Text>
        </View>
        <View style={styles.productStatus}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(product.status) }]}>
            <Text style={styles.statusText}>{getStatusText(product.status)}</Text>
          </View>
          <View style={[styles.stockBadge, { backgroundColor: getStockColor(product.stock) }]}>
            <Text style={styles.stockText}>{getStockText(product.stock)}</Text>
          </View>
        </View>
      </View>

      <Text style={[styles.productDescription, { color: theme.colors.textSecondary }]}>
        {product.description}
      </Text>

      <View style={styles.productStats}>
        <View style={styles.statItem}>
          <MaterialIcons name="currency-euro" size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.statText, { color: theme.colors.text }]}>
            {product.price}
          </Text>
        </View>

        <View style={styles.statItem}>
          <MaterialIcons name="shopping-cart" size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.statText, { color: theme.colors.text }]}>
            {product.sales} ventes
          </Text>
        </View>

        <View style={styles.statItem}>
          <MaterialIcons name="trending-up" size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.statText, { color: theme.colors.text }]}>
            {product.revenue.toFixed(2)}€
          </Text>
        </View>
      </View>

      <View style={styles.productActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => navigation.navigate('ProductForm', { productId: product.id })}
        >
          <MaterialIcons name="edit" size={16} color="white" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.warning }]}
          onPress={() => Alert.alert('Stock', `Gérer le stock pour ${product.name}`)}
        >
          <MaterialIcons name="inventory" size={16} color="white" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.success }]}
          onPress={() => toggleProductStatus(product.id)}
        >
          <MaterialIcons name={product.status === 'active' ? 'visibility-off' : 'visibility'} size={16} color="white" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderFilterButton = (filterType, title, icon) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        { 
          backgroundColor: filter === filterType ? theme.colors.primary : theme.colors.surface,
          borderColor: theme.colors.border
        }
      ]}
      onPress={() => setFilter(filterType)}
    >
      <MaterialIcons 
        name={icon} 
        size={16} 
        color={filter === filterType ? 'white' : theme.colors.textSecondary} 
      />
      <Text style={[
        styles.filterButtonText,
        { color: filter === filterType ? 'white' : theme.colors.text }
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Gestion des produits
        </Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => navigation.navigate('ProductForm')}
        >
          <MaterialIcons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface }]}>
        <MaterialIcons name="search" size={20} color={theme.colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text }]}
          placeholder="Rechercher un produit..."
          placeholderTextColor={theme.colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
        <View style={styles.filtersContainer}>
          {renderFilterButton('all', 'Tous', 'apps')}
          {renderFilterButton('active', 'Actifs', 'check-circle')}
          {renderFilterButton('inactive', 'Inactifs', 'cancel')}
          {renderFilterButton('outOfStock', 'Rupture', 'error')}
        </View>
      </ScrollView>

      <ScrollView
        style={styles.productsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredProducts.map(renderProductItem)}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
  addButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
    paddingHorizontal: 15,
    borderRadius: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  filtersScroll: {
    maxHeight: 60,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  productsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  productCard: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 14,
  },
  productStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stockText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  productDescription: {
    fontSize: 14,
    marginBottom: 15,
    lineHeight: 20,
  },
  productStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  productActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    width: 35,
    height: 35,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
});

export default ProductsManagementScreen;

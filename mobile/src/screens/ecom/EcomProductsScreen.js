import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Image,
  TextInput,
} from 'react-native';
import { useThemeSafe } from '../../contexts/ThemeContext';
import { useEcomAuth } from '../../contexts/ecom/EcomAuthContext';
import { useCart } from '../../contexts/ecom/CartContext';
import { useCurrency } from '../../contexts/ecom/CurrencyContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ecomApi } from '../../services/ecom/ecomApi';

const EcomProductsScreen = ({ route, navigation }) => {
  const { categoryId } = route.params || {};
  const theme = useThemeSafe();
  const { user, isAuthenticated } = useEcomAuth();
  const { addToCart } = useCart();
  const { formatCurrency } = useCurrency();
  
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(categoryId || null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [filtersVisible, setFiltersVisible] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, [selectedCategory, searchQuery, sortBy]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Charger les catégories
      const categoriesResponse = await ecomApi.categories.getAll();
      if (categoriesResponse.data.success) {
        setCategories(categoriesResponse.data.data || []);
      }
      
      // Charger les produits
      await loadProducts();
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      let response;
      
      if (searchQuery) {
        response = await ecomApi.products.search(searchQuery);
      } else if (selectedCategory) {
        response = await ecomApi.products.getByCategory(selectedCategory);
      } else {
        response = await ecomApi.products.getAll();
      }

      if (response.data.success) {
        let productsData = response.data.data || [];
        
        // Appliquer le tri
        productsData = sortProducts(productsData, sortBy);
        
        setProducts(productsData);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const sortProducts = (products, sortType) => {
    const sorted = [...products];
    
    switch (sortType) {
      case 'name':
        return sorted.sort((a, b) => (a.name || a.nom || '').localeCompare(b.name || b.nom || ''));
      case 'price_low':
        return sorted.sort((a, b) => (a.sellingPrice || a.prix || 0) - (b.sellingPrice || b.prix || 0));
      case 'price_high':
        return sorted.sort((a, b) => (b.sellingPrice || b.prix || 0) - (a.sellingPrice || a.prix || 0));
      case 'newest':
        return sorted.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      default:
        return sorted;
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  };

  const handleAddToCart = async (product) => {
    if (!isAuthenticated) {
      navigation.navigate('EcomLogin');
      return;
    }

    try {
      await addToCart({
        id: product.id,
        name: product.name || product.nom,
        price: product.sellingPrice || product.prix,
        image: product.image_url || product.image,
        description: product.description || product.description_courte
      });
      
      // Optionnel: afficher une confirmation
      console.log('Produit ajouté au panier');
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const renderProductItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.productCard, { backgroundColor: theme.colors.surface }]}
      onPress={() => navigation.navigate('EcomProductDetail', { productId: item.id })}
    >
      <Image
        source={{ 
          uri: item.image_url || item.image || 'https://via.placeholder.com/150x150?text=Produit' 
        }}
        style={styles.productImage}
        resizeMode="cover"
      />
      <View style={styles.productInfo}>
        <Text style={[styles.productName, { color: theme.colors.text }]} numberOfLines={2}>
          {item.name || item.nom}
        </Text>
        <Text style={[styles.productDescription, { color: theme.colors.textSecondary }]} numberOfLines={2}>
          {item.description || item.description_courte}
        </Text>
        <View style={styles.productMeta}>
          <View style={styles.priceContainer}>
            <Text style={[styles.productPrice, { color: theme.colors.primary }]}>
              {formatCurrency(item.sellingPrice || item.prix || 0)}
            </Text>
            {item.oldPrice && (
              <Text style={[styles.oldPrice, { color: theme.colors.textSecondary }]}>
                {formatCurrency(item.oldPrice)}
              </Text>
            )}
          </View>
          <View style={styles.stockContainer}>
            <Text style={[
              styles.stockText,
              { 
                color: (item.stock || 0) > 10 ? theme.colors.success : 
                       (item.stock || 0) > 0 ? theme.colors.warning : 
                       theme.colors.error
              }
            ]}>
              {(item.stock || 0) > 0 ? `Stock: ${item.stock}` : 'Rupture'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[
            styles.addToCartButton,
            { 
              backgroundColor: (item.stock || 0) > 0 ? theme.colors.primary : theme.colors.border 
            }
          ]}
          onPress={() => handleAddToCart(item)}
          disabled={(item.stock || 0) === 0}
        >
          <MaterialIcons 
            name="add-shopping-cart" 
            size={16} 
            color={(item.stock || 0) > 0 ? 'white' : theme.colors.textSecondary} 
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryChip,
        { 
          backgroundColor: selectedCategory === item.id ? theme.colors.primary : theme.colors.surface,
          borderColor: theme.colors.border
        }
      ]}
      onPress={() => setSelectedCategory(selectedCategory === item.id ? null : item.id)}
    >
      <Text style={[
        styles.categoryChipText,
        { color: selectedCategory === item.id ? 'white' : theme.colors.text }
      ]}>
        {item.name || item.nom}
      </Text>
    </TouchableOpacity>
  );

  const renderSortOption = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.sortOption,
        { 
          backgroundColor: sortBy === item.value ? theme.colors.primary : theme.colors.surface 
        }
      ]}
      onPress={() => setSortBy(item.value)}
    >
      <MaterialIcons 
        name={item.icon} 
        size={20} 
        color={sortBy === item.value ? 'white' : theme.colors.text} 
      />
      <Text style={[
        styles.sortOptionText,
        { color: sortBy === item.value ? 'white' : theme.colors.text }
      ]}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  const sortOptions = [
    { label: 'Nom', value: 'name', icon: 'sort-by-alpha' },
    { label: 'Prix croissant', value: 'price_low', icon: 'arrow-upward' },
    { label: 'Prix décroissant', value: 'price_high', icon: 'arrow-downward' },
    { label: 'Plus récents', value: 'newest', icon: 'schedule' },
  ];

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Chargement des produits...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Produits
          </Text>
          <TouchableOpacity onPress={() => setFiltersVisible(!filtersVisible)}>
            <MaterialIcons name="filter-list" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <MaterialIcons name="search" size={20} color={theme.colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder="Rechercher un produit..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialIcons name="clear" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categories */}
      {categories.length > 0 && (
        <View style={styles.categoriesContainer}>
          <FlatList
            data={categories}
            renderItem={renderCategoryItem}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />
        </View>
      )}

      {/* Sort Options (visible when filters are shown) */}
      {filtersVisible && (
        <View style={[styles.filtersContainer, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.filtersTitle, { color: theme.colors.text }]}>
            Trier par:
          </Text>
          <View style={styles.sortOptionsContainer}>
            {sortOptions.map((option) => (
              <View key={option.value} style={styles.sortOptionWrapper}>
                {renderSortOption({ item: option })}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Products List */}
      <FlatList
        data={products}
        renderItem={renderProductItem}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
        contentContainerStyle={styles.productsList}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="search-off" size={64} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              {searchQuery ? 'Aucun produit trouvé' : 'Aucun produit disponible'}
            </Text>
          </View>
        }
        ListHeaderComponent={
          products.length > 0 && (
            <View style={styles.resultsHeader}>
              <Text style={[styles.resultsCount, { color: theme.colors.textSecondary }]}>
                {products.length} produit{products.length > 1 ? 's' : ''}
              </Text>
            </View>
          )
        }
      />
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  categoriesContainer: {
    marginBottom: 16,
  },
  categoriesList: {
    paddingHorizontal: 20,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filtersContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  sortOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sortOptionWrapper: {
    width: '48%',
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  sortOptionText: {
    fontSize: 14,
    marginLeft: 8,
  },
  productsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  productCard: {
    flex: 1,
    margin: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 150,
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 12,
    marginBottom: 8,
  },
  productMeta: {
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  oldPrice: {
    fontSize: 12,
    textDecorationLine: 'line-through',
    marginLeft: 8,
  },
  stockContainer: {
    alignSelf: 'flex-start',
  },
  stockText: {
    fontSize: 12,
    fontWeight: '500',
  },
  addToCartButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsHeader: {
    paddingVertical: 8,
  },
  resultsCount: {
    fontSize: 14,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
};

export default EcomProductsScreen;

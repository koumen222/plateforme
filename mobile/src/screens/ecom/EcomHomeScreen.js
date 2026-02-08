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
  Alert,
} from 'react-native';
import { useThemeSafe } from '../../contexts/ThemeContext';
import { useEcomAuth } from '../../contexts/ecom/EcomAuthContext';
import { useCart } from '../../contexts/ecom/CartContext';
import { useCurrency } from '../../contexts/ecom/CurrencyContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ecomApi } from '../../services/ecom/ecomApi';

const EcomHomeScreen = ({ navigation }) => {
  const theme = useThemeSafe();
  const { user, isAuthenticated, logout } = useEcomAuth();
  const { getCartItemsCount } = useCart();
  const { formatCurrency } = useCurrency();
  
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadEcomData();
  }, []);

  const loadEcomData = async () => {
    try {
      const [productsResponse, categoriesResponse, ordersResponse] = await Promise.all([
        ecomApi.products.getFeatured(),
        ecomApi.categories.getAll(),
        isAuthenticated ? ecomApi.orders.getUserOrders() : Promise.resolve({ data: { data: [] } })
      ]);

      if (productsResponse.data.success) {
        setFeaturedProducts(productsResponse.data.data || []);
      }

      if (categoriesResponse.data.success) {
        setCategories(categoriesResponse.data.data || []);
      }

      if (ordersResponse.data.success) {
        setRecentOrders(ordersResponse.data.data?.slice(0, 3) || []);
      }
    } catch (error) {
      console.error('Error loading ecom data:', error);
      Alert.alert('Erreur', 'Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEcomData();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Se déconnecter', style: 'destructive', onPress: logout }
      ]
    );
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
        <View style={styles.productPriceContainer}>
          <Text style={[styles.productPrice, { color: theme.colors.primary }]}>
            {formatCurrency(item.sellingPrice || item.prix || 0)}
          </Text>
          {item.oldPrice && (
            <Text style={[styles.oldPrice, { color: theme.colors.textSecondary }]}>
              {formatCurrency(item.oldPrice)}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.addToCartButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => {/* Ajouter au panier */}}
        >
          <MaterialIcons name="add-shopping-cart" size={16} color="white" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.categoryCard, { backgroundColor: theme.colors.surface }]}
      onPress={() => navigation.navigate('EcomProducts', { categoryId: item.id })}
    >
      <View style={[styles.categoryIcon, { backgroundColor: theme.colors.primary }]}>
        <MaterialIcons name={item.icon || 'category'} size={24} color="white" />
      </View>
      <Text style={[styles.categoryName, { color: theme.colors.text }]}>
        {item.name || item.nom}
      </Text>
      <Text style={[styles.categoryCount, { color: theme.colors.textSecondary }]}>
        {item.product_count || 0} produits
      </Text>
    </TouchableOpacity>
  );

  const renderOrderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.orderCard, { backgroundColor: theme.colors.surface }]}
      onPress={() => navigation.navigate('EcomOrderDetail', { orderId: item.id })}
    >
      <View style={styles.orderHeader}>
        <Text style={[styles.orderNumber, { color: theme.colors.text }]}>
          Commande #{item.id}
        </Text>
        <Text style={[
          styles.orderStatus,
          { 
            color: item.status === 'delivered' ? theme.colors.success : 
                   item.status === 'pending' ? theme.colors.warning : 
                   theme.colors.primary
          }
        ]}>
          {item.status === 'delivered' ? 'Livrée' : 
           item.status === 'pending' ? 'En attente' : 
           item.status}
        </Text>
      </View>
      <Text style={[styles.orderDate, { color: theme.colors.textSecondary }]}>
        {new Date(item.createdAt).toLocaleDateString('fr-FR')}
      </Text>
      <Text style={[styles.orderTotal, { color: theme.colors.primary }]}>
        {formatCurrency(item.totalAmount)}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Chargement de la boutique...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.colors.primary}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Notre Boutique
            </Text>
            {isAuthenticated && (
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                Bienvenue, {user?.name || 'Client'}!
              </Text>
            )}
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.cartButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => navigation.navigate('EcomCart')}
            >
              <MaterialIcons name="shopping-cart" size={20} color="white" />
              {getCartItemsCount() > 0 && (
                <View style={[styles.cartBadge, { backgroundColor: theme.colors.error }]}>
                  <Text style={styles.cartBadgeText}>{getCartItemsCount()}</Text>
                </View>
              )}
            </TouchableOpacity>
            
            {isAuthenticated && (
              <TouchableOpacity
                style={[styles.profileButton, { backgroundColor: theme.colors.surface }]}
                onPress={() => navigation.navigate('EcomProfile')}
              >
                <MaterialIcons name="account-circle" size={20} color={theme.colors.text} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <TouchableOpacity
        style={[styles.searchBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
        onPress={() => navigation.navigate('EcomSearch')}
      >
        <MaterialIcons name="search" size={20} color={theme.colors.textSecondary} />
        <Text style={[styles.searchPlaceholder, { color: theme.colors.textSecondary }]}>
          Rechercher un produit...
        </Text>
      </TouchableOpacity>

      {/* Quick Stats (si authentifié) */}
      {isAuthenticated && user?.role === 'admin' && (
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <MaterialIcons name="shopping-bag" size={24} color={theme.colors.primary} />
            <Text style={[styles.statNumber, { color: theme.colors.text }]}>
              {featuredProducts.length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Produits
            </Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <MaterialIcons name="receipt" size={24} color={theme.colors.accent} />
            <Text style={[styles.statNumber, { color: theme.colors.text }]}>
              {recentOrders.length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Commandes
            </Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
            <MaterialIcons name="category" size={24} color={theme.colors.success} />
            <Text style={[styles.statNumber, { color: theme.colors.text }]}>
              {categories.length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Catégories
            </Text>
          </View>
        </View>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Catégories
          </Text>
          <FlatList
            data={categories.slice(0, 6)}
            renderItem={renderCategoryItem}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        </View>
      )}

      {/* Featured Products */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Produits Populaires
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('EcomProducts')}>
            <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>
              Voir tout
            </Text>
          </TouchableOpacity>
        </View>
        
        <FlatList
          data={featuredProducts}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="shopping-bag" size={48} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                Aucun produit disponible
              </Text>
            </View>
          }
        />
      </View>

      {/* Recent Orders (si authentifié) */}
      {isAuthenticated && recentOrders.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Commandes Récentes
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('EcomOrders')}>
              <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>
                Voir tout
              </Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={recentOrders}
            renderItem={renderOrderItem}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.ordersList}
          />
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Services Rapides
        </Text>
        
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity
            style={[styles.quickActionCard, { backgroundColor: theme.colors.surface }]}
            onPress={() => navigation.navigate('EcomProducts')}
          >
            <MaterialIcons name="inventory" size={24} color={theme.colors.primary} />
            <Text style={[styles.quickActionText, { color: theme.colors.text }]}>
              Tous les Produits
            </Text>
          </TouchableOpacity>
          
          {isAuthenticated && (
            <TouchableOpacity
              style={[styles.quickActionCard, { backgroundColor: theme.colors.surface }]}
              onPress={() => navigation.navigate('EcomOrders')}
            >
              <MaterialIcons name="receipt" size={24} color={theme.colors.primary} />
              <Text style={[styles.quickActionText, { color: theme.colors.text }]}>
                Mes Commandes
              </Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.quickActionCard, { backgroundColor: theme.colors.surface }]}
            onPress={() => navigation.navigate('EcomSupport')}
          >
            <MaterialIcons name="support-agent" size={24} color={theme.colors.primary} />
            <Text style={[styles.quickActionText, { color: theme.colors.text }]}>
              Support
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Authentication CTA */}
      {!isAuthenticated && (
        <View style={styles.authSection}>
          <Text style={[styles.authTitle, { color: theme.colors.text }]}>
            Rejoignez notre boutique
          </Text>
          <Text style={[styles.authSubtitle, { color: theme.colors.textSecondary }]}>
            Connectez-vous pour accéder à vos commandes et bénéficier d'avantages exclusifs
          </Text>
          <View style={styles.authButtons}>
            <TouchableOpacity
              style={[styles.authButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => navigation.navigate('EcomLogin')}
            >
              <Text style={styles.authButtonText}>Se connecter</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.authButtonOutline, { borderColor: theme.colors.primary }]}
              onPress={() => navigation.navigate('EcomRegister')}
            >
              <Text style={[styles.authButtonTextOutline, { color: theme.colors.primary }]}>
                S'inscrire
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
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
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cartButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchPlaceholder: {
    marginLeft: 12,
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  horizontalList: {
    paddingLeft: 20,
    paddingRight: 20,
  },
  categoryCard: {
    width: 120,
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    alignItems: 'center',
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 12,
    textAlign: 'center',
  },
  productCard: {
    width: 200,
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 120,
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
  productPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
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
  orderCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    marginHorizontal: 20,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
  },
  orderStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  orderDate: {
    fontSize: 14,
    marginBottom: 4,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  ordersList: {
    paddingHorizontal: 20,
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
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 20,
  },
  quickActionCard: {
    width: 100,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
  },
  authSection: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  authTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  authSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  authButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  authButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  authButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  authButtonOutline: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  authButtonTextOutline: {
    fontSize: 16,
    fontWeight: '600',
  },
};

export default EcomHomeScreen;

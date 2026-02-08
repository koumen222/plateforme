import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  Image,
} from 'react-native';
import { useThemeSafe } from '../../contexts/ThemeContext';
import { useEcomAuth } from '../../contexts/ecom/EcomAuthContext';
import { useCart } from '../../contexts/ecom/CartContext';
import { useCurrency } from '../../contexts/ecom/CurrencyContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const EcomCartScreen = ({ navigation }) => {
  const theme = useThemeSafe();
  const { isAuthenticated } = useEcomAuth();
  const { cart, removeFromCart, updateQuantity, clearCart, getCartTotal } = useCart();
  const { formatCurrency } = useCurrency();
  
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const handleRemoveItem = (productId) => {
    Alert.alert(
      'Supprimer du panier',
      'Êtes-vous sûr de vouloir supprimer cet article ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => removeFromCart(productId) }
      ]
    );
  };

  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveItem(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Connexion requise',
        'Vous devez être connecté pour passer commande',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Se connecter', onPress: () => navigation.navigate('EcomLogin') }
        ]
      );
      return;
    }

    if (cart.length === 0) {
      Alert.alert('Panier vide', 'Votre panier est vide');
      return;
    }

    navigation.navigate('EcomCheckout');
  };

  const handleClearCart = () => {
    Alert.alert(
      'Vider le panier',
      'Êtes-vous sûr de vouloir vider votre panier ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Vider', style: 'destructive', onPress: clearCart }
      ]
    );
  };

  const renderCartItem = ({ item }) => (
    <View style={[styles.cartItem, { backgroundColor: theme.colors.surface }]}>
      <Image
        source={{ uri: item.image || 'https://via.placeholder.com/80x80?text=Produit' }}
        style={styles.itemImage}
        resizeMode="cover"
      />
      
      <View style={styles.itemInfo}>
        <Text style={[styles.itemName, { color: theme.colors.text }]} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={[styles.itemPrice, { color: theme.colors.primary }]}>
          {formatCurrency(item.price)}
        </Text>
        
        <View style={styles.quantityControls}>
          <TouchableOpacity
            style={[styles.quantityButton, { backgroundColor: theme.colors.border }]}
            onPress={() => handleUpdateQuantity(item.id, item.quantity - 1)}
          >
            <MaterialIcons name="remove" size={16} color={theme.colors.text} />
          </TouchableOpacity>
          
          <Text style={[styles.quantityText, { color: theme.colors.text }]}>
            {item.quantity}
          </Text>
          
          <TouchableOpacity
            style={[styles.quantityButton, { backgroundColor: theme.colors.border }]}
            onPress={() => handleUpdateQuantity(item.id, item.quantity + 1)}
          >
            <MaterialIcons name="add" size={16} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.itemActions}>
        <Text style={[styles.itemTotal, { color: theme.colors.text }]}>
          {formatCurrency(item.price * item.quantity)}
        </Text>
        
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveItem(item.id)}
        >
          <MaterialIcons name="delete" size={20} color={theme.colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const cartTotal = getCartTotal();
  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);

  if (cart.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Panier ({itemCount})
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.emptyContainer}>
          <MaterialIcons name="shopping-cart" size={64} color={theme.colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
            Votre panier est vide
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
            Ajoutez des produits pour commencer vos achats
          </Text>
          
          <TouchableOpacity
            style={[styles.continueShoppingButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => navigation.navigate('EcomProducts')}
          >
            <Text style={styles.continueShoppingButtonText}>
              Continuer mes achats
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Panier ({itemCount})
        </Text>
        {cart.length > 0 && (
          <TouchableOpacity onPress={handleClearCart}>
            <MaterialIcons name="clear-all" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Cart Items */}
      <FlatList
        data={cart}
        renderItem={renderCartItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.cartList}
        showsVerticalScrollIndicator={false}
      />

      {/* Order Summary */}
      <View style={[styles.orderSummary, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
            Sous-total
          </Text>
          <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
            {formatCurrency(cartTotal)}
          </Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
            Livraison
          </Text>
          <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
            {formatCurrency(0)} {/* Calculer les frais de livraison réels */}
          </Text>
        </View>
        
        <View style={[styles.summaryDivider, { borderColor: theme.colors.border }]} />
        
        <View style={styles.summaryRow}>
          <Text style={[styles.totalLabel, { color: theme.colors.text }]}>
            Total
          </Text>
          <Text style={[styles.totalValue, { color: theme.colors.primary }]}>
            {formatCurrency(cartTotal)}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.checkoutButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleCheckout}
          disabled={checkoutLoading}
        >
          <Text style={styles.checkoutButtonText}>
            {checkoutLoading ? 'Traitement...' : 'Passer commande'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  continueShoppingButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  continueShoppingButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cartList: {
    padding: 20,
    paddingBottom: 20,
  },
  cartItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    marginBottom: 8,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 24,
    textAlign: 'center',
  },
  itemActions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  removeButton: {
    padding: 4,
  },
  orderSummary: {
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    boxShadow: '0px -2px 4px rgba(0, 0, 0, 0.1)',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
  },
  summaryValue: {
    fontSize: 16,
  },
  summaryDivider: {
    borderBottomWidth: 1,
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  checkoutButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  checkoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
};

export default EcomCartScreen;

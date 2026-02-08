import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useCart } from '../../contexts/ecom/CartContext';
import { useThemeSafe } from '../../contexts/ThemeContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const EcomCheckoutScreen = ({ navigation }) => {
  const { cart, getTotalPrice, clearCart } = useCart();
  const theme = useThemeSafe();
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    
    try {
      // Simuler le processus de paiement
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Paiement réussi',
        'Votre commande a été confirmée avec succès!',
        [
          {
            text: 'OK',
            onPress: () => {
              clearCart();
              navigation.navigate('EcomProducts');
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue lors du paiement.');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.emptyContainer}>
          <MaterialIcons name="shopping-cart" size={64} color={theme.colors.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            Votre panier est vide
          </Text>
          <TouchableOpacity 
            style={[styles.shopButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => navigation.navigate('EcomProducts')}
          >
            <Text style={styles.shopButtonText}>Continuer vos achats</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Finaliser la commande</Text>
      
      <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Récapitulatif</Text>
        
        {cart.map(item => (
          <View key={item.id} style={styles.cartItem}>
            <View style={styles.itemInfo}>
              <Text style={[styles.itemName, { color: theme.colors.text }]}>{item.name}</Text>
              <Text style={[styles.itemDetails, { color: theme.colors.textSecondary }]}>
                Quantité: {item.quantity}
              </Text>
            </View>
            <Text style={[styles.itemPrice, { color: theme.colors.primary }]}>
              {(item.price * item.quantity).toFixed(2)} €
            </Text>
          </View>
        ))}
        
        <View style={styles.totalContainer}>
          <Text style={[styles.totalLabel, { color: theme.colors.text }]}>Total:</Text>
          <Text style={[styles.totalAmount, { color: theme.colors.primary }]}>
            {getTotalPrice().toFixed(2)} €
          </Text>
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Adresse de livraison</Text>
        <Text style={[styles.addressText, { color: theme.colors.textSecondary }]}>
          123 Rue de la Formation
          {'\n'}75001 Paris, France
        </Text>
      </View>

      <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Méthode de paiement</Text>
        <View style={styles.paymentMethod}>
          <MaterialIcons name="credit-card" size={24} color={theme.colors.primary} />
          <Text style={[styles.paymentText, { color: theme.colors.text }]}>
            Carte bancaire
          </Text>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.checkoutButton, { backgroundColor: theme.colors.primary }]}
        onPress={handleCheckout}
        disabled={loading}
      >
        <Text style={styles.checkoutButtonText}>
          {loading ? 'Traitement...' : 'Confirmer la commande'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    marginTop: 16,
    marginBottom: 24,
  },
  shopButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
  },
  itemDetails: {
    fontSize: 14,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#f0f0f0',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  addressText: {
    fontSize: 16,
    lineHeight: 24,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentText: {
    fontSize: 16,
    marginLeft: 12,
  },
  checkoutButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  checkoutButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default EcomCheckoutScreen;

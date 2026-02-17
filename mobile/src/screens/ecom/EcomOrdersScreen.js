import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useThemeSafe } from '../../contexts/ThemeContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const EcomOrdersScreen = ({ navigation }) => {
  const theme = useThemeSafe();

  const orders = [
    {
      id: 'ORD001',
      date: '08/02/2026',
      status: 'Livré',
      total: 89.99,
      items: 3,
    },
    {
      id: 'ORD002',
      date: '05/02/2026',
      status: 'En cours',
      total: 45.50,
      items: 2,
    },
    {
      id: 'ORD003',
      date: '01/02/2026',
      status: 'Livré',
      total: 120.00,
      items: 5,
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Livré':
        return '#4CAF50';
      case 'En cours':
        return '#FF9800';
      case 'Annulé':
        return '#F44336';
      default:
        return theme.colors.textSecondary;
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Mes commandes</Text>
      
      {orders.map(order => (
        <TouchableOpacity 
          key={order.id}
          style={[styles.orderCard, { backgroundColor: theme.colors.surface }]}
          onPress={() => {
            // Navigation vers les détails de la commande
            console.log('Détails commande:', order.id);
          }}
        >
          <View style={styles.orderHeader}>
            <View>
              <Text style={[styles.orderId, { color: theme.colors.text }]}>
                Commande #{order.id}
              </Text>
              <Text style={[styles.orderDate, { color: theme.colors.textSecondary }]}>
                {order.date}
              </Text>
            </View>
            <View style={[
              styles.statusBadge, 
              { backgroundColor: getStatusColor(order.status) }
            ]}>
              <Text style={styles.statusText}>{order.status}</Text>
            </View>
          </View>
          
          <View style={styles.orderDetails}>
            <View style={styles.detailRow}>
              <MaterialIcons name="shopping-bag" size={20} color={theme.colors.textSecondary} />
              <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
                {order.items} article{order.items > 1 ? 's' : ''}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <MaterialIcons name="euro" size={20} color={theme.colors.primary} />
              <Text style={[styles.totalText, { color: theme.colors.primary }]}>
                {order.total.toFixed(2)} €
              </Text>
            </View>
          </View>
          
          <View style={styles.orderFooter}>
            <Text style={[styles.viewMoreText, { color: theme.colors.primary }]}>
              Voir les détails
            </Text>
            <MaterialIcons name="chevron-right" size={20} color={theme.colors.primary} />
          </View>
        </TouchableOpacity>
      ))}
      
      {orders.length === 0 && (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="receipt" size={64} color={theme.colors.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            Vous n'avez aucune commande
          </Text>
          <TouchableOpacity 
            style={[styles.shopButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => navigation.navigate('EcomProducts')}
          >
            <Text style={styles.shopButtonText}>Commencer vos achats</Text>
          </TouchableOpacity>
        </View>
      )}
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
  orderCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
  },
  orderDate: {
    fontSize: 14,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    marginLeft: 8,
  },
  totalText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  orderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  viewMoreText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
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
    textAlign: 'center',
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
});

export default EcomOrdersScreen;

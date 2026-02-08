import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useThemeSafe } from '../../contexts/ThemeContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const AdminEcomScreen = () => {
  const theme = useThemeSafe();
  const [selectedTab, setSelectedTab] = useState('orders');

  const orders = [
    { id: 'ORD001', customer: 'Jean Dupont', total: 89.99, status: 'delivered', date: '08/02/2024' },
    { id: 'ORD002', customer: 'Marie Martin', total: 45.50, status: 'processing', date: '08/02/2024' },
    { id: 'ORD003', customer: 'Pierre Durand', total: 120.00, status: 'pending', date: '07/02/2024' },
  ];

  const products = [
    { id: 1, name: 'React Native Course', price: 29.99, stock: 100, sales: 45, status: 'active' },
    { id: 2, name: 'JavaScript Avancé', price: 49.99, stock: 50, sales: 32, status: 'active' },
    { id: 3, name: 'React Hooks', price: 39.99, stock: 0, sales: 28, status: 'inactive' },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': case 'active': return '#4CAF50';
      case 'processing': case 'pending': return '#FF9800';
      case 'inactive': return '#F44336';
      default: return theme.colors.textSecondary;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'delivered': return 'Livré';
      case 'processing': return 'En cours';
      case 'pending': return 'En attente';
      case 'active': return 'Actif';
      case 'inactive': return 'Inactif';
      default: return status;
    }
  };

  const renderOrders = () => (
    <View>
      {orders.map(order => (
        <TouchableOpacity key={order.id} style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{order.id}</Text>
              <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
                {order.customer}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
              <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
            </View>
          </View>
          <View style={styles.cardFooter}>
            <Text style={[styles.cardDate, { color: theme.colors.textSecondary }]}>
              {order.date}
            </Text>
            <Text style={[styles.cardAmount, { color: theme.colors.primary }]}>
              {order.total.toFixed(2)} €
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderProducts = () => (
    <View>
      {products.map(product => (
        <TouchableOpacity key={product.id} style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.cardHeader}>
            <View style={styles.productInfo}>
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{product.name}</Text>
              <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
                Stock: {product.stock} | Ventes: {product.sales}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(product.status) }]}>
              <Text style={styles.statusText}>{getStatusText(product.status)}</Text>
            </View>
          </View>
          <View style={styles.cardFooter}>
            <Text style={[styles.cardAmount, { color: theme.colors.primary }]}>
              {product.price.toFixed(2)} €
            </Text>
            <View style={styles.productActions}>
              <TouchableOpacity style={styles.actionButton}>
                <MaterialIcons name="edit" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <MaterialIcons name="visibility" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>E-commerce</Text>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'orders' && { backgroundColor: theme.colors.primary }
          ]}
          onPress={() => setSelectedTab('orders')}
        >
          <Text style={[
            styles.tabText,
            selectedTab === 'orders' && { color: 'white' }
          ]}>
            Commandes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'products' && { backgroundColor: theme.colors.primary }
          ]}
          onPress={() => setSelectedTab('products')}
        >
          <Text style={[
            styles.tabText,
            selectedTab === 'products' && { color: 'white' }
          ]}>
            Produits
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.statNumber, { color: theme.colors.primary }]}>{orders.length}</Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Commandes</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.statNumber, { color: '#4CAF50' }]}>
            {orders.filter(o => o.status === 'delivered').length}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Livrées</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.statNumber, { color: '#FF9800' }]}>
            {products.filter(p => p.stock < 10).length}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Stock faible</Text>
        </View>
      </View>

      {selectedTab === 'orders' ? renderOrders() : renderProducts()}

      <TouchableOpacity style={[styles.addButton, { backgroundColor: theme.colors.primary }]}>
        <MaterialIcons name="add" size={24} color="white" />
        <Text style={styles.addButtonText}>
          {selectedTab === 'orders' ? 'Voir toutes les commandes' : 'Ajouter un produit'}
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  card: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  productInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
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
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardDate: {
    fontSize: 14,
  },
  cardAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  productActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default AdminEcomScreen;

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useEcomAuth } from '../hooks/useEcomAuth';
import { useMoney } from '../hooks/useMoney';
import { ordersApi } from '../services/ecomApi';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const statusLabels = { 
  pending: 'En attente', 
  confirmed: 'Confirmé', 
  shipped: 'Expédié', 
  delivered: 'Livré', 
  returned: 'Retour', 
  cancelled: 'Annulé' 
};

const statusColors = {
  pending: { bg: '#fef3c7', text: '#92400e' },
  confirmed: { bg: '#dbeafe', text: '#1e40af' },
  shipped: { bg: '#ede9fe', text: '#5b21b6' },
  delivered: { bg: '#d1fae5', text: '#065f46' },
  returned: { bg: '#ffedd5', text: '#9a3412' },
  cancelled: { bg: '#fee2e2', text: '#991b1b' }
};

const OrderDetail = ({ navigation, route }) => {
  const { orderId } = route.params || {};
  const { user } = useEcomAuth();
  const { fmt } = useMoney();
  const isAdmin = user?.role === 'ecom_admin';
  
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      const res = await ordersApi.getOrder(orderId);
      setOrder(res.data?.data || res.data);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger la commande');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await ordersApi.updateOrder(orderId, { status: newStatus });
      setOrder({ ...order, status: newStatus });
      Alert.alert('Succès', 'Statut modifié');
    } catch (error) {
      Alert.alert('Erreur', 'Erreur modification statut');
    }
  };

  const handleCall = () => {
    if (order?.clientPhone) {
      Linking.openURL(`tel:${order.clientPhone}`);
    }
  };

  const handleWhatsApp = () => {
    if (order?.clientPhone) {
      const phone = order.clientPhone.replace(/[^0-9]/g, '');
      Linking.openURL(`whatsapp://send?phone=${phone}`);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Commande non trouvée</Text>
      </View>
    );
  }

  const statusStyle = statusColors[order.status] || statusColors.pending;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.title}>Commande</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {statusLabels[order.status] || order.status}
            </Text>
          </View>
        </View>

        {/* Client Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Client</Text>
          <Text style={styles.clientName}>{order.clientName || 'Sans nom'}</Text>
          {order.clientPhone && (
            <View style={styles.contactRow}>
              <MaterialIcons name="phone" size={18} color="#6b7280" />
              <Text style={styles.contactText}>{order.clientPhone}</Text>
              <TouchableOpacity style={styles.contactBtn} onPress={handleCall}>
                <MaterialIcons name="call" size={20} color="#10b981" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.contactBtn} onPress={handleWhatsApp}>
                <MaterialIcons name="chat" size={20} color="#25d366" />
              </TouchableOpacity>
            </View>
          )}
          {order.city && (
            <View style={styles.infoRow}>
              <MaterialIcons name="location-on" size={18} color="#6b7280" />
              <Text style={styles.infoText}>{order.city}</Text>
            </View>
          )}
          {order.address && (
            <Text style={styles.addressText}>{order.address}</Text>
          )}
        </View>

        {/* Order Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Détails commande</Text>
          
          {order.product && (
            <View style={styles.infoRow}>
              <MaterialIcons name="shopping-bag" size={18} color="#6b7280" />
              <Text style={styles.infoText}>{order.product}</Text>
            </View>
          )}
          
          <View style={styles.priceRow}>
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>Prix</Text>
              <Text style={styles.priceValue}>{fmt(order.price || 0)}</Text>
            </View>
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>Quantité</Text>
              <Text style={styles.priceValue}>{order.quantity || 1}</Text>
            </View>
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>Total</Text>
              <Text style={styles.priceValueBold}>{fmt((order.price || 0) * (order.quantity || 1))}</Text>
            </View>
          </View>

          {order.date && (
            <View style={styles.infoRow}>
              <MaterialIcons name="event" size={18} color="#6b7280" />
              <Text style={styles.infoText}>
                {new Date(order.date).toLocaleDateString('fr-FR', { 
                  day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                })}
              </Text>
            </View>
          )}
        </View>

        {/* Raw Data from Sheet */}
        {order.rawData && Object.keys(order.rawData).length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Données Sheet</Text>
            {Object.entries(order.rawData).map(([key, value]) => (
              <View key={key} style={styles.rawDataRow}>
                <Text style={styles.rawDataKey}>{key}</Text>
                <Text style={styles.rawDataValue}>{String(value || '-')}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Status Change */}
        {isAdmin && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Changer le statut</Text>
            <View style={styles.statusGrid}>
              {Object.entries(statusLabels).map(([key, label]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.statusBtn,
                    order.status === key && { backgroundColor: statusColors[key].bg }
                  ]}
                  onPress={() => handleStatusChange(key)}
                >
                  <Text style={[
                    styles.statusBtnText,
                    order.status === key && { color: statusColors[key].text, fontWeight: '600' }
                  ]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Tags */}
        {order.tags && order.tags.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tags</Text>
            <View style={styles.tagsRow}>
              {order.tags.map(tag => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
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
    backgroundColor: '#f9fafb',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  clientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
  },
  contactBtn: {
    padding: 8,
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
  },
  addressText: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
  },
  priceRow: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginVertical: 12,
  },
  priceItem: {
    flex: 1,
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 16,
    color: '#111827',
  },
  priceValueBold: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  rawDataRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  rawDataKey: {
    width: 120,
    fontSize: 12,
    color: '#6b7280',
  },
  rawDataValue: {
    flex: 1,
    fontSize: 12,
    color: '#111827',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  statusBtnText: {
    fontSize: 12,
    color: '#6b7280',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: '#4f46e5',
  },
});

export default OrderDetail;

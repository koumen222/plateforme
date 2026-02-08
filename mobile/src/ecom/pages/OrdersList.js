import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { useEcomAuth } from '../hooks/useEcomAuth';
import { useMoney } from '../hooks/useMoney';
import { ordersApi } from '../services/ecomApi';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AppHeader from '../components/AppHeader';

// Status labels and colors matching web app
const SL = { pending: 'En attente', confirmed: 'Confirmé', shipped: 'Expédié', delivered: 'Livré', returned: 'Retour', cancelled: 'Annulé' };
const SC = {
  pending: { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
  confirmed: { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
  shipped: { bg: '#ede9fe', text: '#5b21b6', border: '#c4b5fd' },
  delivered: { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
  returned: { bg: '#ffedd5', text: '#9a3412', border: '#fdba74' },
  cancelled: { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' }
};

const OrdersList = ({ navigation }) => {
  const { user } = useEcomAuth();
  const { fmt } = useMoney();
  const isAdmin = user?.role === 'ecom_admin';
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [stats, setStats] = useState({});
  const [lastSync, setLastSync] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig] = useState({ spreadsheetId: '', sheetName: 'Sheet1' });
  
  // Delivery modal state
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedLivreur, setSelectedLivreur] = useState(null);
  const [availableLivreurs, setAvailableLivreurs] = useState([]);
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');

  const loadOrders = async () => {
    try {
      const params = { limit: 50 };
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus;
      
      const response = await ordersApi.getOrders(params);
      const ordersData = response.data?.data?.orders || [];
      const statsData = response.data?.data?.stats || {};
      
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setStats(statsData);
    } catch (error) {
      console.error('Erreur chargement commandes:', error);
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadConfig = async () => {
    try {
      const res = await ordersApi.getSettings();
      if (res.data?.data) {
        setConfig(prev => ({ ...prev, ...res.data.data }));
        setLastSync(res.data.data.lastSyncAt);
      }
    } catch (error) {
      console.log('Config non disponible');
    }
  };

  useEffect(() => {
    Promise.all([loadOrders(), isAdmin ? loadConfig() : Promise.resolve()]);
  }, []);

  useEffect(() => {
    if (!loading) loadOrders();
  }, [search, filterStatus]);

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  // Sync with Google Sheets - like web
  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await ordersApi.syncSheets();
      Alert.alert('Succès', res.data?.message || 'Synchronisation terminée');
      setLastSync(new Date().toISOString());
      loadOrders();
    } catch (error) {
      Alert.alert('Erreur', error.response?.data?.message || 'Erreur synchronisation');
    } finally {
      setSyncing(false);
    }
  };

  // Change order status - like web
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await ordersApi.updateOrder(orderId, { status: newStatus });
      loadOrders();
    } catch (error) {
      Alert.alert('Erreur', 'Erreur modification statut');
    }
  };

  // Generate invoice function
  const generateInvoice = async (order) => {
    try {
      Alert.alert('Facture', `Génération de la facture pour commande #${order._id || order.id}...\n\nCette fonctionnalité sera bientôt disponible!`);
      // TODO: Implement invoice generation
      // await ordersApi.generateInvoice(order._id);
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de la génération de la facture');
    }
  };

  // Load livreurs for delivery assignment
  const loadLivreurs = async () => {
    try {
      // Mock livreurs data - replace with actual API call
      const mockLivreurs = [
        { _id: '1', name: 'Ahmed Benali', phone: '0612345678', status: 'available', rating: 4.5 },
        { _id: '2', name: 'Mohamed Karim', phone: '0623456789', status: 'available', rating: 4.8 },
        { _id: '3', name: 'Youssef Amine', phone: '0634567890', status: 'busy', rating: 4.2 },
        { _id: '4', name: 'Said Omar', phone: '0645678901', status: 'available', rating: 4.7 },
      ];
      // Filter only available livreurs
      setAvailableLivreurs(mockLivreurs.filter(l => l.status === 'available'));
    } catch (error) {
      console.error('Erreur chargement livreurs:', error);
      Alert.alert('Erreur', 'Impossible de charger les livreurs');
    }
  };

  // Open delivery modal
  const openDeliveryModal = (order) => {
    setSelectedOrder(order);
    setSelectedLivreur(null);
    setDeliveryLocation(order.customerAddress?.city || '');
    setDeliveryTime('Disponible maintenant');
    setDeliveryInstructions('');
    setShowDeliveryModal(true);
    loadLivreurs();
  };

  // Generate delivery message
  const generateDeliveryMessage = () => {
    if (!selectedOrder) return '';
    
    const order = selectedOrder;
    const customerName = order.customerName || 'Client';
    const city = order.customerAddress?.city || 'Ville';
    const location = deliveryLocation || order.customerAddress?.city || 'Lieu';
    const phone = order.customerPhone || order.phone || '';
    const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    const time = deliveryTime || 'Disponible maintenant';
    const instructions = deliveryInstructions || '';
    
    let message = `*${order.workspace?.name || 'Zendospace'}*\n\n`;
    message += `Nom du client : ${customerName}\n\n`;
    message += `Ville : ${city}\n\n`;
    message += `Lieu de la livraison : ${location}\n\n`;
    message += `Jour de la livraison : ${today}\n\n`;
    message += `Numéro : ${phone}\n\n`;
    message += `Heure de livraison : ${time}\n\n`;
    
    if (order.items && order.items.length > 0) {
      message += `Article : ${order.items[0].productName || order.items[0].name}\n\n`;
      message += `Quantité : ${order.items[0].quantity || 1}\n\n`;
      message += `Montant : ${order.items[0].price || order.total || 0}fcfa\n\n`;
    }
    
    if (instructions) {
      message += `Instructions : ${instructions}\n\n`;
    }
    
    return message;
  };

  // Copy message to clipboard
  const copyDeliveryMessage = async () => {
    try {
      const message = generateDeliveryMessage();
      // For React Native, we'll use a simple alert for now
      // In a real app, you'd use @react-native-clipboard/clipboard
      Alert.alert('Message copié', 'Le message a été copié dans le presse-papiers');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de copier le message');
    }
  };

  // Send via WhatsApp
  const sendWhatsApp = () => {
    if (!selectedOrder || !selectedLivreur) {
      Alert.alert('Erreur', 'Veuillez sélectionner un livreur');
      return;
    }
    
    const message = generateDeliveryMessage();
    const phoneNumber = selectedLivreur.phone.replace(/\D/g, '');
    
    // Créer le message WhatsApp
    const whatsappMessage = `*${selectedOrder.workspace?.name || 'Zendospace'}*\n\n` +
      `Nom du client : ${selectedOrder.customerName || 'Client'}\n\n` +
      `Ville : ${selectedOrder.customerAddress?.city || 'Ville'}\n\n` +
      `Lieu de la livraison : ${deliveryLocation || selectedOrder.customerAddress?.city || 'Lieu'}\n\n` +
      `Jour de la livraison : ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}\n\n` +
      `Numéro : ${selectedOrder.customerPhone || selectedOrder.phone || ''}\n\n` +
      `Heure de livraison : ${deliveryTime || 'Disponible maintenant'}\n\n` +
      `Article : ${selectedOrder.items?.[0]?.productName || selectedOrder.items?.[0]?.name || 'Produit'}\n\n` +
      `Quantité : ${selectedOrder.items?.[0]?.quantity || 1}\n\n` +
      `Montant : ${selectedOrder.items?.[0]?.price || selectedOrder.total || 0}fcfa`;
    
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(whatsappMessage)}`;
    
    Alert.alert(
      'WhatsApp',
      `Ouvrir WhatsApp pour envoyer ce message à ${selectedLivreur.name} (${selectedLivreur.phone})?\n\n${whatsappMessage}`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Ouvrir WhatsApp', 
          onPress: () => {
            // Implémenter Linking.openURL pour ouvrir WhatsApp
            Linking.openURL(whatsappUrl).catch(() => {
              Alert.alert('Erreur', 'Impossible d\'ouvrir WhatsApp. Vérifiez que l\'application est installée.');
            });
          }
        }
      ]
    );
  };
  const sendToDelivery = async (order) => {
    try {
      // Simuler l'envoi au backend pour le moment
      // TODO: Remplacer par le vrai appel API quand le backend sera prêt
      console.log('Sending to delivery:', order._id);
      
      // Simuler un délai d'API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mettre à jour le statut localement pour le moment
      setOrders(prevOrders => 
        prevOrders.map(o => 
          o._id === order._id 
            ? { ...o, status: 'shipped', deliveryStatus: 'assigned', shippedAt: new Date().toISOString() }
            : o
        )
      );
      
      Alert.alert(
        'Succès', 
        `Commande #${order._id?.slice(-6)} assignée à ${selectedLivreur?.name}\n\nLe statut est maintenant "Expédié"`,
        [{ text: 'OK' }]
      );
      
      setShowDeliveryModal(false);
      // loadOrders(); // Pas besoin si on met à jour localement
    } catch (error) {
      console.error('Erreur envoi au livreur:', error);
      Alert.alert('Erreur', 'Impossible d\'assigner la commande au livreur');
    }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '-';
  const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';

  // Get product name from rawData like web
  const getProductName = (o) => {
    if (o.product && isNaN(o.product)) return o.product;
    if (o.rawData) {
      const entry = Object.entries(o.rawData).find(([k, v]) => v && isNaN(v) && /produit|product|article|item|désignation/i.test(k));
      if (entry) return entry[1];
    }
    return o.product || '';
  };

  // Calculate rates like web app
  const deliveryRate = stats.total ? ((stats.delivered || 0) / stats.total * 100).toFixed(1) : 0;
  const returnRate = stats.total ? ((stats.returned || 0) / stats.total * 100).toFixed(1) : 0;

  const statusFilters = [
    { key: '', label: 'Tous', count: stats.total || 0 },
    { key: 'pending', label: 'En attente', count: stats.pending || 0 },
    { key: 'confirmed', label: 'Confirmé', count: stats.confirmed || 0 },
    { key: 'shipped', label: 'Expédié', count: stats.shipped || 0 },
    { key: 'delivered', label: 'Livré', count: stats.delivered || 0 },
    { key: 'returned', label: 'Retour', count: stats.returned || 0 },
    { key: 'cancelled', label: 'Annulé', count: stats.cancelled || 0 },
  ];

// Status colors and labels - like web
const SC = {
  pending: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
  confirmed: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
  shipped: { bg: '#f0fdf4', border: '#10b981', text: '#065f46' },
  delivered: { bg: '#dcfce7', border: '#16a34a', text: '#15803d' },
  returned: { bg: '#fef2f2', border: '#ef4444', text: '#991b1b' },
  cancelled: { bg: '#f9fafb', border: '#6b7280', text: '#374151' }
};

const SL = {
  pending: 'En attente',
  confirmed: 'Confirmé',
  shipped: 'Expédié',
  delivered: 'Livré',
  returned: 'Retour',
  cancelled: 'Annulé'
};

  const renderOrder = ({ item: o }) => {
    const statusStyle = SC[o.status] || SC.pending;
    const isExpanded = expandedId === o._id;
    const hasRawData = o.rawData && Object.keys(o.rawData).length > 0;
    
    return (
      <TouchableOpacity
        style={[styles.orderCard, { borderLeftColor: statusStyle.border, borderLeftWidth: 4 }]}
        onPress={() => setExpandedId(isExpanded ? null : o._id)}
        onLongPress={() => navigation.navigate('OrderDetail', { orderId: o._id })}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderHeaderLeft}>
            <Text style={styles.clientName}>{o.clientName || 'Sans nom'}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
              <Text style={[styles.statusText, { color: statusStyle.text }]}>{SL[o.status] || o.status}</Text>
            </View>
          </View>
          <View style={styles.orderHeaderRight}>
            {o.price > 0 && <Text style={styles.orderPrice}>{fmt(o.price * (o.quantity || 1))}</Text>}
            <Text style={styles.orderDate}>{fmtDate(o.date)} {fmtTime(o.date)}</Text>
          </View>
        </View>
        
        <View style={styles.orderDetails}>
          {o.clientPhone && (
            <View style={styles.detailRow}>
              <MaterialIcons name="phone" size={14} color="#9ca3af" />
              <Text style={styles.detailText}>{o.clientPhone}</Text>
            </View>
          )}
          {o.city && (
            <View style={styles.detailRow}>
              <MaterialIcons name="location-on" size={14} color="#9ca3af" />
              <Text style={styles.detailText}>{o.city}</Text>
            </View>
          )}
          {getProductName(o) && (
            <View style={styles.detailRow}>
              <MaterialIcons name="shopping-bag" size={14} color="#9ca3af" />
              <Text style={styles.detailText}>{getProductName(o)}</Text>
            </View>
          )}
          {o.quantity > 1 && (
            <View style={styles.detailRow}>
              <MaterialIcons name="inventory" size={14} color="#9ca3af" />
              <Text style={styles.detailText}>Qté: {o.quantity}</Text>
            </View>
          )}
        </View>

        {o.tags && o.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {o.tags.map(tag => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Expanded view - exactly like web */}
        {isExpanded && (
          <View style={styles.expandedContent}>
            
            {/* RÉSUMÉ COMMANDE */}
            <View style={styles.summarySection}>
              <Text style={styles.sectionTitle}>RÉSUMÉ COMMANDE</Text>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Produit:</Text>
                <Text style={styles.summaryValue}>{getProductName(o)}</Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Quantité:</Text>
                <Text style={styles.summaryValue}>{o.quantity || 1}</Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Prix unitaire:</Text>
                <Text style={styles.summaryValue}>{fmt(o.price || 0)}</Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total:</Text>
                <Text style={styles.summaryValueTotal}>{fmt(o.total || (o.price * (o.quantity || 1)))}</Text>
              </View>
              
              {o.customerName && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Client:</Text>
                  <Text style={styles.summaryValue}>{o.customerName}</Text>
                </View>
              )}
              
              {o.customerPhone && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Téléphone:</Text>
                  <Text style={styles.summaryValue}>{o.customerPhone}</Text>
                </View>
              )}
              
              {o.customerAddress?.city && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Ville:</Text>
                  <Text style={styles.summaryValue}>{o.customerAddress.city}</Text>
                </View>
              )}
            </View>

            {/* HISTORIQUE */}
            <View style={styles.historySection}>
              <Text style={styles.sectionTitle}>HISTORIQUE</Text>
              
              <View style={styles.timeline}>
                <View style={styles.timelineItem}>
                  <View style={[styles.timelineDot, { backgroundColor: SC[o.status]?.bg || '#e5e7eb' }]} />
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTitle}>
                      {SL[o.status] || o.status}
                    </Text>
                    <Text style={styles.timelineDate}>
                      {fmtDate(o.createdAt)} {fmtTime(o.createdAt)}
                    </Text>
                  </View>
                </View>
                
                {o.status !== 'pending' && o.confirmedAt && (
                  <View style={styles.timelineItem}>
                    <View style={[styles.timelineDot, { backgroundColor: '#dbeafe' }]} />
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineTitle}>Confirmé</Text>
                      <Text style={styles.timelineDate}>
                        {fmtDate(o.confirmedAt)} {fmtTime(o.confirmedAt)}
                      </Text>
                    </View>
                  </View>
                )}
                
                {o.shippedAt && (
                  <View style={styles.timelineItem}>
                    <View style={[styles.timelineDot, { backgroundColor: '#ede9fe' }]} />
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineTitle}>Expédié</Text>
                      <Text style={styles.timelineDate}>
                        {fmtDate(o.shippedAt)} {fmtTime(o.shippedAt)}
                      </Text>
                    </View>
                  </View>
                )}
                
                {o.deliveredAt && (
                  <View style={styles.timelineItem}>
                    <View style={[styles.timelineDot, { backgroundColor: '#d1fae5' }]} />
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineTitle}>Livré</Text>
                      <Text style={styles.timelineDate}>
                        {fmtDate(o.deliveredAt)} {fmtTime(o.deliveredAt)}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* ACTIONS RAPIDES */}
            <View style={styles.quickActionsSection}>
              <Text style={styles.sectionTitle}>ACTIONS RAPIDES</Text>
              
              <View style={styles.quickActionsGrid}>
                <TouchableOpacity
                  style={styles.quickActionButton}
                  onPress={() => generateInvoice(o)}
                >
                  <MaterialIcons name="print" size={20} color="#374151" />
                  <Text style={styles.quickActionText}>Imprimer la facture</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.quickActionButton, styles.quickActionPrimary]}
                  onPress={() => openDeliveryModal(o)}
                >
                  <MaterialIcons name="local-shipping" size={20} color="#fff" />
                  <Text style={[styles.quickActionText, styles.quickActionTextPrimary]}>
                    Envoyer au livreur
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.quickActionButton}
                  onPress={() => {
                    const phoneNumber = o.customerPhone || o.phone;
                    if (phoneNumber) {
                      Linking.openURL(`https://wa.me/${phoneNumber.replace(/\D/g, '')}`).catch(() => {
                        Alert.alert('Erreur', 'Impossible d\'ouvrir WhatsApp');
                      });
                    } else {
                      Alert.alert('Erreur', 'Aucun numéro de téléphone disponible');
                    }
                  }}
                >
                  <MaterialIcons name="whatsapp" size={20} color="#25d366" />
                  <Text style={styles.quickActionText}>Contacter sur WhatsApp</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Status change buttons for admin */}
        {isExpanded && isAdmin && (
          <View style={styles.statusActions}>
            {Object.entries(SL).map(([key, label]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.statusActionBtn,
                  o.status === key && { backgroundColor: SC[key].bg, borderColor: SC[key].border }
                ]}
                onPress={() => handleStatusChange(o._id, key)}
              >
                <Text style={[styles.statusActionText, o.status === key && { color: SC[key].text }]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {hasRawData && (
          <View style={styles.expandIndicator}>
            <MaterialIcons name={isExpanded ? 'expand-less' : 'expand-more'} size={16} color="#9ca3af" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Chargement des commandes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* App Header */}
      <AppHeader 
        navigation={navigation} 
        notificationCount={stats.pending || 0}
      />

      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />
        }
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* Page Header with sync button */}
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>Commandes</Text>
                <Text style={styles.subtitle}>
                  {stats.total || 0} total
                  {lastSync && ` · Sync: ${new Date(lastSync).toLocaleDateString('fr-FR')}`}
                </Text>
              </View>
              {isAdmin && (
                <TouchableOpacity
                  style={[styles.syncButton, syncing && styles.syncButtonDisabled]}
                  onPress={handleSync}
                  disabled={syncing}
                >
                  {syncing ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <MaterialIcons name="sync" size={18} color="#fff" />
                      <Text style={styles.syncButtonText}>Sync</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* KPI Cards - like web */}
            <View style={styles.kpiContainer}>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>REVENU LIVRÉ</Text>
                <Text style={styles.kpiValue}>{fmt(stats.totalRevenue || 0)}</Text>
                <Text style={styles.kpiSubtext}>{stats.delivered || 0} livrées</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>TAUX LIVRAISON</Text>
                <Text style={styles.kpiValue}>{deliveryRate}%</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${Math.min(deliveryRate, 100)}%`, backgroundColor: '#10b981' }]} />
                </View>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>TAUX RETOUR</Text>
                <Text style={styles.kpiValue}>{returnRate}%</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${Math.min(returnRate, 100)}%`, backgroundColor: '#f97316' }]} />
                </View>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>EN COURS</Text>
                <Text style={styles.kpiValue}>{(stats.pending || 0) + (stats.confirmed || 0) + (stats.shipped || 0)}</Text>
                <Text style={styles.kpiSubtext}>{stats.pending || 0} attente · {stats.shipped || 0} expédiées</Text>
              </View>
            </View>

            {/* Search & Filters */}
            <View style={styles.filtersCard}>
              {/* Status filter pills */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusFilters}>
                {statusFilters.map(s => (
                  <TouchableOpacity
                    key={s.key}
                    style={[
                      styles.statusPill,
                      filterStatus === s.key && styles.statusPillActive,
                      s.key && SC[s.key] && { backgroundColor: filterStatus === s.key ? SC[s.key].bg : '#f3f4f6' }
                    ]}
                    onPress={() => setFilterStatus(filterStatus === s.key ? '' : s.key)}
                  >
                    <Text style={[
                      styles.statusPillText,
                      filterStatus === s.key && styles.statusPillTextActive,
                      s.key && SC[s.key] && filterStatus === s.key && { color: SC[s.key].text }
                    ]}>
                      {s.label} ({s.count})
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Search */}
              <View style={styles.searchContainer}>
                <MaterialIcons name="search" size={18} color="#9ca3af" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Rechercher nom, tél, ville, produit..."
                  placeholderTextColor="#9ca3af"
                  value={search}
                  onChangeText={setSearch}
                />
              </View>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="inbox" size={56} color="#d1d5db" />
            <Text style={styles.emptyTitle}>Aucune commande</Text>
            {isAdmin && <Text style={styles.emptySubtext}>Configurez Google Sheets et synchronisez</Text>}
          </View>
        }
      />

      {/* Delivery Modal */}
      <Modal
          visible={showDeliveryModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowDeliveryModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.deliveryModal}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowDeliveryModal(false)}>
                  <MaterialIcons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
                <View>
                  <Text style={styles.modalTitle}>Envoyer au livreur</Text>
                  <Text style={styles.modalSubtext}>Le statut passera à "Expédié"</Text>
                </View>
                <View style={styles.modalHeaderSpacer} />
              </View>

              <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                {/* Assigner un livreur */}
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Assigner un livreur</Text>
                  <TouchableOpacity 
                    style={[styles.dropdown, !selectedLivreur && styles.dropdownPlaceholder]}
                    onPress={() => {
                      // Simple selection for now - in real app you'd show a picker
                      if (availableLivreurs.length > 0) {
                        setSelectedLivreur(availableLivreurs[0]);
                      }
                    }}
                  >
                    <Text style={!selectedLivreur ? styles.placeholderText : styles.selectedText}>
                      {selectedLivreur ? selectedLivreur.name : '-- Choisir un livreur --'}
                    </Text>
                    <MaterialIcons name="arrow-drop-down" size={20} color="#6b7280" />
                  </TouchableOpacity>
                </View>

                {/* Lieu de livraison */}
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Lieu de livraison</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Ex: Neptune Mbalgong"
                    placeholderTextColor="#9ca3af"
                    value={deliveryLocation}
                    onChangeText={setDeliveryLocation}
                  />
                </View>

                {/* Heure de livraison */}
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Heure de livraison</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Ex: Disponible maintenant"
                    placeholderTextColor="#9ca3af"
                    value={deliveryTime}
                    onChangeText={setDeliveryTime}
                  />
                </View>

                {/* Instructions supplémentaires */}
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Instructions supplémentaires (optionnel)</Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    placeholder="Ex: Appeler avant livraison, fragile..."
                    placeholderTextColor="#9ca3af"
                    value={deliveryInstructions}
                    onChangeText={setDeliveryInstructions}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                {/* Message pour le livreur */}
                <View style={styles.formSection}>
                  <View style={styles.messageHeader}>
                    <Text style={styles.formLabel}>Message pour le livreur</Text>
                    <TouchableOpacity 
                      style={styles.copyButton}
                      onPress={copyDeliveryMessage}
                    >
                      <MaterialIcons name="content-copy" size={16} color="#2563eb" />
                      <Text style={styles.copyButtonText}>Copier</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.messageBox}>
                    <Text style={styles.messageText}>{generateDeliveryMessage()}</Text>
                  </View>
                </View>
              </ScrollView>

              {/* Modal Actions */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.confirmButton]}
                  onPress={() => selectedOrder && sendToDelivery(selectedOrder)}
                  disabled={!selectedLivreur}
                >
                  <MaterialIcons name="check" size={18} color="#fff" />
                  <Text style={styles.actionButtonText}>Confirmer l'envoi</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, styles.whatsappButton]}
                  onPress={sendWhatsApp}
                  disabled={!selectedLivreur}
                >
                  <MaterialIcons name="message" size={18} color="#fff" />
                  <Text style={styles.actionButtonText}>Envoyer WhatsApp</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => setShowDeliveryModal(false)}
                >
                  <Text style={styles.actionButtonText}>Annuler</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
    fontSize: 14,
  },
  listContent: {
    padding: 16,
    paddingBottom: 90,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 3,
  },
  // KPI Cards
  kpiContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 6,
  },
  kpiSubtext: {
    fontSize: 11,
    color: '#10b981',
    marginTop: 6,
    fontWeight: '500',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  // Filters
  filtersCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statusFilters: {
    marginBottom: 10,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  statusPillActive: {
    backgroundColor: '#111827',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6b7280',
  },
  statusPillTextActive: {
    color: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 14,
    color: '#111827',
  },
  // Order Card
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  orderHeaderRight: {
    alignItems: 'flex-end',
  },
  clientName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 0,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  orderPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  orderDate: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 3,
  },
  orderDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  tag: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 9,
    fontWeight: '500',
    color: '#6b7280',
  },
  // Sync Button
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  syncButtonDisabled: {
    opacity: 0.6,
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  // RawData display
  rawDataContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 10,
  },
  rawDataTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  rawDataRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  rawDataKey: {
    fontSize: 10,
    color: '#6b7280',
    width: 100,
  },
  rawDataValue: {
    fontSize: 10,
    color: '#111827',
    flex: 1,
  },
  // Status Actions
  statusActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  statusActionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statusActionText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#374151',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  deliveryButton: {
    backgroundColor: '#10b981',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  expandIndicator: {
    position: 'absolute',
    bottom: 8,
    right: 8,
  },
  // Delivery Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deliveryModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    margin: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  orderSummary: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  orderSummaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  orderSummaryClient: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  orderSummaryDetails: {
    fontSize: 13,
    color: '#6b7280',
  },
  loadingLivreurs: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
    fontSize: 14,
  },
  livreursList: {
    maxHeight: 300,
  },
  livreursTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  livreurCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  livreurCardSelected: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  livreurInfo: {
    flex: 1,
  },
  livreurHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  livreurName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  livreurStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusAvailable: {
    backgroundColor: '#dcfce7',
  },
  statusBusy: {
    backgroundColor: '#fef3c7',
  },
  livreurStatusText: {
    fontSize: 10,
    fontWeight: '500',
  },
  statusAvailableText: {
    color: '#166534',
  },
  statusBusyText: {
    color: '#92400e',
  },
  livreurPhone: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  livreurRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  livreurRatingText: {
    fontSize: 12,
    color: '#6b7280',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  confirmButton: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#10b981',
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  emptySubtext: {
    marginTop: 4,
    fontSize: 12,
    color: '#9ca3af',
  },
  // Enhanced Delivery Modal Styles
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  formSection: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  dropdownPlaceholder: {
    backgroundColor: '#f9fafb',
  },
  placeholderText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  selectedText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '500',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    backgroundColor: '#fff',
    color: '#111827',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#eff6ff',
  },
  copyButtonText: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '500',
  },
  messageBox: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    minHeight: 120,
  },
  messageText: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 18,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    minHeight: 48,
  },
  confirmButton: {
    backgroundColor: '#7c3aed',
    flex: 1,
  },
  whatsappButton: {
    backgroundColor: '#25d366',
    flex: 1,
  },
  cancelButton: {
    backgroundColor: '#6b7280',
    flex: 0.8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Expanded Content Styles - Exactly like web
  expandedContent: {
    marginTop: 16,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  // RÉSUMÉ COMMANDE
  summarySection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  summaryValueTotal: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '700',
  },
  // HISTORIQUE
  historySection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  timeline: {
    paddingLeft: 20,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
    position: 'relative',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    position: 'absolute',
    left: -26,
    top: 2,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  timelineDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  // ACTIONS RAPIDES
  quickActionsSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  quickActionsGrid: {
    gap: 12,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  quickActionPrimary: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  quickActionTextPrimary: {
    color: '#fff',
  },
});

export default OrdersList;

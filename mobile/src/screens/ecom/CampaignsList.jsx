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

const CampaignsList = ({ navigation }) => {
  const { user } = useEcomAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const response = await ecomApi.campaigns.getAll();
      setCampaigns(response.data.data || []);
    } catch (error) {
      console.error('Erreur chargement campagnes:', error);
      Alert.alert('Erreur', 'Impossible de charger les campagnes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCampaigns();
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: '#6b7280',
      scheduled: '#f59e0b',
      active: '#10b981',
      paused: '#ef4444',
      completed: '#10b981'
    };
    return colors[status] || '#6b7280';
  };

  const renderCampaign = ({ item }) => (
    <TouchableOpacity
      style={styles.campaignCard}
      onPress={() => navigation.navigate('CampaignDetail', { campaignId: item._id })}
    >
      <View style={styles.campaignHeader}>
        <View style={styles.campaignInfo}>
          <Text style={styles.campaignTitle}>{item.title}</Text>
          <Text style={styles.campaignDate}>
            {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <View style={styles.campaignContent}>
        <Text style={styles.campaignDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.campaignMetrics}>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{item.sentCount || 0}</Text>
            <Text style={styles.metricLabel}>Envoyés</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{item.openedCount || 0}</Text>
            <Text style={styles.metricLabel}>Ouverts</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>
              {item.conversionRate ? `${item.conversionRate}%` : '0%'}
            </Text>
            <Text style={styles.metricLabel}>Taux de conversion</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.campaignFooter}>
        <Text style={styles.campaignTime}>
          Créé le {new Date(item.createdAt).toLocaleDateString()}
        </Text>
        <View style={styles.campaignActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#3b82f6' }]}
            onPress={() => navigation.navigate('CampaignForm', { campaignId: item._id })}
          >
            <MaterialIcons name="edit" size={16} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#ef4444' }]}
            onPress={() => handleDeleteCampaign(item._id)}
          >
            <MaterialIcons name="delete" size={16} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const handleDeleteCampaign = (campaignId) => {
    Alert.alert(
      'Supprimer la campagne',
      'Êtes-vous sûr de vouloir supprimer cette campagne ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: async () => {
            try {
              await ecomApi.campaigns.delete(campaignId);
              Alert.alert('Succès', 'Campagne supprimée');
              loadCampaigns();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer la campagne');
            }
          }
        }
      ]
    );
  };

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#3b82f6" />
      <Text style={styles.loadingText}>Chargement des campagnes...</Text>
    </View>
  );

  if (loading) {
    return renderLoading();
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Campagnes Marketing</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('CampaignForm')}
        >
          <MaterialIcons name="add" size={20} color="white" />
          <Text style={styles.addButtonText}>Nouvelle</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <MaterialIcons name="campaign" size={24} color="#3b82f6" />
          <Text style={styles.statValue}>{campaigns.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialIcons name="play-circle" size={24} color="#10b981" />
          <Text style={styles.statValue}>
            {campaigns.filter(c => c.status === 'active').length}
          </Text>
          <Text style={styles.statLabel}>Actives</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialIcons name="trending-up" size={24} color="#f59e0b" />
          <Text style={styles.statValue}>
            {campaigns.reduce((sum, c) => sum + (c.openedCount || 0), 0)}
          </Text>
          <Text style={styles.statLabel}>Total ouvertures</Text>
        </View>
      </View>

      <FlatList
        data={campaigns}
        renderItem={renderCampaign}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="campaign" size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>Aucune campagne trouvée</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate('CampaignForm')}
            >
              <Text style={styles.emptyButtonText}>Créer une campagne</Text>
            </TouchableOpacity>
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
  campaignCard: {
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
  campaignHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  campaignInfo: {
    flex: 1,
  },
  campaignTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  campaignDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  campaignContent: {
    marginBottom: 12,
  },
  campaignDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  campaignMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  metric: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  metricLabel: {
    fontSize: 10,
    color: '#6b7280',
  },
  campaignFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
  },
  campaignTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  campaignActions: {
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
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CampaignsList;

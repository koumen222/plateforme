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
} from 'react-native';
import { useThemeSafe } from '../../utils/useThemeSafe';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const CampaignsListScreen = ({ navigation }) => {
  const theme = useThemeSafe();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      // Simuler le chargement des campagnes
      const mockCampaigns = [
        {
          id: 1,
          name: 'Campagne Printemps 2024',
          status: 'active',
          startDate: '2024-03-01',
          endDate: '2024-03-31',
          budget: 5000,
          spent: 3200,
          clients: 156,
        },
        {
          id: 2,
          name: 'Promotion Été',
          status: 'scheduled',
          startDate: '2024-06-01',
          endDate: '2024-08-31',
          budget: 8000,
          spent: 0,
          clients: 0,
        },
        {
          id: 3,
          name: 'Ventes Privées',
          status: 'completed',
          startDate: '2024-01-15',
          endDate: '2024-01-30',
          budget: 3000,
          spent: 2800,
          clients: 89,
        },
      ];
      setCampaigns(mockCampaigns);
    } catch (error) {
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
    switch (status) {
      case 'active':
        return theme.colors.success;
      case 'scheduled':
        return theme.colors.warning;
      case 'completed':
        return theme.colors.primary;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'scheduled':
        return 'Planifiée';
      case 'completed':
        return 'Terminée';
      default:
        return status;
    }
  };

  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.name.toLowerCase().includes(search.toLowerCase())
  );

  const renderCampaignItem = (campaign) => (
    <TouchableOpacity
      key={campaign.id}
      style={[styles.campaignCard, { backgroundColor: theme.colors.surface }]}
      onPress={() => navigation.navigate('CampaignDetail', { campaignId: campaign.id })}
    >
      <View style={styles.campaignHeader}>
        <Text style={[styles.campaignName, { color: theme.colors.text }]}>
          {campaign.name}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(campaign.status) }]}>
          <Text style={styles.statusText}>{getStatusText(campaign.status)}</Text>
        </View>
      </View>

      <View style={styles.campaignInfo}>
        <View style={styles.infoRow}>
          <MaterialIcons name="calendar-today" size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            {campaign.startDate} - {campaign.endDate}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <MaterialIcons name="account" size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            {campaign.clients} clients
          </Text>
        </View>

        <View style={styles.infoRow}>
          <MaterialIcons name="currency-euro" size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            {campaign.spent}€ / {campaign.budget}€
          </Text>
        </View>
      </View>

      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill, 
            { 
              backgroundColor: theme.colors.primary,
              width: `${(campaign.spent / campaign.budget) * 100}%`
            }
          ]} 
        />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Campagnes Marketing
        </Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => navigation.navigate('CampaignForm')}
        >
          <MaterialIcons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface }]}>
        <MaterialIcons name="search" size={20} color={theme.colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text }]}
          placeholder="Rechercher une campagne..."
          placeholderTextColor={theme.colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView
        style={styles.campaignsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredCampaigns.map(renderCampaignItem)}
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
  campaignsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  campaignCard: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
  },
  campaignHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  campaignName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  campaignInfo: {
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});

export default CampaignsListScreen;

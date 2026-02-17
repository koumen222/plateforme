import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useEcomAuth } from '../../contexts/EcomAuthContext';
import { useMoney } from '../../contexts/ecom/useMoney';
import ecomApi from '../../services/ecom/ecomApi';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const ReportDetail = ({ navigation, route }) => {
  const { user } = useEcomAuth();
  const reportId = route.params?.reportId;
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, [reportId]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const response = await ecomApi.reports.getById(reportId);
      setReport(response.data.data);
    } catch (error) {
      console.error('Erreur chargement rapport:', error);
      Alert.alert('Erreur', 'Impossible de charger les détails du rapport');
    } finally {
      setLoading(false);
    }
  };

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#8b5cf6" />
      <Text style={styles.loadingText}>Chargement des détails...</Text>
    </View>
  );

  if (loading) {
    return renderLoading();
  }

  if (!report) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error" size={48} color="#ef4444" />
        <Text style={styles.errorText}>Rapport non trouvé</Text>
      </View>
    );
  }

  const deliveryRate = report.ordersReceived > 0 
    ? Math.round((report.ordersDelivered / report.ordersReceived) * 100) 
    : 0;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails du rapport</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.reportHeader}>
          <View style={styles.reportInfo}>
            <Text style={styles.reportDate}>
              {new Date(report.date).toLocaleDateString('fr-FR')}
            </Text>
            <Text style={styles.reportId}>ID: #{report._id?.slice(-8) || 'N/A'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: '#8b5cf6' }]}>
            <Text style={styles.statusText}>Rapport</Text>
          </View>
        </View>

        <View style={styles.metricsSection}>
          <Text style={styles.sectionTitle}>Métriques du jour</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <MaterialIcons name="shopping-cart" size={24} color="#3b82f6" />
              <Text style={styles.metricValue}>{report.ordersReceived}</Text>
              <Text style={styles.metricLabel}>Commandes reçues</Text>
            </View>
            <View style={styles.metricCard}>
              <MaterialIcons name="local-shipping" size={24} color="#10b981" />
              <Text style={styles.metricValue}>{report.ordersDelivered}</Text>
              <Text style={styles.metricLabel}>Commandes livrées</Text>
            </View>
            <View style={styles.metricCard}>
              <MaterialIcons name="trending-down" size={24} color="#ef4444" />
              <Text style={styles.metricValue}>
                {report.ordersReceived - report.ordersDelivered}
              </Text>
              <Text style={styles.metricLabel}>En attente</Text>
            </View>
            <View style={styles.metricCard}>
              <MaterialIcons name="percent" size={24} color="#f59e0b" />
              <Text style={styles.metricValue}>{deliveryRate}%</Text>
              <Text style={styles.metricLabel}>Taux livraison</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Produit</Text>
              <Text style={styles.infoValue}>{report.productName || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date du rapport</Text>
              <Text style={styles.infoValue}>
                {new Date(report.date).toLocaleDateString('fr-FR')}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Créé le</Text>
              <Text style={styles.infoValue}>
                {new Date(report.createdAt).toLocaleString('fr-FR')}
              </Text>
            </View>
            {report.updatedAt && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Modifié le</Text>
                <Text style={styles.infoValue}>
                  {new Date(report.updatedAt).toLocaleString('fr-FR')}
                </Text>
              </View>
            )}
          </View>
        </View>

        {report.adSpend && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dépenses publicitaires</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Dépenses du jour</Text>
                <Text style={styles.infoValue}>{report.adSpend}€</Text>
              </View>
            </View>
          </View>
        )}

        {report.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{report.notes}</Text>
            </View>
          </View>
        )}

        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#8b5cf6' }]}
            onPress={() => navigation.navigate('ReportForm', { reportId })}
          >
            <MaterialIcons name="edit" size={20} color="white" />
            <Text style={styles.actionButtonText}>Modifier</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  content: {
    padding: 16,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  reportInfo: {
    flex: 1,
  },
  reportDate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  reportId: {
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
  metricsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
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
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  notesCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  notesText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  actionsSection: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ReportDetail;

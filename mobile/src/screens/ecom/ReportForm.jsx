import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useEcomAuth } from '../../contexts/EcomAuthContext';
import ecomApi from '../../services/ecom/ecomApi';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const ReportForm = ({ navigation, route }) => {
  const { user } = useEcomAuth();
  const isEditing = !!route.params?.reportId;
  const reportId = route.params?.reportId;
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    productId: '',
    ordersReceived: '',
    ordersDelivered: '',
    notes: '',
    adSpend: '0'
  });

  useEffect(() => {
    loadProducts();
    if (isEditing && reportId) {
      loadReport();
    }
  }, [reportId, isEditing]);

  const loadProducts = async () => {
    try {
      const response = await ecomApi.get('/products?isActive=true');
      setProducts(response.data.data || []);
    } catch (error) {
      console.error('Erreur chargement produits:', error);
    }
  };

  const loadReport = async () => {
    try {
      setLoading(true);
      const response = await ecomApi.get(`/reports/${reportId}`);
      const report = response.data.data;
      
      setFormData({
        date: report.date || new Date().toISOString().split('T')[0],
        productId: report.productId || '',
        ordersReceived: report.ordersReceived?.toString() || '',
        ordersDelivered: report.ordersDelivered?.toString() || '',
        notes: report.notes || '',
        adSpend: report.adSpend?.toString() || '0'
      });
    } catch (error) {
      console.error('Erreur chargement rapport:', error);
      Alert.alert('Erreur', 'Impossible de charger le rapport');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.productId) {
      Alert.alert('Erreur', 'Veuillez sélectionner un produit');
      return;
    }

    if (!formData.ordersReceived || isNaN(parseInt(formData.ordersReceived))) {
      Alert.alert('Erreur', 'Le nombre de commandes reçues doit être un nombre entier');
      return;
    }

    if (!formData.ordersDelivered || isNaN(parseInt(formData.ordersDelivered))) {
      Alert.alert('Erreur', 'Le nombre de commandes livrées doit être un nombre entier');
      return;
    }

    const ordersReceived = parseInt(formData.ordersReceived);
    const ordersDelivered = parseInt(formData.ordersDelivered);

    if (ordersDelivered > ordersReceived) {
      Alert.alert('Erreur', 'Le nombre de commandes livrées ne peut pas dépasser le nombre de commandes reçues');
      return;
    }

    setSubmitting(true);
    try {
      const reportData = {
        ...formData,
        ordersReceived,
        ordersDelivered,
        adSpend: parseFloat(formData.adSpend) || 0
      };

      if (isEditing) {
        await ecomApi.put(`/reports/${reportId}`, reportData);
        Alert.alert('Succès', 'Rapport mis à jour avec succès');
      } else {
        await ecomApi.post('/reports', reportData);
        Alert.alert('Succès', 'Rapport créé avec succès');
      }

      navigation.goBack();
    } catch (error) {
      console.error('Erreur sauvegarde rapport:', error);
      Alert.alert('Erreur', error.response?.data?.message || 'Impossible de sauvegarder le rapport');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const selectedProduct = products.find(p => p._id === formData.productId);
  const deliveryRate = formData.ordersReceived && formData.ordersDelivered
    ? Math.round((parseInt(formData.ordersDelivered) / parseInt(formData.ordersReceived)) * 100)
    : 0;

  const renderProductSelector = () => (
    <View style={styles.formGroup}>
      <Text style={styles.label}>Produit *</Text>
      <TouchableOpacity
        style={styles.selectButton}
        onPress={() => {
          // TODO: Implement product selector modal
          Alert.alert('Info', 'Sélecteur de produit à implémenter');
        }}
      >
        <Text style={styles.selectText}>
          {selectedProduct ? selectedProduct.name : 'Sélectionner un produit'}
        </Text>
        <MaterialIcons name="arrow-drop-down" size={20} color="#6b7280" />
      </TouchableOpacity>
      {selectedProduct && (
        <View style={styles.productInfo}>
          <Text style={styles.productInfoText}>
            Prix: {selectedProduct.sellingPrice}€ | Stock: {selectedProduct.stock || 0}
          </Text>
        </View>
      )}
    </View>
  );

  const renderMetrics = () => (
    <View style={styles.metricsContainer}>
      <View style={styles.metricsHeader}>
        <Text style={styles.metricsTitle}>Métriques du jour</Text>
        {deliveryRate > 0 && (
          <View style={[
            styles.rateBadge,
            { 
              backgroundColor: deliveryRate >= 80 ? '#d1fae5' : 
                               deliveryRate >= 60 ? '#fef3c7' : '#fee2e2'
            }
          ]}>
            <Text style={[
              styles.rateText,
              { 
                color: deliveryRate >= 80 ? '#065f46' : 
                      deliveryRate >= 60 ? '#92400e' : '#991b1b'
              }
            ]}>
              {deliveryRate}% livré
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <MaterialIcons name="shopping-cart" size={24} color="#3b82f6" />
          <Text style={styles.metricValue}>{formData.ordersReceived || '0'}</Text>
          <Text style={styles.metricLabel}>Reçues</Text>
        </View>
        
        <View style={styles.metricCard}>
          <MaterialIcons name="local-shipping" size={24} color="#10b981" />
          <Text style={styles.metricValue}>{formData.ordersDelivered || '0'}</Text>
          <Text style={styles.metricLabel}>Livrées</Text>
        </View>
        
        <View style={styles.metricCard}>
          <MaterialIcons name="trending-down" size={24} color="#ef4444" />
          <Text style={styles.metricValue}>
            {formData.ordersReceived && formData.ordersDelivered
              ? parseInt(formData.ordersReceived) - parseInt(formData.ordersDelivered)
              : '0'
            }
          </Text>
          <Text style={styles.metricLabel}>En attente</Text>
        </View>
      </View>
    </View>
  );

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#8b5cf6" />
      <Text style={styles.loadingText}>
        {isEditing ? 'Chargement du rapport...' : 'Préparation du formulaire...'}
      </Text>
    </View>
  );

  if (loading) {
    return renderLoading();
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Modifier le rapport' : 'Nouveau rapport'}
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Date *</Text>
          <TextInput
            style={styles.input}
            value={formData.date}
            onChangeText={(text) => handleInputChange('date', text)}
            placeholder="AAAA-MM-JJ"
          />
        </View>

        {renderProductSelector()}

        <View style={styles.formRow}>
          <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Commandes reçues *</Text>
            <TextInput
              style={styles.input}
              value={formData.ordersReceived}
              onChangeText={(text) => handleInputChange('ordersReceived', text)}
              placeholder="0"
              keyboardType="numeric"
            />
          </View>
          
          <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Commandes livrées *</Text>
            <TextInput
              style={styles.input}
              value={formData.ordersDelivered}
              onChangeText={(text) => handleInputChange('ordersDelivered', text)}
              placeholder="0"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Dépenses publicitaires</Text>
          <TextInput
            style={styles.input}
            value={formData.adSpend}
            onChangeText={(text) => handleInputChange('adSpend', text)}
            placeholder="0.00"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.notes}
            onChangeText={(text) => handleInputChange('notes', text)}
            placeholder="Informations supplémentaires sur la journée..."
            multiline
            numberOfLines={4}
          />
        </View>

        {renderMetrics()}

        <View style={styles.formActions}>
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={() => navigation.goBack()}
            disabled={submitting}
          >
            <Text style={styles.buttonTextSecondary}>Annuler</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.buttonTextPrimary}>
                {isEditing ? 'Mettre à jour' : 'Créer'}
              </Text>
            )}
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
  form: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
    gap: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  selectText: {
    fontSize: 14,
    color: '#111827',
  },
  productInfo: {
    marginTop: 4,
  },
  productInfoText: {
    fontSize: 12,
    color: '#6b7280',
  },
  metricsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  metricsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  metricsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  rateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  rateText: {
    fontSize: 12,
    fontWeight: '500',
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metricCard: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#8b5cf6',
  },
  buttonSecondary: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextPrimary: {
    color: '#ffffff',
  },
  buttonTextSecondary: {
    color: '#374151',
  },
});

export default ReportForm;

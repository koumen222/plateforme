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
import { useMoney } from '../../contexts/ecom/useMoney';
import ecomApi from '../../services/ecom/ecomApi';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const ProductForm = ({ navigation, route }) => {
  const { user } = useEcomAuth();
  const { fmt } = useMoney();
  const isEditing = !!route.params?.productId;
  const productId = route.params?.productId;
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    sellingPrice: '',
    productCost: '',
    deliveryCost: '',
    avgAdsCost: '',
    stock: '',
    status: 'test',
    isActive: true,
    category: '',
    tags: '',
    images: []
  });

  useEffect(() => {
    if (isEditing && productId) {
      loadProduct();
    }
  }, [productId, isEditing]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const response = await ecomApi.get(`/products/${productId}`);
      const product = response.data.data;
      
      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        description: product.description || '',
        sellingPrice: product.sellingPrice?.toString() || '',
        productCost: product.productCost?.toString() || '',
        deliveryCost: product.deliveryCost?.toString() || '',
        avgAdsCost: product.avgAdsCost?.toString() || '',
        stock: product.stock?.toString() || '',
        status: product.status || 'test',
        isActive: product.isActive !== false,
        category: product.category || '',
        tags: product.tags?.join(', ') || '',
        images: product.images || []
      });
    } catch (error) {
      console.error('Erreur chargement produit:', error);
      Alert.alert('Erreur', 'Impossible de charger le produit');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      Alert.alert('Erreur', 'Le nom du produit est requis');
      return;
    }

    if (!formData.sellingPrice || isNaN(parseFloat(formData.sellingPrice))) {
      Alert.alert('Erreur', 'Le prix de vente doit être un nombre valide');
      return;
    }

    if (!formData.productCost || isNaN(parseFloat(formData.productCost))) {
      Alert.alert('Erreur', 'Le coût du produit doit être un nombre valide');
      return;
    }

    if (!formData.stock || isNaN(parseInt(formData.stock))) {
      Alert.alert('Erreur', 'Le stock doit être un nombre entier');
      return;
    }

    setSubmitting(true);
    try {
      const productData = {
        ...formData,
        sellingPrice: parseFloat(formData.sellingPrice),
        productCost: parseFloat(formData.productCost),
        deliveryCost: parseFloat(formData.deliveryCost),
        avgAdsCost: parseFloat(formData.avgAdsCost),
        stock: parseInt(formData.stock),
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : []
      };

      if (isEditing) {
        await ecomApi.put(`/products/${productId}`, productData);
        Alert.alert('Succès', 'Produit mis à jour avec succès');
      } else {
        await ecomApi.post('/products', productData);
        Alert.alert('Succès', 'Produit créé avec succès');
      }

      navigation.goBack();
    } catch (error) {
      console.error('Erreur sauvegarde produit:', error);
      Alert.alert('Erreur', error.response?.data?.message || 'Impossible de sauvegarder le produit');
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

  const renderStatusSelector = () => {
    const statuses = ['test', 'stable', 'winner', 'pause', 'stop'];
    return (
      <View style={styles.statusContainer}>
        <Text style={styles.label}>Statut</Text>
        <View style={styles.statusOptions}>
          {statuses.map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.statusOption,
                formData.status === status && styles.statusOptionActive
              ]}
              onPress={() => handleInputChange('status', status)}
            >
              <Text style={[
                styles.statusOptionText,
                formData.status === status && styles.statusOptionTextActive
              ]}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#3b82f6" />
      <Text style={styles.loadingText}>
        {isEditing ? 'Chargement du produit...' : 'Préparation du formulaire...'}
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
          {isEditing ? 'Modifier le produit' : 'Nouveau produit'}
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Nom du produit *</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => handleInputChange('name', text)}
            placeholder="Entrez le nom du produit"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>SKU</Text>
          <TextInput
            style={styles.input}
            value={formData.sku}
            onChangeText={(text) => handleInputChange('sku', text)}
            placeholder="SKU unique (optionnel)"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(text) => handleInputChange('description', text)}
            placeholder="Description du produit"
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.formRow}>
          <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Prix vente *</Text>
            <TextInput
              style={styles.input}
              value={formData.sellingPrice}
              onChangeText={(text) => handleInputChange('sellingPrice', text)}
              placeholder="0.00"
              keyboardType="numeric"
            />
          </View>
          
          <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Coût produit *</Text>
            <TextInput
              style={styles.input}
              value={formData.productCost}
              onChangeText={(text) => handleInputChange('productCost', text)}
              placeholder="0.00"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.formRow}>
          <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Coût livraison</Text>
            <TextInput
              style={styles.input}
              value={formData.deliveryCost}
              onChangeText={(text) => handleInputChange('deliveryCost', text)}
              placeholder="0.00"
              keyboardType="numeric"
            />
          </View>
          
          <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Coût pub moyen</Text>
            <TextInput
              style={styles.input}
              value={formData.avgAdsCost}
              onChangeText={(text) => handleInputChange('avgAdsCost', text)}
              placeholder="0.00"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.formRow}>
          <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Stock *</Text>
            <TextInput
              style={styles.input}
              value={formData.stock}
              onChangeText={(text) => handleInputChange('stock', text)}
              placeholder="0"
              keyboardType="numeric"
            />
          </View>
          
          <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Catégorie</Text>
            <TextInput
              style={styles.input}
              value={formData.category}
              onChangeText={(text) => handleInputChange('category', text)}
              placeholder="Ex: Électronique, Vêtements"
            />
          </View>
        </View>

        {renderStatusSelector()}

        <View style={styles.formGroup}>
          <Text style={styles.label}>Tags</Text>
          <TextInput
            style={styles.input}
            value={formData.tags}
            onChangeText={(text) => handleInputChange('tags', text)}
            placeholder="tag1, tag2, tag3"
          />
          <Text style={styles.helperText}>Séparez les tags par des virgules</Text>
        </View>

        <View style={styles.formGroup}>
          <View style={styles.switchContainer}>
            <Text style={styles.label}>Produit actif</Text>
            <TouchableOpacity
              style={[
                styles.switch,
                formData.isActive && styles.switchActive
              ]}
              onPress={() => handleInputChange('isActive', !formData.isActive)}
            >
              <View style={[
                styles.switchThumb,
                formData.isActive && styles.switchThumbActive
              ]} />
            </TouchableOpacity>
          </View>
          <Text style={styles.helperText}>
            {formData.isActive ? 'Le produit est visible' : 'Le produit est masqué'}
          </Text>
        </View>

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
  statusContainer: {
    marginBottom: 20,
  },
  statusOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statusOptionActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  statusOptionText: {
    fontSize: 12,
    color: '#374151',
  },
  statusOptionTextActive: {
    color: '#ffffff',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switch: {
    width: 48,
    height: 24,
    backgroundColor: '#e5e7eb',
    borderRadius: 12,
  },
  switchActive: {
    backgroundColor: '#3b82f6',
  },
  switchThumb: {
    width: 20,
    height: 20,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  switchThumbActive: {
    transform: [{ translateX: 24 }],
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
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
    backgroundColor: '#3b82f6',
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

export default ProductForm;

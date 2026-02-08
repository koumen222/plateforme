import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useEcomAuth } from '../hooks/useEcomAuth';
import { useMoney } from '../hooks/useMoney';
import { productsApi } from '../services/ecomApi';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const ProductForm = ({ navigation, route }) => {
  const { productId } = route.params || {};
  const isEdit = !!productId;
  const { fmt } = useMoney();
  
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sellingPrice: '',
    productCost: '',
    deliveryCost: '',
    avgAdsCost: '',
    isActive: true,
    description: '',
  });

  useEffect(() => {
    if (isEdit) {
      loadProduct();
    }
  }, [productId]);

  const loadProduct = async () => {
    try {
      const res = await productsApi.getProduct(productId);
      const product = res.data?.data || res.data;
      setFormData({
        name: product.name || '',
        sellingPrice: String(product.sellingPrice || ''),
        productCost: String(product.productCost || ''),
        deliveryCost: String(product.deliveryCost || ''),
        avgAdsCost: String(product.avgAdsCost || ''),
        isActive: product.isActive !== false,
        description: product.description || '',
      });
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger le produit');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Erreur', 'Le nom du produit est requis');
      return;
    }
    if (!formData.sellingPrice) {
      Alert.alert('Erreur', 'Le prix de vente est requis');
      return;
    }

    setSaving(true);
    try {
      const data = {
        name: formData.name.trim(),
        sellingPrice: parseFloat(formData.sellingPrice) || 0,
        productCost: parseFloat(formData.productCost) || 0,
        deliveryCost: parseFloat(formData.deliveryCost) || 0,
        avgAdsCost: parseFloat(formData.avgAdsCost) || 0,
        isActive: formData.isActive,
        description: formData.description.trim(),
      };

      if (isEdit) {
        await productsApi.updateProduct(productId, data);
        Alert.alert('Succès', 'Produit modifié');
      } else {
        await productsApi.createProduct(data);
        Alert.alert('Succès', 'Produit créé');
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erreur', error.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const benefit = (parseFloat(formData.sellingPrice) || 0) - 
    (parseFloat(formData.productCost) || 0) - 
    (parseFloat(formData.deliveryCost) || 0) - 
    (parseFloat(formData.avgAdsCost) || 0);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.title}>{isEdit ? 'Modifier le produit' : 'Nouveau produit'}</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nom du produit *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(t) => setFormData({ ...formData, name: t })}
              placeholder="Ex: T-shirt Premium"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Prix de vente *</Text>
            <TextInput
              style={styles.input}
              value={formData.sellingPrice}
              onChangeText={(t) => setFormData({ ...formData, sellingPrice: t })}
              placeholder="0"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Coût produit</Text>
              <TextInput
                style={styles.input}
                value={formData.productCost}
                onChangeText={(t) => setFormData({ ...formData, productCost: t })}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Coût livraison</Text>
              <TextInput
                style={styles.input}
                value={formData.deliveryCost}
                onChangeText={(t) => setFormData({ ...formData, deliveryCost: t })}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Coût pub moyen</Text>
            <TextInput
              style={styles.input}
              value={formData.avgAdsCost}
              onChangeText={(t) => setFormData({ ...formData, avgAdsCost: t })}
              placeholder="0"
              keyboardType="numeric"
            />
          </View>

          {/* Benefit Preview */}
          <View style={styles.benefitCard}>
            <Text style={styles.benefitLabel}>Bénéfice estimé</Text>
            <Text style={[styles.benefitValue, { color: benefit >= 0 ? '#16a34a' : '#dc2626' }]}>
              {fmt(benefit)}
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(t) => setFormData({ ...formData, description: t })}
              placeholder="Description du produit..."
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.label}>Produit actif</Text>
            <Switch
              value={formData.isActive}
              onValueChange={(v) => setFormData({ ...formData, isActive: v })}
              trackColor={{ false: '#e5e7eb', true: '#93c5fd' }}
              thumbColor={formData.isActive ? '#2563eb' : '#9ca3af'}
            />
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, saving && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>
              {isEdit ? 'Enregistrer les modifications' : 'Créer le produit'}
            </Text>
          )}
        </TouchableOpacity>
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  benefitCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  benefitLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  benefitValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  submitButton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProductForm;

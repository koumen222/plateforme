import React, { useState } from 'react';
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

const StockOrderForm = ({ navigation, route }) => {
  const { user } = useEcomAuth();
  const isEditing = !!route.params?.orderId;
  const orderId = route.params?.orderId;
  
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    productName: '',
    quantity: '',
    supplier: '',
    expectedDate: new Date().toISOString().split('T')[0],
    notes: '',
    status: 'pending'
  });

  const handleSubmit = async () => {
    if (!formData.productName.trim()) {
      Alert.alert('Erreur', 'Le nom du produit est requis');
      return;
    }

    if (!formData.quantity || isNaN(parseInt(formData.quantity))) {
      Alert.alert('Erreur', 'La quantité doit être un nombre entier');
      return;
    }

    setSubmitting(true);
    try {
      const orderData = {
        ...formData,
        quantity: parseInt(formData.quantity)
      };

      if (isEditing) {
        await ecomApi.stock.orders.update(orderId, orderData);
        Alert.alert('Succès', 'Commande mise à jour');
      } else {
        await ecomApi.stock.orders.create(orderData);
        Alert.alert('Succès', 'Commande créée');
      }

      navigation.goBack();
    } catch (error) {
      console.error('Erreur sauvegarde commande:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder la commande');
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

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Modifier la commande' : 'Nouvelle commande stock'}
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Nom du produit *</Text>
          <TextInput
            style={styles.input}
            value={formData.productName}
            onChangeText={(text) => handleInputChange('productName', text)}
            placeholder="Entrez le nom du produit"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Quantité *</Text>
          <TextInput
            style={styles.input}
            value={formData.quantity}
            onChangeText={(text) => handleInputChange('quantity', text)}
            placeholder="0"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Fournisseur</Text>
          <TextInput
            style={styles.input}
            value={formData.supplier}
            onChangeText={(text) => handleInputChange('supplier', text)}
            placeholder="Nom du fournisseur"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Date de livraison attendue</Text>
          <TextInput
            style={styles.input}
            value={formData.expectedDate}
            onChangeText={(text) => handleInputChange('expectedDate', text)}
            placeholder="AAAA-MM-JJ"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.notes}
            onChangeText={(text) => handleInputChange('notes', text)}
            placeholder="Informations supplémentaires..."
            multiline
            numberOfLines={4}
          />
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

export default StockOrderForm;

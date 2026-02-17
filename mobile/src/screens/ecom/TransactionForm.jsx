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
import { useMoney } from '../../contexts/ecom/useMoney';
import ecomApi from '../../services/ecom/ecomApi';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const TransactionForm = ({ navigation, route }) => {
  const { user } = useEcomAuth();
  const { fmt } = useMoney();
  const isEditing = !!route.params?.transactionId;
  const transactionId = route.params?.transactionId;
  
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'expense',
    category: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const handleSubmit = async () => {
    if (!formData.description.trim()) {
      Alert.alert('Erreur', 'La description est requise');
      return;
    }

    if (!formData.amount || isNaN(parseFloat(formData.amount))) {
      Alert.alert('Erreur', 'Le montant doit être un nombre valide');
      return;
    }

    setSubmitting(true);
    try {
      const transactionData = {
        ...formData,
        amount: parseFloat(formData.amount)
      };

      if (isEditing) {
        await ecomApi.transactions.update(transactionId, transactionData);
        Alert.alert('Succès', 'Transaction mise à jour');
      } else {
        await ecomApi.transactions.create(transactionData);
        Alert.alert('Succès', 'Transaction créée');
      }

      navigation.goBack();
    } catch (error) {
      console.error('Erreur sauvegarde transaction:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder la transaction');
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

  const renderTypeSelector = () => {
    const types = [
      { value: 'income', label: 'Revenu', icon: 'trending-up', color: '#10b981' },
      { value: 'expense', label: 'Dépense', icon: 'trending-down', color: '#ef4444' },
      { value: 'refund', label: 'Remboursement', icon: 'swap-horiz', color: '#f59e0b' }
    ];

    return (
      <View style={styles.formGroup}>
        <Text style={styles.label}>Type de transaction</Text>
        <View style={styles.typeOptions}>
          {types.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.typeOption,
                formData.type === type.value && styles.typeOptionActive,
                { borderColor: formData.type === type.value ? type.color : '#e5e7eb' }
              ]}
              onPress={() => handleInputChange('type', type.value)}
            >
              <MaterialIcons 
                name={type.icon} 
                size={20} 
                color={formData.type === type.value ? '#ffffff' : type.color} 
              />
              <Text style={[
                styles.typeOptionText,
                formData.type === type.value && styles.typeOptionTextActive
              ]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Modifier la transaction' : 'Nouvelle transaction'}
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={styles.input}
            value={formData.description}
            onChangeText={(text) => handleInputChange('description', text)}
            placeholder="Entrez la description de la transaction"
          />
        </View>

        {renderTypeSelector()}

        <View style={styles.formGroup}>
          <Text style={styles.label}>Montant *</Text>
          <View style={styles.amountContainer}>
            <Text style={styles.amountPrefix}>€</Text>
            <TextInput
              style={styles.amountInput}
              value={formData.amount}
              onChangeText={(text) => handleInputChange('amount', text)}
              placeholder="0.00"
              keyboardType="numeric"
            />
          </View>
          {formData.amount && (
            <Text style={styles.amountPreview}>
              Total: {formData.type === 'income' ? '+' : '-'}{fmt(parseFloat(formData.amount))}
            </Text>
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Catégorie</Text>
          <TextInput
            style={styles.input}
            value={formData.category}
            onChangeText={(text) => handleInputChange('category', text)}
            placeholder="Ex: Ventes, Marketing, Fournitures, Salaires"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Date</Text>
          <TextInput
            style={styles.input}
            value={formData.date}
            onChangeText={(text) => handleInputChange('date', text)}
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
  typeOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  typeOptionActive: {
    borderWidth: 2,
  },
  typeOptionText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  typeOptionTextActive: {
    color: '#ffffff',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  amountPrefix: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  amountPreview: {
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
    backgroundColor: '#10b981',
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

export default TransactionForm;

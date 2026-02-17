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
} from 'react-native';
import { useEcomAuth } from '../hooks/useEcomAuth';
import { useMoney } from '../hooks/useMoney';
import { transactionsApi } from '../services/ecomApi';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const categories = [
  { key: 'publicite', label: 'Publicité', icon: 'campaign' },
  { key: 'produit', label: 'Achat produit', icon: 'inventory' },
  { key: 'livraison', label: 'Frais livraison', icon: 'local-shipping' },
  { key: 'salaire', label: 'Salaire', icon: 'payments' },
  { key: 'abonnement', label: 'Abonnement', icon: 'subscriptions' },
  { key: 'materiel', label: 'Matériel', icon: 'devices' },
  { key: 'transport', label: 'Transport', icon: 'directions-car' },
  { key: 'autre', label: 'Autre', icon: 'more-horiz' },
];

const TransactionForm = ({ navigation, route }) => {
  const { transactionId } = route.params || {};
  const isEdit = !!transactionId;
  const { fmt } = useMoney();
  
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    category: 'autre',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (isEdit) {
      loadTransaction();
    }
  }, [transactionId]);

  const loadTransaction = async () => {
    try {
      const res = await transactionsApi.getTransaction(transactionId);
      const tx = res.data?.data || res.data;
      setFormData({
        type: tx.type || 'expense',
        amount: String(tx.amount || ''),
        category: tx.category || 'autre',
        description: tx.description || '',
        date: tx.date?.split('T')[0] || new Date().toISOString().split('T')[0],
      });
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger la transaction');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.amount) {
      Alert.alert('Erreur', 'Le montant est requis');
      return;
    }

    setSaving(true);
    try {
      const data = {
        type: formData.type,
        amount: parseFloat(formData.amount) || 0,
        category: formData.category,
        description: formData.description.trim(),
        date: formData.date,
      };

      if (isEdit) {
        await transactionsApi.updateTransaction(transactionId, data);
        Alert.alert('Succès', 'Transaction modifiée');
      } else {
        await transactionsApi.createTransaction(data);
        Alert.alert('Succès', 'Transaction créée');
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
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.title}>{isEdit ? 'Modifier' : 'Nouvelle transaction'}</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Type Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Type</Text>
            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[styles.typeButton, formData.type === 'income' && styles.typeButtonIncome]}
                onPress={() => setFormData({ ...formData, type: 'income' })}
              >
                <MaterialIcons name="arrow-downward" size={20} color={formData.type === 'income' ? '#fff' : '#10b981'} />
                <Text style={[styles.typeButtonText, formData.type === 'income' && styles.typeButtonTextActive]}>
                  Entrée
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, formData.type === 'expense' && styles.typeButtonExpense]}
                onPress={() => setFormData({ ...formData, type: 'expense' })}
              >
                <MaterialIcons name="arrow-upward" size={20} color={formData.type === 'expense' ? '#fff' : '#ef4444'} />
                <Text style={[styles.typeButtonText, formData.type === 'expense' && styles.typeButtonTextActive]}>
                  Sortie
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Montant *</Text>
            <TextInput
              style={styles.input}
              value={formData.amount}
              onChangeText={(t) => setFormData({ ...formData, amount: t })}
              placeholder="0"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date</Text>
            <TextInput
              style={styles.input}
              value={formData.date}
              onChangeText={(t) => setFormData({ ...formData, date: t })}
              placeholder="YYYY-MM-DD"
            />
          </View>

          {/* Category Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Catégorie</Text>
            <View style={styles.categoryGrid}>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat.key}
                  style={[styles.categoryChip, formData.category === cat.key && styles.categoryChipActive]}
                  onPress={() => setFormData({ ...formData, category: cat.key })}
                >
                  <MaterialIcons 
                    name={cat.icon} 
                    size={18} 
                    color={formData.category === cat.key ? '#fff' : '#6b7280'} 
                  />
                  <Text style={[styles.categoryChipText, formData.category === cat.key && styles.categoryChipTextActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(t) => setFormData({ ...formData, description: t })}
              placeholder="Description de la transaction..."
              multiline
              numberOfLines={3}
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
              {isEdit ? 'Enregistrer' : 'Créer la transaction'}
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
  typeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    gap: 8,
  },
  typeButtonIncome: {
    backgroundColor: '#10b981',
  },
  typeButtonExpense: {
    backgroundColor: '#ef4444',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    gap: 6,
  },
  categoryChipActive: {
    backgroundColor: '#7c3aed',
  },
  categoryChipText: {
    fontSize: 12,
    color: '#6b7280',
  },
  categoryChipTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#7c3aed',
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

export default TransactionForm;

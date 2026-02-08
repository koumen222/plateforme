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
import { clientsApi } from '../services/ecomApi';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const statusOptions = [
  { key: 'prospect', label: 'Prospect', color: '#f59e0b' },
  { key: 'confirmed', label: 'Confirmé', color: '#2563eb' },
  { key: 'delivered', label: 'Livré', color: '#10b981' },
  { key: 'returned', label: 'Retour', color: '#f97316' },
  { key: 'blocked', label: 'Bloqué', color: '#ef4444' },
];

const ClientForm = ({ navigation, route }) => {
  const { clientId } = route.params || {};
  const isEdit = !!clientId;
  
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    city: '',
    address: '',
    status: 'prospect',
    notes: '',
  });

  useEffect(() => {
    if (isEdit) {
      loadClient();
    }
  }, [clientId]);

  const loadClient = async () => {
    try {
      const res = await clientsApi.getClient(clientId);
      const client = res.data?.data || res.data;
      setFormData({
        name: client.name || '',
        phone: client.phone || '',
        city: client.city || '',
        address: client.address || '',
        status: client.status || 'prospect',
        notes: client.notes || '',
      });
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger le client');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Erreur', 'Le nom est requis');
      return;
    }
    if (!formData.phone.trim()) {
      Alert.alert('Erreur', 'Le téléphone est requis');
      return;
    }

    setSaving(true);
    try {
      const data = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        city: formData.city.trim(),
        address: formData.address.trim(),
        status: formData.status,
        notes: formData.notes.trim(),
      };

      if (isEdit) {
        await clientsApi.updateClient(clientId, data);
        Alert.alert('Succès', 'Client modifié');
      } else {
        await clientsApi.createClient(data);
        Alert.alert('Succès', 'Client créé');
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

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.title}>{isEdit ? 'Modifier le client' : 'Nouveau client'}</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nom *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(t) => setFormData({ ...formData, name: t })}
              placeholder="Nom du client"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Téléphone *</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(t) => setFormData({ ...formData, phone: t })}
              placeholder="+237 6XX XXX XXX"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ville</Text>
            <TextInput
              style={styles.input}
              value={formData.city}
              onChangeText={(t) => setFormData({ ...formData, city: t })}
              placeholder="Ville"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Adresse</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.address}
              onChangeText={(t) => setFormData({ ...formData, address: t })}
              placeholder="Adresse complète"
              multiline
              numberOfLines={2}
            />
          </View>

          {/* Status Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Statut</Text>
            <View style={styles.statusGrid}>
              {statusOptions.map(s => (
                <TouchableOpacity
                  key={s.key}
                  style={[
                    styles.statusChip,
                    formData.status === s.key && { backgroundColor: s.color }
                  ]}
                  onPress={() => setFormData({ ...formData, status: s.key })}
                >
                  <Text style={[
                    styles.statusChipText,
                    formData.status === s.key && styles.statusChipTextActive
                  ]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.notes}
              onChangeText={(t) => setFormData({ ...formData, notes: t })}
              placeholder="Notes sur le client..."
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
              {isEdit ? 'Enregistrer' : 'Créer le client'}
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
    minHeight: 60,
    textAlignVertical: 'top',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  statusChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  statusChipText: {
    fontSize: 13,
    color: '#6b7280',
  },
  statusChipTextActive: {
    color: '#fff',
    fontWeight: '500',
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

export default ClientForm;

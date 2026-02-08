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

const CampaignForm = ({ navigation, route }) => {
  const { user } = useEcomAuth();
  const isEditing = !!route.params?.campaignId;
  const campaignId = route.params?.campaignId;
  
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'draft',
    targetAudience: '',
    message: ''
  });

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Erreur', 'Le titre de la campagne est requis');
      return;
    }

    if (!formData.description.trim()) {
      Alert.alert('Erreur', 'La description est requise');
      return;
    }

    setSubmitting(true);
    try {
      const campaignData = {
        ...formData,
        title: formData.title.trim(),
        description: formData.description.trim(),
        targetAudience: formData.targetAudience.trim(),
        message: formData.message.trim()
      };

      if (isEditing) {
        await ecomApi.campaigns.update(campaignId, campaignData);
        Alert.alert('Succès', 'Campagne mise à jour');
      } else {
        await ecomApi.campaigns.create(campaignData);
        Alert.alert('Succès', 'Campagne créée');
      }

      navigation.goBack();
    } catch (error) {
      console.error('Erreur sauvegarde campagne:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder la campagne');
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
    const statuses = ['draft', 'scheduled', 'active', 'paused', 'completed'];
    return (
      <View style={styles.formGroup}>
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

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Modifier la campagne' : 'Nouvelle campagne'}
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Titre *</Text>
          <TextInput
            style={styles.input}
            value={formData.title}
            onChangeText={(text) => handleInputChange('title', text)}
            placeholder="Entrez le titre de la campagne"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(text) => handleInputChange('description', text)}
            placeholder="Décrivez la campagne en détail..."
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.formRow}>
          <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Date de début</Text>
            <TextInput
              style={styles.input}
              value={formData.startDate}
              onChangeText={(text) => handleInputChange('startDate', text)}
              placeholder="AAAA-MM-JJ"
            />
          </View>
          
          <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Date de fin</Text>
            <TextInput
              style={styles.input}
              value={formData.endDate}
              onChangeText={(text) => handleInputChange('endDate', text)}
              placeholder="AAAA-MM-JJ"
            />
          </View>
        </View>

        {renderStatusSelector()}

        <View style={styles.formGroup}>
          <Text style={styles.label}>Audience cible</Text>
          <TextInput
            style={styles.input}
            value={formData.targetAudience}
            onChangeText={(text) => handleInputChange('targetAudience', text)}
            placeholder="Ex: Tous les clients, Clients actifs, Nouveaux prospects"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Message</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.message}
            onChangeText={(text) => handleInputChange('message', text)}
            placeholder="Message de la campagne..."
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

export default CampaignForm;

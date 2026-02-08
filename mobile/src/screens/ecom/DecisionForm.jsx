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

const DecisionForm = ({ navigation, route }) => {
  const { user } = useEcomAuth();
  const isEditing = !!route.params?.decisionId;
  const decisionId = route.params?.decisionId;
  
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    category: '',
    expectedImpact: '',
    implementationPlan: '',
    status: 'pending'
  });

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Erreur', 'Le titre de la décision est requis');
      return;
    }

    if (!formData.description.trim()) {
      Alert.alert('Erreur', 'La description est requise');
      return;
    }

    setSubmitting(true);
    try {
      const decisionData = {
        ...formData,
        authorName: user.email?.split('@')[0] || 'Utilisateur'
      };

      if (isEditing) {
        await ecomApi.decisions.update(decisionId, decisionData);
        Alert.alert('Succès', 'Décision mise à jour');
      } else {
        await ecomApi.decisions.create(decisionData);
        Alert.alert('Succès', 'Décision créée');
      }

      navigation.goBack();
    } catch (error) {
      console.error('Erreur sauvegarde décision:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder la décision');
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

  const renderPrioritySelector = () => {
    const priorities = ['high', 'medium', 'low'];
    return (
      <View style={styles.formGroup}>
        <Text style={styles.label}>Priorité</Text>
        <View style={styles.priorityOptions}>
          {priorities.map((priority) => (
            <TouchableOpacity
              key={priority}
              style={[
                styles.priorityOption,
                formData.priority === priority && styles.priorityOptionActive
              ]}
              onPress={() => handleInputChange('priority', priority)}
            >
              <Text style={[
                styles.priorityOptionText,
                formData.priority === priority && styles.priorityOptionTextActive
              ]}>
                {priority === 'high' ? 'Haute' : priority === 'medium' ? 'Moyenne' : 'Basse'}
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
          {isEditing ? 'Modifier la décision' : 'Nouvelle décision'}
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Titre *</Text>
          <TextInput
            style={styles.input}
            value={formData.title}
            onChangeText={(text) => handleInputChange('title', text)}
            placeholder="Entrez le titre de la décision"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(text) => handleInputChange('description', text)}
            placeholder="Décrivez la décision en détail..."
            multiline
            numberOfLines={4}
          />
        </View>

        {renderPrioritySelector()}

        <View style={styles.formGroup}>
          <Text style={styles.label}>Catégorie</Text>
          <TextInput
            style={styles.input}
            value={formData.category}
            onChangeText={(text) => handleInputChange('category', text)}
            placeholder="Ex: Marketing, Opérations, Produit"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Impact attendu</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.expectedImpact}
            onChangeText={(text) => handleInputChange('expectedImpact', text)}
            placeholder="Quel est l'impact attendu de cette décision ?"
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Plan d'implémentation</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.implementationPlan}
            onChangeText={(text) => handleInputChange('implementationPlan', text)}
            placeholder="Comment cette décision sera-t-elle mise en œuvre ?"
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
  priorityOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  priorityOptionActive: {
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
  },
  priorityOptionText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  priorityOptionTextActive: {
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
    backgroundColor: '#f59e0b',
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

export default DecisionForm;

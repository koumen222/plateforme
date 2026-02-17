import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { useThemeSafe } from '../../utils/useThemeSafe';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const CampaignFormScreen = ({ navigation, route }) => {
  const theme = useThemeSafe();
  const isEditing = route.params?.campaignId != null;
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    budget: '',
    targetAudience: '',
    objectives: '',
    channels: {
      email: false,
      sms: false,
      social: false,
      push: false,
    },
    autoSend: false,
  });

  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!formData.name || !formData.startDate || !formData.endDate || !formData.budget) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    try {
      // Simuler la sauvegarde
      await new Promise(resolve => setTimeout(resolve, 1000));
      Alert.alert(
        'Succès',
        isEditing ? 'Campagne mise à jour avec succès' : 'Campagne créée avec succès',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder la campagne');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateChannel = (channel, value) => {
    setFormData(prev => ({
      ...prev,
      channels: { ...prev.channels, [channel]: value }
    }));
  };

  const renderFormField = (title, field, placeholder, multiline = false, keyboardType = 'default') => (
    <View style={styles.formGroup}>
      <Text style={[styles.label, { color: theme.colors.text }]}>{title}</Text>
      <TextInput
        style={[
          styles.input,
          { 
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            color: theme.colors.text 
          }
        ]}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        value={formData[field]}
        onChangeText={(value) => updateFormData(field, value)}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        keyboardType={keyboardType}
      />
    </View>
  );

  const renderChannelToggle = (channel, title, icon) => (
    <View style={[styles.channelItem, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.channelInfo}>
        <MaterialIcons name={icon} size={24} color={theme.colors.primary} />
        <Text style={[styles.channelTitle, { color: theme.colors.text }]}>{title}</Text>
      </View>
      <Switch
        value={formData.channels[channel]}
        onValueChange={(value) => updateChannel(channel, value)}
        trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
        thumbColor={formData.channels[channel] ? 'white' : theme.colors.textSecondary}
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {isEditing ? 'Modifier la campagne' : 'Nouvelle campagne'}
        </Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          <MaterialIcons name="save" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        {renderFormField('Nom de la campagne*', 'name', 'Entrez le nom de la campagne')}
        
        {renderFormField(
          'Description', 
          'description', 
          'Décrivez votre campagne...', 
          true
        )}

        <View style={styles.dateRow}>
          <View style={styles.dateGroup}>
            {renderFormField('Date de début*', 'startDate', 'JJ/MM/AAAA')}
          </View>
          <View style={styles.dateGroup}>
            {renderFormField('Date de fin*', 'endDate', 'JJ/MM/AAAA')}
          </View>
        </View>

        {renderFormField('Budget*', 'budget', '0', false, 'numeric')}

        {renderFormField(
          'Audience cible', 
          'targetAudience', 
          'Décrivez votre audience cible...', 
          true
        )}

        {renderFormField(
          'Objectifs', 
          'objectives', 
          'Quels sont vos objectifs pour cette campagne?', 
          true
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Canaux de distribution
          </Text>
          
          {renderChannelToggle('email', 'Email', 'email')}
          {renderChannelToggle('sms', 'SMS', 'sms')}
          {renderChannelToggle('social', 'Réseaux sociaux', 'share')}
          {renderChannelToggle('push', 'Notifications push', 'notifications')}
        </View>

        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={[styles.switchTitle, { color: theme.colors.text }]}>
                Envoi automatique
              </Text>
              <Text style={[styles.switchDescription, { color: theme.colors.textSecondary }]}>
                Envoyer la campagne automatiquement à la date de début
              </Text>
            </View>
            <Switch
              value={formData.autoSend}
              onValueChange={(value) => updateFormData('autoSend', value)}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={formData.autoSend ? 'white' : theme.colors.textSecondary}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Sauvegarde...' : (isEditing ? 'Mettre à jour' : 'Créer la campagne')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  form: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dateGroup: {
    flex: 1,
    marginHorizontal: 5,
  },
  section: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 2,
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  channelItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  channelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  channelTitle: {
    fontSize: 16,
    marginLeft: 10,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchInfo: {
    flex: 1,
  },
  switchTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  switchDescription: {
    fontSize: 14,
    marginTop: 4,
  },
  saveButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CampaignFormScreen;

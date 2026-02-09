import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { useNotifications } from '../contexts/NotificationContext';

const NotificationTestScreen = ({ navigation }) => {
  const {
    notificationToken,
    permissionsGranted,
    sendNotification,
    sendOrderNotification,
    scheduleNotification,
    cancelNotification,
    clearAllNotifications,
    scheduledNotifications,
  } = useNotifications();

  const [customTitle, setCustomTitle] = useState('');
  const [customBody, setCustomBody] = useState('');

  const handleSendNotification = async () => {
    const title = customTitle || 'Test de notification';
    const body = customBody || 'Ceci est une notification de test';

    await sendNotification(title, body, {
      type: 'test',
      timestamp: new Date().toISOString(),
    });

    Alert.alert('Succès', 'Notification envoyée !');
  };

  const handleSendOrderNotification = async (type) => {
    const orderData = {
      _id: 'test-order-123',
      orderId: 'CMD-001',
      clientName: 'Test Client',
      city: 'Douala',
    };

    await sendOrderNotification(type, orderData);
    Alert.alert('Succès', `Notification ${type} envoyée !`);
  };

  const handleScheduleNotification = async () => {
    // Programmer une notification pour dans 5 secondes
    const trigger = new Date(Date.now() + 5000);
    
    const notificationId = await scheduleNotification(
      'Notification programmée',
      'Cette notification a été programmée pour dans 5 secondes',
      trigger,
      { type: 'scheduled', test: true }
    );

    if (notificationId) {
      Alert.alert('Succès', `Notification programmée avec l'ID: ${notificationId}`);
    }
  };

  const handleCancelNotification = async () => {
    if (scheduledNotifications.length === 0) {
      Alert.alert('Info', 'Aucune notification programmée');
      return;
    }

    const lastNotification = scheduledNotifications[scheduledNotifications.length - 1];
    await cancelNotification(lastNotification.identifier);
    Alert.alert('Succès', 'Notification annulée');
  };

  const handleClearAll = async () => {
    await clearAllNotifications();
    Alert.alert('Succès', 'Toutes les notifications effacées');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Test des Notifications</Text>
      </View>

      {/* Statut des permissions */}
      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>Statut des permissions</Text>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Permissions:</Text>
          <Text style={[styles.statusValue, { color: permissionsGranted ? '#10b981' : '#ef4444' }]}>
            {permissionsGranted ? '✅ Accordées' : '❌ Refusées'}
          </Text>
        </View>
        {notificationToken && (
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Token:</Text>
            <Text style={styles.tokenValue} numberOfLines={1}>
              {notificationToken.substring(0, 20)}...
            </Text>
          </View>
        )}
      </View>

      {/* Notification personnalisée */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Notification personnalisée</Text>
        <TextInput
          style={styles.input}
          placeholder="Titre de la notification"
          value={customTitle}
          onChangeText={setCustomTitle}
        />
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Message de la notification"
          value={customBody}
          onChangeText={setCustomBody}
          multiline
          numberOfLines={3}
        />
        <TouchableOpacity style={styles.button} onPress={handleSendNotification}>
          <Text style={styles.buttonText}>Envoyer la notification</Text>
        </TouchableOpacity>
      </View>

      {/* Notifications de commande */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Notifications de commande</Text>
        <TouchableOpacity 
          style={[styles.button, styles.orderButton]} 
          onPress={() => handleSendOrderNotification('new_order')}
        >
          <Text style={styles.buttonText}>📦 Nouvelle commande</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.button, styles.orderButton]} 
          onPress={() => handleSendOrderNotification('order_assigned')}
        >
          <Text style={styles.buttonText}>🚚 Commande assignée</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.button, styles.orderButton]} 
          onPress={() => handleSendOrderNotification('order_taken')}
        >
          <Text style={styles.buttonText}>✅ Commande prise</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.button, styles.orderButton]} 
          onPress={() => handleSendOrderNotification('order_completed')}
        >
          <Text style={styles.buttonText}>🎉 Commande terminée</Text>
        </TouchableOpacity>
      </View>

      {/* Notifications programmées */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Notifications programmées</Text>
        <TouchableOpacity style={styles.button} onPress={handleScheduleNotification}>
          <Text style={styles.buttonText}>⏰ Programmer (5s)</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.button, styles.cancelButton]} 
          onPress={handleCancelNotification}
        >
          <Text style={styles.buttonText}>❌ Annuler la dernière</Text>
        </TouchableOpacity>
        <Text style={styles.info}>
          Notifications programmées: {scheduledNotifications.length}
        </Text>
      </View>

      {/* Actions globales */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Actions globales</Text>
        <TouchableOpacity 
          style={[styles.button, styles.clearButton]} 
          onPress={handleClearAll}
        >
          <Text style={styles.buttonText}>🗑️ Effacer toutes</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    backgroundColor: '#2563eb',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  statusCard: {
    margin: 16,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1f2937',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 16,
    color: '#6b7280',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  tokenValue: {
    fontSize: 12,
    color: '#6b7280',
    flex: 1,
    marginLeft: 10,
  },
  card: {
    margin: 16,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1f2937',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  orderButton: {
    backgroundColor: '#10b981',
  },
  cancelButton: {
    backgroundColor: '#f59e0b',
  },
  clearButton: {
    backgroundColor: '#ef4444',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  info: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default NotificationTestScreen;

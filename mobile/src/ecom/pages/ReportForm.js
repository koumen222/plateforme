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
  Modal,
  FlatList,
} from 'react-native';
import { useEcomAuth } from '../hooks/useEcomAuth';
import { useMoney } from '../hooks/useMoney';
import { reportsApi, productsApi } from '../services/ecomApi';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const ReportForm = ({ navigation, route }) => {
  const { reportId } = route.params || {};
  const isEdit = !!reportId;
  const { user } = useEcomAuth();
  const { fmt } = useMoney();
  
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    ordersReceived: '',
    ordersDelivered: '',
    ordersReturned: '',
    revenue: '',
    adSpend: '',
    notes: '',
    productId: '',
  });

  useEffect(() => {
    loadProducts();
    if (isEdit) {
      loadReport();
    }
  }, [reportId]);

  const loadProducts = async () => {
    try {
      const res = await productsApi.getProducts({ isActive: true });
      setProducts(res.data?.data || []);
    } catch (error) {
      console.log('Erreur chargement produits:', error);
      setProducts([]);
    }
  };

  const loadReport = async () => {
    try {
      const res = await reportsApi.getReport(reportId);
      const report = res.data?.data || res.data;
      setFormData({
        date: report.date?.split('T')[0] || new Date().toISOString().split('T')[0],
        ordersReceived: String(report.ordersReceived || ''),
        ordersDelivered: String(report.ordersDelivered || ''),
        ordersReturned: String(report.ordersReturned || ''),
        revenue: String(report.revenue || ''),
        adSpend: String(report.adSpend || ''),
        notes: report.notes || '',
        productId: report.productId || '',
      });
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger le rapport');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  // Calendar functions
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const generateCalendarDays = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = getDaysInMonth(date);
    const firstDay = getFirstDayOfMonth(date);
    const days = [];

    // Add empty days for alignment
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const formatDateDisplay = (date) => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleDateSelect = (selectedDate) => {
    setFormData({
      ...formData,
      date: selectedDate.toISOString().split('T')[0]
    });
    setShowCalendar(false);
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.ordersReceived || formData.ordersReceived === '0') {
      Alert.alert('Erreur', 'Le nombre de commandes reçues est requis et doit être supérieur à 0');
      return;
    }
    if (!formData.productId) {
      Alert.alert('Erreur', 'La sélection d\'un produit est obligatoire');
      return;
    }
    if (!formData.date) {
      Alert.alert('Erreur', 'La date est requise');
      return;
    }

    setSaving(true);
    try {
      const data = {
        date: formData.date,
        ordersReceived: parseInt(formData.ordersReceived),
        ordersDelivered: parseInt(formData.ordersDelivered) || 0,
        ordersReturned: parseInt(formData.ordersReturned) || 0,
        revenue: parseFloat(formData.revenue) || 0,
        adSpend: parseFloat(formData.adSpend) || 0,
        notes: formData.notes.trim(),
        productId: formData.productId,
      };

      console.log('Envoi du rapport:', data);

      if (isEdit) {
        await reportsApi.updateReport(reportId, data);
        Alert.alert('Succès', 'Rapport modifié avec succès');
      } else {
        await reportsApi.createReport(data);
        Alert.alert('Succès', 'Rapport créé avec succès');
      }
      navigation.goBack();
    } catch (error) {
      console.error('Erreur sauvegarde rapport:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la sauvegarde du rapport';
      Alert.alert('Erreur', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Chargement du formulaire...</Text>
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
          <Text style={styles.title}>{isEdit ? 'Modifier le rapport' : 'Nouveau rapport'}</Text>
          <TouchableOpacity
            style={[styles.submitButton, styles.submitButtonHeader, saving && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isEdit ? 'Enreg.' : 'Créer'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowCalendar(true)}
            >
              <Text style={styles.dateText}>
                {formatDateDisplay(new Date(formData.date))}
              </Text>
              <MaterialIcons name="calendar-today" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Commandes reçues *</Text>
              <TextInput
                style={styles.input}
                value={formData.ordersReceived}
                onChangeText={(t) => setFormData({ ...formData, ordersReceived: t })}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Livrées</Text>
              <TextInput
                style={styles.input}
                value={formData.ordersDelivered}
                onChangeText={(t) => setFormData({ ...formData, ordersDelivered: t })}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Retours</Text>
              <TextInput
                style={styles.input}
                value={formData.ordersReturned}
                onChangeText={(t) => setFormData({ ...formData, ordersReturned: t })}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Revenu</Text>
              <TextInput
                style={styles.input}
                value={formData.revenue}
                onChangeText={(t) => setFormData({ ...formData, revenue: t })}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Dépenses pub</Text>
            <TextInput
              style={styles.input}
              value={formData.adSpend}
              onChangeText={(t) => setFormData({ ...formData, adSpend: t })}
              placeholder="0"
              keyboardType="numeric"
            />
          </View>

          {/* Product Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Produit *</Text>
            {products.length === 0 ? (
              <View style={styles.noProductsContainer}>
                <Text style={styles.noProductsText}>Aucun produit disponible</Text>
                <TouchableOpacity 
                  style={styles.addProductButton}
                  onPress={() => navigation.navigate('ProductForm')}
                >
                  <Text style={styles.addProductButtonText}>Ajouter un produit</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.productScroll}>
                {products.map(p => (
                  <TouchableOpacity
                    key={p._id}
                    style={[
                      styles.productChip,
                      formData.productId === p._id && styles.productChipActive
                    ]}
                    onPress={() => setFormData({ ...formData, productId: p._id })}
                  >
                    <Text style={[
                      styles.productChipText,
                      formData.productId === p._id && styles.productChipTextActive
                    ]}>
                      {p.name}
                    </Text>
                    <Text style={styles.productChipStock}>
                      {p.stock || 0}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.notes}
              onChangeText={(t) => setFormData({ ...formData, notes: t })}
              placeholder="Notes sur la journée..."
              multiline
              numberOfLines={3}
            />
          </View>
        </View>
      </ScrollView>

      {/* Calendar Modal */}
      <Modal
        visible={showCalendar}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCalendar(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.calendarContainer}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={() => setShowCalendar(false)}>
                <MaterialIcons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
              <Text style={styles.calendarTitle}>
                {new Date(formData.date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </Text>
              <View style={{ width: 24 }} />
            </View>

            <View style={styles.calendarGrid}>
              {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map((day, index) => (
                <View key={index} style={styles.dayHeader}>
                  <Text style={styles.dayHeaderText}>{day}</Text>
                </View>
              ))}
              
              {generateCalendarDays(new Date(formData.date)).map((day, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayCell,
                    day && styles.dayCellActive,
                    day && day.toDateString() === new Date().toDateString() && styles.dayCellToday
                  ]}
                  onPress={() => day && handleDateSelect(day)}
                  disabled={!day}
                >
                  {day && (
                    <Text style={[
                      styles.dayText,
                      day.toDateString() === new Date().toDateString() && styles.dayTextToday
                    ]}>
                      {day.getDate()}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.calendarActions}>
              <TouchableOpacity
                style={styles.calendarButton}
                onPress={() => handleDateSelect(new Date())}
              >
                <Text style={styles.calendarButtonText}>Aujourd'hui</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
    fontSize: 14,
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
    justifyContent: 'space-between',
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
    flex: 1,
    textAlign: 'center',
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
  dateInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
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
  productScroll: {
    marginTop: 8,
  },
  productChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
    alignItems: 'center',
    minWidth: 80,
  },
  productChipActive: {
    backgroundColor: '#2563eb',
  },
  productChipText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  productChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  productChipStock: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 2,
  },
  noProductsContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
  },
  noProductsText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  addProductButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addProductButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  productChipMore: {
    backgroundColor: '#f3f4f6',
  },
  productSelector: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  productSelectorContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productSelectorText: {
    fontSize: 16,
    color: '#111827',
    flex: 1,
  },
  productOptions: {
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    maxHeight: 200,
  },
  productOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  productOptionActive: {
    backgroundColor: '#f0f9ff',
  },
  productOptionContent: {
    flex: 1,
  },
  productOptionText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  productOptionTextActive: {
    color: '#2563eb',
  },
  productOptionStock: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  submitButton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonHeader: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 70,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Calendar Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    margin: 20,
    width: '90%',
    maxWidth: 400,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  dayHeader: {
    width: '14.28%',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  dayCell: {
    width: '14.28%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  dayCellActive: {
    backgroundColor: '#f3f4f6',
  },
  dayCellToday: {
    backgroundColor: '#2563eb',
  },
  dayText: {
    fontSize: 14,
    color: '#111827',
  },
  dayTextToday: {
    color: '#fff',
    fontWeight: '600',
  },
  calendarActions: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  calendarButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  calendarButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ReportForm;

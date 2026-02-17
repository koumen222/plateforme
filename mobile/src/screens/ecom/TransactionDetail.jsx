import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useEcomAuth } from '../../contexts/EcomAuthContext';
import { useMoney } from '../../contexts/ecom/useMoney';
import ecomApi from '../../services/ecom/ecomApi';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const TransactionDetail = ({ navigation, route }) => {
  const { user } = useEcomAuth();
  const { fmt } = useMoney();
  const transactionId = route.params?.transactionId;
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransaction();
  }, [transactionId]);

  const loadTransaction = async () => {
    try {
      setLoading(true);
      const response = await ecomApi.transactions.getById(transactionId);
      setTransaction(response.data.data);
    } catch (error) {
      console.error('Erreur chargement transaction:', error);
      Alert.alert('Erreur', 'Impossible de charger les détails de la transaction');
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type) => {
    const colors = {
      income: '#10b981',
      expense: '#ef4444',
      refund: '#f59e0b'
    };
    return colors[type] || '#6b7280';
  };

  const getTypeIcon = (type) => {
    const icons = {
      income: 'trending-up',
      expense: 'trending-down',
      refund: 'swap-horiz'
    };
    return icons[type] || 'account-balance-wallet';
  };

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#10b981" />
      <Text style={styles.loadingText}>Chargement des détails...</Text>
    </View>
  );

  if (loading) {
    return renderLoading();
  }

  if (!transaction) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error" size={48} color="#ef4444" />
        <Text style={styles.errorText}>Transaction non trouvée</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails de la transaction</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.transactionHeader}>
          <View style={[styles.transactionType, { backgroundColor: getTypeColor(transaction.type) }]}>
            <MaterialIcons 
              name={getTypeIcon(transaction.type)} 
              size={24} 
              color="#ffffff" 
            />
          </View>
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionTitle}>{transaction.description}</Text>
            <Text style={styles.transactionTypeText}>
              {transaction.type === 'income' ? 'Revenu' : transaction.type === 'expense' ? 'Dépense' : 'Remboursement'}
            </Text>
          </View>
        </View>

        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>Montant</Text>
          <Text style={[
            styles.amount,
            { color: getTypeColor(transaction.type) }
          ]}>
            {transaction.type === 'income' ? '+' : '-'}{fmt(transaction.amount)}
          </Text>
        </View>

        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Informations</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>
              {new Date(transaction.date).toLocaleDateString('fr-FR')}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Catégorie</Text>
            <Text style={styles.detailValue}>{transaction.category || 'Non spécifiée'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Créé le</Text>
            <Text style={styles.detailValue}>
              {new Date(transaction.createdAt).toLocaleString('fr-FR')}
            </Text>
          </View>
          
          {transaction.updatedAt && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Modifié le</Text>
              <Text style={styles.detailValue}>
                {new Date(transaction.updatedAt).toLocaleString('fr-FR')}
              </Text>
            </View>
          )}
        </View>

        {transaction.balance !== undefined && (
          <View style={styles.balanceSection}>
            <Text style={styles.sectionTitle}>Impact sur le solde</Text>
            <View style={styles.balanceCard}>
              <MaterialIcons name="account-balance-wallet" size={20} color="#6b7280" />
              <Text style={styles.balanceLabel}>Solde après transaction</Text>
              <Text style={styles.balanceAmount}>{fmt(transaction.balance)}</Text>
            </View>
          </View>
        )}

        {transaction.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{transaction.notes}</Text>
            </View>
          </View>
        )}

        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#3b82f6' }]}
            onPress={() => navigation.navigate('TransactionForm', { transactionId })}
          >
            <MaterialIcons name="edit" size={20} color="white" />
            <Text style={styles.actionButtonText}>Modifier</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
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
  content: {
    padding: 16,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionType: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  transactionTypeText: {
    fontSize: 12,
    color: '#6b7280',
  },
  amountSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  amountLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  amount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  detailsSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  balanceSection: {
    marginBottom: 16,
  },
  balanceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  balanceLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 12,
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginLeft: 'auto',
  },
  notesSection: {
    marginBottom: 16,
  },
  notesCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  notesText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  actionsSection: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default TransactionDetail;

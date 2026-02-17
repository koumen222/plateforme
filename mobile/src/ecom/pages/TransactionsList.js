import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { useEcomAuth } from '../hooks/useEcomAuth';
import { useMoney } from '../hooks/useMoney';
import { transactionsApi } from '../services/ecomApi';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

// Category labels matching web app
const categoryLabels = {
  publicite: 'Publicité',
  produit: 'Achat produit',
  livraison: 'Frais de livraison',
  salaire: 'Salaire',
  abonnement: 'Abonnement / Outil',
  materiel: 'Matériel',
  transport: 'Transport',
  autre_depense: 'Autre dépense',
  vente: 'Vente',
  remboursement_client: 'Remboursement client',
  investissement: 'Investissement',
  autre_entree: 'Autre entrée'
};

const TransactionsList = ({ navigation }) => {
  const { user } = useEcomAuth();
  const { fmt } = useMoney();
  const isAdmin = user?.role === 'ecom_admin' || user?.role === 'ecom_compta';
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  const loadTransactions = async () => {
    try {
      const params = { limit: 100 };
      if (filter !== 'all') params.type = filter;
      
      const [txRes, summaryRes] = await Promise.all([
        transactionsApi.getTransactions(params).catch(() => ({ data: { data: { transactions: [] } } })),
        transactionsApi.getSummary().catch(() => ({ data: { data: {} } }))
      ]);
      
      const txData = txRes.data?.data?.transactions || [];
      setTransactions(Array.isArray(txData) ? txData : []);
      setSummary(summaryRes.data?.data || {});
    } catch (error) {
      console.error('Erreur chargement transactions:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const deleteTransaction = async (id) => {
    Alert.alert(
      'Supprimer la transaction',
      'Êtes-vous sûr de vouloir supprimer cette transaction ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await transactionsApi.deleteTransaction(id);
              loadTransactions();
            } catch (error) {
              Alert.alert('Erreur', 'Erreur lors de la suppression');
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadTransactions();
  };

  const filteredTransactions = transactions.filter(tx => {
    if (filter === 'all') return true;
    return tx.type === filter;
  });

  // Use summary from API or calculate from transactions
  const totalIncome = summary.totalIncome || transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalExpense = summary.totalExpense || transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0);
  const balance = totalIncome - totalExpense;

  const renderTransaction = ({ item }) => {
    const isIncome = item.type === 'income';
    
    return (
      <TouchableOpacity
        style={styles.txCard}
        onPress={() => navigation.navigate('TransactionDetail', { transactionId: item._id })}
      >
        <View style={[styles.txIcon, { backgroundColor: isIncome ? '#dcfce7' : '#fee2e2' }]}>
          <MaterialIcons
            name={isIncome ? 'arrow-downward' : 'arrow-upward'}
            size={20}
            color={isIncome ? '#16a34a' : '#dc2626'}
          />
        </View>
        
        <View style={styles.txInfo}>
          <Text style={styles.txDescription} numberOfLines={1}>
            {item.description || (isIncome ? 'Revenu' : 'Dépense')}
          </Text>
          <Text style={styles.txCategory}>{categoryLabels[item.category] || item.category || 'Non catégorisé'}</Text>
          <Text style={styles.txDate}>
            {new Date(item.date || item.createdAt).toLocaleDateString('fr-FR')}
          </Text>
        </View>
        
        <View style={styles.txRight}>
          <Text style={[styles.txAmount, { color: isIncome ? '#16a34a' : '#dc2626' }]}>
            {isIncome ? '+' : '-'}{fmt(item.amount)}
          </Text>
          {isAdmin && (
            <TouchableOpacity onPress={() => deleteTransaction(item._id)} style={styles.deleteBtn}>
              <MaterialIcons name="delete-outline" size={16} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const FilterButton = ({ value, label, color }) => (
    <TouchableOpacity
      style={[styles.filterButton, filter === value && { backgroundColor: color, borderColor: color }]}
      onPress={() => setFilter(value)}
    >
      <Text style={[styles.filterButtonText, filter === value && styles.filterButtonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text style={styles.loadingText}>Chargement des transactions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredTransactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7c3aed" />
        }
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* Page Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Transactions</Text>
              {isAdmin && (
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => navigation.navigate('TransactionForm')}
                >
                  <Text style={styles.addButtonText}>+ Nouvelle</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Summary Cards - like web */}
            <View style={styles.summaryGrid}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>ENTRÉES</Text>
                <Text style={[styles.summaryValue, { color: '#16a34a' }]}>{fmt(totalIncome)}</Text>
                <Text style={styles.summaryCount}>{summary.incomeCount || 0} tx</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>DÉPENSES</Text>
                <Text style={[styles.summaryValue, { color: '#dc2626' }]}>{fmt(totalExpense)}</Text>
                <Text style={styles.summaryCount}>{summary.expenseCount || 0} tx</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>SOLDE</Text>
                <Text style={[styles.summaryValue, { color: balance >= 0 ? '#16a34a' : '#dc2626' }]}>
                  {fmt(balance)}
                </Text>
                <Text style={styles.summaryCount}>{balance >= 0 ? 'Bénéfice' : 'Déficit'}</Text>
              </View>
            </View>

            {/* Filters */}
            <View style={styles.filtersRow}>
              <FilterButton value="all" label="Tout" color="#7c3aed" />
              <FilterButton value="income" label="Entrées" color="#16a34a" />
              <FilterButton value="expense" label="Dépenses" color="#dc2626" />
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="account-balance-wallet" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>Aucune transaction</Text>
            {isAdmin && (
              <TouchableOpacity onPress={() => navigation.navigate('TransactionForm')}>
                <Text style={styles.emptyLink}>Ajouter une transaction</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
    fontSize: 14,
  },
  listContent: {
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
  },
  addButton: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryLabel: {
    fontSize: 9,
    fontWeight: '500',
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  summaryCount: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 4,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterButtonText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txInfo: {
    flex: 1,
    marginLeft: 12,
  },
  txDescription: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  txCategory: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  txDate: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  deleteBtn: {
    padding: 4,
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  emptyLink: {
    marginTop: 8,
    fontSize: 14,
    color: '#7c3aed',
    fontWeight: '500',
  },
});

export default TransactionsList;

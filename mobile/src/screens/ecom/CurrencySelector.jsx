import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import { useCurrency } from '../../contexts/ecom/CurrencyContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const CurrencySelector = () => {
  const { currency, setCurrency } = useCurrency();
  const [modalVisible, setModalVisible] = useState(false);

  // Exactement les mêmes devises que dans le web
  const currencies = [
    // Afrique Centrale
    { code: 'XAF', name: 'Franc CFA BEAC', symbol: 'FCFA', region: 'Afrique Centrale' },
    { code: 'CDF', name: 'Franc Congolais', symbol: 'CDF', region: 'Afrique Centrale' },
    // Afrique de l'Ouest
    { code: 'XOF', name: 'Franc CFA BCEAO', symbol: 'CFA', region: 'Afrique de l\'Ouest' },
    { code: 'NGN', name: 'Naira Nigérian', symbol: '₦', region: 'Afrique de l\'Ouest' },
    { code: 'GHS', name: 'Cedi Ghanéen', symbol: 'GH₵', region: 'Afrique de l\'Ouest' },
    { code: 'GNF', name: 'Franc Guinéen', symbol: 'FG', region: 'Afrique de l\'Ouest' },
    { code: 'LRD', name: 'Dollar Libérien', symbol: '$', region: 'Afrique de l\'Ouest' },
    { code: 'SLL', name: 'Leone Sierra Leone', symbol: 'Le', region: 'Afrique de l\'Ouest' },
    // Afrique du Nord
    { code: 'MAD', name: 'Dirham Marocain', symbol: 'MAD', region: 'Afrique du Nord' },
    { code: 'TND', name: 'Dinar Tunisien', symbol: 'TND', region: 'Afrique du Nord' },
    { code: 'DZD', name: 'Dinar Algérien', symbol: 'DA', region: 'Afrique du Nord' },
    { code: 'EGP', name: 'Livre Égyptienne', symbol: 'E£', region: 'Afrique du Nord' },
    { code: 'LYD', name: 'Dinar Libyen', symbol: 'LD', region: 'Afrique du Nord' },
    // Afrique de l'Est
    { code: 'KES', name: 'Shilling Kenyan', symbol: 'KSh', region: 'Afrique de l\'Est' },
    { code: 'UGX', name: 'Shilling Ougandais', symbol: 'UGX', region: 'Afrique de l\'Est' },
    { code: 'TZS', name: 'Shilling Tanzanien', symbol: 'TSh', region: 'Afrique de l\'Est' },
    { code: 'RWF', name: 'Franc Rwandais', symbol: 'RWF', region: 'Afrique de l\'Est' },
    { code: 'BIF', name: 'Franc Burundais', symbol: 'FBu', region: 'Afrique de l\'Est' },
    { code: 'ETB', name: 'Birr Éthiopien', symbol: 'ETB', region: 'Afrique de l\'Est' },
    { code: 'SOS', name: 'Shilling Somalien', symbol: 'S', region: 'Afrique de l\'Est' },
    { code: 'SDG', name: 'Dinar Soudanais', symbol: 'SDG', region: 'Afrique de l\'Est' },
    { code: 'SSP', name: 'Livre Sud-Soudanaise', symbol: 'SSP', region: 'Afrique de l\'Est' },
    { code: 'ERN', name: 'Nakfa Érythréen', symbol: 'ERN', region: 'Afrique de l\'Est' },
    { code: 'DJF', name: 'Franc Djiboutien', symbol: 'Fdj', region: 'Afrique de l\'Est' },
    // Afrique Australe
    { code: 'ZAR', name: 'Rand Sud-Africain', symbol: 'R', region: 'Afrique Australe' },
    { code: 'BWP', name: 'Pula Botswanais', symbol: 'P', region: 'Afrique Australe' },
    { code: 'NAD', name: 'Dollar Namibien', symbol: 'N$', region: 'Afrique Australe' },
    { code: 'ZMW', name: 'Kwacha Zambien', symbol: 'ZK', region: 'Afrique Australe' },
    { code: 'MZN', name: 'Metical Mozambicain', symbol: 'MT', region: 'Afrique Australe' },
    { code: 'MWK', name: 'Kwacha Malawien', symbol: 'MK', region: 'Afrique Australe' },
    { code: 'SZL', name: 'Lilangeni Swazi', symbol: 'SZL', region: 'Afrique Australe' },
    { code: 'LSL', name: 'Loti Lesothan', symbol: 'L', region: 'Afrique Australe' },
    { code: 'AOA', name: 'Kwanza Angolais', symbol: 'Kz', region: 'Afrique Australe' },
    { code: 'ZWL', name: 'Dollar Zimbabwéen', symbol: 'Z$', region: 'Afrique Australe' },
    // Internationales
    { code: 'USD', name: 'Dollar Américain', symbol: '$', region: 'International' },
    { code: 'EUR', name: 'Euro', symbol: '€', region: 'International' },
    { code: 'GBP', name: 'Livre Sterling', symbol: '£', region: 'International' },
    { code: 'CAD', name: 'Dollar Canadien', symbol: 'C$', region: 'International' },
    { code: 'CNY', name: 'Yuan Chinois', symbol: '¥', region: 'International' },
  ];

  const currentCurrency = currencies.find(c => c.code === currency) || currencies[0];

  const handleCurrencySelect = (currencyCode) => {
    setCurrency(currencyCode);
    setModalVisible(false);
  };

  const renderCurrencyItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.currencyItem,
        item.code === currency && styles.currencyItemSelected
      ]}
      onPress={() => handleCurrencySelect(item.code)}
    >
      <View style={styles.currencyInfo}>
        <Text style={styles.currencyCode}>{item.code}</Text>
        <Text style={styles.currencyName}>{item.name}</Text>
        <Text style={styles.currencySymbol}>{item.symbol}</Text>
      </View>
      {item.code === currency && (
        <MaterialIcons name="check" size={20} color="#3b82f6" />
      )}
    </TouchableOpacity>
  );

  // Grouper par région
  const groupedCurrencies = currencies.reduce((acc, currency) => {
    if (!acc[currency.region]) {
      acc[currency.region] = [];
    }
    acc[currency.region].push(currency);
    return acc;
  }, {});

  return (
    <>
      <TouchableOpacity
        style={styles.currencySelector}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.currencyCode}>{currentCurrency.code}</Text>
        <MaterialIcons name="keyboard-arrow-down" size={16} color="#6b7280" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <MaterialIcons name="close" size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Choisir la devise</Text>
            <View style={{ width: 24 }} />
          </View>

          <FlatList
            data={Object.keys(groupedCurrencies)}
            keyExtractor={(region) => region}
            renderItem={({ item: region }) => (
              <View style={styles.regionSection}>
                <Text style={styles.regionTitle}>{region}</Text>
                {groupedCurrencies[region].map((currency) => (
                  <View key={currency.code}>
                    {renderCurrencyItem({ item: currency })}
                  </View>
                ))}
              </View>
            )}
            style={styles.currencyList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  currencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  currencyCode: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginRight: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  currencyList: {
    flex: 1,
  },
  regionSection: {
    marginBottom: 24,
  },
  regionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    marginBottom: 8,
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
  },
  currencyItemSelected: {
    backgroundColor: '#eff6ff',
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  currencyInfo: {
    flex: 1,
  },
  currencyCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  currencyName: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  currencySymbol: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
});

export default CurrencySelector;

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState('EUR');
  const [exchangeRates, setExchangeRates] = useState({
    EUR: 1,
    USD: 1.08,
    GBP: 0.86,
    XAF: 655.96,
    XOF: 655.96,
    CAD: 1.45,
    CHF: 0.94,
    JPY: 162.50,
    CNY: 7.85,
    INR: 88.50
  });

  useEffect(() => {
    loadCurrencyPreference();
  }, []);

  const loadCurrencyPreference = async () => {
    try {
      const storedCurrency = await AsyncStorage.getItem('preferredCurrency');
      if (storedCurrency) {
        setCurrency(storedCurrency);
      }
    } catch (error) {
      console.error('Error loading currency preference:', error);
    }
  };

  const changeCurrency = async (newCurrency) => {
    try {
      setCurrency(newCurrency);
      await AsyncStorage.setItem('preferredCurrency', newCurrency);
    } catch (error) {
      console.error('Error saving currency preference:', error);
    }
  };

  const formatCurrency = (amount, targetCurrency = currency) => {
    const rate = exchangeRates[targetCurrency] || 1;
    const convertedAmount = amount * rate;
    
    const currencySymbols = {
      EUR: '€',
      USD: '$',
      GBP: '£',
      XAF: 'FCFA',
      XOF: 'FCFA',
      CAD: 'C$',
      CHF: 'CHF',
      JPY: '¥',
      CNY: '¥',
      INR: '₹'
    };

    const symbol = currencySymbols[targetCurrency] || targetCurrency;
    
    // Formatage selon la devise
    if (targetCurrency === 'XAF' || targetCurrency === 'XOF') {
      return `${symbol} ${convertedAmount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}`;
    } else if (targetCurrency === 'JPY' || targetCurrency === 'CNY') {
      return `${symbol} ${convertedAmount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
    } else {
      return `${symbol} ${convertedAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
    }
  };

  const convertAmount = (amount, fromCurrency = 'EUR', toCurrency = currency) => {
    const fromRate = exchangeRates[fromCurrency] || 1;
    const toRate = exchangeRates[toCurrency] || 1;
    return (amount / fromRate) * toRate;
  };

  const value = {
    currency,
    exchangeRates,
    changeCurrency,
    formatCurrency,
    convertAmount,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

import React, { createContext, useContext, useMemo } from 'react';
import { useEcomAuth } from '../hooks/useEcomAuth';

// Taux de conversion (base XAF/FCFA)
export const conversionRates = {
  XAF: 1,
  XOF: 1,
  CDF: 3.5,
  NGN: 1.35,
  GHS: 0.0095,
  USD: 0.0016,
  EUR: 0.0015,
  GBP: 0.0013,
  CAD: 0.0022,
  MAD: 0.015,
  TND: 0.0046,
  DZD: 0.22,
  EGP: 0.083,
  KES: 0.22,
  ZAR: 0.030
};

// Infos des devises
const currencyInfo = {
  XAF: { symbol: 'FCFA', name: 'Franc CFA (CEMAC)', locale: 'fr-CM' },
  XOF: { symbol: 'FCFA', name: 'Franc CFA (UEMOA)', locale: 'fr-SN' },
  CDF: { symbol: 'FC', name: 'Franc Congolais', locale: 'fr-CD' },
  NGN: { symbol: '₦', name: 'Naira', locale: 'en-NG' },
  GHS: { symbol: 'GH₵', name: 'Cedi', locale: 'en-GH' },
  USD: { symbol: '$', name: 'Dollar US', locale: 'en-US' },
  EUR: { symbol: '€', name: 'Euro', locale: 'fr-FR' },
  GBP: { symbol: '£', name: 'Livre Sterling', locale: 'en-GB' },
  CAD: { symbol: 'CA$', name: 'Dollar Canadien', locale: 'en-CA' },
  MAD: { symbol: 'DH', name: 'Dirham Marocain', locale: 'fr-MA' },
  TND: { symbol: 'DT', name: 'Dinar Tunisien', locale: 'fr-TN' },
  DZD: { symbol: 'DA', name: 'Dinar Algérien', locale: 'fr-DZ' },
  EGP: { symbol: 'E£', name: 'Livre Égyptienne', locale: 'ar-EG' },
  KES: { symbol: 'KSh', name: 'Shilling Kenyan', locale: 'en-KE' },
  ZAR: { symbol: 'R', name: 'Rand', locale: 'en-ZA' }
};

const getCurrencyInfo = (code) => {
  return currencyInfo[code] || { symbol: code, name: code, locale: 'fr-FR' };
};

const formatMoney = (amount, currencyCode) => {
  if (amount === null || amount === undefined) return '0 FCFA';
  const num = Number(amount);
  if (isNaN(num)) return '0 FCFA';
  
  const info = getCurrencyInfo(currencyCode);
  try {
    return num.toLocaleString(info.locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }) + ' ' + info.symbol;
  } catch {
    return num.toLocaleString('fr-FR') + ' ' + info.symbol;
  }
};

const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
  const { user } = useEcomAuth();
  
  const currencyCode = user?.currency || 'XAF';
  const info = getCurrencyInfo(currencyCode);

  // Convertir un montant
  const convert = (amount, fromCurrency = 'XAF') => {
    if (amount === undefined || amount === null) return null;
    if (fromCurrency === currencyCode) return parseFloat(amount);
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return null;
    
    const baseRate = conversionRates[fromCurrency] || 1;
    const amountInXAF = numAmount / baseRate;
    const targetRate = conversionRates[currencyCode] || 1;
    return amountInXAF * targetRate;
  };

  // Formater avec conversion
  const format = (amount, fromCurrency = 'XAF') => {
    try {
      const converted = convert(amount, fromCurrency);
      return formatMoney(converted, currencyCode);
    } catch (error) {
      return `${Number(amount || 0).toLocaleString('fr-FR')} ${currencyCode}`;
    }
  };

  // Formater sans conversion
  const formatRaw = (amount) => {
    try {
      return formatMoney(amount, currencyCode);
    } catch (error) {
      return `${Number(amount || 0).toLocaleString('fr-FR')} ${currencyCode}`;
    }
  };

  const value = useMemo(() => ({
    code: currencyCode,
    symbol: info.symbol,
    name: info.name,
    convert,
    format,
    formatRaw,
    rates: conversionRates
  }), [currencyCode]);

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency doit être utilisé dans un CurrencyProvider');
  }
  return context;
};

export default CurrencyContext;

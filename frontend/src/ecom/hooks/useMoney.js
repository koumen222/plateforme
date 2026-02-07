import { useCurrency } from '../contexts/CurrencyContext.jsx';

// Hook simple pour formater les montants dans la devise de l'utilisateur
export const useMoney = () => {
  const { format, formatRaw, convert, code, symbol } = useCurrency();
  
  return {
    // Formater un montant (conversion automatique depuis XAF par défaut)
    fmt: (amount, fromCurrency = 'XAF') => format(amount, fromCurrency),
    
    // Formater sans conversion (déjà dans la devise cible)
    fmtRaw: (amount) => formatRaw(amount),
    
    // Convertir un montant
    convert: (amount, fromCurrency = 'XAF') => convert(amount, fromCurrency),
    
    // Infos de la devise
    currency: code,
    symbol: symbol
  };
};

export default useMoney;

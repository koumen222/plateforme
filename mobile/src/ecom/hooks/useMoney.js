import { useCurrency } from '../contexts/CurrencyContext';

// Hook simple pour formater les montants
export const useMoney = () => {
  try {
    const context = useCurrency();
    return {
      fmt: (amount, fromCurrency = 'XAF') => context.format(amount, fromCurrency),
      fmtRaw: (amount) => context.formatRaw(amount),
      convert: (amount, fromCurrency = 'XAF') => context.convert(amount, fromCurrency),
      currency: context.code,
      symbol: context.symbol
    };
  } catch (error) {
    // Fallback si le contexte n'est pas disponible
    return {
      fmt: (amount) => {
        if (amount === null || amount === undefined) return '0 FCFA';
        const num = Number(amount);
        if (isNaN(num)) return '0 FCFA';
        return `${num.toLocaleString('fr-FR')} FCFA`;
      },
      fmtRaw: (amount) => {
        if (amount === null || amount === undefined) return '0 FCFA';
        const num = Number(amount);
        if (isNaN(num)) return '0 FCFA';
        return `${num.toLocaleString('fr-FR')} FCFA`;
      },
      convert: (amount) => Number(amount) || 0,
      currency: 'XAF',
      symbol: 'FCFA'
    };
  }
};

export default useMoney;

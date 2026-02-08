import { useContext } from 'react';
import { CurrencyContext } from './CurrencyContext';

export const useMoney = () => {
  const { currency, formatCurrency } = useContext(CurrencyContext);
  
  const fmt = (amount) => {
    return formatCurrency(amount, currency);
  };

  return { fmt, currency };
};

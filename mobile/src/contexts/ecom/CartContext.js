import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const CartContext = createContext(null);

const API_URL = 'http://localhost:3000'; // Adapter selon votre configuration

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderProcessing, setOrderProcessing] = useState(false);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const storedCart = await AsyncStorage.getItem('cart');
      if (storedCart) {
        setCart(JSON.parse(storedCart));
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveCart = async (newCart) => {
    try {
      await AsyncStorage.setItem('cart', JSON.stringify(newCart));
      setCart(newCart);
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  };

  const addToCart = async (product, quantity = 1) => {
    const existingItem = cart.find(item => item.id === product.id);
    let newCart;

    if (existingItem) {
      newCart = cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
    } else {
      newCart = [...cart, { ...product, quantity }];
    }

    await saveCart(newCart);
  };

  const removeFromCart = async (productId) => {
    const newCart = cart.filter(item => item.id !== productId);
    await saveCart(newCart);
  };

  const updateQuantity = async (productId, quantity) => {
    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }

    const newCart = cart.map(item =>
      item.id === productId ? { ...item, quantity } : item
    );
    await saveCart(newCart);
  };

  const clearCart = async () => {
    await saveCart([]);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      const price = item.price || item.prix || 0;
      return total + (price * item.quantity);
    }, 0);
  };

  const getCartItemsCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const createOrder = async (shippingAddress, paymentMethod) => {
    try {
      setOrderProcessing(true);

      const orderData = {
        items: cart.map(item => ({
          productId: item.id,
          name: item.name || item.nom,
          quantity: item.quantity,
          price: item.price || item.prix,
          image: item.image || item.image_url
        })),
        totalAmount: getCartTotal(),
        shippingAddress,
        paymentMethod,
        status: 'pending'
      };

      const response = await axios.post(`${API_URL}/api/ecom/orders`, orderData, {
        headers: {
          'Authorization': `Bearer ${await AsyncStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        await clearCart();
        return { success: true, order: response.data.order };
      } else {
        throw new Error(response.data.error || 'Erreur lors de la création de la commande');
      }
    } catch (error) {
      console.error('Create order error:', error);
      return { success: false, error: error.message };
    } finally {
      setOrderProcessing(false);
    }
  };

  const value = {
    cart,
    loading,
    orderProcessing,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartItemsCount,
    createOrder,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

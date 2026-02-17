import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://localhost:3000'; // Adapter selon votre configuration

// Créer une instance axios avec configuration de base
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('ecomToken');
    const workspace = await AsyncStorage.getItem('ecomWorkspace');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (workspace) {
      const workspaceData = JSON.parse(workspace);
      config.headers['X-Workspace-ID'] = workspaceData.id || 'default';
    }
    
    return config;
  } catch (error) {
    console.error('Error in request interceptor:', error);
    return config;
  }
});

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      await AsyncStorage.removeItem('ecomToken');
      await AsyncStorage.removeItem('ecomUser');
      await AsyncStorage.removeItem('ecomWorkspace');
      // Rediriger vers la page de connexion (géré par le contexte d'auth)
    }
    return Promise.reject(error);
  }
);

// Services API pour l'e-commerce
export const ecomApi = {
  // Authentification
  auth: {
    login: (credentials) => api.post('/api/ecom/login', credentials),
    register: (userData) => api.post('/api/ecom/register', userData),
    me: () => api.get('/api/ecom/auth/me'),
    updateProfile: (userData) => api.put('/api/ecom/profile', userData),
  },

  // Produits
  products: {
    getAll: (params = {}) => api.get('/api/ecom/products', { params }),
    getById: (id) => api.get(`/api/ecom/products/${id}`),
    create: (productData) => api.post('/api/ecom/products', productData),
    update: (id, productData) => api.put(`/api/ecom/products/${id}`, productData),
    delete: (id) => api.delete(`/api/ecom/products/${id}`),
    getFeatured: () => api.get('/api/ecom/products/featured'),
    getByCategory: (categoryId) => api.get(`/api/ecom/products/category/${categoryId}`),
    search: (query) => api.get(`/api/ecom/products/search?q=${encodeURIComponent(query)}`),
  },

  // Catégories
  categories: {
    getAll: () => api.get('/api/ecom/categories'),
    getById: (id) => api.get(`/api/ecom/categories/${id}`),
    create: (categoryData) => api.post('/api/ecom/categories', categoryData),
    update: (id, categoryData) => api.put(`/api/ecom/categories/${id}`, categoryData),
    delete: (id) => api.delete(`/api/ecom/categories/${id}`),
  },

  // Commandes
  orders: {
    getAll: (params = {}) => api.get('/api/ecom/orders', { params }),
    getById: (id) => api.get(`/api/ecom/orders/${id}`),
    create: (orderData) => api.post('/api/ecom/orders', orderData),
    update: (id, orderData) => api.put(`/api/ecom/orders/${id}`, orderData),
    cancel: (id) => api.post(`/api/ecom/orders/${id}/cancel`),
    getUserOrders: () => api.get('/api/ecom/orders/user'),
  },

  // Panier
  cart: {
    get: () => api.get('/api/ecom/cart'),
    addItem: (item) => api.post('/api/ecom/cart/add', item),
    updateItem: (itemId, quantity) => api.put(`/api/ecom/cart/${itemId}`, { quantity }),
    removeItem: (itemId) => api.delete(`/api/ecom/cart/${itemId}`),
    clear: () => api.delete('/api/ecom/cart'),
  },

  // Clients
  clients: {
    getAll: (params = {}) => api.get('/api/ecom/clients', { params }),
    getById: (id) => api.get(`/api/ecom/clients/${id}`),
    create: (clientData) => api.post('/api/ecom/clients', clientData),
    update: (id, clientData) => api.put(`/api/ecom/clients/${id}`, clientData),
    delete: (id) => api.delete(`/api/ecom/clients/${id}`),
  },

  // Transactions
  transactions: {
    getAll: (params = {}) => api.get('/api/ecom/transactions', { params }),
    getById: (id) => api.get(`/api/ecom/transactions/${id}`),
    create: (transactionData) => api.post('/api/ecom/transactions', transactionData),
    update: (id, transactionData) => api.put(`/api/ecom/transactions/${id}`, transactionData),
  },

  // Stock
  stock: {
    getAll: (params = {}) => api.get('/api/ecom/stock', { params }),
    getById: (id) => api.get(`/api/ecom/stock/${id}`),
    update: (id, stockData) => api.put(`/api/ecom/stock/${id}`, stockData),
    getLowStock: () => api.get('/api/ecom/stock/low'),
  },

  // Rapports
  reports: {
    getSales: (params = {}) => api.get('/api/ecom/reports/sales', { params }),
    getRevenue: (params = {}) => api.get('/api/ecom/reports/revenue', { params }),
    getProducts: (params = {}) => api.get('/api/ecom/reports/products', { params }),
    getCustomers: (params = {}) => api.get('/api/ecom/reports/customers', { params }),
  },

  // Campagnes
  campaigns: {
    getAll: (params = {}) => api.get('/api/ecom/campaigns', { params }),
    getById: (id) => api.get(`/api/ecom/campaigns/${id}`),
    create: (campaignData) => api.post('/api/ecom/campaigns', campaignData),
    update: (id, campaignData) => api.put(`/api/ecom/campaigns/${id}`, campaignData),
    delete: (id) => api.delete(`/api/ecom/campaigns/${id}`),
  },

  // Utilisateurs (Admin)
  users: {
    getAll: (params = {}) => api.get('/api/ecom/users', { params }),
    getById: (id) => api.get(`/api/ecom/users/${id}`),
    create: (userData) => api.post('/api/ecom/users', userData),
    update: (id, userData) => api.put(`/api/ecom/users/${id}`, userData),
    delete: (id) => api.delete(`/api/ecom/users/${id}`),
    toggleStatus: (id) => api.post(`/api/ecom/users/${id}/toggle-status`),
  },

  // Paramètres
  settings: {
    get: () => api.get('/api/ecom/settings'),
    update: (settingsData) => api.put('/api/ecom/settings', settingsData),
  },
};

export default api;

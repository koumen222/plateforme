import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration de base pour l'API e-commerce
// Pour le développement: utiliser l'IP locale de votre ordinateur
// Remplacez par votre IP locale (ex: 192.168.1.x) - trouvez-la avec 'ipconfig' sur Windows
const API_BASE_URL = 'http://192.168.1.142:3000';
const ECOM_API_PREFIX = '/api/ecom';

// Créer une instance axios avec configuration par défaut
const ecomApi = axios.create({
  baseURL: `${API_BASE_URL}${ECOM_API_PREFIX}`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercepteur pour ajouter le token d'authentification
ecomApi.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('ecomToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Erreur lecture token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs
ecomApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Gérer l'expiration du token
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('ecomToken');
      await AsyncStorage.removeItem('ecomUser');
      await AsyncStorage.removeItem('ecomWorkspace');
    }
    
    // Gérer les erreurs réseau
    if (!error.response) {
      console.error('Erreur réseau:', error.message);
      throw new Error('Impossible de contacter le serveur. Vérifiez votre connexion.');
    }
    
    throw error;
  }
);

// Services d'API organisés par ressource
export const authApi = {
  login: (credentials) => ecomApi.post('/auth/login', credentials),
  register: (userData) => ecomApi.post('/auth/register', userData),
  getProfile: () => ecomApi.get('/auth/me'),
  updateProfile: (data) => ecomApi.put('/auth/profile', data),
  changePassword: (passwords) => ecomApi.put('/auth/change-password', passwords),
  changeCurrency: (data) => ecomApi.put('/auth/currency', data)
};

export const productsApi = {
  getProducts: (params = {}) => ecomApi.get('/products', { params }),
  getProduct: (id) => ecomApi.get(`/products/${id}`),
  createProduct: (data) => ecomApi.post('/products', data),
  updateProduct: (id, data) => ecomApi.put(`/products/${id}`, data),
  deleteProduct: (id) => ecomApi.delete(`/products/${id}`),
  getStats: () => ecomApi.get('/products/stats/overview')
};

export const reportsApi = {
  getReports: (params = {}) => ecomApi.get('/reports', { params }),
  getReport: (id) => ecomApi.get(`/reports/${id}`),
  createReport: (data) => ecomApi.post('/reports', data),
  updateReport: (id, data) => ecomApi.put(`/reports/${id}`, data),
  deleteReport: (id) => ecomApi.delete(`/reports/${id}`),
  getFinancialStats: (params = {}) => ecomApi.get('/reports/stats/financial', { params })
};

export const ordersApi = {
  getOrders: (params = {}) => ecomApi.get('/orders', { params }),
  getOrder: (id) => ecomApi.get(`/orders/${id}`),
  createOrder: (data) => ecomApi.post('/orders', data),
  updateOrder: (id, data) => ecomApi.put(`/orders/${id}`, data),
  deleteOrder: (id) => ecomApi.delete(`/orders/${id}`),
  // Delivery functions
  sendToDelivery: (id) => ecomApi.post(`/orders/${id}/send-to-delivery`),
  assignDelivery: (id, data) => ecomApi.put(`/orders/${id}/assign-delivery`, data),
  markDelivered: (id) => ecomApi.put(`/orders/${id}/mark-delivered`),
  // Google Sheets sync
  syncSheets: () => ecomApi.post('/orders/sync-sheets', {}, { timeout: 120000 }),
  getSettings: () => ecomApi.get('/orders/settings'),
  updateSettings: (data) => ecomApi.put('/orders/settings', data),
  backfillClients: () => ecomApi.post('/orders/backfill-clients', {}, { timeout: 120000 })
};

export const clientsApi = {
  getClients: (params = {}) => ecomApi.get('/clients', { params }),
  getClient: (id) => ecomApi.get(`/clients/${id}`),
  createClient: (data) => ecomApi.post('/clients', data),
  updateClient: (id, data) => ecomApi.put(`/clients/${id}`, data),
  deleteClient: (id) => ecomApi.delete(`/clients/${id}`)
};

export const stockApi = {
  getStockOrders: (params = {}) => ecomApi.get('/stock/orders', { params }),
  getStockOrder: (id) => ecomApi.get(`/stock/orders/${id}`),
  createStockOrder: (data) => ecomApi.post('/stock/orders', data),
  receiveStockOrder: (id, data) => ecomApi.put(`/stock/orders/${id}/receive`, data),
  cancelStockOrder: (id) => ecomApi.put(`/stock/orders/${id}/cancel`),
  getStockAlerts: () => ecomApi.get('/stock/alerts'),
  getStockOverview: () => ecomApi.get('/stock/overview')
};

export const transactionsApi = {
  getTransactions: (params = {}) => ecomApi.get('/transactions', { params }),
  getTransaction: (id) => ecomApi.get(`/transactions/${id}`),
  createTransaction: (data) => ecomApi.post('/transactions', data),
  updateTransaction: (id, data) => ecomApi.put(`/transactions/${id}`, data),
  deleteTransaction: (id) => ecomApi.delete(`/transactions/${id}`),
  getSummary: (params = {}) => ecomApi.get('/transactions/summary', { params })
};

export const campaignsApi = {
  getCampaigns: (params = {}) => ecomApi.get('/campaigns', { params }),
  getCampaign: (id) => ecomApi.get(`/campaigns/${id}`),
  createCampaign: (data) => ecomApi.post('/campaigns', data),
  updateCampaign: (id, data) => ecomApi.put(`/campaigns/${id}`, data),
  deleteCampaign: (id) => ecomApi.delete(`/campaigns/${id}`)
};

export const decisionsApi = {
  getDecisions: (params = {}) => ecomApi.get('/decisions', { params }),
  getDecision: (id) => ecomApi.get(`/decisions/${id}`),
  createDecision: (data) => ecomApi.post('/decisions', data),
  assignDecision: (id, data) => ecomApi.put(`/decisions/${id}/assign`, data),
  completeDecision: (id, data) => ecomApi.put(`/decisions/${id}/complete`, data),
  cancelDecision: (id) => ecomApi.put(`/decisions/${id}/cancel`),
  getDecisionDashboard: () => ecomApi.get('/decisions/dashboard/overview'),
  getDashboardOverview: () => ecomApi.get('/decisions/dashboard/overview')
};

export const usersApi = {
  getUsers: (params = {}) => ecomApi.get('/users', { params }),
  getUser: (id) => ecomApi.get(`/users/${id}`),
  createUser: (data) => ecomApi.post('/users', data),
  updateUser: (id, data) => ecomApi.put(`/users/${id}`, data),
  deleteUser: (id) => ecomApi.delete(`/users/${id}`),
  toggleUserStatus: (id) => ecomApi.post(`/users/${id}/toggle-status`)
};

export default ecomApi;

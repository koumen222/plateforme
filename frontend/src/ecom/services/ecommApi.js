import axios from 'axios';

// Configuration de base pour l'API e-commerce
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
const ECOM_API_PREFIX = '/api/ecom';

// Créer une instance axios avec configuration par défaut
const ecomApi = axios.create({
  baseURL: `${API_BASE_URL}${ECOM_API_PREFIX}`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercepteur pour ajouter le token d'authentification
ecomApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ecomToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs
ecomApi.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Gérer l'expiration du token
    if (error.response?.status === 401) {
      localStorage.removeItem('ecomToken');
      localStorage.removeItem('ecomUser');
      window.location.href = '/ecom/login';
    }
    
    // Gérer les erreurs réseau
    if (!error.response) {
      console.error('Erreur réseau:', error.message);
      throw new Error('Impossible de contacter le serveur. Vérifiez votre connexion.');
    }
    
    // Propager l'erreur avec le message du serveur
    throw error;
  }
);

// Services d'API organisés par ressource
export const authApi = {
  // Connexion
  login: (credentials) => ecomApi.post('/auth/login', credentials),
  
  // Inscription (admin seulement)
  register: (userData) => ecomApi.post('/auth/register', userData),
  
  // Obtenir le profil utilisateur
  getProfile: () => ecomApi.get('/auth/me'),
  
  // Changer le mot de passe
  changePassword: (passwords) => ecomApi.put('/auth/change-password', passwords)
};

export const productsApi = {
  // Liste des produits
  getProducts: (params = {}) => ecomApi.get('/products', { params }),
  
  // Détail d'un produit
  getProduct: (id) => ecomApi.get(`/products/${id}`),
  
  // Créer un produit
  createProduct: (data) => ecomApi.post('/products', data),
  
  // Mettre à jour un produit
  updateProduct: (id, data) => ecomApi.put(`/products/${id}`, data),
  
  // Supprimer un produit
  deleteProduct: (id) => ecomApi.delete(`/products/${id}`),
  
  // Statistiques produits
  getStats: () => ecomApi.get('/products/stats/overview')
};

export const reportsApi = {
  // Liste des rapports
  getReports: (params = {}) => ecomApi.get('/reports', { params }),
  
  // Détail d'un rapport
  getReport: (id) => ecomApi.get(`/reports/${id}`),
  
  // Créer un rapport
  createReport: (data) => ecomApi.post('/reports', data),
  
  // Mettre à jour un rapport
  updateReport: (id, data) => ecomApi.put(`/reports/${id}`, data),
  
  // Supprimer un rapport
  deleteReport: (id) => ecomApi.delete(`/reports/${id}`),
  
  // Statistiques financières
  getFinancialStats: (params = {}) => ecomApi.get('/reports/stats/financial', { params })
};

export const stockApi = {
  // Commandes de stock
  getStockOrders: (params = {}) => ecomApi.get('/stock/orders', { params }),
  
  // Détail d'une commande de stock
  getStockOrder: (id) => ecomApi.get(`/stock/orders/${id}`),
  
  // Créer une commande de stock
  createStockOrder: (data) => ecomApi.post('/stock/orders', data),
  
  // Marquer une commande comme reçue
  receiveStockOrder: (id, data) => ecomApi.put(`/stock/orders/${id}/receive`, data),
  
  // Annuler une commande de stock
  cancelStockOrder: (id) => ecomApi.put(`/stock/orders/${id}/cancel`),
  
  // Alertes de stock
  getStockAlerts: () => ecomApi.get('/stock/alerts'),
  
  // Vue d'ensemble du stock
  getStockOverview: () => ecomApi.get('/stock/overview')
};

export const decisionsApi = {
  // Liste des décisions
  getDecisions: (params = {}) => ecomApi.get('/decisions', { params }),
  
  // Détail d'une décision
  getDecision: (id) => ecomApi.get(`/decisions/${id}`),
  
  // Créer une décision
  createDecision: (data) => ecomApi.post('/decisions', data),
  
  // Assigner une décision
  assignDecision: (id, data) => ecomApi.put(`/decisions/${id}/assign`, data),
  
  // Marquer une décision comme complétée
  completeDecision: (id, data) => ecomApi.put(`/decisions/${id}/complete`, data),
  
  // Annuler une décision
  cancelDecision: (id) => ecomApi.put(`/decisions/${id}/cancel`),
  
  // Dashboard des décisions
  getDecisionDashboard: () => ecomApi.get('/decisions/dashboard/overview')
};

// Export par défaut l'instance axios pour usage direct
export default ecomApi;

// Utilitaires pour les requêtes courantes
export const apiUtils = {
  // Gestion des erreurs standardisée
  handleError: (error) => {
    const message = error.response?.data?.message || error.message || 'Erreur inconnue';
    console.error('Erreur API:', message, error);
    return message;
  },
  
  // Vérifier si l'erreur est une erreur d'authentification
  isAuthError: (error) => {
    return error.response?.status === 401 || error.response?.status === 403;
  },
  
  // Vérifier si l'erreur est une erreur de validation
  isValidationError: (error) => {
    return error.response?.status === 400 && error.response?.data?.errors;
  },
  
  // Extraire les erreurs de validation
  getValidationErrors: (error) => {
    return error.response?.data?.errors || [];
  },
  
  // Formatage des paramètres de requête
  formatQueryParams: (params) => {
    const filtered = Object.entries(params).filter(([_, value]) => 
      value !== undefined && value !== null && value !== ''
    );
    return Object.fromEntries(filtered);
  }
};

// Fonctions utilitaires pour les opérations courantes
export const quickApi = {
  // Charger les données du dashboard selon le rôle
  loadDashboardData: async (userRole) => {
    try {
      const requests = [];
      
      // Requêtes communes à tous les rôles
      requests.push(productsApi.getProducts({ isActive: true }));
      
      // Requêtes spécifiques au rôle
      if (userRole === 'ecom_admin') {
        requests.push(
          stockApi.getStockAlerts(),
          reportsApi.getFinancialStats(),
          decisionsApi.getDecisionDashboard()
        );
      } else if (userRole === 'ecom_compta') {
        requests.push(
          reportsApi.getFinancialStats(),
          productsApi.getStats()
        );
      } else if (userRole === 'ecom_closeuse') {
        const today = new Date().toISOString().split('T')[0];
        requests.push(reportsApi.getReports({ date: today }));
      }
      
      const responses = await Promise.all(requests);
      return responses;
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
      throw error;
    }
  },
  
  // Créer un rapport quotidien avec validation
  createDailyReport: async (data) => {
    try {
      // Validation côté client
      if (data.ordersDelivered > data.ordersReceived) {
        throw new Error('Le nombre de commandes livrées ne peut pas dépasser le nombre de commandes reçues');
      }
      
      return await reportsApi.createReport(data);
    } catch (error) {
      throw error;
    }
  },
  
  // Vérifier les permissions avant une action
  checkPermissions: async (action, resource) => {
    try {
      // Cette fonction pourrait faire une vérification côté serveur
      // Pour l'instant, on fait une vérification locale basée sur le token
      const token = localStorage.getItem('ecomToken');
      if (!token) {
        throw new Error('Non authentifié');
      }
      
      // Le token sera validé par l'intercepteur axios
      return true;
    } catch (error) {
      return false;
    }
  }
};

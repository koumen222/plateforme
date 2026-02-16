import axios from 'axios';

// Détection automatique de l'environnement
const getApiBaseUrl = () => {
  // En priorité: variable d'environnement
  const envUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_BASE_URL;
  if (envUrl) {
    return envUrl;
  }

  // Détection automatique selon l'environnement
  const isLocalhost = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' ||
                     window.location.hostname.includes('192.168.') ||
                     window.location.hostname.includes('10.') ||
                     window.location.hostname.includes('172.');
  
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isLocalhost && !isMobile) {
    // Développement local sur desktop
    return 'http://localhost:3000';
  } else if (isLocalhost && isMobile) {
    // Développement local sur mobile (connecté au même réseau)
    return 'http://192.168.1.100:3000'; // À adapter selon votre IP locale
  } else {
    // Production ou mobile externe
    return 'https://plateforme-backend.onrender.com';
  }
};

// Configuration de base pour l'API e-commerce
const API_BASE_URL = getApiBaseUrl();
const ECOM_API_PREFIX = '/api/ecom';

console.log('🔗 API Base URL:', API_BASE_URL);

// Créer une instance axios avec configuration par défaut
const ecomApi = axios.create({
  baseURL: `${API_BASE_URL}${ECOM_API_PREFIX}`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercepteur pour ajouter le token d'authentification et le workspaceId
ecomApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ecomToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Ajouter automatiquement le workspaceId aux requêtes
    const workspace = JSON.parse(localStorage.getItem('ecomWorkspace') || 'null');
    const wsId = workspace?._id || workspace?.id;
    
    if (wsId) {
      // Ajouter workspaceId aux params si c'est une requête GET
      if (config.method === 'get' && config.params) {
        config.params.workspaceId = wsId;
      } else if (config.method === 'get' && !config.params) {
        config.params = { workspaceId: wsId };
      }
      // Ajouter workspaceId au body si c'est une requête POST/PUT/DELETE
      else if (['post', 'put', 'patch'].includes(config.method) && config.data) {
        config.data.workspaceId = wsId;
      } else if (['post', 'put', 'patch'].includes(config.method) && !config.data) {
        config.data = { workspaceId: wsId };
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs et logger les réponses
ecomApi.interceptors.response.use(
  (response) => {
    // Logger les réponses avec workspace pour le débogage
    const workspace = JSON.parse(localStorage.getItem('ecomWorkspace') || 'null');
    if (workspace && workspace._id) {
      console.log(`✅ Réponse reçue pour ${response.config.method?.toUpperCase()} ${response.config.url} avec workspace ${workspace.name} (${workspace._id})`);
      if (response.data && response.data.data) {
        const dataCount = Array.isArray(response.data.data) ? response.data.data.length : Object.keys(response.data.data).length;
        console.log(`📊 Données chargées: ${dataCount} éléments`);
      }
    }
    return response;
  },
  (error) => {
    // Gérer les erreurs de connexion
    if (!error.response) {
      // Erreur réseau ou connexion impossible
      console.error('🔌 Erreur de connexion au backend:', error.message);
      
      if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        console.error('❌ Backend inaccessible. Vérifiez:');
        console.error('   1. Que le backend est démarré');
        console.error('   2. L\'URL de l\'API:', API_BASE_URL);
        console.error('   3. Votre connexion réseau');
        
        // Message utilisateur pour mobile
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
          alert('🔌 Problème de connexion\n\nLe backend est inaccessible.\n\nVérifiez:\n• Votre connexion internet\n• Que le backend est en ligne\n• L\'adresse du serveur\n\nURL: ' + API_BASE_URL);
        }
      } else if (error.code === 'ERR_NETWORK' || error.message.includes('ERR_NETWORK')) {
        console.error('🌐 Erreur réseau. Vérifiez votre connexion WiFi/4G');
        
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
          alert('🌐 Erreur réseau\n\nVérifiez votre connexion internet (WiFi/4G/5G).\n\nURL: ' + API_BASE_URL);
        }
      }
      
      return Promise.reject(new Error('Erreur de connexion au backend'));
    }

    // Gérer l'expiration du token
    if (error.response?.status === 401) {
      console.log('🔑 Token expiré, déconnexion...');
      localStorage.removeItem('ecomToken');
      localStorage.removeItem('ecomUser');
      localStorage.removeItem('ecomWorkspace');
      
      // Rediriger vers login si on n'y est pas déjà
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      
      return Promise.reject(error);
    }

    // Gérer les autres erreurs HTTP
    if (error.response) {
      console.error(`❌ Erreur HTTP ${error.response.status}:`, error.response.data);
      
      // Messages spécifiques pour mobile
      if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        if (error.response.status >= 500) {
          alert('🔴 Erreur serveur\n\nLe backend rencontre un problème technique.\nRéessayez plus tard.');
        } else if (error.response.status === 404) {
          alert('🔍 Page non trouvée\n\nLa ressource demandée n\'existe pas.');
        } else if (error.response.status === 403) {
          alert('🚫 Accès refusé\n\nVous n\'avez pas les permissions nécessaires.');
        }
      }
    }

    return Promise.reject(error);
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
  
  // Mettre à jour le profil (name, phone)
  updateProfile: (data) => ecomApi.put('/auth/profile', data),
  
  // Changer le mot de passe
  changePassword: (passwords) => ecomApi.put('/auth/change-password', passwords),
  
  // Changer la devise
  changeCurrency: (data) => ecomApi.put('/auth/currency', data),
  
  // Enregistrer un appareil pour les notifications push
  registerDevice: (deviceData) => ecomApi.post('/auth/register-device', deviceData)
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

 export const usersApi = {
   // Liste des utilisateurs (admin seulement)
   getUsers: (params = {}) => ecomApi.get('/users', { params }),
 
   // Détail d'un utilisateur (admin seulement)
   getUser: (id) => ecomApi.get(`/users/${id}`),
 
   // Créer un utilisateur (admin seulement)
   createUser: (data) => ecomApi.post('/users', data),
 
   // Modifier un utilisateur (admin seulement)
   updateUser: (id, data) => ecomApi.put(`/users/${id}`, data),
 
   // Réinitialiser le mot de passe (admin seulement)
   resetPassword: (id, newPassword) => ecomApi.put(`/users/${id}/reset-password`, { newPassword }),
 
   // Supprimer un utilisateur (admin seulement)
   deleteUser: (id) => ecomApi.delete(`/users/${id}`),
 
   // Liste des livreurs actifs (accessible par tous les authés)
   getLivreurs: () => ecomApi.get('/users/livreurs/list')
 };

export const importApi = {
  // Valider un spreadsheet
  validate: (data) => ecomApi.post('/import/validate', data),

  // Aperçu des données et colonnes
  preview: (data) => ecomApi.post('/import/preview', data),

  // Lancer l'import
  run: (data, config = {}) => ecomApi.post('/import/run', data, { timeout: 180000, ...config }),

  // Historique des imports
  getHistory: (params = {}) => ecomApi.get('/import/history', { params }),

  // Détail d'un import
  getImportDetail: (id) => ecomApi.get(`/import/history/${id}`)
};

export const notificationsApi = {
  getNotifications: (params = {}) => ecomApi.get('/notifications', { params }),
  getUnreadCount: () => ecomApi.get('/notifications/unread-count'),
  markAsRead: (id) => ecomApi.put(`/notifications/${id}/read`),
  markAllAsRead: () => ecomApi.put('/notifications/read-all'),
  deleteNotification: (id) => ecomApi.delete(`/notifications/${id}`)
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

// Service d'authentification avec persistance d'appareil
class AuthService {
  constructor() {
    this.tokenKey = 'ecom_token';
    this.deviceKey = 'ecom_device_info';
    this.isPermanentKey = 'ecom_is_permanent';
  }

  // Connexion avec option de se souvenir de l'appareil
  async login(email, password, rememberDevice = false) {
    try {
      const deviceInfo = this.getDeviceInfo();
      
      const response = await fetch('/api/ecom/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          rememberDevice,
          deviceInfo
        })
      });

      const data = await response.json();
      
      if (data.success) {
        this.setSession(data.data.token, data.data.isPermanent);
        return data;
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Erreur login:', error);
      throw error;
    }
  }

  // Enregistrer l'appareil après connexion normale
  async registerDevice() {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('Aucune session active');
      }

      const deviceInfo = this.getDeviceInfo();
      
      const response = await fetch('/api/ecom/auth/register-device', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ deviceInfo })
      });

      const data = await response.json();
      
      if (data.success) {
        this.setSession(data.data.permanentToken, true);
        return data;
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Erreur register device:', error);
      throw error;
    }
  }

  // Vérifier le statut de l'appareil
  async checkDeviceStatus() {
    try {
      const token = this.getToken();
      
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/ecom/auth/device-status', {
        method: 'GET',
        headers
      });

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Erreur check device status:', error);
      return { isAuthenticated: false, isPermanent: false };
    }
  }

  // Révoquer l'appareil
  async revokeDevice() {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('Aucune session active');
      }

      const response = await fetch('/api/ecom/auth/revoke-device', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        this.clearSession();
        return data;
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Erreur revoke device:', error);
      throw error;
    }
  }

  // Déconnexion
  logout() {
    this.clearSession();
    window.location.href = '/login';
  }

  // Obtenir les informations de l'appareil
  getDeviceInfo() {
    const userAgent = navigator.userAgent;
    let platform = 'unknown';

    // Détection de la plateforme
    if (/iPhone|iPad|iPod/.test(userAgent)) {
      platform = 'ios';
    } else if (/Android/.test(userAgent)) {
      platform = 'android';
    } else if (/Windows/.test(userAgent)) {
      platform = 'windows';
    } else if (/Mac/.test(userAgent)) {
      platform = 'mac';
    } else if (/Linux/.test(userAgent)) {
      platform = 'linux';
    }

    return {
      userAgent,
      platform,
      screenWidth: screen.width,
      screenHeight: screen.height,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timestamp: new Date().toISOString()
    };
  }

  // Sauvegarder la session
  setSession(token, isPermanent = false) {
    if (isPermanent) {
      // Token permanent : sauvegarder dans localStorage
      localStorage.setItem(this.tokenKey, token);
      localStorage.setItem(this.isPermanentKey, 'true');
      localStorage.setItem(this.deviceKey, JSON.stringify(this.getDeviceInfo()));
    } else {
      // Token normal : sauvegarder dans sessionStorage
      sessionStorage.setItem(this.tokenKey, token);
      sessionStorage.setItem(this.isPermanentKey, 'false');
    }
  }

  // Obtenir le token
  getToken() {
    // Priorité au token permanent (localStorage)
    const permanentToken = localStorage.getItem(this.tokenKey);
    if (permanentToken) {
      return permanentToken;
    }

    // Sinon, essayer le token normal (sessionStorage)
    return sessionStorage.getItem(this.tokenKey);
  }

  // Vérifier si la session est permanente
  isPermanentSession() {
    return localStorage.getItem(this.isPermanentKey) === 'true';
  }

  // Obtenir les infos de l'appareil sauvegardées
  getSavedDeviceInfo() {
    const deviceInfo = localStorage.getItem(this.deviceKey);
    return deviceInfo ? JSON.parse(deviceInfo) : null;
  }

  // Effacer la session
  clearSession() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.isPermanentKey);
    localStorage.removeItem(this.deviceKey);
    sessionStorage.removeItem(this.tokenKey);
    sessionStorage.removeItem(this.isPermanentKey);
  }

  // Vérifier si l'utilisateur est authentifié
  async isAuthenticated() {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    try {
      const status = await this.checkDeviceStatus();
      return status.isAuthenticated;
    } catch (error) {
      console.error('Erreur vérification auth:', error);
      return false;
    }
  }

  // Initialisation automatique au chargement de la page
  async init() {
    const token = this.getToken();
    if (token) {
      try {
        const status = await this.checkDeviceStatus();
        if (!status.isAuthenticated) {
          this.clearSession();
          return false;
        }
        return true;
      } catch (error) {
        console.error('Erreur init auth:', error);
        this.clearSession();
        return false;
      }
    }
    return false;
  }
}

// Exporter le service
export default new AuthService();

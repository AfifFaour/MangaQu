// services/LoginService.js
class LoginService {
  // Constants for storage keys
  static STORAGE_KEYS = {
    TOKEN: 'manga_auth_token',
    USER: 'manga_user_data',
    EXPIRY: 'manga_token_expiry',
    REFRESH_TOKEN: 'manga_refresh_token' // For future use
  };

  // Safe localStorage operations with error handling
  static _safeSetItem(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error('LocalStorage set error:', error);
      // Fallback to sessionStorage or memory if localStorage is full/blocked
      try {
        sessionStorage.setItem(key, value);
      } catch (e) {
        console.error('SessionStorage also failed:', e);
      }
      return false;
    }
  }

  static _safeGetItem(key) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('LocalStorage get error:', error);
      try {
        return sessionStorage.getItem(key);
      } catch (e) {
        console.error('SessionStorage also failed:', e);
        return null;
      }
    }
  }

  static _safeRemoveItem(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('LocalStorage remove error:', error);
    }
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error('SessionStorage remove error:', error);
    }
  }

  static _safeClear() {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('LocalStorage clear error:', error);
    }
    try {
      sessionStorage.clear();
    } catch (error) {
      console.error('SessionStorage clear error:', error);
    }
  }

  // Check if user is logged in
  static isLoggedIn() {
    const token = this.getToken();
    if (!token) return false;

    // Check token expiry if stored
    const expiry = this._safeGetItem(this.STORAGE_KEYS.EXPIRY);
    if (expiry) {
      const now = new Date().getTime();
      if (now > parseInt(expiry)) {
        this.logout();
        return false;
      }
    }

    // Additional token validation could be done here
    // For now, just check if token exists
    return true;
  }

  // Get the authentication token
  static getToken() {
    return this._safeGetItem(this.STORAGE_KEYS.TOKEN);
  }

  // Get user data
  static getUser() {
    try {
      const user = this._safeGetItem(this.STORAGE_KEYS.USER);
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      this.logout();
      return null;
    }
  }

  // Get user ID
  static getUserId() {
    const user = this.getUser();
    return user?.id || null;
  }

  // Get user role
  static getUserRole() {
    const user = this.getUser();
    return user?.role || null;
  }

  // Check if user is admin
  static isAdmin() {
    return this.getUserRole() === 'admin';
  }

  // Login and store credentials
  static login(token, user, expiryInHours = 24) {
    if (!token || !user) {
      console.error('LoginService: Token and user are required');
      return false;
    }

    // Store token
    this._safeSetItem(this.STORAGE_KEYS.TOKEN, token);

    // Store user data
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role || 'user'
    };
    this._safeSetItem(this.STORAGE_KEYS.USER, JSON.stringify(userData));

    // Calculate and store expiry time (24 hours from now by default)
    const expiryTime = new Date().getTime() + (expiryInHours * 60 * 60 * 1000);
    this._safeSetItem(this.STORAGE_KEYS.EXPIRY, expiryTime.toString());

    // Set up axios headers
    this.setAxiosHeaders();

    // Dispatch login event for other parts of the app
    this._dispatchAuthEvent('login', userData);

    return true;
  }

  // Update user data (without changing token)
  static setUser(user) {
    if (!user) {
      console.error('LoginService: User data is required');
      return false;
    }

    const currentUser = this.getUser();
    const updatedUser = {
      ...currentUser,
      ...user
    };

    this._safeSetItem(this.STORAGE_KEYS.USER, JSON.stringify(updatedUser));
    this._dispatchAuthEvent('user-updated', updatedUser);
    return true;
  }

  // Update token (without changing user)
  static setToken(token, expiryInHours = 24) {
    if (!token) {
      console.error('LoginService: Token is required');
      return false;
    }

    this._safeSetItem(this.STORAGE_KEYS.TOKEN, token);

    // Update expiry time
    const expiryTime = new Date().getTime() + (expiryInHours * 60 * 60 * 1000);
    this._safeSetItem(this.STORAGE_KEYS.EXPIRY, expiryTime.toString());

    // Update axios headers
    this.setAxiosHeaders();

    this._dispatchAuthEvent('token-refreshed');
    return true;
  }

  // Set up axios headers with current token
  static setAxiosHeaders() {
    try {
      const token = this.getToken();
      if (token && typeof axios !== 'undefined') {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error setting axios headers:', error);
    }
  }

  // Clear axios headers
  static clearAxiosHeaders() {
    try {
      if (typeof axios !== 'undefined' && axios.defaults.headers.common) {
        delete axios.defaults.headers.common['Authorization'];
      }
    } catch (error) {
      console.error('Error clearing axios headers:', error);
    }
  }

  // Logout and clear all stored data
  static logout() {
    // Clear storage
    Object.values(this.STORAGE_KEYS).forEach(key => {
      this._safeRemoveItem(key);
    });

    // Clear axios headers
    this.clearAxiosHeaders();

    // Dispatch logout event
    this._dispatchAuthEvent('logout');

    // Clear all storage if needed (optional, be careful)
    // this._safeClear();

    return true;
  }

  // Check if token is about to expire (within 5 minutes)
  static isTokenExpiringSoon(minutes = 5) {
    const expiry = this._safeGetItem(this.STORAGE_KEYS.EXPIRY);
    if (!expiry) return true; // No expiry stored, treat as expiring

    const expiryTime = parseInt(expiry);
    const now = new Date().getTime();
    const fiveMinutesInMs = minutes * 60 * 1000;

    return (expiryTime - now) <= fiveMinutesInMs;
  }

  // Get token expiry time (in milliseconds)
  static getTokenExpiryTime() {
    const expiry = this._safeGetItem(this.STORAGE_KEYS.EXPIRY);
    return expiry ? parseInt(expiry) : null;
  }

  // Get time until token expires (in minutes)
  static getTimeUntilExpiry() {
    const expiryTime = this.getTokenExpiryTime();
    if (!expiryTime) return 0;

    const now = new Date().getTime();
    const diff = expiryTime - now;
    return Math.max(0, Math.floor(diff / 60000)); // Convert to minutes
  }

  // Clear expired data on app start
  static cleanupExpiredData() {
    if (!this.isLoggedIn()) {
      this.logout(); // Clean up any partial data
    }
  }

  // Event system for auth state changes
  static _listeners = new Map();

  static addListener(event, callback) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(callback);
    return () => this.removeListener(event, callback);
  }

  static removeListener(event, callback) {
    if (this._listeners.has(event)) {
      this._listeners.get(event).delete(callback);
    }
  }

  static _dispatchAuthEvent(event, data = null) {
    if (this._listeners.has(event)) {
      this._listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }

    // Also dispatch a global custom event for non-React components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(`auth:${event}`, { detail: data }));
    }
  }

  // Initialize the service
  static init() {
    // Clean up expired data on initialization
    this.cleanupExpiredData();

    // Set up axios headers if logged in
    if (this.isLoggedIn()) {
      this.setAxiosHeaders();
    }

    // Listen for storage events from other tabs/windows
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key === this.STORAGE_KEYS.TOKEN || 
            event.key === this.STORAGE_KEYS.USER) {
          // Auth data changed in another tab
          this._dispatchAuthEvent('storage-sync');
        }
      });
    }

    console.log('LoginService initialized');
  }
}

// Auto-initialize when imported
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => LoginService.init());
  } else {
    LoginService.init();
  }
}

export default LoginService;
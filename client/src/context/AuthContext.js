import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Storage helper functions
  const setAuthData = (token, userData) => {
    localStorage.setItem('mangaqu_token', token);
    localStorage.setItem('mangaqu_user', JSON.stringify(userData));
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const clearAuthData = () => {
    localStorage.removeItem('mangaqu_token');
    localStorage.removeItem('mangaqu_user');
    delete axios.defaults.headers.common['Authorization'];
  };

  const getAuthData = () => {
    const token = localStorage.getItem('mangaqu_token');
    const userStr = localStorage.getItem('mangaqu_user');
    return {
      token,
      user: userStr ? JSON.parse(userStr) : null
    };
  };

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { token, user: storedUser } = getAuthData();
        
        if (token && storedUser) {
          // Set axios default header
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Verify token with server
          try {
            const response = await axios.post('http://localhost:5001/api/auth/verify', {}, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.data.valid) {
              console.log('✅ Auth initialized:', response.data.user.username);
              setUser(response.data.user);
            } else {
              console.log('❌ Invalid token during init');
              clearAuthData();
            }
          } catch (profileError) {
            console.log('❌ Token verification failed:', profileError.message);
            clearAuthData();
          }
        } else {
          console.log('ℹ️ No stored auth data');
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        clearAuthData();
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    initializeAuth();
  }, []);

  // Setup axios interceptors
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const { token } = getAuthData();
        if (token && !config.headers.Authorization) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.log('🔐 Authentication error, logging out');
          clearAuthData();
          setUser(null);
          
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
        
        if (error.response?.data?.error) {
          setError(error.response.data.error);
        }
        
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  // Clear error after some time
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Login function
  const login = useCallback(async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await axios.post('http://localhost:5001/api/auth/login', {
        email,
        password
      });

      const { token, user: userData } = response.data;
      
      console.log('✅ Login successful:', userData.username, 'Role:', userData.role);
      
      setAuthData(token, userData);
      setUser(userData);
      setLoading(false);
      
      return { success: true, user: userData };
      
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Login failed. Please try again.';
      console.error('❌ Login error:', errorMessage);
      setError(errorMessage);
      setLoading(false);
      return { 
        success: false, 
        error: errorMessage
      };
    }
  }, []);

  // Register function
  const register = useCallback(async (username, email, password) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await axios.post('http://localhost:5001/api/auth/register', {
        username,
        email,
        password
      });

      const { token, user: userData } = response.data;
      
      console.log('✅ Registration successful:', userData.username);
      
      setAuthData(token, userData);
      setUser(userData);
      setLoading(false);
      
      return { success: true, user: userData };
      
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Registration failed. Please try again.';
      console.error('❌ Registration error:', errorMessage);
      setError(errorMessage);
      setLoading(false);
      return { 
        success: false, 
        error: errorMessage
      };
    }
  }, []);

  // Logout function
  const logout = useCallback(() => {
    console.log('👋 Logging out user:', user?.username);
    clearAuthData();
    setUser(null);
    setError(null);
    window.location.href = '/login';
  }, [user]);

  // Update user function
  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('mangaqu_user', JSON.stringify(updatedUser));
  }, []);

  // Clear error function
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Check if user is admin
  const isAdmin = useCallback(() => {
    return user?.role === 'admin';
  }, [user]);

  // Check if user is authenticated
  const isAuthenticated = useCallback(() => {
    const { token, user: storedUser } = getAuthData();
    return !!token && !!storedUser && !!user;
  }, [user]);

  // Get user ID
  const getUserId = useCallback(() => {
    return user?.id;
  }, [user]);

  // Get current token
  const getToken = useCallback(() => {
    return getAuthData().token;
  }, []);

  // Verify token with server
  const verifyToken = useCallback(async () => {
    try {
      const { token } = getAuthData();
      if (!token) return false;
      
      const response = await axios.post('http://localhost:5001/api/auth/verify', {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      return response.data.valid;
    } catch (error) {
      console.error('❌ Token verification failed:', error.message);
      return false;
    }
  }, []);

  // Get user profile from server
  const getProfile = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/auth/profile');
      const updatedUser = response.data;
      setUser(updatedUser);
      localStorage.setItem('mangaqu_user', JSON.stringify(updatedUser));
      return updatedUser;
    } catch (error) {
      console.error('Failed to get profile:', error);
      if (error.response?.status === 401) {
        logout();
      }
      return null;
    }
  }, [logout]);

  const value = {
    user,
    error,
    loading,
    initialized,
    login,
    register,
    logout,
    updateUser,
    clearError,
    isAdmin,
    isAuthenticated,
    getUserId,
    getToken,
    verifyToken,
    getProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Loading component
export const AuthLoading = ({ children, fallback = null }) => {
  const { loading, initialized } = useAuth();
  
  if (loading || !initialized) {
    return fallback || <div className="flex justify-center items-center h-screen">Loading authentication...</div>;
  }
  
  return children;
};

// Protected Route component
export const ProtectedRoute = ({ 
  children, 
  requireAuth = true, 
  adminOnly = false,
  redirectTo = '/login'
}) => {
  const { user, isAuthenticated, isAdmin, loading, initialized } = useAuth();

  if (loading || !initialized) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (requireAuth && !isAuthenticated()) {
    window.location.href = redirectTo;
    return null;
  }

  if (requireAuth && adminOnly && !isAdmin()) {
    window.location.href = '/unauthorized';
    return null;
  }

  return children;
};
// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect, useCallback } from "react";
import api, { authAPI } from "../services/Api";
import LoginService from "../services/LoginService";

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const clearError = useCallback(() => setError(null), []);

  const getToken = useCallback(() => LoginService.getToken(), []);

  const isAuthenticated = useCallback(() => {
    return !!LoginService.getToken() && !!user;
  }, [user]);

  const logout = useCallback(() => {
    LoginService.logout(); // remove cookie token
    setUser(null);
    setError(null);

    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  }, []);

  // Init: verify token if exists
  useEffect(() => {
    const init = async () => {
      try {
        const token = LoginService.getToken();

        if (!token) {
          setUser(null);
          return;
        }

        // ✅ verify token with backend
        const res = await authAPI.verify();
        if (res.data?.valid) {
          setUser(res.data.user || null);
        } else {
          LoginService.logout();
          setUser(null);
        }
      } catch (e) {
        // token invalid/expired
        LoginService.logout();
        setUser(null);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    init();
  }, []);

  // Axios response global handling (optional but useful)
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (r) => r,
      (e) => {
        const status = e?.response?.status;
        if (status === 401 || status === 403) {
          LoginService.logout();
          setUser(null);

          if (window.location.pathname !== "/login") {
            window.location.href = "/login";
          }
        }
        if (e?.response?.data?.error) setError(e.response.data.error);
        return Promise.reject(e);
      }
    );

    return () => api.interceptors.response.eject(interceptor);
  }, []);

  // Login
  const login = useCallback(async (email, password) => {
    try {
      setError(null);
      setLoading(true);

      const res = await authAPI.login({ email, password });
      const token = res.data?.token;
      const userData = res.data?.user;

      if (!token) {
        setError("No token returned from server");
        return { success: false };
      }

      // ✅ store token in cookie (NOT localStorage)
      LoginService.setToken(token);
      setUser(userData || null);

      return { success: true, user: userData };
    } catch (e) {
      const msg = e?.response?.data?.error || "Login failed. Please try again.";
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, []);

  // Register
  const register = useCallback(async (username, email, password) => {
    try {
      setError(null);
      setLoading(true);

      const res = await authAPI.register({ username, email, password });
      const token = res.data?.token;
      const userData = res.data?.user;

      if (!token) {
        setError("No token returned from server");
        return { success: false };
      }

      LoginService.setToken(token);
      setUser(userData || null);

      return { success: true, user: userData };
    } catch (e) {
      const msg = e?.response?.data?.error || "Registration failed. Please try again.";
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, []);

  const isAdmin = useCallback(() => user?.role === "admin", [user]);

  const verifyToken = useCallback(async () => {
    try {
      const token = LoginService.getToken();
      if (!token) return false;
      const res = await authAPI.verify();
      return !!res.data?.valid;
    } catch {
      return false;
    }
  }, []);

  const getUserId = useCallback(() => user?.id, [user]);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
  }, []);

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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Loading wrapper (unchanged behavior)
export const AuthLoading = ({ children, fallback = null }) => {
  const { loading, initialized } = useAuth();
  if (loading || !initialized) {
    return fallback || <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  return children;
};

// Protected route (unchanged behavior)
export const ProtectedRoute = ({
  children,
  requireAuth = true,
  adminOnly = false,
  redirectTo = "/login",
}) => {
  const { isAuthenticated, isAdmin, loading, initialized } = useAuth();

  if (loading || !initialized) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (requireAuth && !isAuthenticated()) {
    window.location.href = redirectTo;
    return null;
  }

  if (requireAuth && adminOnly && !isAdmin()) {
    window.location.href = "/unauthorized";
    return null;
  }

  return children;
};

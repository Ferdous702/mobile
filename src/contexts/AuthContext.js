import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { api } from '../utils/api';
import { storage } from '../utils/storage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(async () => {
    await storage.clearAuth();
    setUser(null);
  }, []);

  useEffect(() => {
    // Expired/revoked token anywhere in the app -> back to login
    api.setUnauthorizedHandler(() => {
      clearSession();
    });
    return () => api.setUnauthorizedHandler(null);
  }, [clearSession]);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const [token, storedUser] = await Promise.all([storage.getToken(), storage.getUser()]);
        if (!token || !storedUser) return;

        if (isMounted) setUser(storedUser);
        try {
          const response = await api.getUser();
          if (isMounted && response?.data) {
            setUser(response.data);
            await storage.saveUser(response.data);
          }
        } catch (err) {
          // Only sign out on a real auth failure, not when the server is unreachable
          if (err?.status === 401 && isMounted) await clearSession();
        }
      } catch (err) {
        console.error('Error loading auth:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [clearSession]);

  const persist = async (response) => {
    await storage.saveToken(response.data.token);
    await storage.saveUser(response.data.user);
    setUser(response.data.user);
  };

  const login = async (email, password) => {
    try {
      const response = await api.login(email.trim(), password);
      await persist(response);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message || 'Login failed' };
    }
  };

  const register = async (name, email, password, passwordConfirmation) => {
    try {
      const response = await api.register(name.trim(), email.trim(), password, passwordConfirmation);
      await persist(response);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message || 'Registration failed' };
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore — we clear the local session regardless
    } finally {
      await clearSession();
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, isAuthenticated: !!user, isAdmin: !!user?.is_admin }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

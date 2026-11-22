import React, { createContext, useState, useContext, useEffect } from 'react';
import { api } from '../utils/api';
import { storage } from '../utils/storage';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const token = await storage.getToken();
      const storedUser = await storage.getUser();
      
      if (token && storedUser) {
        setUser(storedUser);
        // Validate token by fetching user data
        try {
          const response = await api.getUser();
          if (response.success) {
            setUser(response.data);
            await storage.saveUser(response.data);
          }
        } catch (err) {
          // Token is invalid, clear auth
          await storage.clearAuth();
          setUser(null);
        }
      }
    } catch (err) {
      console.error('Error loading auth:', err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await api.login(email, password);
      
      if (response.success) {
        await storage.saveToken(response.data.token);
        await storage.saveUser(response.data.user);
        setUser(response.data.user);
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (err) {
      const message = err.message || 'Login failed';
      setError(message);
      return { success: false, message };
    }
  };

  const register = async (name, email, password, passwordConfirmation) => {
    try {
      setError(null);
      const response = await api.register(name, email, password, passwordConfirmation);
      
      if (response.success) {
        await storage.saveToken(response.data.token);
        await storage.saveUser(response.data.user);
        setUser(response.data.user);
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (err) {
      const message = err.message || 'Registration failed';
      setError(message);
      return { success: false, message };
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.error('Logout API error:', err);
    } finally {
      await storage.clearAuth();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

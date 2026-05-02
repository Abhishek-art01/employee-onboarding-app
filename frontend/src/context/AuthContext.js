import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 > Date.now()) {
          setUser({ ...decoded, token });
        } else { localStorage.removeItem('token'); localStorage.removeItem('refreshToken'); }
      } catch { localStorage.removeItem('token'); }
    }
    setLoading(false);
  }, []);

  const login = useCallback((token, refreshToken, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
    const decoded = jwtDecode(token);
    setUser({ ...decoded, ...userData, token });
  }, []);

  const logout = useCallback(async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setUser(null);
  }, []);

  const isAuthenticated = !!user;
  const hasRole = (roles) => roles.includes(user?.role);

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, hasRole, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

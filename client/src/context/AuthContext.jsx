import React, { createContext, useState, useEffect, useContext } from 'react';
import API from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load and verify session on app startup
  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const { data } = await API.get('/auth/profile');
          setUser(data);
        } catch (err) {
          console.error('Session restore failed:', err.response?.data?.message || err.message);
          logout();
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, [token]);

  // Login handler
  const login = async (email, password) => {
    setError(null);
    try {
      const { data } = await API.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({ name: data.name, email: data.email, role: data.role }));
      setToken(data.token);
      setUser({ name: data.name, email: data.email, role: data.role });
      return data;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to login. Please try again.';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  // Register/Signup handler
  const signup = async (name, email, password, role = 'customer') => {
    setError(null);
    try {
      const { data } = await API.post('/auth/register', { name, email, password, role });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({ name: data.name, email: data.email, role: data.role }));
      setToken(data.token);
      setUser({ name: data.name, email: data.email, role: data.role });
      return data;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        login,
        signup,
        logout,
        isAuthenticated: !!token,
        isAdmin: user?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

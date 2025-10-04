import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Set up axios interceptor for auth token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Verify token validity
      checkAuth();
    } else {
      setLoading(false);
    }

    // Response interceptor for handling auth errors
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        // Don't trigger logout for login/register requests
        const isAuthRequest = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register');
        
        if (error.response?.status === 401 && !isAuthRequest) {
          logout(false); // Don't show success message for automatic logout
          toast.error('Session expired. Please login again.');
        }
        return Promise.reject(error);
      }
    );

    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axios.get('/api/auth/me');
      setUser(response.data.user);
    } catch (error) {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      
      toast.success(`Welcome back, ${user.username}!`);
      return { success: true };
    } catch (error) {
      let message = 'Login failed';
      
      if (error.response?.status === 404) {
        message = 'User not found';
      } else if (error.response?.status === 401) {
        message = 'Wrong password';
      } else if (error.response?.data?.error) {
        message = error.response.data.error;
      }
      
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await axios.post('/api/auth/register', {
        username,
        email,
        password
      });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      
      toast.success(`Welcome to CyberGuard, ${user.username}!`);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Registration failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = (showMessage = true) => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    if (showMessage) {
      toast.success('Logged out successfully');
    }
  };

  const updatePreferences = async (preferences) => {
    try {
      const response = await axios.patch('/api/auth/preferences', preferences);
      setUser(prev => ({
        ...prev,
        preferences: response.data.preferences
      }));
      toast.success('Preferences updated');
      return { success: true };
    } catch (error) {
      toast.error('Failed to update preferences');
      return { success: false };
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updatePreferences
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
import axios from 'axios';
import { getSessionId, setSessionId } from './session';

// Create axios instance with session handling
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api'
});

// Add session ID and JWT token to all requests
api.interceptors.request.use((config) => {
  const sessionId = getSessionId();
  const token = localStorage.getItem('token');
  
  config.headers['x-session-id'] = sessionId;
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  
  return config;
});

// Handle session ID from response headers and auth errors
api.interceptors.response.use(
  (response) => {
    const sessionId = response.headers['x-session-id'];
    if (sessionId) {
      setSessionId(sessionId);
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
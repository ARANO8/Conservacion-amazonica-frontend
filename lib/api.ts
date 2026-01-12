import axios from 'axios';
import Cookies from 'js-cookie';
import { useAuthStore } from '@/store/auth-store';

// Crear instancia de Axios
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de Request: Inyectar token
api.interceptors.request.use(
  (config) => {
    // Leer token de useAuthStore (persistido en localStorage) o fallback a cookies
    const token = useAuthStore.getState().token || Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de Response: Manejo global de errores (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Logout automático si el token es inválido o expiró
      useAuthStore.getState().logout();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

import axios from 'axios';
import Cookies from 'js-cookie';
import { useAuthStore } from '@/store/auth-store';

// Crear instancia de Axios
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
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
      // 1. Limpiar estado de autenticación en el store (elimina cookie + localStorage)
      useAuthStore.getState().logout();
      // 2. Emitir evento para que el layout protegido redirija con router.push
      //    (evita full-page refresh de window.location.href)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth-expired'));
      }
    }
    return Promise.reject(error);
  }
);

export default api;

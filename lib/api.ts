import axios from 'axios';
import Cookies from 'js-cookie';

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
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de Response: Manejo global de errores (opcional)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Si el token expira o es inválido, podríamos limpiar la sesión aquí
      // o dejar que el store maneje el logout.
      // Por ahora, solo rechazamos el error para que cada llamada lo maneje.
      Cookies.remove('token');
      // Opcional: window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

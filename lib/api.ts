import axios from 'axios';
import { useAuthStore } from '@/store/auth-store';

// Crear instancia de Axios
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  // Enviar/recibir la cookie httpOnly de autenticación en cada petición.
  // El JWT ya no se guarda en JS; viaja en una cookie httpOnly seteada por
  // el backend.
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de Response: Manejo global de errores (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 1. Limpiar estado de autenticación en el store
      void useAuthStore.getState().logout();
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

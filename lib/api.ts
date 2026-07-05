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

    if (error.response?.status === 429) {
      if (error.response.data && typeof error.response.data === 'object') {
        error.response.data.message =
          'Ha realizado demasiadas peticiones. Por favor, intente de nuevo más tarde.';
      } else {
        error.response.data = {
          message: 'Ha realizado demasiadas peticiones. Por favor, intente de nuevo más tarde.',
        };
      }
    }

    if (error.message === 'Network Error' || error.code === 'ERR_NETWORK' || !error.response) {
      error.message =
        'No se pudo establecer conexión con el servidor. Por favor, verifique su conexión a internet o intente más tarde.';
    }

    return Promise.reject(error);
  }
);

export default api;

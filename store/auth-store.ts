import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import Cookies from 'js-cookie';
import api from '../lib/api';
import { toast } from 'sonner';

// Interfaz User estricta (tipado según backend)
export interface User {
  id: string;
  nombreCompleto: string;
  email: string;
  rol: string;
}

interface loginResponse {
  user: User;
  accessToken: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (credentials: Record<string, string>) => Promise<void>;
  logout: () => void;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post<loginResponse>(
            '/auth/login',
            credentials
          );

          // Backend devuelve accessToken (camelCase)
          const token = response.data.accessToken;
          const user = response.data.user;

          if (!token || token === 'undefined') {
            const errorMsg = 'Token no recibido del servidor';
            toast.error(errorMsg);
            throw new Error(errorMsg);
          }

          // Guardar token en cookies
          Cookies.set('token', token, { expires: 7, path: '/' });

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          // El manejo de errores detallado se hará en la UI,
          // pero aquí guardamos el mensaje genérico o lanzamos el error
          // para que el componente lo capture.
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        Cookies.remove('token');
        set({ user: null, token: null, isAuthenticated: false });
      },

      setError: (error) => set({ error }),
    }),
    {
      name: 'auth-storage', // nombre único para localStorage
      storage: createJSONStorage(() => localStorage), // usar localStorage
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }), // persistir solo estos campos
      onRehydrateStorage: () => (state) => {
        // Hidratación adicional: verificar si la cookie de token aún existe
        const token = Cookies.get('token');
        if (!token && state) {
          // Si no hay token en cookie, invalidar la sesión persistida
          state.logout();
        }
      },
    }
  )
);

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '../lib/api';
import { toast } from 'sonner';
import { useNotificacionesStore } from './useNotificacionesStore';

// Interfaz User estricta (tipado según backend)
export interface User {
  id: string;
  nombreCompleto: string;
  email: string;
  rol: string;
}

interface loginResponse {
  user: User;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (credentials: Record<string, string>) => Promise<void>;
  logout: () => Promise<void>;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
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

          const user = response.data.user;

          if (!user) {
            const errorMsg = 'Respuesta de login inválida del servidor';
            toast.error(errorMsg);
            throw new Error(errorMsg);
          }

          // El JWT viaja en una cookie httpOnly seteada por el backend.
          // El frontend NO almacena el token (mitiga robo por XSS).
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          // El manejo de errores detallado se hará en la UI; aquí solo
          // reseteamos el loading y relanzamos para que la UI lo capture.
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          // Limpia la cookie httpOnly en el backend (JS no puede borrarla).
          await api.post('/auth/logout');
        } catch {
          // best-effort: si falla, igual limpiamos el estado local.
        }
        // Limpiar notificaciones de la sesión en el store
        useNotificacionesStore.getState().clear();
        set({ user: null, isAuthenticated: false });
      },

      setError: (error) => set({ error }),
    }),
    {
      name: 'auth-storage', // nombre único para localStorage
      storage: createJSONStorage(() => localStorage),
      // Solo se persisten datos no sensibles del usuario para la UI.
      // La verdad de la sesión es la cookie httpOnly (validada por el
      // middleware y por el interceptor 401).
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

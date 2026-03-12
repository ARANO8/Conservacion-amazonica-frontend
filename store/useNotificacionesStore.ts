import { create } from 'zustand';
import {
  getMisNotificaciones,
  getCountNotificacionesNoLeidas,
  marcarComoLeida,
  marcarTodasComoLeidas,
} from '@/lib/actions/notificaciones.actions';
import { NotificacionesState } from '@/types/notificacion-backend';
import { toast } from 'sonner';

/**
 * Zustand store para manejar el estado global de notificaciones.
 * Incluye:
 * - Fetch de notificaciones (directo a Prisma via Server Actions)
 * - Marcado como leído
 * - Polling automático cada 60 segundos (configurable)
 */
export const useNotificacionesStore = create<NotificacionesState>(
  (set, get) => {
    let pollingInterval: NodeJS.Timeout | null = null;
    let currentUsuarioId: number | null = null;

    return {
      notificaciones: [],
      noLeidas: 0,
      isLoading: false,
      error: null,

      /**
       * Obtiene todas las notificaciones del usuario.
       */
      fetchNotificaciones: async (usuarioId: number) => {
        if (!usuarioId) return;

        set({ isLoading: true, error: null });
        try {
          const notificaciones = await getMisNotificaciones(usuarioId);
          set({ notificaciones, isLoading: false });
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : 'Error desconocido';
          set({ error: errorMsg, isLoading: false });
          console.error('Error fetching notifications:', error);
        }
      },

      /**
       * Obtiene el conteo de notificaciones no leídas.
       */
      fetchCountNoLeidas: async (usuarioId: number) => {
        if (!usuarioId) return;

        try {
          const count = await getCountNotificacionesNoLeidas(usuarioId);
          set({ noLeidas: count });
        } catch (error) {
          console.error('Error fetching unread count:', error);
        }
      },

      /**
       * Marca una notificación como leída.
       */
      markAsRead: async (usuarioId: number, notificacionId: number) => {
        try {
          await marcarComoLeida(usuarioId, notificacionId);

          // Actualizar estado local
          set((state) => ({
            notificaciones: state.notificaciones.map((n) =>
              n.id === notificacionId ? { ...n, leida: true } : n
            ),
            noLeidas: Math.max(0, state.noLeidas - 1),
          }));
        } catch (error) {
          console.error('Error marking notification as read:', error);
          toast.error('No se pudo marcar la notificación como leída');
        }
      },

      /**
       * Marca todas las notificaciones como leídas.
       */
      markAllAsRead: async (usuarioId: number) => {
        try {
          await marcarTodasComoLeidas(usuarioId);

          // Actualizar estado local
          set((state) => ({
            notificaciones: state.notificaciones.map((n) => ({
              ...n,
              leida: true,
            })),
            noLeidas: 0,
          }));

          toast.success('Todas las notificaciones marcadas como leídas');
        } catch (error) {
          console.error('Error marking all notifications as read:', error);
          toast.error('No se pudieron marcar todas las notificaciones');
        }
      },

      /**
       * Inicia el polling automático de notificaciones.
       * @param usuarioId ID del usuario
       * @param interval Intervalo en milisegundos (default: 60000 = 60 segundos)
       */
      startPolling: (usuarioId: number, interval: number = 60000) => {
        if (!usuarioId) return;

        // Evitar múltiples pollings
        if (pollingInterval) {
          return;
        }

        currentUsuarioId = usuarioId;

        // Fetch inicial
        get().fetchCountNoLeidas(usuarioId);

        // Configurar polling
        pollingInterval = setInterval(() => {
          if (currentUsuarioId) {
            get().fetchCountNoLeidas(currentUsuarioId);
          }
        }, interval);
      },

      /**
       * Detiene el polling automático.
       */
      stopPolling: () => {
        if (pollingInterval) {
          clearInterval(pollingInterval);
          pollingInterval = null;
          currentUsuarioId = null;
        }
      },

      /**
       * Establece el error del store.
       */
      setError: (error: string | null) => {
        set({ error });
      },
    };
  }
);

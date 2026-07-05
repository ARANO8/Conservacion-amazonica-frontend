import { create } from 'zustand';
import { notificacionesService } from '@/lib/services/notificaciones-service';
import { NotificacionesState } from '@/types/notificacion-backend';
import { toast } from 'sonner';

/**
 * Zustand store para manejar el estado global de notificaciones.
 * Incluye:
 * - Fetch de notificaciones (via REST API)
 * - Marcado como leído
 * - Polling automático cada 60 segundos (configurable)
 */
export const useNotificacionesStore = create<NotificacionesState>(
  (set, get) => {
    let pollingInterval: NodeJS.Timeout | null = null;

    return {
      notificaciones: [],
      noLeidas: 0,
      isLoading: false,
      error: null,

      /**
       * Obtiene todas las notificaciones del usuario.
       */
      fetchNotificaciones: async () => {
        if (get().isLoading) return;
        set({ isLoading: true, error: null });
        try {
          const notificaciones =
            await notificacionesService.getMisNotificaciones();
          set({ notificaciones, isLoading: false });
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : 'Error desconocido';
          set({ error: errorMsg, isLoading: false });
        }
      },

      /**
       * Obtiene el conteo de notificaciones no leídas.
       */
      fetchCountNoLeidas: async () => {
        try {
          const count =
            await notificacionesService.getCountNotificacionesNoLeidas();
          set({ noLeidas: count });
        } catch {
          // conteo silencioso — no interrumpir la UI
        }
      },

      /**
       * Marca una notificación como leída.
       */
      markAsRead: async (notificacionId: number) => {
        try {
          await notificacionesService.marcarComoLeida(notificacionId);

          // Actualizar estado local
          set((state) => ({
            notificaciones: state.notificaciones.map((n) =>
              n.id === notificacionId ? { ...n, leida: true } : n
            ),
            noLeidas: Math.max(0, state.noLeidas - 1),
          }));
        } catch {
          toast.error('No se pudo marcar la notificación como leída');
        }
      },

      /**
       * Marca todas las notificaciones como leídas.
       */
      markAllAsRead: async () => {
        try {
          await notificacionesService.marcarTodasComoLeidas();

          // Actualizar estado local
          set((state) => ({
            notificaciones: state.notificaciones.map((n) => ({
              ...n,
              leida: true,
            })),
            noLeidas: 0,
          }));

          toast.success('Todas las notificaciones marcadas como leídas');
        } catch {
          toast.error('No se pudieron marcar todas las notificaciones');
        }
      },

      /**
       * Inicia el polling automático de notificaciones.
       * @param interval Intervalo en milisegundos (default: 60000 = 60 segundos)
       */
      startPolling: (interval: number = 60000) => {
        // Evitar múltiples pollings
        if (pollingInterval) {
          return;
        }

        // Fetch inicial
        get().fetchCountNoLeidas();

        // Configurar polling
        pollingInterval = setInterval(() => {
          get().fetchCountNoLeidas();
        }, interval);
      },

      /**
       * Detiene el polling automático.
       */
      stopPolling: () => {
        if (pollingInterval) {
          clearInterval(pollingInterval);
          pollingInterval = null;
        }
      },

      /**
       * Establece el error del store.
       */
      setError: (error: string | null) => {
        set({ error });
      },

      /**
       * Limpia el estado global de notificaciones.
       */
      clear: () => {
        set({ notificaciones: [], noLeidas: 0, error: null, isLoading: false });
      },
    };
  }
);

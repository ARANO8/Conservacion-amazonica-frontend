import { useEffect } from 'react';
import { useNotificacionesStore } from '@/store/useNotificacionesStore';
import { useAuthStore } from '@/store/auth-store';

/**
 * Custom hook para iniciar el polling de notificaciones automáticamente.
 * Se debe usar en el layout principal o en un componente que se renderice una sola vez.
 *
 * @param interval Intervalo de polling en milisegundos (default: 60000 = 60 segundos)
 *
 * Ejemplo de uso en layout.tsx o root page:
 * ```
 * 'use client';
 *
 * export default function RootLayout() {
 *   useNotificacionesPolling();
 *   return ...
 * }
 * ```
 */
export function useNotificacionesPolling(interval: number = 60000) {
  const { startPolling, stopPolling, clear, fetchNotificaciones } = useNotificacionesStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user?.id) {
      // Limpiar notificaciones anteriores y cargar las nuevas inmediatamente
      clear();
      void fetchNotificaciones();
      startPolling(interval);
    } else {
      clear();
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [user?.id, startPolling, stopPolling, clear, fetchNotificaciones, interval]);
}

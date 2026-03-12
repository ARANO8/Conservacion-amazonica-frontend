'use client';

import { useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { useNotificacionesPolling } from '@/hooks/use-notificaciones-polling';
import { useNotificacionesStore } from '@/store/useNotificacionesStore';

/**
 * Client component wrapper that injects the notificaciones polling hook
 * into the dashboard layout. This ensures polling starts globally for authenticated users.
 *
 * También maneja los toasts cuando llegan nuevas notificaciones.
 */
export function NotificacionesPollingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Hook que maneja el polling lifecycle (comienza en mount, se detiene en unmount)
  useNotificacionesPolling();

  // Ref para rastrear el valor anterior de noLeidas
  const previousNoLeidasRef = useRef<number>(0);
  const { noLeidas } = useNotificacionesStore();

  // Efecto para detectar cuando llegan notificaciones nuevas y mostrar toast
  useEffect(() => {
    // Si noLeidas es mayor que el valor anterior, significa que llegó una notificación nueva
    if (noLeidas > previousNoLeidasRef.current && noLeidas > 0) {
      toast.info('Tienes nuevas notificaciones pendientes', {
        description: `${noLeidas} notificación${noLeidas > 1 ? 'es' : ''} sin leer`,
      });
    }

    // Actualizar el ref con el nuevo valor
    previousNoLeidasRef.current = noLeidas;
  }, [noLeidas]);

  return <>{children}</>;
}

'use client';

import { useNotificacionesPolling } from '@/hooks/use-notificaciones-polling';

/**
 * Client component wrapper that injects the notificaciones polling hook
 * into the dashboard layout. This ensures polling starts globally for authenticated users.
 */
export function NotificacionesPollingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Hook that handles polling lifecycle (starts on mount, stops on unmount)
  useNotificacionesPolling();

  return <>{children}</>;
}

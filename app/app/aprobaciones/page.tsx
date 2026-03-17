'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck, FileText, Inbox } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

import { useNotificacionesStore } from '@/store/useNotificacionesStore';
import { NotificacionBackend } from '@/types/notificacion-backend';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tipoLabel(tipo: NotificacionBackend['tipo']): string {
  const labels: Record<NotificacionBackend['tipo'], string> = {
    SOLICITUD_ASIGNADA: 'Asignada',
    SOLICITUD_DERIVADA: 'Derivada',
    SOLICITUD_APROBADA: 'Aprobada',
    SOLICITUD_OBSERVADA: 'Observada',
    RENDICION_PENDIENTE: 'Rendición pendiente',
  };
  return labels[tipo] ?? tipo;
}

function tipoVariant(
  tipo: NotificacionBackend['tipo']
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (tipo === 'SOLICITUD_APROBADA') return 'default';
  if (tipo === 'SOLICITUD_OBSERVADA' || tipo === 'RENDICION_PENDIENTE')
    return 'destructive';
  return 'secondary';
}

// ─── NotificationCard ─────────────────────────────────────────────────────────

function NotificationCard({
  notification,
  onRead,
}: {
  notification: NotificacionBackend;
  onRead: (id: number) => void;
}) {
  const href =
    notification.urlDestino ??
    (notification.solicitudId
      ? `/app/aprobaciones/${notification.solicitudId}`
      : '#');

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    locale: es,
  });

  function handleClick() {
    if (!notification.leida) {
      onRead(notification.id);
    }
  }

  return (
    <Link href={href} onClick={handleClick} className="block">
      <div
        className={cn(
          'hover:bg-accent/50 rounded-lg border p-4 transition-colors',
          !notification.leida && 'border-primary/30 bg-primary/5'
        )}
      >
        <div className="flex items-start gap-3">
          {/* Icono */}
          <div
            className={cn(
              'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
              notification.leida ? 'bg-muted' : 'bg-primary/10'
            )}
          >
            <Bell
              className={cn(
                'h-4 w-4',
                notification.leida ? 'text-muted-foreground' : 'text-primary'
              )}
            />
          </div>

          {/* Contenido */}
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  'text-sm font-semibold',
                  !notification.leida && 'text-foreground'
                )}
              >
                {notification.titulo}
              </span>
              <Badge
                variant={tipoVariant(notification.tipo)}
                className="text-xs"
              >
                {tipoLabel(notification.tipo)}
              </Badge>
              {!notification.leida && (
                <span className="bg-primary ml-auto h-2 w-2 shrink-0 rounded-full" />
              )}
            </div>

            <p className="text-muted-foreground mb-2 line-clamp-3 text-sm">
              {notification.mensaje}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              {notification.solicitud?.codigoSolicitud && (
                <span className="text-muted-foreground flex items-center gap-1 text-xs">
                  <FileText className="h-3 w-3" />
                  {notification.solicitud.codigoSolicitud}
                </span>
              )}
              <span className="text-muted-foreground text-xs">{timeAgo}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Loading skeletons ─────────────────────────────────────────────────────────

function NotificationSkeleton() {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start gap-3">
        <Skeleton className="mt-0.5 h-9 w-9 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AprobacionesPage() {
  const {
    notificaciones,
    isLoading,
    markAsRead,
    markAllAsRead,
    fetchNotificaciones,
  } = useNotificacionesStore();

  useEffect(() => {
    fetchNotificaciones();
  }, [fetchNotificaciones]);

  const unreadNotifications = notificaciones.filter((n) => !n.leida);
  const readNotifications = notificaciones.filter((n) => n.leida);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Inbox className="text-primary h-7 w-7" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Bandeja de Entrada
            </h1>
            <p className="text-muted-foreground">
              Tus notificaciones y solicitudes pendientes de revisión.
            </p>
          </div>
        </div>

        {unreadNotifications.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllAsRead()}
            className="shrink-0 gap-2"
          >
            <CheckCheck className="h-4 w-4" />
            Marcar todas como leídas
          </Button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <NotificationSkeleton key={i} />
          ))}
        </div>
      ) : notificaciones.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <div className="bg-muted flex h-16 w-16 items-center justify-center rounded-full">
            <Bell className="text-muted-foreground h-8 w-8" />
          </div>
          <h2 className="text-lg font-semibold">Sin notificaciones</h2>
          <p className="text-muted-foreground max-w-sm text-sm">
            No tienes notificaciones por el momento. Aparecerán aquí cuando haya
            actividad en tus solicitudes.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* No leídas */}
          {unreadNotifications.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-muted-foreground flex items-center gap-2 text-sm font-medium tracking-wide uppercase">
                <span className="bg-primary inline-block h-2 w-2 rounded-full" />
                No leídas ({unreadNotifications.length})
              </h2>
              <div className="space-y-2">
                {unreadNotifications.map((n) => (
                  <NotificationCard
                    key={n.id}
                    notification={n}
                    onRead={markAsRead}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Leídas */}
          {readNotifications.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-muted-foreground flex items-center gap-2 text-sm font-medium tracking-wide uppercase">
                Leídas ({readNotifications.length})
              </h2>
              <div className="space-y-2">
                {readNotifications.map((n) => (
                  <NotificationCard
                    key={n.id}
                    notification={n}
                    onRead={markAsRead}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

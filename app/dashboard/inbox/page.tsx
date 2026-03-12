'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useNotificacionesStore } from '@/store/useNotificacionesStore';
import { NotificacionBackend } from '@/types/notificacion-backend';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function InboxPage() {
  const { user } = useAuthStore();
  const { notificaciones, markAllAsRead, fetchNotificaciones } =
    useNotificacionesStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNotifications = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        // Convertir id a number si es string
        const usuarioId =
          typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
        await fetchNotificaciones(usuarioId);
      } catch (error) {
        toast.error('No se pudieron cargar las notificaciones.');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, [user?.id, fetchNotificaciones]);

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;

    const usuarioId =
      typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
    await markAllAsRead(usuarioId);
  };

  const unreadNotifications = notificaciones.filter((n) => !n.leida);
  const readNotifications = notificaciones.filter((n) => n.leida);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notificaciones</h1>
          <p className="text-muted-foreground">
            Gestiona todas tus notificaciones en un solo lugar.
          </p>
        </div>
        {unreadNotifications.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            className="gap-2"
          >
            Marcar todas como leídas
          </Button>
        )}
      </div>

      {/* Loading skeleton */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : notificaciones.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="text-muted-foreground mb-2 size-12 opacity-50" />
            <p className="text-muted-foreground text-center text-sm">
              No tienes notificaciones. ¡Qué tranquilo!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Unread notifications section */}
          {unreadNotifications.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">Nuevas</h2>
                <Badge variant="destructive">
                  {unreadNotifications.length}
                </Badge>
              </div>
              <div className="grid gap-3">
                {unreadNotifications.map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    isUnread
                  />
                ))}
              </div>
            </div>
          )}

          {/* Divider */}
          {readNotifications.length > 0 && unreadNotifications.length > 0 && (
            <div className="border-t" />
          )}

          {/* Read notifications section */}
          {readNotifications.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-muted-foreground text-lg font-semibold">
                Leídas
              </h2>
              <div className="grid gap-3">
                {readNotifications.map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    isUnread={false}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Componente de tarjeta individual para cada notificación
 */
interface NotificationCardProps {
  notification: NotificacionBackend;
  isUnread: boolean;
}

function NotificationCard({ notification, isUnread }: NotificationCardProps) {
  return (
    <Link href={notification.urlDestino || '#'}>
      <Card
        className={cn(
          'hover:bg-muted/50 cursor-pointer transition-colors',
          isUnread ? 'border-primary bg-primary/5' : 'bg-muted/25'
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">
                  {notification.titulo}
                </CardTitle>
                {isUnread && <Badge variant="destructive">Nuevo</Badge>}
              </div>
              <p className="text-muted-foreground text-sm">
                {notification.mensaje}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant="outline" className="whitespace-nowrap">
                {getTipoLabel(notification.tipo)}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <p className="text-muted-foreground text-xs">
            {new Date(notification.createdAt).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

/**
 * Obtiene una etiqueta legible para el tipo de notificación
 */
function getTipoLabel(tipo: string): string {
  const labels: Record<string, string> = {
    SOLICITUD_ASIGNADA: 'Solicitud Asignada',
    SOLICITUD_DERIVADA: 'Solicitud Derivada',
    SOLICITUD_APROBADA: 'Solicitud Aprobada',
    SOLICITUD_OBSERVADA: 'Solicitud Observada',
    RENDICION_PENDIENTE: 'Rendición Pendiente',
  };
  return labels[tipo] || tipo;
}

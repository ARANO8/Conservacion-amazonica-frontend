'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  LogOut,
  ArrowRight,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuthStore } from '@/store/auth-store';
import { useNotificacionesStore } from '@/store/useNotificacionesStore';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

function getAvatarUrl(name: string): string {
  const params = new URLSearchParams({
    name,
    background: 'random',
  });

  return `https://ui-avatars.com/api/?${params.toString()}`;
}

export function NavUser() {
  const { isMobile } = useSidebar();
  const { user, logout } = useAuthStore();
  const { notificaciones, noLeidas, markAsRead } = useNotificacionesStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const sanitizeUrl = (url: string | null | undefined): string => {
    if (!url) return '/app/aprobaciones';
    return url
      .replace(/^\/dashboard\/inbox\//, '/app/aprobaciones/')
      .replace(/^\/dashboard\//, '/app/');
  };

  /**
   * Resuelve la URL de destino para una notificación.
   * Para RENDICION_PENDIENTE usa urlDestino si apunta a rendiciones.
   * Para RENDICION_OBSERVADA redirige a /editar (página de corrección).
   */
  const resolveNotificationUrl = (
    notification: (typeof notificaciones)[0]
  ): string => {
    // Para RENDICION_OBSERVADA, siempre ir a la página de edición
    if (notification.tipo === 'RENDICION_OBSERVADA') {
      // Si ya tiene urlDestino que apunta a /editar, usarlo
      if (
        notification.urlDestino &&
        notification.urlDestino.includes('/editar')
      ) {
        return notification.urlDestino;
      }
      // Resolver por rendicion.id y construir URL de edición
      const rendicionId = notification.solicitud?.rendicion?.id;
      if (rendicionId) {
        return `/app/rendiciones/${rendicionId}/editar`;
      }
      // Fallback si no hay rendicion.id
      return '/app/rendiciones';
    }

    // Para RENDICION_PENDIENTE, usar urlDestino si apunta a rendiciones
    if (notification.tipo === 'RENDICION_PENDIENTE') {
      if (
        notification.urlDestino &&
        notification.urlDestino.startsWith('/app/rendiciones/')
      ) {
        return notification.urlDestino;
      }
      const rendicionId = notification.solicitud?.rendicion?.id;
      if (rendicionId) {
        return `/app/rendiciones/${rendicionId}`;
      }
      return '/app/aprobaciones';
    }

    // Para otros tipos, usar urlDestino o construir URL de aprobaciones
    const rawUrl =
      notification.urlDestino ??
      (notification.solicitudId
        ? `/app/aprobaciones/${notification.solicitudId}`
        : null);
    return sanitizeUrl(rawUrl);
  };

  const handleNotificationClick = async (
    notification: (typeof notificaciones)[0]
  ) => {
    // Marcar como leída de forma asíncrona
    if (!notification.leida) {
      await markAsRead(notification.id);
    }
    // Navegar a la URL resuelta
    router.push(resolveNotificationUrl(notification));
  };

  // Últimas 3 notificaciones no leídas
  const recentNotifications = notificaciones
    .filter((n) => !n.leida)
    .slice(0, 3);

  if (!user) return null; // O mostrar un placeholder/skeleton

  const avatarUrl = getAvatarUrl(user.nombreCompleto);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={avatarUrl} alt={user.nombreCompleto} />
                <AvatarFallback className="rounded-lg">
                  {user.nombreCompleto.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {user.nombreCompleto}
                </span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={avatarUrl} alt={user.nombreCompleto} />
                  <AvatarFallback className="rounded-lg">
                    {user.nombreCompleto.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {user.nombreCompleto}
                  </span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-muted-foreground px-2 py-1.5 text-xs font-semibold">
                Notificaciones Recientes
                {noLeidas > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {noLeidas}
                  </Badge>
                )}
              </DropdownMenuLabel>
              {recentNotifications.length > 0 ? (
                <ScrollArea className="h-auto max-h-64">
                  {recentNotifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className="cursor-pointer flex-col items-start gap-1 px-2 py-2"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex w-full items-start gap-2">
                        <Bell className="text-muted-foreground mt-0.5 size-3 shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs leading-tight font-medium">
                            {notification.titulo}
                          </p>
                          <p className="text-muted-foreground line-clamp-2 text-xs">
                            {notification.mensaje}
                          </p>
                        </div>
                        <ArrowRight className="text-muted-foreground size-3 shrink-0" />
                      </div>
                    </DropdownMenuItem>
                  ))}
                </ScrollArea>
              ) : (
                <DropdownMenuItem
                  disabled
                  className="text-muted-foreground text-xs"
                >
                  Sin notificaciones nuevas
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/app/aprobaciones" className="cursor-pointer">
                  Ver todas las notificaciones
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <BadgeCheck />
                Cuenta: {user.rol}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut />
              Cerrar Sesion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

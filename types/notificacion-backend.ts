/**
 * Tipos para notificaciones del backend
 * Corresponden al modelo Notificacion en Prisma del backend
 */

export type TipoNotificacion =
  | 'SOLICITUD_ASIGNADA'
  | 'SOLICITUD_DERIVADA'
  | 'SOLICITUD_APROBADA'
  | 'SOLICITUD_OBSERVADA'
  | 'RENDICION_PENDIENTE'
  | 'RENDICION_OBSERVADA';

export interface NotificacionBackend {
  id: number;
  titulo: string;
  mensaje: string;
  tipo: TipoNotificacion;
  leida: boolean;
  urlDestino?: string | null;
  createdAt: string;
  updatedAt: string;
  usuarioId: number;
  solicitudId?: number | null;
  // Relación opcional
  solicitud?: {
    id: number;
    codigoSolicitud: string;
    descripcion?: string | null;
    estado?: string;
    // Rendición asociada (para resolver URLs de notificaciones RENDICION_PENDIENTE)
    rendicion?: {
      id: number;
    } | null;
  } | null;
}

export interface NotificacionesState {
  notificaciones: NotificacionBackend[];
  noLeidas: number;
  isLoading: boolean;
  error: string | null;

  // Acciones (ahora sin usuarioId - se obtiene del JWT en el servidor)
  fetchNotificaciones: () => Promise<void>;
  fetchCountNoLeidas: () => Promise<void>;
  markAsRead: (notificacionId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  startPolling: (interval?: number) => void;
  stopPolling: () => void;
  setError: (error: string | null) => void;
}

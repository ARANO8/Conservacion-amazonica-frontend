/**
 * Tipos para notificaciones del backend
 * Corresponden al modelo Notificacion en Prisma del backend
 */

export type TipoNotificacion =
  | 'SOLICITUD_ASIGNADA'
  | 'SOLICITUD_DERIVADA'
  | 'SOLICITUD_APROBADA'
  | 'SOLICITUD_OBSERVADA'
  | 'RENDICION_PENDIENTE';

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
    descripcion?: string;
    estado?: string;
  } | null;
}

export interface NotificacionesState {
  notificaciones: NotificacionBackend[];
  noLeidas: number;
  isLoading: boolean;
  error: string | null;

  // Acciones
  fetchNotificaciones: (usuarioId: number) => Promise<void>;
  fetchCountNoLeidas: (usuarioId: number) => Promise<void>;
  markAsRead: (usuarioId: number, notificacionId: number) => Promise<void>;
  markAllAsRead: (usuarioId: number) => Promise<void>;
  startPolling: (usuarioId: number, interval?: number) => void;
  stopPolling: () => void;
  setError: (error: string | null) => void;
}

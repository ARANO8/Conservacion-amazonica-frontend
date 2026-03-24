import api from '@/lib/api';

export interface Notificacion {
  id: number;
  titulo: string;
  mensaje: string;
  tipo:
    | 'SOLICITUD_ASIGNADA'
    | 'SOLICITUD_DERIVADA'
    | 'SOLICITUD_APROBADA'
    | 'SOLICITUD_OBSERVADA'
    | 'RENDICION_PENDIENTE'
    | 'RENDICION_OBSERVADA';
  leida: boolean;
  urlDestino?: string;
  createdAt: string;
  updatedAt: string;
  usuarioId: number;
  solicitudId?: number;
  solicitud?: {
    id: number;
    codigoSolicitud: string;
    estado: string;
    rendicion?: {
      id: number;
    } | null;
  };
}

export const notificacionesService = {
  /**
   * Obtiene todas las notificaciones del usuario autenticado
   */
  async getMisNotificaciones(): Promise<Notificacion[]> {
    const { data } = await api.get<Notificacion[]>('/notificaciones');
    return data;
  },

  /**
   * Obtiene solo las notificaciones no leídas
   */
  async getNotificacionesNoLeidas(): Promise<Notificacion[]> {
    const { data } = await api.get<Notificacion[]>('/notificaciones/unread');
    return data;
  },

  /**
   * Obtiene el conteo de notificaciones no leídas
   */
  async getCountNotificacionesNoLeidas(): Promise<number> {
    const { data } = await api.get<{ count: number }>(
      '/notificaciones/unread/count'
    );
    return data.count;
  },

  /**
   * Marca una notificación como leída
   */
  async marcarComoLeida(notificacionId: number): Promise<Notificacion> {
    const { data } = await api.patch<Notificacion>(
      `/notificaciones/${notificacionId}/read`
    );
    return data;
  },

  /**
   * Marca todas las notificaciones como leídas
   */
  async marcarTodasComoLeidas(): Promise<void> {
    await api.patch('/notificaciones/read-all');
  },

  /**
   * Elimina una notificación
   */
  async eliminarNotificacion(notificacionId: number): Promise<void> {
    await api.delete(`/notificaciones/${notificacionId}`);
  },
};

import api from '@/lib/api';
import { NotificacionBackend } from '@/types/notificacion-backend';

/**
 * Service para manejar llamadas API relacionadas con notificaciones.
 * Todas las llamadas pasan por la instancia compartida de Axios en lib/api.ts
 * que inyecta automáticamente el Bearer token.
 */
export const notificacionesService = {
  /**
   * Obtiene todas las notificaciones del usuario.
   * @param usuarioId ID del usuario
   */
  async getNotificaciones(usuarioId: number): Promise<NotificacionBackend[]> {
    const response = await api.get(`/notificaciones/usuario/${usuarioId}`);
    return response.data;
  },

  /**
   * Obtiene solo las notificaciones no leídas del usuario.
   * @param usuarioId ID del usuario
   */
  async getNotificacionesNoLeidas(
    usuarioId: number
  ): Promise<NotificacionBackend[]> {
    const response = await api.get(
      `/notificaciones/usuario/${usuarioId}/no-leidas`
    );
    return response.data;
  },

  /**
   * Marca una notificación como leída.
   * @param usuarioId ID del usuario (para validación)
   * @param notificacionId ID de la notificación
   */
  async marcarComoLeida(
    usuarioId: number,
    notificacionId: number
  ): Promise<NotificacionBackend> {
    const response = await api.patch(
      `/notificaciones/${notificacionId}/marcar-leida`,
      { usuarioId }
    );
    return response.data;
  },

  /**
   * Marca todas las notificaciones del usuario como leídas.
   * @param usuarioId ID del usuario
   */
  async marcarTodasComoLeidas(usuarioId: number): Promise<number> {
    const response = await api.patch(
      `/notificaciones/usuario/${usuarioId}/marcar-todas-leidas`
    );
    return response.data.count;
  },

  /**
   * Obtiene el conteo de notificaciones no leídas.
   * @param usuarioId ID del usuario
   */
  async getCountNoLeidas(usuarioId: number): Promise<number> {
    const response = await api.get(
      `/notificaciones/usuario/${usuarioId}/count-no-leidas`
    );
    return response.data.count;
  },
};

export default notificacionesService;

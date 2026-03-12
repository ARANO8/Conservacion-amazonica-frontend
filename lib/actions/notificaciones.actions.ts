'use server';

import { notificacionesService } from '@/lib/services/notificaciones-service';
import { NotificacionBackend } from '@/types/notificacion-backend';

/**
 * Obtiene todas las notificaciones del usuario.
 * Las ordena por fecha de creación descendente (más recientes primero).
 *
 * @param usuarioId ID del usuario autenticado (enviado desde el cliente)
 */
export async function getMisNotificaciones(
  usuarioId: number
): Promise<NotificacionBackend[]> {
  if (!usuarioId) {
    throw new Error('Usuario no autenticado');
  }

  return notificacionesService.getNotificaciones(usuarioId);
}

/**
 * Obtiene solo las notificaciones no leídas del usuario.
 *
 * @param usuarioId ID del usuario autenticado
 */
export async function getNotificacionesNoLeidas(
  usuarioId: number
): Promise<NotificacionBackend[]> {
  if (!usuarioId) {
    throw new Error('Usuario no autenticado');
  }

  return notificacionesService.getNotificacionesNoLeidas(usuarioId);
}

/**
 * Marca una notificación como leída.
 *
 * @param usuarioId ID del usuario autenticado
 * @param notificacionId ID de la notificación a marcar
 */
export async function marcarComoLeida(
  usuarioId: number,
  notificacionId: number
): Promise<NotificacionBackend> {
  if (!usuarioId) {
    throw new Error('Usuario no autenticado');
  }

  return notificacionesService.marcarComoLeida(usuarioId, notificacionId);
}

/**
 * Marca todas las notificaciones del usuario como leídas.
 *
 * @param usuarioId ID del usuario autenticado
 */
export async function marcarTodasComoLeidas(
  usuarioId: number
): Promise<number> {
  if (!usuarioId) {
    throw new Error('Usuario no autenticado');
  }

  return notificacionesService.marcarTodasComoLeidas(usuarioId);
}

/**
 * Obtiene el conteo de notificaciones no leídas del usuario.
 *
 * @param usuarioId ID del usuario autenticado
 */
export async function getCountNotificacionesNoLeidas(
  usuarioId: number
): Promise<number> {
  if (!usuarioId) {
    return 0;
  }

  return notificacionesService.getCountNoLeidas(usuarioId);
}

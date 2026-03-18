'use server';

import { prisma } from '@/lib/prisma';

/**
 * Obtiene todas las notificaciones del usuario.
 * Las ordena por fecha de creación descendente (más recientes primero).
 *
 * @param usuarioId ID del usuario autenticado
 */
export async function getMisNotificaciones(usuarioId: number) {
  if (!usuarioId) {
    throw new Error('Usuario no autenticado');
  }

  const notificaciones = await prisma.notificacion.findMany({
    where: {
      usuarioId,
    },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      solicitud: {
        select: {
          id: true,
          codigoSolicitud: true,
          descripcion: true,
          estado: true,
        },
      },
    },
  });

  return notificaciones;
}

/**
 * Obtiene solo las notificaciones no leídas del usuario.
 *
 * @param usuarioId ID del usuario autenticado
 */
export async function getNotificacionesNoLeidas(usuarioId: number) {
  if (!usuarioId) {
    throw new Error('Usuario no autenticado');
  }

  const notificaciones = await prisma.notificacion.findMany({
    where: {
      usuarioId,
      leida: false,
    },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      solicitud: {
        select: {
          id: true,
          codigoSolicitud: true,
          descripcion: true,
          estado: true,
        },
      },
    },
  });

  return notificaciones;
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

  const count = await prisma.notificacion.count({
    where: {
      usuarioId,
      leida: false,
    },
  });

  return count;
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
) {
  if (!usuarioId) {
    throw new Error('Usuario no autenticado');
  }

  // Verificar que la notificación pertenezca al usuario actual
  const notificacion = await prisma.notificacion.findUnique({
    where: { id: notificacionId },
  });

  if (!notificacion || notificacion.usuarioId !== usuarioId) {
    throw new Error('No tienes permiso para marcar esta notificación');
  }

  const actualizada = await prisma.notificacion.update({
    where: { id: notificacionId },
    data: { leida: true },
    include: {
      solicitud: {
        select: {
          id: true,
          codigoSolicitud: true,
          descripcion: true,
        },
      },
    },
  });

  return actualizada;
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

  const resultado = await prisma.notificacion.updateMany({
    where: {
      usuarioId,
      leida: false,
    },
    data: {
      leida: true,
    },
  });

  return resultado.count;
}

/**
 * Crea una notificación en la base de datos.
 * Función para ser llamada desde otras server actions o después de eventos (aprobar solicitud, etc).
 *
 * @param data Datos de la notificación a crear
 */
export async function crearNotificacion(data: {
  usuarioId: number;
  titulo: string;
  mensaje: string;
  tipo:
    | 'SOLICITUD_ASIGNADA'
    | 'SOLICITUD_DERIVADA'
    | 'SOLICITUD_APROBADA'
    | 'SOLICITUD_OBSERVADA'
    | 'RENDICION_PENDIENTE';
  urlDestino?: string;
  solicitudId?: number;
}) {
  const notificacion = await prisma.notificacion.create({
    data: {
      usuarioId: data.usuarioId,
      titulo: data.titulo,
      mensaje: data.mensaje,
      tipo: data.tipo,
      urlDestino: data.urlDestino || null,
      solicitudId: data.solicitudId || null,
      leida: false,
    },
    include: {
      solicitud: {
        select: {
          id: true,
          codigoSolicitud: true,
        },
      },
    },
  });

  return notificacion;
}

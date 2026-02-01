import api from '@/lib/api';
import { Solicitud, CreateSolicitudDto } from '@/types/backend';

/**
 * Servicio para gestionar las solicitudes del sistema.
 */
export const solicitudesService = {
  /**
   * Listar solicitudes con soporte opcional para paginación.
   */
  getSolicitudes: async (page = 1, limit = 10): Promise<Solicitud[]> => {
    const { data } = await api.get<Solicitud[]>('/solicitudes', {
      params: { page, limit },
    });
    return data;
  },

  /**
   * Obtener el detalle completo de una solicitud por su ID.
   */
  getSolicitudById: async (id: number): Promise<Solicitud> => {
    const { data } = await api.get<Solicitud>(`/solicitudes/${id}`);
    return data;
  },

  /**
   * Crear una nueva solicitud.
   */
  createSolicitud: async (payload: CreateSolicitudDto): Promise<Solicitud> => {
    const response = await api.post<Solicitud>('/solicitudes', payload);
    return response.data;
  },

  /**
   * Generar y descargar el reporte PDF de una solicitud.
   * IMPORTANTE: Se configura responseType como 'blob' para evitar corrupción del archivo.
   */
  getReportePdf: async (id: number): Promise<Blob> => {
    const { data } = await api.get(`/solicitudes/${id}/pdf`, {
      responseType: 'blob',
    });
    return data;
  },
};

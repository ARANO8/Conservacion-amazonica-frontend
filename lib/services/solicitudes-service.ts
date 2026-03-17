import api from '@/lib/api';
import { CreateSolicitudPayload } from '@/types/solicitud-backend';

/**
 * Service to handle Solicitudes related API calls.
 * El token Bearer es inyectado automáticamente por el interceptor de `api` (lib/api.ts).
 */
export const solicitudesService = {
  /**
   * Sends a new Solicitud to the backend.
   * @param payload The adapted form data for the backend.
   */
  async createSolicitud(payload: CreateSolicitudPayload) {
    const response = await api.post('/solicitudes', payload);
    return response.data;
  },

  /**
   * Fetches the list of solicitudes (for the requests table).
   * @param params Optional query parameters for filtering.
   */
  async getSolicitudes(params?: { solicitanteId?: string | number }) {
    const response = await api.get('/solicitudes', { params });
    return response.data;
  },

  /**
   * Fetches a single solicitud by ID.
   * @param id The ID of the solicitud to fetch.
   */
  async getSolicitudById(id: string | number) {
    const response = await api.get(`/solicitudes/${id}`);
    return response.data;
  },

  /**
   * Updates an existing Solicitud.
   * @param id The ID of the solicitud to update.
   * @param payload The adapted form data for the backend.
   */
  async updateSolicitud(
    id: number | string,
    payload: Partial<CreateSolicitudPayload>
  ) {
    const response = await api.patch(`/solicitudes/${id}`, payload);
    return response.data;
  },

  /**
   * Desembolsa una solicitud (solo TESORERO).
   * @param id The ID of the solicitud to disburse.
   * @param codigoDesembolso Código de transferencia / comprobante.
   */
  async desembolsar(
    id: number | string,
    codigoDesembolso: string,
    urlComprobante?: string
  ) {
    const response = await api.patch(`/solicitudes/${id}/desembolsar`, {
      codigoDesembolso,
      ...(urlComprobante ? { urlComprobante } : {}),
    });
    return response.data;
  },

  /**
   * Downloads a PDF for a specific solicitud.
   * @param id The ID of the solicitud.
   */
  async downloadPdf(id: string | number) {
    const response = await api.get(`/solicitudes/${id}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Marca una solicitud como EJECUTADA después de una rendición exitosa.
   * @param id The ID of the solicitud to mark as executed.
   */
  async marcarEjecutada(id: string | number) {
    const response = await api.patch(`/solicitudes/${id}/ejecutar`, {});
    return response.data;
  },
};

export default solicitudesService;

import api from '@/lib/api';
import {
  CreateSolicitudPayload,
  CreateSolicitudCompraPayload,
} from '@/types/solicitud-backend';
import type { SolicitudResponse } from '@/types/solicitud-backend';

interface GetSolicitudesParams {
  solicitanteId?: string | number;
  partidaId?: number;
}

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
  async getSolicitudes(params?: GetSolicitudesParams) {
    const response = await api.get<SolicitudResponse[]>('/solicitudes', {
      params,
    });
    return response.data;
  },

  /**
   * Fetches a single solicitud by ID.
   * @param id The ID of the solicitud to fetch.
   */
  async getSolicitudById(id: string | number) {
    const response = await api.get<SolicitudResponse>(`/solicitudes/${id}`);
    return response.data;
  },

  /**
   * Updates an existing Solicitud.
   * @param id The ID of the solicitud to update.
   * @param payload The adapted form data for the backend.
   */
  async updateSolicitud(
    id: number | string,
    payload:
      | Partial<CreateSolicitudPayload>
      | Partial<CreateSolicitudCompraPayload>
  ) {
    const response = await api.patch(`/solicitudes/${id}`, payload);
    return response.data;
  },

  /**
   * Creates a new Solicitud de Compras/Servicios (COMPRA_SERVICIO).
   */
  async createSolicitudCompra(payload: CreateSolicitudCompraPayload) {
    const response = await api.post<SolicitudResponse>('/solicitudes', payload);
    return response.data;
  },

  /**
   * Fetches solicitudes filtered by tipo=COMPRA_SERVICIO (client-side filter).
   */
  async getSolicitudesCompra() {
    const response = await api.get<SolicitudResponse[]>('/solicitudes');
    return response.data.filter((s) => s.tipo === 'COMPRA_SERVICIO');
  },

  /**
   * Desembolsa una solicitud (solo TESORERO).
   * @param id The ID of the solicitud to disburse.
   * @param codigoDesembolso Código de transferencia / comprobante.
   */
  async desembolsar(
    id: number | string,
    codigoDesembolso: string,
    urlComprobante?: string,
    banco?: string,
    fechaDesembolso?: string
  ) {
    const response = await api.patch(`/solicitudes/${id}/desembolsar`, {
      codigoDesembolso,
      ...(urlComprobante ? { urlComprobante } : {}),
      ...(banco ? { banco } : {}),
      ...(fechaDesembolso ? { fechaDesembolso } : {}),
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

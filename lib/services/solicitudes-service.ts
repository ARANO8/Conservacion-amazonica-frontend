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
  async createSolicitud(payload: CreateSolicitudPayload, signal?: AbortSignal) {
    const response = await api.post('/solicitudes', payload, { signal });
    return response.data;
  },

  /**
   * Fetches the list of solicitudes (for the requests table).
   * @param params Optional query parameters for filtering.
   */
  async getSolicitudes(params?: GetSolicitudesParams, signal?: AbortSignal) {
    const response = await api.get<SolicitudResponse[]>('/solicitudes', {
      params,
      signal,
    });
    return response.data;
  },

  /**
   * Fetches a single solicitud by ID.
   * @param id The ID of the solicitud to fetch.
   */
  async getSolicitudById(id: string | number, signal?: AbortSignal) {
    const response = await api.get<SolicitudResponse>(`/solicitudes/${id}`, {
      signal,
    });
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
      | Partial<CreateSolicitudCompraPayload>,
    signal?: AbortSignal
  ) {
    const response = await api.patch(`/solicitudes/${id}`, payload, { signal });
    return response.data;
  },

  /**
   * Creates a new Solicitud de Compras/Servicios (COMPRA_SERVICIO).
   */
  async createSolicitudCompra(
    payload: CreateSolicitudCompraPayload,
    signal?: AbortSignal
  ) {
    const response = await api.post<SolicitudResponse>(
      '/solicitudes',
      payload,
      { signal }
    );
    return response.data;
  },

  /**
   * Fetches solicitudes filtered by tipo=COMPRA_SERVICIO (client-side filter).
   */
  async getSolicitudesCompra(signal?: AbortSignal) {
    const response = await api.get<SolicitudResponse[]>('/solicitudes', {
      signal,
    });
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
    fechaDesembolso?: string,
    signal?: AbortSignal
  ) {
    const response = await api.patch(
      `/solicitudes/${id}/desembolsar`,
      {
        codigoDesembolso,
        ...(urlComprobante ? { urlComprobante } : {}),
        ...(banco ? { banco } : {}),
        ...(fechaDesembolso ? { fechaDesembolso } : {}),
      },
      { signal }
    );
    return response.data;
  },

  /**
   * Downloads a PDF for a specific solicitud.
   * @param id The ID of the solicitud.
   */
  async downloadPdf(id: string | number, signal?: AbortSignal) {
    const response = await api.get(`/solicitudes/${id}/pdf`, {
      responseType: 'blob',
      signal,
    });
    return response.data;
  },

  // --- Pagos parciales de contratos de consultoría ---

  /** Adquisiciones solicita el pago de una cuota. PLANIFICADO → SOLICITADO */
  async solicitarPago(
    solicitudId: number | string,
    pagoId: number,
    data: { aprobadorId: number; urlComprobante: string; urlInforme?: string },
    signal?: AbortSignal
  ) {
    const response = await api.patch(
      `/solicitudes/${solicitudId}/pagos/${pagoId}/solicitar`,
      data,
      { signal }
    );
    return response.data;
  },

  /** El aprobador asignado aprueba la cuota. SOLICITADO → APROBADO */
  async aprobarPago(
    solicitudId: number | string,
    pagoId: number,
    signal?: AbortSignal
  ) {
    const response = await api.patch(
      `/solicitudes/${solicitudId}/pagos/${pagoId}/aprobar`,
      {},
      { signal }
    );
    return response.data;
  },

  /** Tesorería registra el pago. APROBADO → PAGADO (la última cierra el contrato) */
  async pagarPago(
    solicitudId: number | string,
    pagoId: number,
    signal?: AbortSignal
  ) {
    const response = await api.patch(
      `/solicitudes/${solicitudId}/pagos/${pagoId}/pagar`,
      {},
      { signal }
    );
    return response.data;
  },
};

export default solicitudesService;

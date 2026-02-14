import api from '@/lib/api';
import { CreateSolicitudPayload } from '@/types/solicitud-backend';
import Cookies from 'js-cookie';

/**
 * Service to handle Solicitudes related API calls.
 */
export const solicitudesService = {
  /**
   * Sends a new Solicitud to the backend.
   * @param payload The adapted form data for the backend.
   */
  async createSolicitud(payload: CreateSolicitudPayload) {
    // Explicitly read the token from cookies as requested by the user
    // to guarantee it travels in this critical POST.
    const token = Cookies.get('token');

    const response = await api.post('/solicitudes', payload, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

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
    const token = Cookies.get('token');
    const response = await api.patch(`/solicitudes/${id}`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  /**
   * Desembolsa una solicitud (solo TESORERO).
   * @param id The ID of the solicitud to disburse.
   * @param codigoDesembolso Código de transferencia / comprobante.
   */
  async desembolsar(id: number | string, codigoDesembolso: string) {
    const token = Cookies.get('token');
    const response = await api.patch(
      `/solicitudes/${id}/desembolsar`,
      { codigoDesembolso },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },

  /**
   * Downloads a PDF for a specific solicitud.
   * @param id The ID of the solicitud.
   */
  async downloadPdf(id: number | string) {
    const response = await api.get(`/solicitudes/${id}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

export default solicitudesService;

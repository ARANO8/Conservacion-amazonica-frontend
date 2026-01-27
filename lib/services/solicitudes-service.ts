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
   */
  async getSolicitudes() {
    const response = await api.get('/solicitudes');
    return response.data;
  },
};

export default solicitudesService;

import api from '@/lib/api';
import { CreateRendicionInput } from '@/types/rendicion-schema';
import Cookies from 'js-cookie';

/**
 * Service to handle Rendiciones (accountability reports) API calls.
 */
export const rendicionesService = {
  /**
   * Creates a new rendición (accountability report) for a solicitud.
   * @param payload The form data with all rendición information.
   */
  async createRendicion(payload: CreateRendicionInput) {
    const token = Cookies.get('token');

    const response = await api.post('/rendiciones', payload, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  },

  /**
   * Fetches a single rendición by ID.
   * @param id The ID of the rendición.
   */
  async getRendicionById(id: string | number) {
    const response = await api.get(`/rendiciones/${id}`);
    return response.data;
  },

  /**
   * Fetches rendiciones by solicitud ID.
   * @param solicitudId The ID of the solicitud.
   */
  async getRendicionesBySolicitud(solicitudId: string | number) {
    const response = await api.get(`/rendiciones`, {
      params: { solicitudId },
    });
    return response.data;
  },
};

export default rendicionesService;

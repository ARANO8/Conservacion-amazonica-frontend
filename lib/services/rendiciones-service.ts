import api from '@/lib/api';
import { CreateRendicionInput } from '@/types/rendicion-schema';
import { adaptCreateRendicionPayload } from '@/lib/adapters/rendicion-adapter';
import axios from 'axios';

/**
 * Service to handle Rendiciones (accountability reports) API calls.
 * El token Bearer es inyectado automáticamente por el interceptor de `api` (lib/api.ts).
 */
export const rendicionesService = {
  /**
   * Creates a new rendición (accountability report) for a solicitud.
   * @param payload The form data with all rendición information.
   */
  async createRendicion(payload: CreateRendicionInput) {
    // Adaptar el payload al formato exacto que espera el backend
    const adaptedPayload = adaptCreateRendicionPayload(payload);

    try {
      const response = await api.post('/rendiciones', adaptedPayload);
      return response.data;
    } catch (error) {
      // Si el error es 404 en /rendiciones, intentar con ruta alternativa
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        const response = await api.post(
          `/solicitudes/${payload.solicitudId}/rendiciones`,
          adaptedPayload
        );
        return response.data;
      }

      throw error;
    }
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

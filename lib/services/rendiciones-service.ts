import api from '@/lib/api';
import { CreateRendicionInput } from '@/types/rendicion-schema';
import Cookies from 'js-cookie';
import axios from 'axios';

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

    try {
      const response = await api.post('/rendiciones', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      // Si el error es 404 en /rendiciones, intentar con ruta alternativa
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.warn(
          'Endpoint /rendiciones no encontrado (404). Intentando ruta alternativa...'
        );

        try {
          // Intentar con ruta alternativa: POST a /solicitudes/:id/rendiciones
          const response = await api.post(
            `/solicitudes/${payload.solicitudId}/rendiciones`,
            payload,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          return response.data;
        } catch (altError) {
          console.error('Error en ruta alternativa también:', altError);
          throw altError;
        }
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

import api from '@/lib/api';
import type {
  CotizacionResponse,
  CreateCotizacionPayload,
} from '@/types/cotizacion-backend';

/**
 * Service para el flujo de Compras y Servicios — Cotizaciones.
 * El token Bearer es inyectado automáticamente por el interceptor de `api`.
 */
export const cotizacionesService = {
  async createCotizacion(payload: CreateCotizacionPayload) {
    const response = await api.post<CotizacionResponse>(
      '/cotizaciones',
      payload
    );
    return response.data;
  },

  async getCotizaciones() {
    const response = await api.get<CotizacionResponse[]>('/cotizaciones');
    return response.data;
  },

  async getCotizacionById(id: string | number) {
    const response = await api.get<CotizacionResponse>(`/cotizaciones/${id}`);
    return response.data;
  },

  async updateCotizacion(
    id: string | number,
    payload: Partial<CreateCotizacionPayload>
  ) {
    const response = await api.patch<CotizacionResponse>(
      `/cotizaciones/${id}`,
      payload
    );
    return response.data;
  },

  async deleteCotizacion(id: string | number) {
    const response = await api.delete(`/cotizaciones/${id}`);
    return response.data;
  },

  async downloadPdf(id: string | number) {
    const response = await api.get(`/cotizaciones/${id}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

export default cotizacionesService;
